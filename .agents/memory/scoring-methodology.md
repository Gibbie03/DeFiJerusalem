---
name: DFJ v2.3 Scoring Methodology
description: Full scoring model implemented in security-verification.ts and unified-security-scanner.ts. Higher = safer. Max 97 for established protocols.
---

## Direction
**HIGHER IS BETTER.** 97 = safest, 0 = most dangerous. This replaced the old lower-is-better system.

## Score Structure

### Foundation (max 45 pts) — "what they built"
- F1. Audit & Verification: 18 pts
- F2. Code & Contract History: 12 pts
- F3. Track Record: 10 pts
- F4. Documentation: 3 pts
- F5. Historical Governance: 2 pts

### Active (max 55 pts) — "how they protect now"
- A1. Security Infrastructure (multisig 9, timelock 8, open-source 3, audited 2): 22 pts
- A2. Incident Response (bug bounty 7+3, community 3, multi-audit 2): 15 pts
- A3. Proactive Monitoring: 7 pts
- A4. Economic Health (TVL tiers, chains, category): 6 pts
- A5. Live Governance (multisig 1, twitter 1, website 1): 3 pts
- A6. Ongoing Vigilance: 2 pts

### Penalties (max -30, subtractive)
- Critical keywords (drainer, honeypot, rug, scam): -15 each
- High keywords (clone, giveaway, 1000x): -7 each
- Medium keywords (unaudited): -3 each
- Typosquatting major protocol: -5
- GoPlus honeypot: -15, proxy no source: -8, unverified: -5
- AI patterns: -ceil(confidence × 5) each

### Final Score
`clamp(Foundation + Active - Penalties, 0, 97)`

## Severity Thresholds (higher = safer)
- 80–97: SAFE (green)
- 65–79: LOW risk (blue)
- 50–64: MEDIUM (yellow)
- 30–49: HIGH risk (orange)
- 0–29: CRITICAL (red) → auto-blacklist candidate

## Files
- `server/lib/security-verification.ts` — Foundation scoring (F1–F5)
- `server/lib/unified-security-scanner.ts` — Active scoring + combined DFJ score
- `server/lib/dapp-discovery.ts` → `calculateSecurityScore()` — simplified quick score on import

## UI Color Convention (all score displays)
- 80+: green, 65+: blue, 50+: yellow, 30+: orange, <30: red

## Data Migration
After switching direction, run SQL UPDATE on `protocols` table to recompute `security_score` from existing column values using the new direction formula (see history). Existing cached scores from old system (lower=better) are invalid.

**Why:** All previously stored security_score values were computed with lower=better; migrating ensures the cached column matches the new display convention even before protocols are rescanned.
