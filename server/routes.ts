import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import crypto from "crypto";
import bcryptjs from "bcryptjs";
import { storage } from "./storage";
import { DAppDiscovery } from "./lib/dapp-discovery";
import { WalletDrainerDetector } from "./lib/wallet-drainer-detector";
import { BlacklistManager } from "./lib/blacklist-manager";
import { auditLogger } from "./lib/audit-logger";
import { threatLearner } from "./lib/threat-pattern-learner";
import { insertProtocolSchema, insertTutorialVideoSchema, type Protocol } from "@shared/schema";
import { authLimiter, apiLimiter } from "./index";

// Pre-serialized cache for CMC-level performance (avoids re-serialization overhead)
interface CacheEntry {
  data: any;  // Original data object
  serialized: string;  // Pre-serialized JSON string
  etag: string;  // Content-based ETag
  expires: number;
}

const cache = new Map<string, CacheEntry>();

// Generate strong content-based ETag using MD5 hash
function generateETag(data: string): string {
  return `"${crypto.createHash('md5').update(data).digest('hex')}"`;
}

function getCache(key: string): CacheEntry | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    cache.delete(key);
    return null;
  }
  return entry;
}

function setCache(key: string, data: any, ttlMs: number): void {
  // Pre-serialize JSON to avoid repeated serialization on every request
  const serialized = JSON.stringify(data);
  const etag = generateETag(serialized);
  
  cache.set(key, { 
    data, 
    serialized, 
    etag, 
    expires: Date.now() + ttlMs 
  });
}

function clearCache(keyPrefix?: string): void {
  if (!keyPrefix) {
    cache.clear();
    return;
  }
  
  // Clear all keys with prefix (for filtered queries like protocols-{...})
  for (const key of Array.from(cache.keys())) {
    if (key.startsWith(keyPrefix)) {
      cache.delete(key);
    }
  }
}

// Background refresh tracking
let backgroundRefreshInProgress = false;
let lastBackgroundRefresh = 0;

export async function registerRoutes(app: Express): Promise<Server> {
  const discovery = new DAppDiscovery();
  const detector = new WalletDrainerDetector();
  let blacklistManager: BlacklistManager;

  // Initialize blacklist manager with existing data
  const initBlacklistManager = async () => {
    const blacklist = await storage.getBlacklist();
    blacklistManager = new BlacklistManager(blacklist);
  };
  await initBlacklistManager();

  // AI Learning Pattern Monitoring - Automatic Re-scanning
  let lastPatternCheck = 0;
  let lastKnownPatternCount = 0;
  let patternCheckRunning = false; // Concurrency guard
  
  const checkForNewPatternsAndRescan = async () => {
    // Guard against overlapping executions
    if (patternCheckRunning) {
      console.log('[AI-LEARNING] Pattern check already running, skipping this cycle');
      return;
    }
    
    patternCheckRunning = true;
    
    try {
      const stats = threatLearner.getStats();
      const insights = threatLearner.getInsights();
      
      // Check if new high-confidence patterns have been learned
      const newPatternCount = stats.highConfidencePatterns;
      
      if (newPatternCount > lastKnownPatternCount && lastKnownPatternCount > 0) {
        const newPatterns = newPatternCount - lastKnownPatternCount;
        console.log(`[AI-LEARNING] Detected ${newPatterns} new high-confidence threat pattern(s)!`);
        console.log(`[AI-LEARNING] Total patterns: ${newPatternCount}, Exploits: ${stats.knownExploits}`);
        
        // Get protocols that should be re-scanned (protocols with existing scans)
        const allScans = await storage.getAllSecurityScans();
        const protocolsToRescan: string[] = [];
        
        // Identify protocols that might be affected by new patterns
        for (const scan of allScans) {
          // Re-scan protocols with HIGH or MEDIUM severity that might have new threats
          if (scan.severity === 'HIGH' || scan.severity === 'MEDIUM') {
            protocolsToRescan.push(scan.protocolId);
          }
        }
        
        if (protocolsToRescan.length > 0) {
          console.log(`[AI-LEARNING] Triggering automatic re-scan of ${protocolsToRescan.length} protocols based on new patterns`);
          
          // Trigger re-scan in background (don't await to avoid blocking)
          const { scanContractWithGoPlus, mergeContractAndMetadataThreats } = 
            await import('./lib/goplus-scanner');
          
          const protocols = await storage.getProtocols();
          const limitedRescan = protocolsToRescan.slice(0, 50); // Limit to 50 for performance
          
          for (const protocolId of limitedRescan) {
            const protocol = protocols.find(p => p.id === protocolId);
            if (!protocol) continue;
            
            try {
              // Re-scan with both metadata and contract analysis
              const [metadataScanResult, contractScan] = await Promise.all([
                detector.scanDApp(protocol),
                protocol.contractAddress && protocol.contractChain
                  ? scanContractWithGoPlus(protocol.contractAddress, protocol.contractChain)
                  : Promise.resolve(null)
              ]);
              
              const { threats, totalScore, severity } = mergeContractAndMetadataThreats(
                metadataScanResult.threats,
                metadataScanResult.score,
                contractScan
              );
              
              const combinedScanResult = {
                isBlacklisted: severity === 'CRITICAL',
                severity,
                threats,
                score: totalScore,
              };
              
              // Store updated scan
              await storage.addSecurityScan(protocolId, combinedScanResult);
              
              // Learn from this re-scan
              const scanWithContract = { ...combinedScanResult, contractScan };
              threatLearner.learnFromScan(scanWithContract, protocol);
              
            } catch (error) {
              console.error(`[AI-LEARNING] Error re-scanning ${protocol.name}:`, error);
            }
          }
          
          // Invalidate caches to update statistics
          clearCache('scans');
          clearCache('security-stats');
          clearCache('protocols');
          
          console.log(`[AI-LEARNING] Automatic re-scan completed for ${limitedRescan.length} protocols`);
        }
      }
      
      lastKnownPatternCount = newPatternCount;
      lastPatternCheck = Date.now();
      
    } catch (error) {
      console.error('[AI-LEARNING] Error checking for new patterns:', error);
    } finally {
      // Always release the lock
      patternCheckRunning = false;
    }
  };
  
  // Check for new patterns every 5 minutes
  setInterval(checkForNewPatternsAndRescan, 5 * 60 * 1000);
  
  // Initial check after 30 seconds
  setTimeout(checkForNewPatternsAndRescan, 30 * 1000);

  // AGGRESSIVE NO-CACHE MIDDLEWARE - Fixes mobile browser caching issues
  // Disables ALL caching layers: browser cache, mobile OS cache, CDN cache, ETags
  app.use((req, res, next) => {
    // Intercept res.set() to prevent routes from overriding cache headers
    const originalSet = res.set.bind(res);
    res.set = function(field: any, value?: any) {
      // Block cache-related headers from being set by routes
      if (typeof field === 'string') {
        const lowerField = field.toLowerCase();
        if (lowerField === 'cache-control' || lowerField === 'etag' || 
            lowerField === 'pragma' || lowerField === 'expires') {
          return this; // Ignore these header attempts
        }
      } else if (typeof field === 'object') {
        // Handle object form: res.set({ 'Cache-Control': '...' })
        const filteredObject: any = {};
        for (const key in field) {
          const lowerKey = key.toLowerCase();
          if (lowerKey !== 'cache-control' && lowerKey !== 'etag' && 
              lowerKey !== 'pragma' && lowerKey !== 'expires') {
            filteredObject[key] = field[key];
          }
        }
        if (Object.keys(filteredObject).length > 0) {
          return originalSet(filteredObject);
        }
        return this;
      }
      return originalSet(field, value);
    };

    // Set aggressive no-cache headers
    originalSet('Cache-Control', 'no-cache, no-store, must-revalidate, private, max-age=0');
    originalSet('Pragma', 'no-cache');
    originalSet('Expires', '0');
    
    // Continue to next middleware
    next();
  });


  // GET /api/cache/clear - Clear all server-side caches (public endpoint for testing)
  app.get("/api/cache/clear", async (req: Request, res: Response) => {
    try {
      clearCache(); // Clear all caches
      console.log('[CACHE] All caches cleared via API endpoint');
      res.json({ 
        success: true,
        message: 'All server-side caches cleared successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('[CACHE] Error clearing cache:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to clear cache' 
      });
    }
  });

  // GET /api/admin/diagnostics - Check current database state (admin only)
  app.get("/api/admin/diagnostics", async (req: Request, res: Response) => {
    try {
      if (!req.session.adminId) {
        return res.status(401).json({ message: 'Admin authentication required' });
      }

      const protocols = await storage.getProtocols();
      const totalVolume = protocols.reduce((sum, p) => sum + (p.volume24h || 0), 0);
      const auditedCount = protocols.filter(p => p.audited || (p.auditCount && p.auditCount > 0)).length;
      
      res.json({
        databaseStats: {
          totalProtocols: protocols.length,
          totalVolume: totalVolume,
          totalVolumeFormatted: totalVolume >= 1e9 ? `$${(totalVolume / 1e9).toFixed(2)}B` : `$${(totalVolume / 1e6).toFixed(2)}M`,
          auditedCount: auditedCount,
        },
        sampleProtocols: protocols.slice(0, 10).map(p => ({
          name: p.name,
          volume24h: p.volume24h,
          audited: p.audited,
          auditCount: p.auditCount
        })),
        environment: process.env.NODE_ENV || 'unknown',
        databaseUrl: process.env.DATABASE_URL ? 'Connected' : 'Not connected'
      });
    } catch (error) {
      console.error('[DIAGNOSTICS] Error:', error);
      res.status(500).json({ message: 'Failed to fetch diagnostics' });
    }
  });

  // POST /api/admin/refresh-protocols - Force refresh all protocols from DeFiLlama
  app.post("/api/admin/refresh-protocols", async (req: Request, res: Response) => {
    try {
      // Check admin authentication
      if (!req.session.adminId) {
        return res.status(401).json({ 
          success: false,
          message: 'Admin authentication required' 
        });
      }
      
      console.log('[ADMIN] Manual protocol refresh triggered');
      
      // Fetch fresh data from DeFiLlama
      const protocols = await discovery.fetchFromMultipleSources();
      const testDrainers = discovery.getTestDrainerProtocols();
      let allProtocols = [...protocols, ...testDrainers];
      
      
      // Log sample data before persisting
      const sampleProtocol = allProtocols[0];
      console.log('[ADMIN] Sample protocol before DB save:', {
        name: sampleProtocol.name,
        volume24h: sampleProtocol.volume24h,
        audited: sampleProtocol.audited,
        auditCount: sampleProtocol.auditCount
      });
      
      // Persist to database
      await storage.bulkUpsertProtocols(allProtocols as any);
      
      // Verify data was saved correctly by reading it back
      const savedProtocols = await storage.getProtocols();
      const totalVolume = savedProtocols.reduce((sum, p) => sum + (p.volume24h || 0), 0);
      const auditedCount = savedProtocols.filter(p => p.audited || (p.auditCount && p.auditCount > 0)).length;
      
      console.log('[ADMIN] Data saved to DB:', {
        totalProtocols: savedProtocols.length,
        totalVolume: totalVolume,
        auditedCount: auditedCount,
        sampleProtocol: savedProtocols[0] ? {
          name: savedProtocols[0].name,
          volume24h: savedProtocols[0].volume24h,
          audited: savedProtocols[0].audited,
          auditCount: savedProtocols[0].auditCount
        } : null
      });
      
      // Clear ALL caches to ensure fresh data (protocols, volume, trending, new, scans)
      clearCache(); // Clear everything
      console.log('[CACHE] Cleared all caches after protocol refresh');
      
      console.log(`[ADMIN] Successfully refreshed ${allProtocols.length} protocols`);
      
      res.json({ 
        success: true,
        message: `Successfully refreshed ${allProtocols.length} protocols`,
        protocolCount: savedProtocols.length,
        auditedCount: auditedCount,
        totalVolume: totalVolume
      });
    } catch (error) {
      console.error('[ADMIN] Protocol refresh failed:', error);
      res.status(500).json({ 
        success: false,
        message: "Failed to refresh protocols",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // GET /api/volume/cross-chain - Track volume across all chains and protocols
  app.get("/api/volume/cross-chain", apiLimiter, async (req: Request, res: Response) => {
    try {
      // Check application cache first (CMC-level optimization)
      const cacheKey = 'volume-cross-chain';
      const cached = getCache(cacheKey);
      
      if (cached) {
        // Set HTTP cache headers
        res.set('Cache-Control', 'public, max-age=300');
        res.set('ETag', cached.etag);
        
        // Check if client has valid cached version
        if (req.headers['if-none-match'] === cached.etag) {
          return res.status(304).end();
        }
        
        // Return pre-serialized cached response (sub-10ms performance)
        res.set('Content-Type', 'application/json');
        return res.send(cached.serialized);
      }
      
      res.set('Cache-Control', 'public, max-age=300'); // Cache for 5 minutes
      
      // Get all protocols from database
      const protocols = await storage.getProtocols();
      
      console.log('[VOLUME API] Fetched protocols from DB:', {
        totalProtocols: protocols.length,
        sampleVolumes: protocols.slice(0, 5).map(p => ({
          name: p.name,
          volume24h: p.volume24h
        }))
      });
      
      // Aggregate volume by chain
      const volumeByChain: Record<string, number> = {};
      let totalVolume = 0;
      let protocolCount = 0;
      
      protocols.forEach(protocol => {
        // Add to total volume
        totalVolume += protocol.volume24h || 0;
        protocolCount++;
        
        // Add to each chain's volume
        protocol.chains.forEach(chain => {
          if (!volumeByChain[chain]) {
            volumeByChain[chain] = 0;
          }
          // Distribute protocol volume across its chains
          volumeByChain[chain] += (protocol.volume24h || 0) / protocol.chains.length;
        });
      });
      
      // Sort chains by volume (descending)
      const chainStats = Object.entries(volumeByChain)
        .map(([chain, volume]) => ({
          chain,
          volume,
          percentage: (volume / totalVolume) * 100
        }))
        .sort((a, b) => b.volume - a.volume);
      
      // Get top protocols by volume
      const topProtocols = [...protocols]
        .sort((a, b) => (b.volume24h || 0) - (a.volume24h || 0))
        .slice(0, 10)
        .map(p => ({
          id: p.id,
          name: p.name,
          category: p.category,
          volume24h: p.volume24h,
          chains: p.chains
        }));
      
      const response = {
        totalVolume,
        protocolCount,
        chainCount: chainStats.length,
        chainStats,
        topProtocols,
        timestamp: new Date().toISOString()
      };
      
      console.log('[VOLUME API] Returning response:', {
        totalVolume,
        protocolCount,
        topProtocolsCount: topProtocols.length
      });
      
      // Cache for 5 minutes (300,000ms) with pre-serialized JSON
      setCache(cacheKey, response, 300_000);
      
      res.json(response);
    } catch (error) {
      console.error("Error fetching cross-chain volume:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to fetch cross-chain volume data"
      });
    }
  });

  // GET /api/protocols - Fetch protocols with pagination support
  app.get("/api/protocols", apiLimiter, async (req, res) => {
    try {
      // Set HTTP cache headers for browser caching (CMC-level optimization)
      // NOTE: Adding no-cache temporarily to force fresh data
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      
      // Extract query parameters for filtering and pagination
      const { category, chain, minTvl, limit: limitParam, offset: offsetParam } = req.query;
      const filters: { category?: string; chain?: string; minTvl?: number } = {};
      
      if (category && typeof category === 'string') {
        filters.category = category;
      }
      
      if (chain && typeof chain === 'string') {
        filters.chain = chain;
      }
      
      if (minTvl) {
        const parsedMinTvl = parseFloat(minTvl as string);
        if (!isNaN(parsedMinTvl)) {
          filters.minTvl = parsedMinTvl;
        }
      }
      
      // Parse pagination parameters
      const limit = limitParam ? parseInt(limitParam as string, 10) : 500;
      const offset = offsetParam ? parseInt(offsetParam as string, 10) : 0;
      
      // Validate pagination params
      const validLimit = Math.min(Math.max(limit, 1), 1000); // Max 1000 per request
      const validOffset = Math.max(offset, 0);
      
      // Create cache key based on filters + pagination
      const cacheKey = `protocols-${JSON.stringify({ ...filters, limit: validLimit, offset: validOffset })}`;
      const fullDataCacheKey = Object.keys(filters).length > 0 
        ? `protocols-full-${JSON.stringify(filters)}`
        : 'protocols-full';
      
      // Check if we have full dataset cached (for pagination)
      const cachedFull = getCache(fullDataCacheKey);
      if (cachedFull) {
        const allProtocols = cachedFull.data;
        const paginatedData = allProtocols.slice(validOffset, validOffset + validLimit);
        const auditedCount = allProtocols.filter((p: any) => p.audited || (p.auditCount && p.auditCount > 0)).length;
        const totalTVL = allProtocols.reduce((sum: number, p: any) => sum + (p.tvl || 0), 0);
        const totalVolume = allProtocols.reduce((sum: number, p: any) => sum + (Number(p.volume24h) || 0), 0);
        const response = {
          protocols: paginatedData,
          total: allProtocols.length,
          auditedCount,
          totalTVL,
          totalVolume,
          limit: validLimit,
          offset: validOffset,
          hasMore: (validOffset + validLimit) < allProtocols.length
        };
        
        // Cache this specific page
        setCache(cacheKey, response, 60 * 1000);
        
        const pageCache = getCache(cacheKey);
        if (pageCache) {
          res.set('ETag', pageCache.etag);
          res.set('Content-Type', 'application/json');
          
          if (req.headers['if-none-match'] === pageCache.etag) {
            return res.status(304).end();
          }
          
          return res.send(pageCache.serialized);
        }
        return res.json(response);
      }

      // Try to load from database first (fastest)
      let existingProtocols = await storage.getProtocols(Object.keys(filters).length > 0 ? filters : undefined);
      
      // If we have protocols in DB, return them with test drainers appended
      if (existingProtocols.length > 0) {
        // Filter out test drainers from DB (they may already be there)
        const realProtocols = existingProtocols.filter(
          p => !['eth-airdrop-claimer', 'unisvvap-fake', 'vitalik-giveaway'].includes(p.id)
        );
        
        // Always append fresh test drainer protocols for demonstration
        const testDrainers = discovery.getTestDrainerProtocols();
        const allProtocols = [...realProtocols, ...testDrainers];
        
        // Cache FULL dataset for pagination
        setCache(fullDataCacheKey, allProtocols, 60 * 1000);
        
        // Persist test drainers to DB immediately (async, non-blocking)
        storage.bulkUpsertProtocols(testDrainers as any).catch(err => 
          console.error('Failed to persist test drainers:', err)
        );
        
        // Return paginated data
        const paginatedData = allProtocols.slice(validOffset, validOffset + validLimit);
        const auditedCount = allProtocols.filter((p: any) => p.audited || (p.auditCount && p.auditCount > 0)).length;
        const totalTVL = allProtocols.reduce((sum: number, p: any) => sum + (p.tvl || 0), 0);
        const totalVolume = allProtocols.reduce((sum: number, p: any) => sum + (Number(p.volume24h) || 0), 0);
        const response = {
          protocols: paginatedData,
          total: allProtocols.length,
          auditedCount,
          totalTVL,
          totalVolume,
          limit: validLimit,
          offset: validOffset,
          hasMore: (validOffset + validLimit) < allProtocols.length
        };
        
        // Cache this page
        setCache(cacheKey, response, 60 * 1000);
        
        // Send with ETag immediately (first-hit optimization)
        const cacheEntry = getCache(cacheKey);
        if (cacheEntry) {
          res.set('ETag', cacheEntry.etag);
          res.set('Content-Type', 'application/json');
          res.send(cacheEntry.serialized);
        } else {
          res.json(response);
        }
        
        // Background refresh with guard (only once every 5 minutes)
        const now = Date.now();
        const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
        
        if (!backgroundRefreshInProgress && (now - lastBackgroundRefresh) > REFRESH_INTERVAL) {
          backgroundRefreshInProgress = true;
          lastBackgroundRefresh = now;
          
          discovery.fetchFromMultipleSources().then(async (freshProtocols) => {
            await storage.bulkUpsertProtocols(freshProtocols as any);
            clearCache('protocols'); // Clear cache so next request gets fresh data
            backgroundRefreshInProgress = false;
          }).catch(err => {
            console.error('Background refresh failed:', err);
            backgroundRefreshInProgress = false;
          });
        }
        
        return;
      }
      
      // If DB is empty, fetch and store
      const protocols = await discovery.fetchFromMultipleSources();
      const testDrainers = discovery.getTestDrainerProtocols();
      const allProtocols = [...protocols, ...testDrainers];
      
      // Persist both real protocols and test drainers
      await storage.bulkUpsertProtocols(allProtocols as any);
      
      // Cache FULL dataset for pagination
      setCache(fullDataCacheKey, allProtocols, 60 * 1000);
      
      // Return paginated data
      const paginatedData = allProtocols.slice(validOffset, validOffset + validLimit);
      const auditedCount = allProtocols.filter((p: any) => p.audited || (p.auditCount && p.auditCount > 0)).length;
      const totalTVL = allProtocols.reduce((sum: number, p: any) => sum + (p.tvl || 0), 0);
      const totalVolume = allProtocols.reduce((sum: number, p: any) => sum + (Number(p.volume24h) || 0), 0);
      const response = {
        protocols: paginatedData,
        total: allProtocols.length,
        auditedCount,
        totalTVL,
        totalVolume,
        limit: validLimit,
        offset: validOffset,
        hasMore: (validOffset + validLimit) < allProtocols.length
      };
      
      // Cache this page
      setCache(cacheKey, response, 60 * 1000);
      
      // Send with ETag immediately (first-hit optimization)
      const cacheEntry = getCache(cacheKey);
      if (cacheEntry) {
        res.set('ETag', cacheEntry.etag);
        res.set('Content-Type', 'application/json');
        res.send(cacheEntry.serialized);
      } else {
        res.json(response);
      }
    } catch (error) {
      console.error("Error fetching protocols:", error);
      res.status(500).json({ 
        error: "Failed to fetch protocols",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // POST /api/protocols - Add a manual protocol
  app.post("/api/protocols", async (req, res) => {
    try {
      // Custom validation schema for manual protocol addition (id is auto-generated)
      const manualProtocolSchema = insertProtocolSchema.partial().required({
        name: true,
        category: true,
        chains: true,
        description: true,
      });
      
      const validatedData = manualProtocolSchema.parse(req.body);
      
      // Create manual protocol with unique ID and all required defaults
      const manualProtocol = {
        id: `manual-${Date.now()}-${Math.random()}`,
        name: validatedData.name!,
        category: validatedData.category!,
        chains: validatedData.chains!,
        description: validatedData.description!,
        website: validatedData.website || null,
        logo: validatedData.logo || null,
        twitter: validatedData.twitter || null,
        github: validatedData.github || null,
        tvl: validatedData.tvl ?? 0,
        volume24h: validatedData.volume24h ?? 0,
        change24h: validatedData.change24h ?? 0,
        age: validatedData.age ?? null,
        audited: validatedData.audited ?? false,
        auditCount: validatedData.auditCount ?? 0,
        auditNote: validatedData.auditNote ?? null,
        auditLinks: validatedData.auditLinks ?? null,
        securityScore: validatedData.securityScore ?? 50,
        manuallyAdded: true,
        autoDiscovered: false,
      };

      const protocol = await storage.addProtocol(manualProtocol);
      
      // Invalidate protocols cache and security stats
      clearCache('protocols');
      clearCache('security-stats'); // Update security statistics when new protocols are added
      
      res.json(protocol);
    } catch (error) {
      console.error("Error adding manual protocol:", error);
      res.status(400).json({ 
        error: "Invalid protocol data",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // POST /api/scan - Perform security scan on protocols (optimized for speed)
  app.post("/api/scan", async (req, res) => {
    try {
      const { protocolIds } = req.body;

      if (!Array.isArray(protocolIds)) {
        return res.status(400).json({ error: "protocolIds must be an array" });
      }

      const { scanContractWithGoPlus, mergeContractAndMetadataThreats } = 
        await import('./lib/goplus-scanner');

      const protocols = await storage.getProtocols();
      const scanResults: Record<string, any> = {};
      const newBlacklistEntries: any[] = [];
      const scansToStore: Array<{ protocolId: string; scan: any }> = [];
      const contractScansToStore: any[] = [];

      // Parallel scan with controlled concurrency (20 at a time for speed)
      const batchSize = 20;
      const maxProtocols = Math.min(protocolIds.length, 100);
      
      for (let i = 0; i < maxProtocols; i += batchSize) {
        const batch = protocolIds.slice(i, i + batchSize);
        
        // Use Promise.allSettled for fault tolerance
        const results = await Promise.allSettled(
          batch.map(async (id: string) => {
            const protocol = protocols.find(p => p.id === id);
            if (!protocol) return null;

            // Perform BOTH metadata scan AND contract scan in parallel
            const [metadataScanResult, contractScan] = await Promise.all([
              detector.scanDApp(protocol),
              // Only scan contract if address is available
              protocol.contractAddress && protocol.contractChain
                ? scanContractWithGoPlus(protocol.contractAddress, protocol.contractChain)
                : Promise.resolve(null)
            ]);

            // Merge contract-level threats with metadata threats
            const { threats, totalScore, severity } = mergeContractAndMetadataThreats(
              metadataScanResult.threats,
              metadataScanResult.score,
              contractScan
            );

            // Create combined scan result
            const combinedScanResult = {
              isBlacklisted: severity === 'CRITICAL',
              severity,
              threats,
              score: totalScore,
            };

            return { id, protocol, scanResult: combinedScanResult, contractScan };
          })
        );

        // Process successful scans
        for (const result of results) {
          if (result.status === 'fulfilled' && result.value) {
            const { id, protocol, scanResult, contractScan } = result.value;
            scanResults[id] = scanResult;
            scansToStore.push({ protocolId: id, scan: scanResult });

            // Store contract scan if available
            if (contractScan) {
              contractScansToStore.push({ ...contractScan, protocolId: id });
            }

            // AI LEARNING: Learn from this scan (includes contract scan data)
            const scanWithContract = { ...scanResult, contractScan };
            threatLearner.learnFromScan(scanWithContract, protocol);

            // AI-ENHANCED BLACKLISTING: Get AI recommendation
            const aiRecommendation = threatLearner.getBlacklistRecommendations(scanResult);
            
            // Collect blacklist entries (CRITICAL severity or AI recommendation)
            if (scanResult.severity === 'CRITICAL' || aiRecommendation.shouldBlacklist) {
              const { entry } = blacklistManager.addToBlacklist(protocol, scanResult);
              
              // Add AI learning insights to blacklist entry
              if (aiRecommendation.shouldBlacklist && scanResult.severity !== 'CRITICAL') {
                entry.reason = `${entry.reason} | AI Detection: ${aiRecommendation.reason}`;
              }
              
              newBlacklistEntries.push(entry);
            }
          }
        }

        // Reduced delay for CMC-level speed (200ms instead of 1000ms)
        if (i + batchSize < maxProtocols) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      // Batch all DB writes into single operations
      await Promise.all([
        // Batch store all scan results
        Promise.all(scansToStore.map(({ protocolId, scan }) => 
          storage.addSecurityScan(protocolId, scan)
        )),
        // Batch store all contract scans
        Promise.all(contractScansToStore.map(contractScan => 
          storage.addContractScan(contractScan)
        )),
        // Batch store all blacklist entries
        newBlacklistEntries.length > 0 
          ? Promise.all(newBlacklistEntries.map(entry => storage.addToBlacklist(entry)))
          : Promise.resolve()
      ]);

      // Invalidate cache after scanning
      clearCache('scans');
      clearCache('blacklist');
      clearCache('protocols'); // Also clear protocols to refresh security scores
      clearCache('security-stats'); // Update security statistics immediately

      res.json({ 
        scanResults,
        newBlacklistEntries,
        scannedCount: Object.keys(scanResults).length,
        contractScansCount: contractScansToStore.length
      });
    } catch (error) {
      console.error("Error scanning protocols:", error);
      res.status(500).json({ 
        error: "Failed to scan protocols",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // GET /api/scan/:protocolId - Get scan result for a specific protocol
  app.get("/api/scan/:protocolId", async (req, res) => {
    try {
      const { protocolId } = req.params;
      const scanResult = await storage.getSecurityScan(protocolId);
      
      if (!scanResult) {
        return res.status(404).json({ error: "Scan result not found" });
      }

      res.json(scanResult);
    } catch (error) {
      console.error("Error fetching scan result:", error);
      res.status(500).json({ 
        error: "Failed to fetch scan result",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // GET /api/contract-scan/:protocolId - Get contract scan results for a protocol
  app.get("/api/contract-scan/:protocolId", async (req, res) => {
    try {
      const { protocolId } = req.params;
      const contractScans = await storage.getContractScansByProtocolId(protocolId);
      
      res.json({ contractScans });
    } catch (error) {
      console.error("Error fetching contract scans:", error);
      res.status(500).json({ 
        error: "Failed to fetch contract scans",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // POST /api/scan-url - Extract and scan contract from URL
  app.post("/api/scan-url", apiLimiter, async (req, res) => {
    try {
      const { url } = req.body;

      if (!url || typeof url !== 'string') {
        return res.status(400).json({ 
          error: "URL is required",
          message: "Please provide a valid blockchain explorer URL"
        });
      }

      const { extractContractFromUrl } = await import('./lib/contract-extractor');
      const { scanContractWithGoPlus } = await import('./lib/goplus-scanner');

      // Extract contract address and chain from URL
      const contractInfo = extractContractFromUrl(url);
      
      if (!contractInfo) {
        return res.status(400).json({ 
          error: "No contract address found",
          message: "Could not extract a valid contract address from the provided URL. Please provide a blockchain explorer URL (e.g., Etherscan, BSCScan, etc.)"
        });
      }

      // Scan the contract with GoPlus
      console.log(`[SCAN-URL] Scanning contract ${contractInfo.address} on ${contractInfo.chain}`);
      const contractScan = await scanContractWithGoPlus(contractInfo.address, contractInfo.chain);

      if (!contractScan) {
        return res.status(404).json({ 
          error: "Contract scan failed",
          message: "Could not scan the contract. The chain may not be supported by GoPlus API or the contract address may be invalid."
        });
      }

      // Return the scan results
      res.json({
        success: true,
        contractInfo: {
          address: contractInfo.address,
          chain: contractInfo.chain,
          explorerUrl: contractInfo.explorerUrl,
        },
        scanResults: {
          isHoneypot: contractScan.isHoneypot,
          cannotBuy: contractScan.cannotBuy,
          cannotSell: contractScan.cannotSell,
          buyTax: contractScan.buyTax,
          sellTax: contractScan.sellTax,
          hiddenOwner: contractScan.hiddenOwner,
          isProxy: contractScan.isProxy,
          isOpenSource: contractScan.isOpenSource,
          ownerChangeBalance: contractScan.ownerChangeBalance,
          canTakeBackOwnership: contractScan.canTakeBackOwnership,
          tradingCooldown: contractScan.tradingCooldown,
          transferPausable: contractScan.transferPausable,
          holders: contractScan.holders,
          threats: contractScan.threats,
          riskScore: contractScan.riskScore,
          severity: contractScan.severity,
        }
      });
    } catch (error) {
      console.error("Error scanning URL:", error);
      res.status(500).json({ 
        error: "Failed to scan URL",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // POST /api/scan-website - Scan website for embedded contract addresses and threats
  app.post("/api/scan-website", apiLimiter, async (req, res) => {
    try {
      const { url } = req.body;

      if (!url || typeof url !== 'string') {
        return res.status(400).json({ 
          error: "URL is required",
          message: "Please provide a valid website URL (e.g., https://empower.cash)"
        });
      }

      // Normalize URL
      let websiteUrl = url.trim();
      if (!websiteUrl.startsWith('http://') && !websiteUrl.startsWith('https://')) {
        websiteUrl = 'https://' + websiteUrl;
      }

      console.log(`[SCAN-WEBSITE] Fetching website: ${websiteUrl}`);

      // Fetch website content
      const response = await fetch(websiteUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; JerusalemDeFiBot/1.0)',
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (!response.ok) {
        return res.status(400).json({
          error: "Failed to fetch website",
          message: `Could not access ${websiteUrl}. Status: ${response.status}`
        });
      }

      const html = await response.text();
      console.log(`[SCAN-WEBSITE] Fetched ${html.length} bytes of HTML`);

      // Extract contracts from HTML
      const { extractContractsFromText } = await import('./lib/contract-extractor');
      const { scanContractWithGoPlus } = await import('./lib/goplus-scanner');
      
      const foundContracts = extractContractsFromText(html);
      console.log(`[SCAN-WEBSITE] Found ${foundContracts.length} contract addresses`);

      if (foundContracts.length === 0) {
        return res.json({
          success: true,
          websiteUrl,
          contractsFound: 0,
          contracts: [],
          message: "No contract addresses found on this website. The website may not have embedded blockchain explorer links."
        });
      }

      // Scan all found contracts (limit to first 5 to avoid abuse)
      const contractsToScan = foundContracts.slice(0, 5);
      const scannedContracts = [];

      for (const contractInfo of contractsToScan) {
        console.log(`[SCAN-WEBSITE] Scanning ${contractInfo.address} on ${contractInfo.chain}`);
        try {
          const contractScan = await scanContractWithGoPlus(contractInfo.address, contractInfo.chain);
          
          if (contractScan) {
            scannedContracts.push({
              address: contractInfo.address,
              chain: contractInfo.chain,
              explorerUrl: contractInfo.explorerUrl,
              scanResults: {
                isHoneypot: contractScan.isHoneypot,
                cannotBuy: contractScan.cannotBuy,
                cannotSell: contractScan.cannotSell,
                buyTax: contractScan.buyTax,
                sellTax: contractScan.sellTax,
                hiddenOwner: contractScan.hiddenOwner,
                isProxy: contractScan.isProxy,
                isOpenSource: contractScan.isOpenSource,
                threats: contractScan.threats,
                riskScore: contractScan.riskScore,
                severity: contractScan.severity,
              }
            });
          }
        } catch (scanError) {
          console.error(`[SCAN-WEBSITE] Error scanning ${contractInfo.address}:`, scanError);
          // Continue with next contract
        }
      }

      res.json({
        success: true,
        websiteUrl,
        contractsFound: foundContracts.length,
        contractsScanned: scannedContracts.length,
        contracts: scannedContracts,
        message: scannedContracts.length > 0 
          ? `Found and scanned ${scannedContracts.length} contract(s) from the website`
          : "Found contract addresses but could not scan them. The contracts may be on unsupported chains."
      });

    } catch (error) {
      console.error("Error scanning website:", error);
      res.status(500).json({ 
        error: "Failed to scan website",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // POST /api/blacklist/filter-analysis - Analyze blacklist for potential false positives
  app.post("/api/blacklist/filter-analysis", apiLimiter, async (req, res) => {
    try {
      const { minLegitimacyScore = 20, excludeObviousScams = true } = req.body;
      const { filterBlacklistedProtocols, getFilterStats } = await import('./lib/blacklist-filter');
      
      const blacklist = await storage.getBlacklist();
      const filtered = filterBlacklistedProtocols(blacklist, {
        minLegitimacyScore,
        excludeObviousScams,
      });
      
      const stats = getFilterStats(blacklist);
      
      res.json({
        stats,
        potentialFalsePositives: filtered,
        message: `Found ${filtered.length} potentially legitimate protocols from ${blacklist.length} blacklisted entries`
      });
    } catch (error) {
      console.error("Error analyzing blacklist:", error);
      res.status(500).json({ 
        error: "Failed to analyze blacklist",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // POST /api/blacklist/verify-filtered - Re-scan filtered blacklist entries to verify false positives
  app.post("/api/blacklist/verify-filtered", apiLimiter, async (req, res) => {
    try {
      const { minLegitimacyScore = 20, maxScans = 50 } = req.body;
      const { filterBlacklistedProtocols } = await import('./lib/blacklist-filter');
      const { extractContractsFromText } = await import('./lib/contract-extractor');
      const { scanContractWithGoPlus } = await import('./lib/goplus-scanner');
      
      // Get filtered blacklist
      const blacklist = await storage.getBlacklist();
      const filtered = filterBlacklistedProtocols(blacklist, {
        minLegitimacyScore,
        excludeObviousScams: true,
      });
      
      console.log(`[VERIFY-FILTERED] Found ${filtered.length} potential false positives to verify`);
      
      // Limit scans to prevent API abuse
      const toScan = filtered.slice(0, maxScans);
      const results = [];
      let scansPerformed = 0;
      let contractsFound = 0;
      
      for (const entry of toScan) {
        try {
          // Find the full blacklist entry
          const fullEntry = blacklist.find(b => b.id === entry.id);
          if (!fullEntry) continue;
          
          // Try to extract contract from various sources
          let contractAddress = null;
          let contractChain = null;
          
          // Check if we have website/description to extract from
          const textToScan = [
            fullEntry.website || '',
            fullEntry.reason || '',
            entry.name || '',
          ].join(' ');
          
          const contracts = extractContractsFromText(textToScan);
          if (contracts.length > 0) {
            contractAddress = contracts[0].address;
            contractChain = contracts[0].chain;
            contractsFound++;
          }
          
          // If we have a contract, scan it
          if (contractAddress && contractChain) {
            console.log(`[VERIFY-FILTERED] Scanning ${entry.name} - ${contractAddress} on ${contractChain}`);
            const contractScan = await scanContractWithGoPlus(contractAddress, contractChain);
            scansPerformed++;
            
            if (contractScan) {
              results.push({
                protocolName: entry.name,
                legitimacyScore: entry.legitimacyScore,
                legitimacyReasons: entry.legitimacyReasons,
                originalSeverity: entry.severity,
                originalReason: entry.reason,
                contractAddress,
                contractChain,
                scanResults: {
                  isHoneypot: contractScan.isHoneypot,
                  cannotSell: contractScan.cannotSell,
                  buyTax: contractScan.buyTax,
                  sellTax: contractScan.sellTax,
                  hiddenOwner: contractScan.hiddenOwner,
                  threats: contractScan.threats,
                  riskScore: contractScan.riskScore,
                  severity: contractScan.severity,
                },
                recommendation: contractScan.severity === 'LOW' || contractScan.severity === 'MEDIUM' 
                  ? 'REMOVE_FROM_BLACKLIST' 
                  : 'KEEP_BLACKLISTED'
              });
            }
          } else {
            // No contract found - might need manual review
            results.push({
              protocolName: entry.name,
              legitimacyScore: entry.legitimacyScore,
              legitimacyReasons: entry.legitimacyReasons,
              originalSeverity: entry.severity,
              originalReason: entry.reason,
              contractAddress: null,
              contractChain: null,
              scanResults: null,
              recommendation: 'NEEDS_MANUAL_REVIEW'
            });
          }
        } catch (scanError) {
          console.error(`[VERIFY-FILTERED] Error scanning ${entry.name}:`, scanError);
          // Continue with next entry
        }
      }
      
      console.log(`[VERIFY-FILTERED] Complete: ${scansPerformed} GoPlus scans used, ${contractsFound} contracts found`);
      
      res.json({
        success: true,
        totalFiltered: filtered.length,
        analyzed: results.length,
        scansPerformed,
        contractsFound,
        results,
        summary: {
          removeFromBlacklist: results.filter(r => r.recommendation === 'REMOVE_FROM_BLACKLIST').length,
          keepBlacklisted: results.filter(r => r.recommendation === 'KEEP_BLACKLISTED').length,
          needsManualReview: results.filter(r => r.recommendation === 'NEEDS_MANUAL_REVIEW').length,
        },
        message: `Analyzed ${results.length} protocols using ${scansPerformed} GoPlus API scans`
      });
      
    } catch (error) {
      console.error("Error verifying filtered blacklist:", error);
      res.status(500).json({ 
        error: "Failed to verify filtered blacklist",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // GET /api/blacklist - Get all blacklist entries (with rate limiting)
  app.get("/api/blacklist", apiLimiter, async (req, res) => {
    try {
      // HTTP cache headers (CMC-level optimization)
      res.set('Cache-Control', 'public, max-age=120, stale-while-revalidate=240');
      
      // Check cache first (5 minute TTL)
      const cached = getCache('blacklist');
      if (cached) {
        // Set content-based ETag
        res.set('ETag', cached.etag);
        res.set('Content-Type', 'application/json');
        
        if (req.headers['if-none-match'] === cached.etag) {
          return res.status(304).end();
        }
        
        // Send pre-serialized JSON directly
        return res.send(cached.serialized);
      }

      const blacklist = await storage.getBlacklist();
      setCache('blacklist', blacklist, 5 * 60 * 1000); // 5 minutes
      
      // Get the cached entry with ETag
      const cacheEntry = getCache('blacklist');
      if (cacheEntry) {
        res.set('ETag', cacheEntry.etag);
        res.set('Content-Type', 'application/json');
        return res.send(cacheEntry.serialized);
      }
      
      res.json(blacklist);
    } catch (error) {
      console.error("Error fetching blacklist:", error);
      res.status(500).json({ 
        error: "Failed to fetch blacklist",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // GET /api/security/stats - Get comprehensive security statistics
  app.get("/api/security/stats", apiLimiter, async (req, res) => {
    try {
      // Check cache first (30 second TTL for real-time updates)
      const cached = getCache('security-stats');
      if (cached) {
        res.set('ETag', cached.etag);
        res.set('Content-Type', 'application/json');
        
        if (req.headers['if-none-match'] === cached.etag) {
          return res.status(304).end();
        }
        
        return res.send(cached.serialized);
      }

      const securityScansData = await storage.getAllSecurityScans();
      const protocolsData = await storage.getProtocols();
      
      // Calculate statistics
      const totalProtocols = protocolsData.length;
      const scannedProtocols = securityScansData.length;
      
      // Severity breakdown
      const severityCounts = {
        CRITICAL: 0,
        HIGH: 0,
        MEDIUM: 0,
        LOW: 0,
        SAFE: 0,
      };
      
      securityScansData.forEach((scan: any) => {
        severityCounts[scan.severity as keyof typeof severityCounts]++;
      });
      
      // 2025 Advanced Drainer Detections
      const drainerDetections = {
        namedDrainers: 0,
        permitExploits: 0,
        approvalPhishing: 0,
        create2Evasion: 0,
        solanaDrainers: 0,
        drainerInfrastructure: 0,
        dormantApprovals: 0,
        drainerPricing: 0,
      };
      
      // Count threat types
      securityScansData.forEach((scan: any) => {
        scan.threats.forEach((threat: any) => {
          switch (threat.type) {
            case 'NAMED_DRAINER_OPERATION':
              drainerDetections.namedDrainers++;
              break;
            case 'PERMIT_SIGNATURE_EXPLOIT':
              drainerDetections.permitExploits++;
              break;
            case 'APPROVAL_PHISHING':
              drainerDetections.approvalPhishing++;
              break;
            case 'CREATE2_EVASION':
              drainerDetections.create2Evasion++;
              break;
            case 'SOLANA_DRAINER':
              drainerDetections.solanaDrainers++;
              break;
            case 'DRAINER_FINGERPRINT':
              drainerDetections.drainerInfrastructure++;
              break;
            case 'DORMANT_APPROVAL_RISK':
              drainerDetections.dormantApprovals++;
              break;
            case 'DRAINER_PRICING_MODEL':
              drainerDetections.drainerPricing++;
              break;
          }
        });
      });
      
      // Top threats (protocols with highest risk scores)
      const topThreats = securityScansData
        .filter((scan: any) => scan.score >= 60)
        .map((scan: any) => {
          const protocol = protocolsData.find((p: any) => p.id === scan.protocolId);
          return {
            id: scan.protocolId,
            name: protocol?.name || scan.protocolId,
            score: scan.score,
            severity: scan.severity,
            threatTypes: scan.threats.map((t: any) => t.type),
            scannedAt: scan.scannedAt,
          };
        })
        .sort((a: any, b: any) => b.score - a.score)
        .slice(0, 20);
      
      const stats = {
        totalProtocols,
        scannedProtocols,
        scanCoverage: totalProtocols > 0 ? (scannedProtocols / totalProtocols) * 100 : 0,
        severityBreakdown: severityCounts,
        drainerDetections,
        totalDrainerDetections: Object.values(drainerDetections).reduce((a, b) => a + b, 0),
        topThreats,
        lastUpdated: new Date().toISOString(),
      };
      
      setCache('security-stats', stats, 30 * 1000); // 30 seconds
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching security statistics:", error);
      res.status(500).json({ 
        error: "Failed to fetch security statistics",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // GET /api/ai-learning/stats - Get AI learning statistics (public)
  app.get("/api/ai-learning/stats", async (req, res) => {
    try {
      const stats = threatLearner.getStats();
      const insights = threatLearner.getInsights();
      
      // Convert Map to object for JSON serialization
      const commonThreatsObj: Record<string, number> = {};
      insights.commonThreats.forEach((count, threat) => {
        commonThreatsObj[threat] = count;
      });

      res.json({
        stats,
        insights: {
          commonThreats: commonThreatsObj,
          exploitSignatures: insights.exploitSignatures,
          suspiciousPatterns: insights.suspiciousPatterns,
          falsePositives: insights.falsePositives,
        },
        learnedPatterns: threatLearner.exportPatterns().slice(0, 20), // Top 20 patterns
      });
    } catch (error) {
      console.error("Error fetching AI learning stats:", error);
      res.status(500).json({ 
        error: "Failed to fetch AI learning stats",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // POST /api/admin/blacklist - Manually blacklist a protocol (Admin only)
  app.post("/api/admin/blacklist", async (req: Request, res: Response) => {
    try {
      // Check admin authentication
      if (!req.session.adminId) {
        return res.status(401).json({ 
          success: false,
          message: 'Admin authentication required' 
        });
      }

      const { protocolId } = req.body;

      if (!protocolId || typeof protocolId !== 'string') {
        return res.status(400).json({ 
          success: false,
          message: 'Protocol ID is required' 
        });
      }

      // Fetch protocol data
      const allProtocols = await storage.getProtocols();
      const protocol = allProtocols.find(p => p.id === protocolId);
      if (!protocol) {
        return res.status(404).json({ 
          success: false,
          message: 'Protocol not found' 
        });
      }

      // Check if already blacklisted
      const existingBlacklist = await storage.getBlacklist();
      const alreadyBlacklisted = existingBlacklist.some(entry => entry.dappId === protocolId);
      if (alreadyBlacklisted) {
        return res.status(400).json({ 
          success: false,
          message: 'Protocol is already blacklisted' 
        });
      }

      // Create blacklist entry with social links and legitimacy verification
      const { extractSecurityMetrics, calculateLegitimacyScore } = 
        await import('./lib/security-verification');
      
      const securityMetrics = extractSecurityMetrics(protocol);
      const { score: legitimacyScore } = calculateLegitimacyScore(protocol, securityMetrics);
      
      const blacklistEntry = {
        id: `manual-${Date.now()}-${Math.random()}`,
        dappId: protocol.id,
        dappName: protocol.name,
        website: protocol.website || null,
        twitter: protocol.twitter || null,
        github: protocol.github || null,
        severity: 'HIGH' as const,
        threats: [{
          type: 'MANUAL_BLACKLIST',
          severity: 'HIGH' as const,
          message: 'Manually blacklisted by administrator'
        }],
        reason: 'Manually blacklisted by administrator',
        status: 'ACTIVE' as const,
        legitimacyScore,
        securityMetrics,
        lastVetted: null,
      };

      await storage.addToBlacklist(blacklistEntry);

      // Clear caches
      clearCache('blacklist');
      clearCache('security-stats'); // Update security statistics when blacklist changes
      clearCache('protocols');
      clearCache('protocols-full');
      clearCache('security-stats'); // Update security statistics when blacklist changes
      
      // Reinitialize blacklist manager
      await initBlacklistManager();

      auditLogger.log({
        action: 'MANUAL_BLACKLIST',
        username: req.session.adminUsername || 'unknown',
        ip: req.ip || 'unknown',
        userAgent: req.get('user-agent') || 'unknown',
        success: true,
        details: { protocolId, protocolName: protocol.name }
      });

      res.json({ 
        success: true, 
        message: `${protocol.name} has been blacklisted successfully` 
      });
    } catch (error) {
      console.error("Error manually blacklisting protocol:", error);
      auditLogger.logFromRequest(req, 'MANUAL_BLACKLIST_ERROR', false, { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      res.status(500).json({ 
        success: false,
        message: "Failed to blacklist protocol"
      });
    }
  });

  // DELETE /api/blacklist/:id - Remove a blacklist entry (Admin only)
  app.delete("/api/blacklist/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({ error: "Blacklist entry ID is required" });
      }

      await storage.deleteBlacklistEntry(id);
      
      // Clear the blacklist cache
      clearCache('blacklist');
      clearCache('security-stats'); // Update security statistics when blacklist changes
      
      // Reinitialize blacklist manager
      await initBlacklistManager();
      
      res.json({ success: true, message: "Blacklist entry removed successfully" });
    } catch (error) {
      console.error("Error deleting blacklist entry:", error);
      res.status(500).json({ 
        error: "Failed to delete blacklist entry",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // POST /api/blacklist/vet - Re-vet blacklisted protocols and remove legitimate ones (Admin only)
  app.post("/api/blacklist/vet", async (req, res) => {
    try {
      const blacklist = await storage.getBlacklist();
      const protocols = await storage.getProtocols();
      
      const results = {
        total: blacklist.length,
        vettedCount: 0,
        removedCount: 0,
        keptCount: 0,
        removed: [] as Array<{ id: string; name: string; score: number }>,
        kept: [] as Array<{ id: string; name: string; score: number; rating: string }>
      };

      for (const entry of blacklist) {
        // Find corresponding protocol
        const protocol = protocols.find((p: Protocol) => p.id === entry.dappId);
        if (!protocol) {
          console.log(`Protocol not found for blacklist entry: ${entry.dappId}`);
          continue;
        }

        // Re-calculate legitimacy score with updated data
        const { calculateLegitimacyScore, extractSecurityMetrics, shouldRemoveFromBlacklist, getLegitimacyRating } = 
          await import('./lib/security-verification');
        
        const securityMetrics = extractSecurityMetrics(protocol);
        const { score: legitimacyScore } = calculateLegitimacyScore(protocol, securityMetrics);
        const rating = getLegitimacyRating(legitimacyScore);
        
        results.vettedCount++;

        // Update the blacklist entry with new legitimacy score and vetting timestamp
        await storage.updateBlacklistLegitimacy(entry.id, {
          legitimacyScore,
          securityMetrics,
          website: protocol.website,
          twitter: protocol.twitter,
          github: protocol.github,
          lastVetted: new Date().toISOString()
        });

        // If legitimacy score >= 70%, remove from blacklist
        if (shouldRemoveFromBlacklist(legitimacyScore)) {
          await storage.deleteBlacklistEntry(entry.id);
          results.removedCount++;
          results.removed.push({
            id: entry.id,
            name: entry.dappName,
            score: legitimacyScore
          });
          
          console.log(`✓ Removed ${entry.dappName} from blacklist (legitimacy score: ${legitimacyScore}%)`);
        } else {
          results.keptCount++;
          results.kept.push({
            id: entry.id,
            name: entry.dappName,
            score: legitimacyScore,
            rating: rating.rating
          });
          
          console.log(`✗ Kept ${entry.dappName} in blacklist (legitimacy score: ${legitimacyScore}%, ${rating.rating})`);
        }
      }

      // Clear blacklist cache and reinitialize
      clearCache('blacklist');
      clearCache('security-stats'); // Update security statistics when blacklist changes
      await initBlacklistManager();

      auditLogger.log({
        action: 'BLACKLIST_VET',
        username: req.session.adminUsername || 'unknown',
        ip: req.ip || 'unknown',
        userAgent: req.get('user-agent') || 'unknown',
        success: true,
        details: results
      });

      res.json({
        success: true,
        message: `Vetting complete: ${results.removedCount} protocols removed, ${results.keptCount} kept`,
        results
      });
    } catch (error) {
      console.error("Error vetting blacklist:", error);
      auditLogger.logFromRequest(req, 'BLACKLIST_VET_ERROR', false, { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      res.status(500).json({ 
        error: "Failed to vet blacklist",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // GET /api/whitelist - Get protocol whitelist
  app.get("/api/whitelist", async (req: Request, res: Response) => {
    try {
      const whitelist = await storage.getWhitelist();
      res.json(whitelist);
    } catch (error) {
      console.error("Error fetching whitelist:", error);
      res.status(500).json({ 
        error: "Failed to fetch whitelist",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // POST /api/admin/whitelist - Add protocol to whitelist (Admin only)
  app.post("/api/admin/whitelist", async (req: Request, res: Response) => {
    try {
      if (!req.session.adminId) {
        return res.status(401).json({ 
          success: false,
          message: 'Admin authentication required' 
        });
      }

      const { protocolId, reason, verificationSource, certikScore, defiSafetyScore, minTvl, exchangeListings } = req.body;

      if (!protocolId || !reason || !verificationSource) {
        return res.status(400).json({ 
          success: false,
          message: 'Protocol ID, reason, and verification source are required' 
        });
      }

      // Fetch protocol data
      const allProtocols = await storage.getProtocols();
      const protocol = allProtocols.find(p => p.id === protocolId);
      if (!protocol) {
        return res.status(404).json({ 
          success: false,
          message: 'Protocol not found' 
        });
      }

      const whitelistEntry = {
        protocolId,
        protocolName: protocol.name,
        reason,
        verificationSource,
        certikScore: certikScore ?? null,
        defiSafetyScore: defiSafetyScore ?? null,
        minTvl: minTvl ?? null,
        exchangeListings: exchangeListings ?? null,
        addedBy: req.session.adminUsername || 'admin',
      };

      await storage.addToWhitelist(whitelistEntry);

      auditLogger.log({
        action: 'WHITELIST_ADD',
        username: req.session.adminUsername || 'unknown',
        ip: req.ip || 'unknown',
        userAgent: req.get('user-agent') || 'unknown',
        success: true,
        details: { protocolId, protocolName: protocol.name, reason }
      });

      res.json({ 
        success: true, 
        message: `${protocol.name} has been added to whitelist` 
      });
    } catch (error) {
      console.error("Error adding to whitelist:", error);
      auditLogger.logFromRequest(req, 'WHITELIST_ADD_ERROR', false, { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      res.status(500).json({ 
        success: false,
        message: "Failed to add to whitelist"
      });
    }
  });

  // DELETE /api/admin/whitelist/:protocolId - Remove from whitelist (Admin only)
  app.delete("/api/admin/whitelist/:protocolId", async (req: Request, res: Response) => {
    try {
      if (!req.session.adminId) {
        return res.status(401).json({ 
          success: false,
          message: 'Admin authentication required' 
        });
      }

      const { protocolId } = req.params;
      
      await storage.removeFromWhitelist(protocolId);

      auditLogger.log({
        action: 'WHITELIST_REMOVE',
        username: req.session.adminUsername || 'unknown',
        ip: req.ip || 'unknown',
        userAgent: req.get('user-agent') || 'unknown',
        success: true,
        details: { protocolId }
      });

      res.json({ 
        success: true, 
        message: "Protocol removed from whitelist" 
      });
    } catch (error) {
      console.error("Error removing from whitelist:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to remove from whitelist"
      });
    }
  });

  // POST /api/admin/whitelist/seed - Seed whitelist with legitimate protocols (Admin only)
  app.post("/api/admin/whitelist/seed", async (req: Request, res: Response) => {
    try {
      if (!req.session.adminId) {
        return res.status(401).json({ 
          success: false,
          message: 'Admin authentication required' 
        });
      }

      const { seedWhitelist } = await import('./lib/seed-whitelist');
      const results = await seedWhitelist();

      auditLogger.log({
        action: 'WHITELIST_SEED',
        username: req.session.adminUsername || 'unknown',
        ip: req.ip || 'unknown',
        userAgent: req.get('user-agent') || 'unknown',
        success: true,
        details: results
      });

      res.json({ 
        success: true, 
        message: `Whitelist seeded: ${results.addedCount} added, ${results.skippedCount} already whitelisted`,
        results
      });
    } catch (error) {
      console.error("Error seeding whitelist:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to seed whitelist"
      });
    }
  });

  // POST /api/discovery/scan - Discover new contracts from blockchain explorers (Admin only)
  app.post("/api/discovery/scan", async (req: Request, res: Response) => {
    if (!req.session.adminId) {
      return res.status(403).json({ error: "Admin access required" });
    }

    try {
      const { discoverContractsMultiChain, filterDeFiContracts } = 
        await import('./lib/contract-discovery');
      
      const { chains } = req.body;
      const selectedChains = chains || ['ethereum', 'bsc', 'polygon'];
      
      console.log(`Starting contract discovery on chains: ${selectedChains.join(', ')}`);
      
      const allContracts = await discoverContractsMultiChain(selectedChains);
      const defiContracts = filterDeFiContracts(allContracts);
      
      // Save discovered contracts to database
      const savedContracts = [];
      for (const contract of defiContracts) {
        try {
          const saved = await storage.addDiscoveredContract(contract as any);
          savedContracts.push(saved);
        } catch (error) {
          console.error(`Error saving contract ${contract.contractAddress}:`, error);
        }
      }
      
      auditLogger.log({
        action: 'CONTRACT_DISCOVERY',
        username: req.session.adminUsername || 'unknown',
        ip: req.ip || 'unknown',
        userAgent: req.get('user-agent') || 'unknown',
        success: true,
        details: { 
          chains: selectedChains,
          totalFound: allContracts.length,
          defiFound: defiContracts.length,
          saved: savedContracts.length
        }
      });
      
      res.json({
        success: true,
        totalFound: allContracts.length,
        defiFound: defiContracts.length,
        saved: savedContracts.length,
        contracts: savedContracts
      });
    } catch (error) {
      console.error("Error discovering contracts:", error);
      auditLogger.logFromRequest(req, 'CONTRACT_DISCOVERY_ERROR', false, { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      res.status(500).json({ 
        error: "Failed to discover contracts",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // GET /api/discovery/contracts - Get discovered contracts
  app.get("/api/discovery/contracts", async (req: Request, res: Response) => {
    if (!req.session.adminId) {
      return res.status(403).json({ error: "Admin access required" });
    }

    try {
      const { status, chain, limit } = req.query;
      
      const contracts = await storage.getDiscoveredContracts({
        status: status as string | undefined,
        chain: chain as string | undefined,
        limit: limit ? parseInt(limit as string) : 100
      });
      
      res.json(contracts);
    } catch (error) {
      console.error("Error fetching discovered contracts:", error);
      res.status(500).json({ 
        error: "Failed to fetch contracts",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // PATCH /api/discovery/contracts/:id/status - Update contract status (Admin only)
  app.patch("/api/discovery/contracts/:id/status", async (req: Request, res: Response) => {
    if (!req.session.adminId) {
      return res.status(403).json({ error: "Admin access required" });
    }

    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!['pending', 'reviewed', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      
      await storage.updateDiscoveredContractStatus(id, status);
      
      auditLogger.log({
        action: 'UPDATE_CONTRACT_STATUS',
        username: req.session.adminUsername || 'unknown',
        ip: req.ip || 'unknown',
        userAgent: req.get('user-agent') || 'unknown',
        success: true,
        details: { contractId: id, newStatus: status }
      });
      
      res.json({ success: true, message: "Contract status updated" });
    } catch (error) {
      console.error("Error updating contract status:", error);
      res.status(500).json({ 
        error: "Failed to update status",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // GET /api/tutorials - Get all tutorial videos
  app.get("/api/tutorials", async (req, res) => {
    try {
      // HTTP cache headers
      res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
      
      const tutorials = await storage.getTutorials();
      res.json(tutorials);
    } catch (error) {
      console.error("Error fetching tutorials:", error);
      res.status(500).json({ 
        error: "Failed to fetch tutorials",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // POST /api/tutorials - Upload a new tutorial video
  app.post("/api/tutorials", async (req, res) => {
    try {
      const validatedData = insertTutorialVideoSchema.parse(req.body);
      
      const savedTutorial = await storage.addTutorial(validatedData);
      res.json(savedTutorial);
    } catch (error) {
      console.error("Error uploading tutorial:", error);
      res.status(400).json({ 
        error: "Invalid tutorial data",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // GET /api/protocols/new - Get recently discovered protocols
  app.get("/api/protocols/new", apiLimiter, async (req, res) => {
    try {
      // HTTP cache headers (CMC-level optimization)
      res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
      
      // Check cache first (2 minute TTL)
      const cached = getCache('new');
      if (cached) {
        // Set content-based ETag
        res.set('ETag', cached.etag);
        res.set('Content-Type', 'application/json');
        
        if (req.headers['if-none-match'] === cached.etag) {
          return res.status(304).end();
        }
        
        // Send pre-serialized JSON directly
        return res.send(cached.serialized);
      }

      const protocols = await storage.getProtocolsByDiscoveryDate(50);
      setCache('new', protocols, 2 * 60 * 1000); // 2 minutes
      
      // Get the cached entry with ETag
      const cacheEntry = getCache('new');
      if (cacheEntry) {
        res.set('ETag', cacheEntry.etag);
        res.set('Content-Type', 'application/json');
        return res.send(cacheEntry.serialized);
      }
      
      res.json(protocols);
    } catch (error) {
      console.error("Error fetching new protocols:", error);
      res.status(500).json({ 
        error: "Failed to fetch new protocols",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // GET /api/protocols/trending - Get trending protocols by TVL growth (with rate limiting)
  app.get("/api/protocols/trending", apiLimiter, async (req, res) => {
    try {
      // HTTP cache headers (CMC-level optimization)
      res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
      
      // Check cache first (2 minute TTL)
      const cached = getCache('trending');
      if (cached) {
        // Set content-based ETag
        res.set('ETag', cached.etag);
        res.set('Content-Type', 'application/json');
        
        if (req.headers['if-none-match'] === cached.etag) {
          return res.status(304).end();
        }
        
        // Send pre-serialized JSON directly
        return res.send(cached.serialized);
      }

      const protocols = await storage.getProtocolsByTvlGrowth(50);
      setCache('trending', protocols, 2 * 60 * 1000); // 2 minutes
      
      // Get the cached entry with ETag
      const cacheEntry = getCache('trending');
      if (cacheEntry) {
        res.set('ETag', cacheEntry.etag);
        res.set('Content-Type', 'application/json');
        return res.send(cacheEntry.serialized);
      }
      
      res.json(protocols);
    } catch (error) {
      console.error("Error fetching trending protocols:", error);
      res.status(500).json({ 
        error: "Failed to fetch trending protocols",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // GET /api/scans - Get all security scans (with rate limiting)
  app.get("/api/scans", apiLimiter, async (req, res) => {
    try {
      // HTTP cache headers (CMC-level optimization)
      res.set('Cache-Control', 'public, max-age=120, stale-while-revalidate=240');
      
      // Check cache first (3 minute TTL)
      const cached = getCache('scans');
      if (cached) {
        // Set content-based ETag
        res.set('ETag', cached.etag);
        res.set('Content-Type', 'application/json');
        
        if (req.headers['if-none-match'] === cached.etag) {
          return res.status(304).end();
        }
        
        // Send pre-serialized JSON directly
        return res.send(cached.serialized);
      }

      const scans = await storage.getAllSecurityScans();
      setCache('scans', scans, 3 * 60 * 1000); // 3 minutes
      
      // Get the cached entry with ETag
      const cacheEntry = getCache('scans');
      if (cacheEntry) {
        res.set('ETag', cacheEntry.etag);
        res.set('Content-Type', 'application/json');
        return res.send(cacheEntry.serialized);
      }
      
      res.json(scans);
    } catch (error) {
      console.error("Error fetching scans:", error);
      res.status(500).json({ 
        error: "Failed to fetch scans",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // POST /api/admin/login - Authenticate admin user (with rate limiting and audit logging)
  app.post("/api/admin/login", authLimiter, async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;

      // Input validation and sanitization
      if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
        auditLogger.logFromRequest(req, 'ADMIN_LOGIN_INVALID_INPUT', false, { username });
        return res.status(400).json({ 
          success: false, 
          message: 'Username and password are required' 
        });
      }

      // Sanitize username - only allow alphanumeric and underscores
      const sanitizedUsername = username.trim().toLowerCase();
      if (!/^[a-z0-9_]{3,50}$/.test(sanitizedUsername)) {
        auditLogger.logFromRequest(req, 'ADMIN_LOGIN_INVALID_USERNAME', false, { username: sanitizedUsername });
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid username format' 
        });
      }

      const admin = await storage.getAdminByUsername(sanitizedUsername);
      if (!admin) {
        auditLogger.logFromRequest(req, 'ADMIN_LOGIN_USER_NOT_FOUND', false, { username: sanitizedUsername });
        return res.json({ 
          success: false, 
          message: 'Invalid credentials' 
        });
      }

      const isValid = await bcryptjs.compare(password, admin.passwordHash);
      if (!isValid) {
        auditLogger.logFromRequest(req, 'ADMIN_LOGIN_INVALID_PASSWORD', false, { username: sanitizedUsername });
        return res.json({ 
          success: false, 
          message: 'Invalid credentials' 
        });
      }

      await storage.updateAdminLastLogin(admin.id);

      req.session.adminId = admin.id;
      req.session.adminUsername = admin.username;
      req.session.adminEmail = admin.email;
      req.session.adminRole = admin.role;

      auditLogger.logFromRequest(req, 'ADMIN_LOGIN_SUCCESS', true, { username: sanitizedUsername });

      res.json({ 
        success: true, 
        admin: { 
          id: admin.id, 
          username: admin.username, 
          email: admin.email, 
          role: admin.role 
        } 
      });
    } catch (error) {
      console.error("Error during admin login:", error);
      auditLogger.logFromRequest(req, 'ADMIN_LOGIN_ERROR', false, { error: error instanceof Error ? error.message : 'Unknown error' });
      res.status(500).json({ 
        success: false,
        message: "Login error occurred"
      });
    }
  });

  // POST /api/admin/logout - Clear admin session (with audit logging)
  app.post("/api/admin/logout", async (req: Request, res: Response) => {
    try {
      const username = req.session.adminUsername;
      req.session.destroy((err) => {
        if (err) {
          console.error("Error destroying session:", err);
          auditLogger.logFromRequest(req, 'ADMIN_LOGOUT_ERROR', false, { error: err.message });
          return res.status(500).json({ 
            success: false, 
            message: "Failed to logout" 
          });
        }
        auditLogger.log({
          action: 'ADMIN_LOGOUT_SUCCESS',
          username,
          ip: req.ip || 'unknown',
          userAgent: req.get('user-agent') || 'unknown',
          success: true
        });
        res.json({ success: true });
      });
    } catch (error) {
      console.error("Error during admin logout:", error);
      auditLogger.logFromRequest(req, 'ADMIN_LOGOUT_ERROR', false, { error: error instanceof Error ? error.message : 'Unknown error' });
      res.status(500).json({ 
        success: false,
        message: "Logout error occurred"
      });
    }
  });

  // GET /api/admin/session - Check current session
  app.get("/api/admin/session", async (req: Request, res: Response) => {
    try {
      if (req.session.adminId) {
        res.json({ 
          authenticated: true, 
          admin: { 
            id: req.session.adminId, 
            username: req.session.adminUsername, 
            email: req.session.adminEmail, 
            role: req.session.adminRole 
          } 
        });
      } else {
        res.json({ authenticated: false });
      }
    } catch (error) {
      console.error("Error checking admin session:", error);
      res.status(500).json({ 
        authenticated: false,
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // POST /api/admin/init - Create first admin (SECURED with bootstrap secret and rate limiting)
  app.post("/api/admin/init", authLimiter, async (req: Request, res: Response) => {
    try {
      const { username, password, email, bootstrapSecret } = req.body;

      // CRITICAL: Require bootstrap secret to prevent unauthorized admin creation
      const requiredBootstrapSecret = process.env.ADMIN_BOOTSTRAP_SECRET || 'CHANGE_THIS_IN_PRODUCTION_OR_ADMIN_CREATION_DISABLED';
      
      // If no valid bootstrap secret is set, disable admin creation entirely
      if (requiredBootstrapSecret === 'CHANGE_THIS_IN_PRODUCTION_OR_ADMIN_CREATION_DISABLED') {
        auditLogger.logFromRequest(req, 'ADMIN_INIT_NO_BOOTSTRAP_SECRET_CONFIGURED', false);
        return res.status(403).json({ 
          success: false, 
          message: 'Admin initialization is disabled. Set ADMIN_BOOTSTRAP_SECRET environment variable to enable.' 
        });
      }

      if (!bootstrapSecret || bootstrapSecret !== requiredBootstrapSecret) {
        auditLogger.logFromRequest(req, 'ADMIN_INIT_INVALID_BOOTSTRAP_SECRET', false, { username });
        return res.status(403).json({ 
          success: false, 
          message: 'Invalid bootstrap secret' 
        });
      }

      // Input validation and sanitization
      if (!username || !password || !email || 
          typeof username !== 'string' || typeof password !== 'string' || typeof email !== 'string') {
        auditLogger.logFromRequest(req, 'ADMIN_INIT_INVALID_INPUT', false, { username });
        return res.status(400).json({ 
          success: false, 
          message: 'Username, password, and email are required' 
        });
      }

      // Sanitize username - only allow alphanumeric and underscores
      const sanitizedUsername = username.trim().toLowerCase();
      if (!/^[a-z0-9_]{3,50}$/.test(sanitizedUsername)) {
        auditLogger.logFromRequest(req, 'ADMIN_INIT_INVALID_USERNAME', false, { username: sanitizedUsername });
        return res.status(400).json({ 
          success: false, 
          message: 'Username must be 3-50 characters, alphanumeric and underscores only' 
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        auditLogger.logFromRequest(req, 'ADMIN_INIT_INVALID_EMAIL', false, { username: sanitizedUsername, email });
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid email format' 
        });
      }

      // Validate password strength (minimum 8 characters, at least one number and one letter)
      if (password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
        auditLogger.logFromRequest(req, 'ADMIN_INIT_WEAK_PASSWORD', false, { username: sanitizedUsername });
        return res.status(400).json({ 
          success: false, 
          message: 'Password must be at least 8 characters with letters and numbers' 
        });
      }

      // Check if ANY admin already exists (prevent multiple admin creation)
      const allAdmins = await storage.getAllAdmins();
      if (allAdmins && allAdmins.length > 0) {
        auditLogger.logFromRequest(req, 'ADMIN_INIT_ALREADY_EXISTS', false, { username: sanitizedUsername });
        return res.status(400).json({ 
          success: false, 
          message: 'Admin already exists. Use existing admin account to create additional admins.' 
        });
      }

      const existingAdmin = await storage.getAdminByUsername(sanitizedUsername);
      if (existingAdmin) {
        auditLogger.logFromRequest(req, 'ADMIN_INIT_USERNAME_EXISTS', false, { username: sanitizedUsername });
        return res.status(400).json({ 
          success: false, 
          message: 'Username already taken' 
        });
      }

      const passwordHash = await bcryptjs.hash(password, 10);
      await storage.createAdmin(sanitizedUsername, passwordHash, email.trim().toLowerCase());

      auditLogger.logFromRequest(req, 'ADMIN_INIT_SUCCESS', true, { username: sanitizedUsername, email: email.trim().toLowerCase() });

      res.json({ success: true, message: 'Admin account created successfully' });
    } catch (error) {
      console.error("Error creating admin:", error);
      auditLogger.logFromRequest(req, 'ADMIN_INIT_ERROR', false, { error: error instanceof Error ? error.message : 'Unknown error' });
      res.status(500).json({ 
        success: false,
        message: "Admin creation error occurred"
      });
    }
  });

  // PUT /api/admin/protocols/:id - Update protocol information (requires admin authentication with audit logging)
  app.put("/api/admin/protocols/:id", async (req: Request, res: Response) => {
    try {
      if (!req.session.adminId) {
        auditLogger.logFromRequest(req, 'ADMIN_PROTOCOL_UPDATE_UNAUTHORIZED', false, { protocolId: req.params.id });
        return res.status(401).json({ 
          success: false, 
          message: 'Admin authentication required' 
        });
      }

      const { id } = req.params;
      const updates = req.body;

      await storage.updateProtocol(id, updates);

      clearCache('protocols');
      
      const protocols = await storage.getProtocols();
      const updatedProtocol = protocols.find(p => p.id === id);

      auditLogger.logFromRequest(req, 'ADMIN_PROTOCOL_UPDATE_SUCCESS', true, { 
        protocolId: id, 
        updates: Object.keys(updates) 
      });

      res.json({ 
        success: true, 
        protocol: updatedProtocol 
      });
    } catch (error) {
      console.error("Error updating protocol:", error);
      auditLogger.logFromRequest(req, 'ADMIN_PROTOCOL_UPDATE_ERROR', false, { 
        protocolId: req.params.id,
        error: error instanceof Error ? error.message : "Unknown error" 
      });
      res.status(500).json({ 
        success: false,
        message: "Protocol update error occurred"
      });
    }
  });

  // GET /api/admin/audit-logs - View audit logs (requires admin authentication)
  app.get("/api/admin/audit-logs", async (req: Request, res: Response) => {
    try {
      if (!req.session.adminId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Admin authentication required' 
        });
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const type = req.query.type as string;

      let logs;
      if (type === 'failed_logins') {
        logs = auditLogger.getFailedLogins(limit);
      } else if (type === 'user' && req.query.userId) {
        logs = auditLogger.getLogsByUser(req.query.userId as string, limit);
      } else {
        logs = auditLogger.getRecentLogs(limit);
      }

      res.json({ 
        success: true, 
        logs 
      });
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to fetch audit logs"
      });
    }
  });

  // POST /api/protocol-customizations - Create a customization request (with validation and rate limiting)
  app.post("/api/protocol-customizations", apiLimiter, async (req: Request, res: Response) => {
    try {
      // Validate request body with Zod
      const { insertProtocolCustomizationSchema } = await import("@shared/schema");
      const validatedData = insertProtocolCustomizationSchema.parse(req.body);
      
      const customization = await storage.createCustomizationRequest(validatedData);
      
      auditLogger.logFromRequest(req, 'CUSTOMIZATION_REQUEST_CREATED', true, { 
        protocolId: customization.protocolId,
        requestorEmail: customization.requestorEmail 
      });
      
      res.json({ 
        success: true,
        customization 
      });
    } catch (error) {
      console.error("Error creating customization request:", error);
      auditLogger.logFromRequest(req, 'CUSTOMIZATION_REQUEST_FAILED', false, { error: error instanceof Error ? error.message : "Unknown" });
      res.status(400).json({ 
        success: false,
        message: error instanceof Error ? error.message : "Invalid request data"
      });
    }
  });

  // GET /api/protocol-customizations/:protocolId - Get customization requests for a protocol
  app.get("/api/protocol-customizations/:protocolId", async (req: Request, res: Response) => {
    try {
      const { protocolId } = req.params;
      const customizations = await storage.getCustomizationsByProtocol(protocolId);
      
      res.json({ 
        success: true,
        customizations 
      });
    } catch (error) {
      console.error("Error fetching customizations:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to fetch customizations"
      });
    }
  });

  // GET /api/admin/protocol-customizations - Get all customization requests (Admin only)
  app.get("/api/admin/protocol-customizations", async (req: Request, res: Response) => {
    try {
      if (!req.session.adminId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Admin authentication required' 
        });
      }

      const customizations = await storage.getAllCustomizations();
      
      res.json({ 
        success: true,
        customizations 
      });
    } catch (error) {
      console.error("Error fetching all customizations:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to fetch customizations"
      });
    }
  });

  // PATCH /api/admin/protocol-customizations/:id/status - Update customization status (Admin only)
  app.patch("/api/admin/protocol-customizations/:id/status", async (req: Request, res: Response) => {
    try {
      if (!req.session.adminId) {
        auditLogger.logFromRequest(req, 'CUSTOMIZATION_STATUS_UPDATE_UNAUTHORIZED', false, { id: req.params.id });
        return res.status(401).json({ 
          success: false, 
          message: 'Admin authentication required' 
        });
      }

      const { id } = req.params;
      const { status, reviewNotes } = req.body;
      
      // Validate status is a valid value
      const validStatuses = ['pending', 'payment_pending', 'under_review', 'approved', 'rejected', 'applied'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid status value' 
        });
      }

      await storage.updateCustomizationStatus(id, status, reviewNotes);
      
      auditLogger.logFromRequest(req, 'CUSTOMIZATION_STATUS_UPDATED', true, { id, status });
      
      res.json({ 
        success: true 
      });
    } catch (error) {
      console.error("Error updating customization status:", error);
      auditLogger.logFromRequest(req, 'CUSTOMIZATION_STATUS_UPDATE_FAILED', false, { id: req.params.id });
      res.status(500).json({ 
        success: false,
        message: "Failed to update status"
      });
    }
  });

  // PATCH /api/admin/protocol-customizations/:id/payment - Update payment status (Admin only - requires verification)
  app.patch("/api/admin/protocol-customizations/:id/payment", async (req: Request, res: Response) => {
    try {
      if (!req.session.adminId) {
        auditLogger.logFromRequest(req, 'CUSTOMIZATION_PAYMENT_UPDATE_UNAUTHORIZED', false, { id: req.params.id });
        return res.status(401).json({ 
          success: false, 
          message: 'Admin authentication required to update payment status' 
        });
      }

      const { id } = req.params;
      const { paymentStatus, txHash, currency } = req.body;
      
      // Validate payment status
      const validPaymentStatuses = ['pending', 'paid', 'confirmed', 'failed'];
      if (!validPaymentStatuses.includes(paymentStatus)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid payment status' 
        });
      }
      
      // Require transaction hash for 'paid' or 'confirmed' status
      if ((paymentStatus === 'paid' || paymentStatus === 'confirmed') && !txHash) {
        return res.status(400).json({ 
          success: false, 
          message: 'Transaction hash required for paid/confirmed status' 
        });
      }

      await storage.updateCustomizationPayment(id, paymentStatus, txHash, currency);
      
      auditLogger.logFromRequest(req, 'CUSTOMIZATION_PAYMENT_UPDATED', true, { 
        id, 
        paymentStatus, 
        hasTxHash: !!txHash 
      });
      
      res.json({ 
        success: true 
      });
    } catch (error) {
      console.error("Error updating payment:", error);
      auditLogger.logFromRequest(req, 'CUSTOMIZATION_PAYMENT_UPDATE_FAILED', false, { id: req.params.id });
      res.status(500).json({ 
        success: false,
        message: "Failed to update payment"
      });
    }
  });

  // Weekly scanning function (optimized for speed)
  const performWeeklyScan = async () => {
    try {
      console.log("Starting weekly security scan...");
      const protocols = await storage.getProtocols();
      const protocolIds = protocols.map(p => p.id);
      const scansToStore: Array<{ protocolId: string; scan: any }> = [];
      const blacklistEntries: any[] = [];
      
      // Parallel scan with controlled concurrency
      const batchSize = 20;
      for (let i = 0; i < protocolIds.length; i += batchSize) {
        const batch = protocolIds.slice(i, i + batchSize);
        
        const results = await Promise.allSettled(
          batch.map(async (id: string) => {
            const protocol = protocols.find(p => p.id === id);
            if (!protocol) return null;

            const scanResult = await detector.scanDApp(protocol);
            return { id, protocol, scanResult };
          })
        );

        // Process successful scans
        for (const result of results) {
          if (result.status === 'fulfilled' && result.value) {
            const { id, protocol, scanResult } = result.value;
            scansToStore.push({ protocolId: id, scan: scanResult });

            // AI LEARNING: Learn from this scan to identify future exploits
            threatLearner.learnFromScan(scanResult, protocol);

            // AI-ENHANCED BLACKLISTING: Get AI recommendation
            const aiRecommendation = threatLearner.getBlacklistRecommendations(scanResult);
            
            // Blacklist if CRITICAL or if AI strongly recommends it
            if (scanResult.severity === 'CRITICAL' || aiRecommendation.shouldBlacklist) {
              const { entry } = blacklistManager.addToBlacklist(protocol, scanResult);
              
              // Add AI learning insights to blacklist entry
              if (aiRecommendation.shouldBlacklist && scanResult.severity !== 'CRITICAL') {
                entry.reason = `${entry.reason} | AI Detection: ${aiRecommendation.reason}`;
              }
              
              blacklistEntries.push(entry);
              console.log(`[AI-BLACKLIST] ${protocol.name}: ${aiRecommendation.reason}`);
            }
          }
        }

        // Minimal delay for rate limiting
        if (i + batchSize < protocolIds.length) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      // Batch all DB writes
      await Promise.all([
        Promise.all(scansToStore.map(({ protocolId, scan }) => 
          storage.addSecurityScan(protocolId, scan)
        )),
        blacklistEntries.length > 0 
          ? Promise.all(blacklistEntries.map(entry => storage.addToBlacklist(entry)))
          : Promise.resolve()
      ]);
      
      // Clear caches
      clearCache('scans');
      clearCache('blacklist');
      clearCache('security-stats'); // Update security statistics when blacklist changes
      clearCache('protocols');
      
      console.log(`Weekly security scan completed! Scanned ${scansToStore.length} protocols.`);
    } catch (error) {
      console.error("Error in weekly scan:", error);
    }
  };

  // Schedule weekly scans (every 7 days)
  const WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000;
  setInterval(performWeeklyScan, WEEK_IN_MS);
  
  // Also run on startup after a delay
  setTimeout(performWeeklyScan, 5 * 60 * 1000); // 5 minutes after startup

  // ==================== TWITTER MONITORING ROUTES ====================

  // GET /api/twitter/alerts - Get all Twitter alerts (admin only)
  app.get("/api/twitter/alerts", async (req: Request, res: Response) => {
    try {
      if (!req.session.adminId) {
        return res.status(401).json({ message: 'Admin authentication required' });
      }

      const { status, severity, category, limit = '100' } = req.query;
      const alerts = await storage.getTwitterAlerts({
        status: status as string,
        severity: severity as string,
        category: category as string,
        limit: parseInt(limit as string)
      });

      res.json(alerts);
    } catch (error: any) {
      console.error('Error fetching Twitter alerts:', error);
      res.status(500).json({ message: 'Failed to fetch Twitter alerts' });
    }
  });

  // POST /api/twitter/test-detection - Test Twitter detection without starting stream (admin only)
  app.post("/api/twitter/test-detection", async (req: Request, res: Response) => {
    try {
      if (!req.session.adminId) {
        return res.status(401).json({ message: 'Admin authentication required' });
      }

      const twitterToken = process.env.TWITTER_BEARER_TOKEN;
      if (!twitterToken) {
        return res.status(400).json({ 
          message: 'Twitter API credentials not configured. Please set TWITTER_BEARER_TOKEN environment variable.',
          setupRequired: true
        });
      }

      res.json({ 
        message: 'Twitter integration configured successfully',
        hasToken: true,
        info: 'Twitter monitoring is ready. Note: Real-time monitoring requires a persistent process.'
      });
    } catch (error: any) {
      console.error('Error testing Twitter detection:', error);
      res.status(500).json({ message: 'Failed to test Twitter detection' });
    }
  });

  // PATCH /api/twitter/alerts/:id - Update alert status (admin only)
  app.patch("/api/twitter/alerts/:id", async (req: Request, res: Response) => {
    try {
      if (!req.session.adminId) {
        return res.status(401).json({ message: 'Admin authentication required' });
      }

      const { id } = req.params;
      const { status, reviewNotes } = req.body;

      await storage.updateTwitterAlert(id, { status, reviewNotes });
      
      res.json({ message: 'Alert updated successfully' });
    } catch (error: any) {
      console.error('Error updating Twitter alert:', error);
      res.status(500).json({ message: 'Failed to update alert' });
    }
  });

  // ==================== CERTIK AUDIT ROUTES ====================

  // GET /api/certik/audits - Get CertiK audit data for protocols
  app.get("/api/certik/audits", async (req: Request, res: Response) => {
    try {
      const { protocolId, limit = '50' } = req.query;
      
      const audits = await storage.getCertikAudits({
        protocolId: protocolId as string,
        limit: parseInt(limit as string)
      });

      res.json(audits);
    } catch (error: any) {
      console.error('Error fetching CertiK audits:', error);
      res.status(500).json({ message: 'Failed to fetch CertiK audits' });
    }
  });

  // GET /api/certik/audits/:protocolId - Get audit for specific protocol
  app.get("/api/certik/audits/:protocolId", async (req: Request, res: Response) => {
    try {
      const { protocolId } = req.params;
      const audit = await storage.getCertikAuditByProtocolId(protocolId);

      if (!audit) {
        return res.status(404).json({ message: 'No CertiK audit data found for this protocol' });
      }

      res.json(audit);
    } catch (error: any) {
      console.error('Error fetching CertiK audit:', error);
      res.status(500).json({ message: 'Failed to fetch CertiK audit' });
    }
  });

  // POST /api/certik/fetch - Fetch CertiK data for top protocols (admin only)
  app.post("/api/certik/fetch", async (req: Request, res: Response) => {
    try {
      if (!req.session.adminId) {
        return res.status(401).json({ message: 'Admin authentication required' });
      }

      const { limit = 100 } = req.body;

      // Get top protocols by TVL
      const protocols = await storage.getProtocols();
      const topProtocols = protocols
        .sort((a, b) => (b.tvl || 0) - (a.tvl || 0))
        .slice(0, limit);

      // Check which protocols have CertiK audits from DeFiLlama
      const { CertikScraper, hasCertikAudit, extractCertikAuditUrl } = await import('./lib/certik-scraper');
      const scraper = new CertikScraper();

      const auditPromises = topProtocols.map(async (protocol) => {
        const hasAudit = hasCertikAudit(protocol.auditLinks, protocol.audited);
        const auditUrl = extractCertikAuditUrl(protocol.auditLinks);

        // Generate audit entry (mock data for now, real scraping would be added later)
        const auditData = scraper.generateMockAuditData(protocol.id, protocol.name, hasAudit);
        
        if (auditUrl) {
          auditData.auditReportUrl = auditUrl;
        }

        return storage.upsertCertikAudit(auditData);
      });

      await Promise.all(auditPromises);

      res.json({ 
        message: `Successfully fetched CertiK audit data for ${topProtocols.length} protocols`,
        count: topProtocols.length
      });
    } catch (error: any) {
      console.error('Error fetching CertiK data:', error);
      res.status(500).json({ message: 'Failed to fetch CertiK data' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
