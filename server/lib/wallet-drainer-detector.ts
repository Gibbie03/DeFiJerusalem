import type { Protocol, SecurityScan, Threat } from '@shared/schema';

// Known scam patterns and drainer domains
const SCAM_PATTERNS = {
  // Common wallet drainer keywords
  drainerKeywords: ['drain', 'claimer', 'airdrop-claim', 'token-claim', 'reward-claim', 'nft-mint-free'],
  
  // Suspicious domain patterns (typosquatting)
  typosquatPatterns: [
    /unisvvap/i, /uniswa[pr]/i, /unlswap/i, // Uniswap imposters
    /aa[vw]e/i, /aav[ve]/i, // Aave imposters
    /pancak[es]wap/i, /pancakesvvap/i, // PancakeSwap imposters
    /metam[ao]sk/i, /metamasc/i, // MetaMask imposters
    /sushi[sw]ap/i, /sushisvvap/i, // Sushiswap imposters
  ],
  
  // Known scam protocol names
  knownScams: [
    'fake airdrop', 'free tokens', 'claim rewards', 'double your crypto',
    'guaranteed returns', '100x gem', 'elon giveaway', 'vitalik giveaway'
  ],
  
  // Honeypot indicators
  honeypotPatterns: [
    /honeypot/i, /liquidity\s*locked/i, /can't\s*sell/i, /anti\s*dump/i
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
