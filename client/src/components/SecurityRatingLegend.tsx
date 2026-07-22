import { Shield, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function SecurityRatingLegend() {
  // DFJ v2.3 — higher scores = safer. Max 97 pts (Foundation 45 + Active 55 − Penalties 30).
  const ratings = [
    {
      range: '80 – 97',
      label: 'Safe',
      color: 'bg-green-500/10 text-green-500 border-green-500/20',
      description: 'Thoroughly audited, reputable security posture, no major concerns',
    },
    {
      range: '65 – 79',
      label: 'Low Risk',
      color: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      description: 'Generally secure with minor unverified indicators',
    },
    {
      range: '50 – 64',
      label: 'Medium Risk',
      color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      description: 'Some security signals missing — verify before committing large funds',
    },
    {
      range: '30 – 49',
      label: 'High Risk',
      color: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      description: 'Multiple security indicators absent — proceed with significant caution',
    },
    {
      range: '0 – 29',
      label: 'Critical',
      color: 'bg-red-500/10 text-red-500 border-red-500/20',
      description: 'Limited verifiable security data or significant risks detected',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Security Rating Key
        </CardTitle>
        <CardDescription>Understanding DFJ v2.3 security scores</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {ratings.map((rating) => (
          <div key={rating.range} className="flex items-start gap-3">
            <Badge className={`${rating.color} min-w-[80px] justify-center shrink-0`}>
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
              <strong>Higher scores = safer protocols.</strong> Maximum score is 97/97.
              Built from Foundation security (up to 45 pts) + Active security (up to 55 pts) − Detected risk penalties (up to 30 pts).
              Scores reflect currently available public data and may not capture all information.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
