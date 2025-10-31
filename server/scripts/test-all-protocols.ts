import { db } from '../db';
import { protocols, securityScans } from '@shared/schema';
import { WalletDrainerDetector } from '../lib/wallet-drainer-detector';
import { eq } from 'drizzle-orm';

interface TestResults {
  totalProtocols: number;
  scannedProtocols: number;
  criticalThreats: number;
  highThreats: number;
  mediumThreats: number;
  lowThreats: number;
  safeProtocols: number;
  drainerDetections: {
    namedDrainers: number;
    permitExploits: number;
    approvalPhishing: number;
    create2Evasion: number;
    solanaDrainers: number;
    drainerInfrastructure: number;
    dormantApprovals: number;
    drainerPricing: number;
  };
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
  
  const detector = new WalletDrainerDetector();
  const results: TestResults = {
    totalProtocols: 0,
    scannedProtocols: 0,
    criticalThreats: 0,
    highThreats: 0,
    mediumThreats: 0,
    lowThreats: 0,
    safeProtocols: 0,
    drainerDetections: {
      namedDrainers: 0,
      permitExploits: 0,
      approvalPhishing: 0,
      create2Evasion: 0,
      solanaDrainers: 0,
      drainerInfrastructure: 0,
      dormantApprovals: 0,
      drainerPricing: 0,
    },
    topThreats: [],
    scanErrors: 0,
  };

  try {
    // Fetch all protocols
    const allProtocols = await db.select().from(protocols);
    results.totalProtocols = allProtocols.length;
    
    console.log(`📊 Total protocols to scan: ${results.totalProtocols}`);
    console.log('⏳ Scanning in progress...\n');

    const startTime = Date.now();
    let processedCount = 0;

    // Process in batches to avoid memory issues
    const batchSize = 100;
    for (let i = 0; i < allProtocols.length; i += batchSize) {
      const batch = allProtocols.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (protocol) => {
        try {
          const scanResult = await detector.scanDApp({
            id: protocol.id,
            name: protocol.name,
            description: protocol.description || '',
            chains: protocol.chains || [],
            tvl: protocol.tvl || 0,
            logo: protocol.logo || '',
            url: '', // URL not stored in schema
            category: protocol.category || 'DeFi',
          });

          results.scannedProtocols++;

          // Count by severity
          switch (scanResult.severity) {
            case 'CRITICAL':
              results.criticalThreats++;
              break;
            case 'HIGH':
              results.highThreats++;
              break;
            case 'MEDIUM':
              results.mediumThreats++;
              break;
            case 'LOW':
              results.lowThreats++;
              break;
            case 'SAFE':
              results.safeProtocols++;
              break;
          }

          // Count 2025 drainer detections
          scanResult.threats.forEach((threat) => {
            switch (threat.type) {
              case 'NAMED_DRAINER_OPERATION':
                results.drainerDetections.namedDrainers++;
                break;
              case 'PERMIT_SIGNATURE_EXPLOIT':
                results.drainerDetections.permitExploits++;
                break;
              case 'APPROVAL_PHISHING':
                results.drainerDetections.approvalPhishing++;
                break;
              case 'CREATE2_EVASION':
                results.drainerDetections.create2Evasion++;
                break;
              case 'SOLANA_DRAINER':
                results.drainerDetections.solanaDrainers++;
                break;
              case 'DRAINER_FINGERPRINT':
                results.drainerDetections.drainerInfrastructure++;
                break;
              case 'DORMANT_APPROVAL_RISK':
                results.drainerDetections.dormantApprovals++;
                break;
              case 'DRAINER_PRICING_MODEL':
                results.drainerDetections.drainerPricing++;
                break;
            }
          });

          // Track top threats
          if (scanResult.score >= 60) {
            results.topThreats.push({
              name: protocol.name,
              score: scanResult.score,
              severity: scanResult.severity,
              threatTypes: scanResult.threats.map((t) => t.type),
            });
          }

          // Save to database
          await db.insert(securityScans).values({
            protocolId: protocol.id,
            score: scanResult.score,
            severity: scanResult.severity,
            threats: scanResult.threats,
            scannedAt: new Date(),
          }).onConflictDoUpdate({
            target: securityScans.protocolId,
            set: {
              score: scanResult.score,
              severity: scanResult.severity,
              threats: scanResult.threats,
              scannedAt: new Date(),
            },
          });

        } catch (error) {
          results.scanErrors++;
          console.error(`❌ Error scanning ${protocol.name}:`, error);
        }
      }));

      processedCount += batch.length;
      const progress = ((processedCount / results.totalProtocols) * 100).toFixed(1);
      process.stdout.write(`\r⏳ Progress: ${processedCount}/${results.totalProtocols} (${progress}%)`);
    }

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    // Sort top threats by score
    results.topThreats.sort((a, b) => b.score - a.score);
    results.topThreats = results.topThreats.slice(0, 20); // Keep top 20

    // Print results
    console.log('\n\n═══════════════════════════════════════════════════════════════');
    console.log('📊 COMPREHENSIVE PROTOCOL SECURITY SCAN RESULTS');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log(`⏱️  Scan Duration: ${duration}s`);
    console.log(`📈 Total Protocols: ${results.totalProtocols}`);
    console.log(`✅ Successfully Scanned: ${results.scannedProtocols}`);
    console.log(`❌ Scan Errors: ${results.scanErrors}\n`);

    console.log('─────────────────────────────────────────────────────────────');
    console.log('🔒 SEVERITY BREAKDOWN');
    console.log('─────────────────────────────────────────────────────────────');
    console.log(`🔴 CRITICAL: ${results.criticalThreats} (${((results.criticalThreats / results.scannedProtocols) * 100).toFixed(2)}%)`);
    console.log(`🟠 HIGH:     ${results.highThreats} (${((results.highThreats / results.scannedProtocols) * 100).toFixed(2)}%)`);
    console.log(`🟡 MEDIUM:   ${results.mediumThreats} (${((results.mediumThreats / results.scannedProtocols) * 100).toFixed(2)}%)`);
    console.log(`🟢 LOW:      ${results.lowThreats} (${((results.lowThreats / results.scannedProtocols) * 100).toFixed(2)}%)`);
    console.log(`✅ SAFE:     ${results.safeProtocols} (${((results.safeProtocols / results.scannedProtocols) * 100).toFixed(2)}%)\n`);

    console.log('─────────────────────────────────────────────────────────────');
    console.log('🚨 2025 ADVANCED DRAINER DETECTIONS');
    console.log('─────────────────────────────────────────────────────────────');
    console.log(`💀 Named Drainer Operations:     ${results.drainerDetections.namedDrainers}`);
    console.log(`📝 EIP-2612 Permit Exploits:     ${results.drainerDetections.permitExploits}`);
    console.log(`⚠️  Approval Phishing:            ${results.drainerDetections.approvalPhishing}`);
    console.log(`🔄 CREATE2 Evasion:              ${results.drainerDetections.create2Evasion}`);
    console.log(`🌐 Solana Drainers:              ${results.drainerDetections.solanaDrainers}`);
    console.log(`🏗️  Drainer Infrastructure:       ${results.drainerDetections.drainerInfrastructure}`);
    console.log(`⏱️  Dormant Approval Attacks:     ${results.drainerDetections.dormantApprovals}`);
    console.log(`💰 Drainer-as-a-Service (DaaS):  ${results.drainerDetections.drainerPricing}\n`);

    const totalDrainerDetections = Object.values(results.drainerDetections).reduce((a, b) => a + b, 0);
    console.log(`📊 Total 2025 Drainer Detections: ${totalDrainerDetections}\n`);

    if (results.topThreats.length > 0) {
      console.log('─────────────────────────────────────────────────────────────');
      console.log('🔝 TOP 20 HIGHEST RISK PROTOCOLS');
      console.log('─────────────────────────────────────────────────────────────');
      results.topThreats.forEach((threat, index) => {
        const severityIcon = threat.severity === 'CRITICAL' ? '🔴' : threat.severity === 'HIGH' ? '🟠' : '🟡';
        console.log(`${index + 1}. ${severityIcon} ${threat.name}`);
        console.log(`   Score: ${threat.score} | Severity: ${threat.severity}`);
        console.log(`   Threats: ${threat.threatTypes.join(', ')}\n`);
      });
    }

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ Scan complete! Results saved to database.');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Fatal error during scan:', error);
    throw error;
  }
}

// Run the test
testAllProtocols()
  .then(() => {
    console.log('✅ Test script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test script failed:', error);
    process.exit(1);
  });
