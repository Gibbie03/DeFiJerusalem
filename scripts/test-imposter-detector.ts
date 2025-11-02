import { db } from '../server/db';
import { protocols, securityScans } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { WalletDrainerDetector } from '../server/lib/wallet-drainer-detector';
import { DatabaseStorage } from '../server/storage';

interface FalsePositive {
  protocolId: string;
  protocolName: string;
  reason: string;
  verificationScore: number;
  threats: Array<{ type: string; severity: string; message: string }>;
  tvl: number;
  audited: boolean;
  auditCount: number;
}

async function testImposterDetector() {
  console.log('🔍 Testing Imposter Detector on Current Blacklist...\n');

  const storage = new DatabaseStorage();
  const detector = new WalletDrainerDetector(storage);

  // Get all blacklisted protocols
  const blacklistedScans = await db
    .select()
    .from(securityScans)
    .where(eq(securityScans.isBlacklisted, true));

  console.log(`Found ${blacklistedScans.length} blacklisted protocols\n`);

  const falsePositives: FalsePositive[] = [];
  const legitimateBlacklists: string[] = [];

  for (const scan of blacklistedScans) {
    try {
      // Get protocol details
      const protocol = await db
        .select()
        .from(protocols)
        .where(eq(protocols.id, scan.protocolId))
        .limit(1);

      if (protocol.length === 0) {
        console.log(`⚠️  Protocol ${scan.protocolId} not found in database`);
        continue;
      }

      const dapp = protocol[0];

      // Check if this has IMPOSTER threat
      const imposterThreats = scan.threats.filter(t => t.type === 'IMPOSTER');
      
      if (imposterThreats.length === 0) {
        // Not an imposter threat, skip
        legitimateBlacklists.push(dapp.name);
        continue;
      }

      // Calculate verification score
      let verificationScore = 0;
      
      // Well-established protocol (age > 365 days)
      if (dapp.age && dapp.age > 365) {
        verificationScore += 50;
      } else if (dapp.age && dapp.age > 180) {
        verificationScore += 30;
      } else if (dapp.age && dapp.age > 90) {
        verificationScore += 15;
      }
      
      // High TVL indicates established protocol
      if (dapp.tvl && dapp.tvl > 100_000_000) {
        verificationScore += 40; // $100M+ TVL
      } else if (dapp.tvl && dapp.tvl > 10_000_000) {
        verificationScore += 25; // $10M+ TVL
      } else if (dapp.tvl && dapp.tvl > 1_000_000) {
        verificationScore += 10; // $1M+ TVL
      }
      
      // Social presence
      if (dapp.twitter) {
        verificationScore += 20;
      }
      
      // GitHub presence
      if (dapp.github) {
        verificationScore += 15;
      }
      
      // Audited protocols
      if (dapp.audited || (dapp.auditCount && dapp.auditCount > 0)) {
        verificationScore += 30;
      }

      // Determine if this is a false positive
      let isFalsePositive = false;
      let reason = '';

      // High verification score indicates legitimate protocol
      if (verificationScore >= 100) {
        isFalsePositive = true;
        reason = `High verification score (${verificationScore}/100+) - Strong legitimacy signals`;
      }
      // High TVL + Audits = likely legitimate integration, not imposter
      else if (dapp.tvl > 50_000_000 && dapp.audited && dapp.auditCount > 0) {
        isFalsePositive = true;
        reason = `High TVL ($${(dapp.tvl / 1_000_000).toFixed(1)}M) + Audited (${dapp.auditCount} audits) - Likely legitimate`;
      }
      // Very high TVL alone
      else if (dapp.tvl > 100_000_000) {
        isFalsePositive = true;
        reason = `Very high TVL ($${(dapp.tvl / 1_000_000).toFixed(1)}M) - Unlikely to be imposter`;
      }
      // Well-established + audited
      else if (dapp.age > 365 && dapp.audited) {
        isFalsePositive = true;
        reason = `Well-established (${Math.floor(dapp.age / 365)} years) + Audited - Likely legitimate`;
      }

      if (isFalsePositive) {
        falsePositives.push({
          protocolId: dapp.id,
          protocolName: dapp.name,
          reason,
          verificationScore,
          threats: imposterThreats,
          tvl: dapp.tvl,
          audited: dapp.audited,
          auditCount: dapp.auditCount || 0,
        });

        console.log(`❌ FALSE POSITIVE: ${dapp.name}`);
        console.log(`   ID: ${dapp.id}`);
        console.log(`   Reason: ${reason}`);
        console.log(`   Verification Score: ${verificationScore}`);
        console.log(`   TVL: $${(dapp.tvl / 1_000_000).toFixed(2)}M`);
        console.log(`   Audited: ${dapp.audited} (${dapp.auditCount || 0} audits)`);
        console.log(`   Threats: ${imposterThreats.map(t => t.message).join(', ')}`);
        console.log('');
      } else {
        legitimateBlacklists.push(dapp.name);
        console.log(`✅ LEGITIMATE BLACKLIST: ${dapp.name}`);
        console.log(`   Verification Score: ${verificationScore} (threshold: 100)`);
        console.log(`   TVL: $${(dapp.tvl / 1_000_000).toFixed(2)}M`);
        console.log('');
      }

    } catch (error) {
      console.error(`Error processing ${scan.protocolId}:`, error);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total Blacklisted: ${blacklistedScans.length}`);
  console.log(`False Positives Found: ${falsePositives.length}`);
  console.log(`Legitimate Blacklists: ${legitimateBlacklists.length}`);
  console.log('');

  if (falsePositives.length > 0) {
    console.log('❌ FALSE POSITIVES TO REMOVE:');
    console.log('─'.repeat(80));
    falsePositives.forEach((fp, index) => {
      console.log(`${index + 1}. ${fp.protocolName} (${fp.protocolId})`);
      console.log(`   ${fp.reason}`);
      console.log(`   TVL: $${(fp.tvl / 1_000_000).toFixed(2)}M | Audits: ${fp.auditCount} | Score: ${fp.verificationScore}`);
    });
    console.log('');
  }

  return falsePositives;
}

// Run the test
testImposterDetector()
  .then((falsePositives) => {
    if (falsePositives.length > 0) {
      console.log(`\n✨ Ready to remove ${falsePositives.length} false positives from blacklist`);
      console.log('Run the cleanup script to remove them.');
    } else {
      console.log('\n✅ No false positives found! All blacklisted protocols are legitimate threats.');
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
