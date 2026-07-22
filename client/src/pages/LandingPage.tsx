import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import {
  Shield, Database, TrendingUp, AlertCircle, DollarSign,
  Activity, ArrowRight, Bug, BookOpen, Zap, Lock, ChevronRight,
} from 'lucide-react';
import { LatestThreatsWidget } from '@/components/LatestThreatsWidget';
import TrendingTicker from '@/components/TrendingTicker';
import AdSpace from '@/components/AdSpace';

interface StatsData {
  total: number;
  auditedCount: number;
  totalTVL: number;
}

function fmtCurrency(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6)  return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toLocaleString()}`;
}

const FEATURES = [
  {
    icon: Shield,
    title: 'Security Intelligence',
    desc: 'Every protocol scored 0–97 using audit coverage, incident history, bug bounty programs, and governance signals. No guessing — just data.',
    link: '/security-methodology',
    cta: 'Our Methodology',
  },
  {
    icon: AlertCircle,
    title: 'Threat Intelligence',
    desc: 'Real-time exploit tracking across 126+ chains. Every rug pull, flash loan attack, and oracle manipulation — catalogued and cross-referenced.',
    link: '/threats',
    cta: 'Live Threats',
  },
  {
    icon: Bug,
    title: 'Bug Bounty Directory',
    desc: "$124M+ in active Immunefi bounty programs. Find where to submit vulnerabilities and earn — directly from the protocol's page.",
    link: '/bug-bounties',
    cta: 'Browse Programs',
  },
  {
    icon: Lock,
    title: 'Blacklist Registry',
    desc: 'Known drainers, phishing contracts, and high-risk addresses publicly documented. Cross-reference before you interact.',
    link: '/blacklist',
    cta: 'View Registry',
  },
  {
    icon: BookOpen,
    title: 'Threat Encyclopedia',
    desc: 'Reentrancy, price manipulation, flash loans, rug mechanics — every attack vector explained with historical examples.',
    link: '/threats/encyclopedia',
    cta: 'Learn More',
  },
  {
    icon: Zap,
    title: 'Ask Dada',
    desc: '"Is this protocol safe?" Ask our AI security analyst anything — it queries live audit data, TVL, and incident history in real time.',
    link: '/chat',
    cta: 'Start Chat',
  },
];

export default function LandingPage() {
  const { data } = useQuery<StatsData>({
    queryKey: ['/api/protocols'],
    select: (d: any) => ({
      total:       d.total        ?? 0,
      auditedCount:d.auditedCount ?? 0,
      totalTVL:    d.totalTVL     ?? 0,
    }),
  });

  const stats = [
    { label: 'Protocols Tracked', value: data?.total ? `${data.total.toLocaleString()}+` : '7,800+', icon: Database },
    { label: 'Total TVL Monitored', value: data?.totalTVL ? fmtCurrency(data.totalTVL) : '$—',     icon: DollarSign },
    { label: 'Chains Covered',      value: '126+',                                                  icon: TrendingUp },
    { label: 'Audited Protocols',   value: data?.auditedCount ? data.auditedCount.toLocaleString() : '—', icon: Shield },
  ];

  return (
    <div className="bg-[#060606] min-h-screen">
      <AdSpace position="top" />
      <TrendingTicker />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative bg-[#060606] border-b border-[#1a1a1a] overflow-hidden">
        <div className="absolute inset-0 grid-bg" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#E8C15A]/[0.04] via-transparent to-transparent" />

        <div className="relative max-w-screen-xl mx-auto px-5 sm:px-8 py-16 sm:py-24">
          <p className="text-[10px] sm:text-[11px] font-black tracking-[0.35em] text-[#E8C15A] mb-6 uppercase">
            /// The Watchtower of Web3
          </p>

          <h1 className="font-display font-black uppercase leading-[0.88] tracking-tight text-white mb-10">
            <span className="block text-[clamp(3.5rem,11vw,9rem)]">Every</span>
            <span className="block text-[clamp(3.5rem,11vw,9rem)]">Exploit.</span>
            <span className="block text-[clamp(3.5rem,11vw,9rem)]">Every</span>
            <span className="block text-[clamp(3.5rem,11vw,9rem)]">Audit.</span>
            <span className="block text-[clamp(3.5rem,11vw,9rem)] text-[#E8C15A]">One Ledger.</span>
          </h1>

          <div className="flex flex-col sm:flex-row sm:items-end gap-6 sm:gap-10 max-w-2xl">
            <p className="text-sm text-white/45 leading-relaxed">
              Aggregated security intelligence for DeFi.{' '}
              <span className="text-white/70">Real-time threat detection</span>,{' '}
              <span className="text-white/70">audit coverage</span>, and{' '}
              <span className="text-white/70">exploit history</span> across 126+ blockchains — all in one place.
            </p>
            <div className="flex gap-3 shrink-0">
              <Link href="/home">
                <button className="flex items-center gap-2 bg-[#E8C15A] hover:bg-[#f0cc6a] text-[#060606] text-[11px] font-black tracking-[0.18em] uppercase px-6 py-3 transition-colors shadow-[0_0_20px_rgba(232,193,90,0.2)]">
                  Explore Protocols
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </Link>
              <Link href="/threats">
                <button className="border border-white/15 text-white/55 text-[11px] font-bold tracking-[0.18em] uppercase px-5 py-3 hover:border-white/30 hover:text-white/80 transition-colors">
                  Threat Intel
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ────────────────────────────────────────────────────── */}
      <section className="border-b border-[#1a1a1a]">
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-[#1a1a1a]">
          {stats.map(({ label, value, icon: Icon }) => (
            <div key={label} className="px-6 sm:px-10 py-6">
              <div className="flex items-center gap-2 mb-1.5">
                <Icon className="w-3.5 h-3.5 text-[#E8C15A]/50 shrink-0" />
                <span className="text-[9px] font-black tracking-[0.2em] uppercase text-white/25">{label}</span>
              </div>
              <div className="text-2xl font-black tabular-nums text-white/80">{value}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────── */}
      <section className="border-b border-[#1a1a1a]">
        <div className="max-w-screen-xl mx-auto px-5 sm:px-8 py-12">
          <p className="text-[10px] font-black tracking-[0.25em] uppercase text-white/25 mb-8">
            /// Platform capabilities
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[#1a1a1a]">
            {FEATURES.map(({ icon: Icon, title, desc, link, cta }) => (
              <div key={title} className="bg-[#060606] px-6 py-7 flex flex-col gap-4 hover:bg-[#0a0a0a] transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 border border-[#E8C15A]/25 flex items-center justify-center shrink-0 group-hover:border-[#E8C15A]/50 transition-colors">
                    <Icon className="w-4 h-4 text-[#E8C15A]/60 group-hover:text-[#E8C15A] transition-colors" />
                  </div>
                  <h3 className="text-[11px] font-black tracking-[0.15em] uppercase text-white/70 group-hover:text-white/90 transition-colors">
                    {title}
                  </h3>
                </div>
                <p className="text-[11px] text-white/35 leading-relaxed flex-1">{desc}</p>
                <Link href={link}>
                  <span className="flex items-center gap-1.5 text-[10px] font-black tracking-[0.15em] uppercase text-[#E8C15A]/50 group-hover:text-[#E8C15A] transition-colors">
                    {cta}
                    <ChevronRight className="w-3 h-3" />
                  </span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LATEST THREATS + CTA ─────────────────────────────────────────── */}
      <section className="border-b border-[#1a1a1a]">
        <div className="max-w-screen-xl mx-auto px-5 sm:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-px bg-[#1a1a1a]">
            <div className="bg-[#060606] lg:col-span-3">
              <LatestThreatsWidget />
            </div>
            <div className="bg-[#060606] lg:col-span-2 flex flex-col items-start justify-center p-8 sm:p-12 gap-6">
              <p className="text-[10px] font-black tracking-[0.25em] uppercase text-[#E8C15A]/60">
                /// Ready to explore?
              </p>
              <h2 className="font-display font-black text-3xl sm:text-4xl uppercase leading-none text-white">
                Protect<br />Your<br />Portfolio.
              </h2>
              <p className="text-[11px] text-white/35 leading-relaxed max-w-xs">
                Search every DeFi protocol. Filter by security score, chain, or category. See the audits, the incidents, and the risks — before you commit capital.
              </p>
              <Link href="/home">
                <button className="flex items-center gap-2.5 bg-[#E8C15A] hover:bg-[#f0cc6a] text-[#060606] text-[11px] font-black tracking-[0.2em] uppercase px-6 py-3 transition-all shadow-[0_0_24px_rgba(232,193,90,0.2)] hover:shadow-[0_0_32px_rgba(232,193,90,0.35)]">
                  Enter the Watchtower
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <AdSpace position="bottom" />
    </div>
  );
}
