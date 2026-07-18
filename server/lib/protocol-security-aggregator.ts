/**
 * Protocol Security Aggregator
 * Fetches and aggregates security data from multiple sources:
 * - DeFiLlama hacks/incidents
 * - Immunefi bug bounty programs
 */

import { apiCache } from './api-cache';

export interface ProtocolHack {
  date: string;
  name: string;
  amount: number;
  chain: string;
  category: string;
  technique: string;
  link: string;
}

export interface BugBountyProgram {
  name: string;
  url: string;
  maxBounty: number;
  assets: string[];
  highestBountyLabel: string;
}

const HACKS_CACHE_KEY = 'defillama-hacks';
const BOUNTIES_CACHE_KEY = 'immunefi-bounties';
const HACKS_TTL_MS = 6 * 60 * 60 * 1000;   // 6 hours
const BOUNTIES_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

// In-memory cache since apiCache may not support arbitrary TTLs
const memCache = new Map<string, { data: any; expires: number }>();

function memGet<T>(key: string): T | null {
  const entry = memCache.get(key);
  if (!entry || Date.now() > entry.expires) {
    memCache.delete(key);
    return null;
  }
  return entry.data as T;
}

function memSet(key: string, data: any, ttlMs: number) {
  memCache.set(key, { data, expires: Date.now() + ttlMs });
}

/**
 * Fetch all known DeFi hacks from DeFiLlama
 */
export async function fetchAllHacks(): Promise<ProtocolHack[]> {
  const cached = memGet<ProtocolHack[]>(HACKS_CACHE_KEY);
  if (cached) return cached;

  try {
    console.log('[AGGREGATOR] Fetching hacks from DeFiLlama...');
    const res = await fetch('https://defillama-datasets.llama.fi/v2/hacksByDate', {
      headers: { 'User-Agent': 'DeFiJerusalem-SecurityAggregator/1.0' },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) throw new Error(`DeFiLlama hacks API returned ${res.status}`);

    const raw = await res.json();
    // Response shape: { hacks: Array<{ date, name, amount, chain, category, technique, link }> }
    const hacks: ProtocolHack[] = (raw?.hacks ?? raw ?? []).map((h: any) => ({
      date: h.date ?? '',
      name: h.name ?? '',
      amount: typeof h.amount === 'number' ? h.amount : 0,
      chain: h.chain ?? h.chains ?? '',
      category: h.category ?? '',
      technique: h.technique ?? h.type ?? '',
      link: h.link ?? h.url ?? '',
    }));

    memSet(HACKS_CACHE_KEY, hacks, HACKS_TTL_MS);
    console.log(`[AGGREGATOR] Loaded ${hacks.length} hacks from DeFiLlama`);
    return hacks;
  } catch (err) {
    console.error('[AGGREGATOR] Failed to fetch hacks:', err);
    return [];
  }
}

/**
 * Get hacks for a specific protocol (fuzzy name match)
 */
export async function getHacksForProtocol(protocolName: string): Promise<ProtocolHack[]> {
  const all = await fetchAllHacks();
  const name = protocolName.toLowerCase();
  return all.filter(h => h.name.toLowerCase().includes(name) || name.includes(h.name.toLowerCase()));
}

/**
 * Fetch Immunefi bug bounty programs
 */
export async function fetchBugBounties(): Promise<BugBountyProgram[]> {
  const cached = memGet<BugBountyProgram[]>(BOUNTIES_CACHE_KEY);
  if (cached) return cached;

  try {
    console.log('[AGGREGATOR] Fetching bug bounties from Immunefi...');
    // Immunefi public API
    const res = await fetch('https://immunefi.com/api/bounty/all', {
      headers: { 'User-Agent': 'DeFiJerusalem-SecurityAggregator/1.0' },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) throw new Error(`Immunefi API returned ${res.status}`);

    const raw = await res.json();
    // Shape varies — try common structures
    const items: any[] = raw?.data ?? raw?.bounties ?? raw ?? [];

    const bounties: BugBountyProgram[] = items.map((b: any) => {
      const maxBounty = typeof b.maxBounty === 'number'
        ? b.maxBounty
        : parseInt(String(b.maxBounty ?? b.maxReward ?? '0').replace(/[^0-9]/g, ''), 10) || 0;

      return {
        name: b.project ?? b.name ?? '',
        url: b.url ?? `https://immunefi.com/bug-bounty/${b.slug ?? ''}`,
        maxBounty,
        assets: Array.isArray(b.assets) ? b.assets.map((a: any) => a.type ?? a) : [],
        highestBountyLabel: maxBounty >= 1_000_000
          ? `$${(maxBounty / 1_000_000).toFixed(1)}M`
          : maxBounty >= 1_000
          ? `$${(maxBounty / 1_000).toFixed(0)}K`
          : `$${maxBounty}`,
      };
    });

    memSet(BOUNTIES_CACHE_KEY, bounties, BOUNTIES_TTL_MS);
    console.log(`[AGGREGATOR] Loaded ${bounties.length} bug bounties from Immunefi`);
    return bounties;
  } catch (err) {
    console.error('[AGGREGATOR] Failed to fetch Immunefi bounties:', err);
    return [];
  }
}

/**
 * Get bug bounty program for a specific protocol (fuzzy name match)
 */
export async function getBugBountyForProtocol(protocolName: string): Promise<BugBountyProgram | null> {
  const all = await fetchBugBounties();
  const name = protocolName.toLowerCase();
  return all.find(b =>
    b.name.toLowerCase().includes(name) ||
    name.includes(b.name.toLowerCase())
  ) ?? null;
}

/**
 * Get combined security aggregation for a protocol
 */
export async function getProtocolSecurityData(protocolName: string) {
  const [hacks, bounty] = await Promise.all([
    getHacksForProtocol(protocolName),
    getBugBountyForProtocol(protocolName),
  ]);

  const totalLost = hacks.reduce((sum, h) => sum + h.amount, 0);

  return {
    hacks,
    totalLost,
    hacksCount: hacks.length,
    bugBounty: bounty,
    hasBugBounty: bounty !== null,
    lastIncident: hacks.length > 0
      ? hacks.sort((a, b) => b.date.localeCompare(a.date))[0]
      : null,
  };
}
