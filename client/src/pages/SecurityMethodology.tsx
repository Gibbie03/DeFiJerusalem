import { useEffect } from 'react';
import { Shield, TrendingUp, AlertTriangle, CheckCircle, Info, Eye, Calculator, Lock, Activity, Users, FileCode, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';

export default function SecurityMethodology() {
  useEffect(() => {
    document.title = 'Security Score Methodology - DFJ v2.3 Scoring System - DeFiJerusalem';
    const desc = 'Full transparency into DeFiJerusalem\'s DFJ v2.3 security scoring system (0–97, higher is safer). Foundation (45 pts) + Active Security (55 pts) − Penalties (30 pts).';
    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (meta) { meta.setAttribute('content', desc); } else { meta = document.createElement('meta'); meta.name = 'description'; meta.content = desc; document.head.appendChild(meta); }
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8">

      {/* Hero */}
      <div className="text-center space-y-4 pb-8 border-b">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary via-accent to-primary rounded-xl mb-4">
          <Shield className="w-10 h-10 text-primary-foreground" />
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
          DFJ v2.3 Security Scoring
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Full transparency into how DeFiJerusalem scores 7,900+ DeFi protocols.{' '}
          <strong className="text-foreground">Higher score = safer protocol.</strong>
        </p>
      </div>

      {/* Core concept */}
      <Alert className="border-primary/20 bg-primary/5">
        <Info className="h-5 w-5 text-primary" />
        <AlertTitle className="text-lg font-semibold">The Core Formula</AlertTitle>
        <AlertDescription className="text-base mt-2 space-y-2">
          <p>
            <code className="font-mono font-bold text-primary">
              DFJ Score = Foundation (0–45) + Active Security (0–55) − Penalties (0–30)
            </code>
            , clamped to <strong>0–97</strong>.
          </p>
          <p className="text-sm text-muted-foreground">
            Scores are <strong>additive</strong> — a protocol earns points for every verified security signal it has.
            Penalties are deducted for detected red flags (honeypots, drainer patterns, typosquatting, etc.).
            Scores reflect currently available public data — protocols with limited public information will score lower
            even if they are legitimate.
          </p>
        </AlertDescription>
      </Alert>

      {/* Score formula visual */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-green-500/30 bg-green-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-green-400 flex items-center gap-2 text-base">
              <Lock className="w-4 h-4" /> Foundation
            </CardTitle>
            <CardDescription>What they built</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-400">0 – 45 pts</p>
            <p className="text-sm text-muted-foreground mt-1">Audits, code history, track record, documentation, governance</p>
          </CardContent>
        </Card>
        <Card className="border-blue-500/30 bg-blue-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-blue-400 flex items-center gap-2 text-base">
              <Activity className="w-4 h-4" /> Active Security
            </CardTitle>
            <CardDescription>How they protect now</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-400">0 – 55 pts</p>
            <p className="text-sm text-muted-foreground mt-1">Infrastructure, incident response, monitoring, economic health, community</p>
          </CardContent>
        </Card>
        <Card className="border-red-500/30 bg-red-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-red-400 flex items-center gap-2 text-base">
              <AlertTriangle className="w-4 h-4" /> Penalties
            </CardTitle>
            <CardDescription>Detected risk signals</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-400">0 – 30 pts</p>
            <p className="text-sm text-muted-foreground mt-1">Subtracted for drainers, honeypots, typosquatting, unverified contracts</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="foundation" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto p-2 gap-2 bg-card border">
          <TabsTrigger value="foundation" className="py-4 text-base font-semibold data-[state=active]:bg-green-600 data-[state=active]:text-white hover-elevate">
            <Lock className="w-4 h-4 mr-2" /> Foundation
          </TabsTrigger>
          <TabsTrigger value="active" className="py-4 text-base font-semibold data-[state=active]:bg-blue-600 data-[state=active]:text-white hover-elevate">
            <Activity className="w-4 h-4 mr-2" /> Active Security
          </TabsTrigger>
          <TabsTrigger value="penalties" className="py-4 text-base font-semibold data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground hover-elevate">
            <AlertTriangle className="w-4 h-4 mr-2" /> Penalties
          </TabsTrigger>
          <TabsTrigger value="examples" className="py-4 text-base font-semibold data-[state=active]:bg-accent data-[state=active]:text-accent-foreground hover-elevate">
            <Eye className="w-4 h-4 mr-2" /> Examples
          </TabsTrigger>
        </TabsList>

        {/* ── FOUNDATION ── */}
        <TabsContent value="foundation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-green-500" />
                Foundation Score (max 45 pts)
              </CardTitle>
              <CardDescription>
                Earned from verifiable, long-term security signals — things the protocol built before today.
                Higher points = more verifiable foundation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* F1 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold flex items-center gap-2"><FileCode className="w-4 h-4 text-green-400" /> F1 · Audit &amp; Verification</p>
                  <Badge className="bg-green-500/20 text-green-400">max 18 pts</Badge>
                </div>
                <Table>
                  <TableHeader><TableRow><TableHead>Signal</TableHead><TableHead>Points</TableHead></TableRow></TableHeader>
                  <TableBody>
                    <TableRow><TableCell>1+ professional audits (CertiK, Trail of Bits, OpenZeppelin, etc.)</TableCell><TableCell><Badge className="bg-green-500/20 text-green-400">+10</Badge></TableCell></TableRow>
                    <TableRow><TableCell>Multiple audits from different top firms</TableCell><TableCell><Badge className="bg-green-500/20 text-green-400">+5</Badge></TableCell></TableRow>
                    <TableRow><TableCell>Verified contracts on-chain (source published on explorer)</TableCell><TableCell><Badge className="bg-green-500/20 text-green-400">+3</Badge></TableCell></TableRow>
                  </TableBody>
                </Table>
              </div>
              {/* F2 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold flex items-center gap-2"><FileCode className="w-4 h-4 text-green-400" /> F2 · Code &amp; Contract History</p>
                  <Badge className="bg-green-500/20 text-green-400">max 12 pts</Badge>
                </div>
                <Table>
                  <TableHeader><TableRow><TableHead>Signal</TableHead><TableHead>Points</TableHead></TableRow></TableHeader>
                  <TableBody>
                    <TableRow><TableCell>Open-source code on GitHub</TableCell><TableCell><Badge className="bg-green-500/20 text-green-400">+6</Badge></TableCell></TableRow>
                    <TableRow><TableCell>Active public repository (recent commits)</TableCell><TableCell><Badge className="bg-green-500/20 text-green-400">+4</Badge></TableCell></TableRow>
                    <TableRow><TableCell>Formal specification / documented architecture</TableCell><TableCell><Badge className="bg-green-500/20 text-green-400">+2</Badge></TableCell></TableRow>
                  </TableBody>
                </Table>
              </div>
              {/* F3 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold flex items-center gap-2"><Clock className="w-4 h-4 text-green-400" /> F3 · Track Record</p>
                  <Badge className="bg-green-500/20 text-green-400">max 10 pts</Badge>
                </div>
                <Table>
                  <TableHeader><TableRow><TableHead>Signal</TableHead><TableHead>Points</TableHead></TableRow></TableHeader>
                  <TableBody>
                    <TableRow><TableCell>Protocol live &gt; 1 year without major exploit</TableCell><TableCell><Badge className="bg-green-500/20 text-green-400">+6</Badge></TableCell></TableRow>
                    <TableRow><TableCell>Protocol live &gt; 6 months</TableCell><TableCell><Badge className="bg-green-500/20 text-green-400">+3</Badge></TableCell></TableRow>
                    <TableRow><TableCell>Survived a market crisis / black swan without failure</TableCell><TableCell><Badge className="bg-green-500/20 text-green-400">+1</Badge></TableCell></TableRow>
                  </TableBody>
                </Table>
              </div>
              {/* F4 + F5 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold">F4 · Documentation</p>
                    <Badge className="bg-green-500/20 text-green-400">max 3 pts</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">Public whitepaper, technical docs, and risk disclosures available.</p>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold">F5 · Historical Governance</p>
                    <Badge className="bg-green-500/20 text-green-400">max 2 pts</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">Governance proposals executed on-chain with community participation.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── ACTIVE SECURITY ── */}
        <TabsContent value="active" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-500" />
                Active Security Score (max 55 pts)
              </CardTitle>
              <CardDescription>
                Earned from ongoing security posture — what the protocol is doing right now to protect users.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pillar</TableHead>
                      <TableHead>Max</TableHead>
                      <TableHead>Key Signals</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-semibold">A1 · Security Infrastructure</TableCell>
                      <TableCell><Badge className="bg-blue-500/20 text-blue-400">22 pts</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">Multisig treasury (9 pts), timelock on upgrades (8 pts), open-source (3 pts), audited flag (2 pts)</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-semibold">A2 · Incident Response</TableCell>
                      <TableCell><Badge className="bg-blue-500/20 text-blue-400">15 pts</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">Active bug bounty program (7 pts + 3 pts for size), community security channel (3 pts), multiple audit firms used (2 pts)</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-semibold">A3 · Proactive Monitoring</TableCell>
                      <TableCell><Badge className="bg-blue-500/20 text-blue-400">7 pts</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">On-chain monitoring tools, anomaly detection, public incident dashboard</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-semibold">A4 · Economic Health</TableCell>
                      <TableCell><Badge className="bg-blue-500/20 text-blue-400">6 pts</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">TVL tier (higher TVL = more real user trust), multi-chain deployment, category risk adjustment</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-semibold">A5 · Live Governance</TableCell>
                      <TableCell><Badge className="bg-blue-500/20 text-blue-400">3 pts</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">Active multisig (1), active Twitter/Discord (1), maintained public website (1)</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-semibold">A6 · Ongoing Vigilance</TableCell>
                      <TableCell><Badge className="bg-blue-500/20 text-blue-400">2 pts</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">Regular security updates published, coordinated disclosure process</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              <Alert className="border-blue-500/20 bg-blue-500/5">
                <Info className="h-4 w-4 text-blue-400" />
                <AlertDescription>
                  Active Security carries more weight than Foundation (55 vs 45 pts) because current security posture matters more than historical signals — a protocol can have old audits but no active monitoring.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── PENALTIES ── */}
        <TabsContent value="penalties" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Risk Penalties (max −30 pts)
              </CardTitle>
              <CardDescription>
                Detected threat signals <strong>subtracted</strong> from the combined Foundation + Active score.
                Penalties are capped at 30 pts — the floor is 0, never negative.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Risk Signal</TableHead>
                      <TableHead>Deduction</TableHead>
                      <TableHead>What It Detects</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-semibold">Critical keywords in name/description</TableCell>
                      <TableCell><Badge variant="destructive">−15 each</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">Words like "drainer", "honeypot", "rugpull", "scam" in protocol metadata</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-semibold">GoPlus honeypot flag</TableCell>
                      <TableCell><Badge variant="destructive">−15</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">GoPlus on-chain analysis detects buy-but-cannot-sell mechanics</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-semibold">High-risk keywords</TableCell>
                      <TableCell><Badge className="bg-orange-500/20 text-orange-400">−7 each</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">"clone", "giveaway", "1000x", "moonshot" signals in protocol content</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-semibold">Typosquatting a major protocol</TableCell>
                      <TableCell><Badge className="bg-orange-500/20 text-orange-400">−5</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">Name closely resembles Uniswap, Aave, Lido, Curve, etc. (e.g. "Unisvvap")</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-semibold">Unverified contract source</TableCell>
                      <TableCell><Badge className="bg-orange-500/20 text-orange-400">−5</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">Contract not verified on block explorer (source code hidden)</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-semibold">Proxy with no source code</TableCell>
                      <TableCell><Badge className="bg-orange-500/20 text-orange-400">−8</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">Upgradeable proxy where the implementation is unverified</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-semibold">AI-detected patterns</TableCell>
                      <TableCell><Badge className="bg-yellow-500/20 text-yellow-400">−⌈confidence × 5⌉</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">ML classifier flags phishing, impersonation, or social engineering patterns</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-semibold">Medium-risk keywords</TableCell>
                      <TableCell><Badge className="bg-yellow-500/20 text-yellow-400">−3 each</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">"unaudited", "experimental" explicitly stated in protocol docs</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              <Alert className="border-amber-500/20 bg-amber-500/5">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                <AlertTitle>Penalty cap: −30 pts</AlertTitle>
                <AlertDescription>
                  Total penalties are capped at 30. A protocol cannot be pushed below 0 by penalties alone —
                  a zero score means a protocol has no positive signals <em>and</em> has hit the penalty cap.
                  The final score is always <code className="font-mono">clamp(Foundation + Active − Penalties, 0, 97)</code>.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── EXAMPLES ── */}
        <TabsContent value="examples" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" />
                Severity Thresholds (Higher = Safer)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: 'SAFE',        range: '80 – 97', bar: 90,  bg: 'bg-green-500/10',  text: 'text-green-400',  desc: 'Extensively audited, active security infrastructure, proven track record.' },
                { label: 'LOW RISK',    range: '65 – 79', bar: 72,  bg: 'bg-blue-500/10',   text: 'text-blue-400',   desc: 'Good security posture, some signals missing or unverified.' },
                { label: 'MEDIUM RISK', range: '50 – 64', bar: 57,  bg: 'bg-yellow-500/10', text: 'text-yellow-400', desc: 'Mixed signals — legitimate but limited public verifiability.' },
                { label: 'HIGH RISK',   range: '30 – 49', bar: 40,  bg: 'bg-orange-500/10', text: 'text-orange-400', desc: 'Few positive signals and/or active risk flags detected.' },
                { label: 'CRITICAL',    range: '0 – 29',  bar: 15,  bg: 'bg-red-500/10',    text: 'text-red-400',    desc: 'Significant threat signals or near-zero verifiable security. Auto-blacklist candidate.' },
              ].map(({ label, range, bar, bg, text, desc }) => (
                <div key={label} className={`flex items-center gap-4 p-3 ${bg} rounded-lg`}>
                  <div className="w-24 shrink-0">
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
                <Calculator className="w-5 h-5 text-primary" />
                Worked Examples
              </CardTitle>
              <CardDescription>How the formula produces real scores</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

              {/* Example 1 — Uniswap */}
              <div className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold">Uniswap V3 — established DEX</h4>
                  <Badge className="bg-green-500/20 text-green-400">SAFE · 93</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="font-semibold text-green-400 mb-1">Foundation: 43 / 45</p>
                    <ul className="space-y-0.5 text-muted-foreground">
                      <li>✓ 4 audits from top firms (+18)</li>
                      <li>✓ Open-source, active repo (+12)</li>
                      <li>✓ 4+ years live, no exploit (+10)</li>
                      <li>✓ Full docs + on-chain gov (+3)</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-blue-400 mb-1">Active: 52 / 55</p>
                    <ul className="space-y-0.5 text-muted-foreground">
                      <li>✓ Multisig + timelock (+17)</li>
                      <li>✓ Large bug bounty program (+10)</li>
                      <li>✓ On-chain monitoring (+7)</li>
                      <li>✓ TVL &gt; $5B, multi-chain (+8)</li>
                      <li>✓ Active Twitter + website (+2)</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-red-400 mb-1">Penalties: −2</p>
                    <ul className="space-y-0.5 text-muted-foreground">
                      <li>⚠ Pseudonymous core team (AI pattern −2)</li>
                    </ul>
                  </div>
                </div>
                <div className="pt-3 border-t">
                  <p className="font-mono text-sm">43 + 52 − 2 = <span className="text-green-400 font-bold">93</span> → SAFE</p>
                </div>
              </div>

              {/* Example 2 — New protocol */}
              <div className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold">New Yield Protocol — 6 months old</h4>
                  <Badge className="bg-yellow-500/20 text-yellow-400">MEDIUM · 55</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="font-semibold text-green-400 mb-1">Foundation: 25 / 45</p>
                    <ul className="space-y-0.5 text-muted-foreground">
                      <li>✓ 1 audit (+10)</li>
                      <li>✓ Open-source (+6)</li>
                      <li>✓ 6 months live (+3)</li>
                      <li>✗ No formal docs or governance</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-blue-400 mb-1">Active: 33 / 55</p>
                    <ul className="space-y-0.5 text-muted-foreground">
                      <li>✓ Timelock on upgrades (+8)</li>
                      <li>✓ Small bug bounty (+7)</li>
                      <li>✓ TVL $15M (+5)</li>
                      <li>✓ Active Twitter (+1)</li>
                      <li>✗ No multisig, no monitoring</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-red-400 mb-1">Penalties: −3</p>
                    <ul className="space-y-0.5 text-muted-foreground">
                      <li>⚠ "experimental" in docs (−3)</li>
                    </ul>
                  </div>
                </div>
                <div className="pt-3 border-t">
                  <p className="font-mono text-sm">25 + 33 − 3 = <span className="text-yellow-400 font-bold">55</span> → MEDIUM RISK</p>
                </div>
              </div>

              {/* Example 3 — Scam */}
              <div className="p-4 border border-red-500/30 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold">Suspected Drainer — no legitimate signals</h4>
                  <Badge variant="destructive">CRITICAL · 0</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="font-semibold text-green-400 mb-1">Foundation: 0 / 45</p>
                    <ul className="space-y-0.5 text-muted-foreground"><li>✗ No audits, no source, no history</li></ul>
                  </div>
                  <div>
                    <p className="font-semibold text-blue-400 mb-1">Active: 0 / 55</p>
                    <ul className="space-y-0.5 text-muted-foreground"><li>✗ No infrastructure or community signals</li></ul>
                  </div>
                  <div>
                    <p className="font-semibold text-red-400 mb-1">Penalties: −30 (cap)</p>
                    <ul className="space-y-0.5 text-muted-foreground">
                      <li>🚨 "drainer" keyword (−15)</li>
                      <li>🚨 GoPlus honeypot (−15)</li>
                      <li>⚠ Typosquat (−5) → capped at 30</li>
                    </ul>
                  </div>
                </div>
                <div className="pt-3 border-t">
                  <p className="font-mono text-sm">0 + 0 − 30 = −30 → <span className="text-red-400 font-bold">clamp → 0</span> → CRITICAL</p>
                  <p className="text-sm text-destructive mt-2 font-semibold">⛔ Auto-blacklist candidate. Do not interact.</p>
                </div>
              </div>

            </CardContent>
          </Card>

          <Alert>
            <Shield className="h-4 w-4" />
            <AlertTitle>Data Transparency</AlertTitle>
            <AlertDescription>
              Scores reflect currently available public data. A legitimate protocol with no public audit, no GitHub, and a new domain will score low — this is intentional.
              Unverifiable protocols carry inherently higher risk. Always do your own research before committing funds.
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </div>
  );
}
