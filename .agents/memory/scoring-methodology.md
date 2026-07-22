---
name: DFJ v2.4 Scoring Methodology
description: Current live scoring model. Higher = safer. Max 97. Supersedes v2.3.
---

## Direction
**HIGHER IS BETTER.** 97 = safest, 0 = most dangerous.

## Formula — sequencing is critical
```
Gross Score  = Foundation (0–45) + Active (0–55) + Predictive Bonus (0–3)
Capped Score = min(97, Gross Score)          ← cap applied BEFORE penalties
Final Score  = Capped Score − Category Penalty − CCR − Inherited Risk − Supply Chain − Audit/Bounty Scope
```
Example: gross 100 − capped to 97 − 5 penalty = 92, not 95.

## Foundation (max 45 pts)

### F1. Audit & Verification — 18 pts
Tier base points: Tier 1 (Trail of Bits/OpenZeppelin/Certora) = 22, Tier 2 (Quantstamp/PeckShield/Hacken/SlowMist) = 16, Tier 3 (CertiK/SolidProof/TechRate) = 12, no audit = 3.
`decay = max(0.50, 1.0 − (age_months / 48))`; if unresolved critical findings: ×0.5.
`F1 = min(18, base × decay × critical_penalty)`

### F2. Code & Contract History — 12 pts
- Source code verified on-chain: 6 pts
- Clean scan (Slither/Mythril/Echidna), zero critical/high findings: 6 pts

### F3. Track Record — 10 pts
Age up to 8 pts (48+ months = full 8). Exploit modifier: +2 never exploited → −10 severe unresolved. Floor 0, cap 10.

### F4. Documentation — 3 pts
Technical docs 1.5 + admin controls documented 1.5

### F5. Historical Governance — 2 pts
On-chain DAO 1.5 + timelock 0.5

## Active Security (max 55 pts)

### A1. Security Infrastructure — 22 pts
- **A1a Access Controls — 12 pts** (HARD RULE: <50% multisig threshold = 0, no exceptions — Radiant Capital $53M)
  - DAO/Immutable or Timelock+Multisig ≥71%: 12
  - Multisig ≥71% (no timelock): 8
  - Multisig 60–70%: 5 | 50–59%: 3 | <50%: 0 FAIL | EOA: 0
- **A1b Oracle Security — 6 pts**: multiple independent = 6, single = 3, custom/unaudited = 0
- **A1c Emergency Response — 4 pts**: circuit breaker 2 + emergency withdrawal 2

### A2. Incident Response — 17 pts (15 + 2 chain-level)
- **A2a Bug Bounty — 11 pts**: API-verified (Immunefi/HackerOne), hybrid $+TVL% scoring, recent payout ≤90 days for full credit
- **A2b Ongoing Vigilance — 4 pts**: 1 each for monitoring alerts, security updates, bounty payout (all last 30/90 days), community
- **A2c Chain-Level Vigilance — 2 pts**: base chain/L2 posture (validator decentralization, incident history, funded bounty). 1pt ≥2/3 criteria, 2pt all 3. Resolves the 53→55 gap.

### A3. Proactive Monitoring — 7 pts
Static analysis 4 + real-time monitoring (3+ platforms full, 1–2 partial, 0 none) 3

### A4. Economic Health — 6 pts
TVL stability 2 + revenue 2 + user retention 1 + liquidity 1

### A5. Live Governance — 3 pts
Active governance ops 1 + transparency 1 + execution speed 1

## Predictive Bonus (0–3 pts)
New protocols only, < 6 months old, expires automatically at 6 months.
+1 formal verification (Certora/Runtime Verification), +1 clean Tier 1 audit, +1 bounty ≥2% of TVL

## Penalties (max −32 combined)

### Category Penalty — ceiling −15
One per protocol, drawn from primary functional category. v2.4: holistic evidence-informed assessment, not pattern-sum.
- No findings / CANNOT DETERMINE: 0
- SIMILAR MATCH single-incident watch items: −1 to −4
- SIMILAR MATCH validated pattern or multiple SIMILARs: −4 to −8
- One EXACT MATCH validated pattern: −8 to −12
- Multiple EXACT or EXACT on large incident base: −12 to −15
Hard rule: written justification required for every non-zero penalty.
Special case: permissionless market frameworks (Morpho Blue, Silo, JustLend V2) → assess per market, not protocol-wide.

### Concentrated Control Risk — ceiling −5
EXACT MATCH (power concentrated, no friction): −5 | SIMILAR: −2.5 | NOT PRESENT: 0

### Inherited Risk — ceiling −5
Dependency on another protocol's unresolved finding passes through, capped at −5 (never at the dependent category's −15 ceiling).

### Supply Chain Risk — ceiling −5
Frontend/release-pipeline attack surface. Confirmed applicable across all 8 categories.

### Audit/Bounty Scope Coverage — ceiling −2 (watch-item only)
Checks deployed contracts vs claimed audit/bounty scope. Cannot reach EXACT MATCH — max −2.

## Severity Thresholds (higher = safer)
- 80–97: SAFE (green)
- 65–79: LOW risk (blue)
- 50–64: MEDIUM (yellow)
- 30–49: HIGH risk (orange)
- 0–29: CRITICAL (red) → auto-blacklist candidate

## UI Color Convention
green ≥80, blue ≥65, yellow ≥50, orange ≥30, red <30

## Source
PDF: DFJ_Methodology_v2.4_RECONCILED (uploaded 2026-07-22). Rebuilt from verified v2.3 source; only the category penalty structure changed in v2.4 (pattern-specific sums → holistic ceiling assessment).

**Why:** v2.3 pattern-sum values like "−4.5" were judgment calls dressed as precision. v2.4 decouples the score from the growing pattern library so the library can evolve without methodology revision.
