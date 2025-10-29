import type { BlacklistEntry, SecurityScan, Protocol } from '@shared/schema';
import { calculateLegitimacyScore, extractSecurityMetrics } from './security-verification';

// Type for blacklist entry without timestamp (DB auto-generates)
type BlacklistEntryForInsert = Omit<BlacklistEntry, 'timestamp'>;

// BlacklistManager - Tracks threats
export class BlacklistManager {
  private blacklist: BlacklistEntry[];

  constructor(initialBlacklist: BlacklistEntry[] = []) {
    this.blacklist = [...initialBlacklist];
  }

  addToBlacklist(dapp: Protocol, scanResult: SecurityScan): {
    entry: BlacklistEntryForInsert;
    updatedList: BlacklistEntry[];
  } {
    // Generate reason from threats
    const reason = scanResult.threats.length > 0
      ? scanResult.threats.map(t => t.message).join('; ')
      : `Automatically blacklisted due to ${scanResult.severity} security score (${scanResult.score} points)`;
    
    // Calculate legitimacy score to help identify false positives
    const securityMetrics = extractSecurityMetrics(dapp);
    const { score: legitimacyScore } = calculateLegitimacyScore(dapp, securityMetrics);
    
    // Create entry with social links and security metrics for verification
    const entry: BlacklistEntryForInsert = {
      id: `${Date.now()}-${Math.random()}`,
      dappId: dapp.id,
      dappName: dapp.name,
      website: dapp.website || null,
      twitter: dapp.twitter || null,
      github: dapp.github || null,
      severity: scanResult.severity,
      threats: scanResult.threats,
      reason: reason,
      status: 'ACTIVE',
      legitimacyScore,
      securityMetrics,
      lastVetted: null,
    };
    
    return { entry, updatedList: [...this.blacklist] };
  }

  isBlacklisted(dappId: string): boolean {
    return this.blacklist.some(e => e.dappId === dappId && e.status === 'ACTIVE');
  }

  getBlacklist(): BlacklistEntry[] {
    return [...this.blacklist];
  }
}
