/**
 * Route-level tests for the fire-and-forget cleanup in POST /api/chat/share.
 *
 * Covered scenarios:
 *   1. POST /api/chat/share returns 200 even when deleteExpiredChatSessions()
 *      rejects — the cleanup runs in the background and must never surface
 *      errors to the caller.
 *   2. POST /api/chat/share calls deleteExpiredChatSessions() on every
 *      successful share request.
 *
 * Strategy
 * ────────
 * The storage layer is fully mocked so no real database connection is needed.
 * supertest drives HTTP interactions against a minimal Express app built from
 * registerChatRoutes().
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

// ── Mock heavy dependencies before any server module is imported ──────────────

vi.mock('../server/db', () => ({
  db: {},
  pool: { on: vi.fn() },
}));

// ── Mock storage ──────────────────────────────────────────────────────────────

const STORED_SESSION = {
  id:        'chat_resilience_test',
  title:     'AI Security Chat',
  messages:  [],
  createdAt: new Date(),
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
};

const mockStorage = {
  createChatSession:         vi.fn().mockResolvedValue(STORED_SESSION),
  getChatSession:            vi.fn(),
  deleteExpiredChatSessions: vi.fn(),
};

vi.mock('../server/storage', () => ({ storage: mockStorage }));

// ── Import routes AFTER all mocks are in place ────────────────────────────────

const { registerChatRoutes } = await import('../server/routes/chat-routes');

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildApp() {
  const app = express();
  app.use(express.json());
  registerChatRoutes(app);
  return app;
}

const VALID_MESSAGES = [
  { role: 'user' as const,      content: 'Is Aave safe?',              timestamp: new Date().toISOString() },
  { role: 'assistant' as const, content: 'Yes, it has been audited.', timestamp: new Date().toISOString() },
];

// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/chat/share — fire-and-forget cleanup resilience', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStorage.createChatSession.mockResolvedValue(STORED_SESSION);
  });

  it('returns 200 even when deleteExpiredChatSessions() rejects', async () => {
    // Simulate the background cleanup throwing a database error
    mockStorage.deleteExpiredChatSessions.mockRejectedValue(
      new Error('DB connection lost')
    );

    const res = await request(buildApp())
      .post('/api/chat/share')
      .send({ messages: VALID_MESSAGES, title: 'AI Security Chat' });

    expect(res.status).toBe(200);
    expect(res.body.id).toBe('chat_resilience_test');
    expect(res.body.expiresAt).toBeDefined();

    // createChatSession must have completed successfully
    expect(mockStorage.createChatSession).toHaveBeenCalledOnce();
  });

  it('calls deleteExpiredChatSessions() on every successful share request', async () => {
    mockStorage.deleteExpiredChatSessions.mockResolvedValue(0);

    await request(buildApp())
      .post('/api/chat/share')
      .send({ messages: VALID_MESSAGES, title: 'Test' });

    // Give the fire-and-forget promise a tick to settle
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(mockStorage.deleteExpiredChatSessions).toHaveBeenCalledOnce();
  });
});
