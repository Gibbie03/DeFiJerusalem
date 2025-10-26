import { z } from 'zod';

// Protocol schema
export const protocolSchema = z.object({
  id: z.string(),
  name: z.string(),
  chains: z.array(z.string()),
  category: z.string(),
  tvl: z.number(),
  change24h: z.number(),
  age: z.number().nullable(),
  audited: z.boolean(),
  securityScore: z.number(),
  logo: z.string().nullable(),
  website: z.string().nullable(),
  twitter: z.string().nullable(),
  github: z.string().nullable(),
  description: z.string(),
  autoDiscovered: z.boolean().default(false),
  manuallyAdded: z.boolean().default(false),
});

export type Protocol = z.infer<typeof protocolSchema>;

export const insertProtocolSchema = protocolSchema;
export type InsertProtocol = z.infer<typeof insertProtocolSchema>;

// Threat schema
export const threatSchema = z.object({
  type: z.string(),
  severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
  message: z.string(),
});

export type Threat = z.infer<typeof threatSchema>;

// Security scan result schema
export const securityScanSchema = z.object({
  isBlacklisted: z.boolean(),
  severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
  threats: z.array(threatSchema),
  score: z.number(),
});

export type SecurityScan = z.infer<typeof securityScanSchema>;

// Blacklist entry schema
export const blacklistEntrySchema = z.object({
  id: z.string(),
  dappId: z.string(),
  dappName: z.string(),
  severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
  threats: z.array(threatSchema),
  status: z.enum(['ACTIVE', 'INACTIVE']),
  timestamp: z.string(),
});

export type BlacklistEntry = z.infer<typeof blacklistEntrySchema>;

// API response types
export const protocolsResponseSchema = z.array(protocolSchema);
export const scanResponseSchema = z.object({
  protocol: protocolSchema,
  scanResult: securityScanSchema,
});
