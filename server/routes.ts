import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import crypto from "crypto";
import bcryptjs from "bcryptjs";
import { storage } from "./storage";
import { DAppDiscovery } from "./lib/dapp-discovery";
import { getProtocolSecurityData } from "./lib/protocol-security-aggregator";
import { BlacklistManager } from "./lib/blacklist-manager";
import { auditLogger } from "./lib/audit-logger";
import { threatLearner } from "./lib/threat-pattern-learner";
import { insertProtocolSchema, insertTutorialVideoSchema, insertProtocolSubmissionSchema, insertUserReportSchema, type Protocol } from "@shared/schema";
import { authLimiter, apiLimiter } from "./index";
import { z } from "zod";
import { registerBountyAuditRoutes } from "./routes/bounty-audit-routes";
import { registerChatRoutes } from "./routes/chat-routes";

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
        const allScansRecord = await storage.getAllSecurityScans();
        const protocolsToRescan: string[] = [];
        
        // Identify protocols that might be affected by new patterns
        for (const [protocolId, scan] of Object.entries(allScansRecord)) {
          // Re-scan protocols with HIGH or MEDIUM severity that might have new threats
          if (scan.severity === 'HIGH' || scan.severity === 'MEDIUM') {
            protocolsToRescan.push(protocolId);
          }
        }
        
        if (protocolsToRescan.length > 0) {
          console.log(`[AI-LEARNING] Triggering automatic re-scan of ${protocolsToRescan.length} protocols based on new patterns`);
          
          // Trigger re-scan in background (don't await to avoid blocking)
          const { UnifiedSecurityScanner } = await import('./lib/unified-security-scanner');
          const unifiedScanner = new UnifiedSecurityScanner(storage);
          
          const protocols = await storage.getProtocols();
          const limitedRescan = protocolsToRescan.slice(0, 50); // Limit to 50 for performance
          
          for (const protocolId of limitedRescan) {
            const protocol = protocols.find(p => p.id === protocolId);
            if (!protocol) continue;
            
            try {
              // Re-scan with unified security scanner
              const unifiedResult = await unifiedScanner.scanProtocol(protocol);
              
              const combinedScanResult = {
                isBlacklisted: unifiedResult.isBlacklisted,
                severity: unifiedResult.severity as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW',
                threats: unifiedResult.threats,
                score: unifiedResult.score,
                scannedAt: unifiedResult.scannedAt,
              };
              
              // Store updated scan
              await storage.addSecurityScan(protocolId, combinedScanResult);
              
              // Learn from this re-scan
              await threatLearner.learnFromScan(combinedScanResult, protocol);
              
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
  // Disables ALL caching layers except for specific cacheable API endpoints
  app.use((req, res, next) => {
    // Allow caching for specific API endpoints that implement their own cache strategy
    const cacheableEndpoints = ['/api/threats', '/api/blacklist', '/api/protocols', '/api/scans', '/api/security/stats'];
    const isCacheable = cacheableEndpoints.some(endpoint => req.path.startsWith(endpoint));
    
    if (isCacheable) {
      // Skip no-cache middleware for cacheable endpoints - let them set their own headers
      return next();
    }
    
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

      const { UnifiedSecurityScanner } = await import('./lib/unified-security-scanner');
      const unifiedScanner = new UnifiedSecurityScanner(storage);

      const protocols = await storage.getProtocols();
      const scanResults: Record<string, any> = {};
      const newBlacklistEntries: any[] = [];
      const scansToStore: Array<{ protocolId: string; scan: any }> = [];

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

            // Perform comprehensive unified security scan
            const unifiedResult = await unifiedScanner.scanProtocol(protocol);

            // Convert unified result to legacy format for storage compatibility
            const scanResult = {
              isBlacklisted: unifiedResult.isBlacklisted,
              severity: unifiedResult.severity as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW',
              threats: unifiedResult.threats,
              score: unifiedResult.score,
              scannedAt: unifiedResult.scannedAt,
            };

            return { id, protocol, scanResult, unifiedResult };
          })
        );

        // Process successful scans
        for (const result of results) {
          if (result.status === 'fulfilled' && result.value) {
            const { id, protocol, scanResult, unifiedResult } = result.value;
            scanResults[id] = {
              ...scanResult,
              breakdown: unifiedResult.breakdown,
              recommendations: unifiedResult.recommendations,
              scanDuration: unifiedResult.scanDuration
            };
            scansToStore.push({ protocolId: id, scan: scanResult });

            // AI LEARNING: Learn from this scan
            await threatLearner.learnFromScan(scanResult, protocol);
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
      ]);

      // Invalidate cache after scanning
      clearCache('scans');
      clearCache('blacklist');
      clearCache('protocols'); // Also clear protocols to refresh security scores
      clearCache('security-stats'); // Update security statistics immediately

      res.json({ 
        scanResults,
        newBlacklistEntries: [],
        scannedCount: Object.keys(scanResults).length
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

  // GET /api/threats - Get latest threat detections
  app.get("/api/threats", apiLimiter, async (req, res) => {
    try {
      const { severity, limit = "50" } = req.query;
      
      // Check cache first (2 minute TTL)
      const cacheKey = `threats-${severity || 'all'}-${limit}`;
      const cached = getCache(cacheKey);
      if (cached) {
        res.set('ETag', cached.etag);
        res.set('Content-Type', 'application/json');
        res.set('Cache-Control', 'public, max-age=120, stale-while-revalidate=240');
        
        if (req.headers['if-none-match'] === cached.etag) {
          return res.status(304).end();
        }
        
        return res.send(cached.serialized);
      }

      const limitNum = Math.min(parseInt(limit as string, 10) || 50, 100);
      
      // Fetch both security scans (protocols) and blacklist entries
      const [scansRecord, blacklistEntries] = await Promise.all([
        storage.getAllSecurityScans(),
        storage.getBlacklist()
      ]);

      // Combine and format threat data
      const threats = [];

      // Add protocols with security issues from scans
      const scans = Object.values(scansRecord);
      for (const scan of scans) {
        if (scan.threats && scan.threats.length > 0) {
          threats.push({
            id: scan.protocolId,
            name: scan.protocolName || 'Unknown Protocol',
            type: 'protocol',
            severity: scan.severity,
            threats: scan.threats,
            detectedAt: scan.scannedAt,
            website: null,
            status: scan.isBlacklisted ? 'blacklisted' : 'flagged'
          });
        }
      }

      // Add blacklisted DApps
      for (const entry of blacklistEntries) {
        if (entry.status === 'ACTIVE') {
          threats.push({
            id: entry.id,
            name: entry.dappName,
            type: 'blacklisted_dapp',
            severity: entry.severity,
            threats: entry.threats,
            detectedAt: entry.timestamp,
            website: entry.website,
            status: 'blacklisted'
          });
        }
      }

      // Sort by detection date (newest first)
      threats.sort((a, b) => 
        new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime()
      );

      // Filter by severity if specified
      let filtered = threats;
      if (severity && typeof severity === 'string') {
        const severityUpper = severity.toUpperCase();
        filtered = threats.filter(t => t.severity === severityUpper);
      }

      // Limit results
      const results = filtered.slice(0, limitNum);

      const response = {
        threats: results,
        total: filtered.length,
        showing: results.length,
        filters: {
          severity: severity || 'all',
          limit: limitNum
        }
      };

      setCache(cacheKey, response, 2 * 60 * 1000); // 2 minutes
      
      const cacheEntry = getCache(cacheKey);
      if (cacheEntry) {
        res.set('ETag', cacheEntry.etag);
        res.set('Content-Type', 'application/json');
        res.set('Cache-Control', 'public, max-age=120, stale-while-revalidate=240');
        return res.send(cacheEntry.serialized);
      }
      
      res.json(response);
    } catch (error) {
      console.error("Error fetching threats:", error);
      res.status(500).json({ 
        error: "Failed to fetch threats",
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

      const securityScansRecord = await storage.getAllSecurityScans();
      const protocolsData = await storage.getProtocols();
      
      // Convert security scans from Record to Array
      const securityScansData = Object.entries(securityScansRecord).map(([protocolId, scan]) => ({
        protocolId,
        ...scan
      }));
      
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
        .filter((scan: any) => scan.score <= 40)
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

  // POST /api/protocol-submissions - Submit a new protocol for review
  app.post("/api/protocol-submissions", apiLimiter, async (req, res) => {
    try {
      const validatedData = insertProtocolSubmissionSchema.parse(req.body);
      
      const submission = await storage.createProtocolSubmission(validatedData);
      
      res.json({ 
        success: true, 
        submissionId: submission.id,
        message: "Protocol submitted successfully. Our team will review it shortly." 
      });
    } catch (error) {
      console.error("Error submitting protocol:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation failed",
          details: error.errors
        });
      }
      res.status(500).json({ 
        error: "Failed to submit protocol",
        message: "Please try again later"
      });
    }
  });

  // GET /api/protocol-submissions - Get all protocol submissions (admin only)
  app.get("/api/protocol-submissions", async (req, res) => {
    try {
      if (!req.session?.user?.id) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const status = req.query.status as string | undefined;
      const submissions = await storage.getProtocolSubmissions(status);
      
      res.json(submissions);
    } catch (error) {
      console.error("Error fetching submissions:", error);
      res.status(500).json({ 
        error: "Failed to fetch submissions",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // PATCH /api/protocol-submissions/:id - Update submission status (admin only)
  app.patch("/api/protocol-submissions/:id", async (req, res) => {
    try {
      if (!req.session?.user?.id) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { id } = req.params;
      const { status, adminNotes } = req.body;

      if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      const updated = await storage.updateProtocolSubmission(id, {
        status,
        adminNotes,
        reviewedBy: req.session.user.username,
        reviewedAt: new Date().toISOString(),
      });

      if (!updated) {
        return res.status(404).json({ error: "Submission not found" });
      }

      if (status === 'approved') {
        try {
          const protocolId = `submission-${id}`;
          await storage.createProtocol({
            id: protocolId,
            name: updated.protocolName,
            website: updated.website,
            chains: updated.chains,
            category: updated.category,
            description: updated.description,
            logo: updated.logo || null,
            twitter: updated.twitter || null,
            github: updated.github || null,
            tvl: 0,
            volume24h: 0,
            change24h: 0,
            securityScore: 0,
            audited: (updated.auditLinks && updated.auditLinks.length > 0) || false,
            auditCount: updated.auditLinks?.length || 0,
            auditLinks: updated.auditLinks || [],
            autoDiscovered: false,
            manuallyAdded: true,
            contractAddress: updated.contractAddresses 
              ? Object.values(updated.contractAddresses)[0] 
              : null,
            contractChain: updated.contractAddresses 
              ? Object.keys(updated.contractAddresses)[0] 
              : null,
            auditNote: null,
            age: null,
            sponsoredUntil: null,
            sponsorshipTier: 'free',
            featuredPosition: null,
            defiSecurityScore: null,
            defiAuditReports: null,
            defiHasMultisig: null,
            defiHasTimelock: null,
            defiDataFetchedAt: null,
            dailyActiveWallets: 0,
            weeklyActiveWallets: 0,
            monthlyActiveWallets: 0,
            transactions24h: 0,
            transactions7d: 0,
            contractCalls24h: 0,
            activityHistory: null,
            rankByActivity: null,
            rankByTvl: null,
            rankByVolume: null,
          });

          console.log(`✅ Created protocol ${protocolId} from approved submission ${id}`);
        } catch (createError) {
          console.error("Error creating protocol from submission:", createError);
        }
      }

      res.json({ success: true, submission: updated });
    } catch (error) {
      console.error("Error updating submission:", error);
      res.status(500).json({ 
        error: "Failed to update submission",
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

      // Get newly discovered protocols and filter out test/scam protocols
      const allNewProtocols = await storage.getProtocolsByDiscoveryDate(100);
      
      // Filter: Only show auto-discovered protocols OR manually added ones with decent TVL
      // This excludes test scam protocols (manually added with $0 TVL)
      const protocols = allNewProtocols
        .filter(p => p.autoDiscovered || (p.tvl > 100000)) // $100k+ TVL for manual entries
        .slice(0, 50); // Limit to 50
      
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

  // GET /api/protocols/:id - Fetch a single protocol by ID (MUST be after /new and /trending)
  app.get("/api/protocols/:id", apiLimiter, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Try cache first
      const cacheKey = `protocol-${id}`;
      const cached = getCache(cacheKey);
      if (cached) {
        return res.json(cached.data);
      }
      
      // Get from database
      const protocol = await storage.getProtocol(id);
      
      if (!protocol) {
        return res.status(404).json({ 
          error: "Protocol not found",
          message: `Protocol with ID "${id}" does not exist`
        });
      }
      
      // Cache for 5 minutes
      setCache(cacheKey, protocol, 5 * 60 * 1000);
      
      res.json(protocol);
    } catch (error) {
      console.error(`Error fetching protocol ${req.params.id}:`, error);
      res.status(500).json({ 
        error: "Failed to fetch protocol",
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
            await threatLearner.learnFromScan(scanResult, protocol);

            // Auto-flagging disabled: protocols are flagged manually by admins only
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

  // GET /api/reports/top-300-security-pdf - Generate PDF report of top 300 protocols by security ranking
  app.get("/api/reports/top-300-security-pdf", async (req: Request, res: Response) => {
    try {
      console.log('[PDF-REPORT] Generating top 300 protocols security report...');

      // Query top 300 protocols by security ranking
      const protocols = await storage.getProtocols();
      const scans = await storage.getAllSecurityScans();

      // Combine protocol and scan data
      interface ProtocolWithScan {
        id: string;
        name: string;
        tvl: number;
        category: string;
        chains: string[];
        website: string;
        twitter?: string | null;
        github?: string | null;
        score: number;
        severity: string;
        threats: any[];
        scanned_at: Date;
        is_blacklisted: boolean;
      }

      const protocolsWithScans: ProtocolWithScan[] = protocols
        .filter(p => scans[p.id])
        .map(p => ({
          id: p.id,
          name: p.name,
          tvl: p.tvl || 0,
          category: p.category || 'Unknown',
          chains: Array.isArray(p.chains) ? p.chains : [],
          website: p.website || '',
          twitter: p.twitter || undefined,
          github: p.github || undefined,
          score: scans[p.id].score,
          severity: scans[p.id].severity,
          threats: scans[p.id].threats || [],
          scanned_at: new Date(scans[p.id].scannedAt),
          is_blacklisted: scans[p.id].isBlacklisted,
        }));

      // Sort by security ranking
      const severityOrder: Record<string, number> = {
        'SAFE': 1,
        'LOW': 2,
        'MEDIUM': 3,
        'HIGH': 4,
        'CRITICAL': 5,
      };

      protocolsWithScans.sort((a, b) => {
        const severityDiff = (severityOrder[a.severity] || 99) - (severityOrder[b.severity] || 99);
        if (severityDiff !== 0) return severityDiff;
        
        const scoreDiff = a.score - b.score;
        if (scoreDiff !== 0) return scoreDiff;
        
        return (b.tvl || 0) - (a.tvl || 0);
      });

      // Get top 300
      const top300 = protocolsWithScans.slice(0, 300);

      console.log(`[PDF-REPORT] Found ${top300.length} protocols for report`);

      // Generate PDF
      const { PDFReportGenerator } = await import('./lib/pdf-report-generator');
      const generator = new PDFReportGenerator();

      // Set response headers
      const filename = `JERUSALEM_DeFi_Top_300_Security_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      // Generate and stream PDF
      await generator.generateReport(top300, res);

      console.log('[PDF-REPORT] Report generated successfully');
    } catch (error: any) {
      console.error('[PDF-REPORT] Error generating report:', error);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Failed to generate PDF report' });
      }
    }
  });

  // ========== PHASE 4: COMMUNITY REPORTING ROUTES ==========
  
  // Submit a new user report
  app.post('/api/reports', apiLimiter, async (req: Request, res: Response) => {
    try {
      const validatedData = insertUserReportSchema.parse(req.body);
      
      const report = await storage.createUserReport(validatedData);
      
      // Update user reputation
      if (validatedData.reporterEmail) {
        const reputation = await storage.getUserReputation(validatedData.reporterEmail);
        const newReportsCount = (reputation?.reportsSubmitted || 0) + 1;
        
        await storage.updateUserReputation(validatedData.reporterEmail, {
          reportsSubmitted: newReportsCount,
          reputationScore: (reputation?.reputationScore || 0) + 5, // +5 points for submitting
        });
      }
      
      auditLogger.log({
        action: 'user_report_created',
        details: `User report created: ${report.id} - ${report.title}`,
        severity: 'info',
      });
      
      res.status(201).json(report);
    } catch (error: any) {
      console.error('[API] Error creating user report:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid report data', details: error.errors });
      } else {
        res.status(500).json({ error: 'Failed to create report' });
      }
    }
  });
  
  // Get all user reports with filtering
  app.get('/api/reports', async (req: Request, res: Response) => {
    try {
      const status = req.query.status as string | undefined;
      const reportType = req.query.reportType as string | undefined;
      const limit = parseInt(req.query.limit as string) || 50;
      
      const reports = await storage.getUserReports({ status, reportType, limit });
      
      res.json({ reports, total: reports.length });
    } catch (error) {
      console.error('[API] Error fetching user reports:', error);
      res.status(500).json({ error: 'Failed to fetch reports' });
    }
  });
  
  // Get a specific user report
  app.get('/api/reports/:id', async (req: Request, res: Response) => {
    try {
      const report = await storage.getUserReportById(req.params.id);
      
      if (!report) {
        return res.status(404).json({ error: 'Report not found' });
      }
      
      res.json(report);
    } catch (error) {
      console.error('[API] Error fetching report:', error);
      res.status(500).json({ error: 'Failed to fetch report' });
    }
  });
  
  // Vote on a report
  app.post('/api/reports/:id/vote', apiLimiter, async (req: Request, res: Response) => {
    try {
      const { voteType } = req.body;
      
      if (!voteType || (voteType !== 'upvote' && voteType !== 'downvote')) {
        return res.status(400).json({ error: 'Invalid vote type' });
      }
      
      // Use IP as voter identifier (with UUID fallback)
      const voterSessionId = req.ip || crypto.randomUUID();
      
      await storage.voteOnReport(req.params.id, voterSessionId, voteType);
      
      // Get updated report
      const report = await storage.getUserReportById(req.params.id);
      
      res.json({ 
        success: true, 
        upvotes: report?.upvotes || 0,
        downvotes: report?.downvotes || 0,
      });
    } catch (error) {
      console.error('[API] Error voting on report:', error);
      res.status(500).json({ error: 'Failed to vote on report' });
    }
  });
  
  // Remove vote from report
  app.delete('/api/reports/:id/vote', apiLimiter, async (req: Request, res: Response) => {
    try {
      const voterSessionId = req.ip || crypto.randomUUID();
      
      await storage.removeVoteFromReport(req.params.id, voterSessionId);
      
      // Get updated report
      const report = await storage.getUserReportById(req.params.id);
      
      res.json({ 
        success: true, 
        upvotes: report?.upvotes || 0,
        downvotes: report?.downvotes || 0,
      });
    } catch (error) {
      console.error('[API] Error removing vote:', error);
      res.status(500).json({ error: 'Failed to remove vote' });
    }
  });
  
  // Update report status (admin only)
  app.patch('/api/reports/:id/status', async (req: Request, res: Response) => {
    try {
      if (!req.session?.user?.isAdmin) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
      
      const { status, adminNotes } = req.body;
      
      if (!status) {
        return res.status(400).json({ error: 'Status is required' });
      }
      
      await storage.updateUserReportStatus(req.params.id, status, adminNotes);
      
      auditLogger.log({
        action: 'user_report_status_updated',
        adminId: req.session.user.id,
        adminUsername: req.session.user.username,
        details: `Report ${req.params.id} status updated to ${status}`,
        severity: 'info',
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error('[API] Error updating report status:', error);
      res.status(500).json({ error: 'Failed to update report status' });
    }
  });
  
  // Verify a report (admin only)
  app.patch('/api/reports/:id/verify', async (req: Request, res: Response) => {
    try {
      if (!req.session?.user?.isAdmin) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
      
      const report = await storage.getUserReportById(req.params.id);
      
      if (!report) {
        return res.status(404).json({ error: 'Report not found' });
      }
      
      await storage.verifyUserReport(req.params.id, req.session.user.username);
      
      // Update reporter reputation
      if (report.reporterEmail) {
        const reputation = await storage.getUserReputation(report.reporterEmail);
        await storage.updateUserReputation(report.reporterEmail, {
          reportsVerified: (reputation?.reportsVerified || 0) + 1,
          reputationScore: (reputation?.reputationScore || 0) + 20, // +20 points for verified report
        });
      }
      
      auditLogger.log({
        action: 'user_report_verified',
        adminId: req.session.user.id,
        adminUsername: req.session.user.username,
        details: `Report ${req.params.id} verified`,
        severity: 'info',
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error('[API] Error verifying report:', error);
      res.status(500).json({ error: 'Failed to verify report' });
    }
  });


  // GET /api/protocols/:id/security - Hacks + bug bounty aggregated security data
  app.get("/api/protocols/:id/security", apiLimiter, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const protocol = await storage.getProtocol(id);
      if (!protocol) {
        return res.status(404).json({ message: "Protocol not found" });
      }
      const data = await getProtocolSecurityData(protocol.name);
      res.json(data);
    } catch (error) {
      console.error("[SECURITY-AGG] Error:", error);
      res.status(500).json({ message: "Failed to fetch security data" });
    }
  });

  // GET /api/protocols/:id/score-report.pdf — Downloadable DFJ scoring breakdown
  app.get("/api/protocols/:id/score-report.pdf", apiLimiter, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const protocol = await storage.getProtocol(id);
      if (!protocol) return res.status(404).json({ message: "Protocol not found" });

      const { calculateFoundationScore } = await import('./lib/security-verification');
      const { UnifiedSecurityScanner } = await import('./lib/unified-security-scanner');
      const PDFDocument = (await import('pdfkit')).default;

      // Compute DFJ breakdown
      const { score: foundationScore, breakdown: fb, indicators } = calculateFoundationScore(protocol);
      const scanner = new UnifiedSecurityScanner(storage);
      const result = await scanner.scanProtocol(protocol as any);
      const { breakdown: ab, score, severity, threats, recommendations } = result;

      const doc = new PDFDocument({ size: 'A4', margins: { top: 50, bottom: 50, left: 50, right: 50 } });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="DFJ-Score-${protocol.name.replace(/[^a-z0-9]/gi, '-')}.pdf"`);
      doc.pipe(res);

      const GOLD = '#F59E0B';
      const DARK = '#111827';
      const MUTED = '#6B7280';
      const GREEN = '#10B981';
      const RED = '#EF4444';
      const ORANGE = '#F97316';
      const YELLOW = '#EAB308';
      const BLUE = '#3B82F6';

      const severityColor = severity === 'SAFE' ? GREEN : severity === 'LOW' ? BLUE : severity === 'MEDIUM' ? YELLOW : severity === 'HIGH' ? ORANGE : RED;
      const fmtTVL = (n: number) => n >= 1e9 ? `${(n/1e9).toFixed(2)}B` : n >= 1e6 ? `${(n/1e6).toFixed(2)}M` : n >= 1e3 ? `${(n/1e3).toFixed(2)}K` : `${n}`;

      // ── Header ──────────────────────────────────────────────────────────
      doc.rect(0, 0, doc.page.width, 80).fill(DARK);
      doc.fontSize(20).font('Helvetica-Bold').fillColor(GOLD).text('DeFiJerusalem', 50, 22);
      doc.fontSize(9).font('Helvetica').fillColor(MUTED).text('DFJ Security Score Report · v2.3 Methodology', 50, 48);
      doc.fontSize(9).fillColor(MUTED).text(new Date().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' }), 50, 60);

      // ── Protocol identity ────────────────────────────────────────────────
      let y = 100;
      doc.fontSize(22).font('Helvetica-Bold').fillColor(DARK).text(protocol.name, 50, y);
      y += 30;
      doc.fontSize(10).font('Helvetica').fillColor(MUTED).text(`${protocol.category}  ·  TVL ${fmtTVL(protocol.tvl)}  ·  ${(protocol.chains ?? []).slice(0,5).join(', ')}`, 50, y);
      y += 15;
      if (protocol.website) doc.fontSize(9).fillColor(BLUE).text(protocol.website, 50, y, { link: protocol.website });
      y += 25;

      // ── Score hero ───────────────────────────────────────────────────────
      doc.roundedRect(50, y, doc.page.width - 100, 70, 8).fill('#F9FAFB').stroke('#E5E7EB');
      doc.fontSize(42).font('Helvetica-Bold').fillColor(severityColor).text(score.toFixed(0), 70, y + 10);
      doc.fontSize(14).font('Helvetica').fillColor(MUTED).text('/ 97', 70 + 65, y + 24);
      doc.fontSize(18).font('Helvetica-Bold').fillColor(severityColor).text(severity, 200, y + 18);
      doc.fontSize(9).font('Helvetica').fillColor(MUTED).text('Higher is safer  ·  DFJ v2.3 Methodology', 200, y + 44);
      y += 85;

      // ── Score bar ────────────────────────────────────────────────────────
      const barW = doc.page.width - 100;
      doc.rect(50, y, barW, 8).fill('#E5E7EB');
      doc.rect(50, y, Math.max(4, (score / 97) * barW), 8).fill(severityColor);
      y += 22;

      // ── Section helper ───────────────────────────────────────────────────
      const section = (title: string) => {
        doc.fontSize(11).font('Helvetica-Bold').fillColor(DARK).text(title, 50, y);
        y += 5;
        doc.moveTo(50, y).lineTo(doc.page.width - 50, y).strokeColor('#E5E7EB').stroke();
        y += 10;
      };

      const row = (label: string, pts: number, max: number, indent = 0) => {
        const pct = max > 0 ? pts / max : 0;
        const color = pct >= 0.75 ? GREEN : pct >= 0.5 ? YELLOW : pct >= 0.25 ? ORANGE : RED;
        doc.fontSize(9).font('Helvetica').fillColor(DARK).text(label, 50 + indent, y, { width: 280 });
        doc.font('Helvetica-Bold').fillColor(color).text(`${pts.toFixed(1)} / ${max}`, doc.page.width - 150, y, { width: 100, align: 'right' });
        y += 14;
      };

      // ── Foundation ───────────────────────────────────────────────────────
      section('FOUNDATION  (what they built)  —  ' + fb.total.toFixed(1) + ' / 45');
      row('F1  Audit & Verification', fb.auditVerification, 18);
      row('F2  Code & Contract History', fb.codeContractHistory, 12);
      row('F3  Track Record', fb.trackRecord, 10);
      row('F4  Documentation', fb.documentation, 3);
      row('F5  Historical Governance', fb.historicalGovernance, 2);
      y += 6;

      // ── Active ───────────────────────────────────────────────────────────
      section('ACTIVE  (how they protect now)  —  ' + ab.activeTotal.toFixed(1) + ' / 55');
      row('A1  Security Infrastructure', ab.securityInfrastructure, 22);
      row('A2  Incident Response', ab.incidentResponse, 15);
      row('A3  Proactive Monitoring', ab.proactiveMonitoring, 7);
      row('A4  Economic Health', ab.economicHealth, 6);
      row('A5  Live Governance', ab.liveGovernance, 3);
      row('A6  Ongoing Vigilance', ab.ongoingVigilance, 2);
      y += 6;

      // ── Gross + penalties ────────────────────────────────────────────────
      section('SCORE CALCULATION');
      doc.fontSize(9).font('Helvetica').fillColor(DARK).text('Gross Score (Foundation + Active)', 50, y, { width: 280 });
      doc.font('Helvetica-Bold').fillColor(DARK).text(ab.grossScore.toFixed(1) + ' / 100', doc.page.width - 150, y, { width: 100, align: 'right' });
      y += 14;
      doc.fontSize(9).font('Helvetica').fillColor(RED).text('Penalties applied', 50, y, { width: 280 });
      doc.font('Helvetica-Bold').fillColor(RED).text('− ' + ab.totalPenalty.toFixed(1) + ' / 30', doc.page.width - 150, y, { width: 100, align: 'right' });
      y += 14;
      doc.moveTo(doc.page.width - 200, y).lineTo(doc.page.width - 50, y).strokeColor('#D1D5DB').stroke();
      y += 6;
      doc.fontSize(11).font('Helvetica-Bold').fillColor(severityColor).text('Final DFJ Score', 50, y, { width: 280 });
      doc.fillColor(severityColor).text(score.toFixed(1) + ' / 97', doc.page.width - 150, y, { width: 100, align: 'right' });
      y += 20;

      // ── Security indicators ──────────────────────────────────────────────
      if (y > 680) { doc.addPage(); y = 50; }
      section('SECURITY INDICATORS');
      const indicators2 = [
        ['Audited', indicators.hasAudit],
        ['Reputable Audit Firm', indicators.reputableAuditFirm],
        ['Formal Verification', indicators.formalVerification],
        ['Open Source', indicators.hasOpenSource],
        ['Multisig', indicators.hasMultisig],
        ['Timelock', indicators.hasTimelock],
        ['Bug Bounty', indicators.hasBugBounty],
        ['Active Community', indicators.activeCommunity],
      ] as [string, boolean][];
      const colW = (doc.page.width - 100) / 2;
      indicators2.forEach(([label, val], i) => {
        const col = i % 2;
        const xOff = 50 + col * colW;
        if (col === 0 && i > 0) y += 14;
        doc.fontSize(9).font('Helvetica').fillColor(val ? GREEN : MUTED)
          .text(val ? '✓' : '✗', xOff, y, { width: 16 });
        doc.fillColor(DARK).text(label, xOff + 16, y, { width: colW - 20 });
        if (col === 1 || i === indicators2.length - 1) {}
      });
      y += 22;

      // ── Threats detected ─────────────────────────────────────────────────
      if (threats.length > 0) {
        if (y > 650) { doc.addPage(); y = 50; }
        section(`THREATS DETECTED  (${threats.length})`);
        for (const t of threats.slice(0, 8)) {
          const tc = t.severity === 'CRITICAL' ? RED : t.severity === 'HIGH' ? ORANGE : YELLOW;
          doc.fontSize(8).font('Helvetica-Bold').fillColor(tc).text(`[${t.severity}]`, 50, y, { width: 70 });
          doc.font('Helvetica').fillColor(DARK).text(t.message, 120, y, { width: doc.page.width - 170 });
          y += 13;
          if (y > 750) { doc.addPage(); y = 50; }
        }
        if (threats.length > 8) {
          doc.fontSize(8).fillColor(MUTED).text(`… and ${threats.length - 8} more`, 50, y);
          y += 13;
        }
        y += 6;
      }

      // ── Recommendations ──────────────────────────────────────────────────
      if (recommendations.length > 0) {
        if (y > 650) { doc.addPage(); y = 50; }
        section('RECOMMENDATIONS');
        for (const r of recommendations) {
          doc.fontSize(8).font('Helvetica').fillColor(DARK).text('• ' + r, 50, y, { width: doc.page.width - 100 });
          y += 13;
          if (y > 750) { doc.addPage(); y = 50; }
        }
        y += 6;
      }

      // ── Footer ───────────────────────────────────────────────────────────
      doc.fontSize(7).font('Helvetica').fillColor(MUTED)
        .text('This report is generated automatically using on-chain and off-chain data. It is for informational purposes only and does not constitute financial advice. DeFiJerusalem · defijerusalem.com', 50, doc.page.height - 40, { align: 'center', width: doc.page.width - 100 });

      doc.end();
    } catch (error) {
      console.error("[SCORE-REPORT] Error:", error);
      if (!res.headersSent) res.status(500).json({ message: "Failed to generate report" });
    }
  });

  // GET /api/hacks - All known DeFi hacks from DeFiLlama
  app.get("/api/hacks", apiLimiter, async (req: Request, res: Response) => {
    try {
      const { fetchAllHacks } = await import("./lib/protocol-security-aggregator");
      const hacks = await fetchAllHacks();
      // Sort most recent first
      hacks.sort((a, b) => b.date.localeCompare(a.date));
      res.json(hacks);
    } catch (error) {
      console.error("[HACKS] Error:", error);
      res.status(500).json({ message: "Failed to fetch hacks" });
    }
  });

  // GET /api/bug-bounties - All Immunefi bug bounty programs
  app.get("/api/bug-bounties", apiLimiter, async (req: Request, res: Response) => {
    try {
      const { fetchBugBounties } = await import("./lib/protocol-security-aggregator");
      const bounties = await fetchBugBounties();
      bounties.sort((a, b) => b.maxBounty - a.maxBounty);
      res.json(bounties);
    } catch (error) {
      console.error("[BOUNTIES] Error:", error);
      res.status(500).json({ message: "Failed to fetch bug bounties" });
    }
  });

  // Bounty system + audit firm pipeline
  registerBountyAuditRoutes(app);

  // AI agent chat
  registerChatRoutes(app);

  const httpServer = createServer(app);
  return httpServer;
}
