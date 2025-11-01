import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Shield, AlertTriangle, Filter, Clock, ExternalLink, TrendingDown, TrendingUp, CheckCircle2, Skull, FileSignature, Ban, Recycle, Zap, Network, DollarSign } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'wouter';

interface Threat {
  type: string;
  severity: string;
  message: string;
}

interface ThreatEntry {
  id: string;
  name: string;
  type: 'protocol' | 'blacklisted_dapp';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  threats: Threat[];
  detectedAt: string;
  website: string | null;
  status: 'blacklisted' | 'flagged';
}

interface ThreatsResponse {
  threats: ThreatEntry[];
  total: number;
  showing: number;
  filters: {
    severity: string;
    limit: number;
  };
}

interface SecurityStats {
  totalProtocols: number;
  scannedProtocols: number;
  scanCoverage: number;
  severityBreakdown: {
    CRITICAL: number;
    HIGH: number;
    MEDIUM: number;
    LOW: number;
    SAFE: number;
  };
  drainerDetections: {
    namedDrainers: number;
    permitExploits: number;
    approvalPhishing: number;
    create2Evasion: number;
    solanaDrainers: number;
    drainerInfrastructure: number;
    dormantApprovals: number;
    drainerPricing: number;
  };
  totalDrainerDetections: number;
  topThreats: Array<{
    id: string;
    name: string;
    score: number;
    severity: string;
    threatTypes: string[];
    scannedAt: string;
  }>;
  lastUpdated: string;
}

function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'CRITICAL':
      return 'bg-red-500/20 text-red-700 dark:text-red-400';
    case 'HIGH':
      return 'bg-orange-500/20 text-orange-700 dark:text-orange-400';
    case 'MEDIUM':
      return 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400';
    case 'LOW':
      return 'bg-blue-500/20 text-blue-700 dark:text-blue-400';
    default:
      return 'bg-muted/50 text-muted-foreground';
  }
}

function getStatusColor(status: string): string {
  return status === 'blacklisted' 
    ? 'bg-red-500/20 text-red-700 dark:text-red-400'
    : 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400';
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}

function getSeverityBadgeVariant(severity: string) {
  switch (severity) {
    case 'CRITICAL':
      return 'destructive';
    case 'HIGH':
      return 'default';
    case 'MEDIUM':
      return 'secondary';
    case 'LOW':
      return 'outline';
    case 'SAFE':
      return 'outline';
    default:
      return 'secondary';
  }
}

function getSeverityTextColor(severity: string) {
  switch (severity) {
    case 'CRITICAL':
      return 'text-destructive';
    case 'HIGH':
      return 'text-orange-500';
    case 'MEDIUM':
      return 'text-yellow-500';
    case 'LOW':
      return 'text-blue-500';
    case 'SAFE':
      return 'text-green-500';
    default:
      return 'text-muted-foreground';
  }
}

export default function ThreatsPage() {
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  // SEO meta tags
  useEffect(() => {
    document.title = 'Live Threat Feed - Real-Time DeFi Security Alerts | JERUSALEM';
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Real-time security threat feed detecting scams, rug pulls, and exploits across 126+ blockchain networks. Monitor critical threats in DeFi protocols and DApps as they happen.');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = 'Real-time security threat feed detecting scams, rug pulls, and exploits across 126+ blockchain networks. Monitor critical threats in DeFi protocols and DApps as they happen.';
      document.head.appendChild(meta);
    }

    // Open Graph tags
    const ogTitle = document.querySelector('meta[property="og:title"]') || document.createElement('meta');
    ogTitle.setAttribute('property', 'og:title');
    ogTitle.setAttribute('content', 'Live Threat Feed - Real-Time DeFi Security Alerts');
    if (!ogTitle.parentElement) document.head.appendChild(ogTitle);

    const ogDescription = document.querySelector('meta[property="og:description"]') || document.createElement('meta');
    ogDescription.setAttribute('property', 'og:description');
    ogDescription.setAttribute('content', 'Monitor real-time security threats across DeFi. Get instant alerts about scams, rug pulls, drainer attacks, and vulnerabilities.');
    if (!ogDescription.parentElement) document.head.appendChild(ogDescription);

    const ogType = document.querySelector('meta[property="og:type"]') || document.createElement('meta');
    ogType.setAttribute('property', 'og:type');
    ogType.setAttribute('content', 'website');
    if (!ogType.parentElement) document.head.appendChild(ogType);

    // Twitter Card tags
    const twitterCard = document.querySelector('meta[name="twitter:card"]') || document.createElement('meta');
    twitterCard.setAttribute('name', 'twitter:card');
    twitterCard.setAttribute('content', 'summary_large_image');
    if (!twitterCard.parentElement) document.head.appendChild(twitterCard);

    const twitterTitle = document.querySelector('meta[name="twitter:title"]') || document.createElement('meta');
    twitterTitle.setAttribute('name', 'twitter:title');
    twitterTitle.setAttribute('content', 'Live Threat Feed - DeFi Security Alerts');
    if (!twitterTitle.parentElement) document.head.appendChild(twitterTitle);
  }, []);

  // Security Stats Query
  const { data: securityStats, isLoading: statsLoading } = useQuery<SecurityStats>({
    queryKey: ['/api/security/stats'],
    refetchInterval: 120000, // Refresh every 2 minutes
  });

  // Threats Query
  const { data, isLoading, error } = useQuery<ThreatsResponse>({
    queryKey: ['/api/threats', severityFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (severityFilter !== 'all') {
        params.set('severity', severityFilter);
      }
      params.set('limit', '100');
      
      const response = await fetch(`/api/threats?${params}`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to fetch threats');
      }
      return response.json();
    },
    refetchInterval: 120000, // Refresh every 2 minutes
    retry: 3, // Retry failed requests up to 3 times
  });

  const threats = data?.threats || [];

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-red-500/20 rounded-lg">
            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Live Threat Feed</h1>
            <p className="text-muted-foreground">
              Real-time security threats detected across 126+ blockchain networks
            </p>
          </div>
        </div>
      </div>

      {/* Security Dashboard */}
      <div className="mb-8 space-y-6" data-testid="section-security-dashboard">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary-foreground" />
          </div>
          <h2 className="text-2xl font-bold">Security Dashboard</h2>
        </div>

        {/* Overview Stats Row */}
        {statsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-3">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : securityStats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card data-testid="card-dashboard-total-protocols">
              <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Protocols</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-dashboard-total-protocols">
                  {securityStats.totalProtocols.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Tracked across all chains</p>
              </CardContent>
            </Card>

            <Card data-testid="card-dashboard-scanned-protocols">
              <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Scanned Protocols</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-dashboard-scanned-protocols">
                  {securityStats.scannedProtocols.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {securityStats.scanCoverage.toFixed(1)}% coverage
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-dashboard-scan-coverage">
              <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Scan Coverage</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-dashboard-scan-coverage">
                  {securityStats.scanCoverage.toFixed(1)}%
                </div>
                <Progress value={securityStats.scanCoverage} className="mt-2" />
              </CardContent>
            </Card>

            <Card data-testid="card-dashboard-last-updated">
              <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-sm font-medium" data-testid="text-dashboard-last-updated">
                  {new Date(securityStats.lastUpdated).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(securityStats.lastUpdated).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                  })}
                </p>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* Severity Breakdown */}
        {statsLoading ? (
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64 mt-2" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-2 w-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        ) : securityStats ? (
          <Card data-testid="card-dashboard-severity-breakdown">
            <CardHeader>
              <CardTitle>Severity Distribution</CardTitle>
              <CardDescription>Risk level breakdown of all scanned protocols</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <span className="font-medium">CRITICAL</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                      {((securityStats.severityBreakdown.CRITICAL / securityStats.scannedProtocols) * 100).toFixed(2)}%
                    </span>
                    <span className="font-bold w-16 text-right" data-testid="text-severity-critical">
                      {securityStats.severityBreakdown.CRITICAL}
                    </span>
                  </div>
                </div>
                <Progress 
                  value={(securityStats.severityBreakdown.CRITICAL / securityStats.scannedProtocols) * 100} 
                  className="h-2 bg-muted" 
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-orange-500" />
                    <span className="font-medium">HIGH</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                      {((securityStats.severityBreakdown.HIGH / securityStats.scannedProtocols) * 100).toFixed(2)}%
                    </span>
                    <span className="font-bold w-16 text-right" data-testid="text-severity-high">
                      {securityStats.severityBreakdown.HIGH}
                    </span>
                  </div>
                </div>
                <Progress 
                  value={(securityStats.severityBreakdown.HIGH / securityStats.scannedProtocols) * 100} 
                  className="h-2 bg-muted" 
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-yellow-500" />
                    <span className="font-medium">MEDIUM</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                      {((securityStats.severityBreakdown.MEDIUM / securityStats.scannedProtocols) * 100).toFixed(2)}%
                    </span>
                    <span className="font-bold w-16 text-right" data-testid="text-severity-medium">
                      {securityStats.severityBreakdown.MEDIUM}
                    </span>
                  </div>
                </div>
                <Progress 
                  value={(securityStats.severityBreakdown.MEDIUM / securityStats.scannedProtocols) * 100} 
                  className="h-2 bg-muted" 
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">LOW</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                      {((securityStats.severityBreakdown.LOW / securityStats.scannedProtocols) * 100).toFixed(2)}%
                    </span>
                    <span className="font-bold w-16 text-right" data-testid="text-severity-low">
                      {securityStats.severityBreakdown.LOW}
                    </span>
                  </div>
                </div>
                <Progress 
                  value={(securityStats.severityBreakdown.LOW / securityStats.scannedProtocols) * 100} 
                  className="h-2 bg-muted" 
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="font-medium">SAFE</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                      {((securityStats.severityBreakdown.SAFE / securityStats.scannedProtocols) * 100).toFixed(2)}%
                    </span>
                    <span className="font-bold w-16 text-right" data-testid="text-severity-safe">
                      {securityStats.severityBreakdown.SAFE}
                    </span>
                  </div>
                </div>
                <Progress 
                  value={(securityStats.severityBreakdown.SAFE / securityStats.scannedProtocols) * 100} 
                  className="h-2 bg-muted" 
                />
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* 2025 Advanced Drainer Detections */}
        {statsLoading ? (
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-64" />
              <Skeleton className="h-4 w-96 mt-2" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(8)].map((_, i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            </CardContent>
          </Card>
        ) : securityStats ? (
          <Card data-testid="card-dashboard-drainer-detections">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Skull className="h-5 w-5 text-destructive" />
                2025 Advanced Drainer Detections
              </CardTitle>
              <CardDescription>
                Specialized detection for modern wallet draining techniques ($494M stolen in 2024)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50" data-testid="metric-named-drainers">
                  <div className="flex items-center gap-2">
                    <Skull className="h-4 w-4 text-destructive" />
                    <span className="text-sm">Named Drainer Operations</span>
                  </div>
                  <span className="font-bold">{securityStats.drainerDetections.namedDrainers}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50" data-testid="metric-permit-exploits">
                  <div className="flex items-center gap-2">
                    <FileSignature className="h-4 w-4 text-destructive" />
                    <span className="text-sm">EIP-2612 Permit Exploits</span>
                  </div>
                  <span className="font-bold">{securityStats.drainerDetections.permitExploits}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50" data-testid="metric-approval-phishing">
                  <div className="flex items-center gap-2">
                    <Ban className="h-4 w-4 text-destructive" />
                    <span className="text-sm">Approval Phishing</span>
                  </div>
                  <span className="font-bold">{securityStats.drainerDetections.approvalPhishing}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50" data-testid="metric-create2-evasion">
                  <div className="flex items-center gap-2">
                    <Recycle className="h-4 w-4 text-destructive" />
                    <span className="text-sm">CREATE2 Evasion</span>
                  </div>
                  <span className="font-bold">{securityStats.drainerDetections.create2Evasion}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50" data-testid="metric-solana-drainers">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-destructive" />
                    <span className="text-sm">Solana Drainers</span>
                  </div>
                  <span className="font-bold">{securityStats.drainerDetections.solanaDrainers}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50" data-testid="metric-drainer-infrastructure">
                  <div className="flex items-center gap-2">
                    <Network className="h-4 w-4 text-destructive" />
                    <span className="text-sm">Drainer Infrastructure</span>
                  </div>
                  <span className="font-bold">{securityStats.drainerDetections.drainerInfrastructure}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50" data-testid="metric-dormant-approvals">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-destructive" />
                    <span className="text-sm">Dormant Approval Attacks</span>
                  </div>
                  <span className="font-bold">{securityStats.drainerDetections.dormantApprovals}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50" data-testid="metric-drainer-pricing">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-destructive" />
                    <span className="text-sm">Drainer-as-a-Service</span>
                  </div>
                  <span className="font-bold">{securityStats.drainerDetections.drainerPricing}</span>
                </div>
              </div>

              <div className="mt-4 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Total 2025 Drainer Detections</span>
                  <span className="text-2xl font-bold text-destructive" data-testid="text-total-drainers">
                    {securityStats.totalDrainerDetections}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Top 20 Highest Risk Protocols */}
        {statsLoading ? (
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-64" />
              <Skeleton className="h-4 w-80 mt-2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-20" />
                ))}
              </div>
            </CardContent>
          </Card>
        ) : securityStats && securityStats.topThreats.length > 0 ? (
          <Card data-testid="card-dashboard-top-threats">
            <CardHeader>
              <CardTitle>Top 20 Highest Risk Protocols</CardTitle>
              <CardDescription>Protocols with the highest security risk scores</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {securityStats.topThreats.map((threat, index) => (
                  <Link key={threat.id} href="/" data-testid={`link-dashboard-threat-${index}`}>
                    <div className="flex items-center justify-between p-3 rounded-lg hover-elevate active-elevate-2 border">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="text-sm font-semibold text-muted-foreground w-8">{index + 1}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold truncate" data-testid={`text-threat-name-${index}`}>
                            {threat.name}
                          </div>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Badge variant={getSeverityBadgeVariant(threat.severity)} className="text-xs">
                              {threat.severity}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {threat.threatTypes.slice(0, 3).join(', ')}
                              {threat.threatTypes.length > 3 && ` +${threat.threatTypes.length - 3} more`}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-xl font-bold ${getSeverityTextColor(threat.severity)}`}>
                          {threat.score}
                        </div>
                        <div className="text-xs text-muted-foreground">risk score</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Threats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-total-threats">
              {data?.total || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Critical Threats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400" data-testid="stat-critical">
              {threats.filter(t => t.severity === 'CRITICAL').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              High Severity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400" data-testid="stat-high">
              {threats.filter(t => t.severity === 'HIGH').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Blacklisted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-blacklisted">
              {threats.filter(t => t.status === 'blacklisted').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            <CardTitle className="text-lg">Filter by Severity</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={severityFilter} onValueChange={setSeverityFilter}>
            <TabsList className="grid grid-cols-5 w-full max-w-2xl">
              <TabsTrigger value="all" data-testid="filter-all">
                All ({data?.total || 0})
              </TabsTrigger>
              <TabsTrigger value="CRITICAL" data-testid="filter-critical">
                Critical ({threats.filter(t => t.severity === 'CRITICAL').length})
              </TabsTrigger>
              <TabsTrigger value="HIGH" data-testid="filter-high">
                High ({threats.filter(t => t.severity === 'HIGH').length})
              </TabsTrigger>
              <TabsTrigger value="MEDIUM" data-testid="filter-medium">
                Medium ({threats.filter(t => t.severity === 'MEDIUM').length})
              </TabsTrigger>
              <TabsTrigger value="LOW" data-testid="filter-low">
                Low ({threats.filter(t => t.severity === 'LOW').length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {/* Threats Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detected Threats</CardTitle>
          <CardDescription>
            Latest security threats detected in DeFi protocols and DApps
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
              <p className="text-red-600 dark:text-red-400 font-medium mb-2">
                Failed to load threat data
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                {error instanceof Error ? error.message : 'An unexpected error occurred'}
              </p>
              <Button 
                onClick={() => window.location.reload()}
                variant="outline"
                data-testid="button-reload"
              >
                Reload Page
              </Button>
            </div>
          ) : isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              <Shield className="w-12 h-12 mx-auto mb-4 animate-pulse" />
              <p>Scanning for threats...</p>
            </div>
          ) : threats.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Shield className="w-12 h-12 mx-auto mb-4" />
              <p>No threats detected with current filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Protocol / DApp</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Threat Count</TableHead>
                    <TableHead>Top Threats</TableHead>
                    <TableHead>Detected</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {threats.map((entry) => (
                    <TableRow key={entry.id} data-testid={`row-threat-${entry.id}`}>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="font-medium" data-testid={`threat-name-${entry.id}`}>
                            {entry.name}
                          </div>
                          {entry.website && (
                            <a
                              href={entry.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                            >
                              {entry.website.replace(/^https?:\/\//, '')}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className={getSeverityColor(entry.severity)}
                          data-testid={`badge-severity-${entry.id}`}
                        >
                          {entry.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className={getStatusColor(entry.status)}
                          data-testid={`badge-status-${entry.id}`}
                        >
                          {entry.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">
                          {entry.threats.length}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-md">
                          {entry.threats.slice(0, 3).map((threat, idx) => (
                            <Badge 
                              key={idx} 
                              variant="outline" 
                              className="text-xs"
                            >
                              {threat.type}
                            </Badge>
                          ))}
                          {entry.threats.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{entry.threats.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {formatDate(entry.detectedAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {entry.type === 'protocol' ? (
                          <Link href={`/protocol/${entry.id}`}>
                            <Button 
                              size="sm" 
                              variant="outline"
                              data-testid={`button-view-${entry.id}`}
                            >
                              View Details
                            </Button>
                          </Link>
                        ) : entry.type === 'blacklisted_dapp' ? (
                          <Link href={`/blacklist/${entry.id}`}>
                            <Button 
                              size="sm" 
                              variant="outline"
                              data-testid={`button-view-${entry.id}`}
                            >
                              View Details
                            </Button>
                          </Link>
                        ) : (
                          <Button 
                            size="sm" 
                            variant="outline"
                            disabled
                            data-testid={`button-view-${entry.id}`}
                          >
                            View Details
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Footer Note */}
      <div className="mt-6 text-center text-sm text-muted-foreground">
        <p>
          This feed updates every 2 minutes. Report false positives to{' '}
          <a href="mailto:security@defijerusalem.com" className="text-primary hover:underline">
            security@defijerusalem.com
          </a>
        </p>
      </div>
    </div>
  );
}
