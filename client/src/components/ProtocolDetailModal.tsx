import { X, ExternalLink, Twitter, Globe, AlertCircle, Shield, Calendar, DollarSign } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import SecurityBadge from './SecurityBadge';
import SeverityIndicator from './SeverityIndicator';

interface Protocol {
  id: string;
  name: string;
  chains: string[];
  category: string;
  tvl: number;
  change24h: number;
  securityScore: number;
  logo?: string | null;
  website?: string | null;
  twitter?: string | null;
  github?: string | null;
  audited: boolean;
  age?: number | null;
  description?: string;
}

interface ScanResult {
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  threats: Array<{
    type: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    message: string;
  }>;
  score: number;
}

interface ProtocolDetailModalProps {
  protocol: Protocol | null;
  scanResult?: ScanResult;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProtocolDetailModal({ protocol, scanResult, isOpen, onClose }: ProtocolDetailModalProps) {
  if (!protocol) return null;

  const formatTVL = (num: number) => {
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="modal-protocol-details">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="w-12 h-12">
              <AvatarImage src={protocol.logo || undefined} alt={protocol.name} />
              <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                {protocol.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold" data-testid="text-modal-protocol-name">{protocol.name}</h2>
              <Badge variant="secondary" className="mt-1">{protocol.category}</Badge>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {protocol.chains.map((chain) => (
              <Badge key={chain} variant="outline" className="capitalize">
                {chain}
              </Badge>
            ))}
          </div>

          {protocol.description && (
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Description
              </h3>
              <p className="text-sm text-foreground">{protocol.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                TVL
              </p>
              <p className="text-lg font-bold font-mono">{formatTVL(protocol.tvl)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Security
              </p>
              <SecurityBadge score={protocol.securityScore} size="sm" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Age
              </p>
              <p className="text-lg font-bold">
                {protocol.age !== null && protocol.age !== undefined 
                  ? `${protocol.age} days` 
                  : 'Unknown'}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Audited
              </p>
              <p className="text-lg font-bold">
                {protocol.audited ? '✓ Yes' : '✗ No'}
              </p>
            </div>
          </div>

          {scanResult && scanResult.threats.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Security Threats ({scanResult.threats.length})
              </h3>
              <div className="space-y-2">
                {scanResult.threats.map((threat, idx) => (
                  <div key={idx} className="p-3 bg-card rounded-lg border">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="font-medium text-sm">{threat.type.replace(/_/g, ' ')}</span>
                      <SeverityIndicator severity={threat.severity} />
                    </div>
                    <p className="text-sm text-muted-foreground">{threat.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-4 border-t">
            {protocol.website && (
              <Button
                variant="outline"
                onClick={() => window.open(protocol.website!, '_blank')}
                data-testid="button-modal-website"
              >
                <Globe className="w-4 h-4 mr-2" />
                Website
                <ExternalLink className="w-3 h-3 ml-2" />
              </Button>
            )}
            {protocol.twitter && (
              <Button
                variant="outline"
                onClick={() => window.open(`https://twitter.com/${protocol.twitter}`, '_blank')}
                data-testid="button-modal-twitter"
              >
                <Twitter className="w-4 h-4 mr-2" />
                Twitter
                <ExternalLink className="w-3 h-3 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
