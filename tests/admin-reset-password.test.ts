/**
 * Integration tests for POST /api/admin/reset-password
 *
 * The endpoint is gated by ADMIN_BOOTSTRAP_SECRET (no session required) so
 * that locked-out admins can recover access.  These tests verify:
 *
 *  1. Missing bootstrapSecret  → 403
 *  2. Wrong bootstrapSecret    → 403
 *  3. Correct secret + weak password + valid username → 400
 *  4. Correct secret + unknown username               → 404
 *  5. Happy path: correct secret + valid credentials  → 200, login works
 */

import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import session from 'express-session';
import MemoryStore from 'memorystore';
import bcryptjs from 'bcryptjs';
import type { Server } from 'http';

// ── Mocks (must appear before server module imports) ─────────────────────────

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

// ── App factory ───────────────────────────────────────────────────────────────

const { registerRoutes } = await import('../server/routes');

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

  const server = await registerRoutes(app);
  return { app, server };
}

// ── Constants & helpers ───────────────────────────────────────────────────────

const CORRECT_SECRET  = 'super-secret-bootstrap-key';
const WRONG_SECRET    = 'not-the-right-secret';
const ADMIN_USERNAME  = 'testadmin';
const VALID_PASSWORD  = 'ValidPass99';
const WEAK_PASSWORD   = 'weak';   // < 8 chars, no digits

async function makeHash(password: string) {
  return bcryptjs.hash(password, 4);
}

async function makeMockAdmin(password = VALID_PASSWORD) {
  return {
    id:           'admin-test-id',
    username:     ADMIN_USERNAME,
    passwordHash: await makeHash(password),
    email:        'test@example.com',
    role:         'admin',
    createdAt:    new Date().toISOString(),
    lastLogin:    null,
  };
}

// ── Test suite ────────────────────────────────────────────────────────────────

describe('POST /api/admin/reset-password', () => {
  let app: express.Express;
  let server: Server;

  beforeAll(async () => {
    // Set a known bootstrap secret before the app boots
    process.env.ADMIN_BOOTSTRAP_SECRET = CORRECT_SECRET;
    ({ app, server } = await buildApp());
  });

  afterAll(() => {
    server.close();
    delete process.env.ADMIN_BOOTSTRAP_SECRET;
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockStorage.getBlacklist.mockResolvedValue([]);
    mockStorage.getAdminByUsername.mockImplementation(() => makeMockAdmin());
    mockStorage.updateAdminPassword.mockResolvedValue(undefined);
    mockStorage.updateAdminLastLogin.mockResolvedValue(undefined);
  });

  // ── 1. Missing bootstrap secret ─────────────────────────────────────────────
  it('returns 403 when bootstrapSecret is absent', async () => {
    const res = await request(app)
      .post('/api/admin/reset-password')
      .send({ username: ADMIN_USERNAME, newPassword: VALID_PASSWORD });
      // no bootstrapSecret field

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(mockStorage.updateAdminPassword).not.toHaveBeenCalled();
  });

  // ── 2. Wrong bootstrap secret ───────────────────────────────────────────────
  it('returns 403 when bootstrapSecret is incorrect', async () => {
    const res = await request(app)
      .post('/api/admin/reset-password')
      .send({
        username:        ADMIN_USERNAME,
        newPassword:     VALID_PASSWORD,
        bootstrapSecret: WRONG_SECRET,
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(mockStorage.updateAdminPassword).not.toHaveBeenCalled();
  });

  // ── 3. Correct secret + weak password ──────────────────────────────────────
  it('returns 400 when new password is too weak (< 8 chars or no digits)', async () => {
    const res = await request(app)
      .post('/api/admin/reset-password')
      .send({
        username:        ADMIN_USERNAME,
        newPassword:     WEAK_PASSWORD,
        bootstrapSecret: CORRECT_SECRET,
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/8 char/i);
    expect(mockStorage.updateAdminPassword).not.toHaveBeenCalled();
  });

  // ── 4. Correct secret + letters-only password (no digits) ──────────────────
  it('returns 400 when new password has no digits', async () => {
    const res = await request(app)
      .post('/api/admin/reset-password')
      .send({
        username:        ADMIN_USERNAME,
        newPassword:     'OnlyLetters',
        bootstrapSecret: CORRECT_SECRET,
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(mockStorage.updateAdminPassword).not.toHaveBeenCalled();
  });

  // ── 5. Correct secret + unknown username ────────────────────────────────────
  it('returns 404 when the username does not exist', async () => {
    mockStorage.getAdminByUsername.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/admin/reset-password')
      .send({
        username:        'ghost-admin',
        newPassword:     VALID_PASSWORD,
        bootstrapSecret: CORRECT_SECRET,
      });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/not found/i);
    expect(mockStorage.updateAdminPassword).not.toHaveBeenCalled();
  });

  // ── 6. Happy path ───────────────────────────────────────────────────────────
  it('returns 200 and updates the password hash when all inputs are valid', async () => {
    const res = await request(app)
      .post('/api/admin/reset-password')
      .send({
        username:        ADMIN_USERNAME,
        newPassword:     VALID_PASSWORD,
        bootstrapSecret: CORRECT_SECRET,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/reset successfully/i);

    // Storage must have been called exactly once
    expect(mockStorage.updateAdminPassword).toHaveBeenCalledOnce();

    // The saved hash must verify against the new password
    const [adminId, savedHash] = mockStorage.updateAdminPassword.mock.calls[0];
    expect(adminId).toBe('admin-test-id');
    const matches = await bcryptjs.compare(VALID_PASSWORD, savedHash);
    expect(matches).toBe(true);
  });

  // ── 7. Happy path: post-reset login succeeds ────────────────────────────────
  it('allows the admin to log in with the new password after a successful reset', async () => {
    const NEW_PASSWORD = 'FreshPass42';

    // First, reset the password
    const resetRes = await request(app)
      .post('/api/admin/reset-password')
      .send({
        username:        ADMIN_USERNAME,
        newPassword:     NEW_PASSWORD,
        bootstrapSecret: CORRECT_SECRET,
      });

    expect(resetRes.status).toBe(200);

    // Capture the new hash that was stored
    const [, savedHash] = mockStorage.updateAdminPassword.mock.calls[0];

    // Now simulate a login attempt with the new password.
    // Make storage return an admin whose passwordHash matches the new hash.
    mockStorage.getAdminByUsername.mockResolvedValue({
      id:           'admin-test-id',
      username:     ADMIN_USERNAME,
      passwordHash: savedHash,
      email:        'test@example.com',
      role:         'admin',
      createdAt:    new Date().toISOString(),
      lastLogin:    null,
    });

    const loginRes = await request(app)
      .post('/api/admin/login')
      .send({ username: ADMIN_USERNAME, password: NEW_PASSWORD });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
  });

  // ── 8. No-secret env var (disabled) ─────────────────────────────────────────
  it('returns 403 when ADMIN_BOOTSTRAP_SECRET is the default placeholder', async () => {
    // Temporarily swap the env var to the disabled sentinel
    const saved = process.env.ADMIN_BOOTSTRAP_SECRET;
    process.env.ADMIN_BOOTSTRAP_SECRET = 'CHANGE_THIS_IN_PRODUCTION_OR_ADMIN_CREATION_DISABLED';

    const res = await request(app)
      .post('/api/admin/reset-password')
      .send({
        username:        ADMIN_USERNAME,
        newPassword:     VALID_PASSWORD,
        bootstrapSecret: 'CHANGE_THIS_IN_PRODUCTION_OR_ADMIN_CREATION_DISABLED',
      });

    process.env.ADMIN_BOOTSTRAP_SECRET = saved;

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/disabled/i);
    expect(mockStorage.updateAdminPassword).not.toHaveBeenCalled();
  });
});
