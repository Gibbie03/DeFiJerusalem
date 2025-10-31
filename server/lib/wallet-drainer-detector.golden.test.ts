import { describe, it, expect, beforeEach } from 'vitest';
import { WalletDrainerDetector } from './wallet-drainer-detector';

let detector: WalletDrainerDetector;

beforeEach(() => {
  detector = new WalletDrainerDetector();
});

describe('Golden Sample Malicious Dataset Tests', () => {
  describe('Real 2024-2025 Attack Patterns', () => {
    it('should detect Angel Drainer CREATE2 evasion campaign', async () => {
      const result = await detector.scanDApp({
        id: 'malicious-1',
        name: 'Free ETH Claim',
        description: 'Claim your FREE ETH now! Click to bypass wallet protection and evade blocklist using fresh contract addresses. Limited time offer!',
        chains: ['ethereum'],
        tvl: 50000,
        logo: '',
        url: 'https://eth-claim-now.xyz',
        category: 'Airdrop',
      });

      expect(result.severity).toBe('CRITICAL');
      expect(result.score).toBeGreaterThanOrEqual(80);
      expect(result.threats.some(t => t.type === 'CREATE2_EVASION')).toBe(true);
    });

    it('should detect EIP-2612 permit signature phishing', async () => {
      const result = await detector.scanDApp({
        id: 'malicious-2',
        name: 'Uniswap V4 Airdrop',
        description: 'URGENT: Sign this gasless claim permit to receive your Uniswap V4 tokens before the deadline expires! Free airdrop for early supporters.',
        chains: ['ethereum'],
        tvl: 100000,
        logo: '',
        url: 'https://uniswap-v4-claim.com',
        category: 'Airdrop',
      });

      expect(result.severity).toBe('CRITICAL');
      expect(result.score).toBeGreaterThanOrEqual(80);
      expect(result.threats.some(t => t.type === 'PERMIT_SIGNATURE_EXPLOIT')).toBe(true);
    });

    it('should detect unlimited approval phishing attack', async () => {
      const result = await detector.scanDApp({
        id: 'malicious-3',
        name: 'Token Bridge',
        description: 'Bridge your tokens instantly! Click here to grant unlimited access to your wallet for seamless cross-chain transfers. Approve all tokens now!',
        chains: ['ethereum', 'bsc'],
        tvl: 200000,
        logo: '',
        url: 'https://instant-bridge.io',
        category: 'Bridge',
      });

      expect(result.severity).toBe('CRITICAL');
      expect(result.score).toBeGreaterThanOrEqual(80);
      expect(result.threats.some(t => t.type === 'APPROVAL_PHISHING')).toBe(true);
    });

    it('should detect CLINKSINK Solana drainer operation', async () => {
      const result = await detector.scanDApp({
        id: 'malicious-4',
        name: 'Solana NFT Minter',
        description: 'Mint exclusive NFTs using SPL token delegation for automatic payment processing. Base64 transaction signing for Phantom wallet users.',
        chains: ['solana'],
        tvl: 75000,
        logo: '',
        url: 'https://sol-nft-mint.com',
        category: 'NFT',
      });

      expect(result.severity).toBe('CRITICAL');
      expect(result.score).toBeGreaterThanOrEqual(80);
      expect(result.threats.some(t => t.type === 'SOLANA_DRAINER')).toBe(true);
    });

    it('should detect drainer infrastructure fingerprinting', async () => {
      const result = await detector.scanDApp({
        id: 'malicious-5',
        name: 'Portfolio Tracker Pro',
        description: 'Advanced wallet balance enumeration and asset valuation. Bypass Wallet Guard and Blockaid detection for accurate portfolio tracking.',
        chains: ['ethereum'],
        tvl: 30000,
        logo: '',
        url: 'https://portfolio-pro.app',
        category: 'Tools',
      });

      expect(result.severity).toBe('CRITICAL');
      expect(result.score).toBeGreaterThanOrEqual(80);
      expect(result.threats.some(t => t.type === 'DRAINER_FINGERPRINT')).toBe(true);
    });

    it('should detect combined multi-vector attack', async () => {
      const result = await detector.scanDApp({
        id: 'malicious-6',
        name: 'DeFi Yield Optimizer',
        description: 'URGENT! Claim your rewards by signing this permit signature. Approve unlimited tokens for automatic compounding. Using drainer kit with 20% commission structure.',
        chains: ['ethereum'],
        tvl: 150000,
        logo: '',
        url: 'https://defi-yield-max.com',
        category: 'Yield',
      });

      expect(result.severity).toBe('CRITICAL');
      expect(result.score).toBeGreaterThanOrEqual(100);
      
      const criticalThreats = result.threats.filter(t => t.severity === 'CRITICAL');
      expect(criticalThreats.length).toBeGreaterThanOrEqual(2);
      
      const threatTypes = result.threats.map(t => t.type);
      const hasDrainerIndicators = threatTypes.some(type => 
        type === 'PERMIT_SIGNATURE_EXPLOIT' || 
        type === 'APPROVAL_PHISHING' ||
        type === 'DRAINER_PRICING_MODEL'
      );
      expect(hasDrainerIndicators).toBe(true);
    });

    it('should detect typosquatting imposter (Aave variant)', async () => {
      const result = await detector.scanDApp({
        id: 'malicious-7',
        name: 'Aavee Finance',
        description: 'Lending and borrowing protocol with high APY rewards',
        chains: ['ethereum'],
        tvl: 500000,
        logo: '',
        url: 'https://aavee-finance.com',
        category: 'Lending',
      });

      expect(result.threats.some(t => t.type === 'IMPOSTER')).toBe(true);
      expect(result.score).toBeGreaterThan(50);
    });

    it('should detect fake airdrop with urgency tactics', async () => {
      const result = await detector.scanDApp({
        id: 'malicious-8',
        name: 'Official Ethereum Foundation Airdrop',
        description: 'URGENT: Claim your free ETH airdrop! Exclusive giveaway for early supporters. Limited slots - act now before it expires!',
        chains: ['ethereum'],
        tvl: 25000,
        logo: '',
        url: 'https://eth-foundation-airdrop.net',
        category: 'Airdrop',
      });

      expect(result.severity).toBe('CRITICAL');
      expect(result.threats.some(t => 
        t.type === 'FAKE_AIRDROP' || t.type === 'PHISHING'
      )).toBe(true);
    });

    it('should detect private key phishing scam', async () => {
      const result = await detector.scanDApp({
        id: 'malicious-9',
        name: 'Wallet Recovery Service',
        description: 'Recover your lost funds! Enter your seed phrase and private keys for instant wallet restoration. 24/7 support available.',
        chains: ['ethereum'],
        tvl: 10000,
        logo: '',
        url: 'https://wallet-recovery-pro.com',
        category: 'Tools',
      });

      expect(result.severity).toBe('CRITICAL');
      expect(result.threats.some(t => t.type === 'PRIVATE_KEY_PHISHING')).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(80);
    });

    it('should detect Ponzi/pyramid scheme tokenomics', async () => {
      const result = await detector.scanDApp({
        id: 'malicious-10',
        name: 'ForeverROI Protocol',
        description: 'Earn guaranteed 500% APY! Multi-level marketing rewards program. Recruit friends to earn passive income. Pyramid structure with tier system.',
        chains: ['bsc'],
        tvl: 1000000,
        logo: '',
        url: 'https://forever-roi.finance',
        category: 'Yield',
      });

      expect(result.severity).toBe('CRITICAL');
      expect(result.threats.some(t => t.type === 'PONZI_TOKENOMICS')).toBe(true);
    });
  });

  describe('Context-Aware False Positive Prevention', () => {
    it('should NOT flag educational content about permit signatures', async () => {
      const result = await detector.scanDApp({
        id: 'educational-1',
        name: 'DeFi Security Academy',
        description: 'Learn about EIP-2612 permit signatures and gasless approvals. Educational platform teaching developers about smart contract security best practices.',
        chains: ['ethereum'],
        tvl: 0,
        logo: '',
        url: 'https://defi-academy-edu.org',
        category: 'Education',
      });

      expect(result.threats.some(t => t.type === 'PERMIT_SIGNATURE_EXPLOIT')).toBe(false);
      expect(result.severity).not.toBe('CRITICAL');
    });

    it('should NOT flag legitimate CREATE2 factory documentation', async () => {
      const result = await detector.scanDApp({
        id: 'educational-2',
        name: 'Smart Contract Patterns',
        description: 'Documentation about CREATE2 opcode for deterministic address generation. Learn how to deploy contracts with predictable addresses using factory patterns.',
        chains: ['ethereum'],
        tvl: 0,
        logo: '',
        url: 'https://eth-docs.io',
        category: 'Documentation',
      });

      expect(result.threats.some(t => t.type === 'CREATE2_EVASION')).toBe(false);
    });

    it('should NOT flag legitimate exchange commission structures', async () => {
      const result = await detector.scanDApp({
        id: 'legitimate-exchange',
        name: 'CryptoSwap DEX',
        description: 'Decentralized exchange with 0.3% trading fee. Referral program offers 20% commission on fees. Professional market making and liquidity pools.',
        chains: ['ethereum'],
        tvl: 50000000,
        logo: '',
        url: 'https://cryptoswap.io',
        category: 'DEX',
      });

      expect(result.threats.some(t => t.type === 'DRAINER_PRICING_MODEL')).toBe(false);
      expect(result.severity).not.toBe('CRITICAL');
    });

    it('should NOT flag Solana educational content on non-Solana chains', async () => {
      const result = await detector.scanDApp({
        id: 'educational-3',
        name: 'Cross-Chain Documentation',
        description: 'Multi-chain developer docs covering Ethereum, Solana, and Polygon. Learn about SPL tokens, ERC20 standards, and cross-chain bridges.',
        chains: ['ethereum'],
        tvl: 0,
        logo: '',
        url: 'https://multichain-docs.dev',
        category: 'Documentation',
      });

      expect(result.threats.some(t => t.type === 'SOLANA_DRAINER')).toBe(false);
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle low TVL high-risk protocols', async () => {
      const result = await detector.scanDApp({
        id: 'edge-1',
        name: 'Pink Drainer Service',
        description: 'Professional draining service',
        chains: ['ethereum'],
        tvl: 0,
        logo: '',
        url: 'https://drainer.xyz',
        category: 'Unknown',
      });

      expect(result.severity).toBe('CRITICAL');
      expect(result.threats.some(t => t.type === 'NAMED_DRAINER_OPERATION')).toBe(true);
    });

    it('should handle mixed legitimate and malicious signals', async () => {
      const result = await detector.scanDApp({
        id: 'edge-2',
        name: 'MegaYield Protocol',
        description: 'High APY yield farming with audited smart contracts. Claim rewards by approving unlimited tokens for gas optimization.',
        chains: ['ethereum'],
        tvl: 10000000,
        logo: '',
        url: 'https://megayield.finance',
        category: 'Yield',
        audited: true,
        auditCount: 1,
      });

      const hasApprovalThreat = result.threats.some(t => t.type === 'APPROVAL_PHISHING');
      
      if (hasApprovalThreat) {
        expect(result.severity).not.toBe('CRITICAL');
      }
    });

    it('should detect threats even with high TVL (new scam)', async () => {
      const result = await detector.scanDApp({
        id: 'edge-3',
        name: 'Flash Finance',
        description: 'URGENT: Angel Drainer operation - bypass wallet protection now! Limited time offer for exclusive access.',
        chains: ['ethereum'],
        tvl: 100000000,
        logo: '',
        url: 'https://flash-finance.com',
        category: 'Lending',
      });

      expect(result.threats.some(t => 
        t.type === 'NAMED_DRAINER_OPERATION' || t.type === 'CREATE2_EVASION'
      )).toBe(true);
    });

    it('should handle protocols with no description', async () => {
      const result = await detector.scanDApp({
        id: 'edge-4',
        name: 'Pink Drainer',
        description: '',
        chains: ['ethereum'],
        tvl: 1000,
        logo: '',
        url: '',
        category: 'Unknown',
      });

      expect(result.threats.some(t => t.type === 'NAMED_DRAINER_OPERATION')).toBe(true);
    });

    it('should aggregate scores correctly for multiple threats', async () => {
      const result = await detector.scanDApp({
        id: 'edge-5',
        name: 'ScamProtocol',
        description: 'Pink Drainer operation with urgent permit signature and unlimited approval required. Bypass wallet protection using CREATE2 evasion.',
        chains: ['ethereum'],
        tvl: 10000,
        logo: '',
        url: 'https://scam.xyz',
        category: 'Scam',
      });

      expect(result.score).toBeGreaterThanOrEqual(100);
      expect(result.severity).toBe('CRITICAL');
      expect(result.isBlacklisted).toBe(true);
      
      const criticalThreats = result.threats.filter(t => t.severity === 'CRITICAL');
      expect(criticalThreats.length).toBeGreaterThanOrEqual(3);
    });
  });
});
