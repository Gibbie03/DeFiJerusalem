// drizzle.check.config.ts
//
// Used exclusively by `npm run db:check` (scripts/check-db-schema.sh).
// Identical to drizzle.config.ts except it writes generated SQL to a
// temporary directory so the project migrations/ folder is never touched.
//
// DATABASE_URL is required by drizzle-kit even for `generate` (no connection
// is made); the check script supplies a placeholder if the env var is absent.

import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set (use a placeholder value for db:check)");
}

export default defineConfig({
  out: "/tmp/drizzle-schema-check",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
