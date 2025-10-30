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
The frontend uses React, Wouter for routing, TanStack Query for data fetching, Shadcn UI for components, and Tailwind CSS for styling. The backend uses Express.js, Drizzle ORM, and Neon PostgreSQL. Validation is handled by Zod, drizzle-zod, and react-hook-form. Performance is optimized through client-side techniques (e.g., `React.memo`, `useCallback`, debounced search) and server-side parallel scan execution, batch DB writes, gzip compression (level 6, 1KB threshold), and an intelligent pagination system with Set-based deduplication to prevent duplicate protocols in the UI.

### Feature Specifications
- **Protocol Discovery & Display**: Fetches and displays protocols from DeFiLlama in a sortable, filterable table, supporting 15+ categories. Implements smart pagination with instant initial load (500 protocols) and "Load More" button.
- **Contract Verification Tracking**: Automated discovery of newly verified smart contracts across 8 major blockchain explorers (Etherscan, BSCScan, Polygonscan, Arbiscan, Optimistic Etherscan, Snowtrace, FTMScan, Basescan). Monitors recently verified contracts, analyzes contract types (ERC20, ERC721, DEX, Lending, Staking, Vault), and filters for DeFi-relevant protocols before they appear on major aggregators.
- **Security Analysis**: Conducts comprehensive scans for 29 distinct threat categories, including wallet drainers, phishing, and smart contract vulnerabilities, with a verification system to prevent false positives.
- **Automatic Blacklisting**: DApps with CRITICAL severity scores (≥80 points) are automatically blacklisted.
- **3-Tier Audit System**: Integrates DeFiLlama audit data and allows manual entries.
- **Blacklist Management**: A dedicated page displays and allows admin management of blacklisted protocols with legitimacy scoring and re-vetting system (70% threshold for automatic removal).
- **Scanning Mechanism**: Supports manual "Scan All" and automated weekly security scans.
- **Admin Panel**: Secure admin interface with bcrypt authentication and full protocol management capabilities, including sponsorship and contract discovery management.
- **Sponsorship & Featured Listings System**: Comprehensive monetization system with multiple pricing tiers for enhanced protocol visibility.
- **Protocol Customization System**: Allows protocol owners to submit customization requests (e.g., edit descriptions, logos, add audit info) with a payment and admin approval workflow.
- **SEO Optimization**: Implemented enterprise-grade SEO with meta tags, Open Graph/Twitter Cards, JSON-LD structured data, sitemap.xml, robots.txt, and rich snippets. **Custom domain**: defijerusalem.com (configured and ready for Google indexing).

### System Design Choices
- **Database Schema**: PostgreSQL with Drizzle ORM for `protocols`, `security_scans`, `blacklist_entries`, `sponsor_payments`, `protocol_customizations`, `admin_users`, and `discovered_contracts` tables, optimized with indexing. Blacklist entries use a unique index on `dappId` to prevent duplicates.
- **UPSERT-Based Persistence**: Uses PostgreSQL's `ON CONFLICT DO UPDATE` for atomic updates in protocols and blacklist entries to prevent duplicates.
- **Timestamp Management**: All timestamp fields use database-generated `.defaultNow()` to ensure type consistency (Date objects, not strings). The `BlacklistManager` returns entries without timestamp/website fields, as these are auto-generated by the database.
- **API Routes**: RESTful API for managing application data, including secure admin authentication and paginated protocol endpoints.
- **Multi-Layer Security**: Implements rate limiting, secure admin initialization, audit logging, input validation/sanitization (Drizzle ORM for SQL injection protection), security headers (Helmet middleware), and secure session management.
- **Error Handling**: Generic error messages returned to clients to prevent information leakage.
- **Threat Detection Coverage**: Protects against wallet drainers, phishing, rug pulls, governance attacks, smart contract backdoors, oracle manipulation, bridge exploits, Ponzi schemes, migration scams, honeypot tokens, and regulatory violations across 126+ blockchain chains.
- **Enhanced Drainer Detection (2025)**: Implements advanced detection for Drainer-as-a-Service (DaaS) campaigns based on real-world analysis of aster-dex.lol and similar scams. Detects:
  - Malicious TLDs (.lol, .tk, .ml, .ga, .cf, .gq) with 90%+ scam rate
  - Fake airdrop campaigns using "free tokens" and "eligible airdrop" lures
  - Context-aware unrealistic APY detection (requires "guaranteed"/"risk-free" + high APY to avoid false positives on legitimate high-yield farms)
  - Domain variation scams (register-aster.com, claim-uniswap.org, verify-metamask.net)
  - Wallet drainer infrastructure patterns (seaport.js, permit2 abuse, single-use contracts)
  - Visual clone detection (pixel-perfect copies of legitimate DEX interfaces)
  - Social media scam distribution (unsolicited DMs, fake support, Telegram admin impersonation)
- **False Positive Prevention**: All scam patterns are context-aware to avoid flagging legitimate protocols. Excludes Indonesian .id domains, hyphenated brand names (world-bank.org), and high-yield DeFi farms that don't use "guaranteed" language. **TVL-Based Filtering**: Protocols with TVL > $500k are automatically excluded from UNVERIFIED_CONTRACT, NO_AUDIT, and ANONYMOUS_TEAM checks to prevent false positives on legitimate DEXs and protocols.

## External Dependencies
- **DeFiLlama API**: Primary data source for DeFi protocol discovery, TVL data, volume data, and audit information.
- **Blockchain Explorer APIs**: Etherscan, BSCScan, Polygonscan, Arbiscan, Optimistic Etherscan, Snowtrace, FTMScan, Basescan for contract verification tracking (requires API keys).
- **Neon PostgreSQL**: Cloud-hosted PostgreSQL database.
- **Shadcn UI**: UI component library.
- **TanStack Query (React Query)**: For server state management and data fetching.
- **Zod**: Schema declaration and validation.
- **YouTube**: Integration for embedding tutorial videos.
- **Bitmedia**: Primary crypto advertising network.
- **Coinzilla**: Fallback crypto advertising network.

## Contract Discovery Setup
To enable contract verification tracking, you need to set up API keys for blockchain explorers in your environment variables:
- `ETHERSCAN_API_KEY` - Ethereum mainnet
- `BSCSCAN_API_KEY` - Binance Smart Chain
- `POLYGONSCAN_API_KEY` - Polygon
- `ARBISCAN_API_KEY` - Arbitrum
- `OPTIMISTIC_ETHERSCAN_API_KEY` - Optimism
- `SNOWTRACE_API_KEY` - Avalanche
- `FTMSCAN_API_KEY` - Fantom
- `BASESCAN_API_KEY` - Base

**Free API keys available at**: Etherscan.io, BSCScan.com, Polygonscan.com, etc. (Sign up and generate API keys)

**Admin Endpoints**:
- `POST /api/discovery/scan` - Trigger contract discovery (Body: `{ "chains": ["ethereum", "bsc", "polygon"] }`)
- `GET /api/discovery/contracts` - View discovered contracts (Query params: `status`, `chain`, `limit`)
- `PATCH /api/discovery/contracts/:id/status` - Update contract status (Body: `{ "status": "approved" }`)

## Whitelist System (False Positive Prevention)

The whitelist system prevents legitimate protocols from being falsely flagged as scams. This is especially important for:
- Official protocol integrations (e.g., Morpho+Aave/Compound)
- Gaming/NFT protocols with similar names (e.g., Aavegotchi)
- Wrapped assets and bridges (e.g., tzBTC, PulseChain Bridge)

**Whitelist Criteria**:
- Verification source (DeFiLlama, Official Documentation, Exchange Listings)
- Optional: CertiK security score, DeFi Safety score
- Optional: Minimum TVL threshold
- Optional: Major exchange listings

**Admin Endpoints**:
- `GET /api/whitelist` - View all whitelisted protocols (public)
- `POST /api/admin/whitelist` - Add protocol to whitelist (admin only)
  - Body: `{ "protocolId": "morpho", "reason": "Verified lending protocol", "verificationSource": "DeFiLlama", "certikScore": 85, "minTvl": 500000000 }`
- `DELETE /api/admin/whitelist/:protocolId` - Remove from whitelist (admin only)
- `POST /api/admin/whitelist/seed` - Seed whitelist with 10 pre-verified legitimate protocols (admin only)

**Pre-Verified Protocols** (seedable via `/api/admin/whitelist/seed`):
1. Morpho (all variants) - Official Aave/Compound integration
2. Aavegotchi - Gaming protocol on Aave ecosystem
3. Kraken Bitcoin - Official Kraken product
4. Revert Finance - Verified DeFi protocol
5. PulseChain Bridge - Official bridge
6. tzBTC - Wrapped Bitcoin on Tezos
7. APX Bridge - Verified bridge
8. Mezo Network - Layer 2 protocol

**Context-Aware IMPOSTER Detection**:
The security scanner now uses intelligent heuristics to distinguish legitimate integrations from actual scams:
- Protocols with TVL > $50M + audits are exempt from imposter checks
- Expanded VERIFIED_PROTOCOLS list includes 40+ major protocols and their variants
- Whitelist overrides imposter detection for pre-verified protocols