import type { Threat, ContractScan } from '@shared/schema';

/**
 * GoPlus Security API Integration
 * Scans smart contracts for security vulnerabilities using GoPlus Labs API
 * API Docs: https://docs.gopluslabs.io/reference/tokensecurityusingget_1
 */

// Chain ID mapping for GoPlus API
const CHAIN_ID_MAP: Record<string, string> = {
  'ethereum': '1',
  'eth': '1',
  'binance': '56',
  'bsc': '56',
  'polygon': '137',
  'matic': '137',
  'arbitrum': '42161',
  'optimism': '10',
  'fantom': '250',
  'avalanche': '43114',
  'avax': '43114',
  'base': '8453',
  'zksync': '324',
  'linea': '59144',
  'scroll': '534352',
};

interface GoPlusTokenSecurityResponse {
  code: number;
  message: string;
  result: {
    [contractAddress: string]: {
      // Honeypot Detection
      is_honeypot: '0' | '1' | null;
      honeypot_with_same_creator: '0' | '1' | null;
      
      // Trading Restrictions
      cannot_buy: '0' | '1' | null;
      cannot_sell_all: '0' | '1' | null;
      trading_cooldown: '0' | '1' | null;
      transfer_pausable: '0' | '1' | null;
      
      // Ownership Risks
      hidden_owner: '0' | '1' | null;
      owner_change_balance: '0' | '1' | null;
      can_take_back_ownership: '0' | '1' | null;
      
      // Tax Information
      buy_tax: string | null;
      sell_tax: string | null;
      slippage_modifiable: '0' | '1' | null;
      
      // Contract Information
      is_proxy: '0' | '1' | null;
      is_open_source: '0' | '1' | null;
      is_mintable: '0' | '1' | null;
      
      // Token Metadata
      token_name: string | null;
      token_symbol: string | null;
      total_supply: string | null;
      holder_count: string | null;
      
      // Other Risks
      is_blacklisted: '0' | '1' | null;
      is_whitelisted: '0' | '1' | null;
      is_anti_whale: '0' | '1' | null;
      anti_whale_modifiable: '0' | '1' | null;
      personal_slippage_modifiable: '0' | '1' | null;
      external_call: '0' | '1' | null;
      selfdestruct: '0' | '1' | null;
    };
  };
}

/**
 * Scan a contract using GoPlus Security API
 */
export async function scanContractWithGoPlus(
  contractAddress: string,
  chain: string
): Promise<ContractScan | null> {
  const apiKey = process.env.GOPLUS_API_KEY;
  
  if (!apiKey) {
    console.warn('GOPLUS_API_KEY not found - skipping contract scan');
    return null;
  }

  // Normalize chain name and get chain ID
  const normalizedChain = chain.toLowerCase().replace(/\s+/g, '');
  const chainId = CHAIN_ID_MAP[normalizedChain];
  
  if (!chainId) {
    console.warn(`Unsupported chain for GoPlus: ${chain}`);
    return null;
  }

  try {
    // Call GoPlus API (API key as query parameter)
    const url = `https://api.gopluslabs.io/api/v1/token_security/${chainId}?contract_addresses=${contractAddress}&apikey=${apiKey}`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`GoPlus API error: ${response.status} ${response.statusText}`);
    }

    const data: GoPlusTokenSecurityResponse = await response.json();

    if (data.code !== 1 || !data.result) {
      throw new Error(`GoPlus API returned error: ${data.message || 'Unknown error'}`);
    }

    // Get contract data (address is lowercase in response)
    const contractData = data.result[contractAddress.toLowerCase()];
    
    if (!contractData) {
      console.warn(`No data returned for contract: ${contractAddress}`);
      return null;
    }

    // Analyze threats and calculate risk score
    const { threats, riskScore, severity } = analyzeContractThreats(contractData);

    // Build ContractScan object
    const contractScan: Omit<ContractScan, 'id' | 'scannedAt'> = {
      protocolId: null, // Will be set by caller
      contractAddress,
      chain,
      isHoneypot: parseBool(contractData.is_honeypot),
      cannotBuy: parseBool(contractData.cannot_buy),
      cannotSell: parseBool(contractData.cannot_sell_all),
      buyTax: parseFloat(contractData.buy_tax || '0'),
      sellTax: parseFloat(contractData.sell_tax || '0'),
      hiddenOwner: parseBool(contractData.hidden_owner),
      isProxy: parseBool(contractData.is_proxy),
      isOpenSource: parseBool(contractData.is_open_source),
      ownerChangeBalance: parseBool(contractData.owner_change_balance),
      canTakeBackOwnership: parseBool(contractData.can_take_back_ownership),
      tradingCooldown: parseBool(contractData.trading_cooldown),
      transferPausable: parseBool(contractData.transfer_pausable),
      holders: parseInt(contractData.holder_count || '0'),
      totalSupply: contractData.total_supply,
      threats,
      riskScore,
      severity,
      rawData: contractData,
    };

    return contractScan as ContractScan;
  } catch (error) {
    console.error('Error scanning contract with GoPlus:', error);
    return null;
  }
}

/**
 * Parse GoPlus boolean strings ('0' or '1')
 */
function parseBool(value: '0' | '1' | null | undefined): boolean | null {
  if (value === null || value === undefined) return null;
  return value === '1';
}

/**
 * Analyze contract data and identify threats
 */
function analyzeContractThreats(contractData: any): {
  threats: Threat[];
  riskScore: number;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
} {
  const threats: Threat[] = [];
  let riskScore = 0;

  // CRITICAL: Honeypot Detection (+100 points)
  if (contractData.is_honeypot === '1') {
    threats.push({
      type: 'HONEYPOT_CONTRACT',
      severity: 'CRITICAL',
      message: 'DANGER: This is a HONEYPOT contract - you can buy but CANNOT SELL tokens',
    });
    riskScore += 100;
  }

  // CRITICAL: Cannot Sell (+100 points)
  if (contractData.cannot_sell_all === '1') {
    threats.push({
      type: 'CANNOT_SELL',
      severity: 'CRITICAL',
      message: 'CRITICAL: Selling is DISABLED - funds will be permanently locked',
    });
    riskScore += 100;
  }

  // CRITICAL: Hidden Owner (+95 points)
  if (contractData.hidden_owner === '1') {
    threats.push({
      type: 'HIDDEN_OWNER',
      severity: 'CRITICAL',
      message: 'DANGER: Contract has hidden owner with privileged control',
    });
    riskScore += 95;
  }

  // CRITICAL: Owner Can Change Balance (+90 points)
  if (contractData.owner_change_balance === '1') {
    threats.push({
      type: 'OWNER_CHANGE_BALANCE',
      severity: 'CRITICAL',
      message: 'CRITICAL: Owner can arbitrarily change user balances - total control',
    });
    riskScore += 90;
  }

  // HIGH: Can Take Back Ownership (+85 points)
  if (contractData.can_take_back_ownership === '1') {
    threats.push({
      type: 'RECLAIM_OWNERSHIP',
      severity: 'HIGH',
      message: 'HIGH RISK: Owner can reclaim ownership even after renouncing',
    });
    riskScore += 85;
  }

  // HIGH: Transfer Pausable (+70 points)
  if (contractData.transfer_pausable === '1') {
    threats.push({
      type: 'TRANSFER_PAUSABLE',
      severity: 'HIGH',
      message: 'WARNING: Transfers can be paused - tokens can be frozen',
    });
    riskScore += 70;
  }

  // HIGH: Cannot Buy (+80 points)
  if (contractData.cannot_buy === '1') {
    threats.push({
      type: 'CANNOT_BUY',
      severity: 'HIGH',
      message: 'WARNING: Buying is disabled - this may be an exit scam',
    });
    riskScore += 80;
  }

  // HIGH: High Buy/Sell Tax (>20%)
  const buyTax = parseFloat(contractData.buy_tax || '0');
  const sellTax = parseFloat(contractData.sell_tax || '0');
  
  if (buyTax > 0.2 || sellTax > 0.2) {
    threats.push({
      type: 'EXCESSIVE_TAX',
      severity: 'HIGH',
      message: `EXCESSIVE TAX: Buy ${(buyTax * 100).toFixed(1)}% / Sell ${(sellTax * 100).toFixed(1)}% - over 20% is suspicious`,
    });
    riskScore += 65;
  } else if (buyTax > 0.1 || sellTax > 0.1) {
    threats.push({
      type: 'HIGH_TAX',
      severity: 'MEDIUM',
      message: `High Tax: Buy ${(buyTax * 100).toFixed(1)}% / Sell ${(sellTax * 100).toFixed(1)}%`,
    });
    riskScore += 40;
  }

  // MEDIUM: Trading Cooldown (+45 points)
  if (contractData.trading_cooldown === '1') {
    threats.push({
      type: 'TRADING_COOLDOWN',
      severity: 'MEDIUM',
      message: 'Trading cooldown enabled - may restrict rapid trades',
    });
    riskScore += 45;
  }

  // MEDIUM: Not Open Source (+50 points)
  if (contractData.is_open_source === '0') {
    threats.push({
      type: 'UNVERIFIED_CONTRACT',
      severity: 'MEDIUM',
      message: 'Contract source code is NOT verified - cannot audit for vulnerabilities',
    });
    riskScore += 50;
  }

  // MEDIUM: Proxy Contract (+35 points)
  if (contractData.is_proxy === '1') {
    threats.push({
      type: 'PROXY_CONTRACT',
      severity: 'MEDIUM',
      message: 'Proxy contract detected - implementation can be changed by owner',
    });
    riskScore += 35;
  }

  // MEDIUM: Self-destruct (+80 points)
  if (contractData.selfdestruct === '1') {
    threats.push({
      type: 'SELFDESTRUCT_RISK',
      severity: 'HIGH',
      message: 'DANGER: Contract contains selfdestruct - can be destroyed permanently',
    });
    riskScore += 80;
  }

  // MEDIUM: External Call Risk (+40 points)
  if (contractData.external_call === '1') {
    threats.push({
      type: 'EXTERNAL_CALL',
      severity: 'MEDIUM',
      message: 'Contract makes external calls - potential re-entrancy vulnerability',
    });
    riskScore += 40;
  }

  // LOW: Mintable (+20 points if open source, +40 if not)
  if (contractData.is_mintable === '1') {
    const severity = contractData.is_open_source === '0' ? 'MEDIUM' : 'LOW';
    const points = contractData.is_open_source === '0' ? 40 : 20;
    
    threats.push({
      type: 'MINTABLE_SUPPLY',
      severity,
      message: 'Token supply can be increased (mintable) - potential inflation risk',
    });
    riskScore += points;
  }

  // Determine overall severity
  let severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  if (riskScore >= 80) {
    severity = 'CRITICAL';
  } else if (riskScore >= 50) {
    severity = 'HIGH';
  } else if (riskScore >= 25) {
    severity = 'MEDIUM';
  } else {
    severity = 'LOW';
  }

  return { threats, riskScore, severity };
}

/**
 * Merge GoPlus contract-level threats with metadata-based threats
 */
export function mergeContractAndMetadataThreats(
  metadataThreats: Threat[],
  metadataScore: number,
  contractScan: ContractScan | null
): {
  threats: Threat[];
  totalScore: number;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
} {
  if (!contractScan) {
    // No contract scan available - return metadata only
    let severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    if (metadataScore >= 80) severity = 'CRITICAL';
    else if (metadataScore >= 50) severity = 'HIGH';
    else if (metadataScore >= 25) severity = 'MEDIUM';
    else severity = 'LOW';

    return {
      threats: metadataThreats,
      totalScore: metadataScore,
      severity,
    };
  }

  // Merge both threat lists
  const allThreats = [...metadataThreats, ...contractScan.threats];
  
  // Combine scores (cap at 200 to avoid extreme values)
  const totalScore = Math.min(metadataScore + contractScan.riskScore, 200);

  // Determine combined severity
  let severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  if (totalScore >= 80) {
    severity = 'CRITICAL';
  } else if (totalScore >= 50) {
    severity = 'HIGH';
  } else if (totalScore >= 25) {
    severity = 'MEDIUM';
  } else {
    severity = 'LOW';
  }

  return {
    threats: allThreats,
    totalScore,
    severity,
  };
}
