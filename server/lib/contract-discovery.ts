/**
 * Contract Discovery Service - Hybrid Approach
 * 
 * Combines two discovery methods for comprehensive coverage:
 * 1. DeFiLlama: Extracts established protocols with TVL data
 * 2. Etherscan Scraping: Recently verified contracts (last 24-48 hours)
 * 
 * This hybrid approach ensures we discover both established protocols AND fresh contracts
 */

import type { DiscoveredContract } from '@shared/schema';
import { EXPLORER_APIS, ChainKey, getMainnetChains, getHighPriorityChains } from './blockchain-apis';
import { 
  scrapeMultipleChains, 
  scrapeVerifiedContracts, 
  filterByRecency,
  getHighPriorityScrapingChains,
  type ScrapedContract 
} from './etherscan-scraper';

export type Chain = ChainKey;

interface ExplorerContractResult {
  SourceCode: string;
  ABI: string;
  ContractName: string;
  CompilerVersion: string;
  OptimizationUsed: string;
  Runs: string;
  ConstructorArguments: string;
  EVMVersion: string;
  Library: string;
  LicenseType: string;
  Proxy: string;
  Implementation: string;
  SwarmSource: string;
}

interface ExplorerTransaction {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  from: string;
  to: string;
  value: string;
  contractAddress: string;
  input: string;
  type: string;
  gas: string;
  gasUsed: string;
  isError: string;
}

/**
 * Fetch contracts from DeFiLlama protocols
 * This is more reliable than blockchain explorer APIs and provides real DeFi contracts
 */
export async function fetchContractsFromDeFiLlama(): Promise<Partial<DiscoveredContract>[]> {
  try {
    const response = await fetch('https://api.llama.fi/protocols');
    const data = await response.json();
    
    if (!Array.isArray(data)) {
      console.warn('[CONTRACT-DISCOVERY] Invalid DeFiLlama response');
      return [];
    }
    
    const contracts: Partial<DiscoveredContract>[] = [];
    
    // Extract contracts from protocols
    for (const protocol of data) {
      if (!protocol.chains || !Array.isArray(protocol.chains)) continue;
      
      // Get contract addresses from protocol's chain TVL data
      for (const chain of protocol.chains) {
        const chainName = chain.toLowerCase();
        
        // Map DeFiLlama chain names to our chain keys
        const chainKey = mapChainName(chainName);
        if (!chainKey) continue;
        
        // Create a discovered contract entry for this protocol/chain combo
        const contract: Partial<DiscoveredContract> = {
          contractAddress: `${protocol.slug}-${chainName}`, // Placeholder until we get real address
          contractName: protocol.name,
          chain: chainKey,
          contractType: protocol.category || 'defi',
          discoveredAt: new Date().toISOString(),
          status: 'pending',
          metadata: {
            hasLiquidity: true,
            estimatedTVL: protocol.tvl?.[chainName] || 0,
            socialLinks: {
              website: protocol.url,
              twitter: protocol.twitter,
            },
          },
        };
        
        contracts.push(contract);
      }
    }
    
    console.log(`[CONTRACT-DISCOVERY] ✓ DeFiLlama: ${contracts.length} protocol contracts extracted`);
    return contracts;
  } catch (error) {
    console.error('[CONTRACT-DISCOVERY] Error fetching from DeFiLlama:', error);
    return [];
  }
}

/**
 * Map DeFiLlama chain names to our ChainKey format
 */
function mapChainName(llamaChain: string): ChainKey | null {
  const mapping: Record<string, ChainKey> = {
    'ethereum': 'ethereum',
    'binance': 'binance',
    'bsc': 'binance',
    'polygon': 'polygon',
    'arbitrum': 'arbitrum',
    'optimism': 'optimism',
    'avalanche': 'avalanche',
    'fantom': 'fantom',
    'base': 'base',
    'zksync': 'zksync',
    'linea': 'linea',
    'scroll': 'scroll',
    'gnosis': 'gnosis',
    'celo': 'celo',
    'cronos': 'cronos',
    'moonbeam': 'moonbeam',
    'moonriver': 'moonriver',
    'aurora': 'aurora',
    'metis': 'metis',
    'boba': 'boba',
  };
  
  return mapping[llamaChain] || null;
}

/**
 * Fetch recently verified contracts from a blockchain explorer
 * NOTE: Currently disabled due to Etherscan API V1 deprecation
 * Pending migration to V2 API
 */
export async function fetchRecentlyVerifiedContracts(
  chain: Chain,
  page: number = 1,
  offset: number = 20
): Promise<Partial<DiscoveredContract>[]> {
  console.warn(`[CONTRACT-DISCOVERY] Explorer API scanning disabled - Etherscan V1 deprecated`);
  console.warn(`[CONTRACT-DISCOVERY] Using DeFiLlama protocol extraction instead`);
  return fetchContractsFromDeFiLlama();
}

/**
 * Fetch detailed information about a specific contract
 */
export async function fetchContractDetails(
  chain: Chain,
  contractAddress: string,
  apiKey?: string
): Promise<Partial<DiscoveredContract> | null> {
  const explorer = EXPLORER_APIS[chain];
  if (!explorer) {
    return null;
  }
  
  const key = apiKey || process.env[explorer.apiKeyEnv];

  if (!key) {
    return null;
  }

  try {
    // Fetch source code
    const sourceUrl = new URL(explorer.apiUrl);
    sourceUrl.searchParams.set('module', 'contract');
    sourceUrl.searchParams.set('action', 'getsourcecode');
    sourceUrl.searchParams.set('address', contractAddress);
    sourceUrl.searchParams.set('apikey', key);

    const sourceResponse = await fetch(sourceUrl.toString());
    const sourceData = await sourceResponse.json();

    if (sourceData.status !== '1' || !Array.isArray(sourceData.result) || sourceData.result.length === 0) {
      return null;
    }

    const contractData: ExplorerContractResult = sourceData.result[0];

    // Fetch contract creation transaction
    let creatorAddress: string | null = null;
    let txHash: string | null = null;

    try {
      const txUrl = new URL(explorer.apiUrl);
      txUrl.searchParams.set('module', 'contract');
      txUrl.searchParams.set('action', 'getcontractcreation');
      txUrl.searchParams.set('contractaddresses', contractAddress);
      txUrl.searchParams.set('apikey', key);

      const txResponse = await fetch(txUrl.toString());
      const txData = await txResponse.json();

      if (txData.status === '1' && Array.isArray(txData.result) && txData.result.length > 0) {
        creatorAddress = txData.result[0].contractCreator;
        txHash = txData.result[0].txHash;
      }
    } catch (error) {
      console.error('[CONTRACT-DISCOVERY] Error fetching creation tx:', error);
    }

    // Parse ABI
    let abi: any[] | null = null;
    try {
      if (contractData.ABI && contractData.ABI !== 'Contract source code not verified') {
        abi = JSON.parse(contractData.ABI);
      }
    } catch (error) {
      console.error('Error parsing ABI:', error);
    }

    // Analyze contract type
    const metadata = analyzeContractType(contractData, abi);

    const explorerBaseUrl = explorer.apiUrl.replace('/api', '');
    const explorerUrl = `${explorerBaseUrl}/address/${contractAddress}`;

    return {
      contractAddress,
      contractName: contractData.ContractName || null,
      chain,
      contractType: metadata.contractType,
      verifiedAt: null,
      compilerVersion: contractData.CompilerVersion || null,
      optimization: contractData.OptimizationUsed === '1',
      sourceCode: contractData.SourceCode || null,
      abi,
      creatorAddress,
      txHash,
      explorerUrl,
      status: 'pending',
      promotedToProtocol: false,
      protocolId: null,
      metadata: {
        ...metadata,
        isProxy: contractData.Proxy === '1',
      }
    };
  } catch (error) {
    console.error(`Error fetching contract details for ${contractAddress}:`, error);
    return null;
  }
}

/**
 * Analyze contract type based on source code and ABI
 */
function analyzeContractType(contractData: ExplorerContractResult, abi: any[] | null): {
  contractType: string | null;
  isERC20?: boolean;
  isERC721?: boolean;
  isGovernance?: boolean;
  hasLiquidity?: boolean;
} {
  const sourceCode = contractData.SourceCode || '';
  const contractName = contractData.ContractName || '';

  const metadata: any = {
    contractType: null,
    isERC20: false,
    isERC721: false,
    isGovernance: false,
    hasLiquidity: false,
  };

  // Check for ERC20
  if (abi) {
    const hasTransfer = abi.some((item: any) => item.name === 'transfer' && item.type === 'function');
    const hasBalanceOf = abi.some((item: any) => item.name === 'balanceOf' && item.type === 'function');
    const hasApprove = abi.some((item: any) => item.name === 'approve' && item.type === 'function');
    
    if (hasTransfer && hasBalanceOf && hasApprove) {
      metadata.isERC20 = true;
      metadata.contractType = 'ERC20';
    }

    // Check for ERC721
    const hasOwnerOf = abi.some((item: any) => item.name === 'ownerOf' && item.type === 'function');
    const hasTokenURI = abi.some((item: any) => item.name === 'tokenURI' && item.type === 'function');
    
    if (hasOwnerOf && hasTokenURI) {
      metadata.isERC721 = true;
      metadata.contractType = 'ERC721';
    }

    // Check for governance
    const hasPropose = abi.some((item: any) => item.name === 'propose' && item.type === 'function');
    const hasVote = abi.some((item: any) => item.name === 'vote' || item.name === 'castVote');
    
    if (hasPropose || hasVote) {
      metadata.isGovernance = true;
      metadata.contractType = 'Governance';
    }

    // Check for liquidity pool
    const hasSwap = abi.some((item: any) => 
      item.name?.includes('swap') || item.name?.includes('Swap')
    );
    const hasAddLiquidity = abi.some((item: any) => 
      item.name?.includes('addLiquidity') || item.name?.includes('mint')
    );
    
    if (hasSwap || hasAddLiquidity) {
      metadata.hasLiquidity = true;
      if (!metadata.contractType) {
        metadata.contractType = 'DeFi Protocol';
      }
    }
  }

  // Analyze source code patterns
  const lowerSource = sourceCode.toLowerCase();
  const lowerName = contractName.toLowerCase();

  if (lowerSource.includes('uniswap') || lowerSource.includes('pancakeswap') || lowerName.includes('swap')) {
    metadata.hasLiquidity = true;
    metadata.contractType = metadata.contractType || 'DEX';
  }

  if (lowerSource.includes('lending') || lowerSource.includes('borrow') || lowerName.includes('lend')) {
    metadata.contractType = metadata.contractType || 'Lending Protocol';
  }

  if (lowerSource.includes('staking') || lowerSource.includes('farm') || lowerName.includes('stake')) {
    metadata.contractType = metadata.contractType || 'Staking Protocol';
  }

  if (lowerSource.includes('vault') || lowerName.includes('vault')) {
    metadata.contractType = metadata.contractType || 'Vault';
  }

  return metadata;
}

/**
 * Discover contracts across multiple chains
 * Now uses DeFiLlama protocol extraction (more reliable than deprecated explorer APIs)
 */
export async function discoverContractsMultiChain(
  chains?: Chain[],
  options?: { page?: number; offset?: number; filter?: 'all' | 'mainnet' | 'priority' }
): Promise<Partial<DiscoveredContract>[]> {
  console.log(`[CONTRACT-DISCOVERY] Using DeFiLlama protocol extraction...`);
  
  // Fetch all contracts from DeFiLlama
  const allContracts = await fetchContractsFromDeFiLlama();
  
  // Filter by target chains if specified
  if (chains && chains.length > 0) {
    const filtered = allContracts.filter(c => chains.includes(c.chain as Chain));
    console.log(`[CONTRACT-DISCOVERY] Filtered to ${filtered.length} contracts on specified chains`);
    return filtered;
  }
  
  return allContracts;
}

/**
 * Filter contracts that are likely DeFi protocols
 * For DeFiLlama-sourced contracts, all are DeFi by default
 */
export function filterDeFiContracts(contracts: Partial<DiscoveredContract>[]): Partial<DiscoveredContract>[] {
  return contracts.filter(contract => {
    // For DeFiLlama contracts, the contractType is already set to protocol category
    if (contract.contractType && contract.contractType !== 'unknown') {
      return true; // All categorized contracts are DeFi
    }
    
    // Fallback to metadata check for explorer-sourced contracts
    const metadata = contract.metadata;
    if (!metadata) return false;

    return metadata.hasLiquidity || 
           metadata.isGovernance || 
           contract.contractType?.toLowerCase().includes('defi') ||
           contract.contractType?.toLowerCase().includes('dex') ||
           contract.contractType?.toLowerCase().includes('lend') ||
           contract.contractType?.toLowerCase().includes('stake') ||
           contract.contractType?.toLowerCase().includes('vault');
  });
}

/**
 * Convert scraped contract to DiscoveredContract format
 */
function convertScrapedToDiscovered(scraped: ScrapedContract): Partial<DiscoveredContract> {
  return {
    contractAddress: scraped.address,
    contractName: scraped.name,
    chain: scraped.chain,
    contractType: null, // Will be analyzed later
    verifiedAt: scraped.verifiedDate,
    compilerVersion: `${scraped.compiler} ${scraped.version}`,
    explorerUrl: scraped.explorerUrl,
    status: 'pending',
    discoveredAt: new Date().toISOString(),
    metadata: {
      license: scraped.license || undefined,
      txCount: scraped.txCount,
      balance: scraped.balance,
      source: 'etherscan-scraper',
    },
  };
}

/**
 * Fetch recently verified contracts from Etherscan scraping
 * 
 * @param chains - Chains to scrape (defaults to high-priority chains)
 * @param maxPerChain - Max contracts per chain (default: 100)
 * @param recentHours - Only include contracts verified within this many hours (default: 48)
 * @returns Array of discovered contracts
 */
export async function fetchRecentlyVerifiedContractsFromScraping(
  chains: ChainKey[] = getHighPriorityScrapingChains(),
  maxPerChain: number = 100,
  recentHours: number = 48
): Promise<Partial<DiscoveredContract>[]> {
  console.log(`[CONTRACT-DISCOVERY] Scraping recently verified contracts from ${chains.length} chains...`);
  
  try {
    // Scrape contracts from multiple chains in parallel
    const scrapedContracts = await scrapeMultipleChains(chains, maxPerChain);
    
    // Filter by recency (default: last 48 hours)
    const recentContracts = filterByRecency(scrapedContracts, recentHours);
    
    // Convert to DiscoveredContract format
    const discoveredContracts = recentContracts.map(convertScrapedToDiscovered);
    
    console.log(`[CONTRACT-DISCOVERY] ✓ Scraped ${discoveredContracts.length} recently verified contracts`);
    return discoveredContracts;
  } catch (error) {
    console.error('[CONTRACT-DISCOVERY] Error scraping contracts:', error);
    return [];
  }
}

/**
 * Hybrid Contract Discovery - Combines DeFiLlama + Etherscan Scraping
 * 
 * This function implements the hybrid approach:
 * 1. Fetches established protocols from DeFiLlama
 * 2. Scrapes recently verified contracts from Etherscan
 * 3. Deduplicates and returns combined results
 * 
 * @param options - Discovery options
 * @returns Combined array of discovered contracts
 */
export async function discoverContractsHybrid(options?: {
  includeDeFiLlama?: boolean;
  includeEtherscanScraping?: boolean;
  chains?: ChainKey[];
  maxScrapedPerChain?: number;
  recentHoursOnly?: number;
}): Promise<Partial<DiscoveredContract>[]> {
  const {
    includeDeFiLlama = true,
    includeEtherscanScraping = true,
    chains,
    maxScrapedPerChain = 100,
    recentHoursOnly = 48,
  } = options || {};

  console.log('[CONTRACT-DISCOVERY] Starting hybrid discovery...');
  
  const allContracts: Partial<DiscoveredContract>[] = [];

  // 1. Fetch from DeFiLlama (established protocols)
  if (includeDeFiLlama) {
    console.log('[CONTRACT-DISCOVERY] Phase 1: Fetching from DeFiLlama...');
    const defiLlamaContracts = await fetchContractsFromDeFiLlama();
    
    // Filter by chains if specified
    if (chains && chains.length > 0) {
      const filtered = defiLlamaContracts.filter(c => chains.includes(c.chain as ChainKey));
      allContracts.push(...filtered);
      console.log(`[CONTRACT-DISCOVERY] ✓ DeFiLlama: ${filtered.length} contracts (filtered)`);
    } else {
      allContracts.push(...defiLlamaContracts);
      console.log(`[CONTRACT-DISCOVERY] ✓ DeFiLlama: ${defiLlamaContracts.length} contracts`);
    }
  }

  // 2. Scrape from Etherscan (recently verified contracts)
  if (includeEtherscanScraping) {
    console.log('[CONTRACT-DISCOVERY] Phase 2: Scraping Etherscan...');
    const scrapingChains = chains || getHighPriorityScrapingChains();
    const scrapedContracts = await fetchRecentlyVerifiedContractsFromScraping(
      scrapingChains,
      maxScrapedPerChain,
      recentHoursOnly
    );
    
    allContracts.push(...scrapedContracts);
    console.log(`[CONTRACT-DISCOVERY] ✓ Etherscan Scraping: ${scrapedContracts.length} contracts`);
  }

  // 3. Deduplicate by contract address + chain combination
  const uniqueContracts = deduplicateContracts(allContracts);
  
  console.log(`[CONTRACT-DISCOVERY] ✓ Hybrid Discovery Complete: ${uniqueContracts.length} unique contracts`);
  console.log(`[CONTRACT-DISCOVERY]   - DeFiLlama: ${includeDeFiLlama ? 'enabled' : 'disabled'}`);
  console.log(`[CONTRACT-DISCOVERY]   - Etherscan Scraping: ${includeEtherscanScraping ? 'enabled' : 'disabled'}`);
  
  return uniqueContracts;
}

/**
 * Deduplicate contracts by address + chain combination
 * Prefers contracts with more complete metadata
 */
function deduplicateContracts(contracts: Partial<DiscoveredContract>[]): Partial<DiscoveredContract>[] {
  const seen = new Map<string, Partial<DiscoveredContract>>();
  
  for (const contract of contracts) {
    const key = `${contract.chain}:${contract.contractAddress}`.toLowerCase();
    
    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, contract);
    } else {
      // Keep the one with more metadata
      const existingMetadataCount = Object.keys(existing.metadata || {}).length;
      const currentMetadataCount = Object.keys(contract.metadata || {}).length;
      
      if (currentMetadataCount > existingMetadataCount) {
        seen.set(key, contract);
      }
    }
  }
  
  return Array.from(seen.values());
}
