# JERUSALEM DeFi Security Scanner

## Overview
JERUSALEM DeFi Security Scanner is a full-stack JavaScript application designed to discover DeFi protocols, perform comprehensive real-time security threat analysis, and detect all major wallet and protocol threats across over 126 blockchain chains. It scans for 29 distinct threat categories, including wallet drainers, phishing attacks, rug pulls, governance attacks, smart contract vulnerabilities, economic exploits, and regulatory risks. The project aims to provide the most comprehensive DeFi security tool available, protecting users against crypto scams and malicious actors with a cybersecurity-themed UI and persistent PostgreSQL storage.

## User Preferences
- **Design**: Cybersecurity-themed dark mode with Shield iconography (no emoji usage)
- **Forms**: Must use shadcn useForm + Form pattern with zodResolver for validation
- **Data Updates**: React Query mutations must invalidate relevant queries for immediate UI updates
- **User Control**: Security scanning is manual-only, not triggered automatically on page load
- **Data Persistence**: All data stored in PostgreSQL database for reliability and scalability

## System Architecture

### UI/UX Decisions
The application features a cybersecurity-themed dark mode with Shield iconography. Protocols are displayed in a CoinMarketCap-style table with rank, formatted TVL, color-coded 24h changes, 7-day TVL sparkline charts, logos, and category badges. Navigation uses an expandable/collapsible shadcn sidebar. Ad spaces are integrated for monetization, and the protocol table implements pagination with "Load More" functionality. Security ratings have a color-coded legend and informational tooltips. Dashboard stats display actual blockchain count (126+), total protocols, and audited protocols count.

### Technical Implementations
The frontend uses React, Wouter for routing, TanStack Query for data fetching, Shadcn UI for components, and Tailwind CSS for styling. The backend uses Express.js, Drizzle ORM, and Neon PostgreSQL. Validation is handled by Zod, drizzle-zod, and react-hook-form. Performance is optimized through client-side techniques (e.g., `React.memo`, `useCallback`, debounced search) and server-side multi-tier caching, HTTP Cache-Control headers, Gzip compression, parallel scan execution, batch DB writes, and an intelligent pagination system that provides instant loading (500 protocols initially) with "Load More" functionality for complete data access.

### Feature Specifications
- **Protocol Discovery & Display**: Fetches and displays protocols from DeFiLlama in a sortable, filterable table, supporting 15+ categories. Implements smart pagination with instant initial load (500 protocols) and "Load More" button for accessing complete dataset. Default sort is by security score ranking.
- **Pagination System**: Best-of-both-worlds approach - loads 500 protocols instantly for speed, then provides "Load More" button to fetch additional 500 protocols per click. Works with filtered views and maintains performance through dual caching strategy.
- **Security Analysis**: Conducts comprehensive scans for 29 distinct threat categories, including wallet drainers, phishing, rug pulls, and smart contract vulnerabilities. Includes a verification system to prevent false positives.
- **Automatic Blacklisting**: DApps with CRITICAL severity scores (≥80 points) are automatically blacklisted based on threat patterns.
- **3-Tier Audit System**: Integrates DeFiLlama audit data and allows manual entries.
- **Blacklist Management**: A dedicated page displays blacklisted protocols with severity levels and threat details. Admins can delete entries.
- **Test Drainer Protocols**: Three malicious test protocols are always present to demonstrate the blacklisting system.
- **Scanning Mechanism**: Supports manual "Scan All" and automated weekly security scans.
- **Admin Panel**: Secure admin interface with bcrypt authentication, session management, and full protocol management capabilities, including sponsorship management.
- **Sponsorship & Featured Listings System**: A comprehensive monetization system with 2 pricing tiers for enhanced protocol visibility.
- **Protocol Customization System**: Allows protocol owners/teams to submit customization requests ($200 fee) to edit descriptions, links, logos, and add audit information (improves security score). Includes secure payment verification workflow with admin approval process.

### System Design Choices
- **Database Schema**: PostgreSQL with Drizzle ORM for `protocols`, `security_scans`, `blacklist_entries`, `sponsor_payments`, `protocol_customizations`, and `admin_users` tables, optimized with indexing.
- **UPSERT-Based Persistence**: Uses PostgreSQL's `ON CONFLICT DO UPDATE` for atomic updates and persistence of test drainer protocols.
- **API Routes**: RESTful API for managing application data, including secure admin authentication endpoints. Protocols endpoint supports pagination with limit/offset parameters.
- **Dual Caching Strategy**: Caches full dataset (`protocols-full`) for pagination efficiency and individual pages (`protocols-{filters,limit,offset}`) with MD5-based ETags. TTL: 60s for protocols, 2-5min for other endpoints.
- **Pre-Serialized JSON**: Cache stores pre-serialized JSON strings to eliminate re-serialization overhead on repeated requests, achieving sub-100ms response times for cached data.
- **Content-Based ETags**: MD5 hash-based ETags enable 304 Not Modified responses, saving bandwidth and improving performance.
- **Pagination**: Default 500 protocols per page (max 1000), with client-side "Load More" functionality to access full dataset without sacrificing initial load speed.
- **Multi-Layer Security**: Implements rate limiting, secure admin initialization, comprehensive audit logging, input validation/sanitization (using Drizzle ORM for SQL injection protection), security headers (Helmet middleware), and secure session management.
- **Error Handling**: Generic error messages returned to clients to prevent information leakage.
- **Threat Detection Coverage**: Protects against wallet drainers, phishing, rug pulls, governance attacks, smart contract backdoors, oracle manipulation, bridge exploits, Ponzi schemes, migration scams, honeypot tokens, and regulatory violations across 126+ blockchain chains.

## Recent Changes (October 28, 2025)
- **Removed De.Fi API Integration**: Removed all De.Fi API integration code due to persistent API failures. Now using DeFiLlama exclusively for audit and security data. Removed De.Fi security score display from frontend. Application now relies on DeFiLlama's audit data (2,622+ protocols) for audit information.
- **Trending List Updated**: Updated trending algorithm to exclude protocols with critical risk (security score < 50), filter for meaningful growth (absolute TVL growth > $100), and sort by percentage growth (instead of dollar growth). This shows protocols with the highest percentage gains while filtering out risky and insignificant movements.
- **CRITICAL BUG FIX - Contract Address Extraction**: Fixed bug where DeFiLlama's address objects `{ethereum: '0x...', bsc: '0x...'}` weren't being parsed correctly. Previously only extracted string addresses. Now extracts Ethereum addresses (preferred for De.Fi API) or first available chain address. This enables De.Fi enrichment for hundreds more protocols.
- **Comprehensive SEO Optimization**: Implemented enterprise-grade SEO with meta tags, Open Graph/Twitter Cards, JSON-LD structured data (WebApplication, FAQPage, BreadcrumbList), sitemap.xml, robots.txt, and rich snippets for Google search visibility.
- **De.Fi API Integration**: Integrated De.Fi's security API to enrich top 100 protocols (by TVL) with real audit data, security scores, multisig/timelock verification, and audit reports. Provides authoritative security analysis to supplement DeFiLlama data.
- **Volume Data Accuracy**: Updated to fetch real 24h volume from 5 DeFiLlama endpoints (DEX, derivatives, options, aggregators, fees) instead of estimating. Provides accurate volume for 1,264+ protocols with real trading data.
- **Enhanced Security Display**: Protocol table now shows both internal security score and De.Fi security analysis with verification badges (multisig, timelock, audit reports) in tooltips.
- **Data Transparency**: Updated dashboard tooltips to clearly indicate data sources and accuracy limitations for both volume and audit statistics.
- **Sponsorship Tiers**: Updated to 3 tiers (Featured $500-1K, Sponsored $2-5K, Premium $10K+). Removed newsletter from tier 1, changed blog post to X article in tier 2, added comprehensive Premium tier with white-label partnerships.
- **Contact Method**: Changed sponsorship contact from email to Telegram (@pingu1st).

## Known Issues
- None currently. All features working as expected with DeFiLlama as primary data source.

## External Dependencies
- **DeFiLlama API**: Primary data source for DeFi protocol discovery, TVL data, volume data (DEX/derivatives/options/aggregators/fees endpoints), and audit information. Provides data for 1,291+ protocols with volume and 2,622+ audited protocols.
- **Neon PostgreSQL**: Cloud-hosted PostgreSQL database.
- **Shadcn UI**: UI component library.
- **TanStack Query (React Query)**: For server state management and data fetching.
- **Zod**: Schema declaration and validation.
- **YouTube**: Integration for embedding tutorial videos.
- **Bitmedia**: Primary crypto advertising network.
- **Coinzilla**: Fallback crypto advertising network.