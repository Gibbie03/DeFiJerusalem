# JERUSALEM DeFi Security Scanner

## Overview
A full-stack JavaScript application that discovers DeFi protocols from DeFiLlama API and performs real-time security threat analysis to detect wallet drainers and track blacklisted projects. The scanner supports filtering across 126+ blockchain chains with cybersecurity-themed UI.

## Recent Changes (October 26, 2025)
- **Removed auto-scanning on page load**: Protocols now load immediately but security scanning is triggered manually via "Scan All" button
- **Enhanced chain filtering**: Replaced chip-based filter with expandable Select dropdown component for better UX with 126+ chains
- **Added Tutorial Videos feature**: Complete upload and listing functionality for educational DeFi security videos
- **Improved navigation**: Top navigation bar with Scanner and Tutorials tabs using lucide-react icons (no emojis)
- **Fixed design violations**: All forms now use prescribed shadcn useForm + Form pattern with zodResolver validation

## User Preferences
- **Design**: Cybersecurity-themed dark mode with Shield iconography (no emoji usage)
- **Forms**: Must use shadcn useForm + Form pattern with zodResolver for validation
- **Data Updates**: React Query mutations must invalidate relevant queries for immediate UI updates
- **User Control**: Security scanning is manual-only, not triggered automatically on page load

## Project Architecture

### Frontend (client/src)
- **Dashboard** (`pages/Dashboard.tsx`): Main scanner interface with manual "Scan All" button, expandable chain filter (Select dropdown), search, and protocol listing with security visualization
- **Tutorials** (`pages/Tutorials.tsx`): Video tutorial upload form (using Form pattern) and card-based listing with YouTube integration
- **Navigation** (`App.tsx`): Top nav with Scanner/Tutorials tabs, Shield branding (no emoji)
- **Components**: Header, StatsCard, SearchBar, ProtocolCard, ProtocolDetailModal, LoadingSpinner
- **State Management**: React Query for server state, local state for UI interactions

### Backend (server/)
- **DApp Discovery** (`lib/dapp-discovery.ts`): DeFiLlama API integration with 30-minute cache (APICache)
- **Security Analysis** (`lib/wallet-drainer-detector.ts`): Pattern-based threat detection for wallet drainers
- **Blacklist Manager** (`lib/blacklist-manager.ts`): Manages blacklisted protocols with severity levels
- **Storage** (`storage.ts`): In-memory storage for protocols, security scans, blacklist entries, and tutorial videos
- **API Routes** (`routes.ts`):
  - `GET /api/protocols` - Discover and return DeFi protocols
  - `POST /api/scan` - Perform security analysis on protocol IDs
  - `GET /api/blacklist` - Get blacklisted entries
  - `GET /api/tutorials` - Get all tutorial videos
  - `POST /api/tutorials` - Upload new tutorial video

### Data Models (shared/schema.ts)
- **Protocol**: DeFi protocol with chains, TVL, security score, audit status, social links
- **SecurityScan**: Threat analysis result with severity, threats array, and score
- **BlacklistEntry**: Flagged protocols with threat details and status
- **TutorialVideo**: Educational videos with URL, thumbnail, duration, category

### Key Features
1. **Auto-Discovery**: Fetches top protocols from DeFiLlama on page load (no auto-scan)
2. **Manual Security Scanning**: "Scan All" button triggers threat analysis for loaded protocols
3. **Chain Filtering**: Select dropdown with all 126+ chains from discovered protocols
4. **Threat Detection**: Pattern matching for suspicious domains, blacklist checking
5. **Blacklist Management**: Automatic flagging of high-severity threats
6. **Tutorial System**: Video upload with form validation, YouTube integration
7. **Offline Detection**: Real-time connection status monitoring

### Technical Stack
- Frontend: React, Wouter, TanStack Query, Shadcn UI, Tailwind CSS
- Backend: Express, in-memory storage (MemStorage)
- Validation: Zod, drizzle-zod, react-hook-form
- External: DeFiLlama API for protocol discovery

## Development Guidelines
- All interactive elements must have data-testid attributes for testing
- Forms must use shadcn Form components with useForm + zodResolver pattern
- Mutations must call queryClient.invalidateQueries for cache updates
- No emoji usage - use lucide-react icons only
- Security scans are manual-only, not triggered on page load
- Chain filter uses Select component for better UX with large lists
