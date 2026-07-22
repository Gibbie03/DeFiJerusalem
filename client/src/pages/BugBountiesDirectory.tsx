import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Bug, ExternalLink, Search, TrendingUp, Shield, DollarSign, ArrowUpDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface BountyProgram {
  id: string;
  name: string;
  logo: string | null;
  category: string;
  tvl: number;
  securityScore: number;
  maxBounty: number;
  bountyUrl: string;
  platform: 'Immunefi' | 'HackerOne' | 'Other';
}

type SortKey = 'maxBounty' | 'tvl' | 'securityScore';

function scoreColor(score: number): string {
  if (score >= 80) return 'text-green-400';
  if (score >= 65) return 'text-blue-400';
  if (score >= 50) return 'text-yellow-400';
  if (score >= 30) return 'text-orange-400';
  return 'text-red-400';
}

function scoreBg(score: number): string {
  if (score >= 80) return 'bg-green-500/10 border-green-500/30 text-green-400';
  if (score >= 65) return 'bg-blue-500/10 border-blue-500/30 text-blue-400';
  if (score >= 50) return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400';
  if (score >= 30) return 'bg-orange-500/10 border-orange-500/30 text-orange-400';
  return 'bg-red-500/10 border-red-500/30 text-red-400';
}

function scoreLabel(score: number): string {
  if (score >= 80) return 'SAFE';
  if (score >= 65) return 'LOW RISK';
  if (score >= 50) return 'MEDIUM';
  if (score >= 30) return 'HIGH RISK';
  return 'CRITICAL';
}

function formatTvl(tvl: number): string {
  if (tvl >= 1e12) return `$${(tvl / 1e12).toFixed(1)}T`;
  if (tvl >= 1e9)  return `$${(tvl / 1e9).toFixed(1)}B`;
  if (tvl >= 1e6)  return `$${(tvl / 1e6).toFixed(0)}M`;
  if (tvl >= 1e3)  return `$${(tvl / 1e3).toFixed(0)}K`;
  return `$${tvl}`;
}

function formatBounty(amount: number): string {
  if (amount <= 0) return 'Available';
  if (amount >= 1e6) return `$${(amount / 1e6).toFixed(1)}M`;
  if (amount >= 1e3) return `$${(amount / 1e3).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

function PlatformBadge({ platform }: { platform: string }) {
  if (platform === 'Immunefi') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded-sm bg-orange-500/15 text-orange-400 border border-orange-500/25">
        Immunefi
      </span>
    );
  }
  if (platform === 'HackerOne') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded-sm bg-red-500/15 text-red-400 border border-red-500/25">
        HackerOne
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded-sm bg-gray-500/15 text-gray-400 border border-gray-500/25">
      Bug Bounty
    </span>
  );
}

function BountyCard({ program }: { program: BountyProgram }) {
  return (
    <Card className="bg-[#0d0d0d] border border-white/8 hover:border-white/20 transition-colors group">
      <CardContent className="p-4 space-y-3">
        {/* Header: logo + name + platform */}
        <div className="flex items-start gap-3">
          {program.logo ? (
            <img
              src={program.logo}
              alt={program.name}
              className="w-10 h-10 rounded object-contain bg-white/5 shrink-0"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <div className="w-10 h-10 rounded bg-white/5 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-gray-500" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-white text-sm leading-tight">{program.name}</span>
              <PlatformBadge platform={program.platform} />
            </div>
            <span className="text-xs text-gray-500 mt-0.5 block">{program.category}</span>
          </div>
          {/* DFJ score badge */}
          <div className={`shrink-0 text-right px-2.5 py-1 rounded border text-xs font-bold ${scoreBg(program.securityScore)}`}>
            <div className="text-base leading-none tabular-nums">{Math.round(program.securityScore)}</div>
            <div className="text-[9px] mt-0.5 tracking-wider">{scoreLabel(program.securityScore)}</div>
          </div>
        </div>

        {/* Max bounty — big green number */}
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-green-400 tabular-nums">
            {formatBounty(program.maxBounty)}
          </span>
          <span className="text-xs text-gray-500">max payout</span>
        </div>

        {/* TVL */}
        <div className="text-xs text-gray-400">
          TVL: <span className="text-white font-medium">{formatTvl(program.tvl)}</span>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 pt-1">
          {program.bountyUrl ? (
            <a
              href={program.bountyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-1.5 px-3 rounded bg-green-500/10 border border-green-500/25 text-green-400 hover:bg-green-500/20 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="w-3 h-3" />
              View Program
            </a>
          ) : (
            <span className="flex-1 flex items-center justify-center text-xs text-gray-600 py-1.5 px-3 rounded border border-white/5">
              No URL
            </span>
          )}
          <Link href={`/protocol/${program.id}`}>
            <button className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-1.5 px-3 rounded bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-colors">
              Details
            </button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function BugBountiesDirectory() {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('maxBounty');

  const { data: programs = [], isLoading, error } = useQuery<BountyProgram[]>({
    queryKey: ['/api/bug-bounties'],
  });

  // Derived stats
  const totalPool = programs.reduce((sum, p) => sum + p.maxBounty, 0);
  const topPayout = programs.length > 0 ? Math.max(...programs.map(p => p.maxBounty)) : 0;
  const immunefiCount = programs.filter(p => p.platform === 'Immunefi').length;
  const hackeroneCount = programs.filter(p => p.platform === 'HackerOne').length;

  const filtered = programs
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()) ||
                 p.category.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'maxBounty') return b.maxBounty - a.maxBounty || b.tvl - a.tvl;
      if (sortBy === 'tvl') return b.tvl - a.tvl;
      if (sortBy === 'securityScore') return b.securityScore - a.securityScore;
      return 0;
    });

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Bug className="w-7 h-7 text-green-400" />
            <h1 className="text-3xl font-bold tracking-tight">Bug Bounty Programs</h1>
          </div>
          <p className="text-gray-400 text-sm max-w-2xl">
            DeFi protocols with active bug bounty programs. Discover which protocols reward security researchers
            and how much they pay for critical vulnerabilities.
          </p>
        </div>

        {/* Stats header */}
        {!isLoading && programs.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {[
              { label: 'Active Programs', value: programs.length.toString(), icon: Bug, color: 'text-green-400' },
              { label: 'Combined Pool', value: formatBounty(totalPool), icon: DollarSign, color: 'text-yellow-400' },
              { label: 'Top Payout', value: formatBounty(topPayout), icon: TrendingUp, color: 'text-green-400' },
              { label: 'Platforms', value: `${immunefiCount} Immunefi · ${hackeroneCount} HackerOne`, icon: Shield, color: 'text-blue-400' },
            ].map(({ label, value, icon: Icon, color }) => (
              <Card key={label} className="bg-[#0d0d0d] border border-white/8">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={`w-4 h-4 ${color}`} />
                    <span className="text-xs text-gray-500 uppercase tracking-wider">{label}</span>
                  </div>
                  <div className={`text-lg font-bold tabular-nums ${color}`}>{value}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Search + Sort */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              className="pl-9 bg-[#0d0d0d] border-white/10 text-white placeholder:text-gray-600 focus:border-white/25"
              placeholder="Search by protocol name or category…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-gray-500 shrink-0" />
            <div className="flex gap-1">
              {([
                { key: 'maxBounty', label: 'Highest Bounty' },
                { key: 'tvl',       label: 'Highest TVL' },
                { key: 'securityScore', label: 'Best Score' },
              ] as { key: SortKey; label: string }[]).map(({ key, label }) => (
                <Button
                  key={key}
                  size="sm"
                  variant={sortBy === key ? 'default' : 'outline'}
                  className={sortBy === key
                    ? 'bg-white/10 text-white border-white/20 text-xs h-8'
                    : 'bg-transparent text-gray-400 border-white/8 hover:border-white/20 hover:text-white text-xs h-8'}
                  onClick={() => setSortBy(key)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Loading skeleton */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-52 bg-white/5" />
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-red-400 text-center py-12">
            Failed to load bug bounty programs.
          </div>
        )}

        {/* Results */}
        {!isLoading && !error && (
          <>
            {filtered.length === 0 ? (
              <Card className="bg-[#0d0d0d] border border-white/8">
                <CardContent className="py-20 text-center">
                  <Bug className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <div className="text-lg font-semibold text-gray-300 mb-1">
                    {programs.length === 0 ? 'No bug bounty programs found' : `No results for "${search}"`}
                  </div>
                  <p className="text-sm text-gray-500 max-w-sm mx-auto">
                    {programs.length === 0
                      ? 'Bug bounty program data is populated from protocol audit notes. Add bounty info to a protocol to see it here.'
                      : 'Try a different search term or clear your filter.'}
                  </p>
                  {search && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4 border-white/15 text-gray-300 hover:text-white"
                      onClick={() => setSearch('')}
                    >
                      Clear search
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="text-xs text-gray-500 mb-4">
                  {filtered.length} program{filtered.length !== 1 ? 's' : ''} found
                  {search && ` for "${search}"`}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filtered.map(program => (
                    <BountyCard key={program.id} program={program} />
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* Score legend */}
        {!isLoading && filtered.length > 0 && (
          <div className="mt-10 p-4 bg-[#0d0d0d] border border-white/8 rounded-lg">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">DFJ Score Legend</div>
            <div className="flex flex-wrap gap-4 text-xs">
              {([
                ['SAFE',     '≥80', 'text-green-400'],
                ['LOW RISK', '65–79', 'text-blue-400'],
                ['MEDIUM',   '50–64', 'text-yellow-400'],
                ['HIGH RISK','30–49', 'text-orange-400'],
                ['CRITICAL', '<30',  'text-red-400'],
              ] as [string, string, string][]).map(([label, range, color]) => (
                <div key={label} className="flex items-center gap-1.5">
                  <span className={`font-bold ${color}`}>{label}</span>
                  <span className="text-gray-600">{range}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
