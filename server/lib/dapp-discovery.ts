import type { Protocol } from '@shared/schema';
import { apiCache } from './api-cache';

// DAppDiscovery - Fetches from DeFiLlama (126+ chains)
export class DAppDiscovery {
  private maxRetries: number;
  private retryDelay: number;

  constructor() {
    this.maxRetries = 3;
    this.retryDelay = 2000;
  }

  async fetchWithRetry(url: string, retries = this.maxRetries): Promise<any> {
    try {
      // CORS Proxy for browser compatibility
      const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl);
      
      if (response.status === 429) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        if (retries > 0) return this.fetchWithRetry(url, retries - 1);
        throw new Error('Rate limit exceeded');
      }
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return this.fetchWithRetry(url, retries - 1);
      }
      throw error;
    }
  }

  async fetchFromMultipleSources(): Promise<Protocol[]> {
    const cached = apiCache.get('protocols');
    if (cached) return cached;

    try {
      const protocols = await this.fetchWithRetry('https://api.llama.fi/protocols');

      if (!Array.isArray(protocols)) {
        throw new Error('Invalid API response: Expected an array');
      }

      const processed: Protocol[] = protocols.map(p => {
        let chains: string[] = [];
        if (Array.isArray(p.chains)) {
          chains = p.chains.filter((c: any) => c && typeof c === 'string');
        } else if (p.chain && typeof p.chain === 'string') {
          chains = [p.chain];
        }

        return {
          id: p.slug || `protocol-${Date.now()}-${Math.random()}`,
          name: p.name || 'Unknown Protocol',
          chains: chains,
          category: this.classifyCategory(p),
          tvl: typeof p.tvl === 'number' ? p.tvl : 0,
          change24h: typeof p.change_1d === 'number' ? p.change_1d : 0,
          age: this.calculateAge(p.listedAt),
          audited: typeof p.audits === 'number' ? p.audits > 0 : false,
          securityScore: this.calculateSecurityScore(p),
          logo: p.logo || null,
          website: p.url || null,
          twitter: p.twitter || null,
          github: p.github || null,
          description: p.description || '',
          autoDiscovered: true,
          manuallyAdded: false,
        };
      });

      apiCache.set('protocols', processed);
      return processed;
    } catch (error) {
      console.error('Failed to fetch protocols:', error);
      // Fallback data
      return this.getFallbackProtocols();
    }
  }

  private getFallbackProtocols(): Protocol[] {
    return [
      {
        id: 'uniswap',
        name: 'Uniswap',
        chains: ['ethereum'],
        category: 'DEX',
        tvl: 5000000000,
        change24h: 2.5,
        age: Math.floor((Date.now() / 1000 - (Date.now() / 1000 - 365 * 86400)) / 86400),
        audited: true,
        securityScore: 95,
        logo: 'https://avatars.githubusercontent.com/u/38646891?v=4',
        website: 'https://uniswap.org',
        twitter: 'Uniswap',
        github: 'Uniswap/uniswap-v3-core',
        description: 'Decentralized exchange on Ethereum',
        autoDiscovered: true,
        manuallyAdded: false,
      },
      {
        id: 'aave',
        name: 'Aave',
        chains: ['ethereum', 'polygon'],
        category: 'Lending',
        tvl: 10000000000,
        change24h: 1.2,
        age: Math.floor((Date.now() / 1000 - (Date.now() / 1000 - 730 * 86400)) / 86400),
        audited: true,
        securityScore: 92,
        logo: 'https://avatars.githubusercontent.com/u/7634462?v=4',
        website: 'https://aave.com',
        twitter: 'AaveAave',
        github: 'aave/aave-v3-core',
        description: 'DeFi lending protocol',
        autoDiscovered: true,
        manuallyAdded: false,
      },
    ];
  }

  private classifyCategory(p: any): string {
    const name = (p.name || '').toLowerCase();
    const cat = (p.category || '').toLowerCase();

    if (cat.includes('dex') || name.includes('swap')) return 'DEX';
    if (cat.includes('lending')) return 'Lending';
    if (cat.includes('yield')) return 'Yield';
    if (cat.includes('bridge')) return 'Bridge';
    if (cat.includes('nft')) return 'NFT';

    return 'DeFi';
  }

  private calculateAge(listedAt: any): number | null {
    if (!listedAt || typeof listedAt !== 'number') return null;

    try {
      const ageInDays = Math.floor((Date.now() / 1000 - listedAt) / 86400);
      return ageInDays >= 0 ? ageInDays : null;
    } catch (error) {
      return null;
    }
  }

  private calculateSecurityScore(p: any): number {
    let score = 50;

    if (typeof p.audits === 'number' && p.audits > 0) score += 25;
    if (typeof p.tvl === 'number' && p.tvl > 100000000) score += 10;
    if (typeof p.tvl === 'number' && p.tvl > 1000000000) score += 5;
    if (p.twitter) score += 5;
    if (p.github) score += 5;

    return Math.max(0, Math.min(100, score));
  }
}
