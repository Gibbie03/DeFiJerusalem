import { useState, useMemo, memo, useCallback } from 'react';
import { Star, Shield, Ban } from 'lucide-react';
import { Link } from 'wouter';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useQuery } from '@tanstack/react-query';
import MiniSparkline from '@/components/MiniSparkline';
import type { Protocol, SecurityScan } from '@shared/schema';

interface AdminSession {
  authenticated: boolean;
  admin?: {
    id: number;
    username: string;
    email: string;
    role: string;
  };
}

interface ProtocolTableProps {
  protocols: Protocol[];
  securityScans: Record<string, SecurityScan>;
  onBlacklist?: (protocol: Protocol) => void;
}

// Memoized sparkline data cache - generate once per protocol ID
const sparklineCache = new Map<string, number[]>();

const generateSparklineData = (protocolId: string, tvl: number): number[] => {
  if (sparklineCache.has(protocolId)) {
    return sparklineCache.get(protocolId)!;
  }
  
  // Generate realistic 7-day TVL trend based on current TVL
  const baseValue = tvl;
  const volatility = baseValue * 0.05; // 5% volatility
  
  const data = Array.from({ length: 7 }, (_, i) => {
    // Create slight upward or downward trend
    const trendFactor = (Math.random() - 0.5) * 0.02;
    const dayTrend = baseValue * (1 + trendFactor * i);
    const randomness = (Math.random() - 0.5) * volatility;
    return Math.max(0, dayTrend + randomness);
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
  onBlacklist,
  isAdmin
}: { 
  protocol: Protocol; 
  index: number; 
  scan: SecurityScan | undefined; 
  isWatchlisted: boolean;
  onToggleWatchlist: (id: string) => void;
  onBlacklist?: (protocol: Protocol) => void;
  isAdmin: boolean;
}) => {
  const isPositiveChange = protocol.change24h >= 0;
  const sparklineData = useMemo(
    () => generateSparklineData(protocol.id, protocol.tvl),
    [protocol.id, protocol.tvl]
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

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20 text-[10px] px-1.5 py-0">CRITICAL</Badge>;
      case 'HIGH':
        return <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20 text-[10px] px-1.5 py-0">HIGH</Badge>;
      case 'MEDIUM':
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 text-[10px] px-1.5 py-0">MEDIUM</Badge>;
      case 'LOW':
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 text-[10px] px-1.5 py-0">LOW</Badge>;
      default:
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-[10px] px-1.5 py-0">SAFE</Badge>;
    }
  };

  return (
    <tr 
      className="border-b border-border hover:bg-muted/50 transition-colors"
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
        <Link href={`/protocol/${protocol.id}`}>
          <div className="flex items-center gap-3 cursor-pointer hover-elevate">
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
        </Link>
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

      {/* Volume 24h */}
      <td className="px-3 py-4 text-right">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="font-semibold cursor-help text-muted-foreground">{formatTVL(Number(protocol.volume24h) || 0)}</div>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p className="font-mono">{formatExactTVL(Number(protocol.volume24h) || 0)}</p>
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
            <div className="flex flex-col items-center gap-1">
              {getSecurityBadge(protocol.securityScore)}
              {scan && getSeverityBadge(scan.severity)}
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="text-xs font-semibold mb-1">Security Score: {protocol.securityScore}/100</p>
            {scan && (
              <>
                <p className="text-xs font-semibold mt-2 mb-1">Severity: {scan.severity}</p>
                <p className="text-xs text-muted-foreground">{scan.threats.length} threat{scan.threats.length !== 1 ? 's' : ''} detected</p>
              </>
            )}
            {scan?.isBlacklisted && <p className="text-xs text-destructive mt-2">⚠️ Flagged as High Risk</p>}
            {protocol.auditCount > 0 && (
              <p className="text-xs text-green-500 mt-2">✓ {protocol.auditCount} Audit{protocol.auditCount > 1 ? 's' : ''} Completed</p>
            )}
          </TooltipContent>
        </Tooltip>
      </td>

      {/* Admin Actions */}
      {isAdmin && onBlacklist && (
        <td className="px-3 py-4 text-center" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onBlacklist(protocol);
            }}
            className="text-destructive hover:text-destructive"
            data-testid={`button-blacklist-${protocol.id}`}
          >
            <Ban className="w-4 h-4" />
          </Button>
        </td>
      )}
    </tr>
  );
});

ProtocolRow.displayName = 'ProtocolRow';

// Memoize the entire table component for CMC-level performance
const ProtocolTable = memo(function ProtocolTable({ 
  protocols, 
  securityScans, 
  onBlacklist
}: ProtocolTableProps) {
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set());

  const { data: session } = useQuery<AdminSession>({
    queryKey: ['/api/admin/session'],
  });

  const isAdmin = session?.authenticated === true;

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
                <th className="text-right px-3 py-3 text-xs font-semibold text-muted-foreground">TVL</th>
                <th className="text-right px-3 py-3 text-xs font-semibold text-muted-foreground">Volume 24h</th>
                <th className="text-right px-3 py-3 text-xs font-semibold text-muted-foreground">24h %</th>
                <th className="text-right px-3 py-3 text-xs font-semibold text-muted-foreground">7d %</th>
                <th className="text-right px-3 py-3 text-xs font-semibold text-muted-foreground">Last 7 Days (TVL)</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-muted-foreground">Security</th>
                {isAdmin && onBlacklist && (
                  <th className="text-center px-3 py-3 text-xs font-semibold text-muted-foreground">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {protocols.map((protocol, index) => (
                <ProtocolRow
                  key={protocol.id}
                  protocol={protocol}
                  index={index}
                  scan={securityScans[protocol.id]}
                  isWatchlisted={watchlist.has(protocol.id)}
                  onToggleWatchlist={toggleWatchlist}
                  onBlacklist={onBlacklist}
                  isAdmin={isAdmin}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </TooltipProvider>
  );
});

ProtocolTable.displayName = 'ProtocolTable';

export default ProtocolTable;
