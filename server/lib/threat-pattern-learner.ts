/**
 * Threat Pattern Learner
 * AI-powered system that learns from security scans to identify new exploit patterns
 * and automatically update threat detection rules
 */

interface ThreatPattern {
  pattern: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  category: string;
  confidence: number;
  occurrences: number;
  firstSeen: Date;
  lastSeen: Date;
  examples: string[];
}

interface ScanInsight {
  commonThreats: Map<string, number>;
  exploitSignatures: string[];
  suspiciousPatterns: string[];
  falsePositives: string[];
}

export class ThreatPatternLearner {
  private learnedPatterns: Map<string, ThreatPattern> = new Map();
  private scanHistory: any[] = [];
  private readonly MIN_CONFIDENCE = 0.7;
  private readonly MIN_OCCURRENCES = 3;

  /**
   * Learn from a completed security scan
   */
  public learnFromScan(scanResult: any, protocol: any): void {
    // Track the scan
    this.scanHistory.push({
      protocolId: protocol.id,
      protocolName: protocol.name,
      threats: scanResult.threats,
      severity: scanResult.severity,
      score: scanResult.score,
      timestamp: new Date(),
    });

    // Extract patterns from threats
    for (const threat of scanResult.threats) {
      this.learnThreatPattern(threat, protocol);
    }

    // Analyze contract scan data if available
    if (scanResult.contractScan) {
      this.learnFromContractScan(scanResult.contractScan, protocol);
    }

    // Keep history manageable (last 1000 scans)
    if (this.scanHistory.length > 1000) {
      this.scanHistory = this.scanHistory.slice(-1000);
    }
  }

  /**
   * Learn threat patterns from individual threat
   */
  private learnThreatPattern(threat: any, protocol: any): void {
    const key = `${threat.type}_${threat.severity}`;
    const existing = this.learnedPatterns.get(key);

    if (existing) {
      // Update existing pattern
      existing.occurrences++;
      existing.lastSeen = new Date();
      existing.confidence = Math.min(1.0, existing.confidence + 0.05);
      
      // Add unique example
      const example = `${protocol.name}: ${threat.message}`;
      if (!existing.examples.includes(example) && existing.examples.length < 10) {
        existing.examples.push(example);
      }
    } else {
      // Create new pattern
      this.learnedPatterns.set(key, {
        pattern: threat.type,
        severity: threat.severity,
        category: this.categorizeThreat(threat.type),
        confidence: 0.5,
        occurrences: 1,
        firstSeen: new Date(),
        lastSeen: new Date(),
        examples: [`${protocol.name}: ${threat.message}`],
      });
    }
  }

  /**
   * Learn from smart contract scan results
   */
  private learnFromContractScan(contractScan: any, protocol: any): void {
    // Learn from honeypot patterns
    if (contractScan.isHoneypot) {
      this.recordExploitSignature('HONEYPOT_DETECTED', {
        cannotBuy: contractScan.cannotBuy,
        cannotSell: contractScan.cannotSell,
        buyTax: contractScan.buyTax,
        sellTax: contractScan.sellTax,
      });
    }

    // Learn from hidden owner patterns
    if (contractScan.hiddenOwner) {
      this.recordExploitSignature('HIDDEN_OWNER', {
        canTakeBackOwnership: contractScan.canTakeBackOwnership,
        ownerChangeBalance: contractScan.ownerChangeBalance,
      });
    }

    // Learn from high tax patterns
    if (contractScan.buyTax > 10 || contractScan.sellTax > 10) {
      this.recordExploitSignature('EXCESSIVE_TAXES', {
        buyTax: contractScan.buyTax,
        sellTax: contractScan.sellTax,
      });
    }
  }

  /**
   * Record exploit signature for future detection
   */
  private recordExploitSignature(type: string, data: any): void {
    const signature = JSON.stringify({ type, data });
    const key = `exploit_${type}`;
    
    const existing = this.learnedPatterns.get(key);
    if (existing) {
      existing.occurrences++;
      existing.confidence = Math.min(1.0, existing.confidence + 0.1);
    } else {
      this.learnedPatterns.set(key, {
        pattern: type,
        severity: 'CRITICAL',
        category: 'Smart Contract Exploit',
        confidence: 0.6,
        occurrences: 1,
        firstSeen: new Date(),
        lastSeen: new Date(),
        examples: [signature],
      });
    }
  }

  /**
   * Categorize threat type
   */
  private categorizeThreat(type: string): string {
    const categories: Record<string, string> = {
      WALLET_DRAINER: 'Wallet Drainer',
      PHISHING: 'Phishing Attack',
      RUG_PULL: 'Rug Pull Risk',
      HONEYPOT: 'Honeypot Scam',
      IMPOSTER: 'Imposter Protocol',
      EXIT_SCAM: 'Exit Scam Pattern',
      UNVERIFIED_CONTRACT: 'Contract Security',
      NO_AUDIT: 'Audit Status',
      ANONYMOUS_TEAM: 'Team Transparency',
      HIDDEN_OWNER: 'Ownership Risk',
      EXCESSIVE_TAXES: 'Tokenomics Risk',
    };

    return categories[type] || 'General Security';
  }

  /**
   * Get insights from learned patterns
   */
  public getInsights(): ScanInsight {
    const insights: ScanInsight = {
      commonThreats: new Map(),
      exploitSignatures: [],
      suspiciousPatterns: [],
      falsePositives: [],
    };

    // Identify common threats (high occurrence, high confidence)
    for (const [key, pattern] of Array.from(this.learnedPatterns.entries())) {
      if (pattern.occurrences >= this.MIN_OCCURRENCES && 
          pattern.confidence >= this.MIN_CONFIDENCE) {
        insights.commonThreats.set(pattern.pattern, pattern.occurrences);
        
        if (pattern.category === 'Smart Contract Exploit') {
          insights.exploitSignatures.push(pattern.pattern);
        }
      }
    }

    // Identify suspicious patterns (medium confidence, growing occurrences)
    for (const [key, pattern] of Array.from(this.learnedPatterns.entries())) {
      if (pattern.occurrences >= 2 && 
          pattern.confidence >= 0.5 && 
          pattern.confidence < this.MIN_CONFIDENCE) {
        insights.suspiciousPatterns.push(pattern.pattern);
      }
    }

    return insights;
  }

  /**
   * Check if a pattern matches learned exploits
   */
  public isKnownExploit(threatType: string, severity: string): boolean {
    const key = `${threatType}_${severity}`;
    const pattern = this.learnedPatterns.get(key);
    
    if (!pattern) return false;
    
    return pattern.occurrences >= this.MIN_OCCURRENCES && 
           pattern.confidence >= this.MIN_CONFIDENCE;
  }

  /**
   * Get recommended blacklist actions based on learned patterns
   */
  public getBlacklistRecommendations(scanResult: any): {
    shouldBlacklist: boolean;
    confidence: number;
    reason: string;
  } {
    let totalConfidence = 0;
    let threatCount = 0;
    let criticalExploits = 0;

    for (const threat of scanResult.threats) {
      const key = `${threat.type}_${threat.severity}`;
      const pattern = this.learnedPatterns.get(key);
      
      if (pattern) {
        totalConfidence += pattern.confidence;
        threatCount++;
        
        if (pattern.severity === 'CRITICAL' && 
            pattern.occurrences >= this.MIN_OCCURRENCES) {
          criticalExploits++;
        }
      }
    }

    const avgConfidence = threatCount > 0 ? totalConfidence / threatCount : 0;
    
    // Auto-blacklist if:
    // 1. Multiple critical exploits detected
    // 2. High confidence in threat patterns
    // 3. Score is CRITICAL
    const shouldBlacklist = 
      (criticalExploits >= 2 && avgConfidence >= 0.8) ||
      (scanResult.severity === 'CRITICAL' && avgConfidence >= 0.7) ||
      (scanResult.score >= 100 && criticalExploits >= 1);

    return {
      shouldBlacklist,
      confidence: avgConfidence,
      reason: shouldBlacklist
        ? `AI detected ${criticalExploits} known exploit pattern(s) with ${Math.round(avgConfidence * 100)}% confidence`
        : `Insufficient confidence (${Math.round(avgConfidence * 100)}%) for auto-blacklist`,
    };
  }

  /**
   * Export learned patterns for analysis
   */
  public exportPatterns(): ThreatPattern[] {
    return Array.from(this.learnedPatterns.values())
      .sort((a, b) => b.occurrences - a.occurrences);
  }

  /**
   * Get statistics
   */
  public getStats(): {
    totalScans: number;
    learnedPatterns: number;
    highConfidencePatterns: number;
    knownExploits: number;
  } {
    const highConfidence = Array.from(this.learnedPatterns.values())
      .filter(p => p.confidence >= this.MIN_CONFIDENCE).length;
    
    const knownExploits = Array.from(this.learnedPatterns.values())
      .filter(p => p.category === 'Smart Contract Exploit').length;

    return {
      totalScans: this.scanHistory.length,
      learnedPatterns: this.learnedPatterns.size,
      highConfidencePatterns: highConfidence,
      knownExploits,
    };
  }
}

// Singleton instance
export const threatLearner = new ThreatPatternLearner();
