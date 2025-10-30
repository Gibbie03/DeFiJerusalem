import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, useLocation } from 'wouter';
import { Shield, AlertTriangle, ExternalLink, Twitter, Github, ArrowLeft, Trash2, CheckCircle2, XCircle, Clock, TrendingUp, Globe, AlertOctagon } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import type { BlacklistEntry } from '@shared/schema';

export default function BlacklistDetails() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: blacklist = [] } = useQuery<BlacklistEntry[]>({
    queryKey: ['/api/blacklist'],
  });

  const entry = blacklist.find(e => e.id === params.id);

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
    if (score >= 90) {
      return { label: 'HIGHLY LEGITIMATE', color: 'bg-green-500/10 text-green-500 border-green-500/20', icon: CheckCircle2 };
    } else if (score >= 70) {
      return { label: 'LEGITIMATE', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: CheckCircle2 };
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

  return (
    <div className="bg-background">
      <main className="max-w-screen-2xl mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
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
              <div>
                <h1 className="text-3xl font-bold mb-2" data-testid="protocol-name">
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
            Remove from Blacklist
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

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content - Left Side (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Links Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Protocol Links
                </CardTitle>
                <CardDescription>Official protocol resources and social media</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {entry.website && (
                  <div className="flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium w-24">Website:</span>
                    <a
                      href={entry.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-600 hover:underline flex-1 truncate"
                      data-testid="link-website"
                    >
                      {entry.website}
                    </a>
                  </div>
                )}
                {entry.twitter && (
                  <div className="flex items-center gap-2">
                    <Twitter className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium w-24">Twitter:</span>
                    <a
                      href={entry.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-600 hover:underline flex-1 truncate"
                      data-testid="link-twitter"
                    >
                      {entry.twitter}
                    </a>
                  </div>
                )}
                {entry.github && (
                  <div className="flex items-center gap-2">
                    <Github className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium w-24">GitHub:</span>
                    <a
                      href={entry.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-600 hover:underline flex-1 truncate"
                      data-testid="link-github"
                    >
                      {entry.github}
                    </a>
                  </div>
                )}
                {!entry.website && !entry.twitter && !entry.github && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No links available for this protocol
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Reason Card */}
            {entry.reason && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Blacklist Reason
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground" data-testid="blacklist-reason">{entry.reason}</p>
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
                <CardDescription>Security vulnerabilities and suspicious patterns identified</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {entry.threats.map((threat, idx) => (
                    <div
                      key={idx}
                      className="p-4 border rounded-lg hover-elevate"
                      data-testid={`threat-${idx}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="shrink-0">
                          {getSeverityBadge(threat.severity)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold mb-1" data-testid={`threat-type-${idx}`}>
                            {threat.type.replace(/_/g, ' ')}
                          </h4>
                          <p className="text-sm text-muted-foreground" data-testid={`threat-message-${idx}`}>
                            {threat.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Right Side (1/3 width) */}
          <div className="space-y-6">
            {/* Legitimacy Score Card */}
            {legitimacyRating && entry.legitimacyScore !== undefined && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Legitimacy Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center p-6 border rounded-lg">
                    <div className="text-5xl font-bold mb-2" data-testid="legitimacy-score">
                      {entry.legitimacyScore}
                    </div>
                    <div className="text-sm text-muted-foreground mb-4">out of 100</div>
                    <Badge variant="outline" className={`${legitimacyRating.color} px-3 py-1`}>
                      {(() => {
                        const Icon = legitimacyRating.icon;
                        return <Icon className="w-4 h-4 mr-2 inline" />;
                      })()}
                      {legitimacyRating.label}
                    </Badge>
                  </div>
                  {entry.legitimacyScore >= 70 && (
                    <Alert className="border-green-500/20 bg-green-500/5">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <AlertDescription className="text-sm">
                        This protocol may be removed from the blacklist upon next manual vetting cycle.
                      </AlertDescription>
                    </Alert>
                  )}
                  {entry.lastVetted && (
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Last vetted: {new Date(entry.lastVetted).toLocaleDateString()}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Security Metrics Card */}
            {entry.securityMetrics && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Security Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Audit Status:</span>
                      <span className="font-medium">
                        {entry.securityMetrics.hasAudit ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500 inline" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500 inline" />
                        )}
                      </span>
                    </div>
                    {entry.securityMetrics.auditFirms.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        Audited by: {entry.securityMetrics.auditFirms.join(', ')}
                      </div>
                    )}
                    <Separator />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">TVL:</span>
                      <span className="font-medium">
                        ${entry.securityMetrics.tvl.toLocaleString()}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Open Source:</span>
                      <span className="font-medium">
                        {entry.securityMetrics.hasOpenSource ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500 inline" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500 inline" />
                        )}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Multisig:</span>
                      <span className="font-medium">
                        {entry.securityMetrics.hasMultisig ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500 inline" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500 inline" />
                        )}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Timelock:</span>
                      <span className="font-medium">
                        {entry.securityMetrics.hasTimelock ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500 inline" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500 inline" />
                        )}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Bug Bounty:</span>
                      <span className="font-medium">
                        {entry.securityMetrics.hasBugBounty ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500 inline" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500 inline" />
                        )}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Doxxed Team:</span>
                      <span className="font-medium">
                        {entry.securityMetrics.hasDoxxedTeam ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500 inline" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500 inline" />
                        )}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Protocol Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Flagged:</span>
                  <span className="font-medium" data-testid="flagged-date">
                    {new Date(entry.timestamp).toLocaleDateString()}
                  </span>
                </div>
                {entry.lastVetted && (
                  <>
                    <Separator />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Last Vetted:</span>
                      <span className="font-medium">
                        {new Date(entry.lastVetted).toLocaleDateString()}
                      </span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
