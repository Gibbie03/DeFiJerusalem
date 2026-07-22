/**
 * DeFiSafety Score Enrichment
 *
 * DeFiSafety (defisafety.com) publishes curated security reviews for DeFi
 * protocols covering: documentation, access controls, testing, oracles, and
 * contract verification. Each review produces a percentage score (0-100).
 *
 * Since DeFiSafety does not expose a public JSON API, this script uses a
 * maintained local dataset (server/data/defisafety-scores.json) which is
 * updated whenever DeFiSafety publishes new reviews.
 *
 * For each protocol with a known DeFiSafety score this script:
 *   1. Fuzzy-matches the DeFiSafety entry to a DB protocol
 *   2. Appends "DeFiSafety: XX/100" to audit_note
 *   3. Sets audited=true for protocols scoring ≥ 65
 *   4. Triggers a full batchRescore() so scores update immediately
 *
 * Scheduler: weekly (called from server/index.ts)
 * Usage:     npx tsx server/scripts/fetch-defisafety-scores.ts
 *            npx tsx server/scripts/fetch-defisafety-scores.ts --dry-run
 */

import fs from 'fs';
import path from 'path';
import { db } from '../db';
import { protocols } from '@shared/schema';
import { sql } from 'drizzle-orm';
import { batchRescore } from '../lib/protocol-enrichment';

const DRY_RUN = process.argv.includes('--dry-run');
const SCORES_FILE = path.join(process.cwd(), 'server', 'data', 'defisafety-scores.json');
const DEFISAFETY_AUDIT_THRESHOLD = 65; // score >= this → mark as audited

// ─── Normalise for fuzzy matching ────────────────────────────────────────────

function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/\bv\d+(\.\d+)*/g, '')            // strip version numbers
    .replace(/[-_\s.]/g, '')                    // strip separators
    .replace(/finance|protocol|dao|network|labs?|defi/g, ''); // strip generic suffixes
}

// ─── Match DeFiSafety entry to DB protocol ───────────────────────────────────

interface DeFiSafetyEntry {
  name: string;
  slug: string;
  score: number;
  url: string;
}

interface ProtocolRow {
  id: string;
  name: string;
  auditNote: string | null;
}

function findMatch(entry: DeFiSafetyEntry, rows: ProtocolRow[]): ProtocolRow | null {
  const nSlug = norm(entry.slug);
  const nName = norm(entry.name);

  // 1. Exact ID match against slug
  const exactId = rows.find(r => norm(r.id) === nSlug);
  if (exactId) return exactId;

  // 2. Exact name match
  const exactName = rows.find(r => norm(r.name) === nName || norm(r.name) === nSlug);
  if (exactName) return exactName;

  // 3. ID starts with slug (e.g. "aave" matches "aave-v3")
  if (nSlug.length >= 4) {
    const startsWith = rows.find(r => norm(r.id).startsWith(nSlug));
    if (startsWith) return startsWith;
  }

  // 4. Slug starts with ID (e.g. "curvefi" matches "curve" ID)
  const idPrefix = rows.find(r => norm(r.id).length >= 4 && nSlug.startsWith(norm(r.id)));
  if (idPrefix) return idPrefix;

  // 5. Substring containment (min 5 chars)
  if (nSlug.length >= 5) {
    const sub = rows.find(r => {
      const nId = norm(r.id);
      return nId.includes(nSlug) || (nSlug.includes(nId) && nId.length >= 5);
    });
    if (sub) return sub;
  }

  return null;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export async function runDeFiSafetyEnrichment(): Promise<{
  matched: number;
  updated: number;
  skipped: number;
}> {
  console.log('='.repeat(60));
  console.log('DeFiJerusalem — DeFiSafety Score Enrichment');
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  console.log('='.repeat(60));

  // Load DeFiSafety scores
  if (!fs.existsSync(SCORES_FILE)) {
    console.error(`DeFiSafety scores file not found: ${SCORES_FILE}`);
    return { matched: 0, updated: 0, skipped: 0 };
  }
  const entries: DeFiSafetyEntry[] = JSON.parse(fs.readFileSync(SCORES_FILE, 'utf8'));
  console.log(`\nLoaded ${entries.length} DeFiSafety entries`);

  // Load protocols from DB
  console.log('Loading protocols from DB...');
  const rows = await db
    .select({ id: protocols.id, name: protocols.name, auditNote: protocols.auditNote })
    .from(protocols);
  console.log(`  ${rows.length} protocols loaded`);

  let matched = 0;
  let updated = 0;
  let skipped = 0;

  const patches: Array<{ id: string; auditNote: string; audited: boolean }> = [];

  for (const entry of entries) {
    const row = findMatch(entry, rows);
    if (!row) {
      console.log(`  ✗ No match: "${entry.name}" (${entry.slug})`);
      skipped++;
      continue;
    }

    matched++;
    const existingNote = row.auditNote ?? '';
    const marker = `DeFiSafety: ${entry.score}/100`;

    // Skip if already recorded
    if (existingNote.toLowerCase().includes('defisafety')) {
      console.log(`  → Already has DeFiSafety: ${row.id}`);
      skipped++;
      continue;
    }

    const newNote = existingNote
      ? `${existingNote}. ${marker} (${entry.url})`
      : `${marker} (${entry.url})`;

    const shouldSetAudited = entry.score >= DEFISAFETY_AUDIT_THRESHOLD;
    console.log(`  ✓ "${entry.name}" → ${row.id} [${row.name}] score=${entry.score}`);

    patches.push({ id: row.id, auditNote: newNote, audited: shouldSetAudited });
    updated++;
  }

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`Matched: ${matched}  Updated: ${updated}  Skipped: ${skipped}`);

  if (patches.length === 0 || DRY_RUN) {
    console.log(DRY_RUN ? '\nDRY RUN — no writes.' : 'Nothing new to write.');
    return { matched, updated, skipped };
  }

  console.log('\nWriting to DB...');
  for (const patch of patches) {
    await db
      .update(protocols)
      .set({
        auditNote: patch.auditNote,
        ...(patch.audited ? { audited: true } : {}),
      })
      .where(sql`id = ${patch.id}`);
  }
  console.log(`  Done — ${patches.length} protocols updated`);

  console.log('\nRescoring...');
  const result = await batchRescore();
  console.log(`Done. ${result.total} scored — SAFE=${result.safe} LOW=${result.low} MEDIUM=${result.medium} HIGH=${result.high} CRITICAL=${result.critical}`);

  return { matched, updated, skipped };
}

// ─── CLI entry ────────────────────────────────────────────────────────────────

if (process.argv[1] === import.meta.url.replace('file://', '')) {
  runDeFiSafetyEnrichment().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
  });
}
