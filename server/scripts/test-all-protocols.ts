/**
 * Test script: scan all protocols using UnifiedSecurityScanner
 * Run with: npx tsx server/scripts/test-all-protocols.ts
 */

import { db } from '../db';
import { protocols, securityScans } from '@shared/schema';
import { UnifiedSecurityScanner } from '../lib/unified-security-scanner';
import { storage } from '../storage';
import { eq } from 'drizzle-orm';

interface TestResults {
  totalProtocols: number;
  scannedProtocols: number;
  criticalThreats: number;
  highThreats: number;
  mediumThreats: number;
  lowThreats: number;
  safeProtocols: number;
  topThreats: Array<{
    name: string;
    score: number;
    severity: string;
    threatTypes: string[];
  }>;
  scanErrors: number;
}

async function testAllProtocols() {
  console.log('🔍 Starting comprehensive protocol security scan...\n');

  const scanner = new UnifiedSecurityScanner(storage);
  const results: TestResults = {
    totalProtocols: 0,
    scannedProtocols: 0,
    criticalThreats: 0,
    highThreats: 0,
    mediumThreats: 0,
    lowThreats: 0,
    safeProtocols: 0,
    topThreats: [],
    scanErrors: 0,
  };

  try {
    const allProtocols = await db.select().from(protocols);
    results.totalProtocols = allProtocols.length;

    console.log(`📊 Total protocols to scan: ${results.totalProtocols}`);
    console.log('⏳ Scanning in progress...\n');

    const startTime = Date.now();

    const batchSize = 50;
    for (let i = 0; i < allProtocols.length; i += batchSize) {
      const batch = allProtocols.slice(i, i + batchSize);

      await Promise.all(batch.map(async (protocol) => {
        try {
          const scanResult = await scanner.scanProtocol(protocol as any);
          results.scannedProtocols++;

          switch (scanResult.severity) {
            case 'CRITICAL': results.criticalThreats++; break;
            case 'HIGH':     results.highThreats++;     break;
            case 'MEDIUM':   results.mediumThreats++;   break;
            case 'LOW':      results.lowThreats++;      break;
            case 'SAFE':     results.safeProtocols++;   break;
          }

          // DFJ v2.3: lower score = more dangerous (flag anything below 40)
          if (scanResult.score <= 40) {
            results.topThreats.push({
              name: protocol.name,
              score: scanResult.score,
              severity: scanResult.severity,
              threatTypes: scanResult.threats.map(t => t.type),
            });
          }
        } catch (error) {
          results.scanErrors++;
          console.error(`Error scanning ${protocol.name}:`, error);
        }
      }));

      if (i % 500 === 0 && i > 0) {
        console.log(`  Progress: ${i}/${results.totalProtocols}`);
      }
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    results.topThreats.sort((a, b) => b.score - a.score);
    results.topThreats = results.topThreats.slice(0, 20);

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📊 SCAN RESULTS');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`🔴 CRITICAL: ${results.criticalThreats}`);
    console.log(`🟠 HIGH:     ${results.highThreats}`);
    console.log(`🟡 MEDIUM:   ${results.mediumThreats}`);
    console.log(`🟢 LOW:      ${results.lowThreats}`);
    console.log(`✅ SAFE:     ${results.safeProtocols}`);
    console.log(`❌ ERRORS:   ${results.scanErrors}`);
    console.log(`⏱  Duration: ${elapsed}s`);

    if (results.topThreats.length > 0) {
      console.log('\n─────────────────────────────────────────────────────────────');
      console.log('🔝 TOP RISK PROTOCOLS');
      console.log('─────────────────────────────────────────────────────────────');
      results.topThreats.forEach((t, i) => {
        const icon = t.severity === 'CRITICAL' ? '🔴' : t.severity === 'HIGH' ? '🟠' : '🟡';
        console.log(`${i + 1}. ${icon} ${t.name} — score: ${t.score} — ${t.threatTypes.join(', ')}`);
      });
    }

    console.log('\n✅ Scan complete!');
  } catch (error) {
    console.error('❌ Fatal error during scan:', error);
    throw error;
  }
}

testAllProtocols()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
