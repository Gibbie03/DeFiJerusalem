import type { Protocol, BlacklistEntry, SecurityScan } from "@shared/schema";

export interface IStorage {
  getProtocols(): Promise<Protocol[]>;
  addProtocol(protocol: Protocol): Promise<Protocol>;
  getBlacklist(): Promise<BlacklistEntry[]>;
  addToBlacklist(entry: BlacklistEntry): Promise<BlacklistEntry>;
  getSecurityScan(protocolId: string): Promise<SecurityScan | undefined>;
  addSecurityScan(protocolId: string, scan: SecurityScan): Promise<void>;
}

export class MemStorage implements IStorage {
  private protocols: Map<string, Protocol>;
  private blacklist: Map<string, BlacklistEntry>;
  private securityScans: Map<string, SecurityScan>;

  constructor() {
    this.protocols = new Map();
    this.blacklist = new Map();
    this.securityScans = new Map();
  }

  async getProtocols(): Promise<Protocol[]> {
    return Array.from(this.protocols.values());
  }

  async addProtocol(protocol: Protocol): Promise<Protocol> {
    this.protocols.set(protocol.id, protocol);
    return protocol;
  }

  async getBlacklist(): Promise<BlacklistEntry[]> {
    return Array.from(this.blacklist.values());
  }

  async addToBlacklist(entry: BlacklistEntry): Promise<BlacklistEntry> {
    this.blacklist.set(entry.id, entry);
    return entry;
  }

  async getSecurityScan(protocolId: string): Promise<SecurityScan | undefined> {
    return this.securityScans.get(protocolId);
  }

  async addSecurityScan(protocolId: string, scan: SecurityScan): Promise<void> {
    this.securityScans.set(protocolId, scan);
  }
}

export const storage = new MemStorage();
