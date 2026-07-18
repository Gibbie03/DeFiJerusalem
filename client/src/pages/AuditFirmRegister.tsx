import { useState } from 'react';
import { useLocation } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Shield, CheckCircle2, ChevronLeft, X } from 'lucide-react';
import { Link } from 'wouter';
import { apiRequest } from '@/lib/queryClient';

const SPECIALTY_OPTIONS = ['EVM', 'Rust', 'Solidity', 'ZK Circuits', 'DeFi', 'NFT', 'Bridge', 'L2', 'Cosmos', 'Solana', 'Move', 'Cairo', 'Formal Verification', 'Fuzzing', 'MEV'];
const TEAM_SIZES = ['1-5', '6-20', '21-50', '50+'];

export default function AuditFirmRegister() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    name: '', website: '', description: '', contactEmail: '',
    twitterHandle: '', githubHandle: '', foundedYear: '',
    teamSize: '', logoUrl: '', specialties: [] as string[],
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/audit-firms', {
        ...form,
        foundedYear: form.foundedYear ? parseInt(form.foundedYear) : null,
        teamSize: form.teamSize || null,
        logoUrl: form.logoUrl || null,
        twitterHandle: form.twitterHandle || null,
        githubHandle: form.githubHandle || null,
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => setSuccess(true),
    onError: () => toast({ title: 'Registration failed', description: 'Please check your details and try again.', variant: 'destructive' }),
  });

  const toggleSpecialty = (s: string) => {
    setForm(f => ({
      ...f,
      specialties: f.specialties.includes(s) ? f.specialties.filter(x => x !== s) : [...f.specialties, s],
    }));
  };

  if (success) return (
    <div className="container mx-auto p-6 max-w-lg">
      <Card>
        <CardContent className="pt-8 pb-8 text-center space-y-4">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
          <h2 className="text-2xl font-bold">Registration Submitted</h2>
          <p className="text-muted-foreground">Your firm profile has been submitted for admin review. Once verified, it will appear in the public audit firms directory.</p>
          <p className="text-sm text-muted-foreground">You can now log in and claim existing audits to start building your verified reputation.</p>
          <div className="flex gap-3 justify-center mt-2">
            <Link href="/audit-firms"><Button variant="outline">View Directory</Button></Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Link href="/audit-firms">
        <span className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground cursor-pointer mb-4">
          <ChevronLeft className="w-4 h-4" />Back to Audit Firms
        </span>
      </Link>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle>Register Your Audit Firm</CardTitle>
              <CardDescription>Build a verified reputation on DeFiJerusalem by registering and claiming your completed audits.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <Alert className="bg-primary/5 border-primary/20">
            <AlertDescription className="text-xs">
              Profiles are reviewed by admins before being listed publicly. Firms can also claim existing audit entries from our protocol database to have their audits verified and tracked.
            </AlertDescription>
          </Alert>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1 sm:col-span-2">
              <label className="text-sm font-medium">Firm Name *</label>
              <Input placeholder="Trail of Bits, OpenZeppelin..." value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Website *</label>
              <Input placeholder="https://..." value={form.website} onChange={e => setForm(f => ({...f, website: e.target.value}))} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Contact Email *</label>
              <Input type="email" placeholder="security@firm.com" value={form.contactEmail} onChange={e => setForm(f => ({...f, contactEmail: e.target.value}))} />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-sm font-medium">Description *</label>
              <Textarea placeholder="Brief description of your firm, methodology, and areas of expertise..." value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} rows={3} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Twitter Handle</label>
              <Input placeholder="@yourfirm" value={form.twitterHandle} onChange={e => setForm(f => ({...f, twitterHandle: e.target.value.replace('@','')}))} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">GitHub</label>
              <Input placeholder="github-org" value={form.githubHandle} onChange={e => setForm(f => ({...f, githubHandle: e.target.value}))} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Founded Year</label>
              <Input type="number" placeholder="2021" value={form.foundedYear} onChange={e => setForm(f => ({...f, foundedYear: e.target.value}))} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Team Size</label>
              <div className="flex gap-2 flex-wrap">
                {TEAM_SIZES.map(s => (
                  <button key={s} onClick={() => setForm(f => ({...f, teamSize: f.teamSize === s ? '' : s}))}
                    className={`px-3 py-1 rounded-full text-sm border transition-colors ${form.teamSize === s ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Logo URL (optional)</label>
              <Input placeholder="https://..." value={form.logoUrl} onChange={e => setForm(f => ({...f, logoUrl: e.target.value}))} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Specialties</label>
            <div className="flex flex-wrap gap-2">
              {SPECIALTY_OPTIONS.map(s => (
                <button key={s} onClick={() => toggleSpecialty(s)}
                  className={`px-3 py-1 rounded-full text-sm border transition-colors ${form.specialties.includes(s) ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}>
                  {form.specialties.includes(s) && <X className="w-3 h-3 inline mr-1" />}{s}
                </button>
              ))}
            </div>
          </div>

          <Button
            className="w-full"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !form.name || !form.website || !form.description || !form.contactEmail}
          >
            {mutation.isPending ? 'Submitting...' : 'Submit for Review'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
