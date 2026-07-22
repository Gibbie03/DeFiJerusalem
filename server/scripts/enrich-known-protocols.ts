/**
 * Apply verified security facts to top DeFi protocol records, then rescore.
 *
 * Usage:
 *   npx tsx server/scripts/enrich-known-protocols.ts
 *   npx tsx server/scripts/enrich-known-protocols.ts --dry-run
 *
 * Strategy (conservative — only improves, never downgrades):
 *   - github:        set if currently null/empty
 *   - auditNote:     always set (was null for all protocols)
 *   - auditLinks:    APPEND new firm URLs to existing array (no dedup issue — SQL handles it)
 *   - auditCount:    set to max(existing, known)
 *   - defiHasMultisig / defiHasTimelock: only set TRUE, never set FALSE
 *   - audited:       set TRUE if auditCount > 0
 */

import { db } from '../db';
import { protocols } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';
import { KNOWN_PROTOCOL_FACTS } from '../lib/known-protocol-facts';
import { batchRescore } from '../lib/protocol-enrichment';

const DRY_RUN = process.argv.includes('--dry-run');

interface UpdateResult {
  id: string;
  fields: string[];
}

async function main() {
  console.log('='.repeat(60));
  console.log('DeFiJerusalem — Known Protocol Enrichment');
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no writes)' : 'LIVE'}`);
  console.log('='.repeat(60));

  const protocolIds = Object.keys(KNOWN_PROTOCOL_FACTS);
  console.log(`\nFacts defined for ${protocolIds.length} protocols`);

  // Load existing records for the protocols we care about
  const existing = await db
    .select({
      id:               protocols.id,
      github:           protocols.github,
      auditNote:        protocols.auditNote,
      auditLinks:       protocols.auditLinks,
      auditCount:       protocols.auditCount,
      audited:          protocols.audited,
      defiHasMultisig:  protocols.defiHasMultisig,
      defiHasTimelock:  protocols.defiHasTimelock,
    })
    .from(protocols)
    .where(sql.raw(`id IN (${protocolIds.map(id => `'${id.replace(/'/g, "''")}'`).join(',')})`));

  console.log(`Found ${existing.length} matching protocols in DB\n`);

  const updates: UpdateResult[] = [];

  for (const row of existing) {
    const facts = KNOWN_PROTOCOL_FACTS[row.id];
    if (!facts) continue;

    const patch: Record<string, unknown> = {};
    const changed: string[] = [];

    // github — only set if missing
    if (facts.github && !row.github) {
      patch.github = facts.github;
      changed.push('github');
    }

    // auditNote — always overwrite (was null everywhere)
    if (facts.auditNote && row.auditNote !== facts.auditNote) {
      patch.auditNote = facts.auditNote;
      changed.push('auditNote');
    }

    // auditLinks — append new firm URLs to existing, deduplicate
    const existingLinks: string[] = (row.auditLinks as string[]) ?? [];
    const newLinks = facts.auditLinks.filter(u => !existingLinks.includes(u));
    if (newLinks.length > 0) {
      patch.auditLinks = [...existingLinks, ...newLinks];
      changed.push(`auditLinks(+${newLinks.length})`);
    }

    // auditCount — use max(existing, known)
    const betterCount = Math.max(row.auditCount ?? 0, facts.auditCount);
    if (betterCount > (row.auditCount ?? 0)) {
      patch.auditCount = betterCount;
      changed.push(`auditCount(${row.auditCount}→${betterCount})`);
    }

    // audited — set true if we know there are audits
    if (!row.audited && facts.auditCount > 0) {
      patch.audited = true;
      changed.push('audited=true');
    }

    // multisig / timelock — only upgrade to true
    if (facts.multisig && !row.defiHasMultisig) {
      patch.defiHasMultisig = true;
      changed.push('multisig=true');
    }
    if (facts.timelock && !row.defiHasTimelock) {
      patch.defiHasTimelock = true;
      changed.push('timelock=true');
    }

    if (changed.length === 0) {
      console.log(`  ✓ ${row.id.padEnd(24)} — already up to date`);
      continue;
    }

    console.log(`  ↑ ${row.id.padEnd(24)} — updating: ${changed.join(', ')}`);
    updates.push({ id: row.id, fields: changed });

    if (!DRY_RUN) {
      await db.update(protocols).set(patch as any).where(eq(protocols.id, row.id));
    }
  }

  // Report protocols in facts but not in DB
  const foundIds = new Set(existing.map(r => r.id));
  const missing = protocolIds.filter(id => !foundIds.has(id));
  if (missing.length > 0) {
    console.log(`\nNot in DB (${missing.length}): ${missing.join(', ')}`);
  }

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`Updated: ${updates.length} protocols`);

  if (DRY_RUN) {
    console.log('DRY RUN complete — no writes performed.');
    process.exit(0);
  }

  // Rescore all protocols now that data has improved
  console.log('\nRescoring all protocols...');
  const result = await batchRescore();
  console.log(`Done. ${result.total} protocols scored.`);
  console.log(`  SAFE=${result.safe}  LOW=${result.low}  MEDIUM=${result.medium}  HIGH=${result.high}  CRITICAL=${result.critical}`);

  process.exit(0);
}

main().catch(err => {
  console.error('Enrichment failed:', err);
  process.exit(1);
});
