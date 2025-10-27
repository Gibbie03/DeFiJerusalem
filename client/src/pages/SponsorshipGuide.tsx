import { Shield, TrendingUp, Star, Crown, Check, Mail } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AdSpace from '@/components/AdSpace';
import TrendingTicker from '@/components/TrendingTicker';
import type { Protocol } from '@shared/schema';

const PRICING_TIERS = [
  {
    name: 'Featured',
    tier: 'featured',
    icon: Star,
    price: '$500-$1,000',
    period: '/month',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
    features: [
      'Verified badge on protocol listing',
      'Priority placement in category',
      'Highlighted in search results',
      'Social media mentions (2x/month)',
      'Newsletter inclusion',
      'Enhanced protocol details display',
    ],
    ideal: 'Growing protocols seeking visibility',
  },
  {
    name: 'Sponsored',
    tier: 'sponsored',
    icon: TrendingUp,
    price: '$2,000-$5,000',
    period: '/month',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20',
    popular: true,
    features: [
      'All Featured benefits',
      'Top 10 trending section placement',
      'Sponsored badge with custom messaging',
      'Homepage featured slot',
      'Dedicated blog post feature',
      'Social media spotlight (4x/month)',
      'Priority customer support',
      'Advanced analytics dashboard',
    ],
    ideal: 'Established protocols driving user acquisition',
  },
  {
    name: 'Promoted',
    tier: 'promoted',
    icon: Crown,
    price: '$5,000-$10,000',
    period: '/month',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
    features: [
      'All Sponsored benefits',
      'Top 5 guaranteed trending placement',
      'Homepage hero section banner',
      'Custom landing page on our platform',
      'Video spotlight (homepage)',
      'Dedicated account manager',
      'Weekly performance reports',
      'Social media takeover (8x/month)',
      'Press release distribution',
      'Partnership announcement',
    ],
    ideal: 'Enterprise protocols maximizing market dominance',
  },
];

const REQUIREMENTS = [
  {
    title: 'Security Requirements',
    items: [
      'Smart contract audit from recognized firm',
      'No critical security vulnerabilities',
      'Active bug bounty program (Promoted tier)',
      'Pass our comprehensive security scan',
    ],
  },
  {
    title: 'Transparency Requirements',
    items: [
      'Verified team or doxxed founders',
      'Active GitHub repository',
      'Transparent tokenomics',
      'Regular community updates',
    ],
  },
  {
    title: 'Performance Requirements',
    items: [
      'Minimum $100K TVL (Featured)',
      'Minimum $1M TVL (Sponsored)',
      'Minimum $10M TVL (Promoted)',
      'Active trading volume (24h)',
    ],
  },
];

export default function SponsorshipGuide() {
  const handleContactSales = (tier: string) => {
    const email = 'sponsorships@jerusalem-defi.com';
    const subject = `${tier} Tier Sponsorship Inquiry`;
    const body = `Hello,\n\nI'm interested in the ${tier} sponsorship tier for our protocol.\n\nProtocol Name: [Your Protocol]\nWebsite: [Your Website]\nTVL: [Current TVL]\nContact: [Your Email]\n\nPlease provide more information about the sponsorship process.\n\nBest regards`;
    
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="bg-background min-h-screen">
      <AdSpace position="top" />
      
      <TrendingTicker onProtocolClick={(protocol: Protocol) => console.log('Clicked:', protocol)} />

      <main className="max-w-screen-2xl mx-auto px-6 py-8 space-y-12">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-primary via-accent to-primary rounded-lg flex items-center justify-center shadow-lg">
              <Shield className="w-10 h-10 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Sponsorship & Featured Listings
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Amplify your protocol's visibility on the #1 DeFi security platform. Reach 100K+ monthly users actively researching DeFi investments.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {PRICING_TIERS.map((tier) => {
            const Icon = tier.icon;
            return (
              <Card
                key={tier.tier}
                className={`relative ${tier.popular ? 'border-2 border-primary shadow-lg' : ''}`}
                data-testid={`tier-card-${tier.tier}`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="default" className="px-4 py-1">
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-4">
                  <div className={`w-12 h-12 ${tier.bgColor} rounded-lg flex items-center justify-center mx-auto mb-3`}>
                    <Icon className={`w-6 h-6 ${tier.color}`} />
                  </div>
                  <CardTitle className="text-2xl">{tier.name}</CardTitle>
                  <div className="flex items-baseline justify-center gap-1 mt-2">
                    <span className="text-3xl font-bold">{tier.price}</span>
                    <span className="text-muted-foreground">{tier.period}</span>
                  </div>
                  <CardDescription className="italic mt-2">{tier.ideal}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {tier.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    variant={tier.popular ? 'default' : 'outline'}
                    onClick={() => handleContactSales(tier.name)}
                    data-testid={`button-contact-${tier.tier}`}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Contact Sales
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              Sponsorship Requirements
            </CardTitle>
            <CardDescription>
              All sponsored protocols must meet minimum security and transparency standards to protect our users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {REQUIREMENTS.map((req) => (
                <div key={req.title} className="space-y-3">
                  <h3 className="font-semibold text-lg">{req.title}</h3>
                  <ul className="space-y-2">
                    {req.items.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/5 via-accent/5 to-primary/5 border-primary/20">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">How It Works</CardTitle>
            <CardDescription>Simple 3-step process to get your protocol featured</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto">
                  1
                </div>
                <h3 className="font-semibold text-lg">Contact Sales</h3>
                <p className="text-sm text-muted-foreground">
                  Reach out via email with your protocol details and preferred tier
                </p>
              </div>
              <div className="text-center space-y-3">
                <div className="w-16 h-16 bg-accent text-accent-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto">
                  2
                </div>
                <h3 className="font-semibold text-lg">Security Review</h3>
                <p className="text-sm text-muted-foreground">
                  Our team reviews your security audits and runs comprehensive scans
                </p>
              </div>
              <div className="text-center space-y-3">
                <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto">
                  3
                </div>
                <h3 className="font-semibold text-lg">Go Live</h3>
                <p className="text-sm text-muted-foreground">
                  Once approved, your sponsored listing goes live within 24-48 hours
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center space-y-4 py-8">
          <h2 className="text-2xl font-bold">Questions About Sponsorship?</h2>
          <p className="text-muted-foreground">
            Contact our partnerships team at{' '}
            <a
              href="mailto:sponsorships@jerusalem-defi.com"
              className="text-primary hover:underline font-semibold"
            >
              sponsorships@jerusalem-defi.com
            </a>
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Badge variant="outline" className="px-4 py-2">
              100K+ Monthly Users
            </Badge>
            <Badge variant="outline" className="px-4 py-2">
              6,000+ Protocols Tracked
            </Badge>
            <Badge variant="outline" className="px-4 py-2">
              #1 DeFi Security Platform
            </Badge>
          </div>
        </div>
      </main>

      <AdSpace position="bottom" />
    </div>
  );
}
