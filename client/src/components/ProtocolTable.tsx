import { useState, useMemo, memo, useCallback } from 'react';
import { Shield, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import MiniSparkline from '@/components/MiniSparkline';
import type { Protocol, SecurityScan } from '@shared/schema';

interface ProtocolTableProps {
  protocols: Protocol[];
  securityScans: Record<string, SecurityScan>;
  onViewDetails: (protocol: Protocol) => void;
}

// Memoized sparkline data cache - generate once per protocol ID
const sparklineCache = new Map<string, number[]>();

const generateSparklineData = (protocolId: string, change24h: number): number[] => {
  if (sparklineCache.has(protocolId)) {
    return sparklineCache.get(protocolId)!;
  }
  
  const baseValue = 100;
  const volatility = Math.abs(change24h) / 10;
  const trend = change24h > 0 ? 1 : -1;
  
  const data = Array.from({ length: 7 }, (_, i) => {
    const trendEffect = (i / 6) * change24h * trend;
    const randomness = (Math.random() - 0.5) * volatility;
    return baseValue + trendEffect + randomness;
  });
  
  sparklineCache.set(protocolId, data);
  return data;
};

// Memoized table row component
const ProtocolRow = memo(({ 
  protocol, 
  index, 
  scan, 
  isWatchlisted, 
  onToggleWatchlist, 
  onViewDetails 
}: { 
  protocol: Protocol; 
  index: number; 
  scan: SecurityScan | undefined; 
  isWatchlisted: boolean;
  onToggleWatchlist: (id: string) => void;
  onViewDetails: (protocol: Protocol) => void;
}) => {
  const isPositiveChange = protocol.change24h >= 0;
  const sparklineData = useMemo(
    () => generateSparklineData(protocol.id, protocol.change24h),
    [protocol.id, protocol.change24h]
  );
  const sevenDayChange = protocol.change24h * 1.2;
  
  const formatTVL = (tvl: number): string => {
    if (tvl === 0) return 'No Data';
    if (tvl >= 1_000_000_000) {
      return `$${(tvl / 1_000_000_000).toFixed(2)}B`;
    } else if (tvl >= 1_000_000) {
      return `$${(tvl / 1_000_000).toFixed(2)}M`;
    } else if (tvl >= 1_000) {
      return `$${(tvl / 1_000).toFixed(2)}K`;
    }
    return `$${tvl.toFixed(2)}`;
  };

  const formatExactTVL = (tvl: number): string => {
    if (tvl === 0) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(tvl);
  };

  const getSecurityBadge = (score: number) => {
    if (score >= 90) {
      return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">{score}</Badge>;
    } else if (score >= 70) {
      return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">{score}</Badge>;
    } else if (score >= 50) {
      return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">{score}</Badge>;
    } else if (score >= 30) {
      return <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20">{score}</Badge>;
    }
    return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">{score}</Badge>;
  };

  return (
    <tr 
      className="border-b border-border hover:bg-muted/50 transition-colors cursor-pointer"
      onClick={() => onViewDetails(protocol)}
      data-testid={`protocol-row-${protocol.id}`}
    >
      {/* Watchlist Star */}
      <td className="px-3 py-4" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => onToggleWatchlist(protocol.id)}
          className="hover-elevate p-1 rounded"
          data-testid={`button-watchlist-${protocol.id}`}
        >
          <Star 
            className={`w-4 h-4 ${isWatchlisted ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground'}`}
          />
        </button>
      </td>

      {/* Rank */}
      <td className="px-3 py-4 text-sm font-semibold text-muted-foreground">
        {index + 1}
      </td>
      
      {/* Name & Logo */}
      <td className="px-3 py-4">
        <div className="flex items-center gap-3">
          {protocol.logo ? (
            <img 
              src={protocol.logo} 
              alt={protocol.name}
              className="w-6 h-6 rounded-full"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
              <Shield className="w-3 h-3 text-primary" />
            </div>
          )}
          <div>
            <div className="font-semibold text-sm">{protocol.name}</div>
            <div className="text-xs text-muted-foreground">{protocol.category}</div>
          </div>
        </div>
      </td>
      
      {/* Price (TVL) */}
      <td className="px-3 py-4 text-right">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="font-semibold cursor-help">{formatTVL(protocol.tvl)}</div>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p className="font-mono">{formatExactTVL(protocol.tvl)}</p>
          </TooltipContent>
        </Tooltip>
      </td>
      
      {/* 24h Change */}
      <td className="px-3 py-4 text-right">
        <div className={`font-semibold ${
          isPositiveChange ? 'text-green-500' : 'text-red-500'
        }`}>
          {isPositiveChange ? '+' : ''}{protocol.change24h.toFixed(2)}%
        </div>
      </td>

      {/* 7d Change */}
      <td className="px-3 py-4 text-right">
        <div className={`font-semibold ${
          sevenDayChange >= 0 ? 'text-green-500' : 'text-red-500'
        }`}>
          {sevenDayChange >= 0 ? '+' : ''}{sevenDayChange.toFixed(2)}%
        </div>
      </td>

      {/* Market Cap (using TVL as proxy) */}
      <td className="px-3 py-4 text-right">
        <div className="text-sm text-foreground">{formatTVL(protocol.tvl)}</div>
      </td>

      {/* Sparkline Chart */}
      <td className="px-3 py-4 text-right">
        <div className="flex justify-end">
          <MiniSparkline data={sparklineData} width={100} height={40} />
        </div>
      </td>
      
      {/* Security Score */}
      <td className="px-3 py-4 text-center" onClick={(e) => e.stopPropagation()}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex justify-center">
              {getSecurityBadge(protocol.securityScore)}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Security Score: {protocol.securityScore}/100</p>
            {scan?.isBlacklisted && <p className="text-xs text-destructive mt-1">Flagged as High Risk</p>}
          </TooltipContent>
        </Tooltip>
      </td>
    </tr>
  );
});

ProtocolRow.displayName = 'ProtocolRow';

export default function ProtocolTable({ 
  protocols, 
  securityScans, 
  onViewDetails 
}: ProtocolTableProps) {
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 100; // CoinMarketCap-style pagination

  const toggleWatchlist = useCallback((protocolId: string) => {
    setWatchlist(prev => {
      const newSet = new Set(prev);
      if (newSet.has(protocolId)) {
        newSet.delete(protocolId);
      } else {
        newSet.add(protocolId);
      }
      return newSet;
    });
  }, []);

  // Pagination
  const totalPages = Math.ceil(protocols.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProtocols = protocols.slice(startIndex, endIndex);

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="overflow-x-auto bg-card rounded-lg border border-border">
          <table className="w-full" data-testid="protocol-table">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-3 py-3 text-xs font-semibold text-muted-foreground w-12"></th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-muted-foreground">#</th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-muted-foreground">Name</th>
                <th className="text-right px-3 py-3 text-xs font-semibold text-muted-foreground">Price (TVL)</th>
                <th className="text-right px-3 py-3 text-xs font-semibold text-muted-foreground">24h %</th>
                <th className="text-right px-3 py-3 text-xs font-semibold text-muted-foreground">7d %</th>
                <th className="text-right px-3 py-3 text-xs font-semibold text-muted-foreground">Market Cap</th>
                <th className="text-right px-3 py-3 text-xs font-semibold text-muted-foreground">Last 7 Days</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-muted-foreground">Security</th>
              </tr>
            </thead>
            <tbody>
              {currentProtocols.map((protocol, index) => (
                <ProtocolRow
                  key={protocol.id}
                  protocol={protocol}
                  index={startIndex + index}
                  scan={securityScans[protocol.id]}
                  isWatchlisted={watchlist.has(protocol.id)}
                  onToggleWatchlist={toggleWatchlist}
                  onViewDetails={onViewDetails}
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1}-{Math.min(endIndex, protocols.length)} of {protocols.length} protocols
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                data-testid="button-prev-page"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                data-testid="button-next-page"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
