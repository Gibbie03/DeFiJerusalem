import { CertikAudit, InsertCertikAudit } from '@shared/schema';
import { nanoid } from 'nanoid';

interface CertikProjectData {
  projectName: string;
  securityScore?: number;
  codeSecurityScore?: number;
  marketScore?: number;
  governanceScore?: number;
  hasAudit: boolean;
  auditDate?: string;
  auditStatus?: string;
  auditReportUrl?: string;
  vulnerabilities?: Array<{
    severity: string;
    category: string;
    description: string;
    status: string;
  }>;
  onChainMonitoring?: boolean;
  kycVerified?: boolean;
  bugBountyProgram?: boolean;
}

export class CertikScraper {
  private baseUrl = 'https://skynet.certik.com';

  async fetchProtocolData(protocolName: string): Promise<CertikProjectData | null> {
    try {
      // Construct CertiK Skynet URL
      const projectSlug = this.createProjectSlug(protocolName);
      const url = `${this.baseUrl}/projects/${projectSlug}`;

      console.log(`[CertiK] Fetching data for: ${protocolName} (${url})`);

      // Note: In production, you would use a headless browser (Puppeteer/Playwright)
      // or proper API key. For now, we'll return mock data structure.
      // This is a placeholder that demonstrates the data structure.
      
      // For production implementation, uncomment and use:
      // const response = await fetch(url);
      // const html = await response.text();
      // const data = this.parseProjectPage(html);

      // Placeholder: Return null to indicate data not available without scraping
      return null;
    } catch (error) {
      console.error(`[CertiK] Error fetching ${protocolName}:`, error);
      return null;
    }
  }

  private createProjectSlug(protocolName: string): string {
    // Convert protocol name to CertiK slug format
    // Examples: "Uniswap" -> "uniswap", "Curve Finance" -> "curve"
    return protocolName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  createAuditEntry(protocolId: string, protocolName: string, data: CertikProjectData): InsertCertikAudit {
    return {
      protocolId,
      protocolName,
      securityScore: data.securityScore || null,
      codeSecurityScore: data.codeSecurityScore || null,
      marketScore: data.marketScore || null,
      governanceScore: data.governanceScore || null,
      hasAudit: data.hasAudit,
      auditDate: data.auditDate ? new Date(data.auditDate) : null,
      auditStatus: data.auditStatus || null,
      auditReportUrl: data.auditReportUrl || null,
      vulnerabilities: data.vulnerabilities || null,
      riskCategories: null, // Would be extracted from scraping
      onChainMonitoring: data.onChainMonitoring || false,
      kycVerified: data.kycVerified || false,
      bugBountyProgram: data.bugBountyProgram || false,
      certikSkynetUrl: `${this.baseUrl}/projects/${this.createProjectSlug(protocolName)}`,
      dataSource: 'skynet_scraper',
    };
  }

  async searchProtocol(protocolName: string): Promise<string | null> {
    try {
      // Search for protocol on CertiK Skynet
      const searchUrl = `${this.baseUrl}/projects?search=${encodeURIComponent(protocolName)}`;
      
      console.log(`[CertiK] Searching for: ${protocolName}`);

      // Placeholder: Would need scraping or API access
      return null;
    } catch (error) {
      console.error(`[CertiK] Search error for ${protocolName}:`, error);
      return null;
    }
  }

  generateMockAuditData(protocolId: string, protocolName: string, hasKnownAudit: boolean = false): InsertCertikAudit {
    // Generate realistic mock data for demonstration
    // In production, this would come from actual CertiK API/scraping
    
    let securityScore = null;
    let hasAudit = hasKnownAudit;
    
    if (hasKnownAudit) {
      // Generate realistic security scores for audited protocols
      securityScore = 75 + Math.random() * 20; // 75-95 range for audited projects
    }

    return {
      protocolId,
      protocolName,
      securityScore,
      codeSecurityScore: securityScore ? securityScore + Math.random() * 5 : null,
      marketScore: securityScore ? securityScore - Math.random() * 10 : null,
      governanceScore: securityScore ? securityScore - Math.random() * 5 : null,
      hasAudit,
      auditDate: hasAudit ? new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000) : null,
      auditStatus: hasAudit ? 'completed' : null,
      auditReportUrl: hasAudit ? `${this.baseUrl}/projects/${this.createProjectSlug(protocolName)}/audit-report` : null,
      vulnerabilities: hasAudit ? [
        {
          severity: 'LOW',
          category: 'Code Quality',
          description: 'Minor optimization opportunities identified',
          status: 'resolved'
        }
      ] : null,
      riskCategories: securityScore ? {
        codeRisk: 'LOW',
        marketRisk: 'MEDIUM',
        governanceRisk: 'LOW',
        operationalRisk: 'LOW'
      } : null,
      onChainMonitoring: hasAudit,
      kycVerified: hasAudit && Math.random() > 0.5,
      bugBountyProgram: hasAudit && Math.random() > 0.7,
      certikSkynetUrl: `${this.baseUrl}/projects/${this.createProjectSlug(protocolName)}`,
      dataSource: 'mock_data',
    };
  }

  async batchFetchAudits(protocolIds: string[], protocolNames: string[]): Promise<InsertCertikAudit[]> {
    const audits: InsertCertikAudit[] = [];

    for (let i = 0; i < protocolIds.length; i++) {
      const protocolId = protocolIds[i];
      const protocolName = protocolNames[i];

      try {
        const data = await this.fetchProtocolData(protocolName);
        
        if (data) {
          audits.push(this.createAuditEntry(protocolId, protocolName, data));
        } else {
          // Generate mock data for demonstration
          // In production, skip protocols without data
          audits.push(this.generateMockAuditData(protocolId, protocolName, false));
        }

        // Rate limiting: Wait 1 second between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`[CertiK] Error processing ${protocolName}:`, error);
      }
    }

    return audits;
  }
}

// Helper function to check if protocol has CertiK audit from DeFiLlama data
export function hasCertikAudit(auditLinks?: string[] | null, audited?: boolean): boolean {
  if (!auditLinks || auditLinks.length === 0) return false;
  
  return auditLinks.some(link => 
    link.toLowerCase().includes('certik') || 
    link.toLowerCase().includes('skynet.certik.com')
  );
}

export function extractCertikAuditUrl(auditLinks?: string[] | null): string | null {
  if (!auditLinks) return null;
  
  const certikLink = auditLinks.find(link => 
    link.toLowerCase().includes('certik') || 
    link.toLowerCase().includes('skynet.certik.com')
  );
  
  return certikLink || null;
}
