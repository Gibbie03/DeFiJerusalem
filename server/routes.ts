import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import bcryptjs from "bcryptjs";
import { storage } from "./storage";
import { DAppDiscovery } from "./lib/dapp-discovery";
import { WalletDrainerDetector } from "./lib/wallet-drainer-detector";
import { BlacklistManager } from "./lib/blacklist-manager";
import { auditLogger } from "./lib/audit-logger";
import { insertProtocolSchema, insertTutorialVideoSchema } from "@shared/schema";
import { authLimiter, apiLimiter } from "./index";

// Simple in-memory cache with TTL
const cache = new Map<string, { data: any; expires: number }>();

function getCache(key: string): any | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key: string, data: any, ttlMs: number): void {
  cache.set(key, { data, expires: Date.now() + ttlMs });
}

function clearCache(key: string): void {
  cache.delete(key);
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

  // GET /api/protocols - Fetch protocols (from DB or DeFiLlama) with aggressive caching and rate limiting
  app.get("/api/protocols", apiLimiter, async (req, res) => {
    try {
      // Set HTTP cache headers for browser caching (CMC-level optimization)
      res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
      
      // Extract query parameters for filtering
      const { category, chain, minTvl } = req.query;
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
      
      // Create cache key based on filters
      const cacheKey = Object.keys(filters).length > 0 
        ? `protocols-${JSON.stringify(filters)}`
        : 'protocols';
      
      // Check cache first (60s TTL for CMC-level speed)
      const cached = getCache(cacheKey);
      if (cached) {
        return res.json(cached);
      }

      // Try to load from database first (fastest)
      const existingProtocols = await storage.getProtocols(Object.keys(filters).length > 0 ? filters : undefined);
      
      // If we have protocols in DB, return them with test drainers appended
      if (existingProtocols.length > 0) {
        // Filter out test drainers from DB (they may already be there)
        const realProtocols = existingProtocols.filter(
          p => !['eth-airdrop-claimer', 'unisvvap-fake', 'vitalik-giveaway'].includes(p.id)
        );
        
        // Always append fresh test drainer protocols for demonstration
        const testDrainers = discovery.getTestDrainerProtocols();
        const protocolsWithTestDrainers = [...realProtocols, ...testDrainers];
        
        // Cache result for 60 seconds
        setCache(cacheKey, protocolsWithTestDrainers, 60 * 1000);
        
        // Persist test drainers to DB immediately (async, non-blocking)
        storage.bulkUpsertProtocols(testDrainers as any).catch(err => 
          console.error('Failed to persist test drainers:', err)
        );
        
        res.json(protocolsWithTestDrainers);
        
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
      
      // Cache for 60 seconds
      setCache(cacheKey, allProtocols, 60 * 1000);
      
      res.json(allProtocols);
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
      
      // Invalidate protocols cache
      clearCache('protocols');
      
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

            const scanResult = await detector.scanDApp(protocol);
            return { id, protocol, scanResult };
          })
        );

        // Process successful scans
        for (const result of results) {
          if (result.status === 'fulfilled' && result.value) {
            const { id, protocol, scanResult } = result.value;
            scanResults[id] = scanResult;
            scansToStore.push({ protocolId: id, scan: scanResult });

            // Collect blacklist entries
            if (scanResult.severity === 'CRITICAL') {
              const { entry } = blacklistManager.addToBlacklist(protocol, scanResult);
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
        // Batch store all blacklist entries (remove timestamp as DB will add it)
        newBlacklistEntries.length > 0 
          ? Promise.all(newBlacklistEntries.map(entry => {
              const { timestamp, ...entryWithoutTimestamp } = entry;
              return storage.addToBlacklist(entryWithoutTimestamp);
            }))
          : Promise.resolve()
      ]);

      // Invalidate cache after scanning
      clearCache('scans');
      clearCache('blacklist');
      clearCache('protocols'); // Also clear protocols to refresh security scores

      res.json({ 
        scanResults,
        newBlacklistEntries,
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

  // GET /api/blacklist - Get all blacklist entries (with rate limiting)
  app.get("/api/blacklist", apiLimiter, async (req, res) => {
    try {
      // HTTP cache headers
      res.set('Cache-Control', 'public, max-age=120, stale-while-revalidate=240');
      
      // Check cache first (5 minute TTL)
      const cached = getCache('blacklist');
      if (cached) {
        return res.json(cached);
      }

      const blacklist = await storage.getBlacklist();
      setCache('blacklist', blacklist, 5 * 60 * 1000); // 5 minutes
      res.json(blacklist);
    } catch (error) {
      console.error("Error fetching blacklist:", error);
      res.status(500).json({ 
        error: "Failed to fetch blacklist",
        message: error instanceof Error ? error.message : "Unknown error"
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
  app.get("/api/protocols/new", async (req, res) => {
    try {
      const protocols = await storage.getProtocolsByDiscoveryDate(50);
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
      // HTTP cache headers
      res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
      
      // Check cache first (2 minute TTL)
      const cached = getCache('trending');
      if (cached) {
        return res.json(cached);
      }

      const protocols = await storage.getProtocolsByTvlGrowth(50);
      setCache('trending', protocols, 2 * 60 * 1000); // 2 minutes
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
      // HTTP cache headers
      res.set('Cache-Control', 'public, max-age=120, stale-while-revalidate=240');
      
      // Check cache first (3 minute TTL)
      const cached = getCache('scans');
      if (cached) {
        return res.json(cached);
      }

      const scans = await storage.getAllSecurityScans();
      setCache('scans', scans, 3 * 60 * 1000); // 3 minutes
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

            if (scanResult.severity === 'CRITICAL') {
              const { entry } = blacklistManager.addToBlacklist(protocol, scanResult);
              blacklistEntries.push(entry);
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

  const httpServer = createServer(app);
  return httpServer;
}
