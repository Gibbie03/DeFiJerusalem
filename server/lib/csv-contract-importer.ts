/**
 * CSV Contract Importer
 * 
 * This module handles importing verified contracts from Etherscan-compatible
 * CSV exports. This is the RECOMMENDED approach for contract discovery.
 * 
 * CSV Export URLs (requires manual CAPTCHA completion):
 * - Ethereum: https://etherscan.io/exportData?type=open-source-contract-codes
 * - BSC: https://bscscan.com/exportData?type=open-source-contract-codes
 * - Polygon: https://polygonscan.com/exportData?type=open-source-contract-codes
 * - Arbitrum: https://arbiscan.io/exportData?type=open-source-contract-codes
 * - Optimism: https://optimistic.etherscan.io/exportData?type=open-source-contract-codes
 * - Base: https://basescan.org/exportData?type=open-source-contract-codes
 * - Avalanche: https://snowtrace.io/exportData?type=open-source-contract-codes
 * 
 * Usage:
 * 1. Manually download CSV files from the URLs above
 * 2. Place them in the server/data/csv directory
 * 3. Run the import process to load contracts into the database
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import type { ChainKey } from './blockchain-apis';

export interface CSVContract {
  txHash: string;
  contractAddress: string;
  contractName: string;
  compiler: string;
  version: string;
  balance: string;
  txCount: string;
  setting: string;
  verifiedDate: string;
  license: string;
}

/**
 * Map CSV filename patterns to chain keys
 */
const CHAIN_FILENAME_PATTERNS: Record<string, ChainKey> = {
  'ethereum': 'ethereum',
  'etherscan': 'ethereum',
  'eth': 'ethereum',
  'bsc': 'binance',
  'bscscan': 'binance',
  'binance': 'binance',
  'polygon': 'polygon',
  'polygonscan': 'polygon',
  'matic': 'polygon',
  'arbitrum': 'arbitrum',
  'arbiscan': 'arbitrum',
  'arb': 'arbitrum',
  'optimism': 'optimism',
  'op': 'optimism',
  'base': 'base',
  'basescan': 'base',
  'avalanche': 'avalanche',
  'avax': 'avalanche',
  'snowtrace': 'avalanche',
};

/**
 * Parse a single CSV line into contract data
 */
function parseCSVLine(line: string): CSVContract | null {
  try {
    // CSV format: TxHash,ContractAddress,ContractName,Compiler,Version,Balance,TxCount,Setting,VerifiedDate,License
    const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    
    if (values.length < 10) {
      return null;
    }

    return {
      txHash: values[0],
      contractAddress: values[1].toLowerCase(),
      contractName: values[2],
      compiler: values[3],
      version: values[4],
      balance: values[5],
      txCount: values[6],
      setting: values[7],
      verifiedDate: values[8],
      license: values[9],
    };
  } catch (error) {
    console.error('[CSV-IMPORTER] Error parsing CSV line:', error);
    return null;
  }
}

/**
 * Detect chain from filename
 */
function detectChainFromFilename(filename: string): ChainKey | null {
  const lowerFilename = filename.toLowerCase();
  
  for (const [pattern, chain] of Object.entries(CHAIN_FILENAME_PATTERNS)) {
    if (lowerFilename.includes(pattern)) {
      return chain;
    }
  }
  
  return null;
}

/**
 * Parse CSV file and extract contract data
 */
export function parseContractCSV(filePath: string, chain?: ChainKey): CSVContract[] {
  try {
    if (!existsSync(filePath)) {
      console.error(`[CSV-IMPORTER] File not found: ${filePath}`);
      return [];
    }

    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());

    // Skip header row
    const dataLines = lines.slice(1);
    
    const contracts: CSVContract[] = [];
    
    for (const line of dataLines) {
      const contract = parseCSVLine(line);
      if (contract && contract.contractAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
        contracts.push(contract);
      }
    }

    console.log(`[CSV-IMPORTER] Parsed ${contracts.length} contracts from ${filePath}`);
    return contracts;
  } catch (error) {
    console.error(`[CSV-IMPORTER] Error parsing CSV file ${filePath}:`, error);
    return [];
  }
}

/**
 * Load all CSV files from a directory
 */
export function loadCSVDirectory(dirPath: string): Map<ChainKey, CSVContract[]> {
  const results = new Map<ChainKey, CSVContract[]>();

  try {
    if (!existsSync(dirPath)) {
      console.log(`[CSV-IMPORTER] Directory not found: ${dirPath}`);
      console.log('[CSV-IMPORTER] To use CSV imports:');
      console.log('  1. Create directory: server/data/csv');
      console.log('  2. Download CSV files from blockchain explorers');
      console.log('  3. Place them in the directory');
      return results;
    }

    const files = readdirSync(dirPath).filter(f => f.endsWith('.csv'));
    
    if (files.length === 0) {
      console.log(`[CSV-IMPORTER] No CSV files found in ${dirPath}`);
      return results;
    }

    console.log(`[CSV-IMPORTER] Found ${files.length} CSV files`);

    for (const file of files) {
      const filePath = join(dirPath, file);
      const chain = detectChainFromFilename(file);
      
      if (!chain) {
        console.warn(`[CSV-IMPORTER] Could not detect chain from filename: ${file}`);
        console.warn('[CSV-IMPORTER] Filename should contain chain name (e.g., ethereum-contracts.csv)');
        continue;
      }

      const contracts = parseContractCSV(filePath, chain);
      
      if (contracts.length > 0) {
        const existing = results.get(chain) || [];
        results.set(chain, [...existing, ...contracts]);
        console.log(`[CSV-IMPORTER] Loaded ${contracts.length} contracts for ${chain} from ${file}`);
      }
    }

    // Summary
    let totalContracts = 0;
    const entries = Array.from(results.entries());
    for (const [chain, contracts] of entries) {
      totalContracts += contracts.length;
      console.log(`[CSV-IMPORTER] ${chain}: ${contracts.length} contracts`);
    }
    console.log(`[CSV-IMPORTER] Total contracts loaded: ${totalContracts} across ${results.size} chains`);

  } catch (error) {
    console.error('[CSV-IMPORTER] Error loading CSV directory:', error);
  }

  return results;
}

/**
 * Convert CSV contracts to DiscoveredContract format
 */
export function convertCSVToDiscoveredContracts(
  csvContracts: CSVContract[],
  chain: ChainKey
) {
  return csvContracts.map(contract => ({
    contractAddress: contract.contractAddress,
    contractName: contract.contractName || 'Unknown',
    chain,
    verifiedAt: contract.verifiedDate ? new Date(contract.verifiedDate) : undefined,
    compilerVersion: `${contract.compiler} ${contract.version}`,
    txHash: contract.txHash,
    metadata: {
      license: contract.license && contract.license !== '-' ? contract.license : undefined,
      txCount: parseInt(contract.txCount) || 0,
      balance: contract.balance,
      source: 'csv-export' as const,
    },
  }));
}

/**
 * Get CSV export URLs for all supported chains
 */
export function getCSVExportURLs(): Record<ChainKey, string> {
  return {
    ethereum: 'https://etherscan.io/exportData?type=open-source-contract-codes',
    binance: 'https://bscscan.com/exportData?type=open-source-contract-codes',
    polygon: 'https://polygonscan.com/exportData?type=open-source-contract-codes',
    arbitrum: 'https://arbiscan.io/exportData?type=open-source-contract-codes',
    optimism: 'https://optimistic.etherscan.io/exportData?type=open-source-contract-codes',
    base: 'https://basescan.org/exportData?type=open-source-contract-codes',
    avalanche: 'https://snowtrace.io/exportData?type=open-source-contract-codes',
    fantom: 'https://ftmscan.com/exportData?type=open-source-contract-codes',
  } as Record<ChainKey, string>;
}
