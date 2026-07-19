import type { Protocol, BlacklistEntry, SecurityScan, TutorialVideo, InsertProtocol, InsertTutorialVideo, AdminUser, ProtocolCustomization, InsertProtocolCustomization, Insert, ProtocolWhitelist, InsertProtocolWhitelist, Insert, CertikAudit, InsertCertikAudit, ProtocolSubmission, InsertProtocolSubmission, AILearnedPattern, AIScanHistory, UserReport, InsertUserReport, ReportVote, InsertReportVote, UserReputation, InsertUserReputation, ScammerAddress, InsertScammerAddress, AlertSubscription, InsertAlertSubscription, WebhookEndpoint, InsertWebhookEndpoint, ChatSession } from "@shared/schema";
import { protocols, securityScans, blacklistEntries, tutorialVideos, adminUsers, protocolCustomizations, protocolWhitelist, certikAudits, protocolSubmissions, aiLearnedPatterns, aiScanHistory, userReports, reportVotes, userReputation, scammerAddresses, alertSubscriptions, webhookEndpoints, chatSessions } from "@shared/schema";
import { db } from "./db";
import { eq, desc, gt, sql, and, gte, or, isNull } from "drizzle-orm";

export interface IStorage {
  getProtocols(filters?: { category?: string; chain?: string; minTvl?: number }): Promise<Protocol[]>;
  getProtocol(id: string): Promise<Protocol | null>;
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
  updateAdminPassword(adminId: string, newPasswordHash: string): Promise<void>;
  updateProtocol(protocolId: string, updates: Partial<Protocol>): Promise<void>;
  
  // Protocol customization methods
  createCustomizationRequest(data: InsertProtocolCustomization): Promise<ProtocolCustomization>;
  getCustomizationsByProtocol(protocolId: string): Promise<ProtocolCustomization[]>;
  getCustomizationById(id: string): Promise<ProtocolCustomization | undefined>;
  updateCustomizationStatus(id: string, status: string, reviewNotes?: string): Promise<void>;
  updateCustomizationPayment(id: string, paymentStatus: string, txHash?: string, currency?: string): Promise<void>;
  getAllCustomizations(): Promise<ProtocolCustomization[]>;
  
  // Whitelist methods
  addToWhitelist(entry: InsertProtocolWhitelist): Promise<ProtocolWhitelist>;
  getWhitelist(): Promise<ProtocolWhitelist[]>;
  isProtocolWhitelisted(protocolId: string): Promise<boolean>;
  removeFromWhitelist(protocolId: string): Promise<void>;
  
  // CertiK audit methods
  getCertikAudits(filters?: { protocolId?: string; limit?: number }): Promise<CertikAudit[]>;
  getCertikAuditByProtocolId(protocolId: string): Promise<CertikAudit | undefined>;
  upsertCertikAudit(audit: InsertCertikAudit): Promise<CertikAudit>;
  
  // Protocol submission methods
  createProtocolSubmission(submission: InsertProtocolSubmission): Promise<ProtocolSubmission>;
  getProtocolSubmissions(status?: string): Promise<ProtocolSubmission[]>;
  updateProtocolSubmission(id: string, updates: Partial<ProtocolSubmission>): Promise<ProtocolSubmission | undefined>;
  createProtocol(protocol: InsertProtocol): Promise<Protocol>;
  
  // AI Learning persistence methods (Phase 2)
  upsertAIPattern(pattern: {
    pattern: string;
    severity: string;
    category: string;
    confidence: number;
    occurrences: number;
    examples: string[];
  }): Promise<void>;
  getAllAIPatterns(): Promise<Array<{
    id: string;
    pattern: string;
    severity: string;
    category: string;
    confidence: number;
    occurrences: number;
    examples: string[];
    firstSeen: string;
    lastSeen: string;
  }>>;
  addAIScanHistory(scan: {
    entityId: string;
    entityName: string;
    entityType: 'protocol' | 'wallet' | 'website';
    threats: Array<{ type: string; severity: string; message: string }>;
    severity: string;
    score: number;
  }): Promise<void>;
  getAIScanHistory(limit?: number): Promise<Array<{
    id: string;
    entityId: string;
    entityName: string;
    entityType: string;
    threats: Array<{ type: string; severity: string; message: string }>;
    severity: string;
    score: number;
    timestamp: string;
  }>>;

  // Phase 4: Community & Reporting methods
  createUserReport(report: import("@shared/schema").InsertUserReport): Promise<import("@shared/schema").UserReport>;
  getUserReports(filters?: { status?: string; reportType?: string; limit?: number }): Promise<import("@shared/schema").UserReport[]>;
  getUserReportById(id: string): Promise<import("@shared/schema").UserReport | undefined>;
  updateUserReportStatus(id: string, status: string, adminNotes?: string): Promise<void>;
  verifyUserReport(id: string, verifiedBy: string): Promise<void>;
  voteOnReport(reportId: string, voterSessionId: string, voteType: 'upvote' | 'downvote'): Promise<void>;
  removeVoteFromReport(reportId: string, voterSessionId: string): Promise<void>;
  getUserReputation(userIdentifier: string): Promise<import("@shared/schema").UserReputation | undefined>;
  updateUserReputation(userIdentifier: string, updates: Partial<import("@shared/schema").UserReputation>): Promise<void>;
  
  // Phase 5: Intelligence Sharing methods
  addScammerAddress(address: import("@shared/schema").InsertScammerAddress): Promise<import("@shared/schema").ScammerAddress>;
  getScammerAddresses(filters?: { chain?: string; category?: string; isActive?: boolean; limit?: number }): Promise<import("@shared/schema").ScammerAddress[]>;
  searchScammerAddress(address: string, chain: string): Promise<import("@shared/schema").ScammerAddress | undefined>;
  updateScammerAddress(id: string, updates: Partial<import("@shared/schema").ScammerAddress>): Promise<void>;
  addAlertSubscription(subscription: import("@shared/schema").InsertAlertSubscription): Promise<import("@shared/schema").AlertSubscription>;
  getAlertSubscriptions(filters?: { subscriptionType?: string; active?: boolean }): Promise<import("@shared/schema").AlertSubscription[]>;
  updateAlertSubscription(id: string, updates: Partial<import("@shared/schema").AlertSubscription>): Promise<void>;
  addWebhookEndpoint(webhook: import("@shared/schema").InsertWebhookEndpoint): Promise<import("@shared/schema").WebhookEndpoint>;
  getWebhookEndpoints(filters?: { active?: boolean }): Promise<import("@shared/schema").WebhookEndpoint[]>;
  updateWebhookEndpoint(id: string, updates: Partial<import("@shared/schema").WebhookEndpoint>): Promise<void>;

  // Chat session methods
  createChatSession(messages: Array<{ role: 'user' | 'assistant'; content: string; timestamp: string }>, title: string): Promise<import("@shared/schema").ChatSession>;
  getChatSession(id: string): Promise<import("@shared/schema").ChatSession | undefined>;
}

export class DatabaseStorage implements IStorage {
  private mapProtocol(row: any): Protocol {
    return {
      id: row.id,
      name: row.name,
      chains: row.chains as string[],
      category: row.category,
      tvl: row.tvl,
      volume24h: row.volume24h,
      change24h: row.change24h,
      age: row.age ?? null,
      audited: row.audited,
      auditCount: row.auditCount,
      auditNote: row.auditNote ?? null,
      auditLinks: row.auditLinks as string[] | null,
      securityScore: row.securityScore,
      logo: row.logo ?? null,
      website: row.website ?? null,
      twitter: row.twitter ?? null,
      github: row.github ?? null,
      description: row.description ?? '',
      autoDiscovered: row.autoDiscovered ?? false,
      manuallyAdded: row.manuallyAdded ?? false,
      sponsoredUntil: row.sponsoredUntil?.toISOString?.() ?? null,
      sponsorshipTier: (row.sponsorshipTier || 'free') as 'free' | 'featured' | 'sponsored',
      featuredPosition: row.featuredPosition ?? null,
      defiSecurityScore: row.defiSecurityScore ?? null,
      defiAuditReports: row.defiAuditReports as any ?? null,
      defiHasMultisig: row.defiHasMultisig ?? null,
      defiHasTimelock: row.defiHasTimelock ?? null,
      defiDataFetchedAt: row.defiDataFetchedAt?.toISOString?.() ?? null,
      contractAddress: row.contractAddress ?? null,
      contractChain: row.contractChain ?? null,
      dailyActiveWallets: row.dailyActiveWallets ?? 0,
      weeklyActiveWallets: row.weeklyActiveWallets ?? 0,
      monthlyActiveWallets: row.monthlyActiveWallets ?? 0,
      transactions24h: row.transactions24h ?? 0,
      transactions7d: row.transactions7d ?? 0,
      contractCalls24h: row.contractCalls24h ?? 0,
      activityHistory: (row.activityHistory as Array<{ date: string; wallets: number; transactions: number }> | null) ?? null,
      rankByActivity: row.rankByActivity ?? null,
      rankByTvl: row.rankByTvl ?? null,
      rankByVolume: row.rankByVolume ?? null,
    };
  }

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
    
    let query = db.select().from(protocols);
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    const result = await query.orderBy(desc(protocols.tvl));
    return result.map(p => this.mapProtocol(p));
  }

  async getProtocol(id: string): Promise<Protocol | null> {
    const result = await db
      .select()
      .from(protocols)
      .where(eq(protocols.id, id))
      .limit(1);
    
    if (result.length === 0) {
      return null;
    }
    
    return this.mapProtocol(result[0]);
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
    
    return this.mapProtocol(result);
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
      scannedAt: result.scannedAt.toISOString(),
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
        score,
        scanned_at
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
        scannedAt: row.scanned_at as string,
      };
    }
    
    return scanMap;
  }

  async addSecurityScan(protocolId: string, scan: SecurityScan): Promise<void> {
    // Use UPSERT to allow re-scanning protocols (update if exists, insert if new)
    await db.insert(securityScans).values({
      id: `scan-${protocolId}-${Date.now()}`,
      protocolId,
      isBlacklisted: scan.isBlacklisted,
      severity: scan.severity,
      threats: scan.threats as any,
      score: scan.score,
    }).onConflictDoUpdate({
      target: securityScans.protocolId,
      set: {
        isBlacklisted: scan.isBlacklisted,
        severity: scan.severity,
        threats: scan.threats as any,
        score: scan.score,
        scannedAt: sql`CURRENT_TIMESTAMP`, // Update timestamp on re-scan
      },
    });

    // SYNC: Update protocol.securityScore to match scan.score for consistency
    await db.update(protocols)
      .set({ securityScore: scan.score })
      .where(eq(protocols.id, protocolId));
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
    
    return result.map(p => this.mapProtocol(p));
  }

  async getProtocolsByTvlGrowth(limit: number = 50): Promise<Protocol[]> {
    // Use NOT EXISTS subquery to avoid duplicate rows from multiple security scans per protocol
    const result = await db
      .select()
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
    
    return result.map(p => this.mapProtocol(p));
  }

  async getSponsoredProtocols(): Promise<Protocol[]> {
    const now = new Date();
    const result = await db
      .select()
      .from(protocols)
      .where(gt(protocols.sponsoredUntil, now))
      .orderBy(protocols.featuredPosition);
    
    return result.map(p => this.mapProtocol(p));
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

  async updateAdminPassword(adminId: string, newPasswordHash: string): Promise<void> {
    await db
      .update(adminUsers)
      .set({ passwordHash: newPasswordHash })
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

  async addToWhitelist(entry: InsertProtocolWhitelist): Promise<ProtocolWhitelist> {
    const id = `wl_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const [result] = await db
      .insert(protocolWhitelist)
      .values({ ...entry as any, id })
      .onConflictDoUpdate({
        target: protocolWhitelist.protocolId,
        set: {
          reason: entry.reason,
          verificationSource: entry.verificationSource,
          certikScore: entry.certikScore,
          defiSafetyScore: entry.defiSafetyScore,
          minTvl: entry.minTvl,
          exchangeListings: entry.exchangeListings as any,
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
      .values({ ...audit as any, id })
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
          vulnerabilities: audit.vulnerabilities as any,
          riskCategories: audit.riskCategories as any,
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

  // Protocol submission methods
  async createProtocolSubmission(submission: InsertProtocolSubmission): Promise<ProtocolSubmission> {
    const id = `sub_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const [result] = await db
      .insert(protocolSubmissions)
      .values({ ...submission as any, id })
      .returning();
    
    return this.mapProtocolSubmission(result);
  }

  async getProtocolSubmissions(status?: string): Promise<ProtocolSubmission[]> {
    let query = db.select().from(protocolSubmissions);
    
    if (status) {
      query = query.where(eq(protocolSubmissions.status, status)) as any;
    }
    
    const results = await query.orderBy(desc(protocolSubmissions.submittedAt));
    return results.map(r => this.mapProtocolSubmission(r));
  }

  async updateProtocolSubmission(id: string, updates: Partial<ProtocolSubmission>): Promise<ProtocolSubmission | undefined> {
    const [result] = await db
      .update(protocolSubmissions)
      .set(updates as any)
      .where(eq(protocolSubmissions.id, id))
      .returning();
    
    return result ? this.mapProtocolSubmission(result) : undefined;
  }

  async createProtocol(protocol: InsertProtocol): Promise<Protocol> {
    const [result] = await db
      .insert(protocols)
      .values(protocol as any)
      .onConflictDoUpdate({
        target: protocols.id,
        set: protocol as any,
      })
      .returning();
    
    return this.mapProtocol(result);
  }

  private mapProtocolSubmission(submission: any): ProtocolSubmission {
    return {
      id: submission.id,
      submitterEmail: submission.submitterEmail,
      submitterName: submission.submitterName,
      protocolName: submission.protocolName,
      website: submission.website,
      chains: submission.chains as string[],
      category: submission.category,
      contractAddresses: submission.contractAddresses as Record<string, string> | null,
      description: submission.description,
      logo: submission.logo,
      twitter: submission.twitter,
      github: submission.github,
      telegram: submission.telegram,
      discord: submission.discord,
      auditLinks: submission.auditLinks as string[] | null,
      status: submission.status,
      adminNotes: submission.adminNotes,
      securityScanResult: submission.securityScanResult,
      submittedAt: submission.submittedAt.toISOString(),
      reviewedAt: submission.reviewedAt ? submission.reviewedAt.toISOString() : null,
      reviewedBy: submission.reviewedBy,
    };
  }

  // AI Learning persistence methods (Phase 2)
  async upsertAIPattern(pattern: {
    pattern: string;
    severity: string;
    category: string;
    confidence: number;
    occurrences: number;
    examples: string[];
  }): Promise<void> {
    const id = `ai_pattern_${pattern.pattern}_${pattern.severity}`;
    
    await db
      .insert(aiLearnedPatterns)
      .values({
        id,
        pattern: pattern.pattern,
        severity: pattern.severity,
        category: pattern.category,
        confidence: pattern.confidence,
        occurrences: pattern.occurrences,
        examples: pattern.examples as any,
      })
      .onConflictDoUpdate({
        target: [aiLearnedPatterns.pattern, aiLearnedPatterns.severity],
        set: {
          confidence: pattern.confidence,
          occurrences: pattern.occurrences,
          examples: pattern.examples as any,
          lastSeen: new Date(),
        },
      });
  }

  async getAllAIPatterns(): Promise<Array<{
    id: string;
    pattern: string;
    severity: string;
    category: string;
    confidence: number;
    occurrences: number;
    examples: string[];
    firstSeen: string;
    lastSeen: string;
  }>> {
    const results = await db
      .select()
      .from(aiLearnedPatterns)
      .orderBy(desc(aiLearnedPatterns.confidence));
    
    return results.map(r => ({
      id: r.id,
      pattern: r.pattern,
      severity: r.severity,
      category: r.category,
      confidence: r.confidence,
      occurrences: r.occurrences,
      examples: r.examples as string[],
      firstSeen: r.firstSeen.toISOString(),
      lastSeen: r.lastSeen.toISOString(),
    }));
  }

  async addAIScanHistory(scan: {
    entityId: string;
    entityName: string;
    entityType: 'protocol' | 'wallet' | 'website';
    threats: Array<{ type: string; severity: string; message: string }>;
    severity: string;
    score: number;
  }): Promise<void> {
    const id = `ai_scan_${scan.entityType}_${scan.entityId}_${Date.now()}`;
    
    await db
      .insert(aiScanHistory)
      .values({
        id,
        entityId: scan.entityId,
        entityName: scan.entityName,
        entityType: scan.entityType,
        threats: scan.threats as any,
        severity: scan.severity,
        score: scan.score,
      });
  }

  async getAIScanHistory(limit: number = 1000): Promise<Array<{
    id: string;
    entityId: string;
    entityName: string;
    entityType: string;
    threats: Array<{ type: string; severity: string; message: string }>;
    severity: string;
    score: number;
    timestamp: string;
  }>> {
    const results = await db
      .select()
      .from(aiScanHistory)
      .orderBy(desc(aiScanHistory.timestamp))
      .limit(limit);
    
    return results.map(r => ({
      id: r.id,
      entityId: r.entityId,
      entityName: r.entityName,
      entityType: r.entityType,
      threats: r.threats as Array<{ type: string; severity: string; message: string }>,
      severity: r.severity,
      score: r.score,
      timestamp: r.timestamp.toISOString(),
    }));
  }

  // Phase 4: Community & Reporting implementations
  async createUserReport(report: InsertUserReport): Promise<UserReport> {
    const id = `report_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    const [created] = await db
      .insert(userReports)
      .values({ id, ...report as any })
      .returning();
    
    return created;
  }

  async getUserReports(filters?: { status?: string; reportType?: string; limit?: number }): Promise<UserReport[]> {
    let query = db.select().from(userReports);

    if (filters?.status) {
      query = query.where(eq(userReports.status, filters.status)) as any;
    }
    if (filters?.reportType) {
      query = query.where(eq(userReports.reportType, filters.reportType)) as any;
    }

    query = query.orderBy(desc(userReports.submittedAt)) as any;

    if (filters?.limit) {
      query = query.limit(filters.limit) as any;
    }

    return await query;
  }

  async getUserReportById(id: string): Promise<UserReport | undefined> {
    const [report] = await db
      .select()
      .from(userReports)
      .where(eq(userReports.id, id));
    
    return report;
  }

  async updateUserReportStatus(id: string, status: string, adminNotes?: string): Promise<void> {
    await db
      .update(userReports)
      .set({
        status,
        reviewedAt: new Date(),
        adminNotes: adminNotes || null,
      })
      .where(eq(userReports.id, id));
  }

  async verifyUserReport(id: string, verifiedBy: string): Promise<void> {
    await db
      .update(userReports)
      .set({
        verified: true,
        verifiedBy,
        verifiedAt: new Date(),
        status: 'verified',
      })
      .where(eq(userReports.id, id));
  }

  async voteOnReport(reportId: string, voterSessionId: string, voteType: 'upvote' | 'downvote'): Promise<void> {
    const voteId = `vote_${reportId}_${voterSessionId}`;

    // Check if vote already exists
    const [existingVote] = await db
      .select()
      .from(reportVotes)
      .where(
        and(
          eq(reportVotes.reportId, reportId),
          eq(reportVotes.voterSessionId, voterSessionId)
        )
      );

    if (existingVote) {
      // Update existing vote
      if (existingVote.voteType === voteType) {
        // Same vote, do nothing
        return;
      } else {
        // Different vote, update counts
        await db
          .update(reportVotes)
          .set({ voteType })
          .where(eq(reportVotes.id, existingVote.id));

        // Adjust vote counts
        if (voteType === 'upvote') {
          await db
            .update(userReports)
            .set({
              upvotes: sql`${userReports.upvotes} + 1`,
              downvotes: sql`${userReports.downvotes} - 1`,
            })
            .where(eq(userReports.id, reportId));
        } else {
          await db
            .update(userReports)
            .set({
              upvotes: sql`${userReports.upvotes} - 1`,
              downvotes: sql`${userReports.downvotes} + 1`,
            })
            .where(eq(userReports.id, reportId));
        }
      }
    } else {
      // Create new vote
      await db.insert(reportVotes).values({
        id: voteId,
        reportId,
        voterSessionId,
        voteType,
      });

      // Update vote counts
      if (voteType === 'upvote') {
        await db
          .update(userReports)
          .set({ upvotes: sql`${userReports.upvotes} + 1` })
          .where(eq(userReports.id, reportId));
      } else {
        await db
          .update(userReports)
          .set({ downvotes: sql`${userReports.downvotes} + 1` })
          .where(eq(userReports.id, reportId));
      }
    }
  }

  async removeVoteFromReport(reportId: string, voterSessionId: string): Promise<void> {
    const [existingVote] = await db
      .select()
      .from(reportVotes)
      .where(
        and(
          eq(reportVotes.reportId, reportId),
          eq(reportVotes.voterSessionId, voterSessionId)
        )
      );

    if (existingVote) {
      await db
        .delete(reportVotes)
        .where(eq(reportVotes.id, existingVote.id));

      // Update vote counts
      if (existingVote.voteType === 'upvote') {
        await db
          .update(userReports)
          .set({ upvotes: sql`${userReports.upvotes} - 1` })
          .where(eq(userReports.id, reportId));
      } else {
        await db
          .update(userReports)
          .set({ downvotes: sql`${userReports.downvotes} - 1` })
          .where(eq(userReports.id, reportId));
      }
    }
  }

  async getUserReputation(userIdentifier: string): Promise<UserReputation | undefined> {
    const [reputation] = await db
      .select()
      .from(userReputation)
      .where(eq(userReputation.userIdentifier, userIdentifier));
    
    return reputation;
  }

  async updateUserReputation(userIdentifier: string, updates: Partial<UserReputation>): Promise<void> {
    const existing = await this.getUserReputation(userIdentifier);

    if (existing) {
      await db
        .update(userReputation)
        .set({ ...updates, lastActive: new Date() })
        .where(eq(userReputation.userIdentifier, userIdentifier));
    } else {
      const id = `reputation_${userIdentifier}`;
      await db
        .insert(userReputation)
        .values({
          id,
          userIdentifier,
          ...updates,
        });
    }
  }

  // Phase 5: Intelligence Sharing implementations
  async addScammerAddress(address: InsertScammerAddress): Promise<ScammerAddress> {
    const id = `scammer_${address.chain}_${address.address}_${Date.now()}`;
    
    const [created] = await db
      .insert(scammerAddresses)
      .values({ id, ...address as any })
      .returning();
    
    return created;
  }

  async getScammerAddresses(filters?: { chain?: string; category?: string; isActive?: boolean; limit?: number }): Promise<ScammerAddress[]> {
    let query = db.select().from(scammerAddresses);

    const conditions = [];
    if (filters?.chain) {
      conditions.push(eq(scammerAddresses.chain, filters.chain));
    }
    if (filters?.category) {
      conditions.push(eq(scammerAddresses.category, filters.category));
    }
    if (filters?.isActive !== undefined) {
      conditions.push(eq(scammerAddresses.isActive, filters.isActive));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    query = query.orderBy(desc(scammerAddresses.addedAt)) as any;

    if (filters?.limit) {
      query = query.limit(filters.limit) as any;
    }

    return await query;
  }

  async searchScammerAddress(address: string, chain: string): Promise<ScammerAddress | undefined> {
    const [found] = await db
      .select()
      .from(scammerAddresses)
      .where(
        and(
          eq(scammerAddresses.address, address.toLowerCase()),
          eq(scammerAddresses.chain, chain)
        )
      );
    
    return found;
  }

  async updateScammerAddress(id: string, updates: Partial<ScammerAddress>): Promise<void> {
    await db
      .update(scammerAddresses)
      .set(updates)
      .where(eq(scammerAddresses.id, id));
  }

  async addAlertSubscription(subscription: InsertAlertSubscription): Promise<AlertSubscription> {
    const id = `subscription_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    const [created] = await db
      .insert(alertSubscriptions)
      .values({ id, ...subscription as any })
      .returning();
    
    return created;
  }

  async getAlertSubscriptions(filters?: { subscriptionType?: string; active?: boolean }): Promise<AlertSubscription[]> {
    let query = db.select().from(alertSubscriptions);

    const conditions = [];
    if (filters?.subscriptionType) {
      conditions.push(eq(alertSubscriptions.subscriptionType, filters.subscriptionType));
    }
    if (filters?.active !== undefined) {
      conditions.push(eq(alertSubscriptions.active, filters.active));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    return await query;
  }

  async updateAlertSubscription(id: string, updates: Partial<AlertSubscription>): Promise<void> {
    await db
      .update(alertSubscriptions)
      .set(updates)
      .where(eq(alertSubscriptions.id, id));
  }

  async addWebhookEndpoint(webhook: InsertWebhookEndpoint): Promise<WebhookEndpoint> {
    const id = `webhook_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    const [created] = await db
      .insert(webhookEndpoints)
      .values({ id, ...webhook as any })
      .returning();
    
    return created;
  }

  async getWebhookEndpoints(filters?: { active?: boolean }): Promise<WebhookEndpoint[]> {
    let query = db.select().from(webhookEndpoints);

    if (filters?.active !== undefined) {
      query = query.where(eq(webhookEndpoints.active, filters.active)) as any;
    }

    return await query;
  }

  async updateWebhookEndpoint(id: string, updates: Partial<WebhookEndpoint>): Promise<void> {
    await db
      .update(webhookEndpoints)
      .set(updates)
      .where(eq(webhookEndpoints.id, id));
  }

  // ── Chat session methods ──────────────────────────────────────────────────

  async createChatSession(
    messages: Array<{ role: 'user' | 'assistant'; content: string; timestamp: string }>,
    title: string
  ): Promise<ChatSession> {
    const id = `chat_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const [session] = await db
      .insert(chatSessions)
      .values({ id, messages, title, expiresAt })
      .returning();

    return session;
  }

  async getChatSession(id: string): Promise<ChatSession | undefined> {
    const [session] = await db
      .select()
      .from(chatSessions)
      .where(
        and(
          eq(chatSessions.id, id),
          gt(chatSessions.expiresAt, new Date())
        )
      )
      .limit(1);

    return session ?? undefined;
  }
}

export const storage = new DatabaseStorage();
