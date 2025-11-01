/**
 * Drainer Intelligence Database
 * 
 * Real-world wallet drainer addresses, patterns, and transaction signatures
 * Based on blockchain forensics research (2024-2025)
 */

export interface DrainerWallet {
  address: string;
  operation: string;
  confidence: 'CONFIRMED' | 'SUSPECTED' | 'ASSOCIATED';
  lastActive?: string;
  totalStolen?: string;
  notes?: string;
  source: string;
}

export interface DrainerPattern {
  type: string;
  signature: string;
  description: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
}

/**
 * Known Drainer Wallet Addresses
 * Sources: Etherscan labels, blockchain forensics, security research
 */
export const KNOWN_DRAINER_WALLETS: DrainerWallet[] = [
  // PINK DRAINER
  {
    address: '0x63605e53d422c4f1ac0e01390ac59aaf84c44a51',
    operation: 'Pink Drainer',
    confidence: 'CONFIRMED',
    lastActive: '2024-05',
    totalStolen: '$85.3M',
    notes: 'Primary Pink Drainer wallet - 23,809 transactions, shutdown May 2024',
    source: 'Etherscan label + blockchain forensics'
  },
  {
    address: '0x8980ab6d185af9bcc10292d4e91ae4c0b4f14213',
    operation: 'Pink Drainer',
    confidence: 'CONFIRMED',
    notes: 'Pink Drainer wallet that lost 10 ETH to address poisoning (June 2024)',
    source: 'Crystal Intelligence report'
  },
  
  // INFERNO DRAINER
  {
    address: '0x000012e3c4039ec46b89309d2117654ef7c20000',
    operation: 'Inferno Drainer',
    confidence: 'CONFIRMED',
    lastActive: '2025-05',
    totalStolen: '$80M+',
    notes: 'Sample receiver address, still active with EIP-7702 exploits',
    source: 'Check Point Research + Medium analysis'
  },
  
  // COMMON CASHOUT PATTERNS
  // Note: Drainer cashout addresses rotate every 1-2 months
  // These patterns help identify the network
];

/**
 * Suspicious Vanity Address Patterns
 * Drainers sometimes use recognizable patterns to appear legitimate
 */
export const SUSPICIOUS_VANITY_PATTERNS = [
  {
    pattern: /^0x0{20,}[a-f0-9]+$/,
    message: 'Excessive leading zeros - common in scam addresses',
    severity: 'MEDIUM' as const
  },
  {
    pattern: /^0x[a-f0-9]*dead[a-f0-9]*$/i,
    message: 'Contains "dead" - frequently used in scam/vanity addresses',
    severity: 'MEDIUM' as const
  },
  {
    pattern: /^0x[a-f0-9]*beef[a-f0-9]*$/i,
    message: 'Contains "beef" - common vanity pattern in scam wallets',
    severity: 'MEDIUM' as const
  },
  {
    pattern: /^0x[a-f0-9]*cafe[a-f0-9]*$/i,
    message: 'Contains "cafe" - vanity pattern sometimes used by scammers',
    severity: 'LOW' as const
  },
  {
    pattern: /^0x[a-f0-9]*badc0de[a-f0-9]*$/i,
    message: 'Contains "badc0de" - vanity pattern',
    severity: 'LOW' as const
  },
  {
    pattern: /^0x(1{10,}|2{10,}|3{10,}|4{10,}|5{10,}|6{10,}|7{10,}|8{10,}|9{10,}|a{10,}|b{10,}|c{10,}|d{10,}|e{10,}|f{10,})/i,
    message: 'Repetitive character pattern - potential vanity/scam address',
    severity: 'MEDIUM' as const
  }
];

/**
 * Address Poisoning Detection
 * Scammers create addresses with matching first/last characters
 */
export function detectAddressPoisoning(address: string, knownAddresses: string[] = []): {
  isPoisoned: boolean;
  matchedAddress?: string;
  warning?: string;
} {
  const addressLower = address.toLowerCase();
  
  // Check if this address matches first 6 and last 4 chars of any known address
  for (const known of knownAddresses) {
    const knownLower = known.toLowerCase();
    
    if (addressLower !== knownLower) {
      const addressPrefix = addressLower.slice(0, 6); // 0x1234
      const addressSuffix = addressLower.slice(-4);   // abcd
      const knownPrefix = knownLower.slice(0, 6);
      const knownSuffix = knownLower.slice(-4);
      
      if (addressPrefix === knownPrefix && addressSuffix === knownSuffix) {
        return {
          isPoisoned: true,
          matchedAddress: known,
          warning: `This address matches the first 6 and last 4 characters of a known address. This is likely an address poisoning attack!`
        };
      }
    }
  }
  
  return { isPoisoned: false };
}

/**
 * Transaction Pattern Analysis
 * Detect drainer-like transaction signatures
 */
export const DRAINER_TRANSACTION_PATTERNS: DrainerPattern[] = [
  {
    type: 'UNLIMITED_APPROVAL',
    signature: '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
    description: 'Unlimited token approval (type(uint256).max) - allows drainer to steal all tokens',
    severity: 'CRITICAL'
  },
  {
    type: 'PERMIT_SIGNATURE',
    signature: '0x8fcbaf0c', // permit(address,address,uint256,uint256,uint8,bytes32,bytes32)
    description: 'EIP-2612 Permit signature - gasless approval often used in drainer attacks (56.7% of attacks)',
    severity: 'CRITICAL'
  },
  {
    type: 'SET_APPROVAL_FOR_ALL',
    signature: '0xa22cb465', // setApprovalForAll(address,bool)
    description: 'NFT approval for all - grants control over entire NFT collection',
    severity: 'CRITICAL'
  },
  {
    type: 'INCREASE_ALLOWANCE',
    signature: '0x39509351', // increaseAllowance(address,uint256)
    description: 'Incremental approval increase - stealth draining method (used in BadgerDAO $120M hack)',
    severity: 'HIGH'
  },
  {
    type: 'APPROVE',
    signature: '0x095ea7b3', // approve(address,uint256)
    description: 'Standard ERC-20 approval - check spender address and amount',
    severity: 'MEDIUM'
  }
];

/**
 * Drainer Operation Cashout Indicators
 * Common patterns in how drainers move stolen funds
 */
export const CASHOUT_INDICATORS = {
  // Preferred stablecoins
  stablecoins: ['DAI', 'USDT', 'USDC'],
  
  // Common mixer services
  mixers: [
    '0xd90e2f925DA726b50C4Ed8D0Fb90Ad053324F31b', // Tornado Cash: Router
    '0x47CE0C6eD5B0Ce3d3A51fdb1C52DC66a7c3c2936', // Tornado Cash: DAI
    '0x910Cbd523D972eb0a6f4cAe4618aD62622b39DbF', // Tornado Cash: ETH
  ],
  
  // Time patterns
  drainSpeed: 'Usually within seconds to minutes after approval',
  rotationPeriod: '1-2 months for cashout address rotation'
};

/**
 * Check if address is a known drainer
 */
export function checkKnownDrainerAddress(address: string): {
  isKnownDrainer: boolean;
  details?: DrainerWallet;
} {
  const addressLower = address.toLowerCase();
  
  const match = KNOWN_DRAINER_WALLETS.find(
    drainer => drainer.address.toLowerCase() === addressLower
  );
  
  return {
    isKnownDrainer: !!match,
    details: match
  };
}

/**
 * Check for suspicious vanity patterns
 */
export function checkVanityPatterns(address: string): {
  hasSuspiciousPattern: boolean;
  matches: Array<{
    pattern: string;
    message: string;
    severity: string;
  }>;
} {
  const addressLower = address.toLowerCase();
  const matches: Array<{ pattern: string; message: string; severity: string }> = [];
  
  // Skip null address
  if (addressLower === '0x0000000000000000000000000000000000000000') {
    return { hasSuspiciousPattern: false, matches: [] };
  }
  
  for (const { pattern, message, severity } of SUSPICIOUS_VANITY_PATTERNS) {
    if (pattern.test(addressLower)) {
      matches.push({
        pattern: pattern.source,
        message,
        severity
      });
    }
  }
  
  return {
    hasSuspiciousPattern: matches.length > 0,
    matches
  };
}

/**
 * Comprehensive wallet risk assessment
 */
export function assessWalletRisk(address: string, associatedWithBlacklist: boolean = false): {
  riskScore: number;
  severity: 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  findings: Array<{
    type: string;
    severity: string;
    message: string;
    evidence?: string;
  }>;
  recommendations: string[];
} {
  let riskScore = 0;
  const findings: Array<{ type: string; severity: string; message: string; evidence?: string }> = [];
  const recommendations: string[] = [];
  
  // Check if known drainer
  const drainerCheck = checkKnownDrainerAddress(address);
  if (drainerCheck.isKnownDrainer && drainerCheck.details) {
    riskScore += 100;
    findings.push({
      type: 'KNOWN_DRAINER_WALLET',
      severity: 'CRITICAL',
      message: `🚨 CONFIRMED DRAINER: ${drainerCheck.details.operation}`,
      evidence: `${drainerCheck.details.notes || ''} | Stolen: ${drainerCheck.details.totalStolen || 'Unknown'} | Source: ${drainerCheck.details.source}`
    });
    recommendations.push('⚠️ NEVER interact with this address - confirmed drainer operation');
    recommendations.push('Report any activity from this address to security@defijerusalem.com');
  }
  
  // Check vanity patterns
  const vanityCheck = checkVanityPatterns(address);
  if (vanityCheck.hasSuspiciousPattern) {
    for (const match of vanityCheck.matches) {
      const score = match.severity === 'MEDIUM' ? 30 : 15;
      riskScore += score;
      findings.push({
        type: 'SUSPICIOUS_VANITY_PATTERN',
        severity: match.severity,
        message: match.message,
        evidence: 'Drainers sometimes use vanity addresses with specific patterns to appear legitimate or memorable'
      });
    }
  }
  
  // Add blacklist association score
  if (associatedWithBlacklist) {
    riskScore += 80;
  }
  
  // Determine severity
  let severity: 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'SAFE';
  if (riskScore >= 80) severity = 'CRITICAL';
  else if (riskScore >= 60) severity = 'HIGH';
  else if (riskScore >= 40) severity = 'MEDIUM';
  else if (riskScore >= 20) severity = 'LOW';
  
  // Generate recommendations based on severity
  if (severity === 'CRITICAL' || severity === 'HIGH') {
    recommendations.push('🚫 DO NOT interact with this address - high risk of fund loss');
    recommendations.push('Verify the source before approving any transactions');
    recommendations.push('Check transaction history on Etherscan or similar explorers');
  } else if (severity === 'MEDIUM') {
    recommendations.push('Exercise extreme caution with this address');
    recommendations.push('Verify through multiple sources before interaction');
  } else if (findings.length > 0) {
    recommendations.push('Exercise caution when interacting with this address');
    recommendations.push('Always verify addresses through official sources');
  } else {
    recommendations.push('No immediate threats detected, but always verify addresses');
    recommendations.push('Check transaction history on Etherscan or similar explorers');
  }
  
  return {
    riskScore: Math.min(riskScore, 100),
    severity,
    findings,
    recommendations
  };
}

/**
 * Generate educational content about drainer operations
 */
export function getDrainerEducation() {
  return {
    howDrainersWork: [
      '1. Phishing Setup: Fake websites impersonating legitimate DeFi platforms',
      '2. Victim Connection: User connects wallet to malicious site',
      '3. Signature Request: Drainer requests Permit signature or approval',
      '4. Instant Drain: Automated bot drains wallet within seconds of approval',
      '5. Laundering: Funds moved through mixers (Tornado Cash) or converted to stablecoins',
    ],
    commonAttackVectors: [
      'EIP-2612 Permit Signatures (56.7% of attacks) - Gasless approvals via off-chain signatures',
      'setApprovalForAll - Grants control over entire NFT collections',
      'Unlimited Approvals - type(uint256).max allowing access to all tokens',
      'increaseAllowance - Stealth approval increases',
      'Address Poisoning - Fake addresses matching first/last characters of real ones',
    ],
    protectionMeasures: [
      '✅ Use hardware wallets for significant holdings',
      '✅ Never sign messages from unknown/unverified sites',
      '✅ Verify URLs character-by-character (beware typosquatting)',
      '✅ Use transaction simulation tools (Blockaid, Tenderly)',
      '✅ Regularly audit token approvals (revoke.cash, Etherscan)',
      '✅ Enable wallet security features (MetaMask phishing warnings)',
      '✅ Double-check recipient addresses before sending',
    ],
    statistics2024: {
      totalStolen: '$494M',
      victims: '332,000 addresses',
      permitAttacks: '56.7%',
      averageLoss: '$1,490 per victim',
      largestHeist: '$55.5M (August 2024)',
    }
  };
}
