import { Shield, AlertCircle } from 'lucide-react';

interface SecurityBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
}

export default function SecurityBadge({ score, size = 'md' }: SecurityBadgeProps) {
  // DFJ v2.3: HIGHER IS BETTER (97 = safest, 0 = most dangerous)
  const getStyle = () => {
    if (score >= 80) return { border: 'border-green-500/40',  text: 'text-green-400',  label: 'SAFE'     };
    if (score >= 65) return { border: 'border-blue-500/40',   text: 'text-blue-400',   label: 'LOW'      };
    if (score >= 50) return { border: 'border-yellow-400/40', text: 'text-yellow-400', label: 'MEDIUM'   };
    if (score >= 30) return { border: 'border-orange-400/40', text: 'text-orange-400', label: 'HIGH'     };
    return               { border: 'border-red-500/40',     text: 'text-red-400',    label: 'CRITICAL' };
  };

  const { border, text, label } = getStyle();
  const Icon = score >= 65 ? Shield : AlertCircle;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[9px]',
    md: 'px-2.5 py-1 text-[10px]',
    lg: 'px-3 py-1.5 text-xs',
  };

  return (
    <div
      className={`inline-flex items-center gap-1 border bg-transparent font-black tracking-wider uppercase ${border} ${text} ${sizeClasses[size]}`}
      data-testid="badge-security-score"
    >
      <Icon className="w-3 h-3 shrink-0" />
      <span>{score}</span>
      <span className="opacity-50">/100</span>
    </div>
  );
}
