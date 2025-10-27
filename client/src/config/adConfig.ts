/**
 * Ad Network Configuration for JERUSALEM DeFi Security Scanner
 * 
 * Dual-network setup for maximum revenue:
 * - Primary: Bitmedia (Higher CPM: $2-6)
 * - Secondary: Coinzilla (Fallback CPM: ~$2.20)
 * 
 * Setup Instructions:
 * 1. Sign up at both platforms:
 *    - Bitmedia: https://bitmedia.io/become-a-publisher
 *    - Coinzilla: https://coinzilla.com/publishers/
 * 
 * 2. Create ad units/zones:
 *    - Bitmedia: Dashboard → New Ad Unit → Get ad unit ID
 *    - Coinzilla: Dashboard → Create Zone → Get zone ID (format: C-XXXXX...)
 * 
 * 3. Replace placeholder IDs below with your actual IDs
 * 
 * 4. Optional: Set CPM floor rates in your dashboards for higher revenue
 */

export interface AdUnitConfig {
  bitmedia?: {
    adUnitId: string;
    width: number;
    height: number;
  };
  coinzilla?: {
    zoneId: string;
    width: number;
    height: number;
  };
}

export const AD_CONFIG: Record<string, AdUnitConfig> = {
  // Top banner - Wide leaderboard (728x90) for desktop
  top: {
    bitmedia: {
      adUnitId: 'BITMEDIA_TOP_UNIT_ID', // Replace with actual unit ID from dashboard
      width: 728,
      height: 90,
    },
    coinzilla: {
      zoneId: 'C-COINZILLA_TOP_ZONE_ID', // Replace with actual zone ID (format: C-XXXXX...)
      width: 728,
      height: 90,
    },
  },

  // Sidebar - Medium rectangle (300x250)
  sidebar: {
    bitmedia: {
      adUnitId: 'BITMEDIA_SIDEBAR_UNIT_ID',
      width: 300,
      height: 250,
    },
    coinzilla: {
      zoneId: 'C-COINZILLA_SIDEBAR_ZONE_ID',
      width: 300,
      height: 250,
    },
  },

  // Bottom banner - Wide leaderboard (728x90)
  bottom: {
    bitmedia: {
      adUnitId: 'BITMEDIA_BOTTOM_UNIT_ID',
      width: 728,
      height: 90,
    },
    coinzilla: {
      zoneId: 'C-COINZILLA_BOTTOM_ZONE_ID',
      width: 728,
      height: 90,
    },
  },

  // Mobile banner - Mobile banner (320x100)
  mobile: {
    bitmedia: {
      adUnitId: 'BITMEDIA_MOBILE_UNIT_ID',
      width: 320,
      height: 100,
    },
    coinzilla: {
      zoneId: 'C-COINZILLA_MOBILE_ZONE_ID',
      width: 320,
      height: 100,
    },
  },
};

/**
 * Ad network priority order
 * Primary network loads first, fallback loads if primary fails
 */
export const AD_NETWORK_PRIORITY = {
  primary: 'bitmedia',
  fallback: 'coinzilla',
} as const;

/**
 * Ad loading timeout (ms)
 * If primary network doesn't load within this time, load fallback
 */
export const AD_LOAD_TIMEOUT = 3000;
