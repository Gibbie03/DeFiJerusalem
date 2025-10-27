import { useState, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Clock, TrendingUp } from 'lucide-react';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import StatsCard from '@/components/StatsCard';
import SearchBar from '@/components/SearchBar';
import ProtocolTable from '@/components/ProtocolTable';
import ProtocolDetailModal from '@/components/ProtocolDetailModal';
import LoadingSpinner from '@/components/LoadingSpinner';
import TrendingTicker from '@/components/TrendingTicker';
import AdSpace from '@/components/AdSpace';
import type { Protocol, SecurityScan, BlacklistEntry} from '@shared/schema';

export default function NewDApps() {
  const [selectedProtocol, setSelectedProtocol] = useState<Protocol | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const { toast } = useToast();

  const { data: protocols = [], isLoading } = useQuery<Protocol[]>({
    queryKey: ['/api/protocols/new'],
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
    avgTvl: protocols.length > 0 ? protocols.reduce((sum, p) => sum + p.tvl, 0) / protocols.length : 0,
    audited: protocols.filter(p => p.audited).length,
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading newly discovered DApps..." />;
  }

  return (
    <div className="bg-background">
      <AdSpace position="top" />
      
      <TrendingTicker onProtocolClick={(protocol) => setSelectedProtocol(protocol)} />
      
      <main className="max-w-screen-2xl mx-auto px-6 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">New DApps</h1>
          <p className="text-muted-foreground">
            Recently discovered DeFi protocols from DeFiLlama
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatsCard
            label="New Protocols"
            value={stats.total.toLocaleString()}
            icon={Clock}
          />
          <StatsCard
            label="Average TVL"
            value={(() => {
              const tvl = stats.avgTvl;
              if (tvl >= 1_000_000_000) return `$${(tvl / 1_000_000_000).toFixed(2)}B`;
              if (tvl >= 1_000_000) return `$${(tvl / 1_000_000).toFixed(2)}M`;
              if (tvl >= 1_000) return `$${(tvl / 1_000).toFixed(2)}K`;
              return `$${tvl.toFixed(2)}`;
            })()}
            icon={TrendingUp}
          />
          <StatsCard
            label="Audited"
            value={`${stats.audited} (${stats.total > 0 ? ((stats.audited / stats.total) * 100).toFixed(0) : '0'}%)`}
            icon={TrendingUp}
          />
        </div>

        <div className="flex flex-col gap-4">
          <SearchBar value={searchValue} onChange={setSearchValue} />
        </div>

        {filteredProtocols.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No new protocols found
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
