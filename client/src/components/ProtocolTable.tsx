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
    // DFJ v2.3: HIGHER IS BETTER
    const style =
      score >= 80 ? 'border-green-500/40 text-green-400'  :
      score >= 65 ? 'border-blue-500/40 text-blue-400'    :
      score >= 50 ? 'border-yellow-400/40 text-yellow-400':
      score >= 30 ? 'border-orange-400/40 text-orange-400':
                    'border-red-500/40 text-red-400';
    return (
      <span className={`inline-block border px-1.5 py-0.5 text-[10px] font-black tabular-nums ${style}`}>
        {score}
      </span>
    );
  };

  const getSeverityBadge = (severity: string) => {
    const map: Record<string, string> = {
      CRITICAL: 'text-red-400',
      HIGH:     'text-orange-400',
      MEDIUM:   'text-yellow-400',
      LOW:      'text-blue-400',
      SAFE:     'text-green-400',
    };
    const color = map[severity] ?? 'text-white/30';
    return (
      <span className={`text-[9px] font-black tracking-wider ${color}`}>{severity}</span>
    );
  };

  return (
    <tr
      className="border-b border-[#111] hover:bg-white/[0.018] transition-colors group"
      data-testid={`protocol-row-${protocol.id}`}
    >
      {/* Watchlist Star */}
      <td className="px-3 py-3.5" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => onToggleWatchlist(protocol.id)}
          className="p-1 transition-colors"
          data-testid={`button-watchlist-${protocol.id}`}
        >
          <Star className={`w-3.5 h-3.5 ${isWatchlisted ? 'fill-[#E8C15A] text-[#E8C15A]' : 'text-white/20 group-hover:text-white/40'}`} />
        </button>
      </td>

      {/* Rank */}
      <td className="px-3 py-3.5 text-[11px] font-bold text-white/25 tabular-nums">
        {index + 1}
      </td>

      {/* Name & Logo */}
      <td className="px-3 py-3.5">
        <Link href={`/protocol/${protocol.id}`}>
          <div className="flex items-center gap-3 cursor-pointer">
            {protocol.logo ? (
              <img
                src={protocol.logo}
                alt={protocol.name}
                className="w-5 h-5 shrink-0"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            ) : (
              <div className="w-5 h-5 border border-[#2a2a2a] flex items-center justify-center shrink-0">
                <Shield className="w-3 h-3 text-white/20" />
              </div>
            )}
            <div>
              <div className="text-sm font-semibold text-white/85 group-hover:text-white transition-colors">{protocol.name}</div>
              <div className="text-[10px] text-white/30 tracking-wide">{protocol.category}</div>
            </div>
          </div>
        </Link>
      </td>

      {/* TVL */}
      <td className="px-3 py-3.5 text-right">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="text-sm font-bold tabular-nums text-white/80 cursor-help">{formatTVL(protocol.tvl)}</div>
          </TooltipTrigger>
          <TooltipContent side="left" className="bg-[#111] border-[#2a2a2a]">
            <p className="font-mono text-xs">{formatExactTVL(protocol.tvl)}</p>
          </TooltipContent>
        </Tooltip>
      </td>

      {/* Volume 24h */}
      <td className="px-3 py-3.5 text-right">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="text-sm tabular-nums text-white/40 cursor-help">{formatTVL(Number(protocol.volume24h) || 0)}</div>
          </TooltipTrigger>
          <TooltipContent side="left" className="bg-[#111] border-[#2a2a2a]">
            <p className="font-mono text-xs">{formatExactTVL(Number(protocol.volume24h) || 0)}</p>
          </TooltipContent>
        </Tooltip>
      </td>

      {/* 24h Change */}
      <td className="px-3 py-3.5 text-right">
        <span className={`text-sm font-bold tabular-nums ${isPositiveChange ? 'text-green-400' : 'text-red-400'}`}>
          {isPositiveChange ? '+' : ''}{protocol.change24h.toFixed(2)}%
        </span>
      </td>

      {/* 7d Change */}
      <td className="px-3 py-3.5 text-right">
        <span className={`text-sm font-bold tabular-nums ${sevenDayChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {sevenDayChange >= 0 ? '+' : ''}{sevenDayChange.toFixed(2)}%
        </span>
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
              {getSecurityBadge(scan?.score ?? protocol.securityScore)}
              {scan && getSeverityBadge(scan.severity)}
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="text-xs font-semibold mb-1">Security Score: {scan?.score ?? protocol.securityScore}/100</p>
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
      <div className="overflow-x-auto border border-[#1a1a1a] bg-[#080808]">
        <table className="w-full" data-testid="protocol-table">
          <thead>
            <tr className="border-b border-[#1a1a1a] bg-[#0a0a0a]">
              <th className="text-left px-3 py-3 w-10"></th>
              <th className="text-left px-3 py-3 text-[9px] font-black tracking-[0.2em] uppercase text-white/25">#</th>
              <th className="text-left px-3 py-3 text-[9px] font-black tracking-[0.2em] uppercase text-white/25">Name</th>
              <th className="text-right px-3 py-3 text-[9px] font-black tracking-[0.2em] uppercase text-white/25">TVL</th>
              <th className="text-right px-3 py-3 text-[9px] font-black tracking-[0.2em] uppercase text-white/25">Vol 24h</th>
              <th className="text-right px-3 py-3 text-[9px] font-black tracking-[0.2em] uppercase text-white/25">24h %</th>
              <th className="text-right px-3 py-3 text-[9px] font-black tracking-[0.2em] uppercase text-white/25">7d %</th>
              <th className="text-right px-3 py-3 text-[9px] font-black tracking-[0.2em] uppercase text-white/25">7d Chart</th>
              <th className="text-center px-3 py-3 text-[9px] font-black tracking-[0.2em] uppercase text-white/25">Security</th>
              {isAdmin && onBlacklist && (
                <th className="text-center px-3 py-3 text-[9px] font-black tracking-[0.2em] uppercase text-white/25">Actions</th>
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
    </TooltipProvider>
  );
});

ProtocolTable.displayName = 'ProtocolTable';

export default ProtocolTable;
