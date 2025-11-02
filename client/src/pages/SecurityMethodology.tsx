import { useEffect } from 'react';
import { Shield, TrendingUp, AlertTriangle, CheckCircle, Info, Target, Lock, Eye, Calculator } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';

export default function SecurityMethodology() {
  // SEO meta tags
  useEffect(() => {
    document.title = 'Security Score Methodology - Unified 0-100 Scoring System - DeFiJerusalem';
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Full transparency into DeFiJerusalem\'s unified security scoring system (0-100, lower is safer). Learn how we detect 38+ threat categories and analyze 6,651+ DeFi protocols across 126+ blockchains with AI-powered threat intelligence.');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = 'Full transparency into DeFiJerusalem\'s unified security scoring system (0-100, lower is safer). Learn how we detect 38+ threat categories and analyze 6,651+ DeFi protocols across 126+ blockchains with AI-powered threat intelligence.';
      document.head.appendChild(meta);
    }

    const ogTitle = document.querySelector('meta[property="og:title"]') || document.createElement('meta');
    ogTitle.setAttribute('property', 'og:title');
    ogTitle.setAttribute('content', 'Security Methodology - Unified Scoring (Lower = Safer) - DeFiJerusalem');
    if (!ogTitle.parentElement) document.head.appendChild(ogTitle);

    const ogDescription = document.querySelector('meta[property="og:description"]') || document.createElement('meta');
    ogDescription.setAttribute('property', 'og:description');
    ogDescription.setAttribute('content', 'Full transparency into DeFiJerusalem\'s unified 0-100 security scoring system where lower scores = safer protocols. Multi-layer analysis: metadata scanning, GoPlus API integration, and AI threat detection across 126+ blockchains.');
    if (!ogDescription.parentElement) document.head.appendChild(ogDescription);
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4 pb-8 border-b">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary via-accent to-primary rounded-xl mb-4">
          <Shield className="w-10 h-10 text-primary-foreground" />
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
          Security Score Methodology
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Full transparency into our unified security scoring system that protects you from crypto scams across 126+ blockchains. Lower scores = safer protocols.
        </p>
      </div>

      {/* Overview */}
      <Alert className="border-primary/20 bg-primary/5">
        <Info className="h-5 w-5 text-primary" />
        <AlertTitle className="text-lg font-semibold">The Core Concept</AlertTitle>
        <AlertDescription className="text-base mt-2">
          JERUSALEM uses a <strong>unified scoring system (0-100)</strong> where <strong>lower scores indicate safer protocols</strong>. 
          We start at 100 (baseline risk) and subtract points for positive indicators like audits, high TVL, verified teams, and GitHub presence. 
          This approach prevents false positives on legitimate protocols while instantly flagging suspicious new projects with scores of 80+.
        </AlertDescription>
      </Alert>

      {/* Main Content Tabs */}
      <Tabs defaultValue="trust-score" className="space-y-6">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 h-auto p-2 gap-2 bg-card border">
          <TabsTrigger 
            value="trust-score" 
            data-testid="tab-positive-indicators"
            className="py-4 text-base font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover-elevate"
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            Positive Indicators
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
            <Calculator className="w-5 h-5 mr-2" />
            Final Calculation
          </TabsTrigger>
          <TabsTrigger 
            value="examples" 
            data-testid="tab-examples"
            className="py-4 text-base font-semibold data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground hover-elevate"
          >
            <Eye className="w-5 h-5 mr-2" />
            Real Examples
          </TabsTrigger>
        </TabsList>

        {/* Trust Score Tab */}
        <TabsContent value="trust-score" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                Positive Indicators (Score Reductions)
              </CardTitle>
              <CardDescription>
                Legitimate characteristics that reduce the security risk score. Each indicator subtracts points from the baseline 100.
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
                      <TableCell className="font-semibold">Security Audits</TableCell>
                      <TableCell><Badge className="bg-green-500/20 text-green-700 dark:text-green-400">-25</Badge></TableCell>
                      <TableCell>1+ professional audits from top firms (CertiK, Trail of Bits, etc.)</TableCell>
                    </TableRow>
                    <TableRow className="border-t">
                      <TableCell className="font-semibold">High TVL</TableCell>
                      <TableCell><Badge className="bg-green-500/20 text-green-700 dark:text-green-400">-25</Badge></TableCell>
                      <TableCell>TVL {'>'} $10M indicates real user trust</TableCell>
                    </TableRow>
                    <TableRow className="border-t">
                      <TableCell className="font-semibold">Verified Team</TableCell>
                      <TableCell><Badge className="bg-green-500/20 text-green-700 dark:text-green-400">-25</Badge></TableCell>
                      <TableCell>Active Twitter/Discord with verified identity</TableCell>
                    </TableRow>
                    <TableRow className="border-t">
                      <TableCell className="font-semibold">GitHub Verified</TableCell>
                      <TableCell><Badge className="bg-green-500/20 text-green-700 dark:text-green-400">-15</Badge></TableCell>
                      <TableCell>Open-source code on GitHub</TableCell>
                    </TableRow>
                    <TableRow className="border-t">
                      <TableCell className="font-semibold">Established Protocol</TableCell>
                      <TableCell><Badge className="bg-green-500/20 text-green-700 dark:text-green-400">-10</Badge></TableCell>
                      <TableCell>Protocol exists {'>'} 1 year</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm font-semibold mb-2">Maximum Score Reduction: -100 points</p>
                <p className="text-sm text-muted-foreground">
                  Protocols like Uniswap, Aave, Lido, and Curve typically achieve a score of 0-5 (SAFE) due to having all positive indicators: audits, high TVL, verified teams, and proven track record.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scam Score Tab */}
        <TabsContent value="scam-score" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Scam Score (Red Flags)
              </CardTitle>
              <CardDescription>
                Measures suspicious activities and scam indicators. Higher = More Dangerous
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Red Flag Category</TableHead>
                      <TableHead>Points</TableHead>
                      <TableHead>What It Detects</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-semibold">2025 Wallet Drainers</TableCell>
                      <TableCell><Badge variant="destructive">+100</Badge></TableCell>
                      <TableCell>Pink Drainer, Angel Drainer, CLINKSINK operations</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-semibold">EIP-2612 Permit Exploits</TableCell>
                      <TableCell><Badge variant="destructive">+95</Badge></TableCell>
                      <TableCell>Off-chain signature attacks bypassing user approval</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-semibold">Approval Phishing</TableCell>
                      <TableCell><Badge variant="destructive">+90</Badge></TableCell>
                      <TableCell>Malicious approval requests draining user funds</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-semibold">Honeypot Contract</TableCell>
                      <TableCell><Badge variant="destructive">+85</Badge></TableCell>
                      <TableCell>Users can buy but cannot sell tokens</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-semibold">Hidden Owner</TableCell>
                      <TableCell><Badge variant="destructive">+80</Badge></TableCell>
                      <TableCell>Contract owner can modify balances or pause trading</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-semibold">Rug Pull Indicators</TableCell>
                      <TableCell><Badge variant="destructive">+75</Badge></TableCell>
                      <TableCell>Liquidity removal, locked liquidity expiring soon</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-semibold">CREATE2 Evasion</TableCell>
                      <TableCell><Badge variant="destructive">+70</Badge></TableCell>
                      <TableCell>Contract address manipulation to evade blacklists</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-semibold">Solana-Specific Drains</TableCell>
                      <TableCell><Badge variant="destructive">+65</Badge></TableCell>
                      <TableCell>Solana transaction replay attacks and PDAs</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-semibold">High Tax ({'>'}20%)</TableCell>
                      <TableCell><Badge className="bg-orange-500/20 text-orange-700 dark:text-orange-400">+60</Badge></TableCell>
                      <TableCell>Excessive buy/sell tax discouraging trading</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-semibold">Blacklisted Holder</TableCell>
                      <TableCell><Badge className="bg-orange-500/20 text-orange-700 dark:text-orange-400">+55</Badge></TableCell>
                      <TableCell>Known scammer addresses hold tokens</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-semibold">Proxy Contract</TableCell>
                      <TableCell><Badge className="bg-orange-500/20 text-orange-700 dark:text-orange-400">+50</Badge></TableCell>
                      <TableCell>Upgradeable contract allowing code changes</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-semibold">Unverified Contract</TableCell>
                      <TableCell><Badge className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-400">+45</Badge></TableCell>
                      <TableCell>Source code not published on blockchain explorer</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-semibold">No Audit</TableCell>
                      <TableCell><Badge className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-400">+40</Badge></TableCell>
                      <TableCell>No third-party security audit performed</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-semibold">Anonymous Team</TableCell>
                      <TableCell><Badge className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-400">+35</Badge></TableCell>
                      <TableCell>No known team members or public identities</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-semibold">Domain Age {'<'} 30 days</TableCell>
                      <TableCell><Badge className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-400">+30</Badge></TableCell>
                      <TableCell>Newly registered domain (common for scams)</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              <div className="bg-destructive/10 p-4 rounded-lg">
                <p className="text-sm font-semibold mb-2 text-destructive">Maximum Scam Score: 1000+ points</p>
                <p className="text-sm text-muted-foreground">
                  Protocols with multiple red flags can accumulate very high scam scores. Even one CRITICAL red flag (100 points) triggers immediate blacklisting.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Calculation Tab */}
        <TabsContent value="calculation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-primary" />
                Final Security Score Calculation
              </CardTitle>
              <CardDescription>
                How we combine Trust Score and Scam Score into a 0-100 safety rating
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted/50 p-6 rounded-lg space-y-4">
                <div className="text-center mb-6">
                  <p className="text-3xl font-bold text-primary mb-2">Security Score = 100 - (Scam Score - Trust Score/2)</p>
                  <p className="text-sm text-muted-foreground">The higher the Trust Score, the more we forgive minor red flags</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-primary font-bold">1</span>
                    </div>
                    <div>
                      <p className="font-semibold">Calculate Trust Score</p>
                      <p className="text-sm text-muted-foreground">Sum all positive verification factors (age, TVL, audits, etc.)</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-primary font-bold">2</span>
                    </div>
                    <div>
                      <p className="font-semibold">Calculate Scam Score</p>
                      <p className="text-sm text-muted-foreground">Sum all red flags detected (drainers, honeypots, etc.)</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-primary font-bold">3</span>
                    </div>
                    <div>
                      <p className="font-semibold">Apply Trust Offset</p>
                      <p className="text-sm text-muted-foreground">Divide Trust Score by 2 to offset minor red flags for established protocols</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-primary font-bold">4</span>
                    </div>
                    <div>
                      <p className="font-semibold">Calculate Final Score</p>
                      <p className="text-sm text-muted-foreground">Security Score = 100 - (Scam Score - Trust Score/2), capped at 0-100</p>
                    </div>
                  </div>
                </div>
              </div>

              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="text-lg">Severity Classification (Lower = Safer)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg">
                    <div>
                      <p className="font-semibold text-green-700 dark:text-green-400">SAFE</p>
                      <p className="text-sm text-muted-foreground">Score: 0-19</p>
                    </div>
                    <Progress value={10} className="w-24 h-2" />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-blue-500/10 rounded-lg">
                    <div>
                      <p className="font-semibold text-blue-700 dark:text-blue-400">LOW RISK</p>
                      <p className="text-sm text-muted-foreground">Score: 20-39</p>
                    </div>
                    <Progress value={30} className="w-24 h-2" />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-yellow-500/10 rounded-lg">
                    <div>
                      <p className="font-semibold text-yellow-700 dark:text-yellow-400">MEDIUM RISK</p>
                      <p className="text-sm text-muted-foreground">Score: 40-59</p>
                    </div>
                    <Progress value={50} className="w-24 h-2" />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-orange-500/10 rounded-lg">
                    <div>
                      <p className="font-semibold text-orange-700 dark:text-orange-400">HIGH RISK</p>
                      <p className="text-sm text-muted-foreground">Score: 60-79</p>
                    </div>
                    <Progress value={70} className="w-24 h-2" />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-red-500/10 rounded-lg">
                    <div>
                      <p className="font-semibold text-red-700 dark:text-red-400">CRITICAL RISK</p>
                      <p className="text-sm text-muted-foreground">Score: 80-100</p>
                    </div>
                    <Progress value={95} className="w-24 h-2" />
                  </div>
                </CardContent>
              </Card>

              <Alert className="border-destructive/20 bg-destructive/5">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <AlertTitle>Automatic Blacklisting</AlertTitle>
                <AlertDescription>
                  Protocols with Security Score ≥ 80 (CRITICAL RISK) are automatically added to our blacklist and flagged for users.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Examples Tab */}
        <TabsContent value="examples" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" />
                Real-World Examples
              </CardTitle>
              <CardDescription>
                See how our dual-scoring system works in practice
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Example 1: Established Protocol */}
              <div className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold">Example 1: Uniswap V3</h4>
                  <Badge className="bg-green-500/20 text-green-700 dark:text-green-400">SAFE</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-green-600 dark:text-green-400">Trust Score: +215</p>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>✓ Protocol age {'>'} 365 days (+50)</li>
                      <li>✓ TVL {'>'} $100M (+40)</li>
                      <li>✓ 3+ professional audits (+60)</li>
                      <li>✓ High volume (+30)</li>
                      <li>✓ Large user base (+20)</li>
                      <li>✓ Verified contracts (+15)</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-muted-foreground">Scam Score: +35</p>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>⚠ Anonymous core team (+35)</li>
                      <li className="text-xs italic">(Note: Many legitimate DeFi protocols are pseudonymous)</li>
                    </ul>
                  </div>
                </div>
                <div className="pt-3 border-t">
                  <p className="text-sm font-semibold mb-2">Calculation:</p>
                  <p className="font-mono text-sm">Security Score = 100 - (35 - 215/2) = 100 - (35 - 107.5) = <span className="text-green-600 dark:text-green-400 font-bold">100</span></p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Uniswap's high Trust Score completely offsets the minor red flag, resulting in a perfect safety rating.
                  </p>
                </div>
              </div>

              {/* Example 2: New Protocol */}
              <div className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold">Example 2: New DeFi Protocol</h4>
                  <Badge className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-400">MEDIUM</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-green-600 dark:text-green-400">Trust Score: +60</p>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>✓ Protocol age 120 days (+15)</li>
                      <li>✓ TVL $2M (+10)</li>
                      <li>✓ 1 professional audit (+20)</li>
                      <li>✓ Verified contracts (+15)</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">Scam Score: +80</p>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>⚠ No audit (+40)</li>
                      <li>⚠ Anonymous team (+35)</li>
                      <li>⚠ New domain ({'<'}30 days) (+30)</li>
                    </ul>
                  </div>
                </div>
                <div className="pt-3 border-t">
                  <p className="text-sm font-semibold mb-2">Calculation:</p>
                  <p className="font-mono text-sm">Security Score = 100 - (80 - 60/2) = 100 - (80 - 30) = <span className="text-yellow-600 dark:text-yellow-400 font-bold">50</span></p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Moderate risk. The protocol has some legitimacy signals but also concerning red flags. Users should proceed with caution.
                  </p>
                </div>
              </div>

              {/* Example 3: Scam Project */}
              <div className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold">Example 3: Suspected Scam</h4>
                  <Badge variant="destructive">CRITICAL</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-green-600 dark:text-green-400">Trust Score: +0</p>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>✗ No positive signals detected</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-destructive">Scam Score: +420</p>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>🚨 Pink Drainer detected (+100)</li>
                      <li>🚨 Honeypot contract (+85)</li>
                      <li>🚨 Hidden owner (+80)</li>
                      <li>⚠ High tax 50% (+60)</li>
                      <li>⚠ Proxy contract (+50)</li>
                      <li>⚠ Unverified (+45)</li>
                    </ul>
                  </div>
                </div>
                <div className="pt-3 border-t">
                  <p className="text-sm font-semibold mb-2">Calculation:</p>
                  <p className="font-mono text-sm">Security Score = 100 - (420 - 0/2) = 100 - 420 = <span className="text-destructive font-bold">-320 → 0</span></p>
                  <p className="text-sm text-destructive mt-2 font-semibold">
                    ⛔ CRITICAL DANGER - This protocol is automatically blacklisted. Do not interact under any circumstances.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Alert>
            <Shield className="h-4 w-4" />
            <AlertTitle>Why This Works</AlertTitle>
            <AlertDescription className="space-y-2">
              <p>
                Our dual-scoring system prevents two common problems:
              </p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li><strong>False Positives:</strong> Legitimate protocols with minor red flags (like anonymous teams) aren't flagged if they have strong trust signals</li>
                <li><strong>False Negatives:</strong> New scam projects can't fake legitimacy - even one CRITICAL red flag triggers immediate blacklisting regardless of other factors</li>
              </ul>
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground pt-8 border-t">
        <p>
          Questions about our methodology? Contact us at{' '}
          <a href="mailto:security@defijerusalem.com" className="text-primary hover:underline">
            security@defijerusalem.com
          </a>
        </p>
      </div>
    </div>
  );
}
