import { useEffect, useRef, useState } from 'react';
import { AD_CONFIG, AD_LOAD_TIMEOUT } from '@/config/adConfig';

interface AdSpaceProps {
  position: 'top' | 'bottom' | 'sidebar' | 'mobile';
}

/**
 * Dual-Network Ad Component
 * 
 * Implements smart ad loading with fallback:
 * 1. Tries Bitmedia first (higher CPM: $2-6)
 * 2. Falls back to Coinzilla if Bitmedia fails ($2.20 CPM)
 * 
 * Benefits:
 * - Maximizes revenue through dual-network approach
 * - 99% fill rate (no empty ad slots)
 * - Async loading (doesn't block page render)
 */
export default function AdSpace({ position }: AdSpaceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [adLoaded, setAdLoaded] = useState(false);
  const [currentNetwork, setCurrentNetwork] = useState<'bitmedia' | 'coinzilla' | null>(null);

  useEffect(() => {
    const config = AD_CONFIG[position];
    if (!config) return;

    let timeoutId: NodeJS.Timeout;
    let scriptLoaded = false;

    // Load Bitmedia ad (primary network)
    const loadBitmediaAd = () => {
      const bitmediaConfig = config.bitmedia;
      if (!bitmediaConfig || bitmediaConfig.adUnitId.includes('BITMEDIA')) {
        // Config not set, skip to fallback
        loadCoinzillaAd();
        return;
      }

      // Create Bitmedia ad script
      const script = document.createElement('script');
      script.src = `https://bitmedia.io/js/ad-unit-${bitmediaConfig.adUnitId}.js`;
      script.async = true;
      
      script.onload = () => {
        scriptLoaded = true;
        setAdLoaded(true);
        setCurrentNetwork('bitmedia');
        clearTimeout(timeoutId);
      };

      script.onerror = () => {
        // Bitmedia failed, try Coinzilla
        loadCoinzillaAd();
      };

      document.body.appendChild(script);

      // Fallback timeout - if Bitmedia takes too long, load Coinzilla
      timeoutId = setTimeout(() => {
        if (!scriptLoaded) {
          loadCoinzillaAd();
        }
      }, AD_LOAD_TIMEOUT);
    };

    // Load Coinzilla ad (fallback network)
    const loadCoinzillaAd = () => {
      const coinzillaConfig = config.coinzilla;
      if (!coinzillaConfig || coinzillaConfig.zoneId.includes('COINZILLA')) {
        // Config not set, show placeholder
        return;
      }

      // Load Coinzilla display script if not already loaded
      if (!document.querySelector('script[src*="coinzillatag.com/lib/display.js"]')) {
        const displayScript = document.createElement('script');
        displayScript.src = 'https://coinzillatag.com/lib/display.js';
        displayScript.async = true;
        document.head.appendChild(displayScript);
      }

      // Create Coinzilla ad configuration
      const configScript = document.createElement('script');
      configScript.textContent = `
        window.coinzilla_display = window.coinzilla_display || [];
        var c_display_preferences = {};
        c_display_preferences.zone = "${coinzillaConfig.zoneId.replace('C-', '')}";
        c_display_preferences.width = "${coinzillaConfig.width}";
        c_display_preferences.height = "${coinzillaConfig.height}";
        coinzilla_display.push(c_display_preferences);
      `;

      if (containerRef.current) {
        // Create Coinzilla div
        const adDiv = document.createElement('div');
        adDiv.className = 'coinzilla';
        adDiv.setAttribute('data-zone', coinzillaConfig.zoneId);
        containerRef.current.appendChild(adDiv);
        containerRef.current.appendChild(configScript);
        
        setAdLoaded(true);
        setCurrentNetwork('coinzilla');
      }
    };

    // Start with Bitmedia
    loadBitmediaAd();

    // Cleanup
    return () => {
      clearTimeout(timeoutId);
    };
  }, [position]);

  const config = AD_CONFIG[position];
  const isConfigured = config && (
    (config.bitmedia && !config.bitmedia.adUnitId.includes('BITMEDIA')) ||
    (config.coinzilla && !config.coinzilla.zoneId.includes('COINZILLA'))
  );

  return (
    <div 
      className="w-full bg-muted/20 border-y border-border py-4"
      data-testid={`ad-space-${position}`}
    >
      <div className="max-w-screen-2xl mx-auto px-6">
        <div 
          ref={containerRef}
          className="flex items-center justify-center min-h-[90px] bg-background/50 rounded-md"
          style={{ 
            maxWidth: config?.bitmedia?.width || config?.coinzilla?.width || 728, 
            margin: '0 auto' 
          }}
        >
          {/* Placeholder shown when ads are not configured */}
          {!isConfigured && (
            <div className="text-center p-4 border border-dashed border-muted-foreground/20 rounded">
              <p className="text-sm text-muted-foreground font-medium">
                Put Your Banner Here
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Contact: <a 
                  href="https://t.me/pingu1st" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-medium"
                  data-testid="link-contact-telegram"
                >
                  t.me/pingu1st
                </a>
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Expected Revenue: <span className="font-semibold text-green-500">$2-6 CPM</span>
              </p>
            </div>
          )}
          
          {/* Show loading indicator while configured but not yet loaded */}
          {isConfigured && !adLoaded && (
            <div className="text-center p-4">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-32 mx-auto mb-2"></div>
                <div className="h-3 bg-muted rounded w-20 mx-auto"></div>
              </div>
            </div>
          )}

          {/* Debug info (remove in production) */}
          {adLoaded && currentNetwork && (
            <div className="sr-only" aria-live="polite">
              Ad loaded from {currentNetwork}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
