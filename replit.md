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
The application features a cybersecurity-themed dark mode with Shield iconography. Protocols are displayed in a CoinMarketCap-style table with rank, formatted TVL, color-coded 24h changes, logos, and category badges. Navigation uses an expandable/collapsible shadcn sidebar. Ad spaces are integrated for monetization, and the protocol table implements pagination. Security ratings have a color-coded legend and informational tooltips.

### Technical Implementations
The frontend uses React, Wouter for routing, TanStack Query for data fetching, Shadcn UI for components, and Tailwind CSS for styling. The backend uses Express.js, Drizzle ORM, and Neon PostgreSQL. Validation is handled by Zod, drizzle-zod, and react-hook-form. Performance is optimized through client-side techniques (e.g., `React.memo`, `useCallback`, debounced search) and server-side multi-tier caching, HTTP Cache-Control headers, Gzip compression, parallel scan execution, and batch DB writes.

### Feature Specifications
- **Protocol Discovery & Display**: Fetches and displays protocols from DeFiLlama in a sortable, filterable table, supporting 15+ categories.
- **Security Analysis**: Conducts comprehensive scans for 29 distinct threat categories, including wallet drainers, phishing, rug pulls, and smart contract vulnerabilities. Includes a verification system to prevent false positives.
- **Automatic Blacklisting**: DApps with CRITICAL severity scores (≥80 points) are automatically blacklisted based on threat patterns.
- **3-Tier Audit System**: Integrates DeFiLlama audit data and allows manual entries.
- **Blacklist Management**: A dedicated page displays blacklisted protocols with severity levels and threat details. Admins can delete entries.
- **Test Drainer Protocols**: Three malicious test protocols are always present to demonstrate the blacklisting system.
- **Scanning Mechanism**: Supports manual "Scan All" and automated weekly security scans.
- **Admin Panel**: Secure admin interface with bcrypt authentication, session management, and full protocol management capabilities, including sponsorship management.
- **Sponsorship & Featured Listings System**: A comprehensive monetization system with 2 pricing tiers for enhanced protocol visibility.

### System Design Choices
- **Database Schema**: PostgreSQL with Drizzle ORM for `protocols`, `security_scans`, `blacklist_entries`, `sponsor_payments`, and `admin_users` tables, optimized with indexing.
- **UPSERT-Based Persistence**: Uses PostgreSQL's `ON CONFLICT DO UPDATE` for atomic updates and persistence of test drainer protocols.
- **API Routes**: RESTful API for managing application data, including secure admin authentication endpoints.
- **Caching**: Server-side in-memory caching (2-5 minute TTL) for expensive API routes with automatic invalidation.
- **Multi-Layer Security**: Implements rate limiting, secure admin initialization, comprehensive audit logging, input validation/sanitization (using Drizzle ORM for SQL injection protection), security headers (Helmet middleware), and secure session management.
- **Error Handling**: Generic error messages returned to clients to prevent information leakage.
- **Threat Detection Coverage**: Protects against wallet drainers, phishing, rug pulls, governance attacks, smart contract backdoors, oracle manipulation, bridge exploits, Ponzi schemes, migration scams, honeypot tokens, and regulatory violations across 126+ blockchain chains.

## External Dependencies
- **DeFiLlama API**: For DeFi protocol discovery, TVL data, and audit information.
- **Neon PostgreSQL**: Cloud-hosted PostgreSQL database.
- **Shadcn UI**: UI component library.
- **TanStack Query (React Query)**: For server state management and data fetching.
- **Zod**: Schema declaration and validation.
- **YouTube**: Integration for embedding tutorial videos.
- **Bitmedia**: Primary crypto advertising network.
- **Coinzilla**: Fallback crypto advertising network.