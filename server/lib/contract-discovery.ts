import type { DiscoveredContract } from '@shared/schema';

// Blockchain explorer API endpoints
const EXPLORER_APIS = {
  ethereum: {
    baseUrl: 'https://api.etherscan.io/api',
    apiKeyEnv: 'ETHERSCAN_API_KEY',
  },
  bsc: {
    baseUrl: 'https://api.bscscan.com/api',
    apiKeyEnv: 'BSCSCAN_API_KEY',
  },
  polygon: {
    baseUrl: 'https://api.polygonscan.com/api',
    apiKeyEnv: 'POLYGONSCAN_API_KEY',
  },
  arbitrum: {
    baseUrl: 'https://api.arbiscan.io/api',
    apiKeyEnv: 'ARBISCAN_API_KEY',
  },
  optimism: {
    baseUrl: 'https://api-optimistic.etherscan.io/api',
    apiKeyEnv: 'OPTIMISTIC_ETHERSCAN_API_KEY',
  },
  avalanche: {
    baseUrl: 'https://api.snowtrace.io/api',
    apiKeyEnv: 'SNOWTRACE_API_KEY',
  },
  fantom: {
    baseUrl: 'https://api.ftmscan.com/api',
    apiKeyEnv: 'FTMSCAN_API_KEY',
  },
  base: {
    baseUrl: 'https://api.basescan.org/api',
    apiKeyEnv: 'BASESCAN_API_KEY',
  }
};

export type Chain = keyof typeof EXPLORER_APIS;

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
 * Fetch recently verified contracts from a blockchain explorer
 */
export async function fetchRecentlyVerifiedContracts(
  chain: Chain,
  page: number = 1,
  offset: number = 20
): Promise<Partial<DiscoveredContract>[]> {
  const explorer = EXPLORER_APIS[chain];
  const apiKey = process.env[explorer.apiKeyEnv];

  if (!apiKey) {
    console.warn(`Missing API key for ${chain}: ${explorer.apiKeyEnv}`);
    return [];
  }

  try {
    // Fetch recently verified contracts
    const url = new URL(explorer.baseUrl);
    url.searchParams.set('module', 'contract');
    url.searchParams.set('action', 'listcontracts');
    url.searchParams.set('page', page.toString());
    url.searchParams.set('offset', offset.toString());
    url.searchParams.set('sort', 'desc');
    url.searchParams.set('apikey', apiKey);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status === '1' && Array.isArray(data.result)) {
      const contracts: Partial<DiscoveredContract>[] = [];

      for (const contract of data.result.slice(0, 10)) {
        try {
          const contractInfo = await fetchContractDetails(chain, contract.ContractAddress, apiKey);
          if (contractInfo) {
            contracts.push(contractInfo);
          }
          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 250));
        } catch (error) {
          console.error(`Error fetching contract ${contract.ContractAddress}:`, error);
        }
      }

      return contracts;
    }

    return [];
  } catch (error) {
    console.error(`Error fetching verified contracts from ${chain}:`, error);
    return [];
  }
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
  const key = apiKey || process.env[explorer.apiKeyEnv];

  if (!key) {
    return null;
  }

  try {
    // Fetch source code
    const sourceUrl = new URL(explorer.baseUrl);
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
      const txUrl = new URL(explorer.baseUrl);
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
      console.error('Error fetching creation tx:', error);
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

    const explorerBaseUrl = explorer.baseUrl.replace('/api', '');
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
 */
export async function discoverContractsMultiChain(chains: Chain[] = ['ethereum', 'bsc', 'polygon']): Promise<Partial<DiscoveredContract>[]> {
  const allContracts: Partial<DiscoveredContract>[] = [];

  for (const chain of chains) {
    try {
      console.log(`Discovering contracts on ${chain}...`);
      const contracts = await fetchRecentlyVerifiedContracts(chain, 1, 10);
      allContracts.push(...contracts);
      
      // Rate limiting between chains
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Error discovering contracts on ${chain}:`, error);
    }
  }

  return allContracts;
}

/**
 * Filter contracts that are likely DeFi protocols
 */
export function filterDeFiContracts(contracts: Partial<DiscoveredContract>[]): Partial<DiscoveredContract>[] {
  return contracts.filter(contract => {
    const metadata = contract.metadata;
    if (!metadata) return false;

    // Include if it has liquidity, governance, or is identified as a DeFi protocol
    return metadata.hasLiquidity || 
           metadata.isGovernance || 
           contract.contractType?.toLowerCase().includes('defi') ||
           contract.contractType?.toLowerCase().includes('dex') ||
           contract.contractType?.toLowerCase().includes('lend') ||
           contract.contractType?.toLowerCase().includes('stake') ||
           contract.contractType?.toLowerCase().includes('vault');
  });
}
