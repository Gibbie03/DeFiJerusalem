/**
 * DFJ-CEX v1.0 — Security Scoring for Centralized Exchanges
 *
 * CEXs face fundamentally different risks than DeFi protocols.
 * DeFi risks: smart-contract bugs, rug-pulls, governance attacks.
 * CEX risks:  custodial insolvency, fractional reserves, withdrawal freezes,
 *             regulatory shutdown, insider theft, exchange hacks.
 *
 * This scorer uses the SAME 0–97 scale and severity thresholds as DFJ v2.3
 * so scores are directly comparable in the UI.
 *
 * DFJ-CEX v1.0 Components
 * ───────────────────────
 *   C — Custody & Reserves    max 40
 *   R — Regulatory Compliance max 25
 *   T — Track Record          max 20
 *   ──────────────────────────────────
 *   Gross score               max 85
 *   Penalties                 max −30
 *   ──────────────────────────────────
 *   Final score               0–97
 *
 * Severity thresholds (identical to DFJ v2.3):
 *   80–97  SAFE
 *   65–79  LOW
 *   50–64  MEDIUM
 *   30–49  HIGH
 *   0–29   CRITICAL
 */

import type { Protocol } from '@shared/schema';

// ─── Known Major Exchange Data ────────────────────────────────────────────────
// Manually curated facts for well-known exchanges that we can detect by name.
// Only add facts that are well-documented and publicly verifiable.
// This supplements (not replaces) the DB fields — DB fields always take precedence.

interface KnownCexFacts {
  proofOfReserves?: 'merkle' | 'attested' | 'dashboard';
  insuranceFund?: boolean;
  withdrawalHaltHistory?: boolean;
  licensedJurisdictions?: string[];
  bugBounty?: boolean;
  hasSocAudit?: boolean;
  notes?: string;
}

const KNOWN_CEX_FACTS: Record<string, KnownCexFacts> = {
  // Binance
  'binance': { proofOfReserves: 'merkle', insuranceFund: true, withdrawalHaltHistory: true, licensedJurisdictions: ['FR', 'IT', 'ES', 'SE', 'PL'], bugBounty: true },
  'binance-cex': { proofOfReserves: 'merkle', insuranceFund: true, withdrawalHaltHistory: true, licensedJurisdictions: ['FR', 'IT', 'ES', 'SE', 'PL'], bugBounty: true },
  // Coinbase
  'coinbase': { proofOfReserves: 'attested', insuranceFund: true, withdrawalHaltHistory: false, licensedJurisdictions: ['US', 'EU', 'UK', 'SG', 'CA', 'AU'], bugBounty: true, hasSocAudit: true },
  'coinbase-exchange': { proofOfReserves: 'attested', insuranceFund: true, withdrawalHaltHistory: false, licensedJurisdictions: ['US', 'EU', 'UK', 'SG', 'CA', 'AU'], bugBounty: true, hasSocAudit: true },
  // Kraken
  'kraken': { proofOfReserves: 'attested', insuranceFund: false, withdrawalHaltHistory: false, licensedJurisdictions: ['US', 'EU', 'UK', 'CA', 'AU', 'JP'], bugBounty: true },
  // OKX
  'okx': { proofOfReserves: 'merkle', insuranceFund: true, withdrawalHaltHistory: false, licensedJurisdictions: ['EU', 'SG', 'AU'], bugBounty: true },
  'okex': { proofOfReserves: 'merkle', insuranceFund: true, withdrawalHaltHistory: false, licensedJurisdictions: ['EU', 'SG', 'AU'], bugBounty: true },
  // Bybit
  'bybit': { proofOfReserves: 'merkle', insuranceFund: true, withdrawalHaltHistory: false, licensedJurisdictions: ['EU'], bugBounty: true },
  // KuCoin
  'kucoin': { proofOfReserves: 'dashboard', insuranceFund: true, withdrawalHaltHistory: false, licensedJurisdictions: ['SC'], bugBounty: false },
  // Gate.io
  'gate': { proofOfReserves: 'merkle', insuranceFund: true, withdrawalHaltHistory: false, licensedJurisdictions: [], bugBounty: false },
  'gate-io': { proofOfReserves: 'merkle', insuranceFund: true, withdrawalHaltHistory: false, licensedJurisdictions: [], bugBounty: false },
  // Bitfinex
  'bitfinex': { proofOfReserves: 'dashboard', insuranceFund: false, withdrawalHaltHistory: true, licensedJurisdictions: ['VG'], bugBounty: false, notes: 'Hacked 2016, reimbursed via BFX token' },
  // Huobi / HTX
  'huobi': { proofOfReserves: 'merkle', insuranceFund: true, withdrawalHaltHistory: false, licensedJurisdictions: ['LT', 'EU'], bugBounty: false },
  'htx': { proofOfReserves: 'merkle', insuranceFund: true, withdrawalHaltHistory: false, licensedJurisdictions: ['LT', 'EU'], bugBounty: false },
  // MEXC
  'mexc': { proofOfReserves: 'merkle', insuranceFund: false, withdrawalHaltHistory: false, licensedJurisdictions: [], bugBounty: false },
  // Bitget
  'bitget': { proofOfReserves: 'merkle', insuranceFund: true, withdrawalHaltHistory: false, licensedJurisdictions: ['EU', 'AU'], bugBounty: false },
  // Gemini
  'gemini': { proofOfReserves: 'attested', insuranceFund: true, withdrawalHaltHistory: false, licensedJurisdictions: ['US', 'EU', 'UK', 'SG', 'AU', 'CA'], bugBounty: true, hasSocAudit: true },
  // Crypto.com
  'crypto-com': { proofOfReserves: 'attested', insuranceFund: false, withdrawalHaltHistory: false, licensedJurisdictions: ['EU', 'SG', 'AU', 'UK'], bugBounty: true },
  'cryptocom': { proofOfReserves: 'attested', insuranceFund: false, withdrawalHaltHistory: false, licensedJurisdictions: ['EU', 'SG', 'AU', 'UK'], bugBounty: true },
  // Deribit
  'deribit': { proofOfReserves: 'dashboard', insuranceFund: true, withdrawalHaltHistory: false, licensedJurisdictions: ['PA'], bugBounty: false },
  // Bitstamp
  'bitstamp': { proofOfReserves: 'attested', insuranceFund: true, withdrawalHaltHistory: false, licensedJurisdictions: ['EU', 'UK', 'US'], bugBounty: false, hasSocAudit: true },
  // Phemex
  'phemex': { proofOfReserves: 'merkle', insuranceFund: false, withdrawalHaltHistory: false, licensedJurisdictions: [], bugBounty: false },
  // FTX — permanent warning flag
  'ftx': { proofOfReserves: undefined, insuranceFund: false, withdrawalHaltHistory: true, licensedJurisdictions: [], bugBounty: false, notes: 'COLLAPSED Nov 2022 — do not use' },
};

// ─── Proof of Reserves Detection from Audit Note / Links ─────────────────────

const POR_MERKLE_SIGNALS  = ['merkle', 'merkle tree', 'merkle proof', 'cryptographic proof of reserves'];
const POR_ATTEST_SIGNALS  = ['armanino', 'mazars', 'kpmg', 'deloitte', 'attestation', 'third-party audit', 'third party audit', 'proof of reserves audit'];
const POR_DASH_SIGNALS    = ['proof of reserves', 'por dashboard', 'real-time reserves', 'nansen por', 'dune reserves'];
const INSURANCE_SIGNALS   = ['safu', 'insurance fund', 'iif', 'user protection fund', 'secure asset fund'];
const COLD_STORAGE_SIGNALS = ['cold storage', 'cold wallet', '95% cold', '90% cold', '98% cold', 'air-gapped', 'hardware security module', 'hsm'];
const CUSTODY_MULTISIG    = ['multi-sig custody', 'multisig custody', 'threshold signature', 'tss', 'mpc custody', 'fireblocks'];
const BUG_BOUNTY_SIGNALS  = ['bug bounty', 'hackerone', 'immunefi', 'vulnerability program'];
const REGULATED_SIGNALS   = ['regulated', 'licensed', 'fca', 'mas', 'sec regulated', 'cftc', 'finra', 'bafin', 'amf licence', 'vasp'];
const HACK_SIGNALS        = ['hacked', 'security breach', 'exploit', 'theft', 'funds lost', 'stolen'];

function detectFromText(signals: string[], text: string): boolean {
  return signals.some(s => text.includes(s));
}

function detectPorFromText(text: string): 'merkle' | 'attested' | 'dashboard' | null {
  if (detectFromText(POR_MERKLE_SIGNALS, text))  return 'merkle';
  if (detectFromText(POR_ATTEST_SIGNALS, text))  return 'attested';
  if (detectFromText(POR_DASH_SIGNALS, text))    return 'dashboard';
  return null;
}

// ─── Scoring Functions ────────────────────────────────────────────────────────

/** C1 — Proof of Reserves (max 20) */
function scorePor(por: string | null | undefined): number {
  if (por === 'merkle')    return 20; // cryptographically verifiable
  if (por === 'attested')  return 12; // third-party signed attestation
  if (por === 'dashboard') return 6;  // self-reported, real-time dashboard
  return 0;                            // none or unknown
}

/** C2 — Cold Storage Evidence (max 10) */
function scoreColdStorage(protocol: Protocol, text: string): number {
  if (detectFromText(COLD_STORAGE_SIGNALS, text)) return 7;
  // Large established exchanges likely use cold storage even without explicit mention
  if ((protocol.tvl ?? 0) > 5_000_000_000) return 4; // >$5B — almost certainly rigorous custody
  if ((protocol.tvl ?? 0) > 1_000_000_000) return 2;
  return 0;
}

/** C3 — Multi-sig Custody (max 10) */
function scoreCustodyMultisig(protocol: Protocol, text: string): number {
  if (detectFromText(CUSTODY_MULTISIG, text)) return 10;
  if (protocol.defiHasMultisig) return 7; // detected via on-chain analysis
  return 0;
}

/** R1 — Licensed Jurisdictions (max 12) */
function scoreLicensed(jurisdictions: string[] | null | undefined, text: string): number {
  const count = jurisdictions?.length ?? 0;
  if (count >= 4) return 12;
  if (count >= 2) return 8;
  if (count >= 1) return 5;
  // Try to detect from text
  if (detectFromText(REGULATED_SIGNALS, text)) return 4;
  return 0;
}

/** R2 — Insurance / SAFU Fund (max 8) */
function scoreInsurance(
  hasFund: boolean | null | undefined,
  text: string,
): number {
  if (hasFund) return 8;
  if (detectFromText(INSURANCE_SIGNALS, text)) return 4;
  return 0;
}

/** R3 — Bug Bounty Program (max 5) */
function scoreBugBounty(protocol: Protocol, text: string): number {
  const linkUrls = ((protocol.auditLinks as string[]) ?? []).join(' ').toLowerCase();
  if (detectFromText(BUG_BOUNTY_SIGNALS, text) || /immunefi\.com|hackerone\.com/.test(linkUrls)) return 5;
  return 0;
}

/** T1 — Operating Age (max 6) */
function scoreAge(protocol: Protocol): number {
  const years = (protocol.age ?? 0) / 365;
  if (years >= 7) return 6;
  if (years >= 5) return 5;
  if (years >= 3) return 4;
  if (years >= 1) return 2;
  return 0;
}

/** T2 — Security Audit / Pentest (max 8) */
function scoreSecurityAudit(protocol: Protocol, text: string): number {
  // For CEXs "audits" typically means pentests, SOC 2, or cybersecurity audits
  const count = protocol.auditCount ?? 0;
  const hasSoc = text.includes('soc 2') || text.includes('iso 27001') || text.includes('soc2');
  const hasPentest = text.includes('pentest') || text.includes('penetration test') || text.includes('red team');
  if (count >= 2 || (hasSoc && count >= 1)) return 8;
  if (count >= 1 || hasSoc || hasPentest) return 5;
  return 0;
}

/** T3 — Social / Transparency (max 3) */
function scoreTransparency(protocol: Protocol): number {
  let s = 0;
  if (protocol.twitter) s += 1;
  if (protocol.website) s += 1;
  if (protocol.description && protocol.description.length > 50) s += 1;
  return Math.min(s, 3);
}

/** T4 — Public Company / Registration (max 3) */
function scoreCompanyRegistration(protocol: Protocol, text: string): number {
  // CEXs that mention registered company, licensed entity, corporate registration
  if (text.includes('registered company') || text.includes('incorporated') ||
      text.includes('legal entity') || text.includes('publicly listed') ||
      text.includes('nasdaq') || text.includes('nyse')) return 3;
  // Presence of regulated-domain signals
  if (detectFromText(REGULATED_SIGNALS, text)) return 1;
  return 0;
}

// ─── CEX Penalties ────────────────────────────────────────────────────────────

interface CexPenalty {
  reason: string;
  deduction: number;
}

function detectCexPenalties(
  protocol: Protocol,
  text: string,
  haltHistory: boolean | null | undefined,
): CexPenalty[] {
  const penalties: CexPenalty[] = [];

  // Withdrawal freeze history — the defining CEX risk
  if (haltHistory) {
    penalties.push({ reason: 'History of freezing user withdrawals', deduction: 15 });
  }

  // Hack with significant user losses in text
  if (detectFromText(HACK_SIGNALS, text) && !text.includes('reimbursed') && !text.includes('compensated')) {
    penalties.push({ reason: 'Security breach with unconfirmed user reimbursement', deduction: 10 });
  }

  // FTX / collapsed exchanges
  const nameLower = protocol.name.toLowerCase();
  if (['ftx', 'blockfi', 'celsius', 'voyager', 'babel finance'].some(n => nameLower.includes(n))) {
    penalties.push({ reason: 'Exchange collapsed — user funds lost or unrecovered', deduction: 30 });
  }

  // No public website
  if (!protocol.website) {
    penalties.push({ reason: 'No public website', deduction: 3 });
  }

  return penalties;
}

// ─── Main CEX Scorer ─────────────────────────────────────────────────────────

export interface CexScoreResult {
  score: number;
  severity: 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  scoringModel: 'DFJ-CEX-v1.0';
  breakdown: {
    custody:    { por: number; coldStorage: number; multisig: number; total: number };
    regulatory: { licensed: number; insurance: number; bugBounty: number; total: number };
    trackRecord: { age: number; audit: number; transparency: number; registration: number; total: number };
    grossScore: number;
    penalties:  CexPenalty[];
    totalPenalty: number;
  };
  detectedFacts: {
    porLevel: string | null;
    hasInsuranceFund: boolean;
    hasWithdrawalHaltHistory: boolean;
    licensedJurisdictions: string[];
    hasBugBounty: boolean;
    hasColdStorage: boolean;
    hasCustodyMultisig: boolean;
  };
  recommendations: string[];
}

export function scoreCex(protocol: Protocol): CexScoreResult {
  // Merge DB fields with known-facts lookup (DB fields win if set)
  const idKey = protocol.id.toLowerCase();
  const nameKey = protocol.name.toLowerCase().replace(/[\s\.\-]/g, '-');
  const known = KNOWN_CEX_FACTS[idKey] || KNOWN_CEX_FACTS[nameKey] ||
    // partial match for e.g. "binance-futures" → "binance"
    Object.entries(KNOWN_CEX_FACTS).find(([k]) => idKey.startsWith(k) || nameKey.startsWith(k))?.[1];

  const rawNote = ((protocol.auditNote ?? '') + ' ' + ((protocol.auditLinks as string[]) ?? []).join(' ')).toLowerCase();

  // Resolved values — DB columns override known facts
  const por: 'merkle' | 'attested' | 'dashboard' | 'none' | null =
    (protocol as any).cexProofOfReserves ??
    detectPorFromText(rawNote) ??
    known?.proofOfReserves ??
    null;

  const insuranceFund: boolean =
    (protocol as any).cexInsuranceFund ??
    known?.insuranceFund ??
    detectFromText(INSURANCE_SIGNALS, rawNote);

  const haltHistory: boolean =
    (protocol as any).cexWithdrawalHaltHistory ??
    known?.withdrawalHaltHistory ??
    false;

  const jurisdictions: string[] =
    (protocol as any).cexLicensedJurisdictions ??
    known?.licensedJurisdictions ??
    [];

  const hasBugBounty = known?.bugBounty ?? detectFromText(BUG_BOUNTY_SIGNALS, rawNote);
  const hasColdStorage = detectFromText(COLD_STORAGE_SIGNALS, rawNote) || (known !== undefined && (protocol.tvl ?? 0) > 1_000_000_000);
  const hasCustodyMultisig = detectFromText(CUSTODY_MULTISIG, rawNote) || !!protocol.defiHasMultisig;

  // ── Custody & Reserves (max 40) ──
  const c1 = scorePor(por);
  const c2 = scoreColdStorage(protocol, rawNote);
  const c3 = scoreCustodyMultisig(protocol, rawNote);
  const custodyTotal = Math.min(c1 + c2 + c3, 40);

  // ── Regulatory & Compliance (max 25) ──
  const r1 = scoreLicensed(jurisdictions, rawNote);
  const r2 = scoreInsurance(insuranceFund, rawNote);
  const r3_raw = scoreBugBounty(protocol, rawNote);
  const r3 = hasBugBounty ? Math.max(r3_raw, 5) : r3_raw;
  const regulatoryTotal = Math.min(r1 + r2 + r3, 25);

  // ── Track Record & Transparency (max 20) ──
  const t1 = scoreAge(protocol);
  const t2 = scoreSecurityAudit(protocol, rawNote);
  const t3 = scoreTransparency(protocol);
  const t4 = scoreCompanyRegistration(protocol, rawNote);
  const trackTotal = Math.min(t1 + t2 + t3 + t4, 20);

  const grossScore = Math.min(custodyTotal + regulatoryTotal + trackTotal, 85);

  // ── Penalties (max -30) ──
  const rawPenalties = detectCexPenalties(protocol, rawNote, haltHistory);
  const totalPenalty = Math.min(rawPenalties.reduce((s, p) => s + p.deduction, 0), 30);

  const finalScore = Math.max(0, Math.min(97, grossScore - totalPenalty));

  let severity: CexScoreResult['severity'];
  if (finalScore >= 80)      severity = 'SAFE';
  else if (finalScore >= 65) severity = 'LOW';
  else if (finalScore >= 50) severity = 'MEDIUM';
  else if (finalScore >= 30) severity = 'HIGH';
  else                       severity = 'CRITICAL';

  // ── Recommendations ──
  const recs: string[] = [];
  if (!por || por === 'none') recs.push('No proof of reserves detected — cannot verify solvency');
  else if (por === 'dashboard') recs.push('Self-reported PoR dashboard — seek independent Merkle-tree verification');
  if (!insuranceFund)         recs.push('No insurance or SAFU fund — user funds unprotected in an insolvency event');
  if (!hasBugBounty)          recs.push('No bug bounty program — security vulnerabilities may go unreported');
  if (jurisdictions.length === 0) recs.push('No confirmed regulatory licenses — limited user protection recourse');
  if (haltHistory)            recs.push('History of halting withdrawals — verify current withdrawal status before depositing');
  if (finalScore >= 65)       recs.push('Above-average CEX security posture — normal diligence applies');
  if (finalScore < 30)        recs.push('CRITICAL: Multiple major red flags — do not deposit funds');

  return {
    score: finalScore,
    severity,
    scoringModel: 'DFJ-CEX-v1.0',
    breakdown: {
      custody:    { por: c1, coldStorage: c2, multisig: c3, total: custodyTotal },
      regulatory: { licensed: r1, insurance: r2, bugBounty: r3, total: regulatoryTotal },
      trackRecord: { age: t1, audit: t2, transparency: t3, registration: t4, total: trackTotal },
      grossScore,
      penalties: rawPenalties,
      totalPenalty,
    },
    detectedFacts: {
      porLevel: por,
      hasInsuranceFund: insuranceFund,
      hasWithdrawalHaltHistory: haltHistory,
      licensedJurisdictions: jurisdictions,
      hasBugBounty,
      hasColdStorage,
      hasCustodyMultisig,
    },
    recommendations: recs,
  };
}
