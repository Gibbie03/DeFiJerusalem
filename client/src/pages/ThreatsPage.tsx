import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Shield, AlertTriangle, Filter, Clock, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

export default function ThreatsPage() {
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  const { data, isLoading } = useQuery<ThreatsResponse>({
    queryKey: ['/api/threats', severityFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (severityFilter !== 'all') {
        params.set('severity', severityFilter);
      }
      params.set('limit', '100');
      
      const response = await fetch(`/api/threats?${params}`);
      if (!response.ok) throw new Error('Failed to fetch threats');
      return response.json();
    },
    refetchInterval: 120000, // Refresh every 2 minutes
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
          {isLoading ? (
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
