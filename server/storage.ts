import type { Protocol, BlacklistEntry, SecurityScan, TutorialVideo, InsertProtocol, InsertTutorialVideo, AdminUser, ProtocolCustomization, InsertProtocolCustomization, DiscoveredContract, InsertDiscoveredContract, ProtocolWhitelist, InsertProtocolWhitelist, TwitterAlert, InsertTwitterAlert, CertikAudit, InsertCertikAudit } from "@shared/schema";
import { protocols, securityScans, blacklistEntries, tutorialVideos, adminUsers, protocolCustomizations, discoveredContracts, protocolWhitelist, twitterAlerts, certikAudits } from "@shared/schema";
import { db } from "./db";
import { eq, desc, gt, sql, and, gte, or, isNull } from "drizzle-orm";

export interface IStorage {
  getProtocols(filters?: { category?: string; chain?: string; minTvl?: number }): Promise<Protocol[]>;
  addProtocol(protocol: InsertProtocol): Promise<Protocol>;
  bulkUpsertProtocols(protocolList: InsertProtocol[]): Promise<void>;
  getBlacklist(): Promise<BlacklistEntry[]>;
  addToBlacklist(entry: Omit<BlacklistEntry, 'timestamp'>): Promise<BlacklistEntry>;
  deleteBlacklistEntry(entryId: string): Promise<void>;
  updateBlacklistLegitimacy(entryId: string, updates: {
    legitimacyScore: number;
    securityMetrics: any;
    website: string | null;
    twitter: string | null;
    github: string | null;
    lastVetted: string;
  }): Promise<void>;
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
  
  // Admin methods
  getAdminByUsername(username: string): Promise<AdminUser | undefined>;
  getAllAdmins(): Promise<AdminUser[]>;
  createAdmin(username: string, passwordHash: string, email: string): Promise<AdminUser>;
  updateAdminLastLogin(adminId: string): Promise<void>;
  updateProtocol(protocolId: string, updates: Partial<Protocol>): Promise<void>;
  
  // Protocol customization methods
  createCustomizationRequest(data: InsertProtocolCustomization): Promise<ProtocolCustomization>;
  getCustomizationsByProtocol(protocolId: string): Promise<ProtocolCustomization[]>;
  getCustomizationById(id: string): Promise<ProtocolCustomization | undefined>;
  updateCustomizationStatus(id: string, status: string, reviewNotes?: string): Promise<void>;
  updateCustomizationPayment(id: string, paymentStatus: string, txHash?: string, currency?: string): Promise<void>;
  getAllCustomizations(): Promise<ProtocolCustomization[]>;
  
  // Contract discovery methods
  addDiscoveredContract(contract: InsertDiscoveredContract): Promise<DiscoveredContract>;
  getDiscoveredContracts(filters?: { status?: string; chain?: string; limit?: number }): Promise<DiscoveredContract[]>;
  updateDiscoveredContractStatus(id: string, status: string): Promise<void>;
  promoteContractToProtocol(contractId: string, protocolId: string): Promise<void>;
  
  // Whitelist methods
  addToWhitelist(entry: InsertProtocolWhitelist): Promise<ProtocolWhitelist>;
  getWhitelist(): Promise<ProtocolWhitelist[]>;
  isProtocolWhitelisted(protocolId: string): Promise<boolean>;
  removeFromWhitelist(protocolId: string): Promise<void>;
  
  // Twitter monitoring methods
  getTwitterAlerts(filters?: { status?: string; severity?: string; category?: string; limit?: number }): Promise<TwitterAlert[]>;
  addTwitterAlert(alert: InsertTwitterAlert): Promise<TwitterAlert>;
  updateTwitterAlert(id: string, updates: { status?: string; reviewNotes?: string }): Promise<void>;
  
  // CertiK audit methods
  getCertikAudits(filters?: { protocolId?: string; limit?: number }): Promise<CertikAudit[]>;
  getCertikAuditByProtocolId(protocolId: string): Promise<CertikAudit | undefined>;
  upsertCertikAudit(audit: InsertCertikAudit): Promise<CertikAudit>;
}

export class DatabaseStorage implements IStorage {
  async getProtocols(filters?: { category?: string; chain?: string; minTvl?: number }): Promise<Protocol[]> {
    const conditions = [];
    
    if (filters?.category) {
      conditions.push(eq(protocols.category, filters.category));
    }
    
    if (filters?.minTvl !== undefined) {
      conditions.push(gte(protocols.tvl, filters.minTvl));
    }
    
    if (filters?.chain) {
      conditions.push(sql`${protocols.chains}::jsonb @> ${JSON.stringify([filters.chain])}::jsonb`);
    }
    
    let query = db.select({
      id: protocols.id,
      name: protocols.name,
      category: protocols.category,
      chains: protocols.chains,
      tvl: protocols.tvl,
      volume24h: protocols.volume24h,
      change24h: protocols.change24h,
      logo: protocols.logo,
      securityScore: protocols.securityScore,
      audited: protocols.audited,
      auditCount: protocols.auditCount,
      sponsorshipTier: protocols.sponsorshipTier,
      featuredPosition: protocols.featuredPosition,
      sponsoredUntil: protocols.sponsoredUntil,
    }).from(protocols);
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    const result = await query.orderBy(desc(protocols.tvl));
    return result.map(p => ({
      id: p.id,
      name: p.name,
      chains: p.chains as string[],
      category: p.category,
      tvl: p.tvl,
      volume24h: p.volume24h,
      change24h: p.change24h,
      age: null,
      audited: p.audited,
      auditCount: p.auditCount,
      auditNote: null,
      auditLinks: null,
      securityScore: p.securityScore,
      logo: p.logo,
      website: null,
      twitter: null,
      github: null,
      description: '',
      autoDiscovered: false,
      manuallyAdded: false,
      sponsoredUntil: p.sponsoredUntil?.toISOString() ?? null,
      sponsorshipTier: (p.sponsorshipTier || 'free') as 'free' | 'featured' | 'sponsored',
      featuredPosition: p.featuredPosition,
      defiSecurityScore: null,
      defiAuditReports: null,
      defiHasMultisig: null,
      defiHasTimelock: null,
      defiDataFetchedAt: null,
    }));
  }

  async addProtocol(protocol: InsertProtocol): Promise<Protocol> {
    const [result] = await db
      .insert(protocols)
      .values([protocol] as any)
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
      chains: result.chains as string[],
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
      defiSecurityScore: result.defiSecurityScore ?? null,
      defiAuditReports: result.defiAuditReports as any ?? null,
      defiHasMultisig: result.defiHasMultisig ?? null,
      defiHasTimelock: result.defiHasTimelock ?? null,
      defiDataFetchedAt: result.defiDataFetchedAt?.toISOString() ?? null,
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
        .values(batch as any)
        .onConflictDoUpdate({
          target: protocols.id,
          set: {
            tvl: sql`EXCLUDED.tvl`,
            volume24h: sql`EXCLUDED.volume_24h`,
            change24h: sql`EXCLUDED.change_24h`,
            audited: sql`EXCLUDED.audited`,
            auditCount: sql`EXCLUDED.audit_count`,
            auditNote: sql`EXCLUDED.audit_note`,
            auditLinks: sql`EXCLUDED.audit_links`,
            securityScore: sql`EXCLUDED.security_score`,
            logo: sql`EXCLUDED.logo`,
            website: sql`EXCLUDED.website`,
            twitter: sql`EXCLUDED.twitter`,
            github: sql`EXCLUDED.github`,
            description: sql`EXCLUDED.description`,
            lastUpdated: new Date(),
          },
        });
    }
  }

  async getBlacklist(): Promise<BlacklistEntry[]> {
    const result = await db
      .select()
      .from(blacklistEntries)
      .orderBy(desc(blacklistEntries.timestamp));
      
    return result.map(entry => ({
      id: entry.id,
      dappId: entry.dappId,
      dappName: entry.dappName,
      website: entry.website,
      twitter: entry.twitter,
      github: entry.github,
      severity: entry.severity as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW',
      threats: entry.threats.map((t: any) => ({
        type: t.type,
        severity: t.severity as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW',
        message: t.message,
      })),
      reason: entry.reason,
      status: entry.status as 'ACTIVE' | 'INACTIVE',
      timestamp: entry.timestamp.toISOString(),
      legitimacyScore: entry.legitimacyScore || 0,
      securityMetrics: entry.securityMetrics,
      lastVetted: entry.lastVetted?.toISOString() || null,
    }));
  }

  async addToBlacklist(entry: Omit<BlacklistEntry, 'timestamp'>): Promise<BlacklistEntry> {
    const [result] = await db
      .insert(blacklistEntries)
      .values([{
        ...entry,
        lastVetted: entry.lastVetted ? new Date(entry.lastVetted) : null
      }])
      .onConflictDoUpdate({
        target: blacklistEntries.dappId,
        set: {
          dappName: entry.dappName,
          severity: entry.severity,
          threats: entry.threats,
          reason: entry.reason,
          status: entry.status,
          website: entry.website,
          twitter: entry.twitter,
          github: entry.github,
          legitimacyScore: entry.legitimacyScore,
          securityMetrics: entry.securityMetrics,
          lastVetted: entry.lastVetted ? new Date(entry.lastVetted) : null,
        }
      })
      .returning();
    
    return {
      id: result.id,
      dappId: result.dappId,
      dappName: result.dappName,
      website: result.website,
      twitter: result.twitter,
      github: result.github,
      severity: result.severity as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW',
      threats: result.threats.map(t => ({
        type: t.type,
        severity: t.severity as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW',
        message: t.message,
      })),
      reason: result.reason,
      status: result.status as 'ACTIVE' | 'INACTIVE',
      timestamp: result.timestamp.toISOString(),
      legitimacyScore: result.legitimacyScore || 0,
      securityMetrics: result.securityMetrics,
      lastVetted: result.lastVetted?.toISOString() || null,
    };
  }

  async deleteBlacklistEntry(entryId: string): Promise<void> {
    await db.delete(blacklistEntries).where(eq(blacklistEntries.id, entryId));
  }

  async updateBlacklistLegitimacy(entryId: string, updates: {
    legitimacyScore: number;
    securityMetrics: any;
    website: string | null;
    twitter: string | null;
    github: string | null;
    lastVetted: string;
  }): Promise<void> {
    await db.update(blacklistEntries)
      .set({
        legitimacyScore: updates.legitimacyScore,
        securityMetrics: updates.securityMetrics,
        website: updates.website,
        twitter: updates.twitter,
        github: updates.github,
        lastVetted: new Date(updates.lastVetted)
      })
      .where(eq(blacklistEntries.id, entryId));
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
      .select({
        id: protocols.id,
        name: protocols.name,
        category: protocols.category,
        chains: protocols.chains,
        tvl: protocols.tvl,
        volume24h: protocols.volume24h,
        change24h: protocols.change24h,
        logo: protocols.logo,
        securityScore: protocols.securityScore,
        audited: protocols.audited,
        auditCount: protocols.auditCount,
        sponsorshipTier: protocols.sponsorshipTier,
        featuredPosition: protocols.featuredPosition,
        sponsoredUntil: protocols.sponsoredUntil,
      })
      .from(protocols)
      .orderBy(desc(protocols.discoveredAt))
      .limit(limit);
    
    return result.map(p => ({
      id: p.id,
      name: p.name,
      chains: p.chains as string[],
      category: p.category,
      tvl: p.tvl,
      volume24h: p.volume24h,
      change24h: p.change24h,
      age: null,
      audited: p.audited,
      auditCount: p.auditCount,
      auditNote: null,
      auditLinks: null,
      securityScore: p.securityScore,
      logo: p.logo,
      website: null,
      twitter: null,
      github: null,
      description: '',
      autoDiscovered: false,
      manuallyAdded: false,
      sponsoredUntil: p.sponsoredUntil?.toISOString() ?? null,
      sponsorshipTier: (p.sponsorshipTier || 'free') as 'free' | 'featured' | 'sponsored',
      featuredPosition: p.featuredPosition,
      defiSecurityScore: null,
      defiAuditReports: null,
      defiHasMultisig: null,
      defiHasTimelock: null,
      defiDataFetchedAt: null,
    }));
  }

  async getProtocolsByTvlGrowth(limit: number = 50): Promise<Protocol[]> {
    // Use NOT EXISTS subquery to avoid duplicate rows from multiple security scans per protocol
    const result = await db
      .select({
        id: protocols.id,
        name: protocols.name,
        category: protocols.category,
        chains: protocols.chains,
        tvl: protocols.tvl,
        volume24h: protocols.volume24h,
        change24h: protocols.change24h,
        logo: protocols.logo,
        securityScore: protocols.securityScore,
        audited: protocols.audited,
        auditCount: protocols.auditCount,
        sponsorshipTier: protocols.sponsorshipTier,
        featuredPosition: protocols.featuredPosition,
        sponsoredUntil: protocols.sponsoredUntil,
      })
      .from(protocols)
      .where(and(
        gt(protocols.change24h, 0), // Positive growth
        gte(protocols.securityScore, 50), // Exclude critical risk protocols (score < 50)
        gt(sql`${protocols.tvl} * ${protocols.change24h} / 100`, 100), // Absolute growth > $100 (meaningful growth)
        // Exclude blacklisted protocols using NOT EXISTS subquery (avoids duplicate rows)
        sql`NOT EXISTS (
          SELECT 1 FROM ${securityScans} 
          WHERE ${securityScans.protocolId} = ${protocols.id} 
          AND ${securityScans.isBlacklisted} = true
        )`
      ))
      .orderBy(desc(protocols.change24h)) // Sort by percentage growth
      .limit(limit);
    
    return result.map(p => ({
      id: p.id,
      name: p.name,
      chains: p.chains as string[],
      category: p.category,
      tvl: p.tvl,
      volume24h: p.volume24h,
      change24h: p.change24h,
      age: null,
      audited: p.audited,
      auditCount: p.auditCount,
      auditNote: null,
      auditLinks: null,
      securityScore: p.securityScore,
      logo: p.logo,
      website: null,
      twitter: null,
      github: null,
      description: '',
      autoDiscovered: false,
      manuallyAdded: false,
      sponsoredUntil: p.sponsoredUntil?.toISOString() ?? null,
      sponsorshipTier: (p.sponsorshipTier || 'free') as 'free' | 'featured' | 'sponsored',
      featuredPosition: p.featuredPosition,
      defiSecurityScore: null,
      defiAuditReports: null,
      defiHasMultisig: null,
      defiHasTimelock: null,
      defiDataFetchedAt: null,
    }));
  }

  async getSponsoredProtocols(): Promise<Protocol[]> {
    const now = new Date();
    const result = await db
      .select({
        id: protocols.id,
        name: protocols.name,
        category: protocols.category,
        chains: protocols.chains,
        tvl: protocols.tvl,
        volume24h: protocols.volume24h,
        change24h: protocols.change24h,
        logo: protocols.logo,
        securityScore: protocols.securityScore,
        audited: protocols.audited,
        auditCount: protocols.auditCount,
        sponsorshipTier: protocols.sponsorshipTier,
        featuredPosition: protocols.featuredPosition,
        sponsoredUntil: protocols.sponsoredUntil,
      })
      .from(protocols)
      .where(gt(protocols.sponsoredUntil, now))
      .orderBy(protocols.featuredPosition);
    
    return result.map(p => ({
      id: p.id,
      name: p.name,
      chains: p.chains as string[],
      category: p.category,
      tvl: p.tvl,
      volume24h: p.volume24h,
      change24h: p.change24h,
      age: null,
      audited: p.audited,
      auditCount: p.auditCount,
      auditNote: null,
      auditLinks: null,
      securityScore: p.securityScore,
      logo: p.logo,
      website: null,
      twitter: null,
      github: null,
      description: '',
      autoDiscovered: false,
      manuallyAdded: false,
      sponsoredUntil: p.sponsoredUntil?.toISOString() ?? null,
      sponsorshipTier: (p.sponsorshipTier || 'free') as 'free' | 'featured' | 'sponsored',
      featuredPosition: p.featuredPosition,
      defiSecurityScore: null,
      defiAuditReports: null,
      defiHasMultisig: null,
      defiHasTimelock: null,
      defiDataFetchedAt: null,
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

  async getAdminByUsername(username: string): Promise<AdminUser | undefined> {
    const [admin] = await db.select().from(adminUsers).where(eq(adminUsers.username, username));
    if (!admin) return undefined;
    
    return {
      id: admin.id,
      username: admin.username,
      passwordHash: admin.passwordHash,
      email: admin.email,
      role: admin.role,
      createdAt: admin.createdAt.toISOString(),
      lastLogin: admin.lastLogin?.toISOString() ?? null,
    };
  }

  async getAllAdmins(): Promise<AdminUser[]> {
    const admins = await db.select().from(adminUsers);
    return admins.map(admin => ({
      id: admin.id,
      username: admin.username,
      passwordHash: admin.passwordHash,
      email: admin.email,
      role: admin.role,
      createdAt: admin.createdAt.toISOString(),
      lastLogin: admin.lastLogin?.toISOString() ?? null,
    }));
  }

  async createAdmin(username: string, passwordHash: string, email: string): Promise<AdminUser> {
    const [admin] = await db
      .insert(adminUsers)
      .values({
        id: `admin-${Date.now()}-${Math.random()}`,
        username,
        passwordHash,
        email,
        role: 'admin',
      })
      .returning();
    
    return {
      id: admin.id,
      username: admin.username,
      passwordHash: admin.passwordHash,
      email: admin.email,
      role: admin.role,
      createdAt: admin.createdAt.toISOString(),
      lastLogin: admin.lastLogin?.toISOString() ?? null,
    };
  }

  async updateAdminLastLogin(adminId: string): Promise<void> {
    await db
      .update(adminUsers)
      .set({ lastLogin: new Date() })
      .where(eq(adminUsers.id, adminId));
  }

  async updateProtocol(protocolId: string, updates: Partial<Protocol>): Promise<void> {
    const dbUpdates: any = { ...updates, lastUpdated: new Date() };
    
    // Convert timestamp strings back to Date objects for database
    if (updates.sponsoredUntil) {
      dbUpdates.sponsoredUntil = new Date(updates.sponsoredUntil);
    }
    
    await db
      .update(protocols)
      .set(dbUpdates)
      .where(eq(protocols.id, protocolId));
  }

  async createCustomizationRequest(data: InsertProtocolCustomization): Promise<ProtocolCustomization> {
    const [customization] = await db
      .insert(protocolCustomizations)
      .values({
        id: `custom-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        ...data,
      } as any)
      .returning();
    
    return {
      id: customization.id,
      protocolId: customization.protocolId,
      requestorEmail: customization.requestorEmail,
      requestorName: customization.requestorName,
      customDescription: customization.customDescription,
      customWebsite: customization.customWebsite,
      customTwitter: customization.customTwitter,
      customGithub: customization.customGithub,
      customAuditLinks: customization.customAuditLinks as string[] | null,
      customLogo: customization.customLogo,
      paymentAmount: customization.paymentAmount,
      paymentStatus: customization.paymentStatus as 'pending' | 'paid' | 'confirmed' | 'failed',
      paymentCurrency: customization.paymentCurrency,
      paymentTxHash: customization.paymentTxHash,
      paymentAddress: customization.paymentAddress,
      status: customization.status as 'pending' | 'payment_pending' | 'under_review' | 'approved' | 'rejected' | 'applied',
      reviewNotes: customization.reviewNotes,
      createdAt: customization.createdAt.toISOString(),
      approvedAt: customization.approvedAt?.toISOString() ?? null,
      appliedAt: customization.appliedAt?.toISOString() ?? null,
    };
  }

  async getCustomizationsByProtocol(protocolId: string): Promise<ProtocolCustomization[]> {
    const customizations = await db
      .select()
      .from(protocolCustomizations)
      .where(eq(protocolCustomizations.protocolId, protocolId))
      .orderBy(desc(protocolCustomizations.createdAt));
    
    return customizations.map(c => ({
      id: c.id,
      protocolId: c.protocolId,
      requestorEmail: c.requestorEmail,
      requestorName: c.requestorName,
      customDescription: c.customDescription,
      customWebsite: c.customWebsite,
      customTwitter: c.customTwitter,
      customGithub: c.customGithub,
      customAuditLinks: c.customAuditLinks as string[] | null,
      customLogo: c.customLogo,
      paymentAmount: c.paymentAmount,
      paymentStatus: c.paymentStatus as 'pending' | 'paid' | 'confirmed' | 'failed',
      paymentCurrency: c.paymentCurrency,
      paymentTxHash: c.paymentTxHash,
      paymentAddress: c.paymentAddress,
      status: c.status as 'pending' | 'payment_pending' | 'under_review' | 'approved' | 'rejected' | 'applied',
      reviewNotes: c.reviewNotes,
      createdAt: c.createdAt.toISOString(),
      approvedAt: c.approvedAt?.toISOString() ?? null,
      appliedAt: c.appliedAt?.toISOString() ?? null,
    }));
  }

  async getCustomizationById(id: string): Promise<ProtocolCustomization | undefined> {
    const [customization] = await db
      .select()
      .from(protocolCustomizations)
      .where(eq(protocolCustomizations.id, id));
    
    if (!customization) return undefined;
    
    return {
      id: customization.id,
      protocolId: customization.protocolId,
      requestorEmail: customization.requestorEmail,
      requestorName: customization.requestorName,
      customDescription: customization.customDescription,
      customWebsite: customization.customWebsite,
      customTwitter: customization.customTwitter,
      customGithub: customization.customGithub,
      customAuditLinks: customization.customAuditLinks as string[] | null,
      customLogo: customization.customLogo,
      paymentAmount: customization.paymentAmount,
      paymentStatus: customization.paymentStatus as 'pending' | 'paid' | 'confirmed' | 'failed',
      paymentCurrency: customization.paymentCurrency,
      paymentTxHash: customization.paymentTxHash,
      paymentAddress: customization.paymentAddress,
      status: customization.status as 'pending' | 'payment_pending' | 'under_review' | 'approved' | 'rejected' | 'applied',
      reviewNotes: customization.reviewNotes,
      createdAt: customization.createdAt.toISOString(),
      approvedAt: customization.approvedAt?.toISOString() ?? null,
      appliedAt: customization.appliedAt?.toISOString() ?? null,
    };
  }

  async updateCustomizationStatus(id: string, status: string, reviewNotes?: string): Promise<void> {
    const updates: any = { status };
    
    if (reviewNotes) {
      updates.reviewNotes = reviewNotes;
    }
    
    if (status === 'approved') {
      updates.approvedAt = new Date();
    }
    
    if (status === 'applied') {
      updates.appliedAt = new Date();
    }
    
    await db
      .update(protocolCustomizations)
      .set(updates)
      .where(eq(protocolCustomizations.id, id));
  }

  async updateCustomizationPayment(id: string, paymentStatus: string, txHash?: string, currency?: string): Promise<void> {
    const updates: any = { paymentStatus };
    
    if (txHash) {
      updates.paymentTxHash = txHash;
    }
    
    if (currency) {
      updates.paymentCurrency = currency;
    }
    
    await db
      .update(protocolCustomizations)
      .set(updates)
      .where(eq(protocolCustomizations.id, id));
  }

  async getAllCustomizations(): Promise<ProtocolCustomization[]> {
    const customizations = await db
      .select()
      .from(protocolCustomizations)
      .orderBy(desc(protocolCustomizations.createdAt));
    
    return customizations.map(c => ({
      id: c.id,
      protocolId: c.protocolId,
      requestorEmail: c.requestorEmail,
      requestorName: c.requestorName,
      customDescription: c.customDescription,
      customWebsite: c.customWebsite,
      customTwitter: c.customTwitter,
      customGithub: c.customGithub,
      customAuditLinks: c.customAuditLinks as string[] | null,
      customLogo: c.customLogo,
      paymentAmount: c.paymentAmount,
      paymentStatus: c.paymentStatus as 'pending' | 'paid' | 'confirmed' | 'failed',
      paymentCurrency: c.paymentCurrency,
      paymentTxHash: c.paymentTxHash,
      paymentAddress: c.paymentAddress,
      status: c.status as 'pending' | 'payment_pending' | 'under_review' | 'approved' | 'rejected' | 'applied',
      reviewNotes: c.reviewNotes,
      createdAt: c.createdAt.toISOString(),
      approvedAt: c.approvedAt?.toISOString() ?? null,
      appliedAt: c.appliedAt?.toISOString() ?? null,
    }));
  }

  async addDiscoveredContract(contract: InsertDiscoveredContract): Promise<DiscoveredContract> {
    const id = `contract_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Try to insert, update on conflict (deduplication)
    const [result] = await db
      .insert(discoveredContracts)
      .values({ ...contract as any, id })
      .onConflictDoUpdate({
        target: [discoveredContracts.contractAddress, discoveredContracts.chain],
        set: {
          contractName: contract.contractName,
          contractType: contract.contractType,
          compilerVersion: contract.compilerVersion,
          optimization: contract.optimization,
          metadata: contract.metadata,
        }
      })
      .returning();
    
    return this.mapDiscoveredContract(result);
  }

  async getDiscoveredContracts(filters?: { status?: string; chain?: string; limit?: number }): Promise<DiscoveredContract[]> {
    const conditions = [];
    
    if (filters?.status) {
      conditions.push(eq(discoveredContracts.status, filters.status));
    }
    
    if (filters?.chain) {
      conditions.push(eq(discoveredContracts.chain, filters.chain));
    }
    
    let query = db
      .select()
      .from(discoveredContracts)
      .orderBy(desc(discoveredContracts.discoveredAt));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    if (filters?.limit) {
      query = query.limit(filters.limit) as any;
    }
    
    const results = await query;
    return results.map(r => this.mapDiscoveredContract(r));
  }

  async updateDiscoveredContractStatus(id: string, status: string): Promise<void> {
    await db
      .update(discoveredContracts)
      .set({ status, reviewedAt: new Date() })
      .where(eq(discoveredContracts.id, id));
  }

  async promoteContractToProtocol(contractId: string, protocolId: string): Promise<void> {
    await db
      .update(discoveredContracts)
      .set({ promotedToProtocol: true, protocolId, status: 'approved' })
      .where(eq(discoveredContracts.id, contractId));
  }

  private mapDiscoveredContract(contract: any): DiscoveredContract {
    return {
      id: contract.id,
      contractAddress: contract.contractAddress,
      contractName: contract.contractName,
      chain: contract.chain,
      contractType: contract.contractType,
      verifiedAt: contract.verifiedAt?.toISOString() ?? null,
      discoveredAt: contract.discoveredAt.toISOString(),
      compilerVersion: contract.compilerVersion,
      optimization: contract.optimization,
      sourceCode: contract.sourceCode,
      abi: contract.abi as any[] | null,
      creatorAddress: contract.creatorAddress,
      txHash: contract.txHash,
      explorerUrl: contract.explorerUrl,
      status: contract.status as 'pending' | 'reviewed' | 'approved' | 'rejected',
      reviewedAt: contract.reviewedAt?.toISOString() ?? null,
      promotedToProtocol: contract.promotedToProtocol ?? false,
      protocolId: contract.protocolId,
      metadata: contract.metadata as any,
    };
  }

  async addToWhitelist(entry: InsertProtocolWhitelist): Promise<ProtocolWhitelist> {
    const id = `wl_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const [result] = await db
      .insert(protocolWhitelist)
      .values({ ...entry, id })
      .onConflictDoUpdate({
        target: protocolWhitelist.protocolId,
        set: {
          reason: entry.reason,
          verificationSource: entry.verificationSource,
          certikScore: entry.certikScore,
          defiSafetyScore: entry.defiSafetyScore,
          minTvl: entry.minTvl,
          exchangeListings: entry.exchangeListings,
          lastVerified: new Date(),
        }
      })
      .returning();
    
    return this.mapWhitelistEntry(result);
  }

  async getWhitelist(): Promise<ProtocolWhitelist[]> {
    const results = await db.select().from(protocolWhitelist);
    return results.map(r => this.mapWhitelistEntry(r));
  }

  async isProtocolWhitelisted(protocolId: string): Promise<boolean> {
    const result = await db
      .select()
      .from(protocolWhitelist)
      .where(eq(protocolWhitelist.protocolId, protocolId))
      .limit(1);
    
    return result.length > 0;
  }

  async removeFromWhitelist(protocolId: string): Promise<void> {
    await db
      .delete(protocolWhitelist)
      .where(eq(protocolWhitelist.protocolId, protocolId));
  }

  private mapWhitelistEntry(entry: any): ProtocolWhitelist {
    return {
      id: entry.id,
      protocolId: entry.protocolId,
      protocolName: entry.protocolName,
      reason: entry.reason,
      verificationSource: entry.verificationSource,
      certikScore: entry.certikScore ?? null,
      defiSafetyScore: entry.defiSafetyScore ?? null,
      minTvl: entry.minTvl ?? null,
      exchangeListings: entry.exchangeListings ?? null,
      addedBy: entry.addedBy,
      addedAt: entry.addedAt.toISOString(),
      lastVerified: entry.lastVerified.toISOString(),
    };
  }

  // Twitter monitoring methods
  async getTwitterAlerts(filters?: { status?: string; severity?: string; category?: string; limit?: number }): Promise<TwitterAlert[]> {
    const conditions = [];
    
    if (filters?.status) {
      conditions.push(eq(twitterAlerts.status, filters.status));
    }
    
    if (filters?.severity) {
      conditions.push(eq(twitterAlerts.severity, filters.severity));
    }
    
    if (filters?.category) {
      conditions.push(eq(twitterAlerts.category, filters.category));
    }
    
    let query = db.select().from(twitterAlerts);
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    const results = await query
      .orderBy(desc(twitterAlerts.detectedAt))
      .limit(filters?.limit || 100);
    
    return results.map(r => this.mapTwitterAlert(r));
  }

  async addTwitterAlert(alert: InsertTwitterAlert): Promise<TwitterAlert> {
    const id = `tw_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const [result] = await db
      .insert(twitterAlerts)
      .values({ ...alert, id })
      .returning();
    
    return this.mapTwitterAlert(result);
  }

  async updateTwitterAlert(id: string, updates: { status?: string; reviewNotes?: string }): Promise<void> {
    await db
      .update(twitterAlerts)
      .set({
        ...updates,
        reviewedAt: new Date(),
      })
      .where(eq(twitterAlerts.id, id));
  }

  private mapTwitterAlert(alert: any): TwitterAlert {
    return {
      id: alert.id,
      tweetId: alert.tweetId,
      authorId: alert.authorId,
      authorUsername: alert.authorUsername,
      tweetText: alert.tweetText,
      alertType: alert.alertType,
      category: alert.category,
      severity: alert.severity,
      matchedKeywords: alert.matchedKeywords as string[],
      extractedUrls: alert.extractedUrls as string[] | null,
      hashtags: alert.hashtags as string[] | null,
      mentions: alert.mentions as string[] | null,
      protocolMentioned: alert.protocolMentioned,
      isSuspicious: alert.isSuspicious,
      blacklistedDomain: alert.blacklistedDomain,
      crossReferencedProtocol: alert.crossReferencedProtocol,
      status: alert.status,
      reviewNotes: alert.reviewNotes,
      tweetCreatedAt: alert.tweetCreatedAt.toISOString(),
      detectedAt: alert.detectedAt.toISOString(),
      reviewedAt: alert.reviewedAt?.toISOString() ?? null,
    };
  }

  // CertiK audit methods
  async getCertikAudits(filters?: { protocolId?: string; limit?: number }): Promise<CertikAudit[]> {
    const conditions = [];
    
    if (filters?.protocolId) {
      conditions.push(eq(certikAudits.protocolId, filters.protocolId));
    }
    
    let query = db.select().from(certikAudits);
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    const results = await query
      .orderBy(desc(certikAudits.fetchedAt))
      .limit(filters?.limit || 50);
    
    return results.map(r => this.mapCertikAudit(r));
  }

  async getCertikAuditByProtocolId(protocolId: string): Promise<CertikAudit | undefined> {
    const [result] = await db
      .select()
      .from(certikAudits)
      .where(eq(certikAudits.protocolId, protocolId))
      .orderBy(desc(certikAudits.fetchedAt))
      .limit(1);
    
    return result ? this.mapCertikAudit(result) : undefined;
  }

  async upsertCertikAudit(audit: InsertCertikAudit): Promise<CertikAudit> {
    const id = `ca_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const [result] = await db
      .insert(certikAudits)
      .values({ ...audit, id })
      .onConflictDoUpdate({
        target: certikAudits.protocolId,
        set: {
          protocolName: audit.protocolName,
          securityScore: audit.securityScore,
          codeSecurityScore: audit.codeSecurityScore,
          marketScore: audit.marketScore,
          governanceScore: audit.governanceScore,
          hasAudit: audit.hasAudit,
          auditDate: audit.auditDate,
          auditStatus: audit.auditStatus,
          auditReportUrl: audit.auditReportUrl,
          vulnerabilities: audit.vulnerabilities,
          riskCategories: audit.riskCategories,
          onChainMonitoring: audit.onChainMonitoring,
          kycVerified: audit.kycVerified,
          bugBountyProgram: audit.bugBountyProgram,
          certikSkynetUrl: audit.certikSkynetUrl,
          dataSource: audit.dataSource,
          lastUpdated: new Date(),
          fetchedAt: new Date(),
        }
      })
      .returning();
    
    return this.mapCertikAudit(result);
  }

  private mapCertikAudit(audit: any): CertikAudit {
    return {
      id: audit.id,
      protocolId: audit.protocolId,
      protocolName: audit.protocolName,
      securityScore: audit.securityScore,
      codeSecurityScore: audit.codeSecurityScore,
      marketScore: audit.marketScore,
      governanceScore: audit.governanceScore,
      hasAudit: audit.hasAudit,
      auditDate: audit.auditDate?.toISOString() ?? null,
      auditStatus: audit.auditStatus,
      auditReportUrl: audit.auditReportUrl,
      vulnerabilities: audit.vulnerabilities as any,
      riskCategories: audit.riskCategories as any,
      onChainMonitoring: audit.onChainMonitoring ?? false,
      kycVerified: audit.kycVerified ?? false,
      bugBountyProgram: audit.bugBountyProgram ?? false,
      certikSkynetUrl: audit.certikSkynetUrl,
      dataSource: audit.dataSource,
      lastUpdated: audit.lastUpdated.toISOString(),
      fetchedAt: audit.fetchedAt.toISOString(),
    };
  }
}

export const storage = new DatabaseStorage();
