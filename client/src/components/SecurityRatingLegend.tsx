import { Shield, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function SecurityRatingLegend() {
  const ratings = [
    {
      range: '90-100',
      label: 'Excellent',
      color: 'bg-green-500/10 text-green-500 border-green-500/20',
      description: 'Highly secure, audited, no threats detected',
    },
    {
      range: '70-89',
      label: 'Good',
      color: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      description: 'Secure with minor concerns',
    },
    {
      range: '50-69',
      label: 'Moderate',
      color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      description: 'Some security risks identified',
    },
    {
      range: '30-49',
      label: 'Low',
      color: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      description: 'Multiple security concerns',
    },
    {
      range: '0-29',
      label: 'Critical',
      color: 'bg-red-500/10 text-red-500 border-red-500/20',
      description: 'Severe threats detected, high risk',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Security Rating Key
        </CardTitle>
        <CardDescription>Understanding DApp security scores</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {ratings.map((rating) => (
          <div key={rating.range} className="flex items-start gap-3">
            <Badge className={`${rating.color} min-w-[80px] justify-center`}>
              {rating.range}
            </Badge>
            <div className="flex-1">
              <p className="text-sm font-medium">{rating.label}</p>
              <p className="text-xs text-muted-foreground">{rating.description}</p>
            </div>
          </div>
        ))}
        <div className="pt-3 border-t mt-3">
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
            <p>
              Scores are based on security audits, threat detection, contract analysis, and historical data.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
