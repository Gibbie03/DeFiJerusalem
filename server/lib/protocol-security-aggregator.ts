/**
 * Protocol Security Aggregator
 * Fetches and aggregates security data from multiple sources:
 * - DeFiLlama hacks/incidents
 * - Immunefi bug bounty programs (local JSON file + live Playwright scrape fallback)
 */

import { apiCache } from './api-cache';
import fs from 'fs';
import path from 'path';

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
/** Local JSON file populated by server/scripts/scrape-immunefi-bounties.ts */
const BOUNTIES_FILE = path.join(process.cwd(), 'server', 'data', 'immunefi-bounties.json');

export async function fetchBugBounties(): Promise<BugBountyProgram[]> {
  const cached = memGet<BugBountyProgram[]>(BOUNTIES_CACHE_KEY);
  if (cached) return cached;

  // Primary: load from local JSON file (populated by Playwright scraper)
  try {
    if (fs.existsSync(BOUNTIES_FILE)) {
      const raw = fs.readFileSync(BOUNTIES_FILE, 'utf8');
      const items: any[] = JSON.parse(raw);
      const bounties: BugBountyProgram[] = items.map((b: any) => {
        const maxBounty = typeof b.maxBounty === 'number' ? b.maxBounty : 0;
        return {
          name: b.name ?? b.slug ?? '',
          url: b.url ?? `https://immunefi.com/bounty/${b.slug ?? ''}`,
          maxBounty,
          assets: b.assets ?? [],
          highestBountyLabel: b.highestBountyLabel ??
            (maxBounty >= 1_000_000 ? `$${(maxBounty / 1_000_000).toFixed(1)}M`
            : maxBounty >= 1_000 ? `$${(maxBounty / 1_000).toFixed(0)}K`
            : maxBounty > 0 ? `$${maxBounty}` : 'Available'),
        };
      });
      memSet(BOUNTIES_CACHE_KEY, bounties, BOUNTIES_TTL_MS);
      console.log(`[AGGREGATOR] Loaded ${bounties.length} bug bounties from local JSON`);
      return bounties;
    }
  } catch (fileErr) {
    console.warn('[AGGREGATOR] Failed to load local bounties JSON:', fileErr);
  }

  // Fallback: try the Immunefi API (has been dead since mid-2024 but worth one attempt)
  try {
    console.log('[AGGREGATOR] Fetching bug bounties from Immunefi API...');
    const res = await fetch('https://immunefi.com/api/bounty/all/', {
      headers: { 'User-Agent': 'DeFiJerusalem-SecurityAggregator/1.0' },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) throw new Error(`Immunefi API returned ${res.status}`);

    const raw = await res.json();
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
    console.log(`[AGGREGATOR] Loaded ${bounties.length} bug bounties from Immunefi API`);
    return bounties;
  } catch (err) {
    console.error('[AGGREGATOR] All bounty sources failed:', err);
    return [];
  }
}

/** Normalise a protocol name or slug for fuzzy bounty matching */
function normForBountyMatch(s: string): string {
  return s
    .toLowerCase()
    .replace(/\bv\d+(\.\d+)*/g, '')           // strip version: v2, v3, v2.0
    .replace(/[-_\s.]/g, '')                   // strip separators
    .replace(/finance|protocol|dao|network|labs?|defi/g, ''); // strip generic suffixes
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
 * Get bug bounty program for a specific protocol.
 * Looks up the local Immunefi JSON (primary), then falls back to stored DB fields.
 */
export async function getBugBountyForProtocol(
  protocolName: string,
  protocol?: { auditNote?: string | null; auditLinks?: string[] | null },
): Promise<BugBountyProgram | null> {
  const all = await fetchBugBounties();
  const normId = normForBountyMatch(protocolName);

  const liveMatch = all.find(b => {
    // Extract slug from URL: https://immunefi.com/bounty/aave/ → "aave"
    const slug = (b as any).slug ?? b.url.split('/').filter(Boolean).pop() ?? '';
    const normSlug = normForBountyMatch(slug);
    const normName = normForBountyMatch(b.name);

    if (normId.length < 3) return false;

    // Exact match on slug or name
    if (normSlug === normId || normName === normId) return true;
    // One contains the other (require ≥4 chars to avoid false positives)
    if (normId.length >= 4) {
      if (normSlug && (normSlug.includes(normId) || normId.includes(normSlug))) return true;
      if (normName && (normName.includes(normId) || normId.includes(normName))) return true;
    }
    return false;
  }) ?? null;

  // JSON file match wins; fall back to stored audit_note / audit_links fields
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
