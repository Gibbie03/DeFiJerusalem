/**
 * Generate data-enrichment bounties for protocols with missing fields.
 *
 * Usage:
 *   npx tsx server/scripts/generate-data-gaps.ts
 *   npx tsx server/scripts/generate-data-gaps.ts --limit=200 --fields=audit_links,github
 */

import { db } from '../db';
import { protocols, bountyTasks } from '@shared/schema';
import { gt, desc, eq, and } from 'drizzle-orm';

const ENRICHABLE_FIELDS: Record<string, { label: string; points: number; dataType: string }> = {
  audit_links:       { label: 'Audit report URL',   points: 50, dataType: 'url'     },
  github:            { label: 'GitHub repo URL',     points: 30, dataType: 'url'     },
  website:           { label: 'Official website',    points: 10, dataType: 'url'     },
  twitter:           { label: 'Twitter / X handle',  points: 15, dataType: 'url'     },
  defi_has_multisig: { label: 'Multisig confirmed',  points: 40, dataType: 'boolean' },
  defi_has_timelock: { label: 'Timelock confirmed',  points: 40, dataType: 'boolean' },
  bug_bounty_url:    { label: 'Bug bounty URL',      points: 35, dataType: 'url'     },
};

function uid(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

const args = Object.fromEntries(
  process.argv.slice(2)
    .filter(a => a.startsWith('--'))
    .map(a => { const [k, v] = a.slice(2).split('='); return [k, v ?? 'true']; })
);

const scanLimit   = Math.min(parseInt(args.limit ?? '500'), 5000);
const fieldFilter = args.fields ? args.fields.split(',') : Object.keys(ENRICHABLE_FIELDS);
const targetFields = fieldFilter.filter(f => f in ENRICHABLE_FIELDS);

async function main() {
  console.log('='.repeat(60));
  console.log('DeFiJerusalem — Data Gap Bounty Generator');
  console.log(`  Scanning top ${scanLimit} protocols by TVL`);
  console.log(`  Fields    : ${targetFields.join(', ')}`);
  console.log('='.repeat(60));

  // Fetch top protocols by TVL
  const rows = await db.select({
    id: protocols.id, name: protocols.name, tvl: protocols.tvl,
    auditLinks: protocols.auditLinks, github: protocols.github,
    website: protocols.website, twitter: protocols.twitter,
    defiHasMultisig: protocols.defiHasMultisig,
    defiHasTimelock: protocols.defiHasTimelock,
  }).from(protocols)
    .where(gt(protocols.tvl, 0))
    .orderBy(desc(protocols.tvl))
    .limit(scanLimit);

  console.log(`\nFetched ${rows.length} protocols.`);

  // Find gaps
  const gaps: { protocolId: string; protocolName: string; field: string }[] = [];
  for (const p of rows) {
    const links = (p.auditLinks as string[] | null) ?? [];
    const missing: Record<string, boolean> = {
      audit_links:       links.length === 0,
      github:            !p.github,
      website:           !p.website,
      twitter:           !p.twitter,
      defi_has_multisig: p.defiHasMultisig === null || p.defiHasMultisig === undefined,
      defi_has_timelock: p.defiHasTimelock === null || p.defiHasTimelock === undefined,
      bug_bounty_url:    !links.some(l => l.includes('immunefi.com') || l.includes('hackerone.com')),
    };
    for (const field of targetFields) {
      if (missing[field]) gaps.push({ protocolId: p.id, protocolName: p.name, field });
    }
  }

  console.log(`Found ${gaps.length} data gaps across ${rows.length} protocols.`);

  // Check existing open DataEnrichment bounties to avoid duplicates
  const existing = await db.select({
    protocolId: bountyTasks.protocolId,
    targetField: bountyTasks.targetField,
  }).from(bountyTasks)
    .where(and(eq(bountyTasks.category, 'DataEnrichment'), eq(bountyTasks.status, 'open')));

  const existingSet = new Set(existing.map(t => `${t.protocolId}::${t.targetField}`));
  const newGaps = gaps.filter(g => !existingSet.has(`${g.protocolId}::${g.field}`));

  console.log(`  Already have bounties for : ${gaps.length - newGaps.length}`);
  console.log(`  New bounties to create    : ${newGaps.length}`);

  if (newGaps.length === 0) {
    console.log('\nNo new gap bounties needed. Done.');
    process.exit(0);
  }

  // Create in chunks of 50
  const CHUNK = 50;
  let created = 0;
  for (let i = 0; i < newGaps.length; i += CHUNK) {
    const chunk = newGaps.slice(i, i + CHUNK);
    const values = chunk.map(g => {
      const meta = ENRICHABLE_FIELDS[g.field]!;
      return {
        id: uid('task'),
        title: `Verify ${meta.label} for ${g.protocolName}`,
        description:
          `Help fill a security data gap for **${g.protocolName}**.\n\n` +
          `Submit the verified **${meta.label}**. Your submission will be reviewed and, if approved, ` +
          `applied directly to the protocol record and trigger a rescore. Include a source link as evidence.`,
        category: 'DataEnrichment',
        pointReward: meta.points,
        status: 'open',
        protocolId: g.protocolId,
        targetField: g.field,
        dataType: meta.dataType,
        requirements: [
          'Provide a working URL or verifiable source',
          'Source must be official or widely recognised',
          'Include evidence of verification (screenshot, tx hash, etc.)',
        ],
        createdBy: 'system',
        maxSubmissions: 3,
      };
    });
    await db.insert(bountyTasks).values(values as any);
    created += chunk.length;
    process.stdout.write(`\r  Created ${created} / ${newGaps.length} bounties...`);
  }

  console.log('\n');

  // Summary by field
  console.log('By field:');
  for (const field of targetFields) {
    const count = newGaps.filter(g => g.field === field).length;
    if (count) console.log(`  ${field.padEnd(20)} ${count} new bounties`);
  }

  console.log('='.repeat(60));
  console.log(`Done. ${created} bounties created.`);
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
