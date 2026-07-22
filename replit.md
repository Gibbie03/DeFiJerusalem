# JERUSALEM DeFi Security Scanner

## Overview
JERUSALEM DeFi Security Scanner (defijerusalem.com) is a full-stack JavaScript application designed to discover DeFi protocols, perform real-time security threat analysis, and detect major wallet and protocol threats across over 126 blockchain chains. It scans for 38+ distinct threat categories, including advanced 2025 wallet drainer operations, EIP-2612 permit signature exploits, approval phishing attacks, CREATE2 evasion techniques, and Solana-specific drains. The project aims to provide a comprehensive DeFi security tool to protect users against crypto scams, featuring a cybersecurity-themed UI, persistent PostgreSQL storage, and monetization features.

### Contact Information
- **Telegram**: https://t.me/gibbie03
- **Partnerships Email**: partnerships@defijerusalem.com
- **Security Reports**: security@defijerusalem.com
- **General Contact**: contact@defijerusalem.com

## User Preferences
- **Design**: Cybersecurity-themed dark mode with Shield iconography (no emoji usage)
- **Forms**: Must use shadcn useForm + Form pattern with zodResolver for validation
- **Data Updates**: React Query mutations must invalidate relevant queries for immediate UI updates
- **User Control**: Security scanning is manual-only, not triggered automatically on page load
- **Data Persistence**: All data stored in PostgreSQL database for reliability and scalability
- **Scanner Organization**: Wallet and website scanners unified on single page with tabs for easy switching

## Company Valuation (2025)
- **Assigned Valuation Range**: $8M - $18M
- **Central Estimate**: $12.5M
- **Methodology**: Blended approach combining VC method, comparable transactions, Berkus method, scorecard method, and forward ARR projections
- **Stage**: Pre-Revenue, MVP Complete
- **Key Comparables**: CertiK ($2B at $100-200M ARR), GoPlus ($150M at $10-15M ARR)
- **Market TAM**: $5-7.5B DeFi security platform market (2025)
- **Revenue Projections**: $102k Year 1 → $468k Year 2 → $1.53M Year 3 ARR
- **Primary Value Drivers**: 126+ chain coverage, 38+ threat categories, AI threat learning, community network effects, sponsorship ad inventory
- **Key Risks**: Solo founder dependency, pre-revenue uncertainty, crypto market volatility, competitive pressure
- **Strategic Exit Potential**: CertiK, Binance/Coinbase, CoinGecko/CMC, traditional cybersecurity firms at 1.5-5x revenue multiples
- **Documentation**: Full valuation analysis in DEFIJERUSALEM_VALUATION_2025.md (50+ pages)

## System Architecture

### UI/UX Decisions
The application features a cybersecurity-themed dark mode with Shield iconography. Protocols are displayed in a CoinMarketCap-style table with rank, TVL, 24h changes, sparkline charts, logos, and category badges. A security flagging system displays a security score badge and a severity badge (CRITICAL/HIGH/MEDIUM/LOW/SAFE) with tooltip details. Navigation uses an expandable/collapsible shadcn sidebar. Ad spaces are integrated, and the protocol table implements pagination. Security ratings have a color-coded legend and informational tooltips. Dashboard stats display blockchain count, total protocols, and audited protocols.

### Technical Implementations
The frontend uses React, Wouter for routing, TanStack Query for data fetching, Shadcn UI for components, and Tailwind CSS for styling. The backend uses Express.js, Drizzle ORM, and Neon PostgreSQL. Validation is handled by Zod, drizzle-zod, and react-hook-form. Performance is optimized through client-side techniques and server-side parallel scan execution, batch DB writes, gzip compression, and intelligent pagination. An automated testing suite is implemented using Vitest.

### Feature Specifications
- **Protocol Discovery & Display**: Fetches and displays protocols from DeFiLlama in a sortable, filterable table.
- **Contract Discovery System**: Hybrid automated contract discovery combining DeFiLlama integration, manual CSV import of verified contracts, and experimental Etherscan web scraping (currently blocked). CSV import is the recommended, ToS-compliant method.
- **Wallet Address Scanner**: Real-time multi-chain wallet address analysis with drainer intelligence, supporting Ethereum and Solana. Features include known drainer databases, transaction pattern detection, vanity address analysis, address poisoning detection, risk scoring, and token approval security scanning. Enhanced Solana drainer detection (2025) includes SetAuthority instruction patterns, delegate authority changes, durable nonce attacks, TOCTOU exploits, blind signing detection, token account ownership transfers, and known operation tracking (CLINKSINK, Rainbow Drainer, Node Drainer, Perpetual Drainer).
- **Security Statistics Dashboard**: Comprehensive real-time statistics displaying total protocols, scan coverage, severity breakdown, 2025 Advanced Drainer Detection counts, and top highest risk protocols.
- **Protocol Security Flagging System**: Visual security warnings and comprehensive threat details with severity badges, detailed threat cards, and per-threat user advice.
- **Unified Security Scoring System**: Single comprehensive 0-100 risk score (lower is safer) that combines all detection methods into one consistent metric. Integrates metadata-based scanning (38+ threat categories), GoPlus Security API for smart contract code analysis, advanced 2025 drainer detection, AI learning patterns, and legitimacy indicators (audits, TVL, age). Scoring ranges: 0-19 SAFE, 20-39 LOW, 40-59 MEDIUM, 60-79 HIGH, 80-100 CRITICAL. Replaces previous conflicting dual-scoring systems.
- **Automatic Blacklisting**: DApps with CRITICAL severity scores (80+) are automatically blacklisted.
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
- **Professional Pitch Deck System**: Automated PDF generation for sponsorship outreach with enhanced visual mockups. Includes tier-specific pitch documents (Featured 12+ pages, Sponsored 15+ pages, Premium 18+ pages) with detailed ASCII-style visual mockups showing exact placement, before/after comparisons, step-by-step implementation guides, and expected ROI metrics. Each tier includes comprehensive visual breakdowns of every feature (verified badges, homepage banners, custom landing pages, analytics dashboards, social media examples). Generated using pdfkit with professional design and brand consistency.

### System Design Choices
- **Database Schema**: PostgreSQL with Drizzle ORM, optimized with indexing and UPSERT-based persistence.
- **Timestamp Management**: All timestamp fields use database-generated `.defaultNow()`.
- **API Routes**: RESTful API for managing application data, including secure admin authentication and paginated protocol endpoints.
- **Multi-Layer Security**: Implements rate limiting, secure admin initialization, audit logging, input validation/sanitization, security headers (Helmet), and secure session management.
- **Error Handling**: Generic error messages returned to clients to prevent information leakage.
- **Threat Detection Coverage**: Protects against various threats across 126+ blockchain chains, including advanced drainer detection (2025).
- **False Positive Prevention**: Context-aware scam patterns, exclusions for legitimate entities, and TVL-based filtering.
- **Context-Aware IMPOSTER Detection**: Intelligent heuristics to distinguish legitimate integrations from scams, with whitelist overrides.
- **Trust Score Consistency**: Frontend components prioritize real-time `securityScan.score` data with fallback to cached `protocol.securityScore`. Backend automatically syncs protocol cache during scan completion to prevent score drift.
- **Sponsorship Outreach Materials**: Professional PDF pitch decks with enhanced visual mockups generated via `scripts/generate-enhanced-pitch-pdfs.ts` using pdfkit. Includes 3 comprehensive visual guides: Featured Tier (12+ pages), Sponsored Tier (15+ pages), and Premium Tier (18+ pages). Each document features detailed ASCII-style visual mockups showing exact feature placement, before/after comparisons, step-by-step implementation guides (7 days for Featured, 2 weeks for Sponsored, 4 weeks for Premium), ROI metrics with conversion data, and comprehensive contact information. Total 45+ pages of professional sponsorship materials optimized for protocol outreach.

## Security & Maintenance

### Dependency Vulnerability Auditing
Run `npm run audit:check` before merging any dependency changes. This executes `npm audit --audit-level=high` and exits non-zero if any high-severity vulnerabilities are found. Contributors should run this check locally and resolve any flagged issues before they pile up.

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