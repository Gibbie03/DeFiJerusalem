import { useState, useEffect, useMemo, useCallback } from 'react';
import { Database, Shield, TrendingUp, AlertCircle, Sparkles, ScanSearch, ArrowUpDown, DollarSign, BarChart3, Info } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useDebounce } from '@/hooks/useDebounce';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useToast } from '@/hooks/use-toast';
import StatsCard from '@/components/StatsCard';
import SearchBar from '@/components/SearchBar';
import ProtocolTable from '@/components/ProtocolTable';
import ProtocolDetailModal from '@/components/ProtocolDetailModal';
import LoadingSpinner from '@/components/LoadingSpinner';
import AddDAppByUrlDialog from '@/components/AddDAppByUrlDialog';
import TrendingTicker from '@/components/TrendingTicker';
import AdSpace from '@/components/AdSpace';
import SecurityRatingLegend from '@/components/SecurityRatingLegend';
import type { Protocol, SecurityScan, BlacklistEntry } from '@shared/schema';

// Paginated response type
interface PaginatedResponse {
  protocols: Protocol[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export default function Dashboard() {
  const [selectedProtocol, setSelectedProtocol] = useState<Protocol | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [selectedChain, setSelectedChain] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'tvl' | 'volume' | 'security'>('security');
  const [activeTab, setActiveTab] = useState('trending');
  const [securityScans, setSecurityScans] = useState<Record<string, SecurityScan>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [allProtocols, setAllProtocols] = useState<Protocol[]>([]);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  const isOnline = useOnlineStatus();
  const { toast } = useToast();
  const debouncedSearch = useDebounce(searchValue, 300);

  // Fetch initial protocols from API with pagination
  const { data: initialData, isLoading, refetch } = useQuery<PaginatedResponse>({
    queryKey: ['/api/protocols'],
    enabled: isOnline,
    staleTime: 30 * 60 * 1000, // 30 minutes
    retry: 3,
  });

  // Update protocols when initial data loads
  useEffect(() => {
    if (initialData?.protocols) {
      setAllProtocols(initialData.protocols);
      setCurrentOffset(initialData.offset + initialData.protocols.length);
      setHasMore(initialData.hasMore);
    }
  }, [initialData]);

  // Protocols to display (either filtered or all loaded)
  const protocols = allProtocols;

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

  // Load more protocols function
  const handleLoadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore || !isOnline) return;
    
    setIsLoadingMore(true);
    try {
      // Build query params with filters
      const params = new URLSearchParams({
        limit: '500',
        offset: currentOffset.toString()
      });
      
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (selectedChain !== 'all') params.append('chain', selectedChain);
      
      const response = await fetch(`/api/protocols?${params.toString()}`);
      
      // Check response status
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data: PaginatedResponse = await response.json();
      
      if (data.protocols && data.protocols.length > 0) {
        setAllProtocols(prev => [...prev, ...data.protocols]);
        setCurrentOffset(prev => prev + data.protocols.length);
        setHasMore(data.hasMore);
        
        toast({
          title: "Loaded More Protocols",
          description: `Loaded ${data.protocols.length} additional protocols. Total: ${currentOffset + data.protocols.length}`,
        });
      }
    } catch (error) {
      toast({
        title: "Load Failed",
        description: error instanceof Error ? error.message : "Failed to load more protocols",
        variant: "destructive",
      });
    } finally {
      setIsLoadingMore(false);
    }
  }, [currentOffset, hasMore, isLoadingMore, isOnline, toast, selectedCategory, selectedChain]);

  const chains = useMemo(() => {
    const uniqueChains = new Set<string>(['all']);
    protocols.forEach(p => {
      p.chains.forEach(chain => uniqueChains.add(chain));
    });
    return Array.from(uniqueChains);
  }, [protocols]);

  const categories = useMemo(() => {
    // Static list of all supported categories
    const allSupportedCategories = [
      'all',
      'DeFi',
      'DEX',
      'Lending',
      'Yield',
      'Bridge',
      'NFT',
      'Gaming',
      'Derivatives',
      'Insurance',
      'Stablecoin',
      'Liquid Staking',
      'DAO',
      'Synthetics',
      'Options',
      'Prediction Market',
      'RWA',
      'CDP',
      'Services',
      'Launchpad',
    ];
    // Add any additional categories from actual protocols
    const additionalCategories = new Set<string>();
    protocols.forEach(p => {
      if (!allSupportedCategories.includes(p.category)) {
        additionalCategories.add(p.category);
      }
    });
    return [...allSupportedCategories, ...Array.from(additionalCategories)];
  }, [protocols]);

  const filteredProtocols = useMemo(() => {
    return protocols.filter(p => {
      const chainMatch = selectedChain === 'all' || p.chains.includes(selectedChain);
      const categoryMatch = selectedCategory === 'all' || p.category === selectedCategory;
      const searchMatch = !debouncedSearch || 
        p.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        p.category.toLowerCase().includes(debouncedSearch.toLowerCase());
      return chainMatch && categoryMatch && searchMatch;
    });
  }, [protocols, selectedChain, selectedCategory, debouncedSearch]);

  // Show processing indicator when sort/filter changes
  useEffect(() => {
    setIsProcessing(true);
    const timer = setTimeout(() => setIsProcessing(false), 150);
    return () => clearTimeout(timer);
  }, [sortBy, selectedChain, selectedCategory]);

  const displayProtocols = useMemo(() => {
    let sorted = [...filteredProtocols];
    
    // Sort by selected criteria
    if (sortBy === 'tvl') {
      sorted.sort((a, b) => b.tvl - a.tvl);
    } else if (sortBy === 'volume') {
      sorted.sort((a, b) => b.volume24h - a.volume24h);
    } else if (sortBy === 'security') {
      sorted.sort((a, b) => b.securityScore - a.securityScore);
    }
    
    // Apply tab-specific sorting as secondary sort
    if (activeTab === 'new') {
      sorted.sort((a, b) => (a.age || 999999) - (b.age || 999999));
    }
    
    return sorted;
  }, [filteredProtocols, activeTab, sortBy]);

  const stats = useMemo(() => ({
    total: initialData?.total || protocols.length,
    chains: 126,
    audited: protocols.filter(p => p.audited || (p.auditCount && p.auditCount > 0)).length,
    blacklisted: blacklist.filter(b => b.status === 'ACTIVE').length,
    totalTVL: protocols.reduce((sum, p) => sum + p.tvl, 0)
  }), [protocols, blacklist, initialData]);

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
    // Show brief loading state for better UX feedback
    setIsProcessing(true);
    setTimeout(() => {
      setSelectedProtocol(protocol);
      setIsProcessing(false);
    }, 50); // Minimal delay to show visual feedback
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
    <div className="bg-background min-h-screen">
      <AdSpace position="top" />
      
      <TrendingTicker onProtocolClick={handleViewDetails} />

      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <StatsCard
            label="Total Protocols"
            value={stats.total.toLocaleString()}
            icon={Database}
          />
          <StatsCard
            label="Total TVL"
            value={(() => {
              const tvl = stats.totalTVL;
              if (tvl >= 1_000_000_000_000) return `$${(tvl / 1_000_000_000_000).toFixed(2)}T`;
              if (tvl >= 1_000_000_000) return `$${(tvl / 1_000_000_000).toFixed(2)}B`;
              if (tvl >= 1_000_000) return `$${(tvl / 1_000_000).toFixed(2)}M`;
              if (tvl >= 1_000) return `$${(tvl / 1_000).toFixed(2)}K`;
              return `$${tvl.toFixed(2)}`;
            })()}
            icon={DollarSign}
            tooltip="Total Value Locked across all tracked protocols"
          />
          <StatsCard
            label="Chains Supported"
            value="126+"
            icon={TrendingUp}
            tooltip="JERUSALEM tracks DeFi protocols across 126+ blockchain networks including Ethereum, BSC, Polygon, Arbitrum, Optimism, Avalanche, and more"
          />
          <StatsCard
            label="Audited"
            value={stats.audited.toLocaleString()}
            icon={Shield}
            tooltip="Number of protocols with verified audits. DeFiLlama API does not reliably provide audit information for most protocols. This data may not be accurate. Audits must be verified independently."
          />
          <StatsCard
            label="Blacklisted"
            value={stats.blacklisted}
            icon={AlertCircle}
            tooltip="Protocols are automatically blacklisted when they reach a CRITICAL risk score (≥80 points). This includes new contracts (<7 days), no audits, anonymous teams, and low liquidity (<$50k)."
          />
        </div>

        <Alert data-testid="alert-scanning-info" className="bg-muted/50">
          <Info className="h-4 w-4" />
          <AlertTitle>Scanning Information</AlertTitle>
          <AlertDescription className="space-y-2 mt-2">
            <div>
              <strong>How often do we scan?</strong> Security scans are currently manual-only. Click "Scan All" to run comprehensive threat detection across all protocols. Automated weekly scans are planned for future releases.
            </div>
            <div>
              <strong>Multi-chain coverage:</strong> JERUSALEM scans DeFi protocols across 126+ blockchain chains including Ethereum, BSC, Polygon, Arbitrum, Optimism, Avalanche, Fantom, and more.
            </div>
            <div>
              <strong>Can we scan contract addresses?</strong> Currently, JERUSALEM scans protocols discovered through DeFiLlama's comprehensive protocol database. Direct contract address scanning (paste any 0x address) is planned for a future release. For now, you can manually add protocols by URL using the "+ DApp" button.
            </div>
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-3 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <SearchBar value={searchValue} onChange={setSearchValue} />
              </div>
              <div className="flex gap-2">
                <AddDAppByUrlDialog />
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
            
            <div className="flex gap-2 flex-wrap">
              <Select value={selectedChain} onValueChange={setSelectedChain}>
                <SelectTrigger className="w-[160px]" data-testid="select-chain">
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
              
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[160px]" data-testid="select-category">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category} data-testid={`option-category-${category}`}>
                      {category === 'all' ? 'All Categories' : category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button
                variant={sortBy === 'tvl' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('tvl')}
                data-testid="button-sort-tvl"
              >
                <ArrowUpDown className="w-4 h-4 mr-2" />
                Rank by TVL
              </Button>
              
              <div className="relative group">
                <Button
                  variant={sortBy === 'volume' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortBy('volume')}
                  data-testid="button-sort-volume"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Rank by Volume
                </Button>
                <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-50 w-64 p-2 text-xs bg-popover text-popover-foreground border border-border rounded-md shadow-lg">
                  Estimated 24h volume based on TVL and protocol category. DEXes have higher turnover than lending protocols.
                </div>
              </div>
              
              <Button
                variant={sortBy === 'security' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('security')}
                data-testid="button-sort-security"
              >
                <Shield className="w-4 h-4 mr-2" />
                Rank by Security
              </Button>
            </div>
          </div>
          
          <div>
            <SecurityRatingLegend />
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
            {isProcessing && (
              <div className="fixed top-4 right-4 z-50 bg-primary text-primary-foreground px-4 py-2 rounded-md shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm font-medium">Processing...</span>
              </div>
            )}
            {displayProtocols.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No protocols found</p>
              </div>
            ) : (
              <>
                <ProtocolTable
                  key={`${selectedChain}-${selectedCategory}-${sortBy}-${activeTab}-${debouncedSearch}`}
                  protocols={displayProtocols}
                  securityScans={securityScans}
                  onViewDetails={handleViewDetails}
                />
                
                {/* Load More Button - Available for all filter states */}
                {hasMore && activeTab === 'trending' && !debouncedSearch && (
                  <div className="mt-8 flex flex-col items-center gap-3">
                    <Button
                      onClick={handleLoadMore}
                      disabled={isLoadingMore || !isOnline}
                      size="lg"
                      className="min-w-[200px]"
                      data-testid="button-load-more"
                    >
                      {isLoadingMore ? (
                        <>
                          <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2"></div>
                          Loading...
                        </>
                      ) : (
                        <>
                          <Database className="w-4 h-4 mr-2" />
                          Load More Protocols
                        </>
                      )}
                    </Button>
                    <p className="text-sm text-muted-foreground">
                      Showing {allProtocols.length} of {initialData?.total || allProtocols.length}+ protocols
                      {(selectedCategory !== 'all' || selectedChain !== 'all') && (
                        <span className="ml-1">(filtered)</span>
                      )}
                    </p>
                  </div>
                )}
              </>
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
