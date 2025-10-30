# JERUSALEM DeFi Security Scanner

## Overview
JERUSALEM DeFi Security Scanner is a full-stack JavaScript application designed to discover DeFi protocols, perform real-time security threat analysis, and detect major wallet and protocol threats across over 126 blockchain chains. It scans for 29 distinct threat categories, including wallet drainers, phishing, rug pulls, and smart contract vulnerabilities. The project aims to provide a comprehensive DeFi security tool to protect users against crypto scams, featuring a cybersecurity-themed UI and persistent PostgreSQL storage. It includes monetization features like ad spaces and sponsored listings.

## User Preferences
- **Design**: Cybersecurity-themed dark mode with Shield iconography (no emoji usage)
- **Forms**: Must use shadcn useForm + Form pattern with zodResolver for validation
- **Data Updates**: React Query mutations must invalidate relevant queries for immediate UI updates
- **User Control**: Security scanning is manual-only, not triggered automatically on page load
- **Data Persistence**: All data stored in PostgreSQL database for reliability and scalability

## System Architecture

### UI/UX Decisions
The application features a cybersecurity-themed dark mode with Shield iconography. Protocols are displayed in a CoinMarketCap-style table with rank, formatted TVL, color-coded 24h changes, 7-day TVL sparkline charts, logos, and category badges. Navigation uses an expandable/collapsible shadcn sidebar that starts collapsed by default and overlays on top of content. The sidebar auto-closes when navigating. Ad spaces are integrated, and the protocol table implements pagination with "Load More" functionality. Security ratings have a color-coded legend and informational tooltips. Dashboard stats display actual blockchain count, total protocols, and audited protocols count.

### Technical Implementations
The frontend uses React, Wouter for routing, TanStack Query for data fetching, Shadcn UI for components, and Tailwind CSS for styling. The backend uses Express.js, Drizzle ORM, and Neon PostgreSQL. Validation is handled by Zod, drizzle-zod, and react-hook-form. Performance is optimized through client-side techniques and server-side parallel scan execution, batch DB writes, gzip compression, and intelligent pagination with Set-based deduplication.

### Feature Specifications
- **Protocol Discovery & Display**: Fetches and displays protocols from DeFiLlama in a sortable, filterable table.
- **Contract Verification Tracking**: Automated discovery of newly verified smart contracts across 8 major blockchain explorers.
- **Security Analysis**: Conducts comprehensive scans for 29 distinct threat categories, including wallet drainers, phishing, and smart contract vulnerabilities, with a verification system to prevent false positives.
- **Automatic Blacklisting**: DApps with CRITICAL severity scores (≥80 points) are automatically blacklisted.
- **3-Tier Audit System**: Integrates DeFiLlama audit data and allows manual entries.
- **Blacklist Management**: A dedicated page displays and allows admin management of blacklisted protocols.
- **Scanning Mechanism**: Supports manual "Scan All" and automated weekly security scans.
- **Admin Panel**: Secure admin interface with bcrypt authentication and full protocol management capabilities.
- **Sponsorship & Featured Listings System**: Comprehensive monetization system with multiple pricing tiers.
- **Protocol Customization System**: Allows protocol owners to submit customization requests with payment and admin approval workflow.
- **SEO Optimization**: Implemented enterprise-grade SEO with meta tags, Open Graph/Twitter Cards, JSON-LD, sitemap.xml, robots.txt, and rich snippets. Custom domain: defijerusalem.com.
- **Whitelist System**: Prevents legitimate protocols from being falsely flagged.
- **Twitter Threat Monitoring System**: Real-time monitoring of crypto threats and scams using Twitter API v2.
- **CertiK Audit Integration**: Multi-source audit verification combining CertiK Skynet data with DeFiLlama.

### System Design Choices
- **Database Schema**: PostgreSQL with Drizzle ORM for `protocols`, `security_scans`, `blacklist_entries`, `sponsor_payments`, `protocol_customizations`, `admin_users`, and `discovered_contracts` tables, optimized with indexing and UPSERT-based persistence.
- **Timestamp Management**: All timestamp fields use database-generated `.defaultNow()`.
- **API Routes**: RESTful API for managing application data, including secure admin authentication and paginated protocol endpoints.
- **Multi-Layer Security**: Implements rate limiting, secure admin initialization, audit logging, input validation/sanitization, security headers (Helmet), and secure session management.
- **Error Handling**: Generic error messages returned to clients to prevent information leakage.
- **Threat Detection Coverage**: Protects against various threats across 126+ blockchain chains, including advanced drainer detection (2025) for DaaS campaigns.
- **False Positive Prevention**: Context-aware scam patterns, exclusions for legitimate entities, and TVL-based filtering to prevent false positives for UNVERIFIED_CONTRACT, NO_AUDIT, and ANONYMOUS_TEAM checks.
- **Context-Aware IMPOSTER Detection**: Intelligent heuristics to distinguish legitimate integrations from scams, with whitelist overrides.

## External Dependencies
- **DeFiLlama API**: Primary data source for DeFi protocol discovery, TVL, volume, and audit information.
- **Blockchain Explorer APIs**: Etherscan, BSCScan, Polygonscan, Arbiscan, Optimistic Etherscan, Snowtrace, FTMScan, Basescan for contract verification tracking.
- **Twitter API v2 Filtered Stream**: Real-time monitoring of crypto threats, scams, and announcements.
- **CertiK Skynet**: Public security score scraping and audit verification.
- **Neon PostgreSQL**: Cloud-hosted PostgreSQL database.
- **Shadcn UI**: UI component library.
- **TanStack Query (React Query)**: For server state management and data fetching.
- **Zod**: Schema declaration and validation.
- **YouTube**: Integration for embedding tutorial videos.
- **Bitmedia**: Primary crypto advertising network.
- **Coinzilla**: Fallback crypto advertising network.