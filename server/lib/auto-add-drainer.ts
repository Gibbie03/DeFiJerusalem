import type { IStorage } from '../storage';
import type { InsertScammerAddress } from '@shared/schema';

/**
 * Automatically adds detected drainer wallet addresses to the database
 * This prevents duplicates and enriches the scammer address intelligence
 */

export interface DetectedDrainer {
  address: string;
  chain: 'ETHEREUM' | 'SOLANA' | string;
  operation?: string; // e.g., "Pink Drainer", "CLINKSINK"
  confidence: 'CONFIRMED' | 'SUSPECTED' | 'HIGH' | 'MEDIUM' | 'LOW';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  totalStolen?: string; // e.g., "$85.3M"
  notes?: string;
  source: string; // e.g., "Wallet Scanner", "GoPlus API", "AI Detection"
  detectionMethod: string; // e.g., "Known drainer database match", "Suspicious vanity pattern"
  evidenceLinks?: string[];
}

/**
 * Auto-add detected drainer to database with deduplication
 */
export async function autoAddDrainerAddress(
  storage: IStorage,
  drainer: DetectedDrainer
): Promise<{ added: boolean; addressId?: string; reason: string }> {
  try {
    const normalizedAddress = drainer.address.toLowerCase().trim();
    const chain = drainer.chain.toLowerCase();

    // Check if address already exists
    const existing = await storage.searchScammerAddress(normalizedAddress, chain);

    if (existing) {
      // Address already in database, optionally update last activity
      if (existing.isActive) {
        await storage.updateScammerAddress(existing.id, {
          lastActivity: new Date(),
          // Optionally update victim count or total stolen if new data is more accurate
        });

        return {
          added: false,
          addressId: existing.id,
          reason: `Address already exists in database (ID: ${existing.id})`,
        };
      } else {
        // Reactivate if previously inactive
        await storage.updateScammerAddress(existing.id, {
          isActive: true,
          lastActivity: new Date(),
        });

        return {
          added: false,
          addressId: existing.id,
          reason: `Address reactivated in database (ID: ${existing.id})`,
        };
      }
    }

    // Prepare new scammer address entry
    const newAddress: InsertScammerAddress = {
      address: normalizedAddress,
      chain: chain,
      addressType: 'wallet', // Most drainers are wallet addresses
      category: 'drainer', // Primary category
      severity: drainer.severity,
      description: generateDescription(drainer),
      associatedScam: drainer.operation || 'Unknown Drainer Operation',
      totalStolen: parseTotalStolen(drainer.totalStolen),
      victimCount: 0, // Will be updated as we gather more intelligence
      lastActivity: new Date(),
      isActive: true,
      relatedAddresses: undefined,
      evidenceLinks: drainer.evidenceLinks || [],
      reportedBy: drainer.source,
      verifiedAt: drainer.confidence === 'CONFIRMED' ? new Date() : undefined,
    };

    // Add to database
    const addedAddress = await storage.addScammerAddress(newAddress);

    console.log(`✅ Auto-added drainer address: ${normalizedAddress} (${chain}) - ${drainer.operation || 'Unknown'}`);

    return {
      added: true,
      addressId: addedAddress.id,
      reason: `New drainer address added to database`,
    };
  } catch (error) {
    console.error('❌ Failed to auto-add drainer address:', error);
    return {
      added: false,
      reason: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Generate a detailed description for the database entry
 */
function generateDescription(drainer: DetectedDrainer): string {
  const parts: string[] = [];

  if (drainer.operation) {
    parts.push(`Associated with ${drainer.operation}`);
  }

  parts.push(`Detected via: ${drainer.detectionMethod}`);

  if (drainer.totalStolen) {
    parts.push(`Estimated stolen: ${drainer.totalStolen}`);
  }

  if (drainer.notes) {
    parts.push(drainer.notes);
  }

  parts.push(`Confidence: ${drainer.confidence}`);
  parts.push(`Source: ${drainer.source}`);

  return parts.join('. ');
}

/**
 * Parse total stolen amount from string to number (USD)
 */
function parseTotalStolen(totalStolen?: string): number {
  if (!totalStolen) return 0;

  // Extract number from strings like "$85.3M", "$900K+", "$120M"
  const match = totalStolen.match(/([\d.]+)\s*([KMB])?/i);
  if (!match) return 0;

  const value = parseFloat(match[1]);
  const multiplier = match[2]?.toUpperCase();

  if (multiplier === 'K') return value * 1_000;
  if (multiplier === 'M') return value * 1_000_000;
  if (multiplier === 'B') return value * 1_000_000_000;

  return value;
}

/**
 * Batch auto-add multiple drainer addresses
 */
export async function autoAddMultipleDrainerAddresses(
  storage: IStorage,
  drainers: DetectedDrainer[]
): Promise<{ 
  totalProcessed: number;
  added: number;
  skipped: number;
  errors: number;
  details: Array<{ address: string; result: string }>;
}> {
  const results = {
    totalProcessed: drainers.length,
    added: 0,
    skipped: 0,
    errors: 0,
    details: [] as Array<{ address: string; result: string }>,
  };

  for (const drainer of drainers) {
    const result = await autoAddDrainerAddress(storage, drainer);

    results.details.push({
      address: drainer.address,
      result: result.reason,
    });

    if (result.added) {
      results.added++;
    } else if (result.reason.includes('Error')) {
      results.errors++;
    } else {
      results.skipped++;
    }
  }

  return results;
}
