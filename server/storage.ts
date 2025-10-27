import type { Protocol, BlacklistEntry, SecurityScan, TutorialVideo, InsertProtocol, InsertTutorialVideo } from "@shared/schema";
import { protocols, securityScans, blacklistEntries, tutorialVideos } from "@shared/schema";
import { db } from "./db";
import { eq, desc, gt, sql } from "drizzle-orm";

export interface IStorage {
  getProtocols(): Promise<Protocol[]>;
  addProtocol(protocol: InsertProtocol): Promise<Protocol>;
  bulkUpsertProtocols(protocolList: InsertProtocol[]): Promise<void>;
  getBlacklist(): Promise<BlacklistEntry[]>;
  addToBlacklist(entry: Omit<BlacklistEntry, 'timestamp'>): Promise<BlacklistEntry>;
  deleteBlacklistEntry(entryId: string): Promise<void>;
  getSecurityScan(protocolId: string): Promise<SecurityScan | undefined>;
  getAllSecurityScans(): Promise<Record<string, SecurityScan>>;
  addSecurityScan(protocolId: string, scan: SecurityScan): Promise<void>;
  getTutorials(): Promise<TutorialVideo[]>;
  addTutorial(tutorial: InsertTutorialVideo): Promise<TutorialVideo>;
  getProtocolsByDiscoveryDate(limit?: number): Promise<Protocol[]>;
  getProtocolsByTvlGrowth(limit?: number): Promise<Protocol[]>;
  getSponsoredProtocols(): Promise<Protocol[]>;
  updateProtocolSponsorship(
    protocolId: string,
    tier: 'free' | 'featured' | 'sponsored',
    sponsoredUntil: Date | null,
    featuredPosition: number | null
  ): Promise<void>;
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
      volume24h: p.volume24h,
      change24h: p.change24h,
      age: p.age,
      audited: p.audited,
      auditCount: p.auditCount,
      auditNote: p.auditNote,
      auditLinks: p.auditLinks,
      securityScore: p.securityScore,
      logo: p.logo,
      website: p.website,
      twitter: p.twitter,
      github: p.github,
      description: p.description,
      autoDiscovered: p.autoDiscovered,
      manuallyAdded: p.manuallyAdded,
      sponsoredUntil: p.sponsoredUntil?.toISOString() ?? null,
      sponsorshipTier: (p.sponsorshipTier || 'free') as 'free' | 'featured' | 'sponsored',
      featuredPosition: p.featuredPosition,
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
      volume24h: result.volume24h,
      change24h: result.change24h,
      age: result.age,
      audited: result.audited,
      auditCount: result.auditCount,
      auditNote: result.auditNote,
      auditLinks: result.auditLinks,
      securityScore: result.securityScore,
      logo: result.logo,
      website: result.website,
      twitter: result.twitter,
      github: result.github,
      description: result.description,
      autoDiscovered: result.autoDiscovered,
      manuallyAdded: result.manuallyAdded,
      sponsoredUntil: result.sponsoredUntil?.toISOString() ?? null,
      sponsorshipTier: (result.sponsorshipTier || 'free') as 'free' | 'featured' | 'sponsored',
      featuredPosition: result.featuredPosition,
    };
  }

  async bulkUpsertProtocols(protocolList: InsertProtocol[]): Promise<void> {
    if (protocolList.length === 0) return;
    
    // Batch insert/update protocols in chunks of 50
    const batchSize = 50;
    for (let i = 0; i < protocolList.length; i += batchSize) {
      const batch = protocolList.slice(i, i + batchSize);
      await db
        .insert(protocols)
        .values(batch)
        .onConflictDoUpdate({
          target: protocols.id,
          set: {
            tvl: sql`EXCLUDED.tvl`,
            change24h: sql`EXCLUDED.change_24h`,
            securityScore: sql`EXCLUDED.security_score`,
            lastUpdated: new Date(),
          },
        });
    }
  }

  async getBlacklist(): Promise<BlacklistEntry[]> {
    const result = await db.select().from(blacklistEntries).orderBy(desc(blacklistEntries.timestamp));
    return result.map(entry => ({
      id: entry.id,
      dappId: entry.dappId,
      dappName: entry.dappName,
      severity: entry.severity as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW',
      threats: entry.threats.map(t => ({
        type: t.type,
        severity: t.severity as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW',
        message: t.message,
      })),
      reason: entry.reason,
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
      threats: result.threats.map(t => ({
        type: t.type,
        severity: t.severity as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW',
        message: t.message,
      })),
      reason: result.reason,
      status: result.status as 'ACTIVE' | 'INACTIVE',
      timestamp: result.timestamp.toISOString(),
    };
  }

  async deleteBlacklistEntry(entryId: string): Promise<void> {
    await db.delete(blacklistEntries).where(eq(blacklistEntries.id, entryId));
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
      threats: result.threats.map(t => ({
        type: t.type,
        severity: t.severity as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW',
        message: t.message,
      })),
      score: result.score,
    };
  }

  async getAllSecurityScans(): Promise<Record<string, SecurityScan>> {
    // Use SQL DISTINCT ON to get only the most recent scan per protocol - much faster!
    const recentScans = await db.execute(sql`
      SELECT DISTINCT ON (protocol_id) 
        protocol_id, 
        is_blacklisted, 
        severity, 
        threats, 
        score
      FROM security_scans
      ORDER BY protocol_id, scanned_at DESC
    `);
    
    const scanMap: Record<string, SecurityScan> = {};
    
    for (const row of recentScans.rows) {
      scanMap[row.protocol_id as string] = {
        isBlacklisted: row.is_blacklisted as boolean,
        severity: row.severity as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW',
        threats: row.threats as any[],
        score: row.score as number,
      };
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
      volume24h: p.volume24h,
      change24h: p.change24h,
      age: p.age,
      audited: p.audited,
      auditCount: p.auditCount,
      auditNote: p.auditNote,
      auditLinks: p.auditLinks,
      securityScore: p.securityScore,
      logo: p.logo,
      website: p.website,
      twitter: p.twitter,
      github: p.github,
      description: p.description,
      autoDiscovered: p.autoDiscovered,
      manuallyAdded: p.manuallyAdded,
      sponsoredUntil: p.sponsoredUntil?.toISOString() ?? null,
      sponsorshipTier: (p.sponsorshipTier || 'free') as 'free' | 'featured' | 'sponsored',
      featuredPosition: p.featuredPosition,
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
      volume24h: p.volume24h,
      change24h: p.change24h,
      age: p.age,
      audited: p.audited,
      auditCount: p.auditCount,
      auditNote: p.auditNote,
      auditLinks: p.auditLinks,
      securityScore: p.securityScore,
      logo: p.logo,
      website: p.website,
      twitter: p.twitter,
      github: p.github,
      description: p.description,
      autoDiscovered: p.autoDiscovered,
      manuallyAdded: p.manuallyAdded,
      sponsoredUntil: p.sponsoredUntil?.toISOString() ?? null,
      sponsorshipTier: (p.sponsorshipTier || 'free') as 'free' | 'featured' | 'sponsored',
      featuredPosition: p.featuredPosition,
    }));
  }

  async getSponsoredProtocols(): Promise<Protocol[]> {
    const now = new Date();
    const result = await db
      .select()
      .from(protocols)
      .where(gt(protocols.sponsoredUntil, now))
      .orderBy(protocols.featuredPosition);
    
    return result.map(p => ({
      id: p.id,
      name: p.name,
      chains: p.chains,
      category: p.category,
      tvl: p.tvl,
      volume24h: p.volume24h,
      change24h: p.change24h,
      age: p.age,
      audited: p.audited,
      auditCount: p.auditCount,
      auditNote: p.auditNote,
      auditLinks: p.auditLinks,
      securityScore: p.securityScore,
      logo: p.logo,
      website: p.website,
      twitter: p.twitter,
      github: p.github,
      description: p.description,
      autoDiscovered: p.autoDiscovered,
      manuallyAdded: p.manuallyAdded,
      sponsoredUntil: p.sponsoredUntil?.toISOString() ?? null,
      sponsorshipTier: (p.sponsorshipTier || 'free') as 'free' | 'featured' | 'sponsored',
      featuredPosition: p.featuredPosition,
    }));
  }

  async updateProtocolSponsorship(
    protocolId: string,
    tier: 'free' | 'featured' | 'sponsored',
    sponsoredUntil: Date | null,
    featuredPosition: number | null
  ): Promise<void> {
    await db
      .update(protocols)
      .set({
        sponsorshipTier: tier,
        sponsoredUntil,
        featuredPosition,
        lastUpdated: new Date(),
      })
      .where(eq(protocols.id, protocolId));
  }
}

export const storage = new DatabaseStorage();
