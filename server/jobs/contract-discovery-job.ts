/**
 * Contract Discovery Background Job
 * 
 * Automatically discovers recently verified contracts across all supported blockchains
 * Runs periodically (default: every hour) to keep the database up to date
 */

import { discoverContractsMultiChain, filterDeFiContracts } from '../lib/contract-discovery';
import { storage } from '../storage';
import { getHighPriorityChains, getChainStats } from '../lib/blockchain-apis';

export class ContractDiscoveryJob {
  private isRunning: boolean = false;
  private lastRunTime: Date | null = null;
  private totalContractsDiscovered: number = 0;
  private totalErrors: number = 0;
  private intervalId: NodeJS.Timeout | null = null;
  
  constructor() {
    console.log('[CONTRACT-JOB] Contract Discovery Job initialized');
    
    // Log chain statistics
    const stats = getChainStats();
    console.log(`[CONTRACT-JOB] Blockchain Coverage:`);
    console.log(`  - Total chains: ${stats.total}`);
    console.log(`  - Mainnets: ${stats.mainnets}`);
    console.log(`  - Testnets: ${stats.testnets}`);
    console.log(`  - Configured (with API keys): ${stats.configured}`);
    console.log(`  - High priority chains: ${stats.highPriority}`);
  }
  
  /**
   * Run the contract discovery process once
   */
  async run(): Promise<void> {
    if (this.isRunning) {
      console.log('[CONTRACT-JOB] Already running, skipping this cycle...');
      return;
    }
    
    this.isRunning = true;
    const startTime = Date.now();
    
    console.log('[CONTRACT-JOB] ===== Starting Contract Discovery =====');
    console.log(`[CONTRACT-JOB] Time: ${new Date().toISOString()}`);
    
    try {
      // Discover contracts from high-priority chains (Ethereum, BSC, Polygon, etc.)
      console.log('[CONTRACT-JOB] Fetching from high-priority chains...');
      const allContracts = await discoverContractsMultiChain(
        undefined,
        { 
          page: 1,
          offset: 20, // Get 20 most recent contracts per chain
          filter: 'priority'
        }
      );
      
      console.log(`[CONTRACT-JOB] Total contracts fetched: ${allContracts.length}`);
      
      // Filter for DeFi-related contracts
      const defiContracts = filterDeFiContracts(allContracts);
      console.log(`[CONTRACT-JOB] DeFi contracts identified: ${defiContracts.length}`);
      
      // Save to database
      let savedCount = 0;
      let skippedCount = 0;
      let errorCount = 0;
      
      for (const contract of defiContracts) {
        try {
          if (!contract.contractAddress || !contract.chain) {
            skippedCount++;
            continue;
          }
          
          await storage.addDiscoveredContract({
            contractAddress: contract.contractAddress,
            contractName: contract.contractName ?? 'Unknown',
            chain: contract.chain,
            contractType: contract.contractType ?? null,
            verifiedAt: contract.verifiedAt ?? null,
            compilerVersion: contract.compilerVersion ?? null,
            optimization: contract.optimization ?? false,
            sourceCode: contract.sourceCode ?? null,
            abi: contract.abi ?? null,
            creatorAddress: contract.creatorAddress ?? null,
            txHash: contract.txHash ?? null,
            explorerUrl: contract.explorerUrl ?? null,
            status: 'pending',
            promotedToProtocol: false,
            protocolId: null,
            metadata: contract.metadata ?? null,
          });
          
          savedCount++;
        } catch (error: any) {
          // Ignore duplicate errors (contract already exists)
          if (error.message?.includes('duplicate') || error.code === '23505') {
            skippedCount++;
          } else {
            console.error(`[CONTRACT-JOB] Error saving contract ${contract.contractAddress}:`, error);
            errorCount++;
          }
        }
      }
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      
      console.log('[CONTRACT-JOB] ===== Discovery Complete =====');
      console.log(`[CONTRACT-JOB] Duration: ${duration}s`);
      console.log(`[CONTRACT-JOB] Results:`);
      console.log(`  - Total fetched: ${allContracts.length}`);
      console.log(`  - DeFi contracts: ${defiContracts.length}`);
      console.log(`  - Saved (new): ${savedCount}`);
      console.log(`  - Skipped (duplicates/invalid): ${skippedCount}`);
      console.log(`  - Errors: ${errorCount}`);
      
      this.totalContractsDiscovered += savedCount;
      this.totalErrors += errorCount;
      this.lastRunTime = new Date();
      
    } catch (error) {
      console.error('[CONTRACT-JOB] Fatal error during contract discovery:', error);
      this.totalErrors++;
    } finally {
      this.isRunning = false;
    }
  }
  
  /**
   * Start periodic job (default: every hour)
   */
  startPeriodic(intervalMinutes: number = 60): void {
    if (this.intervalId) {
      console.log('[CONTRACT-JOB] Job already running periodically');
      return;
    }
    
    console.log(`[CONTRACT-JOB] Starting periodic discovery (every ${intervalMinutes} minutes)`);
    
    // Run immediately on startup
    this.run().catch(error => {
      console.error('[CONTRACT-JOB] Error in initial run:', error);
    });
    
    // Then run periodically
    this.intervalId = setInterval(() => {
      this.run().catch(error => {
        console.error('[CONTRACT-JOB] Error in periodic run:', error);
      });
    }, intervalMinutes * 60 * 1000);
    
    console.log('[CONTRACT-JOB] Periodic discovery started');
  }
  
  /**
   * Stop periodic job
   */
  stopPeriodic(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('[CONTRACT-JOB] Periodic discovery stopped');
    }
  }
  
  /**
   * Get job statistics
   */
  getStats(): {
    isRunning: boolean;
    lastRunTime: string | null;
    totalContractsDiscovered: number;
    totalErrors: number;
    isScheduled: boolean;
  } {
    return {
      isRunning: this.isRunning,
      lastRunTime: this.lastRunTime?.toISOString() ?? null,
      totalContractsDiscovered: this.totalContractsDiscovered,
      totalErrors: this.totalErrors,
      isScheduled: this.intervalId !== null,
    };
  }
}

// Singleton instance
let jobInstance: ContractDiscoveryJob | null = null;

export function getContractDiscoveryJob(): ContractDiscoveryJob {
  if (!jobInstance) {
    jobInstance = new ContractDiscoveryJob();
  }
  return jobInstance;
}
