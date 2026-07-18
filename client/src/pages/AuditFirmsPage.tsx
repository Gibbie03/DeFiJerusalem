import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Shield, Star, ExternalLink, Plus, CheckCircle2, AlertTriangle, Search } from 'lucide-react';

interface AuditFirm {
  id: string;
  name: string;
  website: string;
  description: string;
  logoUrl?: string;
  specialties: string[];
  teamSize?: string;
  verificationStatus: string;
  totalClaims: number;
  verifiedClaims: number;
  postExploitCount: number;
  communityRating?: number;
  totalReviews: number;
  avgBountyResponseDays?: number;
  scopeCoverageScore?: number;
  createdAt: string;
}

function ReputationScore({ firm }: { firm: AuditFirm }) {
  // Simple composite score: 0-100
  let score = 50; // base
  if (firm.verifiedClaims > 0) score += Math.min(20, firm.verifiedClaims * 2);
  if (firm.communityRating) score += (firm.communityRating - 3) * 5;
  if (firm.postExploitCount > 0) score -= firm.postExploitCount * 10;
  if (firm.scopeCoverageScore) score += (firm.scopeCoverageScore - 50) * 0.2;
  score = Math.max(0, Math.min(100, Math.round(score)));

  const color = score >= 75 ? 'text-green-500' : score >= 50 ? 'text-yellow-500' : 'text-destructive';
  const label = score >= 75 ? 'Strong' : score >= 50 ? 'Moderate' : 'Limited';
  return <span className={`font-bold ${color}`}>{label} ({score})</span>;
}

function FirmCard({ firm }: { firm: AuditFirm }) {
  const stars = firm.communityRating ? Math.round(firm.communityRating) : null;
  return (
    <Link href={`/audit-firms/${firm.id}`}>
      <Card className="hover:border-primary/40 transition-colors cursor-pointer h-full">
        <CardContent className="pt-4 space-y-3">
          <div className="flex items-start gap-3">
            {firm.logoUrl
              ? <img src={firm.logoUrl} alt={firm.name} className="w-10 h-10 rounded-lg object-contain bg-muted shrink-0" />
              : <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Shield className="w-5 h-5 text-primary" /></div>
            }
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold">{firm.name}</span>
                {firm.verificationStatus === 'verified' && (
                  <Badge variant="outline" className="text-xs border-green-500 text-green-500 py-0">
                    <CheckCircle2 className="w-3 h-3 mr-1" />Verified
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{firm.description}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-1">
            {firm.specialties.slice(0, 4).map(s => (
              <Badge key={s} variant="secondary" className="text-xs py-0">{s}</Badge>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 rounded bg-muted/50">
              <div className="text-muted-foreground">Verified Audits</div>
              <div className="font-bold text-sm">{firm.verifiedClaims}</div>
            </div>
            <div className="p-2 rounded bg-muted/50">
              <div className="text-muted-foreground">Post-exploit</div>
              <div className={`font-bold text-sm ${firm.postExploitCount > 0 ? 'text-destructive' : 'text-green-500'}`}>
                {firm.postExploitCount}
              </div>
            </div>
            {stars !== null && (
              <div className="p-2 rounded bg-muted/50">
                <div className="text-muted-foreground">Rating</div>
                <div className="font-bold text-sm flex items-center gap-1">
                  <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                  {firm.communityRating?.toFixed(1)} <span className="font-normal text-muted-foreground">({firm.totalReviews})</span>
                </div>
              </div>
            )}
            {firm.avgBountyResponseDays !== null && firm.avgBountyResponseDays !== undefined && (
              <div className="p-2 rounded bg-muted/50">
                <div className="text-muted-foreground">Avg Response</div>
                <div className="font-bold text-sm">{Math.round(firm.avgBountyResponseDays)}d</div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="text-xs text-muted-foreground">
              Reputation: <ReputationScore firm={firm} />
            </div>
            <ExternalLink className="w-3 h-3 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function AuditFirmsPage() {
  const [search, setSearch] = useState('');

  const { data: firms = [], isLoading } = useQuery<AuditFirm[]>({
    queryKey: ['/api/audit-firms'],
    queryFn: () => fetch('/api/audit-firms?status=verified').then(r => r.json()),
  });

  const { data: pendingFirms = [] } = useQuery<AuditFirm[]>({
    queryKey: ['/api/audit-firms', 'pending'],
    queryFn: () => fetch('/api/audit-firms?status=pending').then(r => r.json()),
  });

  const filtered = firms.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.description.toLowerCase().includes(search.toLowerCase()) ||
    f.specialties.some(s => s.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="w-8 h-8 text-primary" /> Audit Firms
          </h1>
          <p className="text-muted-foreground mt-1">
            Independent audit firm registry with verified claim history, post-exploit tracking, and community ratings.
          </p>
        </div>
        <Link href="/audit-firms/register">
          <Button><Plus className="w-4 h-4 mr-2" />Register Your Firm</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Verified Firms', value: firms.length },
          { label: 'Total Audits Tracked', value: firms.reduce((s, f) => s + f.verifiedClaims, 0) },
          { label: 'Pending Review', value: pendingFirms.length },
        ].map(({ label, value }) => (
          <Card key={label}>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{value}</div>
              <div className="text-xs text-muted-foreground">{label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* How reputation works */}
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="pt-4">
          <div className="text-sm font-semibold mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-yellow-500" />How Reputation Is Calculated</div>
          <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
            <div>✓ <strong>Verified audit count</strong> — claims verified by DFJ admins against on-chain evidence</div>
            <div>⚠ <strong>Post-exploit history</strong> — protocols they audited that were later hacked (reduces score)</div>
            <div>✓ <strong>Scope coverage</strong> — was the audited code verifiably what was deployed?</div>
            <div>✓ <strong>Community rating</strong> — peer reviews from verified researchers</div>
            <div>✓ <strong>Response time</strong> — average days to respond to disclosed vulnerabilities</div>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search by name, specialty..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-52" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <div className="font-semibold text-lg">{firms.length === 0 ? 'No verified firms yet' : 'No results'}</div>
            <p className="text-sm text-muted-foreground mt-1">
              {firms.length === 0
                ? 'Audit firms can register and claim their audits to build verified reputation on DeFiJerusalem.'
                : `No firms match "${search}".`}
            </p>
            <Link href="/audit-firms/register">
              <Button className="mt-4"><Plus className="w-4 h-4 mr-2" />Register a Firm</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(firm => <FirmCard key={firm.id} firm={firm} />)}
        </div>
      )}
    </div>
  );
}
