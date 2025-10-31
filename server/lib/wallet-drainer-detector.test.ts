import { describe, it, expect, beforeEach } from 'vitest';
import { WalletDrainerDetector } from './wallet-drainer-detector';

let detector: WalletDrainerDetector;

beforeEach(() => {
  detector = new WalletDrainerDetector();
});

describe('2025 Advanced Wallet Drainer Detection', () => {
  describe('Named Drainer Operations', () => {
    it('should detect Pink Drainer references', async () => {
      const result = await detector.scanDApp({
        id: 'test-1',
        name: 'Pink Drainer Operation',
        description: 'Token distribution',
        chains: ['ethereum'],
        tvl: 1000000,
        logo: '',
        url: 'https://example.com',
        category: 'test',
      });

      expect(result.score).toBeGreaterThanOrEqual(100);
      expect(result.threats.some(t => t.type === 'NAMED_DRAINER_OPERATION')).toBe(true);
      expect(result.threats.some(t => t.message.includes('$494M'))).toBe(true);
    });

    it('should detect Angel Drainer references', async () => {
      const result = await detector.scanDApp({
        id: 'test-2',
        name: 'Test Protocol',
        description: 'Using Angel Drainer techniques',
        chains: ['ethereum'],
        tvl: 1000000,
        logo: '',
        url: 'https://example.com',
        category: 'test',
      });

      expect(result.score).toBeGreaterThanOrEqual(100);
      expect(result.threats.some(t => t.type === 'NAMED_DRAINER_OPERATION')).toBe(true);
    });

    it('should detect CLINKSINK (Solana drainer)', async () => {
      const result = await detector.scanDApp({
        id: 'test-3',
        name: 'Test Protocol',
        description: 'CLINKSINK operation detected',
        chains: ['solana'],
        tvl: 1000000,
        logo: '',
        url: 'https://example.com',
        category: 'test',
      });

      expect(result.score).toBeGreaterThanOrEqual(100);
      expect(result.threats.some(t => t.type === 'NAMED_DRAINER_OPERATION')).toBe(true);
    });
  });

  describe('EIP-2612 Permit Signature Exploits', () => {
    it('should detect urgent permit signature phishing', async () => {
      const result = await detector.scanDApp({
        id: 'test-4',
        name: 'Urgent Claim',
        description: 'Sign this urgent permit signature to claim your tokens now!',
        chains: ['ethereum'],
        tvl: 1000000,
        logo: '',
        url: 'https://example.com',
        category: 'test',
      });

      expect(result.score).toBeGreaterThanOrEqual(95);
      expect(result.threats.some(t => t.type === 'PERMIT_SIGNATURE_EXPLOIT')).toBe(true);
      expect(result.threats.some(t => t.message.includes('56.7%'))).toBe(true);
    });

    it('should detect gasless claim permit scams', async () => {
      const result = await detector.scanDApp({
        id: 'test-5',
        name: 'Free Airdrop',
        description: 'Gasless claim permit - get your free tokens',
        chains: ['ethereum'],
        tvl: 1000000,
        logo: '',
        url: 'https://example.com',
        category: 'test',
      });

      expect(result.score).toBeGreaterThanOrEqual(95);
      expect(result.threats.some(t => t.type === 'PERMIT_SIGNATURE_EXPLOIT')).toBe(true);
    });

    it('should NOT detect legitimate EIP-2612 documentation', async () => {
      const result = await detector.scanDApp({
        id: 'test-6',
        name: 'Uniswap Documentation',
        description: 'Learn about EIP-2612 permit signatures for gasless approvals. Technical guide for developers.',
        chains: ['ethereum'],
        tvl: 1000000000,
        logo: '',
        url: 'https://uniswap.org',
        category: 'DEX',
      });

      expect(result.threats.some(t => t.type === 'PERMIT_SIGNATURE_EXPLOIT')).toBe(false);
    });
  });

  describe('Approval Phishing Detection', () => {
    it('should detect urgent unlimited approval requests', async () => {
      const result = await detector.scanDApp({
        id: 'test-7',
        name: 'Token Swap',
        description: 'Click here to approve unlimited tokens now for instant swap!',
        chains: ['ethereum'],
        tvl: 1000000,
        logo: '',
        url: 'https://example.com',
        category: 'test',
      });

      expect(result.score).toBeGreaterThanOrEqual(95);
      expect(result.threats.some(t => t.type === 'APPROVAL_PHISHING')).toBe(true);
      expect(result.threats.some(t => t.message.includes('$1 billion'))).toBe(true);
    });

    it('should detect claim with approve all patterns', async () => {
      const result = await detector.scanDApp({
        id: 'test-8',
        name: 'Airdrop Claim',
        description: 'Claim your airdrop - approve all tokens for automatic distribution',
        chains: ['ethereum'],
        tvl: 1000000,
        logo: '',
        url: 'https://example.com',
        category: 'test',
      });

      expect(result.score).toBeGreaterThanOrEqual(95);
      expect(result.threats.some(t => t.type === 'APPROVAL_PHISHING')).toBe(true);
    });

    it('should NOT detect legitimate approval explanations', async () => {
      const result = await detector.scanDApp({
        id: 'test-9',
        name: 'Aave Protocol',
        description: 'Decentralized lending protocol. Users can deposit and borrow assets. Standard ERC20 approvals used for token transfers.',
        chains: ['ethereum'],
        tvl: 5000000000,
        logo: '',
        url: 'https://aave.com',
        category: 'Lending',
      });

      expect(result.threats.some(t => t.type === 'APPROVAL_PHISHING')).toBe(false);
    });
  });

  describe('CREATE2 Address Evasion', () => {
    it('should detect blocklist evasion techniques', async () => {
      const result = await detector.scanDApp({
        id: 'test-10',
        name: 'Smart Contract',
        description: 'Advanced contract that evades blocklists using fresh addresses',
        chains: ['ethereum'],
        tvl: 1000000,
        logo: '',
        url: 'https://example.com',
        category: 'test',
      });

      expect(result.score).toBeGreaterThanOrEqual(90);
      expect(result.threats.some(t => t.type === 'CREATE2_EVASION')).toBe(true);
    });

    it('should detect wallet protection bypass', async () => {
      const result = await detector.scanDApp({
        id: 'test-11',
        name: 'Contract Factory',
        description: 'Bypass wallet protection mechanisms',
        chains: ['ethereum'],
        tvl: 1000000,
        logo: '',
        url: 'https://example.com',
        category: 'test',
      });

      expect(result.score).toBeGreaterThanOrEqual(90);
      expect(result.threats.some(t => t.type === 'CREATE2_EVASION')).toBe(true);
    });

    it('should NOT detect legitimate CREATE2 contract factories', async () => {
      const result = await detector.scanDApp({
        id: 'test-12',
        name: 'Gnosis Safe Factory',
        description: 'CREATE2 deterministic address generation for smart contract wallets. Factory contract for deploying Safes.',
        chains: ['ethereum'],
        tvl: 2000000000,
        logo: '',
        url: 'https://gnosis-safe.io',
        category: 'Wallet',
      });

      expect(result.threats.some(t => t.type === 'CREATE2_EVASION')).toBe(false);
    });
  });

  describe('Solana-Specific Drainer Detection', () => {
    it('should detect SPL token delegation exploits on Solana', async () => {
      const result = await detector.scanDApp({
        id: 'test-13',
        name: 'Solana Token Claim',
        description: 'Claim tokens using SPL token delegation for automatic distribution',
        chains: ['solana'],
        tvl: 1000000,
        logo: '',
        url: 'https://example.com',
        category: 'test',
      });

      expect(result.score).toBeGreaterThanOrEqual(95);
      expect(result.threats.some(t => t.type === 'SOLANA_DRAINER')).toBe(true);
      expect(result.threats.some(t => t.severity === 'CRITICAL')).toBe(true);
    });

    it('should detect PDA manipulation on Solana', async () => {
      const result = await detector.scanDApp({
        id: 'test-14',
        name: 'Phantom Wallet Exploit',
        description: 'Using program derived address manipulation for token transfers',
        chains: ['solana'],
        tvl: 1000000,
        logo: '',
        url: 'https://example.com',
        category: 'test',
      });

      expect(result.score).toBeGreaterThanOrEqual(95);
      expect(result.threats.some(t => t.type === 'SOLANA_DRAINER')).toBe(true);
    });

    it('should NOT detect Solana patterns on non-Solana chains', async () => {
      const result = await detector.scanDApp({
        id: 'test-15',
        name: 'Ethereum Protocol',
        description: 'SPL token documentation for developers',
        chains: ['ethereum'],
        tvl: 1000000,
        logo: '',
        url: 'https://example.com',
        category: 'DEX',
      });

      expect(result.threats.some(t => t.type === 'SOLANA_DRAINER')).toBe(false);
    });

    it('should detect Solana drainers when description mentions Solana keywords', async () => {
      const result = await detector.scanDApp({
        id: 'test-16',
        name: 'Cross-Chain Bridge',
        description: 'Using SPL token delegation to automatically transfer Solana assets',
        chains: ['ethereum'],
        tvl: 1000000,
        logo: '',
        url: 'https://example.com',
        category: 'test',
      });

      expect(result.score).toBeGreaterThanOrEqual(90);
      expect(result.threats.some(t => t.type === 'SOLANA_DRAINER')).toBe(true);
    });
  });

  describe('Drainer Infrastructure Fingerprinting', () => {
    it('should detect wallet balance enumeration', async () => {
      const result = await detector.scanDApp({
        id: 'test-17',
        name: 'Portfolio Tracker',
        description: 'Wallet balance enumeration script for asset prioritization',
        chains: ['ethereum'],
        tvl: 1000000,
        logo: '',
        url: 'https://example.com',
        category: 'test',
      });

      expect(result.score).toBeGreaterThanOrEqual(100);
      expect(result.threats.some(t => t.type === 'DRAINER_FINGERPRINT')).toBe(true);
    });

    it('should detect simulation bypass techniques', async () => {
      const result = await detector.scanDApp({
        id: 'test-18',
        name: 'DApp Interface',
        description: 'Bypass Wallet Guard detection for seamless transactions',
        chains: ['ethereum'],
        tvl: 1000000,
        logo: '',
        url: 'https://example.com',
        category: 'test',
      });

      expect(result.score).toBeGreaterThanOrEqual(100);
      expect(result.threats.some(t => t.type === 'DRAINER_FINGERPRINT')).toBe(true);
    });

    it('should detect bit-flip attacks', async () => {
      const result = await detector.scanDApp({
        id: 'test-19',
        name: 'Advanced Trading',
        description: 'Using bit-flip attack for transaction manipulation',
        chains: ['ethereum'],
        tvl: 1000000,
        logo: '',
        url: 'https://example.com',
        category: 'test',
      });

      expect(result.score).toBeGreaterThanOrEqual(100);
      expect(result.threats.some(t => t.type === 'DRAINER_FINGERPRINT')).toBe(true);
    });
  });

  describe('Drainer-as-a-Service (DaaS) Detection', () => {
    it('should detect drainer pricing models', async () => {
      const result = await detector.scanDApp({
        id: 'test-20',
        name: 'Crypto Service',
        description: 'Wallet drainer kit with 20% commission - monthly subscription available',
        chains: ['ethereum'],
        tvl: 1000000,
        logo: '',
        url: 'https://example.com',
        category: 'test',
      });

      expect(result.score).toBeGreaterThanOrEqual(90);
      expect(result.threats.some(t => t.type === 'DRAINER_PRICING_MODEL')).toBe(true);
    });

    it('should detect drainer subscription models', async () => {
      const result = await detector.scanDApp({
        id: 'test-21',
        name: 'Crypto Tools',
        description: 'Get our drainer subscription for $5000 upfront',
        chains: ['ethereum'],
        tvl: 1000000,
        logo: '',
        url: 'https://example.com',
        category: 'test',
      });

      expect(result.score).toBeGreaterThanOrEqual(90);
      expect(result.threats.some(t => t.type === 'DRAINER_PRICING_MODEL')).toBe(true);
    });

    it('should NOT detect legitimate exchange commission structures', async () => {
      const result = await detector.scanDApp({
        id: 'test-22',
        name: 'Binance DEX',
        description: 'Decentralized exchange with 0.2% trading fee and 20% commission for affiliates. Premium subscription available.',
        chains: ['ethereum'],
        tvl: 10000000000,
        logo: '',
        url: 'https://binance.org',
        category: 'DEX',
      });

      expect(result.threats.some(t => t.type === 'DRAINER_PRICING_MODEL')).toBe(false);
    });
  });

  describe('Dormant Approval Exploitation', () => {
    it('should detect dormant approval exploitation patterns', async () => {
      const result = await detector.scanDApp({
        id: 'test-23',
        name: 'Token Recovery',
        description: 'Exploiting dormant approvals from old transactions - up to 458 days',
        chains: ['ethereum'],
        tvl: 1000000,
        logo: '',
        url: 'https://example.com',
        category: 'test',
      });

      expect(result.score).toBeGreaterThanOrEqual(75);
      expect(result.threats.some(t => t.type === 'DORMANT_APPROVAL_RISK')).toBe(true);
    });
  });

  describe('Regression Tests - Legitimate Protocols', () => {
    it('should NOT flag Uniswap', async () => {
      const result = await detector.scanDApp({
        id: 'uniswap',
        name: 'Uniswap',
        description: 'A protocol for trading and automated liquidity provision on Ethereum. Swap tokens, provide liquidity, and earn fees.',
        chains: ['ethereum', 'polygon', 'arbitrum'],
        tvl: 5000000000,
        logo: '',
        url: 'https://uniswap.org',
        category: 'DEX',
      });

      expect(result.threats.filter(t => t.severity === 'CRITICAL').length).toBe(0);
      expect(result.score).toBeLessThan(80); // Should not trigger auto-blacklist
    });

    it('should NOT flag Aave', async () => {
      const result = await detector.scanDApp({
        id: 'aave',
        name: 'Aave',
        description: 'Decentralized non-custodial liquidity market protocol where users can participate as depositors or borrowers.',
        chains: ['ethereum', 'polygon', 'avalanche'],
        tvl: 12000000000,
        logo: '',
        url: 'https://aave.com',
        category: 'Lending',
      });

      expect(result.threats.filter(t => t.severity === 'CRITICAL').length).toBe(0);
      expect(result.score).toBeLessThan(80);
    });

    it('should NOT flag Compound', async () => {
      const result = await detector.scanDApp({
        id: 'compound',
        name: 'Compound',
        description: 'An algorithmic, autonomous interest rate protocol built for developers, to unlock a universe of open financial applications.',
        chains: ['ethereum'],
        tvl: 3000000000,
        logo: '',
        url: 'https://compound.finance',
        category: 'Lending',
      });

      expect(result.threats.filter(t => t.severity === 'CRITICAL').length).toBe(0);
      expect(result.score).toBeLessThan(80);
    });

    it('should NOT flag Curve Finance', async () => {
      const result = await detector.scanDApp({
        id: 'curve',
        name: 'Curve Finance',
        description: 'Exchange liquidity pool on Ethereum designed for extremely efficient stablecoin trading and low risk, supplemental fee income for liquidity providers.',
        chains: ['ethereum', 'polygon', 'arbitrum'],
        tvl: 4000000000,
        logo: '',
        url: 'https://curve.fi',
        category: 'DEX',
      });

      expect(result.threats.filter(t => t.severity === 'CRITICAL').length).toBe(0);
      expect(result.score).toBeLessThan(80);
    });

    it('should NOT flag MakerDAO', async () => {
      const result = await detector.scanDApp({
        id: 'maker',
        name: 'MakerDAO',
        description: 'Decentralized credit platform on Ethereum that supports Dai, a stablecoin whose value is pegged to USD. Collateralized by crypto assets.',
        chains: ['ethereum'],
        tvl: 8000000000,
        logo: '',
        url: 'https://makerdao.com',
        category: 'CDP',
      });

      expect(result.threats.filter(t => t.severity === 'CRITICAL').length).toBe(0);
      expect(result.score).toBeLessThan(80);
    });

    it('should NOT flag Lido', async () => {
      const result = await detector.scanDApp({
        id: 'lido',
        name: 'Lido',
        description: 'Liquid staking solution for Ethereum 2.0. Lido lets users stake their ETH without locking assets or maintaining infrastructure.',
        chains: ['ethereum'],
        tvl: 25000000000,
        logo: '',
        url: 'https://lido.fi',
        category: 'Liquid Staking',
      });

      expect(result.threats.filter(t => t.severity === 'CRITICAL').length).toBe(0);
      expect(result.score).toBeLessThan(80);
    });

    it('should NOT flag PancakeSwap', async () => {
      const result = await detector.scanDApp({
        id: 'pancakeswap',
        name: 'PancakeSwap',
        description: 'The most popular decentralized platform for swapping BEP20 tokens on BNB Chain. Swap tokens, farm CAKE, and participate in lotteries.',
        chains: ['bsc'],
        tvl: 2000000000,
        logo: '',
        url: 'https://pancakeswap.finance',
        category: 'DEX',
      });

      expect(result.threats.filter(t => t.severity === 'CRITICAL').length).toBe(0);
      expect(result.score).toBeLessThan(80);
    });
  });

  describe('Edge Cases and Boundary Testing', () => {
    it('should handle empty description', async () => {
      const result = await detector.scanDApp({
        id: 'test-24',
        name: 'Test Protocol',
        description: '',
        chains: ['ethereum'],
        tvl: 1000000,
        logo: '',
        url: 'https://example.com',
        category: 'test',
      });

      expect(result).toBeDefined();
      expect(result.score).toBeDefined();
    });

    it('should handle missing URL', async () => {
      const result = await detector.scanDApp({
        id: 'test-25',
        name: 'Test Protocol',
        description: 'Test description',
        chains: ['ethereum'],
        tvl: 1000000,
        logo: '',
        url: '',
        category: 'test',
      });

      expect(result).toBeDefined();
      expect(result.score).toBeDefined();
    });

    it('should handle multiple chain mentions', async () => {
      const result = await detector.scanDApp({
        id: 'test-26',
        name: 'Cross-Chain Protocol',
        description: 'Works on Ethereum, Solana, and Polygon',
        chains: ['ethereum', 'solana', 'polygon'],
        tvl: 1000000,
        logo: '',
        url: 'https://example.com',
        category: 'Bridge',
      });

      expect(result).toBeDefined();
      expect(result.score).toBeDefined();
    });

    it('should properly aggregate multiple threats', async () => {
      const result = await detector.scanDApp({
        id: 'test-27',
        name: 'Pink Drainer Scam',
        description: 'Urgent! Sign this permit signature now to claim your airdrop. Bypass wallet protection and approve unlimited tokens. Drainer kit with 20% commission.',
        chains: ['ethereum'],
        tvl: 1000000,
        logo: '',
        url: 'https://scam.example.com',
        category: 'test',
      });

      expect(result.threats.length).toBeGreaterThan(2);
      expect(result.score).toBeGreaterThanOrEqual(100); // Multiple critical threats
      expect(result.threats.some(t => t.type === 'NAMED_DRAINER_OPERATION')).toBe(true);
      expect(result.threats.some(t => t.type === 'PERMIT_SIGNATURE_EXPLOIT')).toBe(true);
      const hasApprovalOrCreate2 = result.threats.some(t => 
        t.type === 'APPROVAL_PHISHING' || t.type === 'CREATE2_EVASION'
      );
      expect(hasApprovalOrCreate2).toBe(true);
    });
  });

  describe('Context-Aware Pattern Matching', () => {
    it('should require scam context for permit signatures', async () => {
      const result = await detector.scanDApp({
        id: 'test-28',
        name: 'Developer Documentation',
        description: 'How to implement EIP-2612 permit() function in your smart contract. Technical guide for gasless approvals.',
        chains: ['ethereum'],
        tvl: 0,
        logo: '',
        url: 'https://docs.example.com',
        category: 'Documentation',
      });

      expect(result.threats.some(t => t.type === 'PERMIT_SIGNATURE_EXPLOIT')).toBe(false);
    });

    it('should require scam context for approval patterns', async () => {
      const result = await detector.scanDApp({
        id: 'test-29',
        name: 'ERC20 Tutorial',
        description: 'Understanding unlimited approvals and setApprovalForAll in smart contracts. Security best practices.',
        chains: ['ethereum'],
        tvl: 0,
        logo: '',
        url: 'https://tutorial.example.com',
        category: 'Education',
      });

      expect(result.threats.some(t => t.type === 'APPROVAL_PHISHING')).toBe(false);
    });

    it('should require evasion context for CREATE2', async () => {
      const result = await detector.scanDApp({
        id: 'test-30',
        name: 'Smart Contract Factory',
        description: 'CREATE2 opcode for deterministic address generation. Deploy contracts with predictable addresses.',
        chains: ['ethereum'],
        tvl: 1000000000,
        logo: '',
        url: 'https://factory.example.com',
        category: 'Infrastructure',
      });

      expect(result.threats.some(t => t.type === 'CREATE2_EVASION')).toBe(false);
    });
  });
});
