# JERUSALEM DeFi Security Scanner

## Overview
JERUSALEM DeFi Security Scanner is a full-stack JavaScript application designed to discover DeFi protocols, perform real-time security threat analysis, and detect major wallet and protocol threats across over 126 blockchain chains. It scans for 38+ distinct threat categories, including advanced 2025 wallet drainer operations, EIP-2612 permit signature exploits, approval phishing attacks, CREATE2 evasion techniques, and Solana-specific drains. The project aims to provide a comprehensive DeFi security tool to protect users against crypto scams, featuring a cybersecurity-themed UI, persistent PostgreSQL storage, and monetization features.

## User Preferences
- **Design**: Cybersecurity-themed dark mode with Shield iconography (no emoji usage)
- **Forms**: Must use shadcn useForm + Form pattern with zodResolver for validation
- **Data Updates**: React Query mutations must invalidate relevant queries for immediate UI updates
- **User Control**: Security scanning is manual-only, not triggered automatically on page load
- **Data Persistence**: All data stored in PostgreSQL database for reliability and scalability
- **Scanner Organization**: Wallet and website scanners unified on single page with tabs for easy switching

## System Architecture

### UI/UX Decisions
The application features a cybersecurity-themed dark mode with Shield iconography. Protocols are displayed in a CoinMarketCap-style table with rank, TVL, 24h changes, sparkline charts, logos, and category badges. A security flagging system displays a security score badge and a severity badge (CRITICAL/HIGH/MEDIUM/LOW/SAFE) with tooltip details. Navigation uses an expandable/collapsible shadcn sidebar. Ad spaces are integrated, and the protocol table implements pagination. Security ratings have a color-coded legend and informational tooltips. Dashboard stats display blockchain count, total protocols, and audited protocols.

### Technical Implementations
The frontend uses React, Wouter for routing, TanStack Query for data fetching, Shadcn UI for components, and Tailwind CSS for styling. The backend uses Express.js, Drizzle ORM, and Neon PostgreSQL. Validation is handled by Zod, drizzle-zod, and react-hook-form. Performance is optimized through client-side techniques and server-side parallel scan execution, batch DB writes, gzip compression, and intelligent pagination. An automated testing suite is implemented using Vitest.

### Feature Specifications
- **Protocol Discovery & Display**: Fetches and displays protocols from DeFiLlama in a sortable, filterable table.
- **Contract Discovery System**: Hybrid automated contract discovery combining DeFiLlama integration, manual CSV import of verified contracts, and experimental Etherscan web scraping (currently blocked). CSV import is the recommended, ToS-compliant method.
- **Wallet Address Scanner**: Real-time multi-chain wallet address analysis with drainer intelligence, supporting Ethereum and Solana, known drainer databases, transaction pattern detection, vanity address analysis, address poisoning detection, risk scoring, and token approval security scanning.
- **Security Statistics Dashboard**: Comprehensive real-time statistics displaying total protocols, scan coverage, severity breakdown, 2025 Advanced Drainer Detection counts, and top highest risk protocols.
- **Protocol Security Flagging System**: Visual security warnings and comprehensive threat details with severity badges, detailed threat cards, and per-threat user advice.
- **Triple-Layer Security Analysis**: Includes metadata-based scanning (38+ threat categories), GoPlus Security API for smart contract code analysis, and advanced 2025 drainer detection.
- **Automatic Blacklisting**: DApps with CRITICAL severity scores are automatically blacklisted.
- **3-Tier Audit System**: Integrates DeFiLlama audit data and allows manual entries.
- **Blacklist Management**: Dedicated page for admin management of blacklisted protocols.
- **Scanning Mechanism**: Supports manual "Scan All" with parallel execution and automated background re-scanning triggered by AI learning for new threat patterns.
- **Admin Panel**: Secure admin interface with authentication and full protocol management capabilities.
- **Sponsorship & Featured Listings System**: Comprehensive monetization system.
- **Protocol Customization System**: Allows protocol owners to submit customization requests.
- **SEO Optimization**: Implemented enterprise-grade SEO with meta tags, Open Graph/Twitter Cards, JSON-LD, sitemap.xml, robots.txt, and rich snippets.
- **Whitelist System**: Prevents legitimate protocols from being falsely flagged.
- **Twitter Threat Monitoring System**: Real-time monitoring of crypto threats and scams using Twitter API v2.
- **CertiK Audit Integration**: Multi-source audit verification combining CertiK Skynet data with DeFiLlama.
- **GoPlus Contract Scanning**: Real smart contract code analysis for various vulnerabilities across 40+ blockchain networks.
- **AI Learning Security System**: Machine learning-based threat pattern recognition that continuously learns from security scans to identify exploits and update blacklist rules in real-time.
- **Website Contract Extraction**: Automatic scanning of website URLs to discover embedded contract addresses.
- **Intelligent Blacklist Verification System**: Cost-optimized false positive detection and targeted GoPlus re-scanning.
- **Website Phishing Scanner**: Detects phishing patterns and scams through URL analysis, risk scoring, and manual HTML content analysis.
- **Unified Security Scanner**: Single page combining wallet and website scanners with tab-based interface.
- **Community Scam Reporting System**: User-generated threat reports for protocols, wallets, websites, and contracts with multi-category classification, severity ratings, and status tracking. Includes comprehensive report form with evidence upload support.
- **Public Scammer Address Database**: Searchable database of verified scammer addresses with multi-chain support, verification status tracking, evidence linking, and public API for lookups.
- **Community Reporting & Threat Intelligence**: Includes a community scam reporting system, voting & reputation system, and public scammer address database.
- **Token Approval Security Scanner**: Integrated GoPlus Approval Management API to detect risky ERC20 token approvals in Ethereum wallets. Features cross-referencing with DeFiJerusalem's scammer database and blacklisted protocols, risk-based revocation advice (CRITICAL/HIGH/MEDIUM/LOW), detection of unlimited approvals to unknown contracts, and Revoke.cash integration for safe approval management.
- **Solana Security Education**: Educational content explaining why Solana's SPL token delegate authority model is safer than Ethereum's unlimited ERC-20 allowances, helping users understand the reduced approval attack surface on Solana.

### System Design Choices
- **Database Schema**: PostgreSQL with Drizzle ORM, optimized with indexing and UPSERT-based persistence.
- **Timestamp Management**: All timestamp fields use database-generated `.defaultNow()`.
- **API Routes**: RESTful API for managing application data, including secure admin authentication and paginated protocol endpoints.
- **Multi-Layer Security**: Implements rate limiting, secure admin initialization, audit logging, input validation/sanitization, security headers (Helmet), and secure session management.
- **Error Handling**: Generic error messages returned to clients to prevent information leakage.
- **Threat Detection Coverage**: Protects against various threats across 126+ blockchain chains, including advanced drainer detection (2025).
- **False Positive Prevention**: Context-aware scam patterns, exclusions for legitimate entities, and TVL-based filtering.
- **Context-Aware IMPOSTER Detection**: Intelligent heuristics to distinguish legitimate integrations from scams, with whitelist overrides.

## External Dependencies
- **DeFiLlama API**: Primary data source for DeFi protocol discovery, TVL, volume, and audit information.
- **Blockchain Explorer APIs**: Etherscan, BSCScan, Polygonscan, Arbiscan, Optimistic Etherscan, Snowtrace, FTMScan, Basescan for contract verification tracking.
- **Blockchain Explorer Web Scraping**: Cheerio-based HTML parsing of Etherscan contractsVerified pages.
- **GoPlus Security API**: Real-time smart contract code analysis and token approval management.
- **Revoke.cash**: Third-party tool integration for safe token approval revocation (with disclaimers).
- **Twitter API v2 Filtered Stream**: Real-time monitoring of crypto threats.
- **CertiK Skynet**: Public security score scraping and audit verification.
- **Neon PostgreSQL**: Cloud-hosted PostgreSQL database.
- **Shadcn UI**: UI component library.
- **TanStack Query (React Query)**: For server state management and data fetching.
- **Zod**: Schema declaration and validation.
- **Cheerio**: Fast, flexible HTML parsing library for web scraping.
- **YouTube**: Integration for embedding tutorial videos.
- **Bitmedia**: Primary crypto advertising network.
- **Coinzilla**: Fallback crypto advertising network.