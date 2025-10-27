# JERUSALEM DeFi Security Scanner - Scam Detection Guide

## Overview
The JERUSALEM DeFi Security Scanner automatically detects and flags high-risk DeFi protocols to protect users from scams, wallet drainers, and malicious actors in the cryptocurrency space.

## Automated Scam Detection System

### 🔴 CRITICAL Threats (Auto-Blacklisted)

#### 1. Wallet Drainer Detection
**Score: +100 (Instant Blacklist)**
- Detects malicious contracts designed to drain user wallets
- Keywords monitored:
  - `drain`, `claimer`, `airdrop-claim`
  - `token-claim`, `reward-claim`, `nft-mint-free`
- **Risk**: Total loss of funds from wallet
- **Example**: Fake airdrop sites that request unlimited token approvals

#### 2. Typosquatting / Imposter Protocols
**Score: +90**
- Identifies protocols impersonating legitimate DeFi projects
- Common imposters detected:
  - **Uniswap**: `unisvvap`, `uniswapr`, `unlswap`
  - **Aave**: `aave`, `aavv`, `aavee`
  - **PancakeSwap**: `pancakeswap`, `pancakesswap`
  - **MetaMask**: `metamask`, `metamasc`
  - **SushiSwap**: `sushisswap`, `sushisvvap`
- **Risk**: Funds sent to fake contracts, phishing attacks
- **Example**: "Unlswap.finance" mimicking Uniswap

#### 3. Known Scam Patterns
**Score: +95**
- Detects protocols using classic scam language:
  - "Fake airdrop", "Free tokens", "Claim rewards"
  - "Double your crypto", "Guaranteed returns"
  - "100x gem", "Elon giveaway", "Vitalik giveaway"
- **Risk**: Ponzi schemes, exit scams, honeypot tokens
- **Example**: "Get 1000 FREE ETH - Vitalik Buterin Giveaway"

#### 4. Honeypot Tokens
**Score: +85**
- Identifies tokens you can buy but cannot sell
- Warning phrases:
  - "honeypot", "liquidity locked"
  - "can't sell", "anti dump"
- **Risk**: Funds locked permanently in contract
- **Example**: Tokens with hidden sell restrictions in smart contract

### 🟠 HIGH Risk Threats

#### 5. New Contract Risk
**Score: +40**
- Flags contracts less than 7 days old
- **Risk**: Unproven protocol, potential rug pull
- **Rationale**: Most scams exit within first 2 weeks
- **Action**: Wait for protocol to establish track record

#### 6. No Security Audit
**Score: +30**
- Protocol has no third-party security audit
- **Risk**: Unverified smart contracts, potential vulnerabilities
- **Industry Standard**: Legitimate projects get audited by:
  - CertiK, Trail of Bits, OpenZeppelin, ConsenSys Diligence
- **Action**: Avoid investing significant funds

#### 7. Anonymous Team
**Score: +25**
- No Twitter or GitHub presence detected
- **Risk**: No accountability, easy exit scam
- **Red Flag**: Legitimate teams are public and doxxed
- **Action**: Research team before investing

### 🟡 MEDIUM Risk Threats

#### 8. Low Liquidity
**Score: +20**
- TVL (Total Value Locked) below $50,000
- **Risk**: 
  - Difficulty exiting positions
  - Easy price manipulation
  - Higher slippage
- **Action**: Only invest amounts you can afford to lose

#### 9. Unrealistic Returns Promised
**Score: +30**
- Advertising guaranteed profits or extreme APY
- Examples:
  - "1000% APY guaranteed"
  - "100x returns in 30 days"
  - "Zero risk, high reward"
- **Risk**: Ponzi scheme, unsustainable economics
- **Reality**: If it sounds too good to be true, it is

## Common Crypto Scams Encountered

### For Protocols:
1. **Rug Pulls** - Developers drain liquidity pool and abandon project
2. **Exit Scams** - Team disappears with investor funds
3. **Code Exploits** - Vulnerabilities in smart contracts allowing theft
4. **Fake Audits** - Fraudulent or purchased audit reports
5. **Wash Trading** - Fake volume to appear legitimate

### For Individuals:
1. **Phishing Websites** - Fake sites stealing wallet private keys
2. **Malicious Approvals** - Unlimited token approval requests
3. **Fake Support Scams** - Impersonators on Discord/Telegram
4. **Clipboard Hijacking** - Malware replacing wallet addresses
5. **Dust Attacks** - Small token transfers to track wallet activity
6. **Social Engineering** - Fake giveaways, romance scams

## Blacklist System

### Automatic Blacklisting
- Protocols with **security score ≥80** are automatically blacklisted
- Blacklisted protocols are:
  - Flagged with red warning badges
  - Moved to dedicated Blacklist page
  - Marked as "CRITICAL" severity
  - Permanently tracked in database

### Manual Review
- Security team can manually review flagged protocols
- False positives can be investigated
- Status can be updated from ACTIVE to INACTIVE

## How to Use the Scanner

### 1. View All Protocols
- Navigate to Dashboard
- Browse DeFi protocols sorted by TVL, Volume, or Security

### 2. Perform Security Scan
- Click **"Scan All"** button on Dashboard
- System scans up to 50 protocols at once
- Results appear in real-time
- High-risk protocols automatically blacklisted

### 3. Check Blacklist
- Navigate to **Blacklist** page from sidebar
- View all flagged protocols with:
  - Severity level (CRITICAL/HIGH/MEDIUM/LOW)
  - Specific threats detected
  - Timestamp of detection
  - Detailed threat explanations

### 4. View Protocol Details
- Click any protocol to see:
  - Security score breakdown
  - All detected threats
  - Audit information
  - Social links (Twitter, GitHub)
  - Chain information

## Risk Scoring System

### Score Ranges:
- **0-24**: LOW RISK ✅ (Safe to use with normal caution)
- **25-49**: MEDIUM RISK ⚠️ (Exercise caution, do research)
- **50-79**: HIGH RISK 🔶 (Only use if you understand risks)
- **80+**: CRITICAL RISK ⛔ (Auto-blacklisted, avoid completely)

### Score Calculation:
Total security score = Sum of all detected threats

Example:
- New contract (<7 days): +40
- No audit: +30
- Anonymous team: +25
- **Total: 95 = CRITICAL** → Auto-blacklisted

## Best Practices for Users

### ✅ DO:
- Always scan protocols before investing
- Check blacklist regularly
- Research team and audit reports
- Start with small test transactions
- Use hardware wallets for large amounts
- Verify URLs carefully (bookmark legitimate sites)

### ❌ DON'T:
- Invest in protocols with CRITICAL security scores
- Trust promises of guaranteed returns
- Give unlimited token approvals
- Share private keys or seed phrases
- Click suspicious links in DMs
- Invest more than you can afford to lose

## Data Sources

### External APIs:
- **DeFiLlama**: Protocol data, TVL, audit information
- **Real-time**: Security scans run on-demand

### Database Storage:
- All scan results stored in PostgreSQL
- Historical threat data retained
- Blacklist entries permanently tracked

## Security Updates

The scanner's threat detection is continuously updated with:
- New scam patterns identified in the wild
- Community-reported threats
- Security research findings
- Emerging attack vectors

---

**Remember**: No security system is perfect. Always do your own research (DYOR) before investing in any DeFi protocol.
