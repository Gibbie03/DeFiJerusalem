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

// Cookie parser for CSRF tokens
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
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
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
    
    // Start contract discovery job (runs every hour)
    if (process.env.ETHERSCAN_API_KEY) {
      import('./jobs/contract-discovery-job').then(({ getContractDiscoveryJob }) => {
        const job = getContractDiscoveryJob();
        job.startPeriodic(60); // Run every 60 minutes
        log('✓ Contract discovery job started (hourly)');
      }).catch(error => {
        log(`✗ Failed to start contract discovery job: ${error.message}`);
      });
    } else {
      log('⚠ Contract discovery disabled: ETHERSCAN_API_KEY not set');
    }
  });
})();
