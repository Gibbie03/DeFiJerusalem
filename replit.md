# JERUSALEM DeFi Security Scanner

## Overview
A full-stack JavaScript application that discovers DeFi protocols from DeFiLlama API and performs real-time security threat analysis to detect wallet drainers and track blacklisted projects. The scanner supports filtering across 126+ blockchain chains with cybersecurity-themed UI and persistent PostgreSQL storage.

## Recent Changes (October 26, 2025)
- **Database Migration**: Migrated from in-memory storage to PostgreSQL with Drizzle ORM for data persistence
- **Navigation Menu**: Added comprehensive menu bar linking all pages (Home, New DApps, Trending, Tutorials)
- **New DApps Page**: Created page showing recently discovered protocols sorted by discovery date
- **Trending DApps Page**: Created page showing protocols with highest TVL growth in last 24 hours
- **Weekly Automated Scanning**: Implemented automated weekly security scans that run every 7 days and store results in database
- **Database-Backed Scans**: Security scan results now persist in database and load automatically on page load
- **Removed auto-scanning on page load**: Protocols load immediately but security scanning is triggered manually via "Scan All" button
- **Enhanced chain filtering**: Replaced chip-based filter with expandable Select dropdown component
- **Tutorial Videos feature**: Complete upload and listing functionality for educational DeFi security videos

## User Preferences
- **Design**: Cybersecurity-themed dark mode with Shield iconography (no emoji usage)
- **Forms**: Must use shadcn useForm + Form pattern with zodResolver for validation
- **Data Updates**: React Query mutations must invalidate relevant queries for immediate UI updates
- **User Control**: Security scanning is manual-only, not triggered automatically on page load
- **Data Persistence**: All data stored in PostgreSQL database for reliability and scalability

## Project Architecture

### Database Schema (PostgreSQL + Drizzle)
- **protocols**: DeFi protocol data (id, name, chains, TVL, security score, timestamps)
- **security_scans**: Security scan results (protocol_id, threats, severity, score, scanned_at)
- **blacklist_entries**: Flagged protocols (dapp_id, threats, severity, status, timestamp)
- **tutorial_videos**: Educational videos (title, description, video_url, category, uploaded_at)

### Frontend (client/src)
- **Dashboard** (`pages/Dashboard.tsx`): Main scanner with manual "Scan All" button, expandable chain filter, protocol listing with security badges loaded from database
- **New DApps** (`pages/NewDApps.tsx`): Recently discovered protocols sorted by discovery date
- **Trending DApps** (`pages/TrendingDApps.tsx`): Protocols with highest TVL growth (24h)
- **Tutorials** (`pages/Tutorials.tsx`): Video tutorial upload and listing with YouTube integration
- **Navigation** (`App.tsx`): Menu bar with Home, New DApps, Trending, and Tutorials links
- **Components**: Header, StatsCard, SearchBar, ProtocolCard, ProtocolDetailModal, LoadingSpinner

### Backend (server/)
- **Database** (`db.ts`): Neon PostgreSQL connection with Drizzle ORM
- **Storage** (`storage.ts`): DatabaseStorage implementing IStorage interface for all CRUD operations
- **DApp Discovery** (`lib/dapp-discovery.ts`): DeFiLlama API integration with 30-minute cache
- **Security Analysis** (`lib/wallet-drainer-detector.ts`): Pattern-based threat detection
- **Blacklist Manager** (`lib/blacklist-manager.ts`): Manages blacklisted protocols
- **Weekly Scanner**: Automated security scanning every 7 days (runs 5 minutes after startup, then weekly)

### API Routes (server/routes.ts)
- `GET /api/protocols` - Discover and return all DeFi protocols (stored in database)
- `POST /api/protocols` - Add manual protocol
- `POST /api/scan` - Perform security analysis on protocol IDs (stores in database)
- `GET /api/scan/:protocolId` - Get specific scan result
- `GET /api/scans` - Get all latest security scans from database
- `GET /api/blacklist` - Get blacklisted entries
- `GET /api/protocols/new` - Get recently discovered protocols (sorted by discovery date)
- `GET /api/protocols/trending` - Get trending protocols (sorted by TVL growth)
- `GET /api/tutorials` - Get all tutorial videos
- `POST /api/tutorials` - Upload new tutorial video

### Key Features
1. **Auto-Discovery**: Fetches top protocols from DeFiLlama and stores in database
2. **Manual Security Scanning**: "Scan All" button triggers threat analysis, results stored in database
3. **Weekly Automated Scanning**: Background job scans all protocols every 7 days
4. **Database Persistence**: All protocols, scans, blacklist entries, and tutorials persist in PostgreSQL
5. **Page Load Hydration**: Stored scan results load automatically on page load from database
6. **New DApps Tracking**: View recently discovered protocols
7. **Trending Analysis**: See protocols with highest TVL growth
8. **Chain Filtering**: Select dropdown with all 126+ chains
9. **Threat Detection**: Pattern matching for suspicious domains, blacklist checking
10. **Blacklist Management**: Automatic flagging of high-severity threats
11. **Tutorial System**: Video upload with form validation, YouTube integration
12. **Navigation Menu**: Easy access to all pages from menu bar

### Technical Stack
- **Frontend**: React, Wouter, TanStack Query, Shadcn UI, Tailwind CSS
- **Backend**: Express, Drizzle ORM, Neon PostgreSQL
- **Database**: PostgreSQL (Neon-hosted) with automatic backups
- **Validation**: Zod, drizzle-zod, react-hook-form
- **External**: DeFiLlama API for protocol discovery

## Data Flow

### Initial Page Load
1. User loads any page (Dashboard, New DApps, Trending)
2. Frontend fetches protocols from `GET /api/protocols`
3. Frontend fetches stored scan results from `GET /api/scans`
4. Stored scans from previous weekly scans display immediately
5. User can trigger additional manual scans with "Scan All" button

### Weekly Automated Scanning
1. Server starts weekly scan 5 minutes after startup
2. Fetches all protocols from database
3. Runs security analysis on all protocols (batch processing)
4. Stores scan results in `security_scans` table
5. Adds CRITICAL threats to blacklist
6. Repeats every 7 days automatically

### Manual Scanning
1. User clicks "Scan All" button
2. Frontend sends protocol IDs to `POST /api/scan`
3. Backend analyzes protocols and stores results in database
4. Frontend receives scan results and updates UI
5. Critical threats automatically added to blacklist

## Running the Application

The application runs on port 5000 with both frontend and backend served together:

```bash
npm run dev
```

## Database Management

Push schema changes to database:
```bash
npm run db:push
```

Force push schema changes:
```bash
npm run db:push --force
```

## Environment Variables
- `DATABASE_URL` - PostgreSQL connection string (auto-configured by Replit)
- `SESSION_SECRET` - Used for session management

## Development Guidelines
- All interactive elements must have data-testid attributes for testing
- Forms must use shadcn Form components with useForm + zodResolver pattern
- Mutations must call queryClient.invalidateQueries for cache updates
- No emoji usage - use lucide-react icons only
- Security scans are manual-only or weekly automated, not triggered on page load
- Chain filter uses Select component for better UX with large lists
- All data persists in PostgreSQL database

## Future Enhancements
1. Real-time notifications for critical threats
2. Historical scan tracking and trend analysis
3. Export capabilities (CSV, JSON)
4. Advanced filtering and sorting options
5. User authentication and saved preferences
6. Email alerts for weekly scan results
7. Custom scanning schedules (daily, weekly, monthly)
8. Protocol watchlist functionality
