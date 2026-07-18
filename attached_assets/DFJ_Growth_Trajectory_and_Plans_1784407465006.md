# DeFiJerusalem — Growth Trajectory & Strategic Plans
*Consolidated from working session discussions*

---

## 1. Founding Goal (unchanged, confirmed still the north star)

Address the information gap preventing DeFi users from assessing protocol security — modeled explicitly on the transparency CoinMarketCap brought to token prices, but for security instead of price.

The specific, named problem: many protocols ignore bug bounty reports, have poor security practices, or respond late to disclosures, and there is no independent, transparent, evidence-based way to see that pattern before depositing funds or capital.

Everything below should trace back to this thesis. If a feature doesn't serve it, it's scope creep.

---

## 2. What Already Exists (the real asset, not aspirational)

- **The DFJ-Pattern-checker**: open-source, evidence-gated pattern library. 27 patterns/checks across 8 categories plus cross-cutting checks in SKILL.md.
- **~90+ independently verified real incidents** anchoring the library, 2020–2026, each cross-checked against existing entries and verified via primary source before being added.
- **Pre-deployment mode**: conversational intake letting a team check a design before writing code, no manual form required.
- **Weekly self-check**: a self-limiting freshness mechanism (runs at most once per 7 days).
- **A real, demonstrated track record of public self-correction**: the Summer.fi incident was tracked through four competing technical analyses, corrected twice as better information emerged, with the discipline of separating "confirmed" from "inferred" explicitly stated in the entry itself.
- **A real, personal proof point**: a critical vulnerability found on SSV Network via Immunefi, using the pattern checker's SIMILAR MATCH flag as a lead, then independently verified and escalated by hand — the first bounty submission, with zero prior reputation, resulting in a real, serious finding.

This is the actual credibility foundation. It is not nothing — it just isn't "the biggest security directory in web3" yet, and shouldn't be presented as if it already is.

---

## 3. The Two Audiences — Kept Deliberately Distinct

### Institutional / capital allocators
**What they actually need:** rigorous, independent, liability-grade due diligence before and during deployment of capital — not real-time alerts.
**What serves them:** the pattern checker's existing methodology, packaged as a due-diligence product. This mostly already exists; it needs positioning and a "targeted package," not new infrastructure.
**The hard constraint:** independence must be structurally protected. If capital allocators are paying customers, they cannot be able to influence what gets published about protocols they're evaluating. Subscriptions should pay for *access to the same independent data everyone sees* — never for favorable coverage.

### Retail users / community
**What they actually need:** awareness during live incidents, and a trustworthy place to check a protocol's standing history.
**What serves them:** an alert-aggregation-with-verification layer (see Section 4) plus the open pattern checker itself.

---

## 4. On Real-Time Detection vs. Aggregation — A Real Distinction, Resolved

**The idea raised:** build an AI agent directly monitoring protocols, instantly reporting abnormal transactions as they happen, rather than waiting for RSS/X to announce a hack.

**Why this is harder than it sounds, stated honestly:** this is a fundamentally different product category from everything built this session. It requires persistent, always-on infrastructure indexing mempool/transaction data continuously across every covered chain — not something achievable in a conversational AI tool, and not something buildable without real capital.

**Who already does this well, and why that matters:** Blockaid, Forta, Hypernative, and Cyvers already run mature, well-funded, live on-chain anomaly detection. This is a crowded, capital-intensive space with real incumbents — not an open gap the way bounty-response-tracking is.

**The resolved, buildable version:** don't compete at detection. Compete at the layer *after* detection. Pull already-existing alerts from Blockaid/Forta/PeckShield/CertiK via their public feeds the moment they post, then apply DeFiJerusalem's actual differentiator — the verification discipline just demonstrated live on Summer.fi: track competing accounts, explicitly flag confidence level, correct publicly as better information emerges, land on a verified entry once the dust settles.

**This is the real insight:** Blockaid alerted on Summer.fi in minutes. The *verified, correct mechanism* took four competing analyses and two honest corrections over the following day. That gap — alert to verified truth — is where DeFiJerusalem adds value the incumbents don't provide, because their job ends at the alert.

---

## 5. The Narrow, Defensible Starting Scope for the Aggregator

**The problem with "biggest security directory in web3" as a starting point:** it's the end state, not a buildable spec, and announcing full scope before being able to support it damages credibility rather than building it.

**The real, specific, currently-underserved gap identified:** tracking whether protocols actually honor their own bug bounty programs — response times, disclosure handling, history of ignored reports, whether a "bounty program" is real or theater.

This maps directly onto two things already built into the pattern checker:
- The **Audit/Bounty Scope Coverage** watch-item (are deployed contracts actually in bounty scope)
- The **GemPad audit-integrity check (5d)** — was the audited code verifiably the deployed code, with no undisclosed post-audit changes

Nobody is rigorously, independently tracking protocol responsiveness and disclosure integrity at scale right now. Immunefi tracks that bounty programs exist; nothing independent tracks whether they're honored well. This is a real, narrow, buildable starting point directly serving the founding thesis — not a departure from it.

---

## 6. Funding & Building in Public

**The real tension:** "build the biggest directory in web3" and "no money" are in direct conflict if pursued simultaneously. The workable path is sequential, not parallel.

**What building in public should mean concretely:**
- Push real commits as work happens, not a polished reveal
- Publish the Summer.fi case study — it demonstrates the actual discipline rather than just claiming it (drafted for Remedy Blog this session, ready to adapt)
- Be explicit publicly about what's real now (the pattern checker, ~90 verified incidents) versus aspirational (the full directory, live monitoring, the bounty economy) — the gap stated honestly is fine; the gap implied as already closed is not

**On the token presale as the actual funding mechanism:** the presale terms already built (see companion document, `dfj_token_utility_presale.pdf`) are the real path to funding a genuine bounty system. Building in public makes that eventual presale more credible because there's a real track record behind it — it doesn't replace the need to execute the presale plan itself.

**Sequencing:**
1. **Now, no capital required:** package the existing pattern checker as the institutional due-diligence product; start the narrow bounty-integrity tracking layer
2. **Next, still low-capital:** the alert-aggregation-with-verification layer, built on existing third-party feeds
3. **Later, requires real capital:** proprietary live detection infrastructure — only if it proves genuinely differentiated enough to justify building instead of continuing to aggregate

---

## 7. Bounty System Design — The Reputation-Gate Problem

**The real, structural problem identified:** platforms like HackenProof gate access to higher-value bounty programs behind reputation points, meaning a genuinely skilled beginner researcher cannot get in the door regardless of finding quality. This is a legitimate anti-spam mechanism for triage teams, but it's also a real barrier that blocks new talent — including, directly, your own first submission (SSV Network) had this been gated the same way.

**The design commitment worth making now, before the bounty system is built:** no reputation tier at entry. Every submission — regardless of who submits it — goes through the same verification process already demonstrated throughout this entire session (cross-check against existing findings, verify against primary sources, decide on merit). Reputation, if tracked at all, should be a visible record of past contributions for community reference — never a gate determining who is allowed to submit.

This is a genuine, low-cost differentiator from existing bounty platforms, directly solving a problem you experienced firsthand, and reinforces the founding thesis: independent, evidence-based, accessible to whoever can produce the evidence — not gated by pedigree.

---

## 8. Standing Open Items

- **GitHub repo principles placement** — confirm exactly where the four working principles were added in the live repo (SKILL.md section, README, or elsewhere) before drafting any public post about it.
- **The institutional "targeted package"** — needs concrete definition: what's actually included (scheduled re-scores? priority incident notification? direct query access to specific findings?).
- **The narrow aggregator MVP** — needs a concrete data schema: what specific fields get tracked per protocol for bounty/disclosure-integrity tracking, and how it's scored or displayed.

---

*This document consolidates strategic and business discussions only. For the technical pattern library, methodology, and reference files, see the companion DFJ-Pattern-checker repository deliverables.*
