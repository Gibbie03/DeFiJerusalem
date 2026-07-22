/**
 * GitHub URL Enrichment from DeFiLlama Protocol Detail
 *
 * DeFiLlama's /protocol/{slug} endpoint returns a `github` field (array of
 * GitHub organisation names) that we currently discard. This script fetches
 * the detail for protocols where our DB has github=NULL, extracts the first
 * GitHub org name, converts it to a canonical URL
 * (https://github.com/{org}), and stores it.
 *
 * Impact: ~6,300 protocols currently have no GitHub URL. Many of them have
 * open-source code — we just never recorded it.  Fixing this directly lifts
 * their F2 (Code & Contract History) and A1 (Security Infrastructure) scores.
 *
 * Rate: 10 concurrent requests, 250 ms between batches — stays inside
 * DeFiLlama's unauthenticated rate limit.
 *
 * Usage:
 *   npx tsx server/scripts/enrich-github-from-defillama.ts
 *   npx tsx server/scripts/enrich-github-from-defillama.ts --dry-run
 *   npx tsx server/scripts/enrich-github-from-defillama.ts --limit=200
 */

import { db } from '../db';
import { protocols } from '@shared/schema';
import { sql, isNull } from 'drizzle-orm';
import { batchRescore } from '../lib/protocol-enrichment';

const DRY_RUN   = process.argv.includes('--dry-run');
const limitArg  = process.argv.find(a => a.startsWith('--limit='));
const LIMIT     = limitArg ? parseInt(limitArg.split('=')[1], 10) : 2000;
const BATCH     = 10;
const DELAY_MS  = 300;

// ─── DeFiLlama detail fetch ───────────────────────────────────────────────────

interface LlamaProtocolDetail {
  github?: string[];
  openSource?: boolean;
  [key: string]: unknown;
}

async function fetchDetail(slug: string): Promise<LlamaProtocolDetail | null> {
  try {
    const res = await fetch(`https://api.llama.fi/protocol/${encodeURIComponent(slug)}`, {
      headers: { Accept: 'application/json', 'User-Agent': 'DeFiJerusalem-GitHubEnricher/1.0' },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return null;
    return await res.json() as LlamaProtocolDetail;
  } catch {
    return null;
  }
}

function githubUrlFromOrg(org: string): string {
  return `https://github.com/${org}`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('='.repeat(60));
  console.log('DeFiJerusalem — GitHub Enrichment from DeFiLlama');
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}  Limit: ${LIMIT}`);
  console.log('='.repeat(60));

  // Fetch protocols with no github, sorted by TVL desc (highest-value first)
  console.log('\nLoading protocols with missing GitHub...');
  const rows = await db
    .select({ id: protocols.id, name: protocols.name, tvl: protocols.tvl })
    .from(protocols)
    .where(isNull(protocols.github))
    .orderBy(sql`tvl DESC NULLS LAST`)
    .limit(LIMIT);

  console.log(`  ${rows.length} protocols to process`);

  let fetched  = 0;
  let enriched = 0;
  let noData   = 0;

  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);

    await Promise.all(batch.map(async (row) => {
      const detail = await fetchDetail(row.id);
      fetched++;

      if (!detail?.github?.length) {
        noData++;
        return;
      }

      // Use the first org name — it's almost always the canonical one
      const org = detail.github[0].replace(/^https?:\/\/github\.com\//i, '').trim();
      if (!org) { noData++; return; }

      const githubUrl = githubUrlFromOrg(org);
      enriched++;
      console.log(`  ✓ ${row.id} → ${githubUrl}`);

      if (!DRY_RUN) {
        await db
          .update(protocols)
          .set({ github: githubUrl })
          .where(sql`id = ${row.id}`);
      }
    }));

    const progress = Math.min(i + BATCH, rows.length);
    if (progress % 100 === 0 || progress === rows.length) {
      console.log(`  Progress: ${progress}/${rows.length} (enriched ${enriched}, no data ${noData})`);
    }

    if (i + BATCH < rows.length) {
      await new Promise(r => setTimeout(r, DELAY_MS));
    }
  }

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`Fetched: ${fetched}  Enriched: ${enriched}  No GitHub data: ${noData}`);

  if (enriched === 0 || DRY_RUN) {
    console.log(DRY_RUN ? 'DRY RUN — no writes.' : 'Nothing new to write.');
    process.exit(0);
  }

  console.log('\nRescoring...');
  const result = await batchRescore();
  console.log(`Done. ${result.total} scored — SAFE=${result.safe} LOW=${result.low} MEDIUM=${result.medium} HIGH=${result.high} CRITICAL=${result.critical}`);
  console.log(`\n✓ ${enriched} protocols now have GitHub URLs`);

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
