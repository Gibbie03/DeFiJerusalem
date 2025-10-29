import { z } from 'zod';
import { pgTable, text, boolean, real, integer, timestamp, json, index } from 'drizzle-orm/pg-core';
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
}, (table) => ({
  tvlIdx: index('protocols_tvl_idx').on(table.tvl),
  volume24hIdx: index('protocols_volume24h_idx').on(table.volume24h),
  categoryIdx: index('protocols_category_idx').on(table.category),
  change24hIdx: index('protocols_change24h_idx').on(table.change24h),
  discoveredAtIdx: index('protocols_discovered_at_idx').on(table.discoveredAt),
  sponsoredUntilIdx: index('protocols_sponsored_until_idx').on(table.sponsoredUntil),
  sponsorshipTierIdx: index('protocols_sponsorship_tier_idx').on(table.sponsorshipTier),
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
  protocolIdIdx: index('security_scans_protocol_id_idx').on(table.protocolId),
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
};

export type SecurityScan = {
  isBlacklisted: boolean;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  threats: Threat[];
  score: number;
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

export type Threat = {
  type: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  message: string;
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

export type InsertProtocol = z.infer<typeof insertProtocolSchema>;
export type InsertTutorialVideo = z.infer<typeof insertTutorialVideoSchema>;
export type InsertManualAudit = z.infer<typeof insertManualAuditSchema>;
export type InsertSponsorPayment = z.infer<typeof insertSponsorPaymentSchema>;
export type InsertProtocolCustomization = z.infer<typeof insertProtocolCustomizationSchema>;

// API response types
export const protocolsResponseSchema = z.array(z.custom<Protocol>());
export const scanResponseSchema = z.object({
  protocol: z.custom<Protocol>(),
  scanResult: z.custom<SecurityScan>(),
});
