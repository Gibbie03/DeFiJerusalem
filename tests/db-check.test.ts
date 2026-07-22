/**
 * Integration tests for `npm run db:check` (scripts/check-db-schema.sh)
 *
 * Covered scenarios:
 *   1. The real shared/schema.ts produces exit code 0 (valid schema).
 *   2. A schema that uses a removed/non-existent drizzle-orm export produces
 *      a non-zero exit code (ORM API breakage detected).
 *
 * Strategy
 * ────────
 * For the "broken" scenario we write a minimal temporary schema that imports a
 * symbol that does NOT exist in drizzle-orm (`pgTableRemovedInV2` — a made-up
 * name), together with a temporary drizzle config that points at that schema.
 * We then run `npx drizzle-kit generate` against that temp config directly so
 * the real shared/schema.ts is never touched.
 *
 * For the "valid" scenario we run the actual `npm run db:check` script end-to-end
 * with a placeholder DATABASE_URL so no live connection is required.
 */

import { describe, it, expect, afterAll } from 'vitest';
import { spawnSync } from 'child_process';
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'fs';
import path from 'path';
import os from 'os';

// ─── helpers ────────────────────────────────────────────────────────────────

const ROOT = process.cwd();

/** Run a command synchronously and return exit code + combined output. */
function run(
  cmd: string,
  args: string[],
  opts: { cwd?: string; env?: Record<string, string> } = {},
): { exitCode: number; output: string } {
  const result = spawnSync(cmd, args, {
    cwd: opts.cwd ?? ROOT,
    encoding: 'utf8',
    env: {
      ...process.env,
      // Suppress interactive prompts that drizzle-kit may emit
      CI: 'true',
      // Supply a placeholder so drizzle configs that guard DATABASE_URL don't throw
      DATABASE_URL: 'postgresql://placeholder/placeholder',
      ...(opts.env ?? {}),
    },
  });
  const output = (result.stdout ?? '') + (result.stderr ?? '');
  return { exitCode: result.status ?? 1, output };
}

// ─── temporary fixtures ──────────────────────────────────────────────────────

const TMP_DIR = path.join(os.tmpdir(), `drizzle-test-${process.pid}`);
const BROKEN_SCHEMA = path.join(TMP_DIR, 'broken-schema.ts');
const BROKEN_CONFIG = path.join(TMP_DIR, 'drizzle.broken.config.ts');
const BROKEN_OUT = path.join(TMP_DIR, 'output');

/** Broken schema: imports a symbol that does not exist in drizzle-orm */
const BROKEN_SCHEMA_CONTENT = `
// This schema deliberately imports a non-existent drizzle-orm export to
// simulate a drizzle-orm major-version API removal.
import { pgTable, text, pgTableRemovedInV2 } from 'drizzle-orm/pg-core';

export const dummy = pgTable('dummy', {
  id: text('id').primaryKey(),
});

// Force usage so tree-shaking can't hide the missing import
export const _unused = pgTableRemovedInV2;
`;

/** Minimal drizzle config pointing at the broken schema */
const BROKEN_CONFIG_CONTENT = `
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: ${JSON.stringify(BROKEN_OUT)},
  schema: ${JSON.stringify(BROKEN_SCHEMA)},
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL ?? 'postgresql://placeholder/placeholder' },
});
`;

// Create fixtures before any test runs
mkdirSync(TMP_DIR, { recursive: true });
mkdirSync(BROKEN_OUT, { recursive: true });
writeFileSync(BROKEN_SCHEMA, BROKEN_SCHEMA_CONTENT, 'utf8');
writeFileSync(BROKEN_CONFIG, BROKEN_CONFIG_CONTENT, 'utf8');

// Clean up after the whole suite
afterAll(() => {
  if (existsSync(TMP_DIR)) {
    rmSync(TMP_DIR, { recursive: true, force: true });
  }
});

// ─── tests ───────────────────────────────────────────────────────────────────

describe('db:check (scripts/check-db-schema.sh)', () => {
  it(
    'exits 0 when shared/schema.ts is valid',
    () => {
      const { exitCode, output } = run('bash', ['scripts/check-db-schema.sh'], {
        env: { DATABASE_URL: 'postgresql://placeholder/placeholder' },
      });

      // Provide the output so failures are easy to diagnose in CI
      expect(exitCode, `db:check output:\n${output}`).toBe(0);
      expect(output).toMatch(/OK:/);
    },
    // drizzle-kit can take a while on a cold cache
    60_000,
  );

  it(
    'exits non-zero when a schema imports a removed drizzle-orm export',
    () => {
      // Run the real check-db-schema.sh script but override DRIZZLE_CHECK_CONFIG
      // to point at the broken schema fixture so shared/schema.ts is never touched.
      const { exitCode, output } = run('bash', ['scripts/check-db-schema.sh'], {
        env: {
          DATABASE_URL: 'postgresql://placeholder/placeholder',
          DRIZZLE_CHECK_CONFIG: BROKEN_CONFIG,
        },
      });

      expect(
        exitCode,
        `Expected non-zero exit for broken schema, got 0.\nscript output:\n${output}`,
      ).not.toBe(0);
    },
    60_000,
  );
});
