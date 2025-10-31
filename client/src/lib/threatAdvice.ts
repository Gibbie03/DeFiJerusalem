export interface ThreatAdvice {
  title: string;
  description: string;
  userAdvice: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  actionRecommendation: string;
}

export function getThreatAdvice(threatType: string, severity: string): ThreatAdvice {
  const adviceMap: Record<string, ThreatAdvice> = {
    // 2025 Advanced Drainer Threats
    NAMED_DRAINER_OPERATION: {
      title: 'Named Drainer Operation Detected',
      description: 'This protocol has been linked to known wallet drainer operations such as Pink Drainer, Angel Drainer, or CLINKSINK. These are sophisticated scam operations that have stolen millions from users.',
      userAdvice: 'DO NOT interact with this protocol under any circumstances. Known drainer operations use advanced techniques to steal all funds from your wallet.',
      severity: 'CRITICAL',
      actionRecommendation: 'Avoid completely. Report to community if you encountered this.',
    },
    PERMIT_SIGNATURE_EXPLOIT: {
      title: 'EIP-2612 Permit Signature Exploit',
      description: 'This protocol may exploit EIP-2612 permit signatures to drain funds without traditional approvals. This is an advanced attack vector discovered in 2024-2025.',
      userAdvice: 'Never sign permit messages from this protocol. Permit exploits can drain your entire wallet balance instantly without showing approval transactions.',
      severity: 'CRITICAL',
      actionRecommendation: 'Do not connect wallet. If already connected, revoke all approvals immediately.',
    },
    APPROVAL_PHISHING: {
      title: 'Approval Phishing Attack',
      description: 'This protocol uses deceptive approval requests to gain unlimited access to your tokens. Once approved, they can drain your wallet at any time.',
      userAdvice: 'Be extremely cautious with any approval requests. Scammers disguise malicious contracts as legitimate DeFi protocols to steal your funds.',
      severity: 'CRITICAL',
      actionRecommendation: 'Revoke any existing approvals using tools like Revoke.cash. Do not approve any transactions.',
    },
    CREATE2_EVASION: {
      title: 'CREATE2 Evasion Technique Detected',
      description: 'This protocol uses CREATE2 to deploy contracts at predictable addresses, potentially to evade detection or deploy malicious code after initial verification.',
      userAdvice: 'This is a red flag indicating the protocol may be designed to evade security checks. Contract behavior could change unexpectedly.',
      severity: 'HIGH',
      actionRecommendation: 'Avoid interaction. CREATE2 is often used in sophisticated scams to deploy malicious code.',
    },
    SOLANA_DRAINER: {
      title: 'Solana-Specific Drainer Attack',
      description: 'This Solana protocol exhibits patterns consistent with wallet drainer operations targeting Solana wallets, including fake token mints or malicious program instructions.',
      userAdvice: 'Solana drainers can empty your wallet in seconds. Do not sign any transactions or connect your Phantom/Solflare wallet.',
      severity: 'CRITICAL',
      actionRecommendation: 'Do not interact. Disconnect wallet immediately if connected.',
    },
    DRAINER_FINGERPRINT: {
      title: 'Drainer-as-a-Service Infrastructure',
      description: 'This protocol shows technical fingerprints matching known Drainer-as-a-Service (DaaS) platforms. These are commercial scam operations sold to multiple bad actors.',
      userAdvice: 'This protocol is likely part of a commercial scam operation. DaaS platforms enable mass-scale wallet draining campaigns.',
      severity: 'CRITICAL',
      actionRecommendation: 'Avoid completely. Report to blockchain security teams.',
    },
    DORMANT_APPROVAL_RISK: {
      title: 'Dormant Approval Risk',
      description: 'This protocol has dormant approval mechanisms that could be activated later to drain user funds. The protocol may appear safe now but contains hidden risks.',
      userAdvice: 'Dormant approvals are time bombs. Even if the protocol seems safe now, malicious functionality could be activated later.',
      severity: 'HIGH',
      actionRecommendation: 'Monitor closely. Consider avoiding or limiting exposure.',
    },
    DRAINER_PRICING_MODEL: {
      title: 'Drainer Pricing Structure Detected',
      description: 'This protocol shows economic patterns consistent with pay-per-drain scam models, where scammers pay fees for stolen funds.',
      userAdvice: 'This indicates the protocol may be part of an organized theft operation with commercial incentives.',
      severity: 'HIGH',
      actionRecommendation: 'Avoid interaction. High likelihood of being a coordinated scam.',
    },

    // Traditional Security Threats
    RUG_PULL_RISK: {
      title: 'Rug Pull Risk Detected',
      description: 'This protocol shows indicators of potential rug pull, where developers could abandon the project and steal user funds.',
      userAdvice: 'Be extremely cautious. Rug pulls are common in DeFi and can result in total loss of invested funds.',
      severity: 'HIGH',
      actionRecommendation: 'Only invest what you can afford to lose. Research team background thoroughly.',
    },
    PHISHING_INDICATORS: {
      title: 'Phishing Indicators Present',
      description: 'This protocol exhibits characteristics commonly associated with phishing scams, including suspicious domains or fake interfaces.',
      userAdvice: 'This may be a fake version of a legitimate protocol designed to steal your wallet credentials or private keys.',
      severity: 'CRITICAL',
      actionRecommendation: 'Do not enter your seed phrase or private keys. Verify the official website URL.',
    },
    UNVERIFIED_CONTRACT: {
      title: 'Unverified Smart Contract',
      description: 'The smart contract source code has not been verified on blockchain explorers, making it impossible to audit for security issues.',
      userAdvice: 'Unverified contracts could contain malicious code. Without verification, you cannot know what the contract actually does.',
      severity: 'MEDIUM',
      actionRecommendation: 'Wait for contract verification or use alternative verified protocols.',
    },
    NO_AUDIT: {
      title: 'No Security Audit',
      description: 'This protocol has not been audited by reputable security firms, increasing the risk of undiscovered vulnerabilities.',
      userAdvice: 'Unaudited protocols may contain critical bugs or vulnerabilities that could lead to loss of funds.',
      severity: 'MEDIUM',
      actionRecommendation: 'Use with caution. Consider waiting for security audit before large investments.',
    },
    HONEYPOT: {
      title: 'Honeypot Contract Detected',
      description: 'This token contract appears to be a honeypot - you can buy but cannot sell. This is a common scam to trap user funds.',
      userAdvice: 'DO NOT BUY. Honeypots allow purchases but prevent sells, trapping your money permanently.',
      severity: 'CRITICAL',
      actionRecommendation: 'Avoid completely. You will lose all funds invested.',
    },
    HIDDEN_OWNER: {
      title: 'Hidden Contract Owner',
      description: 'The contract has hidden ownership or privileged functions that are not clearly documented, allowing secret control.',
      userAdvice: 'Hidden owners can modify contract behavior, mint unlimited tokens, or freeze user assets without warning.',
      severity: 'HIGH',
      actionRecommendation: 'Avoid protocols with hidden ownership. Demand transparency.',
    },
    PROXY_CONTRACT_RISK: {
      title: 'Proxy Contract Risk',
      description: 'This protocol uses proxy contracts that can be upgraded, potentially allowing the owner to change the contract logic maliciously.',
      userAdvice: 'Upgradeable contracts can be changed by owners at any time, potentially introducing malicious code after you invest.',
      severity: 'MEDIUM',
      actionRecommendation: 'Verify the upgrade mechanism is controlled by a secure governance process.',
    },
    TRADING_COOLDOWN: {
      title: 'Trading Cooldown Restrictions',
      description: 'The contract has trading cooldown periods that may prevent you from selling when you want to.',
      userAdvice: 'Trading restrictions can trap your funds during market volatility or prevent you from exiting scams quickly.',
      severity: 'MEDIUM',
      actionRecommendation: 'Understand the cooldown periods before investing. May limit exit options.',
    },
    HIGH_TAX: {
      title: 'Excessive Trading Taxes',
      description: 'This token has unusually high buy/sell taxes that significantly reduce your potential profits.',
      userAdvice: 'High taxes (>10%) can make profitable trading nearly impossible and are often used to enrich developers.',
      severity: 'MEDIUM',
      actionRecommendation: 'Check exact tax rates. Consider alternatives with fair tokenomics.',
    },
    ANONYMOUS_TEAM: {
      title: 'Anonymous Development Team',
      description: 'The development team is anonymous with no verified identities, increasing risk of abandonment or fraud.',
      userAdvice: 'Anonymous teams have no accountability and can exit scam without consequences.',
      severity: 'LOW',
      actionRecommendation: 'Proceed with caution. Prefer protocols with doxxed teams.',
    },
    IMPOSTER_PROJECT: {
      title: 'Potential Imposter Project',
      description: 'This protocol may be impersonating a legitimate project with a similar name or branding.',
      userAdvice: 'Imposter projects trick users into thinking they are legitimate DeFi protocols to steal funds.',
      severity: 'CRITICAL',
      actionRecommendation: 'Verify official website and contract addresses. Check social media for warnings.',
    },
    TWITTER_SCAM_MENTION: {
      title: 'Mentioned in Scam Warnings',
      description: 'This protocol has been mentioned in crypto security Twitter feeds or scam warning systems.',
      userAdvice: 'The crypto security community has flagged this as potentially dangerous.',
      severity: 'HIGH',
      actionRecommendation: 'Research thoroughly before interaction. Community warnings are often accurate.',
    },
  };

  const advice = adviceMap[threatType];
  
  if (!advice) {
    return {
      title: 'Security Threat Detected',
      description: `This protocol has been flagged with a ${severity} severity threat: ${threatType}`,
      userAdvice: 'Exercise extreme caution when interacting with this protocol. Unknown threats may indicate novel attack vectors.',
      severity: (severity as ThreatAdvice['severity']) || 'MEDIUM',
      actionRecommendation: 'Research thoroughly before proceeding. Consider safer alternatives.',
    };
  }

  return advice;
}

export function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'CRITICAL':
      return 'text-red-500';
    case 'HIGH':
      return 'text-orange-500';
    case 'MEDIUM':
      return 'text-yellow-500';
    case 'LOW':
      return 'text-blue-500';
    default:
      return 'text-green-500';
  }
}

export function getSeverityIcon(severity: string): string {
  switch (severity) {
    case 'CRITICAL':
      return '🚨';
    case 'HIGH':
      return '⚠️';
    case 'MEDIUM':
      return '⚡';
    case 'LOW':
      return 'ℹ️';
    default:
      return '✅';
  }
}
