import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Shield, AlertTriangle, CheckCircle, Info, Loader2, TrendingUp, Search } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { apiRequest } from '@/lib/queryClient';

interface FilteredProtocol {
  id: string;
  name: string;
  reason: string;
  severity: string;
  isLikelyLegitimate: boolean;
  legitimacyScore: number;
  legitimacyReasons: string[];
}

interface FilterStats {
  total: number;
  obviousScams: number;
  potentialFalsePositives: number;
  needsReview: number;
  estimatedScans: number;
}

interface AnalysisResults {
  stats: FilterStats;
  potentialFalsePositives: FilteredProtocol[];
  message: string;
}

interface ContractScanResults {
  isHoneypot: boolean;
  cannotSell: boolean;
  buyTax: number;
  sellTax: number;
  hiddenOwner: boolean;
  threats: Array<{ type: string; message: string; severity: string }>;
  riskScore: number;
  severity: string;
}

interface VerificationResult {
  protocolName: string;
  legitimacyScore: number;
  legitimacyReasons: string[];
  originalSeverity: string;
  originalReason: string;
  contractAddress: string | null;
  contractChain: string | null;
  scanResults: ContractScanResults | null;
  recommendation: 'REMOVE_FROM_BLACKLIST' | 'KEEP_BLACKLISTED' | 'NEEDS_MANUAL_REVIEW';
}

interface VerificationResults {
  success: boolean;
  totalFiltered: number;
  analyzed: number;
  scansPerformed: number;
  contractsFound: number;
  results: VerificationResult[];
  summary: {
    removeFromBlacklist: number;
    keepBlacklisted: number;
    needsManualReview: number;
  };
  message: string;
}

export default function BlacklistVerification() {
  const [analysisResults, setAnalysisResults] = useState<AnalysisResults | null>(null);
  const [verificationResults, setVerificationResults] = useState<VerificationResults | null>(null);

  // Analyze mutation
  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/blacklist/filter-analysis', { 
        minLegitimacyScore: 20, 
        excludeObviousScams: true 
      });
      return await res.json();
    },
    onSuccess: (data) => {
      setAnalysisResults(data);
    },
  });

  // Verify mutation
  const verifyMutation = useMutation({
    mutationFn: async (maxScans: number) => {
      const res = await apiRequest('POST', '/api/blacklist/verify-filtered', { 
        minLegitimacyScore: 20, 
        maxScans 
      });
      return await res.json();
    },
    onSuccess: (data) => {
      setVerificationResults(data);
    },
  });

  const handleAnalyze = () => {
    setAnalysisResults(null);
    setVerificationResults(null);
    analyzeMutation.mutate();
  };

  const handleVerify = (maxScans: number) => {
    setVerificationResults(null);
    verifyMutation.mutate(maxScans);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="w-8 h-8 text-primary" />
          Blacklist Verification
        </h1>
        <p className="text-muted-foreground">
          Intelligently filter and re-scan blacklisted protocols to identify false positives while minimizing GoPlus API usage
        </p>
      </div>

      {/* Instructions */}
      <Alert className="border-primary/20 bg-primary/5">
        <Info className="h-5 w-5 text-primary" />
        <AlertTitle>How This Works</AlertTitle>
        <AlertDescription className="space-y-2 mt-2">
          <p>
            This tool uses AI-powered filtering to identify potentially legitimate protocols from your blacklist, 
            drastically reducing the number of GoPlus scans needed.
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li><strong>Step 1:</strong> Analyze blacklist to identify potential false positives (no API usage)</li>
            <li><strong>Step 2:</strong> Re-scan filtered protocols with GoPlus (only uses scans for high-probability false positives)</li>
            <li><strong>Filtering removes:</strong> Giveaways, typosquatting, malicious TLDs, obvious scams</li>
            <li><strong>Filtering keeps:</strong> Protocol integrations, chain-specific deployments, wrapped assets</li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* Step 1: Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5 text-accent" />
            Step 1: Analyze Blacklist
          </CardTitle>
          <CardDescription>
            Identify potentially legitimate protocols without using any GoPlus scans
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            data-testid="button-analyze-blacklist"
            onClick={handleAnalyze}
            disabled={analyzeMutation.isPending}
            className="w-full sm:w-auto"
          >
            {analyzeMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {analyzeMutation.isPending ? 'Analyzing...' : 'Analyze Blacklist'}
          </Button>

          {/* Analysis Results */}
          {analysisResults && (
            <div className="space-y-4 mt-4">
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-destructive">{analysisResults.stats.total}</div>
                    <div className="text-sm text-muted-foreground">Total Blacklisted</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-muted-foreground">{analysisResults.stats.obviousScams}</div>
                    <div className="text-sm text-muted-foreground">Obvious Scams</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-accent">{analysisResults.stats.potentialFalsePositives}</div>
                    <div className="text-sm text-muted-foreground">Potential False Positives</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-primary">{analysisResults.stats.estimatedScans}</div>
                    <div className="text-sm text-muted-foreground">Estimated Scans</div>
                  </CardContent>
                </Card>
              </div>

              <Alert className="border-accent/30 bg-accent/5">
                <TrendingUp className="h-4 w-4 text-accent" />
                <AlertTitle>Analysis Complete</AlertTitle>
                <AlertDescription>
                  Found <strong>{analysisResults.stats.potentialFalsePositives}</strong> potentially legitimate protocols 
                  from <strong>{analysisResults.stats.total}</strong> blacklisted entries. 
                  Estimated <strong>{analysisResults.stats.estimatedScans}</strong> GoPlus scans needed.
                </AlertDescription>
              </Alert>

              {/* Top potential false positives */}
              {analysisResults.potentialFalsePositives.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold">Top Potential False Positives</h3>
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Protocol</TableHead>
                          <TableHead>Legitimacy Score</TableHead>
                          <TableHead>Reasons</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {analysisResults.potentialFalsePositives.slice(0, 10).map((p: any, i: number) => (
                          <TableRow key={i}>
                            <TableCell className="font-medium">{p.name}</TableCell>
                            <TableCell>
                              <Badge className={
                                p.legitimacyScore >= 50 ? 'bg-green-500 text-white' :
                                p.legitimacyScore >= 20 ? 'bg-yellow-500 text-black' :
                                'bg-orange-500 text-white'
                              }>
                                {p.legitimacyScore}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {p.legitimacyReasons.slice(0, 2).join(', ')}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 2: Verification */}
      {analysisResults && analysisResults.stats.potentialFalsePositives > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Step 2: Verify with GoPlus Scans
            </CardTitle>
            <CardDescription>
              Re-scan the filtered protocols to confirm false positives
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button
                data-testid="button-verify-10"
                onClick={() => handleVerify(10)}
                disabled={verifyMutation.isPending}
                variant="outline"
              >
                {verifyMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Scan Top 10
              </Button>
              <Button
                data-testid="button-verify-25"
                onClick={() => handleVerify(25)}
                disabled={verifyMutation.isPending}
                variant="outline"
              >
                Scan Top 25
              </Button>
              <Button
                data-testid="button-verify-50"
                onClick={() => handleVerify(50)}
                disabled={verifyMutation.isPending}
              >
                Scan Top 50
              </Button>
            </div>

            {/* Verification Results */}
            {verificationResults && (
              <div className="space-y-4 mt-4">
                <Alert className="border-primary/30 bg-primary/5">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <AlertTitle>Verification Complete</AlertTitle>
                  <AlertDescription>
                    Used <strong>{verificationResults.scansPerformed}</strong> GoPlus scans to analyze{' '}
                    <strong>{verificationResults.analyzed}</strong> protocols.
                    Found <strong>{verificationResults.contractsFound}</strong> contracts.
                  </AlertDescription>
                </Alert>

                {/* Summary */}
                <div className="grid gap-4 md:grid-cols-3">
                  <Card className="border-green-500/20 bg-green-500/5">
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-green-500">
                        {verificationResults.summary.removeFromBlacklist}
                      </div>
                      <div className="text-sm text-muted-foreground">Remove from Blacklist</div>
                    </CardContent>
                  </Card>
                  <Card className="border-destructive/20 bg-destructive/5">
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-destructive">
                        {verificationResults.summary.keepBlacklisted}
                      </div>
                      <div className="text-sm text-muted-foreground">Keep Blacklisted</div>
                    </CardContent>
                  </Card>
                  <Card className="border-yellow-500/20 bg-yellow-500/5">
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-yellow-500">
                        {verificationResults.summary.needsManualReview}
                      </div>
                      <div className="text-sm text-muted-foreground">Needs Manual Review</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Detailed Results */}
                <div className="space-y-2">
                  <h3 className="font-semibold">Detailed Results</h3>
                  <div className="space-y-3">
                    {verificationResults.results.map((result: any, i: number) => (
                      <Card key={i} className={
                        result.recommendation === 'REMOVE_FROM_BLACKLIST' ? 'border-green-500/20' :
                        result.recommendation === 'KEEP_BLACKLISTED' ? 'border-destructive/20' :
                        'border-yellow-500/20'
                      }>
                        <CardContent className="p-4 space-y-2">
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1 flex-1">
                              <h4 className="font-semibold">{result.protocolName}</h4>
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge className="bg-muted text-foreground">
                                  Score: {result.legitimacyScore}
                                </Badge>
                                {result.scanResults && (
                                  <Badge variant={
                                    result.scanResults.severity === 'CRITICAL' ? 'destructive' :
                                    result.scanResults.severity === 'HIGH' ? 'destructive' :
                                    result.scanResults.severity === 'MEDIUM' ? 'default' :
                                    'outline'
                                  }>
                                    {result.scanResults.severity}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <Badge className={
                              result.recommendation === 'REMOVE_FROM_BLACKLIST' ? 'bg-green-500 text-white' :
                              result.recommendation === 'KEEP_BLACKLISTED' ? 'bg-destructive text-white' :
                              'bg-yellow-500 text-black'
                            }>
                              {result.recommendation.replace(/_/g, ' ')}
                            </Badge>
                          </div>
                          
                          {result.contractAddress && (
                            <div className="text-sm text-muted-foreground">
                              Contract: {result.contractAddress.slice(0, 10)}...{result.contractAddress.slice(-8)} ({result.contractChain})
                            </div>
                          )}
                          
                          {result.scanResults && result.scanResults.threats && result.scanResults.threats.length > 0 && (
                            <div className="text-sm">
                              <span className="text-muted-foreground">Threats: </span>
                              {result.scanResults.threats.slice(0, 2).map((t: any) => t.type).join(', ')}
                            </div>
                          )}
                          
                          <div className="text-xs text-muted-foreground">
                            {result.legitimacyReasons.slice(0, 2).join(' • ')}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
