import { useQuery } from '@tanstack/react-query';
import { Shield, TrendingDown, TrendingUp, AlertTriangle, CheckCircle2, Skull, FileSignature, Ban, Recycle, Zap, Network, Clock, DollarSign } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'wouter';

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

function getSeverityColor(severity: string) {
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

export default function SecurityStats() {
  const { data: stats, isLoading } = useQuery<SecurityStats>({
    queryKey: ['/api/security/stats'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-8 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="container mx-auto px-6 py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Failed to load security statistics</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalScanned = stats.scannedProtocols;
  const criticalPercent = totalScanned > 0 ? (stats.severityBreakdown.CRITICAL / totalScanned) * 100 : 0;
  const highPercent = totalScanned > 0 ? (stats.severityBreakdown.HIGH / totalScanned) * 100 : 0;
  const mediumPercent = totalScanned > 0 ? (stats.severityBreakdown.MEDIUM / totalScanned) * 100 : 0;
  const lowPercent = totalScanned > 0 ? (stats.severityBreakdown.LOW / totalScanned) * 100 : 0;
  const safePercent = totalScanned > 0 ? (stats.severityBreakdown.SAFE / totalScanned) * 100 : 0;

  return (
    <div className="container mx-auto px-6 py-8 space-y-8" data-testid="page-security-stats">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
            <Shield className="w-7 h-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Security Statistics</h1>
            <p className="text-muted-foreground">Comprehensive DeFi protocol security analysis across 126+ blockchains</p>
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card data-testid="card-total-protocols">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Protocols</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-protocols">{stats.totalProtocols.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Tracked across all chains</p>
          </CardContent>
        </Card>

        <Card data-testid="card-scanned-protocols">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scanned Protocols</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-scanned-protocols">{stats.scannedProtocols.toLocaleString()}</div>
            <Progress value={stats.scanCoverage} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">{stats.scanCoverage.toFixed(1)}% coverage</p>
          </CardContent>
        </Card>

        <Card data-testid="card-critical-threats">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Threats</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive" data-testid="text-critical-count">
              {stats.severityBreakdown.CRITICAL.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{criticalPercent.toFixed(2)}% of scanned</p>
          </CardContent>
        </Card>

        <Card data-testid="card-drainer-detections">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">2025 Drainer Detections</CardTitle>
            <Skull className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive" data-testid="text-drainer-count">
              {stats.totalDrainerDetections}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Advanced wallet drainers</p>
          </CardContent>
        </Card>
      </div>

      {/* Severity Breakdown */}
      <Card data-testid="card-severity-breakdown">
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
                <span className="text-sm text-muted-foreground">{criticalPercent.toFixed(2)}%</span>
                <span className="font-bold w-16 text-right">{stats.severityBreakdown.CRITICAL}</span>
              </div>
            </div>
            <Progress value={criticalPercent} className="h-2 bg-muted" />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-orange-500" />
                <span className="font-medium">HIGH</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">{highPercent.toFixed(2)}%</span>
                <span className="font-bold w-16 text-right">{stats.severityBreakdown.HIGH}</span>
              </div>
            </div>
            <Progress value={highPercent} className="h-2 bg-muted" />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-yellow-500" />
                <span className="font-medium">MEDIUM</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">{mediumPercent.toFixed(2)}%</span>
                <span className="font-bold w-16 text-right">{stats.severityBreakdown.MEDIUM}</span>
              </div>
            </div>
            <Progress value={mediumPercent} className="h-2 bg-muted" />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-500" />
                <span className="font-medium">LOW</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">{lowPercent.toFixed(2)}%</span>
                <span className="font-bold w-16 text-right">{stats.severityBreakdown.LOW}</span>
              </div>
            </div>
            <Progress value={lowPercent} className="h-2 bg-muted" />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="font-medium">SAFE</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">{safePercent.toFixed(2)}%</span>
                <span className="font-bold w-16 text-right">{stats.severityBreakdown.SAFE}</span>
              </div>
            </div>
            <Progress value={safePercent} className="h-2 bg-muted" />
          </div>
        </CardContent>
      </Card>

      {/* 2025 Advanced Drainer Detections */}
      <Card data-testid="card-drainer-breakdown">
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
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <Skull className="h-4 w-4 text-destructive" />
                <span className="text-sm">Named Drainer Operations</span>
              </div>
              <span className="font-bold">{stats.drainerDetections.namedDrainers}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <FileSignature className="h-4 w-4 text-destructive" />
                <span className="text-sm">EIP-2612 Permit Exploits</span>
              </div>
              <span className="font-bold">{stats.drainerDetections.permitExploits}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <Ban className="h-4 w-4 text-destructive" />
                <span className="text-sm">Approval Phishing</span>
              </div>
              <span className="font-bold">{stats.drainerDetections.approvalPhishing}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <Recycle className="h-4 w-4 text-destructive" />
                <span className="text-sm">CREATE2 Evasion</span>
              </div>
              <span className="font-bold">{stats.drainerDetections.create2Evasion}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-destructive" />
                <span className="text-sm">Solana Drainers</span>
              </div>
              <span className="font-bold">{stats.drainerDetections.solanaDrainers}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <Network className="h-4 w-4 text-destructive" />
                <span className="text-sm">Drainer Infrastructure</span>
              </div>
              <span className="font-bold">{stats.drainerDetections.drainerInfrastructure}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-destructive" />
                <span className="text-sm">Dormant Approval Attacks</span>
              </div>
              <span className="font-bold">{stats.drainerDetections.dormantApprovals}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-destructive" />
                <span className="text-sm">Drainer-as-a-Service</span>
              </div>
              <span className="font-bold">{stats.drainerDetections.drainerPricing}</span>
            </div>
          </div>

          <div className="mt-4 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
            <div className="flex items-center justify-between">
              <span className="font-semibold">Total 2025 Drainer Detections</span>
              <span className="text-2xl font-bold text-destructive">{stats.totalDrainerDetections}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top 20 Highest Risk Protocols */}
      {stats.topThreats.length > 0 && (
        <Card data-testid="card-top-threats">
          <CardHeader>
            <CardTitle>Top 20 Highest Risk Protocols</CardTitle>
            <CardDescription>Protocols with the highest security risk scores</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.topThreats.map((threat, index) => (
                <Link key={threat.id} href="/" data-testid={`link-threat-${index}`}>
                  <div className="flex items-center justify-between p-3 rounded-lg hover-elevate active-elevate-2 border">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-sm font-semibold text-muted-foreground w-8">{index + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">{threat.name}</div>
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
                      <div className={`text-xl font-bold ${getSeverityColor(threat.severity)}`}>
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
      )}

      {/* Last Updated */}
      <div className="text-center text-sm text-muted-foreground">
        Last updated: {new Date(stats.lastUpdated).toLocaleString()}
      </div>
    </div>
  );
}
