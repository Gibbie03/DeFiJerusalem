import { Protocol, SecurityMetrics } from '@shared/schema';

/**
 * Security Verification Utility
 * Scores protocols against 10 key security indicators based on 2025 DeFi security best practices
 */

export interface SecurityIndicators {
  hasAudit: boolean;                    // 15 points - Critical (94% fewer hacks with audits)
  reputableAuditFirm: boolean;          // 10 points - CertiK, Hacken, ConsenSys, PeckShield
  tvlSignificant: boolean;              // 10 points - TVL > $1M indicates trust
  hasOpenSource: boolean;               // 10 points - Code transparency
  hasMultisig: boolean;                 // 10 points - Only 19% of hacked protocols used multi-sig
  hasTimelock: boolean;                 // 10 points - Critical function protection
  hasBugBounty: boolean;                // 10 points - Active security program
  hasDoxxedTeam: boolean;               // 10 points - Team transparency
  goodTokenDistribution: boolean;       // 10 points - No whale control (< 40% by top holders)
  activeCommunity: boolean;             // 5 points - Social media presence
}

const REPUTABLE_AUDITORS = [
  'certik',
  'hacken',
  'consensys',
  'peckshield',
  'trail of bits',
  'openzeppelin',
  'quantstamp',
  'slowmist',
  'immunefi',
  'dedaub'
];

/**
 * Calculate legitimacy score (0-100) based on security indicators
 */
export function calculateLegitimacyScore(
  protocol: Protocol,
  securityMetrics?: SecurityMetrics
): { score: number; indicators: SecurityIndicators; metrics: SecurityMetrics } {
  const metrics: SecurityMetrics = securityMetrics || extractSecurityMetrics(protocol);
  
  const indicators: SecurityIndicators = {
    // 1. Has Security Audit (15 points)
    hasAudit: protocol.audited || protocol.auditCount > 0,
    
    // 2. Reputable Audit Firm (10 points)
    reputableAuditFirm: hasReputableAudit(protocol),
    
    // 3. Significant TVL (10 points) - $1M+ indicates community trust
    tvlSignificant: protocol.tvl >= 1_000_000,
    
    // 4. Open Source Code (10 points)
    hasOpenSource: !!protocol.github || metrics.hasOpenSource,
    
    // 5. Multi-signature Wallet (10 points)
    hasMultisig: protocol.defiHasMultisig || metrics.hasMultisig,
    
    // 6. Timelock Mechanism (10 points)
    hasTimelock: protocol.defiHasTimelock || metrics.hasTimelock,
    
    // 7. Bug Bounty Program (10 points)
    hasBugBounty: metrics.hasBugBounty,
    
    // 8. Doxxed Team (10 points)
    hasDoxxedTeam: metrics.hasDoxxedTeam,
    
    // 9. Good Token Distribution (10 points) - Estimated from holder count
    goodTokenDistribution: estimateGoodDistribution(metrics.holderCount),
    
    // 10. Active Community (5 points)
    activeCommunity: hasActiveCommunity(protocol, metrics.communitySize)
  };

  // Calculate total score
  let score = 0;
  if (indicators.hasAudit) score += 15;
  if (indicators.reputableAuditFirm) score += 10;
  if (indicators.tvlSignificant) score += 10;
  if (indicators.hasOpenSource) score += 10;
  if (indicators.hasMultisig) score += 10;
  if (indicators.hasTimelock) score += 10;
  if (indicators.hasBugBounty) score += 10;
  if (indicators.hasDoxxedTeam) score += 10;
  if (indicators.goodTokenDistribution) score += 10;
  if (indicators.activeCommunity) score += 5;

  return { score, indicators, metrics };
}

/**
 * Check if protocol has audit from reputable firm
 */
function hasReputableAudit(protocol: Protocol): boolean {
  if (!protocol.auditNote && !protocol.defiAuditReports) return false;
  
  const auditText = (protocol.auditNote || '').toLowerCase();
  const auditReports = protocol.defiAuditReports || [];
  
  // Check audit note for reputable firm names
  const hasReputableInNote = REPUTABLE_AUDITORS.some(auditor => 
    auditText.includes(auditor)
  );
  
  // Check audit reports for reputable firm names
  const hasReputableInReports = auditReports.some(report => 
    REPUTABLE_AUDITORS.some(auditor => 
      report.auditor.toLowerCase().includes(auditor)
    )
  );
  
  return hasReputableInNote || hasReputableInReports;
}

/**
 * Estimate good token distribution from holder count
 * More holders = better distribution (heuristic)
 */
function estimateGoodDistribution(holderCount: number | null): boolean {
  if (!holderCount) return false;
  // If >1000 holders, likely good distribution
  // This is a heuristic - ideally we'd check actual top holder percentages
  return holderCount > 1000;
}

/**
 * Check if protocol has active community
 */
function hasActiveCommunity(protocol: Protocol, communitySize: number | null): boolean {
  const hasSocials = !!(protocol.twitter || protocol.github || protocol.website);
  const hasLargeCommunity = communitySize && communitySize > 1000;
  
  return hasSocials && (hasLargeCommunity || protocol.tvl > 10_000_000);
}

/**
 * Extract security metrics from protocol data
 */
export function extractSecurityMetrics(protocol: Protocol): SecurityMetrics {
  const auditFirms: string[] = [];
  
  // Extract audit firms from audit note
  if (protocol.auditNote) {
    REPUTABLE_AUDITORS.forEach(auditor => {
      if (protocol.auditNote!.toLowerCase().includes(auditor)) {
        auditFirms.push(auditor);
      }
    });
  }
  
  // Extract audit firms from audit reports
  if (protocol.defiAuditReports) {
    protocol.defiAuditReports.forEach(report => {
      if (!auditFirms.includes(report.auditor)) {
        auditFirms.push(report.auditor);
      }
    });
  }
  
  return {
    hasAudit: protocol.audited || protocol.auditCount > 0,
    auditFirms,
    tvl: protocol.tvl,
    holderCount: null, // Would need blockchain API to get real data
    hasOpenSource: !!protocol.github,
    hasMultisig: protocol.defiHasMultisig || false,
    hasTimelock: protocol.defiHasTimelock || false,
    hasBugBounty: false, // Would need to check Immunefi/HackerOne
    hasDoxxedTeam: false, // Conservative default - would need manual verification
    communitySize: null // Would need to check Twitter/Discord APIs
  };
}

/**
 * Determine if protocol should be removed from blacklist
 * Threshold: 70% legitimacy score (70+ points out of 100)
 */
export function shouldRemoveFromBlacklist(legitimacyScore: number): boolean {
  return legitimacyScore >= 70;
}

/**
 * Get human-readable legitimacy rating
 */
export function getLegitimacyRating(score: number): {
  rating: string;
  color: string;
  description: string;
} {
  if (score >= 90) {
    return {
      rating: 'HIGHLY LEGITIMATE',
      color: 'green',
      description: 'Meets nearly all security best practices'
    };
  } else if (score >= 70) {
    return {
      rating: 'LEGITIMATE',
      color: 'blue',
      description: 'Meets most security criteria - likely safe'
    };
  } else if (score >= 50) {
    return {
      rating: 'MODERATE RISK',
      color: 'yellow',
      description: 'Some security measures in place but gaps remain'
    };
  } else if (score >= 30) {
    return {
      rating: 'HIGH RISK',
      color: 'orange',
      description: 'Insufficient security measures - exercise caution'
    };
  } else {
    return {
      rating: 'CRITICAL RISK',
      color: 'red',
      description: 'Fails most security checks - likely scam'
    };
  }
}
