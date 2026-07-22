/**
 * Full data pipeline — run all enrichment stages then rescore.
 *
 * Usage:
 *   npx tsx server/scripts/run-pipeline.ts
 *   npx tsx server/scripts/run-pipeline.ts --limit=200   # fewer detail fetches
 *   npx tsx server/scripts/run-pipeline.ts --skip=hacks  # skip a stage
 */

import { runFullPipeline } from '../lib/data-pipeline';

const args = Object.fromEntries(
  process.argv.slice(2)
    .filter(a => a.startsWith('--'))
    .map(a => { const [k, v] = a.slice(2).split('='); return [k, v ?? 'true']; })
);

const enrichLimit = args.limit ? parseInt(args.limit) : 500;
const skip = args.skip ? args.skip.split(',') : [];

console.log('='.repeat(60));
console.log('DeFiJerusalem — Full Data Pipeline');
console.log(`  Enrich limit : ${enrichLimit} protocols`);
if (skip.length) console.log(`  Skipping     : ${skip.join(', ')}`);
console.log('='.repeat(60));

runFullPipeline({ enrichLimit, skip }).then(result => {
  console.log('');
  console.log('='.repeat(60));
  console.log(`Pipeline complete in ${(result.totalDurationMs / 1000).toFixed(1)}s`);
  console.log('Stage summary:');
  for (const s of result.stages) {
    const status = s.ok ? '✓' : '✗';
    const detail = Object.entries(s.detail).map(([k, v]) => `${k}=${v}`).join('  ');
    console.log(`  ${status} ${s.stage.padEnd(14)} ${(s.durationMs / 1000).toFixed(1)}s  ${detail}`);
    if (s.error) console.log(`    ERROR: ${s.error}`);
  }
  console.log('='.repeat(60));
  process.exit(0);
}).catch(err => {
  console.error('Pipeline failed:', err);
  process.exit(1);
});
