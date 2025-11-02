import { db } from '../server/db';
import { protocols, securityScans } from '../shared/schema';
import { eq, and, or, not, isNull } from 'drizzle-orm';

async function testLegitimateProtocols() {
  console.log('🔍 Testing Legitimate Protocols for False Positive Flagging...\n');

  // Get all protocols that are NOT blacklisted
  const allProtocols = await db
    .select()
    .from(protocols);

  console.log(`Total protocols in database: ${allProtocols.length}`);

  // Get all security scans
  const allScans = await db
    .select()
    .from(securityScans);

  console.log(`Total security scans: ${allScans.length}\n`);

  // Filter for high-value legitimate protocols that might get falsely flagged
  const legitimateProtocols = allProtocols.filter(p => {
    // High TVL
    const highTVL = p.tvl > 10_000_000;
    // Audited
    const audited = p.audited && (p.auditCount || 0) > 0;
    // Established (older than 90 days)
    const established = p.age && p.age > 90;
    // Has social presence
    const socialPresence = p.twitter || p.github;

    // At least 2 of these criteria
    const criteriaCount = [highTVL, audited, established, socialPresence].filter(Boolean).length;
    return criteriaCount >= 2;
  });

  console.log(`Legitimate protocols (high-value, established): ${legitimateProtocols.length}\n`);

  // Check which legitimate protocols have IMPOSTER threats
  let falsePositives = 0;
  const flaggedLegit: any[] = [];

  for (const protocol of legitimateProtocols) {
    const scan = allScans.find(s => s.protocolId === protocol.id);
    
    if (scan && scan.isBlacklisted) {
      // Check if it has IMPOSTER threat
      const imposterThreats = scan.threats.filter(t => t.type === 'IMPOSTER');
      
      if (imposterThreats.length > 0) {
        falsePositives++;
        flaggedLegit.push({
          name: protocol.name,
          id: protocol.id,
          tvl: protocol.tvl,
          audited: protocol.audited,
          auditCount: protocol.auditCount || 0,
          age: protocol.age,
          threats: imposterThreats,
          score: scan.score,
        });

        console.log(`❌ POTENTIAL FALSE POSITIVE: ${protocol.name}`);
        console.log(`   ID: ${protocol.id}`);
        console.log(`   TVL: $${(protocol.tvl / 1_000_000).toFixed(2)}M`);
        console.log(`   Audited: ${protocol.audited} (${protocol.auditCount || 0} audits)`);
        console.log(`   Age: ${protocol.age ? Math.floor(protocol.age / 365) + ' years' : 'Unknown'}`);
        console.log(`   Risk Score: ${scan.score}`);
        console.log(`   Threats: ${imposterThreats.map(t => t.message).join(', ')}`);
        console.log('');
      }
    }
  }

  // Also check for protocols with IMPOSTER threats that are NOT blacklisted
  const imposterButNotBlacklisted: any[] = [];
  for (const scan of allScans) {
    if (!scan.isBlacklisted) {
      const imposterThreats = scan.threats.filter(t => t.type === 'IMPOSTER');
      if (imposterThreats.length > 0) {
        const protocol = allProtocols.find(p => p.id === scan.protocolId);
        if (protocol) {
          imposterButNotBlacklisted.push({
            name: protocol.name,
            id: protocol.id,
            tvl: protocol.tvl,
            score: scan.score,
            severity: scan.severity,
            threats: imposterThreats,
          });

          console.log(`⚠️  IMPOSTER THREAT (NOT BLACKLISTED): ${protocol.name}`);
          console.log(`   ID: ${protocol.id}`);
          console.log(`   TVL: $${(protocol.tvl / 1_000_000).toFixed(2)}M`);
          console.log(`   Risk Score: ${scan.score}`);
          console.log(`   Severity: ${scan.severity}`);
          console.log(`   Threats: ${imposterThreats.map(t => t.message).join(', ')}`);
          console.log('');
        }
      }
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('COMPREHENSIVE IMPOSTER DETECTOR ANALYSIS');
  console.log('='.repeat(80));
  console.log(`Total Protocols: ${allProtocols.length}`);
  console.log(`Legitimate Protocols (high-value): ${legitimateProtocols.length}`);
  console.log(`Blacklisted Protocols: ${allScans.filter(s => s.isBlacklisted).length}`);
  console.log('');
  console.log(`False Positives (Legitimate protocols blacklisted for IMPOSTER): ${falsePositives}`);
  console.log(`IMPOSTER Threats NOT Blacklisted: ${imposterButNotBlacklisted.length}`);
  console.log('');

  if (falsePositives === 0 && imposterButNotBlacklisted.length === 0) {
    console.log('✅ PERFECT! No false positives found.');
    console.log('   - No legitimate protocols are blacklisted as imposters');
    console.log('   - All IMPOSTER threats are properly handled');
  } else {
    if (falsePositives > 0) {
      console.log(`❌ Found ${falsePositives} legitimate protocols incorrectly blacklisted as imposters`);
    }
    if (imposterButNotBlacklisted.length > 0) {
      console.log(`⚠️  Found ${imposterButNotBlacklisted.length} protocols with IMPOSTER threats that are NOT blacklisted`);
      console.log('   (This may be intentional if their risk scores are below the blacklist threshold)');
    }
  }

  return { falsePositives, imposterButNotBlacklisted, flaggedLegit };
}

// Run the test
testLegitimateProtocols()
  .then(({ falsePositives, imposterButNotBlacklisted }) => {
    console.log('\n✨ Test Complete!');
    if (falsePositives === 0) {
      console.log('✅ Imposter detector is working correctly - no false positives');
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
