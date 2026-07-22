import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Database, Shield, TrendingUp, AlertCircle, Sparkles,
  ScanSearch, DollarSign, Activity, ArrowRight, Search as SearchIcon,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useDebounce } from '@/hooks/useDebounce';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useToast } from '@/hooks/use-toast';
import { useScrollRestoration } from '@/hooks/useScrollRestoration';
import StatsCard from '@/components/StatsCard';
import SearchBar from '@/components/SearchBar';
import ProtocolTable from '@/components/ProtocolTable';
import LoadingSpinner from '@/components/LoadingSpinner';
import AddDAppByUrlDialog from '@/components/AddDAppByUrlDialog';
import TrendingTicker from '@/components/TrendingTicker';
import AdSpace from '@/components/AdSpace';
import SecurityRatingLegend from '@/components/SecurityRatingLegend';
import { LatestThreatsWidget } from '@/components/LatestThreatsWidget';
import type { Protocol, SecurityScan, BlacklistEntry } from '@shared/schema';
import { Link } from 'wouter';

interface PaginatedResponse {
  protocols: Protocol[];
  total: number;
  auditedCount: number;
  totalTVL?: number;
  totalVolume?: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export default function Dashboard() {
  const [searchValue, setSearchValue]         = useState('');
  const [selectedChain, setSelectedChain]     = useState('all');
  const [selectedCategory, setSelectedCategory] = useState(() => {
    const p = new URLSearchParams(window.location.search).get('category');
    return p ? decodeURIComponent(p) : 'all';
  });
  const [sortBy, setSortBy]                   = useState<'tvl' | 'security'>('security');
  const [activeTab, setActiveTab]             = useState('trending');
  const [securityScans, setSecurityScans]     = useState<Record<string, SecurityScan>>({});
  const [isProcessing, setIsProcessing]       = useState(false);
  const [allProtocols, setAllProtocols]       = useState<Protocol[]>([]);
  const [currentOffset, setCurrentOffset]     = useState(0);
  const [hasMore, setHasMore]                 = useState(true);
  const [isLoadingMore, setIsLoadingMore]     = useState(false);

  const isOnline     = useOnlineStatus();
  const { toast }    = useToast();
  const debouncedSearch = useDebounce(searchValue, 300);
  useScrollRestoration('dashboard');

  const { data: initialData, isLoading, refetch } = useQuery<PaginatedResponse & { totalTVL?: number }>({
    queryKey: ['/api/protocols'],
    enabled: isOnline,
    retry: 3,
  });

  useEffect(() => {
    if (initialData?.protocols) {
      setAllProtocols(initialData.protocols);
      setCurrentOffset(initialData.offset + initialData.protocols.length);
      setHasMore(initialData.hasMore);
    }
  }, [initialData]);

  const protocols = allProtocols;

  const { data: blacklist = [] } = useQuery<BlacklistEntry[]>({
    queryKey: ['/api/blacklist'],
    enabled: isOnline,
  });

  const { data: storedScans = {} } = useQuery<Record<string, SecurityScan>>({
    queryKey: ['/api/scans'],
    enabled: isOnline,
  });

  useEffect(() => {
    if (Object.keys(storedScans).length > 0) setSecurityScans(storedScans);
  }, [storedScans]);

  const scanMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await apiRequest('POST', '/api/scan', { protocolIds: ids });
      return res.json();
    },
    onSuccess: (data: { scanResults: Record<string, SecurityScan>; scannedCount: number; newBlacklistEntries: BlacklistEntry[] }) => {
      setSecurityScans(prev => ({ ...prev, ...data.scanResults }));
      queryClient.invalidateQueries({ queryKey: ['/api/blacklist'] });
      toast({ title: 'Security Scan Complete', description: `Scanned ${data.scannedCount} protocols. Found ${data.newBlacklistEntries.length} critical threats.` });
    },
    onError: (err) => {
      toast({ title: 'Scan Failed', description: err instanceof Error ? err.message : 'Failed to scan protocols', variant: 'destructive' });
    },
  });

  const blacklistMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest('POST', '/api/admin/blacklist', { protocolId: id });
      return res.json();
    },
    onSuccess: (data: { success: boolean; message: string }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/blacklist'] });
      queryClient.invalidateQueries({ queryKey: ['/api/protocols'] });
      toast({ title: 'Blacklist Updated', description: data.message });
    },
    onError: (err: any) => {
      toast({ title: 'Blacklist Failed', description: err?.message ?? 'Failed to blacklist protocol', variant: 'destructive' });
    },
  });

  const handleScanAll = useCallback(() => {
    if (protocols.length > 0) scanMutation.mutate(protocols.slice(0, 50).map(p => p.id));
  }, [protocols, scanMutation]);

  const handleLoadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore || !isOnline) return;
    setIsLoadingMore(true);
    try {
      const params = new URLSearchParams({ limit: '500', offset: currentOffset.toString() });
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (selectedChain    !== 'all') params.append('chain',    selectedChain);
      const res  = await fetch(`/api/protocols?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const data: PaginatedResponse = await res.json();
      if (data.protocols?.length > 0) {
        let deduped = 0;
        setAllProtocols(prev => {
          const existing = new Set(prev.map(p => p.id));
          const fresh: Protocol[] = [];
          for (const p of data.protocols) {
            if (!existing.has(p.id)) { existing.add(p.id); fresh.push(p); }
          }
          deduped = fresh.length;
          return fresh.length ? [...prev, ...fresh] : prev;
        });
        setCurrentOffset(prev => prev + data.protocols.length);
        setHasMore(data.hasMore);
        const skipped = data.protocols.length - deduped;
        toast({ title: 'Loaded More', description: `${deduped} new protocols${skipped > 0 ? ` (${skipped} skipped)` : ''}.` });
      }
    } catch (err) {
      toast({ title: 'Load Failed', description: err instanceof Error ? err.message : 'Failed to load', variant: 'destructive' });
    } finally {
      setIsLoadingMore(false);
    }
  }, [currentOffset, hasMore, isLoadingMore, isOnline, toast, selectedCategory, selectedChain]);

  const chains = useMemo(() => {
    const s = new Set<string>(['all']);
    protocols.forEach(p => p.chains.forEach(c => s.add(c)));
    return Array.from(s);
  }, [protocols]);

  const categories = useMemo(() => {
    const base = ['all','DeFi','DEX','Lending','Yield','Bridge','NFT','Gaming','Derivatives','Insurance','Stablecoin','Liquid Staking','DAO','Synthetics','Options','Prediction Market','RWA','CDP','Services','Launchpad'];
    const extra = new Set<string>();
    protocols.forEach(p => { if (!base.includes(p.category)) extra.add(p.category); });
    return [...base, ...Array.from(extra)];
  }, [protocols]);

  const filteredProtocols = useMemo(() => protocols.filter(p => {
    const chainMatch    = selectedChain    === 'all' || p.chains.includes(selectedChain);
    const catMatch      = selectedCategory === 'all' || p.category === selectedCategory;
    const searchMatch   = !debouncedSearch ||
      p.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(debouncedSearch.toLowerCase());
    return chainMatch && catMatch && searchMatch;
  }), [protocols, selectedChain, selectedCategory, debouncedSearch]);

  useEffect(() => {
    setIsProcessing(true);
    const t = setTimeout(() => setIsProcessing(false), 150);
    return () => clearTimeout(t);
  }, [sortBy, selectedChain, selectedCategory]);

  const displayProtocols = useMemo(() => {
    let s = [...filteredProtocols];
    if (sortBy === 'tvl') {
      s.sort((a, b) => b.tvl - a.tvl);
    } else {
      s.sort((a, b) => {
        const sa = securityScans[a.id]?.score ?? a.securityScore;
        const sb = securityScans[b.id]?.score ?? b.securityScore;
        return sb - sa;
      });
    }
    if (activeTab === 'new') s.sort((a, b) => (a.age ?? 999999) - (b.age ?? 999999));
    return s;
  }, [filteredProtocols, activeTab, sortBy, securityScans]);

  const stats = useMemo(() => ({
    total:       initialData?.total       || protocols.length,
    chains:      126,
    audited:     initialData?.auditedCount || 0,
    blacklisted: blacklist.filter(b => b.status === 'ACTIVE').length,
    totalTVL:    initialData?.totalTVL    || protocols.reduce((s, p) => s + p.tvl, 0),
    totalVolume: initialData?.totalVolume || protocols.reduce((s, p) => s + (Number(p.volume24h) || 0), 0),
  }), [protocols, blacklist, initialData]);

  const fmtCurrency = (n: number) => {
    if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
    if (n >= 1e9)  return `$${(n / 1e9).toFixed(2)}B`;
    if (n >= 1e6)  return `$${(n / 1e6).toFixed(2)}M`;
    if (n >= 1e3)  return `$${(n / 1e3).toFixed(2)}K`;
    return `$${n.toFixed(2)}`;
  };

  const handleScan      = useCallback((p: Protocol) => scanMutation.mutate([p.id]), [scanMutation]);
  const handleBlacklist = useCallback((p: Protocol) => blacklistMutation.mutate(p.id), [blacklistMutation]);

  /* ── Offline ────────────────────────────────────────────────────── */
  if (!isOnline) {
    return (
      <div className="min-h-screen bg-[#060606] flex items-center justify-center">
        <div className="text-center space-y-3">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-black uppercase tracking-widest text-white">No Connection</h2>
          <p className="text-sm text-white/40">Please check your connection and try again</p>
        </div>
      </div>
    );
  }

  /* ── Loading ────────────────────────────────────────────────────── */
  if (isLoading) {
    return (
      <LoadingSpinner
        message="Loading Protocols"
        subtitle="Fetching DeFi protocols across 126+ chains..."
      />
    );
  }

  /* ── Main render ────────────────────────────────────────────────── */
  return (
    <div className="bg-[#060606] min-h-screen">
      <AdSpace position="top" />
      <TrendingTicker />

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative bg-[#060606] border-b border-[#1a1a1a] overflow-hidden">
        {/* Grid background */}
        <div className="absolute inset-0 grid-bg" />
        {/* Subtle gold gradient wash */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#E8C15A]/[0.03] via-transparent to-transparent" />

        <div className="relative max-w-screen-2xl mx-auto px-5 sm:px-8 py-14 sm:py-20">
          {/* Tagline */}
          <p className="text-[10px] sm:text-xs font-black tracking-[0.35em] text-[#E8C15A] mb-5 sm:mb-7 uppercase">
            /// The Watchtower of Web3
          </p>

          {/* Hero headline */}
          <h1 className="font-display font-black uppercase leading-[0.9] tracking-tight text-white">
            <span className="block text-[clamp(3rem,10vw,8.5rem)]">Every</span>
            <span className="block text-[clamp(3rem,10vw,8.5rem)]">Exploit.</span>
            <span className="block text-[clamp(3rem,10vw,8.5rem)]">Every</span>
            <span className="block text-[clamp(3rem,10vw,8.5rem)]">Audit.</span>
            <span className="block text-[clamp(3rem,10vw,8.5rem)] text-[#E8C15A]">One Ledger.</span>
          </h1>

          {/* Sub-copy + CTA */}
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row sm:items-end gap-6 sm:gap-12">
            <p className="text-sm text-white/40 max-w-sm leading-relaxed">
              Aggregated security intelligence across{' '}
              <span className="text-white/70 font-semibold">126+ blockchains</span> and{' '}
              <span className="text-white/70 font-semibold">{stats.total.toLocaleString()}+ protocols</span>.
              Real-time threat detection, audit coverage, and exploit history — all in one place.
            </p>
            <div className="flex gap-3 shrink-0">
              <Link href="/threats">
                <button className="border border-[#E8C15A]/50 text-[#E8C15A] text-[11px] font-bold tracking-[0.18em] uppercase px-5 py-2.5 hover:bg-[#E8C15A]/10 transition-colors">
                  Threat Intel
                </button>
              </Link>
              <Link href="/bug-bounties">
                <button className="border border-white/15 text-white/55 text-[11px] font-bold tracking-[0.18em] uppercase px-5 py-2.5 hover:border-white/30 hover:text-white/80 transition-colors">
                  Bug Bounties
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ────────────────────────────────────────────────── */}
      <section className="border-b border-[#1a1a1a]">
        <div className="max-w-screen-2xl mx-auto px-5 sm:px-8 py-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-px bg-[#1a1a1a]">
            {/* Each card sits on the gap colour, creating hairline dividers */}
            <div className="bg-[#060606]">
              <StatsCard label="Total Protocols" value={stats.total.toLocaleString()} icon={Database} />
            </div>
            <div className="bg-[#060606]">
              <StatsCard label="Total TVL" value={fmtCurrency(stats.totalTVL)} icon={DollarSign} tooltip="Total Value Locked across all tracked protocols" />
            </div>
            <div className="bg-[#060606]">
              <StatsCard label="Total Volume" value={fmtCurrency(stats.totalVolume)} icon={Activity} tooltip="Total 24h trading volume across all tracked protocols" />
            </div>
            <div className="bg-[#060606]">
              <StatsCard label="Chains" value="126+" icon={TrendingUp} tooltip="Tracks DeFi protocols across 126+ blockchain networks" />
            </div>
            <div className="bg-[#060606]">
              <StatsCard label="Audited" value={stats.audited.toLocaleString()} icon={Shield} tooltip="Total protocols with audit data from DeFiLlama." />
            </div>
            <div className="bg-[#060606]">
              <StatsCard label="Blacklisted" value={stats.blacklisted} icon={AlertCircle} tooltip="Protocols that reached a CRITICAL risk score." />
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-screen-2xl mx-auto px-5 sm:px-8 py-8 space-y-8">

        {/* ── THREAT INTEL + LEGEND ──────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-[#1a1a1a]">
          <div className="bg-[#060606]"><LatestThreatsWidget /></div>
          <div className="bg-[#060606]"><SecurityRatingLegend /></div>
        </div>

        {/* ── SEARCH + FILTERS ───────────────────────────────────────── */}
        <div className="space-y-3">
          {/* Row 1: search + action buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
              <SearchBar value={searchValue} onChange={setSearchValue} />
            </div>
            <div className="flex gap-2 shrink-0">
              <AddDAppByUrlDialog />
              <Button
                onClick={handleScanAll}
                disabled={scanMutation.isPending || protocols.length === 0}
                variant="default"
                className="font-bold tracking-widest uppercase text-[11px] h-9 px-4"
                data-testid="button-scan-all"
              >
                <ScanSearch className="w-4 h-4 mr-2" />
                {scanMutation.isPending ? 'Scanning...' : 'Scan All'}
              </Button>
            </div>
          </div>

          {/* Row 2: filters + sort */}
          <div className="flex gap-2 flex-wrap items-center">
            <Select value={selectedChain} onValueChange={setSelectedChain}>
              <SelectTrigger className="w-[150px] text-[11px] uppercase tracking-wider border-[#1a1a1a] bg-[#080808] h-9" data-testid="select-chain">
                <SelectValue placeholder="All Chains" />
              </SelectTrigger>
              <SelectContent className="bg-[#0d0d0d] border-[#2a2a2a]">
                {chains.map(c => (
                  <SelectItem key={c} value={c} className="text-[11px] uppercase tracking-wider" data-testid={`option-chain-${c}`}>
                    {c === 'all' ? 'All Chains' : c.charAt(0).toUpperCase() + c.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[160px] text-[11px] uppercase tracking-wider border-[#1a1a1a] bg-[#080808] h-9" data-testid="select-category">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent className="bg-[#0d0d0d] border-[#2a2a2a]">
                {categories.map(c => (
                  <SelectItem key={c} value={c} className="text-[11px] uppercase tracking-wider" data-testid={`option-category-${c}`}>
                    {c === 'all' ? 'All Categories' : c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Divider */}
            <div className="h-6 w-px bg-[#1a1a1a] hidden sm:block" />

            <button
              onClick={() => setSortBy('tvl')}
              className={[
                'flex items-center gap-2 h-9 px-4 text-[11px] font-bold tracking-widest uppercase border transition-colors',
                sortBy === 'tvl'
                  ? 'border-[#E8C15A]/50 text-[#E8C15A] bg-[#E8C15A]/5'
                  : 'border-[#1a1a1a] text-white/40 hover:border-[#2a2a2a] hover:text-white/60',
              ].join(' ')}
              data-testid="button-sort-tvl"
            >
              <DollarSign className="w-3.5 h-3.5" />
              Rank by TVL
            </button>

            <button
              onClick={() => setSortBy('security')}
              className={[
                'flex items-center gap-2 h-9 px-4 text-[11px] font-bold tracking-widest uppercase border transition-colors',
                sortBy === 'security'
                  ? 'border-[#E8C15A]/50 text-[#E8C15A] bg-[#E8C15A]/5'
                  : 'border-[#1a1a1a] text-white/40 hover:border-[#2a2a2a] hover:text-white/60',
              ].join(' ')}
              data-testid="button-sort-security"
            >
              <Shield className="w-3.5 h-3.5" />
              Rank by Security
            </button>
          </div>
        </div>

        {/* ── INFO CALLOUT ───────────────────────────────────────────── */}
        <div className="border border-[#1a1a1a] bg-[#080808] px-5 py-4">
          <p className="text-[9px] font-black tracking-[0.2em] uppercase text-[#E8C15A]/70 mb-3">
            Data Sources &amp; Methodology
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-[11px] text-white/40 leading-relaxed">
            <p><span className="text-white/60 font-semibold">Security scores</span> — audit coverage (CertiK, Code4rena, Sherlock), incident history, bug bounty programs, governance &amp; TVL signals.</p>
            <p><span className="text-white/60 font-semibold">Incident History</span> — all known hacks and exploits sourced from DeFiLlama's database.</p>
            <p><span className="text-white/60 font-semibold">Bug Bounty Tracking</span> — active Immunefi programs surface responsible-disclosure investment.</p>
            <p><span className="text-white/60 font-semibold">Submit a Protocol</span> — use "+ Protocol" to add any DeFi protocol for tracking.</p>
          </div>
        </div>

        {/* ── PROTOCOL TABLE ─────────────────────────────────────────── */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-transparent border-b border-[#1a1a1a] rounded-none gap-0 p-0 h-auto w-full justify-start">
            <TabsTrigger
              value="trending"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#E8C15A] data-[state=active]:text-[#E8C15A] data-[state=active]:bg-transparent text-white/40 text-[11px] font-black tracking-[0.18em] uppercase px-5 py-3 h-auto"
              data-testid="tab-trending"
            >
              <Sparkles className="w-3.5 h-3.5 mr-2" />
              Trending
            </TabsTrigger>
            <TabsTrigger
              value="new"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#E8C15A] data-[state=active]:text-[#E8C15A] data-[state=active]:bg-transparent text-white/40 text-[11px] font-black tracking-[0.18em] uppercase px-5 py-3 h-auto"
              data-testid="tab-new"
            >
              <AlertCircle className="w-3.5 h-3.5 mr-2" />
              New Protocols
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-0">
            {isProcessing && (
              <div className="fixed top-4 right-4 z-50 bg-[#E8C15A] text-black px-4 py-2 flex items-center gap-2 text-[11px] font-black tracking-widest uppercase animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                Processing
              </div>
            )}

            {displayProtocols.length === 0 ? (
              <div className="border border-[#1a1a1a] py-16 text-center">
                <p className="text-sm text-white/30 uppercase tracking-widest">No protocols found</p>
              </div>
            ) : (
              <>
                <ProtocolTable
                  key={`${selectedChain}-${selectedCategory}-${sortBy}-${activeTab}-${debouncedSearch}`}
                  protocols={displayProtocols}
                  securityScans={securityScans}
                  onBlacklist={handleBlacklist}
                />

                {hasMore && activeTab === 'trending' && !debouncedSearch && (
                  <div className="mt-8 flex flex-col items-center gap-3">
                    <button
                      onClick={handleLoadMore}
                      disabled={isLoadingMore || !isOnline}
                      className="border border-[#1a1a1a] hover:border-[#E8C15A]/40 text-white/50 hover:text-[#E8C15A] text-[11px] font-black tracking-[0.2em] uppercase px-8 py-3 transition-colors disabled:opacity-40 flex items-center gap-3"
                      data-testid="button-load-more"
                    >
                      {isLoadingMore ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <Database className="w-3.5 h-3.5" />
                          Load More Protocols
                        </>
                      )}
                    </button>
                    <p className="text-[10px] text-white/25 tracking-wider">
                      Showing {allProtocols.length.toLocaleString()} of {(initialData?.total ?? allProtocols.length).toLocaleString()}+ protocols
                      {(selectedCategory !== 'all' || selectedChain !== 'all') && <span className="ml-1">(filtered)</span>}
                    </p>
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <AdSpace position="bottom" />
    </div>
  );
}
