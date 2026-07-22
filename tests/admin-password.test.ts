/**
 * Integration tests for PUT /api/admin/password
 *
 * These tests spin up the real Express app (with mocked external dependencies
 * and storage) and exercise the password-change endpoint end-to-end via HTTP.
 */

import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import session from 'express-session';
import MemoryStore from 'memorystore';
import bcryptjs from 'bcryptjs';
import type { Server } from 'http';

// ── Mock heavy dependencies before any server module is imported ──────────────

// Prevent real DB connections
vi.mock('../server/db', () => ({
  db: {},
  pool: { on: vi.fn() },
}));

// Mock rate limiters so they don't block test requests
vi.mock('../server/index', () => ({
  authLimiter: (_req: any, _res: any, next: () => void) => next(),
  apiLimiter:  (_req: any, _res: any, next: () => void) => next(),
}));

// Mock storage — individual tests override the relevant methods
const mockStorage = {
  getBlacklist:           vi.fn().mockResolvedValue([]),
  getAdminByUsername:     vi.fn(),
  getAdminById:           vi.fn(),
  updateAdminLastLogin:   vi.fn().mockResolvedValue(undefined),
  updateAdminPassword:    vi.fn().mockResolvedValue(undefined),
  getProtocols:           vi.fn().mockResolvedValue([]),
  getAllSecurityScans:     vi.fn().mockResolvedValue({}),
  getProtocolsByDiscoveryDate: vi.fn().mockResolvedValue([]),
  getProtocolsByTvlGrowth:    vi.fn().mockResolvedValue([]),
};

vi.mock('../server/storage', () => ({ storage: mockStorage }));

// Mock DAppDiscovery so its constructor/methods don't hit network
vi.mock('../server/lib/dapp-discovery', () => ({
  DAppDiscovery: function DAppDiscovery() {
    return {
      fetchFromMultipleSources: vi.fn().mockResolvedValue([]),
      getTestDrainerProtocols:  vi.fn().mockReturnValue([]),
    };
  },
}));

// Mock protocol-security-aggregator
vi.mock('../server/lib/protocol-security-aggregator', () => ({
  getProtocolSecurityData: vi.fn().mockResolvedValue(null),
}));

// Mock BlacklistManager
vi.mock('../server/lib/blacklist-manager', () => ({
  BlacklistManager: function BlacklistManager() {
    return {
      isBlacklisted: vi.fn().mockReturnValue(false),
      getBlacklist:  vi.fn().mockReturnValue([]),
    };
  },
}));

// Mock audit logger (prevents file/db writes in tests)
vi.mock('../server/lib/audit-logger', () => ({
  auditLogger: { logFromRequest: vi.fn() },
}));

// Mock threat-pattern-learner (uses DB internally)
vi.mock('../server/lib/threat-pattern-learner', () => ({
  threatLearner: {
    getStats:    vi.fn().mockReturnValue({ highConfidencePatterns: 0, knownExploits: 0 }),
    getInsights: vi.fn().mockReturnValue([]),
    learnFromScan: vi.fn().mockResolvedValue(undefined),
  },
}));

// Mock sub-routers so they don't pull in extra DB dependencies
vi.mock('../server/routes/bounty-audit-routes', () => ({
  registerBountyAuditRoutes: vi.fn(),
}));
vi.mock('../server/routes/chat-routes', () => ({
  registerChatRoutes: vi.fn(),
}));

// ── App setup ─────────────────────────────────────────────────────────────────

// Import registerRoutes AFTER all mocks are in place
const { registerRoutes } = await import('../server/routes');

/**
 * Build a minimal Express app with session support and all routes registered.
 * Each test suite gets a fresh server.
 */
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

// ── Helpers ───────────────────────────────────────────────────────────────────

const CURRENT_PASSWORD = 'CurrentPass1';
const NEW_PASSWORD      = 'NewPass9999';

/** Create a bcrypt hash synchronously (low rounds for speed in tests). */
async function makeHash(password: string) {
  return bcryptjs.hash(password, 4);
}

/** Returns a mock AdminUser record. */
async function makeMockAdmin(password = CURRENT_PASSWORD) {
  return {
    id:           'admin-test-id',
    username:     'testadmin',
    passwordHash: await makeHash(password),
    email:        'test@example.com',
    role:         'admin',
    createdAt:    new Date().toISOString(),
    lastLogin:    null,
  };
}

/**
 * Log in via POST /api/admin/login and return the cookie string so subsequent
 * requests share the same session.
 */
async function loginAndGetCookie(app: express.Express, password = CURRENT_PASSWORD) {
  const res = await request(app)
    .post('/api/admin/login')
    .send({ username: 'testadmin', password });

  expect(res.status).toBe(200);
  expect(res.body.success).toBe(true);

  // supertest returns Set-Cookie as an array; join for use in Cookie header
  const cookies: string[] = res.headers['set-cookie'] ?? [];
  return cookies.join('; ');
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('PUT /api/admin/password', () => {
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
    // Always return a valid admin from storage by default
    mockStorage.getAdminByUsername.mockImplementation(() => makeMockAdmin());
    mockStorage.getAdminById.mockImplementation(() => makeMockAdmin());
    mockStorage.updateAdminLastLogin.mockResolvedValue(undefined);
    mockStorage.updateAdminPassword.mockResolvedValue(undefined);
    mockStorage.getBlacklist.mockResolvedValue([]);
  });

  // ── 1. Unauthenticated request ──────────────────────────────────────────────
  it('returns 401 when the request has no admin session', async () => {
    const res = await request(app)
      .put('/api/admin/password')
      .send({ currentPassword: CURRENT_PASSWORD, newPassword: NEW_PASSWORD });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  // ── 2. Correct current password → password is changed ──────────────────────
  it('changes password successfully when current password is correct', async () => {
    const cookie = await loginAndGetCookie(app);

    const res = await request(app)
      .put('/api/admin/password')
      .set('Cookie', cookie)
      .send({ currentPassword: CURRENT_PASSWORD, newPassword: NEW_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/updated/i);

    // Ensure the storage layer was actually called with a new hash
    expect(mockStorage.updateAdminPassword).toHaveBeenCalledOnce();
    const [adminId, newHash] = mockStorage.updateAdminPassword.mock.calls[0];
    expect(adminId).toBe('admin-test-id');
    // The saved hash must verify against the new password
    const hashMatches = await bcryptjs.compare(NEW_PASSWORD, newHash);
    expect(hashMatches).toBe(true);
  });

  // ── 3. Wrong current password → rejected ───────────────────────────────────
  it('rejects the request when current password is wrong', async () => {
    const cookie = await loginAndGetCookie(app);

    const res = await request(app)
      .put('/api/admin/password')
      .set('Cookie', cookie)
      .send({ currentPassword: 'WrongPassword!', newPassword: NEW_PASSWORD });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/incorrect/i);

    // Storage must NOT be called to update the password
    expect(mockStorage.updateAdminPassword).not.toHaveBeenCalled();
  });

  // ── 4. New password too short → rejected ───────────────────────────────────
  it('rejects new passwords shorter than 8 characters', async () => {
    const cookie = await loginAndGetCookie(app);

    const res = await request(app)
      .put('/api/admin/password')
      .set('Cookie', cookie)
      .send({ currentPassword: CURRENT_PASSWORD, newPassword: 'short' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/8 char/i);

    expect(mockStorage.updateAdminPassword).not.toHaveBeenCalled();
  });

  // ── 5. Missing fields → rejected ───────────────────────────────────────────
  it('rejects requests with missing currentPassword or newPassword fields', async () => {
    const cookie = await loginAndGetCookie(app);

    const res = await request(app)
      .put('/api/admin/password')
      .set('Cookie', cookie)
      .send({ currentPassword: CURRENT_PASSWORD }); // newPassword omitted

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(mockStorage.updateAdminPassword).not.toHaveBeenCalled();
  });

  // ── 6. adminUsername absent from session → falls back to adminId ────────────
  it('changes password successfully when adminUsername is missing from the session', async () => {
    // Log in normally to obtain a valid session cookie
    const cookie = await loginAndGetCookie(app);

    // Simulate a session that has adminId but NOT adminUsername by making
    // getAdminByUsername return undefined (as if the field were absent).
    mockStorage.getAdminByUsername.mockResolvedValue(undefined);
    // getAdminById is the fallback and should return the real admin record.
    mockStorage.getAdminById.mockImplementation(() => makeMockAdmin());

    const res = await request(app)
      .put('/api/admin/password')
      .set('Cookie', cookie)
      .send({ currentPassword: CURRENT_PASSWORD, newPassword: NEW_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/updated/i);

    // Storage must have been called to persist the new hash
    expect(mockStorage.updateAdminPassword).toHaveBeenCalledOnce();
    const [adminId, newHash] = mockStorage.updateAdminPassword.mock.calls[0];
    expect(adminId).toBe('admin-test-id');
    const hashMatches = await bcryptjs.compare(NEW_PASSWORD, newHash);
    expect(hashMatches).toBe(true);
  });
});
