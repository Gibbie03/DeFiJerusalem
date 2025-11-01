# Contract Verification System - Complete Implementation Guide
**Date:** November 1, 2025  
**Purpose:** Add blockchain explorer API integration for automated contract discovery

---

## Table of Contents
1. [System Overview](#system-overview)
2. [Current Implementation](#current-implementation)
3. [Adding New Blockchain APIs](#adding-new-blockchain-apis)
4. [Complete Blockchain Coverage](#complete-blockchain-coverage)
5. [API Key Management](#api-key-management)
6. [Implementation Examples](#implementation-examples)
7. [Testing & Validation](#testing--validation)
8. [Maintenance & Monitoring](#maintenance--monitoring)

---

## System Overview

### What is Contract Verification Tracking?

The contract verification system automatically discovers newly verified smart contracts across multiple blockchains by:
1. **Fetching** recently verified contracts from blockchain explorers
2. **Storing** contract metadata in PostgreSQL database
3. **Analyzing** contracts for security threats
4. **Tracking** new DeFi protocol deployments

### Current Capabilities

**Supported:** 20+ blockchains (URL pattern matching only)
**Database:** `discovered_contracts` table
**Features:**
- Contract address extraction from URLs
- Chain identification
- Explorer URL generation
- Metadata storage

**Limitation:** No automated API fetching yet (manual discovery only)

---

## Current Implementation

### 1. Database Schema

**File:** `shared/schema.ts`

```typescript
export const discoveredContracts = pgTable('discovered_contracts', {
  id: text('id').primaryKey(),
  contractAddress: text('contract_address').notNull(),
  contractName: text('contract_name'),
  chain: text('chain').notNull(),
  contractType: text('contract_type'),
  verifiedAt: timestamp('verified_at'),
  discoveredAt: timestamp('discovered_at').notNull().defaultNow(),
  compilerVersion: text('compiler_version'),
  optimization: boolean('optimization'),
  sourceCode: text('source_code'),
  explorerUrl: text('explorer_url'),
  status: text('status').notNull().default('pending'),
  securityScore: integer('security_score'),
  lastScanned: timestamp('last_scanned'),
  threatCount: integer('threat_count').default(0),
  
  metadata: json('metadata').$type<{
    isERC20?: boolean;
    isERC721?: boolean;
    isProxy?: boolean;
    isGovernance?: boolean;
    hasLiquidity?: boolean;
    estimatedTVL?: number;
    socialLinks?: { 
      website?: string; 
      twitter?: string; 
      github?: string 
    };
  }>(),
}, (table) => ({
  chainIdx: index('discovered_contracts_chain_idx').on(table.chain),
  discoveredAtIdx: index('discovered_contracts_discovered_at_idx').on(table.discoveredAt),
  statusIdx: index('discovered_contracts_status_idx').on(table.status),
  contractAddressIdx: index('discovered_contracts_address_idx').on(table.contractAddress),
  uniqueContractChain: uniqueIndex('discovered_contracts_unique_contract_chain')
    .on(table.contractAddress, table.chain),
}));
```

### 2. Supported Explorers (URL Patterns)

**File:** `server/lib/contract-extractor.ts`

Currently supports URL extraction from:
- Etherscan (Ethereum)
- BSCScan (Binance)
- Polygonscan (Polygon)
- Arbiscan (Arbitrum)
- Optimistic Etherscan (Optimism)
- Snowtrace (Avalanche)
- FTMScan (Fantom)
- Basescan (Base)
- zkSync Explorer
- Lineascan
- Scrollscan
- Celoscan
- GnosisScan
- Cronoscan
- Moonscan (Moonbeam/Moonriver)
- Harmony Explorer
- AuroraScan
- Metis Explorer
- Bobascan

---

## Adding New Blockchain APIs

### Step 1: Research Blockchain Explorer API

Most blockchain explorers use Etherscan-compatible APIs. Research:

1. **API Documentation URL**
   - Example: https://docs.etherscan.io/
   
2. **API Base URL**
   - Example: `https://api.etherscan.io/api`
   
3. **Required Parameters**
   - `module=contract`
   - `action=listcontracts` or `getverifiedcontracts`
   - `page=1`
   - `offset=100`
   - `apikey=YOUR_API_KEY`

4. **Rate Limits**
   - Free tier: Usually 5 calls/second, 100K calls/day
   - Pro tier: Higher limits
   
5. **API Key Registration**
   - Sign up at explorer website
   - Generate API key from account dashboard

### Step 2: Add to Explorer API Configuration

**Create/Update:** `server/lib/blockchain-apis.ts`

```typescript
// Blockchain Explorer API Configuration
export const EXPLORER_APIS = {
  ethereum: {
    name: 'Etherscan',
    apiUrl: 'https://api.etherscan.io/api',
    apiKeyEnv: 'ETHERSCAN_API_KEY',
    rateLimit: 5, // calls per second
    verified_contracts_action: 'getcontractsourcecode',
  },
  
  binance: {
    name: 'BSCScan',
    apiUrl: 'https://api.bscscan.com/api',
    apiKeyEnv: 'BSCSCAN_API_KEY',
    rateLimit: 5,
    verified_contracts_action: 'getcontractsourcecode',
  },
  
  polygon: {
    name: 'Polygonscan',
    apiUrl: 'https://api.polygonscan.com/api',
    apiKeyEnv: 'POLYGONSCAN_API_KEY',
    rateLimit: 5,
    verified_contracts_action: 'getcontractsourcecode',
  },
  
  arbitrum: {
    name: 'Arbiscan',
    apiUrl: 'https://api.arbiscan.io/api',
    apiKeyEnv: 'ARBISCAN_API_KEY',
    rateLimit: 5,
    verified_contracts_action: 'getcontractsourcecode',
  },
  
  optimism: {
    name: 'Optimistic Etherscan',
    apiUrl: 'https://api-optimistic.etherscan.io/api',
    apiKeyEnv: 'OPTIMISM_API_KEY',
    rateLimit: 5,
    verified_contracts_action: 'getcontractsourcecode',
  },
  
  avalanche: {
    name: 'Snowtrace',
    apiUrl: 'https://api.snowtrace.io/api',
    apiKeyEnv: 'SNOWTRACE_API_KEY',
    rateLimit: 5,
    verified_contracts_action: 'getcontractsourcecode',
  },
  
  fantom: {
    name: 'FTMScan',
    apiUrl: 'https://api.ftmscan.com/api',
    apiKeyEnv: 'FTMSCAN_API_KEY',
    rateLimit: 5,
    verified_contracts_action: 'getcontractsourcecode',
  },
  
  base: {
    name: 'Basescan',
    apiUrl: 'https://api.basescan.org/api',
    apiKeyEnv: 'BASESCAN_API_KEY',
    rateLimit: 5,
    verified_contracts_action: 'getcontractsourcecode',
  },
  
  // Add more chains below...
  
  // Layer 2s
  zksync: {
    name: 'zkSync Explorer',
    apiUrl: 'https://block-explorer-api.mainnet.zksync.io/api',
    apiKeyEnv: 'ZKSYNC_API_KEY',
    rateLimit: 5,
    verified_contracts_action: 'getcontractsourcecode',
  },
  
  linea: {
    name: 'Lineascan',
    apiUrl: 'https://api.lineascan.build/api',
    apiKeyEnv: 'LINEA_API_KEY',
    rateLimit: 5,
    verified_contracts_action: 'getcontractsourcecode',
  },
  
  scroll: {
    name: 'Scrollscan',
    apiUrl: 'https://api.scrollscan.com/api',
    apiKeyEnv: 'SCROLL_API_KEY',
    rateLimit: 5,
    verified_contracts_action: 'getcontractsourcecode',
  },
  
  // Sidechains
  gnosis: {
    name: 'GnosisScan',
    apiUrl: 'https://api.gnosisscan.io/api',
    apiKeyEnv: 'GNOSIS_API_KEY',
    rateLimit: 5,
    verified_contracts_action: 'getcontractsourcecode',
  },
  
  celo: {
    name: 'Celoscan',
    apiUrl: 'https://api.celoscan.io/api',
    apiKeyEnv: 'CELO_API_KEY',
    rateLimit: 5,
    verified_contracts_action: 'getcontractsourcecode',
  },
  
  cronos: {
    name: 'Cronoscan',
    apiUrl: 'https://api.cronoscan.com/api',
    apiKeyEnv: 'CRONOS_API_KEY',
    rateLimit: 5,
    verified_contracts_action: 'getcontractsourcecode',
  },
  
  moonbeam: {
    name: 'Moonscan',
    apiUrl: 'https://api-moonbeam.moonscan.io/api',
    apiKeyEnv: 'MOONBEAM_API_KEY',
    rateLimit: 5,
    verified_contracts_action: 'getcontractsourcecode',
  },
  
  moonriver: {
    name: 'Moonriver Moonscan',
    apiUrl: 'https://api-moonriver.moonscan.io/api',
    apiKeyEnv: 'MOONRIVER_API_KEY',
    rateLimit: 5,
    verified_contracts_action: 'getcontractsourcecode',
  },
  
  aurora: {
    name: 'AuroraScan',
    apiUrl: 'https://api.aurorascan.dev/api',
    apiKeyEnv: 'AURORA_API_KEY',
    rateLimit: 5,
    verified_contracts_action: 'getcontractsourcecode',
  },
  
  metis: {
    name: 'Metis Explorer',
    apiUrl: 'https://andromeda-explorer.metis.io/api',
    apiKeyEnv: 'METIS_API_KEY',
    rateLimit: 5,
    verified_contracts_action: 'getcontractsourcecode',
  },
  
  boba: {
    name: 'Bobascan',
    apiUrl: 'https://api.bobascan.com/api',
    apiKeyEnv: 'BOBA_API_KEY',
    rateLimit: 5,
    verified_contracts_action: 'getcontractsourcecode',
  },
};

export type ChainKey = keyof typeof EXPLORER_APIS;
```

### Step 3: Implement Contract Fetching Service

**Create:** `server/lib/contract-discovery.ts`

```typescript
import { EXPLORER_APIS, ChainKey } from './blockchain-apis';

interface VerifiedContract {
  address: string;
  contractName: string;
  compilerVersion: string;
  optimization: boolean;
  verifiedAt: string;
  sourceCode?: string;
}

export class ContractDiscoveryService {
  private apiKeys: Map<string, string> = new Map();
  
  constructor() {
    // Load API keys from environment
    Object.values(EXPLORER_APIS).forEach(explorer => {
      const apiKey = process.env[explorer.apiKeyEnv];
      if (apiKey) {
        this.apiKeys.set(explorer.apiKeyEnv, apiKey);
      }
    });
  }
  
  /**
   * Fetch recently verified contracts from a specific chain
   */
  async fetchRecentlyVerified(
    chain: ChainKey, 
    options: {
      startBlock?: number;
      endBlock?: number;
      page?: number;
      offset?: number;
    } = {}
  ): Promise<VerifiedContract[]> {
    const explorer = EXPLORER_APIS[chain];
    if (!explorer) {
      throw new Error(`No explorer configured for chain: ${chain}`);
    }
    
    const apiKey = this.apiKeys.get(explorer.apiKeyEnv);
    if (!apiKey) {
      console.warn(`[CONTRACT-DISCOVERY] No API key for ${explorer.name} (${explorer.apiKeyEnv})`);
      return [];
    }
    
    try {
      // Build API URL
      const params = new URLSearchParams({
        module: 'contract',
        action: 'listcontracts',
        page: String(options.page || 1),
        offset: String(options.offset || 100),
        apikey: apiKey,
      });
      
      if (options.startBlock) {
        params.append('startblock', String(options.startBlock));
      }
      if (options.endBlock) {
        params.append('endblock', String(options.endBlock));
      }
      
      const url = `${explorer.apiUrl}?${params.toString()}`;
      
      // Respect rate limits
      await this.rateLimit(explorer.rateLimit);
      
      console.log(`[CONTRACT-DISCOVERY] Fetching from ${explorer.name}...`);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Handle different API response formats
      if (data.status === '1' && Array.isArray(data.result)) {
        return data.result.map((contract: any) => ({
          address: contract.ContractAddress || contract.Address,
          contractName: contract.ContractName || 'Unknown',
          compilerVersion: contract.CompilerVersion || '',
          optimization: contract.OptimizationUsed === '1' || contract.Optimization === true,
          verifiedAt: contract.DateVerified || new Date().toISOString(),
          sourceCode: contract.SourceCode,
        }));
      } else if (data.message === 'NOTOK') {
        console.warn(`[CONTRACT-DISCOVERY] ${explorer.name} API error: ${data.result}`);
        return [];
      }
      
      return [];
    } catch (error) {
      console.error(`[CONTRACT-DISCOVERY] Error fetching from ${explorer.name}:`, error);
      return [];
    }
  }
  
  /**
   * Fetch from all configured chains
   */
  async fetchFromAllChains(options?: {
    page?: number;
    offset?: number;
  }): Promise<Map<ChainKey, VerifiedContract[]>> {
    const results = new Map<ChainKey, VerifiedContract[]>();
    const chains = Object.keys(EXPLORER_APIS) as ChainKey[];
    
    console.log(`[CONTRACT-DISCOVERY] Fetching from ${chains.length} chains...`);
    
    // Fetch in parallel but respect rate limits
    const batchSize = 3; // Process 3 chains at a time
    for (let i = 0; i < chains.length; i += batchSize) {
      const batch = chains.slice(i, i + batchSize);
      
      const batchResults = await Promise.allSettled(
        batch.map(chain => this.fetchRecentlyVerified(chain, options))
      );
      
      batchResults.forEach((result, index) => {
        const chain = batch[index];
        if (result.status === 'fulfilled') {
          results.set(chain, result.value);
          console.log(`[CONTRACT-DISCOVERY] ✓ ${chain}: ${result.value.length} contracts`);
        } else {
          console.error(`[CONTRACT-DISCOVERY] ✗ ${chain}: ${result.reason}`);
          results.set(chain, []);
        }
      });
      
      // Wait between batches
      if (i + batchSize < chains.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    const totalContracts = Array.from(results.values())
      .reduce((sum, contracts) => sum + contracts.length, 0);
    
    console.log(`[CONTRACT-DISCOVERY] Total: ${totalContracts} contracts from ${results.size} chains`);
    
    return results;
  }
  
  /**
   * Rate limiting helper
   */
  private async rateLimit(callsPerSecond: number): Promise<void> {
    const delay = 1000 / callsPerSecond;
    return new Promise(resolve => setTimeout(resolve, delay));
  }
  
  /**
   * Get contract source code (detailed info)
   */
  async getContractSource(
    chain: ChainKey,
    address: string
  ): Promise<any> {
    const explorer = EXPLORER_APIS[chain];
    if (!explorer) {
      throw new Error(`No explorer configured for chain: ${chain}`);
    }
    
    const apiKey = this.apiKeys.get(explorer.apiKeyEnv);
    if (!apiKey) {
      throw new Error(`No API key for ${explorer.name}`);
    }
    
    const params = new URLSearchParams({
      module: 'contract',
      action: 'getsourcecode',
      address: address,
      apikey: apiKey,
    });
    
    const url = `${explorer.apiUrl}?${params.toString()}`;
    
    await this.rateLimit(explorer.rateLimit);
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === '1' && Array.isArray(data.result) && data.result[0]) {
      return data.result[0];
    }
    
    return null;
  }
}
```

### Step 4: Add Database Storage Layer

**Update:** `server/storage.ts`

```typescript
async saveDiscoveredContract(contract: {
  contractAddress: string;
  contractName: string;
  chain: string;
  compilerVersion?: string;
  optimization?: boolean;
  verifiedAt?: Date;
  sourceCode?: string;
  explorerUrl?: string;
}): Promise<void> {
  const id = `${contract.chain}-${contract.contractAddress}`.toLowerCase();
  
  await this.db.insert(discoveredContracts)
    .values({
      id,
      contractAddress: contract.contractAddress,
      contractName: contract.contractName,
      chain: contract.chain,
      compilerVersion: contract.compilerVersion,
      optimization: contract.optimization,
      verifiedAt: contract.verifiedAt,
      sourceCode: contract.sourceCode,
      explorerUrl: contract.explorerUrl || 
        getExplorerUrl(contract.contractAddress, contract.chain),
      status: 'pending',
    })
    .onConflictDoUpdate({
      target: [discoveredContracts.contractAddress, discoveredContracts.chain],
      set: {
        contractName: contract.contractName,
        compilerVersion: contract.compilerVersion,
        optimization: contract.optimization,
        verifiedAt: contract.verifiedAt,
        sourceCode: contract.sourceCode,
      },
    });
}

async getDiscoveredContracts(options: {
  chain?: string;
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<Array<typeof discoveredContracts.$inferSelect>> {
  let query = this.db.select().from(discoveredContracts);
  
  if (options.chain) {
    query = query.where(eq(discoveredContracts.chain, options.chain));
  }
  
  if (options.status) {
    query = query.where(eq(discoveredContracts.status, options.status));
  }
  
  query = query
    .orderBy(desc(discoveredContracts.discoveredAt))
    .limit(options.limit || 100)
    .offset(options.offset || 0);
  
  return await query;
}
```

### Step 5: Create Background Job

**Create:** `server/jobs/contract-discovery-job.ts`

```typescript
import { ContractDiscoveryService } from '../lib/contract-discovery';
import { storage } from '../storage';
import { getExplorerUrl } from '../lib/contract-extractor';

export class ContractDiscoveryJob {
  private service: ContractDiscoveryService;
  private isRunning: boolean = false;
  
  constructor() {
    this.service = new ContractDiscoveryService();
  }
  
  async run(): Promise<void> {
    if (this.isRunning) {
      console.log('[CONTRACT-JOB] Already running, skipping...');
      return;
    }
    
    this.isRunning = true;
    console.log('[CONTRACT-JOB] Starting contract discovery...');
    
    try {
      // Fetch from all chains
      const results = await this.service.fetchFromAllChains({
        page: 1,
        offset: 100, // Last 100 verified contracts per chain
      });
      
      let savedCount = 0;
      let errorCount = 0;
      
      // Save to database
      for (const [chain, contracts] of results.entries()) {
        for (const contract of contracts) {
          try {
            await storage.saveDiscoveredContract({
              contractAddress: contract.address,
              contractName: contract.contractName,
              chain: chain,
              compilerVersion: contract.compilerVersion,
              optimization: contract.optimization,
              verifiedAt: new Date(contract.verifiedAt),
              sourceCode: contract.sourceCode,
              explorerUrl: getExplorerUrl(contract.address, chain),
            });
            savedCount++;
          } catch (error) {
            console.error(`[CONTRACT-JOB] Error saving contract ${contract.address}:`, error);
            errorCount++;
          }
        }
      }
      
      console.log(`[CONTRACT-JOB] Complete: ${savedCount} saved, ${errorCount} errors`);
    } catch (error) {
      console.error('[CONTRACT-JOB] Fatal error:', error);
    } finally {
      this.isRunning = false;
    }
  }
  
  /**
   * Start periodic job (every hour)
   */
  startPeriodic(intervalMinutes: number = 60): void {
    console.log(`[CONTRACT-JOB] Starting periodic job (every ${intervalMinutes} minutes)`);
    
    // Run immediately
    this.run();
    
    // Then run periodically
    setInterval(() => {
      this.run();
    }, intervalMinutes * 60 * 1000);
  }
}
```

### Step 6: Add API Route

**Update:** `server/routes.ts`

```typescript
// Get discovered contracts
app.get('/api/discovered-contracts', async (req, res) => {
  try {
    const chain = req.query.chain as string | undefined;
    const status = req.query.status as string | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    
    const contracts = await storage.getDiscoveredContracts({
      chain,
      status,
      limit,
      offset: (page - 1) * limit,
    });
    
    res.json({
      contracts,
      page,
      limit,
    });
  } catch (error) {
    console.error('[API] Error fetching discovered contracts:', error);
    res.status(500).json({ error: 'Failed to fetch contracts' });
  }
});

// Trigger manual contract discovery
app.post('/api/discover-contracts', async (req, res) => {
  try {
    const { ContractDiscoveryJob } = await import('./jobs/contract-discovery-job');
    const job = new ContractDiscoveryJob();
    
    // Run in background
    job.run().catch(error => {
      console.error('[API] Contract discovery error:', error);
    });
    
    res.json({ message: 'Contract discovery started' });
  } catch (error) {
    console.error('[API] Error starting contract discovery:', error);
    res.status(500).json({ error: 'Failed to start discovery' });
  }
});
```

### Step 7: Initialize on Server Startup

**Update:** `server/index.ts`

```typescript
import { ContractDiscoveryJob } from './jobs/contract-discovery-job';

// ... existing code ...

// Start contract discovery job (runs every hour)
const contractJob = new ContractDiscoveryJob();
contractJob.startPeriodic(60); // Run every 60 minutes

console.log('✓ Contract discovery job started');
```

---

## Complete Blockchain Coverage

### Priority Tier 1: High Activity (Implement First)

| Chain | Explorer | API URL | Free Tier | Priority |
|-------|----------|---------|-----------|----------|
| **Ethereum** | Etherscan | https://api.etherscan.io/api | 5/sec | 🔥 CRITICAL |
| **Binance** | BSCScan | https://api.bscscan.com/api | 5/sec | 🔥 CRITICAL |
| **Polygon** | Polygonscan | https://api.polygonscan.com/api | 5/sec | 🔥 CRITICAL |
| **Arbitrum** | Arbiscan | https://api.arbiscan.io/api | 5/sec | 🔥 HIGH |
| **Optimism** | Optimistic Etherscan | https://api-optimistic.etherscan.io/api | 5/sec | 🔥 HIGH |
| **Avalanche** | Snowtrace | https://api.snowtrace.io/api | 5/sec | 🔥 HIGH |
| **Base** | Basescan | https://api.basescan.org/api | 5/sec | 🔥 HIGH |

### Tier 2: Medium Activity

| Chain | Explorer | API URL | Free Tier | Priority |
|-------|----------|---------|-----------|----------|
| Fantom | FTMScan | https://api.ftmscan.com/api | 5/sec | Medium |
| zkSync | zkSync Explorer | https://block-explorer-api.mainnet.zksync.io/api | 5/sec | Medium |
| Linea | Lineascan | https://api.lineascan.build/api | 5/sec | Medium |
| Scroll | Scrollscan | https://api.scrollscan.com/api | 5/sec | Medium |
| Gnosis | GnosisScan | https://api.gnosisscan.io/api | 5/sec | Medium |
| Celo | Celoscan | https://api.celoscan.io/api | 5/sec | Medium |

### Tier 3: Lower Activity

| Chain | Explorer | API URL | Notes |
|-------|----------|---------|-------|
| Cronos | Cronoscan | https://api.cronoscan.com/api | Cosmos-based |
| Moonbeam | Moonscan | https://api-moonbeam.moonscan.io/api | Polkadot parachain |
| Moonriver | Moonscan | https://api-moonriver.moonscan.io/api | Kusama parachain |
| Aurora | AuroraScan | https://api.aurorascan.dev/api | NEAR-based |
| Metis | Metis Explorer | https://andromeda-explorer.metis.io/api | Optimistic Rollup |
| Boba | Bobascan | https://api.bobascan.com/api | Optimistic Rollup |

### Tier 4: Additional Networks

| Chain | Explorer | API Availability |
|-------|----------|------------------|
| Mantle | Mantle Explorer | Custom API |
| Blast | Blast Explorer | Custom API |
| Mode | Mode Explorer | Etherscan-like |
| Manta | Manta Explorer | Custom API |
| Kava | Kava Explorer | Custom API |
| Evmos | Evmos Explorer | Custom API |

---

## API Key Management

### Step 1: Register for API Keys

Visit each explorer and create free account:

1. **Etherscan:** https://etherscan.io/register
2. **BSCScan:** https://bscscan.com/register
3. **Polygonscan:** https://polygonscan.com/register
4. **Arbiscan:** https://arbiscan.io/register
5. **Optimistic Etherscan:** https://optimistic.etherscan.io/register
6. **Snowtrace:** https://snowtrace.io/register
7. **FTMScan:** https://ftmscan.com/register
8. **Basescan:** https://basescan.org/register

After registration:
- Go to "API Keys" in account settings
- Generate new API key
- Copy the key

### Step 2: Store API Keys in Replit Secrets

Use Replit Secrets for secure key storage:

```bash
# In Replit Secrets panel, add:
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_KEY
BSCSCAN_API_KEY=YOUR_BSCSCAN_KEY
POLYGONSCAN_API_KEY=YOUR_POLYGONSCAN_KEY
ARBISCAN_API_KEY=YOUR_ARBISCAN_KEY
OPTIMISM_API_KEY=YOUR_OPTIMISM_KEY
SNOWTRACE_API_KEY=YOUR_SNOWTRACE_KEY
FTMSCAN_API_KEY=YOUR_FTMSCAN_KEY
BASESCAN_API_KEY=YOUR_BASESCAN_KEY
# ... add more as needed
```

**Important:** Never commit API keys to code or `.env` files!

### Step 3: Validate API Keys

**Create:** `server/lib/validate-api-keys.ts`

```typescript
import { EXPLORER_APIS } from './blockchain-apis';

export async function validateApiKeys(): Promise<Map<string, boolean>> {
  const results = new Map<string, boolean>();
  
  for (const [chain, config] of Object.entries(EXPLORER_APIS)) {
    const apiKey = process.env[config.apiKeyEnv];
    
    if (!apiKey) {
      console.warn(`[API-KEYS] Missing: ${config.apiKeyEnv} for ${config.name}`);
      results.set(chain, false);
      continue;
    }
    
    try {
      // Test API call
      const params = new URLSearchParams({
        module: 'account',
        action: 'balance',
        address: '0x0000000000000000000000000000000000000000',
        tag: 'latest',
        apikey: apiKey,
      });
      
      const url = `${config.apiUrl}?${params.toString()}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === '1' || data.message === 'OK') {
        console.log(`[API-KEYS] ✓ Valid: ${config.name}`);
        results.set(chain, true);
      } else {
        console.error(`[API-KEYS] ✗ Invalid: ${config.name} - ${data.message}`);
        results.set(chain, false);
      }
    } catch (error) {
      console.error(`[API-KEYS] ✗ Error testing ${config.name}:`, error);
      results.set(chain, false);
    }
    
    // Rate limit between tests
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  return results;
}
```

Run on startup:
```typescript
// In server/index.ts
import { validateApiKeys } from './lib/validate-api-keys';

validateApiKeys().then(results => {
  const valid = Array.from(results.values()).filter(v => v).length;
  const total = results.size;
  console.log(`[API-KEYS] ${valid}/${total} API keys valid`);
});
```

---

## Implementation Examples

### Example 1: Fetch Latest Ethereum Contracts

```typescript
import { ContractDiscoveryService } from './lib/contract-discovery';

const service = new ContractDiscoveryService();

const contracts = await service.fetchRecentlyVerified('ethereum', {
  page: 1,
  offset: 10, // Last 10 contracts
});

console.log(`Found ${contracts.length} recently verified contracts`);
contracts.forEach(contract => {
  console.log(`- ${contract.contractName} (${contract.address})`);
});
```

### Example 2: Fetch from All Chains

```typescript
const allContracts = await service.fetchFromAllChains({
  offset: 50, // Last 50 per chain
});

for (const [chain, contracts] of allContracts.entries()) {
  console.log(`${chain}: ${contracts.length} contracts`);
}
```

### Example 3: Get Detailed Contract Source

```typescript
const source = await service.getContractSource(
  'ethereum',
  '0x1234567890abcdef...'
);

console.log('Contract Name:', source.ContractName);
console.log('Compiler:', source.CompilerVersion);
console.log('Source Code Length:', source.SourceCode.length);
```

---

## Testing & Validation

### Test Script

**Create:** `server/test-contract-discovery.ts`

```typescript
import { ContractDiscoveryService } from './lib/contract-discovery';
import { validateApiKeys } from './lib/validate-api-keys';

async function test() {
  console.log('=== Testing Contract Discovery System ===\n');
  
  // Step 1: Validate API keys
  console.log('Step 1: Validating API keys...');
  const keyResults = await validateApiKeys();
  const validKeys = Array.from(keyResults.entries())
    .filter(([_, valid]) => valid)
    .map(([chain]) => chain);
  
  console.log(`Valid API keys: ${validKeys.join(', ')}\n`);
  
  if (validKeys.length === 0) {
    console.error('ERROR: No valid API keys found!');
    return;
  }
  
  // Step 2: Test fetching from one chain
  console.log('Step 2: Testing fetch from Ethereum...');
  const service = new ContractDiscoveryService();
  
  const ethContracts = await service.fetchRecentlyVerified('ethereum', {
    offset: 5,
  });
  
  console.log(`✓ Fetched ${ethContracts.length} contracts from Ethereum`);
  if (ethContracts.length > 0) {
    console.log('Sample contract:', ethContracts[0]);
  }
  
  // Step 3: Test fetching from all chains
  console.log('\nStep 3: Testing fetch from all chains...');
  const allResults = await service.fetchFromAllChains({
    offset: 3,
  });
  
  console.log('\nResults by chain:');
  for (const [chain, contracts] of allResults.entries()) {
    console.log(`- ${chain}: ${contracts.length} contracts`);
  }
  
  console.log('\n=== Test Complete ===');
}

test().catch(console.error);
```

Run test:
```bash
npx tsx server/test-contract-discovery.ts
```

---

## Maintenance & Monitoring

### Monitoring Dashboard

Track in admin panel:
- Contracts discovered per chain
- API calls remaining (if available)
- Error rates
- Discovery job status

### Logging

```typescript
// Add to contract discovery service
private logStats(): void {
  console.log('[STATS] Contract Discovery Statistics');
  console.log(`- Total API calls: ${this.totalCalls}`);
  console.log(`- Successful: ${this.successCount}`);
  console.log(`- Failed: ${this.errorCount}`);
  console.log(`- Success rate: ${(this.successCount / this.totalCalls * 100).toFixed(2)}%`);
}
```

### Error Handling

```typescript
// Implement retry logic
async fetchWithRetry(
  chain: ChainKey,
  maxRetries: number = 3
): Promise<VerifiedContract[]> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await this.fetchRecentlyVerified(chain);
    } catch (error) {
      console.error(`[RETRY] Attempt ${i + 1}/${maxRetries} failed for ${chain}`);
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  return [];
}
```

---

## Next Steps

1. ✅ Add blockchain API configuration
2. ✅ Implement ContractDiscoveryService
3. ✅ Create background job
4. ✅ Add database storage
5. ✅ Register for API keys
6. ✅ Test with one chain
7. ✅ Scale to all chains
8. ✅ Monitor and optimize

---

## Cost Analysis

### Free Tier Limits

Most explorers offer:
- **5 calls/second**
- **100,000 calls/day**

With 20 chains × 100 contracts/hour × 24 hours = 48,000 calls/day

**Verdict:** Free tier is sufficient for initial deployment!

### Paid Tier (if needed)

- Etherscan Pro: $99/month (unlimited calls)
- BSCScan Pro: $99/month
- Consider upgrading only high-traffic chains

---

**Status:** Ready for implementation  
**Estimated Time:** 4-6 hours for full blockchain coverage  
**Dependencies:** API keys from blockchain explorers
