import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, BarChart3, Activity } from 'lucide-react';
import StatsCard from '@/components/StatsCard';
import SearchBar from '@/components/SearchBar';
import ProtocolCard from '@/components/ProtocolCard';
import ProtocolDetailModal from '@/components/ProtocolDetailModal';
import LoadingSpinner from '@/components/LoadingSpinner';
import type { Protocol, SecurityScan } from '@shared/schema';

export default function TrendingDApps() {
  const [selectedProtocol, setSelectedProtocol] = useState<Protocol | null>(null);
  const [searchValue, setSearchValue] = useState('');

  const { data: protocols = [], isLoading } = useQuery<Protocol[]>({
    queryKey: ['/api/protocols/trending'],
  });

  const { data: securityScans = {} } = useQuery<Record<string, SecurityScan>>({
    queryKey: ['/api/scans'],
  });

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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProtocols.map((protocol) => (
            <ProtocolCard
              key={protocol.id}
              protocol={protocol}
              onClick={() => setSelectedProtocol(protocol)}
            />
          ))}
        </div>

        {filteredProtocols.length === 0 && !isLoading && (
          <div className="text-center py-12 text-muted-foreground">
            No trending protocols found
          </div>
        )}

        {selectedProtocol && (
          <ProtocolDetailModal
            isOpen={true}
            protocol={selectedProtocol}
            onClose={() => setSelectedProtocol(null)}
          />
        )}
      </main>
    </div>
  );
}
