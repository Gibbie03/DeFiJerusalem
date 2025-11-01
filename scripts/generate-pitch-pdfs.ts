import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

const BRAND_COLORS = {
  primary: '#3b82f6',      // Blue
  purple: '#a855f7',       // Purple
  amber: '#f59e0b',        // Amber
  green: '#10b981',        // Green
  dark: '#0f172a',         // Dark background
  text: '#1e293b',         // Text color
  lightGray: '#64748b',    // Light gray
};

interface SponsorshipTier {
  name: string;
  price: string;
  color: string;
  features: string[];
  ideal: string;
  roi: {
    visibility: string;
    traffic: string;
    conversions: string;
    socialReach: string;
  };
}

const TIERS: Record<string, SponsorshipTier> = {
  featured: {
    name: 'Featured',
    price: '$500-$1,000/month',
    color: BRAND_COLORS.primary,
    features: [
      'Verified badge on protocol listing',
      'Priority placement in category',
      'Highlighted in search results',
      'Social media mentions (2x/month)',
      'Enhanced protocol details display',
    ],
    ideal: 'Growing protocols seeking visibility',
    roi: {
      visibility: '50,000+ monthly impressions',
      traffic: '500-1,000 qualified visitors/month',
      conversions: '3-5% user conversion rate',
      socialReach: '20,000+ social media reach',
    },
  },
  sponsored: {
    name: 'Sponsored',
    price: '$2,000-$5,000/month',
    color: BRAND_COLORS.purple,
    features: [
      'All Featured benefits',
      'Top 10 trending section placement',
      'Sponsored badge with custom messaging',
      'Homepage featured slot',
      'Dedicated X article feature',
      'Social media spotlight (4x/month)',
      'Priority customer support',
      'Advanced analytics dashboard',
    ],
    ideal: 'Established protocols driving user acquisition',
    roi: {
      visibility: '150,000+ monthly impressions',
      traffic: '2,000-4,000 qualified visitors/month',
      conversions: '5-8% user conversion rate',
      socialReach: '100,000+ social media reach',
    },
  },
  premium: {
    name: 'Premium',
    price: '$10,000+/month',
    color: BRAND_COLORS.amber,
    features: [
      'All Sponsored benefits',
      'Exclusive homepage banner placement',
      'Custom branded landing page',
      'Dedicated X thread series (weekly)',
      'Co-branded security reports',
      'White-label partnership opportunities',
      'Direct integration support',
      'Quarterly strategy sessions',
      'Custom analytics & reporting',
    ],
    ideal: 'Major protocols seeking maximum exposure',
    roi: {
      visibility: '500,000+ monthly impressions',
      traffic: '10,000-20,000 qualified visitors/month',
      conversions: '8-12% user conversion rate',
      socialReach: '500,000+ social media reach',
    },
  },
};

function createHeader(doc: PDFKit.PDFDocument, title: string) {
  doc
    .fontSize(32)
    .fillColor(BRAND_COLORS.text)
    .font('Helvetica-Bold')
    .text('DeFiJerusalem', 50, 50);

  doc
    .fontSize(12)
    .fillColor(BRAND_COLORS.lightGray)
    .font('Helvetica')
    .text('The Trusted Source for DeFi Protocols & Security', 50, 90);

  doc
    .fontSize(24)
    .fillColor(BRAND_COLORS.text)
    .font('Helvetica-Bold')
    .text(title, 50, 140);
}

function createSponsorshipPDF(tier: SponsorshipTier, filename: string) {
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 50, bottom: 50, left: 50, right: 50 },
  });

  const outputPath = path.join(process.cwd(), 'pitch-decks', filename);
  
  // Ensure output directory exists
  if (!fs.existsSync(path.join(process.cwd(), 'pitch-decks'))) {
    fs.mkdirSync(path.join(process.cwd(), 'pitch-decks'), { recursive: true });
  }

  doc.pipe(fs.createWriteStream(outputPath));

  // PAGE 1: Cover
  createHeader(doc, `${tier.name} Tier Sponsorship`);

  doc
    .fontSize(18)
    .fillColor(tier.color)
    .font('Helvetica-Bold')
    .text(tier.price, 50, 200);

  doc
    .fontSize(14)
    .fillColor(BRAND_COLORS.text)
    .font('Helvetica')
    .text(tier.ideal, 50, 230, { width: 500 });

  // Value Proposition
  doc
    .fontSize(16)
    .fillColor(BRAND_COLORS.text)
    .font('Helvetica-Bold')
    .text('Why DeFiJerusalem?', 50, 280);

  const valueProps = [
    'Reach 126+ blockchain communities with 6,651+ protocols tracked',
    'Target security-conscious DeFi users actively seeking trusted protocols',
    'Leverage our 38+ threat detection categories for credibility',
    'Benefit from organic SEO traffic and social media presence',
  ];

  let yPos = 310;
  valueProps.forEach((prop) => {
    doc
      .fontSize(11)
      .fillColor(BRAND_COLORS.text)
      .font('Helvetica')
      .text('•', 50, yPos)
      .text(prop, 70, yPos, { width: 480 });
    yPos += 30;
  });

  // PAGE 2: Features & Benefits
  doc.addPage();
  doc
    .fontSize(24)
    .fillColor(BRAND_COLORS.text)
    .font('Helvetica-Bold')
    .text('What You Get', 50, 50);

  yPos = 100;
  tier.features.forEach((feature, index) => {
    doc
      .fontSize(14)
      .fillColor(tier.color)
      .font('Helvetica-Bold')
      .text(`${index + 1}.`, 50, yPos);

    doc
      .fontSize(12)
      .fillColor(BRAND_COLORS.text)
      .font('Helvetica')
      .text(feature, 75, yPos, { width: 480 });

    yPos += 35;
  });

  // PAGE 3: ROI & Impact
  doc.addPage();
  doc
    .fontSize(24)
    .fillColor(BRAND_COLORS.text)
    .font('Helvetica-Bold')
    .text('Expected ROI & Impact', 50, 50);

  const metrics = [
    { label: 'Monthly Visibility', value: tier.roi.visibility, icon: '👁' },
    { label: 'Qualified Traffic', value: tier.roi.traffic, icon: '🚀' },
    { label: 'User Conversion Rate', value: tier.roi.conversions, icon: '📈' },
    { label: 'Social Media Reach', value: tier.roi.socialReach, icon: '📢' },
  ];

  yPos = 120;
  metrics.forEach((metric) => {
    doc
      .fontSize(14)
      .fillColor(BRAND_COLORS.text)
      .font('Helvetica-Bold')
      .text(metric.label, 50, yPos);

    doc
      .fontSize(20)
      .fillColor(tier.color)
      .font('Helvetica-Bold')
      .text(metric.value, 50, yPos + 25);

    yPos += 80;
  });

  // PAGE 4: Platform Strengths
  doc.addPage();
  doc
    .fontSize(24)
    .fillColor(BRAND_COLORS.text)
    .font('Helvetica-Bold')
    .text('DeFiJerusalem Platform Strengths', 50, 50);

  const strengths = [
    {
      title: 'Multi-Chain Coverage',
      description: 'Support for 126+ blockchain networks ensures your protocol reaches users across all major ecosystems.',
    },
    {
      title: 'Security-First Audience',
      description: 'Our users actively seek secure, audited protocols - the perfect audience for quality DeFi projects.',
    },
    {
      title: 'Advanced Threat Detection',
      description: '38+ threat categories and GoPlus API integration position us as the industry standard for DeFi security.',
    },
    {
      title: 'Community Trust',
      description: 'User reporting system and public scammer database create a trusted ecosystem that benefits legitimate protocols.',
    },
    {
      title: 'SEO & Discoverability',
      description: 'Enterprise-grade SEO optimization drives organic traffic from users searching for DeFi protocols.',
    },
  ];

  yPos = 120;
  strengths.forEach((strength) => {
    doc
      .fontSize(14)
      .fillColor(tier.color)
      .font('Helvetica-Bold')
      .text(strength.title, 50, yPos);

    doc
      .fontSize(11)
      .fillColor(BRAND_COLORS.text)
      .font('Helvetica')
      .text(strength.description, 50, yPos + 20, { width: 500 });

    yPos += 70;
  });

  // PAGE 5: How It Helps Your Protocol
  doc.addPage();
  doc
    .fontSize(24)
    .fillColor(BRAND_COLORS.text)
    .font('Helvetica-Bold')
    .text('How This Helps Your Protocol', 50, 50);

  const benefits = [
    {
      title: 'Increased User Acquisition',
      points: [
        'Direct exposure to security-conscious DeFi users',
        'Higher quality users who value audited, verified protocols',
        'Reduced customer acquisition cost through targeted visibility',
      ],
    },
    {
      title: 'Enhanced Credibility',
      points: [
        'Association with trusted security platform builds user confidence',
        'Verified badge signals legitimacy to potential users',
        'Featured placement demonstrates industry recognition',
      ],
    },
    {
      title: 'Competitive Advantage',
      points: [
        'Stand out in crowded DeFi marketplace',
        'Priority placement over non-sponsored competitors',
        'Custom messaging highlights your unique value proposition',
      ],
    },
    {
      title: 'Long-Term Growth',
      points: [
        'Build lasting brand presence in DeFi ecosystem',
        'Consistent exposure drives sustained user growth',
        'Analytics insights inform marketing optimization',
      ],
    },
  ];

  yPos = 120;
  benefits.forEach((benefit) => {
    if (yPos > 650) {
      doc.addPage();
      yPos = 50;
    }

    doc
      .fontSize(14)
      .fillColor(tier.color)
      .font('Helvetica-Bold')
      .text(benefit.title, 50, yPos);

    yPos += 25;

    benefit.points.forEach((point) => {
      doc
        .fontSize(11)
        .fillColor(BRAND_COLORS.text)
        .font('Helvetica')
        .text('•', 50, yPos)
        .text(point, 65, yPos, { width: 480 });
      yPos += 20;
    });

    yPos += 15;
  });

  // PAGE 6: Call to Action
  doc.addPage();
  doc
    .fontSize(28)
    .fillColor(tier.color)
    .font('Helvetica-Bold')
    .text('Ready to Get Started?', 50, 200, { align: 'center', width: 500 });

  doc
    .fontSize(14)
    .fillColor(BRAND_COLORS.text)
    .font('Helvetica')
    .text('Partner with DeFiJerusalem and reach the right audience for your protocol.', 50, 260, {
      align: 'center',
      width: 500,
    });

  // Contact Information
  yPos = 340;
  const contacts = [
    'Partnerships: partnerships@defijerusalem.com',
    'Telegram: t.me/gibbie03',
    'Website: defijerusalem.com',
  ];

  contacts.forEach((contact) => {
    doc
      .fontSize(12)
      .fillColor(BRAND_COLORS.text)
      .font('Helvetica')
      .text(contact, 50, yPos, { align: 'center', width: 500 });
    yPos += 25;
  });

  doc.end();
  console.log(`✓ Generated: ${filename}`);
}

function createTutorialPDF() {
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 50, bottom: 50, left: 50, right: 50 },
  });

  const filename = 'defijerusalem-tutorial-feature-benefits.pdf';
  const outputPath = path.join(process.cwd(), 'pitch-decks', filename);

  doc.pipe(fs.createWriteStream(outputPath));

  // PAGE 1: Cover
  createHeader(doc, 'Tutorial Feature Benefits');

  doc
    .fontSize(18)
    .fillColor(BRAND_COLORS.green)
    .font('Helvetica-Bold')
    .text('Increase Protocol Volume Through Educational Content', 50, 200, { width: 500 });

  doc
    .fontSize(14)
    .fillColor(BRAND_COLORS.text)
    .font('Helvetica')
    .text(
      'Leverage DeFiJerusalem\'s tutorial platform to educate users, drive adoption, and boost your protocol\'s transaction volume.',
      50,
      250,
      { width: 500 }
    );

  // PAGE 2: The Problem
  doc.addPage();
  doc
    .fontSize(24)
    .fillColor(BRAND_COLORS.text)
    .font('Helvetica-Bold')
    .text('The Challenge', 50, 50);

  const challenges = [
    {
      title: 'User Confusion',
      description: 'Many potential users don\'t understand how DeFi protocols work, leading to low adoption rates.',
    },
    {
      title: 'High Drop-Off Rates',
      description: 'Complex interfaces and unclear value propositions cause users to abandon protocols before transacting.',
    },
    {
      title: 'Low User Engagement',
      description: 'Without proper education, users don\'t fully utilize protocol features, limiting transaction volume.',
    },
    {
      title: 'Trust Barriers',
      description: 'Security concerns prevent users from depositing significant funds without understanding the technology.',
    },
  ];

  let yPos = 120;
  challenges.forEach((challenge) => {
    doc
      .fontSize(14)
      .fillColor(BRAND_COLORS.green)
      .font('Helvetica-Bold')
      .text(challenge.title, 50, yPos);

    doc
      .fontSize(11)
      .fillColor(BRAND_COLORS.text)
      .font('Helvetica')
      .text(challenge.description, 50, yPos + 20, { width: 500 });

    yPos += 70;
  });

  // PAGE 3: The Solution
  doc.addPage();
  doc
    .fontSize(24)
    .fillColor(BRAND_COLORS.text)
    .font('Helvetica-Bold')
    .text('The Solution: Tutorial Videos', 50, 50);

  const solutions = [
    {
      title: 'Step-by-Step Walkthroughs',
      description: 'Video tutorials guide users through your protocol\'s features, reducing confusion and increasing confidence.',
      impact: '40-60% reduction in user drop-off',
    },
    {
      title: 'Trust Building',
      description: 'Educational content demonstrates transparency and builds user trust in your protocol\'s security.',
      impact: '2-3x increase in average deposit size',
    },
    {
      title: 'Feature Discovery',
      description: 'Tutorials highlight advanced features users might miss, driving higher engagement and transaction volume.',
      impact: '25-35% increase in feature utilization',
    },
    {
      title: 'SEO Traffic',
      description: 'Optimized video content ranks for high-intent keywords, driving organic traffic to your protocol.',
      impact: '500-2,000 monthly organic visitors per video',
    },
  ];

  yPos = 120;
  solutions.forEach((solution) => {
    if (yPos > 600) {
      doc.addPage();
      yPos = 50;
    }

    doc
      .fontSize(14)
      .fillColor(BRAND_COLORS.green)
      .font('Helvetica-Bold')
      .text(solution.title, 50, yPos);

    doc
      .fontSize(11)
      .fillColor(BRAND_COLORS.text)
      .font('Helvetica')
      .text(solution.description, 50, yPos + 20, { width: 500 });

    doc
      .fontSize(11)
      .fillColor(BRAND_COLORS.green)
      .font('Helvetica-Bold')
      .text(`📊 Impact: ${solution.impact}`, 50, yPos + 45);

    yPos += 85;
  });

  // PAGE 4: How It Works
  doc.addPage();
  doc
    .fontSize(24)
    .fillColor(BRAND_COLORS.text)
    .font('Helvetica-Bold')
    .text('How Tutorial Features Work', 50, 50);

  const steps = [
    {
      step: '1',
      title: 'Content Creation',
      description: 'Create high-quality video tutorials explaining your protocol\'s features, use cases, and benefits.',
    },
    {
      step: '2',
      title: 'Platform Integration',
      description: 'Upload tutorials to DeFiJerusalem where they\'re featured alongside your protocol listing.',
    },
    {
      step: '3',
      title: 'SEO Optimization',
      description: 'Our team optimizes video titles, descriptions, and tags for maximum search visibility.',
    },
    {
      step: '4',
      title: 'Multi-Channel Promotion',
      description: 'Tutorials are promoted across our social channels, newsletter, and partner networks.',
    },
    {
      step: '5',
      title: 'User Engagement',
      description: 'Users discover tutorials, learn about your protocol, and convert into active participants.',
    },
    {
      step: '6',
      title: 'Analytics & Optimization',
      description: 'Track video performance, user engagement, and conversion metrics to refine your strategy.',
    },
  ];

  yPos = 120;
  steps.forEach((step) => {
    doc
      .fontSize(20)
      .fillColor(BRAND_COLORS.green)
      .font('Helvetica-Bold')
      .text(step.step, 50, yPos);

    doc
      .fontSize(14)
      .fillColor(BRAND_COLORS.text)
      .font('Helvetica-Bold')
      .text(step.title, 80, yPos + 2);

    doc
      .fontSize(11)
      .fillColor(BRAND_COLORS.text)
      .font('Helvetica')
      .text(step.description, 80, yPos + 22, { width: 460 });

    yPos += 65;
  });

  // PAGE 5: Measurable Benefits
  doc.addPage();
  doc
    .fontSize(24)
    .fillColor(BRAND_COLORS.text)
    .font('Helvetica-Bold')
    .text('Measurable Benefits', 50, 50);

  const benefits = [
    {
      metric: 'User Acquisition',
      before: '500 users/month',
      after: '1,500-2,000 users/month',
      increase: '+200-300%',
    },
    {
      metric: 'Transaction Volume',
      before: '$5M/month TVL',
      after: '$15-20M/month TVL',
      increase: '+200-300%',
    },
    {
      metric: 'Average Session Time',
      before: '2-3 minutes',
      after: '8-12 minutes',
      increase: '+300-400%',
    },
    {
      metric: 'Conversion Rate',
      before: '2-3%',
      after: '8-12%',
      increase: '+300-400%',
    },
  ];

  yPos = 120;
  benefits.forEach((benefit) => {
    doc
      .fontSize(14)
      .fillColor(BRAND_COLORS.green)
      .font('Helvetica-Bold')
      .text(benefit.metric, 50, yPos);

    doc
      .fontSize(11)
      .fillColor(BRAND_COLORS.lightGray)
      .font('Helvetica')
      .text(`Before: ${benefit.before}`, 50, yPos + 25);

    doc
      .fontSize(11)
      .fillColor(BRAND_COLORS.text)
      .font('Helvetica-Bold')
      .text(`After: ${benefit.after}`, 50, yPos + 43);

    doc
      .fontSize(14)
      .fillColor(BRAND_COLORS.green)
      .font('Helvetica-Bold')
      .text(benefit.increase, 350, yPos + 10);

    yPos += 85;
  });

  // PAGE 6: Case Study Example
  doc.addPage();
  doc
    .fontSize(24)
    .fillColor(BRAND_COLORS.text)
    .font('Helvetica-Bold')
    .text('Success Story Example', 50, 50);

  doc
    .fontSize(16)
    .fillColor(BRAND_COLORS.green)
    .font('Helvetica-Bold')
    .text('DeFi Lending Protocol Case Study', 50, 100);

  const caseStudy = [
    {
      label: 'Challenge',
      text: 'Low user adoption due to complex lending mechanics and unfamiliarity with collateralization concepts.',
    },
    {
      label: 'Solution',
      text: 'Created 5 tutorial videos covering: platform basics, collateral management, yield optimization, risk management, and advanced strategies.',
    },
    {
      label: 'Results (3 months)',
      text: '• 12,000+ video views\n• 2,400 new users (200% increase)\n• $18M TVL increase (360% growth)\n• 89% positive user feedback\n• #3 trending protocol on DeFiJerusalem',
    },
  ];

  yPos = 150;
  caseStudy.forEach((item) => {
    doc
      .fontSize(12)
      .fillColor(BRAND_COLORS.green)
      .font('Helvetica-Bold')
      .text(item.label, 50, yPos);

    doc
      .fontSize(11)
      .fillColor(BRAND_COLORS.text)
      .font('Helvetica')
      .text(item.text, 50, yPos + 18, { width: 500 });

    yPos += 90;
  });

  // PAGE 7: Why DeFiJerusalem for Tutorials
  doc.addPage();
  doc
    .fontSize(24)
    .fillColor(BRAND_COLORS.text)
    .font('Helvetica-Bold')
    .text('Why Choose DeFiJerusalem?', 50, 50);

  const advantages = [
    {
      title: 'Targeted Audience',
      description: 'Reach users already interested in DeFi security and quality protocols - the ideal audience for educational content.',
    },
    {
      title: 'SEO Expertise',
      description: 'Our platform is optimized for search engines, ensuring your tutorials rank for high-value keywords.',
    },
    {
      title: 'Multi-Chain Community',
      description: 'Access to 126+ blockchain communities ensures your tutorials reach users across all ecosystems.',
    },
    {
      title: 'Credibility by Association',
      description: 'Being featured on a trusted security platform adds legitimacy and trustworthiness to your protocol.',
    },
    {
      title: 'Social Amplification',
      description: 'Our social media channels (100K+ combined reach) promote tutorials to maximize visibility.',
    },
    {
      title: 'Analytics & Insights',
      description: 'Detailed performance metrics help you understand what content resonates and optimize accordingly.',
    },
  ];

  yPos = 120;
  advantages.forEach((advantage) => {
    if (yPos > 650) {
      doc.addPage();
      yPos = 50;
    }

    doc
      .fontSize(13)
      .fillColor(BRAND_COLORS.green)
      .font('Helvetica-Bold')
      .text(advantage.title, 50, yPos);

    doc
      .fontSize(11)
      .fillColor(BRAND_COLORS.text)
      .font('Helvetica')
      .text(advantage.description, 50, yPos + 18, { width: 500 });

    yPos += 60;
  });

  // PAGE 8: Getting Started
  doc.addPage();
  doc
    .fontSize(24)
    .fillColor(BRAND_COLORS.text)
    .font('Helvetica-Bold')
    .text('Getting Started', 50, 50);

  const gettingStarted = [
    {
      step: 'Step 1',
      title: 'Initial Consultation',
      description: 'Contact us to discuss your protocol and tutorial content strategy.',
    },
    {
      step: 'Step 2',
      title: 'Content Planning',
      description: 'We help you identify the most impactful tutorial topics based on user needs and SEO research.',
    },
    {
      step: 'Step 3',
      title: 'Video Production',
      description: 'Create your tutorials (we can recommend production partners if needed).',
    },
    {
      step: 'Step 4',
      title: 'Platform Integration',
      description: 'Upload tutorials to DeFiJerusalem with optimized metadata and descriptions.',
    },
    {
      step: 'Step 5',
      title: 'Launch & Promotion',
      description: 'We promote your tutorials across our channels and track performance metrics.',
    },
  ];

  yPos = 120;
  gettingStarted.forEach((item) => {
    doc
      .fontSize(12)
      .fillColor(BRAND_COLORS.green)
      .font('Helvetica-Bold')
      .text(item.step, 50, yPos);

    doc
      .fontSize(13)
      .fillColor(BRAND_COLORS.text)
      .font('Helvetica-Bold')
      .text(item.title, 120, yPos);

    doc
      .fontSize(11)
      .fillColor(BRAND_COLORS.text)
      .font('Helvetica')
      .text(item.description, 120, yPos + 18, { width: 420 });

    yPos += 60;
  });

  // PAGE 9: Pricing & Packages
  doc.addPage();
  doc
    .fontSize(24)
    .fillColor(BRAND_COLORS.text)
    .font('Helvetica-Bold')
    .text('Tutorial Feature Packages', 50, 50);

  const packages = [
    {
      name: 'Starter',
      price: 'Included with Featured Tier',
      features: ['Up to 2 tutorial videos', 'Basic SEO optimization', 'Protocol page integration', 'Monthly performance report'],
    },
    {
      name: 'Growth',
      price: 'Included with Sponsored Tier',
      features: [
        'Up to 5 tutorial videos',
        'Advanced SEO optimization',
        'Homepage tutorial section',
        'Social media promotion (2x/month)',
        'Weekly performance reports',
      ],
    },
    {
      name: 'Enterprise',
      price: 'Included with Premium Tier',
      features: [
        'Unlimited tutorial videos',
        'Premium SEO optimization',
        'Dedicated tutorial landing page',
        'Social media promotion (weekly)',
        'Video production assistance',
        'Daily performance tracking',
        'Quarterly strategy sessions',
      ],
    },
  ];

  yPos = 120;
  packages.forEach((pkg) => {
    if (yPos > 600) {
      doc.addPage();
      yPos = 50;
    }

    doc
      .fontSize(16)
      .fillColor(BRAND_COLORS.green)
      .font('Helvetica-Bold')
      .text(pkg.name, 50, yPos);

    doc
      .fontSize(12)
      .fillColor(BRAND_COLORS.lightGray)
      .font('Helvetica')
      .text(pkg.price, 50, yPos + 22);

    yPos += 50;

    pkg.features.forEach((feature) => {
      doc
        .fontSize(10)
        .fillColor(BRAND_COLORS.text)
        .font('Helvetica')
        .text('✓', 50, yPos)
        .text(feature, 65, yPos, { width: 480 });
      yPos += 18;
    });

    yPos += 20;
  });

  // PAGE 10: Call to Action
  doc.addPage();
  doc
    .fontSize(28)
    .fillColor(BRAND_COLORS.green)
    .font('Helvetica-Bold')
    .text('Ready to Boost Your Protocol Volume?', 50, 200, { align: 'center', width: 500 });

  doc
    .fontSize(14)
    .fillColor(BRAND_COLORS.text)
    .font('Helvetica')
    .text('Start leveraging tutorial content to educate users and drive adoption.', 50, 260, {
      align: 'center',
      width: 500,
    });

  // Contact Information
  yPos = 340;
  const contacts = [
    'Partnerships: partnerships@defijerusalem.com',
    'Telegram: t.me/gibbie03',
    'Website: defijerusalem.com',
  ];

  contacts.forEach((contact) => {
    doc
      .fontSize(12)
      .fillColor(BRAND_COLORS.text)
      .font('Helvetica')
      .text(contact, 50, yPos, { align: 'center', width: 500 });
    yPos += 25;
  });

  doc.end();
  console.log(`✓ Generated: ${filename}`);
}

// Generate all PDFs
console.log('Generating DeFiJerusalem pitch deck PDFs...\n');

createSponsorshipPDF(TIERS.featured, 'defijerusalem-featured-tier-sponsorship.pdf');
createSponsorshipPDF(TIERS.sponsored, 'defijerusalem-sponsored-tier-sponsorship.pdf');
createSponsorshipPDF(TIERS.premium, 'defijerusalem-premium-tier-sponsorship.pdf');
createTutorialPDF();

console.log('\n✨ All pitch decks generated successfully in ./pitch-decks/');
