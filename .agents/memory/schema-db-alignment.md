---
name: Schema-DB alignment
description: Critical rule about keeping schema.ts in sync with actual DB columns, learned the hard way.
---

## Rule
Never assume schema.ts matches the DB after a partial rewrite. Always run `SELECT column_name FROM information_schema.columns WHERE table_name = '...'` to verify before writing Drizzle table definitions.

**Why:** A full rewrite of schema.ts renamed columns (e.g. `timestamp`→`addedAt`, `password`→`passwordHash`, `uploaded_at`→`created_at`) that diverged from the real DB, causing `tsx` (which skips type checks) to generate broken SQL at runtime.

**How to apply:**
- Before rewriting any table definition, query the actual DB columns first.
- When adding new tables alongside existing ones, only define the new ones; leave existing table definitions intact.
- `drizzle-kit push` hangs on interactive prompts when it detects possible renames — use raw SQL (`CREATE TABLE IF NOT EXISTS`) for new tables instead.
- After any schema change, do a smoke-start and check the first DB query that runs (often `getBlacklist` or `getProtocols`) against actual column names.

## Key column name facts (actual DB)
- `blacklist_entries`: uses `timestamp` (not `added_at`), has `website`, `twitter`, `github`, `security_metrics`, `last_vetted`
- `admin_users`: uses `password_hash` (not `password`), has `email`, `role`
- `tutorial_videos`: uses `uploaded_at` (not `created_at`)
- `ai_scan_history`: uses `entity_id`, `entity_name`, `entity_type`, `timestamp`
- `ai_learned_patterns`: uses `first_seen`, `last_seen` (not `created_at`/`updated_at`)
- `user_reports`: uses `upvotes`, `downvotes`, `submitted_at`, `admin_notes`, `target_id`, `target_name`
- `user_reputation`: uses `user_identifier` (not `email`)
- `protocol_submissions`: uses `protocol_name`, `submitter_email`, `submitter_name`, etc.
- `protocol_whitelist`: has `protocol_name`, `verification_source`, `certik_score`, `last_verified`
