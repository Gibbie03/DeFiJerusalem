import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, TrendingUp, AlertTriangle, CheckCircle2, XCircle, Globe, Twitter, Github, ExternalLink, Bug, Siren, Activity } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Protocol } from "@shared/schema";

interface ProtocolHack {
  date: string;
  name: string;
  amount: number;
  chain: string;
  category: string;
  technique: string;
  link: string;
}

interface BugBountyProgram {
  name: string;
  url: string;
  maxBounty: number;
  assets: string[];
  highestBountyLabel: string;
}

interface ProtocolSecurityData {
  hacks: ProtocolHack[];
  totalLost: number;
  hacksCount: number;
  bugBounty: BugBountyProgram | null;
  hasBugBounty: boolean;
  lastIncident: ProtocolHack | null;
}

export default function ProtocolDetail() {
  const [, params] = useRoute("/protocol/:id");
  const protocolId = params?.id;

  const { data: protocol, isLoading: protocolLoading } = useQuery<Protocol>({
    queryKey: [`/api/protocols/${protocolId}`],
    enabled: !!protocolId,
  });

  const { data: securityScans } = useQuery<Record<string, any>>({
    queryKey: ['/api/scans'],
  });

  const { data: securityAgg, isLoading: aggLoading } = useQuery<ProtocolSecurityData>({
    queryKey: [`/api/protocols/${protocolId}/security`],
    enabled: !!protocolId,
    staleTime: 1000 * 60 * 30, // 30 min — cached on server anyway
  });

  const securityScan = protocolId && securityScans ? securityScans[protocolId] : null;

  if (protocolLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!protocol) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>Protocol not found.</AlertDescription>
        </Alert>
      </div>
    );
  }

  const score = securityScan?.score ?? protocol.securityScore ?? 0;

  const getSeverityBadge = (s: number) => {
    if (s >= 80) return <Badge variant="destructive">CRITICAL</Badge>;
    if (s >= 60) return <Badge variant="destructive" className="bg-orange-600">HIGH</Badge>;
    if (s >= 40) return <Badge variant="outline" className="border-yellow-500 text-yellow-500">MEDIUM</Badge>;
    if (s >= 20) return <Badge variant="outline" className="border-blue-500 text-blue-500">LOW</Badge>;
    return <Badge variant="outline" className="border-green-500 text-green-500">SAFE</Badge>;
  };

  const fmt = (n: number | null | undefined) => {
    if (n === null || n === undefined || isNaN(n)) return 'N/A';
    if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
    if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
    if (n >= 1e3) return `$${(n / 1e3).toFixed(2)}K`;
    return `$${n.toFixed(2)}`;
  };

  const fmtDate = (d: string) => {
    if (!d) return 'Unknown';
    try { return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }); }
    catch { return d; }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              {protocol.logo && (
                <img src={protocol.logo} alt={protocol.name} className="w-16 h-16 rounded-lg object-contain bg-muted" />
              )}
              <div>
                <h1 className="text-3xl font-bold">{protocol.name}</h1>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <Badge variant="outline">{protocol.category}</Badge>
                  {protocol.chains?.slice(0, 5).map(c => (
                    <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>
                  ))}
                  {(protocol.chains?.length ?? 0) > 5 && (
                    <span className="text-xs text-muted-foreground">+{protocol.chains.length - 5} more</span>
                  )}
                </div>
              </div>
            </div>

            {/* Key stats */}
            <div className="flex gap-6 flex-wrap">
              <div className="text-right">
                <div className="text-xs text-muted-foreground uppercase tracking-wide">TVL</div>
                <div className="text-2xl font-bold text-primary">{fmt(protocol.tvl)}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Security</div>
                <div className="mt-1">{getSeverityBadge(score)}</div>
                <div className="text-xs text-muted-foreground mt-1">Score: {(100 - score).toFixed(0)}/100</div>
              </div>
              {securityAgg?.hasBugBounty && (
                <div className="text-right">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Bug Bounty</div>
                  <div className="text-lg font-bold text-green-500">{securityAgg.bugBounty?.highestBountyLabel}</div>
                  <div className="text-xs text-muted-foreground">max payout</div>
                </div>
              )}
              {securityAgg && securityAgg.hacksCount > 0 && (
                <div className="text-right">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Incidents</div>
                  <div className="text-lg font-bold text-destructive">{securityAgg.hacksCount}</div>
                  <div className="text-xs text-muted-foreground">{fmt(securityAgg.totalLost)} lost</div>
                </div>
              )}
            </div>
          </div>

          {protocol.description && (
            <p className="text-sm text-muted-foreground mt-3">{protocol.description}</p>
          )}

          {/* Links */}
          <div className="flex gap-3 mt-3 flex-wrap">
            {protocol.website && (
              <a href={protocol.website} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <Globe className="w-4 h-4" /> Website
              </a>
            )}
            {protocol.twitter && (
              <a href={`https://twitter.com/${protocol.twitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <Twitter className="w-4 h-4" /> Twitter
              </a>
            )}
            {protocol.github && (
              <a href={protocol.github} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <Github className="w-4 h-4" /> GitHub
              </a>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="security">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="security"><Shield className="w-4 h-4 mr-1" />Security</TabsTrigger>
          <TabsTrigger value="incidents"><Siren className="w-4 h-4 mr-1" />Incidents</TabsTrigger>
          <TabsTrigger value="bounty"><Bug className="w-4 h-4 mr-1" />Bug Bounty</TabsTrigger>
          <TabsTrigger value="metrics"><Activity className="w-4 h-4 mr-1" />Metrics</TabsTrigger>
        </TabsList>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Audit info */}
            <Card>
              <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Audit Status</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Audited</span>
                  {protocol.audited
                    ? <CheckCircle2 className="w-5 h-5 text-green-500" />
                    : <XCircle className="w-5 h-5 text-destructive" />}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Audit reports</span>
                  <span className="font-semibold">{protocol.auditCount ?? 0}</span>
                </div>
                {protocol.auditNote && (
                  <p className="text-xs text-muted-foreground border-t pt-2">{protocol.auditNote}</p>
                )}
                {protocol.auditLinks && protocol.auditLinks.length > 0 && (
                  <div className="space-y-1 border-t pt-2">
                    {protocol.auditLinks.map((link, i) => (
                      <a key={i} href={link} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-primary hover:underline">
                        <ExternalLink className="w-3 h-3" /> Report {i + 1}
                      </a>
                    ))}
                  </div>
                )}
                {protocol.defiAuditReports && protocol.defiAuditReports.length > 0 && (
                  <div className="space-y-2 border-t pt-2">
                    {protocol.defiAuditReports.map((r, i) => (
                      <div key={i} className="text-xs">
                        <div className="font-medium">{r.auditor}</div>
                        <div className="text-muted-foreground">{fmtDate(r.date)}</div>
                        {r.reportUrl && (
                          <a href={r.reportUrl} target="_blank" rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-1">
                            <ExternalLink className="w-3 h-3" /> View Report
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Security score breakdown */}
            <Card>
              <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Risk Assessment</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Risk score</span>
                  <span className="font-bold">{score.toFixed(0)} / 100</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${score >= 80 ? 'bg-destructive' : score >= 60 ? 'bg-orange-500' : score >= 40 ? 'bg-yellow-500' : score >= 20 ? 'bg-blue-500' : 'bg-green-500'}`}
                    style={{ width: `${Math.min(score, 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Multisig</span>
                  {protocol.defiHasMultisig
                    ? <CheckCircle2 className="w-5 h-5 text-green-500" />
                    : <XCircle className="w-5 h-5 text-muted-foreground" />}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Timelock</span>
                  {protocol.defiHasTimelock
                    ? <CheckCircle2 className="w-5 h-5 text-green-500" />
                    : <XCircle className="w-5 h-5 text-muted-foreground" />}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Bug bounty</span>
                  {securityAgg?.hasBugBounty
                    ? <CheckCircle2 className="w-5 h-5 text-green-500" />
                    : aggLoading
                    ? <span className="text-xs text-muted-foreground">Checking…</span>
                    : <XCircle className="w-5 h-5 text-muted-foreground" />}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Known incidents</span>
                  {securityAgg
                    ? <span className={`font-semibold ${securityAgg.hacksCount > 0 ? 'text-destructive' : 'text-green-500'}`}>
                        {securityAgg.hacksCount}
                      </span>
                    : <span className="text-xs text-muted-foreground">Loading…</span>}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Threats from scan */}
          {securityScan?.threats && securityScan.threats.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Detected Threats</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {securityScan.threats.map((t: any, i: number) => (
                    <div key={i} className="flex items-start gap-3 p-2 rounded-md border">
                      <AlertTriangle className={`w-4 h-4 mt-0.5 shrink-0 ${t.severity === 'CRITICAL' || t.severity === 'HIGH' ? 'text-destructive' : 'text-yellow-500'}`} />
                      <div>
                        <div className="text-sm font-medium">{t.type}</div>
                        <div className="text-xs text-muted-foreground">{t.message}</div>
                      </div>
                      <Badge variant={t.severity === 'CRITICAL' ? 'destructive' : 'outline'} className="ml-auto shrink-0 text-xs">
                        {t.severity}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Incidents Tab */}
        <TabsContent value="incidents" className="space-y-4">
          {aggLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : securityAgg && securityAgg.hacksCount > 0 ? (
            <>
              <div className="flex items-center gap-3 p-4 rounded-lg border border-destructive/20 bg-destructive/5">
                <Siren className="w-6 h-6 text-destructive shrink-0" />
                <div>
                  <div className="font-semibold">{securityAgg.hacksCount} known incident{securityAgg.hacksCount > 1 ? 's' : ''}</div>
                  <div className="text-sm text-muted-foreground">Total lost: <span className="text-destructive font-medium">{fmt(securityAgg.totalLost)}</span></div>
                </div>
              </div>
              <div className="space-y-3">
                {securityAgg.hacks.map((hack, i) => (
                  <Card key={i}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                          <div className="font-semibold">{hack.name}</div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {fmtDate(hack.date)} · {hack.chain || 'Multiple chains'}
                          </div>
                          {hack.technique && (
                            <div className="text-xs text-muted-foreground mt-1">Technique: {hack.technique}</div>
                          )}
                          {hack.category && (
                            <Badge variant="outline" className="mt-2 text-xs">{hack.category}</Badge>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-xl font-bold text-destructive">{fmt(hack.amount)}</div>
                          <div className="text-xs text-muted-foreground">lost</div>
                          {hack.link && (
                            <a href={hack.link} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs text-primary hover:underline mt-1 justify-end">
                              <ExternalLink className="w-3 h-3" /> Details
                            </a>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <CheckCircle2 className="w-12 h-12 text-green-500" />
                  <div className="font-semibold">No known incidents</div>
                  <div className="text-sm text-muted-foreground">
                    No hacks or exploits have been recorded for {protocol.name} in DeFiLlama's incident database.
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Bug Bounty Tab */}
        <TabsContent value="bounty" className="space-y-4">
          {aggLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : securityAgg?.bugBounty ? (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                    <Bug className="w-6 h-6 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-lg">{securityAgg.bugBounty.name} Bug Bounty</div>
                    <div className="text-sm text-muted-foreground mt-1">Hosted on Immunefi</div>
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div className="p-3 rounded-lg border">
                        <div className="text-xs text-muted-foreground uppercase tracking-wide">Max Payout</div>
                        <div className="text-2xl font-bold text-green-500 mt-1">{securityAgg.bugBounty.highestBountyLabel}</div>
                      </div>
                      {securityAgg.bugBounty.assets.length > 0 && (
                        <div className="p-3 rounded-lg border">
                          <div className="text-xs text-muted-foreground uppercase tracking-wide">Asset Types</div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {securityAgg.bugBounty.assets.slice(0, 4).map((a, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">{a}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <a
                      href={securityAgg.bugBounty.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                      <ExternalLink className="w-4 h-4" /> View on Immunefi
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <XCircle className="w-12 h-12 text-muted-foreground" />
                  <div className="font-semibold">No bug bounty program found</div>
                  <div className="text-sm text-muted-foreground">
                    {protocol.name} does not currently have a listed bug bounty on Immunefi.
                    A bug bounty program is a positive security signal — protocols without one may be riskier to use.
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Metrics Tab */}
        <TabsContent value="metrics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">TVL</CardTitle></CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{fmt(protocol.tvl)}</div>
                <div className={`text-sm mt-1 ${(protocol.change24h ?? 0) >= 0 ? 'text-green-500' : 'text-destructive'}`}>
                  {(protocol.change24h ?? 0) >= 0 ? '+' : ''}{(protocol.change24h ?? 0).toFixed(2)}% (24h)
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">24h Volume</CardTitle></CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{fmt(protocol.volume24h)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Age</CardTitle></CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{protocol.age ? `${protocol.age}d` : 'N/A'}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {protocol.age && protocol.age > 365 ? `~${Math.floor(protocol.age / 365)}y ${Math.floor((protocol.age % 365) / 30)}mo` : ''}
                </div>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Chains</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {protocol.chains?.map(c => (
                  <Badge key={c} variant="outline">{c}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
