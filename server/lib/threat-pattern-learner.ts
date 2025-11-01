/**
 * Threat Pattern Learner - Phase 2: Database Persistence
 * AI-powered system that learns from security scans to identify new exploit patterns
 * and automatically update threat detection rules
 * 
 * PHASE 2 UPGRADE: Now persists learned patterns to PostgreSQL instead of in-memory storage
 */

import type { IStorage } from '../storage';

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
  private storage: IStorage | null = null;
  private isInitialized = false;

  /**
   * Initialize with database storage (Phase 2)
   */
  public async initialize(storage: IStorage): Promise<void> {
    this.storage = storage;
    await this.loadPatternsFromDatabase();
    await this.loadScanHistoryFromDatabase();
    this.isInitialized = true;
    console.log('[AI-LEARNING] Initialized with database persistence');
    console.log(`[AI-LEARNING] Loaded ${this.learnedPatterns.size} patterns from database`);
  }

  /**
   * Load learned patterns from database on startup
   */
  private async loadPatternsFromDatabase(): Promise<void> {
    if (!this.storage) return;
    
    try {
      const patterns = await this.storage.getAllAIPatterns();
      
      for (const pattern of patterns) {
        const key = `${pattern.pattern}_${pattern.severity}`;
        this.learnedPatterns.set(key, {
          pattern: pattern.pattern,
          severity: pattern.severity as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW',
          category: pattern.category,
          confidence: pattern.confidence,
          occurrences: pattern.occurrences,
          examples: pattern.examples,
          firstSeen: new Date(pattern.firstSeen),
          lastSeen: new Date(pattern.lastSeen),
        });
      }
    } catch (error) {
      console.error('[AI-LEARNING] Failed to load patterns from database:', error);
    }
  }

  /**
   * Load scan history from database
   */
  private async loadScanHistoryFromDatabase(): Promise<void> {
    if (!this.storage) return;
    
    try {
      const history = await this.storage.getAIScanHistory(1000);
      this.scanHistory = history.map(h => ({
        protocolId: h.entityId,
        protocolName: h.entityName,
        entityType: h.entityType,
        threats: h.threats,
        severity: h.severity,
        score: h.score,
        timestamp: new Date(h.timestamp),
      }));
    } catch (error) {
      console.error('[AI-LEARNING] Failed to load scan history from database:', error);
    }
  }

  /**
   * Persist pattern to database
   */
  private async persistPattern(pattern: ThreatPattern): Promise<void> {
    if (!this.storage) return;
    
    try {
      await this.storage.upsertAIPattern({
        pattern: pattern.pattern,
        severity: pattern.severity,
        category: pattern.category,
        confidence: pattern.confidence,
        occurrences: pattern.occurrences,
        examples: pattern.examples,
      });
    } catch (error) {
      console.error('[AI-LEARNING] Failed to persist pattern to database:', error);
    }
  }

  /**
   * Persist scan to database
   */
  private async persistScan(scan: {
    entityId: string;
    entityName: string;
    entityType: 'protocol' | 'wallet' | 'website';
    threats: any[];
    severity: string;
    score: number;
  }): Promise<void> {
    if (!this.storage) return;
    
    try {
      await this.storage.addAIScanHistory(scan);
    } catch (error) {
      console.error('[AI-LEARNING] Failed to persist scan to database:', error);
    }
  }

  /**
   * Learn from a completed security scan
   */
  public async learnFromScan(scanResult: any, protocol: any): Promise<void> {
    // Track the scan (both in-memory and database)
    const scanRecord = {
      protocolId: protocol.id,
      protocolName: protocol.name,
      threats: scanResult.threats,
      severity: scanResult.severity,
      score: scanResult.score,
      timestamp: new Date(),
    };
    
    this.scanHistory.push(scanRecord);

    // Persist to database (Phase 2)
    await this.persistScan({
      entityId: protocol.id,
      entityName: protocol.name,
      entityType: 'protocol',
      threats: scanResult.threats,
      severity: scanResult.severity,
      score: scanResult.score,
    });

    // Extract patterns from threats
    for (const threat of scanResult.threats) {
      await this.learnThreatPattern(threat, protocol);
    }

    // Analyze contract scan data if available
    if (scanResult.contractScan) {
      await this.learnFromContractScan(scanResult.contractScan, protocol);
    }

    // Keep history manageable (last 1000 scans)
    if (this.scanHistory.length > 1000) {
      this.scanHistory = this.scanHistory.slice(-1000);
    }
  }

  /**
   * Learn threat patterns from individual threat
   */
  private async learnThreatPattern(threat: any, protocol: any): Promise<void> {
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

      // Persist update to database (Phase 2)
      await this.persistPattern(existing);
    } else {
      // Create new pattern
      const newPattern: ThreatPattern = {
        pattern: threat.type,
        severity: threat.severity,
        category: this.categorizeThreat(threat.type),
        confidence: 0.5,
        occurrences: 1,
        firstSeen: new Date(),
        lastSeen: new Date(),
        examples: [`${protocol.name}: ${threat.message}`],
      };
      
      this.learnedPatterns.set(key, newPattern);

      // Persist new pattern to database (Phase 2)
      await this.persistPattern(newPattern);
    }
  }

  /**
   * Learn from smart contract scan results
   */
  private async learnFromContractScan(contractScan: any, protocol: any): Promise<void> {
    // Learn from honeypot patterns
    if (contractScan.isHoneypot) {
      await this.recordExploitSignature('HONEYPOT_DETECTED', {
        cannotBuy: contractScan.cannotBuy,
        cannotSell: contractScan.cannotSell,
        buyTax: contractScan.buyTax,
        sellTax: contractScan.sellTax,
      });
    }

    // Learn from hidden owner patterns
    if (contractScan.hiddenOwner) {
      await this.recordExploitSignature('HIDDEN_OWNER', {
        canTakeBackOwnership: contractScan.canTakeBackOwnership,
        ownerChangeBalance: contractScan.ownerChangeBalance,
      });
    }

    // Learn from high tax patterns
    if (contractScan.buyTax > 10 || contractScan.sellTax > 10) {
      await this.recordExploitSignature('EXCESSIVE_TAXES', {
        buyTax: contractScan.buyTax,
        sellTax: contractScan.sellTax,
      });
    }
  }

  /**
   * Record exploit signature for future detection
   */
  private async recordExploitSignature(type: string, data: any): Promise<void> {
    const signature = JSON.stringify({ type, data });
    const key = `exploit_${type}`;
    
    const existing = this.learnedPatterns.get(key);
    if (existing) {
      existing.occurrences++;
      existing.confidence = Math.min(1.0, existing.confidence + 0.1);
      existing.lastSeen = new Date();
      
      // Persist update to database (Phase 2)
      await this.persistPattern(existing);
    } else {
      const newPattern: ThreatPattern = {
        pattern: type,
        severity: 'CRITICAL',
        category: 'Smart Contract Exploit',
        confidence: 0.6,
        occurrences: 1,
        firstSeen: new Date(),
        lastSeen: new Date(),
        examples: [signature],
      };
      
      this.learnedPatterns.set(key, newPattern);

      // Persist new pattern to database (Phase 2)
      await this.persistPattern(newPattern);
    }
  }

  /**
   * Categorize threat type
   */
  private categorizeThreat(type: string): string {
    const categories: Record<string, string> = {
      // Traditional wallet drainer threats
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

      // 2025 Advanced Wallet Drainer Threats ($494M+ stolen in 2024)
      NAMED_DRAINER_OPERATION: 'Named Drainer Operation',
      PERMIT_SIGNATURE_EXPLOIT: 'EIP-2612 Permit Signature Attack',
      APPROVAL_PHISHING: 'Approval Phishing ($1B+ stolen)',
      CREATE2_EVASION: 'CREATE2 Address Evasion',
      DRAINER_FINGERPRINT: 'Drainer Infrastructure',
      SOLANA_DRAINER: 'Solana Wallet Drainer',
      DORMANT_APPROVAL_RISK: 'Dormant Approval Attack',
      DRAINER_PRICING_MODEL: 'Drainer-as-a-Service',
      APPROVAL_AGE_EXPLOIT: 'Approval Age Exploitation',
    };

    return categories[type] || 'General Security';
  }

  /**
   * Learn from wallet address scan
   */
  public async learnFromWalletScan(walletScanResult: any, address: string): Promise<void> {
    // Track wallet scan (both in-memory and database)
    const scanRecord = {
      type: 'wallet_scan',
      address,
      chain: walletScanResult.chain,
      isDangerous: walletScanResult.isDangerous,
      severity: walletScanResult.severity,
      riskScore: walletScanResult.riskScore,
      findings: walletScanResult.findings,
      timestamp: new Date(),
    };
    
    this.scanHistory.push(scanRecord);

    // Persist to database (Phase 2)
    await this.persistScan({
      entityId: address,
      entityName: `Wallet ${address.substring(0, 10)}...`,
      entityType: 'wallet',
      threats: walletScanResult.findings || [],
      severity: walletScanResult.severity,
      score: walletScanResult.riskScore,
    });

    // Learn from drainer patterns
    if (walletScanResult.drainerIntelligence) {
      await this.recordExploitSignature('KNOWN_DRAINER_WALLET', {
        operation: walletScanResult.drainerIntelligence.operation,
        chain: walletScanResult.chain,
        confidence: walletScanResult.drainerIntelligence.confidence,
      });
    }

    // Learn from wallet findings
    for (const finding of walletScanResult.findings || []) {
      await this.learnThreatPattern(finding, { name: `Wallet ${address.substring(0, 10)}...`, id: address });
    }

    console.log(`[AI-LEARNING] Learned from wallet scan: ${address} (${walletScanResult.severity}, ${walletScanResult.findings?.length || 0} findings)`);
  }

  /**
   * Learn from website phishing scan
   */
  public async learnFromWebsiteScan(phishingScanResult: any, url: string): Promise<void> {
    // Track website scan (both in-memory and database)
    const scanRecord = {
      type: 'website_scan',
      url,
      domain: phishingScanResult.phishing?.domain,
      isScam: phishingScanResult.phishing?.isScam,
      severity: phishingScanResult.phishing?.severity,
      riskScore: phishingScanResult.phishing?.riskScore,
      indicators: phishingScanResult.phishing?.indicators,
      timestamp: new Date(),
    };
    
    this.scanHistory.push(scanRecord);

    // Persist to database (Phase 2)
    await this.persistScan({
      entityId: url,
      entityName: phishingScanResult.phishing?.domain || url,
      entityType: 'website',
      threats: phishingScanResult.phishing?.indicators || [],
      severity: phishingScanResult.phishing?.severity || 'LOW',
      score: phishingScanResult.phishing?.riskScore || 0,
    });

    // Learn from phishing indicators
    for (const indicator of phishingScanResult.phishing?.indicators || []) {
      await this.learnThreatPattern(
        {
          type: `PHISHING_${indicator.type.toUpperCase()}`,
          severity: indicator.severity,
          message: indicator.description
        },
        { name: phishingScanResult.phishing?.domain || url, id: url }
      );
    }

    console.log(`[AI-LEARNING] Learned from website scan: ${url} (${phishingScanResult.phishing?.severity}, ${phishingScanResult.phishing?.indicators?.length || 0} indicators)`);
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
