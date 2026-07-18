import { useState } from 'react';
import { useRoute, Link } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Shield, Star, CheckCircle2, XCircle, ExternalLink, Globe, Twitter, Github, AlertTriangle, ChevronLeft, Plus } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface AuditFirm {
  id: string; name: string; website: string; description: string; logoUrl?: string;
  specialties: string[]; teamSize?: string; foundedYear?: number;
  verificationStatus: string; verifiedAt?: string;
  totalClaims: number; verifiedClaims: number; postExploitCount: number;
  communityRating?: number; totalReviews: number;
  avgBountyResponseDays?: number; scopeCoverageScore?: number;
  twitterHandle?: string; githubHandle?: string;
}
interface AuditFirmClaim {
  id: string; protocolId: string; protocolName: string; auditDate: string;
  auditReportUrl: string; auditSummary?: string;
  criticalFindings: number; highFindings: number; mediumFindings: number; lowFindings: number;
  deployedCodeMatchesAudit?: boolean; bountyResponseDays?: number;
  verificationStatus: string; protocolWasExploited?: boolean; exploitDate?: string;
  submittedAt: string;
}
interface AuditFirmReview { id: string; rating: number; reviewText: string; createdAt: string; }

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(n => (
        <button key={n} onClick={() => onChange?.(n)} className={onChange ? 'cursor-pointer' : 'cursor-default'}>
          <Star className={`w-5 h-5 ${n <= value ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'}`} />
        </button>
      ))}
    </div>
  );
}

function ClaimCard({ claim }: { claim: AuditFirmClaim }) {
  const total = claim.criticalFindings + claim.highFindings + claim.mediumFindings + claim.lowFindings;
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="font-semibold flex items-center gap-2">
              {claim.protocolName}
              {claim.verificationStatus === 'verified'
                ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                : <span className="text-xs text-muted-foreground border rounded px-1">Pending</span>}
              {claim.protocolWasExploited && (
                <Badge variant="destructive" className="text-xs">Exploited after audit</Badge>
              )}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">{new Date(claim.auditDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</div>
          </div>
          <a href={claim.auditReportUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-primary hover:underline">
            <ExternalLink className="w-3 h-3" /> Report
          </a>
        </div>
        {claim.auditSummary && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{claim.auditSummary}</p>}
        {total > 0 && (
          <div className="flex gap-2 mt-3 flex-wrap">
            {claim.criticalFindings > 0 && <Badge variant="destructive" className="text-xs">{claim.criticalFindings} Critical</Badge>}
            {claim.highFindings > 0 && <Badge className="text-xs bg-orange-500">{claim.highFindings} High</Badge>}
            {claim.mediumFindings > 0 && <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-500">{claim.mediumFindings} Medium</Badge>}
            {claim.lowFindings > 0 && <Badge variant="outline" className="text-xs">{claim.lowFindings} Low</Badge>}
          </div>
        )}
        <div className="flex gap-4 mt-3 text-xs text-muted-foreground flex-wrap">
          {claim.deployedCodeMatchesAudit !== undefined && (
            <span className={claim.deployedCodeMatchesAudit ? 'text-green-500' : 'text-destructive'}>
              {claim.deployedCodeMatchesAudit ? '✓' : '✗'} Deployed code matches audit
            </span>
          )}
          {claim.bountyResponseDays !== undefined && claim.bountyResponseDays !== null && (
            <span>{claim.bountyResponseDays}d avg response</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function SubmitClaimDialog({ firmId }: { firmId: string }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ protocolId: '', protocolName: '', auditDate: '', auditReportUrl: '', auditSummary: '', criticalFindings: '0', highFindings: '0', mediumFindings: '0', lowFindings: '0', deployedCodeMatchesAudit: '', bountyResponseDays: '' });
  const { toast } = useToast();
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', `/api/audit-firms/${firmId}/claims`, {
        protocolId: form.protocolId || form.protocolName,
        protocolName: form.protocolName,
        auditDate: form.auditDate,
        auditReportUrl: form.auditReportUrl,
        auditSummary: form.auditSummary || null,
        criticalFindings: parseInt(form.criticalFindings) || 0,
        highFindings: parseInt(form.highFindings) || 0,
        mediumFindings: parseInt(form.mediumFindings) || 0,
        lowFindings: parseInt(form.lowFindings) || 0,
        deployedCodeMatchesAudit: form.deployedCodeMatchesAudit === 'yes' ? true : form.deployedCodeMatchesAudit === 'no' ? false : null,
        bountyResponseDays: form.bountyResponseDays ? parseInt(form.bountyResponseDays) : null,
        firmId,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Claim submitted', description: 'An admin will review and verify your claim.' });
      qc.invalidateQueries({ queryKey: [`/api/audit-firms/${firmId}`] });
      setOpen(false);
    },
    onError: () => toast({ title: 'Failed', description: 'Could not submit claim.', variant: 'destructive' }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm"><Plus className="w-4 h-4 mr-1" />Claim an Audit</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Claim an Audit</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1"><label className="text-sm font-medium">Protocol Name *</label>
            <input className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" placeholder="Uniswap, Aave..." value={form.protocolName} onChange={e => setForm(f => ({...f, protocolName: e.target.value}))} /></div>
          <div className="space-y-1"><label className="text-sm font-medium">Audit Date *</label>
            <input type="month" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={form.auditDate} onChange={e => setForm(f => ({...f, auditDate: e.target.value}))} /></div>
          <div className="space-y-1"><label className="text-sm font-medium">Audit Report URL *</label>
            <input className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" placeholder="https://..." value={form.auditReportUrl} onChange={e => setForm(f => ({...f, auditReportUrl: e.target.value}))} /></div>
          <div className="space-y-1"><label className="text-sm font-medium">Summary (optional)</label>
            <Textarea placeholder="Brief audit summary..." value={form.auditSummary} onChange={e => setForm(f => ({...f, auditSummary: e.target.value}))} rows={2} /></div>
          <div className="grid grid-cols-4 gap-2">
            {[['Critical', 'criticalFindings'],['High','highFindings'],['Medium','mediumFindings'],['Low','lowFindings']].map(([label, key]) => (
              <div key={key} className="space-y-1"><label className="text-xs text-muted-foreground">{label}</label>
                <input type="number" min="0" className="flex h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm" value={(form as any)[key]} onChange={e => setForm(f => ({...f, [key]: e.target.value}))} /></div>
            ))}
          </div>
          <div className="space-y-1"><label className="text-sm font-medium">Deployed code matches audited code?</label>
            <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm" value={form.deployedCodeMatchesAudit} onChange={e => setForm(f => ({...f, deployedCodeMatchesAudit: e.target.value}))}>
              <option value="">Unknown</option><option value="yes">Yes</option><option value="no">No — changes were made post-audit</option></select></div>
          <div className="space-y-1"><label className="text-sm font-medium">Avg bounty response time (days, optional)</label>
            <input type="number" min="0" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm" placeholder="e.g. 14" value={form.bountyResponseDays} onChange={e => setForm(f => ({...f, bountyResponseDays: e.target.value}))} /></div>
        </div>
        <DialogFooter>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !form.protocolName || !form.auditDate || !form.auditReportUrl}>
            {mutation.isPending ? 'Submitting...' : 'Submit Claim'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LeaveReviewDialog({ firmId, userId }: { firmId: string; userId?: string }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const { toast } = useToast();
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', `/api/audit-firms/${firmId}/reviews`, { reviewerUserId: userId, rating, reviewText });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Review submitted' });
      qc.invalidateQueries({ queryKey: [`/api/audit-firms/${firmId}`] });
      setOpen(false);
    },
    onError: () => toast({ title: 'Failed', variant: 'destructive' }),
  });

  if (!userId) return null;
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="outline" size="sm"><Star className="w-4 h-4 mr-1" />Leave Review</Button></DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Review this Firm</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <label className="text-sm font-medium">Rating</label>
            <div className="mt-1"><StarRating value={rating} onChange={setRating} /></div>
          </div>
          <div className="space-y-1"><label className="text-sm font-medium">Review</label>
            <Textarea placeholder="Share your experience with this audit firm..." value={reviewText} onChange={e => setReviewText(e.target.value)} rows={4} /></div>
        </div>
        <DialogFooter>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || rating === 0 || !reviewText}>
            {mutation.isPending ? 'Submitting...' : 'Submit Review'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AuditFirmDetail() {
  const [, params] = useRoute('/audit-firms/:id');
  const firmId = params?.id;

  const { data, isLoading } = useQuery<{ firm: AuditFirm; claims: AuditFirmClaim[]; reviews: AuditFirmReview[] }>({
    queryKey: [`/api/audit-firms/${firmId}`],
    queryFn: () => fetch(`/api/audit-firms/${firmId}`).then(r => r.json()),
    enabled: !!firmId,
  });

  if (isLoading) return (
    <div className="container mx-auto p-6 space-y-4 max-w-4xl">
      <Skeleton className="h-32 w-full" /><Skeleton className="h-64 w-full" />
    </div>
  );
  if (!data?.firm) return (
    <div className="container mx-auto p-6"><Alert variant="destructive"><AlertDescription>Firm not found.</AlertDescription></Alert></div>
  );

  const { firm, claims, reviews } = data;
  const verifiedClaims = claims.filter(c => c.verificationStatus === 'verified');

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-4xl">
      <Link href="/audit-firms"><span className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground cursor-pointer"><ChevronLeft className="w-4 h-4" />Back to Audit Firms</span></Link>

      {/* Header */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex items-start gap-4 flex-wrap">
            {firm.logoUrl
              ? <img src={firm.logoUrl} alt={firm.name} className="w-16 h-16 rounded-lg object-contain bg-muted shrink-0" />
              : <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Shield className="w-8 h-8 text-primary" /></div>
            }
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold">{firm.name}</h1>
                {firm.verificationStatus === 'verified'
                  ? <Badge variant="outline" className="border-green-500 text-green-500"><CheckCircle2 className="w-3 h-3 mr-1" />Verified Firm</Badge>
                  : <Badge variant="outline" className="text-muted-foreground">Pending Verification</Badge>}
              </div>
              <p className="text-sm text-muted-foreground mt-1">{firm.description}</p>
              <div className="flex gap-3 mt-3 flex-wrap">
                {firm.website && <a href={firm.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><Globe className="w-3 h-3" />Website</a>}
                {firm.twitterHandle && <a href={`https://twitter.com/${firm.twitterHandle}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><Twitter className="w-3 h-3" />@{firm.twitterHandle}</a>}
                {firm.githubHandle && <a href={`https://github.com/${firm.githubHandle}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><Github className="w-3 h-3" />GitHub</a>}
              </div>
              <div className="flex flex-wrap gap-1 mt-3">
                {firm.specialties.map(s => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}
                {firm.teamSize && <Badge variant="outline" className="text-xs">{firm.teamSize} team</Badge>}
                {firm.foundedYear && <Badge variant="outline" className="text-xs">Est. {firm.foundedYear}</Badge>}
              </div>
            </div>
          </div>

          {/* Reputation Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
            {[
              { label: 'Verified Audits', value: firm.verifiedClaims, color: 'text-green-500' },
              { label: 'Post-Exploit', value: firm.postExploitCount, color: firm.postExploitCount > 0 ? 'text-destructive' : 'text-green-500' },
              { label: 'Community Rating', value: firm.communityRating ? `${firm.communityRating.toFixed(1)}/5` : '—', color: 'text-yellow-500' },
              { label: 'Scope Coverage', value: firm.scopeCoverageScore ? `${firm.scopeCoverageScore.toFixed(0)}%` : '—', color: 'text-primary' },
            ].map(({ label, value, color }) => (
              <div key={label} className="p-3 rounded-lg border text-center">
                <div className={`text-2xl font-bold ${color}`}>{value}</div>
                <div className="text-xs text-muted-foreground mt-1">{label}</div>
              </div>
            ))}
          </div>

          {firm.postExploitCount > 0 && (
            <Alert className="mt-4 border-destructive/30 bg-destructive/5">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <AlertDescription className="text-sm">
                {firm.postExploitCount} protocol(s) audited by this firm were later exploited. This does not necessarily indicate audit failure — see individual claim details.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="audits">
        <TabsList>
          <TabsTrigger value="audits">Audit History ({claims.length})</TabsTrigger>
          <TabsTrigger value="reviews">Reviews ({reviews.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="audits" className="space-y-4">
          <div className="flex justify-end"><SubmitClaimDialog firmId={firm.id} /></div>
          {claims.length === 0 ? (
            <Card><CardContent className="py-10 text-center text-muted-foreground">No audits claimed yet. If you represent this firm, claim your audits to build your on-chain verified reputation.</CardContent></Card>
          ) : (
            <div className="space-y-3">{claims.map(c => <ClaimCard key={c.id} claim={c} />)}</div>
          )}
        </TabsContent>

        <TabsContent value="reviews" className="space-y-4">
          <div className="flex items-center justify-between">
            {firm.communityRating && (
              <div className="flex items-center gap-2">
                <StarRating value={Math.round(firm.communityRating)} />
                <span className="text-sm text-muted-foreground">{firm.communityRating.toFixed(1)} from {firm.totalReviews} review{firm.totalReviews !== 1 ? 's' : ''}</span>
              </div>
            )}
            <LeaveReviewDialog firmId={firm.id} />
          </div>
          {reviews.length === 0 ? (
            <Card><CardContent className="py-10 text-center text-muted-foreground">No reviews yet. Be the first to review this firm.</CardContent></Card>
          ) : (
            <div className="space-y-3">
              {reviews.map(r => (
                <Card key={r.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <StarRating value={r.rating} />
                      <span className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm">{r.reviewText}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
