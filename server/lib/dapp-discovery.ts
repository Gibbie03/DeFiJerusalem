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

        // Parse audit count (DeFiLlama returns it as a string!)
        const auditCount = parseInt(p.audits) || 0;
        
        // Parse audit links if available
        let auditLinks: string[] | null = null;
        if (p.audit_links && Array.isArray(p.audit_links)) {
          auditLinks = p.audit_links.filter((link: any) => typeof link === 'string');
        }

        const tvl = typeof p.tvl === 'number' ? p.tvl : 0;
        const change24h = typeof p.change_1d === 'number' ? p.change_1d : 0;
        const category = this.classifyCategory(p);
        
        // Try to get real volume data from DeFiLlama
        // Check multiple possible volume fields that DeFiLlama might provide
        let volume24h = 0;
        if (typeof p.volume24h === 'number') {
          volume24h = p.volume24h;
        } else if (typeof p.total24h === 'number') {
          volume24h = p.total24h;
        } else if (typeof p.dailyVolume === 'number') {
          volume24h = p.dailyVolume;
        } else if (typeof p.totalVolume24h === 'number') {
          volume24h = p.totalVolume24h;
        } else {
          // Fallback: estimate volume based on TVL and activity
          // Different protocols have different turnover rates
          const turnoverMultiplier = 
            category === 'DEX' ? 0.3 : 
            category === 'Derivatives' ? 0.5 :
            category === 'Options' ? 0.4 :
            category === 'Lending' ? 0.05 : 
            category === 'Liquid Staking' ? 0.03 :
            category === 'Bridge' ? 0.2 : 
            category === 'Gaming' ? 0.15 :
            category === 'NFT' ? 0.1 :
            0.08; // Default for other categories
          volume24h = tvl * turnoverMultiplier * (1 + Math.abs(change24h) / 100);
        }
        
        return {
          id: p.slug || `protocol-${Date.now()}-${Math.random()}`,
          name: p.name || 'Unknown Protocol',
          chains: chains,
          category: category,
          tvl: tvl,
          volume24h: volume24h,
          change24h: change24h,
          age: this.calculateAge(p.listedAt),
          audited: auditCount > 0,
          auditCount: auditCount,
          auditNote: p.audit_note || null,
          auditLinks: auditLinks,
          securityScore: this.calculateSecurityScore(p),
          logo: p.logo || null,
          website: p.url || null,
          twitter: p.twitter || null,
          github: p.github || null,
          description: p.description || '',
          autoDiscovered: true,
          manuallyAdded: false,
          discoveredAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
          sponsoredUntil: null,
          sponsorshipTier: 'free' as const,
          featuredPosition: null,
        };
      });

      // NOTE: Test drainers are NOT added here - they're managed in the API route
      // to prevent background refreshes from overwriting them
      apiCache.set('protocols', processed);
      return processed;
    } catch (error) {
      console.error('Failed to fetch protocols:', error);
      // Fallback data
      return this.getFallbackProtocols();
    }
  }

  private getFallbackProtocols(): Protocol[] {
    // NOTE: Test drainers are NOT added here - they're managed in the API route
    const now = new Date().toISOString();
    return [
      {
        id: 'uniswap',
        name: 'Uniswap',
        chains: ['ethereum'],
        category: 'DEX',
        tvl: 5000000000,
        volume24h: 1200000000,
        change24h: 2.5,
        age: Math.floor((Date.now() / 1000 - (Date.now() / 1000 - 365 * 86400)) / 86400),
        audited: true,
        auditCount: 5,
        auditNote: 'Multiple audits by leading firms',
        auditLinks: ['https://github.com/Uniswap/v3-core/tree/main/audits'],
        securityScore: 95,
        logo: 'https://avatars.githubusercontent.com/u/38646891?v=4',
        website: 'https://uniswap.org',
        twitter: 'Uniswap',
        github: 'Uniswap/uniswap-v3-core',
        description: 'Decentralized exchange on Ethereum',
        autoDiscovered: true,
        manuallyAdded: false,
        sponsoredUntil: null,
        sponsorshipTier: 'free',
        featuredPosition: null,
      },
      {
        id: 'aave',
        name: 'Aave',
        chains: ['ethereum', 'polygon'],
        category: 'Lending',
        tvl: 10000000000,
        volume24h: 450000000,
        change24h: 1.2,
        age: Math.floor((Date.now() / 1000 - (Date.now() / 1000 - 730 * 86400)) / 86400),
        audited: true,
        auditCount: 8,
        auditNote: 'Extensively audited DeFi protocol',
        auditLinks: ['https://github.com/aave/aave-v3-core/tree/master/audits'],
        securityScore: 92,
        logo: 'https://avatars.githubusercontent.com/u/7634462?v=4',
        website: 'https://aave.com',
        twitter: 'AaveAave',
        github: 'aave/aave-v3-core',
        description: 'DeFi lending protocol',
        autoDiscovered: true,
        manuallyAdded: false,
        sponsoredUntil: null,
        sponsorshipTier: 'free',
        featuredPosition: null,
      },
    ];
  }

  public getTestDrainerProtocols(): Protocol[] {
    const now = new Date().toISOString();
    return [
      {
        id: 'eth-airdrop-claimer',
        name: 'ETH Airdrop Claimer',
        chains: ['ethereum'],
        category: 'DeFi',
        tvl: 25000,
        volume24h: 5000,
        change24h: 0,
        age: 3,
        audited: false,
        auditCount: 0,
        auditNote: null,
        auditLinks: null,
        securityScore: 25,
        logo: null,
        website: 'https://eth-airdrop-claim.xyz',
        twitter: null,
        github: null,
        description: 'Claim your free ETH airdrop tokens now',
        autoDiscovered: true,
        manuallyAdded: false,
        sponsoredUntil: null,
        sponsorshipTier: 'free',
        featuredPosition: null,
      },
      {
        id: 'unisvvap-fake',
        name: 'Unisvvap',
        chains: ['ethereum'],
        category: 'DEX',
        tvl: 15000,
        volume24h: 3000,
        change24h: 0,
        age: 5,
        audited: false,
        auditCount: 0,
        auditNote: null,
        auditLinks: null,
        securityScore: 30,
        logo: null,
        website: 'https://unisvvap.fi',
        twitter: null,
        github: null,
        description: 'Decentralized exchange',
        autoDiscovered: true,
        manuallyAdded: false,
        sponsoredUntil: null,
        sponsorshipTier: 'free',
        featuredPosition: null,
      },
      {
        id: 'vitalik-giveaway',
        name: 'Vitalik Giveaway 10000 ETH',
        chains: ['ethereum'],
        category: 'DeFi',
        tvl: 8000,
        volume24h: 1600,
        change24h: 0,
        age: 2,
        audited: false,
        auditCount: 0,
        auditNote: null,
        auditLinks: null,
        securityScore: 20,
        logo: null,
        website: null,
        twitter: null,
        github: null,
        description: 'Vitalik Buterin is giving away 10000 ETH to lucky participants',
        autoDiscovered: true,
        manuallyAdded: false,
        sponsoredUntil: null,
        sponsorshipTier: 'free',
        featuredPosition: null,
      },
    ];
  }

  private classifyCategory(p: any): string {
    const name = (p.name || '').toLowerCase();
    const cat = (p.category || '').toLowerCase();

    // Use DeFiLlama's category field directly when available
    if (p.category) {
      // Normalize common category variations
      if (cat.includes('dex')) return 'DEX';
      if (cat.includes('lending')) return 'Lending';
      if (cat.includes('yield')) return 'Yield';
      if (cat.includes('bridge')) return 'Bridge';
      if (cat.includes('nft')) return 'NFT';
      if (cat.includes('gaming') || cat.includes('game')) return 'Gaming';
      if (cat.includes('derivative')) return 'Derivatives';
      if (cat.includes('insurance')) return 'Insurance';
      if (cat.includes('stablecoin')) return 'Stablecoin';
      if (cat.includes('liquid staking') || cat.includes('liquid-staking')) return 'Liquid Staking';
      if (cat.includes('dao')) return 'DAO';
      if (cat.includes('synthetics')) return 'Synthetics';
      if (cat.includes('options')) return 'Options';
      if (cat.includes('prediction')) return 'Prediction Market';
      if (cat.includes('rwa') || cat.includes('real world')) return 'RWA';
      if (cat.includes('cdp')) return 'CDP';
      if (cat.includes('services')) return 'Services';
      if (cat.includes('launchpad')) return 'Launchpad';
      
      // Return capitalized version of DeFiLlama's category
      return p.category.split('-').map((word: string) => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
    }

    // Fallback to name-based classification
    if (name.includes('swap') || name.includes('dex')) return 'DEX';
    if (name.includes('lend') || name.includes('borrow')) return 'Lending';
    if (name.includes('game') || name.includes('play')) return 'Gaming';
    if (name.includes('bridge')) return 'Bridge';
    if (name.includes('nft')) return 'NFT';

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

    // Parse audit count (DeFiLlama returns it as a string!)
    const auditCount = parseInt(p.audits) || 0;
    if (auditCount > 0) score += 25;
    
    if (typeof p.tvl === 'number' && p.tvl > 100000000) score += 10;
    if (typeof p.tvl === 'number' && p.tvl > 1000000000) score += 5;
    if (p.twitter) score += 5;
    if (p.github) score += 5;

    return Math.max(0, Math.min(100, score));
  }
}
