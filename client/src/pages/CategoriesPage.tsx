import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import {
  Shield, TrendingUp, DollarSign, BarChart3, ArrowRight,
  Zap, Building2, Activity,
} from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

interface CategoryStat {
  category: string;
  count: number;
  avgScore: number;
  totalTvl: number;
  auditedCount: number;
  topProtocols: { id: string; name: string; score: number }[];
}

function scoreStyle(score: number) {
  if (score >= 80) return { text: 'text-green-400',  border: 'border-green-500/30',  label: 'SAFE',     bar: 'bg-green-500'  };
  if (score >= 65) return { text: 'text-blue-400',   border: 'border-blue-500/30',   label: 'LOW',      bar: 'bg-blue-500'   };
  if (score >= 50) return { text: 'text-yellow-400', border: 'border-yellow-500/30', label: 'MEDIUM',   bar: 'bg-yellow-500' };
  if (score >= 30) return { text: 'text-orange-400', border: 'border-orange-500/30', label: 'HIGH',     bar: 'bg-orange-500' };
  return               { text: 'text-red-400',    border: 'border-red-500/30',    label: 'CRITICAL', bar: 'bg-red-500'    };
}

function formatTvl(tvl: number): string {
  if (tvl >= 1e12) return `$${(tvl / 1e12).toFixed(1)}T`;
  if (tvl >= 1e9)  return `$${(tvl / 1e9).toFixed(1)}B`;
  if (tvl >= 1e6)  return `$${(tvl / 1e6).toFixed(0)}M`;
  return `$${(tvl / 1e3).toFixed(0)}K`;
}

// Category identity: icon, accent colour, description
const CAT_META: Record<string, {
  icon: string;
  accent: string;    // Tailwind left-border colour
  desc: string;
  flavour: string;   // One-liner flavour text for the card
  model?: string;
}> = {
  'DEX':               { icon: '⚡', accent: 'border-cyan-500',    desc: 'Non-custodial token swaps', flavour: 'AMMs, order books, and concentrated liquidity pools' },
  'Lending':           { icon: '💸', accent: 'border-emerald-500', desc: 'Borrow & supply markets',   flavour: 'Over-collateralized loans and interest rate protocols' },
  'Bridge':            { icon: '🌉', accent: 'border-orange-500',  desc: 'Cross-chain transfers',     flavour: 'Lock-and-mint, native swaps, and messaging layers' },
  'Yield':             { icon: '📈', accent: 'border-purple-500',  desc: 'Automated yield vaults',    flavour: 'Compounders, optimisers, and strategy vaults' },
  'Derivatives':       { icon: '📊', accent: 'border-red-500',     desc: 'Perps, options, synthetics',flavour: 'On-chain perpetuals, futures, and structured products' },
  'Liquid Staking':    { icon: '💧', accent: 'border-sky-500',     desc: 'Liquid stake tokens',       flavour: 'Stake ETH/SOL/BNB and keep liquidity via receipt tokens' },
  'CDP':               { icon: '🏛️', accent: 'border-amber-500',   desc: 'Collateralized debt',       flavour: 'Mint stablecoins against on-chain collateral' },
  'NFT':               { icon: '🖼️', accent: 'border-pink-500',    desc: 'NFT markets & lending',     flavour: 'Marketplaces, NFT-fi, and collection infrastructure' },
  'Gaming':            { icon: '🎮', accent: 'border-green-500',   desc: 'GameFi protocols',          flavour: 'Play-to-earn, on-chain gaming assets, and metaverse' },
  'RWA':               { icon: '🏢', accent: 'border-stone-400',   desc: 'Real-world assets on-chain',flavour: 'Tokenized treasuries, real estate, and credit instruments' },
  'DAO':               { icon: '🗳️', accent: 'border-yellow-500',  desc: 'On-chain governance',       flavour: 'Token-weighted voting, timelocks, and treasury management' },
  'Stablecoin':        { icon: '⚖️', accent: 'border-teal-500',    desc: 'Stable value mechanisms',   flavour: 'Algorithmic, asset-backed, and hybrid stablecoin designs' },
  'Insurance':         { icon: '🛡️', accent: 'border-indigo-500',  desc: 'DeFi risk coverage',        flavour: 'Smart-contract cover, protocol exploit insurance' },
  'Options':           { icon: '📉', accent: 'border-rose-500',    desc: 'On-chain options',           flavour: 'European/American options, structured vaults' },
  'Launchpad':         { icon: '🚀', accent: 'border-yellow-400',  desc: 'Token launch platforms',    flavour: 'IDOs, fair launches, and vesting infrastructure' },
  'Liquid Restaking':  { icon: '🔄', accent: 'border-blue-500',    desc: 'Restaking protocols',        flavour: 'EigenLayer-style AVS restaking and LRT tokens' },
  'Reserve Currency':  { icon: '💎', accent: 'border-violet-500',  desc: 'Protocol-owned liquidity',  flavour: 'Bond mechanisms and reserve-backed currencies' },
  'Liquidity Manager': { icon: '🔧', accent: 'border-fuchsia-500', desc: 'Active liquidity management',flavour: 'Automated range rebalancing for concentrated AMMs' },
  'Farm':              { icon: '🌾', accent: 'border-lime-500',    desc: 'Liquidity mining & farms',  flavour: 'Yield farming incentives and LP reward programs' },
  'Algo Stables':      { icon: '⚙️', accent: 'border-orange-400',  desc: 'Algorithmic stablecoins',   flavour: 'Seigniorage-based and rebase mechanisms' },
  'CEX':               { icon: '🏦', accent: 'border-blue-400',    desc: 'Centralized exchanges',     flavour: 'Custody, proof-of-reserves, and regulatory compliance', model: 'DFJ-CEX v1.0' },
  'CeFi':              { icon: '🏦', accent: 'border-blue-400',    desc: 'Centralized finance',       flavour: 'CeFi lending, yield, and custody services',             model: 'DFJ-CEX v1.0' },
};

function CategoryCard({ stat }: { stat: CategoryStat }) {
  const meta  = CAT_META[stat.category] ?? { icon: '🔷', accent: 'border-white/20', desc: stat.category, flavour: `${stat.count} protocols tracked` };
  const ss    = scoreStyle(stat.avgScore);
  const auditPct = stat.count > 0 ? Math.round((stat.auditedCount / stat.count) * 100) : 0;
  const barW  = Math.min(100, stat.avgScore);

  return (
    <Link href={`/home?category=${encodeURIComponent(stat.category)}`}>
      <div className={`group cursor-pointer border-l-2 ${meta.accent} border-t border-r border-b border-[#1a1a1a] bg-[#080808] hover:bg-[#0c0c0c] transition-colors flex flex-col`}>
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-[#1a1a1a] flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-xl shrink-0">{meta.icon}</span>
            <div className="min-w-0">
              <div className="text-[11px] font-black tracking-[0.15em] uppercase text-white/80 group-hover:text-white truncate">
                {stat.category}
              </div>
              {meta.model && (
                <div className="text-[9px] font-mono text-blue-400/70 mt-0.5">{meta.model}</div>
              )}
            </div>
          </div>
          {/* Score badge */}
          <div className={`shrink-0 border ${ss.border} px-2 py-0.5 text-right`}>
            <div className={`text-base font-black tabular-nums leading-none ${ss.text}`}>{stat.avgScore}</div>
            <div className={`text-[8px] font-black tracking-widest ${ss.text}`}>{ss.label}</div>
          </div>
        </div>

        {/* Body */}
        <div className="px-4 py-3 flex-1 flex flex-col gap-3">
          <p className="text-[10px] text-white/30 leading-snug">{meta.flavour}</p>

          {/* Score bar */}
          <div className="space-y-1">
            <div className="h-0.5 bg-[#1a1a1a] w-full">
              <div className={`h-full ${ss.bar} opacity-60 transition-all`} style={{ width: `${barW}%` }} />
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-1 text-center">
            <div>
              <div className="text-xs font-black tabular-nums text-white/60">{stat.count}</div>
              <div className="text-[9px] text-white/25 uppercase tracking-wider">protocols</div>
            </div>
            <div>
              <div className="text-xs font-black tabular-nums text-white/60">{formatTvl(stat.totalTvl)}</div>
              <div className="text-[9px] text-white/25 uppercase tracking-wider">TVL</div>
            </div>
            <div>
              <div className={`text-xs font-black tabular-nums ${auditPct >= 50 ? 'text-green-400' : auditPct >= 20 ? 'text-yellow-400' : 'text-red-400'}`}>
                {auditPct}%
              </div>
              <div className="text-[9px] text-white/25 uppercase tracking-wider">audited</div>
            </div>
          </div>

          {/* Top protocols */}
          {stat.topProtocols.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {stat.topProtocols.slice(0, 3).map(p => (
                <span key={p.id} className="text-[9px] border border-[#1e1e1e] text-white/35 px-1.5 py-0.5 font-medium">
                  {p.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[#1a1a1a] px-4 py-2 flex items-center justify-end">
          <span className="flex items-center gap-1 text-[9px] font-black tracking-[0.15em] uppercase text-white/20 group-hover:text-[#E8C15A]/60 transition-colors">
            Explore <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function CategoriesPage() {
  const { data: categories, isLoading, error } = useQuery<CategoryStat[]>({
    queryKey: ['/api/categories'],
  });

  const cexCats  = categories?.filter(c => ['CEX','Centralized Exchange','CeFi'].includes(c.category)) ?? [];
  const defiCats = categories?.filter(c => !['CEX','Centralized Exchange','CeFi'].includes(c.category))
                              .sort((a, b) => b.totalTvl - a.totalTvl) ?? [];

  const totalTvl   = defiCats.reduce((s, c) => s + c.totalTvl, 0);
  const totalProto = defiCats.reduce((s, c) => s + c.count, 0);

  return (
    <div className="min-h-screen bg-[#060606] text-white">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="border-b border-[#1a1a1a] px-5 sm:px-8 py-8">
        <p className="text-[10px] font-black tracking-[0.25em] uppercase text-white/30 mb-3">
          /// Browse by Sector
        </p>
        <h1 className="font-display font-black text-3xl sm:text-4xl uppercase tracking-tight text-white leading-none mb-2">
          Protocol Categories
        </h1>
        <p className="text-sm text-white/35 max-w-xl">
          Each category uses the appropriate DFJ scoring model. CEXs are scored on custody, reserves, and regulatory compliance — not smart-contract audits.
        </p>
      </div>

      {/* ── Stats bar ───────────────────────────────────────────────────── */}
      {!isLoading && defiCats.length > 0 && (
        <div className="grid grid-cols-3 divide-x divide-[#1a1a1a] border-b border-[#1a1a1a]">
          {[
            { label: 'DeFi Categories',  value: defiCats.length.toString(),     icon: BarChart3  },
            { label: 'Total Protocols',  value: `${totalProto.toLocaleString()}+`, icon: Activity  },
            { label: 'Combined TVL',     value: formatTvl(totalTvl),            icon: DollarSign },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="px-5 sm:px-8 py-5">
              <div className="flex items-center gap-2 mb-1.5">
                <Icon className="w-3.5 h-3.5 text-[#E8C15A]/50 shrink-0" />
                <span className="text-[9px] font-black tracking-[0.2em] uppercase text-white/25">{label}</span>
              </div>
              <div className="text-lg font-black tabular-nums text-white/80">{value}</div>
            </div>
          ))}
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center py-24"><LoadingSpinner /></div>
      )}

      {error && (
        <div className="text-red-400 text-center py-12 text-sm">Failed to load categories.</div>
      )}

      {categories && (
        <div className="px-5 sm:px-8 py-8 space-y-10">

          {/* CEX section */}
          {cexCats.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Building2 className="w-4 h-4 text-blue-400 shrink-0" />
                <h2 className="text-[10px] font-black tracking-[0.2em] uppercase text-white/50">Centralized Exchanges</h2>
                <div className="flex-1 h-px bg-[#1a1a1a]" />
                <span className="text-[9px] font-mono text-blue-400/60 border border-blue-500/20 px-2 py-0.5">DFJ-CEX v1.0</span>
              </div>
              <div className="border border-[#1a1a1a] bg-[#080808] px-4 py-3 mb-5 text-[10px] text-blue-300/60">
                CEX scoring: proof of reserves · cold storage ratio · licensed jurisdictions · insurance fund · withdrawal history
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {cexCats.map(c => <CategoryCard key={c.category} stat={c} />)}
              </div>
            </section>
          )}

          {/* DeFi section */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-4 h-4 text-[#E8C15A]/60 shrink-0" />
              <h2 className="text-[10px] font-black tracking-[0.2em] uppercase text-white/50">DeFi Protocols</h2>
              <div className="flex-1 h-px bg-[#1a1a1a]" />
              <span className="text-[9px] font-mono text-[#E8C15A]/60 border border-[#E8C15A]/20 px-2 py-0.5">DFJ v2.3</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {defiCats.map(c => <CategoryCard key={c.category} stat={c} />)}
            </div>
          </section>

          {/* Score legend */}
          <div className="border border-[#1a1a1a] px-5 py-4 flex flex-wrap gap-5">
            <span className="text-[9px] font-black tracking-[0.15em] uppercase text-white/25 self-center">Score scale:</span>
            {[['≥80', 'SAFE', 'text-green-400'], ['65–79', 'LOW', 'text-blue-400'], ['50–64', 'MEDIUM', 'text-yellow-400'], ['30–49', 'HIGH', 'text-orange-400'], ['<30', 'CRITICAL', 'text-red-400']].map(([range, label, color]) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className={`text-[10px] font-black ${color}`}>{label}</span>
                <span className="text-[10px] text-white/25">{range}</span>
              </div>
            ))}
          </div>

        </div>
      )}
    </div>
  );
}
