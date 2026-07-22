/**
 * Integration tests for POST /api/admin/init rate-limiting (brute-force lockout)
 *
 * These tests verify that the authLimiter actually blocks repeated failed
 * account-creation attempts on the admin bootstrap endpoint, consistent with
 * the production configuration in server/index.ts:
 *   - max      : 5 attempts per window
 *   - skipSuccessfulRequests: true  (successful creations don't count against limit)
 *
 * A hand-rolled in-process rate limiter is injected via the module mock so the
 * tests run in milliseconds and the "resets after window" case only waits ~150 ms.
 *
 * IMPORTANT: The limiter factory must be defined INSIDE vi.mock() because Vitest
 * hoists vi.mock() calls before any module-level variable declarations run, so
 * referencing an outer variable from inside the factory would yield `undefined`.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import session from 'express-session';
import MemoryStore from 'memorystore';
import type { Server } from 'http';

// ── Mock heavy dependencies before any server module is imported ──────────────

vi.mock('../server/db', () => ({
  db: {},
  pool: { on: vi.fn() },
}));

// Inject a REAL (not pass-through) rate limiter for authLimiter.
// The limiter is created inside the factory so it exists when the factory runs.
// windowMs=100 mirrors production logic but lets the "window expires" test
// complete in ~150 ms instead of 15 minutes.
vi.mock('../server/index', () => {
  // ── Inline limiter ─────────────────────────────────────────────────────────
  // Mirrors express-rate-limit semantics:
  //   - Fixed window, keyed by req.ip
  //   - skipSuccessfulRequests: true → only failed (non-2xx) responses increment
  //   - Returns 429 once window count reaches max
  const WINDOW_MS = 100;
  const MAX       = 5;
  const store     = new Map<string, { count: number; resetAt: number }>();

  function authLimiter(req: any, res: any, next: () => void) {
    const ip: string = req.ip ?? req.socket?.remoteAddress ?? 'unknown';
    const now = Date.now();
    let entry = store.get(ip);

    if (!entry || now >= entry.resetAt) {
      entry = { count: 0, resetAt: now + WINDOW_MS };
      store.set(ip, entry);
    }

    if (entry.count >= MAX) {
      return res
        .status(429)
        .json({ error: 'Too many login attempts, please try again in 15 minutes' });
    }

    // Wrap res.end to count only non-2xx (failed) responses
    const capturedEntry = entry;
    const origEnd = res.end.bind(res);
    res.end = function (...args: any[]) {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        capturedEntry.count++;
      }
      return origEnd(...args);
    };

    next();
  }

  return {
    authLimiter,
    apiLimiter: (_req: any, _res: any, next: () => void) => next(),
  };
});

// Mock storage
const mockStorage = {
  getBlacklist:                vi.fn().mockResolvedValue([]),
  getAdminByUsername:          vi.fn().mockResolvedValue(null),
  getAllAdmins:                 vi.fn().mockResolvedValue([]),
  createAdmin:                 vi.fn().mockResolvedValue(undefined),
  updateAdminLastLogin:        vi.fn().mockResolvedValue(undefined),
  updateAdminPassword:         vi.fn().mockResolvedValue(undefined),
  getProtocols:                vi.fn().mockResolvedValue([]),
  getAllSecurityScans:          vi.fn().mockResolvedValue({}),
  getProtocolsByDiscoveryDate: vi.fn().mockResolvedValue([]),
  getProtocolsByTvlGrowth:     vi.fn().mockResolvedValue([]),
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
  auditLogger: { logFromRequest: vi.fn() },
}));

vi.mock('../server/lib/threat-pattern-learner', () => ({
  threatLearner: {
    getStats:      vi.fn().mockReturnValue({ highConfidencePatterns: 0, knownExploits: 0 }),
    getInsights:   vi.fn().mockReturnValue([]),
    learnFromScan: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../server/routes/bounty-audit-routes', () => ({
  registerBountyAuditRoutes: vi.fn(),
}));

vi.mock('../server/routes/chat-routes', () => ({
  registerChatRoutes: vi.fn(),
}));

// ── Import routes AFTER all mocks ─────────────────────────────────────────────
const { registerRoutes } = await import('../server/routes');

// ── Helpers ───────────────────────────────────────────────────────────────────

const BOOTSTRAP_SECRET = 'test-bootstrap-secret-32-chars-ok';

const VALID_PAYLOAD = {
  username:        'initadmin',
  password:        'ValidPass1!',
  email:           'init@example.com',
  bootstrapSecret: BOOTSTRAP_SECRET,
};

const INVALID_PAYLOAD = {
  username:        'initadmin',
  password:        'ValidPass1!',
  email:           'init@example.com',
  bootstrapSecret: 'wrong-secret',
};

/** Build a minimal Express app and register all routes. */
async function buildApp(): Promise<{ app: express.Express; server: Server }> {
  const app = express();
  app.use(express.json());

  const MemoryStoreSession = MemoryStore(session);
  app.use(
    session({
      secret: 'init-lockout-test-secret',
      resave: false,
      saveUninitialized: false,
      store: new MemoryStoreSession({ checkPeriod: 86400000 }),
      cookie: { secure: false },
    }),
  );

  const server = await registerRoutes(app);
  return { app, server };
}

/** Wait for `ms` milliseconds. */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('POST /api/admin/init – brute-force lockout', () => {
  let app: express.Express;
  let server: Server;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockStorage.getBlacklist.mockResolvedValue([]);
    mockStorage.getAllAdmins.mockResolvedValue([]);
    mockStorage.getAdminByUsername.mockResolvedValue(null);
    mockStorage.createAdmin.mockResolvedValue(undefined);

    // Set a valid bootstrap secret so the endpoint is active
    process.env.ADMIN_BOOTSTRAP_SECRET = BOOTSTRAP_SECRET;

    // Let the 100 ms rate-limit window from any prior test expire before starting.
    await sleep(150);

    ({ app, server } = await buildApp());
  });

  afterEach(() => {
    server.close();
    delete process.env.ADMIN_BOOTSTRAP_SECRET;
  });

  // ── 1. N failed attempts trigger a 429 ─────────────────────────────────────
  it('returns 429 after 5 consecutive failed init attempts', async () => {
    // Make 5 failed attempts (wrong bootstrap secret → 403); none should be rate-limited yet
    for (let i = 0; i < 5; i++) {
      const res = await request(app)
        .post('/api/admin/init')
        .send(INVALID_PAYLOAD);

      // Each of the first 5 attempts should reach the handler (not be blocked)
      expect(res.status).not.toBe(429);
      // Each failed attempt returns 403 due to invalid bootstrap secret
      expect(res.status).toBe(403);
    }

    // The 6th attempt must be blocked by the rate limiter
    const blocked = await request(app)
      .post('/api/admin/init')
      .send(INVALID_PAYLOAD);

    expect(blocked.status).toBe(429);
  });

  // ── 2. Valid attempt is also blocked once the lockout threshold is reached ──
  it('blocks a valid init attempt once the lockout threshold is reached', async () => {
    // Exhaust the 5-attempt budget with wrong bootstrap secrets
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/api/admin/init')
        .send(INVALID_PAYLOAD);
    }

    // Now try with the CORRECT bootstrap secret – the rate limiter must block
    // before the route handler even gets a chance to verify credentials.
    const res = await request(app)
      .post('/api/admin/init')
      .send(VALID_PAYLOAD);

    expect(res.status).toBe(429);
    // Storage must NOT have been called (the rate limiter intercepted first)
    expect(mockStorage.createAdmin).not.toHaveBeenCalled();
  });

  // ── 3. Lockout window resets after the configured period ───────────────────
  it('allows init again after the lockout window expires', async () => {
    // Exhaust the budget
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/api/admin/init')
        .send(INVALID_PAYLOAD);
    }

    // Confirm we are locked out
    const lockedOut = await request(app)
      .post('/api/admin/init')
      .send(VALID_PAYLOAD);
    expect(lockedOut.status).toBe(429);

    // Wait for the 100 ms window to expire (+ 50 ms buffer)
    await sleep(200);

    // After the window resets, a valid init attempt should succeed
    const res = await request(app)
      .post('/api/admin/init')
      .send(VALID_PAYLOAD);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  // ── 4. Successful init is not counted against the limit ────────────────────
  it('does not count a successful init toward the attempt limit', async () => {
    // Make 4 failed attempts – one below the threshold
    for (let i = 0; i < 4; i++) {
      await request(app)
        .post('/api/admin/init')
        .send(INVALID_PAYLOAD);
    }

    // A successful init should go through (skipSuccessfulRequests: true)
    const success = await request(app)
      .post('/api/admin/init')
      .send(VALID_PAYLOAD);

    expect(success.status).toBe(200);
    expect(success.body.success).toBe(true);

    // Reset mock so the second call also sees an empty admin list
    mockStorage.getAllAdmins.mockResolvedValue([]);
    mockStorage.createAdmin.mockResolvedValue(undefined);

    // Because the successful init was not counted, we still have budget for
    // one more failed attempt before hitting the cap (counted failures = 4).
    const stillAllowed = await request(app)
      .post('/api/admin/init')
      .send(INVALID_PAYLOAD);

    expect(stillAllowed.status).not.toBe(429);
  });
});
