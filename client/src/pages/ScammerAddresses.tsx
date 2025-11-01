import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, AlertTriangle, Shield, TrendingUp, ExternalLink, Copy, Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

interface ScammerAddress {
  id: string;
  address: string;
  chain: string;
  addressType: string;
  category: string;
  severity: string;
  description: string;
  associatedScam: string | null;
  totalStolen: number;
  victimCount: number;
  isActive: boolean;
  firstSeen: string;
  lastActivity: string | null;
  addedAt: string;
}

const CHAINS = ["all", "ethereum", "bsc", "polygon", "arbitrum", "optimism", "avalanche", "solana"];
const CATEGORIES = ["all", "drainer", "phishing", "rugpull", "ponzi", "honeypot"];

export default function ScammerAddresses() {
  const { toast } = useToast();
  const [searchAddress, setSearchAddress] = useState("");
  const [searchChain, setSearchChain] = useState("ethereum");
  const [filterChain, setFilterChain] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const { data: addressesData, isLoading } = useQuery({
    queryKey: ["/api/scammer-addresses", filterChain, filterCategory],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterChain !== "all") params.append("chain", filterChain);
      if (filterCategory !== "all") params.append("category", filterCategory);
      params.append("limit", "100");

      const response = await fetch(`/api/scammer-addresses?${params}`);
      if (!response.ok) throw new Error("Failed to fetch scammer addresses");
      return response.json() as Promise<{ addresses: ScammerAddress[]; total: number }>;
    },
  });

  const { data: searchResult, refetch: searchRefetch, isFetching: isSearching } = useQuery({
    queryKey: ["/api/scammer-addresses/search", searchAddress, searchChain],
    queryFn: async () => {
      if (!searchAddress) return null;

      const params = new URLSearchParams({
        address: searchAddress,
        chain: searchChain,
      });

      const response = await fetch(`/api/scammer-addresses/search?${params}`);
      if (!response.ok) throw new Error("Failed to search address");
      return response.json() as Promise<{ found: boolean; address: ScammerAddress | null }>;
    },
    enabled: false,
  });

  const handleSearch = () => {
    if (!searchAddress) {
      toast({
        title: "Address Required",
        description: "Please enter an address to search",
        variant: "destructive",
      });
      return;
    }
    searchRefetch();
  };

  const copyToClipboard = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "CRITICAL": return "destructive";
      case "HIGH": return "default";
      case "MEDIUM": return "secondary";
      default: return "outline";
    }
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-destructive/10 rounded-lg">
          <AlertTriangle className="w-6 h-6 text-destructive" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Scammer Address Database</h1>
          <p className="text-muted-foreground">
            Public database of known malicious addresses across 126+ blockchains
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <Card data-testid="stat-card-total-addresses">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Addresses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{addressesData?.total || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Known scammers</p>
          </CardContent>
        </Card>

        <Card data-testid="stat-card-active-threats">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Threats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {addressesData?.addresses.filter(a => a.isActive).length || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Currently active</p>
          </CardContent>
        </Card>

        <Card data-testid="stat-card-total-stolen">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Stolen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {formatCurrency(
                addressesData?.addresses.reduce((sum, a) => sum + (a.totalStolen || 0), 0) || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Estimated losses</p>
          </CardContent>
        </Card>

        <Card data-testid="stat-card-victims">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Victims</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {addressesData?.addresses.reduce((sum, a) => sum + (a.victimCount || 0), 0) || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Affected users</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Search Address</CardTitle>
          <CardDescription>
            Check if a wallet or contract address is flagged as malicious
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-12 gap-4">
            <div className="md:col-span-7">
              <Input
                placeholder="0x... or Solana address"
                value={searchAddress}
                onChange={(e) => setSearchAddress(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                data-testid="input-search-address"
              />
            </div>
            <div className="md:col-span-3">
              <Select value={searchChain} onValueChange={setSearchChain}>
                <SelectTrigger data-testid="select-search-chain">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHAINS.filter(c => c !== "all").map(chain => (
                    <SelectItem key={chain} value={chain}>
                      {chain.charAt(0).toUpperCase() + chain.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Button
                onClick={handleSearch}
                disabled={isSearching || !searchAddress}
                className="w-full"
                data-testid="button-search"
              >
                {isSearching ? "Searching..." : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Search
                  </>
                )}
              </Button>
            </div>
          </div>

          {searchResult && (
            <div className="mt-4">
              {searchResult.found ? (
                <Card className="border-destructive">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-destructive" />
                        <CardTitle className="text-lg">SCAMMER ADDRESS DETECTED</CardTitle>
                      </div>
                      <Badge variant={getSeverityColor(searchResult.address!.severity)}>
                        {searchResult.address!.severity}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Address</p>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="flex-1 p-2 bg-muted rounded text-xs">{searchResult.address!.address}</code>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => copyToClipboard(searchResult.address!.address)}
                        >
                          {copiedAddress === searchResult.address!.address ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Chain</p>
                        <p className="font-medium capitalize">{searchResult.address!.chain}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Category</p>
                        <Badge variant="outline" className="capitalize">{searchResult.address!.category}</Badge>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Stolen</p>
                        <p className="font-medium text-destructive">{formatCurrency(searchResult.address!.totalStolen)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Victims</p>
                        <p className="font-medium">{searchResult.address!.victimCount}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Description</p>
                      <p className="text-sm mt-1">{searchResult.address!.description}</p>
                    </div>
                    {searchResult.address!.associatedScam && (
                      <div>
                        <p className="text-sm text-muted-foreground">Associated Scam</p>
                        <p className="font-medium">{searchResult.address!.associatedScam}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-green-500/50">
                  <CardContent className="py-4">
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-green-500" />
                      <div>
                        <p className="font-medium">Address Not Found in Scammer Database</p>
                        <p className="text-sm text-muted-foreground">
                          This address is not currently flagged as malicious
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Scammer Addresses</CardTitle>
              <CardDescription>Browse and filter known malicious addresses</CardDescription>
            </div>
            <div className="flex gap-3">
              <Select value={filterChain} onValueChange={setFilterChain}>
                <SelectTrigger className="w-[150px]" data-testid="select-filter-chain">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHAINS.map(chain => (
                    <SelectItem key={chain} value={chain}>
                      {chain === "all" ? "All Chains" : chain.charAt(0).toUpperCase() + chain.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-[150px]" data-testid="select-filter-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(category => (
                    <SelectItem key={category} value={category}>
                      {category === "all" ? "All Categories" : category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading scammer addresses...</div>
          ) : !addressesData?.addresses.length ? (
            <div className="text-center py-8 text-muted-foreground">No addresses found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Address</TableHead>
                  <TableHead>Chain</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead className="text-right">Stolen</TableHead>
                  <TableHead className="text-right">Victims</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {addressesData.addresses.map((address) => (
                  <TableRow key={address.id} data-testid={`row-address-${address.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="text-xs">
                          {address.address.slice(0, 8)}...{address.address.slice(-6)}
                        </code>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(address.address)}
                        >
                          {copiedAddress === address.address ? (
                            <Check className="w-3 h-3" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{address.chain}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">{address.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getSeverityColor(address.severity)}>{address.severity}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium text-destructive">
                      {formatCurrency(address.totalStolen)}
                    </TableCell>
                    <TableCell className="text-right">{address.victimCount}</TableCell>
                    <TableCell>
                      {address.isActive ? (
                        <Badge variant="destructive">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
