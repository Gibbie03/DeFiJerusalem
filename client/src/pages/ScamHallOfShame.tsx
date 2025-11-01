import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Skull, Clock, DollarSign, AlertTriangle, Shield, ExternalLink, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'wouter';
import type { BlacklistEntry } from '@shared/schema';

interface BlacklistWithDetails extends BlacklistEntry {
  threatCount?: number;
}

export default function ScamHallOfShame() {
  useEffect(() => {
    document.title = 'Scam Hall of Shame - Confirmed Crypto Scams Caught by JERUSALEM';
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'See real scams and rug pulls caught by JERUSALEM DeFi Security Scanner. Learn from actual cases of wallet drainers, honeypots, and exit scams with detailed threat analysis.');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = 'See real scams and rug pulls caught by JERUSALEM DeFi Security Scanner. Learn from actual cases of wallet drainers, honeypots, and exit scams with detailed threat analysis.';
      document.head.appendChild(meta);
    }

    const ogTitle = document.querySelector('meta[property="og:title"]') || document.createElement('meta');
    ogTitle.setAttribute('property', 'og:title');
    ogTitle.setAttribute('content', 'Scam Hall of Shame - JERUSALEM Security');
    if (!ogTitle.parentElement) document.head.appendChild(ogTitle);

    const ogDescription = document.querySelector('meta[property="og:description"]') || document.createElement('meta');
    ogDescription.setAttribute('property', 'og:description');
    ogDescription.setAttribute('content', 'Real cryptocurrency scams caught and documented by JERUSALEM. See how we protect DeFi users from wallet drainers, rug pulls, and honeypots.');
    if (!ogDescription.parentElement) document.head.appendChild(ogDescription);
  }, []);

  const { data: scams, isLoading } = useQuery<BlacklistWithDetails[]>({
    queryKey: ['/api/blacklist'],
    select: (data: BlacklistEntry[]) => {
      // Only show CRITICAL severity scams that are ACTIVE
      return data
        .filter((entry: BlacklistEntry) => entry.severity === 'CRITICAL' && entry.status === 'ACTIVE')
        .sort((a: BlacklistEntry, b: BlacklistEntry) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
    }
  });

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  function formatTimeAgo(dateString: string): string {
    const now = new Date();
    const then = new Date(dateString);
    const diffMs = now.getTime() - then.getTime();
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
        <div className="text-center space-y-4 pb-8 border-b">
          <Skeleton className="h-20 w-20 rounded-xl mx-auto" />
          <Skeleton className="h-10 w-96 mx-auto" />
          <Skeleton className="h-6 w-full max-w-2xl mx-auto" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  const totalScams = scams?.length || 0;
  const recentScams = scams?.filter((s: BlacklistWithDetails) => {
    const daysSince = (new Date().getTime() - new Date(s.createdAt || '').getTime()) / 86400000;
    return daysSince <= 30;
  }).length || 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8" data-testid="page-scam-hall-of-shame">
      {/* Hero Section */}
      <div className="text-center space-y-4 pb-8 border-b">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-destructive to-red-900 rounded-xl mb-4">
          <Skull className="w-10 h-10 text-destructive-foreground" />
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-destructive via-red-500 to-destructive bg-clip-text text-transparent">
          Scam Hall of Shame
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Real cryptocurrency scams caught by JERUSALEM. Learn from these confirmed cases to protect yourself from wallet drainers, rug pulls, and honeypots.
        </p>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Scams Caught</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Skull className="w-5 h-5 text-destructive" />
              <span className="text-3xl font-bold text-destructive">{totalScams}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Confirmed CRITICAL severity threats</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Recent (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-500" />
              <span className="text-3xl font-bold text-orange-500">{recentScams}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Newly detected threats</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Protection Level</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <span className="text-3xl font-bold text-primary">100%</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">All threats automatically blacklisted</p>
          </CardContent>
        </Card>
      </div>

      {/* Info Alert */}
      <Card className="border-destructive/20 bg-destructive/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="font-semibold text-destructive">Why We Share This</p>
              <p className="text-sm text-muted-foreground">
                Transparency is crucial in fighting crypto scams. By publicly documenting confirmed scams, we help the community learn red flags, understand attack patterns, and avoid similar traps. Each entry below represents a real threat that JERUSALEM detected and blocked to protect users.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scams List */}
      {totalScams === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-semibold mb-2">No Critical Scams Detected Yet</p>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              JERUSALEM is actively monitoring for critical threats. When scams are detected, they'll appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Confirmed Scams ({totalScams})</h2>
            <Link href="/blacklist">
              <Button variant="outline" size="sm">
                View Full Blacklist
                <ExternalLink className="w-3 h-3 ml-2" />
              </Button>
            </Link>
          </div>

          <div className="space-y-4">
            {scams?.map((scam: BlacklistWithDetails, index: number) => (
              <Card 
                key={scam.id} 
                className="border-destructive/20 hover-elevate"
                data-testid={`scam-card-${index}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="destructive" data-testid={`scam-severity-${index}`}>
                          CRITICAL SCAM
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Caught {formatTimeAgo(scam.createdAt || '')}
                        </span>
                      </div>
                      <CardTitle className="text-xl mb-1" data-testid={`scam-name-${index}`}>
                        {scam.name || scam.url || 'Unknown Protocol'}
                      </CardTitle>
                      {scam.url && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <ExternalLink className="w-3 h-3" />
                          <code className="text-xs">{scam.url}</code>
                        </div>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="flex items-center gap-1 text-destructive font-semibold">
                        <TrendingDown className="w-4 h-4" />
                        Score: {scam.securityScore}
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold mb-2">Threat Analysis:</p>
                    <p className="text-sm text-muted-foreground">
                      {scam.reason || 'Critical security threats detected. This protocol exhibits multiple red flags characteristic of scam operations.'}
                    </p>
                  </div>

                  {scam.contractAddresses && scam.contractAddresses.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold mb-2">Malicious Contract Address:</p>
                      <div className="space-y-1">
                        {scam.contractAddresses.slice(0, 3).map((addr: string, i: number) => (
                          <code key={i} className="block text-xs bg-muted px-2 py-1 rounded font-mono">
                            {addr}
                          </code>
                        ))}
                        {scam.contractAddresses.length > 3 && (
                          <p className="text-xs text-muted-foreground">
                            +{scam.contractAddresses.length - 3} more contract{scam.contractAddresses.length - 3 !== 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      Blacklisted: {formatDate(scam.createdAt || '')}
                    </div>
                    <Link href={`/blacklist/${scam.id}`}>
                      <Button size="sm" variant="outline" data-testid={`button-view-scam-${index}`}>
                        View Full Analysis
                        <ExternalLink className="w-3 h-3 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Bottom CTA */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <Shield className="w-12 h-12 text-primary mx-auto" />
            <div>
              <h3 className="text-xl font-bold mb-2">Protect Yourself from Scams</h3>
              <p className="text-sm text-muted-foreground max-w-2xl mx-auto mb-4">
                Don't become the next victim. Use JERUSALEM to verify protocols before interacting, check our blacklist before investing, and learn about threat patterns in our encyclopedia.
              </p>
              <div className="flex gap-2 justify-center flex-wrap">
                <Link href="/scan-website">
                  <Button>
                    <Shield className="w-4 h-4 mr-2" />
                    Scan a Website
                  </Button>
                </Link>
                <Link href="/threats/encyclopedia">
                  <Button variant="outline">
                    Learn About Threats
                  </Button>
                </Link>
                <Link href="/blacklist">
                  <Button variant="outline">
                    Check Blacklist
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
