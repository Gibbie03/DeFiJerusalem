/**
 * Smoke tests for scripts/setup-admin.ts and scripts/reset-admin-password.ts
 *
 * Covered scenarios (per script):
 *   1. Exits 1 when DATABASE_URL is completely missing.
 *   2. Exits 1 and prints the human-readable connectivity error when the
 *      database host is unreachable (deliberately broken DATABASE_URL).
 *
 * Strategy
 * ────────
 * We run each script via `npx tsx <script>` with a crafted environment:
 *
 *   • Missing DATABASE_URL  → the guard at the top of each script fires.
 *   • Broken DATABASE_URL   → Pool connects to 127.0.0.1:1 which produces an
 *     immediate ECONNREFUSED, so checkDbConnectivity() prints the friendly
 *     message and exits 1 without hanging.
 *
 * The ADMIN_USERNAME / ADMIN_NEW_PASSWORD vars are supplied so that
 * reset-admin-password.ts passes its argument-validation guards and reaches
 * the connectivity check.
 *
 * We do NOT need a real database — the test must not require DATABASE_URL.
 */

import { describe, it, expect } from 'vitest';
import { spawnSync } from 'child_process';
import path from 'path';

// ─── constants ────────────────────────────────────────────────────────────────

const ROOT = process.cwd();

/**
 * A URL that resolves instantly to ECONNREFUSED (nothing listens on port 1).
 * Using an IP address avoids any DNS lookup latency.
 */
const BROKEN_URL = 'postgresql://bad:bad@127.0.0.1:1/db';

/** Environment variables that satisfy reset-admin-password.ts argument guards */
const RESET_ENV: Record<string, string> = {
  ADMIN_USERNAME:     'someadmin',
  ADMIN_NEW_PASSWORD: 'ValidPass1',
};

// ─── helper ───────────────────────────────────────────────────────────────────

interface RunResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

/**
 * Runs `npx tsx <scriptPath>` synchronously with the supplied environment
 * merged on top of a minimal clean env (no DATABASE_URL by default).
 */
/** Absolute path to the tsx binary shipped with this project's node_modules. */
const TSX = path.join(ROOT, 'node_modules', '.bin', 'tsx');

function runScript(
  scriptRelPath: string,
  env: Record<string, string> = {},
): RunResult {
  const result = spawnSync(TSX, [path.join(ROOT, scriptRelPath)], {
    encoding: 'utf8',
    // Give the process a comfortable ceiling — ECONNREFUSED is instant but
    // neon's WebSocket setup can add a few hundred ms of event-loop overhead.
    timeout: 30_000,
    env: {
      // Forward PATH and other env vars tsx itself needs on NixOS.
      PATH:            process.env.PATH             ?? '',
      HOME:            process.env.HOME             ?? '',
      XDG_CONFIG_HOME: process.env.XDG_CONFIG_HOME  ?? '',
      XDG_DATA_HOME:   process.env.XDG_DATA_HOME    ?? '',
      // Do NOT forward DATABASE_URL from the test runner — tests that need it
      // supply it explicitly.
      ...env,
    },
  });

  return {
    exitCode: result.status ?? 1,
    stdout:   result.stdout ?? '',
    stderr:   result.stderr ?? '',
  };
}

// ─── setup-admin.ts ───────────────────────────────────────────────────────────

describe('scripts/setup-admin.ts', () => {
  it('exits 1 and prints a DATABASE_URL error when DATABASE_URL is not set', () => {
    const { exitCode, stderr } = runScript('scripts/setup-admin.ts');

    expect(exitCode).toBe(1);
    expect(stderr).toMatch(/DATABASE_URL/i);
  });

  it(
    'exits 1 and prints the human-readable connectivity error for an unreachable host',
    () => {
      const { exitCode, stderr } = runScript('scripts/setup-admin.ts', {
        DATABASE_URL: BROKEN_URL,
      });

      expect(exitCode, `stderr was:\n${stderr}`).toBe(1);
      expect(stderr).toMatch(/Cannot connect to database — check DATABASE_URL/);
    },
    30_000,
  );
});

// ─── reset-admin-password.ts ──────────────────────────────────────────────────

describe('scripts/reset-admin-password.ts', () => {
  it('exits 1 and prints a DATABASE_URL error when DATABASE_URL is not set', () => {
    const { exitCode, stderr } = runScript('scripts/reset-admin-password.ts', {
      ...RESET_ENV,
    });

    expect(exitCode).toBe(1);
    expect(stderr).toMatch(/DATABASE_URL/i);
  });

  it(
    'exits 1 and prints the human-readable connectivity error for an unreachable host',
    () => {
      const { exitCode, stderr } = runScript('scripts/reset-admin-password.ts', {
        DATABASE_URL: BROKEN_URL,
        ...RESET_ENV,
      });

      expect(exitCode, `stderr was:\n${stderr}`).toBe(1);
      expect(stderr).toMatch(/Cannot connect to database — check DATABASE_URL/);
    },
    30_000,
  );
});
