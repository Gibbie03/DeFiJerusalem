import type { Protocol, SecurityScan, Threat } from '@shared/schema';

// WalletDrainerDetector - Security scanning engine
export class WalletDrainerDetector {
  async scanDApp(dapp: Protocol): Promise<SecurityScan> {
    const results: SecurityScan = {
      isBlacklisted: false,
      severity: 'LOW',
      threats: [],
      score: 0,
    };

    try {
      // Check if contract is less than 7 days old
      if (dapp.age !== null && dapp.age !== undefined && dapp.age < 7) {
        results.threats.push({
          type: 'NEW_CONTRACT',
          severity: 'HIGH',
          message: 'Contract less than 7 days old - HIGH RISK',
        });
        results.score += 40;
      }

      // Check if no audit exists
      if (!dapp.audited) {
        results.threats.push({
          type: 'NO_AUDIT',
          severity: 'HIGH',
          message: 'No security audit found',
        });
        results.score += 30;
      }

      // Check if team is anonymous
      if (!dapp.twitter && !dapp.github) {
        results.threats.push({
          type: 'ANONYMOUS_TEAM',
          severity: 'HIGH',
          message: 'Team is anonymous - no social presence',
        });
        results.score += 25;
      }

      // Check for low liquidity
      if (dapp.tvl !== null && dapp.tvl !== undefined && dapp.tvl < 50000) {
        results.threats.push({
          type: 'LOW_LIQUIDITY',
          severity: 'MEDIUM',
          message: 'Very low liquidity (< $50k)',
        });
        results.score += 20;
      }

      // Determine overall severity based on score
      if (results.score >= 80) results.severity = 'CRITICAL';
      else if (results.score >= 50) results.severity = 'HIGH';
      else if (results.score >= 25) results.severity = 'MEDIUM';

      results.isBlacklisted = results.severity === 'CRITICAL';
      return results;
    } catch (error) {
      console.error('Error scanning dApp:', error);
      return results;
    }
  }
}
