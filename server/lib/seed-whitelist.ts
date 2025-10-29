import { storage } from "../storage";

// Legitimate protocols that were falsely flagged
const LEGITIMATE_PROTOCOLS = [
  {
    protocolId: "morpho",
    protocolName: "Morpho",
    reason: "Verified DeFi lending protocol - Official integration with Aave/Compound (not imposter)",
    verificationSource: "DeFiLlama, Official Documentation",
    certikScore: null,
    defiSafetyScore: null,
    minTvl: 500_000_000,
    exchangeListings: null,
  },
  {
    protocolId: "morpho-v0-aavev2",
    protocolName: "Morpho V0 AaveV2",
    reason: "Official Morpho integration with Aave V2 (not scam)",
    verificationSource: "DeFiLlama",
    certikScore: null,
    defiSafetyScore: null,
    minTvl: null,
    exchangeListings: null,
  },
  {
    protocolId: "morpho-v0-compoundv2",
    protocolName: "Morpho V0 CompoundV2",
    reason: "Official Morpho integration with Compound V2 (not scam)",
    verificationSource: "DeFiLlama",
    certikScore: null,
    defiSafetyScore: null,
    minTvl: null,
    exchangeListings: null,
  },
  {
    protocolId: "aavegotchi",
    protocolName: "Aavegotchi",
    reason: "Verified gaming/NFT protocol built on Aave ecosystem (not imposter)",
    verificationSource: "DeFiLlama, Polygon Network",
    certikScore: null,
    defiSafetyScore: null,
    minTvl: 30_000_000,
    exchangeListings: null,
  },
  {
    protocolId: "kraken-bitcoin",
    protocolName: "Kraken Bitcoin",
    reason: "Official Kraken exchange product (major CEX)",
    verificationSource: "DeFiLlama",
    certikScore: null,
    defiSafetyScore: null,
    minTvl: null,
    exchangeListings: ["Kraken"],
  },
  {
    protocolId: "revert-finance",
    protocolName: "Revert Finance",
    reason: "Verified DeFi protocol (name contains 'revert' but is legitimate)",
    verificationSource: "DeFiLlama",
    certikScore: null,
    defiSafetyScore: null,
    minTvl: null,
    exchangeListings: null,
  },
  {
    protocolId: "pulsechain-bridge",
    protocolName: "PulseChain Bridge",
    reason: "Official PulseChain bridge protocol",
    verificationSource: "DeFiLlama",
    certikScore: null,
    defiSafetyScore: null,
    minTvl: null,
    exchangeListings: null,
  },
  {
    protocolId: "tzbtc",
    protocolName: "tzBTC",
    reason: "Wrapped Bitcoin on Tezos - Verified bridge protocol",
    verificationSource: "DeFiLlama, Tezos Foundation",
    certikScore: null,
    defiSafetyScore: null,
    minTvl: null,
    exchangeListings: null,
  },
  {
    protocolId: "apx-bridge",
    protocolName: "APX Bridge",
    reason: "Verified bridge protocol",
    verificationSource: "DeFiLlama",
    certikScore: null,
    defiSafetyScore: null,
    minTvl: null,
    exchangeListings: null,
  },
  {
    protocolId: "mezo-network",
    protocolName: "Mezo Network",
    reason: "Verified Layer 2 protocol",
    verificationSource: "DeFiLlama",
    certikScore: null,
    defiSafetyScore: null,
    minTvl: null,
    exchangeListings: null,
  },
  // Official Layer 2 Bridges (High TVL)
  {
    protocolId: "zksync-lite-bridge",
    protocolName: "zkSync Lite Bridge",
    reason: "Official zkSync Layer 2 bridge - Major Ethereum scaling solution ($62M+ TVL)",
    verificationSource: "DeFiLlama, zkSync Official",
    certikScore: null,
    defiSafetyScore: null,
    minTvl: 62_000_000,
    exchangeListings: null,
  },
  {
    protocolId: "arbitrum-nova-bridge",
    protocolName: "Arbitrum Nova Bridge",
    reason: "Official Arbitrum Nova bridge - Offchain Labs product ($42M+ TVL)",
    verificationSource: "DeFiLlama, Arbitrum Official",
    certikScore: null,
    defiSafetyScore: null,
    minTvl: 42_000_000,
    exchangeListings: null,
  },
  {
    protocolId: "taiko-bridge",
    protocolName: "Taiko Bridge",
    reason: "Official Taiko zkEVM bridge ($30M+ TVL)",
    verificationSource: "DeFiLlama, Taiko Official",
    certikScore: null,
    defiSafetyScore: null,
    minTvl: 30_000_000,
    exchangeListings: null,
  },
  {
    protocolId: "lisk-bridge",
    protocolName: "Lisk Bridge",
    reason: "Official Lisk L2 bridge ($69M+ TVL)",
    verificationSource: "DeFiLlama",
    certikScore: null,
    defiSafetyScore: null,
    minTvl: 69_000_000,
    exchangeListings: null,
  },
  {
    protocolId: "manta-pacific",
    protocolName: "Manta Pacific",
    reason: "Official Manta Network bridge ($52M+ TVL)",
    verificationSource: "DeFiLlama",
    certikScore: null,
    defiSafetyScore: null,
    minTvl: 52_000_000,
    exchangeListings: null,
  },
  {
    protocolId: "mode-bridge",
    protocolName: "Mode Bridge",
    reason: "Official Mode Network bridge ($13M+ TVL)",
    verificationSource: "DeFiLlama",
    certikScore: null,
    defiSafetyScore: null,
    minTvl: 13_000_000,
    exchangeListings: null,
  },
  {
    protocolId: "zora-bridge",
    protocolName: "Zora Bridge",
    reason: "Official Zora Network bridge ($12M+ TVL)",
    verificationSource: "DeFiLlama",
    certikScore: null,
    defiSafetyScore: null,
    minTvl: 12_000_000,
    exchangeListings: null,
  },
  {
    protocolId: "unichain-bridge",
    protocolName: "Unichain Bridge",
    reason: "Official Uniswap L2 bridge ($9M+ TVL)",
    verificationSource: "DeFiLlama, Uniswap Labs",
    certikScore: null,
    defiSafetyScore: null,
    minTvl: 9_000_000,
    exchangeListings: null,
  },
  // Established DEXs and DeFi Protocols
  {
    protocolId: "balancer-cow-amm",
    protocolName: "Balancer CoW AMM",
    reason: "Official Balancer protocol integration with CoW Protocol ($9M+ TVL)",
    verificationSource: "DeFiLlama, Balancer Official",
    certikScore: null,
    defiSafetyScore: null,
    minTvl: 9_000_000,
    exchangeListings: null,
  },
  {
    protocolId: "aztec",
    protocolName: "Aztec",
    reason: "Verified privacy protocol - Major zero-knowledge rollup project ($9M+ TVL)",
    verificationSource: "DeFiLlama, Ethereum Foundation",
    certikScore: null,
    defiSafetyScore: null,
    minTvl: 9_000_000,
    exchangeListings: null,
  },
  {
    protocolId: "wrapped-bnb",
    protocolName: "Wrapped BNB",
    reason: "Official wrapped BNB token bridge ($10M+ TVL)",
    verificationSource: "DeFiLlama, Binance",
    certikScore: null,
    defiSafetyScore: null,
    minTvl: 10_000_000,
    exchangeListings: null,
  },
  {
    protocolId: "compound-blue",
    protocolName: "Compound Blue",
    reason: "Official Compound V3 variant (not imposter)",
    verificationSource: "DeFiLlama, Compound Official",
    certikScore: null,
    defiSafetyScore: null,
    minTvl: null,
    exchangeListings: null,
  },
];

export async function seedWhitelist() {
  console.log("Starting whitelist seeding...");
  
  let addedCount = 0;
  let skippedCount = 0;
  
  for (const protocol of LEGITIMATE_PROTOCOLS) {
    try {
      const isWhitelisted = await storage.isProtocolWhitelisted(protocol.protocolId);
      
      if (isWhitelisted) {
        console.log(`✓ ${protocol.protocolName} already whitelisted`);
        skippedCount++;
        continue;
      }
      
      await storage.addToWhitelist({
        ...protocol,
        addedBy: "system",
      });
      
      console.log(`✓ Added ${protocol.protocolName} to whitelist`);
      addedCount++;
    } catch (error) {
      console.error(`✗ Error whitelisting ${protocol.protocolName}:`, error);
    }
  }
  
  console.log(`\nWhitelist seeding complete!`);
  console.log(`- Added: ${addedCount}`);
  console.log(`- Skipped (already whitelisted): ${skippedCount}`);
  console.log(`- Total: ${LEGITIMATE_PROTOCOLS.length}`);
  
  return {
    addedCount,
    skippedCount,
    total: LEGITIMATE_PROTOCOLS.length,
  };
}
