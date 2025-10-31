/**
 * Contract Address Extractor
 * Extracts contract addresses from blockchain explorer URLs and auto-detects chains
 */

interface ContractInfo {
  address: string;
  chain: string;
  explorerUrl: string;
}

// Chain name normalization map (DeFiLlama/various sources → GoPlus-compatible names)
const CHAIN_NAME_MAP: Record<string, string> = {
  // Ethereum variants
  'ethereum': 'Ethereum',
  'eth': 'Ethereum',
  'mainnet': 'Ethereum',
  
  // BSC/Binance variants
  'binance': 'Binance',
  'bsc': 'Binance',
  'bnb': 'Binance',
  'bnb chain': 'Binance',
  
  // Polygon variants
  'polygon': 'Polygon',
  'matic': 'Polygon',
  
  // Other chains (normalized)
  'arbitrum': 'Arbitrum',
  'arbitrum one': 'Arbitrum',
  'arbitrum nova': 'Arbitrum Nova',
  'optimism': 'Optimism',
  'avalanche': 'Avalanche',
  'avax': 'Avalanche',
  'fantom': 'Fantom',
  'ftm': 'Fantom',
  'base': 'Base',
  'zksync': 'zkSync',
  'linea': 'Linea',
  'scroll': 'Scroll',
  'celo': 'Celo',
  'gnosis': 'Gnosis',
  'xdai': 'Gnosis',
  'cronos': 'Cronos',
  'moonbeam': 'Moonbeam',
  'moonriver': 'Moonriver',
  'harmony': 'Harmony',
  'aurora': 'Aurora',
  'metis': 'Metis',
  'boba': 'Boba',
};

/**
 * Normalize chain name to GoPlus-compatible format
 */
export function normalizeChainName(chain: string): string {
  const normalized = CHAIN_NAME_MAP[chain.toLowerCase().trim()];
  return normalized || chain.charAt(0).toUpperCase() + chain.slice(1);
}

// Blockchain explorer patterns with chain detection
const EXPLORER_PATTERNS = [
  // Ethereum
  { pattern: /etherscan\.io\/(?:address|token)\/0x([a-fA-F0-9]{40})/i, chain: 'Ethereum' },
  { pattern: /etherscan\.com\/(?:address|token)\/0x([a-fA-F0-9]{40})/i, chain: 'Ethereum' },
  
  // BSC (Binance Smart Chain)
  { pattern: /bscscan\.com\/(?:address|token)\/0x([a-fA-F0-9]{40})/i, chain: 'Binance' },
  
  // Polygon
  { pattern: /polygonscan\.com\/(?:address|token)\/0x([a-fA-F0-9]{40})/i, chain: 'Polygon' },
  
  // Arbitrum
  { pattern: /arbiscan\.io\/(?:address|token)\/0x([a-fA-F0-9]{40})/i, chain: 'Arbitrum' },
  
  // Optimism
  { pattern: /optimistic\.etherscan\.io\/(?:address|token)\/0x([a-fA-F0-9]{40})/i, chain: 'Optimism' },
  
  // Avalanche
  { pattern: /snowtrace\.io\/(?:address|token)\/0x([a-fA-F0-9]{40})/i, chain: 'Avalanche' },
  { pattern: /avascan\.info\/blockchain\/c\/(?:address|token)\/0x([a-fA-F0-9]{40})/i, chain: 'Avalanche' },
  
  // Fantom
  { pattern: /ftmscan\.com\/(?:address|token)\/0x([a-fA-F0-9]{40})/i, chain: 'Fantom' },
  
  // Base
  { pattern: /basescan\.org\/(?:address|token)\/0x([a-fA-F0-9]{40})/i, chain: 'Base' },
  
  // zkSync
  { pattern: /explorer\.zksync\.io\/(?:address|token)\/0x([a-fA-F0-9]{40})/i, chain: 'zkSync' },
  
  // Linea
  { pattern: /lineascan\.build\/(?:address|token)\/0x([a-fA-F0-9]{40})/i, chain: 'Linea' },
  
  // Scroll
  { pattern: /scrollscan\.com\/(?:address|token)\/0x([a-fA-F0-9]{40})/i, chain: 'Scroll' },
  
  // Celo
  { pattern: /celoscan\.io\/(?:address|token)\/0x([a-fA-F0-9]{40})/i, chain: 'Celo' },
  
  // Gnosis
  { pattern: /gnosisscan\.io\/(?:address|token)\/0x([a-fA-F0-9]{40})/i, chain: 'Gnosis' },
  
  // Cronos
  { pattern: /cronoscan\.com\/(?:address|token)\/0x([a-fA-F0-9]{40})/i, chain: 'Cronos' },
  
  // Moonbeam
  { pattern: /moonscan\.io\/(?:address|token)\/0x([a-fA-F0-9]{40})/i, chain: 'Moonbeam' },
  
  // Moonriver
  { pattern: /moonriver\.moonscan\.io\/(?:address|token)\/0x([a-fA-F0-9]{40})/i, chain: 'Moonriver' },
  
  // Harmony
  { pattern: /explorer\.harmony\.one\/(?:address|token)\/0x([a-fA-F0-9]{40})/i, chain: 'Harmony' },
  
  // Aurora
  { pattern: /aurorascan\.dev\/(?:address|token)\/0x([a-fA-F0-9]{40})/i, chain: 'Aurora' },
  
  // Metis
  { pattern: /andromeda-explorer\.metis\.io\/(?:address|token)\/0x([a-fA-F0-9]{40})/i, chain: 'Metis' },
  
  // Boba
  { pattern: /bobascan\.com\/(?:address|token)\/0x([a-fA-F0-9]{40})/i, chain: 'Boba' },
  
  // Generic 0x address pattern (fallback - no chain detection)
  { pattern: /0x([a-fA-F0-9]{40})/i, chain: null },
];

/**
 * Extract contract address and chain from a URL or text
 */
export function extractContractFromUrl(url: string): ContractInfo | null {
  if (!url) return null;

  // Try each explorer pattern
  for (const { pattern, chain } of EXPLORER_PATTERNS) {
    const match = url.match(pattern);
    if (match && match[1]) {
      const address = `0x${match[1]}`;
      const normalizedChain = chain ? normalizeChainName(chain) : 'Unknown';
      return {
        address,
        chain: normalizedChain,
        explorerUrl: url,
      };
    }
  }

  return null;
}

/**
 * Extract multiple contract addresses from text (e.g., protocol description, social links)
 */
export function extractContractsFromText(text: string): ContractInfo[] {
  if (!text) return [];

  const contracts: ContractInfo[] = [];
  const seen = new Set<string>();

  // Split by common delimiters to find URLs
  const parts = text.split(/[\s,;|\n\r]/);
  
  for (const part of parts) {
    const contractInfo = extractContractFromUrl(part);
    if (contractInfo && !seen.has(contractInfo.address.toLowerCase())) {
      contracts.push(contractInfo);
      seen.add(contractInfo.address.toLowerCase());
    }
  }

  return contracts;
}

/**
 * Extract contract from protocol links (website, github, twitter, etc.)
 */
export function extractContractFromProtocolLinks(links: {
  website?: string | null;
  github?: string | null;
  twitter?: string | null;
  description?: string;
}): ContractInfo | null {
  // Try website first
  if (links.website) {
    const contract = extractContractFromUrl(links.website);
    if (contract) return contract;
  }

  // Try github
  if (links.github) {
    const contract = extractContractFromUrl(links.github);
    if (contract) return contract;
  }

  // Try description
  if (links.description) {
    const contracts = extractContractsFromText(links.description);
    if (contracts.length > 0) return contracts[0];
  }

  return null;
}

/**
 * Validate if a string is a valid Ethereum-compatible address
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Generate explorer URL for a contract address and chain
 */
export function getExplorerUrl(address: string, chain: string): string {
  const chainLower = chain.toLowerCase();
  
  const explorerMap: Record<string, string> = {
    'ethereum': `https://etherscan.io/address/${address}`,
    'eth': `https://etherscan.io/address/${address}`,
    'binance': `https://bscscan.com/address/${address}`,
    'bsc': `https://bscscan.com/address/${address}`,
    'polygon': `https://polygonscan.com/address/${address}`,
    'matic': `https://polygonscan.com/address/${address}`,
    'arbitrum': `https://arbiscan.io/address/${address}`,
    'optimism': `https://optimistic.etherscan.io/address/${address}`,
    'avalanche': `https://snowtrace.io/address/${address}`,
    'avax': `https://snowtrace.io/address/${address}`,
    'fantom': `https://ftmscan.com/address/${address}`,
    'base': `https://basescan.org/address/${address}`,
    'zksync': `https://explorer.zksync.io/address/${address}`,
    'linea': `https://lineascan.build/address/${address}`,
    'scroll': `https://scrollscan.com/address/${address}`,
    'celo': `https://celoscan.io/address/${address}`,
    'gnosis': `https://gnosisscan.io/address/${address}`,
    'cronos': `https://cronoscan.com/address/${address}`,
    'moonbeam': `https://moonscan.io/address/${address}`,
    'moonriver': `https://moonriver.moonscan.io/address/${address}`,
    'harmony': `https://explorer.harmony.one/address/${address}`,
    'aurora': `https://aurorascan.dev/address/${address}`,
    'metis': `https://andromeda-explorer.metis.io/address/${address}`,
    'boba': `https://bobascan.com/address/${address}`,
  };

  return explorerMap[chainLower] || `https://etherscan.io/address/${address}`;
}
