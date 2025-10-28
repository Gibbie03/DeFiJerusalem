import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Shield, AlertTriangle, Search, Clock, TrendingUp, Zap, AlertOctagon, Trash2, ExternalLink } from 'lucide-react';
import StatsCard from '@/components/StatsCard';
import SearchBar from '@/components/SearchBar';
import LoadingSpinner from '@/components/LoadingSpinner';
import TrendingTicker from '@/components/TrendingTicker';
import AdSpace from '@/components/AdSpace';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import type { BlacklistEntry } from '@shared/schema';

export default function Blacklist() {
  const [searchValue, setSearchValue] = useState('');
  const { toast } = useToast();

  const { data: blacklist = [], isLoading } = useQuery<BlacklistEntry[]>({
    queryKey: ['/api/blacklist'],
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (entryId: string) => {
      const res = await apiRequest('DELETE', `/api/blacklist/${entryId}`);
      return await res.json();
    },
    onSuccess: (_data, entryId) => {
      // Optimistically update the cache by removing the deleted entry
      queryClient.setQueryData(['/api/blacklist'], (oldData: BlacklistEntry[] | undefined) => {
        if (!oldData) return [];
        return oldData.filter(entry => entry.id !== entryId);
      });
      // Also invalidate to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['/api/blacklist'] });
      toast({
        title: "Entry Removed",
        description: "Blacklist entry has been successfully removed",
      });
    },
    onError: (error) => {
      toast({
        title: "Deletion Failed",
        description: error instanceof Error ? error.message : "Failed to delete blacklist entry",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (entryId: string, dappName: string) => {
    if (confirm(`Are you sure you want to remove "${dappName}" from the blacklist?`)) {
      deleteMutation.mutate(entryId);
    }
  };

  const filteredBlacklist = blacklist.filter(entry =>
    entry.dappId.toLowerCase().includes(searchValue.toLowerCase()) ||
    (entry.reason?.toLowerCase().includes(searchValue.toLowerCase()))
  );

  // Calculate detailed stats
  const stats = useMemo(() => {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    const week = 7 * day;

    // Count threat types
    const threatTypeCounts: Record<string, number> = {};
    blacklist.forEach(entry => {
      entry.threats.forEach(threat => {
        threatTypeCounts[threat.type] = (threatTypeCounts[threat.type] || 0) + 1;
      });
    });

    // Get top 5 threat types
    const topThreats = Object.entries(threatTypeCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }));

    return {
      total: blacklist.length,
      critical: blacklist.filter(e => e.severity === 'CRITICAL').length,
      high: blacklist.filter(e => e.severity === 'HIGH').length,
      medium: blacklist.filter(e => e.severity === 'MEDIUM').length,
      active: blacklist.filter(e => e.status === 'ACTIVE').length,
      inactive: blacklist.filter(e => e.status === 'INACTIVE').length,
      last24h: blacklist.filter(e => now - new Date(e.timestamp).getTime() < day).length,
      last7days: blacklist.filter(e => now - new Date(e.timestamp).getTime() < week).length,
      topThreats,
      totalThreats: blacklist.reduce((sum, e) => sum + e.threats.length, 0),
    };
  }, [blacklist]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'HIGH': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'MEDIUM': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading blacklisted DApps..." />;
  }

  return (
    <div className="bg-background">
      <AdSpace position="top" />
      
      <TrendingTicker />
      
      <main className="max-w-screen-2xl mx-auto px-6 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Shield className="w-8 h-8 text-red-500" />
            Blacklisted DApps
          </h1>
          <p className="text-muted-foreground">
            Protocols flagged for critical security threats and suspicious activity
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            label="Total Blacklisted"
            value={stats.total.toLocaleString()}
            icon={Shield}
            data-testid="stat-total-blacklisted"
          />
          <StatsCard
            label="Active Threats"
            value={stats.active.toLocaleString()}
            icon={AlertOctagon}
            data-testid="stat-active-threats"
          />
          <StatsCard
            label="Last 24 Hours"
            value={stats.last24h.toLocaleString()}
            icon={Clock}
            data-testid="stat-last-24h"
          />
          <StatsCard
            label="Last 7 Days"
            value={stats.last7days.toLocaleString()}
            icon={TrendingUp}
            data-testid="stat-last-7-days"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card data-testid="card-severity-breakdown">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Severity Breakdown
              </CardTitle>
              <CardDescription>Distribution of threats by severity level</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-red-500/10 text-red-500 border-red-500/20">CRITICAL</Badge>
                    <span className="text-sm text-muted-foreground">Immediate danger</span>
                  </div>
                  <span className="font-semibold" data-testid="count-critical">{stats.critical}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20">HIGH</Badge>
                    <span className="text-sm text-muted-foreground">Significant risk</span>
                  </div>
                  <span className="font-semibold" data-testid="count-high">{stats.high}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">MEDIUM</Badge>
                    <span className="text-sm text-muted-foreground">Moderate risk</span>
                  </div>
                  <span className="font-semibold" data-testid="count-medium">{stats.medium}</span>
                </div>
              </div>
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total Detected Threats</span>
                  <span className="font-semibold" data-testid="count-total-threats">{stats.totalThreats}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-top-threats">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Top Threat Types
              </CardTitle>
              <CardDescription>Most common security threats detected</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.topThreats.length > 0 ? (
                  stats.topThreats.map(({ type, count }, idx) => (
                    <div key={type} className="flex items-center justify-between" data-testid={`threat-type-${idx}`}>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{type.replace(/_/g, ' ')}</p>
                        <div className="w-full bg-muted rounded-full h-2 mt-1">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${(count / stats.totalThreats) * 100}%` }}
                          />
                        </div>
                      </div>
                      <span className="ml-4 font-semibold text-sm" data-testid={`threat-count-${idx}`}>{count}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No threat data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <SearchBar value={searchValue} onChange={setSearchValue} />
        </div>

        {filteredBlacklist.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Blacklisted DApps</h3>
            <p className="text-muted-foreground">
              {searchValue ? 'No results found for your search' : 'All protocols are currently safe'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBlacklist.map((entry) => (
              <Card key={entry.id} className="border-l-4 border-l-red-500" data-testid={`blacklist-entry-${entry.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                        {entry.dappName || entry.dappId}
                        {entry.website && (
                          <a 
                            href={entry.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground transition-colors"
                            data-testid={`link-website-${entry.id}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </CardTitle>
                      <CardDescription>
                        Flagged on {new Date(entry.timestamp).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getSeverityColor(entry.severity)}>
                        {entry.severity}
                      </Badge>
                      <Badge variant={entry.status === 'ACTIVE' ? 'destructive' : 'secondary'}>
                        {entry.status}
                      </Badge>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(entry.id, entry.dappName || entry.dappId)}
                        disabled={deleteMutation.isPending}
                        data-testid={`button-delete-${entry.id}`}
                        className="hover:bg-red-500/10 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {entry.reason && (
                    <div>
                      <p className="text-sm font-medium mb-1">Reason:</p>
                      <p className="text-sm text-muted-foreground">{entry.reason}</p>
                    </div>
                  )}
                  {entry.threats && entry.threats.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Detected Threats:</p>
                      <div className="space-y-2">
                        {entry.threats.map((threat, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <Badge variant="outline" className={`text-xs ${getSeverityColor(threat.severity)}`}>
                              {threat.severity}
                            </Badge>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{threat.type.replace(/_/g, ' ')}</p>
                              <p className="text-xs text-muted-foreground">{threat.message}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <AdSpace position="bottom" />
    </div>
  );
}
