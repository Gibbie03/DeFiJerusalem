import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Shield, LogOut, Edit, Save, X, RefreshCw, Twitter, CheckCircle, AlertTriangle, Download, Eye, Check, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import type { Protocol, BlacklistEntry, TwitterAlert, CertikAudit, ProtocolSubmission } from '@shared/schema';
import LoadingSpinner from '@/components/LoadingSpinner';

interface AdminSession {
  authenticated: boolean;
  admin?: {
    id: string;
    username: string;
    email: string;
    role: string;
  };
}

interface EditProtocolData {
  name: string;
  category: string;
  tvl: number;
  volume24h: number;
  description: string;
  website: string;
  twitter: string;
  github: string;
}

function TwitterMonitoringPanel({ session }: { session: AdminSession | undefined }) {
  const { toast } = useToast();
  
  const { data: alerts = [], isLoading: alertsLoading } = useQuery<TwitterAlert[]>({
    queryKey: ['/api/twitter/alerts'],
    enabled: session?.authenticated,
  });

  const testConnectionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/twitter/test-detection', {});
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Connection Successful',
        description: data.message || 'Twitter API is properly configured',
      });
    },
    onError: (error: any) => {
      const message = error.message || 'Failed to connect to Twitter API';
      const needsSetup = message.includes('not configured');
      toast({
        title: needsSetup ? 'Setup Required' : 'Connection Failed',
        description: message,
        variant: 'destructive',
      });
    },
  });

  const updateAlertMutation = useMutation({
    mutationFn: async ({ id, status, reviewNotes }: { id: string; status: string; reviewNotes?: string }) => {
      const res = await apiRequest('PATCH', `/api/twitter/alerts/${id}`, { status, reviewNotes });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Alert Updated',
        description: 'Alert status updated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/twitter/alerts'] });
    },
    onError: (error) => {
      toast({
        title: 'Update Failed',
        description: error instanceof Error ? error.message : 'Failed to update alert',
        variant: 'destructive',
      });
    },
  });

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Twitter className="w-5 h-5" />
                Twitter Threat Monitoring
              </CardTitle>
              <CardDescription>
                Real-time monitoring of crypto scams and threats on Twitter
              </CardDescription>
            </div>
            <Button
              onClick={() => testConnectionMutation.mutate()}
              disabled={testConnectionMutation.isPending}
              data-testid="button-test-twitter"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {testConnectionMutation.isPending ? 'Testing...' : 'Test Connection'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Configuration Status</h4>
              <p className="text-sm text-muted-foreground">
                Click "Test Connection" to verify Twitter API credentials (TWITTER_BEARER_TOKEN).
                Free tier supports 50,000 tweets/month with 25 filter rules.
              </p>
              <div className="mt-2 text-xs text-muted-foreground">
                <strong>Note:</strong> Real-time monitoring requires a persistent process. 
                Alerts shown below are stored detections from previous monitoring sessions.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detected Alerts ({alerts.length})</CardTitle>
          <CardDescription>
            Twitter threats detected by the monitoring system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {alertsLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading alerts...
            </div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No alerts detected yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tweet</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Detected</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alerts.slice(0, 50).map((alert) => (
                    <TableRow key={alert.id}>
                      <TableCell className="max-w-xs truncate font-mono text-xs">
                        {alert.tweetText.substring(0, 80)}...
                      </TableCell>
                      <TableCell>@{alert.authorUsername}</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 rounded text-xs bg-muted">
                          {alert.category}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          alert.severity === 'CRITICAL' ? 'bg-destructive text-destructive-foreground' :
                          alert.severity === 'HIGH' ? 'bg-orange-500 text-white' :
                          alert.severity === 'MEDIUM' ? 'bg-yellow-500 text-black' :
                          'bg-blue-500 text-white'
                        }`}>
                          {alert.severity}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs ${
                          alert.status === 'flagged' ? 'bg-destructive/20 text-destructive' :
                          alert.status === 'dismissed' ? 'bg-green-500/20 text-green-700' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {alert.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs">
                        {new Date(alert.detectedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateAlertMutation.mutate({ id: alert.id, status: 'flagged' })}
                            disabled={updateAlertMutation.isPending}
                            data-testid={`button-confirm-${alert.id}`}
                          >
                            Flag
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateAlertMutation.mutate({ id: alert.id, status: 'dismissed' })}
                            disabled={updateAlertMutation.isPending}
                            data-testid={`button-dismiss-${alert.id}`}
                          >
                            Dismiss
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function CertikAuditsPanel({ session }: { session: AdminSession | undefined }) {
  const { toast } = useToast();
  
  const { data: audits = [], isLoading: auditsLoading } = useQuery<CertikAudit[]>({
    queryKey: ['/api/certik/audits'],
    enabled: session?.authenticated,
  });

  const fetchAuditsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/certik/fetch', { limit: 100 });
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Audits Fetched',
        description: data.message || 'CertiK audit data fetched successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/certik/audits'] });
    },
    onError: (error) => {
      toast({
        title: 'Fetch Failed',
        description: error instanceof Error ? error.message : 'Failed to fetch CertiK audits',
        variant: 'destructive',
      });
    },
  });

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                CertiK Security Audits
              </CardTitle>
              <CardDescription>
                Multi-source audit verification from CertiK Skynet and DeFiLlama
              </CardDescription>
            </div>
            <Button
              onClick={() => fetchAuditsMutation.mutate()}
              disabled={fetchAuditsMutation.isPending}
              data-testid="button-fetch-certik"
            >
              <Download className="w-4 h-4 mr-2" />
              {fetchAuditsMutation.isPending ? 'Fetching...' : 'Fetch Audits'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Data Sources</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• DeFiLlama: Audit links and verification status</li>
                <li>• CertiK Skynet: Security scores and vulnerability reports (public data)</li>
                <li>• Generates mock security scores for protocols without live CertiK data</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Audit Database ({audits.length})</CardTitle>
          <CardDescription>
            Security audit data for top DeFi protocols
          </CardDescription>
        </CardHeader>
        <CardContent>
          {auditsLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading audits...
            </div>
          ) : audits.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No audit data available. Click "Fetch Audits" to populate.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Protocol</TableHead>
                    <TableHead>Security Score</TableHead>
                    <TableHead>Audit Status</TableHead>
                    <TableHead>Code Security</TableHead>
                    <TableHead>Market</TableHead>
                    <TableHead>Governance</TableHead>
                    <TableHead>Last Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {audits.slice(0, 100).map((audit) => (
                    <TableRow key={audit.id}>
                      <TableCell className="font-medium">
                        {audit.protocolName}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            audit.securityScore && audit.securityScore >= 80 ? 'bg-green-500' :
                            audit.securityScore && audit.securityScore >= 60 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`} />
                          <span className="font-semibold">{audit.securityScore ?? 'N/A'}/100</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          audit.hasAudit ? 'bg-green-500/20 text-green-700' : 'bg-muted text-muted-foreground'
                        }`}>
                          {audit.hasAudit ? 'AUDITED' : 'NO AUDIT'}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">{audit.codeSecurityScore}/100</TableCell>
                      <TableCell className="text-sm">{audit.marketScore}/100</TableCell>
                      <TableCell className="text-sm">{audit.governanceScore}/100</TableCell>
                      <TableCell className="text-xs">
                        {new Date(audit.lastUpdated).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function BlacklistReviewPanel({ session }: { session: AdminSession | undefined }) {
  const { toast } = useToast();
  const [minLegitimacyScore, setMinLegitimacyScore] = useState(20);
  const [viewMode, setViewMode] = useState<'all' | 'flagged'>('all');
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  
  const { data: blacklist = [], isLoading: blacklistLoading } = useQuery<BlacklistEntry[]>({
    queryKey: ['/api/blacklist'],
    enabled: session?.authenticated,
  });

  const analysisMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/blacklist/filter-analysis', {
        minLegitimacyScore,
        excludeObviousScams: true,
      });
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Analysis Complete',
        description: `Found ${data.potentialFalsePositives.length} potential false positives from ${data.stats.total} blacklisted entries`,
      });
      setViewMode('flagged');
    },
    onError: (error) => {
      toast({
        title: 'Analysis Failed',
        description: error instanceof Error ? error.message : 'Failed to analyze blacklist',
        variant: 'destructive',
      });
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/blacklist/verify-filtered', {
        minLegitimacyScore,
        maxScans: 50,
      });
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Verification Complete',
        description: `Re-scanned ${data.analyzed} protocols. Recommend removing ${data.summary.removeFromBlacklist}, keeping ${data.summary.keepBlacklisted}, manual review ${data.summary.needsManualReview}`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Verification Failed',
        description: error instanceof Error ? error.message : 'Failed to verify blacklist',
        variant: 'destructive',
      });
    },
  });

  const removeFromBlacklistMutation = useMutation({
    mutationFn: async (entryId: string) => {
      const res = await apiRequest('DELETE', `/api/blacklist/${entryId}`, {});
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Entry Removed',
        description: 'Successfully removed from blacklist',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/blacklist'] });
      setSelectedEntry(null);
    },
    onError: (error) => {
      toast({
        title: 'Removal Failed',
        description: error instanceof Error ? error.message : 'Failed to remove entry',
        variant: 'destructive',
      });
    },
  });

  const activeBlacklist = blacklist.filter(b => b.status === 'ACTIVE');
  const displayedEntries = viewMode === 'all' 
    ? activeBlacklist
    : analysisMutation.data?.potentialFalsePositives || [];

  const stats = analysisMutation.data?.stats;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Blacklist Review & False Positive Detection</CardTitle>
              <CardDescription>
                Review {activeBlacklist.length} blacklisted protocols and identify potential false positives
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('all')}
                data-testid="button-view-all"
              >
                View All
              </Button>
              <Button
                variant={viewMode === 'flagged' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('flagged')}
                data-testid="button-view-flagged"
              >
                Potential False Positives
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg space-y-3">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label className="text-sm">Minimum Legitimacy Score</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={minLegitimacyScore}
                  onChange={(e) => setMinLegitimacyScore(Number(e.target.value))}
                  className="mt-1"
                  data-testid="input-legitimacy-score"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Higher scores indicate more likely false positives (e.g., protocols with high TVL, audits, or established history)
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={() => analysisMutation.mutate()}
                disabled={analysisMutation.isPending}
                data-testid="button-analyze-blacklist"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                {analysisMutation.isPending ? 'Analyzing...' : 'Analyze for False Positives'}
              </Button>
              
              <Button
                onClick={() => verifyMutation.mutate()}
                disabled={verifyMutation.isPending}
                variant="outline"
                data-testid="button-verify-blacklist"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {verifyMutation.isPending ? 'Verifying...' : 'Re-scan with GoPlus (50 max)'}
              </Button>
            </div>
          </div>

          {stats && (
            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <div className="text-xs text-muted-foreground">Total Blacklisted</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-yellow-600">{stats.potentialFalsePositives}</div>
                  <div className="text-xs text-muted-foreground">Potential False Positives</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-green-600">{stats.highLegitimacy}</div>
                  <div className="text-xs text-muted-foreground">High Legitimacy</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-red-600">{stats.obviousScams}</div>
                  <div className="text-xs text-muted-foreground">Obvious Scams</div>
                </CardContent>
              </Card>
            </div>
          )}

          {blacklistLoading ? (
            <div className="text-center py-8">
              <LoadingSpinner />
            </div>
          ) : displayedEntries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {viewMode === 'all' ? 'No blacklisted protocols' : 'Run analysis to identify potential false positives'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Protocol</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Threats</TableHead>
                    {viewMode === 'flagged' && <TableHead>Legitimacy Score</TableHead>}
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedEntries.map((entry: any) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">
                        {entry.dappName || entry.name}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            entry.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-700 border-red-500/30' :
                            entry.severity === 'HIGH' ? 'bg-orange-500/20 text-orange-700 border-orange-500/30' :
                            entry.severity === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30' :
                            'bg-blue-500/20 text-blue-700 border-blue-500/30'
                          }
                        >
                          {entry.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>{entry.threats?.length || 0}</TableCell>
                      {viewMode === 'flagged' && (
                        <TableCell>
                          <Badge className="bg-green-500/20 text-green-700 border-green-500/30">
                            {entry.legitimacyScore}
                          </Badge>
                        </TableCell>
                      )}
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(entry.timestamp).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedEntry(entry)}
                            data-testid={`button-view-${entry.id}`}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Review
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {verifyMutation.data && (
            <Card className="bg-blue-500/10 border-blue-500/30">
              <CardHeader>
                <CardTitle className="text-sm">Verification Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="font-semibold text-green-600">{verifyMutation.data.summary.removeFromBlacklist}</div>
                    <div className="text-xs text-muted-foreground">Recommend Removal</div>
                  </div>
                  <div>
                    <div className="font-semibold text-red-600">{verifyMutation.data.summary.keepBlacklisted}</div>
                    <div className="text-xs text-muted-foreground">Keep Blacklisted</div>
                  </div>
                  <div>
                    <div className="font-semibold text-yellow-600">{verifyMutation.data.summary.needsManualReview}</div>
                    <div className="text-xs text-muted-foreground">Manual Review Needed</div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Used {verifyMutation.data.scansPerformed} GoPlus API scans across {verifyMutation.data.analyzed} protocols
                </p>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {selectedEntry && (
        <Dialog open={!!selectedEntry} onOpenChange={() => setSelectedEntry(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Review: {selectedEntry.dappName || selectedEntry.name}</DialogTitle>
              <DialogDescription>
                Detailed information and removal options
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-semibold">Severity</Label>
                <div className="mt-1">
                  <Badge
                    className={
                      selectedEntry.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-700 border-red-500/30' :
                      selectedEntry.severity === 'HIGH' ? 'bg-orange-500/20 text-orange-700 border-orange-500/30' :
                      'bg-yellow-500/20 text-yellow-700 border-yellow-500/30'
                    }
                  >
                    {selectedEntry.severity}
                  </Badge>
                </div>
              </div>

              {selectedEntry.legitimacyScore !== undefined && (
                <div>
                  <Label className="text-sm font-semibold">Legitimacy Score</Label>
                  <div className="mt-1">
                    <Badge className="bg-green-500/20 text-green-700 border-green-500/30">
                      {selectedEntry.legitimacyScore} / 100
                    </Badge>
                  </div>
                  {selectedEntry.legitimacyReasons && selectedEntry.legitimacyReasons.length > 0 && (
                    <ul className="mt-2 space-y-1 text-sm">
                      {selectedEntry.legitimacyReasons.map((reason: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <div>
                <Label className="text-sm font-semibold">Reason for Blacklisting</Label>
                <p className="mt-1 text-sm">{selectedEntry.reason || 'No reason provided'}</p>
              </div>

              {selectedEntry.threats && selectedEntry.threats.length > 0 && (
                <div>
                  <Label className="text-sm font-semibold">Detected Threats ({selectedEntry.threats.length})</Label>
                  <ul className="mt-2 space-y-1 text-sm">
                    {selectedEntry.threats.map((threat: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <XCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                        <span>{threat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedEntry.website && (
                <div>
                  <Label className="text-sm font-semibold">Website</Label>
                  <a 
                    href={selectedEntry.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline block mt-1"
                  >
                    {selectedEntry.website}
                  </a>
                </div>
              )}

              <div className="pt-4 border-t flex gap-2">
                <Button
                  variant="destructive"
                  onClick={() => removeFromBlacklistMutation.mutate(selectedEntry.id)}
                  disabled={removeFromBlacklistMutation.isPending}
                  data-testid="button-remove-from-blacklist"
                >
                  <X className="w-4 h-4 mr-2" />
                  {removeFromBlacklistMutation.isPending ? 'Removing...' : 'Remove from Blacklist'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedEntry(null)}
                  data-testid="button-cancel-review"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [editingProtocol, setEditingProtocol] = useState<Protocol | null>(null);
  const [editFormData, setEditFormData] = useState<EditProtocolData | null>(null);
  const [viewingSubmission, setViewingSubmission] = useState<ProtocolSubmission | null>(null);

  const { data: session, isLoading: sessionLoading } = useQuery<AdminSession>({
    queryKey: ['/api/admin/session'],
  });

  const { data: protocolsData, isLoading: protocolsLoading } = useQuery<{
    protocols: Protocol[];
    total: number;
    auditedCount: number;
  }>({
    queryKey: ['/api/protocols'],
    enabled: session?.authenticated,
  });

  const protocols = protocolsData?.protocols || [];

  const { data: blacklist = [], isLoading: blacklistLoading } = useQuery<BlacklistEntry[]>({
    queryKey: ['/api/blacklist'],
    enabled: session?.authenticated,
  });

  const { data: submissions = [], isLoading: submissionsLoading } = useQuery<ProtocolSubmission[]>({
    queryKey: ['/api/protocol-submissions'],
    enabled: session?.authenticated,
  });

  const sponsoredProtocols = protocols.filter(
    p => p.sponsorshipTier && p.sponsorshipTier !== 'free'
  );

  useEffect(() => {
    if (!sessionLoading && !session?.authenticated) {
      setLocation('/admin/login');
    }
  }, [session, sessionLoading, setLocation]);

  const refreshProtocolsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/admin/refresh-protocols', {});
      return await res.json();
    },
    onSuccess: async (data) => {
      toast({
        title: 'Protocols Refreshed',
        description: `Successfully refreshed ${data.protocolCount} protocols (${data.auditedCount} audited). Reloading app...`,
      });
      
      // Clear React Query cache completely
      queryClient.clear();
      
      // Force hard reload after 1 second to ensure all caches are cleared
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    },
    onError: (error) => {
      toast({
        title: 'Refresh Failed',
        description: error instanceof Error ? error.message : 'Failed to refresh protocols',
        variant: 'destructive',
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/admin/logout', {});
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Logged Out',
        description: 'Successfully logged out of admin panel',
      });
      setLocation('/admin/login');
    },
    onError: (error) => {
      toast({
        title: 'Logout Failed',
        description: error instanceof Error ? error.message : 'Failed to logout',
        variant: 'destructive',
      });
    },
  });

  const updateProtocolMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<EditProtocolData> }) => {
      const res = await apiRequest('PUT', `/api/admin/protocols/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/protocols'] });
      toast({
        title: 'Protocol Updated',
        description: 'Protocol information updated successfully',
      });
      setEditingProtocol(null);
      setEditFormData(null);
    },
    onError: (error) => {
      toast({
        title: 'Update Failed',
        description: error instanceof Error ? error.message : 'Failed to update protocol',
        variant: 'destructive',
      });
    },
  });

  const approveSubmissionMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest('PATCH', `/api/protocol-submissions/${id}/approve`, {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/protocol-submissions'] });
      toast({
        title: 'Submission Approved',
        description: 'Protocol submission has been approved successfully',
      });
      setViewingSubmission(null);
    },
    onError: (error) => {
      toast({
        title: 'Approval Failed',
        description: error instanceof Error ? error.message : 'Failed to approve submission',
        variant: 'destructive',
      });
    },
  });

  const rejectSubmissionMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest('PATCH', `/api/protocol-submissions/${id}/reject`, {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/protocol-submissions'] });
      toast({
        title: 'Submission Rejected',
        description: 'Protocol submission has been rejected',
      });
      setViewingSubmission(null);
    },
    onError: (error) => {
      toast({
        title: 'Rejection Failed',
        description: error instanceof Error ? error.message : 'Failed to reject submission',
        variant: 'destructive',
      });
    },
  });

  const handleEditProtocol = (protocol: Protocol) => {
    setEditingProtocol(protocol);
    setEditFormData({
      name: protocol.name,
      category: protocol.category,
      tvl: protocol.tvl,
      volume24h: protocol.volume24h,
      description: protocol.description,
      website: protocol.website || '',
      twitter: protocol.twitter || '',
      github: protocol.github || '',
    });
  };

  const handleSaveProtocol = () => {
    if (editingProtocol && editFormData) {
      updateProtocolMutation.mutate({
        id: editingProtocol.id,
        data: editFormData,
      });
    }
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  if (sessionLoading) {
    return <LoadingSpinner message="Checking authentication..." />;
  }

  if (!session?.authenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-screen-2xl mx-auto px-6 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary via-accent to-primary rounded-lg flex items-center justify-center shadow-lg">
                <Shield className="w-6 h-6 text-primary-foreground" />
              </div>
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground">
              Manage JERUSALEM DeFi Security Scanner
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="default"
              onClick={() => refreshProtocolsMutation.mutate()}
              disabled={refreshProtocolsMutation.isPending}
              data-testid="button-refresh-protocols"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshProtocolsMutation.isPending ? 'animate-spin' : ''}`} />
              {refreshProtocolsMutation.isPending ? 'Refreshing...' : 'Refresh All Protocols'}
            </Button>
            <Button
              variant="outline"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Admin Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Username</p>
                <p className="font-medium" data-testid="text-admin-username">
                  {session.admin?.username}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium" data-testid="text-admin-email">
                  {session.admin?.email}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Role</p>
                <p className="font-medium" data-testid="text-admin-role">
                  {session.admin?.role}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="protocols">
          <TabsList>
            <TabsTrigger value="protocols" data-testid="tab-protocols">
              Protocols ({protocols.length})
            </TabsTrigger>
            <TabsTrigger value="blacklist" data-testid="tab-blacklist">
              Blacklist ({blacklist.filter(b => b.status === 'ACTIVE').length})
            </TabsTrigger>
            <TabsTrigger value="sponsorships" data-testid="tab-sponsorships">
              Sponsorships ({sponsoredProtocols.length})
            </TabsTrigger>
            <TabsTrigger value="submissions" data-testid="tab-submissions">
              Submissions
            </TabsTrigger>
            <TabsTrigger value="twitter" data-testid="tab-twitter">
              Twitter Monitoring
            </TabsTrigger>
            <TabsTrigger value="certik" data-testid="tab-certik">
              CertiK Audits
            </TabsTrigger>
          </TabsList>

          <TabsContent value="protocols" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Protocols</CardTitle>
                <CardDescription>
                  Manage and edit protocol information
                </CardDescription>
              </CardHeader>
              <CardContent>
                {protocolsLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading protocols...
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>TVL</TableHead>
                          <TableHead>Chains</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {protocols.slice(0, 50).map((protocol) => (
                          <TableRow key={protocol.id}>
                            <TableCell className="font-medium">
                              {protocol.name}
                            </TableCell>
                            <TableCell>{protocol.category}</TableCell>
                            <TableCell>
                              ${(protocol.tvl / 1_000_000).toFixed(2)}M
                            </TableCell>
                            <TableCell>
                              {protocol.chains.slice(0, 2).join(', ')}
                              {protocol.chains.length > 2 && ` +${protocol.chains.length - 2}`}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditProtocol(protocol)}
                                data-testid={`button-edit-${protocol.id}`}
                              >
                                <Edit className="w-3 h-3 mr-1" />
                                Edit
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="blacklist" className="space-y-4">
            <BlacklistReviewPanel session={session} />
          </TabsContent>

          <TabsContent value="sponsorships" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Sponsored Protocols</CardTitle>
                <CardDescription>
                  Protocols with active sponsorship
                </CardDescription>
              </CardHeader>
              <CardContent>
                {protocolsLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading sponsorships...
                  </div>
                ) : sponsoredProtocols.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No sponsored protocols
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Protocol</TableHead>
                          <TableHead>Tier</TableHead>
                          <TableHead>TVL</TableHead>
                          <TableHead>Sponsored Until</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sponsoredProtocols.map((protocol) => (
                          <TableRow key={protocol.id}>
                            <TableCell className="font-medium">
                              {protocol.name}
                            </TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                protocol.sponsorshipTier === 'featured' ? 'bg-accent text-accent-foreground' :
                                'bg-primary text-primary-foreground'
                              }`}>
                                {protocol.sponsorshipTier?.toUpperCase()}
                              </span>
                            </TableCell>
                            <TableCell>
                              ${(protocol.tvl / 1_000_000).toFixed(2)}M
                            </TableCell>
                            <TableCell>
                              {protocol.sponsoredUntil
                                ? new Date(protocol.sponsoredUntil).toLocaleDateString()
                                : 'N/A'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="submissions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Protocol Submissions</CardTitle>
                <CardDescription>
                  Review and manage community-submitted protocols
                </CardDescription>
              </CardHeader>
              <CardContent>
                {submissionsLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading submissions...
                  </div>
                ) : submissions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No protocol submissions yet
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Submitter</TableHead>
                          <TableHead>Protocol Name</TableHead>
                          <TableHead>Website</TableHead>
                          <TableHead>Chains</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Submitted</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {submissions.map((submission) => (
                          <TableRow key={submission.id} data-testid={`row-submission-${submission.id}`}>
                            <TableCell>
                              <div>
                                <div className="font-medium">
                                  {submission.submitterName || 'Anonymous'}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {submission.submitterEmail}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">
                              {submission.protocolName}
                            </TableCell>
                            <TableCell>
                              <a 
                                href={submission.website} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-primary hover:underline text-sm"
                              >
                                {new URL(submission.website).hostname}
                              </a>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {submission.chains.slice(0, 2).map((chain) => (
                                  <Badge key={chain} variant="outline" className="text-xs">
                                    {chain}
                                  </Badge>
                                ))}
                                {submission.chains.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{submission.chains.length - 2}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">{submission.category}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                data-testid={`badge-status-${submission.id}`}
                                className={
                                  submission.status === 'approved'
                                    ? 'bg-green-500/20 text-green-700 border-green-500/30'
                                    : submission.status === 'rejected'
                                    ? 'bg-red-500/20 text-red-700 border-red-500/30'
                                    : 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30'
                                }
                              >
                                {submission.status.toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              {new Date(submission.submittedAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setViewingSubmission(submission)}
                                  data-testid={`button-view-${submission.id}`}
                                >
                                  <Eye className="w-3 h-3 mr-1" />
                                  View
                                </Button>
                                {submission.status === 'pending' && (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => approveSubmissionMutation.mutate(submission.id)}
                                      disabled={approveSubmissionMutation.isPending || rejectSubmissionMutation.isPending}
                                      data-testid={`button-approve-${submission.id}`}
                                    >
                                      <Check className="w-3 h-3 mr-1" />
                                      Approve
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => rejectSubmissionMutation.mutate(submission.id)}
                                      disabled={approveSubmissionMutation.isPending || rejectSubmissionMutation.isPending}
                                      data-testid={`button-reject-${submission.id}`}
                                    >
                                      <XCircle className="w-3 h-3 mr-1" />
                                      Reject
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="twitter" className="space-y-4">
            <TwitterMonitoringPanel session={session} />
          </TabsContent>

          <TabsContent value="certik" className="space-y-4">
            <CertikAuditsPanel session={session} />
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={!!editingProtocol} onOpenChange={(open) => !open && setEditingProtocol(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Protocol</DialogTitle>
            <DialogDescription>
              Update protocol information
            </DialogDescription>
          </DialogHeader>
          {editFormData && (
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  data-testid="input-edit-name"
                />
              </div>
              <div>
                <Label htmlFor="edit-category">Category</Label>
                <Input
                  id="edit-category"
                  value={editFormData.category}
                  onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                  data-testid="input-edit-category"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-tvl">TVL</Label>
                  <Input
                    id="edit-tvl"
                    type="number"
                    value={editFormData.tvl}
                    onChange={(e) => setEditFormData({ ...editFormData, tvl: parseFloat(e.target.value) || 0 })}
                    data-testid="input-edit-tvl"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-volume24h">24h Volume</Label>
                  <Input
                    id="edit-volume24h"
                    type="number"
                    value={editFormData.volume24h}
                    onChange={(e) => setEditFormData({ ...editFormData, volume24h: parseFloat(e.target.value) || 0 })}
                    data-testid="input-edit-volume24h"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  rows={3}
                  data-testid="input-edit-description"
                />
              </div>
              <div>
                <Label htmlFor="edit-website">Website</Label>
                <Input
                  id="edit-website"
                  value={editFormData.website}
                  onChange={(e) => setEditFormData({ ...editFormData, website: e.target.value })}
                  placeholder="https://example.com"
                  data-testid="input-edit-website"
                />
              </div>
              <div>
                <Label htmlFor="edit-twitter">Twitter</Label>
                <Input
                  id="edit-twitter"
                  value={editFormData.twitter}
                  onChange={(e) => setEditFormData({ ...editFormData, twitter: e.target.value })}
                  placeholder="https://twitter.com/protocol"
                  data-testid="input-edit-twitter"
                />
              </div>
              <div>
                <Label htmlFor="edit-github">GitHub</Label>
                <Input
                  id="edit-github"
                  value={editFormData.github}
                  onChange={(e) => setEditFormData({ ...editFormData, github: e.target.value })}
                  placeholder="https://github.com/protocol"
                  data-testid="input-edit-github"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setEditingProtocol(null)}
                  data-testid="button-cancel-edit"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveProtocol}
                  disabled={updateProtocolMutation.isPending}
                  data-testid="button-save-edit"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {updateProtocolMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewingSubmission} onOpenChange={(open) => !open && setViewingSubmission(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submission Details</DialogTitle>
            <DialogDescription>
              Review protocol submission information
            </DialogDescription>
          </DialogHeader>
          {viewingSubmission && (
            <div className="space-y-6 py-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold mb-2">Submitter Information</h3>
                  <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Name</Label>
                      <p className="text-sm">{viewingSubmission.submitterName || 'Not provided'}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Email</Label>
                      <p className="text-sm">{viewingSubmission.submitterEmail}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold mb-2">Protocol Information</h3>
                  <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Protocol Name</Label>
                      <p className="text-sm font-medium">{viewingSubmission.protocolName}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Website</Label>
                      <a 
                        href={viewingSubmission.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        {viewingSubmission.website}
                      </a>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Category</Label>
                      <p className="text-sm">{viewingSubmission.category}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Chains</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {viewingSubmission.chains.map((chain) => (
                          <Badge key={chain} variant="outline" className="text-xs">
                            {chain}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Description</Label>
                      <p className="text-sm mt-1">{viewingSubmission.description}</p>
                    </div>
                  </div>
                </div>

                {viewingSubmission.contractAddresses && Object.keys(viewingSubmission.contractAddresses).length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Contract Addresses</h3>
                    <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                      {Object.entries(viewingSubmission.contractAddresses).map(([chain, address]) => (
                        <div key={chain}>
                          <Label className="text-xs text-muted-foreground">{chain}</Label>
                          <p className="text-xs font-mono break-all">{address}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-semibold mb-2">Social Links</h3>
                  <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                    {viewingSubmission.twitter && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Twitter</Label>
                        <a 
                          href={viewingSubmission.twitter} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline block"
                        >
                          {viewingSubmission.twitter}
                        </a>
                      </div>
                    )}
                    {viewingSubmission.github && (
                      <div>
                        <Label className="text-xs text-muted-foreground">GitHub</Label>
                        <a 
                          href={viewingSubmission.github} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline block"
                        >
                          {viewingSubmission.github}
                        </a>
                      </div>
                    )}
                    {viewingSubmission.telegram && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Telegram</Label>
                        <a 
                          href={viewingSubmission.telegram} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline block"
                        >
                          {viewingSubmission.telegram}
                        </a>
                      </div>
                    )}
                    {viewingSubmission.discord && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Discord</Label>
                        <a 
                          href={viewingSubmission.discord} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline block"
                        >
                          {viewingSubmission.discord}
                        </a>
                      </div>
                    )}
                    {!viewingSubmission.twitter && !viewingSubmission.github && !viewingSubmission.telegram && !viewingSubmission.discord && (
                      <p className="text-sm text-muted-foreground">No social links provided</p>
                    )}
                  </div>
                </div>

                {viewingSubmission.auditLinks && viewingSubmission.auditLinks.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Audit Links</h3>
                    <div className="bg-muted/50 p-4 rounded-lg space-y-1">
                      {viewingSubmission.auditLinks.map((link, index) => (
                        <a 
                          key={index}
                          href={link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline block"
                        >
                          {link}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-semibold mb-2">Submission Status</h3>
                  <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Status</Label>
                      <div className="mt-1">
                        <Badge
                          className={
                            viewingSubmission.status === 'approved'
                              ? 'bg-green-500/20 text-green-700 border-green-500/30'
                              : viewingSubmission.status === 'rejected'
                              ? 'bg-red-500/20 text-red-700 border-red-500/30'
                              : 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30'
                          }
                        >
                          {viewingSubmission.status.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Submitted At</Label>
                      <p className="text-sm">{new Date(viewingSubmission.submittedAt).toLocaleString()}</p>
                    </div>
                    {viewingSubmission.reviewedAt && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Reviewed At</Label>
                        <p className="text-sm">{new Date(viewingSubmission.reviewedAt).toLocaleString()}</p>
                      </div>
                    )}
                    {viewingSubmission.adminNotes && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Admin Notes</Label>
                        <p className="text-sm">{viewingSubmission.adminNotes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {viewingSubmission.status === 'pending' && (
                <div className="flex gap-2 justify-end pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setViewingSubmission(null)}
                    data-testid="button-close-submission"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Close
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => rejectSubmissionMutation.mutate(viewingSubmission.id)}
                    disabled={approveSubmissionMutation.isPending || rejectSubmissionMutation.isPending}
                    data-testid="button-reject-submission"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    {rejectSubmissionMutation.isPending ? 'Rejecting...' : 'Reject'}
                  </Button>
                  <Button
                    onClick={() => approveSubmissionMutation.mutate(viewingSubmission.id)}
                    disabled={approveSubmissionMutation.isPending || rejectSubmissionMutation.isPending}
                    data-testid="button-approve-submission"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    {approveSubmissionMutation.isPending ? 'Approving...' : 'Approve'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
