import { useState, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { TrendingUp, BarChart3, Activity } from 'lucide-react';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import StatsCard from '@/components/StatsCard';
import SearchBar from '@/components/SearchBar';
import ProtocolTable from '@/components/ProtocolTable';
import ProtocolDetailModal from '@/components/ProtocolDetailModal';
import LoadingSpinner from '@/components/LoadingSpinner';
import TrendingTicker from '@/components/TrendingTicker';
import AdSpace from '@/components/AdSpace';
import type { Protocol, SecurityScan, BlacklistEntry } from '@shared/schema';

export default function TrendingDApps() {
  const [selectedProtocol, setSelectedProtocol] = useState<Protocol | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const { toast } = useToast();

  const { data: protocols = [], isLoading } = useQuery<Protocol[]>({
    queryKey: ['/api/protocols/trending'],
  });

  const { data: securityScans = {} } = useQuery<Record<string, SecurityScan>>({
    queryKey: ['/api/scans'],
  });

  const scanMutation = useMutation({
    mutationFn: async (protocolIds: string[]) => {
      const res = await apiRequest('POST', '/api/scan', { protocolIds });
      return await res.json();
    },
    onSuccess: (data: { scanResults: Record<string, SecurityScan>; scannedCount: number; newBlacklistEntries: BlacklistEntry[] }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/scans'] });
      queryClient.invalidateQueries({ queryKey: ['/api/blacklist'] });
      toast({
        title: "Security Scan Complete",
        description: `Scanned protocol successfully. Found ${data.newBlacklistEntries.length} critical threats.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Scan Failed",
        description: error instanceof Error ? error.message : "Failed to scan protocol",
        variant: "destructive",
      });
    },
  });

  const handleScanProtocol = useCallback((protocolId: string) => {
    scanMutation.mutate([protocolId]);
  }, [scanMutation]);

  const filteredProtocols = protocols.filter(p =>
    p.name.toLowerCase().includes(searchValue.toLowerCase()) ||
    p.category.toLowerCase().includes(searchValue.toLowerCase())
  );

  const stats = {
    total: protocols.length,
    totalTvl: protocols.reduce((sum, p) => sum + p.tvl, 0),
    avgGrowth: protocols.length > 0 ? protocols.reduce((sum, p) => sum + p.change24h, 0) / protocols.length : 0,
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading trending DApps..." />;
  }

  return (
    <div className="bg-background">
      <AdSpace position="top" />
      
      <TrendingTicker />
      
      <main className="max-w-screen-2xl mx-auto px-6 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Trending DApps</h1>
          <p className="text-muted-foreground">
            DeFi protocols with highest volume and TVL growth in the last 24 hours
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatsCard
            label="Trending Protocols"
            value={stats.total.toLocaleString()}
            icon={TrendingUp}
          />
          <StatsCard
            label="Total TVL"
            value={`$${(stats.totalTvl / 1e9).toFixed(2)}B`}
            icon={BarChart3}
          />
          <StatsCard
            label="Avg Growth (24h)"
            value={`${stats.avgGrowth > 0 ? '+' : ''}${stats.avgGrowth.toFixed(1)}%`}
            icon={Activity}
          />
        </div>

        <div className="flex flex-col gap-4">
          <SearchBar value={searchValue} onChange={setSearchValue} />
        </div>

        {filteredProtocols.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No trending protocols found
          </div>
        ) : (
          <ProtocolTable
            protocols={filteredProtocols}
            securityScans={securityScans}
            onViewDetails={(protocol) => setSelectedProtocol(protocol)}
          />
        )}

        {selectedProtocol && (
          <ProtocolDetailModal
            isOpen={true}
            protocol={selectedProtocol}
            scanResult={securityScans[selectedProtocol.id]}
            onClose={() => setSelectedProtocol(null)}
            onScan={handleScanProtocol}
            isScanning={scanMutation.isPending}
          />
        )}
      </main>

      <AdSpace position="bottom" />
    </div>
  );
}
