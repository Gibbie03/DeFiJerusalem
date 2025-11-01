# CSV Contract Imports

This directory is used for importing verified contracts from blockchain explorer CSV exports.

## Why CSV Imports?

CSV imports are the **recommended method** for contract discovery because:

✅ Official Etherscan feature (not ToS violation)  
✅ Provides ALL verified contracts (not just recent ones)  
✅ Works across all chains  
✅ No 403 errors or bot detection  
✅ More reliable than web scraping

## How to Import Contracts

### Step 1: Download CSV Files

Visit these URLs to download verified contract CSV exports (requires CAPTCHA completion):

- **Ethereum**: https://etherscan.io/exportData?type=open-source-contract-codes
- **BSC**: https://bscscan.com/exportData?type=open-source-contract-codes
- **Polygon**: https://polygonscan.com/exportData?type=open-source-contract-codes
- **Arbitrum**: https://arbiscan.io/exportData?type=open-source-contract-codes
- **Optimism**: https://optimistic.etherscan.io/exportData?type=open-source-contract-codes
- **Base**: https://basescan.org/exportData?type=open-source-contract-codes
- **Avalanche**: https://snowtrace.io/exportData?type=open-source-contract-codes

### Step 2: Place CSV Files Here

Download the CSV files and place them in this directory (`server/data/csv/`).

**Naming Convention:**
- Include the chain name in the filename
- Examples:
  - `ethereum-contracts.csv`
  - `bsc-verified-contracts.csv`
  - `polygon-2025-01-15.csv`
  - `arbitrum.csv`

The system will automatically detect the chain from the filename.

### Step 3: Restart the Application

The contract discovery job will automatically load CSV files on startup and during hourly discovery runs.

```bash
# Restart the application
npm run dev
```

## CSV File Format

The CSV files should have the following columns:

```
TxHash,ContractAddress,ContractName,Compiler,Version,Balance,TxCount,Setting,VerifiedDate,License
```

Example row:
```
0x123...,0xabc...,MyToken,solc,v0.8.19,0.5 Ether,1234,200,2025-01-15,MIT
```

## Benefits Over Web Scraping

| Feature | CSV Import | Web Scraping |
|---------|-----------|--------------|
| Legal/ToS Compliant | ✅ Yes | ❌ No (violates ToS) |
| Reliability | ✅ High | ❌ Low (403 errors) |
| Coverage | ✅ ALL contracts | ⚠️ Last 500 only |
| Automation | ⚠️ Manual CAPTCHA | ❌ Blocked |
| Data Quality | ✅ Official | ⚠️ Parsed HTML |

## Current Discovery Pipeline

The hybrid discovery system uses three sources (in order):

1. **DeFiLlama API** - Established protocols with TVL data (6,894+ contracts)
2. **Etherscan Scraping** - Recently verified contracts (currently blocked by anti-bot)
3. **CSV Imports** - Manual imports from this directory (recommended)

All three sources are deduplicated automatically.

## Notes

- CSV files can be very large (100,000+ contracts)
- The import process is efficient and runs on startup
- Duplicate contracts are automatically filtered
- You can update CSV files periodically to get new contracts
- CAPTCHA completion is required for each download (cannot be automated)

## Troubleshooting

**Q: CSV files not loading?**
- Ensure filenames contain the chain name (ethereum, bsc, polygon, etc.)
- Check file format matches expected CSV structure
- Look for errors in server logs

**Q: How often should I update CSV files?**
- Weekly or monthly updates are sufficient
- DeFiLlama handles most established protocols automatically

**Q: Can I automate CSV downloads?**
- No - Etherscan requires CAPTCHA completion for each download
- This is intentional to prevent automated scraping
