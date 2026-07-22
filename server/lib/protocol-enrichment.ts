/**
 * Protocol Enrichment Service
 *
 * Fetches per-protocol detail from DeFiLlama's /protocol/{slug} endpoint
 * to fill gaps that the bulk /protocols endpoint doesn't cover:
 *   – hallmarks (for accurate launch date / age)
 *   – audit_links (sometimes more complete than bulk)
 *   – audits count (cross-check)
 *   – openSource flag
 *   – hacks count (penalty signal)
 *
 * After enrichment, rescores every protocol using the full DFJ v2.3 model
 * and auto-flags CRITICAL protocols (score < 30) with TVL > $100k.
 */

import { storage } from '../storage';
import { calculateFoundationScore } from './security-verification';
import { db } from '../db';
import { protocols, blacklistEntries } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';

/**
 * Signal the running server process to flush its in-memory protocol cache.
 * Called after every DB write so the HTTP layer never serves stale scores.
 *
 * Works whether called from inside the server process or an external script —
 * in both cases it hits the loopback-only endpoint.  Failures are swallowed
 * (the server may not be running when a script executes standalone).
 */
/**
 * Flush the server's entire in-memory cache after a rescore or bulk DB write.
 * Calling with no arguments triggers a full cache.clear() on the server so that
 * trending, new, per-protocol, protocols-full, security-stats — everything —
 * is rebuilt from the DB on the next request.
 */
export async function flushServerCache(): Promise<void> {
  try {
    const port = process.env.PORT ?? '5000';
    // No ?keys= → server calls clearCache() with no prefix → cache.clear()
    const res = await fetch(`http://127.0.0.1:${port}/api/internal/flush-cache`, {
      method: 'POST',
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      console.log('[CACHE] Full server cache flushed');
    }
  } catch {
    // Server not running (script context) — DB is source of truth, no action needed
  }
}
import type { Protocol } from '@shared/schema';

const LLAMA_DETAIL = 'https://api.llama.fi/protocol';
const ENRICH_TOP_N  = 500;   // top protocols by TVL to enrich from DeFiLlama
const BATCH_SIZE    = 10;    // concurrent DeFiLlama requests
const BATCH_DELAY   = 250;   // ms between batches

// ── DeFiLlama detail fetch ────────────────────────────────────────────────────

interface LlamaDetail {
  slug: string;
  audits?: string | number;
  audit_links?: string[];
  openSource?: boolean;
  hallmarks?: [number, string][];  // [[unixTs, label], ...]
  hacks?: { date: string; funds_lost: number }[];
}

async function fetchLlamaDetail(slug: string): Promise<LlamaDetail | null> {
  try {
    const res = await fetch(`${LLAMA_DETAIL}/${encodeURIComponent(slug)}`, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return null;
    return await res.json() as LlamaDetail;
  } catch {
    return null;
  }
}

/** Extract launch age (days) from hallmarks — uses the earliest entry. */
function ageFromHallmarks(hallmarks: [number, string][] | undefined): number | null {
  if (!hallmarks?.length) return null;
  const earliest = Math.min(...hallmarks.map(([ts]) => ts));
  if (!earliest || earliest <= 0) return null;
  const days = Math.floor((Date.now() / 1000 - earliest) / 86_400);
  return days > 0 ? days : null;
}

// ── Enrich top-N protocols ────────────────────────────────────────────────────

export async function enrichProtocols(limit = ENRICH_TOP_N): Promise<{
  enriched: number; updated: number; errors: number;
}> {
  const all = await storage.getProtocols();
  const top = all
    .sort((a, b) => b.tvl - a.tvl)
    .slice(0, limit);

  let enriched = 0; let updated = 0; let errors = 0;

  for (let i = 0; i < top.length; i += BATCH_SIZE) {
    const batch = top.slice(i, i + BATCH_SIZE);

    await Promise.all(batch.map(async (p) => {
      try {
        const detail = await fetchLlamaDetail(p.id);
        if (!detail) { errors++; return; }
        enriched++;

        const updates: Record<string, any> = {};

        // Age from hallmarks (more reliable than listedAt for old protocols)
        const hallmarkAge = ageFromHallmarks(detail.hallmarks);
        if (hallmarkAge && (!p.age || hallmarkAge > p.age)) {
          updates.age = hallmarkAge;
        }

        // Audit links — merge new with existing, dedupe
        const newLinks = detail.audit_links?.filter(l => typeof l === 'string') ?? [];
        const existing = p.auditLinks ?? [];
        const merged = Array.from(new Set([...existing, ...newLinks]));
        if (merged.length > existing.length) {
          updates.auditLinks = merged;
        }

        // Audit count — take the higher of the two sources
        const llamaCount = parseInt(String(detail.audits)) || 0;
        if (llamaCount > (p.auditCount ?? 0)) {
          updates.auditCount = llamaCount;
          updates.audited = llamaCount > 0;
        }

        // Always stamp defi_data_fetched_at so completeness tracking works
        updates.defiDataFetchedAt = new Date();

        await db.update(protocols)
          .set({
            ...(updates.age               !== undefined && { age: updates.age }),
            ...(updates.auditLinks        !== undefined && { auditLinks: updates.auditLinks }),
            ...(updates.auditCount        !== undefined && { auditCount: updates.auditCount }),
            ...(updates.audited           !== undefined && { audited: updates.audited }),
            defiDataFetchedAt: updates.defiDataFetchedAt,
          })
          .where(eq(protocols.id, p.id));
        updated++;
      } catch {
        errors++;
      }
    }));

    if (i + BATCH_SIZE < top.length) {
      await new Promise(r => setTimeout(r, BATCH_DELAY));
    }
  }

  return { enriched, updated, errors };
}

// ── Batch rescore ─────────────────────────────────────────────────────────────

const CEX_CATEGORIES = new Set(['CEX', 'Centralized Exchange', 'CeFi']);

/**
 * Re-score every protocol in the DB using the full DFJ v2.3 model for DeFi
 * and DFJ-CEX v1.0 for centralized exchanges.
 * Updates security_score for all protocols.
 */
export async function batchRescore(): Promise<{
  total: number;
  safe: number; low: number; medium: number; high: number; critical: number;
  flagged: number;
}> {
  const { scoreCex } = await import('./cex-security-scorer');
  const all = await storage.getProtocols();
  const counts = { total: all.length, safe: 0, low: 0, medium: 0, high: 0, critical: 0, flagged: 0 };

  // Score synchronously in memory — no external API calls
  const updates: { id: string; score: number }[] = [];

  for (const p of all) {
    let final: number;

    if (CEX_CATEGORIES.has(p.category ?? '')) {
      // DFJ-CEX v1.0 — custody, reserves, regulatory, track record
      final = scoreCex(p as any).score;
    } else {
      const { score: foundationScore } = calculateFoundationScore(p);
      const activeScore = computeFastActive(p);
      const gross = Math.min(foundationScore + activeScore, 100);
      final = Math.max(0, Math.min(97, gross));
    }

    updates.push({ id: p.id, score: final });

    if      (final >= 80) counts.safe++;
    else if (final >= 65) counts.low++;
    else if (final >= 50) counts.medium++;
    else if (final >= 30) counts.high++;
    else                  counts.critical++;
  }

  // Batch SQL update in chunks of 500
  const CHUNK = 500;
  for (let i = 0; i < updates.length; i += CHUNK) {
    const chunk = updates.slice(i, i + CHUNK);
    // Use a CASE expression for bulk update
    const caseExpr = chunk.map(u => `WHEN '${u.id.replace(/'/g, "''")}' THEN ${u.score}`).join(' ');
    await db.execute(sql.raw(`
      UPDATE protocols
      SET security_score = CASE id ${caseExpr} ELSE security_score END
      WHERE id IN (${chunk.map(u => `'${u.id.replace(/'/g, "''")}'`).join(',')})
    `));
  }

  // Flush the HTTP-layer cache so the running server immediately serves
  // the updated scores without needing a restart.
  await flushServerCache();

  // Auto-flag genuinely risky DeFi protocols:
  //   score < 30, TVL > $10M, not CEX / institutional RWA
  const toFlag = updates.filter(u => {
    const p = all.find(x => x.id === u.id);
    if (!p) return false;
    if (u.score >= 30) return false;
    if ((p.tvl ?? 0) < 10_000_000) return false;
    if (CEX_CATEGORIES.has(p.category ?? '')) return false;
    // Skip large institutional RWA (regulated products, not DeFi risk)
    if (p.category === 'RWA' && (p.tvl ?? 0) > 500_000_000) return false;
    return true;
  });

  for (const { id, score } of toFlag) {
    const p = all.find(x => x.id === id)!;
    const entryId = `autoflag-${id}`.slice(0, 100).replace(/'/g, "''");
    const dappId  = id.replace(/'/g, "''");
    const dappName = (p.name ?? '').replace(/'/g, "''");
    const tvlM = (p.tvl / 1_000_000).toFixed(1);
    const reason = `DFJ v2.3 CRITICAL score ${score}/97 — unverified protocol with ${tvlM}M TVL`.replace(/'/g, "''");
    try {
      await db.execute(sql.raw(`
        INSERT INTO blacklist_entries
          (id, dapp_id, dapp_name, reason, severity, status, timestamp, threats, legitimacy_score)
        VALUES
          ('${entryId}', '${dappId}', '${dappName}', '${reason}',
           'CRITICAL', 'ACTIVE', NOW(), '[]'::json, ${score})
        ON CONFLICT (id) DO NOTHING
      `));
      counts.flagged++;
    } catch (err) {
      console.error(`Auto-flag failed for ${id}:`, err);
    }
  }

  return counts;
}

// ── Fast active scorer (no GoPlus) ───────────────────────────────────────────

function computeFastActive(p: Protocol): number {
  let a1 = 0;
  if (p.defiHasMultisig) a1 += 9;
  if (p.defiHasTimelock) a1 += 8;
  if (p.github)          a1 += 3;
  if (p.audited)         a1 += 2;
  a1 = Math.min(a1, 22);

  const auditText = (p.auditNote || '').toLowerCase();
  const linkUrls  = (p.auditLinks || []).join(' ').toLowerCase();
  const hasBounty = /bug\s*bounty|immunefi|hackerone/.test(auditText) ||
                    /immunefi\.com|hackerone\.com/.test(linkUrls);
  let a2 = 0;
  if (hasBounty) { a2 += 7; if (p.tvl > 10_000_000) a2 += 3; else if (p.tvl > 1_000_000) a2 += 1; }
  const social = [p.twitter].filter(Boolean).length;
  a2 += Math.min(social, 3);
  if (p.auditCount >= 2) a2 += 2;
  a2 = Math.min(a2, 15);

  let a3 = 0;
  if (p.audited) a3 += 2;
  if (p.github)  a3 += 2;
  if (p.defiHasMultisig && p.defiHasTimelock) a3 += 1;
  a3 = Math.min(a3, 7);

  let a4 = 0;
  if      (p.tvl > 100_000_000) a4 += 3;
  else if (p.tvl > 10_000_000)  a4 += 2;
  else if (p.tvl > 1_000_000)   a4 += 1;
  const chains = (p.chains?.length ?? 0);
  if (chains > 3) a4 += 2; else if (chains > 1) a4 += 1;
  if (p.category && p.category !== 'Other') a4 += 1;
  a4 = Math.min(a4, 6);

  let a5 = 0;
  if (p.defiHasMultisig) a5 += 1;
  if (p.twitter)         a5 += 1;
  if (p.website)         a5 += 1;
  a5 = Math.min(a5, 3);

  let a6 = 0;
  if (p.audited && p.defiHasMultisig) a6 += 1;
  if (p.github  && p.audited)         a6 += 1;
  a6 = Math.min(a6, 2);

  return Math.min(a1 + a2 + a3 + a4 + a5 + a6, 55);
}
