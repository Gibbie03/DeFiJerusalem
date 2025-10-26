import { useState, useEffect, useMemo, useCallback } from 'react';
import { Database, Shield, TrendingUp, AlertCircle, Sparkles, ScanSearch } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useDebounce } from '@/hooks/useDebounce';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import StatsCard from '@/components/StatsCard';
import SearchBar from '@/components/SearchBar';
import ProtocolCard from '@/components/ProtocolCard';
import ProtocolDetailModal from '@/components/ProtocolDetailModal';
import LoadingSpinner from '@/components/LoadingSpinner';
import AddDAppByUrlDialog from '@/components/AddDAppByUrlDialog';
import TrendingTicker from '@/components/TrendingTicker';
import AdSpace from '@/components/AdSpace';
import type { Protocol, SecurityScan, BlacklistEntry } from '@shared/schema';

export default function Dashboard() {
  const [selectedProtocol, setSelectedProtocol] = useState<Protocol | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [selectedChain, setSelectedChain] = useState('all');
  const [activeTab, setActiveTab] = useState('trending');
  const [securityScans, setSecurityScans] = useState<Record<string, SecurityScan>>({});
  
  const isOnline = useOnlineStatus();
  const { toast } = useToast();
  const debouncedSearch = useDebounce(searchValue, 300);

  // Fetch protocols from API
  const { data: protocols = [], isLoading, refetch } = useQuery<Protocol[]>({
    queryKey: ['/api/protocols'],
    enabled: isOnline,
    staleTime: 30 * 60 * 1000, // 30 minutes
    retry: 3,
  });

  // Fetch blacklist
  const { data: blacklist = [] } = useQuery<BlacklistEntry[]>({
    queryKey: ['/api/blacklist'],
    enabled: isOnline,
  });

  // Fetch all existing scans from database
  const { data: storedScans = {} } = useQuery<Record<string, SecurityScan>>({
    queryKey: ['/api/scans'],
    enabled: isOnline,
  });

  // Update local security scans when stored scans are loaded
  useEffect(() => {
    if (Object.keys(storedScans).length > 0) {
      setSecurityScans(storedScans);
    }
  }, [storedScans]);

  // Security scan mutation
  const scanMutation = useMutation({
    mutationFn: async (protocolIds: string[]) => {
      const res = await apiRequest('POST', '/api/scan', { protocolIds });
      return await res.json();
    },
    onSuccess: (data: { scanResults: Record<string, SecurityScan>; scannedCount: number; newBlacklistEntries: BlacklistEntry[] }) => {
      setSecurityScans(prev => ({ ...prev, ...data.scanResults }));
      queryClient.invalidateQueries({ queryKey: ['/api/blacklist'] });
      toast({
        title: "Security Scan Complete",
        description: `Scanned ${data.scannedCount} protocols. Found ${data.newBlacklistEntries.length} critical threats.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Scan Failed",
        description: error instanceof Error ? error.message : "Failed to scan protocols",
        variant: "destructive",
      });
    },
  });

  // Manual scan function
  const handleScanAll = useCallback(() => {
    if (protocols.length > 0) {
      const protocolIds = protocols.slice(0, 50).map(p => p.id);
      scanMutation.mutate(protocolIds);
    }
  }, [protocols, scanMutation]);

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
      const searchMatch = !debouncedSearch || 
        p.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        p.category.toLowerCase().includes(debouncedSearch.toLowerCase());
      return chainMatch && searchMatch;
    });
  }, [protocols, selectedChain, debouncedSearch]);

  const displayProtocols = useMemo(() => {
    if (activeTab === 'trending') {
      return [...filteredProtocols].sort((a, b) => b.tvl - a.tvl);
    }
    return [...filteredProtocols].sort((a, b) => (a.age || 999999) - (b.age || 999999));
  }, [filteredProtocols, activeTab]);

  const stats = useMemo(() => ({
    total: protocols.length,
    chains: chains.length - 1,
    audited: Math.round((protocols.filter(p => p.audited).length / protocols.length) * 100) || 0,
    blacklisted: blacklist.filter(b => b.status === 'ACTIVE').length,
    totalTVL: protocols.reduce((sum, p) => sum + p.tvl, 0)
  }), [protocols, chains, blacklist]);

  const handleRefresh = useCallback(async () => {
    if (!isOnline) {
      toast({
        title: "No Connection",
        description: "Cannot refresh while offline",
        variant: "destructive",
      });
      return;
    }
    await refetch();
    toast({
      title: "Refreshed",
      description: "Protocol data updated successfully",
    });
  }, [isOnline, refetch, toast]);

  const handleViewDetails = useCallback((protocol: Protocol) => {
    setSelectedProtocol(protocol);
  }, []);

  const handleScan = useCallback(async (protocol: Protocol) => {
    scanMutation.mutate([protocol.id]);
  }, [scanMutation]);

  const handleScanProtocol = useCallback((protocolId: string) => {
    scanMutation.mutate([protocolId]);
  }, [scanMutation]);

  if (!isOnline) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">No Internet Connection</h2>
          <p className="text-muted-foreground">Please check your connection and try again</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <LoadingSpinner
        message="Loading Protocols"
        subtitle="Fetching DeFi protocols across 126+ chains..."
      />
    );
  }

  return (
    <div className="bg-background">
      <Header
        isOnline={isOnline}
        lastUpdate={new Date()}
        onRefresh={handleRefresh}
        onAdd={() => console.log('Add protocol')}
        isRefreshing={scanMutation.isPending}
      />

      <AdSpace position="top" />
      
      <TrendingTicker />

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
          <div className="flex gap-2 flex-wrap">
            <AddDAppByUrlDialog />
            <Select value={selectedChain} onValueChange={setSelectedChain}>
              <SelectTrigger className="w-[200px]" data-testid="select-chain">
                <SelectValue placeholder="Filter by chain" />
              </SelectTrigger>
              <SelectContent>
                {chains.map((chain) => (
                  <SelectItem key={chain} value={chain} data-testid={`option-chain-${chain}`}>
                    {chain === 'all' ? 'All Chains' : chain.charAt(0).toUpperCase() + chain.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleScanAll}
              disabled={scanMutation.isPending || protocols.length === 0}
              variant="default"
              data-testid="button-scan-all"
            >
              <ScanSearch className="w-4 h-4 mr-2" />
              {scanMutation.isPending ? 'Scanning...' : 'Scan All'}
            </Button>
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

      <AdSpace position="bottom" />

      <ProtocolDetailModal
        protocol={selectedProtocol}
        scanResult={selectedProtocol ? securityScans[selectedProtocol.id] : undefined}
        isOpen={!!selectedProtocol}
        onClose={() => setSelectedProtocol(null)}
        onScan={handleScanProtocol}
        isScanning={scanMutation.isPending}
      />
    </div>
  );
}
