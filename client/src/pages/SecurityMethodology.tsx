import { useEffect } from 'react';
import {
  Shield, TrendingUp, AlertTriangle, CheckCircle, Info, Eye,
  Calculator, Lock, Activity, FileCode, Clock, Zap, GitBranch,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';

export default function SecurityMethodology() {
  useEffect(() => {
    document.title = 'Security Score Methodology - DeFiJerusalem';
    const desc = 'DeFiJerusalem security scoring: Foundation (45) + Active (55) + Bonus (3), capped at 97, then minus penalties (−32 max). Higher = safer.';
    let m = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (m) { m.setAttribute('content', desc); } else { m = document.createElement('meta'); m.name = 'description'; m.content = desc; document.head.appendChild(m); }
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8">

      {/* ── Hero ── */}
      <div className="text-center space-y-4 pb-8 border-b">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary via-accent to-primary rounded-xl mb-4">
          <Shield className="w-10 h-10 text-primary-foreground" />
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
          Security Score Methodology
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Full transparency into how DeFiJerusalem scores 7,900+ DeFi protocols.{' '}
          <strong className="text-foreground">Higher score = safer protocol.</strong>
        </p>
      </div>

      {/* ── Core formula ── */}
      <Alert className="border-primary/20 bg-primary/5">
        <Info className="h-5 w-5 text-primary" />
        <AlertTitle className="text-lg font-semibold">The Formula — sequencing matters</AlertTitle>
        <AlertDescription className="mt-2 space-y-3">
          <div className="font-mono text-sm space-y-1">
            <p><span className="text-green-400">Gross Score</span> = Foundation (0–45) + Active (0–55) + Predictive Bonus (0–3)</p>
            <p><span className="text-yellow-400">Capped Score</span> = min(97, Gross Score)  <span className="text-muted-foreground">← 97-cap applied HERE, before penalties</span></p>
            <p><span className="text-primary">Final Score</span> = Capped Score − Category Penalty − Concentrated Control Risk − Inherited Risk − Supply Chain Risk − Audit/Bounty Scope Coverage</p>
          </div>
          <p className="text-sm text-muted-foreground">
            <strong>Example:</strong> 100 gross − capped to 97 − 5 penalty = <strong>92</strong>, not 95.
            The cap and the penalties are applied in that order, always.
            Maximum combined penalty is <strong>−32</strong>. Final score floor is <strong>0</strong>.
          </p>
        </AlertDescription>
      </Alert>

      {/* ── Score pillars summary ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: <Lock className="w-4 h-4" />, label: 'Foundation', pts: '0–45 pts', color: 'border-green-500/30 bg-green-500/5 text-green-400', desc: 'Historical security investment' },
          { icon: <Activity className="w-4 h-4" />, label: 'Active Security', pts: '0–55 pts', color: 'border-blue-500/30 bg-blue-500/5 text-blue-400', desc: 'Current operational posture' },
          { icon: <Zap className="w-4 h-4" />, label: 'Predictive Bonus', pts: '0–3 pts', color: 'border-yellow-500/30 bg-yellow-500/5 text-yellow-400', desc: 'New protocols only (< 6 mo)' },
          { icon: <AlertTriangle className="w-4 h-4" />, label: 'Penalties', pts: '0 – −32 pts', color: 'border-red-500/30 bg-red-500/5 text-red-400', desc: '5 independent penalty checks' },
        ].map(({ icon, label, pts, color, desc }) => (
          <Card key={label} className={`border ${color}`}>
            <CardHeader className="pb-1 pt-4">
              <CardTitle className={`text-sm flex items-center gap-2 ${color.split(' ')[2]}`}>
                {icon} {label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${color.split(' ')[2]}`}>{pts}</p>
              <p className="text-xs text-muted-foreground mt-1">{desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Main tabs ── */}
      <Tabs defaultValue="foundation" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 h-auto p-2 gap-1 bg-card border">
          {[
            { value: 'foundation', label: 'Foundation', icon: <Lock className="w-3.5 h-3.5" />, active: 'bg-green-700' },
            { value: 'active', label: 'Active', icon: <Activity className="w-3.5 h-3.5" />, active: 'bg-blue-700' },
            { value: 'bonus', label: 'Bonus', icon: <Zap className="w-3.5 h-3.5" />, active: 'bg-yellow-600' },
            { value: 'category', label: 'Category', icon: <GitBranch className="w-3.5 h-3.5" />, active: 'bg-orange-700' },
            { value: 'universal', label: 'Universal', icon: <AlertTriangle className="w-3.5 h-3.5" />, active: 'bg-destructive' },
            { value: 'examples', label: 'Examples', icon: <Eye className="w-3.5 h-3.5" />, active: 'bg-accent' },
          ].map(({ value, label, icon, active }) => (
            <TabsTrigger key={value} value={value}
              className={`py-3 text-sm font-semibold data-[state=active]:${active} data-[state=active]:text-white`}>
              <span className="flex items-center gap-1.5">{icon}{label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ══════════════════════════════════════════
            FOUNDATION
        ══════════════════════════════════════════ */}
        <TabsContent value="foundation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-green-500" /> Foundation Score — max 45 pts
              </CardTitle>
              <CardDescription>
                Measures historical security investment. Less predictive of future failure than Active, but establishes baseline credibility.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">

              {/* F1 */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold flex items-center gap-2"><FileCode className="w-4 h-4 text-green-400" /> F1 · Audit &amp; Verification — max 18 pts</h3>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tier</TableHead>
                      <TableHead>Example Firms</TableHead>
                      <TableHead>Base Points</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow><TableCell className="font-semibold">Tier 1</TableCell><TableCell>Trail of Bits, OpenZeppelin, Certora</TableCell><TableCell><Badge className="bg-green-500/20 text-green-400">22 base</Badge></TableCell></TableRow>
                    <TableRow><TableCell className="font-semibold">Tier 2</TableCell><TableCell>Quantstamp, PeckShield, Hacken, SlowMist</TableCell><TableCell><Badge className="bg-green-500/20 text-green-400">16 base</Badge></TableCell></TableRow>
                    <TableRow><TableCell className="font-semibold">Tier 3</TableCell><TableCell>CertiK, SolidProof, TechRate</TableCell><TableCell><Badge className="bg-green-500/20 text-green-400">12 base</Badge></TableCell></TableRow>
                    <TableRow><TableCell className="font-semibold text-muted-foreground">No audit / unrecognized</TableCell><TableCell>—</TableCell><TableCell><Badge variant="secondary">3 base</Badge></TableCell></TableRow>
                  </TableBody>
                </Table>
                <div className="mt-3 p-3 bg-muted/50 rounded-lg text-sm space-y-1">
                  <p><strong>Age-decay:</strong> <code className="font-mono">decay = max(0.50, 1.0 − (age_months / 48))</code></p>
                  <p><strong>Unresolved critical findings:</strong> additional 0.5× multiplier applied</p>
                  <p><strong>Final F1:</strong> <code className="font-mono">min(18, base × decay × critical_penalty)</code></p>
                  <p className="text-muted-foreground"><em>Example: Tier 1 audit (22 base), 12 months old (0.75× decay), no criticals → 22 × 0.75 = 16.5 pts.</em></p>
                  <p className="text-muted-foreground"><em>Why 18, not 20: audits show limited protection against novel attacks; current verifiable code state (F2) deserves more relative weight.</em></p>
                </div>
              </div>

              {/* F2 */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold flex items-center gap-2"><FileCode className="w-4 h-4 text-green-400" /> F2 · Code &amp; Contract History — max 12 pts</h3>
                </div>
                <Table>
                  <TableHeader><TableRow><TableHead>Component</TableHead><TableHead>Points</TableHead><TableHead>Verification Method</TableHead></TableRow></TableHeader>
                  <TableBody>
                    <TableRow><TableCell className="font-semibold">Source code verified</TableCell><TableCell><Badge className="bg-green-500/20 text-green-400">6</Badge></TableCell><TableCell>Block explorer API verification</TableCell></TableRow>
                    <TableRow><TableCell className="font-semibold">Clean vulnerability scan</TableCell><TableCell><Badge className="bg-green-500/20 text-green-400">6</Badge></TableCell><TableCell>Slither / Mythril / Echidna — zero critical or high findings</TableCell></TableRow>
                  </TableBody>
                </Table>
              </div>

              {/* F3 */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold flex items-center gap-2"><Clock className="w-4 h-4 text-green-400" /> F3 · Track Record — max 10 pts</h3>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg text-sm space-y-2">
                  <p><strong>Age component:</strong> up to <strong>8 pts</strong> — 48+ months live = full 8, scaled down for younger protocols.</p>
                  <p><strong>Exploit modifier:</strong> +2 if never exploited → scales to −10 for severe unresolved exploit history.</p>
                  <p className="text-muted-foreground">Combined score floored at 0, capped at 10.</p>
                </div>
              </div>

              {/* F4 + F5 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-bold mb-2">F4 · Documentation — max 3 pts</h3>
                  <Table>
                    <TableBody>
                      <TableRow><TableCell>Technical documentation (comprehensive)</TableCell><TableCell><Badge className="bg-green-500/20 text-green-400">1.5</Badge></TableCell></TableRow>
                      <TableRow><TableCell>Admin controls documented</TableCell><TableCell><Badge className="bg-green-500/20 text-green-400">1.5</Badge></TableCell></TableRow>
                    </TableBody>
                  </Table>
                </div>
                <div>
                  <h3 className="font-bold mb-2">F5 · Historical Governance — max 2 pts</h3>
                  <Table>
                    <TableBody>
                      <TableRow><TableCell>On-chain DAO established</TableCell><TableCell><Badge className="bg-green-500/20 text-green-400">1.5</Badge></TableCell></TableRow>
                      <TableRow><TableCell>Timelock mechanism present</TableCell><TableCell><Badge className="bg-green-500/20 text-green-400">0.5</Badge></TableCell></TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>

            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════════════════════════════════════════
            ACTIVE SECURITY
        ══════════════════════════════════════════ */}
        <TabsContent value="active" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-500" /> Active Security Score — max 55 pts
              </CardTitle>
              <CardDescription>
                The most predictive component. Measures what the protocol is doing right now to protect users.
                Active carries more weight than Foundation because current posture matters more than historical paperwork.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">

              {/* A1 */}
              <div>
                <h3 className="font-bold mb-1 flex items-center gap-2"><Shield className="w-4 h-4 text-blue-400" /> A1 · Security Infrastructure — max 22 pts</h3>

                {/* A1a */}
                <div className="mb-4">
                  <p className="text-sm font-semibold text-blue-400 mb-2">A1a · Access Controls — max 12 pts</p>
                  <Alert className="border-red-500/30 bg-red-500/5 mb-3">
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                    <AlertDescription className="text-sm">
                      <strong>Hard rule:</strong> any multisig below 50% threshold always scores 0 — no exceptions.
                      This rule exists because an earlier version gave identical credit to a 3-of-5 (60%) and a 3-of-11 (27.3%) multisig — the exact configuration exploited at Radiant Capital for $53M.
                    </AlertDescription>
                  </Alert>
                  <Table>
                    <TableHeader><TableRow><TableHead>Configuration</TableHead><TableHead>Threshold</TableHead><TableHead>Points</TableHead></TableRow></TableHeader>
                    <TableBody>
                      <TableRow><TableCell className="font-semibold">DAO governance / Immutable (no admin)</TableCell><TableCell>N/A</TableCell><TableCell><Badge className="bg-blue-500/20 text-blue-400">12</Badge></TableCell></TableRow>
                      <TableRow><TableCell className="font-semibold">Timelock + Multisig</TableCell><TableCell>≥71%</TableCell><TableCell><Badge className="bg-blue-500/20 text-blue-400">12</Badge></TableCell></TableRow>
                      <TableRow><TableCell className="font-semibold">Multisig (no timelock)</TableCell><TableCell>≥71%</TableCell><TableCell><Badge className="bg-blue-500/20 text-blue-400">8</Badge></TableCell></TableRow>
                      <TableRow><TableCell>Multisig</TableCell><TableCell>60–70%</TableCell><TableCell><Badge className="bg-blue-500/20 text-blue-400">5</Badge></TableCell></TableRow>
                      <TableRow><TableCell>Multisig</TableCell><TableCell>50–59%</TableCell><TableCell><Badge className="bg-blue-500/20 text-blue-400">3</Badge></TableCell></TableRow>
                      <TableRow className="bg-red-500/5"><TableCell className="font-semibold text-red-400">Multisig</TableCell><TableCell className="text-red-400">&lt;50%</TableCell><TableCell><Badge variant="destructive">0 — FAIL</Badge></TableCell></TableRow>
                      <TableRow className="bg-red-500/5"><TableCell className="font-semibold text-red-400">EOA admin (single wallet)</TableCell><TableCell className="text-red-400">N/A</TableCell><TableCell><Badge variant="destructive">0</Badge></TableCell></TableRow>
                    </TableBody>
                  </Table>
                </div>

                {/* A1b + A1c */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-semibold text-blue-400 mb-2">A1b · Oracle Security — max 6 pts</p>
                    <Table>
                      <TableBody>
                        <TableRow><TableCell>Multiple independent oracle sources</TableCell><TableCell><Badge className="bg-blue-500/20 text-blue-400">6</Badge></TableCell></TableRow>
                        <TableRow><TableCell>Single oracle (even if Chainlink)</TableCell><TableCell><Badge className="bg-blue-500/20 text-blue-400">3</Badge></TableCell></TableRow>
                        <TableRow><TableCell>Custom / unaudited oracle, no redundancy</TableCell><TableCell><Badge variant="secondary">0</Badge></TableCell></TableRow>
                      </TableBody>
                    </Table>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-blue-400 mb-2">A1c · Emergency Response — max 4 pts</p>
                    <Table>
                      <TableBody>
                        <TableRow><TableCell>Circuit breaker / pause mechanism</TableCell><TableCell><Badge className="bg-blue-500/20 text-blue-400">2</Badge></TableCell></TableRow>
                        <TableRow><TableCell>Emergency withdrawal path for users</TableCell><TableCell><Badge className="bg-blue-500/20 text-blue-400">2</Badge></TableCell></TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>

              {/* A2 */}
              <div>
                <h3 className="font-bold mb-3 flex items-center gap-2"><CheckCircle className="w-4 h-4 text-blue-400" /> A2 · Incident Response — max 17 pts (15 + 2 chain-level)</h3>
                <div className="space-y-3">
                  <div className="p-3 border rounded-lg">
                    <p className="text-sm font-semibold text-blue-400 mb-1">A2a · Bug Bounty — max 11 pts</p>
                    <p className="text-sm text-muted-foreground">Requires an API-verified program (Immunefi / HackerOne). Scored via hybrid formula combining absolute dollar value and percentage of TVL. A verified payout within the last 90 days is required for full credit.</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="text-sm font-semibold text-blue-400 mb-1">A2b · Ongoing Vigilance — max 4 pts</p>
                    <p className="text-sm text-muted-foreground">1 pt each: monitoring alerts published in the last 30 days · security updates in the last 30 days · bug bounty payout in the last 90 days · active community security engagement.</p>
                  </div>
                  <div className="p-3 border border-blue-500/30 bg-blue-500/5 rounded-lg">
                    <p className="text-sm font-semibold text-blue-400 mb-1">A2c · Chain-Level Vigilance — max 2 pts</p>
                    <p className="text-sm text-muted-foreground">
                      Measures the security posture of the base chain or L2 the protocol is deployed on —
                      validator/sequencer decentralization trend, base-layer incident history in the last 12 months,
                      and whether the chain itself has an active funded bug bounty.
                      1 pt for meeting ≥2 of 3 criteria; full 2 pts requires all three.
                    </p>
                    <p className="text-xs text-muted-foreground mt-2 italic">
                      This component resolves the 2-point gap between the five named Active sub-components (53) and the 55-point total.
                      It is a real, distinct line from the original specification — not a rounding fix.
                    </p>
                  </div>
                </div>
              </div>

              {/* A3 */}
              <div>
                <h3 className="font-bold mb-3 flex items-center gap-2"><Eye className="w-4 h-4 text-blue-400" /> A3 · Proactive Monitoring — max 7 pts</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 border rounded-lg">
                    <p className="text-sm font-semibold mb-1">Static Analysis — 4 pts</p>
                    <p className="text-sm text-muted-foreground">Automated scanning tools actively run against the protocol's live code.</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="text-sm font-semibold mb-1">Real-Time Monitoring — 3 pts</p>
                    <p className="text-sm text-muted-foreground">
                      3+ platforms (Forta, OpenZeppelin Defender, CertiK Skynet, Tenderly) = full 3 pts.
                      1–2 platforms = partial. None = 0.
                    </p>
                  </div>
                </div>
              </div>

              {/* A4 + A5 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-bold mb-2">A4 · Economic Health — max 6 pts</h3>
                  <Table>
                    <TableBody>
                      <TableRow><TableCell>TVL stability</TableCell><TableCell><Badge className="bg-blue-500/20 text-blue-400">2</Badge></TableCell></TableRow>
                      <TableRow><TableCell>Revenue generation</TableCell><TableCell><Badge className="bg-blue-500/20 text-blue-400">2</Badge></TableCell></TableRow>
                      <TableRow><TableCell>User retention</TableCell><TableCell><Badge className="bg-blue-500/20 text-blue-400">1</Badge></TableCell></TableRow>
                      <TableRow><TableCell>Liquidity health</TableCell><TableCell><Badge className="bg-blue-500/20 text-blue-400">1</Badge></TableCell></TableRow>
                    </TableBody>
                  </Table>
                </div>
                <div>
                  <h3 className="font-bold mb-2">A5 · Live Governance — max 3 pts</h3>
                  <Table>
                    <TableBody>
                      <TableRow><TableCell>Active governance operations</TableCell><TableCell><Badge className="bg-blue-500/20 text-blue-400">1</Badge></TableCell></TableRow>
                      <TableRow><TableCell>Transparency</TableCell><TableCell><Badge className="bg-blue-500/20 text-blue-400">1</Badge></TableCell></TableRow>
                      <TableRow><TableCell>Execution speed</TableCell><TableCell><Badge className="bg-blue-500/20 text-blue-400">1</Badge></TableCell></TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>

            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════════════════════════════════════════
            PREDICTIVE BONUS
        ══════════════════════════════════════════ */}
        <TabsContent value="bonus" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" /> Predictive Bonus — max 3 pts
              </CardTitle>
              <CardDescription>
                Applies only to protocols under 6 months old. Expires automatically at 6 months — no action needed.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Signal</TableHead><TableHead>Points</TableHead><TableHead>Notes</TableHead></TableRow></TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-semibold">Formal verification</TableCell>
                    <TableCell><Badge className="bg-yellow-500/20 text-yellow-400">+1</Badge></TableCell>
                    <TableCell>Certora or Runtime Verification formal proof</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-semibold">Clean Tier 1 audit</TableCell>
                    <TableCell><Badge className="bg-yellow-500/20 text-yellow-400">+1</Badge></TableCell>
                    <TableCell>Trail of Bits, OpenZeppelin, or Certora — no unresolved findings</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-semibold">Meaningful bug bounty</TableCell>
                    <TableCell><Badge className="bg-yellow-500/20 text-yellow-400">+1</Badge></TableCell>
                    <TableCell>Bounty value ≥ 2% of TVL at time of assessment</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              <Alert className="mt-4 border-yellow-500/20 bg-yellow-500/5">
                <Info className="h-4 w-4 text-yellow-500" />
                <AlertDescription className="text-sm">
                  The Predictive Bonus is added to the gross score before the 97-point cap is applied, not after penalties.
                  A new protocol earning all 3 bonus points still cannot exceed 97 final — it's part of the gross ceiling calculation.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════════════════════════════════════════
            CATEGORY PENALTY
        ══════════════════════════════════════════ */}
        <TabsContent value="category" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-orange-500" /> Category Penalty — ceiling −15 pts
              </CardTitle>
              <CardDescription>
                One penalty drawn from the protocol's primary functional category. In v2.4 this is a holistic,
                evidence-informed assessment against a ceiling — not a sum of pattern-specific point values.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

              <Alert className="border-orange-500/20 bg-orange-500/5">
                <Info className="h-4 w-4 text-orange-400" />
                <AlertTitle>Why v2.4 changed this</AlertTitle>
                <AlertDescription className="text-sm mt-1">
                  v2.3 assigned specific point values to specific numbered patterns (e.g. Lending: P1 −7, P2 −4.5, P3 −3.5 = −15).
                  As the DFJ-Pattern-checker library grew, re-deriving fresh splits for every new validated pattern became
                  recurring maintenance work — and values like "−4.5" were never derived from data; they existed to make line items sum correctly.
                  v2.4 keeps each category's ceiling unchanged but assesses the penalty holistically against that ceiling.
                </AlertDescription>
              </Alert>

              <div>
                <h3 className="font-semibold mb-3">How to assess a category penalty</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Assessment</TableHead>
                      <TableHead>Penalty Range</TableHead>
                      <TableHead>Basis</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-semibold">No findings, or only CANNOT DETERMINE</TableCell>
                      <TableCell><Badge className="bg-green-500/20 text-green-400">0</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">Nothing structurally flagged. Explicitly not evidence of safety.</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-semibold">SIMILAR MATCH — single-incident watch items only</TableCell>
                      <TableCell><Badge className="bg-yellow-500/20 text-yellow-400">−1 to −4</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">Real mechanisms present, but not severe and not yet validated by the two-incident rule.</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-semibold">SIMILAR MATCH on a well-validated pattern, or multiple SIMILAR MATCHes</TableCell>
                      <TableCell><Badge className="bg-orange-500/20 text-orange-400">−4 to −8</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">Structurally concerning, solid evidence, but not a direct hit.</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-semibold">One EXACT MATCH on a well-validated pattern</TableCell>
                      <TableCell><Badge className="bg-orange-500/20 text-orange-400">−8 to −12</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">The specific mechanism behind real, repeated losses is present.</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-semibold">Multiple EXACT MATCHes, or EXACT MATCH on large incident base</TableCell>
                      <TableCell><Badge variant="destructive">−12 to −15</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">Maximum category exposure.</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <div className="p-4 border rounded-lg space-y-2 text-sm">
                <p className="font-semibold">Hard rule: state the reasoning in writing, every time.</p>
                <p className="text-muted-foreground">
                  A category penalty of −9 must cite the specific finding(s) that produced it and why that weight — not a lower or higher one — was chosen.
                  An unexplained number is not a score; it is an assertion. This requirement existed implicitly in v2.3's worked examples and is a stated hard rule in v2.4.
                </p>
              </div>

              <div className="p-4 border border-blue-500/30 bg-blue-500/5 rounded-lg text-sm">
                <p className="font-semibold text-blue-400 mb-1">Special architecture case: permissionless market frameworks</p>
                <p className="text-muted-foreground">
                  Protocols like Morpho Blue, Silo, and JustLend V2 let anyone deploy isolated markets with independently-chosen parameters.
                  For these, assess the category penalty per individual market being evaluated — a single blended protocol-wide score is not meaningful for this architecture type.
                </p>
              </div>

            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════════════════════════════════════════
            UNIVERSAL PENALTY CHECKS
        ══════════════════════════════════════════ */}
        <TabsContent value="universal" className="space-y-6">
          <Alert className="border-red-500/20 bg-red-500/5">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <AlertTitle>Combined penalty ceiling: −32 pts</AlertTitle>
            <AlertDescription className="text-sm mt-1">
              Category Penalty (−15) + Concentrated Control Risk (−5) + Inherited Risk (−5) + Supply Chain Risk (−5) + Audit/Bounty Scope (−2) = −32 maximum.
              All four universal checks are applied independently of the category penalty, and independently of each other.
              Final score floor is always 0.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">

            {/* CCR */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Concentrated Control Risk</span>
                  <Badge variant="destructive">ceiling −5</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  The question is always the same: how many genuinely independent parties have to collude to take a severe, unilateral action over user funds or the system itself?
                  Identify any mechanism — governance vote, admin multisig, validator weight system — that could enable this. Check actual concentration and whether friction (cooldown, supermajority, independent veto) would slow or block it.
                </p>
                <Table>
                  <TableHeader><TableRow><TableHead>Match Status</TableHead><TableHead>Deduction</TableHead></TableRow></TableHeader>
                  <TableBody>
                    <TableRow><TableCell className="font-semibold text-red-400">EXACT MATCH — mechanism exists, power verifiably concentrated, no friction</TableCell><TableCell><Badge variant="destructive">−5</Badge></TableCell></TableRow>
                    <TableRow><TableCell className="font-semibold text-orange-400">SIMILAR MATCH</TableCell><TableCell><Badge className="bg-orange-500/20 text-orange-400">−2.5</Badge></TableCell></TableRow>
                    <TableRow><TableCell className="font-semibold text-green-400">NOT PRESENT</TableCell><TableCell><Badge className="bg-green-500/20 text-green-400">0</Badge></TableCell></TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Inherited Risk */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Inherited Risk</span>
                  <Badge variant="destructive">ceiling −5</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  If a protocol structurally depends on a separate protocol carrying its own unresolved finding, that finding passes through — capped at this ceiling, never at the dependent category's own larger ceiling.
                  This avoids double-counting a risk the protocol did not create itself.
                </p>
                <div className="p-3 bg-muted/50 rounded-lg text-sm">
                  <strong>Example:</strong> Aave does not operate bridge infrastructure. Its rsETH-related exposure is scored through Inherited Risk — KelpDAO's Bridge finding (SIMILAR MATCH) passes through capped at −5, not at Bridge's own −15 ceiling.
                </div>
              </CardContent>
            </Card>

            {/* Supply Chain Risk */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Supply Chain Risk</span>
                  <Badge variant="destructive">ceiling −5</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Tests for frontend and release-pipeline attack surface — malicious package updates, compromised build pipelines, or tampered deployment artifacts that could expose users even if on-chain contracts are clean.
                  Confirmed applicable across all eight protocol categories.
                </p>
                <p className="text-xs text-muted-foreground mt-2 italic">
                  Note: dependency/library supply chain risk (third-party library vulnerabilities) is a separately logged, unscored gap — no check currently covers it specifically.
                </p>
              </CardContent>
            </Card>

            {/* Audit/Bounty Scope */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Audit / Bounty Scope Coverage</span>
                  <Badge className="bg-orange-500/20 text-orange-400">ceiling −2 (watch-item)</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Checks whether a protocol's actually-deployed contracts are fully covered by its claimed audits and bug bounty program —
                  or whether legacy/deprecated contracts and newer deployments have quietly fallen outside scope.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  <strong>Cannot reach EXACT MATCH</strong> — this is inherently a binary disclosure-gap question, not a severity tier.
                  Maximum deduction is −2 (SIMILAR MATCH only).
                </p>
              </CardContent>
            </Card>

          </div>
        </TabsContent>

        {/* ══════════════════════════════════════════
            EXAMPLES
        ══════════════════════════════════════════ */}
        <TabsContent value="examples" className="space-y-6">

          {/* Severity thresholds */}
          <Card>
            <CardHeader>
              <CardTitle>Severity Thresholds — Higher = Safer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: 'SAFE',        range: '80 – 97', bar: 90, bg: 'bg-green-500/10',  text: 'text-green-400',  desc: 'Extensive audits, active security infrastructure, proven track record.' },
                { label: 'LOW RISK',    range: '65 – 79', bar: 72, bg: 'bg-blue-500/10',   text: 'text-blue-400',   desc: 'Good security posture; some signals missing or unverified.' },
                { label: 'MEDIUM RISK', range: '50 – 64', bar: 57, bg: 'bg-yellow-500/10', text: 'text-yellow-400', desc: 'Mixed signals — legitimate but limited public verifiability.' },
                { label: 'HIGH RISK',   range: '30 – 49', bar: 40, bg: 'bg-orange-500/10', text: 'text-orange-400', desc: 'Few positive signals and/or active risk flags detected.' },
                { label: 'CRITICAL',    range: '0 – 29',  bar: 15, bg: 'bg-red-500/10',    text: 'text-red-400',    desc: 'Significant threat signals or near-zero verifiable security. Auto-blacklist candidate.' },
              ].map(({ label, range, bar, bg, text, desc }) => (
                <div key={label} className={`flex items-center gap-4 p-3 ${bg} rounded-lg`}>
                  <div className="w-28 shrink-0">
                    <p className={`font-bold text-sm ${text}`}>{label}</p>
                    <p className="text-xs text-muted-foreground">{range}</p>
                  </div>
                  <Progress value={bar} className="w-20 h-2 shrink-0" />
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Worked examples */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-primary" /> Worked Examples
              </CardTitle>
              <CardDescription>Note: cap is applied to the gross score; penalties come after.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

              {/* Uniswap */}
              <div className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold">Uniswap V3 — established DEX</h4>
                  <Badge className="bg-green-500/20 text-green-400">SAFE · ~92</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="font-semibold text-green-400 mb-1">Foundation ≈ 43</p>
                    <ul className="space-y-0.5 text-muted-foreground">
                      <li>F1: Tier 1 audit, 3 yrs old → ~14</li>
                      <li>F2: Open-source + clean scan → 12</li>
                      <li>F3: 4+ yrs, never exploited → 10</li>
                      <li>F4/F5: full docs + DAO → 5</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-blue-400 mb-1">Active ≈ 52</p>
                    <ul className="space-y-0.5 text-muted-foreground">
                      <li>A1: DAO immutable → 12; multi-oracle → 6; circuit breaker → 2</li>
                      <li>A2: Large bounty + recent payout → 11; vigilance → 4; Ethereum chain → 2</li>
                      <li>A3: 3+ monitoring platforms → 7</li>
                      <li>A4/A5: High TVL, active gov → 8</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-red-400 mb-1">Penalties ≈ −3</p>
                    <ul className="space-y-0.5 text-muted-foreground">
                      <li>Category (DEX): 0 — no flagged patterns</li>
                      <li>CCR: 0 — DAO/immutable</li>
                      <li>Scope coverage: −2 (some v2 contracts)</li>
                      <li>Supply chain: −1</li>
                    </ul>
                  </div>
                </div>
                <div className="pt-3 border-t font-mono text-sm">
                  Gross: 43 + 52 = 95 → min(97, 95) = <strong>95</strong> → 95 − 3 = <span className="text-green-400 font-bold">92</span>
                </div>
              </div>

              {/* New protocol */}
              <div className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold">New Yield Protocol — 4 months old</h4>
                  <Badge className="bg-yellow-500/20 text-yellow-400">MEDIUM · ~53</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="font-semibold text-green-400 mb-1">Foundation ≈ 22</p>
                    <ul className="space-y-0.5 text-muted-foreground">
                      <li>F1: 1 Tier 2 audit, 4 mo old → ~12</li>
                      <li>F2: open-source only → 6</li>
                      <li>F3: 4 months, no exploits → ~4</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-blue-400 mb-1">Active ≈ 30 + Bonus 2</p>
                    <ul className="space-y-0.5 text-muted-foreground">
                      <li>A1: timelock + 3-of-5 (60%) → 8; single oracle → 3</li>
                      <li>A2: small bounty → 6; vigilance → 2; chain → 1</li>
                      <li>A3: 1 monitor platform → partial</li>
                      <li>A4/A5: TVL $8M, some governance</li>
                      <li>Bonus: Tier 1 audit + formal verify → +2</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-red-400 mb-1">Penalties ≈ −3</p>
                    <ul className="space-y-0.5 text-muted-foreground">
                      <li>Category (Yield): SIMILAR on watch item → −2</li>
                      <li>Scope coverage: −1</li>
                    </ul>
                  </div>
                </div>
                <div className="pt-3 border-t font-mono text-sm">
                  Gross: 22 + 30 + 2 = 54 → min(97, 54) = <strong>54</strong> → 54 − 3 = <span className="text-yellow-400 font-bold">51</span> → MEDIUM
                </div>
              </div>

              {/* Scam */}
              <div className="p-4 border border-red-500/30 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold">Suspected Drainer — no legitimate signals</h4>
                  <Badge variant="destructive">CRITICAL · 0</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="font-semibold text-green-400 mb-1">Foundation: 3</p>
                    <ul className="space-y-0.5 text-muted-foreground"><li>F1: no audit → 3 pts only; F2–F5: 0</li></ul>
                  </div>
                  <div>
                    <p className="font-semibold text-blue-400 mb-1">Active: 0</p>
                    <ul className="space-y-0.5 text-muted-foreground"><li>EOA admin → 0 on A1; no bounty, no monitoring</li></ul>
                  </div>
                  <div>
                    <p className="font-semibold text-red-400 mb-1">Penalties: −32 (cap)</p>
                    <ul className="space-y-0.5 text-muted-foreground">
                      <li>Category: EXACT drainer pattern → −15</li>
                      <li>CCR: single EOA → −5</li>
                      <li>Inherited, Supply, Scope: −5, −5, −2</li>
                    </ul>
                  </div>
                </div>
                <div className="pt-3 border-t font-mono text-sm">
                  Gross: 3 → min(97, 3) = <strong>3</strong> → 3 − 32 = −29 → <span className="text-red-400 font-bold">clamp → 0</span>
                </div>
                <p className="text-sm text-destructive font-semibold">⛔ CRITICAL — Auto-blacklist candidate. Do not interact.</p>
              </div>

            </CardContent>
          </Card>

          <Alert>
            <Shield className="h-4 w-4" />
            <AlertTitle>Data Transparency</AlertTitle>
            <AlertDescription>
              Scores reflect currently available public data. Protocols with limited public information will score lower even if legitimate —
              this is intentional. Unverifiable protocols carry inherently higher risk. Always do your own research before committing funds.
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </div>
  );
}
