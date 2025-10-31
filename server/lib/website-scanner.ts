/**
 * Website Security Scanner
 * Detects phishing websites, scam patterns, and malicious crypto sites
 */

export interface PhishingIndicator {
  type: 'url_pattern' | 'content_pattern' | 'domain_risk' | 'ssl_issue' | 'brand_impersonation';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  evidence: string;
}

export interface WebsiteSecurityScan {
  url: string;
  domain: string;
  isScam: boolean;
  riskScore: number; // 0-100
  severity: 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  indicators: PhishingIndicator[];
  summary: string;
  recommendations: string[];
}

// Known legitimate crypto brands for impersonation detection
const LEGITIMATE_BRANDS = [
  'metamask', 'uniswap', 'aave', 'compound', 'curve', 'pancakeswap',
  'coinbase', 'binance', 'kraken', 'gemini', 'opensea', 'lido',
  'ethereum', 'polygon', 'arbitrum', 'optimism', 'avalanche',
  'ledger', 'trezor', 'trust wallet', 'phantom', 'rainbow'
];

// Suspicious TLDs commonly used in phishing
const SUSPICIOUS_TLDS = [
  '.xyz', '.top', '.tk', '.ga', '.ml', '.cf', '.gq',
  '.pw', '.cc', '.ws', '.info', '.biz', '.buzz'
];

// Typosquatting patterns
const TYPOSQUATTING_PATTERNS = [
  { legit: 'metamask', variants: ['metmask', 'metarnask', 'metmamask', 'metemask', 'metamskk'] },
  { legit: 'coinbase', variants: ['coinbse', 'coinbass', 'coinbase-', 'coinhase', 'coinbaze'] },
  { legit: 'binance', variants: ['binence', 'binanse', 'binance-', 'binnance', 'binanc'] },
  { legit: 'uniswap', variants: ['unisvvap', 'uniswaap', 'uniswep', 'unisvap', 'uniwap'] },
  { legit: 'opensea', variants: ['openseea', 'opensee', 'opensae', 'opensaa', 'opnseea'] },
  { legit: 'ledger', variants: ['ledger-', 'ledgr', 'leedger', 'ledgger', 'legder'] },
  { legit: 'pancakeswap', variants: ['pancakeswaap', 'pancakewap', 'pancakesvap', 'pancakesswap'] },
  { legit: 'phantom', variants: ['phantomm', 'phanton', 'phantam', 'phantomwallet'] }
];

// Scam content patterns
const SCAM_CONTENT_PATTERNS = [
  { pattern: /urgent|immediate action|verify now|act now|limited time|account.*suspended/i, type: 'urgent_language', severity: 'HIGH' as const },
  { pattern: /claim.*airdrop|free.*eth|free.*btc|double.*crypto|guaranteed.*returns/i, type: 'too_good_to_be_true', severity: 'CRITICAL' as const },
  { pattern: /private key|seed phrase|recovery phrase|12 words|24 words|wallet.*password/i, type: 'credential_request', severity: 'CRITICAL' as const },
  { pattern: /connect.*wallet.*to.*claim|sign.*transaction|approve.*unlimited/i, type: 'wallet_connect_scam', severity: 'CRITICAL' as const },
  { pattern: /elon.*musk.*giveaway|vitalik.*giving|cz.*airdrop|celebrity.*crypto/i, type: 'celebrity_scam', severity: 'CRITICAL' as const },
  { pattern: /metamask.*support|uniswap.*support|coinbase.*help.*desk/i, type: 'fake_support', severity: 'HIGH' as const },
  { pattern: /kyc.*verification.*required|submit.*documents|prove.*identity/i, type: 'kyc_phishing', severity: 'HIGH' as const },
  { pattern: /drainer|drain.*wallet|approve.*all|set.*approval.*for.*all/i, type: 'drainer_code', severity: 'CRITICAL' as const }
];

// Suspicious URL patterns
const SUSPICIOUS_URL_PATTERNS = [
  { pattern: /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/, description: 'IP address in URL', severity: 'HIGH' as const },
  { pattern: /-wallet|-recovery|-support|-claim|-airdrop|-verify/i, description: 'Suspicious subdomain pattern', severity: 'MEDIUM' as const },
  { pattern: /bit\.ly|tinyurl|short\.link|t\.co/i, description: 'URL shortener (often used in phishing)', severity: 'MEDIUM' as const }
];

/**
 * Analyze URL for phishing patterns
 */
function analyzeUrl(url: string): PhishingIndicator[] {
  const indicators: PhishingIndicator[] = [];
  
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.toLowerCase().replace('www.', '');
    const fullUrl = url.toLowerCase();

    // Check for IP addresses
    if (/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(domain)) {
      indicators.push({
        type: 'domain_risk',
        severity: 'HIGH',
        description: 'Website uses IP address instead of domain name',
        evidence: `IP-based URL: ${domain}`
      });
    }

    // Check for suspicious TLDs
    for (const tld of SUSPICIOUS_TLDS) {
      if (domain.endsWith(tld)) {
        indicators.push({
          type: 'domain_risk',
          severity: 'MEDIUM',
          description: `Suspicious top-level domain commonly used in phishing: ${tld}`,
          evidence: `Domain: ${domain}`
        });
        break;
      }
    }

    // Check for typosquatting
    for (const { legit, variants } of TYPOSQUATTING_PATTERNS) {
      for (const variant of variants) {
        if (domain.includes(variant)) {
          indicators.push({
            type: 'brand_impersonation',
            severity: 'CRITICAL',
            description: `Possible impersonation of ${legit}`,
            evidence: `Domain contains "${variant}" which resembles "${legit}"`
          });
        }
      }
    }

    // Check for brand names with suspicious suffixes
    for (const brand of LEGITIMATE_BRANDS) {
      const brandPattern = new RegExp(`${brand}-(support|recovery|wallet|claim|airdrop|verify|help)`, 'i');
      if (brandPattern.test(domain)) {
        indicators.push({
          type: 'brand_impersonation',
          severity: 'HIGH',
          description: `Suspicious domain mimicking ${brand} with common phishing suffix`,
          evidence: `Domain: ${domain}`
        });
      }
    }

    // Check for excessive subdomains
    const subdomainCount = domain.split('.').length - 2;
    if (subdomainCount > 2) {
      indicators.push({
        type: 'domain_risk',
        severity: 'MEDIUM',
        description: 'Excessive subdomains (common in phishing)',
        evidence: `${subdomainCount} subdomains detected`
      });
    }

    // Check suspicious URL patterns
    for (const { pattern, description, severity } of SUSPICIOUS_URL_PATTERNS) {
      if (pattern.test(fullUrl)) {
        indicators.push({
          type: 'url_pattern',
          severity,
          description,
          evidence: fullUrl.match(pattern)?.[0] || domain
        });
      }
    }

    // Check for HTTPS
    if (urlObj.protocol !== 'https:') {
      indicators.push({
        type: 'ssl_issue',
        severity: 'HIGH',
        description: 'Website does not use HTTPS encryption',
        evidence: `Protocol: ${urlObj.protocol}`
      });
    }

  } catch (error) {
    indicators.push({
      type: 'url_pattern',
      severity: 'MEDIUM',
      description: 'Invalid or malformed URL',
      evidence: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  return indicators;
}

/**
 * Analyze website content for scam patterns
 */
export function analyzeContent(html: string): PhishingIndicator[] {
  const indicators: PhishingIndicator[] = [];
  const textContent = html.toLowerCase();

  for (const { pattern, type, severity } of SCAM_CONTENT_PATTERNS) {
    const matches = textContent.match(pattern);
    if (matches) {
      indicators.push({
        type: 'content_pattern',
        severity,
        description: `Detected ${type.replace(/_/g, ' ')}: "${matches[0]}"`,
        evidence: matches[0].substring(0, 100)
      });
    }
  }

  // Check for multiple wallet connection requests
  const walletConnectCount = (textContent.match(/connect.*wallet/gi) || []).length;
  if (walletConnectCount > 3) {
    indicators.push({
      type: 'content_pattern',
      severity: 'HIGH',
      description: 'Multiple wallet connection prompts detected',
      evidence: `${walletConnectCount} instances found`
    });
  }

  // Check for form inputs asking for sensitive data
  if (/<input[^>]*(?:seed|phrase|private.*key|recovery)/i.test(html)) {
    indicators.push({
      type: 'content_pattern',
      severity: 'CRITICAL',
      description: 'Form requesting seed phrase or private key',
      evidence: 'Input fields detected requesting sensitive wallet data'
    });
  }

  return indicators;
}

/**
 * Calculate risk score from indicators
 */
function calculateRiskScore(indicators: PhishingIndicator[]): number {
  let score = 0;
  
  for (const indicator of indicators) {
    switch (indicator.severity) {
      case 'CRITICAL':
        score += 35;
        break;
      case 'HIGH':
        score += 20;
        break;
      case 'MEDIUM':
        score += 10;
        break;
      case 'LOW':
        score += 5;
        break;
    }
  }

  return Math.min(score, 100);
}

/**
 * Determine overall severity from risk score
 */
function getSeverity(riskScore: number): 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  if (riskScore >= 70) return 'CRITICAL';
  if (riskScore >= 50) return 'HIGH';
  if (riskScore >= 30) return 'MEDIUM';
  if (riskScore >= 10) return 'LOW';
  return 'SAFE';
}

/**
 * Generate user-friendly recommendations
 */
function generateRecommendations(indicators: PhishingIndicator[], severity: string): string[] {
  const recommendations: string[] = [];

  if (severity === 'CRITICAL' || severity === 'HIGH') {
    recommendations.push('🚨 DO NOT connect your wallet to this website');
    recommendations.push('🚨 DO NOT enter your private key, seed phrase, or any sensitive information');
    recommendations.push('⚠️ This website shows multiple signs of being a phishing/scam site');
  }

  const hasBrandImpersonation = indicators.some(i => i.type === 'brand_impersonation');
  if (hasBrandImpersonation) {
    recommendations.push('⚠️ Verify the official domain - this appears to be an imposter site');
    recommendations.push('💡 Always bookmark official websites and access them directly');
  }

  const hasCredentialRequest = indicators.some(i => 
    i.description.toLowerCase().includes('seed') || 
    i.description.toLowerCase().includes('private key')
  );
  if (hasCredentialRequest) {
    recommendations.push('🔐 Legitimate sites NEVER ask for your seed phrase or private keys');
    recommendations.push('❌ Close this website immediately');
  }

  if (severity === 'MEDIUM' || severity === 'LOW') {
    recommendations.push('⚠️ Proceed with caution - some suspicious patterns detected');
    recommendations.push('✅ Verify this is the official website before connecting wallet');
    recommendations.push('💡 Double-check the URL for typos or suspicious characters');
  }

  if (severity === 'SAFE') {
    recommendations.push('✅ No obvious phishing patterns detected');
    recommendations.push('💡 Still verify this is the legitimate website before interacting');
    recommendations.push('🔍 Check for contract addresses and scan them for additional security');
  }

  return recommendations;
}

/**
 * Main website scanning function
 */
export async function scanWebsiteForPhishing(
  url: string,
  htmlContent?: string
): Promise<WebsiteSecurityScan> {
  const indicators: PhishingIndicator[] = [];

  // Analyze URL
  const urlIndicators = analyzeUrl(url);
  indicators.push(...urlIndicators);

  // Analyze content if provided
  if (htmlContent) {
    const contentIndicators = analyzeContent(htmlContent);
    indicators.push(...contentIndicators);
  }

  // Calculate risk
  const riskScore = calculateRiskScore(indicators);
  const severity = getSeverity(riskScore);
  const isScam = severity === 'CRITICAL' || severity === 'HIGH';

  // Extract domain
  let domain = url;
  try {
    const urlObj = new URL(url);
    domain = urlObj.hostname.replace('www.', '');
  } catch {
    // Keep original URL if parsing fails
  }

  // Generate summary
  let summary = '';
  if (severity === 'CRITICAL') {
    summary = '🚨 DANGER: This website shows multiple critical signs of being a scam. DO NOT interact with it.';
  } else if (severity === 'HIGH') {
    summary = '⚠️ HIGH RISK: This website has several suspicious characteristics. Avoid connecting your wallet.';
  } else if (severity === 'MEDIUM') {
    summary = '⚠️ CAUTION: Some suspicious patterns detected. Verify legitimacy before proceeding.';
  } else if (severity === 'LOW') {
    summary = '💡 Minor concerns detected. Double-check the URL and proceed with caution.';
  } else {
    summary = '✅ No obvious phishing patterns detected. Website appears safe, but always verify independently.';
  }

  const recommendations = generateRecommendations(indicators, severity);

  return {
    url,
    domain,
    isScam,
    riskScore,
    severity,
    indicators,
    summary,
    recommendations
  };
}
