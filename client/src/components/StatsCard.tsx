import { LucideIcon, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: number; isPositive: boolean };
  tooltip?: string;
}

export default function StatsCard({ label, value, icon: Icon, trend, tooltip }: StatsCardProps) {
  return (
    <div
      className="border border-[#1a1a1a] bg-[#080808] px-5 py-4 flex flex-col gap-3 hover:border-[#2a2a2a] transition-colors"
      data-testid={`card-stat-${label.toLowerCase().replace(/\s+/g, '-')}`}
    >
      {/* Label row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-black tracking-[0.22em] uppercase text-white/35 whitespace-nowrap">
            {label}
          </span>
          {tooltip && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-3 h-3 text-white/20 cursor-help shrink-0" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs bg-[#111] border-[#2a2a2a] text-white/80">
                  <p className="text-xs">{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <div className="p-1.5 border border-[#1a1a1a] bg-[#0d0d0d] shrink-0">
          <Icon className="w-3.5 h-3.5 text-[#E8C15A]/60" />
        </div>
      </div>

      {/* Value */}
      <p
        className="text-2xl sm:text-3xl font-black text-white tabular-nums leading-none"
        data-testid={`text-${label.toLowerCase().replace(/\s+/g, '-')}-value`}
      >
        {value}
      </p>

      {/* Optional trend */}
      {trend && (
        <p className={`text-[10px] font-bold tracking-wider ${trend.isPositive ? 'text-green-400' : 'text-red-400'}`}>
          {trend.isPositive ? '▲' : '▼'} {Math.abs(trend.value)}%
        </p>
      )}
    </div>
  );
}
