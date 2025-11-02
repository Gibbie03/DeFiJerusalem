/**
 * Unified Security Scanner
 * 
 * Consolidates all security detection systems into ONE cohesive scoring system:
 * - Metadata threat detection (drainer patterns, typosquatting)
 * - GoPlus smart contract analysis
 * - AI learning patterns
 * - Legitimacy indicators (audits, TVL, age)
 * 
 * Scoring System (0-100):
 * - 0-19: SAFE (excellent security)
 * - 20-39: LOW risk
 * - 40-59: MEDIUM risk
 * - 60-79: HIGH risk
 * - 80-100: CRITICAL risk (auto-blacklist)
 * 
 * Direction: LOWER IS BETTER (0 = safe, 100 = dangerous)
 */

import type { Protocol, SecurityScan, Threat } from '@shared/schema';
import type { IStorage } from '../storage';
import { WalletDrainerDetector } from './wallet-drainer-detector';
import { calculateLegitimacyScore, type SecurityIndicators } from './security-verification';
import { GoPlusScanner } from './goplus-scanner';
import { threatLearner } from './threat-pattern-learner';

export interface UnifiedSecurityResult {
  // Final unified score (0-100, lower is better)
  score: number;
  severity: 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  isBlacklisted: boolean;
  
  // All detected threats
  threats: Threat[];
  
  // Breakdown of scoring components
  breakdown: {
    // Threat-based scoring (0-100, threats add points)
    threatScore: number;
    threatCount: number;
    
    // Legitimacy-based scoring (0-100, positive indicators)
    legitimacyScore: number;
    legitimacyIndicators: SecurityIndicators;
    
    // GoPlus contract analysis
    goPlusScore: number;
    goPlusThreats: string[];
    
    // AI-learned patterns
    aiPatternMatches: number;
    aiConfidence: number;
    
    // Final adjustment factors
    verificationBonus: number; // Reduces score for verified protocols
    tvlBonus: number; // Reduces score for high TVL
    auditBonus: number; // Reduces score for audited protocols
  };
  
  // Recommendations
  recommendations: string[];
  
  // Metadata
  scannedAt: string;
  scanDuration: number;
}

export class UnifiedSecurityScanner {
  private drainerDetector: WalletDrainerDetector;
  private goPlusScanner: GoPlusScanner;
  
  constructor(private storage: IStorage) {
    this.drainerDetector = new WalletDrainerDetector(storage);
    this.goPlusScanner = new GoPlusScanner();
  }
  
  /**
   * Perform comprehensive security scan combining all detection methods
   */
  async scanProtocol(protocol: Protocol): Promise<UnifiedSecurityResult> {
    const startTime = Date.now();
    const allThreats: Threat[] = [];
    const recommendations: string[] = [];
    
    // ====================
    // 1. METADATA THREAT DETECTION
    // ====================
    const metadataScan = await this.drainerDetector.scanDApp(protocol);
    allThreats.push(...metadataScan.threats);
    const threatScore = metadataScan.score; // 0-100+ (threats add points)
    
    // ====================
    // 2. LEGITIMACY SCORING
    // ====================
    const legitimacyResult = calculateLegitimacyScore(protocol);
    const legitimacyScore = legitimacyResult.score; // 0-100 (positive indicators)
    const legitimacyIndicators = legitimacyResult.indicators;
    
    // ====================
    // 3. GOPLUS CONTRACT ANALYSIS
    // ====================
    let goPlusScore = 0;
    const goPlusThreats: string[] = [];
    
    // Only scan if we have contracts
    if (protocol.defiContracts && protocol.defiContracts.length > 0) {
      try {
        const contract = protocol.defiContracts[0]; // Scan primary contract
        const chain = this.mapChainToGoPlusId(protocol.chains[0] || 'ethereum');
        
        if (chain) {
          const goPlusResult = await this.goPlusScanner.scanContract(contract.address, chain);
          
          if (goPlusResult) {
            // Convert GoPlus results to threat score
            if (goPlusResult.isHoneypot) {
              goPlusScore += 95;
              goPlusThreats.push('Honeypot contract detected');
              allThreats.push({
                type: 'HONEYPOT',
                severity: 'CRITICAL',
                message: 'GoPlus detected honeypot contract - users cannot sell tokens'
              });
            }
            
            if (goPlusResult.isProxy && !goPlusResult.isOpenSource) {
              goPlusScore += 60;
              goPlusThreats.push('Proxy contract without open source code');
              allThreats.push({
                type: 'PROXY_NO_SOURCE',
                severity: 'HIGH',
                message: 'Upgradeable proxy contract without verified source code'
              });
            }
            
            if (goPlusResult.isAntiWhale) {
              goPlusScore += 30;
              goPlusThreats.push('Anti-whale mechanism (could be used maliciously)');
            }
            
            if (!goPlusResult.isOpenSource) {
              goPlusScore += 40;
              goPlusThreats.push('Contract source code not verified');
              allThreats.push({
                type: 'UNVERIFIED_CONTRACT',
                severity: 'MEDIUM',
                message: 'Smart contract source code is not verified on block explorer'
              });
            }
          }
        }
      } catch (error) {
        console.error('GoPlus scan error:', error);
        // Don't fail the entire scan if GoPlus fails
      }
    }
    
    // ====================
    // 4. AI PATTERN LEARNING
    // ====================
    let aiPatternMatches = 0;
    let aiConfidence = 0;
    
    try {
      const patterns = await threatLearner.getPatterns();
      const protocolText = `${protocol.name} ${protocol.description || ''} ${protocol.website || ''}`.toLowerCase();
      
      for (const pattern of patterns) {
        if (protocolText.includes(pattern.pattern.toLowerCase())) {
          aiPatternMatches++;
          aiConfidence = Math.max(aiConfidence, pattern.confidence);
          
          // Add AI-learned threat
          allThreats.push({
            type: 'AI_LEARNED_PATTERN',
            severity: pattern.confidence > 0.8 ? 'HIGH' : 'MEDIUM',
            message: `AI detected learned threat pattern: "${pattern.pattern}" (confidence: ${(pattern.confidence * 100).toFixed(0)}%)`
          });
        }
      }
    } catch (error) {
      console.error('AI pattern scan error:', error);
    }
    
    const aiScore = aiPatternMatches * 50 * aiConfidence; // Each pattern adds weighted score
    
    // ====================
    // 5. CALCULATE UNIFIED SCORE
    // ====================
    
    // Start with threat-based scores (additive)
    let rawScore = threatScore + goPlusScore + aiScore;
    
    // Apply legitimacy-based bonuses (subtractive)
    // Legitimacy score of 100 = -50 points bonus
    // This means a highly legitimate protocol needs VERY strong threat signals to be flagged
    const legitimacyBonus = Math.floor(legitimacyScore / 2); // 0-50 points reduction
    
    // Additional verification bonuses
    let verificationBonus = 0;
    let tvlBonus = 0;
    let auditBonus = 0;
    
    // High TVL = strong community trust
    if (protocol.tvl > 100_000_000) {
      tvlBonus = 30; // $100M+ TVL
    } else if (protocol.tvl > 50_000_000) {
      tvlBonus = 20; // $50M+ TVL
    } else if (protocol.tvl > 10_000_000) {
      tvlBonus = 10; // $10M+ TVL
    }
    
    // Audits from reputable firms
    if (legitimacyIndicators.reputableAuditFirm) {
      auditBonus = 25;
    } else if (legitimacyIndicators.hasAudit) {
      auditBonus = 15;
    }
    
    // Well-established protocol (age + GitHub)
    if (protocol.age && protocol.age > 365 && legitimacyIndicators.hasOpenSource) {
      verificationBonus = 20;
    } else if (protocol.age && protocol.age > 180) {
      verificationBonus = 10;
    }
    
    // Apply all bonuses (reduce score)
    const totalBonus = legitimacyBonus + verificationBonus + tvlBonus + auditBonus;
    const finalScore = Math.max(0, Math.min(100, rawScore - totalBonus));
    
    // ====================
    // 6. DETERMINE SEVERITY
    // ====================
    let severity: 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    if (finalScore >= 80) severity = 'CRITICAL';
    else if (finalScore >= 60) severity = 'HIGH';
    else if (finalScore >= 40) severity = 'MEDIUM';
    else if (finalScore >= 20) severity = 'LOW';
    else severity = 'SAFE';
    
    // ====================
    // 7. AUTO-BLACKLIST LOGIC
    // ====================
    const isBlacklisted = severity === 'CRITICAL';
    
    // ====================
    // 8. GENERATE RECOMMENDATIONS
    // ====================
    if (finalScore === 0 && allThreats.length === 0) {
      recommendations.push('Protocol shows no security concerns based on our analysis');
    }
    
    if (finalScore > 0 && finalScore < 20) {
      recommendations.push('Low risk detected - proceed with normal caution');
    }
    
    if (!legitimacyIndicators.hasAudit) {
      recommendations.push('Consider waiting for security audit before using');
    }
    
    if (!legitimacyIndicators.hasOpenSource) {
      recommendations.push('Contract source code is not verified - higher risk');
    }
    
    if (protocol.tvl < 1_000_000) {
      recommendations.push('Low TVL - limited community validation');
    }
    
    if (finalScore >= 40) {
      recommendations.push('CAUTION: Security concerns detected - research thoroughly before interacting');
    }
    
    if (finalScore >= 60) {
      recommendations.push('HIGH RISK: Multiple security red flags - avoid unless you understand the risks');
    }
    
    if (finalScore >= 80) {
      recommendations.push('CRITICAL: Do NOT interact with this protocol - high probability of scam');
    }
    
    // ====================
    // 9. RETURN UNIFIED RESULT
    // ====================
    const scanDuration = Date.now() - startTime;
    
    return {
      score: finalScore,
      severity,
      isBlacklisted,
      threats: allThreats,
      breakdown: {
        threatScore,
        threatCount: metadataScan.threats.length,
        legitimacyScore,
        legitimacyIndicators,
        goPlusScore,
        goPlusThreats,
        aiPatternMatches,
        aiConfidence,
        verificationBonus,
        tvlBonus,
        auditBonus
      },
      recommendations,
      scannedAt: new Date().toISOString(),
      scanDuration
    };
  }
  
  /**
   * Map chain name to GoPlus chain ID
   */
  private mapChainToGoPlusId(chain: string): string | null {
    const chainMap: Record<string, string> = {
      'ethereum': '1',
      'bsc': '56',
      'polygon': '137',
      'arbitrum': '42161',
      'optimism': '10',
      'avalanche': '43114',
      'fantom': '250',
      'base': '8453'
    };
    
    const normalized = chain.toLowerCase();
    return chainMap[normalized] || null;
  }
  
  /**
   * Batch scan multiple protocols
   */
  async scanProtocols(protocols: Protocol[]): Promise<Map<string, UnifiedSecurityResult>> {
    const results = new Map<string, UnifiedSecurityResult>();
    
    // Scan in parallel batches of 5
    const batchSize = 5;
    for (let i = 0; i < protocols.length; i += batchSize) {
      const batch = protocols.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(async (protocol) => {
          try {
            const result = await this.scanProtocol(protocol);
            return { id: protocol.id, result };
          } catch (error) {
            console.error(`Error scanning protocol ${protocol.id}:`, error);
            return {
              id: protocol.id,
              result: this.getErrorResult(protocol, error)
            };
          }
        })
      );
      
      batchResults.forEach(({ id, result }) => {
        results.set(id, result);
      });
    }
    
    return results;
  }
  
  /**
   * Generate error result for failed scans
   */
  private getErrorResult(protocol: Protocol, error: unknown): UnifiedSecurityResult {
    return {
      score: 0,
      severity: 'LOW',
      isBlacklisted: false,
      threats: [],
      breakdown: {
        threatScore: 0,
        threatCount: 0,
        legitimacyScore: 0,
        legitimacyIndicators: {
          hasAudit: false,
          reputableAuditFirm: false,
          tvlSignificant: false,
          hasOpenSource: false,
          hasMultisig: false,
          hasTimelock: false,
          hasBugBounty: false,
          hasDoxxedTeam: false,
          goodTokenDistribution: false,
          activeCommunity: false
        },
        goPlusScore: 0,
        goPlusThreats: [],
        aiPatternMatches: 0,
        aiConfidence: 0,
        verificationBonus: 0,
        tvlBonus: 0,
        auditBonus: 0
      },
      recommendations: ['Scan failed - unable to analyze protocol security'],
      scannedAt: new Date().toISOString(),
      scanDuration: 0
    };
  }
}
