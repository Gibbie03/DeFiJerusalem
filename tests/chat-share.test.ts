/**
 * Integration tests for the shared-chat endpoints.
 *
 * Covered scenarios:
 *   1. POST /api/chat/share  — creates a session and returns { id, expiresAt }
 *   2. GET  /api/chat/share/:id — returns the stored session when it exists
 *   3. GET  /api/chat/share/:id — returns 404 for a non-existent ID
 *   4. GET  /api/chat/share/:id — returns 404 for an expired session
 *   5. POST /api/chat/share  — returns 400 when the request body is invalid
 *
 * Strategy
 * ────────
 * We spin up a minimal Express app, register only the chat routes via
 * registerChatRoutes(), and mock the storage layer so no real database is
 * touched.  supertest drives all HTTP interactions.
 */

import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import type { Server } from 'http';
import { createServer } from 'http';

// ── Mock heavy dependencies before any server module is imported ──────────────

// Prevent real DB connections
vi.mock('../server/db', () => ({
  db: {},
  pool: { on: vi.fn() },
}));

// ── Mock storage — individual tests override the relevant methods ──────────────

const mockStorage = {
  createChatSession:          vi.fn(),
  getChatSession:             vi.fn(),
  deleteExpiredChatSessions:  vi.fn().mockResolvedValue(0),
};

vi.mock('../server/storage', () => ({ storage: mockStorage }));

// ── Import the routes AFTER all mocks are in place ────────────────────────────

const { registerChatRoutes } = await import('../server/routes/chat-routes');

// ── App factory ───────────────────────────────────────────────────────────────

function buildApp(): { app: express.Express; server: Server } {
  const app = express();
  app.use(express.json());
  registerChatRoutes(app);
  const server = createServer(app);
  return { app, server };
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

const VALID_MESSAGES = [
  { role: 'user' as const,      content: 'Is Uniswap safe?',          timestamp: new Date().toISOString() },
  { role: 'assistant' as const, content: 'Yes, it is well-audited.', timestamp: new Date().toISOString() },
];

const STORED_SESSION = {
  id:        'chat_123_abc',
  title:     'AI Security Chat',
  messages:  VALID_MESSAGES,
  createdAt: new Date(),
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
};

// ── Test suite ────────────────────────────────────────────────────────────────

describe('Shared-chat endpoints', () => {
  let app: express.Express;
  let server: Server;

  beforeAll(() => {
    ({ app, server } = buildApp());
  });

  afterAll(() => {
    server.close();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockStorage.deleteExpiredChatSessions.mockResolvedValue(0);
  });

  // ── 1. Creating a session returns id and expiresAt ───────────────────────────
  it('POST /api/chat/share creates a session and returns id + expiresAt', async () => {
    mockStorage.createChatSession.mockResolvedValue(STORED_SESSION);

    const res = await request(app)
      .post('/api/chat/share')
      .send({ messages: VALID_MESSAGES, title: 'AI Security Chat' });

    expect(res.status).toBe(200);
    expect(res.body.id).toBe('chat_123_abc');
    expect(res.body.expiresAt).toBeDefined();

    // Storage must have been called with the messages and title
    expect(mockStorage.createChatSession).toHaveBeenCalledOnce();
    const [msgs, title] = mockStorage.createChatSession.mock.calls[0];
    expect(msgs).toEqual(VALID_MESSAGES);
    expect(title).toBe('AI Security Chat');
  });

  // ── 2. Retrieving an existing session returns the stored data ────────────────
  it('GET /api/chat/share/:id returns the session when it exists', async () => {
    mockStorage.getChatSession.mockResolvedValue(STORED_SESSION);

    const res = await request(app).get('/api/chat/share/chat_123_abc');

    expect(res.status).toBe(200);
    expect(res.body.id).toBe('chat_123_abc');
    expect(res.body.messages).toHaveLength(2);

    expect(mockStorage.getChatSession).toHaveBeenCalledWith('chat_123_abc');
  });

  // ── 3. Non-existent ID → 404 ─────────────────────────────────────────────────
  it('GET /api/chat/share/:id returns 404 for a non-existent ID', async () => {
    mockStorage.getChatSession.mockResolvedValue(undefined);

    const res = await request(app).get('/api/chat/share/does-not-exist');

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found|expired/i);

    expect(mockStorage.getChatSession).toHaveBeenCalledWith('does-not-exist');
  });

  // ── 4. Expired session → 404 ─────────────────────────────────────────────────
  //
  // getChatSession() already filters out expired rows (WHERE expiresAt > NOW()),
  // so an expired row returns undefined — the same 404 path as a missing row.
  it('GET /api/chat/share/:id returns 404 for an expired session', async () => {
    // Simulate storage returning undefined because the session has expired
    mockStorage.getChatSession.mockResolvedValue(undefined);

    const res = await request(app).get('/api/chat/share/expired-id');

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found|expired/i);
  });

  // ── 5. Invalid request body → 400 ────────────────────────────────────────────
  it('POST /api/chat/share returns 400 when messages array is empty or missing', async () => {
    // messages must have at least 2 items (shareRequestSchema)
    const res = await request(app)
      .post('/api/chat/share')
      .send({ messages: [VALID_MESSAGES[0]], title: 'Only one message' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid/i);

    // Storage must NOT be called
    expect(mockStorage.createChatSession).not.toHaveBeenCalled();
  });
});
