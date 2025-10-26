import { z } from 'zod';
import { pgTable, text, boolean, real, integer, timestamp, json } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';

// Database Tables
export const protocols = pgTable('protocols', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  chains: json('chains').$type<string[]>().notNull(),
  category: text('category').notNull(),
  tvl: real('tvl').notNull(),
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
  threats: json('threats').$type<Array<{ type: string; severity: string; message: string }>>().notNull(),
  reason: text('reason'),
  status: text('status').notNull(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
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

// TypeScript Types - manually defined to use strings for timestamps
export type Protocol = {
  id: string;
  name: string;
  chains: string[];
  category: string;
  tvl: number;
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
};

export type SecurityScan = {
  isBlacklisted: boolean;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  threats: Threat[];
  score: number;
};

export type BlacklistEntry = {
  id: string;
  dappId: string;
  dappName: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  threats: Threat[];
  reason: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  timestamp: string;
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

export type InsertProtocol = z.infer<typeof insertProtocolSchema>;
export type InsertTutorialVideo = z.infer<typeof insertTutorialVideoSchema>;

// API response types
export const protocolsResponseSchema = z.array(z.custom<Protocol>());
export const scanResponseSchema = z.object({
  protocol: z.custom<Protocol>(),
  scanResult: z.custom<SecurityScan>(),
});
