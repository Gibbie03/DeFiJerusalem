import type { Protocol, BlacklistEntry, SecurityScan, TutorialVideo, InsertProtocol, InsertTutorialVideo } from "@shared/schema";
import { protocols, securityScans, blacklistEntries, tutorialVideos } from "@shared/schema";
import { db } from "./db";
import { eq, desc, gt } from "drizzle-orm";

export interface IStorage {
  getProtocols(): Promise<Protocol[]>;
  addProtocol(protocol: InsertProtocol): Promise<Protocol>;
  getBlacklist(): Promise<BlacklistEntry[]>;
  addToBlacklist(entry: Omit<BlacklistEntry, 'timestamp'>): Promise<BlacklistEntry>;
  getSecurityScan(protocolId: string): Promise<SecurityScan | undefined>;
  getAllSecurityScans(): Promise<Record<string, SecurityScan>>;
  addSecurityScan(protocolId: string, scan: SecurityScan): Promise<void>;
  getTutorials(): Promise<TutorialVideo[]>;
  addTutorial(tutorial: InsertTutorialVideo): Promise<TutorialVideo>;
  getProtocolsByDiscoveryDate(limit?: number): Promise<Protocol[]>;
  getProtocolsByTvlGrowth(limit?: number): Promise<Protocol[]>;
}

export class DatabaseStorage implements IStorage {
  async getProtocols(): Promise<Protocol[]> {
    const result = await db.select().from(protocols).orderBy(desc(protocols.tvl));
    return result.map(p => ({
      id: p.id,
      name: p.name,
      chains: p.chains,
      category: p.category,
      tvl: p.tvl,
      change24h: p.change24h,
      age: p.age,
      audited: p.audited,
      securityScore: p.securityScore,
      logo: p.logo,
      website: p.website,
      twitter: p.twitter,
      github: p.github,
      description: p.description,
      autoDiscovered: p.autoDiscovered,
      manuallyAdded: p.manuallyAdded,
    }));
  }

  async addProtocol(protocol: InsertProtocol): Promise<Protocol> {
    const [result] = await db
      .insert(protocols)
      .values([protocol])
      .onConflictDoUpdate({
        target: protocols.id,
        set: {
          tvl: protocol.tvl,
          change24h: protocol.change24h,
          securityScore: protocol.securityScore,
          lastUpdated: new Date(),
        },
      })
      .returning();
    
    return {
      id: result.id,
      name: result.name,
      chains: result.chains,
      category: result.category,
      tvl: result.tvl,
      change24h: result.change24h,
      age: result.age,
      audited: result.audited,
      securityScore: result.securityScore,
      logo: result.logo,
      website: result.website,
      twitter: result.twitter,
      github: result.github,
      description: result.description,
      autoDiscovered: result.autoDiscovered,
      manuallyAdded: result.manuallyAdded,
    };
  }

  async getBlacklist(): Promise<BlacklistEntry[]> {
    const result = await db.select().from(blacklistEntries).orderBy(desc(blacklistEntries.timestamp));
    return result.map(entry => ({
      id: entry.id,
      dappId: entry.dappId,
      dappName: entry.dappName,
      severity: entry.severity as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW',
      threats: entry.threats,
      status: entry.status as 'ACTIVE' | 'INACTIVE',
      timestamp: entry.timestamp.toISOString(),
    }));
  }

  async addToBlacklist(entry: Omit<BlacklistEntry, 'timestamp'>): Promise<BlacklistEntry> {
    const [result] = await db
      .insert(blacklistEntries)
      .values([entry])
      .returning();
    
    return {
      id: result.id,
      dappId: result.dappId,
      dappName: result.dappName,
      severity: result.severity as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW',
      threats: result.threats,
      status: result.status as 'ACTIVE' | 'INACTIVE',
      timestamp: result.timestamp.toISOString(),
    };
  }

  async getSecurityScan(protocolId: string): Promise<SecurityScan | undefined> {
    const [result] = await db
      .select()
      .from(securityScans)
      .where(eq(securityScans.protocolId, protocolId))
      .orderBy(desc(securityScans.scannedAt))
      .limit(1);
    
    if (!result) return undefined;
    
    return {
      isBlacklisted: result.isBlacklisted,
      severity: result.severity as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW',
      threats: result.threats,
      score: result.score,
    };
  }

  async getAllSecurityScans(): Promise<Record<string, SecurityScan>> {
    // Order by scannedAt DESC to get most recent scans first
    const allScans = await db
      .select()
      .from(securityScans)
      .orderBy(desc(securityScans.scannedAt));
    
    const scanMap: Record<string, SecurityScan> = {};
    
    // Keep only the most recent scan per protocol (first occurrence due to DESC order)
    for (const scan of allScans) {
      if (!scanMap[scan.protocolId]) {
        scanMap[scan.protocolId] = {
          isBlacklisted: scan.isBlacklisted,
          severity: scan.severity as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW',
          threats: scan.threats.map(t => ({
            type: t.type,
            severity: t.severity as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW',
            message: t.message,
          })),
          score: scan.score,
        };
      }
    }
    
    return scanMap;
  }

  async addSecurityScan(protocolId: string, scan: SecurityScan): Promise<void> {
    await db.insert(securityScans).values({
      id: `scan-${protocolId}-${Date.now()}`,
      protocolId,
      isBlacklisted: scan.isBlacklisted,
      severity: scan.severity,
      threats: scan.threats as any,
      score: scan.score,
    });
  }

  async getTutorials(): Promise<TutorialVideo[]> {
    const result = await db.select().from(tutorialVideos).orderBy(desc(tutorialVideos.uploadedAt));
    return result.map(tutorial => ({
      id: tutorial.id,
      title: tutorial.title,
      description: tutorial.description,
      videoUrl: tutorial.videoUrl,
      thumbnailUrl: tutorial.thumbnailUrl,
      duration: tutorial.duration,
      category: tutorial.category,
      uploadedAt: tutorial.uploadedAt.toISOString(),
    }));
  }

  async addTutorial(tutorial: InsertTutorialVideo): Promise<TutorialVideo> {
    const [result] = await db
      .insert(tutorialVideos)
      .values({
        id: `tutorial-${Date.now()}-${Math.random()}`,
        ...tutorial,
      })
      .returning();
    
    return {
      id: result.id,
      title: result.title,
      description: result.description,
      videoUrl: result.videoUrl,
      thumbnailUrl: result.thumbnailUrl,
      duration: result.duration,
      category: result.category,
      uploadedAt: result.uploadedAt.toISOString(),
    };
  }

  async getProtocolsByDiscoveryDate(limit: number = 50): Promise<Protocol[]> {
    const result = await db
      .select()
      .from(protocols)
      .orderBy(desc(protocols.discoveredAt))
      .limit(limit);
    
    return result.map(p => ({
      id: p.id,
      name: p.name,
      chains: p.chains,
      category: p.category,
      tvl: p.tvl,
      change24h: p.change24h,
      age: p.age,
      audited: p.audited,
      securityScore: p.securityScore,
      logo: p.logo,
      website: p.website,
      twitter: p.twitter,
      github: p.github,
      description: p.description,
      autoDiscovered: p.autoDiscovered,
      manuallyAdded: p.manuallyAdded,
    }));
  }

  async getProtocolsByTvlGrowth(limit: number = 50): Promise<Protocol[]> {
    const result = await db
      .select()
      .from(protocols)
      .where(gt(protocols.change24h, 0))
      .orderBy(desc(protocols.change24h))
      .limit(limit);
    
    return result.map(p => ({
      id: p.id,
      name: p.name,
      chains: p.chains,
      category: p.category,
      tvl: p.tvl,
      change24h: p.change24h,
      age: p.age,
      audited: p.audited,
      securityScore: p.securityScore,
      logo: p.logo,
      website: p.website,
      twitter: p.twitter,
      github: p.github,
      description: p.description,
      autoDiscovered: p.autoDiscovered,
      manuallyAdded: p.manuallyAdded,
    }));
  }
}

export const storage = new DatabaseStorage();
