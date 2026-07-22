/**
 * Unit tests for the ADMIN_BOOTSTRAP_SECRET startup validation helper.
 *
 * The helper is extracted into server/lib/bootstrap-secret.ts so it can be
 * tested without spinning up the full server.  The integration-level
 * behavior (server refuses to start when the secret is too short) is
 * confirmed by checking that the helper returns `fatal: true`, which the
 * server startup code converts into `process.exit(1)`.
 */

import { describe, it, expect } from 'vitest';
import {
  checkBootstrapSecret,
  BOOTSTRAP_MIN_LENGTH,
  BOOTSTRAP_PLACEHOLDER,
} from '../server/lib/bootstrap-secret';

describe('checkBootstrapSecret – startup validation', () => {
  // ── Missing / unset ───────────────────────────────────────────────────────

  it('returns ok:false fatal:false when secret is undefined', () => {
    const result = checkBootstrapSecret(undefined);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fatal).toBe(false);
      expect(result.reason).toMatch(/not set/i);
    }
  });

  it('returns ok:false fatal:false when secret is an empty string', () => {
    const result = checkBootstrapSecret('');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fatal).toBe(false);
    }
  });

  it('returns ok:false fatal:false when secret equals the placeholder', () => {
    const result = checkBootstrapSecret(BOOTSTRAP_PLACEHOLDER);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fatal).toBe(false);
      expect(result.reason).toMatch(/placeholder|not set/i);
    }
  });

  // ── Too short (fatal) ─────────────────────────────────────────────────────

  it('returns ok:false fatal:true when secret is 1 character long', () => {
    const result = checkBootstrapSecret('x');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fatal).toBe(true);
      expect(result.reason).toMatch(/brute.?force|minimum|short/i);
    }
  });

  it('returns ok:false fatal:true when secret is one character short of the minimum', () => {
    const almostLongEnough = 'a'.repeat(BOOTSTRAP_MIN_LENGTH - 1);
    const result = checkBootstrapSecret(almostLongEnough);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fatal).toBe(true);
    }
  });

  it('mentions the actual length and required minimum in the error reason', () => {
    const shortSecret = 'tooshort';
    const result = checkBootstrapSecret(shortSecret);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fatal).toBe(true);
      expect(result.reason).toContain(String(shortSecret.length));
      expect(result.reason).toContain(String(BOOTSTRAP_MIN_LENGTH));
    }
  });

  // ── Valid (minimum boundary) ──────────────────────────────────────────────

  it('returns ok:true when secret is exactly BOOTSTRAP_MIN_LENGTH characters', () => {
    const exactSecret = 'A'.repeat(BOOTSTRAP_MIN_LENGTH);
    const result = checkBootstrapSecret(exactSecret);
    expect(result.ok).toBe(true);
  });

  it('returns ok:true when secret is longer than BOOTSTRAP_MIN_LENGTH', () => {
    const longSecret = 'super-long-secure-bootstrap-secret-value-here!';
    expect(longSecret.length).toBeGreaterThan(BOOTSTRAP_MIN_LENGTH);
    const result = checkBootstrapSecret(longSecret);
    expect(result.ok).toBe(true);
  });

  // ── Server startup must refuse to start on fatal error ───────────────────

  it('fatal:true outcome means server startup must call process.exit(1)', () => {
    // This test documents the contract between the validator and server/index.ts:
    // when fatal is true the startup code must not proceed.
    const result = checkBootstrapSecret('short');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      // If the server code sees fatal:true it must exit.  We verify the
      // property is truthy so a future refactor cannot silently drop it.
      expect(result.fatal).toBe(true);
    }
  });
});
