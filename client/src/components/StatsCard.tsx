import { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export default function StatsCard({ label, value, icon: Icon, trend }: StatsCardProps) {
  return (
    <Card className="p-6" data-testid={`card-stat-${label.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
            {label}
          </p>
          <p className="text-3xl font-bold text-foreground mb-1" data-testid={`text-${label.toLowerCase().replace(/\s+/g, '-')}-value`}>
            {value}
          </p>
          {trend && (
            <p className={`text-sm font-medium ${trend.isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {trend.isPositive ? '+' : ''}{trend.value}%
            </p>
          )}
        </div>
        <div className="p-3 bg-primary/10 rounded-lg">
          <Icon className="w-6 h-6 text-primary" />
        </div>
      </div>
    </Card>
  );
}
