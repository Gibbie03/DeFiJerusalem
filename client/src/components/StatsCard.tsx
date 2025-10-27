import { LucideIcon, Info } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  tooltip?: string;
}

export default function StatsCard({ label, value, icon: Icon, trend, tooltip }: StatsCardProps) {
  return (
    <Card className="p-5" data-testid={`card-stat-${label.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {label}
            </p>
            {tooltip && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p className="text-xs">{tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <p className="text-3xl font-bold text-foreground truncate" data-testid={`text-${label.toLowerCase().replace(/\s+/g, '-')}-value`}>
            {value}
          </p>
          {trend && (
            <p className={`text-xs font-semibold mt-1 ${trend.isPositive ? 'text-green-500' : 'text-red-500'}`}>
              {trend.isPositive ? '+' : ''}{trend.value}%
            </p>
          )}
        </div>
        <div className="p-2.5 bg-primary/10 rounded-lg shrink-0">
          <Icon className="w-5 h-5 text-primary" />
        </div>
      </div>
    </Card>
  );
}
