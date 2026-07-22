import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Bug, ExternalLink, Search, Shield, DollarSign, ArrowUpDown, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

interface BountyProgram {
  id: string;
  name: string;
  slug: string;
  logo: string;
  category: string;
  tvl: number;
  securityScore: number;
  maxBounty: number;
  bountyUrl: string;
  platform: 'Immunefi' | 'HackerOne' | 'Other';
  hasDbRecord: boolean;
}

type SortKey = 'maxBounty' | 'tvl' | 'securityScore';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBounty(amount: number): string {
  if (amount >= 1e6)  return `$${(amount / 1e6).toFixed(1)}M`;
  if (amount >= 1e3)  return `$${(amount / 1e3).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

function formatTvl(tvl: number): string {
  if (!tvl) return null as unknown as string;
  if (tvl >= 1e9)  return `$${(tvl / 1e9).toFixed(1)}B`;
  if (tvl >= 1e6)  return `$${(tvl / 1e6).toFixed(0)}M`;
  if (tvl >= 1e3)  return `$${(tvl / 1e3).toFixed(0)}K`;
  return `$${tvl}`;
}

function scoreMeta(score: number) {
  if (score >= 80) return { label: 'SAFE',     border: 'border-green-500/40',  text: 'text-green-400'  };
  if (score >= 65) return { label: 'LOW',      border: 'border-blue-500/40',   text: 'text-blue-400'   };
  if (score >= 50) return { label: 'MEDIUM',   border: 'border-yellow-400/40', text: 'text-yellow-400' };
  if (score >= 30) return { label: 'HIGH',     border: 'border-orange-400/40', text: 'text-orange-400' };
  return               { label: 'CRITICAL', border: 'border-red-500/40',    text: 'text-red-400'    };
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function BountyCard({ program }: { program: BountyProgram }) {
  const sm = program.securityScore > 0 ? scoreMeta(program.securityScore) : null;
  const tvlStr = formatTvl(program.tvl);

  return (
    <div className="border border-[#1a1a1a] bg-[#080808] hover:border-[#2a2a2a] hover:bg-[#0c0c0c] transition-colors flex flex-col">
      {/* Top strip — max bounty */}
      <div className="border-b border-[#1a1a1a] px-4 py-2.5 flex items-center justify-between gap-2">
        <span className="text-xl font-black tabular-nums text-[#E8C15A]">
          {formatBounty(program.maxBounty)}
        </span>
        <span className="text-[9px] font-black tracking-[0.2em] uppercase text-white/25">MAX PAYOUT</span>
      </div>

      {/* Body */}
      <div className="flex-1 px-4 py-3 space-y-3">
        {/* Logo + name + category */}
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 shrink-0 border border-[#1e1e1e] flex items-center justify-center overflow-hidden bg-white/3">
            <img
              src={program.logo}
              alt={program.name}
              className="w-7 h-7 object-contain"
              onError={(e) => {
                const el = e.currentTarget;
                el.style.display = 'none';
                el.parentElement!.innerHTML =
                  `<span class="text-[10px] font-black text-white/20">${program.name.slice(0, 2).toUpperCase()}</span>`;
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white/85 leading-tight">{program.name}</p>
            <p className="text-[10px] text-white/30 tracking-wide mt-0.5">{program.category}</p>
          </div>
          {/* DFJ score */}
          {sm && program.securityScore > 0 && (
            <div className={`shrink-0 border px-1.5 py-0.5 text-center ${sm.border} ${sm.text}`}>
              <div className="text-[11px] font-black tabular-nums leading-none">{Math.round(program.securityScore)}</div>
              <div className="text-[8px] tracking-widest mt-0.5">{sm.label}</div>
            </div>
          )}
        </div>

        {/* TVL row (only when available) */}
        {tvlStr && (
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-3 h-3 text-white/20 shrink-0" />
            <span className="text-[10px] text-white/30">TVL</span>
            <span className="text-[10px] font-bold text-white/55 tabular-nums">{tvlStr}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="border-t border-[#1a1a1a] grid grid-cols-2 divide-x divide-[#1a1a1a]">
        <a
          href={program.bountyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-black tracking-[0.12em] uppercase text-[#E8C15A]/70 hover:text-[#E8C15A] hover:bg-[#E8C15A]/5 transition-colors"
        >
          <ExternalLink className="w-3 h-3 shrink-0" />
          Immunefi
        </a>
        {program.hasDbRecord ? (
          <Link href={`/protocol/${program.id}`}>
            <div className="flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-black tracking-[0.12em] uppercase text-white/30 hover:text-white/65 hover:bg-white/3 transition-colors cursor-pointer">
              <Shield className="w-3 h-3 shrink-0" />
              Security
            </div>
          </Link>
        ) : (
          <div className="flex items-center justify-center py-2.5 text-[10px] text-white/15">
            —
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BugBountiesDirectory() {
  const [search, setSearch]   = useState('');
  const [sortBy, setSortBy]   = useState<SortKey>('maxBounty');

  const { data: programs = [], isLoading, error } = useQuery<BountyProgram[]>({
    queryKey: ['/api/bug-bounties'],
  });

  const totalPool  = programs.reduce((s, p) => s + p.maxBounty, 0);
  const topPayout  = programs.length ? Math.max(...programs.map(p => p.maxBounty)) : 0;

  const filtered = programs
    .filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'maxBounty')    return b.maxBounty    - a.maxBounty    || b.tvl - a.tvl;
      if (sortBy === 'tvl')          return b.tvl          - a.tvl;
      if (sortBy === 'securityScore')return b.securityScore - a.securityScore;
      return 0;
    });

  return (
    <div className="min-h-screen bg-[#060606] text-white">

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="border-b border-[#1a1a1a] px-5 sm:px-8 py-8">
        <p className="text-[10px] font-black tracking-[0.25em] uppercase text-white/30 mb-3">
          /// Contribute &amp; Earn
        </p>
        <h1 className="font-display font-black text-3xl sm:text-4xl uppercase tracking-tight text-white leading-none mb-2">
          Bug Bounty Programs
        </h1>
        <p className="text-sm text-white/35 max-w-xl">
          Active DeFi bug bounty programs on Immunefi. Click any program to submit a report directly on their platform.
        </p>
      </div>

      {/* ── Stats bar ───────────────────────────────────────────────────────── */}
      {!isLoading && programs.length > 0 && (
        <div className="grid grid-cols-3 divide-x divide-[#1a1a1a] border-b border-[#1a1a1a]">
          {[
            { label: 'Active Programs', value: programs.length.toString(), icon: Bug },
            { label: 'Combined Pool',   value: formatBounty(totalPool),    icon: DollarSign },
            { label: 'Highest Payout',  value: formatBounty(topPayout),    icon: TrendingUp },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="px-5 sm:px-8 py-5">
              <div className="flex items-center gap-2 mb-1.5">
                <Icon className="w-3.5 h-3.5 text-[#E8C15A]/60 shrink-0" />
                <span className="text-[9px] font-black tracking-[0.2em] uppercase text-white/25">{label}</span>
              </div>
              <div className="text-lg font-black tabular-nums text-white/80">{value}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Search + Sort ────────────────────────────────────────────────────── */}
      <div className="px-5 sm:px-8 py-5 border-b border-[#1a1a1a] flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25 pointer-events-none" />
          <Input
            className="pl-9 bg-[#0a0a0a] border-[#1a1a1a] text-white placeholder:text-white/20 text-sm focus:border-[#E8C15A]/40 h-9"
            placeholder="Search protocols or categories…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-1">
          <ArrowUpDown className="w-3.5 h-3.5 text-white/25 mr-1 shrink-0" />
          {([
            { key: 'maxBounty',    label: 'Highest Bounty' },
            { key: 'tvl',          label: 'Highest TVL'    },
            { key: 'securityScore',label: 'Best Score'     },
          ] as { key: SortKey; label: string }[]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              className={[
                'px-3 py-1.5 text-[10px] font-black tracking-[0.12em] uppercase transition-colors',
                sortBy === key
                  ? 'bg-[#E8C15A]/10 border border-[#E8C15A]/40 text-[#E8C15A]'
                  : 'border border-[#1a1a1a] text-white/30 hover:text-white/60 hover:border-white/15',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────────────── */}
      <div className="px-5 sm:px-8 py-6">

        {/* Loading */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-44 bg-white/3" />
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-red-400 text-sm text-center py-20">Failed to load bug bounty programs.</p>
        )}

        {/* Results */}
        {!isLoading && !error && (
          <>
            <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-white/25 mb-4">
              {filtered.length} program{filtered.length !== 1 ? 's' : ''}
              {search ? ` matching "${search}"` : ' found'}
            </p>

            {filtered.length === 0 ? (
              <div className="border border-[#1a1a1a] bg-[#080808] py-20 text-center">
                <Bug className="w-8 h-8 text-white/10 mx-auto mb-3" />
                <p className="text-sm text-white/30">No results for &ldquo;{search}&rdquo;</p>
                <button
                  onClick={() => setSearch('')}
                  className="mt-4 text-[10px] font-black tracking-widest uppercase text-[#E8C15A]/60 hover:text-[#E8C15A] transition-colors"
                >
                  Clear search
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {filtered.map(p => <BountyCard key={p.slug} program={p} />)}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Disclaimer ───────────────────────────────────────────────────────── */}
      <div className="px-5 sm:px-8 pb-10">
        <div className="border border-[#1a1a1a] bg-[#080808] px-5 py-4 flex items-start gap-3">
          <Shield className="w-3.5 h-3.5 text-white/20 shrink-0 mt-0.5" />
          <p className="text-[10px] text-white/25 leading-relaxed">
            <strong className="text-white/40">Read-only directory.</strong>{' '}
            DeFiJerusalem does not manage these programs or accept vulnerability reports.
            All submissions go directly to the protocol via{' '}
            <a href="https://immunefi.com" target="_blank" rel="noopener noreferrer"
               className="text-[#E8C15A]/60 hover:text-[#E8C15A] transition-colors font-semibold">
              Immunefi
            </a>.
            Bounty amounts and program availability may change — always verify on Immunefi before submitting.
          </p>
        </div>
      </div>
    </div>
  );
}
