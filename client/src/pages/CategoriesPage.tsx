import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Shield, TrendingUp, DollarSign, BarChart3, Building2, ArrowRight, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import LoadingSpinner from '@/components/LoadingSpinner';

interface CategoryStat {
  category: string;
  count: number;
  avgScore: number;
  totalTvl: number;
  auditedCount: number;
  topProtocols: { id: string; name: string; score: number }[];
}

function scoreColor(score: number): string {
  if (score >= 80) return 'text-green-400';
  if (score >= 65) return 'text-blue-400';
  if (score >= 50) return 'text-yellow-400';
  if (score >= 30) return 'text-orange-400';
  return 'text-red-400';
}

function scoreBg(score: number): string {
  if (score >= 80) return 'bg-green-500/10 border-green-500/20';
  if (score >= 65) return 'bg-blue-500/10 border-blue-500/20';
  if (score >= 50) return 'bg-yellow-500/10 border-yellow-500/20';
  if (score >= 30) return 'bg-orange-500/10 border-orange-500/20';
  return 'bg-red-500/10 border-red-500/20';
}

function severityLabel(score: number): string {
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
  return `$${(tvl / 1e3).toFixed(0)}K`;
}

// Category descriptions + model label
const CATEGORY_META: Record<string, { desc: string; icon: string; scoringModel?: string }> = {
  'CEX':                    { desc: 'Centralized exchanges — custody risk, PoR, licensing', icon: '🏦', scoringModel: 'DFJ-CEX v1.0' },
  'Centralized Exchange':   { desc: 'Centralized exchanges — custody risk, PoR, licensing', icon: '🏦', scoringModel: 'DFJ-CEX v1.0' },
  'CeFi':                   { desc: 'Centralized finance services — lending, yield, custody', icon: '🏦', scoringModel: 'DFJ-CEX v1.0' },
  'DEX':                    { desc: 'Decentralized exchanges — non-custodial token swaps', icon: '⚡' },
  'Lending':                { desc: 'Borrow and lend crypto assets on-chain', icon: '💸' },
  'Liquid Staking':         { desc: 'Stake assets and receive liquid receipt tokens', icon: '💧' },
  'Bridge':                 { desc: 'Cross-chain asset transfers and messaging', icon: '🌉' },
  'Yield':                  { desc: 'Automated yield strategies and vaults', icon: '📈' },
  'CDP':                    { desc: 'Collateralized debt positions and stablecoin issuance', icon: '🏛️' },
  'RWA':                    { desc: 'Real-world asset tokenization and on-chain representation', icon: '🏢' },
  'Derivatives':            { desc: 'Options, futures, and perpetual contracts on-chain', icon: '📊' },
  'Farm':                   { desc: 'Liquidity mining and yield farming strategies', icon: '🌾' },
  'Options':                { desc: 'On-chain options protocols', icon: '📉' },
  'Algo Stables':           { desc: 'Algorithmic stablecoin mechanisms', icon: '⚖️' },
  'Gaming':                 { desc: 'Blockchain gaming and GameFi protocols', icon: '🎮' },
  'Launchpad':              { desc: 'Token launch and IDO platforms', icon: '🚀' },
  'Prediction Market':      { desc: 'Decentralized prediction and betting markets', icon: '🎯' },
  'SoFi':                   { desc: 'Social and community finance platforms', icon: '🤝' },
  'NFT':                    { desc: 'NFT marketplaces and infrastructure', icon: '🖼️' },
  'Insurance':              { desc: 'DeFi insurance and risk coverage protocols', icon: '🛡️' },
  'Liquid Restaking':       { desc: 'Restaked ETH and liquid restaking tokens', icon: '🔄' },
  'Onchain Capital Allocator': { desc: 'On-chain portfolio and capital management', icon: '💼' },
  'Liquidity Manager':      { desc: 'Active liquidity management for AMMs', icon: '🔧' },
  'Reserve Currency':       { desc: 'Protocol-owned liquidity and reserve currencies', icon: '💎' },
  'Risk Curators':          { desc: 'Risk parameter management for lending protocols', icon: '🔍' },
};

function CategoryCard({ stat }: { stat: CategoryStat }) {
  const meta = CATEGORY_META[stat.category];
  const auditRate = stat.count > 0 ? Math.round((stat.auditedCount / stat.count) * 100) : 0;

  return (
    <Link href={`/?category=${encodeURIComponent(stat.category)}`}>
      <Card className={`cursor-pointer hover:scale-[1.01] transition-transform border ${scoreBg(stat.avgScore)} bg-gray-900`}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-2xl shrink-0">{meta?.icon ?? '🔷'}</span>
              <div className="min-w-0">
                <CardTitle className="text-white text-base leading-tight truncate">{stat.category}</CardTitle>
                {meta?.scoringModel && (
                  <span className="text-xs text-blue-400 font-mono">{meta.scoringModel}</span>
                )}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className={`text-2xl font-bold tabular-nums ${scoreColor(stat.avgScore)}`}>
                {stat.avgScore}
              </div>
              <div className={`text-xs font-semibold ${scoreColor(stat.avgScore)}`}>
                {severityLabel(stat.avgScore)}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          {meta?.desc && (
            <p className="text-gray-400 text-xs leading-snug">{meta.desc}</p>
          )}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <div className="text-center">
              <div className="text-white font-semibold text-sm">{stat.count}</div>
              <div className="text-gray-500 text-xs">protocols</div>
            </div>
            <div className="text-center">
              <div className="text-white font-semibold text-sm">{formatTvl(stat.totalTvl)}</div>
              <div className="text-gray-500 text-xs">TVL</div>
            </div>
            <div className="text-center">
              <div className={`font-semibold text-sm ${auditRate >= 50 ? 'text-green-400' : auditRate >= 20 ? 'text-yellow-400' : 'text-red-400'}`}>
                {auditRate}%
              </div>
              <div className="text-gray-500 text-xs">audited</div>
            </div>
          </div>
          {stat.topProtocols.length > 0 && (
            <div className="pt-1 border-t border-white/5">
              <div className="text-gray-500 text-xs mb-1">Top by score</div>
              <div className="flex flex-wrap gap-1">
                {stat.topProtocols.slice(0, 3).map(p => (
                  <span key={p.id} className="text-xs bg-white/5 text-gray-300 rounded px-1.5 py-0.5">
                    {p.name}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className="flex items-center justify-end text-gray-500 text-xs pt-1">
            View all <ArrowRight className="w-3 h-3 ml-1" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function CategoriesPage() {
  const { data: categories, isLoading, error } = useQuery<CategoryStat[]>({
    queryKey: ['/api/categories'],
  });

  const cexCategories = categories?.filter(c =>
    ['CEX', 'Centralized Exchange', 'CeFi'].includes(c.category)
  ) ?? [];

  const defiCategories = categories?.filter(c =>
    !['CEX', 'Centralized Exchange', 'CeFi'].includes(c.category)
  ).sort((a, b) => b.totalTvl - a.totalTvl) ?? [];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="w-7 h-7 text-blue-400" />
            <h1 className="text-3xl font-bold">Protocol Categories</h1>
          </div>
          <p className="text-gray-400">
            Browse all protocol categories. Each category uses the appropriate DFJ scoring model —
            CEXs are scored on custody, reserves, and regulatory compliance rather than smart-contract security.
          </p>
        </div>

        {isLoading && (
          <div className="flex justify-center py-20">
            <LoadingSpinner />
          </div>
        )}

        {error && (
          <div className="text-red-400 text-center py-12">Failed to load categories.</div>
        )}

        {categories && (
          <>
            {/* CEX section */}
            {cexCategories.length > 0 && (
              <section className="mb-10">
                <div className="flex items-center gap-2 mb-4">
                  <Building2 className="w-5 h-5 text-blue-400" />
                  <h2 className="text-xl font-semibold">Centralized Exchanges</h2>
                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs ml-1">DFJ-CEX v1.0</Badge>
                </div>
                <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3 mb-4 text-sm text-blue-300">
                  <strong>CEX scoring uses a separate model</strong> — proof of reserves, cold storage, licensed jurisdictions,
                  insurance funds, and withdrawal history replace DeFi-specific criteria like smart-contract audits and timelocks.
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cexCategories.map(c => <CategoryCard key={c.category} stat={c} />)}
                </div>
              </section>
            )}

            {/* DeFi section */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-purple-400" />
                <h2 className="text-xl font-semibold">DeFi Protocols</h2>
                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs ml-1">DFJ v2.3</Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {defiCategories.map(c => <CategoryCard key={c.category} stat={c} />)}
              </div>
            </section>

            {/* Score legend */}
            <div className="mt-10 p-4 bg-gray-900 border border-white/10 rounded-lg">
              <div className="text-sm font-semibold text-gray-400 mb-3">Score legend (avg score shown per category)</div>
              <div className="flex flex-wrap gap-4 text-sm">
                {[['SAFE', '≥80', 'text-green-400'], ['LOW', '65–79', 'text-blue-400'], ['MEDIUM', '50–64', 'text-yellow-400'], ['HIGH', '30–49', 'text-orange-400'], ['CRITICAL', '<30', 'text-red-400']].map(([label, range, color]) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <span className={`font-bold ${color}`}>{label}</span>
                    <span className="text-gray-500">{range}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
