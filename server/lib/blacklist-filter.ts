/**
 * Blacklist Filter
 * Smart filtering to identify potentially legitimate protocols from blacklist
 * Minimizes GoPlus API usage by filtering out obvious scams
 */

export interface FilteredProtocol {
  id: string;
  name: string;
  reason: string;
  severity: string;
  isLikelyLegitimate: boolean;
  legitimacyScore: number;
  legitimacyReasons: string[];
}

export interface FilterCriteria {
  minLegitimacyScore?: number;
  excludeObviousScams?: boolean;
  includeOnlyWithContracts?: boolean;
}

/**
 * Analyze blacklisted protocol to determine if it might be a false positive
 */
export function analyzeBlacklistedProtocol(protocol: {
  dapp_name: string;
  reason?: string;
  severity: string;
  website?: string;
  legitimacy_score?: number;
}): FilteredProtocol {
  const name = protocol.dapp_name || '';
  const reason = protocol.reason || '';
  const website = protocol.website || '';
  
  let legitimacyScore = 0;
  const legitimacyReasons: string[] = [];
  
  // Red flags (lower legitimacy)
  const redFlags = {
    giveaway: /giveaway|airdrop|claim|claimer|free\s+eth|double\s+your/i,
    typosquatting: /unisvvap|pancakesvvap|aavve|compouund/i,
    maliciousTLD: /\.(lol|tk|ml|ga|cf|gq)$/i,
    suspiciousKeywords: /drainer|phish|scam|fake|steal/i,
    urgency: /urgent|limited|hurry|act\s+now|don't\s+miss/i,
  };
  
  if (redFlags.giveaway.test(name) || redFlags.giveaway.test(reason)) {
    legitimacyScore -= 30;
    legitimacyReasons.push('Contains giveaway/airdrop keywords');
  }
  
  if (redFlags.typosquatting.test(name)) {
    legitimacyScore -= 40;
    legitimacyReasons.push('Obvious typosquatting detected');
  }
  
  if (redFlags.maliciousTLD.test(website)) {
    legitimacyScore -= 35;
    legitimacyReasons.push('Malicious TLD (.lol, .tk, .ml, etc.)');
  }
  
  if (redFlags.suspiciousKeywords.test(reason)) {
    legitimacyScore -= 25;
    legitimacyReasons.push('Flagged with suspicious keywords');
  }
  
  if (redFlags.urgency.test(name) || redFlags.urgency.test(reason)) {
    legitimacyScore -= 20;
    legitimacyReasons.push('Uses urgency/pressure tactics');
  }
  
  // Positive signals (higher legitimacy - potential false positives)
  const positiveSignals = {
    // Legitimate integrations with major protocols
    integration: /aave|curve|uniswap|compound|maker|frax|balancer|yearn/i,
    // Wrapped or derivative assets
    wrapped: /wrapped|staked|liquid|derivative|synthetic/i,
    // Chain-specific versions
    chainSpecific: /(aptos|solana|avalanche|arbitrum|optimism|polygon|base|zksync)\s+/i,
    // Technical terms (not marketing fluff)
    technical: /protocol|vault|pool|farm|liquidity|governance|staking/i,
  };
  
  // Check if it's a legitimate integration (e.g., "Aave Aptos")
  if (positiveSignals.integration.test(name)) {
    legitimacyScore += 25;
    legitimacyReasons.push('May be legitimate protocol integration');
  }
  
  if (positiveSignals.chainSpecific.test(name)) {
    legitimacyScore += 15;
    legitimacyReasons.push('Chain-specific deployment detected');
  }
  
  if (positiveSignals.wrapped.test(name)) {
    legitimacyScore += 10;
    legitimacyReasons.push('Wrapped/derivative asset pattern');
  }
  
  if (positiveSignals.technical.test(name) && !redFlags.giveaway.test(name)) {
    legitimacyScore += 10;
    legitimacyReasons.push('Uses technical terminology');
  }
  
  // Check blacklist reason
  const reasonLower = reason.toLowerCase();
  if (reasonLower.includes('imposter') && !reasonLower.includes('typosquat')) {
    legitimacyScore += 20;
    legitimacyReasons.push('Flagged as imposter (may be legitimate integration)');
  }
  
  if (reasonLower.includes('unverified contract') && 
      !reasonLower.includes('drainer') && 
      !reasonLower.includes('scam')) {
    legitimacyScore += 15;
    legitimacyReasons.push('Only flagged for unverified contract');
  }
  
  if (reasonLower.includes('anonymous team') && 
      !reasonLower.includes('drainer') && 
      !reasonLower.includes('phishing')) {
    legitimacyScore += 10;
    legitimacyReasons.push('Only flagged for anonymous team');
  }
  
  // If manually blacklisted, trust the manual decision
  if (reasonLower.includes('manually blacklisted')) {
    legitimacyScore -= 50;
    legitimacyReasons.push('Manually blacklisted by admin');
  }
  
  // Use existing legitimacy_score from database if available
  if (protocol.legitimacy_score !== null && protocol.legitimacy_score !== undefined) {
    legitimacyScore += protocol.legitimacy_score;
    legitimacyReasons.push(`Database legitimacy score: ${protocol.legitimacy_score}`);
  }
  
  // Normalize to 0-100 scale
  legitimacyScore = Math.max(-100, Math.min(100, legitimacyScore));
  
  return {
    id: '', // Will be set by caller
    name: protocol.dapp_name,
    reason: protocol.reason || '',
    severity: protocol.severity,
    isLikelyLegitimate: legitimacyScore >= 20, // Threshold for potential false positive
    legitimacyScore,
    legitimacyReasons,
  };
}

/**
 * Filter blacklisted protocols to find potential false positives
 */
export function filterBlacklistedProtocols(
  protocols: any[],
  criteria: FilterCriteria = {}
): FilteredProtocol[] {
  const {
    minLegitimacyScore = 20,
    excludeObviousScams = true,
  } = criteria;
  
  const filtered = protocols
    .map(p => {
      const analysis = analyzeBlacklistedProtocol(p);
      analysis.id = p.id || p.dapp_id;
      return analysis;
    })
    .filter(p => {
      // Exclude obvious scams if requested
      if (excludeObviousScams && p.legitimacyScore < -20) {
        return false;
      }
      
      // Include protocols above legitimacy threshold
      return p.legitimacyScore >= minLegitimacyScore;
    })
    .sort((a, b) => b.legitimacyScore - a.legitimacyScore); // Highest legitimacy first
  
  return filtered;
}

/**
 * Get statistics about filtered protocols
 */
export function getFilterStats(protocols: any[]): {
  total: number;
  obviousScams: number;
  potentialFalsePositives: number;
  needsReview: number;
  estimatedScans: number;
} {
  const analyzed = protocols.map(p => analyzeBlacklistedProtocol(p));
  
  return {
    total: protocols.length,
    obviousScams: analyzed.filter(p => p.legitimacyScore < -20).length,
    potentialFalsePositives: analyzed.filter(p => p.legitimacyScore >= 20).length,
    needsReview: analyzed.filter(p => p.legitimacyScore >= -20 && p.legitimacyScore < 20).length,
    estimatedScans: analyzed.filter(p => p.legitimacyScore >= 20).length,
  };
}
