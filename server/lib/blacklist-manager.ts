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
    const entry: BlacklistEntry = {
      id: `${Date.now()}-${Math.random()}`,
      dappId: dapp.id,
      dappName: dapp.name,
      severity: scanResult.severity,
      threats: scanResult.threats,
      status: 'ACTIVE',
      timestamp: new Date().toISOString(),
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
