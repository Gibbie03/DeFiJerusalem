/**
 * Audit Firm Cross-Reference Enrichment
 *
 * Fetches published audit report lists from major security firms' public GitHub
 * repos, parses protocol names from filenames, and matches them against our
 * protocol database.  For each match it:
 *   - Appends the firm name to audit_note (if not already present)
 *   - Sets audited = true
 *   - Raises audit_count to at least the number of matched distinct firms
 *
 * Sources (all public, no API key required):
 *   Trail of Bits   — github.com/trailofbits/publications        /reviews
 *   Cyfrin          — github.com/Cyfrin/cyfrin-audit-reports     /reports
 *   PeckShield      — github.com/peckshield/publications         /audit_reports
 *
 * Usage:
 *   npx tsx server/scripts/enrich-from-audit-firms.ts
 *   npx tsx server/scripts/enrich-from-audit-firms.ts --dry-run
 */

import { db } from '../db';
import { protocols } from '@shared/schema';
import { sql } from 'drizzle-orm';
import { batchRescore } from '../lib/protocol-enrichment';

const DRY_RUN = process.argv.includes('--dry-run');

// ─── Firm definitions ─────────────────────────────────────────────────────────

interface FirmConfig {
  name: string;       // as it should appear in audit_note text
  apiUrl: string;     // GitHub contents API URL
  parseFilename: (filename: string) => string | null;  // returns slug or null
}

/**
 * Remove common date prefixes (YYYY-MM or YYYY-MM-DD) and
 * report-type suffixes from a filename, returning the protocol slug.
 */
function removeDateAndSuffix(name: string): string {
  return name
    .replace(/\.pdf$/i, '')
    .replace(/^\d{4}-\d{2}-\d{2}-?/, '')   // YYYY-MM-DD-
    .replace(/^\d{4}-\d{2}-?/, '')          // YYYY-MM-
    .replace(/-(security[-_]?review|securityreview|audit|report|security)$/i, '')
    .replace(/[-_](v\d[\d.]*[-\w]*)$/i, '') // trailing version: -v1.0, -v2
    .toLowerCase()
    .replace(/[_]/g, '-');
}

const FIRMS: FirmConfig[] = [
  {
    name: 'Trail of Bits',
    apiUrl: 'https://api.github.com/repos/trailofbits/publications/contents/reviews',
    parseFilename(f) {
      if (!f.endsWith('.pdf') && !f.endsWith('.md')) return null;
      const slug = removeDateAndSuffix(f)
        .replace(/^trailofbits-/, '')
        .replace(/^tob-/, '');
      return slug.length >= 3 ? slug : null;
    },
  },
  {
    name: 'Cyfrin',
    apiUrl: 'https://api.github.com/repos/Cyfrin/cyfrin-audit-reports/contents/reports',
    parseFilename(f) {
      if (!f.endsWith('.pdf')) return null;
      const slug = removeDateAndSuffix(f)
        .replace(/^cyfrin-/, '')
        .replace(/-report$/, '')
        .replace(/-audit$/, '');
      return slug.length >= 3 ? slug : null;
    },
  },
  {
    name: 'PeckShield',
    apiUrl: 'https://api.github.com/repos/peckshield/publications/contents/audit_reports',
    parseFilename(f) {
      if (!f.endsWith('.pdf')) return null;
      // Formats: PeckShield-Audit-Report-Protocol-v1.0.pdf
      //          PeckShield-Audit-Protocol-v1.0.pdf
      //          Protocol_audit_report_YYYY_MM_en_1_0.pdf
      let slug = f
        .replace(/\.pdf$/i, '')
        .replace(/^PeckShield[-_]Audit[-_](Report[-_])?/i, '')
        .replace(/[-_](v\d[\d.]*)[-_]?.*$/i, '')  // remove version and everything after
        .replace(/[-_]audit[-_]report.*$/i, '')     // old format suffix
        .replace(/[-_]\d{4}[-_]\d{2}.*$/i, '')     // date suffix in old format
        .toLowerCase()
        .replace(/[_]/g, '-');
      return slug.length >= 3 ? slug : null;
    },
  },
];

// ─── GitHub API fetch ─────────────────────────────────────────────────────────

async function fetchFilenames(apiUrl: string): Promise<string[]> {
  const res = await fetch(apiUrl, {
    headers: {
      'User-Agent': 'DeFiJerusalem-AuditEnricher/1.0',
      'Accept': 'application/vnd.github.v3+json',
    },
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`GitHub API ${res.status} for ${apiUrl}`);
  const items: { name: string; type: string }[] = await res.json();
  return items.filter(i => i.type === 'file').map(i => i.name);
}

// ─── Slug → protocol matching ─────────────────────────────────────────────────

/** Normalise a slug for loose comparison: lowercase, strip hyphens/underscores/spaces */
function norm(s: string) {
  return s.toLowerCase().replace(/[-_\s]/g, '');
}

interface ProtocolRow {
  id: string;
  name: string;
  auditNote: string | null;
  auditCount: number | null;
  audited: boolean | null;
}

function findMatch(slug: string, protocols: ProtocolRow[]): ProtocolRow | null {
  const nslug = norm(slug);
  if (nslug.length < 3) return null;

  // 1. Exact ID match
  const exact = protocols.find(p => norm(p.id) === nslug);
  if (exact) return exact;

  // 2. ID starts with slug (catches "aave" matching "aave-v3")
  const startsWith = protocols.find(p => norm(p.id).startsWith(nslug) && nslug.length >= 4);
  if (startsWith) return startsWith;

  // 3. Slug starts with ID (catches "balancerv2" slug matching "balancer" ID)
  const idPrefix = protocols.find(p => norm(p.id).length >= 4 && nslug.startsWith(norm(p.id)));
  if (idPrefix) return idPrefix;

  // 4. Slug is a substring of ID or vice versa (min 5 chars to avoid false positives)
  if (nslug.length >= 5) {
    const sub = protocols.find(p =>
      norm(p.id).includes(nslug) || (nslug.includes(norm(p.id)) && norm(p.id).length >= 5)
    );
    if (sub) return sub;
  }

  // 5. Name match (normalised)
  const nameMatch = protocols.find(p => norm(p.name) === nslug || (nslug.length >= 6 && norm(p.name).includes(nslug)));
  if (nameMatch) return nameMatch;

  return null;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('='.repeat(60));
  console.log('DeFiJerusalem — Audit Firm Cross-Reference');
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  console.log('='.repeat(60));

  // Load all protocols into memory (id, name, auditNote, auditCount, audited)
  console.log('\nLoading protocols from DB...');
  const allRows = await db
    .select({
      id:        protocols.id,
      name:      protocols.name,
      auditNote: protocols.auditNote,
      auditCount:protocols.auditCount,
      audited:   protocols.audited,
    })
    .from(protocols);
  console.log(`  ${allRows.length} protocols loaded`);

  // Accumulate patches: protocolId → set of firm names to add
  const patches = new Map<string, Set<string>>();
  const addPatch = (id: string, firm: string) => {
    if (!patches.has(id)) patches.set(id, new Set());
    patches.get(id)!.add(firm);
  };

  let totalFilenames = 0;
  let totalMatched  = 0;

  for (const firm of FIRMS) {
    console.log(`\n── ${firm.name} ──`);
    let filenames: string[];
    try {
      filenames = await fetchFilenames(firm.apiUrl);
    } catch (err) {
      console.error(`  FAILED to fetch: ${err}`);
      continue;
    }
    console.log(`  ${filenames.length} files fetched`);
    totalFilenames += filenames.length;

    let matched = 0;
    for (const filename of filenames) {
      const slug = firm.parseFilename(filename);
      if (!slug) continue;

      const row = findMatch(slug, allRows);
      if (!row) continue;

      // Skip if this firm is already in the audit note
      const already = (row.auditNote ?? '').toLowerCase().includes(firm.name.toLowerCase().split(' ')[0]);
      if (already) continue;

      addPatch(row.id, firm.name);
      matched++;
      if (matched <= 5) console.log(`  ✓ "${slug}" → ${row.id} (${row.name})`);
    }
    if (matched > 5) console.log(`  … and ${matched - 5} more matches`);
    console.log(`  ${matched} new matches`);
    totalMatched += matched;
  }

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`Total: ${totalFilenames} report files scanned, ${patches.size} protocols to update`);

  if (patches.size === 0) {
    console.log('Nothing to update.');
    process.exit(0);
  }

  if (DRY_RUN) {
    console.log('\nDRY RUN — no writes.');
    process.exit(0);
  }

  // Write updates in batches
  console.log('\nWriting updates to DB...');
  let written = 0;
  for (const [id, firms] of patches) {
    const row = allRows.find(r => r.id === id)!;
    const existingNote = row.auditNote ?? '';
    const firmList     = [...firms].join(', ');
    const newNote      = existingNote
      ? `${existingNote}. Also audited by ${firmList}.`
      : `Audited by ${firmList}.`;

    const existingCount = row.auditCount ?? 0;
    const newCount      = Math.max(existingCount, firms.size + (existingCount === 0 ? 1 : existingCount));

    await db
      .update(protocols)
      .set({
        auditNote:  newNote,
        auditCount: sql`GREATEST(COALESCE(audit_count, 0), ${newCount})`,
        audited:    true,
      })
      .where(sql`id = ${id}`);

    written++;
    if (written % 50 === 0) console.log(`  ${written}/${patches.size} written`);
  }
  console.log(`  Done — ${written} protocols updated`);

  console.log('\nRescoring...');
  const result = await batchRescore();
  console.log(`Done. ${result.total} scored — SAFE=${result.safe} LOW=${result.low} MEDIUM=${result.medium} HIGH=${result.high}`);

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
