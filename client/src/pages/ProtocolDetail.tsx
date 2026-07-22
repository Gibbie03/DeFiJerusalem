import { useState } from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Shield, TrendingUp, AlertTriangle, CheckCircle2, XCircle,
  Globe, Twitter, Github, ExternalLink, Bug, Siren, Activity,
  Download, FileText, Lock, Clock, Eye, Zap, BarChart2, MessageSquare, Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Protocol } from "@shared/schema";
import ProtocolChatPanel from "@/components/ProtocolChatPanel";

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Audit firm name extraction (client-side) ─────────────────────────────────

const AUDIT_FIRM_DOMAINS: { domain: string; firm: string }[] = [
  { domain: 'certik.com',              firm: 'CertiK' },
  { domain: 'hacken.io',               firm: 'Hacken' },
  { domain: 'quantstamp.com',          firm: 'Quantstamp' },
  { domain: 'openzeppelin.com',        firm: 'OpenZeppelin' },
  { domain: 'trailofbits.com',         firm: 'Trail of Bits' },
  { domain: 'consensys.io',            firm: 'Consensys Diligence' },
  { domain: 'consensys.net',           firm: 'Consensys Diligence' },
  { domain: 'diligence.consensys.net', firm: 'Consensys Diligence' },
  { domain: 'peckshield.com',          firm: 'PeckShield' },
  { domain: 'slowmist.com',            firm: 'SlowMist' },
  { domain: 'dedaub.com',              firm: 'Dedaub' },
  { domain: 'chainsecurity.com',       firm: 'ChainSecurity' },
  { domain: 'sigmaprime.io',           firm: 'Sigma Prime' },
  { domain: 'abdk.consulting',         firm: 'ABDK' },
  { domain: 'spearbit.com',            firm: 'Spearbit' },
  { domain: 'sherlock.xyz',            firm: 'Sherlock' },
  { domain: 'code4rena.com',           firm: 'Code4rena' },
  { domain: 'github.com/code-423n4',   firm: 'Code4rena' },
  { domain: 'mixbytes.io',             firm: 'MixBytes' },
  { domain: 'halborn.com',             firm: 'Halborn' },
  { domain: 'zellic.io',               firm: 'Zellic' },
  { domain: 'cantina.xyz',             firm: 'Cantina' },
  { domain: 'nethermind.io',           firm: 'Nethermind' },
  { domain: 'immunefi.com',            firm: 'Immunefi' },
  { domain: 'iosiro.com',              firm: 'Iosiro' },
  { domain: 'solidified.io',           firm: 'Solidified' },
  { domain: 'zokyo.io',               firm: 'Zokyo' },
  { domain: 'oxor.io',                 firm: 'Oxor' },
  { domain: 'cyfrin.io',               firm: 'Cyfrin' },
  { domain: 'macro.security',          firm: 'Macro' },
  { domain: 'omniscia.io',             firm: 'Omniscia' },
  { domain: 'kudelskisecurity.com',    firm: 'Kudelski Security' },
  { domain: 'least-authority.com',     firm: 'Least Authority' },
];

// Names to scan for in URL paths (self-hosted reports)
const AUDIT_FIRM_NAMES: { slug: string; firm: string }[] = [
  { slug: 'certik',       firm: 'CertiK' },
  { slug: 'hacken',       firm: 'Hacken' },
  { slug: 'quantstamp',   firm: 'Quantstamp' },
  { slug: 'openzeppelin', firm: 'OpenZeppelin' },
  { slug: 'trailofbits',  firm: 'Trail of Bits' },
  { slug: 'trail-of-bits',firm: 'Trail of Bits' },
  { slug: 'peckshield',   firm: 'PeckShield' },
  { slug: 'slowmist',     firm: 'SlowMist' },
  { slug: 'dedaub',       firm: 'Dedaub' },
  { slug: 'chainsecurity', firm: 'ChainSecurity' },
  { slug: 'sigmaprime',   firm: 'Sigma Prime' },
  { slug: 'sigma-prime',  firm: 'Sigma Prime' },
  { slug: 'abdk',         firm: 'ABDK' },
  { slug: 'spearbit',     firm: 'Spearbit' },
  { slug: 'sherlock',     firm: 'Sherlock' },
  { slug: 'code4rena',    firm: 'Code4rena' },
  { slug: 'mixbytes',     firm: 'MixBytes' },
  { slug: 'halborn',      firm: 'Halborn' },
  { slug: 'zellic',       firm: 'Zellic' },
  { slug: 'cantina',      firm: 'Cantina' },
  { slug: 'nethermind',   firm: 'Nethermind' },
  { slug: 'immunefi',     firm: 'Immunefi' },
  { slug: 'iosiro',       firm: 'Iosiro' },
  { slug: 'solidified',   firm: 'Solidified' },
  { slug: 'zokyo',        firm: 'Zokyo' },
  { slug: 'cyfrin',       firm: 'Cyfrin' },
  { slug: 'omniscia',     firm: 'Omniscia' },
  { slug: 'kudelski',     firm: 'Kudelski Security' },
  { slug: 'least-authority', firm: 'Least Authority' },
  { slug: 'consensys',    firm: 'Consensys Diligence' },
  { slug: 'oxor',         firm: 'Oxor' },
];

function extractFirmFromUrl(url: string): string | null {
  const lower = url.toLowerCase();
  // Pass 1: known firm domains
  for (const { domain, firm } of AUDIT_FIRM_DOMAINS) {
    if (lower.includes(domain)) return firm;
  }
  // Pass 2: auditor name slug in URL path (self-hosted, GitHub mirrors)
  for (const { slug, firm } of AUDIT_FIRM_NAMES) {
    if (lower.includes(slug)) return firm;
  }
  return null;
}

// Build a unified, deduplicated audit list from both sources
interface AuditEntry {
  firm: string | null;
  date: string | null;
  url: string | null;
  label: string;
}

function buildAuditEntries(
  auditLinks: string[] | null | undefined,
  defiAuditReports: { auditor: string; date: string; reportUrl?: string }[] | null | undefined,
): AuditEntry[] {
  const entries: AuditEntry[] = [];
  const seenUrls = new Set<string>();

  // Structured reports first (have auditor name + date)
  for (const r of defiAuditReports ?? []) {
    const url = r.reportUrl ?? null;
    if (url) seenUrls.add(url.toLowerCase());
    entries.push({ firm: r.auditor || null, date: r.date || null, url, label: r.auditor || 'Audit Report' });
  }

  // Raw links that aren't already covered
  for (const link of auditLinks ?? []) {
    if (seenUrls.has(link.toLowerCase())) continue;
    seenUrls.add(link.toLowerCase());
    const firm = extractFirmFromUrl(link);
    entries.push({ firm, date: null, url: link, label: firm ? `${firm} Report` : 'Audit Report' });
  }

  return entries;
}

// ─── Score bar helper ─────────────────────────────────────────────────────────

function ScoreBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="flex items-center gap-2 flex-1">
      <div className="flex-1 bg-muted rounded-full h-1.5">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-mono text-muted-foreground w-10 text-right">{value}/{max}</span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ProtocolDetail() {
  const [, params] = useRoute("/protocol/:id");
  const [chatOpen, setChatOpen] = useState(false);
  const protocolId = params?.id;

  const { data: protocol, isLoading: protocolLoading } = useQuery<Protocol>({
    queryKey: [`/api/protocols/${protocolId}`],
    enabled: !!protocolId,
    staleTime: 0,
    refetchOnMount: true,
  });

  const { data: securityScans } = useQuery<Record<string, any>>({
    queryKey: ['/api/scans'],
  });

  const { data: securityAgg, isLoading: aggLoading } = useQuery<ProtocolSecurityData>({
    queryKey: [`/api/protocols/${protocolId}/security`],
    enabled: !!protocolId,
    staleTime: 1000 * 60 * 30,
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
  const bd = securityScan?.breakdown ?? null;

  const getSeverityBadge = (s: number) => {
    if (s >= 80) return <Badge variant="outline" className="border-green-500 text-green-500">SAFE</Badge>;
    if (s >= 65) return <Badge variant="outline" className="border-blue-500 text-blue-500">LOW RISK</Badge>;
    if (s >= 50) return <Badge variant="outline" className="border-yellow-500 text-yellow-500">MODERATE</Badge>;
    if (s >= 30) return <Badge variant="destructive" className="bg-orange-600">HIGH RISK</Badge>;
    return <Badge variant="destructive">CRITICAL RISK</Badge>;
  };

  const scoreBarColor = (s: number, max: number) => {
    const pct = (s / max) * 100;
    if (pct >= 75) return 'bg-green-500';
    if (pct >= 50) return 'bg-blue-500';
    if (pct >= 25) return 'bg-yellow-500';
    return 'bg-destructive';
  };

  const handleDownloadReport = () => {
    window.open(`/api/protocols/${protocolId}/score-report.pdf`, '_blank');
  };

  const handleAskAI = () => {
    setChatOpen(true);
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

  const auditEntries = buildAuditEntries(protocol.auditLinks, protocol.defiAuditReports);
  const confirmedFirms = [...new Set(auditEntries.map(e => e.firm).filter(Boolean))] as string[];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Inline AI chat panel */}
      {chatOpen && protocol && (
        <ProtocolChatPanel
          protocolName={protocol.name}
          onClose={() => setChatOpen(false)}
        />
      )}

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
                <div className="text-xs text-muted-foreground uppercase tracking-wide">DFJ Score</div>
                <div className="mt-1">{getSeverityBadge(score)}</div>
                <div className="text-xs text-muted-foreground mt-1">{score.toFixed(0)} / 97</div>
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

          {/* Links + Download */}
          <div className="flex items-center justify-between gap-3 mt-3 flex-wrap">
            <div className="flex gap-3 flex-wrap">
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
                <a href={protocol.github.startsWith('http') ? protocol.github : `https://github.com/${protocol.github}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <Github className="w-4 h-4" /> GitHub
                </a>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={handleAskAI} className="gap-2 shrink-0">
                <MessageSquare className="w-4 h-4" />
                Ask AI
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadReport} className="gap-2 shrink-0">
                <Download className="w-4 h-4" />
                Score Report
              </Button>
            </div>
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

        {/* ── Security Tab ──────────────────────────────────────────────────── */}
        <TabsContent value="security" className="space-y-4">

          {/* Row 1: Audit details + Risk Assessment */}
          <div className="grid gap-4 md:grid-cols-2">

            {/* Audit Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Audit Status
                </CardTitle>
              </CardHeader>
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

                {/* Confirmed auditor badges */}
                {confirmedFirms.length > 0 && (
                  <div className="border-t pt-2">
                    <div className="text-xs text-muted-foreground mb-1.5">Confirmed auditors</div>
                    <div className="flex flex-wrap gap-1.5">
                      {confirmedFirms.map(f => (
                        <Badge key={f} variant="secondary" className="text-xs bg-green-500/10 text-green-400 border border-green-500/20">
                          <CheckCircle2 className="w-3 h-3 mr-1" />{f}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {protocol.auditNote && (
                  <p className="text-xs text-muted-foreground border-t pt-2">{protocol.auditNote}</p>
                )}

                {/* Unified audit report list */}
                {auditEntries.length > 0 && (
                  <div className="border-t pt-2 space-y-2">
                    <div className="text-xs text-muted-foreground mb-1">Audit reports</div>
                    {auditEntries.map((entry, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {entry.url ? (
                              <a href={entry.url} target="_blank" rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline flex items-center gap-1 font-medium">
                                {entry.label}
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            ) : (
                              <span className="text-xs font-medium">{entry.label}</span>
                            )}
                            {entry.firm && !entry.url && (
                              <Badge variant="outline" className="text-xs px-1 py-0">{entry.firm}</Badge>
                            )}
                          </div>
                          {entry.date && (
                            <div className="text-xs text-muted-foreground">{fmtDate(entry.date)}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!protocol.audited && auditEntries.length === 0 && (
                  <p className="text-xs text-muted-foreground border-t pt-2">
                    No audit reports found for this protocol. Unaudited protocols carry higher smart contract risk.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Risk Assessment */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <Shield className="w-4 h-4" /> Risk Assessment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">DFJ Security Score</span>
                  <span className="font-bold">{score.toFixed(0)} / 97</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${score >= 80 ? 'bg-green-500' : score >= 65 ? 'bg-blue-500' : score >= 50 ? 'bg-yellow-500' : score >= 30 ? 'bg-orange-500' : 'bg-destructive'}`}
                    style={{ width: `${Math.min((score / 97) * 100, 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-muted-foreground" />Multisig</span>
                  <span className="flex items-center gap-1.5">
                    {protocol.defiHasMultisig
                      ? <CheckCircle2 className="w-5 h-5 text-green-500" />
                      : <XCircle className="w-5 h-5 text-muted-foreground" />}
                    {protocol.defiHasMultisig && protocol.auditNote?.toLowerCase().includes('independently verified on-chain') && (
                      <span className="text-[10px] font-medium text-blue-400 border border-blue-400/30 rounded px-1 py-0.5 leading-none">on-chain ✓</span>
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-muted-foreground" />Timelock</span>
                  {protocol.defiHasTimelock
                    ? <CheckCircle2 className="w-5 h-5 text-green-500" />
                    : <XCircle className="w-5 h-5 text-muted-foreground" />}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm flex items-center gap-1.5"><Bug className="w-3.5 h-3.5 text-muted-foreground" />Bug bounty</span>
                  {securityAgg?.hasBugBounty
                    ? <CheckCircle2 className="w-5 h-5 text-green-500" />
                    : aggLoading
                    ? <span className="text-xs text-muted-foreground">Checking…</span>
                    : <XCircle className="w-5 h-5 text-muted-foreground" />}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm flex items-center gap-1.5"><Eye className="w-3.5 h-3.5 text-muted-foreground" />Open source</span>
                  <span className="flex items-center gap-1.5">
                    {protocol.github
                      ? <CheckCircle2 className="w-5 h-5 text-green-500" />
                      : <XCircle className="w-5 h-5 text-muted-foreground" />}
                    {protocol.github && protocol.auditNote?.toLowerCase().includes('defisafety') && (
                      <span className="text-[10px] font-medium text-blue-400 border border-blue-400/30 rounded px-1 py-0.5 leading-none">DeFiSafety ✓</span>
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm flex items-center gap-1.5"><Siren className="w-3.5 h-3.5 text-muted-foreground" />Known incidents</span>
                  {securityAgg
                    ? <span className={`font-semibold ${securityAgg.hacksCount > 0 ? 'text-destructive' : 'text-green-500'}`}>
                        {securityAgg.hacksCount}
                      </span>
                    : <span className="text-xs text-muted-foreground">Loading…</span>}
                </div>

                {/* Data transparency notice — shown when key security indicators are unverified */}
                {!protocol.auditNote && !protocol.github && !securityAgg?.hasBugBounty && (
                  <div className="flex items-start gap-2 text-xs text-muted-foreground pt-2 mt-1 border-t">
                    <Info className="w-3 h-3 mt-0.5 shrink-0" />
                    <p>
                      Score based on currently available public data — audit records, bug bounty programme and open-source repository could not be independently verified for this protocol. Exercise additional caution.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Row 2: Score Breakdown */}
          {bd && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <BarChart2 className="w-4 h-4" /> Score Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Foundation */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold">Foundation</span>
                      <span className="text-sm font-bold">{bd.foundationTotal ?? 0} / 45</span>
                    </div>
                    {[
                      { label: 'F1 · Audit & Verification',    value: bd.auditVerification,   max: 18 },
                      { label: 'F2 · Code & Contract History', value: bd.codeContractHistory, max: 12 },
                      { label: 'F3 · Track Record',            value: bd.trackRecord,         max: 10 },
                      { label: 'F4 · Documentation',           value: bd.documentation,       max:  3 },
                      { label: 'F5 · Historical Governance',   value: bd.historicalGovernance,max:  2 },
                    ].map(({ label, value, max }) => (
                      <div key={label} className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{label}</span>
                        </div>
                        <ScoreBar value={value ?? 0} max={max} color={scoreBarColor(value ?? 0, max)} />
                      </div>
                    ))}
                  </div>

                  {/* Active */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold">Active Security</span>
                      <span className="text-sm font-bold">{bd.activeTotal ?? 0} / 55</span>
                    </div>
                    {[
                      { label: 'A1 · Security Infrastructure', value: bd.securityInfrastructure, max: 22 },
                      { label: 'A2 · Incident Response',        value: bd.incidentResponse,       max: 15 },
                      { label: 'A3 · Proactive Monitoring',     value: bd.proactiveMonitoring,    max:  7 },
                      { label: 'A4 · Economic Health',          value: bd.economicHealth,         max:  6 },
                      { label: 'A5 · Live Governance',          value: bd.liveGovernance,         max:  3 },
                      { label: 'A6 · Ongoing Vigilance',        value: bd.ongoingVigilance,       max:  2 },
                    ].map(({ label, value, max }) => (
                      <div key={label} className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{label}</span>
                        </div>
                        <ScoreBar value={value ?? 0} max={max} color={scoreBarColor(value ?? 0, max)} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Penalty line if applicable */}
                {typeof bd.penaltyTotal === 'number' && bd.penaltyTotal < 0 && (
                  <div className="mt-4 pt-3 border-t flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Penalties (detected threats)</span>
                    <span className="font-semibold text-destructive">{bd.penaltyTotal}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Row 3: Detected Threats */}
          {securityScan?.threats && securityScan.threats.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Detected Threats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {securityScan.threats.map((t: any, i: number) => (
                    <div key={i} className="flex items-start gap-3 p-2 rounded-md border">
                      <AlertTriangle className={`w-4 h-4 mt-0.5 shrink-0 ${t.severity === 'CRITICAL' || t.severity === 'HIGH' ? 'text-destructive' : 'text-yellow-500'}`} />
                      <div className="flex-1 min-w-0">
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

          {/* Recommendations from scan */}
          {securityScan?.recommendations && securityScan.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <Zap className="w-4 h-4" /> Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5">
                  {securityScan.recommendations.map((r: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="text-primary mt-0.5 shrink-0">→</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Incidents Tab ─────────────────────────────────────────────────── */}
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

        {/* ── Bug Bounty Tab ────────────────────────────────────────────────── */}
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

        {/* ── Metrics Tab ───────────────────────────────────────────────────── */}
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
