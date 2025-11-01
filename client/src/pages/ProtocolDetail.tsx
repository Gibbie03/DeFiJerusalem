import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Shield, TrendingUp, Activity, ExternalLink, AlertTriangle, CheckCircle2, XCircle, Globe, Twitter, Github } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Protocol } from "@shared/schema";

export default function ProtocolDetail() {
  const [, params] = useRoute("/protocol/:id");
  const protocolId = params?.id;

  const { data: protocol, isLoading: protocolLoading, error: protocolError } = useQuery<Protocol>({
    queryKey: [`/api/protocols/${protocolId}`],
    enabled: !!protocolId,
  });

  const { data: securityScans, isLoading: scansLoading } = useQuery<Record<string, any>>({
    queryKey: ['/api/scans'],
  });

  const securityScan = protocolId && securityScans ? securityScans[protocolId] : null;

  if (protocolLoading || scansLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!protocol) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Protocol not found. The protocol you're looking for doesn't exist.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const getSeverityBadge = (score: number) => {
    if (score >= 80) return <Badge variant="destructive" data-testid="badge-severity-critical">CRITICAL</Badge>;
    if (score >= 60) return <Badge variant="destructive" className="bg-orange-600" data-testid="badge-severity-high">HIGH</Badge>;
    if (score >= 40) return <Badge variant="outline" className="border-yellow-600 text-yellow-600" data-testid="badge-severity-medium">MEDIUM</Badge>;
    if (score >= 20) return <Badge variant="outline" className="border-blue-600 text-blue-600" data-testid="badge-severity-low">LOW</Badge>;
    return <Badge variant="outline" className="border-green-600 text-green-600" data-testid="badge-severity-safe">SAFE</Badge>;
  };

  const formatNumber = (num: number | null | undefined) => {
    if (num === null || num === undefined || isNaN(num)) return 'N/A';
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Protocol Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              {protocol.logo && (
                <img
                  src={protocol.logo}
                  alt={protocol.name}
                  className="w-16 h-16 rounded-lg"
                  data-testid="img-protocol-logo"
                />
              )}
              <div>
                <CardTitle className="text-3xl" data-testid="text-protocol-name">
                  {protocol.name}
                </CardTitle>
                <CardDescription className="mt-2">
                  <Badge variant="outline" data-testid="badge-category">{protocol.category}</Badge>
                  {protocol.chains && protocol.chains.length > 0 && (
                    <span className="ml-2 text-muted-foreground">
                      {protocol.chains.join(', ')}
                    </span>
                  )}
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              {protocol.securityScore !== null && protocol.securityScore !== undefined && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Security:</span>
                  {getSeverityBadge(protocol.securityScore)}
                </div>
              )}
              {securityScan?.isBlacklisted && (
                <Badge variant="destructive" className="gap-1" data-testid="badge-blacklisted">
                  <XCircle className="w-3 h-3" />
                  Blacklisted
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" data-testid="tab-overview">
            <TrendingUp className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="security" data-testid="tab-security">
            <Shield className="w-4 h-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="analytics" data-testid="tab-analytics">
            <Activity className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Value Locked</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-tvl">
                  {formatNumber(protocol.tvl)}
                </div>
                {protocol.change24h !== null && protocol.change24h !== undefined && !isNaN(protocol.change24h) && (
                  <p className={`text-sm ${protocol.change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {protocol.change24h >= 0 ? '+' : ''}{protocol.change24h.toFixed(2)}% (24h)
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">24h Volume</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-volume">
                  {formatNumber(protocol.volume24h)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Audit Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {protocol.audited ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <span className="text-lg font-semibold text-green-600" data-testid="text-audit-status">Audited</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-muted-foreground" />
                      <span className="text-lg font-semibold text-muted-foreground" data-testid="text-audit-status">Not Audited</span>
                    </>
                  )}
                </div>
                {protocol.auditCount > 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {protocol.auditCount} audit{protocol.auditCount !== 1 ? 's' : ''}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Description & Links */}
          <Card>
            <CardHeader>
              <CardTitle>About {protocol.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {protocol.description && (
                <p className="text-muted-foreground" data-testid="text-description">
                  {protocol.description}
                </p>
              )}
              
              <div className="flex flex-wrap gap-2">
                {protocol.website && (
                  <Button variant="outline" size="sm" asChild data-testid="button-website">
                    <a href={protocol.website} target="_blank" rel="noopener noreferrer">
                      <Globe className="w-4 h-4 mr-2" />
                      Website
                      <ExternalLink className="w-3 h-3 ml-2" />
                    </a>
                  </Button>
                )}
                {protocol.twitter && (
                  <Button variant="outline" size="sm" asChild data-testid="button-twitter">
                    <a href={protocol.twitter} target="_blank" rel="noopener noreferrer">
                      <Twitter className="w-4 h-4 mr-2" />
                      Twitter
                      <ExternalLink className="w-3 h-3 ml-2" />
                    </a>
                  </Button>
                )}
                {protocol.github && (
                  <Button variant="outline" size="sm" asChild data-testid="button-github">
                    <a href={protocol.github} target="_blank" rel="noopener noreferrer">
                      <Github className="w-4 h-4 mr-2" />
                      GitHub
                      <ExternalLink className="w-3 h-3 ml-2" />
                    </a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4">
          {securityScan ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Security Score</CardTitle>
                  <CardDescription>Comprehensive security analysis results</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-medium">Overall Security Score</span>
                    <div className="flex items-center gap-2">
                      <span className="text-3xl font-bold" data-testid="text-security-score">
                        {securityScan.score}/100
                      </span>
                      {getSeverityBadge(securityScan.score)}
                    </div>
                  </div>

                  {securityScan.isBlacklisted && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        This protocol has been blacklisted due to critical security concerns.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {securityScan.threats && securityScan.threats.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Detected Threats ({securityScan.threats.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {securityScan.threats.map((threat: any, idx: number) => (
                        <div key={idx} className="border-l-4 border-l-destructive pl-4 py-2" data-testid={`threat-item-${idx}`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold">{threat.type}</span>
                            <Badge variant={threat.severity === 'HIGH' ? 'destructive' : 'outline'}>
                              {threat.severity}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{threat.description}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No security scan available for this protocol yet.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Wallets</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Daily Active</span>
                  <span className="font-semibold" data-testid="text-daily-wallets">
                    {protocol.dailyActiveWallets?.toLocaleString() || '0'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Weekly Active</span>
                  <span className="font-semibold" data-testid="text-weekly-wallets">
                    {protocol.weeklyActiveWallets?.toLocaleString() || '0'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Monthly Active</span>
                  <span className="font-semibold" data-testid="text-monthly-wallets">
                    {protocol.monthlyActiveWallets?.toLocaleString() || '0'}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Transaction Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">24h Transactions</span>
                  <span className="font-semibold" data-testid="text-transactions-24h">
                    {protocol.transactions24h?.toLocaleString() || '0'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">7d Transactions</span>
                  <span className="font-semibold" data-testid="text-transactions-7d">
                    {protocol.transactions7d?.toLocaleString() || '0'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">24h Contract Calls</span>
                  <span className="font-semibold" data-testid="text-contract-calls">
                    {protocol.contractCalls24h?.toLocaleString() || '0'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {protocol.dailyActiveWallets === 0 && protocol.weeklyActiveWallets === 0 && protocol.monthlyActiveWallets === 0 && (
            <Alert>
              <Activity className="h-4 w-4" />
              <AlertDescription>
                Activity metrics are currently unavailable. Data will be populated when blockchain analytics integration is complete.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
