/**
 * Curated list of active Immunefi bug bounty programs.
 * - `slug`    : Immunefi program slug → https://immunefi.com/bounty/{slug}/
 * - `llamaId` : DeFiLlama protocol id → used to match our DB for TVL/score/logo
 * - `maxBounty`: Maximum payout in USD
 */

export interface ImmunefiProgram {
  name: string;
  slug: string;
  llamaId: string;       // matches protocols.id in our DB (DeFiLlama slug)
  maxBounty: number;
  category: string;
}

export const IMMUNEFI_PROGRAMS: ImmunefiProgram[] = [
  // ─── $10M+ ────────────────────────────────────────────────────────────────
  { name: 'Uniswap',           slug: 'uniswap',           llamaId: 'uniswap-v3',       maxBounty: 15_500_000, category: 'DEX' },
  { name: 'LayerZero',         slug: 'layerzero',         llamaId: 'layerzero',         maxBounty: 15_000_000, category: 'Bridge' },
  { name: 'MakerDAO',          slug: 'makerdao',          llamaId: 'makerdao',          maxBounty: 10_000_000, category: 'CDP' },

  // ─── $5M ─────────────────────────────────────────────────────────────────
  { name: 'dYdX',              slug: 'dydx',              llamaId: 'dydx',              maxBounty: 5_000_000, category: 'Derivatives' },
  { name: 'GMX',               slug: 'gmx',               llamaId: 'gmx',               maxBounty: 5_000_000, category: 'Derivatives' },
  { name: 'EigenLayer',        slug: 'eigenlayer',        llamaId: 'eigenlayer',        maxBounty: 5_000_000, category: 'Restaking' },
  { name: 'StarkWare',         slug: 'starkware',         llamaId: 'starkex',           maxBounty: 5_000_000, category: 'Layer 2' },
  { name: 'zkSync',            slug: 'zksync',            llamaId: 'zksync-era',        maxBounty: 5_000_000, category: 'Layer 2' },
  { name: 'Wormhole',          slug: 'wormhole',          llamaId: 'wormhole',          maxBounty: 5_000_000, category: 'Bridge' },
  { name: 'Polygon',           slug: 'polygon',           llamaId: 'polygon-bridge',    maxBounty: 5_000_000, category: 'Layer 2' },
  { name: 'Scroll',            slug: 'scroll',            llamaId: 'scroll',            maxBounty: 5_000_000, category: 'Layer 2' },

  // ─── $2M–$4M ──────────────────────────────────────────────────────────────
  { name: 'Lido',              slug: 'lido',              llamaId: 'lido',              maxBounty: 2_000_000, category: 'Liquid Staking' },
  { name: 'Optimism',          slug: 'optimism',          llamaId: 'optimism-bridge',   maxBounty: 2_000_000, category: 'Layer 2' },
  { name: 'Arbitrum',          slug: 'arbitrum',          llamaId: 'arbitrum-bridge',   maxBounty: 2_000_000, category: 'Layer 2' },
  { name: 'Chainlink',         slug: 'chainlink',         llamaId: 'chainlink',         maxBounty: 2_000_000, category: 'Oracle' },
  { name: 'Gnosis',            slug: 'gnosis',            llamaId: 'gnosis',            maxBounty: 2_000_000, category: 'Infrastructure' },
  { name: 'Pendle',            slug: 'pendle',            llamaId: 'pendle',            maxBounty: 2_000_000, category: 'Yield' },
  { name: 'Frax Finance',      slug: 'frax-finance',      llamaId: 'frax',              maxBounty: 2_000_000, category: 'Stablecoin' },

  // ─── $1M ──────────────────────────────────────────────────────────────────
  { name: 'Aave',              slug: 'aave',              llamaId: 'aave-v3',           maxBounty: 1_000_000, category: 'Lending' },
  { name: 'Compound',          slug: 'compound',          llamaId: 'compound-v3',       maxBounty: 1_000_000, category: 'Lending' },
  { name: 'Curve Finance',     slug: 'curve-finance',     llamaId: 'curve-dex',         maxBounty: 1_000_000, category: 'DEX' },
  { name: 'Balancer',          slug: 'balancer',          llamaId: 'balancer-v2',       maxBounty: 1_000_000, category: 'DEX' },
  { name: 'Rocket Pool',       slug: 'rocket-pool',       llamaId: 'rocket-pool',       maxBounty: 1_000_000, category: 'Liquid Staking' },
  { name: 'PancakeSwap',       slug: 'pancakeswap',       llamaId: 'pancakeswap-amm-v3',maxBounty: 1_000_000, category: 'DEX' },
  { name: 'Stargate Finance',  slug: 'stargate-finance',  llamaId: 'stargate-finance',  maxBounty: 1_000_000, category: 'Bridge' },
  { name: 'Synthetix',         slug: 'synthetix',         llamaId: 'synthetix',         maxBounty: 1_000_000, category: 'Derivatives' },
  { name: 'Morpho',            slug: 'morpho',            llamaId: 'morpho-blue',       maxBounty: 1_000_000, category: 'Lending' },
  { name: 'Radiant Capital',   slug: 'radiant-capital',   llamaId: 'radiant-v2',        maxBounty: 1_000_000, category: 'Lending' },
  { name: 'Velodrome',         slug: 'velodrome',         llamaId: 'velodrome-v2',      maxBounty: 1_000_000, category: 'DEX' },
  { name: 'Aerodrome',         slug: 'aerodrome',         llamaId: 'aerodrome-finance', maxBounty: 1_000_000, category: 'DEX' },
  { name: 'Hyperliquid',       slug: 'hyperliquid',       llamaId: 'hyperliquid',       maxBounty: 1_000_000, category: 'Derivatives' },
  { name: 'Spark',             slug: 'spark',             llamaId: 'spark',             maxBounty: 1_000_000, category: 'Lending' },
  { name: 'Fluid',             slug: 'fluid',             llamaId: 'fluid',             maxBounty: 1_000_000, category: 'Lending' },

  // ─── $500K ────────────────────────────────────────────────────────────────
  { name: '1inch',             slug: '1inch',             llamaId: '1inch-network',     maxBounty: 500_000, category: 'DEX Aggregator' },
  { name: 'SushiSwap',         slug: 'sushiswap',         llamaId: 'sushi',             maxBounty: 500_000, category: 'DEX' },
  { name: 'Hop Protocol',      slug: 'hop-protocol',      llamaId: 'hop-protocol',      maxBounty: 500_000, category: 'Bridge' },
  { name: 'Across Protocol',   slug: 'across-protocol',   llamaId: 'across-protocol',   maxBounty: 500_000, category: 'Bridge' },
  { name: 'Alchemix',          slug: 'alchemix',          llamaId: 'alchemix',          maxBounty: 500_000, category: 'Yield' },
  { name: 'Angle Protocol',    slug: 'angle-protocol',    llamaId: 'angle',             maxBounty: 500_000, category: 'Stablecoin' },
  { name: 'Euler Finance',     slug: 'euler-finance',     llamaId: 'euler',             maxBounty: 500_000, category: 'Lending' },
  { name: 'Instadapp',         slug: 'instadapp',         llamaId: 'instadapp',         maxBounty: 500_000, category: 'Aggregator' },
  { name: 'Yearn Finance',     slug: 'yearn-finance',     llamaId: 'yearn-finance',     maxBounty: 500_000, category: 'Yield' },
  { name: 'WOOFi',             slug: 'woofi',             llamaId: 'woofi',             maxBounty: 500_000, category: 'DEX' },
  { name: 'Trader Joe',        slug: 'trader-joe',        llamaId: 'trader-joe-dex',    maxBounty: 500_000, category: 'DEX' },
  { name: 'Beefy Finance',     slug: 'beefy-finance',     llamaId: 'beefy',             maxBounty: 500_000, category: 'Yield' },
  { name: 'Olympus',           slug: 'olympus',           llamaId: 'olympus-dao',       maxBounty: 500_000, category: 'Reserve Currency' },
  { name: 'Kyber Network',     slug: 'kyberswap',         llamaId: 'kyberswap-elastic', maxBounty: 500_000, category: 'DEX' },
  { name: 'DODO',              slug: 'dodo',              llamaId: 'dodo',              maxBounty: 500_000, category: 'DEX' },
  { name: 'Paraswap',          slug: 'paraswap',          llamaId: 'paraswap',          maxBounty: 500_000, category: 'DEX Aggregator' },
  { name: 'Convex Finance',    slug: 'convex-finance',    llamaId: 'convex-finance',    maxBounty: 500_000, category: 'Yield' },
  { name: 'Ribbon Finance',    slug: 'ribbon-finance',    llamaId: 'ribbon-finance',    maxBounty: 500_000, category: 'Options' },
  { name: 'Notional Finance',  slug: 'notional-finance',  llamaId: 'notional',          maxBounty: 500_000, category: 'Fixed Rate' },
  { name: 'OpenSea',           slug: 'opensea',           llamaId: 'opensea',           maxBounty: 500_000, category: 'NFT' },
  { name: 'Sommelier Finance', slug: 'sommelier-finance', llamaId: 'sommelier',         maxBounty: 500_000, category: 'Yield' },

  // ─── $250K ────────────────────────────────────────────────────────────────
  { name: 'Aura Finance',      slug: 'aura-finance',      llamaId: 'aura',              maxBounty: 250_000, category: 'Yield' },
  { name: 'Bunni',             slug: 'bunni',             llamaId: 'bunni-v2',          maxBounty: 250_000, category: 'DEX' },
  { name: 'Celer Network',     slug: 'celer-network',     llamaId: 'celer-cbridge',     maxBounty: 250_000, category: 'Bridge' },
  { name: 'Li.Fi',             slug: 'lifi',              llamaId: 'lifi',              maxBounty: 250_000, category: 'Bridge' },
  { name: 'Multichain',        slug: 'multichain',        llamaId: 'multichain',        maxBounty: 250_000, category: 'Bridge' },
  { name: 'Biconomy',          slug: 'biconomy',          llamaId: 'biconomy',          maxBounty: 250_000, category: 'Infrastructure' },
  { name: 'API3',              slug: 'api3',              llamaId: 'api3',              maxBounty: 250_000, category: 'Oracle' },
  { name: 'UMA Protocol',      slug: 'uma',               llamaId: 'uma',               maxBounty: 250_000, category: 'Oracle' },
  { name: 'Band Protocol',     slug: 'band-protocol',     llamaId: 'band-protocol',     maxBounty: 250_000, category: 'Oracle' },
  { name: 'Superfluid',        slug: 'superfluid',        llamaId: 'superfluid',        maxBounty: 250_000, category: 'Infrastructure' },
  { name: 'Connext',           slug: 'connext',           llamaId: 'connext',           maxBounty: 250_000, category: 'Bridge' },
  { name: 'Socket',            slug: 'socket',            llamaId: 'socket',            maxBounty: 250_000, category: 'Bridge' },
  { name: 'Exactly Protocol',  slug: 'exactly-protocol',  llamaId: 'exactly',           maxBounty: 250_000, category: 'Lending' },

  // ─── $100K ────────────────────────────────────────────────────────────────
  { name: 'QiDAO',             slug: 'qidao',             llamaId: 'qidao',             maxBounty: 100_000, category: 'CDP' },
  { name: 'Inverse Finance',   slug: 'inverse-finance',   llamaId: 'inverse-finance',   maxBounty: 100_000, category: 'Lending' },
  { name: 'Kokoa Finance',     slug: 'kokoa-finance',     llamaId: 'kokoa-finance',     maxBounty: 100_000, category: 'CDP' },
  { name: 'Origin Protocol',   slug: 'origin-protocol',   llamaId: 'origin-defi',       maxBounty: 100_000, category: 'Yield' },
  { name: 'mStable',           slug: 'mstable',           llamaId: 'mstable',           maxBounty: 100_000, category: 'Stablecoin' },
  { name: 'Hundred Finance',   slug: 'hundred-finance',   llamaId: 'hundred-finance',   maxBounty: 100_000, category: 'Lending' },
  { name: 'Pickle Finance',    slug: 'pickle-finance',    llamaId: 'pickle-finance',    maxBounty: 100_000, category: 'Yield' },
  { name: 'Float Protocol',    slug: 'float-protocol',    llamaId: 'float-protocol',    maxBounty: 100_000, category: 'Stablecoin' },
  { name: 'Aurora',            slug: 'aurora',            llamaId: 'aurora',            maxBounty: 100_000, category: 'Layer 2' },
  { name: 'Premia',            slug: 'premia',            llamaId: 'premia',            maxBounty: 100_000, category: 'Options' },
];
