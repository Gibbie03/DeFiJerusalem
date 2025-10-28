import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Shield, LogOut, Edit, Save, X, RefreshCw } from 'lucide-react';
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
import type { Protocol, BlacklistEntry } from '@shared/schema';
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
