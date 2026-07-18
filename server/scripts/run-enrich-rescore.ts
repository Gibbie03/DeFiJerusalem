/**
 * One-shot script: enrich top 500 protocols from DeFiLlama per-protocol
 * endpoint, then re-score all protocols and auto-flag CRITICAL ones.
 *
 * Usage:  npx tsx server/scripts/run-enrich-rescore.ts
 */

import { enrichProtocols, batchRescore } from '../lib/protocol-enrichment';

async function main() {
  console.log('═══════════════════════════════════════════');
  console.log(' DFJ Protocol Enrichment + Batch Rescore  ');
  console.log('═══════════════════════════════════════════');

  console.log('\n[1/2] Enriching top 500 protocols from DeFiLlama…');
  const enrichResult = await enrichProtocols(500);
  console.log('  Enriched:', enrichResult.enriched);
  console.log('  Updated rows:', enrichResult.updated);
  console.log('  Errors:', enrichResult.errors);

  console.log('\n[2/2] Batch rescoring all protocols…');
  const scoreResult = await batchRescore();
  console.log('  Total protocols scored:', scoreResult.total);
  console.log('  SAFE   (≥80):', scoreResult.safe);
  console.log('  LOW    (≥65):', scoreResult.low);
  console.log('  MEDIUM (≥50):', scoreResult.medium);
  console.log('  HIGH   (≥30):', scoreResult.high);
  console.log('  CRITICAL(<30):', scoreResult.critical);
  console.log('  Auto-flagged:', scoreResult.flagged);

  console.log('\n✓ Done.');
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
