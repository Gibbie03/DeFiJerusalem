import { useState } from 'react';
import { Shield, AlertTriangle, CheckCircle, ExternalLink, Loader2, Search, Info, FileText, ChevronDown, ChevronUp, Monitor, Smartphone } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface PhishingIndicator {
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  evidence: string;
}

interface PhishingScan {
  url: string;
  domain: string;
  isScam: boolean;
  riskScore: number;
  severity: 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  indicators: PhishingIndicator[];
  summary: string;
  recommendations: string[];
}

interface ContractScanResult {
  address: string;
  chain: string;
  explorerUrl: string;
  isHoneypot: boolean;
  threats: string[];
  riskScore: number;
  severity: string;
}

interface ScanResponse {
  success: boolean;
  url: string;
  phishing: PhishingScan;
  contracts: ContractScanResult[];
  fetchError: string | null;
  scannedAt: string;
}

export default function WebsiteScanner() {
  const [url, setUrl] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [showManualScan, setShowManualScan] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResponse | null>(null);
  const { toast } = useToast();

  const scanMutation = useMutation({
    mutationFn: async (websiteUrl: string) => {
      const res = await apiRequest('POST', '/api/scan-website-security', { url: websiteUrl });
      return await res.json();
    },
    onSuccess: (data: ScanResponse) => {
      setScanResult(data);
      
      if (data.phishing.severity === 'CRITICAL' || data.phishing.severity === 'HIGH') {
        toast({
          title: 'Warning: Dangerous Website Detected',
          description: 'This website shows signs of being a scam. Do not connect your wallet!',
          variant: 'destructive',
        });
      } else if (data.phishing.severity === 'SAFE') {
        toast({
          title: 'Website Appears Safe',
          description: 'No obvious phishing patterns detected.',
        });
      }
    },
    onError: (error) => {
      toast({
        title: 'Scan Failed',
        description: error instanceof Error ? error.message : 'Failed to scan website',
        variant: 'destructive',
      });
    },
  });

  const manualScanMutation = useMutation({
    mutationFn: async ({ url: websiteUrl, html }: { url: string; html: string }) => {
      const res = await apiRequest('POST', '/api/scan-html-content', { url: websiteUrl, html });
      return await res.json();
    },
    onSuccess: (data: ScanResponse) => {
      setScanResult(data);
      
      if (data.phishing.severity === 'CRITICAL' || data.phishing.severity === 'HIGH') {
        toast({
          title: 'Warning: Dangerous Website Detected',
          description: 'This website shows signs of being a scam. Do not connect your wallet!',
          variant: 'destructive',
        });
      } else if (data.phishing.severity === 'SAFE') {
        toast({
          title: 'Website Appears Safe',
          description: 'No obvious phishing patterns detected.',
        });
      } else {
        toast({
          title: 'Manual Scan Complete',
          description: `Risk level: ${data.phishing.severity}`,
        });
      }
    },
    onError: (error) => {
      toast({
        title: 'Manual Scan Failed',
        description: error instanceof Error ? error.message : 'Failed to analyze HTML content',
        variant: 'destructive',
      });
    },
  });

  const handleScan = () => {
    if (!url.trim()) {
      toast({
        title: 'URL Required',
        description: 'Please enter a website URL to scan',
        variant: 'destructive',
      });
      return;
    }
    scanMutation.mutate(url);
  };

  const handleManualScan = () => {
    if (!url.trim()) {
      toast({
        title: 'URL Required',
        description: 'Please enter the website URL',
        variant: 'destructive',
      });
      return;
    }
    if (!htmlContent.trim()) {
      toast({
        title: 'HTML Required',
        description: 'Please paste the HTML content from the website',
        variant: 'destructive',
      });
      return;
    }
    manualScanMutation.mutate({ url, html: htmlContent });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-500 text-white';
      case 'HIGH':
        return 'bg-orange-500 text-white';
      case 'MEDIUM':
        return 'bg-yellow-500 text-black';
      case 'LOW':
        return 'bg-blue-500 text-white';
      case 'SAFE':
        return 'bg-green-500 text-white';
      default:
        return 'bg-muted';
    }
  };

  const getIndicatorIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
      case 'HIGH':
        return <AlertTriangle className="w-4 h-4 text-destructive" />;
      case 'MEDIUM':
        return <Info className="w-4 h-4 text-yellow-500" />;
      case 'LOW':
        return <Info className="w-4 h-4 text-blue-500" />;
      default:
        return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">Website Security Scanner</h1>
        </div>
        <p className="text-muted-foreground">
          Check if a crypto website is legitimate or a phishing scam. We analyze URLs, content patterns, and embedded smart contracts.
        </p>
      </div>

      {/* Scan Input */}
      <Card>
        <CardHeader>
          <CardTitle>Enter Website URL</CardTitle>
          <CardDescription>
            Paste any crypto-related website URL to check for phishing patterns, typosquatting, and malicious contracts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="https://audius-review.com or metamask-support.xyz"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleScan()}
              data-testid="input-website-url"
              className="flex-1"
            />
            <Button
              onClick={handleScan}
              disabled={scanMutation.isPending}
              data-testid="button-scan-website"
            >
              {scanMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Scan
                </>
              )}
            </Button>
          </div>

          {/* Example Links */}
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span>Try:</span>
            <button
              className="text-primary hover:underline"
              onClick={() => setUrl('audius-review.com')}
              data-testid="button-example-audius"
            >
              audius-review.com
            </button>
            <span>•</span>
            <button
              className="text-primary hover:underline"
              onClick={() => setUrl('metamask-recovery.xyz')}
              data-testid="button-example-metamask"
            >
              metamask-recovery.xyz
            </button>
            <span>•</span>
            <button
              className="text-primary hover:underline"
              onClick={() => setUrl('uniswap.org')}
              data-testid="button-example-uniswap"
            >
              uniswap.org
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Manual HTML Scan - For Protected Websites */}
      <Collapsible open={showManualScan} onOpenChange={setShowManualScan}>
        <Card>
          <CardHeader>
            <CollapsibleTrigger className="w-full" data-testid="button-toggle-manual-scan">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-primary" />
                  <div className="text-left">
                    <CardTitle>Manual Content Analysis</CardTitle>
                    <CardDescription className="mt-1">
                      For websites with anti-bot protection (like Cloudflare)
                    </CardDescription>
                  </div>
                </div>
                {showManualScan ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              {/* Guide - Desktop and Mobile */}
              <Alert>
                <Info className="w-4 h-4" />
                <AlertTitle>How to extract HTML from protected websites</AlertTitle>
                <AlertDescription className="mt-3">
                  <Tabs defaultValue="desktop" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="desktop" className="text-xs" data-testid="tab-desktop-guide">
                        <Monitor className="w-3 h-3 mr-1" />
                        Desktop
                      </TabsTrigger>
                      <TabsTrigger value="mobile" className="text-xs" data-testid="tab-mobile-guide">
                        <Smartphone className="w-3 h-3 mr-1" />
                        Mobile
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="desktop" className="mt-3">
                      <ol className="list-decimal list-inside space-y-1.5 text-sm">
                        <li>Visit the suspicious website in your browser</li>
                        <li>Right-click anywhere on the page and select "View Page Source" (or press Ctrl+U / Cmd+U)</li>
                        <li>Copy all the HTML code (Ctrl+A / Cmd+A, then Ctrl+C / Cmd+C)</li>
                        <li>Paste the HTML into the textarea below</li>
                        <li>Click "Analyze Content" to scan for phishing patterns</li>
                      </ol>
                    </TabsContent>
                    
                    <TabsContent value="mobile" className="mt-3">
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <p className="text-sm font-medium">For iPhone/iPad (Safari):</p>
                          <ol className="list-decimal list-inside space-y-1 text-sm pl-2">
                            <li>Visit the website in Safari</li>
                            <li>Add "view-source:" before the URL (e.g., view-source:https://example.com)</li>
                            <li>Press and hold anywhere on the code, tap "Select All"</li>
                            <li>Tap "Copy", then paste here</li>
                          </ol>
                        </div>
                        
                        <Separator />
                        
                        <div className="space-y-1.5">
                          <p className="text-sm font-medium">For Android (Chrome):</p>
                          <ol className="list-decimal list-inside space-y-1 text-sm pl-2">
                            <li>Visit the website in Chrome</li>
                            <li>Type "view-source:" before the URL in the address bar</li>
                            <li>Long-press on the code and select "Select All"</li>
                            <li>Tap "Copy", then paste here</li>
                          </ol>
                        </div>
                        
                        <Alert className="mt-3">
                          <Info className="w-3 h-3" />
                          <AlertDescription className="text-xs">
                            Tip: Some mobile browsers may not support view-source. Try using desktop mode or a browser like Kiwi Browser or Firefox.
                          </AlertDescription>
                        </Alert>
                      </div>
                    </TabsContent>
                  </Tabs>
                </AlertDescription>
              </Alert>

              {/* HTML Input */}
              <div className="space-y-2">
                <label htmlFor="html-content" className="text-sm font-medium">
                  Paste HTML Content
                </label>
                <Textarea
                  id="html-content"
                  placeholder="Paste the complete HTML source code here..."
                  value={htmlContent}
                  onChange={(e) => setHtmlContent(e.target.value)}
                  className="min-h-[200px] font-mono text-xs"
                  data-testid="textarea-html-content"
                />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {htmlContent.length > 0 ? `${htmlContent.length.toLocaleString()} characters` : 'No content pasted yet'}
                  </p>
                  {htmlContent.length > 1000000 && (
                    <Badge variant="outline" className="text-xs">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Large content
                    </Badge>
                  )}
                </div>
              </div>

              {/* Analyze Button */}
              <Button
                onClick={handleManualScan}
                disabled={manualScanMutation.isPending}
                className="w-full"
                data-testid="button-analyze-html"
              >
                {manualScanMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing Content...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Analyze Content
                  </>
                )}
              </Button>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Scan Results */}
      {scanResult && (
        <div className="space-y-4">
          {/* Overall Risk Summary */}
          <Card data-testid="scan-result-card">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Security Analysis
                  </CardTitle>
                  <CardDescription className="break-all mt-1">
                    {scanResult.phishing.domain}
                  </CardDescription>
                </div>
                <Badge className={getSeverityColor(scanResult.phishing.severity)} data-testid="badge-severity">
                  {scanResult.phishing.severity}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Risk Score */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Risk Score</span>
                  <span className="text-sm font-bold" data-testid="text-risk-score">
                    {scanResult.phishing.riskScore}/100
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      scanResult.phishing.riskScore >= 70 ? 'bg-red-500' :
                      scanResult.phishing.riskScore >= 50 ? 'bg-orange-500' :
                      scanResult.phishing.riskScore >= 30 ? 'bg-yellow-500' :
                      scanResult.phishing.riskScore >= 10 ? 'bg-blue-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${scanResult.phishing.riskScore}%` }}
                  />
                </div>
              </div>

              {/* Summary */}
              <Alert>
                <AlertDescription className="text-base" data-testid="alert-summary">
                  {scanResult.phishing.summary}
                </AlertDescription>
              </Alert>

              {/* Recommendations */}
              {scanResult.phishing.recommendations.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Recommendations:</h4>
                  <ul className="space-y-1.5">
                    {scanResult.phishing.recommendations.map((rec, idx) => (
                      <li key={idx} className="text-sm flex items-start gap-2">
                        <span className="mt-0.5">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Threat Indicators */}
          {scanResult.phishing.indicators.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Detected Threats ({scanResult.phishing.indicators.length})</CardTitle>
                <CardDescription>
                  Specific security concerns identified during the scan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {scanResult.phishing.indicators.map((indicator, idx) => (
                    <div
                      key={idx}
                      className="p-3 border rounded-md space-y-2"
                      data-testid={`indicator-${idx}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 flex-1">
                          {getIndicatorIcon(indicator.severity)}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{indicator.description}</p>
                            <p className="text-xs text-muted-foreground mt-1 break-all">
                              {indicator.evidence}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {indicator.severity}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Contract Analysis */}
          {scanResult.contracts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Smart Contracts Found ({scanResult.contracts.length})</CardTitle>
                <CardDescription>
                  Contract addresses discovered on the website
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {scanResult.contracts.map((contract, idx) => (
                    <div
                      key={idx}
                      className="p-3 border rounded-md space-y-2"
                      data-testid={`contract-${idx}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-mono truncate" title={contract.address}>
                            {contract.address}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {contract.chain}
                          </p>
                        </div>
                        <Badge className={getSeverityColor(contract.severity)}>
                          {contract.severity}
                        </Badge>
                      </div>

                      {contract.threats.length > 0 && (
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-3 h-3 text-destructive mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-destructive">
                            {contract.threats.slice(0, 3).join(', ')}
                            {contract.threats.length > 3 && ` +${contract.threats.length - 3} more`}
                          </p>
                        </div>
                      )}

                      <a
                        href={contract.explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        View on Explorer
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* No Contracts Found */}
          {scanResult.contracts.length === 0 && !scanResult.fetchError && (
            <Card>
              <CardContent className="py-6">
                <p className="text-sm text-muted-foreground text-center">
                  No smart contract addresses found on this website
                </p>
              </CardContent>
            </Card>
          )}

          {/* Fetch Error */}
          {scanResult.fetchError && (
            <Alert variant="destructive">
              <AlertTriangle className="w-4 h-4" />
              <AlertTitle>Unable to Fetch Website Content</AlertTitle>
              <AlertDescription>
                {scanResult.fetchError}. URL analysis was performed, but content-based detection is limited.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Info Cards */}
      {!scanResult && (
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                Phishing Detection
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Detects typosquatting, suspicious domains, and brand impersonation attempts
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Search className="w-4 h-4 text-primary" />
                Content Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Scans for urgent language, credential requests, and wallet drainer patterns
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-primary" />
                Contract Scanning
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Discovers and analyzes embedded smart contracts for honeypots and malicious code
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
