import { useState, useEffect } from 'react';
import { Search, Shield, AlertTriangle, CheckCircle, XCircle, Wallet, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface WalletScanResult {
  address: string;
  isValid: boolean;
  chain?: 'ETHEREUM' | 'SOLANA' | 'UNKNOWN';
  chainFormat?: string;
  isDangerous: boolean;
  severity: 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  findings: {
    type: string;
    severity: string;
    message: string;
    evidence?: string;
  }[];
  associatedProtocols: {
    name: string;
    id: string;
    severity: string;
    blacklisted: boolean;
    threatCount?: number;
  }[];
  riskScore: number;
  recommendations: string[];
  drainerIntelligence?: {
    operation: string;
    totalStolen?: string;
    lastActive?: string;
    notes?: string;
    source: string;
    confidence: string;
  } | null;
  education?: {
    transactionPatterns: Array<{
      type: string;
      signature: string;
      description: string;
      severity: string;
    }>;
    statistics: {
      totalStolen: string;
      victims: string;
      permitAttacks: string;
      averageLoss: string;
      largestHeist: string;
    };
    solanaStatistics?: {
      clinksink: string;
      rainbowNode: string;
      nodeOnly: string;
      drainerCommunity: string;
    };
    protectionTips: string[];
  };
}

export default function WalletScanner() {
  const [walletAddress, setWalletAddress] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<WalletScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Wallet Address Threat Intelligence & Drainer Detection - DeFiJerusalem';
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Advanced wallet address analysis with AI-powered drainer detection. Verify wallet safety, detect malicious activity, and protect against crypto scams and rug pulls across Ethereum and Solana blockchains.');
    }
  }, []);

  async function handleScan() {
    if (!walletAddress.trim()) {
      setError('Please enter a wallet address');
      return;
    }

    setIsScanning(true);
    setError(null);
    setScanResult(null);

    try {
      const response = await fetch('/api/scan-wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: walletAddress.trim() })
      });

      if (!response.ok) {
        throw new Error('Scan failed');
      }

      const result = await response.json();
      setScanResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to scan wallet address');
    } finally {
      setIsScanning(false);
    }
  }

  function getSeverityColor(severity: string): string {
    switch (severity) {
      case 'CRITICAL': return 'destructive';
      case 'HIGH': return 'destructive';
      case 'MEDIUM': return 'default';
      case 'LOW': return 'secondary';
      default: return 'outline';
    }
  }

  function getSeverityIcon(severity: string) {
    switch (severity) {
      case 'CRITICAL':
      case 'HIGH':
        return <XCircle className="w-5 h-5 text-destructive" />;
      case 'MEDIUM':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'LOW':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-8" data-testid="page-wallet-scanner">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-xl mb-4">
          <Wallet className="w-8 h-8 text-primary-foreground" />
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
          Wallet Address Scanner
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Check wallet addresses for drainer footprints, malicious activity, and associations with blacklisted protocols
        </p>
      </div>

      {/* Scan Input */}
      <Card>
        <CardHeader>
          <CardTitle>Enter Wallet Address</CardTitle>
          <CardDescription>
            Supports Ethereum, BSC, Polygon, and other EVM-compatible addresses
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="0x1234...abcd or ENS name"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleScan()}
              className="flex-1"
              data-testid="input-wallet-address"
            />
            <Button
              onClick={handleScan}
              disabled={isScanning}
              data-testid="button-scan-wallet"
            >
              {isScanning ? (
                <>Scanning...</>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Scan
                </>
              )}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Example Addresses */}
          <div className="text-sm text-muted-foreground">
            <p className="font-semibold mb-2">Example addresses to test:</p>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold mb-1">Ethereum Addresses:</p>
                <div className="space-y-1">
                  <button
                    onClick={() => setWalletAddress('0x63605e53d422c4f1ac0e01390ac59aaf84c44a51')}
                    className="block hover-elevate px-2 py-1 rounded text-xs font-mono text-destructive hover:underline"
                    data-testid="example-pink-drainer"
                  >
                    ⚠️ DRAINER: 0x6360...4a51 (Pink Drainer - $85.3M)
                  </button>
                  <button
                    onClick={() => setWalletAddress('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045')}
                    className="block hover-elevate px-2 py-1 rounded text-xs font-mono text-primary hover:underline"
                    data-testid="example-safe-address"
                  >
                    Safe: 0xd8dA...6045 (Vitalik Buterin)
                  </button>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold mb-1">Solana Addresses:</p>
                <div className="space-y-1">
                  <button
                    onClick={() => setWalletAddress('B8Y1dERnVNoUUXeXA4NaCHiB9htcukMSkfHrFsTMHA7h')}
                    className="block hover-elevate px-2 py-1 rounded text-xs font-mono text-destructive hover:underline"
                    data-testid="example-clinksink-drainer"
                  >
                    ⚠️ DRAINER: B8Y1...HA7h (CLINKSINK - $900K+)
                  </button>
                  <button
                    onClick={() => setWalletAddress('CTWh8bm452CkAkpCoXti36Yiz7WMruRdKvSq98oseJ5c')}
                    className="block hover-elevate px-2 py-1 rounded text-xs font-mono text-orange-500 hover:underline"
                    data-testid="example-suspected-drainer1"
                  >
                    Suspected: CTWh...eJ5c (Twitter report @0xQuit)
                  </button>
                  <button
                    onClick={() => setWalletAddress('D15nRe91neBhMR7mAJuFcm3kTymD1vrtM83ef9PqSMv')}
                    className="block hover-elevate px-2 py-1 rounded text-xs font-mono text-orange-500 hover:underline"
                    data-testid="example-suspected-drainer2"
                  >
                    Suspected: D15n...SMv (Twitter report @0xmiir)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scan Results */}
      {scanResult && (
        <div className="space-y-6">
          {/* Summary Card */}
          <Card className={scanResult.isDangerous ? 'border-destructive/50' : 'border-green-500/50'}>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getSeverityIcon(scanResult.severity)}
                    <CardTitle>Scan Results</CardTitle>
                    {scanResult.chain && (
                      <Badge variant="outline" className="text-xs">
                        {scanResult.chain === 'ETHEREUM' ? '⟠ Ethereum' : '◎ Solana'}
                      </Badge>
                    )}
                  </div>
                  <code className="text-xs bg-muted px-2 py-1 rounded font-mono block break-all">
                    {scanResult.address}
                  </code>
                  {scanResult.chainFormat && (
                    <p className="text-xs text-muted-foreground mt-1">Format: {scanResult.chainFormat}</p>
                  )}
                </div>
                <Badge variant={getSeverityColor(scanResult.severity) as any}>
                  {scanResult.severity}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Risk Score</p>
                  <p className="text-2xl font-bold text-destructive">{scanResult.riskScore}/100</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Findings</p>
                  <p className="text-2xl font-bold">{scanResult.findings.length}</p>
                </div>
              </div>

              {!scanResult.isDangerous && scanResult.findings.length === 0 && (
                <Alert className="border-green-500/50 bg-green-500/10">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <AlertDescription className="text-green-700 dark:text-green-400">
                    No drainer footprints or malicious activity detected for this address
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Findings */}
          {scanResult.findings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Detected Threats</CardTitle>
                <CardDescription>{scanResult.findings.length} security issue{scanResult.findings.length !== 1 ? 's' : ''} found</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {scanResult.findings.map((finding, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-2" data-testid={`finding-${index}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {getSeverityIcon(finding.severity)}
                        <h4 className="font-semibold">{finding.type.replace(/_/g, ' ')}</h4>
                      </div>
                      <Badge variant={getSeverityColor(finding.severity) as any} className="text-xs">
                        {finding.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{finding.message}</p>
                    {finding.evidence && (
                      <div className="text-xs bg-muted px-3 py-2 rounded">
                        <strong>Evidence:</strong> {finding.evidence}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Associated Protocols */}
          {scanResult.associatedProtocols.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Associated Protocols</CardTitle>
                <CardDescription>
                  Protocols linked to this wallet address
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {scanResult.associatedProtocols.map((protocol, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg" data-testid={`protocol-${index}`}>
                    <div>
                      <p className="font-semibold">{protocol.name}</p>
                      <code className="text-xs text-muted-foreground">{protocol.id}</code>
                    </div>
                    <div className="flex items-center gap-2">
                      {protocol.blacklisted && (
                        <Badge variant="destructive">Blacklisted</Badge>
                      )}
                      <Badge variant={getSeverityColor(protocol.severity) as any}>
                        {protocol.severity}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Drainer Intelligence Alert */}
          {scanResult.drainerIntelligence && (
            <Card className="border-destructive bg-destructive/5">
              <CardHeader>
                <div className="flex items-center gap-2 text-destructive">
                  <XCircle className="w-6 h-6" />
                  <CardTitle>CONFIRMED DRAINER WALLET</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="font-semibold">
                    This is a CONFIRMED wallet drainer operation. NEVER interact with this address!
                  </AlertDescription>
                </Alert>
                
                <div className="grid gap-3 text-sm">
                  <div className="flex justify-between p-2 bg-muted rounded">
                    <span className="text-muted-foreground">Operation:</span>
                    <span className="font-semibold">{scanResult.drainerIntelligence.operation}</span>
                  </div>
                  {scanResult.drainerIntelligence.totalStolen && (
                    <div className="flex justify-between p-2 bg-muted rounded">
                      <span className="text-muted-foreground">Total Stolen:</span>
                      <span className="font-semibold text-destructive">{scanResult.drainerIntelligence.totalStolen}</span>
                    </div>
                  )}
                  {scanResult.drainerIntelligence.lastActive && (
                    <div className="flex justify-between p-2 bg-muted rounded">
                      <span className="text-muted-foreground">Last Active:</span>
                      <span className="font-semibold">{scanResult.drainerIntelligence.lastActive}</span>
                    </div>
                  )}
                  <div className="flex justify-between p-2 bg-muted rounded">
                    <span className="text-muted-foreground">Confidence:</span>
                    <Badge variant="destructive">{scanResult.drainerIntelligence.confidence}</Badge>
                  </div>
                  {scanResult.drainerIntelligence.notes && (
                    <div className="p-3 bg-muted rounded">
                      <p className="text-xs font-semibold mb-1">Intelligence Notes:</p>
                      <p className="text-sm">{scanResult.drainerIntelligence.notes}</p>
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground pt-2 border-t">
                    <strong>Source:</strong> {scanResult.drainerIntelligence.source}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {scanResult.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Security Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {scanResult.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Shield className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Educational Content - Drainer Statistics */}
          {scanResult.education && (
            <>
              <Card className="border-orange-500/20 bg-orange-500/5">
                <CardHeader>
                  <CardTitle>2024 Wallet Drainer Statistics</CardTitle>
                  <CardDescription>Real-world data from blockchain forensics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-muted rounded">
                      <p className="text-2xl font-bold text-destructive">{scanResult.education.statistics.totalStolen}</p>
                      <p className="text-xs text-muted-foreground">Total Stolen</p>
                    </div>
                    <div className="text-center p-3 bg-muted rounded">
                      <p className="text-2xl font-bold">{scanResult.education.statistics.victims}</p>
                      <p className="text-xs text-muted-foreground">Victims</p>
                    </div>
                    <div className="text-center p-3 bg-muted rounded">
                      <p className="text-2xl font-bold">{scanResult.education.statistics.averageLoss}</p>
                      <p className="text-xs text-muted-foreground">Average Loss</p>
                    </div>
                    <div className="text-center p-3 bg-muted rounded">
                      <p className="text-2xl font-bold text-orange-500">{scanResult.education.statistics.permitAttacks}</p>
                      <p className="text-xs text-muted-foreground">Permit Attacks</p>
                    </div>
                    <div className="text-center p-3 bg-muted rounded col-span-2">
                      <p className="text-2xl font-bold text-destructive">{scanResult.education.statistics.largestHeist}</p>
                      <p className="text-xs text-muted-foreground">Largest Single Heist</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Transaction Patterns */}
              <Card>
                <CardHeader>
                  <CardTitle>Known Drainer Transaction Patterns</CardTitle>
                  <CardDescription>Malicious transaction signatures to watch for</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {scanResult.education.transactionPatterns.map((pattern, index) => (
                    <div key={index} className="border rounded-lg p-3 space-y-2" data-testid={`pattern-${index}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-semibold text-sm">{pattern.type.replace(/_/g, ' ')}</h4>
                          <code className="text-xs bg-muted px-2 py-1 rounded block mt-1 font-mono break-all">
                            {pattern.signature}
                          </code>
                        </div>
                        <Badge variant={pattern.severity === 'CRITICAL' ? 'destructive' : 'default'} className="text-xs">
                          {pattern.severity}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{pattern.description}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Protection Tips */}
              <Card className="border-green-500/20 bg-green-500/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    Protection Tips
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {scanResult.education.protectionTips.map((tip, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <span className="text-green-500 font-bold">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {/* Info Section */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold mb-2">What We Check</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Association with blacklisted protocols and known scams</li>
                  <li>• Drainer operation fingerprints and patterns</li>
                  <li>• Known malicious contract deployments</li>
                  <li>• Wallet drainer infrastructure indicators</li>
                </ul>
              </div>
            </div>
            <div className="text-xs text-muted-foreground border-t pt-4">
              <strong>Note:</strong> This scanner analyzes wallet addresses against our threat database. For comprehensive blockchain transaction analysis, consider using additional tools like Etherscan, DeBank, or Arkham Intelligence.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
