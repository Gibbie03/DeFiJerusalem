import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { DAppDiscovery } from "./lib/dapp-discovery";
import { WalletDrainerDetector } from "./lib/wallet-drainer-detector";
import { BlacklistManager } from "./lib/blacklist-manager";
import { insertProtocolSchema } from "@shared/schema";

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

  // GET /api/protocols - Fetch and discover protocols from DeFiLlama
  app.get("/api/protocols", async (req, res) => {
    try {
      const protocols = await discovery.fetchFromMultipleSources();
      
      // Store protocols in memory
      for (const protocol of protocols) {
        await storage.addProtocol(protocol);
      }

      res.json(protocols);
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
      const validatedData = insertProtocolSchema.parse(req.body);
      
      // Create manual protocol with unique ID
      const manualProtocol = {
        ...validatedData,
        id: `manual-${Date.now()}-${Math.random()}`,
        manuallyAdded: true,
        autoDiscovered: false,
        tvl: validatedData.tvl || 0,
        change24h: validatedData.change24h || 0,
        securityScore: validatedData.securityScore || 50,
        age: validatedData.age || 0,
      };

      const protocol = await storage.addProtocol(manualProtocol);
      res.json(protocol);
    } catch (error) {
      console.error("Error adding manual protocol:", error);
      res.status(400).json({ 
        error: "Invalid protocol data",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // POST /api/scan - Perform security scan on protocols
  app.post("/api/scan", async (req, res) => {
    try {
      const { protocolIds } = req.body;

      if (!Array.isArray(protocolIds)) {
        return res.status(400).json({ error: "protocolIds must be an array" });
      }

      const protocols = await storage.getProtocols();
      const scanResults: Record<string, any> = {};
      const newBlacklistEntries = [];

      // Batch scan protocols
      const batchSize = 10;
      for (let i = 0; i < Math.min(protocolIds.length, 100); i += batchSize) {
        const batch = protocolIds.slice(i, i + batchSize);
        
        await Promise.all(
          batch.map(async (id: string) => {
            const protocol = protocols.find(p => p.id === id);
            if (!protocol) return;

            const scanResult = await detector.scanDApp(protocol);
            scanResults[id] = scanResult;
            
            // Store scan result
            await storage.addSecurityScan(id, scanResult);

            // Add to blacklist if critical
            if (scanResult.severity === 'CRITICAL') {
              const { entry, updatedList } = blacklistManager.addToBlacklist(protocol, scanResult);
              await storage.addToBlacklist(entry);
              newBlacklistEntries.push(entry);
            }
          })
        );

        // Delay between batches
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

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

  // GET /api/blacklist - Get all blacklist entries
  app.get("/api/blacklist", async (req, res) => {
    try {
      const blacklist = await storage.getBlacklist();
      res.json(blacklist);
    } catch (error) {
      console.error("Error fetching blacklist:", error);
      res.status(500).json({ 
        error: "Failed to fetch blacklist",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
