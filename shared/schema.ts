import { z } from 'zod';
import { pgTable, text, boolean, real, integer, timestamp, json, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';

// Database Tables
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
  
  // Activity Metrics (DApp Repository Features)
  dailyActiveWallets: integer('daily_active_wallets').default(0),
  weeklyActiveWallets: integer('weekly_active_wallets').default(0),
  monthlyActiveWallets: integer('monthly_active_wallets').default(0),
  transactions24h: integer('transactions_24h').default(0),
  transactions7d: integer('transactions_7d').default(0),
  contractCalls24h: integer('contract_calls_24h').default(0),
  activityHistory: json('activity_history').$type<Array<{ date: string; wallets: number; transactions: number }>>(),
  
  // Rankings
  rankByActivity: integer('rank_by_activity'),
  rankByTvl: integer('rank_by_tvl'),
  rankByVolume: integer('rank_by_volume'),
}, (table) => ({
  tvlIdx: index('protocols_tvl_idx').on(table.tvl),
  volume24hIdx: index('protocols_volume24h_idx').on(table.volume24h),
  categoryIdx: index('protocols_category_idx').on(table.category),
  change24hIdx: index('protocols_change24h_idx').on(table.change24h),
  discoveredAtIdx: index('protocols_discovered_at_idx').on(table.discoveredAt),
  sponsoredUntilIdx: index('protocols_sponsored_until_idx').on(table.sponsoredUntil),
  sponsorshipTierIdx: index('protocols_sponsorship_tier_idx').on(table.sponsorshipTier),
  dailyActiveWalletsIdx: index('protocols_daily_active_wallets_idx').on(table.dailyActiveWallets),
  rankByActivityIdx: index('protocols_rank_by_activity_idx').on(table.rankByActivity),
}));

export const securityScans = pgTable('security_scans', {
  id: text('id').primaryKey(),
  protocolId: text('protocol_id').notNull().references(() => protocols.id),
  isBlacklisted: boolean('is_blacklisted').notNull(),
  severity: text('severity').notNull(),
  threats: json('threats').$type<Array<{ type: string; severity: string; message: string }>>().notNull(),
  score: real('score').notNull(),
  scannedAt: timestamp('scanned_at').notNull().defaultNow(),
}, (table) => ({
  protocolIdIdx: uniqueIndex('security_scans_protocol_id_unique_idx').on(table.protocolId),
  scannedAtIdx: index('security_scans_scanned_at_idx').on(table.scannedAt),
}));

export const blacklistEntries = pgTable('blacklist_entries', {
  id: text('id').primaryKey(),
  dappId: text('dapp_id').notNull(),
  dappName: text('dapp_name').notNull(),
  severity: text('severity').notNull(),
  threats: json('threats').$type<Array<{ type: string; severity: string; message: string }>>().notNull(),
  reason: text('reason'),
  status: text('status').notNull(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  website: text('website'),
  twitter: text('twitter'),
  github: text('github'),
  legitimacyScore: real('legitimacy_score').default(0),
  securityMetrics: json('security_metrics').$type<{
    hasAudit: boolean;
    auditFirms: string[];
    tvl: number;
    holderCount: number | null;
    hasOpenSource: boolean;
    hasMultisig: boolean;
    hasTimelock: boolean;
    hasBugBounty: boolean;
    hasDoxxedTeam: boolean;
    communitySize: number | null;
  }>(),
  lastVetted: timestamp('last_vetted'),
}, (table) => ({
  dappIdIdx: uniqueIndex('blacklist_entries_dapp_id_unique_idx').on(table.dappId),
  timestampIdx: index('blacklist_entries_timestamp_idx').on(table.timestamp),
  statusIdx: index('blacklist_entries_status_idx').on(table.status),
}));

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
  protocolId: text('protocol_id').notNull().references(() => protocols.id),
  tier: text('tier').notNull(),
  startDate: timestamp('start_date').notNull().defaultNow(),
  endDate: timestamp('end_date').notNull(),
  amount: real('amount').notNull(),
  status: text('status').notNull().default('pending'),
  invoiceUrl: text('invoice_url'),
  contactEmail: text('contact_email').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  protocolIdIdx: index('sponsor_payments_protocol_id_idx').on(table.protocolId),
  statusIdx: index('sponsor_payments_status_idx').on(table.status),
}));

export const discoveredContracts = pgTable('discovered_contracts', {
  id: text('id').primaryKey(),
  contractAddress: text('contract_address').notNull(),
  contractName: text('contract_name'),
  chain: text('chain').notNull(),
  contractType: text('contract_type'),
  verifiedAt: timestamp('verified_at'),
  discoveredAt: timestamp('discovered_at').notNull().defaultNow(),
  compilerVersion: text('compiler_version'),
  optimization: boolean('optimization'),
  sourceCode: text('source_code'),
  abi: json('abi').$type<any[]>(),
  creatorAddress: text('creator_address'),
  txHash: text('tx_hash'),
  explorerUrl: text('explorer_url'),
  status: text('status').notNull().default('pending'),
  reviewedAt: timestamp('reviewed_at'),
  promotedToProtocol: boolean('promoted_to_protocol').default(false),
  protocolId: text('protocol_id'),
  metadata: json('metadata').$type<{
    isERC20?: boolean;
    isERC721?: boolean;
    isProxy?: boolean;
    isGovernance?: boolean;
    hasLiquidity?: boolean;
    estimatedTVL?: number;
    socialLinks?: { website?: string; twitter?: string; github?: string };
    license?: string;
    txCount?: number;
    balance?: string;
    source?: 'defillama' | 'etherscan-scraper';
  }>(),
}, (table) => ({
  chainIdx: index('discovered_contracts_chain_idx').on(table.chain),
  discoveredAtIdx: index('discovered_contracts_discovered_at_idx').on(table.discoveredAt),
  statusIdx: index('discovered_contracts_status_idx').on(table.status),
  contractAddressIdx: index('discovered_contracts_address_idx').on(table.contractAddress),
  uniqueContractChain: uniqueIndex('discovered_contracts_unique_contract_chain').on(table.contractAddress, table.chain),
}));

export const adminUsers = pgTable('admin_users', {
  id: text('id').primaryKey(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  email: text('email').notNull(),
  role: text('role').notNull().default('admin'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  lastLogin: timestamp('last_login'),
}, (table) => ({
  usernameIdx: index('admin_users_username_idx').on(table.username),
}));

export const protocolCustomizations = pgTable('protocol_customizations', {
  id: text('id').primaryKey(),
  protocolId: text('protocol_id').notNull().references(() => protocols.id),
  requestorEmail: text('requestor_email').notNull(),
  requestorName: text('requestor_name'),
  customDescription: text('custom_description'),
  customWebsite: text('custom_website'),
  customTwitter: text('custom_twitter'),
  customGithub: text('custom_github'),
  customAuditLinks: json('custom_audit_links').$type<string[]>(),
  customLogo: text('custom_logo'),
  paymentAmount: real('payment_amount').notNull().default(200),
  paymentStatus: text('payment_status').notNull().default('pending'),
  paymentCurrency: text('payment_currency'),
  paymentTxHash: text('payment_tx_hash'),
  paymentAddress: text('payment_address'),
  status: text('status').notNull().default('pending'),
  reviewNotes: text('review_notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  approvedAt: timestamp('approved_at'),
  appliedAt: timestamp('applied_at'),
}, (table) => ({
  protocolIdIdx: index('protocol_customizations_protocol_id_idx').on(table.protocolId),
  statusIdx: index('protocol_customizations_status_idx').on(table.status),
  paymentStatusIdx: index('protocol_customizations_payment_status_idx').on(table.paymentStatus),
}));

export const protocolSubmissions = pgTable('protocol_submissions', {
  id: text('id').primaryKey(),
  submitterEmail: text('submitter_email').notNull(),
  submitterName: text('submitter_name'),
  protocolName: text('protocol_name').notNull(),
  website: text('website').notNull(),
  chains: json('chains').$type<string[]>().notNull(),
  category: text('category').notNull(),
  contractAddresses: json('contract_addresses').$type<Record<string, string>>(),
  description: text('description').notNull(),
  logo: text('logo'),
  twitter: text('twitter'),
  github: text('github'),
  telegram: text('telegram'),
  discord: text('discord'),
  auditLinks: json('audit_links').$type<string[]>(),
  status: text('status').notNull().default('pending'),
  adminNotes: text('admin_notes'),
  securityScanResult: json('security_scan_result').$type<any>(),
  submittedAt: timestamp('submitted_at').notNull().defaultNow(),
  reviewedAt: timestamp('reviewed_at'),
  reviewedBy: text('reviewed_by'),
}, (table) => ({
  submitterEmailIdx: index('protocol_submissions_submitter_email_idx').on(table.submitterEmail),
  statusIdx: index('protocol_submissions_status_idx').on(table.status),
  submittedAtIdx: index('protocol_submissions_submitted_at_idx').on(table.submittedAt),
}));

export const protocolWhitelist = pgTable('protocol_whitelist', {
  id: text('id').primaryKey(),
  protocolId: text('protocol_id').notNull().unique(),
  protocolName: text('protocol_name').notNull(),
  reason: text('reason').notNull(),
  verificationSource: text('verification_source').notNull(),
  certikScore: real('certik_score'),
  defiSafetyScore: real('defi_safety_score'),
  minTvl: real('min_tvl'),
  exchangeListings: json('exchange_listings').$type<string[]>(),
  addedBy: text('added_by').notNull().default('system'),
  addedAt: timestamp('added_at').notNull().defaultNow(),
  lastVerified: timestamp('last_verified').notNull().defaultNow(),
}, (table) => ({
  protocolIdIdx: index('protocol_whitelist_protocol_id_idx').on(table.protocolId),
}));

export const contractScans = pgTable('contract_scans', {
  id: text('id').primaryKey(),
  protocolId: text('protocol_id').references(() => protocols.id),
  contractAddress: text('contract_address').notNull(),
  chain: text('chain').notNull(),
  isHoneypot: boolean('is_honeypot'),
  cannotBuy: boolean('cannot_buy'),
  cannotSell: boolean('cannot_sell'),
  buyTax: real('buy_tax'),
  sellTax: real('sell_tax'),
  hiddenOwner: boolean('hidden_owner'),
  isProxy: boolean('is_proxy'),
  isOpenSource: boolean('is_open_source'),
  ownerChangeBalance: boolean('owner_change_balance'),
  canTakeBackOwnership: boolean('can_take_back_ownership'),
  tradingCooldown: boolean('trading_cooldown'),
  transferPausable: boolean('transfer_pausable'),
  holders: integer('holders'),
  totalSupply: text('total_supply'),
  threats: json('threats').$type<Array<{ type: string; severity: string; message: string }>>().notNull(),
  riskScore: real('risk_score').notNull(),
  severity: text('severity').notNull(),
  rawData: json('raw_data').$type<any>(),
  scannedAt: timestamp('scanned_at').notNull().defaultNow(),
}, (table) => ({
  protocolIdIdx: index('contract_scans_protocol_id_idx').on(table.protocolId),
  contractAddressIdx: index('contract_scans_address_idx').on(table.contractAddress),
  chainIdx: index('contract_scans_chain_idx').on(table.chain),
  scannedAtIdx: index('contract_scans_scanned_at_idx').on(table.scannedAt),
}));

export const twitterAlerts = pgTable('twitter_alerts', {
  id: text('id').primaryKey(),
  tweetId: text('tweet_id').notNull().unique(),
  authorId: text('author_id').notNull(),
  authorUsername: text('author_username'),
  tweetText: text('tweet_text').notNull(),
  alertType: text('alert_type').notNull(),
  category: text('category').notNull(),
  severity: text('severity').notNull(),
  matchedKeywords: json('matched_keywords').$type<string[]>().notNull(),
  extractedUrls: json('extracted_urls').$type<string[]>(),
  hashtags: json('hashtags').$type<string[]>(),
  mentions: json('mentions').$type<string[]>(),
  protocolMentioned: text('protocol_mentioned'),
  isSuspicious: boolean('is_suspicious').notNull().default(false),
  blacklistedDomain: text('blacklisted_domain'),
  crossReferencedProtocol: text('cross_referenced_protocol'),
  status: text('status').notNull().default('pending'),
  reviewNotes: text('review_notes'),
  tweetCreatedAt: timestamp('tweet_created_at').notNull(),
  detectedAt: timestamp('detected_at').notNull().defaultNow(),
  reviewedAt: timestamp('reviewed_at'),
}, (table) => ({
  tweetIdIdx: index('twitter_alerts_tweet_id_idx').on(table.tweetId),
  alertTypeIdx: index('twitter_alerts_alert_type_idx').on(table.alertType),
  categoryIdx: index('twitter_alerts_category_idx').on(table.category),
  severityIdx: index('twitter_alerts_severity_idx').on(table.severity),
  statusIdx: index('twitter_alerts_status_idx').on(table.status),
  detectedAtIdx: index('twitter_alerts_detected_at_idx').on(table.detectedAt),
}));

export const certikAudits = pgTable('certik_audits', {
  id: text('id').primaryKey(),
  protocolId: text('protocol_id').notNull().references(() => protocols.id),
  protocolName: text('protocol_name').notNull(),
  securityScore: real('security_score'),
  codeSecurityScore: real('code_security_score'),
  marketScore: real('market_score'),
  governanceScore: real('governance_score'),
  hasAudit: boolean('has_audit').notNull().default(false),
  auditDate: timestamp('audit_date'),
  auditStatus: text('audit_status'),
  auditReportUrl: text('audit_report_url'),
  vulnerabilities: json('vulnerabilities').$type<Array<{
    severity: string;
    category: string;
    description: string;
    status: string;
  }>>(),
  riskCategories: json('risk_categories').$type<{
    codeRisk: string;
    marketRisk: string;
    governanceRisk: string;
    operationalRisk: string;
  }>(),
  onChainMonitoring: boolean('on_chain_monitoring').default(false),
  kycVerified: boolean('kyc_verified').default(false),
  bugBountyProgram: boolean('bug_bounty_program').default(false),
  certikSkynetUrl: text('certik_skynet_url'),
  dataSource: text('data_source').notNull().default('skynet_scraper'),
  lastUpdated: timestamp('last_updated').notNull().defaultNow(),
  fetchedAt: timestamp('fetched_at').notNull().defaultNow(),
}, (table) => ({
  protocolIdIdx: index('certik_audits_protocol_id_idx').on(table.protocolId),
  securityScoreIdx: index('certik_audits_security_score_idx').on(table.securityScore),
  fetchedAtIdx: index('certik_audits_fetched_at_idx').on(table.fetchedAt),
}));

// AI Learning Pattern Persistence (Phase 2)
export const aiLearnedPatterns = pgTable('ai_learned_patterns', {
  id: text('id').primaryKey(),
  pattern: text('pattern').notNull(),
  severity: text('severity').notNull(),
  category: text('category').notNull(),
  confidence: real('confidence').notNull(),
  occurrences: integer('occurrences').notNull().default(1),
  examples: json('examples').$type<string[]>().notNull().default([]),
  firstSeen: timestamp('first_seen').notNull().defaultNow(),
  lastSeen: timestamp('last_seen').notNull().defaultNow(),
}, (table) => ({
  patternIdx: uniqueIndex('ai_learned_patterns_pattern_idx').on(table.pattern, table.severity),
  confidenceIdx: index('ai_learned_patterns_confidence_idx').on(table.confidence),
  categoryIdx: index('ai_learned_patterns_category_idx').on(table.category),
  lastSeenIdx: index('ai_learned_patterns_last_seen_idx').on(table.lastSeen),
}));

export const aiScanHistory = pgTable('ai_scan_history', {
  id: text('id').primaryKey(),
  entityId: text('entity_id').notNull(),
  entityName: text('entity_name').notNull(),
  entityType: text('entity_type').notNull(),
  threats: json('threats').$type<Array<{ type: string; severity: string; message: string }>>().notNull(),
  severity: text('severity').notNull(),
  score: real('score').notNull(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
}, (table) => ({
  entityIdIdx: index('ai_scan_history_entity_id_idx').on(table.entityId),
  entityTypeIdx: index('ai_scan_history_entity_type_idx').on(table.entityType),
  timestampIdx: index('ai_scan_history_timestamp_idx').on(table.timestamp),
}));

// TypeScript Types - manually defined to use strings for timestamps
export type Protocol = {
  id: string;
  name: string;
  chains: string[];
  category: string;
  tvl: number;
  volume24h: number;
  change24h: number;
  age: number | null;
  audited: boolean;
  auditCount: number;
  auditNote: string | null;
  auditLinks: string[] | null;
  securityScore: number;
  logo: string | null;
  website: string | null;
  twitter: string | null;
  github: string | null;
  description: string;
  autoDiscovered: boolean;
  manuallyAdded: boolean;
  sponsoredUntil: string | null;
  sponsorshipTier: 'free' | 'featured' | 'sponsored';
  featuredPosition: number | null;
  defiSecurityScore: number | null;
  defiAuditReports: Array<{ auditor: string; date: string; reportUrl: string }> | null;
  defiHasMultisig: boolean | null;
  defiHasTimelock: boolean | null;
  defiDataFetchedAt: string | null;
  contractAddress: string | null;
  contractChain: string | null;
  
  // Activity Metrics
  dailyActiveWallets: number;
  weeklyActiveWallets: number;
  monthlyActiveWallets: number;
  transactions24h: number;
  transactions7d: number;
  contractCalls24h: number;
  activityHistory: Array<{ date: string; wallets: number; transactions: number }> | null;
  
  // Rankings
  rankByActivity: number | null;
  rankByTvl: number | null;
  rankByVolume: number | null;
};

export type SecurityScan = {
  isBlacklisted: boolean;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  threats: Threat[];
  score: number;
  scannedAt: string;
};

export type SecurityMetrics = {
  hasAudit: boolean;
  auditFirms: string[];
  tvl: number;
  holderCount: number | null;
  hasOpenSource: boolean;
  hasMultisig: boolean;
  hasTimelock: boolean;
  hasBugBounty: boolean;
  hasDoxxedTeam: boolean;
  communitySize: number | null;
};

export type BlacklistEntry = {
  id: string;
  dappId: string;
  dappName: string;
  website: string | null;
  twitter: string | null;
  github: string | null;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  threats: Threat[];
  reason: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  timestamp: string;
  legitimacyScore: number;
  securityMetrics: SecurityMetrics | null;
  lastVetted: string | null;
};

export type TutorialVideo = {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string | null;
  duration: number | null;
  category: string;
  uploadedAt: string;
};

export type ManualAudit = {
  id: string;
  protocolId: string;
  auditFirm: string;
  auditDate: string;
  reportUrl: string | null;
  findings: string | null;
  addedAt: string;
};

export type SponsorPayment = {
  id: string;
  protocolId: string;
  tier: 'featured' | 'sponsored';
  startDate: string;
  endDate: string;
  amount: number;
  status: 'pending' | 'active' | 'expired' | 'cancelled';
  invoiceUrl: string | null;
  contactEmail: string;
  notes: string | null;
  createdAt: string;
};

export type AdminUser = {
  id: string;
  username: string;
  passwordHash: string;
  email: string;
  role: string;
  createdAt: string;
  lastLogin: string | null;
};

export type ProtocolCustomization = {
  id: string;
  protocolId: string;
  requestorEmail: string;
  requestorName: string | null;
  customDescription: string | null;
  customWebsite: string | null;
  customTwitter: string | null;
  customGithub: string | null;
  customAuditLinks: string[] | null;
  customLogo: string | null;
  paymentAmount: number;
  paymentStatus: 'pending' | 'paid' | 'confirmed' | 'failed';
  paymentCurrency: string | null;
  paymentTxHash: string | null;
  paymentAddress: string | null;
  status: 'pending' | 'payment_pending' | 'under_review' | 'approved' | 'rejected' | 'applied';
  reviewNotes: string | null;
  createdAt: string;
  approvedAt: string | null;
  appliedAt: string | null;
};

export type ProtocolSubmission = {
  id: string;
  submitterEmail: string;
  submitterName: string | null;
  protocolName: string;
  website: string;
  chains: string[];
  category: string;
  contractAddresses: Record<string, string> | null;
  description: string;
  logo: string | null;
  twitter: string | null;
  github: string | null;
  telegram: string | null;
  discord: string | null;
  auditLinks: string[] | null;
  status: 'pending' | 'approved' | 'rejected';
  adminNotes: string | null;
  securityScanResult: any | null;
  submittedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
};

export type DiscoveredContract = {
  id: string;
  contractAddress: string;
  contractName: string | null;
  chain: string;
  contractType: string | null;
  verifiedAt: string | null;
  discoveredAt: string;
  compilerVersion: string | null;
  optimization: boolean | null;
  sourceCode: string | null;
  abi: any[] | null;
  creatorAddress: string | null;
  txHash: string | null;
  explorerUrl: string | null;
  status: 'pending' | 'reviewed' | 'approved' | 'rejected';
  reviewedAt: string | null;
  promotedToProtocol: boolean;
  protocolId: string | null;
  metadata: {
    isERC20?: boolean;
    isERC721?: boolean;
    isProxy?: boolean;
    isGovernance?: boolean;
    hasLiquidity?: boolean;
    estimatedTVL?: number;
    socialLinks?: { website?: string; twitter?: string; github?: string };
  } | null;
};

export type ProtocolWhitelist = {
  id: string;
  protocolId: string;
  protocolName: string;
  reason: string;
  verificationSource: string;
  certikScore: number | null;
  defiSafetyScore: number | null;
  minTvl: number | null;
  exchangeListings: string[] | null;
  addedBy: string;
  addedAt: string;
  lastVerified: string;
};

export type TwitterAlert = {
  id: string;
  tweetId: string;
  authorId: string;
  authorUsername: string | null;
  tweetText: string;
  alertType: 'airdrop' | 'migration' | 'scam' | 'audit' | 'vulnerability';
  category: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  matchedKeywords: string[];
  extractedUrls: string[] | null;
  hashtags: string[] | null;
  mentions: string[] | null;
  protocolMentioned: string | null;
  isSuspicious: boolean;
  blacklistedDomain: string | null;
  crossReferencedProtocol: string | null;
  status: 'pending' | 'reviewed' | 'flagged' | 'dismissed';
  reviewNotes: string | null;
  tweetCreatedAt: string;
  detectedAt: string;
  reviewedAt: string | null;
};

export type CertikAudit = {
  id: string;
  protocolId: string;
  protocolName: string;
  securityScore: number | null;
  codeSecurityScore: number | null;
  marketScore: number | null;
  governanceScore: number | null;
  hasAudit: boolean;
  auditDate: string | null;
  auditStatus: string | null;
  auditReportUrl: string | null;
  vulnerabilities: Array<{
    severity: string;
    category: string;
    description: string;
    status: string;
  }> | null;
  riskCategories: {
    codeRisk: string;
    marketRisk: string;
    governanceRisk: string;
    operationalRisk: string;
  } | null;
  onChainMonitoring: boolean;
  kycVerified: boolean;
  bugBountyProgram: boolean;
  certikSkynetUrl: string | null;
  dataSource: string;
  lastUpdated: string;
  fetchedAt: string;
};

export type Threat = {
  type: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  message: string;
};

export type ContractScan = {
  id: string;
  protocolId: string | null;
  contractAddress: string;
  chain: string;
  isHoneypot: boolean | null;
  cannotBuy: boolean | null;
  cannotSell: boolean | null;
  buyTax: number | null;
  sellTax: number | null;
  hiddenOwner: boolean | null;
  isProxy: boolean | null;
  isOpenSource: boolean | null;
  ownerChangeBalance: boolean | null;
  canTakeBackOwnership: boolean | null;
  tradingCooldown: boolean | null;
  transferPausable: boolean | null;
  holders: number | null;
  totalSupply: string | null;
  threats: Threat[];
  riskScore: number;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  rawData: any | null;
  scannedAt: string;
};

export type AILearnedPattern = {
  id: string;
  pattern: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  category: string;
  confidence: number;
  occurrences: number;
  examples: string[];
  firstSeen: string;
  lastSeen: string;
};

export type AIScanHistory = {
  id: string;
  entityId: string;
  entityName: string;
  entityType: 'protocol' | 'wallet' | 'website';
  threats: Threat[];
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  score: number;
  timestamp: string;
};

// Zod Insert Schemas from Drizzle
export const insertProtocolSchema = createInsertSchema(protocols).omit({ 
  discoveredAt: true, 
  lastUpdated: true 
});

export const insertTutorialVideoSchema = createInsertSchema(tutorialVideos).omit({ 
  id: true, 
  uploadedAt: true 
});

export const insertManualAuditSchema = createInsertSchema(manualAudits).omit({ 
  id: true, 
  addedAt: true 
});

export const insertSponsorPaymentSchema = createInsertSchema(sponsorPayments).omit({ 
  id: true, 
  createdAt: true 
});

export const insertProtocolCustomizationSchema = createInsertSchema(protocolCustomizations).omit({ 
  id: true, 
  createdAt: true,
  approvedAt: true,
  appliedAt: true
});

export const insertProtocolSubmissionSchema = createInsertSchema(protocolSubmissions).omit({ 
  id: true, 
  submittedAt: true,
  reviewedAt: true,
  reviewedBy: true,
  adminNotes: true,
  securityScanResult: true,
  status: true
});

export const insertDiscoveredContractSchema = createInsertSchema(discoveredContracts).omit({ 
  id: true, 
  discoveredAt: true,
  reviewedAt: true
});

export const insertProtocolWhitelistSchema = createInsertSchema(protocolWhitelist).omit({ 
  id: true, 
  addedAt: true,
  lastVerified: true
});

export const insertTwitterAlertSchema = createInsertSchema(twitterAlerts).omit({ 
  id: true, 
  detectedAt: true,
  reviewedAt: true
});

export const insertCertikAuditSchema = createInsertSchema(certikAudits).omit({ 
  id: true, 
  lastUpdated: true,
  fetchedAt: true
});

export type InsertProtocol = z.infer<typeof insertProtocolSchema>;
export type InsertTutorialVideo = z.infer<typeof insertTutorialVideoSchema>;
export type InsertManualAudit = z.infer<typeof insertManualAuditSchema>;
export type InsertSponsorPayment = z.infer<typeof insertSponsorPaymentSchema>;
export type InsertDiscoveredContract = z.infer<typeof insertDiscoveredContractSchema>;
export type InsertProtocolCustomization = z.infer<typeof insertProtocolCustomizationSchema>;
export type InsertProtocolSubmission = z.infer<typeof insertProtocolSubmissionSchema>;
export type InsertProtocolWhitelist = z.infer<typeof insertProtocolWhitelistSchema>;
export type InsertTwitterAlert = z.infer<typeof insertTwitterAlertSchema>;
export type InsertCertikAudit = z.infer<typeof insertCertikAuditSchema>;

// API response types
export const protocolsResponseSchema = z.array(z.custom<Protocol>());
export const scanResponseSchema = z.object({
  protocol: z.custom<Protocol>(),
  scanResult: z.custom<SecurityScan>(),
});
