import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Shield, AlertTriangle, Search, Clock, TrendingUp, Zap, AlertOctagon, ExternalLink, Eye } from 'lucide-react';
import { useLocation } from 'wouter';
import StatsCard from '@/components/StatsCard';
import SearchBar from '@/components/SearchBar';
import LoadingSpinner from '@/components/LoadingSpinner';
import TrendingTicker from '@/components/TrendingTicker';
import AdSpace from '@/components/AdSpace';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import type { BlacklistEntry } from '@shared/schema';

export default function Blacklist() {
  const [searchValue, setSearchValue] = useState('');
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: blacklist = [], isLoading } = useQuery<BlacklistEntry[]>({
    queryKey: ['/api/blacklist'],
  });

  const filteredBlacklist = useMemo(() => {
    return blacklist.filter(entry =>
      entry.dappId.toLowerCase().includes(searchValue.toLowerCase()) ||
      entry.dappName?.toLowerCase().includes(searchValue.toLowerCase()) ||
      (entry.reason?.toLowerCase().includes(searchValue.toLowerCase()))
    );
  }, [blacklist, searchValue]);

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

  const handleRowClick = useCallback((entryId: string) => {
    setLocation(`/blacklist/${entryId}`);
  }, [setLocation]);

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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Blacklisted Protocols ({filteredBlacklist.length})
              </CardTitle>
              <CardDescription>
                Click on any protocol to view detailed threat analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[300px]">Protocol</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Threats</TableHead>
                      <TableHead>Flagged Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBlacklist.map((entry) => (
                      <TableRow
                        key={entry.id}
                        className="cursor-pointer hover-elevate"
                        onClick={() => handleRowClick(entry.id)}
                        data-testid={`blacklist-row-${entry.id}`}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                            <div className="min-w-0">
                              <div className="font-semibold truncate" data-testid={`protocol-name-${entry.id}`}>
                                {entry.dappName || entry.dappId}
                              </div>
                              {entry.website && (
                                <a 
                                  href={entry.website} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1 truncate"
                                  onClick={(e) => e.stopPropagation()}
                                  data-testid={`protocol-website-${entry.id}`}
                                >
                                  <ExternalLink className="w-3 h-3 shrink-0" />
                                  <span className="truncate">{entry.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span>
                                </a>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell data-testid={`severity-${entry.id}`}>
                          {getSeverityBadge(entry.severity)}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={entry.status === 'ACTIVE' ? 'destructive' : 'secondary'}
                            data-testid={`status-${entry.id}`}
                          >
                            {entry.status}
                          </Badge>
                        </TableCell>
                        <TableCell data-testid={`threat-count-${entry.id}`}>
                          <div className="flex items-center gap-1">
                            <span className="font-semibold">{entry.threats.length}</span>
                            <span className="text-xs text-muted-foreground">detected</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm" data-testid={`date-${entry.id}`}>
                          {new Date(entry.timestamp).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRowClick(entry.id);
                            }}
                            data-testid={`button-view-${entry.id}`}
                            className="hover:bg-primary/10"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      <AdSpace position="bottom" />
    </div>
  );
}
