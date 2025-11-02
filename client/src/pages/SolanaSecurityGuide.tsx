import { useEffect } from 'react';
import { Shield, AlertTriangle, Lock, Eye, Clock, Layers, Zap, Users, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function SolanaSecurityGuide() {
  useEffect(() => {
    document.title = 'Solana Security Guide: Protect Your Wallet from Drainers - DeFiJerusalem';
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Comprehensive guide to Solana wallet security. Learn how drainers work, understand attack methods (SetAuthority, TOCTOU, blind signing), and protect yourself with hardware wallets and best practices.');
    }
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <Shield className="w-12 h-12 text-primary" />
          <h1 className="text-4xl font-bold">Solana Security Guide</h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          Learn how wallet drainers target Solana users, understand advanced attack methods, and protect your assets with proven security strategies.
        </p>
      </div>

      {/* Critical Alert */}
      <Alert className="border-destructive bg-destructive/10">
        <AlertTriangle className="h-5 w-5 text-destructive" />
        <AlertDescription className="text-destructive font-medium">
          <strong>Critical Security Notice:</strong> Over $4.17M stolen from 3,947 Solana users in 2024-2025 through drainer operations. 
          You MUST sign a transaction to be drained - never sign unexpected transactions.
        </AlertDescription>
      </Alert>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="attacks" data-testid="tab-attacks">Attack Methods</TabsTrigger>
          <TabsTrigger value="protection" data-testid="tab-protection">Protection</TabsTrigger>
          <TabsTrigger value="comparison" data-testid="tab-comparison">vs Ethereum</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                How Solana Drainers Work
              </CardTitle>
              <CardDescription>
                Understanding the fundamentals of Solana wallet draining attacks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertDescription>
                  <strong>Important:</strong> You cannot be drained without signing a transaction. Claims of "just connecting drained my wallet" 
                  are inaccurate - investigation always reveals a signed transaction.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">The Core Principle</h3>
                <p className="text-muted-foreground">
                  Unlike Ethereum's approval-based system, Solana drainers typically use <strong>direct transfer attacks</strong>. 
                  When you sign what appears to be a routine transaction, it may actually authorize:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li><strong>Immediate token transfers</strong> to attacker's wallet</li>
                  <li><strong>Token account ownership changes</strong> (tokens appear in your wallet but can't be moved)</li>
                  <li><strong>Delegate authority grants</strong> allowing attackers to spend your tokens</li>
                  <li><strong>Pre-signed transactions</strong> that execute later via durable nonce</li>
                </ul>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="w-4 h-4 text-destructive" />
                      Active Drainer Operations (2025)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Badge variant="destructive">CLINKSINK</Badge>
                      <p className="text-sm text-muted-foreground mt-1">$900K+ stolen, 35+ affiliates, DaaS model</p>
                    </div>
                    <div>
                      <Badge variant="destructive">Rainbow Drainer</Badge>
                      <p className="text-sm text-muted-foreground mt-1">$4M+ from 3,947 victims</p>
                    </div>
                    <div>
                      <Badge variant="destructive">Node Drainer</Badge>
                      <p className="text-sm text-muted-foreground mt-1">Active major operation</p>
                    </div>
                    <div>
                      <Badge variant="destructive">Perpetual Drainer</Badge>
                      <p className="text-sm text-muted-foreground mt-1">XSS exploit-based attacks</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Zap className="w-4 h-4 text-primary" />
                      Distribution Methods
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Fake airdrop announcements</li>
                      <li>• Compromised social media accounts</li>
                      <li>• Phishing NFTs with embedded links</li>
                      <li>• Address poisoning (similar addresses)</li>
                      <li>• Reply hijacking under official tweets</li>
                      <li>• Fake customer support DMs</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attack Methods Tab */}
        <TabsContent value="attacks" className="space-y-6">
          <div className="grid gap-6">
            {/* SetAuthority Attack */}
            <Card className="border-destructive">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Lock className="w-5 h-5 text-destructive" />
                      SetAuthority Instruction Attack
                    </CardTitle>
                    <CardDescription className="mt-2">
                      The most dangerous Solana-specific attack vector
                    </CardDescription>
                  </div>
                  <Badge variant="destructive">CRITICAL</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-destructive/10 border border-destructive rounded-lg p-4">
                  <h4 className="font-semibold text-destructive mb-2">How It Works</h4>
                  <p className="text-sm text-muted-foreground">
                    Attackers trick users into signing transactions containing <code className="bg-muted px-1 py-0.5 rounded">createSetAuthorityInstruction</code> commands. 
                    This transfers ownership of your token account to the attacker's wallet. Tokens remain <strong>visible</strong> in your 
                    wallet but become <strong>immovable</strong> - essentially frozen and stolen.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Detection & Prevention</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Wallets like Phantom and Backpack intercept SetAuthority operations and warn users</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Never force through transactions that trigger authority change warnings</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Use hardware wallets with clear signing to verify transaction details</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* TOCTOU Attack */}
            <Card className="border-orange-500">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-orange-500" />
                      TOCTOU (Time-of-Check-Time-of-Use) Attack
                    </CardTitle>
                    <CardDescription className="mt-2">
                      Exploits the gap between wallet simulation and transaction execution
                    </CardDescription>
                  </div>
                  <Badge className="bg-orange-500">HIGH</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-orange-500/10 border border-orange-500 rounded-lg p-4">
                  <h4 className="font-semibold text-orange-500 mb-2">How It Works</h4>
                  <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                    <li>User signs transaction → wallet simulation shows safe outcome</li>
                    <li>Attacker changes on-chain program state (between check and execution)</li>
                    <li>Attacker broadcasts user's signed transaction → funds drained</li>
                  </ol>
                  <p className="text-sm text-muted-foreground mt-3">
                    <strong>Speed Advantage:</strong> On Solana's high-speed network, state changes and execution can occur 
                    within seconds (7 blocks apart in documented cases).
                  </p>
                </div>
                <Alert>
                  <AlertDescription className="text-sm">
                    This attack bypasses wallet simulations because the simulation checks the contract at signing time, 
                    not execution time. The contract appears safe during simulation but becomes malicious before execution.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Durable Nonce Attack */}
            <Card className="border-yellow-500">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Layers className="w-5 h-5 text-yellow-500" />
                      Durable Nonce Signature Deception
                    </CardTitle>
                    <CardDescription className="mt-2">
                      Sign now, drain later - delayed execution attacks
                    </CardDescription>
                  </div>
                  <Badge className="bg-yellow-500">MEDIUM</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-yellow-500/10 border border-yellow-500 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-500 mb-2">How It Works</h4>
                  <p className="text-sm text-muted-foreground">
                    Durable Nonce allows transactions to be signed now but broadcast later (similar to Ethereum's "permit" signatures). 
                    Attackers get users to sign seemingly safe transactions that don't execute immediately. The signed transaction is 
                    stored offline and broadcast whenever the attacker chooses - often days or weeks later.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-yellow-500">Why It's Dangerous</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Victims may lose funds days after signing with no memory of the interaction</li>
                    <li>• Often combined with contract upgrades (legitimate contract → malicious upgrade)</li>
                    <li>• Wallet simulations check the contract at signing time, not execution time</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Blind Signing */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="w-5 h-5" />
                      Blind Signing Exploits
                    </CardTitle>
                    <CardDescription className="mt-2">
                      Signing transactions without understanding their contents
                    </CardDescription>
                  </div>
                  <Badge>MEDIUM</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Hardware wallets like Ledger can only natively read basic instructions (sending/receiving SOL, staking). 
                  For DeFi, NFTs, or smart contracts, users must enable "blind signing" because the wallet can't decode custom program instructions.
                </p>
                <Alert className="border-blue-500 bg-blue-500/10">
                  <AlertDescription className="text-sm">
                    <strong>Recent Attack:</strong> May 2025 Phantom Wallet blind signing hack - $1.5M stolen from 80 victims. 
                    Attackers created phishing dApps that prompted users to "sign" transactions that actually drained funds.
                  </AlertDescription>
                </Alert>
                <div>
                  <h4 className="font-semibold mb-2">Protection Strategy</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Use Ledger Live's Clear Signing feature (shows human-readable details)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Only enable blind signing when actively using DeFi/NFTs</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Disable blind signing immediately after transactions</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Protection Tab */}
        <TabsContent value="protection" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-500" />
                Comprehensive Protection Strategy
              </CardTitle>
              <CardDescription>
                Multi-layered security approach to protect your Solana assets
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Hardware Wallets */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Lock className="w-5 h-5 text-primary" />
                  1. Use Hardware Wallets with Clear Signing
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Ledger (Nano X/S Plus)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <p className="text-muted-foreground">
                        <strong>Best for:</strong> Long-term holders, security-conscious users
                      </p>
                      <ul className="space-y-1 text-muted-foreground list-disc list-inside">
                        <li>Clear Signing shows transaction details on device</li>
                        <li>Disable blind signing when not needed</li>
                        <li>Always verify on physical device screen</li>
                      </ul>
                      <Badge className="bg-green-500">RECOMMENDED</Badge>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">OneKey Pro</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <p className="text-muted-foreground">
                        <strong>Best for:</strong> Active traders, DeFi users
                      </p>
                      <ul className="space-y-1 text-muted-foreground list-disc list-inside">
                        <li>SignGuard dual-layer verification</li>
                        <li>Integrates GoPlus, Blockaid, ScamSniffer</li>
                        <li>Large display prevents blind signing</li>
                      </ul>
                      <Badge className="bg-green-500">RECOMMENDED</Badge>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Wallet Setup */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  2. Asset Segregation Strategy
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Badge className="bg-blue-500 mt-1">Hot Wallet</Badge>
                    <div className="flex-1">
                      <p className="font-medium">Small Amounts for Daily Trading</p>
                      <p className="text-sm text-muted-foreground">Use Phantom, Solflare for active trading. Keep only what you need for transactions.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Badge className="bg-green-500 mt-1">Cold Wallet</Badge>
                    <div className="flex-1">
                      <p className="font-medium">Bulk Holdings in Hardware Wallet</p>
                      <p className="text-sm text-muted-foreground">Store majority of assets in Ledger or OneKey. Only connect for necessary transactions.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Badge className="bg-orange-500 mt-1">Burn Wallet</Badge>
                    <div className="flex-1">
                      <p className="font-medium">Disposable for Untested dApps</p>
                      <p className="text-sm text-muted-foreground">Create throwaway wallet for interacting with new/experimental protocols.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Before Every Transaction */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  3. Pre-Transaction Checklist
                </h3>
                <Card className="bg-muted">
                  <CardContent className="pt-6">
                    <ul className="space-y-2">
                      {[
                        'Verify the dApp URL is legitimate (bookmark official sites)',
                        'Check transaction details on hardware device screen (not computer)',
                        'Review token approvals and amounts carefully',
                        'Never sign transactions with unclear purposes',
                        'Disable blind signing immediately after DeFi/NFT interactions',
                        'Use transaction simulation tools (Jupiter, Raydium show previews)',
                        'If wallet shows a warning, STOP and investigate'
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* Never Do This */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-destructive" />
                  4. Never Do This
                </h3>
                <Card className="border-destructive bg-destructive/10">
                  <CardContent className="pt-6">
                    <ul className="space-y-2">
                      {[
                        'Store seed phrases digitally (screenshots, cloud, files)',
                        'Enable blind signing permanently',
                        'Trust social media DMs about "support" or "airdrops"',
                        'Connect to unknown dApps without research',
                        'Download wallets from unofficial sources',
                        'Reuse compromised wallet seed phrases (even on hardware wallets)',
                        'Ignore wallet warnings or force through flagged transactions'
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <XCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* Emergency Response */}
              <Alert className="border-orange-500 bg-orange-500/10">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                <AlertDescription>
                  <strong className="text-orange-500">If You Suspect Compromise:</strong>
                  <ol className="mt-2 space-y-1 text-sm list-decimal list-inside">
                    <li>DO NOT touch the compromised wallet - funds may drain faster</li>
                    <li>Create NEW wallet with new seed phrase</li>
                    <li>Send small test transaction to new wallet</li>
                    <li>If successful, quickly move remaining assets</li>
                    <li>Never reuse compromised seed phrase, even on hardware wallets</li>
                  </ol>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Comparison Tab */}
        <TabsContent value="comparison" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Solana vs Ethereum: Security Architecture</CardTitle>
              <CardDescription>
                Understanding the fundamental differences in token approval systems
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Ethereum */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">Ethereum (ERC-20)</h3>
                    <Badge variant="destructive">Higher Risk</Badge>
                  </div>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <XCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">Unlimited Allowances Common</p>
                        <p className="text-sm text-muted-foreground">dApps request 2^256-1 by default</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <XCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">Persistent Forever</p>
                        <p className="text-sm text-muted-foreground">Approvals stay active until manually revoked</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <XCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">Multiple Simultaneous Approvals</p>
                        <p className="text-sm text-muted-foreground">Many contracts can have active approvals at once</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <XCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">Major Attack Vector</p>
                        <p className="text-sm text-muted-foreground">Compromised contracts can drain entire balance</p>
                      </div>
                    </li>
                  </ul>
                </div>

                {/* Solana */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">Solana (SPL Token)</h3>
                    <Badge className="bg-green-500">Lower Risk</Badge>
                  </div>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">Single Delegate Only</p>
                        <p className="text-sm text-muted-foreground">One delegate per token account at a time</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">Amount-Capped</p>
                        <p className="text-sm text-muted-foreground">Each approval specifies exact maximum</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">Signature Required</p>
                        <p className="text-sm text-muted-foreground">Delegate must sign transfers</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">Smaller Attack Surface</p>
                        <p className="text-sm text-muted-foreground">More restrictive approval model</p>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>

              <Alert className="bg-blue-500/10 border-blue-500">
                <AlertDescription>
                  <strong>Key Takeaway:</strong> Solana's approval system is inherently safer than Ethereum's. However, 
                  both chains require active security hygiene. Users must regularly review and revoke unnecessary approvals/delegates 
                  to minimize risk. Solana users are less vulnerable to approval-based attacks but still face unique threats like 
                  SetAuthority and TOCTOU attacks.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <h4 className="font-semibold">Revocation Tools</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Ethereum</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <a 
                        href="https://revoke.cash" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-primary hover:underline"
                        data-testid="link-revoke-cash"
                      >
                        Revoke.cash
                        <ArrowRight className="w-3 h-3" />
                      </a>
                      <a 
                        href="https://etherscan.io/tokenapprovalchecker" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-primary hover:underline"
                        data-testid="link-etherscan-checker"
                      >
                        Etherscan Token Approval Checker
                        <ArrowRight className="w-3 h-3" />
                      </a>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Solana</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <a 
                        href="https://revoke.ffdojo.xyz" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-primary hover:underline"
                        data-testid="link-famous-fox-revoker"
                      >
                        Famous Fox Federation Revoker
                        <ArrowRight className="w-3 h-3" />
                      </a>
                      <a 
                        href="https://solrevoker.com" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-primary hover:underline"
                        data-testid="link-solana-revoker"
                      >
                        Solana Revoker
                        <ArrowRight className="w-3 h-3" />
                      </a>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Bottom CTA */}
      <Card className="bg-primary/10 border-primary">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <h3 className="text-xl font-bold">Protect Your Assets Today</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Use our Security Scanner to check your Solana wallet for active delegates, known drainer addresses, 
              and suspicious transaction patterns. Get personalized security recommendations.
            </p>
            <a 
              href="/security-scanner" 
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-md hover-elevate active-elevate-2"
              data-testid="link-scan-wallet"
            >
              <Shield className="w-4 h-4" />
              Scan Your Wallet Now
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
