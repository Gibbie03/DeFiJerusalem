import { ExternalLink, TrendingUp, TrendingDown, Twitter, Globe, Ban, Github } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useQuery } from '@tanstack/react-query';
import SecurityBadge from './SecurityBadge';

import type { Protocol } from '@shared/schema';

interface AdminSession {
  authenticated: boolean;
  admin?: {
    id: number;
    username: string;
    email: string;
    role: string;
  };
}

interface ProtocolCardProps {
  protocol: Protocol;
  onViewDetails: (protocol: Protocol) => void;
  onScan?: (protocol: Protocol) => void;
  onBlacklist?: (protocol: Protocol) => void;
}

export default function ProtocolCard({ protocol, onViewDetails, onScan, onBlacklist }: ProtocolCardProps) {
  const { data: session } = useQuery<AdminSession>({
    queryKey: ['/api/admin/session'],
  });

  const isAdmin = session?.authenticated === true;

  const formatTVL = (num: number) => {
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  return (
    <Card className="p-6 hover-elevate" data-testid={`card-protocol-${protocol.id}`}>
      <div className="flex items-start gap-4 mb-4">
        <Avatar className="w-12 h-12">
          <AvatarImage src={protocol.logo || undefined} alt={protocol.name} />
          <AvatarFallback className="bg-primary/20 text-primary font-semibold">
            {protocol.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-foreground mb-1 truncate" data-testid="text-protocol-name">
            {protocol.name}
          </h3>
          <div className="flex flex-wrap gap-2 mb-2">
            {protocol.chains.slice(0, 3).map((chain) => (
              <Badge key={chain} variant="secondary" className="text-xs">
                {chain}
              </Badge>
            ))}
            {protocol.chains.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{protocol.chains.length - 3}
              </Badge>
            )}
          </div>
        </div>

        <SecurityBadge score={protocol.securityScore} size="sm" />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4 py-3 border-t border-b">
        <div>
          <p className="text-xs text-muted-foreground mb-1">TVL</p>
          <p className="text-lg font-bold font-mono" data-testid="text-tvl">
            {formatTVL(protocol.tvl)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">24h Change</p>
          <p className={`text-lg font-bold flex items-center gap-1 ${protocol.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {protocol.change24h >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {protocol.change24h.toFixed(2)}%
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-3">Protocol Links</p>
          <div className="flex gap-2 flex-wrap">
            <Button 
              size="default" 
              variant="default"
              className="font-semibold"
              onClick={(e) => { e.stopPropagation(); window.open(`https://defillama.com/protocol/${protocol.id}`, '_blank'); }}
              data-testid="button-dapps"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              DeFiLlama
            </Button>
            {protocol.website && (
              <Button 
                size="default" 
                variant="default"
                className="font-semibold"
                onClick={(e) => { e.stopPropagation(); window.open(protocol.website!, '_blank'); }}
                data-testid="button-website"
              >
                <Globe className="w-4 h-4 mr-2" />
                Website
              </Button>
            )}
            {protocol.twitter && (
              <Button 
                size="default" 
                variant="default"
                className="font-semibold"
                onClick={(e) => { e.stopPropagation(); window.open(`https://twitter.com/${protocol.twitter}`, '_blank'); }}
                data-testid="button-twitter"
              >
                <Twitter className="w-4 h-4 mr-2" />
                Twitter
              </Button>
            )}
            {protocol.github && (
              <Button 
                size="default" 
                variant="default"
                className="font-semibold"
                onClick={(e) => { e.stopPropagation(); window.open(protocol.github!, '_blank'); }}
                data-testid="button-github"
              >
                <Github className="w-4 h-4 mr-2" />
                GitHub
              </Button>
            )}
          </div>
        </div>

        <div className="flex gap-2 flex-wrap justify-end">
          {onScan && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onScan(protocol)}
              data-testid="button-scan"
            >
              Scan
            </Button>
          )}
          {isAdmin && onBlacklist && (
            <Button 
              size="sm" 
              variant="destructive"
              onClick={(e) => { e.stopPropagation(); onBlacklist(protocol); }}
              data-testid="button-blacklist"
            >
              <Ban className="w-3.5 h-3.5 mr-1.5" />
              Blacklist
            </Button>
          )}
          <Button 
            size="sm"
            onClick={() => onViewDetails(protocol)}
            data-testid="button-view-details"
          >
            <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
            Details
          </Button>
        </div>
      </div>
    </Card>
  );
}
