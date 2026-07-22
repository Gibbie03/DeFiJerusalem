/**
 * Unit tests for DatabaseStorage.deleteExpiredChatSessions()
 *
 * Covered scenarios:
 *   1. Returns the correct count when expired rows exist.
 *   2. Returns 0 when no rows have expired.
 *
 * Strategy
 * ────────
 * The `db` object is mocked so no real database connection is needed.
 * The Drizzle delete builder chain (`db.delete(...).where(...).returning(...)`)
 * is replicated with a minimal fluent mock; `mockReturningFn` is swapped per
 * test to control what `.returning()` resolves to.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// `mockReturningFn` controls what .returning() resolves to in each test.
const mockReturningFn = vi.fn();

vi.mock('../server/db', () => ({
  db: {
    delete: () => ({
      where: () => ({ returning: mockReturningFn }),
    }),
  },
  pool: { on: vi.fn() },
}));

// ai-chat-agent is transitively imported by storage.ts; mock it to avoid
// loading OpenAI and other heavy dependencies.
vi.mock('../server/lib/ai-chat-agent', () => ({
  invalidateAICache: vi.fn(),
}));

// Import the real storage class with the mocked db in place.
const { storage } = await import('../server/storage');

// ─────────────────────────────────────────────────────────────────────────────

describe('DatabaseStorage.deleteExpiredChatSessions()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the count of deleted rows when expired sessions exist', async () => {
    const expiredRows = [{ id: 'chat_old_1' }, { id: 'chat_old_2' }];
    mockReturningFn.mockResolvedValue(expiredRows);

    const count = await storage.deleteExpiredChatSessions();

    expect(count).toBe(2);
    expect(mockReturningFn).toHaveBeenCalledOnce();
  });

  it('returns 0 when there are no expired sessions', async () => {
    mockReturningFn.mockResolvedValue([]); // nothing to delete

    const count = await storage.deleteExpiredChatSessions();

    expect(count).toBe(0);
    expect(mockReturningFn).toHaveBeenCalledOnce();
  });
});
