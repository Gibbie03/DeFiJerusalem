/**
 * Blockchain Explorer API Configuration
 * 
 * Etherscan provides multi-chain support - one API key works for 40+ blockchains!
 * This configuration maps all Etherscan-compatible chains to their respective API endpoints.
 */

export interface ExplorerConfig {
  name: string;
  apiUrl: string;
  apiKeyEnv: string;
  rateLimit: number; // calls per second
  chainId?: number;
  nativeCurrency?: string;
}

/**
 * Complete list of blockchain explorers supported by Etherscan API
 * Single ETHERSCAN_API_KEY works for all these chains!
 */
export const EXPLORER_APIS: Record<string, ExplorerConfig> = {
  // ==================== ETHEREUM MAINNET & TESTNETS ====================
  ethereum: {
    name: 'Etherscan',
    apiUrl: 'https://api.etherscan.io/api',
    apiKeyEnv: 'ETHERSCAN_API_KEY',
    rateLimit: 5,
    chainId: 1,
    nativeCurrency: 'ETH',
  },
  
  goerli: {
    name: 'Etherscan Goerli',
    apiUrl: 'https://api-goerli.etherscan.io/api',
    apiKeyEnv: 'ETHERSCAN_API_KEY',
    rateLimit: 5,
    chainId: 5,
    nativeCurrency: 'ETH',
  },
  
  sepolia: {
    name: 'Etherscan Sepolia',
    apiUrl: 'https://api-sepolia.etherscan.io/api',
    apiKeyEnv: 'ETHERSCAN_API_KEY',
    rateLimit: 5,
    chainId: 11155111,
    nativeCurrency: 'ETH',
  },
  
  holesky: {
    name: 'Etherscan Holesky',
    apiUrl: 'https://api-holesky.etherscan.io/api',
    apiKeyEnv: 'ETHERSCAN_API_KEY',
    rateLimit: 5,
    chainId: 17000,
    nativeCurrency: 'ETH',
  },
  
  // ==================== BINANCE SMART CHAIN ====================
  binance: {
    name: 'BscScan',
    apiUrl: 'https://api.bscscan.com/api',
    apiKeyEnv: 'ETHERSCAN_API_KEY',
    rateLimit: 5,
    chainId: 56,
    nativeCurrency: 'BNB',
  },
  
  'binance-testnet': {
    name: 'BscScan Testnet',
    apiUrl: 'https://api-testnet.bscscan.com/api',
    apiKeyEnv: 'ETHERSCAN_API_KEY',
    rateLimit: 5,
    chainId: 97,
    nativeCurrency: 'BNB',
  },
  
  // ==================== POLYGON ====================
  polygon: {
    name: 'Polygonscan',
    apiUrl: 'https://api.polygonscan.com/api',
    apiKeyEnv: 'ETHERSCAN_API_KEY',
    rateLimit: 5,
    chainId: 137,
    nativeCurrency: 'MATIC',
  },
  
  'polygon-amoy': {
    name: 'Polygonscan Amoy',
    apiUrl: 'https://api-amoy.polygonscan.com/api',
    apiKeyEnv: 'ETHERSCAN_API_KEY',
    rateLimit: 5,
    chainId: 80002,
    nativeCurrency: 'MATIC',
  },
  
  // ==================== ARBITRUM ====================
  arbitrum: {
    name: 'Arbiscan',
    apiUrl: 'https://api.arbiscan.io/api',
    apiKeyEnv: 'ETHERSCAN_API_KEY',
    rateLimit: 5,
    chainId: 42161,
    nativeCurrency: 'ETH',
  },
  
  'arbitrum-nova': {
    name: 'Arbiscan Nova',
    apiUrl: 'https://api-nova.arbiscan.io/api',
    apiKeyEnv: 'ETHERSCAN_API_KEY',
    rateLimit: 5,
    chainId: 42170,
    nativeCurrency: 'ETH',
  },
  
  'arbitrum-sepolia': {
    name: 'Arbiscan Sepolia',
    apiUrl: 'https://api-sepolia.arbiscan.io/api',
    apiKeyEnv: 'ETHERSCAN_API_KEY',
    rateLimit: 5,
    chainId: 421614,
    nativeCurrency: 'ETH',
  },
  
  // ==================== OPTIMISM ====================
  optimism: {
    name: 'Optimistic Etherscan',
    apiUrl: 'https://api-optimistic.etherscan.io/api',
    apiKeyEnv: 'ETHERSCAN_API_KEY',
    rateLimit: 5,
    chainId: 10,
    nativeCurrency: 'ETH',
  },
  
  'optimism-sepolia': {
    name: 'Optimistic Etherscan Sepolia',
    apiUrl: 'https://api-sepolia-optimistic.etherscan.io/api',
    apiKeyEnv: 'ETHERSCAN_API_KEY',
    rateLimit: 5,
    chainId: 11155420,
    nativeCurrency: 'ETH',
  },
  
  // ==================== BASE ====================
  base: {
    name: 'Basescan',
    apiUrl: 'https://api.basescan.org/api',
    apiKeyEnv: 'ETHERSCAN_API_KEY',
    rateLimit: 5,
    chainId: 8453,
    nativeCurrency: 'ETH',
  },
  
  'base-sepolia': {
    name: 'Basescan Sepolia',
    apiUrl: 'https://api-sepolia.basescan.org/api',
    apiKeyEnv: 'ETHERSCAN_API_KEY',
    rateLimit: 5,
    chainId: 84532,
    nativeCurrency: 'ETH',
  },
  
  // ==================== AVALANCHE ====================
  avalanche: {
    name: 'Snowtrace',
    apiUrl: 'https://api.snowtrace.io/api',
    apiKeyEnv: 'ETHERSCAN_API_KEY',
    rateLimit: 5,
    chainId: 43114,
    nativeCurrency: 'AVAX',
  },
  
  'avalanche-fuji': {
    name: 'Snowtrace Fuji',
    apiUrl: 'https://api-testnet.snowtrace.io/api',
    apiKeyEnv: 'ETHERSCAN_API_KEY',
    rateLimit: 5,
    chainId: 43113,
    nativeCurrency: 'AVAX',
  },
  
  // ==================== FANTOM ====================
  fantom: {
    name: 'FTMScan',
    apiUrl: 'https://api.ftmscan.com/api',
    apiKeyEnv: 'ETHERSCAN_API_KEY',
    rateLimit: 5,
    chainId: 250,
    nativeCurrency: 'FTM',
  },
  
  'fantom-testnet': {
    name: 'FTMScan Testnet',
    apiUrl: 'https://api-testnet.ftmscan.com/api',
    apiKeyEnv: 'ETHERSCAN_API_KEY',
    rateLimit: 5,
    chainId: 4002,
    nativeCurrency: 'FTM',
  },
  
  // ==================== CRONOS ====================
  cronos: {
    name: 'Cronoscan',
    apiUrl: 'https://api.cronoscan.com/api',
    apiKeyEnv: 'ETHERSCAN_API_KEY',
    rateLimit: 5,
    chainId: 25,
    nativeCurrency: 'CRO',
  },
  
  'cronos-testnet': {
    name: 'Cronoscan Testnet',
    apiUrl: 'https://api-testnet.cronoscan.com/api',
    apiKeyEnv: 'ETHERSCAN_API_KEY',
    rateLimit: 5,
    chainId: 338,
    nativeCurrency: 'CRO',
  },
  
  // ==================== MOONBEAM ====================
  moonbeam: {
    name: 'Moonscan',
    apiUrl: 'https://api-moonbeam.moonscan.io/api',
    apiKeyEnv: 'ETHERSCAN_API_KEY',
    rateLimit: 5,
    chainId: 1284,
    nativeCurrency: 'GLMR',
  },
  
  moonriver: {
    name: 'Moonscan Moonriver',
    apiUrl: 'https://api-moonriver.moonscan.io/api',
    apiKeyEnv: 'ETHERSCAN_API_KEY',
    rateLimit: 5,
    chainId: 1285,
    nativeCurrency: 'MOVR',
  },
  
  moonbase: {
    name: 'Moonscan Moonbase',
    apiUrl: 'https://api-moonbase.moonscan.io/api',
    apiKeyEnv: 'ETHERSCAN_API_KEY',
    rateLimit: 5,
    chainId: 1287,
    nativeCurrency: 'DEV',
  },
  
  // ==================== GNOSIS ====================
  gnosis: {
    name: 'Gnosisscan',
    apiUrl: 'https://api.gnosisscan.io/api',
    apiKeyEnv: 'ETHERSCAN_API_KEY',
    rateLimit: 5,
    chainId: 100,
    nativeCurrency: 'xDAI',
  },
  
  'gnosis-chiado': {
    name: 'Gnosisscan Chiado',
    apiUrl: 'https://api-chiado.gnosisscan.io/api',
    apiKeyEnv: 'ETHERSCAN_API_KEY',
    rateLimit: 5,
    chainId: 10200,
    nativeCurrency: 'xDAI',
  },
  
  // ==================== LINEA ====================
  linea: {
    name: 'Lineascan',
    apiUrl: 'https://api.lineascan.build/api',
    apiKeyEnv: 'ETHERSCAN_API_KEY',
    rateLimit: 5,
    chainId: 59144,
    nativeCurrency: 'ETH',
  },
  
  'linea-sepolia': {
    name: 'Lineascan Sepolia',
    apiUrl: 'https://api-sepolia.lineascan.build/api',
    apiKeyEnv: 'ETHERSCAN_API_KEY',
    rateLimit: 5,
    chainId: 59141,
    nativeCurrency: 'ETH',
  },
  
  // ==================== SCROLL ====================
  scroll: {
    name: 'Scrollscan',
    apiUrl: 'https://api.scrollscan.com/api',
    apiKeyEnv: 'ETHERSCAN_API_KEY',
    rateLimit: 5,
    chainId: 534352,
    nativeCurrency: 'ETH',
  },
  
  'scroll-sepolia': {
    name: 'Scrollscan Sepolia',
    apiUrl: 'https://api-sepolia.scrollscan.com/api',
    apiKeyEnv: 'ETHERSCAN_API_KEY',
    rateLimit: 5,
    chainId: 534351,
    nativeCurrency: 'ETH',
  },
  
  // ==================== BLAST ====================
  blast: {
    name: 'Blastscan',
    apiUrl: 'https://api.blastscan.io/api',
    apiKeyEnv: 'ETHERSCAN_API_KEY',
    rateLimit: 5,
    chainId: 81457,
    nativeCurrency: 'ETH',
  },
  
  'blast-sepolia': {
    name: 'Blastscan Sepolia',
    apiUrl: 'https://api-sepolia.blastscan.io/api',
    apiKeyEnv: 'ETHERSCAN_API_KEY',
    rateLimit: 5,
    chainId: 168587773,
    nativeCurrency: 'ETH',
  },
  
  // ==================== FRAXTAL ====================
  fraxtal: {
    name: 'Fraxscan',
    apiUrl: 'https://api.fraxscan.com/api',
    apiKeyEnv: 'ETHERSCAN_API_KEY',
    rateLimit: 5,
    chainId: 252,
    nativeCurrency: 'frxETH',
  },
  
  'fraxtal-testnet': {
    name: 'Fraxscan Testnet',
    apiUrl: 'https://api-holesky.fraxscan.com/api',
    apiKeyEnv: 'ETHERSCAN_API_KEY',
    rateLimit: 5,
    chainId: 2522,
    nativeCurrency: 'frxETH',
  },
  
  // ==================== CELO ====================
  celo: {
    name: 'Celoscan',
    apiUrl: 'https://api.celoscan.io/api',
    apiKeyEnv: 'ETHERSCAN_API_KEY',
    rateLimit: 5,
    chainId: 42220,
    nativeCurrency: 'CELO',
  },
  
  'celo-alfajores': {
    name: 'Celoscan Alfajores',
    apiUrl: 'https://api-alfajores.celoscan.io/api',
    apiKeyEnv: 'ETHERSCAN_API_KEY',
    rateLimit: 5,
    chainId: 44787,
    nativeCurrency: 'CELO',
  },
  
  // ==================== MANTLE ====================
  mantle: {
    name: 'Mantlescan',
    apiUrl: 'https://api.mantlescan.xyz/api',
    apiKeyEnv: 'ETHERSCAN_API_KEY',
    rateLimit: 5,
    chainId: 5000,
    nativeCurrency: 'MNT',
  },
  
  'mantle-sepolia': {
    name: 'Mantlescan Sepolia',
    apiUrl: 'https://api-sepolia.mantlescan.xyz/api',
    apiKeyEnv: 'ETHERSCAN_API_KEY',
    rateLimit: 5,
    chainId: 5003,
    nativeCurrency: 'MNT',
  },
  
  // ==================== KAVA ====================
  kava: {
    name: 'Kavascan',
    apiUrl: 'https://api.kavascan.com/api',
    apiKeyEnv: 'ETHERSCAN_API_KEY',
    rateLimit: 5,
    chainId: 2222,
    nativeCurrency: 'KAVA',
  },
};

export type ChainKey = keyof typeof EXPLORER_APIS;

/**
 * Get list of all supported chains
 */
export function getSupportedChains(): ChainKey[] {
  return Object.keys(EXPLORER_APIS) as ChainKey[];
}

/**
 * Get mainnet chains only (exclude testnets)
 */
export function getMainnetChains(): ChainKey[] {
  return Object.keys(EXPLORER_APIS).filter(
    chain => !chain.includes('testnet') && 
            !chain.includes('sepolia') && 
            !chain.includes('goerli') &&
            !chain.includes('holesky') &&
            !chain.includes('fuji') &&
            !chain.includes('amoy') &&
            !chain.includes('chiado') &&
            !chain.includes('moonbase') &&
            !chain.includes('alfajores')
  ) as ChainKey[];
}

/**
 * Get high-priority chains (highest DeFi activity)
 */
export function getHighPriorityChains(): ChainKey[] {
  return [
    'ethereum',
    'binance',
    'polygon',
    'arbitrum',
    'optimism',
    'base',
    'avalanche',
  ] as ChainKey[];
}

/**
 * Check if API key is configured
 */
export function hasApiKey(chain: ChainKey): boolean {
  const config = EXPLORER_APIS[chain];
  if (!config) return false;
  
  const apiKey = process.env[config.apiKeyEnv];
  return !!apiKey;
}

/**
 * Get statistics about configured chains
 */
export function getChainStats(): {
  total: number;
  mainnets: number;
  testnets: number;
  configured: number;
  highPriority: number;
} {
  const all = getSupportedChains();
  const mainnets = getMainnetChains();
  const configured = all.filter(hasApiKey);
  const highPriority = getHighPriorityChains();
  
  return {
    total: all.length,
    mainnets: mainnets.length,
    testnets: all.length - mainnets.length,
    configured: configured.length,
    highPriority: highPriority.length,
  };
}
