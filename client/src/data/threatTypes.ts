export interface ThreatTypeInfo {
  id: string;
  name: string;
  category: 'critical' | 'high' | 'medium' | 'low';
  points: number;
  shortDescription: string;
  fullDescription: string;
  howItWorks: string;
  realWorldExample: string;
  protection: string[];
  detectionMethod: string;
  prevalence: 'very_common' | 'common' | 'uncommon' | 'rare';
  firstSeen: string;
  relatedThreats: string[];
}

export const THREAT_TYPES: Record<string, ThreatTypeInfo> = {
  PINK_DRAINER: {
    id: 'PINK_DRAINER',
    name: 'Pink Drainer Operation',
    category: 'critical',
    points: 100,
    shortDescription: 'Advanced wallet drainer operation active in 2025 targeting crypto users',
    fullDescription: 'Pink Drainer is a sophisticated wallet draining operation that emerged in 2023 and evolved through 2024-2025. It uses malicious smart contracts disguised as legitimate DeFi protocols to steal users\' entire cryptocurrency holdings in a single transaction.',
    howItWorks: 'The attack works by tricking users into signing malicious transaction approvals that grant the drainer contract unlimited access to their wallet. Once approved, the drainer automatically transfers all valuable tokens (ETH, USDT, USDC, NFTs, etc.) to attacker-controlled addresses. Pink Drainer specifically uses advanced phishing techniques including fake airdrop sites, compromised Twitter accounts, and lookalike DeFi interfaces.',
    realWorldExample: 'In early 2024, Pink Drainer compromised over 20,000 wallets, stealing approximately $85 million in cryptocurrency. The operation targeted users through fake NFT minting sites and compromised Discord servers, often impersonating well-known projects like Azuki and Bored Ape Yacht Club.',
    protection: [
      'Never sign transaction approvals from untrusted websites',
      'Always verify the contract address before interacting',
      'Use hardware wallets for large holdings',
      'Revoke token approvals regularly using tools like Revoke.cash',
      'Double-check URLs - Pink Drainer uses typosquatting domains',
      'Be suspicious of unexpected airdrops or urgent claims'
    ],
    detectionMethod: 'JERUSALEM detects Pink Drainer through contract signature analysis, known drainer wallet connections, and behavioral pattern matching against confirmed drainer operations',
    prevalence: 'common',
    firstSeen: 'July 2023',
    relatedThreats: ['ANGEL_DRAINER', 'CLINKSINK', 'APPROVAL_PHISHING', 'EIP2612_PERMIT_EXPLOIT']
  },
  ANGEL_DRAINER: {
    id: 'ANGEL_DRAINER',
    name: 'Angel Drainer (Monkey Drainer Evolution)',
    category: 'critical',
    points: 100,
    shortDescription: 'Evolution of Monkey Drainer, active drainer-as-a-service platform',
    fullDescription: 'Angel Drainer is the successor to the infamous Monkey Drainer operation that was shut down in 2023. Operating as a Drainer-as-a-Service (DaaS) platform, Angel Drainer sells draining infrastructure to scammers for a profit share.',
    howItWorks: 'Angel Drainer provides a complete toolkit for wallet draining including malicious smart contracts, phishing page templates, and automated fund extraction. Scammers pay a subscription fee and receive 20-30% of stolen funds while Angel Drainer takes the majority. The service includes anti-detection features and regularly updates contracts to evade security scanners.',
    realWorldExample: 'Angel Drainer was responsible for draining over $25 million in Q1 2024 alone. One notable case involved a fake Pudgy Penguins claim site that drained 150 ETH ($300K+) from unsuspecting NFT collectors in a single day.',
    protection: [
      'Never connect your wallet to unfamiliar websites',
      'Verify links through official project channels only',
      'Use separate wallets for high-value holdings',
      'Enable transaction simulation in wallet settings',
      'Monitor approved contracts using blockchain explorers'
    ],
    detectionMethod: 'Identified through drainer wallet fingerprinting, contract code similarity analysis, and connection to known DaaS infrastructure wallets',
    prevalence: 'common',
    firstSeen: 'November 2023',
    relatedThreats: ['PINK_DRAINER', 'DRAINER_AS_A_SERVICE', 'APPROVAL_PHISHING']
  },
  CLINKSINK: {
    id: 'CLINKSINK',
    name: 'CLINKSINK Drainer Network',
    category: 'critical',
    points: 100,
    shortDescription: 'Sophisticated multi-chain drainer targeting Ethereum, BSC, and Polygon',
    fullDescription: 'CLINKSINK is a technically advanced wallet draining operation that operates across multiple blockchain networks simultaneously. Unlike single-chain drainers, CLINKSINK can drain assets from Ethereum, Binance Smart Chain, Polygon, and Arbitrum in coordinated attacks.',
    howItWorks: 'CLINKSINK uses cross-chain contract deployment to maximize theft. When a victim connects to a CLINKSINK-controlled site and signs an approval, the drainer checks all connected chains for valuable assets and drains them simultaneously. It specifically targets high-value DeFi positions including staked tokens, LP tokens, and yield farm positions.',
    realWorldExample: 'In March 2024, CLINKSINK drained approximately $12 million from DeFi users who clicked on a fake Chainlink staking announcement. The attack hit users across Ethereum, BSC, and Polygon simultaneously, targeting LINK, USDT, USDC, and various LP tokens.',
    protection: [
      'Use different wallets for different chains',
      'Never sign approvals for unfamiliar contracts',
      'Verify Chainlink announcements only from official sources',
      'Use wallet security extensions like Wallet Guard or Fire',
      'Regularly revoke approvals across all chains'
    ],
    detectionMethod: 'Detected through multi-chain contract pattern recognition, cross-chain wallet clustering, and analysis of coordinated draining behavior',
    prevalence: 'uncommon',
    firstSeen: 'February 2024',
    relatedThreats: ['MULTI_CHAIN_EXPLOIT', 'APPROVAL_PHISHING', 'PINK_DRAINER']
  },
  EIP2612_PERMIT_EXPLOIT: {
    id: 'EIP2612_PERMIT_EXPLOIT',
    name: 'EIP-2612 Permit Signature Exploit',
    category: 'critical',
    points: 95,
    shortDescription: 'Off-chain signature attack bypassing traditional approval flows',
    fullDescription: 'EIP-2612 permit exploits abuse the gasless approval mechanism introduced in EIP-2612. This standard allows users to approve token transfers through off-chain signatures instead of on-chain transactions, saving gas. However, malicious sites trick users into signing permits that grant attackers unlimited token access.',
    howItWorks: 'The attack presents users with what appears to be a free or gasless transaction (like claiming an airdrop or voting). However, the signature actually contains a permit() call granting the attacker unlimited approval to spend the victim\'s tokens. Because it\'s an off-chain signature, it doesn\'t trigger normal wallet warnings and doesn\'t cost gas, making victims less suspicious.',
    realWorldExample: 'In January 2024, over $2 million in USDC was stolen through fake governance voting sites using EIP-2612 permit exploits. Victims believed they were voting on protocol proposals, but were actually signing permits allowing attackers to drain their stablecoin holdings.',
    protection: [
      'Read signature messages carefully - look for "permit" function calls',
      'Be suspicious of gasless transactions from unknown sources',
      'Use wallets that decode signature data (MetaMask, Rainbow, etc.)',
      'Never sign permits for unfamiliar contracts',
      'Verify governance proposals through official DAO channels'
    ],
    detectionMethod: 'Identified by analyzing contract ABI for permit() functions, monitoring off-chain signature requests, and tracking known permit phishing domains',
    prevalence: 'common',
    firstSeen: 'September 2023',
    relatedThreats: ['APPROVAL_PHISHING', 'SIGNATURE_PHISHING', 'GASLESS_APPROVAL_SCAM']
  },
  APPROVAL_PHISHING: {
    id: 'APPROVAL_PHISHING',
    name: 'Token Approval Phishing',
    category: 'critical',
    points: 90,
    shortDescription: 'Malicious sites tricking users into approving unlimited token spending',
    fullDescription: 'Approval phishing is one of the most common cryptocurrency scams. Attackers create fake DeFi websites that request unlimited token approvals, then drain approved tokens after the user leaves the site.',
    howItWorks: 'When users interact with legitimate DeFi protocols, they must approve token spending (e.g., allowing Uniswap to spend your USDT for swaps). Approval phishing sites abuse this by requesting unlimited approvals (2^256-1 tokens) for malicious contracts. Once approved, attackers can drain all approved tokens at any time, even months later.',
    realWorldExample: 'A fake yield farming site promising 1000% APY scammed users out of $8 million in stablecoins in 2023. Victims approved unlimited USDT/USDC spending, and the attackers drained funds days later when the site disappeared.',
    protection: [
      'Never approve unlimited token spending - use exact amounts when possible',
      'Regularly check and revoke approvals using Revoke.cash or Etherscan',
      'Only interact with verified, audited DeFi protocols',
      'Use wallet extensions that flag dangerous approvals',
      'Be suspicious of unusually high yields or new protocols'
    ],
    detectionMethod: 'Detected through analysis of approval amounts (unlimited vs. exact), contract verification status, and correlation with known phishing domains',
    prevalence: 'very_common',
    firstSeen: 'Early DeFi era (2019-2020)',
    relatedThreats: ['UNLIMITED_APPROVAL', 'FAKE_DEFI_SITE', 'RUG_PULL']
  },
  HONEYPOT: {
    id: 'HONEYPOT',
    name: 'Honeypot Contract',
    category: 'critical',
    points: 85,
    shortDescription: 'Token contracts that allow buying but prevent selling',
    fullDescription: 'Honeypot contracts are malicious token implementations that allow users to buy tokens but prevent them from selling. The restriction is hidden in the contract code, often using complex logic that only activates after launch.',
    howItWorks: 'Honeypot tokens use various mechanisms to block sells: blacklisting specific addresses, requiring ownership of a "key" token, pausing trading selectively, or implementing buy/sell tax logic that makes sells impossible. Scammers pump the price, trick users into buying, then reveal the selling restriction while dumping their own supply through a backdoor.',
    realWorldExample: 'The Squid Game token (SQUID) in 2021 was a famous honeypot that reached $2,856 before collapsing to $0. Users could buy but not sell, while creators cashed out $3.38 million. The contract had hidden anti-sell mechanisms that weren\'t disclosed.',
    protection: [
      'Always check contract code on blockchain explorers before buying',
      'Use honeypot detection tools like Token Sniffer or Honeypot.is',
      'Test with small amounts first on low-cap tokens',
      'Avoid tokens with: no verified contract, anonymous teams, or locked liquidity <30 days',
      'Check for unusual buy/sell tax differences (e.g., 1% buy, 99% sell)'
    ],
    detectionMethod: 'JERUSALEM uses GoPlus Security API to simulate sell transactions and detect contracts that reject sells, as well as analyzing contract code for common honeypot patterns',
    prevalence: 'very_common',
    firstSeen: 'DeFi Summer 2020',
    relatedThreats: ['TRADING_RESTRICTIONS', 'HIDDEN_OWNER', 'RUG_PULL']
  },
  HIDDEN_OWNER: {
    id: 'HIDDEN_OWNER',
    name: 'Hidden Owner Functions',
    category: 'critical',
    points: 80,
    shortDescription: 'Contract owners with hidden ability to modify balances or pause trading',
    fullDescription: 'Hidden owner vulnerabilities occur when smart contracts contain privileged functions that allow owners to manipulate balances, pause trading, or extract funds without user knowledge or consent.',
    howItWorks: 'Scammers deploy tokens with hidden owner functions like: mint unlimited tokens (diluting holders), burn tokens from any address, pause trading selectively, modify balances, or blacklist addresses. These functions are often obfuscated in the contract code or inherited from proxy contracts, making them difficult to detect without deep analysis.',
    realWorldExample: 'In 2023, the "SafeMoon V2" controversy revealed hidden tax functions that allowed the owner to increase sell tax to 100%, effectively preventing all sells. The team modified taxes retroactively, trapping holders.',
    protection: [
      'Only invest in tokens with renounced ownership or timelock contracts',
      'Check for proxy contracts that could hide malicious functions',
      'Look for multi-signature wallets controlling the contract',
      'Avoid tokens where a single address holds >10% of supply',
      'Use contract analyzers to identify owner privileges'
    ],
    detectionMethod: 'Detected by parsing contract functions for owner/admin privileges, checking ownership renouncement, and analyzing proxy implementation contracts',
    prevalence: 'common',
    firstSeen: '2020',
    relatedThreats: ['PROXY_CONTRACT', 'CENTRALIZATION_RISK', 'RUG_PULL']
  },
  RUG_PULL: {
    id: 'RUG_PULL',
    name: 'Liquidity Rug Pull',
    category: 'critical',
    points: 75,
    shortDescription: 'Developers draining liquidity pool, making tokens worthless',
    fullDescription: 'A rug pull occurs when developers remove liquidity from a trading pool, causing the token price to crash to near-zero and leaving holders unable to sell. This is one of the most devastating DeFi scams.',
    howItWorks: 'Scammers create a token, add liquidity to a DEX (like Uniswap), and promote it heavily to attract buyers. Once enough liquidity is accumulated from trading fees and additional LPs, they remove all liquidity by calling removeLiquidity() or using a backdoor function. The token becomes worthless instantly as there\'s no liquidity to sell into.',
    realWorldExample: 'Thodex, a Turkish cryptocurrency exchange, performed a $2 billion rug pull in 2021, with the CEO fleeing the country. In DeFi, the Meerkat Finance rug pull on BSC stole $31 million in 2021 within hours of launch.',
    protection: [
      'Check if liquidity is locked using tools like Unicrypt or Team Finance',
      'Verify lock duration (minimum 6-12 months for serious projects)',
      'Check developer token holdings and vesting schedules',
      'Look for audited contracts from reputable firms',
      'Avoid projects with anonymous teams and no social presence',
      'Monitor liquidity pool health on DEX analytics sites'
    ],
    detectionMethod: 'Detected by monitoring liquidity lock status, analyzing LP token ownership, tracking sudden liquidity removals, and checking for rug pull indicators like unlocked liquidity or concentrated ownership',
    prevalence: 'very_common',
    firstSeen: '2020 DeFi Summer',
    relatedThreats: ['LIQUIDITY_DRAIN', 'EXIT_SCAM', 'DEVELOPER_DUMP']
  },
  CREATE2_EVASION: {
    id: 'CREATE2_EVASION',
    name: 'CREATE2 Address Evasion',
    category: 'critical',
    points: 70,
    shortDescription: 'Using CREATE2 to deploy contracts at predictable addresses to evade blacklists',
    fullDescription: 'CREATE2 is an Ethereum opcode that allows deploying contracts to deterministic addresses. Scammers abuse this to redeploy malicious contracts at new addresses after being blacklisted, or to deploy honeypots that appear legitimate initially.',
    howItWorks: 'Attackers use CREATE2 to deploy a benign contract at address A, get it whitelisted/verified, then selfdestruct it and redeploy malicious code at the same address. They can also pre-compute addresses, deploy scam contracts, and when blacklisted, selfdesctruct and redeploy at a new predicted address, evading detection systems that rely on address blocking.',
    realWorldExample: 'In 2023, a CREATE2-based rug pull scheme on Polygon allowed scammers to deploy 50+ honeypot tokens at predictable addresses. When one was detected and blacklisted, they immediately deployed the next in the sequence.',
    protection: [
      'Don\'t trust contracts solely based on address - verify current code',
      'Check contract creation method and age before interacting',
      'Use security tools that analyze contract bytecode, not just addresses',
      'Be wary of newly deployed contracts (< 7 days old)',
      'Verify contract code matches the claimed source code'
    ],
    detectionMethod: 'JERUSALEM detects CREATE2 usage patterns, monitors contract redeployments at similar addresses, and flags suspicious contract creation methods',
    prevalence: 'uncommon',
    firstSeen: '2023',
    relatedThreats: ['CONTRACT_REDEPLOYMENT', 'SELFDESTRUCT_ABUSE', 'ADDRESS_POISONING']
  },
  SOLANA_DRAINER: {
    id: 'SOLANA_DRAINER',
    name: 'Solana-Specific Wallet Drainer',
    category: 'critical',
    points: 65,
    shortDescription: 'Wallet drainers exploiting Solana\'s unique transaction structure',
    fullDescription: 'Solana drainers exploit the unique characteristics of Solana\'s blockchain architecture, including program derived addresses (PDAs), transaction versioning, and the ability to bundle multiple instructions in a single transaction.',
    howItWorks: 'Unlike Ethereum drainers that rely on ERC-20 approvals, Solana drainers abuse Phantom/Solflare wallet signing by bundling malicious transfer instructions with legitimate-looking operations. They exploit Solana\'s memo program to hide malicious transfers, use versioned transactions to obscure activity, and target SPL tokens, NFTs, and SOL in a single transaction.',
    realWorldExample: 'In December 2023, a fake Solana NFT marketplace drained over 4,000 SOL ($400K+) by tricking users into signing transactions that transferred all SPL tokens and NFTs to attacker wallets while appearing to list items for sale.',
    protection: [
      'Always review transaction details in Phantom before signing',
      'Use Solana simulation tools to preview transaction effects',
      'Only connect wallets to verified dApps with official domains',
      'Enable transaction warnings in wallet settings',
      'Use separate wallets for high-value NFTs and tokens'
    ],
    detectionMethod: 'Detected through Solana transaction simulation, PDA analysis, and monitoring for suspicious multi-instruction bundles characteristic of drainer operations',
    prevalence: 'common',
    firstSeen: 'Late 2022',
    relatedThreats: ['NFT_DRAINER', 'TRANSACTION_BUNDLING', 'SIGNATURE_PHISHING']
  },
  DRAINER_AS_A_SERVICE: {
    id: 'DRAINER_AS_A_SERVICE',
    name: 'Drainer-as-a-Service (DaaS)',
    category: 'critical',
    points: 60,
    shortDescription: 'Commercial platforms selling wallet draining infrastructure',
    fullDescription: 'Drainer-as-a-Service platforms provide complete wallet draining infrastructure to scammers for a profit share. These platforms democratize sophisticated attacks, making them accessible to non-technical criminals.',
    howItWorks: 'DaaS providers offer subscription services ($300-1000/month) including: malicious smart contracts, phishing page templates, anti-detection features, customer support, and automated fund distribution. Scammers receive 20-40% of stolen funds while the DaaS operator takes the majority. The service includes regular updates to evade security measures.',
    realWorldExample: 'Inferno Drainer, one of the largest DaaS platforms, facilitated over $80 million in thefts before shutting down in late 2023. It powered hundreds of phishing sites including fake NFT mints, airdrop claims, and DeFi frontends.',
    protection: [
      'Use wallet security extensions that detect known drainer contracts',
      'Only connect wallets to verified, official project websites',
      'Bookmark legitimate DeFi sites and only use bookmarks',
      'Enable advanced transaction simulation in wallet settings',
      'Report suspicious sites to security platforms'
    ],
    detectionMethod: 'Identified through infrastructure fingerprinting, contract code similarity across multiple deployments, and wallet clustering showing profit-sharing patterns',
    prevalence: 'common',
    firstSeen: '2023',
    relatedThreats: ['PINK_DRAINER', 'ANGEL_DRAINER', 'INFERNO_DRAINER']
  },
  // Add more threat types here...
};

// Simpler list for encyclopedia page
export const THREAT_CATEGORIES = {
  critical: {
    title: '2025 Advanced Drainers & Critical Exploits',
    description: 'Sophisticated attacks causing maximum damage',
    color: 'red'
  },
  high: {
    title: 'High-Risk Scams & Vulnerabilities',
    description: 'Serious threats requiring immediate attention',
    color: 'orange'
  },
  medium: {
    title: 'Medium-Risk Issues',
    description: 'Notable security concerns',
    color: 'yellow'
  },
  low: {
    title: 'Low-Risk Indicators',
    description: 'Minor red flags and warnings',
    color: 'blue'
  }
};
