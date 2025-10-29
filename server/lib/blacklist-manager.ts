import type { BlacklistEntry, SecurityScan, Protocol } from '@shared/schema';

// Type for blacklist entry without timestamp and website (DB auto-generates these)
type BlacklistEntryForInsert = Omit<BlacklistEntry, 'timestamp' | 'website'>;

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
    
    // Create entry without timestamp and website (DB will auto-generate timestamp, storage will fetch website)
    const entry: BlacklistEntryForInsert = {
      id: `${Date.now()}-${Math.random()}`,
      dappId: dapp.id,
      dappName: dapp.name,
      severity: scanResult.severity,
      threats: scanResult.threats,
      reason: reason,
      status: 'ACTIVE',
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
