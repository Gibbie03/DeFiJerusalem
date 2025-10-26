import { Shield, TrendingUp, TrendingDown, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { Protocol, SecurityScan } from '@shared/schema';

interface ProtocolTableProps {
  protocols: Protocol[];
  securityScans: Record<string, SecurityScan>;
  onViewDetails: (protocol: Protocol) => void;
}

export default function ProtocolTable({ 
  protocols, 
  securityScans, 
  onViewDetails 
}: ProtocolTableProps) {
  
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
    <div className="overflow-x-auto">
      <table className="w-full border-collapse" data-testid="protocol-table">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left p-4 text-sm font-medium text-muted-foreground">#</th>
            <th className="text-left p-4 text-sm font-medium text-muted-foreground">Name</th>
            <th className="text-left p-4 text-sm font-medium text-muted-foreground">Category</th>
            <th className="text-right p-4 text-sm font-medium text-muted-foreground">TVL</th>
            <th className="text-right p-4 text-sm font-medium text-muted-foreground">24h %</th>
            <th className="text-left p-4 text-sm font-medium text-muted-foreground">Chains</th>
            <th className="text-center p-4 text-sm font-medium text-muted-foreground">Security</th>
            <th className="text-center p-4 text-sm font-medium text-muted-foreground">Action</th>
          </tr>
        </thead>
        <tbody>
          {protocols.map((protocol, index) => {
            const scan = securityScans[protocol.id];
            const isPositiveChange = protocol.change24h >= 0;
            
            return (
              <tr 
                key={protocol.id} 
                className="border-b border-border hover-elevate transition-colors"
                data-testid={`protocol-row-${protocol.id}`}
              >
                {/* Rank */}
                <td className="p-4 text-sm font-medium text-muted-foreground">
                  {index + 1}
                </td>
                
                {/* Name & Logo */}
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    {protocol.logo ? (
                      <img 
                        src={protocol.logo} 
                        alt={protocol.name}
                        className="w-8 h-8 rounded-full"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Shield className="w-4 h-4 text-primary" />
                      </div>
                    )}
                    <div>
                      <div className="font-medium">{protocol.name}</div>
                      {protocol.audited && (
                        <Badge variant="outline" className="text-xs mt-1">
                          <Shield className="w-3 h-3 mr-1" />
                          Audited
                        </Badge>
                      )}
                    </div>
                  </div>
                </td>
                
                {/* Category */}
                <td className="p-4">
                  <Badge variant="secondary">{protocol.category}</Badge>
                </td>
                
                {/* TVL */}
                <td className="p-4 text-right">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="font-semibold text-lg cursor-help">{formatTVL(protocol.tvl)}</div>
                      </TooltipTrigger>
                      <TooltipContent side="left">
                        <p className="font-mono">{formatExactTVL(protocol.tvl)}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </td>
                
                {/* 24h Change */}
                <td className="p-4 text-right">
                  <div className={`flex items-center justify-end gap-1 font-medium ${
                    isPositiveChange ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {isPositiveChange ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    {isPositiveChange ? '+' : ''}{protocol.change24h.toFixed(2)}%
                  </div>
                </td>
                
                {/* Chains */}
                <td className="p-4">
                  <div className="flex gap-1 flex-wrap">
                    {protocol.chains.slice(0, 2).map((chain) => (
                      <Badge key={chain} variant="outline" className="text-xs">
                        {chain}
                      </Badge>
                    ))}
                    {protocol.chains.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{protocol.chains.length - 2}
                      </Badge>
                    )}
                  </div>
                </td>
                
                {/* Security Score */}
                <td className="p-4 text-center">
                  {scan ? (
                    <div className="flex flex-col items-center gap-1">
                      {getSecurityBadge(scan.score)}
                      {scan.isBlacklisted && (
                        <Badge variant="destructive" className="text-xs">
                          Flagged
                        </Badge>
                      )}
                    </div>
                  ) : (
                    getSecurityBadge(protocol.securityScore)
                  )}
                </td>
                
                {/* Action */}
                <td className="p-4 text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewDetails(protocol)}
                    data-testid={`button-view-${protocol.id}`}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
