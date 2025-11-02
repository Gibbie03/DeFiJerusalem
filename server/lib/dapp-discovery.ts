import type { Protocol } from '@shared/schema';
import { apiCache } from './api-cache';
import { extractContractFromProtocolLinks, normalizeChainName } from './contract-extractor';

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
      // Server-side: Call APIs directly (no CORS proxy needed)
      console.log(`[FETCH] Attempting to fetch: ${url}`);
      const response = await fetch(url);
      
      console.log(`[FETCH] Response status: ${response.status} for ${url}`);
      
      if (response.status === 429) {
        console.warn(`[FETCH] Rate limited, waiting 5s before retry...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
        if (retries > 0) return this.fetchWithRetry(url, retries - 1);
        throw new Error('Rate limit exceeded');
      }
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`[FETCH] Successfully fetched data from ${url}`);
      return data;
    } catch (error) {
      console.error(`[FETCH] Error fetching ${url}:`, error);
      if (retries > 0) {
        console.log(`[FETCH] Retrying... (${retries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return this.fetchWithRetry(url, retries - 1);
      }
      throw error;
    }
  }

  async fetchVolumeData(): Promise<Record<string, number>> {
    console.log('[VOLUME] Starting volume data fetch from DeFiLlama...');
    const volumeData: Record<string, number> = {};
    
    // List of volume endpoints to fetch
    const endpoints = [
      'dexs',
      'derivatives',
      'options',
      'aggregators',
      'fees',  // Includes lending, liquid staking, etc.
    ];
    
    console.log(`[VOLUME] Fetching from ${endpoints.length} DeFiLlama endpoints...`);
    
    // Fetch all endpoints in parallel with individual error handling
    const results = await Promise.allSettled(
      endpoints.map(endpoint => 
        this.fetchWithRetry(
          `https://api.llama.fi/overview/${endpoint}?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true`
        )
      )
    );
    
    // Process each successful result
    let successfulEndpoints = 0;
    let failedEndpoints = 0;
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successfulEndpoints++;
        const data = result.value;
        if (data.protocols && Array.isArray(data.protocols)) {
          let endpointProtocolCount = 0;
          data.protocols.forEach((p: any) => {
            const name = p.name?.toLowerCase();
            if (!name) return;
            
            // Aggregate volume from multiple sources (total24h, dailyFees, dailyRevenue)
            const volume = p.total24h || p.dailyFees || p.dailyRevenue || 0;
            if (volume && typeof volume === 'number') {
              volumeData[name] = (volumeData[name] || 0) + volume;
              endpointProtocolCount++;
            }
          });
          console.log(`[VOLUME] ✓ ${endpoints[index]}: ${endpointProtocolCount} protocols with volume data`);
        } else {
          console.warn(`[VOLUME] ✗ ${endpoints[index]}: Invalid response format`);
        }
      } else {
        failedEndpoints++;
        console.error(`[VOLUME] ✗ ${endpoints[index]} FAILED:`, result.reason);
      }
    });
    
    console.log(`[VOLUME] Summary: ${successfulEndpoints}/${endpoints.length} endpoints successful, ${Object.keys(volumeData).length} protocols with real volume data`);
    
    if (Object.keys(volumeData).length === 0) {
      console.error('[VOLUME] WARNING: No volume data fetched from any endpoint! Protocols will use TVL-based estimates.');
    }
    
    return volumeData;
  }

  async fetchFromMultipleSources(): Promise<Protocol[]> {
    const cached = apiCache.get('protocols');
    if (cached) return cached;

    try {
      // Fetch both protocols and volume data in parallel
      const [protocols, volumeData] = await Promise.all([
        this.fetchWithRetry('https://api.llama.fi/protocols'),
        this.fetchVolumeData()
      ]);

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
        
        // Extract contract address and chain - DeFiLlama returns either a string, object, or null
        // Most protocols return an object like { ethereum: '0x...', bsc: '0x...' }
        let contractAddress: string | null = null;
        let contractChain: string | null = null;
        
        if (p.address) {
          if (typeof p.address === 'string') {
            // Simple string address (usually Ethereum mainnet)
            contractAddress = p.address.toLowerCase();
            // If only one chain is listed, use that; otherwise default to Ethereum
            contractChain = chains.length === 1 ? normalizeChainName(chains[0]) : 'Ethereum';
          } else if (typeof p.address === 'object' && p.address !== null) {
            // Address is an object with chain names as keys
            // Prefer Ethereum address for GoPlus API compatibility
            const addressObj = p.address as Record<string, string>;
            if (addressObj.ethereum || addressObj.Ethereum) {
              contractAddress = (addressObj.ethereum || addressObj.Ethereum).toLowerCase();
              contractChain = 'Ethereum';
            } else if (addressObj.bsc || addressObj.BSC) {
              contractAddress = (addressObj.bsc || addressObj.BSC).toLowerCase();
              contractChain = 'Binance';
            } else if (addressObj.polygon || addressObj.Polygon) {
              contractAddress = (addressObj.polygon || addressObj.Polygon).toLowerCase();
              contractChain = 'Polygon';
            } else {
              // Fallback: take first available address and chain
              const firstChain = Object.keys(addressObj)[0];
              const firstAddress = addressObj[firstChain];
              if (firstAddress && typeof firstAddress === 'string') {
                contractAddress = firstAddress.toLowerCase();
                // Normalize chain name using mapping
                contractChain = normalizeChainName(firstChain);
              }
            }
          }
        }
        
        // Fallback: If no address from DeFiLlama, try extracting from protocol links
        if (!contractAddress) {
          const extractedContract = extractContractFromProtocolLinks({
            website: p.url,
            github: p.github,
            twitter: p.twitter,
            description: p.description,
          });
          
          if (extractedContract) {
            contractAddress = extractedContract.address.toLowerCase();
            contractChain = extractedContract.chain;
          }
        }
        
        // Get real volume data from DeFiLlama volume endpoints
        let volume24h = volumeData[p.name?.toLowerCase()] || 0;
        
        // If no real volume data available, estimate based on TVL
        if (volume24h === 0) {
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
          sponsoredUntil: null,
          sponsorshipTier: 'free' as const,
          featuredPosition: null,
          defiSecurityScore: null,
          defiAuditReports: null,
          defiHasMultisig: null,
          defiHasTimelock: null,
          defiDataFetchedAt: null,
          contractAddress: contractAddress,
          contractChain: contractChain,
        } as any;
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
        defiSecurityScore: null,
        defiAuditReports: null,
        defiHasMultisig: null,
        defiHasTimelock: null,
        defiDataFetchedAt: null,
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
        defiSecurityScore: null,
        defiAuditReports: null,
        defiHasMultisig: null,
        defiHasTimelock: null,
        defiDataFetchedAt: null,
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
        defiSecurityScore: null,
        defiAuditReports: null,
        defiHasMultisig: null,
        defiHasTimelock: null,
        defiDataFetchedAt: null,
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
        defiSecurityScore: null,
        defiAuditReports: null,
        defiHasMultisig: null,
        defiHasTimelock: null,
        defiDataFetchedAt: null,
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
        defiSecurityScore: null,
        defiAuditReports: null,
        defiHasMultisig: null,
        defiHasTimelock: null,
        defiDataFetchedAt: null,
      },
      // NEW ADVANCED THREAT DEMONSTRATION PROTOCOLS
      {
        id: 'backdoor-defi',
        name: 'BackdoorDeFi',
        chains: ['ethereum'],
        category: 'Yield',
        tvl: 150000,
        volume24h: 25000,
        change24h: 15.5,
        age: 45,
        audited: false,
        auditCount: 0,
        auditNote: null,
        auditLinks: null,
        securityScore: 35,
        logo: null,
        website: 'https://backdoor-defi.com',
        twitter: null,
        github: null,
        description: 'High yield farming with emergency withdrawAll function for admin safety',
        autoDiscovered: true,
        manuallyAdded: false,
        sponsoredUntil: null,
        sponsorshipTier: 'free',
        featuredPosition: null,
        defiSecurityScore: null,
        defiAuditReports: null,
        defiHasMultisig: null,
        defiHasTimelock: null,
        defiDataFetchedAt: null,
      },
      {
        id: 'flash-gov-dao',
        name: 'FlashGov DAO',
        chains: ['ethereum'],
        category: 'Yield',
        tvl: 850000,
        volume24h: 120000,
        change24h: 3.2,
        age: 28,
        audited: false,
        auditCount: 0,
        auditNote: null,
        auditLinks: null,
        securityScore: 42,
        logo: null,
        website: 'https://flashgov-dao.io',
        twitter: null,
        github: null,
        description: 'DAO with instant voting and flash loan governance for fast decisions',
        autoDiscovered: true,
        manuallyAdded: false,
        sponsoredUntil: null,
        sponsorshipTier: 'free',
        featuredPosition: null,
        defiSecurityScore: null,
        defiAuditReports: null,
        defiHasMultisig: null,
        defiHasTimelock: null,
        defiDataFetchedAt: null,
      },
      {
        id: 'pyramid-yield',
        name: 'PyramidYield Finance',
        chains: ['bsc'],
        category: 'Yield',
        tvl: 420000,
        volume24h: 85000,
        change24h: 25.8,
        age: 12,
        audited: false,
        auditCount: 0,
        auditNote: null,
        auditLinks: null,
        securityScore: 28,
        logo: null,
        website: 'https://pyramid-yield.finance',
        twitter: null,
        github: null,
        description: 'Earn passive income with referral bonus! Recruit 3 friends and get MLM rewards',
        autoDiscovered: true,
        manuallyAdded: false,
        sponsoredUntil: null,
        sponsorshipTier: 'free',
        featuredPosition: null,
        defiSecurityScore: null,
        defiAuditReports: null,
        defiHasMultisig: null,
        defiHasTimelock: null,
        defiDataFetchedAt: null,
      },
      {
        id: 'migration-v2-urgent',
        name: 'TokenSwap V2',
        chains: ['ethereum'],
        category: 'DeFi',
        tvl: 95000,
        volume24h: 18000,
        change24h: 0,
        age: 4,
        audited: false,
        auditCount: 0,
        auditNote: null,
        auditLinks: null,
        securityScore: 25,
        logo: null,
        website: 'https://tokenswap-v2-migration.com',
        twitter: null,
        github: null,
        description: 'URGENT: Migrate to V2 now! Swap old tokens before deadline or they become worthless',
        autoDiscovered: true,
        manuallyAdded: false,
        sponsoredUntil: null,
        sponsorshipTier: 'free',
        featuredPosition: null,
        defiSecurityScore: null,
        defiAuditReports: null,
        defiHasMultisig: null,
        defiHasTimelock: null,
        defiDataFetchedAt: null,
      },
      {
        id: 'no-timelock-protocol',
        name: 'InstantChange Protocol',
        chains: ['ethereum'],
        category: 'Lending',
        tvl: 1200000,
        volume24h: 180000,
        change24h: 4.1,
        age: 35,
        audited: false,
        auditCount: 0,
        auditNote: null,
        auditLinks: null,
        securityScore: 38,
        logo: null,
        website: 'https://instantchange.finance',
        twitter: null,
        github: null,
        description: 'Lending protocol with instant admin control for immediate parameter changes',
        autoDiscovered: true,
        manuallyAdded: false,
        sponsoredUntil: null,
        sponsorshipTier: 'free',
        featuredPosition: null,
        defiSecurityScore: null,
        defiAuditReports: null,
        defiHasMultisig: null,
        defiHasTimelock: null,
        defiDataFetchedAt: null,
      },
      {
        id: 'whale-controlled-token',
        name: 'WhaleToken',
        chains: ['ethereum'],
        category: 'DeFi',
        tvl: 580000,
        volume24h: 95000,
        change24h: -5.3,
        age: 22,
        audited: false,
        auditCount: 0,
        auditNote: null,
        auditLinks: null,
        securityScore: 40,
        logo: null,
        website: 'https://whale-token.io',
        twitter: null,
        github: null,
        description: 'Top 10 holders control 50% of supply - concentrated ownership token',
        autoDiscovered: true,
        manuallyAdded: false,
        sponsoredUntil: null,
        sponsorshipTier: 'free',
        featuredPosition: null,
        defiSecurityScore: null,
        defiAuditReports: null,
        defiHasMultisig: null,
        defiHasTimelock: null,
        defiDataFetchedAt: null,
      },
      {
        id: 'oracle-exploit-dex',
        name: 'OracleDEX',
        chains: ['bsc'],
        category: 'Dex',
        tvl: 720000,
        volume24h: 145000,
        change24h: 2.8,
        age: 18,
        audited: false,
        auditCount: 0,
        auditNote: null,
        auditLinks: null,
        securityScore: 35,
        logo: null,
        website: 'https://oracle-dex.finance',
        twitter: null,
        github: null,
        description: 'DEX with single oracle price feed and flash loan oracle integration',
        autoDiscovered: true,
        manuallyAdded: false,
        sponsoredUntil: null,
        sponsorshipTier: 'free',
        featuredPosition: null,
        defiSecurityScore: null,
        defiAuditReports: null,
        defiHasMultisig: null,
        defiHasTimelock: null,
        defiDataFetchedAt: null,
      },
      {
        id: 'new-bridge-beta',
        name: 'QuickBridge',
        chains: ['ethereum', 'bsc'],
        category: 'Bridge',
        tvl: 380000,
        volume24h: 72000,
        change24h: 12.5,
        age: 15,
        audited: false,
        auditCount: 0,
        auditNote: null,
        auditLinks: null,
        securityScore: 32,
        logo: null,
        website: 'https://quickbridge.finance',
        twitter: null,
        github: null,
        description: 'New bridge cross-chain beta with centralized validators',
        autoDiscovered: true,
        manuallyAdded: false,
        sponsoredUntil: null,
        sponsorshipTier: 'free',
        featuredPosition: null,
        defiSecurityScore: null,
        defiAuditReports: null,
        defiHasMultisig: null,
        defiHasTimelock: null,
        defiDataFetchedAt: null,
      },
      {
        id: 'nft-wash-market',
        name: 'NFT WashMarket',
        chains: ['ethereum'],
        category: 'NFT Marketplace',
        tvl: 95000,
        volume24h: 180000,
        change24h: 85.3,
        age: 8,
        audited: false,
        auditCount: 0,
        auditNote: null,
        auditLinks: null,
        securityScore: 28,
        logo: null,
        website: 'https://nft-washmarket.io',
        twitter: null,
        github: null,
        description: 'NFT marketplace with artificial volume and same wallet buying selling',
        autoDiscovered: true,
        manuallyAdded: false,
        sponsoredUntil: null,
        sponsorshipTier: 'free',
        featuredPosition: null,
        defiSecurityScore: null,
        defiAuditReports: null,
        defiHasMultisig: null,
        defiHasTimelock: null,
        defiDataFetchedAt: null,
      },
      {
        id: 'mev-vulnerable-swap',
        name: 'NoSlippageSwap',
        chains: ['ethereum'],
        category: 'Dex',
        tvl: 450000,
        volume24h: 85000,
        change24h: 1.2,
        age: 25,
        audited: false,
        auditCount: 0,
        auditNote: null,
        auditLinks: null,
        securityScore: 38,
        logo: null,
        website: 'https://noslippage-swap.com',
        twitter: null,
        github: null,
        description: 'DEX with no slippage protection - MEV vulnerable sandwich attack risk',
        autoDiscovered: true,
        manuallyAdded: false,
        sponsoredUntil: null,
        sponsorshipTier: 'free',
        featuredPosition: null,
        defiSecurityScore: null,
        defiAuditReports: null,
        defiHasMultisig: null,
        defiHasTimelock: null,
        defiDataFetchedAt: null,
      },
      {
        id: 'revenue-share-token',
        name: 'RevenueShare Token',
        chains: ['ethereum'],
        category: 'DeFi',
        tvl: 1800000,
        volume24h: 320000,
        change24h: 8.5,
        age: 42,
        audited: false,
        auditCount: 0,
        auditNote: null,
        auditLinks: null,
        securityScore: 45,
        logo: null,
        website: 'https://revenue-share-token.io',
        twitter: null,
        github: null,
        description: 'Equity token with profit distribution and revenue sharing for holders',
        autoDiscovered: true,
        manuallyAdded: false,
        sponsoredUntil: null,
        sponsorshipTier: 'free',
        featuredPosition: null,
        defiSecurityScore: null,
        defiAuditReports: null,
        defiHasMultisig: null,
        defiHasTimelock: null,
        defiDataFetchedAt: null,
      },
      {
        id: 'legacy-defi',
        name: 'LegacyDeFi',
        chains: ['ethereum'],
        category: 'Lending',
        tvl: 320000,
        volume24h: 58000,
        change24h: -2.1,
        age: 180,
        audited: false,
        auditCount: 0,
        auditNote: null,
        auditLinks: null,
        securityScore: 42,
        logo: null,
        website: 'https://legacy-defi.com',
        twitter: null,
        github: null,
        description: 'Built on Solidity 0.4 with OpenZeppelin v2 - legacy code and outdated dependencies',
        autoDiscovered: true,
        manuallyAdded: false,
        sponsoredUntil: null,
        sponsorshipTier: 'free',
        featuredPosition: null,
        defiSecurityScore: null,
        defiAuditReports: null,
        defiHasMultisig: null,
        defiHasTimelock: null,
        defiDataFetchedAt: null,
      },
      {
        id: 'wrapped-btc-unbacked',
        name: 'UnbackedBTC',
        chains: ['ethereum'],
        category: 'DeFi',
        tvl: 980000,
        volume24h: 175000,
        change24h: 0.5,
        age: 55,
        audited: false,
        auditCount: 0,
        auditNote: null,
        auditLinks: null,
        securityScore: 35,
        logo: null,
        website: 'https://unbacked-btc.com',
        twitter: null,
        github: null,
        description: 'Wrapped token unbacked - no proof of reserves with centralized wrapping',
        autoDiscovered: true,
        manuallyAdded: false,
        sponsoredUntil: null,
        sponsorshipTier: 'free',
        featuredPosition: null,
        defiSecurityScore: null,
        defiAuditReports: null,
        defiHasMultisig: null,
        defiHasTimelock: null,
        defiDataFetchedAt: null,
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
    // UNIFIED SCORING SYSTEM: 0 = SAFE (best), 100 = CRITICAL (worst)
    // Start with medium risk (50) and reduce based on positive indicators
    let score = 50;

    // Parse audit count (DeFiLlama returns it as a string!)
    const auditCount = parseInt(p.audits) || 0;
    if (auditCount > 0) score -= 25; // Audited = much safer
    
    // High TVL indicates community trust
    if (typeof p.tvl === 'number' && p.tvl > 100000000) score -= 10;
    if (typeof p.tvl === 'number' && p.tvl > 1000000000) score -= 5;
    
    // Open source and social presence = transparency
    if (p.twitter) score -= 5;
    if (p.github) score -= 5;

    return Math.max(0, Math.min(100, score));
  }
}
