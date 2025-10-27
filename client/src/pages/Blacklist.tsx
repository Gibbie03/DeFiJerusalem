import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Shield, AlertTriangle, Search } from 'lucide-react';
import StatsCard from '@/components/StatsCard';
import SearchBar from '@/components/SearchBar';
import LoadingSpinner from '@/components/LoadingSpinner';
import TrendingTicker from '@/components/TrendingTicker';
import AdSpace from '@/components/AdSpace';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { BlacklistEntry } from '@shared/schema';

export default function Blacklist() {
  const [searchValue, setSearchValue] = useState('');

  const { data: blacklist = [], isLoading } = useQuery<BlacklistEntry[]>({
    queryKey: ['/api/blacklist'],
  });

  const filteredBlacklist = blacklist.filter(entry =>
    entry.dappId.toLowerCase().includes(searchValue.toLowerCase()) ||
    (entry.reason?.toLowerCase().includes(searchValue.toLowerCase()))
  );

  const stats = {
    total: blacklist.length,
    critical: blacklist.filter(e => e.severity === 'CRITICAL').length,
    high: blacklist.filter(e => e.severity === 'HIGH').length,
    active: blacklist.filter(e => e.status === 'ACTIVE').length,
  };

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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatsCard
            label="Total Blacklisted"
            value={stats.total.toLocaleString()}
            icon={Shield}
          />
          <StatsCard
            label="Critical"
            value={stats.critical}
            icon={AlertTriangle}
          />
          <StatsCard
            label="High Severity"
            value={stats.high}
            icon={AlertTriangle}
          />
          <StatsCard
            label="Active Threats"
            value={stats.active}
            icon={Shield}
          />
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
                        {entry.dappId}
                      </CardTitle>
                      <CardDescription>
                        Flagged on {new Date(entry.timestamp).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getSeverityColor(entry.severity)}>
                        {entry.severity}
                      </Badge>
                      <Badge variant={entry.status === 'ACTIVE' ? 'destructive' : 'secondary'}>
                        {entry.status}
                      </Badge>
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
