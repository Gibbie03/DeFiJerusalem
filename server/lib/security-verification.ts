import { Protocol, SecurityMetrics } from '@shared/schema';

/**
 * DFJ Security Scoring — Foundation Component (v2.3)
 *
 * Implements the Foundation layer (max 45 pts) of the DFJ v2.3 methodology.
 * Direction: HIGHER IS BETTER (100 = safest, 0 = most dangerous).
 *
 * Sub-components:
 *   F1 — Audit & Verification       18 pts
 *   F2 — Code & Contract History    12 pts
 *   F3 — Track Record               10 pts
 *   F4 — Documentation               3 pts
 *   F5 — Historical Governance       2 pts
 *   ──────────────────────────────────────
 *   Foundation total                45 pts
 */

export interface SecurityIndicators {
  hasAudit: boolean;
  reputableAuditFirm: boolean;
  formalVerification: boolean;
  tvlSignificant: boolean;
  hasOpenSource: boolean;
  hasMultisig: boolean;
  hasTimelock: boolean;
  hasBugBounty: boolean;
  hasDoxxedTeam: boolean;
  goodTokenDistribution: boolean;
  activeCommunity: boolean;
}

export const REPUTABLE_AUDITORS = [
  'certik', 'hacken', 'consensys', 'peckshield', 'trail of bits',
  'openzeppelin', 'quantstamp', 'slowmist', 'immunefi', 'dedaub',
  'chainsecurity', 'sigma prime', 'abdk', 'spearbit', 'sherlock',
  'code4rena', 'mixbytes', 'halborn', 'zellic', 'cantina',
  'nethermind', 'iosiro', 'solidified', 'zokyo', 'oxor',
  'pwc', 'kudelski', 'least authority', 'cure53', 'macro',
  'omniscia', 'cyfrin', 'trust security', 'guardians of the smart contract',
];

/**
 * Known audit-firm URL patterns for Option-1 auto-confirmation.
 * If a protocol's auditLinks contain a URL matching one of these domains,
 * it counts as a confirmed reputable auditor.
 */
export const AUDIT_URL_PATTERNS: { domain: string; firm: string }[] = [
  { domain: 'certik.com',              firm: 'certik' },
  { domain: 'hacken.io',               firm: 'hacken' },
  { domain: 'quantstamp.com',          firm: 'quantstamp' },
  { domain: 'openzeppelin.com',        firm: 'openzeppelin' },
  { domain: 'trailofbits.com',         firm: 'trail of bits' },
  { domain: 'consensys.io',            firm: 'consensys' },
  { domain: 'consensys.net',           firm: 'consensys' },
  { domain: 'diligence.consensys.net', firm: 'consensys' },
  { domain: 'peckshield.com',          firm: 'peckshield' },
  { domain: 'slowmist.com',            firm: 'slowmist' },
  { domain: 'dedaub.com',              firm: 'dedaub' },
  { domain: 'chainsecurity.com',       firm: 'chainsecurity' },
  { domain: 'sigmaprime.io',           firm: 'sigma prime' },
  { domain: 'abdk.consulting',         firm: 'abdk' },
  { domain: 'spearbit.com',            firm: 'spearbit' },
  { domain: 'sherlock.xyz',            firm: 'sherlock' },
  { domain: 'code4rena.com',           firm: 'code4rena' },
  { domain: 'github.com/code-423n4',   firm: 'code4rena' },
  { domain: 'mixbytes.io',             firm: 'mixbytes' },
  { domain: 'halborn.com',             firm: 'halborn' },
  { domain: 'zellic.io',               firm: 'zellic' },
  { domain: 'cantina.xyz',             firm: 'cantina' },
  { domain: 'nethermind.io',           firm: 'nethermind' },
  { domain: 'immunefi.com',            firm: 'immunefi' },
  { domain: 'iosiro.com',              firm: 'iosiro' },
  { domain: 'solidified.io',           firm: 'solidified' },
  { domain: 'zokyo.io',               firm: 'zokyo' },
  { domain: 'oxor.io',                 firm: 'oxor' },
  { domain: 'cyfrin.io',               firm: 'cyfrin' },
  { domain: 'macro.security',          firm: 'macro' },
  { domain: 'omniscia.io',             firm: 'omniscia' },
  { domain: 'kudelskisecurity.com',    firm: 'kudelski' },
  { domain: 'least-authority.com',     firm: 'least authority' },
];

/** Resolve a list of audit URLs → set of confirmed firm names */
export function firmsFromAuditLinks(links: string[] | null | undefined): Set<string> {
  const found = new Set<string>();
  if (!links?.length) return found;
  for (const url of links) {
    const lower = url.toLowerCase();
    for (const { domain, firm } of AUDIT_URL_PATTERNS) {
      if (lower.includes(domain)) { found.add(firm); break; }
    }
  }
  return found;
}

const FORMAL_VERIFICATION_TERMS = [
  'certora',
  'runtime verification',
  'formal verification',
  'formally verified',
  'mutation testing',
];

// ─── F1: Audit & Verification (18 pts) ───────────────────────────────────────

function scoreAuditVerification(protocol: Protocol): number {
  let score = 0;

  const hasAudit = protocol.audited || protocol.auditCount > 0;
  if (!hasAudit) return 0;

  // Base credit for having any audit
  score += 6;

  // Check all text sources for reputable auditor mention
  const auditText = (protocol.auditNote || '').toLowerCase();
  const auditReports = protocol.defiAuditReports || [];

  // Option-1: URL pattern matching against known audit firm domains
  const confirmedFirms = firmsFromAuditLinks(protocol.auditLinks);

  const isReputable =
    confirmedFirms.size > 0 ||
    REPUTABLE_AUDITORS.some(
      a => auditText.includes(a) ||
           auditReports.some(r => r.auditor.toLowerCase().includes(a))
    );
  if (isReputable) score += 4;

  // Multiple distinct confirmed firms = stronger assurance
  if (confirmedFirms.size >= 2) score += 2; // bonus for multi-firm coverage

  // Multiple audits (count-based)
  const count = protocol.auditCount || (protocol.audited ? 1 : 0);
  if (count >= 5) score += 5;
  else if (count >= 3) score += 4;
  else if (count >= 2) score += 2;

  // Formal verification (highest tier)
  if (FORMAL_VERIFICATION_TERMS.some(t => auditText.includes(t))) score += 3;

  return Math.min(score, 18);
}

// ─── F2: Code & Contract History (12 pts) ────────────────────────────────────

function scoreCodeContractHistory(protocol: Protocol): number {
  let score = 0;

  // Open source
  if (protocol.github) score += 4;

  // Verified on-chain contracts
  if (protocol.defiContracts && protocol.defiContracts.length > 0) score += 3;

  // Age-based code maturity (time-tested without major incidents)
  const age = protocol.age ?? 0;
  if (age > 730) score += 3;        // 2+ years
  else if (age > 365) score += 2;   // 1+ year
  else if (age > 180) score += 1;   // 6+ months

  // Reviewed deployment (had at least one audit before go-live)
  if (protocol.audited) score += 2;

  return Math.min(score, 12);
}

// ─── F3: Track Record (10 pts) ───────────────────────────────────────────────

function scoreTrackRecord(protocol: Protocol): number {
  let score = 0;

  // TVL as community-validated trust signal
  if (protocol.tvl > 100_000_000) score += 4;
  else if (protocol.tvl > 10_000_000) score += 3;
  else if (protocol.tvl > 1_000_000) score += 2;
  else if (protocol.tvl > 100_000) score += 1;

  // Protocol age (survived = track record)
  const age = protocol.age ?? 0;
  if (age > 730) score += 4;        // 2+ years operating
  else if (age > 365) score += 3;   // 1+ year
  else if (age > 180) score += 2;   // 6+ months
  else if (age > 90) score += 1;    // 3+ months

  // Longevity + scale bonus: old protocol with meaningful TVL → proven survivor
  if (age > 365 && protocol.tvl > 1_000_000) score += 2;

  return Math.min(score, 10);
}

// ─── F4: Documentation (3 pts) ───────────────────────────────────────────────

function scoreDocumentation(protocol: Protocol): number {
  let score = 0;
  if (protocol.website) score += 1;
  if (protocol.description && protocol.description.length > 50) score += 1;
  if (protocol.github) score += 1;
  return Math.min(score, 3);
}

// ─── F5: Historical Governance (2 pts) ───────────────────────────────────────

function scoreHistoricalGovernance(protocol: Protocol): number {
  let score = 0;
  if (protocol.defiHasTimelock) score += 1;
  if (protocol.defiHasMultisig) score += 1;
  return Math.min(score, 2);
}

// ─── Public: calculateFoundationScore ────────────────────────────────────────

export interface FoundationBreakdown {
  auditVerification: number;   // F1 (max 18)
  codeContractHistory: number; // F2 (max 12)
  trackRecord: number;         // F3 (max 10)
  documentation: number;       // F4 (max 3)
  historicalGovernance: number;// F5 (max 2)
  total: number;               // max 45
}

export function calculateFoundationScore(
  protocol: Protocol
): { score: number; breakdown: FoundationBreakdown; indicators: SecurityIndicators } {
  const f1 = scoreAuditVerification(protocol);
  const f2 = scoreCodeContractHistory(protocol);
  const f3 = scoreTrackRecord(protocol);
  const f4 = scoreDocumentation(protocol);
  const f5 = scoreHistoricalGovernance(protocol);

  const total = Math.min(f1 + f2 + f3 + f4 + f5, 45);

  const auditText = (protocol.auditNote || '').toLowerCase();
  const auditReports = protocol.defiAuditReports || [];
  const indicators: SecurityIndicators = {
    hasAudit: protocol.audited || protocol.auditCount > 0,
    reputableAuditFirm: REPUTABLE_AUDITORS.some(
      a => auditText.includes(a) || auditReports.some(r => r.auditor.toLowerCase().includes(a))
    ),
    formalVerification: FORMAL_VERIFICATION_TERMS.some(t => auditText.includes(t)),
    tvlSignificant: protocol.tvl >= 1_000_000,
    hasOpenSource: !!protocol.github,
    hasMultisig: !!protocol.defiHasMultisig,
    hasTimelock: !!protocol.defiHasTimelock,
    hasBugBounty: /bug\s*bounty|immunefi|hackerone/.test(auditText),
    hasDoxxedTeam: false, // Conservative default — requires manual verification
    goodTokenDistribution: false, // Requires on-chain holder data
    activeCommunity: !!(protocol.twitter || protocol.github) && protocol.tvl > 1_000_000,
  };

  return {
    score: total,
    breakdown: {
      auditVerification: f1,
      codeContractHistory: f2,
      trackRecord: f3,
      documentation: f4,
      historicalGovernance: f5,
      total,
    },
    indicators,
  };
}

// Backwards-compat alias used by blacklist-manager.ts
export function calculateLegitimacyScore(
  protocol: Protocol,
  _securityMetrics?: SecurityMetrics
): { score: number; indicators: SecurityIndicators; metrics: SecurityMetrics } {
  const { score, indicators } = calculateFoundationScore(protocol);
  return {
    score,
    indicators,
    metrics: extractSecurityMetrics(protocol),
  };
}

/**
 * Protocols with a DFJ score below 30 are flagged for blacklist removal review.
 * (Old threshold was legitimacyScore >= 70 in the lower-is-better system.)
 */
export function shouldRemoveFromBlacklist(dfjScore: number): boolean {
  return dfjScore >= 60;
}

/**
 * Human-readable DFJ rating (higher = safer).
 */
export function getDFJRating(score: number): {
  rating: string;
  color: string;
  description: string;
} {
  if (score >= 80) {
    return { rating: 'EXCELLENT', color: 'green', description: 'Meets nearly all DFJ security best practices' };
  } else if (score >= 65) {
    return { rating: 'GOOD', color: 'blue', description: 'Strong security posture with minor gaps' };
  } else if (score >= 50) {
    return { rating: 'MODERATE', color: 'yellow', description: 'Some security measures in place but notable gaps remain' };
  } else if (score >= 30) {
    return { rating: 'HIGH RISK', color: 'orange', description: 'Insufficient security measures — exercise caution' };
  } else {
    return { rating: 'CRITICAL RISK', color: 'red', description: 'Fails most DFJ security checks — likely dangerous' };
  }
}

// Backwards-compat alias
export function getLegitimacyRating(score: number) {
  return getDFJRating(score);
}

export function extractSecurityMetrics(protocol: Protocol): SecurityMetrics {
  const auditFirms: string[] = [];
  if (protocol.auditNote) {
    REPUTABLE_AUDITORS.forEach(a => {
      if (protocol.auditNote!.toLowerCase().includes(a)) auditFirms.push(a);
    });
  }
  if (protocol.defiAuditReports) {
    protocol.defiAuditReports.forEach(r => {
      if (!auditFirms.includes(r.auditor)) auditFirms.push(r.auditor);
    });
  }
  return {
    hasAudit: protocol.audited || protocol.auditCount > 0,
    auditFirms,
    tvl: protocol.tvl,
    holderCount: null,
    hasOpenSource: !!protocol.github,
    hasMultisig: protocol.defiHasMultisig || false,
    hasTimelock: protocol.defiHasTimelock || false,
    hasBugBounty: /bug\s*bounty|immunefi|hackerone/.test((protocol.auditNote || '').toLowerCase()),
    hasDoxxedTeam: false,
    communitySize: null,
  };
}
