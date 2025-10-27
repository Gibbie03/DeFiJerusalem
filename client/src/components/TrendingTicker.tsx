import { useQuery } from '@tanstack/react-query';
import type { Protocol } from '@shared/schema';
import { TrendingUp } from 'lucide-react';

export default function TrendingTicker() {
  const { data: protocols = [] } = useQuery<Protocol[]>({
    queryKey: ['/api/protocols/trending'],
    refetchInterval: 60000, // Refresh every minute
  });

  // Top 10 trending protocols
  const trending = protocols.slice(0, 10);

  if (trending.length === 0) return null;

  return (
    <div className="bg-muted/30 border-b border-border overflow-hidden">
      <div className="flex items-center gap-3 px-4 sm:px-6 py-2.5">
        <TrendingUp className="w-4 h-4 text-primary flex-shrink-0" />
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex-shrink-0">Trending</span>
        <div className="flex-1 overflow-hidden">
          <div className="animate-scroll-left flex gap-6 whitespace-nowrap" data-testid="trending-ticker">
            {[...trending, ...trending].map((protocol, index) => (
              <div key={`${protocol.id}-${index}`} className="inline-flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">{protocol.name}</span>
                <span className={`text-xs font-semibold ${protocol.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {protocol.change24h >= 0 ? '+' : ''}{protocol.change24h.toFixed(2)}%
                </span>
                <span className="text-xs text-muted-foreground font-medium">
                  ${(protocol.tvl / 1e9).toFixed(2)}B
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
