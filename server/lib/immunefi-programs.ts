/**
 * Curated list of active Immunefi bug bounty programs.
 *
 * - `slug`     : Immunefi program slug  → https://immunefi.com/bounty/{slug}/
 * - `llamaId`  : Our DB protocols.id    → exact match for TVL / security_score
 * - `logoSlug` : DeFiLlama CDN slug     → logo URL when DB record has no logo
 *                (only set when different from llamaId)
 * - `maxBounty`: Maximum payout in USD
 */

export interface ImmunefiProgram {
  name: string;
  slug: string;
  llamaId: string;
  logoSlug?: string;
  maxBounty: number;
  category: string;
}

export const IMMUNEFI_PROGRAMS: ImmunefiProgram[] = [
  // ─── $10M+ ────────────────────────────────────────────────────────────────
  { name: 'Uniswap',           slug: 'uniswap',           llamaId: 'uniswap-v3',          logoSlug: 'uniswap',        maxBounty: 15_500_000, category: 'DEX' },
  { name: 'LayerZero',         slug: 'layerzero',         llamaId: 'layerzero-v2',         logoSlug: 'layerzero',      maxBounty: 15_000_000, category: 'Bridge' },
  { name: 'MakerDAO',          slug: 'makerdao',          llamaId: 'makerdao',                                         maxBounty: 10_000_000, category: 'CDP' },

  // ─── $5M ──────────────────────────────────────────────────────────────────
  { name: 'dYdX',              slug: 'dydx',              llamaId: 'dydx-v4',              logoSlug: 'dydx',           maxBounty: 5_000_000, category: 'Derivatives' },
  { name: 'GMX',               slug: 'gmx',               llamaId: 'gmx-v2-perps',         logoSlug: 'gmx',            maxBounty: 5_000_000, category: 'Derivatives' },
  { name: 'EigenLayer',        slug: 'eigenlayer',        llamaId: 'eigenlayer',                                       maxBounty: 5_000_000, category: 'Restaking' },
  { name: 'StarkWare',         slug: 'starkware',         llamaId: 'starkex',              logoSlug: 'starkware',      maxBounty: 5_000_000, category: 'Layer 2' },
  { name: 'zkSync',            slug: 'zksync',            llamaId: 'zksync-era-txbridge',  logoSlug: 'zksync-era',     maxBounty: 5_000_000, category: 'Layer 2' },
  { name: 'Wormhole',          slug: 'wormhole',          llamaId: 'wormhole',                                         maxBounty: 5_000_000, category: 'Bridge' },
  { name: 'Polygon',           slug: 'polygon',           llamaId: 'polygon-bridge',       logoSlug: 'polygon',        maxBounty: 5_000_000, category: 'Layer 2' },
  { name: 'Scroll',            slug: 'scroll',            llamaId: 'scroll-bridge',        logoSlug: 'scroll',         maxBounty: 5_000_000, category: 'Layer 2' },

  // ─── $2M–$4M ──────────────────────────────────────────────────────────────
  { name: 'Lido',              slug: 'lido',              llamaId: 'lido',                                             maxBounty: 2_000_000, category: 'Liquid Staking' },
  { name: 'Optimism',          slug: 'optimism',          llamaId: 'optimism-bridge',      logoSlug: 'optimism',       maxBounty: 2_000_000, category: 'Layer 2' },
  { name: 'Arbitrum',          slug: 'arbitrum',          llamaId: 'arbitrum-bridge',      logoSlug: 'arbitrum',       maxBounty: 2_000_000, category: 'Layer 2' },
  { name: 'Chainlink',         slug: 'chainlink',         llamaId: 'chainlink',                                        maxBounty: 2_000_000, category: 'Oracle' },
  { name: 'Gnosis',            slug: 'gnosis',            llamaId: 'gnosis-protocol-v1',   logoSlug: 'gnosis',         maxBounty: 2_000_000, category: 'Infrastructure' },
  { name: 'Pendle',            slug: 'pendle',            llamaId: 'pendle',                                           maxBounty: 2_000_000, category: 'Yield' },
  { name: 'Frax Finance',      slug: 'frax-finance',      llamaId: 'frax',                 logoSlug: 'frax-finance',   maxBounty: 2_000_000, category: 'Stablecoin' },

  // ─── $1M ──────────────────────────────────────────────────────────────────
  { name: 'Aave',              slug: 'aave',              llamaId: 'aave-v3',              logoSlug: 'aave',           maxBounty: 1_000_000, category: 'Lending' },
  { name: 'Compound',          slug: 'compound',          llamaId: 'compound-v3',          logoSlug: 'compound',       maxBounty: 1_000_000, category: 'Lending' },
  { name: 'Curve Finance',     slug: 'curve-finance',     llamaId: 'curve-dex',            logoSlug: 'curve',          maxBounty: 1_000_000, category: 'DEX' },
  { name: 'Balancer',          slug: 'balancer',          llamaId: 'balancer-v2',          logoSlug: 'balancer',       maxBounty: 1_000_000, category: 'DEX' },
  { name: 'Rocket Pool',       slug: 'rocket-pool',       llamaId: 'rocket-pool',                                      maxBounty: 1_000_000, category: 'Liquid Staking' },
  { name: 'PancakeSwap',       slug: 'pancakeswap',       llamaId: 'pancakeswap-amm',      logoSlug: 'pancakeswap',    maxBounty: 1_000_000, category: 'DEX' },
  { name: 'Stargate Finance',  slug: 'stargate-finance',  llamaId: 'stargate-v2',          logoSlug: 'stargate',       maxBounty: 1_000_000, category: 'Bridge' },
  { name: 'Synthetix',         slug: 'synthetix',         llamaId: 'synthetix-v1+v2',      logoSlug: 'synthetix',      maxBounty: 1_000_000, category: 'Derivatives' },
  { name: 'Morpho',            slug: 'morpho',            llamaId: 'morpho-blue',          logoSlug: 'morpho',         maxBounty: 1_000_000, category: 'Lending' },
  { name: 'Radiant Capital',   slug: 'radiant-capital',   llamaId: 'radiant-v2',           logoSlug: 'radiant',        maxBounty: 1_000_000, category: 'Lending' },
  { name: 'Velodrome',         slug: 'velodrome',         llamaId: 'velodrome-v2',         logoSlug: 'velodrome',      maxBounty: 1_000_000, category: 'DEX' },
  { name: 'Aerodrome',         slug: 'aerodrome',         llamaId: 'aerodrome-slipstream', logoSlug: 'aerodrome',      maxBounty: 1_000_000, category: 'DEX' },
  { name: 'Hyperliquid',       slug: 'hyperliquid',       llamaId: 'hyperliquid-bridge',   logoSlug: 'hyperliquid',    maxBounty: 1_000_000, category: 'Derivatives' },
  { name: 'Spark',             slug: 'spark',             llamaId: 'sparklend',            logoSlug: 'spark',          maxBounty: 1_000_000, category: 'Lending' },
  { name: 'Fluid',             slug: 'fluid',             llamaId: 'fluid-lending',        logoSlug: 'fluid',          maxBounty: 1_000_000, category: 'Lending' },

  // ─── $500K ────────────────────────────────────────────────────────────────
  { name: '1inch',             slug: '1inch',             llamaId: '1inch-swap',           logoSlug: '1inch',          maxBounty: 500_000, category: 'DEX Aggregator' },
  { name: 'SushiSwap',         slug: 'sushiswap',         llamaId: 'sushi',                logoSlug: 'sushi',          maxBounty: 500_000, category: 'DEX' },
  { name: 'Hop Protocol',      slug: 'hop-protocol',      llamaId: 'hop-protocol',                                     maxBounty: 500_000, category: 'Bridge' },
  { name: 'Across Protocol',   slug: 'across-protocol',   llamaId: 'across',               logoSlug: 'across-protocol',maxBounty: 500_000, category: 'Bridge' },
  { name: 'Alchemix',          slug: 'alchemix',          llamaId: 'alchemix-v3',          logoSlug: 'alchemix',       maxBounty: 500_000, category: 'Yield' },
  { name: 'Angle Protocol',    slug: 'angle-protocol',    llamaId: 'angle',                                            maxBounty: 500_000, category: 'Stablecoin' },
  { name: 'Euler Finance',     slug: 'euler-finance',     llamaId: 'euler-v2',             logoSlug: 'euler-finance',  maxBounty: 500_000, category: 'Lending' },
  { name: 'Instadapp',         slug: 'instadapp',         llamaId: 'instadapp',                                        maxBounty: 500_000, category: 'Aggregator' },
  { name: 'Yearn Finance',     slug: 'yearn-finance',     llamaId: 'yearn-finance',                                    maxBounty: 500_000, category: 'Yield' },
  { name: 'WOOFi',             slug: 'woofi',             llamaId: 'woofi-earn',           logoSlug: 'woofi',          maxBounty: 500_000, category: 'DEX' },
  { name: 'Trader Joe',        slug: 'trader-joe',        llamaId: 'joe-v2.2',             logoSlug: 'trader-joe',     maxBounty: 500_000, category: 'DEX' },
  { name: 'Beefy Finance',     slug: 'beefy-finance',     llamaId: 'beefy',                logoSlug: 'beefy',          maxBounty: 500_000, category: 'Yield' },
  { name: 'Olympus',           slug: 'olympus',           llamaId: 'olympus-dao',          logoSlug: 'olympus',        maxBounty: 500_000, category: 'Reserve Currency' },
  { name: 'Kyber Network',     slug: 'kyberswap',         llamaId: 'kyberswap-elastic',    logoSlug: 'kyberswap',      maxBounty: 500_000, category: 'DEX' },
  { name: 'DODO',              slug: 'dodo',              llamaId: 'dodo-amm',             logoSlug: 'dodo',           maxBounty: 500_000, category: 'DEX' },
  { name: 'Paraswap',          slug: 'paraswap',          llamaId: 'paraswap',                                         maxBounty: 500_000, category: 'DEX Aggregator' },
  { name: 'Convex Finance',    slug: 'convex-finance',    llamaId: 'convex-finance',                                   maxBounty: 500_000, category: 'Yield' },
  { name: 'Ribbon Finance',    slug: 'ribbon-finance',    llamaId: 'ribbon',               logoSlug: 'ribbon-finance', maxBounty: 500_000, category: 'Options' },
  { name: 'Notional Finance',  slug: 'notional-finance',  llamaId: 'notional-v2',          logoSlug: 'notional',       maxBounty: 500_000, category: 'Fixed Rate' },
  { name: 'OpenSea',           slug: 'opensea',           llamaId: 'opensea',                                          maxBounty: 500_000, category: 'NFT' },
  { name: 'Sommelier Finance', slug: 'sommelier-finance', llamaId: 'sommelier',                                        maxBounty: 500_000, category: 'Yield' },

  // ─── $250K ────────────────────────────────────────────────────────────────
  { name: 'Aura Finance',      slug: 'aura-finance',      llamaId: 'aura',                                             maxBounty: 250_000, category: 'Yield' },
  { name: 'Bunni',             slug: 'bunni',             llamaId: 'bunni-v2',             logoSlug: 'bunni',          maxBounty: 250_000, category: 'DEX' },
  { name: 'Celer Network',     slug: 'celer-network',     llamaId: 'celer-cbridge',        logoSlug: 'celer',          maxBounty: 250_000, category: 'Bridge' },
  { name: 'Li.Fi',             slug: 'lifi',              llamaId: 'lifi',                                             maxBounty: 250_000, category: 'Bridge' },
  { name: 'Multichain',        slug: 'multichain',        llamaId: 'multichain',                                       maxBounty: 250_000, category: 'Bridge' },
  { name: 'Biconomy',          slug: 'biconomy',          llamaId: 'biconomy.com',         logoSlug: 'biconomy',       maxBounty: 250_000, category: 'Infrastructure' },
  { name: 'API3',              slug: 'api3',              llamaId: 'api3',                                             maxBounty: 250_000, category: 'Oracle' },
  { name: 'UMA Protocol',      slug: 'uma',               llamaId: 'uma',                                              maxBounty: 250_000, category: 'Oracle' },
  { name: 'Band Protocol',     slug: 'band-protocol',     llamaId: 'band-protocol',                                    maxBounty: 250_000, category: 'Oracle' },
  { name: 'Superfluid',        slug: 'superfluid',        llamaId: 'superfluid',                                       maxBounty: 250_000, category: 'Infrastructure' },
  { name: 'Connext',           slug: 'connext',           llamaId: 'connext',                                          maxBounty: 250_000, category: 'Bridge' },
  { name: 'Socket',            slug: 'socket',            llamaId: 'socket',                                           maxBounty: 250_000, category: 'Bridge' },
  { name: 'Exactly Protocol',  slug: 'exactly-protocol',  llamaId: 'exactly',                                          maxBounty: 250_000, category: 'Lending' },

  // ─── $100K ────────────────────────────────────────────────────────────────
  { name: 'QiDAO',             slug: 'qidao',             llamaId: 'qidao',                                            maxBounty: 100_000, category: 'CDP' },
  { name: 'Inverse Finance',   slug: 'inverse-finance',   llamaId: 'inverse-finance-firm', logoSlug: 'inverse-finance',maxBounty: 100_000, category: 'Lending' },
  { name: 'Kokoa Finance',     slug: 'kokoa-finance',     llamaId: 'kokoa-finance',                                    maxBounty: 100_000, category: 'CDP' },
  { name: 'Origin Protocol',   slug: 'origin-protocol',   llamaId: 'origin-ether',         logoSlug: 'origin-protocol',maxBounty: 100_000, category: 'Yield' },
  { name: 'mStable',           slug: 'mstable',           llamaId: 'mstable-cdp',          logoSlug: 'mstable',        maxBounty: 100_000, category: 'Stablecoin' },
  { name: 'Hundred Finance',   slug: 'hundred-finance',   llamaId: 'hundred-finance',                                  maxBounty: 100_000, category: 'Lending' },
  { name: 'Pickle Finance',    slug: 'pickle-finance',    llamaId: 'pickle',               logoSlug: 'pickle-finance', maxBounty: 100_000, category: 'Yield' },
  { name: 'Float Protocol',    slug: 'float-protocol',    llamaId: 'float-protocol',                                   maxBounty: 100_000, category: 'Stablecoin' },
  { name: 'Aurora',            slug: 'aurora',            llamaId: 'aurora-plus',          logoSlug: 'aurora',         maxBounty: 100_000, category: 'Layer 2' },
  { name: 'Premia',            slug: 'premia',            llamaId: 'premia-v2',            logoSlug: 'premia',         maxBounty: 100_000, category: 'Options' },
];
