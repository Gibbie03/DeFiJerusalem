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
    const res = await fetch('https://api.llama.fi/hacks', {
      headers: { 'User-Agent': 'DeFiJerusalem-SecurityAggregator/1.0', 'Accept': 'application/json' },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) throw new Error(`DeFiLlama hacks API returned ${res.status}`);

    const raw = await res.json();
    // Response is a flat array: [{ date (unix), name, amount, chain (array), classification, technique, ... }]
    const items: any[] = Array.isArray(raw) ? raw : (raw?.hacks ?? []);
    const hacks: ProtocolHack[] = items.map((h: any) => ({
      date: h.date ? new Date(h.date * 1000).toISOString().slice(0, 10) : '',
      name: h.name ?? '',
      amount: typeof h.amount === 'number' ? h.amount : 0,
      chain: Array.isArray(h.chain) ? h.chain.join(', ') : (h.chain ?? h.chains ?? ''),
      category: h.classification ?? h.targetType ?? h.category ?? '',
      technique: h.technique ?? h.type ?? '',
      link: h.source ?? h.link ?? h.url ?? '',
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
    // Immunefi killed their public API — try the endpoint but expect failure
    const res = await fetch('https://immunefi.com/api/bounty/all/', {
      headers: { 'User-Agent': 'DeFiJerusalem-SecurityAggregator/1.0' },
      signal: AbortSignal.timeout(10000),
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

const BUG_BOUNTY_SIGNALS = /bug\s*bounty|immunefi|hackerone/i;
const IMMUNEFI_LINK     = /immunefi\.com/i;
const HACKERONE_LINK    = /hackerone\.com/i;

/**
 * Detect bug bounty from a protocol's stored fields — used as fallback when
 * the Immunefi live API is unavailable (it has been dead since mid-2024).
 */
function detectBugBountyFromProtocol(protocol?: {
  auditNote?: string | null;
  auditLinks?: string[] | null;
}): BugBountyProgram | null {
  if (!protocol) return null;

  const note  = (protocol.auditNote  ?? '').toLowerCase();
  const links = (protocol.auditLinks ?? []).join(' ').toLowerCase();

  if (!BUG_BOUNTY_SIGNALS.test(note) && !IMMUNEFI_LINK.test(links) && !HACKERONE_LINK.test(links)) {
    return null;
  }

  // Find the Immunefi or HackerOne URL from stored links
  const bountyUrl =
    (protocol.auditLinks ?? []).find(u => IMMUNEFI_LINK.test(u)) ??
    (protocol.auditLinks ?? []).find(u => HACKERONE_LINK.test(u)) ??
    '';

  // Try to parse a max-bounty figure from the note ("up to $250,000", "$1,000,000", etc.)
  const amountMatch = note.match(/\$([0-9,]+(?:\.[0-9]+)?)\s*(m(?:illion)?|k(?:ilo)?)?/);
  let maxBounty = 0;
  if (amountMatch) {
    const num = parseFloat(amountMatch[1].replace(/,/g, ''));
    const suffix = (amountMatch[2] ?? '').toLowerCase();
    maxBounty = suffix.startsWith('m') ? num * 1_000_000 : suffix.startsWith('k') ? num * 1_000 : num;
  }

  const highestBountyLabel = maxBounty >= 1_000_000
    ? `$${(maxBounty / 1_000_000).toFixed(1)}M`
    : maxBounty >= 1_000
    ? `$${(maxBounty / 1_000).toFixed(0)}K`
    : maxBounty > 0 ? `$${maxBounty}` : 'Available';

  return { name: 'Bug Bounty', url: bountyUrl, maxBounty, assets: [], highestBountyLabel };
}

/**
 * Get bug bounty program for a specific protocol (fuzzy name match against live API,
 * with DB-field fallback when the API is unavailable).
 */
export async function getBugBountyForProtocol(
  protocolName: string,
  protocol?: { auditNote?: string | null; auditLinks?: string[] | null },
): Promise<BugBountyProgram | null> {
  const all = await fetchBugBounties();
  const name = protocolName.toLowerCase();
  const liveMatch = all.find(b =>
    b.name.toLowerCase().includes(name) ||
    name.includes(b.name.toLowerCase())
  ) ?? null;

  // Live API result wins; fall back to stored fields when API is dead/empty
  return liveMatch ?? detectBugBountyFromProtocol(protocol);
}

/**
 * Get combined security aggregation for a protocol.
 * Pass the full protocol record so bug-bounty can be detected from stored fields
 * when the Immunefi live API is unavailable.
 */
export async function getProtocolSecurityData(
  protocolName: string,
  protocol?: { auditNote?: string | null; auditLinks?: string[] | null },
) {
  const [hacks, bounty] = await Promise.all([
    getHacksForProtocol(protocolName),
    getBugBountyForProtocol(protocolName, protocol),
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
