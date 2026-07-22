import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ExternalLink, Search, Shield, DollarSign, AlertCircle } from 'lucide-react';

interface BugBountyProgram {
  slug: string;
  name: string;
  url: string;
  maxBounty: number;
  highestBountyLabel: string;
  assets: string[];
}

function bountyTier(max: number): { label: string; color: string } {
  if (max >= 5_000_000)  return { label: 'Critical', color: 'bg-red-500/15 text-red-400 border-red-500/30' };
  if (max >= 1_000_000)  return { label: 'High',     color: 'bg-orange-500/15 text-orange-400 border-orange-500/30' };
  if (max >= 250_000)    return { label: 'Medium',   color: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' };
  return                        { label: 'Low',       color: 'bg-blue-500/15 text-blue-400 border-blue-500/30' };
}

function formatBounty(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

function ProgramCard({ program }: { program: BugBountyProgram }) {
  const tier = bountyTier(program.maxBounty);
  return (
    <a
      href={program.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block group"
    >
      <Card className="hover:border-primary/50 transition-all duration-200 hover:shadow-md hover:shadow-primary/5 cursor-pointer h-full">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Avatar placeholder using first char */}
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-sm font-bold text-primary">
                {program.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-sm leading-tight truncate group-hover:text-primary transition-colors">
                  {program.name}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                  <span>via Immunefi</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </div>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <div className="font-bold text-base tabular-nums">
                {program.highestBountyLabel || formatBounty(program.maxBounty)}
              </div>
              <div className="text-xs text-muted-foreground">max reward</div>
            </div>
          </div>
          <div className="mt-3">
            <Badge variant="outline" className={`text-[10px] px-2 py-0 ${tier.color}`}>
              {tier.label} tier
            </Badge>
          </div>
        </CardContent>
      </Card>
    </a>
  );
}

function SkeletonCard() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="w-9 h-9 rounded-lg shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
        <Skeleton className="h-5 w-20 mt-3" />
      </CardContent>
    </Card>
  );
}

const SORT_OPTIONS = [
  { value: 'bounty_desc', label: 'Highest bounty first' },
  { value: 'bounty_asc',  label: 'Lowest bounty first' },
  { value: 'name_asc',    label: 'Name (A–Z)' },
  { value: 'name_desc',   label: 'Name (Z–A)' },
];

const TIER_OPTIONS = [
  { value: 'all',      label: 'All tiers' },
  { value: 'critical', label: 'Critical (≥$5M)' },
  { value: 'high',     label: 'High (≥$1M)' },
  { value: 'medium',   label: 'Medium (≥$250K)' },
  { value: 'low',      label: 'Low (<$250K)' },
];

function tierMatch(max: number, tier: string): boolean {
  if (tier === 'all')      return true;
  if (tier === 'critical') return max >= 5_000_000;
  if (tier === 'high')     return max >= 1_000_000 && max < 5_000_000;
  if (tier === 'medium')   return max >= 250_000   && max < 1_000_000;
  if (tier === 'low')      return max < 250_000;
  return true;
}

export default function BugBountiesDirectory() {
  const [search, setSearch]   = useState('');
  const [sort, setSort]       = useState('bounty_desc');
  const [tierFilter, setTier] = useState('all');

  const { data: programs = [], isLoading, isError } = useQuery<BugBountyProgram[]>({
    queryKey: ['/api/bug-bounties'],
    queryFn: () => fetch('/api/bug-bounties').then(r => r.json()),
    staleTime: 1000 * 60 * 30, // 30 min
  });

  const filtered = useMemo(() => {
    let list = programs.filter(p => {
      if (search) {
        const q = search.toLowerCase();
        if (!p.name.toLowerCase().includes(q)) return false;
      }
      return tierMatch(p.maxBounty, tierFilter);
    });

    list = [...list].sort((a, b) => {
      if (sort === 'bounty_desc') return b.maxBounty - a.maxBounty;
      if (sort === 'bounty_asc')  return a.maxBounty - b.maxBounty;
      if (sort === 'name_asc')    return a.name.localeCompare(b.name);
      if (sort === 'name_desc')   return b.name.localeCompare(a.name);
      return 0;
    });
    return list;
  }, [programs, search, sort, tierFilter]);

  // Stats
  const totalPool = programs.reduce((s, p) => s + p.maxBounty, 0);
  const criticalCount = programs.filter(p => p.maxBounty >= 5_000_000).length;

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="w-8 h-8 text-primary" />
          Bug Bounty Programs
        </h1>
        <p className="text-muted-foreground mt-1">
          A directory of active bug bounty programs run by DeFi protocols on Immunefi.
          Click any program to open its page on Immunefi and submit your report there.
        </p>
      </div>

      {/* Clarifying callout */}
      <div className="flex items-start gap-3 rounded-lg border border-blue-500/20 bg-blue-500/5 px-4 py-3 text-sm text-blue-300">
        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-blue-400" />
        <span>
          <strong className="font-semibold text-blue-200">This is a read-only directory.</strong>{' '}
          DeFiJerusalem does not manage these programs or accept vulnerability reports.
          All submissions go directly to the protocol via{' '}
          <a href="https://immunefi.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-100">Immunefi</a>.
        </span>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Active Programs', value: programs.length, icon: Shield },
          { label: 'Combined Rewards', value: `$${(totalPool / 1_000_000).toFixed(0)}M+`, icon: DollarSign },
          { label: 'Critical Tier (≥$5M)', value: criticalCount, icon: AlertCircle },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="pt-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <div>
                <div className="text-xl font-bold">{value}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search programs…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={tierFilter} onValueChange={setTier}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All tiers" />
          </SelectTrigger>
          <SelectContent>
            {TIER_OPTIONS.map(o => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map(o => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      {!isLoading && (
        <p className="text-sm text-muted-foreground">
          Showing {filtered.length} of {programs.length} programs
        </p>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-3" />
            <div className="font-semibold">Failed to load programs</div>
            <p className="text-sm text-muted-foreground mt-1">Please try again later.</p>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <div className="font-semibold">No programs match your filters</div>
            <p className="text-sm text-muted-foreground mt-1">Try adjusting the search or tier filter.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((program, i) => (
            <ProgramCard key={program.slug ?? i} program={program} />
          ))}
        </div>
      )}

      {/* Footer note */}
      <p className="text-xs text-muted-foreground text-center pb-2">
        Data sourced from{' '}
        <a href="https://immunefi.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
          Immunefi
        </a>
        . Always verify program details directly before submitting a report. Updated daily.
      </p>
    </div>
  );
}
