/**
 * On-Chain Multisig Verification via Gnosis Safe API
 *
 * The Gnosis Safe Transaction Service exposes a FREE public API that can
 * confirm whether any Ethereum address is a deployed Safe (multisig) wallet:
 *
 *   GET https://safe-transaction-mainnet.safe.global/api/v1/safes/{address}/
 *   → 200 if it IS a Safe  (returns owners, threshold, etc.)
 *   → 404 if it is NOT a Safe
 *
 * This script:
 *   1. Fetches the DeFiLlama "treasuries" list to get treasury/multisig
 *      addresses for known protocols
 *   2. Checks each address against the Safe API (no API key required)
 *   3. If confirmed, sets defiHasMultisig=true in the DB with a metadata
 *      note indicating the source is "on-chain" (not just DeFiLlama metadata)
 *
 * Supported chains: Ethereum mainnet (primary), Polygon, Arbitrum, Optimism,
 * Base, Avalanche, BNB Smart Chain — all via their respective Safe APIs.
 *
 * Rate: 1 req/500ms to stay within the free Safe API tier.
 *
 * Usage:
 *   npx tsx server/scripts/verify-multisig-onchain.ts
 *   npx tsx server/scripts/verify-multisig-onchain.ts --dry-run
 *   npx tsx server/scripts/verify-multisig-onchain.ts --limit=100
 */

import { db } from '../db';
import { protocols } from '@shared/schema';
import { sql } from 'drizzle-orm';
import { batchRescore } from '../lib/protocol-enrichment';

const DRY_RUN  = process.argv.includes('--dry-run');
const limitArg = process.argv.find(a => a.startsWith('--limit='));
const LIMIT    = limitArg ? parseInt(limitArg.split('=')[1], 10) : 500;
const DELAY_MS = 500; // Safe API free tier

// ─── Gnosis Safe API endpoints per chain ─────────────────────────────────────

const SAFE_API: Record<string, string> = {
  ethereum:  'https://safe-transaction-mainnet.safe.global',
  polygon:   'https://safe-transaction-polygon.safe.global',
  arbitrum:  'https://safe-transaction-arbitrum.safe.global',
  optimism:  'https://safe-transaction-optimism.safe.global',
  base:      'https://safe-transaction-base.safe.global',
  avalanche: 'https://safe-transaction-avalanche.safe.global',
  binance:   'https://safe-transaction-bsc.safe.global',
};

async function isSafeWallet(address: string, chain = 'ethereum'): Promise<boolean> {
  const base = SAFE_API[chain] ?? SAFE_API['ethereum'];
  try {
    const res = await fetch(`${base}/api/v1/safes/${address}/`, {
      headers: { 'User-Agent': 'DeFiJerusalem-MultisigVerifier/1.0', Accept: 'application/json' },
      signal: AbortSignal.timeout(8_000),
    });
    return res.status === 200;
  } catch {
    return false;
  }
}

// ─── DeFiLlama treasuries ────────────────────────────────────────────────────

interface LlamaTreasury {
  id: string;
  name: string;
  address?: string;
  addresses?: { address: string; chain: string }[];
  chain?: string;
}

async function fetchTreasuries(): Promise<LlamaTreasury[]> {
  // Try multiple known DeFiLlama treasury endpoint variants
  const endpoints = [
    'https://api.llama.fi/treasuries',
    'https://api.llama.fi/v2/treasuries',
    'https://api.llama.fi/protocols',   // fallback: pull treasury fields from full protocol list
  ];
  try {
    const res = await fetch(endpoints[0], {
      headers: { Accept: 'application/json', 'User-Agent': 'DeFiJerusalem-MultisigVerifier/1.0' },
      signal: AbortSignal.timeout(20_000),
    });
    if (res.ok) {
      const data = await res.json() as any[];
      if (Array.isArray(data) && data.length > 0) return data;
    }
    // Fallback: DeFiLlama /protocols has treasury field on some entries
    const fb = await fetch('https://api.llama.fi/protocols', {
      headers: { Accept: 'application/json', 'User-Agent': 'DeFiJerusalem-MultisigVerifier/1.0' },
      signal: AbortSignal.timeout(20_000),
    });
    if (!fb.ok) return [];
    const all = await fb.json() as any[];
    // Keep only protocols with a treasury address
    return all.filter((p: any) => typeof p.treasury === 'string' && p.treasury.startsWith('0x'));
  } catch (err) {
    console.error('[TREASURIES] Fetch failed:', err);
    return [];
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('='.repeat(60));
  console.log('DeFiJerusalem — On-Chain Multisig Verification');
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}  Limit: ${LIMIT}`);
  console.log('='.repeat(60));

  // Load protocols from DB that need multisig verification
  console.log('\nLoading protocols without verified multisig...');
  const dbRows = await db
    .select({
      id:    protocols.id,
      name:  protocols.name,
      tvl:   protocols.tvl,
      auditNote: protocols.auditNote,
      defiHasMultisig: protocols.defiHasMultisig,
    })
    .from(protocols)
    .orderBy(sql`tvl DESC NULLS LAST`)
    .limit(LIMIT * 4); // Load more, we'll filter

  // Load treasuries from DeFiLlama
  console.log('Fetching treasury addresses from DeFiLlama...');
  const treasuries = await fetchTreasuries();
  console.log(`  ${treasuries.length} treasuries loaded`);

  // Build a map: protocol slug → list of (address, chain)
  const addressMap = new Map<string, Array<{ address: string; chain: string }>>();

  for (const t of treasuries) {
    const id = t.id?.toLowerCase().replace(/\s+/g, '-') ?? '';
    if (!id) continue;
    const addrs: Array<{ address: string; chain: string }> = [];

    if (t.address && t.address.startsWith('0x')) {
      addrs.push({ address: t.address, chain: t.chain?.toLowerCase() ?? 'ethereum' });
    }
    if (Array.isArray(t.addresses)) {
      for (const a of t.addresses) {
        if (a.address?.startsWith('0x')) {
          addrs.push({ address: a.address, chain: (a.chain ?? 'ethereum').toLowerCase() });
        }
      }
    }
    if (addrs.length > 0) addressMap.set(id, addrs);
  }

  console.log(`  ${addressMap.size} protocols have treasury addresses`);

  // Find protocols in DB that:
  // - Have a treasury address in our map, AND
  // - Do NOT yet have multisig confirmed (defiHasMultisig = false/null)
  //   OR already have it but we want to independently confirm
  const toCheck: Array<{ id: string; name: string; addrs: Array<{ address: string; chain: string }> }> = [];

  for (const row of dbRows) {
    const addrs = addressMap.get(row.id);
    if (!addrs?.length) continue;
    // Prioritise: not yet confirmed as multisig
    if (!row.defiHasMultisig) toCheck.push({ id: row.id, name: row.name, addrs });
    if (toCheck.length >= LIMIT) break;
  }

  console.log(`\nChecking ${toCheck.length} protocols against Gnosis Safe API...`);

  let confirmed  = 0;
  let notSafe    = 0;
  let apiErrors  = 0;

  for (const { id, name, addrs } of toCheck) {
    let isSafe = false;

    for (const { address, chain } of addrs.slice(0, 3)) { // check max 3 addresses per protocol
      const chainKey = Object.keys(SAFE_API).find(k => chain.includes(k)) ?? 'ethereum';
      const result = await isSafeWallet(address, chainKey);
      if (result) { isSafe = true; break; }
      await new Promise(r => setTimeout(r, DELAY_MS));
    }

    if (isSafe) {
      confirmed++;
      console.log(`  ✓ ${id} [${name}] — confirmed Gnosis Safe multisig`);

      if (!DRY_RUN) {
        const existingNote = (await db
          .select({ auditNote: protocols.auditNote })
          .from(protocols)
          .where(sql`id = ${id}`)
          .limit(1))[0]?.auditNote ?? '';

        const multisigNote = 'Multisig: independently verified on-chain (Gnosis Safe)';
        const newNote = existingNote
          ? `${existingNote}. ${multisigNote}`
          : multisigNote;

        await db
          .update(protocols)
          .set({ defiHasMultisig: true, auditNote: newNote })
          .where(sql`id = ${id}`);
      }
    } else {
      notSafe++;
    }

    await new Promise(r => setTimeout(r, DELAY_MS));
  }

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`Checked: ${toCheck.length}  Confirmed Safe: ${confirmed}  Not Safe: ${notSafe}  Errors: ${apiErrors}`);

  if (confirmed === 0 || DRY_RUN) {
    console.log(DRY_RUN ? '\nDRY RUN — no writes.' : '\nNo new multisig confirmations.');
    process.exit(0);
  }

  console.log('\nRescoring...');
  const result = await batchRescore();
  console.log(`Done. ${result.total} scored — SAFE=${result.safe} LOW=${result.low} MEDIUM=${result.medium} HIGH=${result.high}`);

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
