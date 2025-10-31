# JERUSALEM DeFi Security Scanner

## Overview
JERUSALEM DeFi Security Scanner is a full-stack JavaScript application designed to discover DeFi protocols, perform real-time security threat analysis, and detect major wallet and protocol threats across over 126 blockchain chains. It scans for 38+ distinct threat categories, including advanced 2025 wallet drainer operations (Pink Drainer, Angel Drainer, CLINKSINK), EIP-2612 permit signature exploits, approval phishing attacks, CREATE2 evasion techniques, Solana-specific drains, and traditional threats like phishing, rug pulls, and smart contract vulnerabilities. The project aims to provide a comprehensive DeFi security tool to protect users against crypto scams, featuring a cybersecurity-themed UI, persistent PostgreSQL storage, and monetization features like ad spaces and sponsored listings.

## User Preferences
- **Design**: Cybersecurity-themed dark mode with Shield iconography (no emoji usage)
- **Forms**: Must use shadcn useForm + Form pattern with zodResolver for validation
- **Data Updates**: React Query mutations must invalidate relevant queries for immediate UI updates
- **User Control**: Security scanning is manual-only, not triggered automatically on page load
- **Data Persistence**: All data stored in PostgreSQL database for reliability and scalability

## System Architecture

### UI/UX Decisions
The application features a cybersecurity-themed dark mode with Shield iconography. Protocols are displayed in a CoinMarketCap-style table with rank, formatted TVL, color-coded 24h changes, 7-day TVL sparkline charts, logos, and category badges. **Security flagging system**: Each protocol displays both a security score badge and a severity badge (CRITICAL/HIGH/MEDIUM/LOW/SAFE) in the table view, with tooltip details showing threat counts. Navigation uses an expandable/collapsible shadcn sidebar that starts collapsed by default and overlays on top of content. Ad spaces are integrated, and the protocol table implements pagination with "Load More" functionality. Security ratings have a color-coded legend and informational tooltips. Dashboard stats display actual blockchain count, total protocols, and audited protocols count.

### Technical Implementations
The frontend uses React, Wouter for routing, TanStack Query for data fetching, Shadcn UI for components, and Tailwind CSS for styling. The backend uses Express.js, Drizzle ORM, and Neon PostgreSQL. Validation is handled by Zod, drizzle-zod, and react-hook-form. Performance is optimized through client-side techniques and server-side parallel scan execution, batch DB writes, gzip compression, and intelligent pagination with Set-based deduplication. An automated testing suite is implemented using Vitest.

### Feature Specifications
- **Protocol Discovery & Display**: Fetches and displays protocols from DeFiLlama in a sortable, filterable table.
- **Contract Verification Tracking**: Automated discovery of newly verified smart contracts across 8 major blockchain explorers.
- **Security Statistics Dashboard**: Comprehensive real-time statistics page displaying:
  - Total protocols and scan coverage percentage
  - Severity breakdown with visual progress bars (CRITICAL, HIGH, MEDIUM, LOW, SAFE)
  - 2025 Advanced Drainer Detection counts (8 categories)
  - Top 20 highest risk protocols with scores and threat types
  - Auto-refresh every 30 seconds for real-time updates
  - Accessible via `/security-stats` route and sidebar navigation
  - Cache automatically invalidated when new protocols are added, scans complete, or blacklist changes
- **Protocol Security Flagging System**: Visual security warnings and comprehensive threat details:
  - Severity badges (CRITICAL/HIGH/MEDIUM/LOW/SAFE) displayed directly in protocol listings
  - Detailed threat cards in protocol detail modal with user-friendly explanations
  - Per-threat user advice with "What This Means", "Advice for Users", and "Recommended Action" sections
  - CRITICAL severity alerts with prominent warnings for dangerous protocols
  - Coverage of all 38+ threat types with specific guidance for 2025 drainer attacks
  - Color-coded threat severity indicators throughout the interface
- **Triple-Layer Security Analysis**: Includes metadata-based scanning (38+ threat categories), GoPlus Security API for smart contract code analysis, and advanced 2025 drainer detection (Pink, Angel, CLINKSINK, EIP-2612, approval phishing, CREATE2 evasion, Solana-specific drains, DaaS infrastructure).
- **Automatic Blacklisting**: DApps with CRITICAL severity scores (≥80 points) are automatically blacklisted.
- **3-Tier Audit System**: Integrates DeFiLlama audit data and allows manual entries.
- **Blacklist Management**: Dedicated page for admin management of blacklisted protocols.
- **Scanning Mechanism**: Supports manual "Scan All" with parallel execution. Automated background re-scanning triggers when AI learning system detects new high-confidence threat patterns, ensuring protocols are always evaluated against the latest threat intelligence.
- **Admin Panel**: Secure admin interface with bcrypt authentication and full protocol management capabilities.
- **Sponsorship & Featured Listings System**: Comprehensive monetization system.
- **Protocol Customization System**: Allows protocol owners to submit customization requests with payment and admin approval.
- **SEO Optimization**: Implemented enterprise-grade SEO with meta tags, Open Graph/Twitter Cards, JSON-LD, sitemap.xml, robots.txt, and rich snippets.
- **Whitelist System**: Prevents legitimate protocols from being falsely flagged.
- **Twitter Threat Monitoring System**: Real-time monitoring of crypto threats and scams using Twitter API v2.
- **CertiK Audit Integration**: Multi-source audit verification combining CertiK Skynet data with DeFiLlama.
- **GoPlus Contract Scanning**: Real smart contract code analysis for honeypots, hidden owners, trading restrictions, excessive taxes, and proxy contracts across 40+ blockchain networks.
- **AI Learning Security System**: Machine learning-based threat pattern recognition that continuously learns from security scans to automatically identify exploits and update blacklist rules in real-time. This system tracks named drainer operations, EIP-2612 permit signatures, approval phishing, CREATE2 evasion, Solana-specific attacks, and DaaS infrastructure fingerprints. When new high-confidence patterns are detected (every 5 minutes check), the system automatically triggers re-scans of HIGH and MEDIUM severity protocols (up to 50 protocols) and updates security statistics in real-time.
- **Website Contract Extraction**: Automatic scanning of website URLs to discover embedded contract addresses and perform security analysis.
- **Intelligent Blacklist Verification System**: Cost-optimized false positive detection that filters blacklisted protocols using legitimacy scoring (0-100) and identifies potential false positives for targeted GoPlus re-scanning, reducing API costs.
- **Website Phishing Scanner**: Dedicated crypto website security scanner that detects phishing patterns and scams even without embedded contract addresses. Features include:
  - URL analysis for typosquatting (e.g., "metmask" vs "metamask"), suspicious TLDs (.xyz, .tk, etc.), brand impersonation, IP-based URLs, and missing HTTPS encryption
  - Risk scoring (0-100) with severity levels (SAFE/LOW/MEDIUM/HIGH/CRITICAL)
  - User-friendly recommendations and actionable security guidance
  - Visual risk score visualization with progress bars and color-coded badges
  - Detection of 30+ phishing patterns including wallet drainer code, fake support sites, credential requests, and celebrity scams
  - **Manual HTML Content Analysis**: For websites with anti-bot protection (Cloudflare), users can manually paste HTML content for analysis. Includes comprehensive guides:
    - Desktop guide: Right-click → View Page Source (Ctrl+U / Cmd+U)
    - Mobile guide: Platform-specific instructions for iPhone/iPad (Safari) and Android (Chrome) using "view-source:" URL prefix
    - Tab-based interface for easy platform selection
    - Server-side validation with 5MB content limit and UI warnings for large content (>1MB)
    - POST /api/scan-html-content endpoint for processing manually submitted content
  - Accessible via `/scan-website` route and sidebar navigation
  - Example test cases included: audius-review.com, metamask-recovery.xyz, uniswap.org
  - Future maintenance: Monitor heuristic lists (brands, TLDs, typos) for periodic updates as threat landscape evolves

### System Design Choices
- **Database Schema**: PostgreSQL with Drizzle ORM for various tables including `protocols`, `security_scans`, `blacklist_entries`, `contract_scans`, `sponsor_payments`, `protocol_customizations`, `admin_users`, and `discovered_contracts`, optimized with indexing and UPSERT-based persistence.
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
- **GoPlus Security API**: Real-time smart contract code analysis for honeypot detection, ownership risks, trading restrictions, and vulnerability scanning across 40+ blockchains.
- **Twitter API v2 Filtered Stream**: Real-time monitoring of crypto threats, scams, and announcements.
- **CertiK Skynet**: Public security score scraping and audit verification.
- **Neon PostgreSQL**: Cloud-hosted PostgreSQL database.
- **Shadcn UI**: UI component library.
- **TanStack Query (React Query)**: For server state management and data fetching.
- **Zod**: Schema declaration and validation.
- **YouTube**: Integration for embedding tutorial videos.
- **Bitmedia**: Primary crypto advertising network.
- **Coinzilla**: Fallback crypto advertising network.