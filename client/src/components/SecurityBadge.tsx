import { Shield, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface SecurityBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
}

export default function SecurityBadge({ score, size = 'md' }: SecurityBadgeProps) {
  const getColor = () => {
    // UNIFIED SCORING: 0 = SAFE (best), 100 = CRITICAL (worst)
    // Lower scores = safer (green), Higher scores = riskier (red)
    if (score >= 80) return 'bg-red-500/20 text-red-400 border-red-500/30';       // CRITICAL: 80-100
    if (score >= 60) return 'bg-orange-500/20 text-orange-400 border-orange-500/30'; // HIGH: 60-79
    if (score >= 40) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'; // MEDIUM: 40-59
    if (score >= 20) return 'bg-blue-500/20 text-blue-400 border-blue-500/30';    // LOW: 20-39
    return 'bg-green-500/20 text-green-400 border-green-500/30';                  // SAFE: 0-19
  };

  const Icon = score < 40 ? Shield : AlertCircle;
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base'
  };

  return (
    <Badge 
      variant="outline" 
      className={`${getColor()} ${sizeClasses[size]} font-semibold border`}
      data-testid="badge-security-score"
    >
      <Icon className="w-3 h-3 mr-1" />
      {score}/100
    </Badge>
  );
}
