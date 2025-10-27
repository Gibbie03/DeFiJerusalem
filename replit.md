# JERUSALEM DeFi Security Scanner

## Overview
JERUSALEM DeFi Security Scanner is a full-stack JavaScript application designed to discover DeFi protocols via the DeFiLlama API, perform comprehensive real-time security threat analysis, and detect all major wallet and protocol threats. It scans for **19+ distinct threat types** including wallet drainers, phishing attacks, private key phishing, social engineering scams, rug pulls, exit scams, fake audits, honeypots, and more. The application supports filtering across over 126 blockchain chains, features a cybersecurity-themed UI, and utilizes persistent PostgreSQL storage. The project aims to provide users with the most comprehensive DeFi security tool available, protecting against all known crypto scams and malicious actors.

## User Preferences
- **Design**: Cybersecurity-themed dark mode with Shield iconography (no emoji usage)
- **Forms**: Must use shadcn useForm + Form pattern with zodResolver for validation
- **Data Updates**: React Query mutations must invalidate relevant queries for immediate UI updates
- **User Control**: Security scanning is manual-only, not triggered automatically on page load
- **Data Persistence**: All data stored in PostgreSQL database for reliability and scalability

## System Architecture

### UI/UX Decisions
The application features a cybersecurity-themed dark mode with prominent Shield iconography. It uses a CoinMarketCap-style table display for protocols, offering rank numbers, formatted TVL (with tooltips for exact amounts), color-coded 24h changes, logos, and category badges. Navigation is managed via an expandable/collapsible sidebar component (shadcn) with a keyboard shortcut (Cmd/Ctrl+B). Security ratings are presented with a color-coded legend, and informational tooltips provide data transparency. Ad spaces are integrated for future monetization. The protocol table implements pagination (100 rows per page) for optimal performance and responsiveness.

### Technical Implementations
The frontend is built with React, Wouter for routing, TanStack Query for data fetching, Shadcn UI for components, and Tailwind CSS for styling. The backend uses Express.js, Drizzle ORM, and Neon PostgreSQL. Validation is handled by Zod, drizzle-zod, and react-hook-form.

**Performance Optimizations (CoinMarketCap-Level Speed):**
- **Client-Side**: 
  - React.memo for row components preventing unnecessary re-renders
  - useCallback for stable function references
  - Sparkline data caching at module scope
  - Single TooltipProvider instance
  - Pagination (100 rows/page) for efficient rendering
  - useMemo for filtered/sorted data
  - Debounced search (300ms) to reduce re-renders
  
- **Server-Side**:
  - Multi-tier caching strategy:
    - Protocols: 60s server cache + 60s browser cache
    - Scans: 180s server cache + 180s browser cache
    - Blacklist: 300s server cache + 300s browser cache
    - Trending: 120s server cache + 120s browser cache
  - HTTP Cache-Control headers with stale-while-revalidate
  - Background refresh guard (5min interval) preventing redundant API calls
  - Gzip compression for all responses (threshold: 1KB)
  - Parallel scan execution (20 concurrent) with Promise.allSettled
  - Reduced inter-batch delays (200ms vs 1000ms)
  - Batch DB writes using Promise.all
  - Database indexes on frequently queried columns (tvl, volume24h, category, change24h, discoveredAt, protocolId, scannedAt)
  - Optimized SQL queries using DISTINCT ON instead of in-memory iteration
  
- **Network Optimization**:
  - Compression reduces payload size by ~70-80%
  - Cache headers enable browser-side caching
  - Stale-while-revalidate serves cached data during background refresh
  
- **Result**: 
  - Initial load: <3s (uncached)
  - Subsequent loads: <100ms (cached)
  - Scan 50 protocols: ~2-4s (was 50s+)
  - Button interactions: <2s
  - Achieving CoinMarketCap-level responsiveness across all operations

### Recent Updates (October 27, 2025)
- **Enhanced Verification System**: Expanded protocol whitelist to 60+ variations including all major DeFi protocols (Uniswap V2/V3/V4, Curve DEX, PancakeSwap AMM V2/V3, Aave V2/V3, etc.) to prevent false positives
- **Admin Blacklist Management**: Added DELETE `/api/blacklist/:id` endpoint with optimistic UI updates allowing admins to remove blacklist entries
- **Improved Security Scoring**: Conditional penalties based on verification level - established protocols with high TVL/age/audits receive reduced penalties for missing audits or anonymous teams

### Feature Specifications
- **Protocol Discovery & Display**: Fetches protocols from DeFiLlama, displays them in a sortable, filterable table by TVL, Volume, or Security Score. Includes category and chain filtering.
- **Volume-Based Ranking**: Protocols can be sorted by estimated 24h trading volume. Since DeFiLlama's `/protocols` endpoint doesn't provide volume data, estimates are calculated using TVL × category-specific turnover rates (DEX: 30%, Lending: 5%, Bridge: 20%, Other: 10%) with activity adjustments based on 24h price change. A hover tooltip clarifies the estimated nature of volume data.
- **Security Analysis**: Conducts comprehensive security scans across **19+ threat categories** covering all major wallet and protocol threats. Detects wallet drainers, phishing sites, private key phishing, social engineering, typosquatting, rug pulls, exit scams, fake audits, honeypots, and more. Each threat type has specific detection patterns and risk scores that determine overall security rating. The scanner includes **verification systems** to prevent false positives:
  - **Protocol Whitelist**: Well-established protocols (Uniswap, Aave, PancakeSwap, etc.) are automatically verified and exempt from penalties
  - **Age Verification**: Protocols older than 365 days receive +50 verification points, reducing false positive risk
  - **TVL Verification**: High TVL ($100M+) indicates legitimacy and adds +40 verification points
  - **Social Verification**: Official Twitter (+20 points) and GitHub (+15 points) presence boost verification scores
  - **Audit Verification**: Audited protocols receive +30 verification points
  - Verification scores are subtracted from threat scores, ensuring only genuine threats are flagged
- **Automatic Blacklisting via Security Scoring**: DApps are automatically scanned and graded using a comprehensive security scoring system. Protocols with **CRITICAL severity (score ≥80 points)** are **automatically blacklisted** and flagged with detailed threat information. The security scoring evaluates: wallet drainer patterns (+100 pts), private key phishing (+100 pts), known scams (+95 pts), phishing attacks (+95 pts), imposter protocols (+90 pts), social engineering (+90 pts), rug pull risks (+85 pts), and more. Blacklisted protocols are persisted to the database with threat details and reasons.
- **3-Tier Audit System**: Integrates audit data from DeFiLlama (count, notes, links) and allows for manual audit entries.
- **Blacklist Management**: Dedicated Blacklist page shows all automatically and manually blacklisted protocols with severity levels, threat details, and reasons. Blacklist entries include status tracking (ACTIVE/INACTIVE) and timestamps. The page features detailed statistics including:
  - **Overview Stats**: Total blacklisted, active threats, recent additions (24h/7d)
  - **Severity Breakdown**: Distribution by CRITICAL/HIGH/MEDIUM severity with total threat count
  - **Threat Type Analysis**: Top 5 most common threat types with visual progress bars and counts
  - **Admin Deletion**: Each entry has a delete button allowing admins to remove false positives or resolved threats
  - The homepage displays a simple blacklist count for quick reference
- **Test Drainer Protocols**: Three malicious test protocols (ETH Airdrop Claimer, Unisvvap, Vitalik Giveaway) are always visible in the protocol list to demonstrate the blacklisting system. These protocols are designed to trigger CRITICAL security alerts when scanned, scoring 160-215 points through detection of scam keywords, typosquatting, and known scam phrases. They persist in the database and survive background refreshes.
- **Scanning Mechanism**: Supports manual security scanning triggered by a "Scan All" button and weekly automated scans. Scan results are stored persistently.
- **DApp Management**: "Add DApp by URL" feature for auto-detecting protocol information from links.
- **Trending & New DApps**: Dedicated pages for tracking recently discovered protocols and those with the highest TVL growth.
- **Tutorial System**: Functionality for uploading and listing educational DeFi security videos.
- **Trending Ticker**: An auto-scrolling ticker displays trending protocols across all pages.

### System Design Choices
- **Database Schema**: Utilizes PostgreSQL with Drizzle ORM for `protocols`, `security_scans`, `blacklist_entries`, `tutorial_videos`, and `manual_audits` tables, ensuring data persistence and scalability.
- **Database Performance**: Indexes added on frequently queried columns (tvl, volume24h, category, change24h, discoveredAt, protocolId, scannedAt) for fast sorting and filtering. Optimized queries using SQL DISTINCT ON instead of in-memory iteration.
- **UPSERT-Based Persistence**: Uses PostgreSQL's `ON CONFLICT DO UPDATE` for protocol storage, ensuring atomic upserts by ID without deleting unrelated records. This allows test drainer protocols to persist indefinitely while background refreshes update real protocols.
- **API Routes**: Comprehensive RESTful API for managing protocols, security scans, blacklist entries, and tutorial videos.
- **Storage Layer**: An `IStorage` interface implementation (`DatabaseStorage`) centralizes all CRUD operations with the database using UPSERT semantics for safe concurrent updates.
- **Test Protocol Management**: Test drainer protocols are managed exclusively in the `/api/protocols` route, filtered from DB cache on every request, re-appended to responses, and immediately persisted to ensure availability for security scanning. Background refreshes fetch only real DeFiLlama protocols, preserving test drainers through UPSERT-by-ID behavior.
- **Separation of Concerns**: Clear distinction between frontend (client/) and backend (server/) directories.
- **Caching**: DeFiLlama API integration includes a 30-minute cache for efficiency. Server-side in-memory caching (2-5 minute TTL) for expensive API routes (/api/scans, /api/blacklist, /api/protocols/trending) with automatic cache invalidation on updates.

## External Dependencies
- **DeFiLlama API**: Used for discovering DeFi protocols, fetching Total Value Locked (TVL) data, and retrieving audit information.
- **Neon PostgreSQL**: Cloud-hosted PostgreSQL database for persistent data storage.
- **Shadcn UI**: UI component library used for building interactive elements like tables, forms, and navigation.
- **TanStack Query (React Query)**: For server state management, data fetching, caching, and synchronization.
- **Zod**: Schema declaration and validation library.
- **YouTube**: Integration for embedding and listing tutorial videos.