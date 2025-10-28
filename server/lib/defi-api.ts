// De.Fi API Integration
// Provides real audit and security data for DeFi protocols

interface DefiSecurityData {
  contractAddress: string;
  securityScore: number;
  issues: {
    static: number;
    dynamic: number;
  };
  governance: {
    isMultisig: boolean;
    timelock: boolean;
  };
  similarContracts: string[];
  auditReports: {
    auditor: string;
    date: string;
    reportUrl: string;
  }[];
}

interface DefiRektData {
  name: string;
  date: string;
  lossAmount: number;
  category: string;
  description: string;
}

export class DefiApiService {
  private apiKey: string;
  private baseUrl = 'https://public-api.de.fi/graphql';

  constructor() {
    this.apiKey = process.env.DEFI_API_KEY || '';
    if (!this.apiKey) {
      console.warn('[DE.FI] API key not configured - audit data will be limited');
    }
  }

  private async graphqlQuery(query: string, variables?: any): Promise<any> {
    if (!this.apiKey) {
      throw new Error('De.Fi API key not configured');
    }

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': this.apiKey,
        },
        body: JSON.stringify({ query, variables }),
      });

      if (!response.ok) {
        throw new Error(`De.Fi API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.errors) {
        console.error('[DE.FI] GraphQL errors:', data.errors);
        throw new Error(`GraphQL error: ${data.errors[0]?.message || 'Unknown error'}`);
      }

      return data.data;
    } catch (error) {
      console.error('[DE.FI] API request failed:', error);
      throw error;
    }
  }

  /**
   * Get security analysis for a smart contract
   */
  async getContractSecurity(contractAddress: string): Promise<DefiSecurityData | null> {
    const query = `
      query GetContractSecurity($address: String!) {
        scannerProject(contractAddress: $address) {
          securityScore
          issues {
            static
            dynamic
          }
          governance {
            isMultisig
            timelock
          }
          similarContracts
          auditReports {
            auditor
            date
            reportUrl
          }
        }
      }
    `;

    try {
      const data = await this.graphqlQuery(query, { address: contractAddress });
      return data.scannerProject;
    } catch (error) {
      console.error(`[DE.FI] Failed to fetch security for ${contractAddress}:`, error);
      return null;
    }
  }

  /**
   * Get historical exploit/hack data (REKT database)
   */
  async getRektDatabase(limit = 100, offset = 0): Promise<DefiRektData[]> {
    const query = `
      query GetRektData($limit: Int!, $offset: Int!) {
        rekts(limit: $limit, offset: $offset) {
          name
          date
          lossAmount
          category
          description
        }
      }
    `;

    try {
      const data = await this.graphqlQuery(query, { limit, offset });
      return data.rekts || [];
    } catch (error) {
      console.error('[DE.FI] Failed to fetch REKT database:', error);
      return [];
    }
  }

  /**
   * Get wallet token approvals for security analysis
   */
  async getWalletApprovals(walletAddress: string): Promise<any> {
    const query = `
      query GetApprovals($wallet: String!) {
        shieldApprovals(walletAddresses: [$wallet]) {
          approvals {
            token
            spender
            amount
            lastUpdated
          }
        }
      }
    `;

    try {
      const data = await this.graphqlQuery(query, { wallet: walletAddress });
      return data.shieldApprovals;
    } catch (error) {
      console.error(`[DE.FI] Failed to fetch approvals for ${walletAddress}:`, error);
      return null;
    }
  }

  /**
   * Analyze top token holders for concentration risk
   */
  async getHolderAnalysis(contractAddress: string): Promise<any> {
    const query = `
      query GetHolderAnalysis($address: String!) {
        scannerHolderAnalysis(contractAddress: $address) {
          topHolders {
            address
            balance
            percentage
          }
          concentration {
            top10Percentage
            top50Percentage
          }
        }
      }
    `;

    try {
      const data = await this.graphqlQuery(query, { address: contractAddress });
      return data.scannerHolderAnalysis;
    } catch (error) {
      console.error(`[DE.FI] Failed to fetch holder analysis for ${contractAddress}:`, error);
      return null;
    }
  }

  /**
   * Analyze liquidity for rug pull detection
   */
  async getLiquidityAnalysis(contractAddress: string): Promise<any> {
    const query = `
      query GetLiquidityAnalysis($address: String!) {
        scannerLiquidityAnalysis(contractAddress: $address) {
          totalLiquidity
          distribution {
            pool
            percentage
          }
          topLpHolders {
            address
            percentage
          }
          rugPullRisk
        }
      }
    `;

    try {
      const data = await this.graphqlQuery(query, { address: contractAddress });
      return data.scannerLiquidityAnalysis;
    } catch (error) {
      console.error(`[DE.FI] Failed to fetch liquidity analysis for ${contractAddress}:`, error);
      return null;
    }
  }

  /**
   * Get list of supported blockchains
   */
  async getSupportedChains(): Promise<any[]> {
    const query = `
      query GetChains {
        chains {
          id
          name
          chainId
        }
      }
    `;

    try {
      const data = await this.graphqlQuery(query);
      return data.chains || [];
    } catch (error) {
      console.error('[DE.FI] Failed to fetch supported chains:', error);
      return [];
    }
  }

  /**
   * Check remaining API credits
   */
  async getCredits(): Promise<number> {
    const query = `
      query GetCredits {
        credits {
          remaining
          used
          total
        }
      }
    `;

    try {
      const data = await this.graphqlQuery(query);
      return data.credits?.remaining || 0;
    } catch (error) {
      console.error('[DE.FI] Failed to fetch credits:', error);
      return 0;
    }
  }

  /**
   * Batch fetch audit information for multiple protocols
   * This is used to enrich DeFiLlama data with real audit info
   */
  async enrichProtocolsWithAudits(protocols: { name: string; address?: string }[]): Promise<Map<string, any>> {
    const auditMap = new Map<string, any>();
    
    if (!this.apiKey) {
      console.log('[DE.FI] Skipping audit enrichment - no API key');
      return auditMap;
    }

    // Process in batches of 10 to avoid rate limits
    const batchSize = 10;
    for (let i = 0; i < protocols.length; i += batchSize) {
      const batch = protocols.slice(i, i + batchSize);
      
      await Promise.allSettled(
        batch.map(async (protocol) => {
          if (!protocol.address) return;
          
          try {
            const securityData = await this.getContractSecurity(protocol.address);
            if (securityData) {
              auditMap.set(protocol.name.toLowerCase(), {
                securityScore: securityData.securityScore,
                auditCount: securityData.auditReports?.length || 0,
                auditReports: securityData.auditReports || [],
                hasMultisig: securityData.governance?.isMultisig || false,
                hasTimelock: securityData.governance?.timelock || false,
              });
            }
          } catch (error) {
            // Silent fail for individual protocols
          }
        })
      );

      // Rate limit protection - wait 1 second between batches
      if (i + batchSize < protocols.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`[DE.FI] Enriched ${auditMap.size} protocols with audit data`);
    return auditMap;
  }
}

// Singleton instance
export const defiApi = new DefiApiService();
