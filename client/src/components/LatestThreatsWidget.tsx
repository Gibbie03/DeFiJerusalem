import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock, ArrowRight, TrendingUp } from 'lucide-react';
import { Link } from 'wouter';
import { Skeleton } from '@/components/ui/skeleton';

interface ThreatEntry {
  id: string;
  name: string;
  type: 'protocol' | 'blacklisted_dapp';
  severity: string;
  threatCount: number;
  topThreats: string[];
  detectedAt: string;
}

function getSeverityColor(severity: string) {
  switch (severity) {
    case 'CRITICAL':
      return 'bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30';
    case 'HIGH':
      return 'bg-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-500/30';
    case 'MEDIUM':
      return 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30';
    case 'LOW':
      return 'bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return then.toLocaleDateString();
}

export function LatestThreatsWidget() {
  const { data, isLoading } = useQuery<{ threats: ThreatEntry[] }>({
    queryKey: ['/api/threats', { limit: '5' }],
    refetchInterval: 120000, // Refresh every 2 minutes
  });
  
  const threats = data?.threats || [];

  if (isLoading) {
    return (
      <Card className="border-destructive/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-24" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!threats || threats.length === 0) {
    return (
      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Latest Threats
          </CardTitle>
          <CardDescription>Real-time security alerts</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">No threats detected recently</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-destructive/20" data-testid="widget-latest-threats">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Latest Threats
          </CardTitle>
          <Badge variant="outline" className="gap-1">
            <TrendingUp className="w-3 h-3" />
            Live
          </Badge>
        </div>
        <CardDescription>Real-time security alerts from our scanners</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {threats.map((threat, index) => (
          <div
            key={threat.id}
            className="p-3 rounded-lg border bg-card hover-elevate"
            data-testid={`threat-entry-${index}`}
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm truncate" data-testid={`threat-name-${index}`}>
                  {threat.name}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    className={`text-xs ${getSeverityColor(threat.severity)}`}
                    data-testid={`threat-severity-${index}`}
                  >
                    {threat.severity}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTimeAgo(threat.detectedAt)}
                  </span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-xs font-semibold text-destructive">
                  {threat.threatCount} {threat.threatCount === 1 ? 'Threat' : 'Threats'}
                </div>
              </div>
            </div>
            
            {threat.topThreats && threat.topThreats.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {threat.topThreats.slice(0, 3).map((type, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className="text-xs"
                    data-testid={`threat-type-${index}-${i}`}
                  >
                    {type}
                  </Badge>
                ))}
                {threat.topThreats.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{threat.topThreats.length - 3} more
                  </Badge>
                )}
              </div>
            )}

            <Link
              href={threat.type === 'protocol' ? `/protocol/${threat.id}` : `/blacklist/${threat.id}`}
            >
              <Button
                size="sm"
                variant="ghost"
                className="w-full justify-between text-xs h-7"
                data-testid={`button-view-threat-${index}`}
              >
                View Details
                <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </div>
        ))}

        <Link href="/threats">
          <Button
            variant="outline"
            className="w-full mt-2"
            data-testid="button-view-all-threats"
          >
            View All Threats
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
