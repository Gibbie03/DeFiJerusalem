---
name: DeFiJerusalem Design System
description: Visual design language adopted in the complete UI overhaul — colors, typography, components, and conventions.
---

## Design Language — "Watchtower" (Black + Gold)

### Palette
- Background: `#060606` (pure black, HSL `0 0% 2%`)
- Surface/Card: `#080808` – `#0d0d0d`
- Border: `#1a1a1a` (HSL `0 0% 11%`)
- Gold primary: `#E8C15A` (HSL `45 78% 63%`)
- Text primary: `hsl(0 0% 94%)` (~#F0F0F0)
- Text muted: `hsl(0 0% 44%)` (~#707070)
- Danger/red: `hsl(0 90% 55%)` (brighter than before)
- Green (safe): `text-green-400` / `border-green-500/40`
- Orange (high): `text-orange-400` / `border-orange-400/40`

### Typography
- Body font: `'Barlow', 'Inter', sans-serif` — loaded from Google Fonts
- Display/hero font: `'Barlow Condensed'` via `.font-display` utility — for hero headlines
- Labels: `.label-caps` utility = `text-xs font-black uppercase tracking-widest`
- Hero text: `font-display font-black uppercase` + `clamp(3rem, 10vw, 8.5rem)` via Tailwind inline style

### Borders & Radius
- `--radius: 0rem` — all Shadcn components are square (no border-radius)
- All borders use `border-[#1a1a1a]` (never `border-border` for custom components)

### Key Patterns
- **Gold accent line**: active sidebar items get `border-l-2 border-[#E8C15A]`
- **Live pulse**: `animate-gold-pulse` keyframe — gold dot for LIVE FEED / EXPLOIT WIRE
- **Grid background**: `.grid-bg` utility — 64px grid of `rgba(255,255,255,0.025)` lines
- **Stats grid**: `grid-cols-N gap-px bg-[#1a1a1a]` — hairline dividers via gap on parent
- **Severity bars**: left `w-0.5` coloured bar instead of badges in threat rows
- **EXPLOIT WIRE**: TrendingTicker restyled with severity labels (CRITICAL/HIGH/MEDIUM/LOW)

### Component Files Changed
- `client/src/index.css` — all CSS variables + `.grid-bg`, `.font-display`, `.animate-gold-pulse`
- `client/src/App.tsx` — header (geometric logo, LIVE FEED pill)
- `client/src/components/app-sidebar.tsx` — black bg, gold active, all-caps groups
- `client/src/components/TrendingTicker.tsx` — EXPLOIT WIRE label, severity badges
- `client/src/components/StatsCard.tsx` — angular, all-caps label, no Card wrapper
- `client/src/components/SecurityBadge.tsx` — angular border-only badge
- `client/src/components/SecurityRatingLegend.tsx` — coloured bar + plain layout
- `client/src/components/LatestThreatsWidget.tsx` — severity bar rows, angular header
- `client/src/components/ProtocolTable.tsx` — angular header, ghost rows, tabular badges
- `client/src/components/AdSpace.tsx` — dashed partner banner placeholder
- `client/src/components/Footer.tsx` — all-caps minimal
- `client/src/components/LoadingSpinner.tsx` — crosshair animation
- `client/src/pages/Dashboard.tsx` — hero section, stats bar, restyled layout
- `client/src/pages/not-found.tsx` — large 404 ghost text

**Why:** User provided reference mockups showing a pure black, editorial military/surveillance aesthetic with gold accents — "THE WATCHTOWER OF WEB3" concept. All-caps typography, zero border-radius, aggressive display headlines.
