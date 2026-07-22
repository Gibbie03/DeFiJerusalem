import { X, ExternalLink, Twitter, Globe, AlertCircle, Shield, Calendar, DollarSign, Scan, Play, Video, TrendingUp, Ban, Github, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useQuery } from '@tanstack/react-query';
import SecurityBadge from './SecurityBadge';
import SeverityIndicator from './SeverityIndicator';
import { getThreatAdvice, getSeverityIcon } from '@/lib/threatAdvice';
import type { Protocol, TutorialVideo } from '@shared/schema';
import { formatTVL } from '@/lib/format';

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

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              Protocol Links
            </h3>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="default"
                size="default"
                asChild
                className="font-semibold"
                data-testid="button-dapps-link"
              >
                <a 
                  href={`https://defillama.com/protocol/${protocol.id}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  DeFiLlama
                </a>
              </Button>
              {protocol.website && (
                <Button
                  variant="default"
                  size="default"
                  asChild
                  className="font-semibold"
                  data-testid="button-website-link"
                >
                  <a href={protocol.website} target="_blank" rel="noopener noreferrer">
                    <Globe className="w-4 h-4 mr-2" />
                    Website
                  </a>
                </Button>
              )}
              {protocol.twitter && (
                <Button
                  variant="default"
                  size="default"
                  asChild
                  className="font-semibold"
                  data-testid="button-twitter-link"
                >
                  <a href={`https://twitter.com/${protocol.twitter}`} target="_blank" rel="noopener noreferrer">
                    <Twitter className="w-4 h-4 mr-2" />
                    Twitter
                  </a>
                </Button>
              )}
              {protocol.github && (
                <Button
                  variant="default"
                  size="default"
                  asChild
                  className="font-semibold"
                  data-testid="button-github-link"
                >
                  <a href={protocol.github?.startsWith('http') ? protocol.github : `https://github.com/${protocol.github}`} target="_blank" rel="noopener noreferrer">
                    <Github className="w-4 h-4 mr-2" />
                    GitHub
                  </a>
                </Button>
              )}
            </div>
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
                <div className="pt-3 border-t">
                  <p className="text-xs text-muted-foreground mb-2">Protocol Links</p>
                  <div className="flex flex-wrap gap-2">
                    {protocol.website && (
                      <Button variant="outline" size="sm" asChild data-testid="button-audit-card-website">
                        <a href={protocol.website} target="_blank" rel="noopener noreferrer">
                          <Globe className="w-3 h-3 mr-1" />
                          Website
                        </a>
                      </Button>
                    )}
                    {protocol.twitter && (
                      <Button variant="outline" size="sm" asChild data-testid="button-audit-card-twitter">
                        <a href={`https://twitter.com/${protocol.twitter}`} target="_blank" rel="noopener noreferrer">
                          <Twitter className="w-3 h-3 mr-1" />
                          Twitter
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
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
                <div className="pt-3 border-t">
                  <p className="text-xs text-muted-foreground mb-2">Protocol Links</p>
                  <div className="flex flex-wrap gap-2">
                    {protocol.website && (
                      <Button variant="outline" size="sm" asChild data-testid="button-defi-card-website">
                        <a href={protocol.website} target="_blank" rel="noopener noreferrer">
                          <Globe className="w-3 h-3 mr-1" />
                          Website
                        </a>
                      </Button>
                    )}
                    {protocol.twitter && (
                      <Button variant="outline" size="sm" asChild data-testid="button-defi-card-twitter">
                        <a href={`https://twitter.com/${protocol.twitter}`} target="_blank" rel="noopener noreferrer">
                          <Twitter className="w-3 h-3 mr-1" />
                          Twitter
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
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
            <div className="space-y-4">
              {/* Critical Warning for CRITICAL severity */}
              {scanResult.severity === 'CRITICAL' && (
                <Alert className="border-red-500 bg-red-500/10" data-testid="alert-critical-warning">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <AlertTitle className="text-red-500 font-bold">CRITICAL SECURITY WARNING</AlertTitle>
                  <AlertDescription className="text-sm">
                    This protocol has been flagged with CRITICAL severity threats. DO NOT interact with this protocol. 
                    Your funds are at extreme risk. This protocol may be a scam designed to steal your assets.
                  </AlertDescription>
                </Alert>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Security Scan Results
                  </CardTitle>
                  <CardDescription>
                    Comprehensive threat analysis across 38+ security categories
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
                      <p className="text-xs text-muted-foreground mt-2">
                        {scanResult.threats.length} threat{scanResult.threats.length !== 1 ? 's' : ''} detected
                      </p>
                    </div>
                  </div>

                  {scanResult.threats.length > 0 ? (
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-destructive" />
                        Detected Threats & User Advice
                      </h4>
                      {scanResult.threats.map((threat, idx) => {
                        const advice = getThreatAdvice(threat.type, threat.severity);
                        const icon = getSeverityIcon(threat.severity);
                        
                        return (
                          <Card key={idx} className={`border-${threat.severity === 'CRITICAL' ? 'red' : threat.severity === 'HIGH' ? 'orange' : threat.severity === 'MEDIUM' ? 'yellow' : 'blue'}-500/20`}>
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-start gap-2 flex-1">
                                  <span className="text-lg mt-0.5">{icon}</span>
                                  <div>
                                    <CardTitle className="text-sm font-bold">{advice.title}</CardTitle>
                                    <Badge 
                                      className={`mt-1 ${
                                        threat.severity === 'CRITICAL' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                        threat.severity === 'HIGH' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                                        threat.severity === 'MEDIUM' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                                        'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                      }`}
                                    >
                                      {threat.severity}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-3 pt-0">
                              <div>
                                <p className="text-xs font-semibold text-muted-foreground mb-1">What This Means:</p>
                                <p className="text-sm">{advice.description}</p>
                              </div>
                              
                              <Alert className={`${
                                threat.severity === 'CRITICAL' ? 'border-red-500/30 bg-red-500/5' :
                                threat.severity === 'HIGH' ? 'border-orange-500/30 bg-orange-500/5' :
                                threat.severity === 'MEDIUM' ? 'border-yellow-500/30 bg-yellow-500/5' :
                                'border-blue-500/30 bg-blue-500/5'
                              }`}>
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle className="text-xs font-bold">Advice for Users</AlertTitle>
                                <AlertDescription className="text-xs">
                                  {advice.userAdvice}
                                </AlertDescription>
                              </Alert>

                              <div className="bg-muted/30 p-3 rounded-lg">
                                <p className="text-xs font-semibold mb-1">Recommended Action:</p>
                                <p className="text-xs text-muted-foreground">{advice.actionRecommendation}</p>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  ) : (
                    <Alert className="border-green-500/30 bg-green-500/5">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <AlertTitle className="text-green-500">No Threats Detected</AlertTitle>
                      <AlertDescription className="text-sm">
                        This protocol has passed all security checks. However, always do your own research before investing.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="pt-4 border-t bg-muted/30 p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground">
                      <strong>Auto-Blacklist Policy:</strong> Protocols with risk scores ≥ 80 (CRITICAL severity) are automatically blacklisted. 
                      This protocol's current score: <strong>{scanResult.score}/100</strong> ({scanResult.severity})
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
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
