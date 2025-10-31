import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import type { Protocol } from '@shared/schema';
import { TrendingUp } from 'lucide-react';
import { useEffect, useRef } from 'react';

const formatTVL = (tvl: number): string => {
  if (tvl === 0) return 'No Data';
  if (tvl >= 1_000_000_000_000) {
    return `$${(tvl / 1_000_000_000_000).toFixed(2)}T`;
  } else if (tvl >= 1_000_000_000) {
    return `$${(tvl / 1_000_000_000).toFixed(2)}B`;
  } else if (tvl >= 1_000_000) {
    return `$${(tvl / 1_000_000).toFixed(2)}M`;
  } else if (tvl >= 1_000) {
    return `$${(tvl / 1_000).toFixed(2)}K`;
  }
  return `$${tvl.toFixed(2)}`;
};

export default function TrendingTicker() {
  const { data: protocols = [] } = useQuery<Protocol[]>({
    queryKey: ['/api/protocols/trending'],
    refetchInterval: 60000, // Refresh every minute
  });

  const mobileTickerRef = useRef<HTMLDivElement>(null);
  const desktopTickerRef = useRef<HTMLDivElement>(null);

  // Ensure protocols is always an array
  const protocolsArray = Array.isArray(protocols) ? protocols : [];
  
  // Top 10 trending protocols
  const trending = protocolsArray.slice(0, 10);
  

  // Calculate animation duration: scroll all content completely off screen
  useEffect(() => {
    // Use setTimeout to ensure elements are rendered before measuring
    const timeoutId = setTimeout(() => {
      const mobileElement = mobileTickerRef.current;
      const desktopElement = desktopTickerRef.current;

      // Calculate duration: entire content width scrolls past
      const calculateDuration = (element: HTMLElement, pixelsPerSecond: number) => {
        const totalWidth = element.scrollWidth; // Full width of all protocols
        const duration = totalWidth / pixelsPerSecond;
        return duration;
      };

      if (mobileElement && mobileElement.scrollWidth > 0) {
        // Mobile (Redmi Note 12): 30 pixels/second for very slow, readable scrolling
        const duration = calculateDuration(mobileElement, 30);
        mobileElement.style.animationDuration = `${duration}s`;
      }

      if (desktopElement && desktopElement.scrollWidth > 0) {
        // Desktop: 60 pixels/second for comfortable reading
        const duration = calculateDuration(desktopElement, 60);
        desktopElement.style.animationDuration = `${duration}s`;
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [trending]);

  if (trending.length === 0) return null;

  const renderProtocol = (protocol: Protocol, index: number, totalLength: number) => {
    const rank = (index % totalLength) + 1;
    return (
      <Link
        key={`${protocol.id}-${index}`}
        href={`/protocol/${protocol.id}`}
        className="inline-flex items-center gap-1.5 sm:gap-2 hover-elevate active-elevate-2 px-1.5 sm:px-2 py-1 rounded transition-colors text-xs sm:text-sm"
        data-testid={`trending-protocol-${protocol.id}`}
      >
        <span className="font-bold text-primary/60 min-w-[1.2rem] sm:min-w-[1.5rem]">#{rank}</span>
        <span className="font-semibold text-foreground">{protocol.name}</span>
        <span className={`font-semibold ${protocol.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {protocol.change24h >= 0 ? '+' : ''}{protocol.change24h.toFixed(2)}%
        </span>
        <span className="text-muted-foreground font-medium hidden xs:inline">
          {formatTVL(protocol.tvl)}
        </span>
      </Link>
    );
  };

  return (
    <div className="bg-muted/30 border-b border-border overflow-hidden">
      <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-6 py-2.5">
        <TrendingUp className="w-4 h-4 text-primary flex-shrink-0" />
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex-shrink-0 hidden sm:inline">Trending</span>
        
        {/* Mobile version: Scroll all 10 protocols completely, then reset */}
        <div className="flex-1 overflow-hidden sm:hidden relative">
          <div className="flex">
            <div ref={mobileTickerRef} className="animate-ticker-mobile flex gap-3 whitespace-nowrap" data-testid="trending-ticker">
              {trending.map((protocol, index) => 
                renderProtocol(protocol, index, trending.length)
              )}
            </div>
            {/* Duplicate for seamless loop appearance */}
            <div className="flex gap-3 whitespace-nowrap ml-3">
              {trending.slice(0, 3).map((protocol, index) => 
                renderProtocol(protocol, index, trending.length)
              )}
            </div>
          </div>
        </div>

        {/* Desktop version: Scroll all 10 protocols completely, then reset */}
        <div className="flex-1 overflow-hidden hidden sm:block relative">
          <div className="flex">
            <div ref={desktopTickerRef} className="animate-ticker-desktop flex gap-6 whitespace-nowrap" data-testid="trending-ticker">
              {trending.map((protocol, index) => 
                renderProtocol(protocol, index, trending.length)
              )}
            </div>
            {/* Duplicate for seamless loop appearance */}
            <div className="flex gap-6 whitespace-nowrap ml-6">
              {trending.slice(0, 3).map((protocol, index) => 
                renderProtocol(protocol, index, trending.length)
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
