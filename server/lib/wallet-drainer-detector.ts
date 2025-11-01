import type { Protocol, SecurityScan, Threat } from '@shared/schema';
import type { IStorage } from '../storage';

// Whitelist of well-established, verified protocols
const VERIFIED_PROTOCOLS = new Set([
  // Major CEXs (Centralized Exchanges)
  'binance', 'binance cex', 'coinbase', 'kraken', 'kraken bitcoin', 'nexo', 'celsius',
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
  'morpho', 'morpho v0 aavev2', 'morpho v0 compoundv2', 'morpho blue', 'morpho aave', 'morpho compound',
  'maker', 'makerdao', 'venus', 'benqi', 'radiant', 'radiant capital',
  'revert', 'revert finance', 'revert compoundor',
  
  // Bridges
  'stargate', 'stargate finance', 'synapse', 'synapse protocol', 'hop protocol', 'across', 'across protocol', 'celer', 'celer network',
  'pulsechain', 'pulsechain bridge', 'apx', 'apx bridge', 'mezo', 'mezo network',
  
  // Liquid Staking
  'lido', 'lido finance', 'rocket pool', 'frax', 'frax finance', 'ankr', 'stader',
  
  // Wrapped Assets
  'wbtc', 'wrapped bitcoin', 'tzbtc', 'renbtc', 'weth', 'wrapped ether',
  
  // Layer 2s / Chains
  'arbitrum', 'optimism', 'polygon', 'base', 'avalanche', 'bnb chain', 'zksync',
  
  // Gaming & NFT Protocols
  'aavegotchi', 'axie infinity', 'sandbox', 'decentraland', 'gods unchained',
  
  // Other established protocols
  'gmx', 'yearn', 'yearn finance', 'convex', 'convex finance', 'olympus', 'olympus dao', 'platypus', 'platypus finance', 'joe',
  'jito', 'jito dao', 'jito labs'
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
  
  // Suspicious domain patterns (typosquatting) with legitimate counterparts
  typosquatPatterns: [
    { pattern: /unisvvap/i, legit: 'uniswap' },
    { pattern: /uniswa[pr]/i, legit: 'uniswap' },
    { pattern: /unlswap/i, legit: 'uniswap' },
    { pattern: /uni5wap/i, legit: 'uniswap' },
    { pattern: /aa[vw]e(?!gotchi)/i, legit: 'aave' }, // Exclude aavegotchi
    { pattern: /aav[ve](?!gotchi)/i, legit: 'aave' },
    { pattern: /a4ve/i, legit: 'aave' },
    { pattern: /pancak[es]wap/i, legit: 'pancakeswap' },
    { pattern: /pancakesvvap/i, legit: 'pancakeswap' },
    { pattern: /p4ncake/i, legit: 'pancakeswap' },
    { pattern: /metam[ao]sk/i, legit: 'metamask' },
    { pattern: /metamasc/i, legit: 'metamask' },
    { pattern: /met4mask/i, legit: 'metamask' },
    { pattern: /sushi[sw]ap/i, legit: 'sushiswap' },
    { pattern: /sushisvvap/i, legit: 'sushiswap' },
    { pattern: /5ushi/i, legit: 'sushiswap' },
    { pattern: /curv[e3]/i, legit: 'curve' },
    { pattern: /curv3/i, legit: 'curve' },
    { pattern: /comp0und/i, legit: 'compound' },
    { pattern: /c0mpound/i, legit: 'compound' },
    { pattern: /mak3r/i, legit: 'maker' },
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
  ],
  
  // ===== ENHANCED DRAINER-AS-A-SERVICE (DaaS) PATTERNS =====
  
  // Fake airdrop scam patterns (from aster-dex.lol analysis)
  fakeAirdropScamPatterns: [
    /free.*\$?[a-z]{3,10}.*token/i, // "free $ASTER tokens"
    /eligible.*airdrop/i,
    /exclusive.*airdrop/i,
    /claim.*airdrop.*now/i,
    /limited.*airdrop.*spots/i,
    /airdrop.*expiring/i,
    /snapshot.*eligible/i,
    /airdrop.*allocation/i,
    /claimable.*tokens/i
  ],
  
  // Unrealistic staking APY patterns (requires context: guaranteed/risk-free + high APY)
  unrealisticApyPatterns: [
    /guaranteed.*[3-9]\d%/i, // "guaranteed 30%+" = scam
    /guaranteed.*\d{3,}%/i, // "guaranteed 100%+" = scam
    /risk.*free.*[2-9]\d%/i, // "risk-free 20%+" = scam
    /stable.*coin.*(guaranteed|risk.*free|promised).*[2-9]\d%/i, // stablecoin + guaranteed/risk-free + 20%+
    /btc.*staking.*(guaranteed|risk.*free|promised).*[1-9]\d%/i, // BTC staking + guaranteed + 10%+
    /eth.*staking.*(guaranteed|risk.*free|promised).*[1-9]\d%/i, // ETH staking + guaranteed + 10%+
    /zero.*risk.*[2-9]\d%/i, // "zero risk 20%+"
    /no.*risk.*profit.*[2-9]\d%/i, // "no risk profit 20%+"
  ],
  
  // Visual clone / perfect replica patterns
  perfectClonePatterns: [
    /official.*clone/i,
    /mirror.*site/i,
    /replica.*platform/i,
    /identical.*ui/i,
    /pixel.*perfect.*copy/i
  ],
  
  // Malicious TLD patterns (highly specific - only known scam TLDs)
  suspiciousTLDPatterns: [
    /\.lol\b/i, // Common scam TLD (.lol is ONLY used for scams, never legitimate)
    /\.tk\b/i, // Free domain service (Tokelau - 90%+ spam/scam)
    /\.ml\b/i, // Free domain service (Mali - 90%+ spam/scam)
    /\.ga\b/i, // Free domain service (Gabon - 90%+ spam/scam)
    /\.cf\b/i, // Free domain service (Central African Republic - 90%+ spam/scam)
    /\.gq\b/i, // Free domain service (Equatorial Guinea - 90%+ spam/scam)
  ],
  
  // Domain variation patterns (specific phishing keywords + protocol names)
  domainVariationPatterns: [
    /aster.*dex.*\.lol/i, // aster-dex.lol specifically
    /(register|claim|verify|connect).*aster/i, // register-aster, claim-aster, etc
    /aster.*(claim|airdrop|free|invest|stake)/i, // aster-claim, aster-airdrop, etc
    /uniswap.*(claim|verify|wallet|connect)/i, // uniswap-claim, etc
    /pancake.*(claim|verify|wallet|connect)/i, // pancake-claim, etc
    /metamask.*(verify|update|security|alert)/i, // metamask-verify, etc
    /trust.*wallet.*(verify|update|security)/i, // trustwallet-verify, etc
  ],
  
  // Crypto drainer infrastructure patterns
  drainerInfrastructurePatterns: [
    /seaport\.js/i, // Common drainer script
    /wallet.*connect\.js/i, // Malicious wallet connection
    /drainer.*script/i,
    /approval.*all/i,
    /set.*approval.*for.*all/i,
    /permit2/i, // Used by drainers
    /single.*use.*contract/i, // Inferno Drainer technique
    /disposable.*contract/i
  ],
  
  // Social media distribution patterns
  socialMediaScamPatterns: [
    /dm.*for.*support/i,
    /telegram.*admin/i,
    /whatsapp.*support/i,
    /instagram.*giveaway/i,
    /twitter.*dm.*airdrop/i,
    /discord.*mod.*help/i,
    /never.*dm.*first/i // Ironically, scammers sometimes use this
  ],
  
  // Offshore / anonymous registration patterns
  offshoreRegistrationPatterns: [
    /seychelles.*registered/i,
    /bvi.*incorporated/i, // British Virgin Islands
    /cayman.*islands/i,
    /panama.*registered/i,
    /offshore.*entity/i,
    /anonymous.*registration/i,
    /privacy.*jurisdiction/i
  ],
  
  // Fake volume / metrics patterns
  fakeVolumePatterns: [
    /billion.*volume.*months.*old/i,
    /\$\d+b.*tvl.*new.*project/i,
    /record.*volume.*launch/i,
    /unprecedented.*growth/i,
    /viral.*success/i
  ],
  
  // No recovery / irreversible warning patterns (ironically used by scammers)
  noRecoveryWarningPatterns: [
    /transactions.*irreversible/i,
    /no.*refunds/i,
    /cannot.*undo/i,
    /permanent.*loss/i,
    /non.*custodial.*risk/i // Used to justify not helping victims
  ],

  // ===== 2025 ADVANCED WALLET DRAINER DETECTION =====
  
  // Named drainer operations ($494M stolen in 2024 from 332K+ victims)
  namedDrainerOperations: [
    /pink.*drainer/i, // $85M stolen from 9,000 accounts, retired May 2024
    /angel.*drainer/i, // Uses CREATE2 opcode, $5K-10K upfront + 20% commission
    /inferno.*drainer/i, // Single-use disposable contracts
    /venom.*drainer/i, // Major operation tracked by security firms
    /pussy.*drainer/i, // Active drainer operation
    /clinksink/i, // Solana-specific, $900K+ confirmed, 80/20 affiliate split
    /wallet.*drainer.*kit/i, // Generic drainer kit references
    /drainer.*as.*a.*service/i, // DaaS model ($100-$40K + 20-30% commission)
    /daas.*drainer/i, // Drainer-as-a-Service acronym
  ],

  // EIP-2612 Permit signature exploitation (56.7% of 2024 attacks)
  // IMPORTANT: Requires scam context, not just technical documentation
  permitSignaturePatterns: [
    /urgent.*permit.*signature/i, // Urgency + permit = scam
    /claim.*permit.*now/i, // Claim urgency + permit
    /sign.*permit.*free/i, // Free offer + permit signing
    /gasless.*claim.*permit/i, // Gasless claim + permit = likely scam
    /permit.*drain/i, // Direct drainer reference
    /malicious.*permit/i, // Explicit malicious intent
    /fake.*permit.*request/i, // Fake permit
    /signature.*phishing/i, // Signature phishing
  ],

  // Approval phishing patterns ($1B+ stolen since May 2021)
  // IMPORTANT: Requires scam context - asking user to approve, not just documenting
  approvalPhishingPatterns: [
    /click.*unlimited.*approval/i, // User action + unlimited = scam
    /approve.*unlimited.*now/i, // Urgency + unlimited
    /claim.*approve.*all/i, // Claim + approve all
    /urgent.*approval.*required/i, // Urgent approval request
    /approve.*all.*tokens.*now/i, // Approve all with urgency
    /grant.*unlimited.*access/i, // Grant unlimited access
    /unlimited.*permission.*required/i, // Required unlimited permission
    /permanent.*approval.*needed/i, // Permanent approval request
  ],

  // CREATE2 address generation evasion (Angel Drainer technique)
  // IMPORTANT: Specific to evasion tactics, not legitimate contract factories
  create2EvasionPatterns: [
    /evade.*blocklist/i, // Explicit evasion
    /bypass.*wallet.*protection/i, // Bypassing security
    /rotate.*contract.*evade/i, // Rotation for evasion
    /disposable.*contract.*signature/i, // Disposable for signatures
    /fresh.*address.*evade/i, // Fresh address for evasion
    /create2.*drainer/i, // CREATE2 + drainer
  ],

  // Drainer infrastructure fingerprinting
  drainerInfrastructureFingerprintPatterns: [
    /wallet.*balance.*enumeration/i,
    /asset.*valuation.*script/i,
    /token.*balance.*checker/i,
    /enumerate.*holdings/i,
    /prioritize.*high.*value/i,
    /simulation.*bypass/i,
    /anti.*simulation/i,
    /bit.*flip.*attack/i, // Aqua and Vanish drainers
    /bypass.*wallet.*guard/i,
    /bypass.*blockaid/i,
    /evade.*detection/i,
    /russian.*drainer.*community/i, // Geographic concentration
  ],

  // Solana-specific wallet draining threats
  solanaDrainerPatterns: [
    /spl.*token.*delegation/i,
    /solana.*delegate/i,
    /program.*derived.*address/i,
    /pda.*manipulation/i,
    /blind.*signing.*solana/i,
    /phantom.*wallet.*drainer/i,
    /base64.*transaction/i,
    /toctou.*attack/i, // Time-of-check-time-of-use
    /simulation.*vs.*execution/i,
    /solana.*400ms.*exploit/i, // Block time exploitation
    /invoke_signed/i, // PDA signing function
    /spl.*single.*delegate/i,
    /ledger.*blind.*sign/i,
  ],

  // Dormant approval attack patterns (458-day case: $908K stolen)
  dormantApprovalPatterns: [
    /monitor.*wallet.*deposits/i,
    /wait.*for.*funds/i,
    /dormant.*approval/i,
    /old.*permission/i,
    /forgotten.*approval/i,
    /stale.*allowance/i,
    /historical.*approval.*risk/i,
  ],

  // Drainer commission/pricing model patterns
  // IMPORTANT: Requires explicit drainer/scam context
  drainerPricingPatterns: [
    /drainer.*20%.*commission/i, // Drainer + commission
    /drainer.*30%.*commission/i,
    /drainer.*80\/20.*split/i, // Explicit drainer split
    /wallet.*drainer.*kit/i, // Wallet drainer kit
    /drainer.*subscription/i, // Drainer subscription
    /drainer.*\$[0-9]+k/i, // Drainer pricing
    /scam.*kit.*\$/i, // Scam kit pricing
  ],

  // Token approval age exploitation
  approvalAgeExploitPatterns: [
    /check.*old.*approvals/i,
    /revoke.*old.*approvals/i,
    /approval.*checker/i,
    /allowance.*audit/i,
    /spending.*permission.*review/i,
  ]
};

// WalletDrainerDetector - Security scanning engine
export class WalletDrainerDetector {
  private storage: IStorage | null = null;

  constructor(storage?: IStorage) {
    this.storage = storage || null;
  }

  /**
   * Check if the original legitimate protocol exists in our database
   * before flagging something as an imposter
   */
  private async checkOriginalProtocolExists(legitimateName: string): Promise<Protocol | null> {
    if (!this.storage) {
      return null; // Can't check database without storage
    }

    try {
      // Get all protocols and search for the legitimate name
      const allProtocols = await this.storage.getAllProtocols();
      
      // Find exact or close match
      const originalProtocol = allProtocols.find((p: Protocol) => 
        p.name.toLowerCase() === legitimateName.toLowerCase() ||
        p.name.toLowerCase().includes(legitimateName.toLowerCase()) ||
        p.id.toLowerCase().includes(legitimateName.toLowerCase())
      );

      return originalProtocol || null;
    } catch (error) {
      console.error(`Error checking for original protocol "${legitimateName}":`, error);
      return null;
    }
  }

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
      // Skip if protocol is in verified list or has high TVL + audits (likely legitimate integration)
      const hasHighTVL = dapp.tvl > 50_000_000; // $50M+
      const hasAudits = dapp.audited && dapp.auditCount > 0;
      const likelyLegit = hasHighTVL && hasAudits;
      
      if (!likelyLegit) {
        for (const { pattern, legit } of SCAM_PATTERNS.typosquatPatterns) {
          if (pattern.test(nameAndDesc) || pattern.test(website)) {
            // Check if the original protocol exists in our database
            const originalProtocol = await this.checkOriginalProtocolExists(legit);
            
            // Only flag as imposter if:
            // 1. We have the real protocol in our database
            // 2. This protocol is NOT the original (different ID/website)
            const isActualImposter = originalProtocol && (
              originalProtocol.id !== dapp.id &&
              originalProtocol.name.toLowerCase() !== dapp.name.toLowerCase()
            );
            
            if (isActualImposter) {
              results.threats.push({
                type: 'IMPOSTER',
                severity: 'CRITICAL',
                message: `Potential imposter of "${originalProtocol.name}" - name resembles the legitimate protocol`,
              });
              results.score += 90;
              break;
            } else if (!originalProtocol) {
              // Original doesn't exist in our DB - flag with lower severity
              results.threats.push({
                type: 'IMPOSTER',
                severity: 'HIGH',
                message: `Potential imposter protocol - name resembles "${legit}" (original not verified in our database)`,
              });
              results.score += 60;
              break;
            }
            // If it IS the original, don't flag it
          }
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

      // MEDIUM: Check for unverified contracts (downgraded from HIGH to reduce false positives)
      // IMPORTANT: Only flag protocols with low TVL to avoid false positives on legitimate DEXs/protocols
      const hasLowTvl = dapp.tvl < 500000; // Only flag if TVL < $500k
      if (hasLowTvl) {
        for (const pattern of SCAM_PATTERNS.unverifiedContractPatterns) {
          if (pattern.test(nameAndDesc) || (!dapp.audited && verificationScore < 30)) {
            results.threats.push({
              type: 'UNVERIFIED_CONTRACT',
              severity: 'MEDIUM',
              message: 'Unverified contract - source code not verified on block explorer',
            });
            results.score += 10;
            break;
          }
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

      // Contextual: Check for bridge exploit risks (only HIGH for new/unaudited bridges)
      if (dapp.category === 'Bridge' || /bridge/i.test(nameAndDesc)) {
        // Check if this is a new or unaudited bridge
        const isNewBridge = dapp.age && dapp.age < 90;
        const isUnauditedBridge = !dapp.audited;
        const hasLowTVL = dapp.tvl < 5_000_000; // Less than $5M TVL
        
        // Only flag as HIGH risk if it's new, unaudited, AND has low TVL (not an established bridge)
        for (const pattern of SCAM_PATTERNS.bridgeExploitPatterns) {
          if (pattern.test(nameAndDesc) && isNewBridge && isUnauditedBridge && hasLowTVL) {
            results.threats.push({
              type: 'BRIDGE_EXPLOIT_RISK',
              severity: 'HIGH',
              message: 'Bridge security risk - new unaudited bridge with low TVL',
            });
            results.score += 30;
            break;
          } else if (pattern.test(nameAndDesc) && (isNewBridge || isUnauditedBridge)) {
            // Medium risk for bridges that are either new OR unaudited (but not both)
            results.threats.push({
              type: 'BRIDGE_EXPLOIT_RISK',
              severity: 'MEDIUM',
              message: 'Bridge security advisory - cross-chain bridges require careful review',
            });
            results.score += 10;
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

      // MEDIUM: Check if no audit exists (downgraded from HIGH to reduce false positives)
      // IMPORTANT: Only flag protocols with low TVL to avoid false positives on legitimate protocols
      if (!dapp.audited && !dapp.auditCount && verificationScore < 50 && hasLowTvl) {
        results.threats.push({
          type: 'NO_AUDIT',
          severity: 'MEDIUM',
          message: 'No security audit found',
        });
        results.score += 10;
      }

      // HIGH: Check if team is anonymous (reduce penalty for high TVL protocols)
      // IMPORTANT: Only flag protocols with low TVL to avoid false positives
      if (!dapp.twitter && !dapp.github && verificationScore < 40 && hasLowTvl) {
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

      // MEDIUM: Suspicious - guaranteed profit or extreme multiplier claims
      if (/(guaranteed|promised|certain).*profit|guaranteed.*\d+x|(100|1000)x.*guaranteed/i.test(nameAndDesc)) {
        results.threats.push({
          type: 'SUSPICIOUS_RETURNS',
          severity: 'MEDIUM',
          message: 'Advertises guaranteed profits or extreme multipliers - potential scam',
        });
        results.score += 30;
      }

      // ===== ENHANCED DRAINER-AS-A-SERVICE (DaaS) DETECTION =====

      // CRITICAL: Check for fake airdrop scams (aster-dex.lol technique)
      for (const pattern of SCAM_PATTERNS.fakeAirdropScamPatterns) {
        if (pattern.test(nameAndDesc) || pattern.test(website)) {
          results.threats.push({
            type: 'FAKE_AIRDROP',
            severity: 'CRITICAL',
            message: 'SCAM: Fake airdrop detected - Claims free tokens to lure victims into wallet drainer',
          });
          results.score += 95;
          break;
        }
      }

      // CRITICAL: Check for unrealistic staking APY (aster-dex.lol red flag)
      for (const pattern of SCAM_PATTERNS.unrealisticApyPatterns) {
        if (pattern.test(nameAndDesc)) {
          results.threats.push({
            type: 'UNREALISTIC_APY',
            severity: 'CRITICAL',
            message: 'SCAM: Guaranteed/risk-free high returns detected - No legitimate protocol can guarantee 20-30%+ APY',
          });
          results.score += 90;
          break;
        }
      }

      // CRITICAL: Check for malicious TLDs (.lol, .tk, .ml, etc.)
      for (const pattern of SCAM_PATTERNS.suspiciousTLDPatterns) {
        if (pattern.test(website)) {
          results.threats.push({
            type: 'MALICIOUS_TLD',
            severity: 'CRITICAL',
            message: 'SCAM DOMAIN: Uses suspicious TLD commonly associated with phishing (.lol, .tk, .ml, .ga, .cf)',
          });
          results.score += 100; // Instant blacklist
          break;
        }
      }

      // CRITICAL: Check for domain variations (aster-dex.lol, register-asterdex.com, etc.)
      for (const pattern of SCAM_PATTERNS.domainVariationPatterns) {
        if (pattern.test(nameAndDesc) || pattern.test(website)) {
          results.threats.push({
            type: 'DOMAIN_VARIATION',
            severity: 'CRITICAL',
            message: 'SCAM: Impersonating legitimate protocol with fake domain variation',
          });
          results.score += 100; // Instant blacklist
          break;
        }
      }

      // CRITICAL: Check for crypto drainer infrastructure
      for (const pattern of SCAM_PATTERNS.drainerInfrastructurePatterns) {
        if (pattern.test(nameAndDesc)) {
          results.threats.push({
            type: 'DRAINER_INFRASTRUCTURE',
            severity: 'CRITICAL',
            message: 'DANGER: Wallet drainer infrastructure detected (malicious approval scripts)',
          });
          results.score += 100; // Instant blacklist
          break;
        }
      }

      // HIGH: Check for social media scam distribution patterns
      for (const pattern of SCAM_PATTERNS.socialMediaScamPatterns) {
        if (pattern.test(nameAndDesc)) {
          results.threats.push({
            type: 'SOCIAL_MEDIA_SCAM',
            severity: 'HIGH',
            message: 'Social media scam pattern - Unsolicited DMs or fake support accounts',
          });
          results.score += 70;
          break;
        }
      }

      // HIGH: Check for offshore/anonymous registration
      for (const pattern of SCAM_PATTERNS.offshoreRegistrationPatterns) {
        if (pattern.test(nameAndDesc)) {
          results.threats.push({
            type: 'OFFSHORE_REGISTRATION',
            severity: 'HIGH',
            message: 'Offshore registration (Seychelles, BVI, Cayman) - Common for exit scams',
          });
          results.score += 60;
          break;
        }
      }

      // HIGH: Check for fake volume/metrics claims
      for (const pattern of SCAM_PATTERNS.fakeVolumePatterns) {
        if (pattern.test(nameAndDesc)) {
          results.threats.push({
            type: 'FAKE_VOLUME',
            severity: 'HIGH',
            message: 'Suspicious metrics - Claims billions in volume while being new project',
          });
          results.score += 65;
          break;
        }
      }

      // MEDIUM: Check for visual clone patterns
      for (const pattern of SCAM_PATTERNS.perfectClonePatterns) {
        if (pattern.test(nameAndDesc)) {
          results.threats.push({
            type: 'VISUAL_CLONE',
            severity: 'MEDIUM',
            message: 'Visual clone detected - May be impersonating legitimate platform design',
          });
          results.score += 50;
          break;
        }
      }

      // ===== 2025 ADVANCED WALLET DRAINER DETECTION =====

      // CRITICAL: Named drainer operations ($494M stolen in 2024)
      for (const pattern of SCAM_PATTERNS.namedDrainerOperations) {
        if (pattern.test(nameAndDesc) || pattern.test(website)) {
          results.threats.push({
            type: 'NAMED_DRAINER_OPERATION',
            severity: 'CRITICAL',
            message: 'DANGER: Known drainer operation detected (Pink/Angel/Inferno/Venom/CLINKSINK) - $494M stolen in 2024',
          });
          results.score += 100; // Instant blacklist
          break;
        }
      }

      // CRITICAL: EIP-2612 Permit signature exploitation (56.7% of 2024 attacks)
      for (const pattern of SCAM_PATTERNS.permitSignaturePatterns) {
        if (pattern.test(nameAndDesc) || pattern.test(website)) {
          results.threats.push({
            type: 'PERMIT_SIGNATURE_EXPLOIT',
            severity: 'CRITICAL',
            message: 'DANGER: EIP-2612 permit signature attack - 56.7% of 2024 wallet draining attacks use this method',
          });
          results.score += 95;
          break;
        }
      }

      // CRITICAL: Approval phishing patterns ($1B+ stolen since May 2021)
      for (const pattern of SCAM_PATTERNS.approvalPhishingPatterns) {
        if (pattern.test(nameAndDesc) || pattern.test(website)) {
          results.threats.push({
            type: 'APPROVAL_PHISHING',
            severity: 'CRITICAL',
            message: 'DANGER: Unlimited approval phishing - Over $1 billion stolen since May 2021 from this attack',
          });
          results.score += 95;
          break;
        }
      }

      // CRITICAL: CREATE2 address evasion (Angel Drainer technique)
      for (const pattern of SCAM_PATTERNS.create2EvasionPatterns) {
        if (pattern.test(nameAndDesc) || pattern.test(website)) {
          results.threats.push({
            type: 'CREATE2_EVASION',
            severity: 'CRITICAL',
            message: 'DANGER: CREATE2 address generation evasion - Used by Angel Drainer to evade blocklists',
          });
          results.score += 90;
          break;
        }
      }

      // CRITICAL: Drainer infrastructure fingerprinting
      for (const pattern of SCAM_PATTERNS.drainerInfrastructureFingerprintPatterns) {
        if (pattern.test(nameAndDesc) || pattern.test(website)) {
          results.threats.push({
            type: 'DRAINER_FINGERPRINT',
            severity: 'CRITICAL',
            message: 'DANGER: Drainer infrastructure detected - Balance enumeration, simulation bypass, or detection evasion',
          });
          results.score += 100; // Instant blacklist
          break;
        }
      }

      // CRITICAL: Solana-specific drainer patterns ($4.17M stolen from 3,947 victims)
      if (dapp.chains.some(chain => /solana/i.test(chain)) || /solana|phantom|spl/i.test(nameAndDesc)) {
        for (const pattern of SCAM_PATTERNS.solanaDrainerPatterns) {
          if (pattern.test(nameAndDesc) || pattern.test(website)) {
            results.threats.push({
              type: 'SOLANA_DRAINER',
              severity: 'CRITICAL',
              message: 'DANGER: Solana wallet drainer detected - SPL delegation, PDA manipulation, or blind signing exploit',
            });
            results.score += 95;
            break;
          }
        }
      }

      // HIGH: Dormant approval attack patterns (458-day case: $908K stolen)
      for (const pattern of SCAM_PATTERNS.dormantApprovalPatterns) {
        if (pattern.test(nameAndDesc) || pattern.test(website)) {
          results.threats.push({
            type: 'DORMANT_APPROVAL_RISK',
            severity: 'HIGH',
            message: 'WARNING: Dormant approval monitoring detected - Attackers wait for wallet refills (longest: 458 days, $908K stolen)',
          });
          results.score += 75;
          break;
        }
      }

      // HIGH: Drainer pricing/commission model patterns
      for (const pattern of SCAM_PATTERNS.drainerPricingPatterns) {
        if (pattern.test(nameAndDesc)) {
          results.threats.push({
            type: 'DRAINER_PRICING_MODEL',
            severity: 'HIGH',
            message: 'WARNING: Drainer-as-a-Service pricing model detected - $100-$40K + 20-30% commission structure',
          });
          results.score += 80;
          break;
        }
      }

      // MEDIUM: Approval age exploitation patterns
      for (const pattern of SCAM_PATTERNS.approvalAgeExploitPatterns) {
        if (pattern.test(nameAndDesc) || pattern.test(website)) {
          results.threats.push({
            type: 'APPROVAL_AGE_EXPLOIT',
            severity: 'MEDIUM',
            message: 'Advisory: Token approval age monitoring - May be checking for old forgotten approvals to exploit',
          });
          results.score += 40;
          break;
        }
      }

      // Apply verification score (subtract from total) - this reduces false positives
      results.score = Math.max(0, results.score - verificationScore);

      // Determine overall severity based on FINAL score
      if (results.score >= 80) results.severity = 'CRITICAL';
      else if (results.score >= 50) results.severity = 'HIGH';
      else if (results.score >= 25) results.severity = 'MEDIUM';

      // LEGITIMACY BACKSTOP: Prevent auto-blacklisting of established protocols
      // If protocol has high legitimacy score (≥70), high TVL (≥$5M), or significant audit count,
      // cap severity at HIGH and require manual review instead of auto-blacklisting
      const hasHighLegitimacy = verificationScore >= 70;
      const hasEstablishedTVL = dapp.tvl >= 5_000_000;
      const hasMultipleAudits = dapp.auditCount >= 2;
      
      if (results.severity === 'CRITICAL' && (hasHighLegitimacy || hasEstablishedTVL || hasMultipleAudits)) {
        // Downgrade to HIGH severity - requires manual review
        results.severity = 'HIGH';
        results.threats.push({
          type: 'MANUAL_REVIEW_REQUIRED',
          severity: 'HIGH',
          message: 'High-risk threats detected on established protocol - requires manual security review',
        });
      }

      results.isBlacklisted = results.severity === 'CRITICAL';
      return results;
    } catch (error) {
      console.error('Error scanning dApp:', error);
      return results;
    }
  }
}
