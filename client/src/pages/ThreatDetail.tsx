import { useEffect } from 'react';
import { useRoute, Link, useLocation } from 'wouter';
import { 
  Shield, 
  AlertTriangle, 
  ArrowLeft, 
  ExternalLink, 
  Clock,
  CheckCircle2,
  Zap,
  Eye,
  Share2,
  Home,
  ChevronRight,
  Flag
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { THREAT_TYPES, THREAT_CATEGORIES, ThreatTypeInfo } from '@/data/threatTypes';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

function getSeverityColor(category: string): string {
  switch (category) {
    case 'critical':
      return 'bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/50';
    case 'high':
      return 'bg-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-500/50';
    case 'medium':
      return 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/50';
    case 'low':
      return 'bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/50';
    default:
      return 'bg-muted/50 text-muted-foreground';
  }
}

function getPrevalenceColor(prevalence: string): string {
  switch (prevalence) {
    case 'very_common':
      return 'text-red-600 dark:text-red-400';
    case 'common':
      return 'text-orange-600 dark:text-orange-400';
    case 'uncommon':
      return 'text-yellow-600 dark:text-yellow-400';
    case 'rare':
      return 'text-blue-600 dark:text-blue-400';
    default:
      return 'text-muted-foreground';
  }
}

function getPrevalenceLabel(prevalence: string): string {
  switch (prevalence) {
    case 'very_common':
      return 'Very Common';
    case 'common':
      return 'Common';
    case 'uncommon':
      return 'Uncommon';
    case 'rare':
      return 'Rare';
    default:
      return prevalence;
  }
}

export default function ThreatDetail() {
  const [, params] = useRoute('/threats/encyclopedia/:threatId');
  const [, setLocation] = useLocation();
  const threatId = params?.threatId;

  // Get threat data
  const threat = threatId ? THREAT_TYPES[threatId] : null;

  // SEO meta tags
  useEffect(() => {
    if (threat) {
      document.title = `${threat.name} Explained - How It Works & Protection | JERUSALEM`;
      
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', `${threat.shortDescription} Learn how ${threat.name} works, real-world examples, and expert protection strategies.`);
      } else {
        const meta = document.createElement('meta');
        meta.name = 'description';
        meta.content = `${threat.shortDescription} Learn how ${threat.name} works, real-world examples, and expert protection strategies.`;
        document.head.appendChild(meta);
      }

      // Open Graph tags
      const ogTitle = document.querySelector('meta[property="og:title"]') || document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      ogTitle.setAttribute('content', `${threat.name} - DeFi Security Threat Explained`);
      if (!ogTitle.parentElement) document.head.appendChild(ogTitle);

      const ogDescription = document.querySelector('meta[property="og:description"]') || document.createElement('meta');
      ogDescription.setAttribute('property', 'og:description');
      ogDescription.setAttribute('content', threat.shortDescription);
      if (!ogDescription.parentElement) document.head.appendChild(ogDescription);
    } else {
      document.title = 'Threat Not Found | JERUSALEM';
    }
  }, [threat]);

  // 404 handling
  if (!threat) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <Card className="py-12">
          <CardContent className="text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-red-500/20 rounded-full">
                <AlertTriangle className="h-12 w-12 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2" data-testid="text-threat-not-found">Threat Not Found</h2>
                <p className="text-muted-foreground mb-4">
                  The threat you're looking for doesn't exist or has been removed.
                </p>
              </div>
              <div className="flex gap-3">
                <Link href="/threats/encyclopedia">
                  <Button variant="default" data-testid="button-back-to-encyclopedia">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Encyclopedia
                  </Button>
                </Link>
                <Link href="/">
                  <Button variant="outline" data-testid="button-back-to-home">
                    <Home className="h-4 w-4 mr-2" />
                    Go Home
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Share functionality
  const handleShare = (platform: string) => {
    const url = window.location.href;
    const text = `Check out this DeFi security threat: ${threat.name}`;
    
    const shareUrls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
    };

    if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    // You could add a toast notification here
  };

  // Get related threats
  const relatedThreatsData = threat.relatedThreats
    .map(id => THREAT_TYPES[id])
    .filter(Boolean)
    .slice(0, 3); // Show max 3 related threats

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Breadcrumb Navigation */}
      <Breadcrumb className="mb-6" data-testid="breadcrumb-navigation">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/" data-testid="breadcrumb-home">
              <Home className="h-4 w-4" />
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <ChevronRight className="h-4 w-4" />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbLink href="/threats/encyclopedia" data-testid="breadcrumb-encyclopedia">
              Threat Encyclopedia
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <ChevronRight className="h-4 w-4" />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbPage data-testid="breadcrumb-current">{threat.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header Section */}
      <Card className="mb-8" data-testid="card-threat-header">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Badge 
                  variant="outline" 
                  className={`${getSeverityColor(threat.category)} text-sm`}
                  data-testid="badge-threat-severity"
                >
                  {threat.category.toUpperCase()}
                </Badge>
                <Badge variant="outline" data-testid="badge-threat-id">
                  ID: {threat.id}
                </Badge>
              </div>
              
              <h1 className="text-4xl font-bold mb-3" data-testid="heading-threat-name">
                {threat.name}
              </h1>
              
              <p className="text-lg text-muted-foreground mb-4" data-testid="text-threat-short-description">
                {threat.shortDescription}
              </p>

              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  <div>
                    <div className="text-xs text-muted-foreground">Threat Score</div>
                    <div className="font-bold text-lg" data-testid="text-threat-score">{threat.points}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" />
                  <div>
                    <div className="text-xs text-muted-foreground">Prevalence</div>
                    <div 
                      className={`font-semibold ${getPrevalenceColor(threat.prevalence)}`}
                      data-testid="text-threat-prevalence"
                    >
                      {getPrevalenceLabel(threat.prevalence)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <div>
                    <div className="text-xs text-muted-foreground">First Seen</div>
                    <div className="font-semibold" data-testid="text-threat-first-seen">{threat.firstSeen}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={() => setLocation('/submit-protocol')}
                data-testid="button-report-threat"
              >
                <Flag className="h-4 w-4" />
                Report This Threat
              </Button>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => handleShare('twitter')}
                  data-testid="button-share-twitter"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => handleShare('linkedin')}
                  data-testid="button-share-linkedin"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={handleCopyLink}
                  data-testid="button-copy-link"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Overview */}
          <Card data-testid="card-threat-overview">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base leading-relaxed" data-testid="text-threat-full-description">
                {threat.fullDescription}
              </p>
            </CardContent>
          </Card>

          {/* How It Works */}
          <Card data-testid="card-how-it-works">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-orange-500" />
                How It Works
              </CardTitle>
              <CardDescription>Technical explanation of the attack mechanism</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/50 p-4 rounded-lg border border-border">
                <p className="text-base leading-relaxed" data-testid="text-how-it-works">
                  {threat.howItWorks}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Real-World Example */}
          <Card data-testid="card-real-world-example">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Real-World Example
              </CardTitle>
              <CardDescription>Documented case study of this threat in action</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-red-500/10 p-4 rounded-lg border border-red-500/30">
                <p className="text-base leading-relaxed" data-testid="text-real-world-example">
                  {threat.realWorldExample}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Protection Measures */}
          <Card data-testid="card-protection-measures">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                How to Protect Yourself
              </CardTitle>
              <CardDescription>Expert-recommended security measures</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {threat.protection.map((measure, index) => (
                  <li 
                    key={index} 
                    className="flex gap-3"
                    data-testid={`list-item-protection-${index}`}
                  >
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-base">{measure}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Detection Method */}
          <Card data-testid="card-detection-method">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-blue-500" />
                How JERUSALEM Detects This Threat
              </CardTitle>
              <CardDescription>Our detection methodology and technology</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-blue-500/10 p-4 rounded-lg border border-blue-500/30">
                <p className="text-base leading-relaxed" data-testid="text-detection-method">
                  {threat.detectionMethod}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card data-testid="card-quick-stats">
            <CardHeader>
              <CardTitle className="text-lg">Threat Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Severity Level</div>
                <Badge 
                  variant="outline" 
                  className={getSeverityColor(threat.category)}
                  data-testid="badge-sidebar-severity"
                >
                  {threat.category.toUpperCase()}
                </Badge>
              </div>

              <Separator />

              <div>
                <div className="text-sm text-muted-foreground mb-1">Threat Score</div>
                <div className="text-2xl font-bold" data-testid="text-sidebar-score">{threat.points}</div>
              </div>

              <Separator />

              <div>
                <div className="text-sm text-muted-foreground mb-1">Prevalence</div>
                <div 
                  className={`font-semibold ${getPrevalenceColor(threat.prevalence)}`}
                  data-testid="text-sidebar-prevalence"
                >
                  {getPrevalenceLabel(threat.prevalence)}
                </div>
              </div>

              <Separator />

              <div>
                <div className="text-sm text-muted-foreground mb-1">First Documented</div>
                <div className="font-medium" data-testid="text-sidebar-first-seen">{threat.firstSeen}</div>
              </div>
            </CardContent>
          </Card>

          {/* Related Threats */}
          {relatedThreatsData.length > 0 && (
            <Card data-testid="card-related-threats">
              <CardHeader>
                <CardTitle className="text-lg">Related Threats</CardTitle>
                <CardDescription>Similar or connected security risks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {relatedThreatsData.map((relatedThreat) => (
                  <Link 
                    key={relatedThreat.id}
                    href={`/threats/encyclopedia/${relatedThreat.id}`}
                    data-testid={`link-related-threat-${relatedThreat.id}`}
                  >
                    <Card className="hover-elevate active-elevate-2 cursor-pointer transition-all">
                      <CardHeader className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold mb-1 line-clamp-2" data-testid={`text-related-name-${relatedThreat.id}`}>
                              {relatedThreat.name}
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {relatedThreat.shortDescription}
                            </p>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={`${getSeverityColor(relatedThreat.category)} text-xs shrink-0`}
                          >
                            {relatedThreat.category.toUpperCase()}
                          </Badge>
                        </div>
                      </CardHeader>
                    </Card>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Back to Encyclopedia */}
          <Link href="/threats/encyclopedia">
            <Button 
              variant="outline" 
              className="w-full gap-2"
              data-testid="button-back-to-encyclopedia-sidebar"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Encyclopedia
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
