# JERUSALEM DeFi Security Scanner

## Overview
JERUSALEM DeFi Security Scanner is a full-stack JavaScript application designed to discover DeFi protocols, perform comprehensive real-time security threat analysis, and detect all major wallet and protocol threats. It scans for over 19 distinct threat types, including wallet drainers, phishing attacks, rug pulls, and more, across over 126 blockchain chains. The project aims to provide the most comprehensive DeFi security tool available, protecting users against crypto scams and malicious actors. It features a cybersecurity-themed UI and utilizes persistent PostgreSQL storage.

## User Preferences
- **Design**: Cybersecurity-themed dark mode with Shield iconography (no emoji usage)
- **Forms**: Must use shadcn useForm + Form pattern with zodResolver for validation
- **Data Updates**: React Query mutations must invalidate relevant queries for immediate UI updates
- **User Control**: Security scanning is manual-only, not triggered automatically on page load
- **Data Persistence**: All data stored in PostgreSQL database for reliability and scalability

## System Architecture

### UI/UX Decisions
The application features a cybersecurity-themed dark mode with Shield iconography. Protocols are displayed in a CoinMarketCap-style table with rank, formatted TVL, color-coded 24h changes, logos, and category badges. Navigation uses an expandable/collapsible shadcn sidebar with a keyboard shortcut (Cmd/Ctrl+B). Security ratings have a color-coded legend and informational tooltips. Ad spaces are integrated for monetization, and the protocol table implements pagination (100 rows per page).

### Technical Implementations
The frontend uses React, Wouter for routing, TanStack Query for data fetching, Shadcn UI for components, and Tailwind CSS for styling. The backend uses Express.js, Drizzle ORM, and Neon PostgreSQL. Validation is handled by Zod, drizzle-zod, and react-hook-form.

**Performance Optimizations:**
The system is optimized for CoinMarketCap-level speed through client-side techniques like `React.memo`, `useCallback`, `useMemo`, debounced search, and pagination, as well as server-side multi-tier caching (protocols, scans, blacklist, trending), HTTP Cache-Control headers, background refresh guards, Gzip compression, parallel scan execution, batch DB writes, and database indexing. Network optimization includes compression and `stale-while-revalidate` caching.

### Feature Specifications
- **Protocol Discovery & Display**: Fetches protocols from DeFiLlama, displaying them in a sortable, filterable table. Uses real volume data when available from API, with intelligent estimation fallback. Supports 15+ protocol categories including Gaming, Derivatives, Insurance, Stablecoin, Liquid Staking, and more.
- **Security Analysis**: Conducts comprehensive scans for 19+ threat categories, detecting wallet drainers, phishing, rug pulls, etc. Includes a verification system (protocol whitelist, age, TVL, social, audit verification) to prevent false positives.
- **Automatic Blacklisting**: DApps with CRITICAL severity scores (≥80 points) are automatically blacklisted based on threat patterns (e.g., wallet drainer patterns, private key phishing, known scams).
- **3-Tier Audit System**: Integrates DeFiLlama audit data and allows manual entries.
- **Blacklist Management**: A dedicated page displays automatically and manually blacklisted protocols with severity levels, threat details, reasons, and statistics. Admins can delete entries.
- **Test Drainer Protocols**: Three malicious test protocols (ETH Airdrop Claimer, Unisvvap, Vitalik Giveaway) are always present to demonstrate the blacklisting system.
- **Scanning Mechanism**: Supports manual "Scan All" and automated weekly security scans with persistent results.
- **DApp Management**: "Add DApp by URL" feature.
- **Trending & New DApps**: Dedicated pages for tracking protocol trends.
- **Tutorial System**: Functionality for educational DeFi security videos.
- **Trending Ticker**: An auto-scrolling ticker displays trending protocols across all pages.
- **Sponsorship & Featured Listings System**: A comprehensive revenue monetization system with 2 pricing tiers (Featured, Sponsored) for enhanced protocol visibility, including database schema, public guidance page, and social media links (X: @defi_jerusalem, Telegram: t.me/DefiJerusalem).
- **Admin Panel**: Secure admin interface with bcrypt authentication, session management, and full protocol management capabilities including protocol editing, blacklist oversight, and sponsorship management.

### System Design Choices
- **Database Schema**: PostgreSQL with Drizzle ORM for `protocols`, `security_scans`, `blacklist_entries`, `tutorial_videos`, `manual_audits`, `sponsor_payments`, and `admin_users` tables.
- **Database Performance**: Indexes on frequently queried columns and optimized SQL queries using `DISTINCT ON`.
- **UPSERT-Based Persistence**: Uses PostgreSQL's `ON CONFLICT DO UPDATE` for protocol storage, ensuring atomic updates and persistence of test drainer protocols.
- **API Routes**: RESTful API for managing application data, including admin authentication endpoints (login, logout, session management, protocol updates).
- **Storage Layer**: An `IStorage` interface (`DatabaseStorage`) centralizes database operations.
- **Test Protocol Management**: Test drainer protocols are managed and persisted to ensure constant availability for scanning demonstrations.
- **Separation of Concerns**: Clear distinction between frontend and backend.
- **Caching**: DeFiLlama API has a 30-minute cache. Server-side in-memory caching (2-5 minute TTL) for expensive API routes with automatic invalidation.
- **Admin Authentication**: bcryptjs password hashing with express-session for secure session management.

## Security Architecture

### Multi-Layer Security Implementation
The application implements comprehensive security hardening to protect against common web attacks and unauthorized access:

#### 1. Rate Limiting (Anti-DDoS & Brute Force Protection)
- **Global Rate Limiter**: 1,000 requests per 15 minutes per IP (prevents DDoS)
- **API Rate Limiter**: 100 requests per minute per IP on data endpoints (/api/protocols, /api/blacklist, /api/scans, /api/trending)
- **Auth Rate Limiter**: 5 login attempts per 15 minutes per IP on authentication endpoints (/api/admin/login, /api/admin/init)
- Uses `express-rate-limit` with proper HTTP headers (RateLimit-Limit, RateLimit-Remaining)
- Successful logins don't count against rate limits

#### 2. Secure Admin Initialization
- **Bootstrap Secret Required**: Admin creation requires `ADMIN_BOOTSTRAP_SECRET` environment variable
- **Single Admin Creation**: Only one admin can be created via /api/admin/init endpoint
- **Password Requirements**: Minimum 8 characters, must contain letters and numbers
- **Username Validation**: 3-50 alphanumeric characters and underscores only
- **Email Validation**: Proper regex validation for email format
- Admin creation is completely disabled if bootstrap secret is not set or uses default value

#### 3. Comprehensive Audit Logging
- **All Admin Actions Logged**: Login attempts (success/failure), logout, protocol updates, admin initialization
- **Captured Data**: Timestamp, action type, user ID, username, IP address, user agent, success status, additional details
- **Log Retention**: Last 10,000 entries kept in memory with automatic rotation
- **Queryable Logs**: Can filter by type (failed_logins, user-specific), viewable via /api/admin/audit-logs endpoint
- **Console Monitoring**: All security events logged to console for real-time monitoring

#### 4. Input Validation & Sanitization
- **Username**: Sanitized with trim(), toLowerCase(), regex validation (alphanumeric + underscores, 3-50 chars)
- **Email**: Sanitized with trim(), toLowerCase(), regex validation
- **Password**: Strength validation (8+ chars, letters + numbers required)
- **All Inputs**: Type checking (typeof validation) before processing
- **SQL Injection Protection**: Using Drizzle ORM with parameterized queries

#### 5. Security Headers (Helmet Middleware)
- **X-Content-Type-Options**: nosniff (prevents MIME-type sniffing)
- **X-Frame-Options**: DENY (prevents clickjacking)
- **X-XSS-Protection**: 1; mode=block (enables XSS filter)
- **Strict-Transport-Security**: Enforces HTTPS in production
- **Content Security Policy**: Disabled for Vite dev server compatibility

#### 6. Session Security
- **Secure Cookies**: HttpOnly, SameSite=Lax, Secure flag in production
- **Session Secret**: Uses SESSION_SECRET environment variable (fallback warns if using default)
- **Session Expiration**: 7-day session lifetime
- **Memory Store**: MemoryStore with 24-hour cleanup cycle (suitable for single-instance deployment)

#### 7. Error Message Security
- **No Information Leakage**: Generic error messages returned to clients ("Login error occurred" vs specific errors)
- **Detailed Logging**: Full errors logged server-side for debugging
- **Credential Hiding**: No sensitive data (passwords, hashes, tokens) in responses or logs

### Environment Variables for Security
- `SESSION_SECRET`: Strong random string for session encryption (CRITICAL - change in production)
- `ADMIN_BOOTSTRAP_SECRET`: Required for admin creation (prevents unauthorized admin accounts)
- `DATABASE_URL`: PostgreSQL connection string (auto-managed by Replit)

### Security Best Practices
- **Never expose SESSION_SECRET or ADMIN_BOOTSTRAP_SECRET**
- **Monitor audit logs regularly** for suspicious activity via /api/admin/audit-logs
- **Rate limits are per-IP** - attackers using multiple IPs can still attempt attacks
- **Frontend code is always visible** - only backend logic and secrets are protected
- **Database credentials** are secured via environment variables and never exposed in API responses

## External Dependencies
- **DeFiLlama API**: For DeFi protocol discovery, TVL data, and audit information.
- **Neon PostgreSQL**: Cloud-hosted PostgreSQL database.
- **Shadcn UI**: UI component library.
- **TanStack Query (React Query)**: For server state management and data fetching.
- **Zod**: Schema declaration and validation.
- **YouTube**: Integration for embedding tutorial videos.
- **Bitmedia**: Primary crypto advertising network.
- **Coinzilla**: Fallback crypto advertising network.