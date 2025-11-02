import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

const BRAND_COLORS = {
  primary: '#3b82f6',
  purple: '#a855f7',
  amber: '#f59e0b',
  green: '#10b981',
  dark: '#0f172a',
  text: '#1e293b',
  lightGray: '#64748b',
  darkGray: '#334155',
  veryLight: '#e2e8f0',
  white: '#ffffff',
};

interface VisualFeature {
  title: string;
  description: string;
  placement: string;
  visual: string[];
  impact: string;
}

interface TierData {
  name: string;
  price: string;
  color: string;
  tagline: string;
  visualFeatures: VisualFeature[];
  implementationSteps: string[];
  beforeAfter: {
    before: string;
    after: string;
  };
  roiMetrics: {
    impressions: string;
    traffic: string;
    conversions: string;
    socialReach: string;
  };
}

const FEATURED_TIER: TierData = {
  name: 'Featured',
  price: '$500-$1,000/month',
  color: BRAND_COLORS.primary,
  tagline: 'Get Verified. Get Noticed. Get Users.',
  visualFeatures: [
    {
      title: '1. Verified Badge on Protocol Listing',
      description: 'Blue checkmark badge appears next to your protocol name in the main table',
      placement: 'Main Protocol Table - Row Display',
      visual: [
        '┌─────────────────────────────────────────┐',
        '│ #23  Uniswap ✓  DeFi  $4.2B   +2.3%   │',
        '│      VERIFIED                           │',
        '└─────────────────────────────────────────┘',
        '',
        'Visual Elements:',
        '• Blue checkmark badge (✓) next to protocol name',
        '• "VERIFIED" label in security score tooltip',
        '• Highlighted row with subtle blue glow',
        '• Premium protocol card styling',
      ],
      impact: 'Users trust verified protocols 3x more (78% vs 26% click-through rate)',
    },
    {
      title: '2. Priority Placement in Category',
      description: 'Your protocol appears in top 10 of category listings',
      placement: 'Category Pages (DEX, Lending, etc.)',
      visual: [
        'Category: DEX Protocols',
        '┌─── FEATURED ────────────────────────┐',
        '│ 1. Your Protocol ✓        $50M TVL  │',
        '│ 2. Your Protocol ✓        $42M TVL  │',
        '│ 3. Competitor            $120M TVL  │',
        '└─────────────────────────────────────┘',
        '',
        'Visual Elements:',
        '• "FEATURED" banner at top of category',
        '• Priority sorting (Featured → TVL → Security)',
        '• Blue accent border on Featured protocols',
        '• Expanded card with more details visible',
      ],
      impact: 'Top 10 placement receives 85% of category traffic',
    },
    {
      title: '3. Highlighted in Search Results',
      description: 'Your protocol appears first when users search, with visual distinction',
      placement: 'Search Results Page',
      visual: [
        'Search: "yield farming"',
        '┌─── SPONSORED RESULT ────────────────┐',
        '│ 🌟 Your Protocol (Verified)         │',
        '│    High Security Score • $50M TVL   │',
        '│    [Visit Protocol →]               │',
        '└─────────────────────────────────────┘',
        '',
        'Other Results:',
        '• Competitor A    (Unverified)',
        '• Competitor B    (Unverified)',
        '',
        'Visual Elements:',
        '• Star icon (🌟) for Featured protocols',
        '• Yellow highlight background',
        '• Larger card with CTA button',
        '• Shows security score prominently',
      ],
      impact: 'First search result gets 40-50% of all clicks',
    },
    {
      title: '4. Social Media Mentions (2x/month)',
      description: 'Featured in our Twitter/X threads and posts',
      placement: 'Twitter/X @DeFiJerusalem',
      visual: [
        'Example Post 1 (Protocol Spotlight):',
        '─────────────────────────────────',
        '🔒 VERIFIED PROTOCOL SPOTLIGHT',
        '',
        '[Your Protocol] is now Featured on',
        'DeFiJerusalem! ✓',
        '',
        '✅ Security Score: 95/100',
        '✅ $50M TVL',
        '✅ Audited by [Auditor]',
        '',
        'Explore: defijerusalem.com/protocol/[you]',
        '',
        'Example Post 2 (Weekly Roundup):',
        '─────────────────────────────────',
        '📊 This Week\'s Top Verified Protocols:',
        '',
        '1. [Your Protocol] - DEX',
        '2. [Other Protocol] - Lending',
        '3. [Other Protocol] - Yield',
        '',
        'All verified by DeFiJerusalem security',
      ],
      impact: '20,000+ impressions per mention, 500-1,000 profile visits',
    },
    {
      title: '5. Enhanced Protocol Details Display',
      description: 'Expanded protocol detail page with premium styling',
      placement: 'Protocol Detail Page (/protocol/your-protocol)',
      visual: [
        '┌───────── VERIFIED PROTOCOL ─────────┐',
        '│                                     │',
        '│  [LOGO]  Your Protocol          ✓  │',
        '│          Decentralized Exchange     │',
        '│                                     │',
        '│  ┌─ SECURITY ANALYSIS ─────────┐   │',
        '│  │ Score: 95/100 (SAFE)        │   │',
        '│  │ • Audited by CertiK         │   │',
        '│  │ • No critical threats       │   │',
        '│  │ • Active bug bounty         │   │',
        '│  └─────────────────────────────┘   │',
        '│                                     │',
        '│  TVL: $50M    24h Vol: $12M        │',
        '│                                     │',
        '│  [Visit Protocol] [Add to Wallet]  │',
        '└─────────────────────────────────────┘',
        '',
        'Visual Enhancements:',
        '• Verified badge in header',
        '• Premium gradient background',
        '• Expanded security section',
        '• Prominent CTAs',
        '• Social proof indicators',
      ],
      impact: 'Premium styling increases conversions by 25-40%',
    },
  ],
  implementationSteps: [
    'Step 1: Protocol Onboarding (Day 1)',
    '  • Submit protocol details form',
    '  • Provide logo (PNG, 512x512px)',
    '  • Share official website & social links',
    '  • Verify ownership via domain or Twitter',
    '',
    'Step 2: Verification Process (Days 1-2)',
    '  • DeFiJerusalem team reviews submission',
    '  • Confirms security audit status',
    '  • Validates TVL and contract addresses',
    '  • Approves protocol for Featured tier',
    '',
    'Step 3: Profile Setup (Day 3)',
    '  • Verified badge added to listing',
    '  • Priority placement activated',
    '  • Search highlighting enabled',
    '  • Enhanced detail page published',
    '',
    'Step 4: Social Media Planning (Day 3-5)',
    '  • Schedule first spotlight post (within 7 days)',
    '  • Add to monthly roundup calendar',
    '  • Create custom graphics for mentions',
    '  • Tag your official accounts',
    '',
    'Step 5: Analytics Access (Day 5)',
    '  • Receive login to sponsor dashboard',
    '  • View real-time impression data',
    '  • Track clicks and conversions',
    '  • Export monthly performance reports',
    '',
    'Step 6: Go Live! (Day 7)',
    '  • All features activated',
    '  • First social media post published',
    '  • Monthly reporting begins',
    '  • Dedicated support channel active',
  ],
  beforeAfter: {
    before: 'BEFORE Featured Tier:\n\n• No verification badge\n• Listed by TVL only (rank #47)\n• Generic search results\n• No social media mentions\n• Basic protocol page\n• 200 monthly visitors',
    after: 'AFTER Featured Tier:\n\n• Blue verified badge ✓\n• Top 10 in category (rank #3)\n• Highlighted in search\n• 2 social posts/month (20K reach)\n• Premium protocol page\n• 500-1,000 monthly visitors',
  },
  roiMetrics: {
    impressions: '50,000+ monthly impressions',
    traffic: '500-1,000 qualified visitors/month',
    conversions: '3-5% user conversion rate',
    socialReach: '20,000+ social media reach',
  },
};

const SPONSORED_TIER: TierData = {
  name: 'Sponsored',
  price: '$2,000-$5,000/month',
  color: BRAND_COLORS.purple,
  tagline: 'Dominate Your Category. Own the Homepage.',
  visualFeatures: [
    {
      title: '1. All Featured Tier Benefits',
      description: 'Includes verified badge, priority placement, search highlighting, and social mentions',
      placement: 'Platform-wide',
      visual: [
        '✓ Verified badge on all listings',
        '✓ Top 10 category placement',
        '✓ Highlighted search results',
        '✓ Social media mentions (2x/month)',
        '✓ Enhanced protocol detail page',
      ],
      impact: 'Base visibility: 50,000+ impressions/month',
    },
    {
      title: '2. Top 10 Trending Section Placement',
      description: 'Featured in homepage "Trending Now" section with custom messaging',
      placement: 'Homepage - Above the Fold',
      visual: [
        '🔥 TRENDING NOW ON DEFIJERUSALEM',
        '┌──────────────────────────────────────┐',
        '│ #1 [Your Protocol] SPONSORED      ⬆️  │',
        '│    "First DEX with zero fees" 🚀     │',
        '│    $50M TVL • 12,000 users • +45%    │',
        '│    [Explore Now →]                   │',
        '├──────────────────────────────────────┤',
        '│ #2 Competitor Protocol          ⬇️   │',
        '│ #3 Another Protocol             →    │',
        '└──────────────────────────────────────┘',
        '',
        'Visual Elements:',
        '• "SPONSORED" badge in purple',
        '• Custom tagline (your messaging)',
        '• Prominent metrics display',
        '• Large CTA button',
        '• Trending indicator (🔥)',
        '• Animation on hover',
      ],
      impact: 'Homepage trending gets 100,000+ monthly views',
    },
    {
      title: '3. Homepage Featured Slot',
      description: 'Dedicated card in "Featured Protocols" section',
      placement: 'Homepage - Featured Section',
      visual: [
        '⭐ FEATURED PROTOCOLS',
        '┌─────────────────┐ ┌─────────────────┐',
        '│ [Your Protocol] │ │ [Other Proto]   │',
        '│                 │ │                 │',
        '│ [LOGO]          │ │ [LOGO]          │',
        '│                 │ │                 │',
        '│ "Yield farming  │ │ Different msg   │',
        '│  made simple"   │ │                 │',
        '│                 │ │                 │',
        '│ Score: 95/100   │ │ Score: 88/100   │',
        '│ TVL: $50M       │ │ TVL: $30M       │',
        '│                 │ │                 │',
        '│ [Learn More →]  │ │ [Learn More →]  │',
        '└─────────────────┘ └─────────────────┘',
        '',
        'Visual Elements:',
        '• Large protocol logo',
        '• Custom headline (your messaging)',
        '• Key metrics highlighted',
        '• Purple accent border',
        '• Premium card styling',
        '• Direct CTA button',
      ],
      impact: 'Featured section: 75,000+ monthly impressions',
    },
    {
      title: '4. Dedicated Twitter/X Article Feature',
      description: 'Full thread breaking down your protocol (once per month)',
      placement: 'Twitter/X @DeFiJerusalem',
      visual: [
        'Example Thread:',
        '═══════════════════════════════════',
        '🧵 PROTOCOL DEEP DIVE: [Your Protocol]',
        '',
        '1/8 [Your Protocol] is revolutionizing',
        'DeFi with zero-fee swaps and advanced',
        'liquidity pools. Here\'s why you should',
        'know about it 👇',
        '',
        '2/8 💎 KEY FEATURES:',
        '• Zero trading fees',
        '• 0.3% LP rewards',
        '• Cross-chain swaps',
        '• Audited by CertiK ✓',
        '',
        '3/8 📊 BY THE NUMBERS:',
        '• $50M Total Value Locked',
        '• 12,000+ active users',
        '• 45% growth this month',
        '• 95/100 security score',
        '',
        '4/8 🔒 SECURITY ANALYSIS:',
        '[Security breakdown...]',
        '',
        '5/8 💰 HOW TO GET STARTED:',
        '[Step-by-step guide...]',
        '',
        '6/8 🎯 USE CASES:',
        '[Real-world examples...]',
        '',
        '7/8 🚀 WHAT\'S NEXT:',
        '[Roadmap highlights...]',
        '',
        '8/8 Ready to try [Your Protocol]?',
        '',
        'Full analysis: defijerusalem.com/[you]',
        '',
        '#DeFi #Crypto #[YourProtocol]',
      ],
      impact: 'Threads average 50,000+ impressions, 2,000+ engagements',
    },
    {
      title: '5. Social Media Spotlight (4x/month)',
      description: 'Regular features in posts, weekly roundups, and announcements',
      placement: 'Twitter/X, LinkedIn, Telegram',
      visual: [
        'Weekly Post Schedule:',
        '─────────────────────',
        'Week 1: Protocol Spotlight',
        'Week 2: Weekly Top 10 List',
        'Week 3: Deep Dive Thread',
        'Week 4: Security Update Feature',
        '',
        'Example Spotlight:',
        '═══════════════════════════════',
        '🌟 SPONSORED PROTOCOL',
        '',
        '[Your Protocol] continues to lead',
        'the DEX category with:',
        '',
        '✅ 95/100 security score',
        '✅ $50M TVL (+45% this month)',
        '✅ Zero trading fees',
        '✅ CertiK audited',
        '',
        'Why we trust them 🧵👇',
        '[Link to full thread]',
      ],
      impact: '100,000+ monthly social impressions across channels',
    },
    {
      title: '6. Advanced Analytics Dashboard',
      description: 'Real-time sponsor dashboard with detailed metrics',
      placement: 'Sponsor Portal (defijerusalem.com/sponsor/dashboard)',
      visual: [
        '┌─── YOUR PERFORMANCE ────────────────┐',
        '│                                     │',
        '│  📊 This Month:                     │',
        '│  ├─ 152,000 Impressions      +12%  │',
        '│  ├─ 3,840 Clicks             +18%  │',
        '│  ├─ 192 Conversions          +25%  │',
        '│  └─ 5.0% CTR                 +0.3% │',
        '│                                     │',
        '│  📈 Traffic Sources:                │',
        '│  ├─ Homepage Featured:    45%       │',
        '│  ├─ Trending Section:     30%       │',
        '│  ├─ Search Results:       15%       │',
        '│  └─ Social Media:         10%       │',
        '│                                     │',
        '│  🎯 Top Converting Pages:           │',
        '│  1. Protocol Detail        (120)    │',
        '│  2. Homepage Feature       (42)     │',
        '│  3. Category Page          (30)     │',
        '│                                     │',
        '│  📱 Social Media Impact:            │',
        '│  ├─ Thread Impressions: 52,000     │',
        '│  ├─ Profile Visits:     2,100       │',
        '│  ├─ Link Clicks:        840         │',
        '│  └─ Engagement Rate:    4.2%        │',
        '│                                     │',
        '│  [Export Report] [Share Team]      │',
        '└─────────────────────────────────────┘',
      ],
      impact: 'Track ROI in real-time, optimize messaging based on data',
    },
  ],
  implementationSteps: [
    'Step 1: Sponsored Tier Kickoff (Day 1)',
    '  • Welcome call with DeFiJerusalem team',
    '  • Discuss custom messaging strategy',
    '  • Set content calendar for social posts',
    '  • Define KPIs and success metrics',
    '',
    'Step 2: Creative Assets Preparation (Days 1-3)',
    '  • Provide high-res logo and brand assets',
    '  • Submit custom tagline for featured slots',
    '  • Share key talking points for thread',
    '  • Approve mock-ups of placements',
    '',
    'Step 3: Homepage Integration (Days 3-5)',
    '  • Featured slot activated on homepage',
    '  • Trending section placement configured',
    '  • Custom messaging implemented',
    '  • Preview link shared for approval',
    '',
    'Step 4: Social Media Campaign Launch (Week 1)',
    '  • First spotlight post published',
    '  • Deep dive thread scheduled (Week 3)',
    '  • Added to weekly roundup rotation',
    '  • Community channels updated',
    '',
    'Step 5: Analytics Dashboard Access (Day 5)',
    '  • Premium sponsor portal credentials',
    '  • Real-time metrics tracking',
    '  • Weekly automated reports',
    '  • Monthly strategy review call',
    '',
    'Step 6: Ongoing Optimization (Monthly)',
    '  • Review performance metrics',
    '  • Adjust messaging based on data',
    '  • Test new creative variations',
    '  • Scale what works best',
  ],
  beforeAfter: {
    before: 'BEFORE Sponsored Tier:\n\n• Limited visibility\n• No homepage presence\n• Infrequent social mentions\n• Basic analytics only\n• 500 monthly visitors\n• 3% conversion rate',
    after: 'AFTER Sponsored Tier:\n\n• Premium visibility everywhere\n• Homepage featured slot\n• 4 social posts/month\n• Advanced analytics dashboard\n• 2,000-4,000 monthly visitors\n• 5-8% conversion rate',
  },
  roiMetrics: {
    impressions: '150,000+ monthly impressions',
    traffic: '2,000-4,000 qualified visitors/month',
    conversions: '5-8% user conversion rate',
    socialReach: '100,000+ social media reach',
  },
};

const PREMIUM_TIER: TierData = {
  name: 'Premium',
  price: '$10,000+/month',
  color: BRAND_COLORS.amber,
  tagline: 'Own DeFiJerusalem. Maximum Exposure. Maximum Results.',
  visualFeatures: [
    {
      title: '1. All Sponsored Tier Benefits',
      description: 'Includes all Featured + Sponsored features as baseline',
      placement: 'Platform-wide',
      visual: [
        '✓ Verified badge everywhere',
        '✓ Top 10 trending section',
        '✓ Homepage featured slot',
        '✓ Dedicated Twitter threads',
        '✓ 4x social mentions/month',
        '✓ Advanced analytics dashboard',
      ],
      impact: 'Base visibility: 150,000+ impressions/month',
    },
    {
      title: '2. Exclusive Homepage Banner',
      description: 'Full-width banner at top of homepage (rotating with max 3 Premium sponsors)',
      placement: 'Homepage - Top of Page (Above Fold)',
      visual: [
        '┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓',
        '┃  ⭐ PREMIUM PARTNER                 ┃',
        '┃                                     ┃',
        '┃  [LOGO]  Your Protocol              ┃',
        '┃          "The Future of DeFi"       ┃',
        '┃                                     ┃',
        '┃  🔒 95/100 Security Score           ┃',
        '┃  💰 $50M TVL  •  🚀 Zero Fees       ┃',
        '┃                                     ┃',
        '┃  [Start Trading →] [Learn More]    ┃',
        '┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛',
        '',
        'Banner Specifications:',
        '• Full-width (1920px × 400px)',
        '• Premium gold accent border',
        '• Auto-rotates every 10 seconds',
        '• Click-through to your site',
        '• Custom background gradient',
        '• Animated on hover',
        '• Mobile-optimized version',
        '',
        'Banner Placement:',
        '• Loads immediately (no scroll)',
        '• Visible on every page visit',
        '• Max 3 Premium sponsors rotate',
        '• Your share: 33% of homepage traffic',
      ],
      impact: 'Homepage gets 500,000+ monthly visits - banner sees 165,000+ impressions',
    },
    {
      title: '3. Custom Branded Landing Page',
      description: 'Dedicated page on DeFiJerusalem showcasing your protocol',
      placement: 'defijerusalem.com/partners/your-protocol',
      visual: [
        '┌─── CUSTOM LANDING PAGE ─────────────┐',
        '│                                     │',
        '│  [Hero Banner - Your Branding]      │',
        '│  "Welcome to [Your Protocol]"       │',
        '│                                     │',
        '│  ┌─ ABOUT ──────────────────────┐   │',
        '│  │ [Your custom description]    │   │',
        '│  │ [Key features & benefits]    │   │',
        '│  └──────────────────────────────┘   │',
        '│                                     │',
        '│  ┌─ SECURITY ANALYSIS ──────────┐   │',
        '│  │ • Audit reports              │   │',
        '│  │ • Real-time threat score     │   │',
        '│  │ • Contract addresses         │   │',
        '│  └──────────────────────────────┘   │',
        '│                                     │',
        '│  ┌─ HOW TO GET STARTED ─────────┐   │',
        '│  │ 1. Connect wallet            │   │',
        '│  │ 2. Choose your strategy      │   │',
        '│  │ 3. Start earning             │   │',
        '│  └──────────────────────────────┘   │',
        '│                                     │',
        '│  ┌─ TUTORIAL VIDEOS ────────────┐   │',
        '│  │ [Video 1] Getting Started    │   │',
        '│  │ [Video 2] Advanced Features  │   │',
        '│  │ [Video 3] Maximizing Yield   │   │',
        '│  └──────────────────────────────┘   │',
        '│                                     │',
        '│  ┌─ LATEST NEWS ────────────────┐   │',
        '│  │ • Partnership announcements  │   │',
        '│  │ • Feature releases           │   │',
        '│  │ • Community updates          │   │',
        '│  └──────────────────────────────┘   │',
        '│                                     │',
        '│  [Visit Protocol] [Join Community]  │',
        '└─────────────────────────────────────┘',
        '',
        'Page Features:',
        '• Custom URL slug',
        '• Your brand colors',
        '• SEO optimized',
        '• Social sharing enabled',
        '• Analytics tracking',
        '• Monthly content updates',
      ],
      impact: 'Dedicated page ranks in Google, builds long-term SEO value',
    },
    {
      title: '4. Weekly Twitter/X Thread Series',
      description: 'Dedicated thread series posted every week',
      placement: 'Twitter/X @DeFiJerusalem',
      visual: [
        'Week 1: Protocol Spotlight Thread',
        '═══════════════════════════════════',
        '🧵 Everything you need to know about',
        '[Your Protocol] - The zero-fee DEX',
        '',
        '[8-tweet thread covering features,',
        ' security, use cases, and tutorials]',
        '',
        '',
        'Week 2: Security Deep Dive',
        '═══════════════════════════════════',
        '🔒 [Your Protocol] Security Analysis',
        '',
        'We analyzed [Your Protocol]\'s smart',
        'contracts and security measures.',
        'Here\'s what we found 👇',
        '',
        '[Thread with security details]',
        '',
        '',
        'Week 3: Use Case Spotlight',
        '═══════════════════════════════════',
        '💡 5 Ways to Use [Your Protocol]',
        '',
        'Whether you\'re a beginner or pro,',
        'here\'s how to maximize [Protocol] 👇',
        '',
        '[Thread with tutorials]',
        '',
        '',
        'Week 4: Community Showcase',
        '═══════════════════════════════════',
        '🌟 [Your Protocol] Community Wins',
        '',
        'This month, [Protocol] users:',
        '• Generated $X in fees',
        '• Swapped $Y in volume',
        '• Grew TVL by Z%',
        '',
        '[Thread celebrating milestones]',
      ],
      impact: 'Weekly threads = 200,000+ monthly impressions, sustained engagement',
    },
    {
      title: '5. Co-Branded Security Reports',
      description: 'Monthly security reports co-branded with your protocol',
      placement: 'Email Newsletter + Blog + Social',
      visual: [
        '┌─── MONTHLY SECURITY REPORT ─────────┐',
        '│                                     │',
        '│  DeFiJerusalem × [Your Protocol]    │',
        '│                                     │',
        '│  📊 [Month] Security Analysis       │',
        '│                                     │',
        '│  Executive Summary:                 │',
        '│  • Protocols scanned: 6,651         │',
        '│  • Threats detected: 127            │',
        '│  • [Your Protocol]: SAFE ✓          │',
        '│                                     │',
        '│  [Your Protocol] Highlights:        │',
        '│  ✓ Zero critical vulnerabilities    │',
        '│  ✓ Smart contracts audited          │',
        '│  ✓ Bug bounty program active        │',
        '│  ✓ 95/100 security score            │',
        '│                                     │',
        '│  Industry Threats This Month:       │',
        '│  • Phishing attacks: +15%           │',
        '│  • Rug pulls: 8 detected            │',
        '│  • Smart contract exploits: 3       │',
        '│                                     │',
        '│  Why [Your Protocol] is Safe:       │',
        '│  [Detailed security analysis]       │',
        '│                                     │',
        '│  [Read Full Report]                 │',
        '└─────────────────────────────────────┘',
        '',
        'Distribution:',
        '• 10,000+ email subscribers',
        '• Posted on blog (SEO value)',
        '• Shared on all social channels',
        '• PDF download for your marketing',
      ],
      impact: 'Thought leadership positioning, co-marketing value',
    },
    {
      title: '6. White-Label Partnership Opportunities',
      description: 'Embed DeFiJerusalem security data in your own app',
      placement: 'Your Protocol Dashboard/Website',
      visual: [
        'Option A: Security Widget',
        '┌─────────────────────────────────────┐',
        '│ Your Protocol Dashboard             │',
        '│                                     │',
        '│ [Your content...]                   │',
        '│                                     │',
        '│ ┌─ Security Score ─────────────┐    │',
        '│ │ Powered by DeFiJerusalem     │    │',
        '│ │                              │    │',
        '│ │ 🛡️  95/100 SAFE              │    │',
        '│ │                              │    │',
        '│ │ ✓ No critical threats        │    │',
        '│ │ ✓ Audited contracts          │    │',
        '│ │ ✓ Active monitoring          │    │',
        '│ └──────────────────────────────┘    │',
        '└─────────────────────────────────────┘',
        '',
        'Option B: Partner Badge',
        '┌─────────────────────────────────────┐',
        '│ Your Website Footer                 │',
        '│                                     │',
        '│ [Links] [Social] [Contact]          │',
        '│                                     │',
        '│ Secured by:                         │',
        '│ [DeFiJerusalem Logo]                │',
        '│ "Trusted Security Partner"          │',
        '└─────────────────────────────────────┘',
        '',
        'Option C: API Integration',
        '• Real-time security score API',
        '• Threat detection alerts',
        '• Community trust ratings',
        '• Custom branded dashboard',
      ],
      impact: 'Enhance your own product with security credibility',
    },
    {
      title: '7. Quarterly Strategy Sessions',
      description: 'Direct access to DeFiJerusalem leadership for strategic planning',
      placement: 'Private Video Calls',
      visual: [
        'Q1 Strategy Session Agenda:',
        '─────────────────────────────',
        '',
        '1. Performance Review (30 min)',
        '   • Traffic & conversion metrics',
        '   • Social media performance',
        '   • ROI analysis',
        '   • Competitive positioning',
        '',
        '2. Market Insights (20 min)',
        '   • DeFi trends we\'re seeing',
        '   • Emerging threats',
        '   • User behavior patterns',
        '   • Competitor movements',
        '',
        '3. Strategic Planning (30 min)',
        '   • Q2 campaign ideas',
        '   • Content calendar',
        '   • Partnership opportunities',
        '   • Product launch support',
        '',
        '4. Custom Initiatives (20 min)',
        '   • Special projects',
        '   • Co-marketing campaigns',
        '   • Event sponsorships',
        '   • Press opportunities',
        '',
        'Quarterly Deliverables:',
        '✓ Custom strategy deck',
        '✓ Competitive analysis report',
        '✓ Next quarter roadmap',
        '✓ Priority action items',
      ],
      impact: 'Strategic partnership, not just advertising',
    },
  ],
  implementationSteps: [
    'Step 1: Premium Partner Onboarding (Week 1)',
    '  • Kickoff call with executive team',
    '  • Comprehensive brand guideline review',
    '  • Define 90-day strategic objectives',
    '  • Assign dedicated account manager',
    '',
    'Step 2: Custom Landing Page Development (Weeks 1-2)',
    '  • Wireframe approval',
    '  • Content creation and review',
    '  • Design customization',
    '  • Tutorial video integration',
    '  • SEO optimization',
    '  • Preview and final approval',
    '',
    'Step 3: Homepage Banner Design (Week 2)',
    '  • Creative concept presentation',
    '  • Design 3 banner variations',
    '  • A/B testing plan',
    '  • Mobile optimization',
    '  • Launch and monitoring',
    '',
    'Step 4: Content Calendar Creation (Week 2)',
    '  • Map weekly Twitter thread topics',
    '  • Schedule co-branded reports',
    '  • Plan community showcases',
    '  • Coordinate with your marketing team',
    '',
    'Step 5: White-Label Integration (Weeks 2-4)',
    '  • Technical requirements gathering',
    '  • API key provisioning',
    '  • Widget customization',
    '  • Testing and QA',
    '  • Go-live support',
    '',
    'Step 6: First Month Execution (Weeks 3-4)',
    '  • Homepage banner goes live',
    '  • Landing page published',
    '  • Week 1 Twitter thread posted',
    '  • First co-branded report drafted',
    '  • Analytics tracking activated',
    '',
    'Step 7: Monthly Optimization (Ongoing)',
    '  • Weekly performance check-ins',
    '  • Monthly detailed reporting',
    '  • Quarterly strategy sessions',
    '  • Continuous A/B testing',
    '  • Content calendar updates',
  ],
  beforeAfter: {
    before: 'BEFORE Premium Tier:\n\n• Good visibility\n• Some social presence\n• Standard analytics\n• 2,000 monthly visitors\n• 5% conversion rate\n• Limited partnership value',
    after: 'AFTER Premium Tier:\n\n• Maximum visibility everywhere\n• Dominant social presence\n• White-label integration\n• 10,000-20,000 monthly visitors\n• 8-12% conversion rate\n• Strategic partnership value',
  },
  roiMetrics: {
    impressions: '500,000+ monthly impressions',
    traffic: '10,000-20,000 qualified visitors/month',
    conversions: '8-12% user conversion rate',
    socialReach: '500,000+ social media reach',
  },
};

function createHeader(doc: PDFKit.PDFDocument, title: string, subtitle: string) {
  // DeFiJerusalem branding
  doc
    .fontSize(28)
    .fillColor(BRAND_COLORS.text)
    .font('Helvetica-Bold')
    .text('DeFiJerusalem', 50, 50);

  doc
    .fontSize(10)
    .fillColor(BRAND_COLORS.lightGray)
    .font('Helvetica')
    .text('The Trusted Source for DeFi Protocols & Security', 50, 85);

  // Title
  doc
    .fontSize(22)
    .fillColor(BRAND_COLORS.text)
    .font('Helvetica-Bold')
    .text(title, 50, 120);

  // Subtitle
  if (subtitle) {
    doc
      .fontSize(12)
      .fillColor(BRAND_COLORS.lightGray)
      .font('Helvetica')
      .text(subtitle, 50, 148);
  }
}

function drawBox(doc: PDFKit.PDFDocument, x: number, y: number, width: number, height: number, color: string) {
  doc
    .rect(x, y, width, height)
    .lineWidth(2)
    .strokeColor(color)
    .stroke();
}

function createEnhancedPDF(tier: TierData, filename: string) {
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 50, bottom: 50, left: 50, right: 50 },
  });

  const outputPath = path.join(process.cwd(), 'pitch-decks', filename);
  
  if (!fs.existsSync(path.join(process.cwd(), 'pitch-decks'))) {
    fs.mkdirSync(path.join(process.cwd(), 'pitch-decks'), { recursive: true });
  }

  doc.pipe(fs.createWriteStream(outputPath));

  // PAGE 1: Cover with Tagline
  createHeader(doc, `${tier.name} Tier Partnership`, tier.price);

  doc
    .fontSize(16)
    .fillColor(tier.color)
    .font('Helvetica-Bold')
    .text(tier.tagline, 50, 190, { width: 500 });

  // Key metrics box
  drawBox(doc, 50, 230, 500, 120, tier.color);
  
  doc
    .fontSize(11)
    .fillColor(BRAND_COLORS.text)
    .font('Helvetica-Bold')
    .text('WHAT YOU GET:', 65, 245);

  doc
    .fontSize(10)
    .fillColor(BRAND_COLORS.text)
    .font('Helvetica')
    .text(`• ${tier.roiMetrics.impressions}`, 65, 265)
    .text(`• ${tier.roiMetrics.traffic}`, 65, 280)
    .text(`• ${tier.roiMetrics.conversions}`, 65, 295)
    .text(`• ${tier.roiMetrics.socialReach}`, 65, 310);

  // Platform stats
  let yPos = 380;
  doc
    .fontSize(14)
    .fillColor(BRAND_COLORS.text)
    .font('Helvetica-Bold')
    .text('Why DeFiJerusalem?', 50, yPos);

  const platformStats = [
    '6,651+ DeFi protocols tracked across 126+ blockchains',
    '38+ threat detection categories with AI-powered analysis',
    'Security-conscious audience actively seeking trusted protocols',
    'Enterprise-grade SEO driving organic discovery traffic',
  ];

  yPos = 410;
  platformStats.forEach((stat) => {
    doc
      .fontSize(10)
      .fillColor(BRAND_COLORS.text)
      .font('Helvetica')
      .text('•', 50, yPos)
      .text(stat, 65, yPos, { width: 480 });
    yPos += 25;
  });

  // PAGE 2-X: Visual Features (each feature gets detailed treatment)
  tier.visualFeatures.forEach((feature, index) => {
    doc.addPage();
    
    doc
      .fontSize(18)
      .fillColor(tier.color)
      .font('Helvetica-Bold')
      .text(feature.title, 50, 50);

    doc
      .fontSize(11)
      .fillColor(BRAND_COLORS.text)
      .font('Helvetica')
      .text(feature.description, 50, 80, { width: 500 });

    // Placement info
    doc
      .fontSize(10)
      .fillColor(BRAND_COLORS.lightGray)
      .font('Helvetica-Bold')
      .text(`📍 PLACEMENT: ${feature.placement}`, 50, 115);

    // Visual mockup box
    drawBox(doc, 50, 140, 500, feature.visual.length * 12 + 20, tier.color);
    
    doc
      .fontSize(9)
      .fillColor(BRAND_COLORS.text)
      .font('Courier')
      .text(feature.visual.join('\n'), 60, 150, { width: 480 });

    // Impact statement
    const impactY = 150 + (feature.visual.length * 12) + 40;
    doc
      .fontSize(11)
      .fillColor(tier.color)
      .font('Helvetica-Bold')
      .text('💡 IMPACT:', 50, impactY);

    doc
      .fontSize(10)
      .fillColor(BRAND_COLORS.text)
      .font('Helvetica')
      .text(feature.impact, 50, impactY + 20, { width: 500 });
  });

  // PAGE: Before & After Comparison
  doc.addPage();
  doc
    .fontSize(20)
    .fillColor(BRAND_COLORS.text)
    .font('Helvetica-Bold')
    .text('Before & After Comparison', 50, 50);

  // Before box
  drawBox(doc, 50, 100, 240, 300, BRAND_COLORS.darkGray);
  doc
    .fontSize(12)
    .fillColor(BRAND_COLORS.darkGray)
    .font('Helvetica-Bold')
    .text('WITHOUT ' + tier.name.toUpperCase(), 60, 110);

  doc
    .fontSize(9)
    .fillColor(BRAND_COLORS.text)
    .font('Helvetica')
    .text(tier.beforeAfter.before, 60, 135, { width: 220 });

  // After box
  drawBox(doc, 310, 100, 240, 300, tier.color);
  doc
    .fontSize(12)
    .fillColor(tier.color)
    .font('Helvetica-Bold')
    .text('WITH ' + tier.name.toUpperCase(), 320, 110);

  doc
    .fontSize(9)
    .fillColor(BRAND_COLORS.text)
    .font('Helvetica')
    .text(tier.beforeAfter.after, 320, 135, { width: 220 });

  // PAGE: Implementation Guide
  doc.addPage();
  doc
    .fontSize(20)
    .fillColor(BRAND_COLORS.text)
    .font('Helvetica-Bold')
    .text('Implementation Guide', 50, 50);

  doc
    .fontSize(11)
    .fillColor(BRAND_COLORS.lightGray)
    .font('Helvetica')
    .text('From signup to go-live in 7 days or less', 50, 80);

  yPos = 120;
  tier.implementationSteps.forEach((step) => {
    if (yPos > 700) {
      doc.addPage();
      yPos = 50;
    }

    if (step.startsWith('Step')) {
      doc
        .fontSize(11)
        .fillColor(tier.color)
        .font('Helvetica-Bold')
        .text(step, 50, yPos);
      yPos += 18;
    } else if (step === '') {
      yPos += 10;
    } else {
      doc
        .fontSize(9)
        .fillColor(BRAND_COLORS.text)
        .font('Helvetica')
        .text(step, 60, yPos, { width: 480 });
      yPos += 15;
    }
  });

  // PAGE: Success Metrics
  doc.addPage();
  doc
    .fontSize(20)
    .fillColor(BRAND_COLORS.text)
    .font('Helvetica-Bold')
    .text('Expected Results', 50, 50);

  const metrics = [
    { label: 'Monthly Impressions', value: tier.roiMetrics.impressions },
    { label: 'Qualified Traffic', value: tier.roiMetrics.traffic },
    { label: 'User Conversion Rate', value: tier.roiMetrics.conversions },
    { label: 'Social Media Reach', value: tier.roiMetrics.socialReach },
  ];

  yPos = 120;
  metrics.forEach((metric) => {
    drawBox(doc, 50, yPos, 500, 60, tier.color);
    
    doc
      .fontSize(11)
      .fillColor(BRAND_COLORS.lightGray)
      .font('Helvetica')
      .text(metric.label, 65, yPos + 15);

    doc
      .fontSize(16)
      .fillColor(tier.color)
      .font('Helvetica-Bold')
      .text(metric.value, 65, yPos + 32);

    yPos += 75;
  });

  // PAGE: Call to Action
  doc.addPage();
  doc
    .fontSize(26)
    .fillColor(tier.color)
    .font('Helvetica-Bold')
    .text('Ready to Get Started?', 50, 200, { align: 'center', width: 500 });

  doc
    .fontSize(13)
    .fillColor(BRAND_COLORS.text)
    .font('Helvetica')
    .text(
      `Join the ${tier.name} Tier and start driving qualified users to your protocol.`,
      50,
      260,
      { align: 'center', width: 500 }
    );

  // Contact info
  yPos = 340;
  const contacts = [
    'Partnerships: partnerships@defijerusalem.com',
    'Telegram: t.me/gibbie03',
    'Website: defijerusalem.com',
  ];

  contacts.forEach((contact) => {
    doc
      .fontSize(11)
      .fillColor(BRAND_COLORS.text)
      .font('Helvetica')
      .text(contact, 50, yPos, { align: 'center', width: 500 });
    yPos += 25;
  });

  doc
    .fontSize(10)
    .fillColor(BRAND_COLORS.lightGray)
    .font('Helvetica-Oblique')
    .text('Schedule a call to see live examples and discuss your specific goals', 50, 450, {
      align: 'center',
      width: 500,
    });

  doc.end();
  console.log(`✓ Generated: ${filename}`);
}

// Generate all enhanced PDFs
console.log('Generating Enhanced DeFiJerusalem Pitch Decks with Visual Mockups...\n');

createEnhancedPDF(FEATURED_TIER, 'defijerusalem-featured-tier-visual-guide.pdf');
createEnhancedPDF(SPONSORED_TIER, 'defijerusalem-sponsored-tier-visual-guide.pdf');
createEnhancedPDF(PREMIUM_TIER, 'defijerusalem-premium-tier-visual-guide.pdf');

console.log('\n✨ All enhanced pitch decks generated successfully in ./pitch-decks/');
console.log('\nThese pitch decks include:');
console.log('  • Detailed visual mockups of each feature');
console.log('  • Exact placement descriptions');
console.log('  • Before/after comparisons');
console.log('  • Step-by-step implementation guides');
console.log('  • Expected ROI metrics');
