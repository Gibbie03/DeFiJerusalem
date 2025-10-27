# JERUSALEM DeFi Security Scanner

## Overview
JERUSALEM DeFi Security Scanner is a full-stack JavaScript application designed to discover DeFi protocols via the DeFiLlama API, perform real-time security threat analysis, and detect wallet drainers and blacklisted projects. It supports filtering across over 126 blockchain chains, features a cybersecurity-themed UI, and utilizes persistent PostgreSQL storage. The project aims to provide users with a comprehensive tool for identifying and avoiding high-risk DeFi protocols, enhancing security in the decentralized finance space, and offering a robust platform for tracking emerging threats and market trends.

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

**Performance Optimizations:**
- **Client-Side**: React.memo for row components, useCallback for stable callbacks, sparkline data caching at module scope, single TooltipProvider instance, pagination (100 rows/page)
- **Server-Side**: Database indexes on frequently queried columns, in-memory caching with TTL (2-5 min), optimized SQL queries using DISTINCT ON
- **Result**: Button response times reduced from 30+ seconds to < 2 seconds, achieving CoinMarketCap-level responsiveness

### Feature Specifications
- **Protocol Discovery & Display**: Fetches protocols from DeFiLlama, displays them in a sortable, filterable table by TVL or Security Score. Includes category and chain filtering.
- **Security Analysis**: Conducts detailed security scans based on contract age, audit status, team transparency, and liquidity. Detects wallet drainers, typosquatting, and known scam phrases.
- **3-Tier Audit System**: Integrates audit data from DeFiLlama (count, notes, links) and allows for manual audit entries.
- **Blacklisting**: Automatically flags and blacklists protocols with critical security scores (≥80 points), with a dedicated Blacklist page showing detailed threats and reasons.
- **Scanning Mechanism**: Supports manual security scanning triggered by a "Scan All" button and weekly automated scans. Scan results are stored persistently.
- **DApp Management**: "Add DApp by URL" feature for auto-detecting protocol information from links.
- **Trending & New DApps**: Dedicated pages for tracking recently discovered protocols and those with the highest TVL growth.
- **Tutorial System**: Functionality for uploading and listing educational DeFi security videos.
- **Trending Ticker**: An auto-scrolling ticker displays trending protocols across all pages.

### System Design Choices
- **Database Schema**: Utilizes PostgreSQL with Drizzle ORM for `protocols`, `security_scans`, `blacklist_entries`, `tutorial_videos`, and `manual_audits` tables, ensuring data persistence and scalability.
- **Database Performance**: Indexes added on frequently queried columns (tvl, category, change24h, discoveredAt, protocolId, scannedAt) for fast sorting and filtering. Optimized queries using SQL DISTINCT ON instead of in-memory iteration.
- **API Routes**: Comprehensive RESTful API for managing protocols, security scans, blacklist entries, and tutorial videos.
- **Storage Layer**: An `IStorage` interface implementation (`DatabaseStorage`) centralizes all CRUD operations with the database.
- **Separation of Concerns**: Clear distinction between frontend (client/) and backend (server/) directories.
- **Caching**: DeFiLlama API integration includes a 30-minute cache for efficiency. Server-side in-memory caching (2-5 minute TTL) for expensive API routes (/api/scans, /api/blacklist, /api/protocols/trending) with automatic cache invalidation on updates.

## External Dependencies
- **DeFiLlama API**: Used for discovering DeFi protocols, fetching Total Value Locked (TVL) data, and retrieving audit information.
- **Neon PostgreSQL**: Cloud-hosted PostgreSQL database for persistent data storage.
- **Shadcn UI**: UI component library used for building interactive elements like tables, forms, and navigation.
- **TanStack Query (React Query)**: For server state management, data fetching, caching, and synchronization.
- **Zod**: Schema declaration and validation library.
- **YouTube**: Integration for embedding and listing tutorial videos.