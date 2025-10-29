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
