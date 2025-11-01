/**
 * Etherscan Web Scraper for Recently Verified Contracts
 * 
 * Since Etherscan API V2 has no endpoint to list recently verified contracts,
 * we scrape the contractsVerified web page which shows the last 500 verified contracts.
 * 
 * This provides fresh contract discovery for contracts verified in the last 24-48 hours
 * that aren't yet in DeFiLlama.
 */

import * as cheerio from 'cheerio';
import type { ChainKey } from './blockchain-apis';

export interface ScrapedContract {
  address: string;
  name: string;
  compiler: string;
  version: string;
  balance: string;
  txCount: number;
  verifiedDate: string;
  license: string | null;
  chain: ChainKey;
  explorerUrl: string;
}

/**
 * Web URLs for contractsVerified pages
 * These show the last 500 verified contracts for each blockchain
 */
export const VERIFIED_CONTRACTS_URLS: Record<string, string> = {
  ethereum: 'https://etherscan.io/contractsVerified',
  binance: 'https://bscscan.com/contractsVerified',
  polygon: 'https://polygonscan.com/contractsVerified',
  arbitrum: 'https://arbiscan.io/contractsVerified',
  optimism: 'https://optimistic.etherscan.io/contractsVerified',
  base: 'https://basescan.org/contractsVerified',
  avalanche: 'https://snowtrace.io/contractsVerified',
  fantom: 'https://ftmscan.com/contractsVerified',
  cronos: 'https://cronoscan.com/contractsVerified',
  gnosis: 'https://gnosisscan.io/contractsVerified',
  linea: 'https://lineascan.build/contractsVerified',
  scroll: 'https://scrollscan.com/contractsVerified',
  blast: 'https://blastscan.io/contractsVerified',
  fraxtal: 'https://fraxscan.com/contractsVerified',
  celo: 'https://celoscan.io/contractsVerified',
  mantle: 'https://mantlescan.xyz/contractsVerified',
  kava: 'https://kavascan.com/contractsVerified',
};

/**
 * Get list of chains that support web scraping
 */
export function getScrapableChains(): ChainKey[] {
  return Object.keys(VERIFIED_CONTRACTS_URLS) as ChainKey[];
}

/**
 * Get high-priority chains for scraping (highest DeFi activity)
 */
export function getHighPriorityScrapingChains(): ChainKey[] {
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
 * Parse transaction count from string (e.g., "7" or "10,345")
 */
function parseTxCount(txStr: string): number {
  const cleaned = txStr.replace(/,/g, '').trim();
  return parseInt(cleaned, 10) || 0;
}

/**
 * Normalize date format (e.g., "11/1/2025" -> "2025-11-01")
 */
function normalizeDate(dateStr: string): string {
  try {
    const [month, day, year] = dateStr.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  } catch {
    return dateStr;
  }
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Scrape recently verified contracts from a blockchain explorer
 * 
 * @param chain - The blockchain to scrape
 * @param maxContracts - Maximum number of contracts to return (default: 100)
 * @param retries - Number of retry attempts (default: 2)
 * @returns Array of scraped contracts
 */
export async function scrapeVerifiedContracts(
  chain: ChainKey,
  maxContracts: number = 100,
  retries: number = 2
): Promise<ScrapedContract[]> {
  const url = VERIFIED_CONTRACTS_URLS[chain];
  
  if (!url) {
    console.log(`[Etherscan Scraper] No scraping URL configured for chain: ${chain}`);
    return [];
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        const delayMs = attempt * 2000; // Exponential backoff: 2s, 4s, 6s
        console.log(`[Etherscan Scraper] Retry ${attempt}/${retries} for ${chain} after ${delayMs}ms...`);
        await sleep(delayMs);
      }
      
      console.log(`[Etherscan Scraper] Fetching verified contracts from ${chain}...`);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          'Cache-Control': 'max-age=0',
        },
      });

      if (!response.ok) {
        console.warn(`[Etherscan Scraper] Attempt ${attempt + 1}/${retries + 1} - ${chain}: ${response.status} ${response.statusText}`);
        if (attempt === retries) {
          console.error(`[Etherscan Scraper] All attempts failed for ${chain} - giving up`);
          return [];
        }
        continue;
      }

      const html = await response.text();
      const $ = cheerio.load(html);
      const contracts: ScrapedContract[] = [];

      $('table tbody tr').each((index, element) => {
        if (contracts.length >= maxContracts) return false;

        const $row = $(element);
        const cells = $row.find('td');

        if (cells.length < 7) return;

        const addressCell = $(cells[0]);
        const addressLink = addressCell.find('a').attr('href');
        const addressMatch = addressLink?.match(/0x[a-fA-F0-9]{40}/);
        
        if (!addressMatch) return;

        const address = addressMatch[0];
        const name = $(cells[1]).text().trim();
        const compiler = $(cells[2]).text().trim();
        const version = $(cells[3]).text().trim();
        const balance = $(cells[4]).text().trim();
        const txCount = parseTxCount($(cells[5]).text().trim());
        const verifiedDate = normalizeDate($(cells[7]).text().trim());
        const license = $(cells[9]).text().trim() || null;

        if (address && name) {
          contracts.push({
            address: address.toLowerCase(),
            name,
            compiler,
            version,
            balance,
            txCount,
            verifiedDate,
            license: license === '-' ? null : license,
            chain,
            explorerUrl: `${url.replace('/contractsVerified', '')}/address/${address}#code`,
          });
        }
      });

      console.log(`[Etherscan Scraper] Scraped ${contracts.length} verified contracts from ${chain}`);
      return contracts;

    } catch (error) {
      console.error(`[Etherscan Scraper] Error scraping ${chain} (attempt ${attempt + 1}/${retries + 1}):`, error);
      if (attempt === retries) {
        return [];
      }
    }
  }
  
  return [];
}

/**
 * Scrape verified contracts from multiple chains with staggered delays
 * 
 * @param chains - Array of chains to scrape (defaults to high-priority chains)
 * @param maxPerChain - Maximum contracts per chain (default: 100)
 * @returns Combined array of scraped contracts from all chains
 */
export async function scrapeMultipleChains(
  chains: ChainKey[] = getHighPriorityScrapingChains(),
  maxPerChain: number = 100
): Promise<ScrapedContract[]> {
  console.log(`[Etherscan Scraper] Starting sequential scraping for ${chains.length} chains with delays...`);

  const allContracts: ScrapedContract[] = [];
  
  // Scrape chains sequentially with delays to avoid rate limiting
  for (let i = 0; i < chains.length; i++) {
    const chain = chains[i];
    
    try {
      const contracts = await scrapeVerifiedContracts(chain, maxPerChain);
      allContracts.push(...contracts);
      
      // Add delay between chains (except for the last one)
      if (i < chains.length - 1) {
        const delayMs = 3000; // 3 second delay between chains
        console.log(`[Etherscan Scraper] Waiting ${delayMs}ms before next chain...`);
        await sleep(delayMs);
      }
    } catch (error) {
      console.error(`[Etherscan Scraper] Failed to scrape ${chain}:`, error);
    }
  }

  console.log(`[Etherscan Scraper] Total contracts scraped across all chains: ${allContracts.length}`);
  return allContracts;
}

/**
 * Filter scraped contracts by recency (last N hours)
 * 
 * @param contracts - Array of scraped contracts
 * @param hoursAgo - Only include contracts verified within this many hours
 * @returns Filtered contracts
 */
export function filterByRecency(
  contracts: ScrapedContract[],
  hoursAgo: number = 48
): ScrapedContract[] {
  const cutoffDate = new Date();
  cutoffDate.setHours(cutoffDate.getHours() - hoursAgo);
  
  return contracts.filter(contract => {
    const verifiedDate = new Date(contract.verifiedDate);
    return verifiedDate >= cutoffDate;
  });
}
