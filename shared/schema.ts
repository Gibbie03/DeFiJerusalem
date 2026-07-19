import { z } from 'zod';
import { pgTable, text, boolean, real, integer, timestamp, json, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';

// ==========================================
// EXISTING TABLES — matched exactly to DB columns
// ==========================================

export const protocols = pgTable('protocols', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  chains: json('chains').$type<string[]>().notNull(),
  category: text('category').notNull(),
  tvl: real('tvl').notNull(),
  volume24h: real('volume_24h').notNull().default(0),
  change24h: real('change_24h').notNull(),
  age: integer('age'),
  audited: boolean('audited').notNull(),
  auditCount: integer('audit_count').notNull().default(0),
  auditNote: text('audit_note'),
  auditLinks: json('audit_links').$type<string[]>(),
  securityScore: real('security_score').notNull(),
  logo: text('logo'),
  website: text('website'),
  twitter: text('twitter'),
  github: text('github'),
  description: text('description').notNull(),
  autoDiscovered: boolean('auto_discovered').notNull().default(false),
  manuallyAdded: boolean('manually_added').notNull().default(false),
  discoveredAt: timestamp('discovered_at').notNull().defaultNow(),
  lastUpdated: timestamp('last_updated').notNull().defaultNow(),
  sponsoredUntil: timestamp('sponsored_until'),
  sponsorshipTier: text('sponsorship_tier').default('free'),
  featuredPosition: integer('featured_position'),
  defiSecurityScore: real('defi_security_score'),
  defiAuditReports: json('defi_audit_reports').$type<Array<{ auditor: string; date: string; reportUrl: string }>>(),
  defiHasMultisig: boolean('defi_has_multisig'),
  defiHasTimelock: boolean('defi_has_timelock'),
  defiDataFetchedAt: timestamp('defi_data_fetched_at'),
  contractAddress: text('contract_address'),
  contractChain: text('contract_chain'),
  dailyActiveWallets: integer('daily_active_wallets').default(0),
  weeklyActiveWallets: integer('weekly_active_wallets').default(0),
  monthlyActiveWallets: integer('monthly_active_wallets').default(0),
  transactions24h: integer('transactions_24h').default(0),
  transactions7d: integer('transactions_7d').default(0),
  contractCalls24h: integer('contract_calls_24h').default(0),
  activityHistory: json('activity_history').$type<Array<{ date: string; wallets: number; transactions: number }>>(),
  rankByActivity: integer('rank_by_activity'),
  rankByTvl: integer('rank_by_tvl'),
  rankByVolume: integer('rank_by_volume'),
});

export const securityScans = pgTable('security_scans', {
  id: text('id').primaryKey(),
  protocolId: text('protocol_id').notNull().references(() => protocols.id),
  isBlacklisted: boolean('is_blacklisted').notNull(),
  severity: text('severity').notNull(),
  threats: json('threats').$type<Array<{ type: string; severity: string; message: string }>>().notNull(),
  score: real('score').notNull(),
  scannedAt: timestamp('scanned_at').notNull().defaultNow(),
});

export const blacklistEntries = pgTable('blacklist_entries', {
  id: text('id').primaryKey(),
  dappId: text('dapp_id').notNull(),
  dappName: text('dapp_name').notNull(),
  severity: text('severity').notNull(),
  threats: json('threats').$type<string[]>().notNull(),
  reason: text('reason').notNull(),
  status: text('status').notNull().default('ACTIVE'),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  website: text('website'),
  twitter: text('twitter'),
  github: text('github'),
  legitimacyScore: real('legitimacy_score').default(0),
  securityMetrics: json('security_metrics').$type<Record<string, any>>(),
  lastVetted: timestamp('last_vetted'),
});

export const tutorialVideos = pgTable('tutorial_videos', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  videoUrl: text('video_url').notNull(),
  thumbnailUrl: text('thumbnail_url'),
  duration: integer('duration'),
  category: text('category').notNull(),
  uploadedAt: timestamp('uploaded_at').notNull().defaultNow(),
});

export const adminUsers = pgTable('admin_users', {
  id: text('id').primaryKey(),
  username: text('username').notNull(),
  passwordHash: text('password_hash').notNull(),
  email: text('email'),
  role: text('role').default('admin'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  lastLogin: timestamp('last_login'),
});

export const protocolCustomizations = pgTable('protocol_customizations', {
  id: text('id').primaryKey(),
  protocolId: text('protocol_id').notNull(),
  requestorEmail: text('requestor_email'),
  requestorName: text('requestor_name'),
  customDescription: text('custom_description'),
  customWebsite: text('custom_website'),
  customTwitter: text('custom_twitter'),
  customGithub: text('custom_github'),
  customAuditLinks: json('custom_audit_links').$type<string[]>(),
  customLogo: text('custom_logo'),
  paymentAmount: real('payment_amount'),
  paymentStatus: text('payment_status').default('unpaid'),
  paymentCurrency: text('payment_currency'),
  paymentTxHash: text('payment_tx_hash'),
  paymentAddress: text('payment_address'),
  status: text('status').notNull().default('pending'),
  reviewNotes: text('review_notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  approvedAt: timestamp('approved_at'),
  appliedAt: timestamp('applied_at'),
});

export const protocolWhitelist = pgTable('protocol_whitelist', {
  id: text('id').primaryKey(),
  protocolId: text('protocol_id').notNull(),
  protocolName: text('protocol_name'),
  reason: text('reason'),
  verificationSource: text('verification_source'),
  certikScore: real('certik_score'),
  defiSafetyScore: real('defi_safety_score'),
  minTvl: real('min_tvl'),
  exchangeListings: json('exchange_listings').$type<string[]>(),
  addedBy: text('added_by'),
  addedAt: timestamp('added_at').notNull().defaultNow(),
  lastVerified: timestamp('last_verified').notNull().defaultNow(),
});

export const certikAudits = pgTable('certik_audits', {
  id: text('id').primaryKey(),
  protocolId: text('protocol_id').notNull().references(() => protocols.id),
  protocolName: text('protocol_name').notNull(),
  securityScore: real('security_score'),
  codeSecurityScore: real('code_security_score'),
  marketScore: real('market_score'),
  governanceScore: real('governance_score'),
  hasAudit: boolean('has_audit'),
  auditDate: timestamp('audit_date'),
  auditStatus: text('audit_status'),
  auditReportUrl: text('audit_report_url'),
  vulnerabilities: json('vulnerabilities').$type<Array<{ severity: string; count: number }>>(),
  riskCategories: json('risk_categories').$type<Record<string, any>>(),
  onChainMonitoring: boolean('on_chain_monitoring'),
  kycVerified: boolean('kyc_verified'),
  bugBountyProgram: boolean('bug_bounty_program'),
  certikSkynetUrl: text('certik_skynet_url'),
  dataSource: text('data_source'),
  lastUpdated: timestamp('last_updated').notNull().defaultNow(),
  fetchedAt: timestamp('fetched_at').notNull().defaultNow(),
});

export const aiLearnedPatterns = pgTable('ai_learned_patterns', {
  id: text('id').primaryKey(),
  pattern: text('pattern').notNull(),
  severity: text('severity').notNull(),
  category: text('category'),
  confidence: real('confidence').notNull(),
  occurrences: integer('occurrences').notNull().default(1),
  examples: json('examples').$type<string[]>(),
  firstSeen: timestamp('first_seen').notNull().defaultNow(),
  lastSeen: timestamp('last_seen').notNull().defaultNow(),
});

export const aiScanHistory = pgTable('ai_scan_history', {
  id: text('id').primaryKey(),
  entityId: text('entity_id'),
  entityName: text('entity_name').notNull(),
  entityType: text('entity_type'),
  threats: json('threats').$type<Record<string, any>>(),
  severity: text('severity'),
  score: real('score'),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
});

export const userReports = pgTable('user_reports', {
  id: text('id').primaryKey(),
  reporterName: text('reporter_name'),
  reporterEmail: text('reporter_email'),
  reportType: text('report_type').notNull(),
  targetId: text('target_id'),
  targetName: text('target_name'),
  title: text('title'),
  description: text('description').notNull(),
  evidence: text('evidence'),
  severity: text('severity').notNull().default('MEDIUM'),
  category: text('category'),
  status: text('status').notNull().default('pending'),
  upvotes: integer('upvotes').notNull().default(0),
  downvotes: integer('downvotes').notNull().default(0),
  verified: boolean('verified').notNull().default(false),
  verifiedBy: text('verified_by'),
  verifiedAt: timestamp('verified_at'),
  submittedAt: timestamp('submitted_at').notNull().defaultNow(),
  reviewedAt: timestamp('reviewed_at'),
  adminNotes: text('admin_notes'),
});

export const reportVotes = pgTable('report_votes', {
  id: text('id').primaryKey(),
  reportId: text('report_id').notNull().references(() => userReports.id),
  voterSessionId: text('voter_session_id').notNull(),
  voteType: text('vote_type').notNull(),
  votedAt: timestamp('voted_at').notNull().defaultNow(),
});

export const userReputation = pgTable('user_reputation', {
  id: text('id').primaryKey(),
  userIdentifier: text('user_identifier').notNull(),
  reputationScore: integer('reputation_score').notNull().default(0),
  reportsSubmitted: integer('reports_submitted').notNull().default(0),
  reportsVerified: integer('reports_verified').notNull().default(0),
  reportsRejected: integer('reports_rejected').notNull().default(0),
  lastActive: timestamp('last_active').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const scammerAddresses = pgTable('scammer_addresses', {
  id: text('id').primaryKey(),
  address: text('address').notNull(),
  chain: text('chain').notNull(),
  addressType: text('address_type'),
  category: text('category').notNull(),
  severity: text('severity').notNull().default('HIGH'),
  description: text('description'),
  associatedScam: text('associated_scam'),
  totalStolen: real('total_stolen'),
  victimCount: integer('victim_count'),
  firstSeen: timestamp('first_seen'),
  lastActivity: timestamp('last_activity'),
  isActive: boolean('is_active').notNull().default(true),
  relatedAddresses: json('related_addresses').$type<string[]>(),
  evidenceLinks: json('evidence_links').$type<string[]>(),
  reportedBy: text('reported_by'),
  verifiedAt: timestamp('verified_at'),
  addedAt: timestamp('added_at').notNull().defaultNow(),
});

export const alertSubscriptions = pgTable('alert_subscriptions', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),
  telegramChatId: text('telegram_chat_id'),
  subscriptionType: text('subscription_type').notNull(),
  alertTypes: json('alert_types').$type<string[]>(),
  frequency: text('frequency'),
  active: boolean('active').notNull().default(true),
  lastSent: timestamp('last_sent'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const webhookEndpoints = pgTable('webhook_endpoints', {
  id: text('id').primaryKey(),
  url: text('url').notNull(),
  secret: text('secret').notNull(),
  eventTypes: json('event_types').$type<string[]>().notNull(),
  active: boolean('active').notNull().default(true),
  lastTriggered: timestamp('last_triggered'),
  failureCount: integer('failure_count').default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  createdBy: text('created_by').notNull(),
});

export const manualAudits = pgTable('manual_audits', {
  id: text('id').primaryKey(),
  protocolId: text('protocol_id').notNull().references(() => protocols.id),
  auditFirm: text('audit_firm').notNull(),
  auditDate: timestamp('audit_date').notNull(),
  reportUrl: text('report_url'),
  findings: text('findings'),
  addedAt: timestamp('added_at').notNull().defaultNow(),
});

export const sponsorPayments = pgTable('sponsor_payments', {
  id: text('id').primaryKey(),
  protocolId: text('protocol_id').notNull(),
  tier: text('tier').notNull(),
  startDate: timestamp('start_date').notNull().defaultNow(),
  endDate: timestamp('end_date').notNull(),
  amount: real('amount').notNull(),
  status: text('status').notNull().default('pending'),
  invoiceUrl: text('invoice_url'),
  contactEmail: text('contact_email'),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const protocolSubmissions = pgTable('protocol_submissions', {
  id: text('id').primaryKey(),
  submitterEmail: text('submitter_email'),
  submitterName: text('submitter_name'),
  protocolName: text('protocol_name').notNull(),
  website: text('website'),
  chains: json('chains').$type<string[]>(),
  category: text('category').notNull(),
  contractAddresses: json('contract_addresses').$type<string[]>(),
  description: text('description'),
  logo: text('logo'),
  twitter: text('twitter'),
  github: text('github'),
  telegram: text('telegram'),
  discord: text('discord'),
  auditLinks: json('audit_links').$type<string[]>(),
  status: text('status').notNull().default('pending'),
  adminNotes: text('admin_notes'),
  securityScanResult: json('security_scan_result').$type<Record<string, any>>(),
  submittedAt: timestamp('submitted_at').notNull().defaultNow(),
  reviewedAt: timestamp('reviewed_at'),
  reviewedBy: text('reviewed_by'),
});

// ==========================================
// CHAT SESSIONS (shareable conversations)
// ==========================================

export const chatSessions = pgTable('chat_sessions', {
  id: text('id').primaryKey(),
  messages: json('messages').$type<Array<{ role: 'user' | 'assistant'; content: string; timestamp: string }>>().notNull(),
  title: text('title').notNull().default('AI Security Chat'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  expiresAt: timestamp('expires_at').notNull(),
}, (table) => ({
  expiresAtIdx: index('chat_sessions_expires_at_idx').on(table.expiresAt),
}));

export const insertChatSessionSchema = createInsertSchema(chatSessions).omit({ createdAt: true });
export type ChatSession = typeof chatSessions.$inferSelect;

// ==========================================
// BOUNTY SYSTEM & AUDIT FIRM PIPELINE
// ==========================================

export const communityUsers = pgTable('community_users', {
  id: text('id').primaryKey(),
  email: text('email'),
  walletAddress: text('wallet_address'),
  displayName: text('display_name').notNull(),
  totalPoints: integer('total_points').notNull().default(0),
  bio: text('bio'),
  twitterHandle: text('twitter_handle'),
  githubHandle: text('github_handle'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  lastActive: timestamp('last_active').notNull().defaultNow(),
});

export const bountyTasks = pgTable('bounty_tasks', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  category: text('category').notNull(),
  pointReward: integer('point_reward').notNull(),
  status: text('status').notNull().default('open'),
  deadline: timestamp('deadline'),
  requirements: json('requirements').$type<string[]>().default([]),
  protocolId: text('protocol_id'),
  createdBy: text('created_by').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  submissionCount: integer('submission_count').notNull().default(0),
  maxSubmissions: integer('max_submissions'),
});

export const bountySubmissions = pgTable('bounty_submissions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => communityUsers.id),
  taskId: text('task_id').references(() => bountyTasks.id),
  type: text('type').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  evidence: text('evidence'),
  evidenceLinks: json('evidence_links').$type<string[]>().default([]),
  protocolId: text('protocol_id'),
  protocolName: text('protocol_name'),
  status: text('status').notNull().default('pending'),
  pointsAwarded: integer('points_awarded'),
  reviewedBy: text('reviewed_by'),
  reviewNote: text('review_note'),
  reviewedAt: timestamp('reviewed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const pointsLedger = pgTable('points_ledger', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => communityUsers.id),
  amount: integer('amount').notNull(),
  reason: text('reason').notNull(),
  submissionId: text('submission_id').references(() => bountySubmissions.id),
  awardedBy: text('awarded_by'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const auditFirms = pgTable('audit_firms', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  website: text('website').notNull(),
  description: text('description').notNull(),
  logoUrl: text('logo_url'),
  specialties: json('specialties').$type<string[]>().default([]),
  foundedYear: integer('founded_year'),
  teamSize: text('team_size'),
  contactEmail: text('contact_email').notNull(),
  twitterHandle: text('twitter_handle'),
  githubHandle: text('github_handle'),
  verificationStatus: text('verification_status').notNull().default('pending'),
  verifiedAt: timestamp('verified_at'),
  verifiedBy: text('verified_by'),
  rejectionReason: text('rejection_reason'),
  totalClaims: integer('total_claims').notNull().default(0),
  verifiedClaims: integer('verified_claims').notNull().default(0),
  postExploitCount: integer('post_exploit_count').notNull().default(0),
  communityRating: real('community_rating'),
  totalReviews: integer('total_reviews').notNull().default(0),
  avgBountyResponseDays: real('avg_bounty_response_days'),
  scopeCoverageScore: real('scope_coverage_score'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const auditFirmClaims = pgTable('audit_firm_claims', {
  id: text('id').primaryKey(),
  firmId: text('firm_id').notNull().references(() => auditFirms.id),
  protocolId: text('protocol_id').notNull(),
  protocolName: text('protocol_name').notNull(),
  auditDate: text('audit_date').notNull(),
  auditReportUrl: text('audit_report_url').notNull(),
  auditSummary: text('audit_summary'),
  criticalFindings: integer('critical_findings').notNull().default(0),
  highFindings: integer('high_findings').notNull().default(0),
  mediumFindings: integer('medium_findings').notNull().default(0),
  lowFindings: integer('low_findings').notNull().default(0),
  deployedCodeMatchesAudit: boolean('deployed_code_matches_audit'),
  postAuditChanges: text('post_audit_changes'),
  bountyResponseDays: integer('bounty_response_days'),
  verificationStatus: text('verification_status').notNull().default('pending'),
  verifiedAt: timestamp('verified_at'),
  verifiedBy: text('verified_by'),
  rejectionReason: text('rejection_reason'),
  submittedAt: timestamp('submitted_at').notNull().defaultNow(),
  protocolWasExploited: boolean('protocol_was_exploited').default(false),
  exploitDate: text('exploit_date'),
  exploitDescription: text('exploit_description'),
});

export const auditFirmReviews = pgTable('audit_firm_reviews', {
  id: text('id').primaryKey(),
  firmId: text('firm_id').notNull().references(() => auditFirms.id),
  reviewerUserId: text('reviewer_user_id').notNull().references(() => communityUsers.id),
  rating: integer('rating').notNull(),
  reviewText: text('review_text').notNull(),
  claimId: text('claim_id').references(() => auditFirmClaims.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ==========================================
// INSERT SCHEMAS
// ==========================================

export const insertProtocolSchema = createInsertSchema(protocols).omit({ discoveredAt: true, lastUpdated: true });
export const insertTutorialVideoSchema = createInsertSchema(tutorialVideos).omit({ uploadedAt: true });
export const insertManualAuditSchema = createInsertSchema(manualAudits).omit({ addedAt: true });
export const insertSponsorPaymentSchema = createInsertSchema(sponsorPayments).omit({ createdAt: true });
export const insertDiscoveredContractSchema = createInsertSchema(protocolSubmissions);
export const insertProtocolCustomizationSchema = createInsertSchema(protocolCustomizations).omit({ createdAt: true });
export const insertProtocolSubmissionSchema = createInsertSchema(protocolSubmissions).omit({ submittedAt: true });
export const insertProtocolWhitelistSchema = createInsertSchema(protocolWhitelist).omit({ addedAt: true });
export const insertTwitterAlertSchema = createInsertSchema(bountyTasks); // placeholder kept for import compat
export const insertCertikAuditSchema = createInsertSchema(certikAudits).omit({ lastUpdated: true, fetchedAt: true });
export const insertUserReportSchema = createInsertSchema(userReports).omit({ submittedAt: true, upvotes: true, downvotes: true, verified: true });
export const insertReportVoteSchema = createInsertSchema(reportVotes).omit({ votedAt: true });
export const insertUserReputationSchema = createInsertSchema(userReputation).omit({ createdAt: true, lastActive: true });
export const insertScammerAddressSchema = createInsertSchema(scammerAddresses).omit({ addedAt: true });
export const insertAlertSubscriptionSchema = createInsertSchema(alertSubscriptions).omit({ createdAt: true });
export const insertWebhookEndpointSchema = createInsertSchema(webhookEndpoints).omit({ createdAt: true });
export const insertCommunityUserSchema = createInsertSchema(communityUsers).omit({ createdAt: true, lastActive: true, totalPoints: true });
export const insertBountyTaskSchema = createInsertSchema(bountyTasks).omit({ createdAt: true, updatedAt: true, submissionCount: true });
export const insertBountySubmissionSchema = createInsertSchema(bountySubmissions).omit({ createdAt: true, status: true });
export const insertAuditFirmSchema = createInsertSchema(auditFirms).omit({ createdAt: true, updatedAt: true, verificationStatus: true, totalClaims: true, verifiedClaims: true, postExploitCount: true, communityRating: true, totalReviews: true });
export const insertAuditFirmClaimSchema = createInsertSchema(auditFirmClaims).omit({ submittedAt: true, verificationStatus: true });
export const insertAuditFirmReviewSchema = createInsertSchema(auditFirmReviews).omit({ createdAt: true });

// ==========================================
// SELECT TYPES
// ==========================================

export type Protocol = typeof protocols.$inferSelect;
export type SecurityScan = typeof securityScans.$inferSelect;
export type BlacklistEntry = typeof blacklistEntries.$inferSelect;
export type TutorialVideo = typeof tutorialVideos.$inferSelect;
export type ManualAudit = typeof manualAudits.$inferSelect;
export type SponsorPayment = typeof sponsorPayments.$inferSelect;
export type AdminUser = typeof adminUsers.$inferSelect;
export type ProtocolCustomization = typeof protocolCustomizations.$inferSelect;
export type ProtocolSubmission = typeof protocolSubmissions.$inferSelect;
export type ProtocolWhitelist = typeof protocolWhitelist.$inferSelect;
export type CertikAudit = typeof certikAudits.$inferSelect;
export type AILearnedPattern = typeof aiLearnedPatterns.$inferSelect;
export type AIScanHistory = typeof aiScanHistory.$inferSelect;
export type UserReport = typeof userReports.$inferSelect;
export type ReportVote = typeof reportVotes.$inferSelect;
export type UserReputation = typeof userReputation.$inferSelect;
export type ScammerAddress = typeof scammerAddresses.$inferSelect;
export type AlertSubscription = typeof alertSubscriptions.$inferSelect;
export type WebhookEndpoint = typeof webhookEndpoints.$inferSelect;
export type CommunityUser = typeof communityUsers.$inferSelect;
export type BountyTask = typeof bountyTasks.$inferSelect;
export type BountySubmission = typeof bountySubmissions.$inferSelect;
export type PointsLedgerEntry = typeof pointsLedger.$inferSelect;
export type AuditFirm = typeof auditFirms.$inferSelect;
export type AuditFirmClaim = typeof auditFirmClaims.$inferSelect;
export type AuditFirmReview = typeof auditFirmReviews.$inferSelect;

// Legacy compat aliases used in storage.ts
export type DiscoveredContract = ProtocolSubmission;
export type TwitterAlert = BountyTask;
export type ContractScan = { id: string; [key: string]: any };
export type InsertDiscoveredContract = InsertProtocolSubmission;
export type InsertTwitterAlert = InsertBountyTask;

// ==========================================
// INSERT TYPES
// ==========================================

export type InsertProtocol = z.infer<typeof insertProtocolSchema>;
export type InsertTutorialVideo = z.infer<typeof insertTutorialVideoSchema>;
export type InsertManualAudit = z.infer<typeof insertManualAuditSchema>;
export type InsertSponsorPayment = z.infer<typeof insertSponsorPaymentSchema>;
export type InsertProtocolCustomization = z.infer<typeof insertProtocolCustomizationSchema>;
export type InsertProtocolSubmission = z.infer<typeof insertProtocolSubmissionSchema>;
export type InsertProtocolWhitelist = z.infer<typeof insertProtocolWhitelistSchema>;
export type InsertCertikAudit = z.infer<typeof insertCertikAuditSchema>;
export type InsertUserReport = z.infer<typeof insertUserReportSchema>;
export type InsertReportVote = z.infer<typeof insertReportVoteSchema>;
export type InsertUserReputation = z.infer<typeof insertUserReputationSchema>;
export type InsertScammerAddress = z.infer<typeof insertScammerAddressSchema>;
export type InsertAlertSubscription = z.infer<typeof insertAlertSubscriptionSchema>;
export type InsertWebhookEndpoint = z.infer<typeof insertWebhookEndpointSchema>;
export type InsertCommunityUser = z.infer<typeof insertCommunityUserSchema>;
export type InsertBountyTask = z.infer<typeof insertBountyTaskSchema>;
export type InsertBountySubmission = z.infer<typeof insertBountySubmissionSchema>;
export type InsertAuditFirm = z.infer<typeof insertAuditFirmSchema>;
export type InsertAuditFirmClaim = z.infer<typeof insertAuditFirmClaimSchema>;
export type InsertAuditFirmReview = z.infer<typeof insertAuditFirmReviewSchema>;

// Threat type
export interface Threat {
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
}

// API response types
export const protocolsResponseSchema = z.array(z.custom<Protocol>());
export const scanResponseSchema = z.object({
  protocol: z.custom<Protocol>(),
  scanResult: z.custom<SecurityScan>(),
});
