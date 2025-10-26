# JERUSALEM DeFi Security Scanner - Design Guidelines

## Design Approach: Security-Focused Dashboard System

**Selected Approach:** Hybrid Design System combining Material Design's data presentation patterns with cybersecurity-specific visual language inspired by security tools like Splunk, Datadog, and blockchain explorers (Etherscan, DeFiLlama).

**Core Principles:**
1. **Information Clarity First** - Dense data must be scannable and hierarchical
2. **Trust Through Transparency** - Security states must be immediately visible
3. **Operational Efficiency** - Power users need keyboard shortcuts and quick actions
4. **Status-Driven Design** - Color-coded threat levels guide visual hierarchy

---

## Typography System

**Font Stack:**
- Primary: Inter (Google Fonts) - exceptional readability for data-dense interfaces
- Monospace: JetBrains Mono - for addresses, contract IDs, numerical data

**Hierarchy:**
- **Dashboard Headers:** text-3xl to text-4xl, font-bold (Hero statistics, main titles)
- **Section Headers:** text-xl to text-2xl, font-semibold (Panel titles, category headers)
- **Data Labels:** text-sm, font-medium, uppercase tracking-wide (Field labels, stat categories)
- **Primary Content:** text-base, font-normal (Protocol names, descriptions)
- **Secondary Data:** text-sm, font-normal (Metadata, timestamps, chain names)
- **Micro Data:** text-xs, font-mono (Contract addresses, precise numbers)
- **Alert Text:** text-sm to text-base, font-semibold (Threat warnings, security notices)

---

## Layout System

**Spacing Primitives:** Tailwind units of **2, 4, 6, 8, 12, 16** (e.g., p-4, gap-6, mt-8)
- Tight groupings: 2-4 units (related data pairs, inline elements)
- Component padding: 6-8 units (card interiors, section padding)
- Section spacing: 12-16 units (vertical rhythm between major sections)

**Grid Structure:**
- **Dashboard Layout:** Sidebar navigation (w-64) + main content area (flex-1)
- **Stats Grid:** grid-cols-2 md:grid-cols-4 (top-level metrics)
- **Protocol Lists:** Single column on mobile, 2-3 columns on desktop for cards
- **Data Tables:** Full-width with horizontal scroll on mobile
- **Detail Panels:** Two-column split (main info left, metadata/actions right)

**Container Strategy:**
- Full-width dashboard with max-w-screen-2xl centered
- Card-based layouts with consistent border treatment
- Fixed sidebar with scrollable main content area

---

## Component Library

### Navigation & Structure
**Top Bar:**
- Logo/branding (left), global search (center-left), connection status indicator (right), refresh button (far right)
- Height: h-16, fixed positioning with backdrop blur
- Includes "LIVE" indicator with pulse animation for real-time updates

**Sidebar Navigation:**
- Fixed left panel (w-64) with icon + label pattern
- Active states with subtle accent border-left treatment
- Sections: Dashboard, Trending, Blacklist, Manual Add, Settings
- Collapsed state on mobile (hamburger menu)

### Dashboard Components

**Stat Cards (KPI Display):**
- Grid layout with 4 primary metrics: Total Protocols, Chains Supported, Audited %, Blacklisted Count
- Large numerical value (text-3xl, font-bold) above descriptive label
- Optional trend indicator (percentage change with up/down icon)
- Subtle border treatment, padding p-6

**Protocol Cards:**
- Compact card layout with protocol logo (left), name + chain badges (center), security score badge (right)
- TVL displayed prominently with formatted currency
- 24h change indicator with directional icon
- Quick action buttons: "View Details", "Scan Now"
- Hover state reveals additional metadata (age, audit status)

**Security Threat Alerts:**
- Banner-style notifications for CRITICAL/HIGH severity items
- Icon (AlertCircle, Shield, XOctagon) + threat type + severity badge
- Expandable detail section showing specific threat vectors
- Dismissible with "X" button

**Data Tables:**
- Striped rows for scannability (alternating subtle background)
- Sortable column headers with arrow indicators
- Fixed header on scroll for large datasets
- Columns: Protocol Name, Chain(s), TVL, 24h Change, Security Score, Actions
- Mobile: Stack as cards with key-value pairs

### Interactive Elements

**Search Bar:**
- Prominent placement in top navigation
- Icon prefix (Search), clear button (X) when text entered
- Real-time filtering with debounce
- Placeholder: "Search protocols, chains, or categories..."

**Filter Chips:**
- Horizontal scrollable row for chain selection
- Active state: filled background, inactive: outlined
- "All" chip always present as default
- Badge count showing filtered results

**Security Score Badges:**
- Pill-shaped badges with score/100 display
- Icon prefix (Shield for high scores, AlertCircle for low)
- Size: px-3 py-1, text-sm, font-semibold

**Severity Indicators:**
- Color-coded system (referenced via border, icon, background opacity)
- CRITICAL: XOctagon icon, HIGH: AlertCircle, MEDIUM: TrendingDown, LOW: Eye
- Text label + icon combination

**Action Buttons:**
- Primary action: "Scan Protocol" (solid background, white text)
- Secondary actions: "View Details", "Add to Watchlist" (outlined)
- Icon buttons for quick actions (refresh, external link, close)
- Size variants: text-sm px-4 py-2 (default), text-xs px-3 py-1.5 (compact)

### Detail View Components

**Protocol Detail Panel:**
- Split layout: 2/3 main info, 1/3 metadata sidebar
- **Main section:** Description, audit history, threat analysis results
- **Sidebar:** Social links (Twitter, GitHub, Website), launch date, chain list, TVL breakdown
- **Threat Section:** List of detected threats with severity cards
- **Action Bar:** Scan button, add to blacklist, external link to protocol

**Blacklist Management:**
- Table view with filtering by severity
- Columns: Protocol, Severity, Threat Count, Status, Timestamp, Actions
- Expandable rows showing full threat details
- Bulk actions: Export CSV, Clear resolved items

**Manual Add Form:**
- Two-column form layout on desktop, stacked on mobile
- Input fields: Protocol Name*, Contract Address*, Chain*, Website, Twitter, GitHub
- Real-time validation indicators
- "Scan After Adding" checkbox option
- Submit button: "Add & Scan Protocol"

---

## Visual Language & Patterns

**Border Treatment:**
- Subtle borders throughout (border, border-2 for emphasis)
- Rounded corners: rounded-lg for cards, rounded-md for buttons, rounded-full for badges
- Dividers between sections: border-t with reduced opacity

**Status Communication:**
- Inline badges for categorical data (chain names, categories)
- Numerical data with icons (TrendingUp/TrendingDown for changes)
- Progress indicators for security scores (horizontal bar)
- Pulsing dot for "live" status

**Spacing & Density:**
- High-density tables: py-3 px-4 cells
- Card layouts: p-6 to p-8 for breathing room
- Form fields: mb-4 to mb-6 spacing
- Section gaps: space-y-8 to space-y-12

**Iconography:**
- Heroicons for all UI elements (consistent 20px/24px sizing)
- Security: Shield, AlertCircle, XOctagon, Eye
- Actions: Search, RefreshCw, ExternalLink, Plus, X
- Trends: TrendingUp, TrendingDown, Sparkles
- Status: Wifi (online), WifiOff (offline)

---

## Responsive Behavior

**Breakpoint Strategy:**
- Mobile (base): Single column, collapsed sidebar, stacked stats
- Tablet (md:): 2-column stats grid, partial sidebar expansion
- Desktop (lg:): Full layout with persistent sidebar, 4-column stats, multi-column tables
- Wide (xl:, 2xl:): Increased max-width containers, more table columns visible

**Mobile Optimizations:**
- Bottom navigation bar replaces sidebar
- Card-based protocol lists replace tables
- Simplified stat display (2-column grid max)
- Touch-friendly button sizes (min-h-12)
- Horizontal scroll for wide data tables

---

## Animation & Micro-interactions

**Minimal Animation Strategy:**
- Pulse effect on "LIVE" indicator only
- Smooth transitions for tab/filter changes (transition-colors duration-200)
- Hover states: subtle background opacity changes
- Loading states: Simple spinner (RefreshCw with animate-spin)
- **No scroll-triggered animations, parallax, or decorative effects**

---

## Accessibility Requirements

- WCAG AA contrast ratios for all text
- Keyboard navigation with visible focus states (ring-2 ring-offset-2)
- ARIA labels for icon-only buttons
- Semantic HTML: proper heading hierarchy, table markup
- Screen reader announcements for security alerts
- Form validation with clear error messaging

---

## Images

**Protocol Logos:**
- Small circular avatars (w-10 h-10) in lists and cards
- Larger display (w-16 h-16) in detail views
- Fallback: First letter of protocol name on subtle background

**No hero image** - This is a data dashboard, not a marketing page. Lead directly with statistics and protocol listings.