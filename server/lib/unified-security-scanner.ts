/**
 * Unified Security Scanner — DFJ v2.3
 *
 * Implements the full DFJ v2.3 scoring model:
 *   Foundation  (max 45)  — what they built
 *   Active      (max 55)  — how they protect now
 *   Penalties   (max -30) — deductions for detected threat patterns
 *   ──────────────────────────────────────────────
 *   Final Score  0–97     HIGHER IS BETTER
 *
 * Severity thresholds (higher = safer):
 *   80–97 → SAFE
 *   65–79 → LOW risk
 *   50–64 → MEDIUM risk
 *   30–49 → HIGH risk
 *   0–29  → CRITICAL risk  (auto-blacklist candidate)
 */

import type { Protocol, SecurityScan, Threat } from '@shared/schema';
import type { IStorage } from '../storage';
import {
  calculateFoundationScore,
  type SecurityIndicators,
} from './security-verification';
import { scanContractWithGoPlus } from './goplus-scanner';
import { threatLearner } from './threat-pattern-learner';

// ─── Penalty Detection ────────────────────────────────────────────────────────

interface Penalty {
  reason: string;
  deduction: number;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
}

const CRITICAL_KEYWORDS = ['drainer', 'honeypot', 'rug', 'scam', 'ponzi', 'pyramid', 'fake'];
const HIGH_KEYWORDS = ['clone', 'airdrop claim', 'giveaway', 'guaranteed profit', '1000x'];
const MEDIUM_KEYWORDS = ['unaudited', 'anonymous team', 'no audit'];
const MAJOR_PROTOCOLS = ['uniswap', 'aave', 'compound', 'curve', 'lido', 'maker', 'sushiswap', 'balancer', 'yearn', 'convex'];

function detectMetadataPenalties(
  protocol: { name: string; description?: string | null; website?: string | null }
): { penalties: Penalty[]; threats: Threat[] } {
  const penalties: Penalty[] = [];
  const threats: Threat[] = [];
  const text = `${protocol.name} ${protocol.description ?? ''} ${protocol.website ?? ''}`.toLowerCase();

  for (const kw of CRITICAL_KEYWORDS) {
    if (text.includes(kw)) {
      penalties.push({ reason: `Critical keyword "${kw}"`, deduction: 15, severity: 'CRITICAL' });
      threats.push({ type: 'SUSPICIOUS_KEYWORD', severity: 'CRITICAL', message: `Protocol contains high-risk keyword: "${kw}"` });
    }
  }
  for (const kw of HIGH_KEYWORDS) {
    if (text.includes(kw)) {
      penalties.push({ reason: `Suspicious phrase "${kw}"`, deduction: 7, severity: 'HIGH' });
      threats.push({ type: 'SUSPICIOUS_KEYWORD', severity: 'HIGH', message: `Protocol contains suspicious phrase: "${kw}"` });
    }
  }
  for (const kw of MEDIUM_KEYWORDS) {
    if (text.includes(kw)) {
      penalties.push({ reason: `Risk indicator "${kw}"`, deduction: 3, severity: 'MEDIUM' });
      threats.push({ type: 'SUSPICIOUS_KEYWORD', severity: 'MEDIUM', message: `Protocol indicates: "${kw}"` });
    }
  }

  // Typosquatting — skip if the protocol's own canonical ID starts with the major name.
  // A canonical DeFiLlama ID like "aave-v3" or "uniswap-v4" is a legitimate version,
  // not an impersonator. Only flag if the ID also doesn't contain the major name.
  const nameLower = protocol.name.toLowerCase().replace(/[\s\-_]/g, '');
  const idLower   = ((protocol as any).id ?? '').toLowerCase().replace(/[\s\-_]/g, '');
  for (const major of MAJOR_PROTOCOLS) {
    if (nameLower !== major && nameLower.includes(major) && !idLower.includes(major)) {
      penalties.push({ reason: `Possible typosquat of "${major}"`, deduction: 5, severity: 'MEDIUM' });
      threats.push({ type: 'POTENTIAL_TYPOSQUAT', severity: 'MEDIUM', message: `Name may be impersonating "${major}" — verify authenticity` });
      break;
    }
  }

  return { penalties, threats };
}

// ─── Active Scoring (max 55) ──────────────────────────────────────────────────

interface ActiveBreakdown {
  securityInfrastructure: number; // A1 max 22
  incidentResponse: number;       // A2 max 15
  proactiveMonitoring: number;    // A3 max  7
  economicHealth: number;         // A4 max  6
  liveGovernance: number;         // A5 max  3
  ongoingVigilance: number;       // A6 max  2
  total: number;                  // max 55
}

/** A1 — Security Infrastructure (22 pts): current operational security mechanisms */
function scoreSecurityInfrastructure(protocol: Protocol): number {
  let score = 0;
  if (protocol.defiHasMultisig) score += 9;  // multisig = strong admin access control
  if (protocol.defiHasTimelock) score += 8;  // timelock = protection against rushed changes
  if (protocol.github) score += 3;           // open source = community review ongoing
  if (protocol.audited) score += 2;          // reviewed deployment
  return Math.min(score, 22);
}

/** A2 — Incident Response (15 pts): bug bounty + community responsiveness */
function scoreIncidentResponse(protocol: Protocol): number {
  let score = 0;

  const auditText = (protocol.auditNote || '').toLowerCase();
  // Check note text AND audit link URLs for bug bounty signals
  const linkUrls = (protocol.auditLinks || []).join(' ').toLowerCase();
  const hasBugBounty = /bug\s*bounty|immunefi|hackerone/.test(auditText) ||
                       /immunefi\.com|hackerone\.com/.test(linkUrls);

  if (hasBugBounty) {
    score += 7;
    // Larger bug bounty proportional to TVL = more serious program
    if (protocol.tvl > 10_000_000) score += 3;
    else if (protocol.tvl > 1_000_000) score += 1;
  }

  // Community channels = responsive team, transparent incident comms
  const socialChannels = [protocol.twitter, protocol.discord, protocol.telegram].filter(Boolean).length;
  score += Math.min(socialChannels * 1, 3);

  // Multiple audits = proactive incident-prevention posture
  if (protocol.auditCount >= 2) score += 2;

  return Math.min(score, 15);
}

/** A3 — Proactive Monitoring (7 pts): active tooling to catch threats early */
function scoreProactiveMonitoring(protocol: Protocol, hasGoPlusData: boolean): number {
  let score = 0;
  if (protocol.audited) score += 2;     // code monitoring commitment
  if (hasGoPlusData) score += 2;        // on-chain risk monitoring integrated
  if (protocol.github) score += 2;      // open source = community watches the code
  if (protocol.defiHasMultisig && protocol.defiHasTimelock) score += 1; // dual safeguards
  return Math.min(score, 7);
}

/** A4 — Economic Health (6 pts): protocol sustainability indicators */
function scoreEconomicHealth(protocol: Protocol): number {
  let score = 0;

  // TVL stability proxy
  if (protocol.tvl > 100_000_000) score += 3;
  else if (protocol.tvl > 10_000_000) score += 2;
  else if (protocol.tvl > 1_000_000) score += 1;

  // Chain diversity = broader adoption
  const chainCount = protocol.chains?.length ?? 0;
  if (chainCount > 3) score += 2;
  else if (chainCount > 1) score += 1;

  // Category established = known, real product
  if (protocol.category && protocol.category !== 'Other') score += 1;

  return Math.min(score, 6);
}

/** A5 — Live Governance (3 pts): active, transparent governance */
function scoreLiveGovernance(protocol: Protocol): number {
  let score = 0;
  if (protocol.defiHasMultisig) score += 1; // active governance mechanism
  if (protocol.twitter) score += 1;          // public transparency
  if (protocol.website) score += 1;          // public presence
  return Math.min(score, 3);
}

/** A6 — Ongoing Vigilance (2 pts): chain-level continuous monitoring */
function scoreOngoingVigilance(protocol: Protocol): number {
  let score = 0;
  if (protocol.audited && protocol.defiHasMultisig) score += 1;
  if (protocol.github && protocol.audited) score += 1;
  return Math.min(score, 2);
}

function calculateActiveScore(protocol: Protocol, hasGoPlusData: boolean): ActiveBreakdown {
  const a1 = scoreSecurityInfrastructure(protocol);
  const a2 = scoreIncidentResponse(protocol);
  const a3 = scoreProactiveMonitoring(protocol, hasGoPlusData);
  const a4 = scoreEconomicHealth(protocol);
  const a5 = scoreLiveGovernance(protocol);
  const a6 = scoreOngoingVigilance(protocol);
  const total = Math.min(a1 + a2 + a3 + a4 + a5 + a6, 55);
  return { securityInfrastructure: a1, incidentResponse: a2, proactiveMonitoring: a3, economicHealth: a4, liveGovernance: a5, ongoingVigilance: a6, total };
}

// ─── Public Result Type ───────────────────────────────────────────────────────

export interface UnifiedSecurityResult {
  /** DFJ v2.3 score — 0 to 97. HIGHER IS BETTER. */
  score: number;
  severity: 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  isBlacklisted: boolean;
  threats: Threat[];
  breakdown: {
    // Foundation sub-scores
    foundationTotal: number;     // max 45
    auditVerification: number;   // F1 max 18
    codeContractHistory: number; // F2 max 12
    trackRecord: number;         // F3 max 10
    documentation: number;       // F4 max  3
    historicalGovernance: number;// F5 max  2

    // Active sub-scores
    activeTotal: number;              // max 55
    securityInfrastructure: number;   // A1 max 22
    incidentResponse: number;         // A2 max 15
    proactiveMonitoring: number;      // A3 max  7
    economicHealth: number;           // A4 max  6
    liveGovernance: number;           // A5 max  3
    ongoingVigilance: number;         // A6 max  2

    // Gross before penalties
    grossScore: number;          // max 100 (Foundation + Active)

    // Penalties
    totalPenalty: number;        // max 30
    penalties: Penalty[];

    // Legacy fields (kept for UI compatibility)
    legitimacyScore: number;     // = foundationTotal (0–45, higher=better)
    legitimacyIndicators: SecurityIndicators;
    goPlusScore: number;         // goplus penalty contribution
    goPlusThreats: string[];
    aiPatternMatches: number;
    aiConfidence: number;
    verificationBonus: number;   // unused (kept for schema compat, always 0)
    tvlBonus: number;            // unused (kept for schema compat, always 0)
    auditBonus: number;          // unused (kept for schema compat, always 0)
  };
  recommendations: string[];
  scannedAt: string;
  scanDuration: number;
}

// ─── Main Scanner ─────────────────────────────────────────────────────────────

export class UnifiedSecurityScanner {
  constructor(private storage: IStorage) {}

  async scanProtocol(protocol: Protocol): Promise<UnifiedSecurityResult> {
    const startTime = Date.now();
    const allThreats: Threat[] = [];
    const allPenalties: Penalty[] = [];
    const recommendations: string[] = [];

    // ── 1. Foundation Score ────────────────────────────────────────────────
    const { score: foundationScore, breakdown: foundationBreakdown, indicators } =
      calculateFoundationScore(protocol);

    // ── 2. Metadata Penalty Detection ─────────────────────────────────────
    const { penalties: metaPenalties, threats: metaThreats } = detectMetadataPenalties(protocol);
    allPenalties.push(...metaPenalties);
    allThreats.push(...metaThreats);

    // ── 3. GoPlus Contract Analysis (penalties only) ──────────────────────
    let goPlusScore = 0; // penalty contribution from goplus
    const goPlusThreats: string[] = [];
    let hasGoPlusData = false;

    if (protocol.defiContracts && protocol.defiContracts.length > 0) {
      try {
        const contract = protocol.defiContracts[0];
        const chain = this.mapChainToGoPlusId(protocol.chains?.[0] || 'ethereum');
        if (chain) {
          const goPlusResult = await scanContractWithGoPlus(contract.address, chain);
          if (goPlusResult) {
            hasGoPlusData = true;
            if (goPlusResult.isHoneypot) {
              const d = 15;
              goPlusScore += d;
              allPenalties.push({ reason: 'Honeypot contract', deduction: d, severity: 'CRITICAL' });
              goPlusThreats.push('Honeypot contract detected');
              allThreats.push({ type: 'HONEYPOT', severity: 'CRITICAL', message: 'GoPlus detected honeypot — users cannot sell tokens' });
            }
            if (goPlusResult.isProxy && !goPlusResult.isOpenSource) {
              const d = 8;
              goPlusScore += d;
              allPenalties.push({ reason: 'Proxy without open source', deduction: d, severity: 'HIGH' });
              goPlusThreats.push('Upgradeable proxy without verified source');
              allThreats.push({ type: 'PROXY_NO_SOURCE', severity: 'HIGH', message: 'Upgradeable proxy contract without verified source code' });
            }
            if (!goPlusResult.isOpenSource) {
              const d = 5;
              goPlusScore += d;
              allPenalties.push({ reason: 'Unverified contract source', deduction: d, severity: 'MEDIUM' });
              goPlusThreats.push('Contract source not verified');
              allThreats.push({ type: 'UNVERIFIED_CONTRACT', severity: 'MEDIUM', message: 'Smart contract source is not verified on block explorer' });
            }
            if (goPlusResult.isAntiWhale) {
              const d = 3;
              goPlusScore += d;
              allPenalties.push({ reason: 'Anti-whale mechanism', deduction: d, severity: 'MEDIUM' });
              goPlusThreats.push('Anti-whale mechanism (potential misuse)');
            }
          }
        }
      } catch (err) {
        console.error('GoPlus scan error:', err);
      }
    }

    // ── 4. (AI keyword penalties removed — too noisy, do not restore) ───────
    const aiPatternMatches = 0;
    const aiConfidence = 0;

    // ── 5. Active Score ────────────────────────────────────────────────────
    const activeBreakdown = calculateActiveScore(protocol, hasGoPlusData);

    // ── 6. Gross Score (Foundation + Active, max 100) ──────────────────────
    const grossScore = Math.min(foundationScore + activeBreakdown.total, 100);

    // ── 7. Apply Penalties (max -30) ───────────────────────────────────────
    const totalPenalty = Math.min(
      allPenalties.reduce((sum, p) => sum + p.deduction, 0),
      30
    );
    const finalScore = Math.max(0, Math.min(97, grossScore - totalPenalty));

    // ── 8. Severity (higher = safer) ────────────────────────────────────────
    let severity: 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    if (finalScore >= 80) severity = 'SAFE';
    else if (finalScore >= 65) severity = 'LOW';
    else if (finalScore >= 50) severity = 'MEDIUM';
    else if (finalScore >= 30) severity = 'HIGH';
    else severity = 'CRITICAL';

    // ── 9. Auto-blacklist (CRITICAL risk only) ─────────────────────────────
    const isBlacklisted = severity === 'CRITICAL';

    // ── 10. Recommendations ────────────────────────────────────────────────
    if (finalScore >= 80) {
      recommendations.push('Strong security posture — meets most DFJ best practices');
    } else if (finalScore >= 65) {
      recommendations.push('Good security with minor gaps — proceed with normal diligence');
    }
    if (!indicators.hasAudit) {
      recommendations.push('No security audit found — higher risk until independently reviewed');
    }
    if (!indicators.hasOpenSource) {
      recommendations.push('Contract source code not verified — cannot assess code quality');
    }
    if (!indicators.hasMultisig) {
      recommendations.push('No multi-sig detected — admin keys are a single point of failure');
    }
    if (!indicators.hasTimelock) {
      recommendations.push('No timelock detected — contract changes can be applied instantly');
    }
    if (protocol.tvl < 1_000_000) {
      recommendations.push('Low TVL — limited community validation of this protocol');
    }
    if (finalScore < 50) {
      recommendations.push('CAUTION: Multiple security concerns — research thoroughly before interacting');
    }
    if (finalScore < 30) {
      recommendations.push('HIGH RISK: Significant red flags — avoid unless you fully understand the risks');
    }
    if (finalScore < 15) {
      recommendations.push('CRITICAL: Do NOT interact — high probability of loss or scam');
    }

    return {
      score: finalScore,
      severity,
      isBlacklisted,
      threats: allThreats,
      breakdown: {
        foundationTotal: foundationBreakdown.total,
        auditVerification: foundationBreakdown.auditVerification,
        codeContractHistory: foundationBreakdown.codeContractHistory,
        trackRecord: foundationBreakdown.trackRecord,
        documentation: foundationBreakdown.documentation,
        historicalGovernance: foundationBreakdown.historicalGovernance,
        activeTotal: activeBreakdown.total,
        securityInfrastructure: activeBreakdown.securityInfrastructure,
        incidentResponse: activeBreakdown.incidentResponse,
        proactiveMonitoring: activeBreakdown.proactiveMonitoring,
        economicHealth: activeBreakdown.economicHealth,
        liveGovernance: activeBreakdown.liveGovernance,
        ongoingVigilance: activeBreakdown.ongoingVigilance,
        grossScore,
        totalPenalty,
        penalties: allPenalties,
        // Legacy compat
        legitimacyScore: foundationBreakdown.total,
        legitimacyIndicators: indicators,
        goPlusScore,
        goPlusThreats,
        aiPatternMatches,
        aiConfidence,
        verificationBonus: 0,
        tvlBonus: 0,
        auditBonus: 0,
      },
      recommendations,
      scannedAt: new Date().toISOString(),
      scanDuration: Date.now() - startTime,
    };
  }

  async scanProtocols(protocols: Protocol[]): Promise<Map<string, UnifiedSecurityResult>> {
    const results = new Map<string, UnifiedSecurityResult>();
    const batchSize = 5;
    for (let i = 0; i < protocols.length; i += batchSize) {
      const batch = protocols.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(async p => {
          try {
            return { id: p.id, result: await this.scanProtocol(p) };
          } catch (err) {
            console.error(`Error scanning ${p.id}:`, err);
            return { id: p.id, result: this.getErrorResult(p) };
          }
        })
      );
      batchResults.forEach(({ id, result }) => results.set(id, result));
    }
    return results;
  }

  private mapChainToGoPlusId(chain: string): string | null {
    const map: Record<string, string> = {
      ethereum: '1', bsc: '56', polygon: '137', arbitrum: '42161',
      optimism: '10', avalanche: '43114', fantom: '250', base: '8453',
    };
    return map[chain.toLowerCase()] || null;
  }

  private getErrorResult(protocol: Protocol): UnifiedSecurityResult {
    return {
      score: 0,
      severity: 'CRITICAL',
      isBlacklisted: false,
      threats: [],
      breakdown: {
        foundationTotal: 0, auditVerification: 0, codeContractHistory: 0,
        trackRecord: 0, documentation: 0, historicalGovernance: 0,
        activeTotal: 0, securityInfrastructure: 0, incidentResponse: 0,
        proactiveMonitoring: 0, economicHealth: 0, liveGovernance: 0, ongoingVigilance: 0,
        grossScore: 0, totalPenalty: 0, penalties: [],
        legitimacyScore: 0,
        legitimacyIndicators: {
          hasAudit: false, reputableAuditFirm: false, formalVerification: false,
          tvlSignificant: false, hasOpenSource: false, hasMultisig: false,
          hasTimelock: false, hasBugBounty: false, hasDoxxedTeam: false,
          goodTokenDistribution: false, activeCommunity: false,
        },
        goPlusScore: 0, goPlusThreats: [],
        aiPatternMatches: 0, aiConfidence: 0,
        verificationBonus: 0, tvlBonus: 0, auditBonus: 0,
      },
      recommendations: ['Scan failed — unable to analyze protocol security'],
      scannedAt: new Date().toISOString(),
      scanDuration: 0,
    };
  }
}
