import type { Protocol, SecurityScan, Threat } from '@shared/schema';

// Known scam patterns and drainer domains
const SCAM_PATTERNS = {
  // ===== WALLET-SPECIFIC THREATS =====
  
  // Common wallet drainer keywords
  drainerKeywords: [
    'drain', 'claimer', 'airdrop-claim', 'token-claim', 'reward-claim', 
    'nft-mint-free', 'approve-all', 'setapprovalforall', 'unlimited-approval'
  ],
  
  // Phishing and fake website indicators
  phishingPatterns: [
    /connect.*wallet.*urgent/i,
    /verify.*wallet.*now/i,
    /wallet.*compromised/i,
    /security.*alert.*immediate/i,
    /confirm.*transaction.*asap/i,
    /wallet.*suspended/i,
    /restore.*access/i
  ],
  
  // Social engineering / fake support scams
  socialEngineeringPatterns: [
    /official.*support/i,
    /customer.*service.*dm/i,
    /support.*team.*here/i,
    /help.*recover.*funds/i,
    /validation.*required/i,
    /kyc.*verification/i,
    /account.*freeze/i,
    /won.*prize.*claim/i
  ],
  
  // Private key / seed phrase phishing
  privateKeyPhishingPatterns: [
    /enter.*seed.*phrase/i,
    /provide.*private.*key/i,
    /input.*recovery.*phrase/i,
    /wallet.*backup.*required/i,
    /12.*word.*phrase/i,
    /24.*word.*phrase/i,
    /mnemonic.*verification/i
  ],
  
  // Romance scam / investment scam indicators
  romanceScamPatterns: [
    /investment.*opportunity.*exclusive/i,
    /guaranteed.*profit.*join/i,
    /insider.*trading.*info/i,
    /trading.*group.*vip/i,
    /mentor.*crypto.*wealth/i
  ],
  
  // ===== PROTOCOL-SPECIFIC THREATS =====
  
  // Suspicious domain patterns (typosquatting)
  typosquatPatterns: [
    /unisvvap/i, /uniswa[pr]/i, /unlswap/i, /uni5wap/i, // Uniswap imposters
    /aa[vw]e/i, /aav[ve]/i, /a4ve/i, // Aave imposters
    /pancak[es]wap/i, /pancakesvvap/i, /p4ncake/i, // PancakeSwap imposters
    /metam[ao]sk/i, /metamasc/i, /met4mask/i, // MetaMask imposters
    /sushi[sw]ap/i, /sushisvvap/i, /5ushi/i, // Sushiswap imposters
    /curv[e3]/i, /curv3/i, // Curve imposters
    /compound/i, /c0mpound/i, // Compound imposters
    /maker[da]o/i, /mak3r/i, // MakerDAO imposters
  ],
  
  // Known scam protocol names
  knownScams: [
    'fake airdrop', 'free tokens', 'claim rewards', 'double your crypto',
    'guaranteed returns', '100x gem', 'elon giveaway', 'vitalik giveaway',
    'safemoon', 'moon', 'safe', 'shiba', 'doge', 'cumrocket', // High-risk meme patterns
    'pump', 'moon shot', 'to the moon', '1000x guaranteed'
  ],
  
  // Honeypot indicators
  honeypotPatterns: [
    /honeypot/i, /liquidity\s*locked/i, /can't\s*sell/i, /anti\s*dump/i,
    /sell.*disabled/i, /anti.*bot/i, /max.*sell/i
  ],
  
  // Rug pull indicators
  rugPullPatterns: [
    /liquidity.*migration/i,
    /emergency.*withdraw/i,
    /owner.*can.*mint/i,
    /unlimited.*minting/i,
    /centralized.*control/i,
    /admin.*privileges/i,
    /pause.*transfers/i
  ],
  
  // Exit scam / disappearing team patterns
  exitScamPatterns: [
    /final.*sale/i,
    /last.*chance/i,
    /closing.*soon/i,
    /limited.*time.*only/i,
    /presale.*ending/i,
    /hurry.*slots.*filling/i
  ],
  
  // Fake audit claims
  fakeAuditPatterns: [
    /self.*audited/i,
    /audit.*pending/i,
    /community.*audited/i,
    /safu.*certified/i, // Fake SAFU claims
    /audit.*by.*team/i
  ],
  
  // Suspicious tokenomics
  suspiciousTokenomicsPatterns: [
    /\d+%.*team.*tokens/i,
    /\d+%.*dev.*wallet/i,
    /massive.*burn/i,
    /deflationary.*100x/i,
    /reflections.*guaranteed/i
  ],
  
  // Flash loan / re-entrancy vulnerability indicators
  vulnerabilityPatterns: [
    /flash.*loan.*vulnerable/i,
    /re.*entr[ay]ncy/i,
    /unchecked.*call/i,
    /delegatecall/i,
    /selfdestruct/i
  ]
};

// WalletDrainerDetector - Security scanning engine
export class WalletDrainerDetector {
  async scanDApp(dapp: Protocol): Promise<SecurityScan> {
    const results: SecurityScan = {
      isBlacklisted: false,
      severity: 'LOW',
      threats: [],
      score: 0,
    };

    try {
      const nameAndDesc = `${dapp.name} ${dapp.description || ''}`.toLowerCase();
      const website = (dapp.website || '').toLowerCase();

      // CRITICAL: Check for known scam patterns
      for (const keyword of SCAM_PATTERNS.drainerKeywords) {
        if (nameAndDesc.includes(keyword) || website.includes(keyword)) {
          results.threats.push({
            type: 'SCAM_PATTERN',
            severity: 'CRITICAL',
            message: `Potential wallet drainer detected - contains suspicious keyword: "${keyword}"`,
          });
          results.score += 100; // Instant blacklist
          break;
        }
      }

      // CRITICAL: Check for typosquatting/imposter protocols
      for (const pattern of SCAM_PATTERNS.typosquatPatterns) {
        if (pattern.test(nameAndDesc) || pattern.test(website)) {
          results.threats.push({
            type: 'IMPOSTER',
            severity: 'CRITICAL',
            message: 'Potential imposter protocol - name resembles popular DeFi protocol',
          });
          results.score += 90;
          break;
        }
      }

      // CRITICAL: Check for known scam phrases
      for (const scam of SCAM_PATTERNS.knownScams) {
        if (nameAndDesc.includes(scam)) {
          results.threats.push({
            type: 'KNOWN_SCAM',
            severity: 'CRITICAL',
            message: `Known scam pattern detected: "${scam}"`,
          });
          results.score += 95;
          break;
        }
      }

      // CRITICAL: Check for phishing patterns
      for (const pattern of SCAM_PATTERNS.phishingPatterns) {
        if (pattern.test(nameAndDesc)) {
          results.threats.push({
            type: 'PHISHING',
            severity: 'CRITICAL',
            message: 'Phishing attack detected - website uses urgent language to trick users',
          });
          results.score += 95;
          break;
        }
      }

      // CRITICAL: Check for private key phishing
      for (const pattern of SCAM_PATTERNS.privateKeyPhishingPatterns) {
        if (pattern.test(nameAndDesc)) {
          results.threats.push({
            type: 'PRIVATE_KEY_PHISHING',
            severity: 'CRITICAL',
            message: 'DANGER: Site asks for seed phrase or private keys - NEVER share these!',
          });
          results.score += 100;
          break;
        }
      }

      // CRITICAL: Check for social engineering / fake support
      for (const pattern of SCAM_PATTERNS.socialEngineeringPatterns) {
        if (pattern.test(nameAndDesc)) {
          results.threats.push({
            type: 'SOCIAL_ENGINEERING',
            severity: 'CRITICAL',
            message: 'Social engineering scam detected - impersonating support team',
          });
          results.score += 90;
          break;
        }
      }

      // CRITICAL: Check for rug pull indicators
      for (const pattern of SCAM_PATTERNS.rugPullPatterns) {
        if (pattern.test(nameAndDesc)) {
          results.threats.push({
            type: 'RUG_PULL_RISK',
            severity: 'CRITICAL',
            message: 'Rug pull risk - protocol has centralized control mechanisms',
          });
          results.score += 85;
          break;
        }
      }

      // HIGH: Check for romance/investment scam patterns
      for (const pattern of SCAM_PATTERNS.romanceScamPatterns) {
        if (pattern.test(nameAndDesc)) {
          results.threats.push({
            type: 'INVESTMENT_SCAM',
            severity: 'HIGH',
            message: 'Investment scam pattern detected - exclusive opportunity claims',
          });
          results.score += 75;
          break;
        }
      }

      // HIGH: Check for exit scam indicators
      for (const pattern of SCAM_PATTERNS.exitScamPatterns) {
        if (pattern.test(nameAndDesc)) {
          results.threats.push({
            type: 'EXIT_SCAM_RISK',
            severity: 'HIGH',
            message: 'Exit scam warning - urgency tactics to pressure quick decisions',
          });
          results.score += 65;
          break;
        }
      }

      // HIGH: Check for fake audit claims
      for (const pattern of SCAM_PATTERNS.fakeAuditPatterns) {
        if (pattern.test(nameAndDesc) && dapp.audited) {
          results.threats.push({
            type: 'FAKE_AUDIT',
            severity: 'HIGH',
            message: 'Suspicious audit claim - mentions self-audit or unverified certification',
          });
          results.score += 60;
          break;
        }
      }

      // MEDIUM: Check for suspicious tokenomics
      for (const pattern of SCAM_PATTERNS.suspiciousTokenomicsPatterns) {
        if (pattern.test(nameAndDesc)) {
          results.threats.push({
            type: 'SUSPICIOUS_TOKENOMICS',
            severity: 'MEDIUM',
            message: 'Suspicious tokenomics - high team allocation or unrealistic claims',
          });
          results.score += 45;
          break;
        }
      }

      // MEDIUM: Check for smart contract vulnerabilities
      for (const pattern of SCAM_PATTERNS.vulnerabilityPatterns) {
        if (pattern.test(nameAndDesc)) {
          results.threats.push({
            type: 'VULNERABILITY_RISK',
            severity: 'MEDIUM',
            message: 'Potential contract vulnerability mentioned - flash loan or re-entrancy risk',
          });
          results.score += 50;
          break;
        }
      }

      // CRITICAL: Check for honeypot indicators
      for (const pattern of SCAM_PATTERNS.honeypotPatterns) {
        if (pattern.test(nameAndDesc)) {
          results.threats.push({
            type: 'HONEYPOT',
            severity: 'CRITICAL',
            message: 'Potential honeypot token detected',
          });
          results.score += 85;
          break;
        }
      }

      // HIGH: Check if contract is less than 7 days old
      if (dapp.age !== null && dapp.age !== undefined && dapp.age < 7) {
        results.threats.push({
          type: 'NEW_CONTRACT',
          severity: 'HIGH',
          message: 'Contract less than 7 days old - HIGH RISK',
        });
        results.score += 40;
      }

      // HIGH: Check if no audit exists
      if (!dapp.audited) {
        results.threats.push({
          type: 'NO_AUDIT',
          severity: 'HIGH',
          message: 'No security audit found',
        });
        results.score += 30;
      }

      // HIGH: Check if team is anonymous
      if (!dapp.twitter && !dapp.github) {
        results.threats.push({
          type: 'ANONYMOUS_TEAM',
          severity: 'HIGH',
          message: 'Team is anonymous - no social presence',
        });
        results.score += 25;
      }

      // MEDIUM: Check for low liquidity
      if (dapp.tvl !== null && dapp.tvl !== undefined && dapp.tvl < 50000) {
        results.threats.push({
          type: 'LOW_LIQUIDITY',
          severity: 'MEDIUM',
          message: 'Very low liquidity (< $50k)',
        });
        results.score += 20;
      }

      // MEDIUM: Suspicious - very high promised returns in description
      if (/\d{2,4}%|\d+x\s*returns?|guaranteed\s*profit/i.test(nameAndDesc)) {
        results.threats.push({
          type: 'SUSPICIOUS_RETURNS',
          severity: 'MEDIUM',
          message: 'Advertises unrealistic returns - potential scam',
        });
        results.score += 30;
      }

      // Determine overall severity based on score
      if (results.score >= 80) results.severity = 'CRITICAL';
      else if (results.score >= 50) results.severity = 'HIGH';
      else if (results.score >= 25) results.severity = 'MEDIUM';

      results.isBlacklisted = results.severity === 'CRITICAL';
      return results;
    } catch (error) {
      console.error('Error scanning dApp:', error);
      return results;
    }
  }
}
