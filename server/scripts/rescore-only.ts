/**
 * Fast rescore: skips DeFiLlama enrichment, just recomputes DFJ v2.3 scores
 * for every protocol in the DB and writes them back to security_score.
 *
 * Usage: npx tsx server/scripts/rescore-only.ts
 */
import { batchRescore } from '../lib/protocol-enrichment';

async function main() {
  console.log('Re-scoring all protocols (no enrichment)…');
  const r = await batchRescore();
  console.log(`Done. ${r.total} protocols scored.`);
  console.log(`  SAFE=${r.safe}  LOW=${r.low}  MEDIUM=${r.medium}  HIGH=${r.high}  CRITICAL=${r.critical}`);
  console.log(`  Auto-flagged: ${r.flagged}`);
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
