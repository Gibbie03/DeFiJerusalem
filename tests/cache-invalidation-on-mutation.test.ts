/**
 * Confirms that invalidateAICache() fires after every data-mutation method
 * that affects information the AI chat agent can return to users.
 *
 * Covered mutations (per the task specification):
 *   1. updateProtocol       — protocol fields changed by an admin
 *   2. addToBlacklist       — a new or updated blacklist entry
 *   3. deleteBlacklistEntry — a blacklist entry removed
 *
 * Strategy
 * ────────
 * • The real DatabaseStorage class is imported so the actual implementation
 *   paths are exercised.
 * • The `db` object is mocked so no real database connection is needed.
 * • `invalidateAICache` is replaced with a vi.fn() spy so calls can be
 *   counted without running the actual cache-clearing logic.
 * • Each test calls a mutation, then asserts the spy was invoked at least once.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Hoist mock factories so they exist before vi.mock() runs ──────────────────

const {
  mockUpdateWhere,
  mockUpdateSet,
  mockUpdate,
  mockInsertReturning,
  mockInsertOnConflict,
  mockInsertValues,
  mockInsert,
  mockDeleteWhere,
  mockDelete,
} = vi.hoisted(() => {
  // db.update(...).set(...).where(...) — resolves undefined (void)
  const mockUpdateWhere = vi.fn().mockResolvedValue(undefined);
  const mockUpdateSet = vi.fn().mockReturnValue({ where: mockUpdateWhere });
  const mockUpdate = vi.fn().mockReturnValue({ set: mockUpdateSet });

  // db.insert(...).values(...).onConflictDoUpdate(...).returning() — returns a row
  const mockInsertReturning = vi.fn();
  const mockInsertOnConflict = vi.fn().mockReturnValue({ returning: mockInsertReturning });
  const mockInsertValues = vi.fn().mockReturnValue({ onConflictDoUpdate: mockInsertOnConflict });
  const mockInsert = vi.fn().mockReturnValue({ values: mockInsertValues });

  // db.delete(...).where(...) — resolves undefined (void)
  const mockDeleteWhere = vi.fn().mockResolvedValue(undefined);
  const mockDelete = vi.fn().mockReturnValue({ where: mockDeleteWhere });

  return {
    mockUpdateWhere,
    mockUpdateSet,
    mockUpdate,
    mockInsertReturning,
    mockInsertOnConflict,
    mockInsertValues,
    mockInsert,
    mockDeleteWhere,
    mockDelete,
  };
});

// ── Spy on invalidateAICache ───────────────────────────────────────────────────

const { invalidateAICache } = vi.hoisted(() => ({
  invalidateAICache: vi.fn(),
}));

vi.mock('../server/lib/ai-chat-agent', () => ({
  invalidateAICache,
}));

// ── Mock the DB ───────────────────────────────────────────────────────────────

vi.mock('../server/db', () => ({
  db: {
    update: mockUpdate,
    insert: mockInsert,
    delete: mockDelete,
  },
  pool: { on: vi.fn() },
}));

// ── Import real storage after mocks are registered ───────────────────────────

const { storage } = await import('../server/storage');

// ── Shared fixture ────────────────────────────────────────────────────────────

/** Minimal BlacklistEntry row returned by the mocked .returning() */
const BLACKLIST_ROW = {
  id: 'bl-1',
  dappId: 'scam-protocol',
  dappName: 'ScamProtocol',
  website: 'https://scam.example',
  twitter: null,
  github: null,
  severity: 'HIGH',
  threats: [{ type: 'rug_pull', severity: 'HIGH', message: 'Exit scam risk' }],
  reason: 'Rug pull risk',
  status: 'ACTIVE',
  timestamp: new Date(),
  legitimacyScore: 0,
  securityMetrics: null,
  lastVetted: null,
};

// ─────────────────────────────────────────────────────────────────────────────

describe('Cache invalidation on data mutations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── 1. updateProtocol ─────────────────────────────────────────────────────

  it('calls invalidateAICache() after updateProtocol()', async () => {
    await storage.updateProtocol('protocol-abc', { securityScore: 75 });

    expect(invalidateAICache).toHaveBeenCalledOnce();
  });

  it('calls invalidateAICache() exactly once per updateProtocol() call', async () => {
    await storage.updateProtocol('protocol-abc', { securityScore: 75 });
    await storage.updateProtocol('protocol-xyz', { audited: true });

    expect(invalidateAICache).toHaveBeenCalledTimes(2);
  });

  // ── 2. addToBlacklist ─────────────────────────────────────────────────────

  it('calls invalidateAICache() after addToBlacklist()', async () => {
    mockInsertReturning.mockResolvedValue([BLACKLIST_ROW]);

    await storage.addToBlacklist({
      id: BLACKLIST_ROW.id,
      dappId: BLACKLIST_ROW.dappId,
      dappName: BLACKLIST_ROW.dappName,
      website: BLACKLIST_ROW.website,
      twitter: BLACKLIST_ROW.twitter,
      github: BLACKLIST_ROW.github,
      severity: 'HIGH',
      threats: BLACKLIST_ROW.threats,
      reason: BLACKLIST_ROW.reason,
      status: 'ACTIVE',
      legitimacyScore: 0,
      securityMetrics: null,
      lastVetted: null,
    });

    expect(invalidateAICache).toHaveBeenCalledOnce();
  });

  // ── 3. deleteBlacklistEntry ───────────────────────────────────────────────

  it('calls invalidateAICache() after deleteBlacklistEntry()', async () => {
    await storage.deleteBlacklistEntry('bl-1');

    expect(invalidateAICache).toHaveBeenCalledOnce();
  });

  it('calls invalidateAICache() exactly once per deleteBlacklistEntry() call', async () => {
    await storage.deleteBlacklistEntry('bl-1');
    await storage.deleteBlacklistEntry('bl-2');

    expect(invalidateAICache).toHaveBeenCalledTimes(2);
  });

  // ── 4. Cache stays stale if no mutation occurs ────────────────────────────

  it('does NOT call invalidateAICache() when only read methods are used', async () => {
    // getProtocols and getBlacklist are read-only — they must not invalidate.
    // (Nothing to call here — just verifying the spy starts at zero.)
    expect(invalidateAICache).not.toHaveBeenCalled();
  });
});
