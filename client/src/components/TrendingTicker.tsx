import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import type { Protocol } from '@shared/schema';
import { useEffect, useRef } from 'react';

import { formatTVL } from '@/lib/format';

/** Map the DFJ security score (0–97) to a display badge — same scale used everywhere else */
function getSecurityBadge(score: number | null | undefined): { label: string; color: string } {
  const s = score ?? 0;
  if (s >= 80) return { label: 'SAFE',   color: 'text-green-400'  };
  if (s >= 65) return { label: 'LOW',    color: 'text-blue-400'   };
  if (s >= 50) return { label: 'MEDIUM', color: 'text-yellow-400' };
  if (s >= 30) return { label: 'HIGH',   color: 'text-orange-400' };
  return            { label: 'CRIT',   color: 'text-red-500'    };
}

export default function TrendingTicker() {
  const { data: protocols = [] } = useQuery<Protocol[]>({
    queryKey: ['/api/protocols/trending'],
    refetchInterval: 60_000,
  });

  const mobileRef  = useRef<HTMLDivElement>(null);
  const desktopRef = useRef<HTMLDivElement>(null);

  const list = (Array.isArray(protocols) ? protocols : []).slice(0, 10);

  useEffect(() => {
    const id = setTimeout(() => {
      const calc = (el: HTMLElement, pps: number) => {
        const dur = el.scrollWidth / pps;
        el.style.animationDuration = `${dur}s`;
      };
      if (mobileRef.current?.scrollWidth)  calc(mobileRef.current, 30);
      if (desktopRef.current?.scrollWidth) calc(desktopRef.current, 55);
    }, 100);
    return () => clearTimeout(id);
  }, [list]);

  if (list.length === 0) return null;

  const renderItem = (p: Protocol, idx: number, total: number) => {
    const rank = (idx % total) + 1;
    const { label, color } = getSecurityBadge(p.securityScore);
    return (
      <Link
        key={`${p.id}-${idx}`}
        href={`/protocol/${p.id}`}
        className="inline-flex items-center gap-2 px-3 py-0.5 hover:bg-white/5 transition-colors"
        data-testid={`trending-protocol-${p.id}`}
      >
        {/* rank */}
        <span className="text-[10px] font-bold text-white/25 min-w-[1.4rem]">#{rank}</span>
        {/* name */}
        <span className="text-[11px] font-semibold text-white/80 whitespace-nowrap">{p.name}</span>
        {/* real security badge */}
        <span className={`text-[9px] font-black tracking-wider ${color}`}>{label}</span>
        {/* separator */}
        <span className="text-white/15 text-xs">—</span>
        {/* 24h TVL change */}
        <span className={`text-[11px] font-bold tabular-nums ${p.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {p.change24h >= 0 ? '+' : ''}{p.change24h.toFixed(2)}%
        </span>
        {/* TVL */}
        <span className="text-[10px] text-white/30 font-medium hidden xs:inline">
          {formatTVL(p.tvl)}
        </span>
        {/* item divider */}
        <span className="text-[#E8C15A]/25 ml-3">◆</span>
      </Link>
    );
  };

  return (
    <div className="bg-[#060606] border-b border-[#1a1a1a] overflow-hidden">
      <div className="flex items-stretch">

        {/* Label pill */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-r border-[#1a1a1a] bg-[#0a0a0a] shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-[#E8C15A] animate-gold-pulse shrink-0" />
          <span className="text-[9px] font-black tracking-[0.25em] text-[#E8C15A] uppercase whitespace-nowrap">
            Exploit Wire
          </span>
        </div>

        {/* Mobile scroll */}
        <div className="flex-1 overflow-hidden sm:hidden relative">
          <div className="flex">
            <div ref={mobileRef} className="animate-ticker-mobile flex whitespace-nowrap items-center" data-testid="trending-ticker">
              {list.map((p, i) => renderItem(p, i, list.length))}
            </div>
            <div className="flex whitespace-nowrap items-center ml-3">
              {list.slice(0, 3).map((p, i) => renderItem(p, i, list.length))}
            </div>
          </div>
        </div>

        {/* Desktop scroll */}
        <div className="flex-1 overflow-hidden hidden sm:block relative">
          <div className="flex">
            <div ref={desktopRef} className="animate-ticker-desktop flex whitespace-nowrap items-center" data-testid="trending-ticker">
              {list.map((p, i) => renderItem(p, i, list.length))}
            </div>
            <div className="flex whitespace-nowrap items-center ml-4">
              {list.slice(0, 3).map((p, i) => renderItem(p, i, list.length))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
