---
name: Bounty & audit firm tables
description: How the bounty system and audit firm pipeline tables were created and where the routes live.
---

## Tables added
Six new tables created via raw SQL (not drizzle-kit push):
- `community_users` — earns points, identified by email or wallet
- `bounty_tasks` — admin-posted tasks with point rewards
- `bounty_submissions` — both task completions and self-submitted findings
- `points_ledger` — immutable point award log
- `audit_firms` — registered audit firms with cached reputation metrics
- `audit_firm_claims` — firm claims on protocol audits (pending/verified/rejected)
- `audit_firm_reviews` — community ratings 1-5

## Why raw SQL instead of drizzle-kit push
`drizzle-kit push` detected the new tables and showed an interactive prompt asking whether to CREATE or RENAME from existing tables. Piping `\n` didn't dismiss it. Raw `CREATE TABLE IF NOT EXISTS` in CodeExecution SQL callback is the reliable alternative.

## Routes file
All bounty/audit routes are in `server/routes/bounty-audit-routes.ts`, registered via `registerBountyAuditRoutes(app)` called at the bottom of `server/routes.ts` (before `createServer`).

## Frontend pages
- `/bounties` → `BountiesPage.tsx` — task board, leaderboard, how-it-works, self-submit dialog
- `/audit-firms` → `AuditFirmsPage.tsx` — directory with reputation explanation
- `/audit-firms/:id` → `AuditFirmDetail.tsx` — firm profile, claims, reviews
- `/audit-firms/register` → `AuditFirmRegister.tsx` — registration form

**Important:** Route order in App.tsx matters — `/audit-firms/register` must come before `/audit-firms/:id` to prevent "register" being matched as an `:id` param.

## Reputation recalculation
`recalcFirmReputation(firmId)` in the routes file recomputes all cached metrics on the `audit_firms` row whenever a claim is approved/rejected or a review is submitted.

## Business rules
- No reputation gate at entry — all submissions reviewed on merit
- Points are permanent and will exchange for DFJ tokens post-launch
- `bountySubmissions.taskId` is null for self-submissions
- Submission type values: `task_completion`, `vulnerability_report`, `data_correction`, `protocol_flag`, `research`
