/**
 * Integration tests for the admin session-guard middleware.
 *
 * Tests cover:
 *   1. A valid session passes through the guard and reaches the route handler.
 *   2. A session whose `lastActivity` is > 2 hours old receives 401 and has its
 *      cookie cleared (idle-timeout enforcement).
 *   3. A session whose `loginTime` is > 24 hours old receives 401 and has its
 *      cookie cleared (absolute max-age enforcement).
 *   4. POST /api/admin/logout clears the connect.sid cookie.
 *
 * Strategy for injecting stale timestamps
 * ────────────────────────────────────────
 * We add a test-only route `POST /test-only/inject-session` to the Express app
 * *before* registering the real routes. This route writes arbitrary values into
 * the caller's session so we can simulate sessions with old loginTime /
 * lastActivity without touching any production code.
 */

import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import session from 'express-session';
import MemoryStore from 'memorystore';
import bcryptjs from 'bcryptjs';
import type { Server } from 'http';

// ── Mock heavy dependencies before any server module is imported ──────────────

vi.mock('../server/db', () => ({
  db: {},
  pool: { on: vi.fn() },
}));

vi.mock('../server/index', () => ({
  authLimiter: (_req: any, _res: any, next: () => void) => next(),
  apiLimiter:  (_req: any, _res: any, next: () => void) => next(),
}));

const mockStorage = {
  getBlacklist:                vi.fn().mockResolvedValue([]),
  getAdminByUsername:          vi.fn(),
  updateAdminLastLogin:        vi.fn().mockResolvedValue(undefined),
  updateAdminPassword:         vi.fn().mockResolvedValue(undefined),
  getProtocols:                vi.fn().mockResolvedValue([]),
  getAllSecurityScans:         vi.fn().mockResolvedValue({}),
  getProtocolsByDiscoveryDate: vi.fn().mockResolvedValue([]),
  getProtocolsByTvlGrowth:    vi.fn().mockResolvedValue([]),
};

vi.mock('../server/storage', () => ({ storage: mockStorage }));

vi.mock('../server/lib/dapp-discovery', () => ({
  DAppDiscovery: function DAppDiscovery() {
    return {
      fetchFromMultipleSources: vi.fn().mockResolvedValue([]),
      getTestDrainerProtocols:  vi.fn().mockReturnValue([]),
    };
  },
}));

vi.mock('../server/lib/protocol-security-aggregator', () => ({
  getProtocolSecurityData: vi.fn().mockResolvedValue(null),
}));

vi.mock('../server/lib/blacklist-manager', () => ({
  BlacklistManager: function BlacklistManager() {
    return {
      isBlacklisted: vi.fn().mockReturnValue(false),
      getBlacklist:  vi.fn().mockReturnValue([]),
    };
  },
}));

vi.mock('../server/lib/audit-logger', () => ({
  auditLogger: { logFromRequest: vi.fn(), log: vi.fn() },
}));

vi.mock('../server/lib/threat-pattern-learner', () => ({
  threatLearner: {
    getStats:      vi.fn().mockReturnValue({ highConfidencePatterns: 0, knownExploits: 0 }),
    getInsights:   vi.fn().mockReturnValue([]),
    learnFromScan: vi.fn().mockResolvedValue(undefined),
    initialize:    vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../server/routes/bounty-audit-routes', () => ({
  registerBountyAuditRoutes: vi.fn(),
}));

vi.mock('../server/routes/chat-routes', () => ({
  registerChatRoutes: vi.fn(),
}));

// ── Import registerRoutes after mocks ─────────────────────────────────────────

const { registerRoutes } = await import('../server/routes');

// ── Timing constants (must match routes.ts) ───────────────────────────────────

const IDLE_TIMEOUT_MS   = 2  * 60 * 60 * 1000;  // 2 hours
const MAX_SESSION_MS    = 24 * 60 * 60 * 1000;  // 24 hours

// ── App factory ───────────────────────────────────────────────────────────────

async function buildApp() {
  const app = express();
  app.use(express.json());

  const MemoryStoreSession = MemoryStore(session);
  app.use(
    session({
      secret: 'test-secret',
      resave: false,
      saveUninitialized: false,
      store: new MemoryStoreSession({ checkPeriod: 86400000 }),
      cookie: { secure: false },
    }),
  );

  /**
   * Test-only helper: POST /test-only/inject-session
   * Body: { adminId, loginTime, lastActivity }
   * Writes those values directly into the caller's session so tests can
   * simulate a session with specific timestamps without going through login.
   */
  app.post('/test-only/inject-session', (req: express.Request, res: express.Response) => {
    const { adminId, loginTime, lastActivity } = req.body as {
      adminId: string;
      loginTime: number;
      lastActivity: number;
    };
    req.session.adminId      = adminId;
    req.session.loginTime    = loginTime;
    req.session.lastActivity = lastActivity;
    req.session.save((err) => {
      if (err) return res.status(500).json({ error: String(err) });
      res.json({ ok: true });
    });
  });

  const server = await registerRoutes(app);
  return { app, server };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const ADMIN_PASSWORD = 'AdminPass1!';

async function makeHash(password: string) {
  return bcryptjs.hash(password, 4);
}

function makeMockAdmin() {
  return makeHash(ADMIN_PASSWORD).then((hash) => ({
    id:           'admin-id-001',
    username:     'testadmin',
    passwordHash: hash,
    email:        'admin@example.com',
    role:         'admin',
    createdAt:    new Date().toISOString(),
    lastLogin:    null,
  }));
}

/** Log in and return the cookie string for subsequent requests. */
async function loginAndGetCookie(app: express.Express): Promise<string> {
  const res = await request(app)
    .post('/api/admin/login')
    .send({ username: 'testadmin', password: ADMIN_PASSWORD });

  expect(res.status, 'login should succeed').toBe(200);
  expect(res.body.success).toBe(true);

  const cookies: string[] = res.headers['set-cookie'] ?? [];
  return cookies.join('; ');
}

/**
 * Inject a session with custom timestamps and return the cookie.
 * Uses the test-only helper route instead of the real login flow so we
 * bypass the session guard and can set arbitrary timestamps.
 */
async function injectSession(
  app: express.Express,
  opts: { loginTime: number; lastActivity: number },
): Promise<string> {
  const res = await request(app)
    .post('/test-only/inject-session')
    .send({ adminId: 'admin-id-001', ...opts });

  expect(res.status, 'session injection should succeed').toBe(200);

  const cookies: string[] = res.headers['set-cookie'] ?? [];
  return cookies.join('; ');
}

// ── Test suite ────────────────────────────────────────────────────────────────

describe('Admin session-guard middleware', () => {
  let app: express.Express;
  let server: Server;

  beforeAll(async () => {
    ({ app, server } = await buildApp());
  });

  afterAll(() => {
    server.close();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockStorage.getAdminByUsername.mockImplementation(() => makeMockAdmin());
    mockStorage.updateAdminLastLogin.mockResolvedValue(undefined);
    mockStorage.getBlacklist.mockResolvedValue([]);
    mockStorage.getProtocols.mockResolvedValue([]);
    mockStorage.getAllSecurityScans.mockResolvedValue({});
  });

  // ── 1. Valid session ─────────────────────────────────────────────────────────
  it('allows a valid admin session through the guard', async () => {
    const cookie = await loginAndGetCookie(app);

    const res = await request(app)
      .get('/api/admin/diagnostics')
      .set('Cookie', cookie);

    // 200 means the guard passed the request to the route handler
    expect(res.status).toBe(200);
  });

  // ── 2. Idle timeout ──────────────────────────────────────────────────────────
  it('returns 401 and clears the cookie when lastActivity is older than 2 hours', async () => {
    const staleLastActivity = Date.now() - IDLE_TIMEOUT_MS - 1000; // 1 s past threshold
    const recentLoginTime   = Date.now() - 30 * 60 * 1000;         // 30 min ago (within max)

    const cookie = await injectSession(app, {
      loginTime:    recentLoginTime,
      lastActivity: staleLastActivity,
    });

    const res = await request(app)
      .get('/api/admin/diagnostics')
      .set('Cookie', cookie);

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/timed out|inactivity/i);

    // The response must clear the session cookie
    const setCookieHeader: string[] = res.headers['set-cookie'] ?? [];
    const sidCookie = setCookieHeader.find((c) => c.startsWith('connect.sid'));
    expect(sidCookie, 'connect.sid should be cleared').toBeDefined();
    // A cleared cookie has Expires in the past or Max-Age=0
    expect(sidCookie).toMatch(/expires=Thu, 01 Jan 1970|Max-Age=0/i);
  });

  // ── 3. Absolute max-age ──────────────────────────────────────────────────────
  it('returns 401 and clears the cookie when loginTime is older than 24 hours', async () => {
    const staleLoginTime    = Date.now() - MAX_SESSION_MS - 1000;  // 1 s past 24 h
    const recentLastActivity = Date.now() - 5 * 60 * 1000;          // 5 min ago (not idle)

    const cookie = await injectSession(app, {
      loginTime:    staleLoginTime,
      lastActivity: recentLastActivity,
    });

    const res = await request(app)
      .get('/api/admin/diagnostics')
      .set('Cookie', cookie);

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/session expired/i);

    // The response must clear the session cookie
    const setCookieHeader: string[] = res.headers['set-cookie'] ?? [];
    const sidCookie = setCookieHeader.find((c) => c.startsWith('connect.sid'));
    expect(sidCookie, 'connect.sid should be cleared').toBeDefined();
    expect(sidCookie).toMatch(/expires=Thu, 01 Jan 1970|Max-Age=0/i);
  });

  // ── 4. Logout clears the cookie ──────────────────────────────────────────────
  it('clears the connect.sid cookie on logout', async () => {
    const cookie = await loginAndGetCookie(app);

    const res = await request(app)
      .post('/api/admin/logout')
      .set('Cookie', cookie);

    expect(res.status).toBe(200);

    // Verify the session cookie is cleared in the response
    const setCookieHeader: string[] = res.headers['set-cookie'] ?? [];
    const sidCookie = setCookieHeader.find((c) => c.startsWith('connect.sid'));
    expect(sidCookie, 'connect.sid should be present in Set-Cookie').toBeDefined();
    expect(sidCookie).toMatch(/expires=Thu, 01 Jan 1970|Max-Age=0/i);
  });
});
