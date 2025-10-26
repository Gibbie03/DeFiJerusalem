import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock, TrendingUp } from 'lucide-react';
import StatsCard from '@/components/StatsCard';
import SearchBar from '@/components/SearchBar';
import ProtocolCard from '@/components/ProtocolCard';
import ProtocolDetailModal from '@/components/ProtocolDetailModal';
import LoadingSpinner from '@/components/LoadingSpinner';
import type { Protocol, SecurityScan } from '@shared/schema';

export default function NewDApps() {
  const [selectedProtocol, setSelectedProtocol] = useState<Protocol | null>(null);
  const [searchValue, setSearchValue] = useState('');

  const { data: protocols = [], isLoading } = useQuery<Protocol[]>({
    queryKey: ['/api/protocols/new'],
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
    avgTvl: protocols.length > 0 ? protocols.reduce((sum, p) => sum + p.tvl, 0) / protocols.length : 0,
    audited: protocols.filter(p => p.audited).length,
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading newly discovered DApps..." />;
  }

  return (
    <div className="bg-background">
      <main className="max-w-screen-2xl mx-auto px-6 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">New DApps</h1>
          <p className="text-muted-foreground">
            Recently discovered DeFi protocols from DeFiLlama
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatsCard
            label="New Protocols"
            value={stats.total.toLocaleString()}
            icon={Clock}
          />
          <StatsCard
            label="Average TVL"
            value={`$${(stats.avgTvl / 1e6).toFixed(1)}M`}
            icon={TrendingUp}
          />
          <StatsCard
            label="Audited"
            value={`${stats.audited} (${((stats.audited / stats.total) * 100).toFixed(0)}%)`}
            icon={TrendingUp}
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
            No new protocols found
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
