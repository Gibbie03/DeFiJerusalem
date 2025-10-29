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
The frontend uses React, Wouter for routing, TanStack Query for data fetching, Shadcn UI for components, and Tailwind CSS for styling. The backend uses Express.js, Drizzle ORM, and Neon PostgreSQL. Validation is handled by Zod, drizzle-zod, and react-hook-form. Performance is optimized through client-side techniques (e.g., `React.memo`, `useCallback`, debounced search) and server-side parallel scan execution, batch DB writes, and an intelligent pagination system.

### Feature Specifications
- **Protocol Discovery & Display**: Fetches and displays protocols from DeFiLlama in a sortable, filterable table, supporting 15+ categories. Implements smart pagination with instant initial load (500 protocols) and "Load More" button.
- **Security Analysis**: Conducts comprehensive scans for 29 distinct threat categories, including wallet drainers, phishing, and smart contract vulnerabilities, with a verification system to prevent false positives.
- **Automatic Blacklisting**: DApps with CRITICAL severity scores (≥80 points) are automatically blacklisted.
- **3-Tier Audit System**: Integrates DeFiLlama audit data and allows manual entries.
- **Blacklist Management**: A dedicated page displays and allows admin management of blacklisted protocols.
- **Scanning Mechanism**: Supports manual "Scan All" and automated weekly security scans.
- **Admin Panel**: Secure admin interface with bcrypt authentication and full protocol management capabilities, including sponsorship.
- **Sponsorship & Featured Listings System**: Comprehensive monetization system with multiple pricing tiers for enhanced protocol visibility.
- **Protocol Customization System**: Allows protocol owners to submit customization requests (e.g., edit descriptions, logos, add audit info) with a payment and admin approval workflow.
- **SEO Optimization**: Implemented enterprise-grade SEO with meta tags, Open Graph/Twitter Cards, JSON-LD structured data, sitemap.xml, robots.txt, and rich snippets.

### System Design Choices
- **Database Schema**: PostgreSQL with Drizzle ORM for `protocols`, `security_scans`, `blacklist_entries`, `sponsor_payments`, `protocol_customizations`, and `admin_users` tables, optimized with indexing.
- **UPSERT-Based Persistence**: Uses PostgreSQL's `ON CONFLICT DO UPDATE` for atomic updates.
- **API Routes**: RESTful API for managing application data, including secure admin authentication and paginated protocol endpoints.
- **Multi-Layer Security**: Implements rate limiting, secure admin initialization, audit logging, input validation/sanitization (Drizzle ORM for SQL injection protection), security headers (Helmet middleware), and secure session management.
- **Error Handling**: Generic error messages returned to clients to prevent information leakage.
- **Threat Detection Coverage**: Protects against wallet drainers, phishing, rug pulls, governance attacks, smart contract backdoors, oracle manipulation, bridge exploits, Ponzi schemes, migration scams, honeypot tokens, and regulatory violations across 126+ blockchain chains.

## External Dependencies
- **DeFiLlama API**: Primary data source for DeFi protocol discovery, TVL data, volume data, and audit information.
- **Neon PostgreSQL**: Cloud-hosted PostgreSQL database.
- **Shadcn UI**: UI component library.
- **TanStack Query (React Query)**: For server state management and data fetching.
- **Zod**: Schema declaration and validation.
- **YouTube**: Integration for embedding tutorial videos.
- **Bitmedia**: Primary crypto advertising network.
- **Coinzilla**: Fallback crypto advertising network.