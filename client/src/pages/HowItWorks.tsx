import { Shield, TrendingUp, AlertTriangle, CheckCircle, Info, Target, Lock, Eye } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function HowItWorks() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4 pb-8 border-b">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary via-accent to-primary rounded-xl mb-4">
          <Shield className="w-10 h-10 text-primary-foreground" />
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
          How DeFi JERUSALEM Works
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Understanding our dual-scoring security system that protects you from crypto scams while avoiding false positives on legitimate protocols.
        </p>
      </div>

      {/* Overview */}
      <Alert className="border-primary/20 bg-primary/5">
        <Info className="h-5 w-5 text-primary" />
        <AlertTitle className="text-lg font-semibold">The Core Concept</AlertTitle>
        <AlertDescription className="text-base mt-2">
          DeFi JERUSALEM uses a <strong>dual-scoring system</strong> that calculates both a <strong>Trust Score</strong> (how legitimate a protocol is) 
          and a <strong>Scam Score</strong> (how many red flags it has), then combines them to determine safety. This prevents false alarms on 
          established protocols while catching new scams instantly.
        </AlertDescription>
      </Alert>

      {/* Main Content Tabs */}
      <Tabs defaultValue="trust-score" className="space-y-6">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 h-auto p-2 gap-2 bg-card border">
          <TabsTrigger 
            value="trust-score" 
            data-testid="tab-trust-score"
            className="py-4 text-base font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover-elevate"
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            Trust Score
          </TabsTrigger>
          <TabsTrigger 
            value="scam-score" 
            data-testid="tab-scam-score"
            className="py-4 text-base font-semibold data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground hover-elevate"
          >
            <AlertTriangle className="w-5 h-5 mr-2" />
            Scam Score
          </TabsTrigger>
          <TabsTrigger 
            value="calculation" 
            data-testid="tab-calculation"
            className="py-4 text-base font-semibold data-[state=active]:bg-accent data-[state=active]:text-accent-foreground hover-elevate"
          >
            <Target className="w-5 h-5 mr-2" />
            Calculation
          </TabsTrigger>
          <TabsTrigger 
            value="examples" 
            data-testid="tab-examples"
            className="py-4 text-base font-semibold data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground hover-elevate"
          >
            <Eye className="w-5 h-5 mr-2" />
            Examples
          </TabsTrigger>
        </TabsList>

        {/* Trust Score Tab */}
        <TabsContent value="trust-score" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                Trust Score (Verification Score)
              </CardTitle>
              <CardDescription>
                Measures how legitimate and established a protocol is. Higher = More Trustworthy
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Factor</TableHead>
                      <TableHead>Points</TableHead>
                      <TableHead>Criteria</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-semibold">Protocol Age</TableCell>
                      <TableCell><Badge className="bg-green-500/20 text-green-500">+50</Badge></TableCell>
                      <TableCell>Protocol exists &gt; 365 days</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell></TableCell>
                      <TableCell><Badge className="bg-green-500/20 text-green-500">+30</Badge></TableCell>
                      <TableCell>Protocol exists &gt; 180 days</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell></TableCell>
                      <TableCell><Badge className="bg-green-500/20 text-green-500">+15</Badge></TableCell>
                      <TableCell>Protocol exists &gt; 90 days</TableCell>
                    </TableRow>
                    <TableRow className="border-t">
                      <TableCell className="font-semibold">TVL (Total Value Locked)</TableCell>
                      <TableCell><Badge className="bg-green-500/20 text-green-500">+40</Badge></TableCell>
                      <TableCell>TVL &gt; $100M</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell></TableCell>
                      <TableCell><Badge className="bg-green-500/20 text-green-500">+25</Badge></TableCell>
                      <TableCell>TVL &gt; $10M</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell></TableCell>
                      <TableCell><Badge className="bg-green-500/20 text-green-500">+10</Badge></TableCell>
                      <TableCell>TVL &gt; $1M</TableCell>
                    </TableRow>
                    <TableRow className="border-t">
                      <TableCell className="font-semibold">Social Verification</TableCell>
                      <TableCell><Badge className="bg-green-500/20 text-green-500">+20</Badge></TableCell>
                      <TableCell>Has official Twitter account</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell></TableCell>
                      <TableCell><Badge className="bg-green-500/20 text-green-500">+15</Badge></TableCell>
                      <TableCell>Has GitHub repository</TableCell>
                    </TableRow>
                    <TableRow className="border-t">
                      <TableCell className="font-semibold">Security Audits</TableCell>
                      <TableCell><Badge className="bg-green-500/20 text-green-500">+30</Badge></TableCell>
                      <TableCell>Audited by CertiK, Quantstamp, etc.</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <Alert className="border-green-500/20 bg-green-500/5">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertTitle>Example: Established Protocol</AlertTitle>
                <AlertDescription>
                  <strong>Aave</strong> would score: +50 (age) + +40 (TVL $5B+) + +20 (Twitter) + +15 (GitHub) + +30 (audits) = <strong>155 Trust Score</strong>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scam Score Tab */}
        <TabsContent value="scam-score" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                Scam Score (Threat Score)
              </CardTitle>
              <CardDescription>
                Measures how many red flags a protocol has. Higher = More Dangerous
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Badge variant="destructive">CRITICAL</Badge>
                  Instant Blacklist Threats (80-100 points)
                </h3>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Threat Type</TableHead>
                        <TableHead>Points</TableHead>
                        <TableHead>What It Detects</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">SCAM_PATTERN</TableCell>
                        <TableCell><Badge variant="destructive">+100</Badge></TableCell>
                        <TableCell>Keywords: "drain", "claimer", "unlimited-approval"</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">KNOWN_SCAM</TableCell>
                        <TableCell><Badge variant="destructive">+95</Badge></TableCell>
                        <TableCell>"Double your crypto", "free ETH airdrop"</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">BACKDOOR_FUNCTIONS</TableCell>
                        <TableCell><Badge variant="destructive">+95</Badge></TableCell>
                        <TableCell>Admin functions that can steal funds</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">IMPOSTER</TableCell>
                        <TableCell><Badge variant="destructive">+90</Badge></TableCell>
                        <TableCell>Typosquatting: "Unisvvap" instead of "Uniswap"</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">PRIVATE_KEY_PHISHING</TableCell>
                        <TableCell><Badge variant="destructive">+90</Badge></TableCell>
                        <TableCell>Asks for seed phrase or private keys</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">MALICIOUS_TLD</TableCell>
                        <TableCell><Badge variant="destructive">+80</Badge></TableCell>
                        <TableCell>Scam domains: .lol, .tk, .ml, .ga, .cf</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Badge className="bg-orange-500 text-white">HIGH</Badge>
                  High-Risk Threats (40-70 points)
                </h3>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Threat Type</TableHead>
                        <TableHead>Points</TableHead>
                        <TableHead>What It Detects</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">RUG_PULL_RISK</TableCell>
                        <TableCell><Badge className="bg-orange-500 text-white">+70</Badge></TableCell>
                        <TableCell>"Emergency withdraw", "owner can mint"</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">HONEYPOT</TableCell>
                        <TableCell><Badge className="bg-orange-500 text-white">+65</Badge></TableCell>
                        <TableCell>Can't sell tokens, anti-dump mechanisms</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">SOCIAL_ENGINEERING</TableCell>
                        <TableCell><Badge className="bg-orange-500 text-white">+70</Badge></TableCell>
                        <TableCell>Fake support, customer service DMs</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">NO_TIMELOCK</TableCell>
                        <TableCell><Badge className="bg-orange-500 text-white">+50</Badge></TableCell>
                        <TableCell>Upgradeable without delays</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Badge className="bg-yellow-500 text-black">MEDIUM</Badge>
                  Medium-Risk Threats (15-35 points)
                </h3>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Threat Type</TableHead>
                        <TableHead>Points</TableHead>
                        <TableHead>What It Detects</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">UNVERIFIED_CONTRACT</TableCell>
                        <TableCell><Badge className="bg-yellow-500 text-black">+35</Badge></TableCell>
                        <TableCell>Contract not verified on Etherscan</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">NO_AUDIT</TableCell>
                        <TableCell><Badge className="bg-yellow-500 text-black">+30</Badge></TableCell>
                        <TableCell>No security audit from reputable firms</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">ANONYMOUS_TEAM</TableCell>
                        <TableCell><Badge className="bg-yellow-500 text-black">+25</Badge></TableCell>
                        <TableCell>No known team members</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">WHALE_CONCENTRATION</TableCell>
                        <TableCell><Badge className="bg-yellow-500 text-black">+20</Badge></TableCell>
                        <TableCell>Few wallets control most tokens</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>

              <Alert className="border-destructive/20 bg-destructive/5">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <AlertTitle>29 Threat Categories Monitored</AlertTitle>
                <AlertDescription>
                  Our system continuously scans for wallet drainers, phishing, rug pulls, honeypots, backdoors, social engineering, 
                  and 23+ other attack vectors across 126+ blockchain chains.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Calculation Tab */}
        <TabsContent value="calculation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Final Score Calculation
              </CardTitle>
              <CardDescription>
                How we combine Trust Score and Scam Score to determine protocol safety
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="bg-muted/50 p-6 rounded-lg space-y-4">
                  <h3 className="text-lg font-semibold">Step 1: Calculate Raw Scam Score</h3>
                  <p className="text-muted-foreground">Add up all detected threat points:</p>
                  <div className="bg-background p-4 rounded font-mono text-sm">
                    Raw Scam Score = Sum of all threat points
                  </div>
                </div>

                <div className="bg-muted/50 p-6 rounded-lg space-y-4">
                  <h3 className="text-lg font-semibold">Step 2: Apply Trust Score Reduction</h3>
                  <p className="text-muted-foreground">Subtract trust points from scam points:</p>
                  <div className="bg-background p-4 rounded font-mono text-sm">
                    Final Score = Raw Scam Score - Trust Score<br />
                    (Minimum: 0, can't go negative)
                  </div>
                </div>

                <div className="bg-muted/50 p-6 rounded-lg space-y-4">
                  <h3 className="text-lg font-semibold">Step 3: Determine Severity</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded">
                      <Badge variant="destructive">CRITICAL</Badge>
                      <span className="font-mono">Score ≥ 80</span>
                      <span className="text-sm text-muted-foreground ml-auto">Auto-Blacklisted</span>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-orange-500/10 rounded">
                      <Badge className="bg-orange-500 text-white">HIGH</Badge>
                      <span className="font-mono">Score ≥ 50</span>
                      <span className="text-sm text-muted-foreground ml-auto">Manual Review Required</span>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-yellow-500/10 rounded">
                      <Badge className="bg-yellow-500 text-black">MEDIUM</Badge>
                      <span className="font-mono">Score ≥ 25</span>
                      <span className="text-sm text-muted-foreground ml-auto">Warning Shown</span>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-green-500/10 rounded">
                      <Badge className="bg-green-500 text-white">LOW</Badge>
                      <span className="font-mono">Score &lt; 25</span>
                      <span className="text-sm text-muted-foreground ml-auto">Safe to Use</span>
                    </div>
                  </div>
                </div>

                <div className="bg-primary/5 border border-primary/20 p-6 rounded-lg space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Lock className="w-5 h-5 text-primary" />
                    Step 4: Legitimacy Backstop
                  </h3>
                  <p className="text-muted-foreground">
                    If a protocol has <strong>high trust signals</strong> but still scores CRITICAL, we prevent auto-blacklisting:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-sm">
                    <li>Trust Score ≥ 70, OR</li>
                    <li>TVL ≥ $5M, OR</li>
                    <li>2+ security audits</li>
                  </ul>
                  <div className="bg-background p-4 rounded">
                    <p className="font-semibold text-primary">→ Downgrade to HIGH (manual review instead of auto-blacklist)</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    This prevents false positives on legitimate protocols like Morpho, Aavegotchi, and wrapped assets.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Examples Tab */}
        <TabsContent value="examples" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Scam Example */}
            <Card className="border-destructive/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="w-5 h-5" />
                  Example 1: Scam Protocol
                </CardTitle>
                <CardDescription>"FREE-AAVE-CLAIM.lol"</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-destructive">Scam Points:</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• MALICIOUS_TLD (.lol): <Badge variant="destructive">+80</Badge></li>
                    <li>• KNOWN_SCAM ("free" + "claim"): <Badge variant="destructive">+95</Badge></li>
                    <li>• IMPOSTER (fake Aave): <Badge variant="destructive">+90</Badge></li>
                  </ul>
                  <p className="font-semibold">Total: <Badge variant="destructive">265 points</Badge></p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-green-500">Trust Points:</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Age: 0 (new protocol)</li>
                    <li>• TVL: $0</li>
                    <li>• Audits: None</li>
                  </ul>
                  <p className="font-semibold">Total: <Badge>0 points</Badge></p>
                </div>

                <div className="border-t pt-4">
                  <p className="font-mono text-sm">Final Score: 265 - 0 = <strong className="text-destructive">265</strong></p>
                  <Badge variant="destructive" className="mt-2">CRITICAL - INSTANT BLACKLIST ❌</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Legitimate Example */}
            <Card className="border-green-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-500">
                  <CheckCircle className="w-5 h-5" />
                  Example 2: Legitimate Protocol
                </CardTitle>
                <CardDescription>"Morpho Aave Optimizer"</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-destructive">Scam Points:</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• IMPOSTER (contains "Aave"): <Badge variant="destructive">+90</Badge></li>
                  </ul>
                  <p className="font-semibold">Total: <Badge variant="destructive">90 points</Badge></p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-green-500">Trust Points:</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Age (2+ years): <Badge className="bg-green-500/20 text-green-500">+50</Badge></li>
                    <li>• TVL ($500M): <Badge className="bg-green-500/20 text-green-500">+40</Badge></li>
                    <li>• Twitter: <Badge className="bg-green-500/20 text-green-500">+20</Badge></li>
                    <li>• GitHub: <Badge className="bg-green-500/20 text-green-500">+15</Badge></li>
                    <li>• Audited: <Badge className="bg-green-500/20 text-green-500">+30</Badge></li>
                  </ul>
                  <p className="font-semibold">Total: <Badge className="bg-green-500/20 text-green-500">155 points</Badge></p>
                </div>

                <div className="border-t pt-4">
                  <p className="font-mono text-sm">Final Score: 90 - 155 = <strong className="text-green-500">0</strong></p>
                  <Badge className="bg-green-500/20 text-green-500 mt-2">LOW - SAFE TO USE ✅</Badge>
                  <p className="text-xs text-muted-foreground mt-2">Trust Score cancels out false positive!</p>
                </div>
              </CardContent>
            </Card>

            {/* Risky but Established Example */}
            <Card className="border-yellow-500/20 lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-500">
                  <AlertTriangle className="w-5 h-5" />
                  Example 3: High-Risk but Established
                </CardTitle>
                <CardDescription>"Unaudited DeFi Protocol" with $10M TVL</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-6 lg:grid-cols-3">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-destructive">Scam Points:</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• NO_AUDIT: <Badge className="bg-yellow-500 text-black">+30</Badge></li>
                      <li>• UNVERIFIED_CONTRACT: <Badge className="bg-yellow-500 text-black">+35</Badge></li>
                      <li>• CENTRALIZED_KEYS: <Badge className="bg-orange-500 text-white">+45</Badge></li>
                    </ul>
                    <p className="font-semibold">Total: <Badge variant="destructive">110 points</Badge></p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-green-500">Trust Points:</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• TVL ($10M): <Badge className="bg-green-500/20 text-green-500">+25</Badge></li>
                      <li>• Twitter: <Badge className="bg-green-500/20 text-green-500">+20</Badge></li>
                      <li>• Age (6 months): <Badge className="bg-green-500/20 text-green-500">+30</Badge></li>
                    </ul>
                    <p className="font-semibold">Total: <Badge className="bg-green-500/20 text-green-500">75 points</Badge></p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold">Result:</h4>
                    <p className="font-mono text-sm">110 - 75 = <strong className="text-yellow-500">35</strong></p>
                    <Badge className="bg-yellow-500/20 text-yellow-500">MEDIUM - WARNING ⚠️</Badge>
                    <p className="text-xs text-muted-foreground mt-2">Risky but not blacklisted. Use with caution.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Advanced Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Advanced Protection Features
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Context-Aware Detection
              </h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>✅ "Morpho Aave" = Legitimate integration (whitelisted)</li>
                <li>❌ "Aavee Finance" = Typosquatting scam</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                TVL-Based Filtering
              </h3>
              <p className="text-sm text-muted-foreground">
                Protocols with TVL &gt; $500K are exempt from UNVERIFIED_CONTRACT, NO_AUDIT, and ANONYMOUS_TEAM checks.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Lock className="w-4 h-4 text-primary" />
                Whitelist System
              </h3>
              <p className="text-sm text-muted-foreground">
                Pre-verified protocols like Uniswap, Aave, Compound get instant Trust Score = ∞, skipping all scam checks.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Eye className="w-4 h-4 text-accent" />
                Multi-Source Verification
              </h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• DeFiLlama: TVL, audit links, metadata</li>
                <li>• CertiK Skynet: Security scores, vulnerabilities</li>
                <li>• Twitter API: Real-time scam detection</li>
                <li>• Blockchain Explorers: Contract verification</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Why It Works */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle>Why This System Works</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
              <div>
                <strong>Prevents False Positives:</strong> Trust Score protects legitimate protocols from being blacklisted
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
              <div>
                <strong>Catches New Scams:</strong> Pattern matching detects novel threats instantly
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
              <div>
                <strong>Adapts to Context:</strong> High-TVL protocols treated differently than new launches
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
              <div>
                <strong>Multi-Layered:</strong> 29 threat categories cover all known attack vectors
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
              <div>
                <strong>Real-Time:</strong> Scans updated weekly + manual scans on demand
              </div>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
