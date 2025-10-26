# JERUSALEM DeFi Security Scanner

A fullstack JavaScript application that discovers DeFi protocols from DeFiLlama API, performs real-time security threat analysis to detect wallet drainers, tracks blacklisted projects, and supports filtering across 126+ blockchain chains.

## Overview

This application is a comprehensive DeFi security scanner that:
- Auto-discovers protocols from DeFiLlama API (126+ chains supported)
- Performs real-time security threat analysis
- Detects wallet drainers and malicious contracts
- Tracks blacklisted projects
- Provides filtering and search capabilities
- Features a cybersecurity-themed dark mode UI

## Features Implemented

### Backend Features

1. **APICache** (`server/lib/api-cache.ts`)
   - In-memory caching with 30-minute TTL
   - Maximum cache size of 100 entries
   - Automatic cache expiration and cleanup

2. **WalletDrainerDetector** (`server/lib/wallet-drainer-detector.ts`)
   - Security scanning engine with threat detection:
     - New contracts (< 7 days old) - HIGH RISK
     - No security audit - HIGH RISK
     - Anonymous team (no social presence) - HIGH RISK
     - Low liquidity (< $50k) - MEDIUM RISK
   - Severity scoring: CRITICAL, HIGH, MEDIUM, LOW
   - Automatic blacklisting of CRITICAL threats

3. **BlacklistManager** (`server/lib/blacklist-manager.ts`)
   - Tracks threats and manages blacklist entries
   - Maintains ACTIVE/INACTIVE status
   - Stores threat details with timestamps

4. **DAppDiscovery** (`server/lib/dapp-discovery.ts`)
   - Fetches protocols from DeFiLlama API
   - CORS proxy integration (corsproxy.io)
   - Retry logic with exponential backoff (3 retries, 2s delay)
   - Rate limit handling (429 status)
   - Fallback data for offline/error scenarios
   - Category classification (DEX, Lending, Yield, Bridge, NFT)
   - Age calculation from listing timestamp
   - Security score calculation based on audits, TVL, and social presence

5. **API Routes** (`server/routes.ts`)
   - `GET /api/protocols` - Discover and fetch protocols
   - `POST /api/protocols` - Add manual protocols
   - `POST /api/scan` - Batch security scanning (10 protocols at a time)
   - `GET /api/scan/:protocolId` - Get scan result for specific protocol
   - `GET /api/blacklist` - Retrieve blacklist entries

6. **Storage** (`server/storage.ts`)
   - In-memory storage for protocols, blacklist, and security scans
   - Full CRUD operations for all entities

### Frontend Features

1. **Dashboard** (`client/src/pages/Dashboard.tsx`)
   - Auto-discovery of protocols on page load
   - Real-time security scanning (first 50 protocols)
   - Protocol filtering by chain and search
   - Trending and New Protocols tabs
   - Stats cards: Total Protocols, Chains Supported, Audited %, Blacklisted
   - Online/offline detection
   - Refresh functionality
   - Toast notifications for scan results

2. **Custom Hooks**
   - `useDebounce` - 300ms debouncing for search input
   - `useOnlineStatus` - Detects internet connection status

3. **Components**
   - `Header` - App branding, online status, refresh button
   - `StatsCard` - Display key metrics
   - `SearchBar` - Filter protocols by name/category
   - `FilterChips` - Filter by blockchain chain
   - `ProtocolCard` - Display protocol information with security badge
   - `ProtocolDetailModal` - Detailed protocol information and scan results
   - `SecurityBadge` - Visual security score indicator
   - `LoadingSpinner` - Loading state with progress message

## Technical Stack

- **Frontend**: React 18, TypeScript, Wouter (routing), TanStack Query, Shadcn UI, Tailwind CSS
- **Backend**: Express.js, TypeScript
- **Data Source**: DeFiLlama API (https://api.llama.fi/protocols)
- **Caching**: In-memory with TTL
- **Proxy**: corsproxy.io for CORS handling

## Security Scanning Algorithm

The security scanner evaluates protocols based on:
1. **Contract Age** (40 points if < 7 days)
2. **Audit Status** (30 points if not audited)
3. **Team Anonymity** (25 points if no Twitter/GitHub)
4. **Liquidity** (20 points if TVL < $50k)

**Severity Levels:**
- CRITICAL: Score ≥ 80 (auto-blacklisted)
- HIGH: Score ≥ 50
- MEDIUM: Score ≥ 25
- LOW: Score < 25

## Data Flow

1. User loads the dashboard
2. Frontend calls `GET /api/protocols`
3. Backend fetches from DeFiLlama via CORS proxy
4. Protocols are cached for 30 minutes
5. Auto-scan runs on first 50 protocols
6. Security results displayed in UI
7. CRITICAL threats added to blacklist

## API Integration

### DeFiLlama API
- Endpoint: `https://api.llama.fi/protocols`
- Via CORS proxy: `https://corsproxy.io/?https://api.llama.fi/protocols`
- Retry logic: 3 attempts with 2s delay
- Rate limit handling: 5s backoff on 429 status
- Fallback: Local mock data (Uniswap, Aave)

### Batch Processing
- Security scans process 10 protocols at a time
- 1-second delay between batches
- Maximum 100 protocols per scan request

## Design System

- **Theme**: Cybersecurity dark mode
- **Colors**: Yellow/Orange accent for Jerusalem branding
- **Typography**: Inter for UI text, JetBrains Mono for data
- **Components**: Shadcn UI with Radix primitives
- **Icons**: Lucide React

## Running the Application

The application runs on port 5000 with both frontend and backend served together:

```bash
npm run dev
```

## Environment Variables

- `SESSION_SECRET` - Used for session management (already configured)

## Recent Changes

**October 26, 2025**
- Implemented all Jerusalem DeFi Security Scanner features
- Created API cache with 30-minute TTL
- Built security scanning engine with threat detection
- Integrated DeFiLlama API with CORS proxy and retry logic
- Implemented batch security scanning (10 at a time)
- Created blacklist management system
- Built complete UI with filtering, search, and security visualization
- Added online/offline detection and error handling
- Improved type safety throughout the application

## Future Enhancements

1. Manual cache invalidation controls
2. Self-hosted CORS proxy for better reliability
3. Additional security heuristics (smart contract analysis, rugpull detection)
4. Historical security scan tracking
5. Export blacklist to CSV/JSON
6. Email alerts for critical threats
