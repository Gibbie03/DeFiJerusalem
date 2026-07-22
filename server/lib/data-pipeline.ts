/**
 * Data Pipeline Orchestrator
 *
 * Runs all enrichment stages in order so every protocol ends up with the
 * most complete data possible before scores are computed.
 *
 * Stages
 * ──────
 *  1. DeFiLlama bulk   — TVL, chains, category, volume, links          (fast, 1 request)
 *  2. Llama detail     — audit links, age, open-source flag            (1 req / protocol, top N)
 *  3. Immunefi         — bug-bounty URLs injected into audit_links     (1 request)
 *  4. Hacks            — hack count stored for penalty display         (1 request)
 *  5. Rescore          — DFJ v2.3 scores written & cache flushed       (pure CPU)
 */

import { db } from '../db';
import { protocols } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';
import { storage } from '../storage';
import { enrichProtocols, batchRescore, flushServerCache } from './protocol-enrichment';
import { fetchAllHacks } from './protocol-security-aggregator';

export interface PipelineStageResult {
  stage: string;
  ok: boolean;
  detail: Record<string, number | string>;
  durationMs: number;
  error?: string;
}

export interface PipelineResult {
  stages: PipelineStageResult[];
  totalDurationMs: number;
  completedAt: string;
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function slug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function nameMatch(a: string, b: string): boolean {
  const sa = slug(a), sb = slug(b);
  return sa === sb || sa.includes(sb) || sb.includes(sa);
}

async function time<T>(
  label: string,
  fn: () => Promise<T>,
): Promise<{ result: T; ms: number }> {
  const t0 = Date.now();
  const result = await fn();
  return { result, ms: Date.now() - t0 };
}

// ─── Stage 3 — Bounty link normaliser ────────────────────────────────────────
// Immunefi killed their public API. Bounty URLs flow in via DeFiLlama's
// per-protocol detail (Stage 2). This stage reads audit_links already in the
// DB and makes sure any protocol that has an immunefi.com link is also flagged
// as audited + has a matching note — no external calls needed.

async function runImmunefiStage(): Promise<PipelineStageResult> {
  const t0 = Date.now();
  try {
    const all = await storage.getProtocols();
    const updates: { id: string; audited: boolean; auditNote: string }[] = [];

    for (const p of all) {
      const links = (p.auditLinks ?? []).join(' ').toLowerCase();
      const note  = (p.auditNote  ?? '').toLowerCase();
      const hasBountyLink = links.includes('immunefi.com') || links.includes('hackerone.com');
      const hasNote       = note.includes('bounty') || note.includes('immunefi');

      if (!hasBountyLink) continue;

      // Ensure audited=true and note mentions the bounty
      const newNote = hasNote
        ? p.auditNote!
        : p.auditNote ? `${p.auditNote}; Bug bounty program (Immunefi)` : 'Bug bounty program (Immunefi)';

      if (!p.audited || newNote !== p.auditNote) {
        updates.push({ id: p.id, audited: true, auditNote: newNote });
      }
    }

    const CHUNK = 100;
    for (let i = 0; i < updates.length; i += CHUNK) {
      const chunk = updates.slice(i, i + CHUNK);
      await Promise.all(chunk.map(u =>
        db.update(protocols)
          .set({ audited: u.audited, auditNote: u.auditNote })
          .where(eq(protocols.id, u.id))
      ));
    }

    return {
      stage: 'bounty-links',
      ok: true,
      detail: { scanned: all.length, withBountyLink: updates.length + all.filter(p => (p.auditLinks ?? []).join('').includes('immunefi.com') && p.audited && (p.auditNote ?? '').toLowerCase().includes('bounty')).length, updated: updates.length },
      durationMs: Date.now() - t0,
    };
  } catch (err) {
    return { stage: 'bounty-links', ok: false, detail: {}, durationMs: Date.now() - t0, error: String(err) };
  }
}

// ─── Stage 4 — Hacks ─────────────────────────────────────────────────────────

async function runHacksStage(): Promise<PipelineStageResult> {
  const t0 = Date.now();
  try {
    const hacks = await fetchAllHacks();
    if (!hacks.length) {
      return { stage: 'hacks', ok: false, detail: { hacks: 0 }, durationMs: Date.now() - t0, error: 'No hacks returned' };
    }

    // Count incidents per protocol slug
    const hackCountEntries: Array<[string, number]> = [];
    const hackCountMap: Record<string, number> = {};
    for (const h of hacks) {
      const s = slug(h.name);
      hackCountMap[s] = (hackCountMap[s] ?? 0) + 1;
    }
    for (const [k, v] of Object.entries(hackCountMap)) hackCountEntries.push([k, v]);

    const all = await storage.getProtocols();
    let matched = 0;

    // Protocols with ≥1 hack: store count in audit_note as a signal
    // (DFJ v2.3 scoring will pick it up via auditNote parsing)
    const updates: { id: string; auditNote: string }[] = [];
    for (const p of all) {
      let count = 0;
      for (const [hSlug, c] of hackCountEntries) {
        if (nameMatch(p.name, hSlug)) { count += c; }
      }
      if (count === 0) continue;

      const tag = `Incidents: ${count}`;
      const note = p.auditNote
        ? p.auditNote.includes('Incidents:') ? p.auditNote.replace(/Incidents:\s*\d+/, tag) : `${p.auditNote}; ${tag}`
        : tag;
      if (note !== p.auditNote) updates.push({ id: p.id, auditNote: note });
      matched++;
    }

    const CHUNK = 100;
    for (let i = 0; i < updates.length; i += CHUNK) {
      const chunk = updates.slice(i, i + CHUNK);
      await Promise.all(chunk.map(u =>
        db.update(protocols).set({ auditNote: u.auditNote }).where(eq(protocols.id, u.id))
      ));
    }

    return {
      stage: 'hacks',
      ok: true,
      detail: { totalHacks: hacks.length, protocolsMatched: matched, noteUpdates: updates.length },
      durationMs: Date.now() - t0,
    };
  } catch (err) {
    return { stage: 'hacks', ok: false, detail: {}, durationMs: Date.now() - t0, error: String(err) };
  }
}

// ─── Main pipeline ────────────────────────────────────────────────────────────

export interface PipelineOptions {
  /** How many protocols to deep-enrich from DeFiLlama detail API (default 500) */
  enrichLimit?: number;
  /** Skip stages by name, e.g. ['hacks'] */
  skip?: string[];
  onProgress?: (msg: string) => void;
}

export async function runFullPipeline(opts: PipelineOptions = {}): Promise<PipelineResult> {
  const { enrichLimit = 500, skip = [], onProgress = console.log } = opts;
  const stages: PipelineStageResult[] = [];
  const pipelineStart = Date.now();

  const run = async (name: string, fn: () => Promise<PipelineStageResult>) => {
    if (skip.includes(name)) {
      onProgress(`[PIPELINE] Skipping stage: ${name}`);
      return;
    }
    onProgress(`[PIPELINE] Starting stage: ${name}`);
    const s = await fn();
    stages.push(s);
    const status = s.ok ? '✓' : '✗';
    const detail = Object.entries(s.detail).map(([k, v]) => `${k}=${v}`).join(' ');
    onProgress(`[PIPELINE] ${status} ${name} (${s.durationMs}ms) ${detail}${s.error ? ' ERROR: ' + s.error : ''}`);
  };

  // ── Stage 1: DeFiLlama bulk + volume (handled by background refresh,
  //    but we can trigger it explicitly here by importing discovery)
  await run('llama-bulk', async (): Promise<PipelineStageResult> => {
    const t0 = Date.now();
    try {
      const { DAppDiscovery } = await import('./dapp-discovery');
      const discovery = new DAppDiscovery();
      const freshProtocols = await discovery.fetchFromMultipleSources();
      let upserted = 0;
      for (const p of freshProtocols) {
        try {
          await db.update(protocols)
            .set({
              tvl: p.tvl ?? 0,
              volume24h: p.volume24h ?? 0,
              change24h: p.change24h ?? 0,
              chains: p.chains ?? [],
              category: p.category ?? 'Other',
              website: p.website ?? null,
              twitter: p.twitter ?? null,
              github: p.github ?? null,
              logo: p.logo ?? null,
              lastUpdated: new Date(),
            })
            .where(eq(protocols.id, p.id));
          upserted++;
        } catch { /* new protocol not yet in DB — skip */ }
      }
      return { stage: 'llama-bulk', ok: true, detail: { fetched: freshProtocols.length, updated: upserted }, durationMs: Date.now() - t0 };
    } catch (err) {
      return { stage: 'llama-bulk', ok: false, detail: {}, durationMs: Date.now() - t0, error: String(err) };
    }
  });

  // ── Stage 2: Per-protocol detail enrichment
  await run('llama-detail', async (): Promise<PipelineStageResult> => {
    const t0 = Date.now();
    try {
      const result = await enrichProtocols(enrichLimit);
      return { stage: 'llama-detail', ok: true, detail: { limit: enrichLimit, enriched: result.enriched, updated: result.updated, errors: result.errors }, durationMs: Date.now() - t0 };
    } catch (err) {
      return { stage: 'llama-detail', ok: false, detail: {}, durationMs: Date.now() - t0, error: String(err) };
    }
  });

  // ── Stage 3: Bounty link normaliser (reads DB — no external call)
  await run('bounty-links', runImmunefiStage);

  // ── Stage 4: DeFiLlama hacks
  await run('hacks', runHacksStage);

  // ── Stage 5: Rescore
  await run('rescore', async (): Promise<PipelineStageResult> => {
    const t0 = Date.now();
    try {
      const result = await batchRescore(); // includes flushServerCache()
      return { stage: 'rescore', ok: true, detail: { total: result.total, safe: result.safe, low: result.low, medium: result.medium, high: result.high, critical: result.critical, flagged: result.flagged }, durationMs: Date.now() - t0 };
    } catch (err) {
      return { stage: 'rescore', ok: false, detail: {}, durationMs: Date.now() - t0, error: String(err) };
    }
  });

  return {
    stages,
    totalDurationMs: Date.now() - pipelineStart,
    completedAt: new Date().toISOString(),
  };
}
