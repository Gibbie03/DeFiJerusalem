import express, { type Request, Response, NextFunction } from "express";
import compression from "compression";
import session from "express-session";
import MemoryStore from "memorystore";
import connectPgSimple from "connect-pg-simple";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { pool } from "./db";

const app = express();

// Trust proxy - Required for rate limiting behind Replit's reverse proxy
// This enables Express to read the X-Forwarded-For header to get real client IPs
app.set('trust proxy', 1);

// Security headers with Helmet
const isProduction = process.env.NODE_ENV === 'production';
app.use(helmet({
  contentSecurityPolicy: isProduction ? {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://coinzilla.com", "https://a.bitmedia.io"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      connectSrc: ["'self'", "https://api.llama.fi", "https://defillama-datasets.llama.fi"],
      frameSrc: ["'self'", "https://www.youtube.com", "https://coinzilla.com", "https://a.bitmedia.io"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  } : false, // Disable CSP in development for Vite
  crossOriginEmbedderPolicy: false, // Allow embedding for ads
}));

// Cookie parser for reading request cookies
app.use(cookieParser());

// Session configuration - Use PostgreSQL in production, MemoryStore in development
const createSessionStore = () => {
  if (isProduction) {
    // Production: PostgreSQL session store for persistence across restarts
    const PgSession = connectPgSimple(session);
    return new PgSession({
      pool,
      tableName: 'session', // Will auto-create table if doesn't exist
      createTableIfMissing: true,
      pruneSessionInterval: 60 * 15, // Clean up expired sessions every 15 minutes
    });
  } else {
    // Development: MemoryStore for faster performance
    const MemoryStoreSession = MemoryStore(session);
    return new MemoryStoreSession({
      checkPeriod: 86400000, // 24 hours
    });
  }
};

app.use(session({
  secret: process.env.SESSION_SECRET || 'jerusalem-defi-security-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  store: createSessionStore(),
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours absolute max-age
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
  },
}));

// Enable gzip compression for all responses (CMC-level optimization)
app.use(compression({
  level: 6, // Balanced compression level
  threshold: 1024, // Only compress responses > 1KB
}));

// Global rate limiter - prevent DDoS
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: { error: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// Strict rate limiter for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  skipSuccessfulRequests: true, // Don't count successful logins
  message: { error: "Too many login attempts, please try again in 15 minutes" },
  standardHeaders: true,
  legacyHeaders: false,
});

// API rate limiter for data endpoints
export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 API requests per minute
  message: { error: "API rate limit exceeded, please slow down" },
  standardHeaders: true,
  legacyHeaders: false,
});

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}

declare module 'express-session' {
  interface SessionData {
    adminId?: string;
    adminUsername?: string;
    adminEmail?: string;
    adminRole?: string;
    loginTime?: number;     // Unix ms timestamp when session was created
    lastActivity?: number;  // Unix ms timestamp of last admin API activity
  }
}
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // ── Bootstrap secret check ────────────────────────────────────────────────
  // Warn loudly at startup when ADMIN_BOOTSTRAP_SECRET is missing or still set
  // to the placeholder value.  The /api/admin/reset-password and
  // /api/admin/init endpoints are already blocked at request time, but an
  // explicit startup warning lets operators catch misconfigurations before
  // they discover them under pressure (e.g. a lockout).
  {
    const PLACEHOLDER = 'CHANGE_THIS_IN_PRODUCTION_OR_ADMIN_CREATION_DISABLED';
    const bootstrapSecret = process.env.ADMIN_BOOTSTRAP_SECRET;
    if (!bootstrapSecret || bootstrapSecret === PLACEHOLDER) {
      log('⚠️  WARNING: ADMIN_BOOTSTRAP_SECRET is not set (or is the placeholder value).');
      log('⚠️  The /api/admin/reset-password and /api/admin/init endpoints are DISABLED.');
      log('⚠️  Set ADMIN_BOOTSTRAP_SECRET in your environment to enable password reset.');
    } else {
      log('✓ ADMIN_BOOTSTRAP_SECRET is configured — password reset endpoint is active.');
    }
  }

  const server = await registerRoutes(app);

  // Initialize AI Learning with database persistence (Phase 2)
  try {
    const { threatLearner } = await import('./lib/threat-pattern-learner');
    const { storage } = await import('./storage');
    await threatLearner.initialize(storage);
    log('✓ AI Learning initialized with database persistence');
  } catch (error: any) {
    log(`✗ Failed to initialize AI Learning: ${error.message}`);
  }

  // Schedule daily Immunefi bug bounty refresh via Playwright scraper
  {
    const { spawn } = await import('child_process');
    const ONE_DAY = 24 * 60 * 60 * 1000;
    const runImmunefiScrape = () => {
      log('[IMMUNEFI] Starting daily bounty scrape…');
      const proc = spawn(
        process.execPath,
        ['node_modules/.bin/tsx', 'server/scripts/scrape-immunefi-bounties.ts'],
        { stdio: 'pipe', cwd: process.cwd() },
      );
      const lines: string[] = [];
      proc.stdout?.on('data', (d: Buffer) => lines.push(d.toString().trim()));
      proc.stderr?.on('data', (d: Buffer) => lines.push(d.toString().trim()));
      proc.on('close', (code: number | null) => {
        if (code === 0) {
          log('[IMMUNEFI] ✓ Daily scrape succeeded');
        } else {
          log(`[IMMUNEFI] ✗ Daily scrape exited ${code} — keeping existing data`);
          lines.slice(-3).forEach(l => log(`[IMMUNEFI]   ${l}`));
        }
      });
    };
    setInterval(runImmunefiScrape, ONE_DAY);
    log('✓ Immunefi daily refresh scheduled (every 24 h)');
  }

  // Schedule weekly security data enrichment (DeFiSafety + GitHub enrichment)
  {
    const { spawn } = await import('child_process');
    const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;
    const runSecurityEnrichment = async (label: string, script: string) => {
      log(`[SECURITY-PIPELINE] Starting ${label}…`);
      const proc = spawn(
        process.execPath,
        ['node_modules/.bin/tsx', script],
        { stdio: 'pipe', cwd: process.cwd() },
      );
      const lines: string[] = [];
      proc.stdout?.on('data', (d: Buffer) => lines.push(d.toString().trim()));
      proc.stderr?.on('data', (d: Buffer) => lines.push(d.toString().trim()));
      proc.on('close', (code: number | null) => {
        if (code === 0) {
          log(`[SECURITY-PIPELINE] ✓ ${label} succeeded`);
        } else {
          log(`[SECURITY-PIPELINE] ✗ ${label} exited ${code}`);
          lines.slice(-3).forEach(l => log(`[SECURITY-PIPELINE]   ${l}`));
        }
      });
    };
    // Stagger runs: DeFiSafety first, GitHub enrichment 5 min later
    setInterval(() => runSecurityEnrichment('DeFiSafety scores', 'server/scripts/fetch-defisafety-scores.ts'), ONE_WEEK);
    setInterval(() => runSecurityEnrichment('GitHub enrichment', 'server/scripts/enrich-github-from-defillama.ts'), ONE_WEEK);
    log('✓ Weekly security enrichment scheduled (DeFiSafety + GitHub, every 7 days)');
  }

  // Schedule periodic cleanup of expired chat sessions (every 6 hours)
  {
    const { storage } = await import('./storage');
    const SIX_HOURS = 6 * 60 * 60 * 1000;
    const runCleanup = async () => {
      try {
        const count = await storage.deleteExpiredChatSessions();
        if (count > 0) {
          log(`✓ Chat session cleanup: removed ${count} expired session(s)`);
        }
      } catch (err: any) {
        log(`✗ Chat session cleanup failed: ${err.message}`);
      }
    };
    // Run once at startup, then every 6 hours
    runCleanup();
    setInterval(runCleanup, SIX_HOURS);
    log('✓ Chat session cleanup scheduler started (every 6 hours)');
  }

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
    
    // Contract discovery job removed — app is now focused on protocol-level
    // security aggregation (DeFiLlama hacks + Immunefi), not on-chain contract scanning.
  });
})();
