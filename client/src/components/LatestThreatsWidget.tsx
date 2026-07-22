import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowRight, TrendingUp } from 'lucide-react';
import { Link } from 'wouter';
import { Skeleton } from '@/components/ui/skeleton';

interface ThreatEntry {
  id: string;
  name: string;
  type: 'protocol' | 'blacklisted_dapp';
  severity: string;
  threatCount: number;
  topThreats: string[];
  detectedAt: string;
}

function getSeverityStyle(severity: string): { bar: string; badge: string; text: string } {
  switch (severity) {
    case 'CRITICAL': return { bar: 'bg-red-500',    badge: 'bg-red-500/10 text-red-400 border-red-500/30',    text: 'text-red-400' };
    case 'HIGH':     return { bar: 'bg-orange-400', badge: 'bg-orange-500/10 text-orange-400 border-orange-500/30', text: 'text-orange-400' };
    case 'MEDIUM':   return { bar: 'bg-yellow-400', badge: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30', text: 'text-yellow-400' };
    case 'LOW':      return { bar: 'bg-blue-400',   badge: 'bg-blue-500/10 text-blue-400 border-blue-500/30',   text: 'text-blue-400' };
    default:         return { bar: 'bg-white/20',   badge: 'bg-white/5 text-white/40 border-white/10',          text: 'text-white/40' };
  }
}

function formatTimeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1)  return 'Just now';
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (d < 7)  return `${d}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

export function LatestThreatsWidget() {
  const { data, isLoading } = useQuery<{ threats: ThreatEntry[] }>({
    queryKey: ['/api/threats', { limit: '5' }],
    refetchInterval: 120000,
  });

  const threats = data?.threats ?? [];

  /* ── Loading ───────────────────────────────────────────────────── */
  if (isLoading) {
    return (
      <div className="border border-[#1a1a1a] bg-[#080808]">
        <div className="border-b border-[#1a1a1a] px-5 py-4 flex items-center justify-between">
          <Skeleton className="h-4 w-40 bg-white/5" />
          <Skeleton className="h-4 w-16 bg-white/5" />
        </div>
        <div className="p-5 space-y-3">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 bg-white/5" />)}
        </div>
      </div>
    );
  }

  /* ── Empty ─────────────────────────────────────────────────────── */
  if (threats.length === 0) {
    return (
      <div className="border border-[#1a1a1a] bg-[#080808]">
        <div className="border-b border-[#1a1a1a] px-5 py-4 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-[#E8C15A]" />
          <span className="text-[10px] font-black tracking-[0.2em] uppercase text-white/60">Threat Intelligence</span>
        </div>
        <p className="px-5 py-8 text-sm text-white/30 text-center">No threats detected recently</p>
      </div>
    );
  }

  /* ── Main ──────────────────────────────────────────────────────── */
  return (
    <div className="border border-[#1a1a1a] bg-[#080808]" data-testid="widget-latest-threats">

      {/* Header */}
      <div className="border-b border-[#1a1a1a] px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 text-[#E8C15A] shrink-0" />
          <span className="text-[10px] font-black tracking-[0.2em] uppercase text-white/70">
            Threat Intelligence
          </span>
        </div>
        <div className="flex items-center gap-1.5 border border-[#2a2a2a] px-2.5 py-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#E8C15A] animate-gold-pulse" />
          <span className="text-[9px] font-bold tracking-widest text-[#E8C15A]/80 uppercase">Live</span>
        </div>
      </div>

      {/* Threat rows */}
      <div className="divide-y divide-[#111]">
        {threats.map((threat, i) => {
          const style = getSeverityStyle(threat.severity);
          return (
            <div
              key={threat.id}
              className="flex items-start gap-3 px-5 py-3.5 hover:bg-white/[0.02] transition-colors group"
              data-testid={`threat-entry-${i}`}
            >
              {/* Severity bar */}
              <div className={`w-0.5 self-stretch mt-0.5 shrink-0 ${style.bar}`} />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="text-sm font-semibold text-white/85 truncate leading-snug" data-testid={`threat-name-${i}`}>
                    {threat.name}
                  </h4>
                  <span className={`text-[9px] font-black tracking-wider shrink-0 ${style.text}`} data-testid={`threat-severity-${i}`}>
                    {threat.severity}
                  </span>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-[10px] text-white/30">{formatTimeAgo(threat.detectedAt)}</span>
                  <span className={`text-[10px] font-bold ${style.text}`}>
                    {threat.threatCount} {threat.threatCount === 1 ? 'threat' : 'threats'}
                  </span>
                  {threat.topThreats?.slice(0, 2).map((t, j) => (
                    <span key={j} className="text-[10px] text-white/30 border border-[#1a1a1a] px-1.5 py-0.5">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Arrow */}
              <Link href={threat.type === 'protocol' ? `/protocol/${threat.id}` : `/blacklist/${threat.id}`}>
                <ArrowRight className="w-3.5 h-3.5 text-white/20 group-hover:text-[#E8C15A]/60 transition-colors mt-0.5 shrink-0" data-testid={`button-view-threat-${i}`} />
              </Link>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="border-t border-[#1a1a1a] px-5 py-3">
        <Link href="/threats">
          <button
            className="w-full flex items-center justify-between text-[10px] font-bold tracking-widest uppercase text-white/35 hover:text-[#E8C15A]/80 transition-colors py-1"
            data-testid="button-view-all-threats"
          >
            View All Threats
            <ArrowRight className="w-3 h-3" />
          </button>
        </Link>
      </div>
    </div>
  );
}
