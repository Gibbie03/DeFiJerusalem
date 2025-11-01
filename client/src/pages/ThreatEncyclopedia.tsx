import { useState, useEffect, useMemo } from 'react';
import { Link } from 'wouter';
import { Search, Shield, AlertTriangle, TrendingUp, Clock, ExternalLink, Filter, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { THREAT_TYPES, THREAT_CATEGORIES, ThreatTypeInfo } from '@/data/threatTypes';

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

export default function ThreatEncyclopedia() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // SEO meta tags
  useEffect(() => {
    document.title = 'DeFi Threat Encyclopedia - 38+ Security Threats Explained & Protection Guide - DeFiJerusalem';
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Complete encyclopedia of 38+ cryptocurrency security threats including wallet drainers, rug pulls, honeypots, EIP-2612 permit exploits, and approval phishing. Expert-verified protection strategies for DeFi users across 126+ blockchains.');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = 'Complete encyclopedia of 38+ cryptocurrency security threats including wallet drainers, rug pulls, honeypots, EIP-2612 permit exploits, and approval phishing. Expert-verified protection strategies for DeFi users across 126+ blockchains.';
      document.head.appendChild(meta);
    }

    // Open Graph tags
    const ogTitle = document.querySelector('meta[property="og:title"]') || document.createElement('meta');
    ogTitle.setAttribute('property', 'og:title');
    ogTitle.setAttribute('content', 'DeFi Threat Encyclopedia - 38+ Security Threats Explained - DeFiJerusalem');
    if (!ogTitle.parentElement) document.head.appendChild(ogTitle);

    const ogDescription = document.querySelector('meta[property="og:description"]') || document.createElement('meta');
    ogDescription.setAttribute('property', 'og:description');
    ogDescription.setAttribute('content', 'Learn about the latest DeFi security threats including Pink Drainer, Angel Drainer, Inferno Drainer, honeypots, rug pulls, and more. Expert protection strategies across 126+ blockchains.');
    if (!ogDescription.parentElement) document.head.appendChild(ogDescription);
  }, []);

  // Get all threats as array
  const allThreats = useMemo(() => {
    return Object.values(THREAT_TYPES);
  }, []);

  // Filter threats based on search and category
  const filteredThreats = useMemo(() => {
    return allThreats.filter((threat) => {
      const matchesCategory = categoryFilter === 'all' || threat.category === categoryFilter;
      const matchesSearch = searchQuery === '' || 
        threat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        threat.shortDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
        threat.fullDescription.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [allThreats, categoryFilter, searchQuery]);

  // Group threats by category
  const threatsByCategory = useMemo(() => {
    const grouped: Record<string, ThreatTypeInfo[]> = {
      critical: [],
      high: [],
      medium: [],
      low: []
    };
    
    filteredThreats.forEach((threat) => {
      grouped[threat.category].push(threat);
    });

    // Sort by points within each category
    Object.keys(grouped).forEach((category) => {
      grouped[category].sort((a, b) => b.points - a.points);
    });

    return grouped;
  }, [filteredThreats]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalThreats = allThreats.length;
    const criticalCount = allThreats.filter(t => t.category === 'critical').length;
    const highCount = allThreats.filter(t => t.category === 'high').length;
    const mediumCount = allThreats.filter(t => t.category === 'medium').length;
    const lowCount = allThreats.filter(t => t.category === 'low').length;

    return {
      total: totalThreats,
      categories: 4,
      critical: criticalCount,
      high: highCount,
      medium: mediumCount,
      low: lowCount,
      lastUpdated: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    };
  }, [allThreats]);

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-primary to-accent rounded-lg">
            <Shield className="w-8 h-8 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Threat Encyclopedia
            </h1>
            <p className="text-muted-foreground text-lg mt-1">
              Comprehensive database of DeFi security threats, exploits, and scams
            </p>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card data-testid="card-stats-total-threats">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Threats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="text-stats-total-threats">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">Documented & Tracked</p>
          </CardContent>
        </Card>

        <Card data-testid="card-stats-categories">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="text-stats-categories">{stats.categories}</div>
            <p className="text-xs text-muted-foreground mt-1">Risk Levels</p>
          </CardContent>
        </Card>

        <Card data-testid="card-stats-critical">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Critical Threats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600 dark:text-red-400" data-testid="text-stats-critical">
              {stats.critical}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Highest Severity</p>
          </CardContent>
        </Card>

        <Card data-testid="card-stats-last-updated">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Last Updated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium" data-testid="text-stats-last-updated">
              {stats.lastUpdated}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Database Status</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search threats by name, description, or technique..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10"
                data-testid="input-search-threats"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
                  onClick={() => setSearchQuery('')}
                  data-testid="button-clear-search"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Category Filter Tabs */}
            <Tabs value={categoryFilter} onValueChange={setCategoryFilter}>
              <TabsList className="grid grid-cols-5 w-full md:w-auto" data-testid="tabs-category-filter">
                <TabsTrigger value="all" data-testid="tab-filter-all">All</TabsTrigger>
                <TabsTrigger value="critical" data-testid="tab-filter-critical">Critical</TabsTrigger>
                <TabsTrigger value="high" data-testid="tab-filter-high">High</TabsTrigger>
                <TabsTrigger value="medium" data-testid="tab-filter-medium">Medium</TabsTrigger>
                <TabsTrigger value="low" data-testid="tab-filter-low">Low</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Active Filter Indicator */}
          {(searchQuery || categoryFilter !== 'all') && (
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="h-4 w-4" />
              <span data-testid="text-filter-results">
                Showing {filteredThreats.length} of {allThreats.length} threats
              </span>
              {searchQuery && (
                <Badge variant="secondary" data-testid="badge-active-search">
                  Search: "{searchQuery}"
                </Badge>
              )}
              {categoryFilter !== 'all' && (
                <Badge variant="secondary" data-testid="badge-active-category">
                  Category: {categoryFilter.toUpperCase()}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Threat Cards by Category */}
      {Object.entries(THREAT_CATEGORIES).map(([categoryKey, categoryInfo]) => {
        const threats = threatsByCategory[categoryKey as keyof typeof threatsByCategory];
        
        if (threats.length === 0) return null;

        return (
          <div key={categoryKey} className="mb-12" data-testid={`section-category-${categoryKey}`}>
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <AlertTriangle className={`h-6 w-6 ${
                  categoryKey === 'critical' ? 'text-red-600 dark:text-red-400' :
                  categoryKey === 'high' ? 'text-orange-600 dark:text-orange-400' :
                  categoryKey === 'medium' ? 'text-yellow-600 dark:text-yellow-400' :
                  'text-blue-600 dark:text-blue-400'
                }`} />
                <h2 className="text-2xl font-bold" data-testid={`heading-category-${categoryKey}`}>
                  {categoryInfo.title}
                </h2>
                <Badge 
                  variant="outline" 
                  className={getSeverityColor(categoryKey)}
                  data-testid={`badge-category-count-${categoryKey}`}
                >
                  {threats.length} {threats.length === 1 ? 'Threat' : 'Threats'}
                </Badge>
              </div>
              <p className="text-muted-foreground">{categoryInfo.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {threats.map((threat) => (
                <Link 
                  key={threat.id} 
                  href={`/threats/encyclopedia/${threat.id}`}
                  data-testid={`link-threat-${threat.id}`}
                >
                  <Card className="h-full hover-elevate active-elevate-2 cursor-pointer transition-all">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <CardTitle className="text-lg line-clamp-2" data-testid={`text-threat-name-${threat.id}`}>
                          {threat.name}
                        </CardTitle>
                        <Badge 
                          variant="outline" 
                          className={`${getSeverityColor(threat.category)} shrink-0`}
                          data-testid={`badge-severity-${threat.id}`}
                        >
                          {threat.category.toUpperCase()}
                        </Badge>
                      </div>
                      <CardDescription className="line-clamp-3" data-testid={`text-threat-description-${threat.id}`}>
                        {threat.shortDescription}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {/* Points */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Threat Score</span>
                          <span className="font-bold text-lg" data-testid={`text-threat-points-${threat.id}`}>
                            {threat.points}
                          </span>
                        </div>

                        {/* Prevalence */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Prevalence</span>
                          <span 
                            className={`text-sm font-medium ${getPrevalenceColor(threat.prevalence)}`}
                            data-testid={`text-threat-prevalence-${threat.id}`}
                          >
                            {getPrevalenceLabel(threat.prevalence)}
                          </span>
                        </div>

                        {/* First Seen */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            First Seen
                          </span>
                          <span className="text-sm" data-testid={`text-threat-first-seen-${threat.id}`}>
                            {threat.firstSeen}
                          </span>
                        </div>

                        {/* Learn More Link */}
                        <Button 
                          variant="outline" 
                          className="w-full mt-2 gap-2"
                          data-testid={`button-learn-more-${threat.id}`}
                        >
                          Learn More
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        );
      })}

      {/* No Results Message */}
      {filteredThreats.length === 0 && (
        <Card className="py-12">
          <CardContent className="text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-muted rounded-full">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2" data-testid="text-no-results">No threats found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search or filter criteria
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('all');
                }}
                data-testid="button-reset-filters"
              >
                Reset Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
