import { X, ExternalLink, Twitter, Globe, AlertCircle, Shield, Calendar, DollarSign, Scan, Play, Video, TrendingUp, Ban } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import SecurityBadge from './SecurityBadge';
import SeverityIndicator from './SeverityIndicator';
import type { Protocol, TutorialVideo } from '@shared/schema';

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
  onScan?: (protocolId: string) => void;
  onBlacklist?: (protocol: Protocol) => void;
  isScanning?: boolean;
}

export default function ProtocolDetailModal({ protocol, scanResult, isOpen, onClose, onScan, onBlacklist, isScanning = false }: ProtocolDetailModalProps) {
  if (!protocol) return null;

  // Check admin session
  const { data: session } = useQuery<{ authenticated: boolean }>({
    queryKey: ['/api/admin/session'],
  });
  const isAdmin = session?.authenticated === true;

  // Removed tutorial fetching to improve performance
  const relatedTutorials: TutorialVideo[] = [];

  const formatTVL = (num: number | undefined | null) => {
    if (num === undefined || num === null || isNaN(num)) return 'N/A';
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
          <DialogDescription className="sr-only">
            Detailed information about {protocol.name} including TVL, security score, audit data, and links to external resources.
          </DialogDescription>
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

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              asChild
              data-testid="button-dapps-link"
            >
              <a 
                href={`https://defillama.com/protocol/${protocol.id}`} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                View on DeFiLlama
              </a>
            </Button>
            {protocol.website && (
              <Button
                variant="outline"
                size="sm"
                asChild
                data-testid="button-website-link"
              >
                <a href={protocol.website} target="_blank" rel="noopener noreferrer">
                  <Globe className="w-3.5 h-3.5 mr-1.5" />
                  Website
                </a>
              </Button>
            )}
            {protocol.twitter && (
              <Button
                variant="outline"
                size="sm"
                asChild
                data-testid="button-twitter-link"
              >
                <a href={`https://twitter.com/${protocol.twitter}`} target="_blank" rel="noopener noreferrer">
                  <Twitter className="w-3.5 h-3.5 mr-1.5" />
                  Twitter
                </a>
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                TVL
              </p>
              <p className="text-lg font-bold font-mono">{formatTVL(protocol.tvl)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Volume 24h
              </p>
              <p className="text-lg font-bold font-mono" data-testid="text-volume-24h">{formatTVL(protocol.volume24h)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Security Score
              </p>
              <div className="flex flex-col gap-1">
                <SecurityBadge score={protocol.securityScore} size="sm" />
                <p className="text-xs text-muted-foreground">Higher = More Secure</p>
              </div>
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
                Audits
              </p>
              <p className="text-lg font-bold" data-testid="text-audit-count">
                {protocol.auditCount !== undefined && protocol.auditCount > 0 
                  ? `${protocol.auditCount} ${protocol.auditCount === 1 ? 'Audit' : 'Audits'}` 
                  : '✗ None'}
              </p>
            </div>
          </div>

          {protocol.auditCount && protocol.auditCount > 0 && (
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  Audit Information (DeFiLlama)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Audit Count</p>
                  <p className="text-sm font-semibold">{protocol.auditCount} {protocol.auditCount === 1 ? 'Audit' : 'Audits'} Completed</p>
                </div>
                {protocol.auditNote && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Note</p>
                    <p className="text-sm">{protocol.auditNote}</p>
                  </div>
                )}
                {protocol.auditLinks && protocol.auditLinks.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Audit Reports</p>
                    <div className="flex flex-wrap gap-2">
                      {protocol.auditLinks.map((link, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          asChild
                          data-testid={`button-audit-link-${index}`}
                        >
                          <a href={link} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-3 h-3 mr-1" />
                            Report {index + 1}
                          </a>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {(protocol.defiSecurityScore !== null || (protocol.defiAuditReports && protocol.defiAuditReports.length > 0) || protocol.defiHasMultisig !== null || protocol.defiHasTimelock !== null) && (
            <Card className="bg-emerald-500/5 border-emerald-500/20">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-500" />
                  De.Fi Security Analysis
                </CardTitle>
                <CardDescription className="text-xs">
                  Real-time security data from De.Fi API
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {protocol.defiSecurityScore !== null && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Security Score</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${
                            protocol.defiSecurityScore >= 80 ? 'bg-emerald-500' :
                            protocol.defiSecurityScore >= 60 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${protocol.defiSecurityScore}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold">{protocol.defiSecurityScore}/100</span>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  {protocol.defiHasMultisig !== null && (
                    <div className="flex items-center gap-2">
                      {protocol.defiHasMultisig ? (
                        <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">
                          <Shield className="w-3 h-3 mr-1" />
                          Multisig
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          No Multisig
                        </Badge>
                      )}
                    </div>
                  )}
                  {protocol.defiHasTimelock !== null && (
                    <div className="flex items-center gap-2">
                      {protocol.defiHasTimelock ? (
                        <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">
                          <Calendar className="w-3 h-3 mr-1" />
                          Timelock
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          No Timelock
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
                {protocol.defiAuditReports && protocol.defiAuditReports.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">De.Fi Audit Reports ({protocol.defiAuditReports.length})</p>
                    <div className="space-y-2">
                      {protocol.defiAuditReports.map((report, index) => (
                        <div key={index} className="flex items-start justify-between p-2 bg-muted/50 rounded-md">
                          <div className="flex-1">
                            <p className="text-sm font-semibold">{report.auditor}</p>
                            <p className="text-xs text-muted-foreground">{new Date(report.date).toLocaleDateString()}</p>
                          </div>
                          {report.reportUrl && (
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                              data-testid={`button-defi-audit-report-${index}`}
                            >
                              <a href={report.reportUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {protocol.defiDataFetchedAt && (
                  <p className="text-xs text-muted-foreground">
                    Last updated: {new Date(protocol.defiDataFetchedAt).toLocaleString()}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {(onScan || (isAdmin && onBlacklist)) && (
            <div className="flex gap-2">
              {onScan && (
                <Button
                  onClick={() => onScan(protocol.id)}
                  disabled={isScanning}
                  data-testid="button-scan-protocol"
                >
                  <Scan className={`w-4 h-4 mr-2 ${isScanning ? 'animate-spin' : ''}`} />
                  {isScanning ? 'Scanning...' : 'Scan Protocol'}
                </Button>
              )}
              {isAdmin && onBlacklist && (
                <Button
                  onClick={() => onBlacklist(protocol)}
                  variant="destructive"
                  data-testid="button-blacklist-protocol"
                >
                  <Ban className="w-4 h-4 mr-2" />
                  Blacklist Protocol
                </Button>
              )}
            </div>
          )}

          {scanResult && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Security Analysis
                </CardTitle>
                <CardDescription>
                  Automated security checks performed on this protocol
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 pb-4 border-b">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Risk Score</p>
                    <p className="text-2xl font-bold text-destructive">{scanResult.score}/100</p>
                    <p className="text-xs text-muted-foreground mt-1">Higher = More Risky</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Severity</p>
                    <SeverityIndicator severity={scanResult.severity} />
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-2">Security Checks Performed:</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full mt-1.5 ${
                        scanResult.threats.some(t => t.type === 'NEW_CONTRACT') ? 'bg-red-500' : 'bg-green-500'
                      }`} />
                      <div className="flex-1">
                        <p className="font-medium">Contract Age Check</p>
                        <p className="text-muted-foreground text-xs">
                          {scanResult.threats.some(t => t.type === 'NEW_CONTRACT') 
                            ? '⚠️ Contract is less than 7 days old (+40 risk points)' 
                            : '✓ Contract age verified'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full mt-1.5 ${
                        scanResult.threats.some(t => t.type === 'NO_AUDIT') ? 'bg-red-500' : 'bg-green-500'
                      }`} />
                      <div className="flex-1">
                        <p className="font-medium">Security Audit Check</p>
                        <p className="text-muted-foreground text-xs">
                          {scanResult.threats.some(t => t.type === 'NO_AUDIT') 
                            ? '⚠️ No security audit found (+30 risk points)' 
                            : '✓ Security audit detected'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full mt-1.5 ${
                        scanResult.threats.some(t => t.type === 'ANONYMOUS_TEAM') ? 'bg-red-500' : 'bg-green-500'
                      }`} />
                      <div className="flex-1">
                        <p className="font-medium">Team Transparency Check</p>
                        <p className="text-muted-foreground text-xs">
                          {scanResult.threats.some(t => t.type === 'ANONYMOUS_TEAM') 
                            ? '⚠️ Team is anonymous - no social presence (+25 risk points)' 
                            : '✓ Team has public social presence'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full mt-1.5 ${
                        scanResult.threats.some(t => t.type === 'LOW_LIQUIDITY') ? 'bg-orange-500' : 'bg-green-500'
                      }`} />
                      <div className="flex-1">
                        <p className="font-medium">Liquidity Check</p>
                        <p className="text-muted-foreground text-xs">
                          {scanResult.threats.some(t => t.type === 'LOW_LIQUIDITY') 
                            ? '⚠️ Very low liquidity - TVL < $50k (+20 risk points)' 
                            : '✓ Adequate liquidity detected'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {scanResult.threats.length > 0 && (
                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-semibold mb-2 text-destructive">
                      Threats Detected ({scanResult.threats.length})
                    </h4>
                    <div className="space-y-2">
                      {scanResult.threats.map((threat, idx) => (
                        <div key={idx} className="p-3 bg-destructive/5 rounded-lg border border-destructive/20">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <span className="font-medium text-sm">{threat.type.replace(/_/g, ' ')}</span>
                            <SeverityIndicator severity={threat.severity} />
                          </div>
                          <p className="text-sm text-muted-foreground">{threat.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t bg-muted/30 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    <strong>Blacklist Criteria:</strong> Protocols with a risk score ≥ 80 (CRITICAL severity) are automatically flagged. 
                    Current score: {scanResult.score}/100 ({scanResult.severity})
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {relatedTutorials.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-2">
                <Video className="w-4 h-4" />
                Related Tutorials ({relatedTutorials.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {relatedTutorials.map((tutorial) => (
                  <Card key={tutorial.id} className="hover-elevate" data-testid={`card-related-tutorial-${tutorial.id}`}>
                    <CardHeader className="space-y-0 pb-3 p-4">
                      <div className="aspect-video bg-muted rounded-md mb-2 flex items-center justify-center overflow-hidden">
                        {tutorial.thumbnailUrl ? (
                          <img src={tutorial.thumbnailUrl} alt={tutorial.title} className="w-full h-full object-cover" />
                        ) : (
                          <Video className="w-8 h-8 text-muted-foreground" />
                        )}
                      </div>
                      <CardTitle className="text-sm line-clamp-2">{tutorial.title}</CardTitle>
                      <CardDescription className="text-xs line-clamp-1">{tutorial.category}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="text-muted-foreground">{formatDuration(tutorial.duration)}</span>
                      </div>
                      <Button 
                        size="sm"
                        className="w-full" 
                        variant="outline"
                        onClick={() => window.open(tutorial.videoUrl, '_blank')}
                        data-testid={`button-watch-tutorial-${tutorial.id}`}
                      >
                        <Play className="w-3 h-3 mr-2" />
                        Watch Tutorial
                      </Button>
                    </CardContent>
                  </Card>
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
