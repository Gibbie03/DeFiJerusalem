import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Trophy, Star, Send, Plus, Users, Coins, Clock, ChevronRight, Shield, Flag, Search as SearchIcon, FileText, Zap } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface BountyTask {
  id: string;
  title: string;
  description: string;
  category: string;
  pointReward: number;
  status: string;
  deadline: string | null;
  requirements: string[];
  submissionCount: number;
  maxSubmissions: number | null;
  createdAt: string;
}

interface CommunityUser {
  id: string;
  displayName: string;
  totalPoints: number;
  email?: string;
  walletAddress?: string;
}

const CATEGORY_ICONS: Record<string, any> = {
  vulnerability: Shield,
  data_verification: SearchIcon,
  audit_review: FileText,
  protocol_flag: Flag,
  research: Zap,
};
const CATEGORY_LABELS: Record<string, string> = {
  vulnerability: 'Vulnerability Report',
  data_verification: 'Data Verification',
  audit_review: 'Audit Review',
  protocol_flag: 'Protocol Flag',
  research: 'Research',
};

function PointsBadge({ points }: { points: number }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-sm font-bold">
      <Coins className="w-3.5 h-3.5" />{points.toLocaleString()} pts
    </span>
  );
}

function TaskCard({ task, onSubmit }: { task: BountyTask; onSubmit: (task: BountyTask) => void }) {
  const Icon = CATEGORY_ICONS[task.category] ?? Shield;
  const isFull = task.maxSubmissions !== null && task.submissionCount >= task.maxSubmissions;
  const isOpen = task.status === 'open' && !isFull;

  return (
    <Card className={`hover:border-primary/40 transition-colors ${!isOpen ? 'opacity-60' : ''}`}>
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
            <Icon className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div className="font-semibold leading-tight">{task.title}</div>
              <PointsBadge points={task.pointReward} />
            </div>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
            <div className="flex items-center gap-3 mt-3 flex-wrap">
              <Badge variant="outline" className="text-xs">{CATEGORY_LABELS[task.category] ?? task.category}</Badge>
              {task.deadline && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(task.deadline).toLocaleDateString()}
                </span>
              )}
              <span className="text-xs text-muted-foreground">
                {task.submissionCount}{task.maxSubmissions ? `/${task.maxSubmissions}` : ''} submissions
              </span>
              <Button
                size="sm" variant={isOpen ? 'default' : 'outline'}
                className="ml-auto text-xs h-7"
                disabled={!isOpen}
                onClick={() => isOpen && onSubmit(task)}
              >
                {isFull ? 'Full' : task.status !== 'open' ? 'Closed' : 'Submit'} <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RegisterDialog({ onRegistered }: { onRegistered: (user: CommunityUser) => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ displayName: '', email: '', walletAddress: '', bio: '', identityMode: 'email' });
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async () => {
      const body: any = { displayName: form.displayName, bio: form.bio };
      if (form.identityMode === 'email') body.email = form.email;
      else body.walletAddress = form.walletAddress;
      const res = await apiRequest('POST', '/api/community/register', body);
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: data.existing ? 'Welcome back!' : 'Account created!', description: `${data.user.totalPoints} points on your account.` });
      onRegistered(data.user);
      setOpen(false);
    },
    onError: () => toast({ title: 'Failed', description: 'Could not register.', variant: 'destructive' }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Users className="w-4 h-4 mr-2" />Join to Earn Points</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Create Your Account</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <label className="text-sm font-medium">Display Name</label>
            <Input placeholder="anon_researcher" value={form.displayName} onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Identity</label>
            <Select value={form.identityMode} onValueChange={v => setForm(f => ({ ...f, identityMode: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email address</SelectItem>
                <SelectItem value="wallet">Wallet address</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {form.identityMode === 'email'
            ? <Input type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            : <Input placeholder="0x... or Solana address" value={form.walletAddress} onChange={e => setForm(f => ({ ...f, walletAddress: e.target.value }))} />
          }
          <div className="space-y-1">
            <label className="text-sm font-medium">Bio (optional)</label>
            <Textarea placeholder="Security researcher, DeFi enthusiast..." value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} rows={2} />
          </div>
          <Alert className="bg-primary/5 border-primary/20">
            <AlertDescription className="text-xs">
              Points earned now will be exchangeable for DFJ tokens after launch. No reputation gate — every submission is reviewed on merit.
            </AlertDescription>
          </Alert>
        </div>
        <DialogFooter>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !form.displayName || (!form.email && !form.walletAddress)}>
            {mutation.isPending ? 'Creating...' : 'Create Account'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SubmitDialog({ task, user, onSuccess }: { task: BountyTask | null; user: CommunityUser; onSuccess: () => void }) {
  const [open, setOpen] = useState(!!task);
  const [form, setForm] = useState({ type: task?.category ?? 'vulnerability_report', title: '', description: '', evidence: '', evidenceLinks: '', protocolName: '' });
  const { toast } = useToast();
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/submissions', {
        userId: user.id,
        taskId: task?.id ?? null,
        type: task ? 'task_completion' : form.type,
        title: task ? `Task: ${task.title}` : form.title,
        description: form.description,
        evidence: form.evidence,
        evidenceLinks: form.evidenceLinks.split('\n').map(l => l.trim()).filter(Boolean),
        protocolName: form.protocolName || undefined,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Submitted!', description: 'Your submission is pending review.' });
      qc.invalidateQueries({ queryKey: ['/api/bounties'] });
      onSuccess();
      setOpen(false);
    },
    onError: () => toast({ title: 'Failed', description: 'Could not submit.', variant: 'destructive' }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!task && (
        <DialogTrigger asChild>
          <Button variant="outline"><Send className="w-4 h-4 mr-2" />Submit Finding</Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{task ? `Submit: ${task.title}` : 'Self-Submit a Finding'}</DialogTitle>
          {task && <p className="text-sm text-muted-foreground">Reward: <PointsBadge points={task.pointReward} /></p>}
        </DialogHeader>
        <div className="space-y-4 py-2">
          {!task && (
            <>
              <div className="space-y-1">
                <label className="text-sm font-medium">Type</label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Title</label>
                <Input placeholder="Brief summary of your finding" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Protocol (optional)</label>
                <Input placeholder="Protocol name" value={form.protocolName} onChange={e => setForm(f => ({ ...f, protocolName: e.target.value }))} />
              </div>
            </>
          )}
          <div className="space-y-1">
            <label className="text-sm font-medium">Description</label>
            <Textarea placeholder={task ? 'Describe how you completed this task...' : 'Describe your finding in detail...'} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={4} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Evidence / Technical Details (optional)</label>
            <Textarea placeholder="Technical details, PoC, transaction hashes, contract addresses..." value={form.evidence} onChange={e => setForm(f => ({ ...f, evidence: e.target.value }))} rows={3} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Evidence Links (one per line)</label>
            <Textarea placeholder="https://etherscan.io/tx/...&#10;https://github.com/..." value={form.evidenceLinks} onChange={e => setForm(f => ({ ...f, evidenceLinks: e.target.value }))} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !form.description || (!task && !form.title)}>
            {mutation.isPending ? 'Submitting...' : 'Submit for Review'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function BountiesPage() {
  const [currentUser, setCurrentUser] = useState<CommunityUser | null>(null);
  const [activeTask, setActiveTask] = useState<BountyTask | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('all');

  const { data: tasks = [], isLoading: tasksLoading } = useQuery<BountyTask[]>({
    queryKey: ['/api/bounties'],
    queryFn: () => fetch('/api/bounties?status=open').then(r => r.json()),
  });

  const { data: leaderboard = [] } = useQuery<CommunityUser[]>({
    queryKey: ['/api/leaderboard'],
    queryFn: () => fetch('/api/leaderboard?limit=20').then(r => r.json()),
  });

  const filteredTasks = categoryFilter === 'all' ? tasks : tasks.filter(t => t.category === categoryFilter);
  const totalRewards = tasks.reduce((sum, t) => sum + t.pointReward, 0);

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Trophy className="w-8 h-8 text-primary" /> Bounty Board
          </h1>
          <p className="text-muted-foreground mt-1">
            Earn points by completing security tasks and submitting findings. Points exchange for DFJ tokens after launch.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {currentUser ? (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-card">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">{currentUser.displayName}</span>
              <PointsBadge points={currentUser.totalPoints} />
            </div>
          ) : (
            <RegisterDialog onRegistered={setCurrentUser} />
          )}
          {currentUser && (
            <SubmitDialog task={null} user={currentUser} onSuccess={() => setActiveTask(null)} />
          )}
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Open Tasks', value: tasks.filter(t => t.status === 'open').length, icon: Plus },
          { label: 'Total Points Available', value: totalRewards.toLocaleString(), icon: Coins },
          { label: 'Community Members', value: leaderboard.length, icon: Users },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="pt-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <div>
                <div className="text-xl font-bold">{value}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="tasks">
        <TabsList>
          <TabsTrigger value="tasks">Open Tasks</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="howto">How It Works</TabsTrigger>
        </TabsList>

        {/* Tasks tab */}
        <TabsContent value="tasks" className="space-y-4">
          {/* Category filter */}
          <div className="flex gap-2 flex-wrap">
            {['all', ...Object.keys(CATEGORY_LABELS)].map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1 rounded-full text-sm border transition-colors ${categoryFilter === cat ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}
              >
                {cat === 'all' ? 'All' : CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>

          {tasksLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>
          ) : filteredTasks.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <div className="font-semibold">No open tasks right now</div>
                <p className="text-sm text-muted-foreground mt-1">Check back soon — or submit your own finding below.</p>
                {currentUser && (
                  <div className="mt-4">
                    <SubmitDialog task={null} user={currentUser} onSuccess={() => {}} />
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map(task => (
                <TaskCard key={task.id} task={task} onSubmit={t => {
                  if (!currentUser) return;
                  setActiveTask(t);
                }} />
              ))}
            </div>
          )}

          {activeTask && currentUser && (
            <SubmitDialog task={activeTask} user={currentUser} onSuccess={() => setActiveTask(null)} />
          )}
        </TabsContent>

        {/* Leaderboard */}
        <TabsContent value="leaderboard">
          <Card>
            <CardHeader>
              <CardTitle>Top Contributors</CardTitle>
              <CardDescription>Points are permanent and will be exchangeable for DFJ tokens at launch.</CardDescription>
            </CardHeader>
            <CardContent>
              {leaderboard.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">Be the first on the leaderboard!</div>
              ) : (
                <div className="space-y-2">
                  {leaderboard.map((user, i) => (
                    <div key={user.id} className={`flex items-center gap-3 p-3 rounded-lg ${i < 3 ? 'bg-primary/5 border border-primary/20' : 'border'}`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${i === 0 ? 'bg-yellow-500/20 text-yellow-500' : i === 1 ? 'bg-gray-400/20 text-gray-400' : i === 2 ? 'bg-orange-600/20 text-orange-600' : 'bg-muted text-muted-foreground'}`}>
                        {i + 1}
                      </div>
                      {i < 3 && <Star className={`w-4 h-4 shrink-0 ${i === 0 ? 'text-yellow-500' : i === 1 ? 'text-gray-400' : 'text-orange-600'}`} />}
                      <div className="flex-1 font-medium">{user.displayName}</div>
                      <PointsBadge points={user.totalPoints} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* How it works */}
        <TabsContent value="howto">
          <Card>
            <CardContent className="pt-6 space-y-6">
              {[
                { step: '1', title: 'Create an account', desc: 'Register with an email or wallet address. No reputation required — every submission is reviewed on merit, not pedigree.' },
                { step: '2', title: 'Complete tasks or submit findings', desc: 'Pick from admin-posted tasks (data verification, protocol flags, research) or self-submit any security finding for any DeFi protocol.' },
                { step: '3', title: 'Earn points', desc: 'Every approved submission earns points. Points are recorded permanently on your account ledger.' },
                { step: '4', title: 'Exchange for DFJ tokens', desc: 'After DeFiJerusalem token launches, your accumulated points convert to DFJ tokens at a fixed rate. The more you contribute now, the larger your allocation.' },
              ].map(({ step, title, desc }) => (
                <div key={step} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0">{step}</div>
                  <div>
                    <div className="font-semibold">{title}</div>
                    <p className="text-sm text-muted-foreground mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
