# JERUSALEM DeFi Security Scanner

## Overview
JERUSALEM DeFi Security Scanner is a full-stack JavaScript application designed to discover DeFi protocols, perform real-time security threat analysis, and detect major wallet and protocol threats across over 126 blockchain chains including Solana. It scans for **38+ distinct threat categories**, including advanced 2025 wallet drainer operations (Pink Drainer, Angel Drainer, CLINKSINK), EIP-2612 permit signature exploits, approval phishing attacks, CREATE2 evasion techniques, Solana-specific drains, and traditional threats like phishing, rug pulls, and smart contract vulnerabilities. The project aims to provide a comprehensive DeFi security tool to protect users against crypto scams, featuring a cybersecurity-themed UI and persistent PostgreSQL storage. It includes monetization features like ad spaces and sponsored listings.

**2024-2025 Threat Landscape Covered:**
- **$494 million** stolen from 332,000+ victims in 2024 (67% increase from 2023)
- **56.7% of attacks** use EIP-2612 permit signatures
- **$1+ billion** stolen since May 2021 from approval phishing
- **Solana drainers**: $4.17M from 3,947 victims (CLINKSINK, SPL delegation exploits)
- **Drainer-as-a-Service (DaaS)**: $100-$40K operations with 20-30% commission models

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
- **Triple-Layer Security Analysis**:
  - **Metadata-Based Scanning**: Analyzes protocol names, descriptions, and URLs for 38+ threat categories including advanced 2025 wallet drainers, phishing, and rug pulls
  - **Smart Contract Code Analysis**: GoPlus Security API integration for real-time contract scanning (honeypot detection, ownership analysis, trading simulation, proxy detection, hidden owner checks, tax analysis)
  - **2025 Advanced Drainer Detection**: Specialized detection for named drainer operations, EIP-2612 permit exploits, approval phishing, CREATE2 evasion, Solana drainers, and DaaS infrastructure
  - **Comprehensive Threat Detection**: Merges metadata, contract-level, and advanced drainer threats for complete risk assessment
- **Automatic Blacklisting**: DApps with CRITICAL severity scores (≥80 points) are automatically blacklisted.
- **3-Tier Audit System**: Integrates DeFiLlama audit data and allows manual entries.
- **Blacklist Management**: A dedicated page displays and allows admin management of blacklisted protocols.
- **Scanning Mechanism**: Supports manual "Scan All" and automated weekly security scans with parallel execution.
- **Admin Panel**: Secure admin interface with bcrypt authentication and full protocol management capabilities.
- **Sponsorship & Featured Listings System**: Comprehensive monetization system with multiple pricing tiers.
- **Protocol Customization System**: Allows protocol owners to submit customization requests with payment and admin approval workflow.
- **SEO Optimization**: Implemented enterprise-grade SEO with meta tags, Open Graph/Twitter Cards, JSON-LD, sitemap.xml, robots.txt, and rich snippets. Custom domain: defijerusalem.com.
- **Whitelist System**: Prevents legitimate protocols from being falsely flagged.
- **Twitter Threat Monitoring System**: Real-time monitoring of crypto threats and scams using Twitter API v2.
- **CertiK Audit Integration**: Multi-source audit verification combining CertiK Skynet data with DeFiLlama.
- **GoPlus Contract Scanning**: Real smart contract code analysis detecting honeypots, hidden owners, trading restrictions, excessive taxes, and proxy contracts across 40+ blockchain networks.
- **AI Learning Security System**: Machine learning-based threat pattern recognition that continuously learns from security scans to automatically identify exploits and update blacklist rules in real-time.
- **Website Contract Extraction**: Automatic scanning of website URLs to discover embedded contract addresses and perform security analysis.
- **Intelligent Blacklist Verification System**: Cost-optimized false positive detection that filters blacklisted protocols using legitimacy scoring (0-100) and identifies potential false positives for targeted GoPlus re-scanning, reducing API costs by 99.6% (from 3,014 scans to 12).

### AI Learning & Threat Pattern Recognition
The application includes an advanced AI learning system (`server/lib/threat-pattern-learner.ts`) that:
- **Continuous Learning**: Analyzes every security scan to build a knowledge base of threat patterns
- **Pattern Recognition**: Identifies common exploit signatures across thousands of scans
- **Confidence Scoring**: Builds confidence (0-1.0 scale) through repeated pattern occurrences
- **Exploit Signatures**: Learns unique signatures of honeypots, hidden owners, excessive taxes, wallet drainers, phishing attacks, and 2025 advanced drainer operations
- **Auto-Blacklisting**: Automatically blacklists protocols when AI detects high-confidence threats (minimum 70% confidence, 3+ occurrences)
- **AI-Enhanced Detection**: Combines traditional rule-based detection with learned patterns for superior exploit identification
- **2025 Drainer Pattern Learning**: Tracks named drainer operations (Pink/Angel/Inferno/Venom/CLINKSINK), EIP-2612 permit signatures, approval phishing, CREATE2 evasion, Solana-specific attacks, and DaaS infrastructure fingerprints

**AI Blacklisting Criteria:**
- 2+ critical exploits with 80%+ confidence
- CRITICAL severity with 70%+ AI confidence
- Score ≥ 100 with 1+ known exploit pattern

**Stats Tracking:**
- Maintains last 1000 scans in memory
- Tracks learned patterns with confidence, occurrences, examples
- Provides insights API endpoint (`/api/ai-learning/stats`) for monitoring

### 2025 Advanced Wallet Drainer Detection
Based on comprehensive security research documenting $494M stolen in 2024, the system implements specialized detection for modern wallet draining techniques:

**Named Drainer Operations:**
- **Pink Drainer**: $85M stolen from 9,000 accounts (retired May 2024) - converts to sDAI earning 10% interest
- **Angel Drainer**: Uses CREATE2 opcode for fresh contract addresses, evading wallet blocklists ($5K-10K + 20% commission)
- **Inferno Drainer**: Single-use disposable contracts for signature-based attacks
- **CLINKSINK (Solana)**: $900K+ confirmed, 80/20 affiliate split, targets Phantom wallet specifically
- **Venom & Pussy Drainers**: Active operations tracked by security firms

**EIP-2612 Permit Signature Exploits (56.7% of 2024 attacks):**
- Gasless approval attacks using off-chain signatures
- EIP-712 structured data manipulation
- `permit()` function exploitation
- Domain separator and nonce signature attacks
- Deadline signature manipulation

**Approval Phishing Detection ($1B+ stolen since May 2021):**
- Unlimited approval requests (`type(uint256).max`)
- `setApprovalForAll` NFT exploits
- Blanket and perpetual permission patterns
- Infinite allowance monitoring

**CREATE2 Address Evasion (Angel Drainer technique):**
- Deterministic address generation detection
- Fresh contract per signature patterns
- Contract rotation and disposable address tactics
- Blocklist evasion techniques

**Drainer Infrastructure Fingerprinting:**
- Wallet balance enumeration scripts
- Asset valuation and prioritization systems
- Simulation bypass capabilities (anti-Wallet Guard, anti-Blockaid)
- Bit-flip attacks (Aqua and Vanish drainers)
- Russian drainer community indicators

**Solana-Specific Drainer Detection ($4.17M from 3,947 victims):**
- SPL token delegation exploits
- Program Derived Address (PDA) manipulation
- Blind signing vulnerabilities (Ledger requirement)
- TOCTOU attacks (time-of-check-time-of-use with 400ms block times)
- Base64 transaction obfuscation
- `invoke_signed()` PDA exploit patterns

**Dormant Approval Attack Patterns:**
- Longest documented case: 458 days dormant, $908,551 stolen
- Wallet deposit monitoring
- Historical approval exploitation
- Forgotten permission tracking

**Drainer-as-a-Service (DaaS) Detection:**
- Pricing model identification ($100-$40K upfront + 20-30% commission)
- Affiliate network patterns (80/20 revenue splits)
- Telegram community indicators (6,000+ member groups)
- Monthly subscription drainer kits

**Approval Age Exploitation:**
- Old approval monitoring patterns
- Stale allowance checks
- Historical permission auditing

### Intelligent Blacklist Verification
The application includes a cost-optimized blacklist verification system (`server/lib/blacklist-filter.ts`) that:
- **Smart Filtering**: Analyzes all blacklisted protocols to identify potential false positives using legitimacy scoring (0-100 scale)
- **Cost Reduction**: Reduces GoPlus API scans by 99.6% (from 3,014 to 12) by filtering out obvious scams
- **Legitimacy Scoring**: Evaluates protocols based on threat patterns, flagging only IMPOSTER or UNVERIFIED_CONTRACT issues as potentially legitimate
- **Batch Verification**: Performs targeted GoPlus contract scans only on filtered protocols
- **Recommendations**: Provides actionable recommendations (REMOVE_FROM_BLACKLIST, KEEP_BLACKLISTED, NEEDS_MANUAL_REVIEW)
- **TypeScript Safety**: Fully typed API responses with comprehensive interfaces for compile-time validation

**Filtering Criteria:**
- Excludes giveaways, airdrops, malicious TLDs, and typosquatting patterns
- Flags protocols with only imposter or unverified contract warnings as potential false positives
- Assigns legitimacy scores based on threat diversity and severity

**API Endpoints:**
- `/api/blacklist/filter-analysis` - Analyzes blacklist and returns filtering statistics
- `/api/blacklist/verify-filtered` - Performs GoPlus scans on filtered protocols with configurable limits

### System Design Choices
- **Database Schema**: PostgreSQL with Drizzle ORM for `protocols`, `security_scans`, `blacklist_entries`, `contract_scans`, `sponsor_payments`, `protocol_customizations`, `admin_users`, and `discovered_contracts` tables, optimized with indexing and UPSERT-based persistence.
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