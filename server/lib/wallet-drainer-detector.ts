import type { Protocol, SecurityScan, Threat } from '@shared/schema';

// Whitelist of well-established, verified protocols
const VERIFIED_PROTOCOLS = new Set([
  // Major CEXs (Centralized Exchanges)
  'binance', 'binance cex', 'coinbase', 'kraken', 'nexo', 'celsius',
  'mexc', 'mexc global', 'bybit', 'okx', 'okex', 'bitget', 'gate.io', 'gate', 
  'kucoin', 'huobi', 'crypto.com', 'bitfinex', 'gemini', 'bitstamp',
  
  // Major DEXs
  'uniswap', 'uniswap v2', 'uniswap v3', 'uniswap v4',
  'pancakeswap', 'pancakeswap amm', 'pancakeswap amm v2', 'pancakeswap amm v3',
  'sushiswap', 'sushiswap v2', 'sushiswap v3',
  'curve', 'curve dex', 'curve finance', 'curve.fi',
  'balancer', 'balancer v2', 'balancer v3',
  'dydx', 'quickswap', 'quickswap dex', 'spookyswap', 'trader joe', 'velodrome', '1inch', '1inch network',
  
  // Lending platforms
  'aave', 'aave v2', 'aave v3', 'aave arc',
  'compound', 'compound v2', 'compound v3', 'compound finance',
  'maker', 'makerdao', 'venus', 'benqi', 'radiant', 'radiant capital',
  
  // Bridges
  'stargate', 'stargate finance', 'synapse', 'synapse protocol', 'hop protocol', 'across', 'across protocol', 'celer', 'celer network',
  
  // Liquid Staking
  'lido', 'lido finance', 'rocket pool', 'frax', 'frax finance', 'ankr', 'stader',
  
  // Layer 2s / Chains
  'arbitrum', 'optimism', 'polygon', 'base', 'avalanche', 'bnb chain', 'zksync',
  
  // Other established protocols
  'gmx', 'yearn', 'yearn finance', 'convex', 'convex finance', 'olympus', 'olympus dao', 'platypus', 'platypus finance', 'joe'
]);

// Trusted domain patterns for verification
const TRUSTED_DOMAINS = [
  'uniswap.org', 'app.uniswap.org',
  'pancakeswap.finance',
  'curve.fi',
  'aave.com',
  'compound.finance',
  'makerdao.com',
  'sushi.com',
  'balancer.fi'
];

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
  
  // Known scam protocol name patterns (using word boundaries for context-aware matching)
  knownScamPatterns: [
    // Giveaway scams (exact phrases only)
    /\belon\s+giveaway\b/i,
    /\bvitalik\s+giveaway\b/i,
    /\bfree\s+eth\s+airdrop\b/i,
    /\bdouble\s+your\s+crypto\b/i,
    /\bfake\s+airdrop\b/i,
    
    // Guaranteed returns scams (full phrases)
    /\bguaranteed\s+returns\b/i,
    /\b100x\s+guaranteed\b/i,
    /\b1000x\s+guaranteed\b/i,
    /\bget\s+rich\s+quick\b/i,
    
    // Obvious scam phrases
    /\bclaim\s+free\s+tokens\b/i,
    /\binstant\s+profit\b/i,
    /\bno\s+risk\s+profit\b/i,
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
  ],
  
  // ===== NEW ADVANCED THREATS =====
  
  // Backdoor function patterns (dangerous admin functions)
  backdoorFunctionPatterns: [
    /withdrawAll/i,
    /rescueTokens/i,
    /sweepFunds/i,
    /emergencyWithdraw/i,
    /adminWithdraw/i,
    /ownerWithdraw/i,
    /claimTokens/i,
    /drainContract/i,
    /transferOwnership.*bypass/i,
    /hidden.*withdrawal/i
  ],
  
  // Flash loan governance attack patterns
  flashLoanGovernancePatterns: [
    /instant.*voting/i,
    /flash.*loan.*governance/i,
    /borrow.*vote/i,
    /no.*vote.*delay/i,
    /same.*block.*vote/i,
    /governance.*exploit/i
  ],
  
  // Ponzi/pyramid scheme patterns
  ponziTokenomicsPatterns: [
    /referral.*bonus/i,
    /recruit.*earn/i,
    /multi.*level.*marketing/i,
    /mlm.*rewards/i,
    /downline.*commission/i,
    /pyramid.*structure/i,
    /tier.*system.*recruit/i,
    /invite.*3.*friends/i,
    /passive.*income.*referral/i,
    /matrix.*plan/i
  ],
  
  // Unverified contract indicators
  unverifiedContractPatterns: [
    /source.*not.*verified/i,
    /contract.*not.*verified/i,
    /unverified.*code/i,
    /trust.*us.*safe/i
  ],
  
  // No timelock patterns
  noTimelockPatterns: [
    /instant.*admin.*control/i,
    /immediate.*parameter.*change/i,
    /no.*delay.*governance/i,
    /owner.*can.*change.*instantly/i
  ],
  
  // Centralized key control patterns
  centralizedKeyPatterns: [
    /single.*owner/i,
    /one.*admin.*wallet/i,
    /no.*multisig/i,
    /centralized.*admin/i,
    /sole.*control/i
  ],
  
  // Oracle manipulation risk patterns
  oracleManipulationPatterns: [
    /single.*oracle/i,
    /centralized.*price.*feed/i,
    /no.*twap/i,
    /manipulatable.*oracle/i,
    /flash.*loan.*oracle/i,
    /uniswap.*v2.*oracle/i // V2 oracles are vulnerable
  ],
  
  // Bridge exploit risk patterns
  bridgeExploitPatterns: [
    /new.*bridge/i,
    /cross.*chain.*beta/i,
    /centralized.*validators/i,
    /bridge.*no.*audit/i,
    /wrapped.*token.*unverified/i,
    /bridge.*single.*validator/i
  ],
  
  // Migration scam patterns
  migrationScamPatterns: [
    /migrate.*to.*v2/i,
    /swap.*old.*tokens/i,
    /upgrade.*required.*urgent/i,
    /new.*contract.*migration/i,
    /token.*swap.*deadline/i,
    /v2.*migration.*mandatory/i,
    /old.*tokens.*worthless/i
  ],
  
  // Mixer/privacy service patterns (OFAC sanctioned)
  mixerServicePatterns: [
    /tornado.*cash/i,
    /privacy.*mixer/i,
    /coin.*mixer/i,
    /tumbler.*service/i,
    /anonymous.*transfer/i,
    /untraceable.*transaction/i
  ],
  
  // ===== ADDITIONAL ADVANCED THREATS =====
  
  // Whale concentration patterns
  whaleConcentrationPatterns: [
    /top.*10.*holders.*50%/i,
    /whale.*control/i,
    /concentrated.*ownership/i,
    /few.*holders.*majority/i,
    /distribution.*centralized/i
  ],
  
  // DNS hijacking risk patterns
  dnsHijackingPatterns: [
    /domain.*expiring/i,
    /dns.*compromised/i,
    /domain.*recently.*changed/i,
    /suspicious.*domain.*transfer/i,
    /registrar.*change/i
  ],
  
  // NFT wash trading patterns
  nftWashTradingPatterns: [
    /same.*wallet.*buying.*selling/i,
    /artificial.*volume/i,
    /wash.*trading/i,
    /fake.*nft.*volume/i,
    /self.*trading/i,
    /floor.*price.*manipulation/i
  ],
  
  // Sandwich attack / MEV risk patterns
  sandwichAttackPatterns: [
    /no.*slippage.*protection/i,
    /mev.*vulnerable/i,
    /sandwich.*attack.*risk/i,
    /front.*run.*risk/i,
    /no.*anti.*mev/i
  ],
  
  // Unlicensed securities patterns
  unlicensedSecuritiesPatterns: [
    /revenue.*sharing/i,
    /profit.*distribution/i,
    /dividend.*token/i,
    /equity.*token/i,
    /security.*offering/i,
    /reg.*d.*exempt/i
  ],
  
  // Deprecated dependencies patterns
  deprecatedDependenciesPatterns: [
    /solidity.*0\.[1-7]/i, // Old Solidity versions
    /openzeppelin.*v2/i,
    /outdated.*dependencies/i,
    /legacy.*code/i,
    /unmaintained.*library/i
  ],
  
  // No emergency pause patterns
  noEmergencyPausePatterns: [
    /no.*circuit.*breaker/i,
    /cannot.*pause/i,
    /no.*emergency.*stop/i,
    /unstoppable.*contract/i
  ],
  
  // Wrapped token risk patterns
  wrappedTokenRiskPatterns: [
    /wrapped.*token.*unbacked/i,
    /no.*proof.*of.*reserves/i,
    /centralized.*wrapping/i,
    /peg.*at.*risk/i,
    /collateral.*mismatch/i
  ]
};

// WalletDrainerDetector - Security scanning engine
export class WalletDrainerDetector {
  // Check if protocol is verified/whitelisted
  private isVerifiedProtocol(dapp: Protocol): boolean {
    const name = dapp.name.toLowerCase().trim();
    const slug = dapp.id.toLowerCase();
    
    // Check whitelist
    if (VERIFIED_PROTOCOLS.has(name) || VERIFIED_PROTOCOLS.has(slug)) {
      return true;
    }
    
    // Check if domain is trusted
    if (dapp.website) {
      const domain = dapp.website.toLowerCase().replace(/^https?:\/\/(www\.)?/, '');
      if (TRUSTED_DOMAINS.some(trusted => domain.includes(trusted))) {
        return true;
      }
    }
    
    return false;
  }

  // Calculate verification score (positive points for good signals)
  private calculateVerificationScore(dapp: Protocol): number {
    let verificationScore = 0;
    
    // Well-established protocol (age > 365 days)
    if (dapp.age && dapp.age > 365) {
      verificationScore += 50; // Strong positive signal
    } else if (dapp.age && dapp.age > 180) {
      verificationScore += 30; // Moderate positive signal
    } else if (dapp.age && dapp.age > 90) {
      verificationScore += 15; // Some positive signal
    }
    
    // High TVL indicates established protocol
    if (dapp.tvl && dapp.tvl > 100_000_000) {
      verificationScore += 40; // $100M+ TVL
    } else if (dapp.tvl && dapp.tvl > 10_000_000) {
      verificationScore += 25; // $10M+ TVL
    } else if (dapp.tvl && dapp.tvl > 1_000_000) {
      verificationScore += 10; // $1M+ TVL
    }
    
    // Social presence (Twitter verification)
    if (dapp.twitter) {
      verificationScore += 20; // Has official Twitter
    }
    
    // GitHub presence
    if (dapp.github) {
      verificationScore += 15;
    }
    
    // Audited protocols
    if (dapp.audited || (dapp.auditCount && dapp.auditCount > 0)) {
      verificationScore += 30;
    }
    
    return verificationScore;
  }

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
      
      // Check if protocol is verified - skip most checks
      const isVerified = this.isVerifiedProtocol(dapp);
      const verificationScore = this.calculateVerificationScore(dapp);
      
      // Verified protocols get a free pass on most checks
      if (isVerified) {
        results.score = Math.max(0, results.score - 100); // Remove all penalties
        results.severity = 'LOW';
        return results;
      }

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

      // CRITICAL: Check for known scam patterns (using regex with word boundaries)
      for (const pattern of SCAM_PATTERNS.knownScamPatterns) {
        if (pattern.test(nameAndDesc)) {
          results.threats.push({
            type: 'KNOWN_SCAM',
            severity: 'CRITICAL',
            message: `Known scam pattern detected - protocol name/description contains scam phrase`,
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

      // ===== NEW ADVANCED THREAT DETECTION =====

      // CRITICAL: Check for backdoor functions
      for (const pattern of SCAM_PATTERNS.backdoorFunctionPatterns) {
        if (pattern.test(nameAndDesc)) {
          results.threats.push({
            type: 'BACKDOOR_FUNCTIONS',
            severity: 'CRITICAL',
            message: 'DANGER: Contract contains dangerous admin functions that can drain funds',
          });
          results.score += 95;
          break;
        }
      }

      // CRITICAL: Check for flash loan governance attacks
      for (const pattern of SCAM_PATTERNS.flashLoanGovernancePatterns) {
        if (pattern.test(nameAndDesc)) {
          results.threats.push({
            type: 'FLASH_LOAN_GOVERNANCE',
            severity: 'CRITICAL',
            message: 'Governance attack risk - instant voting or flash loan governance vulnerability',
          });
          results.score += 90;
          break;
        }
      }

      // CRITICAL: Check for Ponzi/pyramid schemes
      for (const pattern of SCAM_PATTERNS.ponziTokenomicsPatterns) {
        if (pattern.test(nameAndDesc)) {
          results.threats.push({
            type: 'PONZI_TOKENOMICS',
            severity: 'CRITICAL',
            message: 'ILLEGAL: Ponzi/pyramid scheme detected - returns depend on new user recruitment',
          });
          results.score += 100;
          break;
        }
      }

      // CRITICAL: Check for mixer services (OFAC sanctioned)
      for (const pattern of SCAM_PATTERNS.mixerServicePatterns) {
        if (pattern.test(nameAndDesc)) {
          results.threats.push({
            type: 'MIXER_SERVICE',
            severity: 'CRITICAL',
            message: 'LEGAL RISK: Privacy mixer service - may be sanctioned by OFAC',
          });
          results.score += 85;
          break;
        }
      }

      // HIGH: Check for migration scams
      for (const pattern of SCAM_PATTERNS.migrationScamPatterns) {
        if (pattern.test(nameAndDesc)) {
          results.threats.push({
            type: 'MIGRATION_SCAM',
            severity: 'HIGH',
            message: 'Migration scam risk - fake V2 upgrade to steal tokens',
          });
          results.score += 75;
          break;
        }
      }

      // HIGH: Check for unverified contracts
      for (const pattern of SCAM_PATTERNS.unverifiedContractPatterns) {
        if (pattern.test(nameAndDesc) || (!dapp.audited && verificationScore < 30)) {
          results.threats.push({
            type: 'UNVERIFIED_CONTRACT',
            severity: 'HIGH',
            message: 'Unverified contract - source code not verified on block explorer',
          });
          results.score += 60;
          break;
        }
      }

      // HIGH: Check for no timelock protection
      for (const pattern of SCAM_PATTERNS.noTimelockPatterns) {
        if (pattern.test(nameAndDesc)) {
          results.threats.push({
            type: 'NO_TIMELOCK',
            severity: 'HIGH',
            message: 'No timelock protection - admin can change parameters instantly',
          });
          results.score += 70;
          break;
        }
      }

      // HIGH: Check for centralized key control
      for (const pattern of SCAM_PATTERNS.centralizedKeyPatterns) {
        if (pattern.test(nameAndDesc)) {
          results.threats.push({
            type: 'CENTRALIZED_KEYS',
            severity: 'HIGH',
            message: 'Centralized control - single wallet controls protocol (no multi-sig)',
          });
          results.score += 65;
          break;
        }
      }

      // HIGH: Check for oracle manipulation risks
      for (const pattern of SCAM_PATTERNS.oracleManipulationPatterns) {
        if (pattern.test(nameAndDesc)) {
          results.threats.push({
            type: 'ORACLE_MANIPULATION',
            severity: 'HIGH',
            message: 'Oracle manipulation risk - price feed vulnerable to flash loan attacks',
          });
          results.score += 70;
          break;
        }
      }

      // HIGH: Check for bridge exploit risks
      if (dapp.category === 'Bridge' || /bridge/i.test(nameAndDesc)) {
        for (const pattern of SCAM_PATTERNS.bridgeExploitPatterns) {
          if (pattern.test(nameAndDesc) || (dapp.age && dapp.age < 90) || !dapp.audited) {
            results.threats.push({
              type: 'BRIDGE_EXPLOIT_RISK',
              severity: 'HIGH',
              message: 'Bridge security risk - cross-chain bridges are #1 DeFi hack target ($2B+ stolen)',
            });
            results.score += 55;
            break;
          }
        }
      }

      // ===== ADDITIONAL ADVANCED THREAT DETECTION =====

      // MEDIUM: Check for whale concentration
      for (const pattern of SCAM_PATTERNS.whaleConcentrationPatterns) {
        if (pattern.test(nameAndDesc)) {
          results.threats.push({
            type: 'WHALE_CONCENTRATION',
            severity: 'MEDIUM',
            message: 'Whale concentration risk - few holders control majority of tokens (manipulation risk)',
          });
          results.score += 40;
          break;
        }
      }

      // MEDIUM: Check for DNS hijacking risks
      for (const pattern of SCAM_PATTERNS.dnsHijackingPatterns) {
        if (pattern.test(nameAndDesc)) {
          results.threats.push({
            type: 'DNS_HIJACKING',
            severity: 'MEDIUM',
            message: 'DNS security risk - domain vulnerable to hijacking or recently changed',
          });
          results.score += 45;
          break;
        }
      }

      // MEDIUM: Check for NFT wash trading
      if (dapp.category === 'NFT Marketplace' || dapp.category === 'NFT Lending' || /nft/i.test(nameAndDesc)) {
        for (const pattern of SCAM_PATTERNS.nftWashTradingPatterns) {
          if (pattern.test(nameAndDesc)) {
            results.threats.push({
              type: 'NFT_WASH_TRADING',
              severity: 'MEDIUM',
              message: 'NFT wash trading detected - artificial volume from self-trading',
            });
            results.score += 35;
            break;
          }
        }
      }

      // MEDIUM: Check for sandwich attack risks
      if (dapp.category === 'Dex' || /swap|dex|exchange/i.test(nameAndDesc)) {
        for (const pattern of SCAM_PATTERNS.sandwichAttackPatterns) {
          if (pattern.test(nameAndDesc)) {
            results.threats.push({
              type: 'SANDWICH_ATTACK',
              severity: 'MEDIUM',
              message: 'MEV risk - no slippage protection, vulnerable to sandwich attacks',
            });
            results.score += 30;
            break;
          }
        }
      }

      // HIGH: Check for unlicensed securities
      for (const pattern of SCAM_PATTERNS.unlicensedSecuritiesPatterns) {
        if (pattern.test(nameAndDesc)) {
          results.threats.push({
            type: 'UNLICENSED_SECURITIES',
            severity: 'HIGH',
            message: 'Regulatory risk - offering unregistered securities (SEC enforcement risk)',
          });
          results.score += 55;
          break;
        }
      }

      // MEDIUM: Check for deprecated dependencies
      for (const pattern of SCAM_PATTERNS.deprecatedDependenciesPatterns) {
        if (pattern.test(nameAndDesc)) {
          results.threats.push({
            type: 'DEPRECATED_DEPENDENCIES',
            severity: 'MEDIUM',
            message: 'Technical debt - uses outdated/vulnerable dependencies',
          });
          results.score += 35;
          break;
        }
      }

      // LOW: Check for no emergency pause
      for (const pattern of SCAM_PATTERNS.noEmergencyPausePatterns) {
        if (pattern.test(nameAndDesc)) {
          results.threats.push({
            type: 'NO_EMERGENCY_PAUSE',
            severity: 'LOW',
            message: 'No circuit breaker - cannot pause contract if exploit detected',
          });
          results.score += 20;
          break;
        }
      }

      // MEDIUM: Check for wrapped token risks
      if (/wrapped|wbtc|weth|renbtc/i.test(nameAndDesc)) {
        for (const pattern of SCAM_PATTERNS.wrappedTokenRiskPatterns) {
          if (pattern.test(nameAndDesc)) {
            results.threats.push({
              type: 'WRAPPED_TOKEN_RISK',
              severity: 'MEDIUM',
              message: 'Wrapped token risk - no proof of reserves or centralized backing',
            });
            results.score += 40;
            break;
          }
        }
      }

      // HIGH: Check if contract is less than 7 days old (only for unverified protocols)
      if (dapp.age !== null && dapp.age !== undefined && dapp.age < 7 && verificationScore < 30) {
        results.threats.push({
          type: 'NEW_CONTRACT',
          severity: 'HIGH',
          message: 'Contract less than 7 days old - HIGH RISK',
        });
        results.score += 40;
      }

      // HIGH: Check if no audit exists (reduce penalty for established protocols)
      if (!dapp.audited && !dapp.auditCount && verificationScore < 50) {
        const penalty = verificationScore > 25 ? 15 : 30; // Reduced penalty for somewhat established protocols
        results.threats.push({
          type: 'NO_AUDIT',
          severity: verificationScore > 25 ? 'MEDIUM' : 'HIGH',
          message: 'No security audit found',
        });
        results.score += penalty;
      }

      // HIGH: Check if team is anonymous (reduce penalty for high TVL protocols)
      if (!dapp.twitter && !dapp.github && verificationScore < 40) {
        const penalty = dapp.tvl && dapp.tvl > 1_000_000 ? 10 : 25; // Lower penalty for high TVL
        results.threats.push({
          type: 'ANONYMOUS_TEAM',
          severity: dapp.tvl && dapp.tvl > 1_000_000 ? 'MEDIUM' : 'HIGH',
          message: 'Team is anonymous - no social presence',
        });
        results.score += penalty;
      }

      // MEDIUM: Check for low liquidity (only flag very low TVL)
      if (dapp.tvl !== null && dapp.tvl !== undefined && dapp.tvl < 10000) {
        results.threats.push({
          type: 'LOW_LIQUIDITY',
          severity: 'MEDIUM',
          message: 'Very low liquidity (< $10k)',
        });
        results.score += 15;
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

      // Apply verification score (subtract from total) - this reduces false positives
      results.score = Math.max(0, results.score - verificationScore);

      // Determine overall severity based on FINAL score
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
