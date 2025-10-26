import { useState, useEffect, useMemo } from 'react';
import { Database, Shield, TrendingUp, AlertCircle, Sparkles } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Header from '@/components/Header';
import StatsCard from '@/components/StatsCard';
import SearchBar from '@/components/SearchBar';
import FilterChips from '@/components/FilterChips';
import ProtocolCard from '@/components/ProtocolCard';
import ProtocolDetailModal from '@/components/ProtocolDetailModal';
import LoadingSpinner from '@/components/LoadingSpinner';

//todo: remove mock functionality - replace with real data from backend
const MOCK_PROTOCOLS = [
  {
    id: 'uniswap',
    name: 'Uniswap',
    chains: ['ethereum', 'polygon', 'arbitrum'],
    category: 'DEX',
    tvl: 5000000000,
    change24h: 2.5,
    securityScore: 95,
    logo: 'https://avatars.githubusercontent.com/u/38646891?v=4',
    website: 'https://uniswap.org',
    twitter: 'Uniswap',
    github: 'Uniswap/uniswap-v3-core',
    audited: true,
    age: 365,
    description: 'Decentralized trading protocol'
  },
  {
    id: 'aave',
    name: 'Aave',
    chains: ['ethereum', 'polygon'],
    category: 'Lending',
    tvl: 10000000000,
    change24h: 1.2,
    securityScore: 92,
    logo: 'https://avatars.githubusercontent.com/u/7634462?v=4',
    website: 'https://aave.com',
    twitter: 'AaveAave',
    github: 'aave/aave-v3-core',
    audited: true,
    age: 730,
    description: 'DeFi lending protocol'
  },
  {
    id: 'compound',
    name: 'Compound',
    chains: ['ethereum'],
    category: 'Lending',
    tvl: 3000000000,
    change24h: -0.8,
    securityScore: 88,
    logo: null,
    website: 'https://compound.finance',
    twitter: 'compoundfinance',
    audited: true,
    age: 900,
    description: 'Algorithmic money market protocol'
  },
  {
    id: 'suspicious-defi',
    name: 'SuspiciousDeFi',
    chains: ['bsc'],
    category: 'Yield',
    tvl: 25000,
    change24h: 150.5,
    securityScore: 35,
    logo: null,
    website: null,
    twitter: null,
    github: null,
    audited: false,
    age: 3,
    description: 'High-yield farming protocol'
  },
  {
    id: 'curve',
    name: 'Curve Finance',
    chains: ['ethereum', 'polygon', 'avalanche'],
    category: 'DEX',
    tvl: 4500000000,
    change24h: 0.5,
    securityScore: 90,
    logo: null,
    website: 'https://curve.fi',
    twitter: 'CurveFinance',
    audited: true,
    age: 850,
    description: 'Stablecoin-focused DEX'
  },
  {
    id: 'pancakeswap',
    name: 'PancakeSwap',
    chains: ['bsc'],
    category: 'DEX',
    tvl: 2000000000,
    change24h: 3.2,
    securityScore: 75,
    logo: null,
    website: 'https://pancakeswap.finance',
    twitter: 'pancakeswap',
    audited: true,
    age: 600,
    description: 'Leading BSC DEX'
  }
];

//todo: remove mock functionality - replace with real scanning logic
const MOCK_SCAN_RESULTS: Record<string, any> = {
  'suspicious-defi': {
    severity: 'CRITICAL',
    threats: [
      { type: 'NEW_CONTRACT', severity: 'HIGH', message: 'Contract less than 7 days old - HIGH RISK' },
      { type: 'NO_AUDIT', severity: 'HIGH', message: 'No security audit found' },
      { type: 'ANONYMOUS_TEAM', severity: 'HIGH', message: 'Team is anonymous - no social presence' },
      { type: 'LOW_LIQUIDITY', severity: 'MEDIUM', message: 'Very low liquidity (< $50k)' }
    ],
    score: 95
  }
};

type Protocol = typeof MOCK_PROTOCOLS[0];

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [protocols, setProtocols] = useState(MOCK_PROTOCOLS);
  const [selectedProtocol, setSelectedProtocol] = useState<Protocol | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [selectedChain, setSelectedChain] = useState('all');
  const [activeTab, setActiveTab] = useState('trending');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isOnline] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  //todo: remove mock functionality - replace with real API call
  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
      setLastUpdate(new Date());
    }, 1500);
  }, []);

  const chains = useMemo(() => {
    const uniqueChains = new Set<string>(['all']);
    protocols.forEach(p => {
      p.chains.forEach(chain => uniqueChains.add(chain));
    });
    return Array.from(uniqueChains);
  }, [protocols]);

  const filteredProtocols = useMemo(() => {
    return protocols.filter(p => {
      const chainMatch = selectedChain === 'all' || p.chains.includes(selectedChain);
      const searchMatch = !searchValue || 
        p.name.toLowerCase().includes(searchValue.toLowerCase()) ||
        p.category.toLowerCase().includes(searchValue.toLowerCase());
      return chainMatch && searchMatch;
    });
  }, [protocols, selectedChain, searchValue]);

  const displayProtocols = useMemo(() => {
    if (activeTab === 'trending') {
      return [...filteredProtocols].sort((a, b) => b.tvl - a.tvl);
    }
    return [...filteredProtocols].sort((a, b) => (a.age || 999999) - (b.age || 999999));
  }, [filteredProtocols, activeTab]);

  const stats = useMemo(() => ({
    total: protocols.length,
    chains: chains.length - 1,
    audited: Math.round((protocols.filter(p => p.audited).length / protocols.length) * 100),
    blacklisted: protocols.filter(p => MOCK_SCAN_RESULTS[p.id]?.severity === 'CRITICAL').length,
    totalTVL: protocols.reduce((sum, p) => sum + p.tvl, 0)
  }), [protocols, chains]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    //todo: remove mock functionality - replace with real refresh logic
    setTimeout(() => {
      setLastUpdate(new Date());
      setIsRefreshing(false);
      console.log('Refreshed protocols');
    }, 2000);
  };

  const handleViewDetails = (protocol: Protocol) => {
    setSelectedProtocol(protocol);
  };

  const handleScan = (protocol: Protocol) => {
    console.log('Scanning protocol:', protocol.name);
    //todo: remove mock functionality - replace with real scan logic
  };

  const formatTVL = (num: number) => {
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return `$${(num / 1e3).toFixed(0)}K`;
  };

  if (loading) {
    return (
      <LoadingSpinner
        message="🤖 AI Discovery + Security Scan"
        subtitle="Analyzing DeFi protocols across 126+ chains..."
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header
        isOnline={isOnline}
        lastUpdate={lastUpdate}
        onRefresh={handleRefresh}
        onAdd={() => console.log('Add protocol')}
        isRefreshing={isRefreshing}
      />

      <main className="max-w-screen-2xl mx-auto px-6 py-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            label="Total Protocols"
            value={stats.total.toLocaleString()}
            icon={Database}
          />
          <StatsCard
            label="Chains Supported"
            value={stats.chains}
            icon={TrendingUp}
          />
          <StatsCard
            label="Audited"
            value={`${stats.audited}%`}
            icon={Shield}
          />
          <StatsCard
            label="Blacklisted"
            value={stats.blacklisted}
            icon={AlertCircle}
          />
        </div>

        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <SearchBar value={searchValue} onChange={setSearchValue} />
          </div>
          <div className="lg:w-auto">
            <FilterChips
              options={chains}
              selected={selectedChain}
              onSelect={setSelectedChain}
            />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="trending" data-testid="tab-trending">
              <Sparkles className="w-4 h-4 mr-2" />
              Trending
            </TabsTrigger>
            <TabsTrigger value="new" data-testid="tab-new">
              <AlertCircle className="w-4 h-4 mr-2" />
              New Protocols
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {displayProtocols.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No protocols found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {displayProtocols.map((protocol) => (
                  <ProtocolCard
                    key={protocol.id}
                    protocol={protocol}
                    onViewDetails={handleViewDetails}
                    onScan={handleScan}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <ProtocolDetailModal
        protocol={selectedProtocol}
        scanResult={selectedProtocol ? MOCK_SCAN_RESULTS[selectedProtocol.id] : undefined}
        isOpen={!!selectedProtocol}
        onClose={() => setSelectedProtocol(null)}
      />
    </div>
  );
}
