import { AlertCircle, XOctagon, TrendingDown, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

interface SeverityIndicatorProps {
  severity: Severity;
  showLabel?: boolean;
}

export default function SeverityIndicator({ severity, showLabel = true }: SeverityIndicatorProps) {
  const config = {
    CRITICAL: {
      icon: XOctagon,
      className: 'bg-red-500/20 text-red-400 border-red-500/50',
      label: 'Critical'
    },
    HIGH: {
      icon: AlertCircle,
      className: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
      label: 'High'
    },
    MEDIUM: {
      icon: TrendingDown,
      className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
      label: 'Medium'
    },
    LOW: {
      icon: Eye,
      className: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
      label: 'Low'
    }
  };

  const { icon: Icon, className, label } = config[severity];

  return (
    <Badge 
      variant="outline" 
      className={`${className} px-3 py-1 text-sm font-semibold border`}
      data-testid={`badge-severity-${severity.toLowerCase()}`}
    >
      <Icon className="w-3.5 h-3.5 mr-1.5" />
      {showLabel && label}
    </Badge>
  );
}
