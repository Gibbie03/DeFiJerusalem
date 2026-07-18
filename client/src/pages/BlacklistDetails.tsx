import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, useLocation } from 'wouter';
import { Shield, AlertTriangle, ExternalLink, Twitter, Github, ArrowLeft, Trash2, CheckCircle2, XCircle, Clock, Globe, AlertOctagon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import type { BlacklistEntry, Protocol } from '@shared/schema';

export default function BlacklistDetails() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: blacklist = [] } = useQuery<BlacklistEntry[]>({
    queryKey: ['/api/blacklist'],
  });

  const entry = blacklist.find(e => e.id === params.id);

  // Fetch the corresponding protocol data to get actual links
  const { data: protocol } = useQuery<Protocol>({
    queryKey: ['/api/protocols', entry?.dappId],
    enabled: !!entry?.dappId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (entryId: string) => {
      const res = await apiRequest('DELETE', `/api/blacklist/${entryId}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/blacklist'] });
      toast({
        title: "Entry Removed",
        description: "Blacklist entry has been successfully removed",
      });
      setLocation('/blacklist');
    },
    onError: (error) => {
      toast({
        title: "Deletion Failed",
        description: error instanceof Error ? error.message : "Failed to delete blacklist entry",
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    if (!entry) return;
    if (confirm(`Are you sure you want to remove "${entry.dappName || entry.dappId}" from the blacklist?`)) {
      deleteMutation.mutate(entry.id);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'border-red-500 bg-red-500/5';
      case 'HIGH': return 'border-orange-500 bg-orange-500/5';
      case 'MEDIUM': return 'border-yellow-500 bg-yellow-500/5';
      default: return 'border-gray-500 bg-gray-500/5';
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return <Badge variant="destructive" className="bg-red-500/20 text-red-500 border-red-500/50">CRITICAL</Badge>;
      case 'HIGH':
        return <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/50">HIGH</Badge>;
      case 'MEDIUM':
        return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/50">MEDIUM</Badge>;
      default:
        return <Badge variant="outline">{severity}</Badge>;
    }
  };

  const getLegitimacyRating = (score: number) => {
    // DFJ v2.3: higher = safer
    if (score >= 80) {
      return { label: 'EXCELLENT', color: 'bg-green-500/10 text-green-500 border-green-500/20', icon: CheckCircle2 };
    } else if (score >= 65) {
      return { label: 'GOOD', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: CheckCircle2 };
    } else if (score >= 50) {
      return { label: 'MODERATE RISK', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', icon: AlertTriangle };
    } else if (score >= 30) {
      return { label: 'HIGH RISK', color: 'bg-orange-500/10 text-orange-500 border-orange-500/20', icon: AlertOctagon };
    } else {
      return { label: 'CRITICAL RISK', color: 'bg-red-500/10 text-red-500 border-red-500/20', icon: XCircle };
    }
  };

  if (!entry) {
    return (
      <div className="max-w-screen-2xl mx-auto px-6 py-8">
        <div className="text-center py-12">
          <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Blacklist Entry Not Found</h3>
          <p className="text-muted-foreground mb-4">The requested entry could not be found.</p>
          <Button onClick={() => setLocation('/blacklist')} data-testid="button-back-to-blacklist">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Blacklist
          </Button>
        </div>
      </div>
    );
  }

  const legitimacyRating = entry.legitimacyScore !== undefined && entry.legitimacyScore !== null 
    ? getLegitimacyRating(entry.legitimacyScore) 
    : null;

  const InfoRow = ({ label, children, dataTestId }: { label: string; children: React.ReactNode; dataTestId?: string }) => (
    <div className="flex items-start py-3 border-b last:border-b-0" data-testid={dataTestId}>
      <div className="w-48 shrink-0 font-medium text-muted-foreground">{label}</div>
      <div className="flex-1">{children}</div>
    </div>
  );

  return (
    <div className="bg-background">
      <main className="max-w-screen-2xl mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <Button
              variant="ghost"
              onClick={() => setLocation('/blacklist')}
              className="mb-4"
              data-testid="button-back"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blacklist
            </Button>
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-8 h-8 text-red-500 shrink-0 mt-1" />
              <div className="min-w-0">
                <h1 className="text-3xl font-bold mb-2 break-words" data-testid="protocol-name">
                  {entry.dappName || entry.dappId}
                </h1>
                <div className="flex flex-wrap items-center gap-2">
                  {getSeverityBadge(entry.severity)}
                  <Badge variant={entry.status === 'ACTIVE' ? 'destructive' : 'secondary'} data-testid="status-badge">
                    {entry.status}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Flagged on {new Date(entry.timestamp).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            data-testid="button-delete"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Remove
          </Button>
        </div>

        {/* Alert Banner */}
        <Alert className={`border-l-4 ${getSeverityColor(entry.severity)}`}>
          <Shield className="h-4 w-4" />
          <AlertTitle className="font-bold">Security Warning</AlertTitle>
          <AlertDescription>
            This protocol has been blacklisted due to {entry.threats.length} detected security threat(s). 
            Exercise extreme caution when interacting with this protocol.
          </AlertDescription>
        </Alert>

        {/* Main Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Protocol Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="px-6">
              <InfoRow label="Severity" dataTestId="row-severity">
                {getSeverityBadge(entry.severity)}
              </InfoRow>
              
              <InfoRow label="Status" dataTestId="row-status">
                <Badge variant={entry.status === 'ACTIVE' ? 'destructive' : 'secondary'}>
                  {entry.status}
                </Badge>
              </InfoRow>
              
              <InfoRow label="Threats Detected" dataTestId="row-threats-count">
                <span className="font-semibold">{entry.threats.length}</span>
              </InfoRow>
              
              <InfoRow label="Flagged Date" dataTestId="row-flagged-date">
                {new Date(entry.timestamp).toLocaleDateString()}
              </InfoRow>

              {entry.lastVetted && (
                <InfoRow label="Last Vetted" dataTestId="row-last-vetted">
                  {new Date(entry.lastVetted).toLocaleDateString()}
                </InfoRow>
              )}

              {legitimacyRating && entry.legitimacyScore !== undefined && (
                <InfoRow label="Legitimacy Score" dataTestId="row-legitimacy">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold">{entry.legitimacyScore}/100</span>
                    <Badge variant="outline" className={legitimacyRating.color}>
                      {(() => {
                        const Icon = legitimacyRating.icon;
                        return <Icon className="w-3 h-3 mr-1 inline" />;
                      })()}
                      {legitimacyRating.label}
                    </Badge>
                  </div>
                </InfoRow>
              )}

              <InfoRow label="Protocol Links" dataTestId="row-protocol-links">
                <div className="flex flex-wrap gap-2">
                  {(entry.website || protocol?.website) && (
                    <Button
                      variant="default"
                      size="default"
                      asChild
                      className="font-semibold"
                      data-testid="button-website"
                    >
                      <a
                        href={entry.website || protocol?.website || ''}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Globe className="w-4 h-4 mr-2" />
                        Website
                      </a>
                    </Button>
                  )}

                  {(entry.twitter || protocol?.twitter) && (
                    <Button
                      variant="default"
                      size="default"
                      asChild
                      className="font-semibold"
                      data-testid="button-twitter"
                    >
                      <a
                        href={entry.twitter || (protocol?.twitter ? `https://twitter.com/${protocol.twitter}` : '')}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Twitter className="w-4 h-4 mr-2" />
                        Twitter
                      </a>
                    </Button>
                  )}

                  {(entry.github || protocol?.github) && (
                    <Button
                      variant="default"
                      size="default"
                      asChild
                      className="font-semibold"
                      data-testid="button-github"
                    >
                      <a
                        href={entry.github || protocol?.github || ''}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Github className="w-4 h-4 mr-2" />
                        GitHub
                      </a>
                    </Button>
                  )}
                </div>
              </InfoRow>

              {entry.reason && (
                <InfoRow label="Blacklist Reason" dataTestId="row-reason">
                  <p className="text-muted-foreground">{entry.reason}</p>
                </InfoRow>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Security Metrics */}
        {entry.securityMetrics && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Security Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="px-6">
                <InfoRow label="Audit Status">
                  <div className="flex items-center gap-2">
                    {entry.securityMetrics.hasAudit ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span>{entry.securityMetrics.hasAudit ? 'Audited' : 'Not Audited'}</span>
                  </div>
                </InfoRow>

                {entry.securityMetrics.auditFirms.length > 0 && (
                  <InfoRow label="Audit Firms">
                    <span>{entry.securityMetrics.auditFirms.join(', ')}</span>
                  </InfoRow>
                )}

                <InfoRow label="TVL">
                  <span>${entry.securityMetrics.tvl.toLocaleString()}</span>
                </InfoRow>

                <InfoRow label="Open Source">
                  {entry.securityMetrics.hasOpenSource ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                </InfoRow>

                <InfoRow label="Multisig">
                  {entry.securityMetrics.hasMultisig ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                </InfoRow>

                <InfoRow label="Timelock">
                  {entry.securityMetrics.hasTimelock ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                </InfoRow>

                <InfoRow label="Bug Bounty">
                  {entry.securityMetrics.hasBugBounty ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                </InfoRow>

                <InfoRow label="Doxxed Team">
                  {entry.securityMetrics.hasDoxxedTeam ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                </InfoRow>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Detected Threats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertOctagon className="w-5 h-5 text-red-500" />
              Detected Threats ({entry.threats.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {entry.threats.map((threat, idx) => (
                <div
                  key={idx}
                  className="p-4 border rounded-lg hover-elevate"
                  data-testid={`threat-${idx}`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h4 className="font-semibold" data-testid={`threat-type-${idx}`}>
                      {threat.type.replace(/_/g, ' ')}
                    </h4>
                    {getSeverityBadge(threat.severity)}
                  </div>
                  <p className="text-sm text-muted-foreground" data-testid={`threat-message-${idx}`}>
                    {threat.message}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
