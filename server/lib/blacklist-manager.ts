import type { BlacklistEntry, SecurityScan, Protocol } from '@shared/schema';

// BlacklistManager - Tracks threats
export class BlacklistManager {
  private blacklist: BlacklistEntry[];

  constructor(initialBlacklist: BlacklistEntry[] = []) {
    this.blacklist = [...initialBlacklist];
  }

  addToBlacklist(dapp: Protocol, scanResult: SecurityScan): {
    entry: BlacklistEntry;
    updatedList: BlacklistEntry[];
  } {
    // Generate reason from threats
    const reason = scanResult.threats.length > 0
      ? scanResult.threats.map(t => t.message).join('; ')
      : `Automatically blacklisted due to ${scanResult.severity} security score (${scanResult.score} points)`;
    
    const entry: BlacklistEntry = {
      id: `${Date.now()}-${Math.random()}`,
      dappId: dapp.id,
      dappName: dapp.name,
      severity: scanResult.severity,
      threats: scanResult.threats,
      reason: reason,
      status: 'ACTIVE',
      timestamp: new Date().toISOString(), // String for API/frontend
    };
    this.blacklist.push(entry);
    return { entry, updatedList: [...this.blacklist] };
  }

  isBlacklisted(dappId: string): boolean {
    return this.blacklist.some(e => e.dappId === dappId && e.status === 'ACTIVE');
  }

  getBlacklist(): BlacklistEntry[] {
    return [...this.blacklist];
  }
}
