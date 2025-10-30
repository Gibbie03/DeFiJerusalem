import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Shield, LogOut, Edit, Save, X, RefreshCw, Twitter, CheckCircle, AlertTriangle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import type { Protocol, BlacklistEntry, TwitterAlert, CertikAudit } from '@shared/schema';
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

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [editingProtocol, setEditingProtocol] = useState<Protocol | null>(null);
  const [editFormData, setEditFormData] = useState<EditProtocolData | null>(null);

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
            <Card>
              <CardHeader>
                <CardTitle>Blacklisted Protocols</CardTitle>
                <CardDescription>
                  Protocols flagged with critical security issues
                </CardDescription>
              </CardHeader>
              <CardContent>
                {blacklistLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading blacklist...
                  </div>
                ) : blacklist.filter(b => b.status === 'ACTIVE').length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No blacklisted protocols
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Protocol</TableHead>
                          <TableHead>Severity</TableHead>
                          <TableHead>Threats</TableHead>
                          <TableHead>Timestamp</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {blacklist
                          .filter(b => b.status === 'ACTIVE')
                          .map((entry) => (
                            <TableRow key={entry.id}>
                              <TableCell className="font-medium">
                                {entry.dappName}
                              </TableCell>
                              <TableCell>
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                  entry.severity === 'CRITICAL' ? 'bg-destructive text-destructive-foreground' :
                                  entry.severity === 'HIGH' ? 'bg-orange-500 text-white' :
                                  'bg-yellow-500 text-black'
                                }`}>
                                  {entry.severity}
                                </span>
                              </TableCell>
                              <TableCell>{entry.threats.length}</TableCell>
                              <TableCell>
                                {new Date(entry.timestamp).toLocaleDateString()}
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
    </div>
  );
}
