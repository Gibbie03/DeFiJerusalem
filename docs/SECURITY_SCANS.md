# JERUSALEM DeFi Security Scanner - Complete Threat Detection Guide

## Overview
The JERUSALEM DeFi Security Scanner automatically detects and flags **ALL major wallet and protocol threats** to protect users from scams, wallet drainers, and malicious actors in the cryptocurrency space. The system now scans for **19+ distinct threat types** across both wallet-specific and protocol-specific categories.

---

## 🔴 WALLET-SPECIFIC THREATS (Direct User Attacks)

### 1. Wallet Drainer Detection
**Score: +100 (Instant Blacklist)**
- Detects malicious contracts designed to completely drain user wallets
- **Keywords monitored**:
  - `drain`, `claimer`, `airdrop-claim`
  - `token-claim`, `reward-claim`, `nft-mint-free`
  - `approve-all`, `setapprovalforall`, `unlimited-approval`
- **How it works**: Tricks users into approving unlimited token access
- **Risk**: Total loss of ALL funds in your wallet
- **Example**: "Claim your FREE ETH airdrop now!" websites
- **Protection**: NEVER approve unlimited token access

### 2. Private Key / Seed Phrase Phishing
**Score: +100 (Instant Blacklist)**
- **MOST DANGEROUS**: Sites asking for your private keys or seed phrase
- **Patterns detected**:
  - "Enter seed phrase to restore wallet"
  - "Provide private key for verification"
  - "Input recovery phrase / mnemonic"
  - "12-word phrase required", "24-word phrase validation"
- **Risk**: Immediate complete wallet theft
- **CRITICAL RULE**: **NEVER** share seed phrase or private keys with ANY website
- **Reality Check**: Legitimate sites NEVER ask for these

### 3. Phishing Attacks
**Score: +95**
- Fake websites using urgent language to create panic
- **Patterns detected**:
  - "Connect wallet URGENT"
  - "Wallet compromised - verify now"
  - "Security alert - immediate action required"
  - "Wallet suspended - restore access"
- **Risk**: Stolen credentials, malicious contract signatures
- **Protection**: Always verify URLs, bookmark legitimate sites

### 4. Social Engineering / Fake Support
**Score: +90**
- Scammers impersonating official support teams
- **Patterns detected**:
  - "Official support DM"
  - "Customer service here to help"
  - "Won prize - claim now"
  - "KYC verification required"
  - "Account frozen - contact support"
- **Risk**: Private key theft, wallet draining
- **Reality Check**: Real support NEVER DMs first or asks for keys
- **Protection**: Only use official support channels

### 5. Investment / Romance Scams
**Score: +75**
- Scams promising exclusive investment opportunities
- **Patterns detected**:
  - "Exclusive investment opportunity"
  - "Guaranteed profit - join VIP group"
  - "Insider trading information"
  - "Crypto mentor - guaranteed wealth"
- **Risk**: Money sent to scammers, never recovered
- **Common vector**: Social media, dating apps, Telegram groups
- **Protection**: If it's exclusive and guaranteed, it's a scam

---

## 🔶 PROTOCOL-SPECIFIC THREATS (DeFi Project Risks)

### 6. Typosquatting / Imposter Protocols
**Score: +90**
- Identifies protocols impersonating legitimate DeFi projects
- **Common imposters detected**:
  - **Uniswap**: `unisvvap`, `uniswapr`, `unlswap`, `uni5wap`
  - **Aave**: `aave`, `aavv`, `aavee`, `a4ve`
  - **PancakeSwap**: `pancakesswap`, `p4ncake`
  - **MetaMask**: `metamasc`, `met4mask`
  - **SushiSwap**: `sushisvvap`, `5ushi`
  - **Curve**: `curv3`, `curv3`
  - **Compound**: `c0mpound`
  - **MakerDAO**: `mak3r`
- **Risk**: Funds sent to fake contracts, phishing attacks
- **Example**: "Unlswap.finance" mimicking Uniswap
- **Protection**: Verify URLs character by character

### 7. Known Scam Patterns
**Score: +95**
- Detects protocols using classic scam language
- **Patterns monitored**:
  - "Fake airdrop", "Free tokens", "Claim rewards"
  - "Double your crypto", "Guaranteed returns"
  - "100x gem", "To the moon", "1000x guaranteed"
  - "Elon/Vitalik giveaway"
  - High-risk meme coin patterns: "SafeMoon", "Moon", "Pump"
- **Risk**: Ponzi schemes, exit scams, honeypot tokens
- **Example**: "Get 1000 FREE ETH - Vitalik Buterin Giveaway"
- **Protection**: If it sounds too good to be true, it is

### 8. Honeypot Tokens
**Score: +85**
- Identifies tokens you can buy but CANNOT sell
- **Patterns detected**:
  - `honeypot`, `can't sell`, `sell disabled`
  - `liquidity locked forever`, `anti dump`
  - `max sell`, `anti bot`
- **How it works**: Smart contract has hidden sell restrictions
- **Risk**: Your money is permanently trapped in the contract
- **Example**: Tokens with "anti-whale" mechanisms that prevent ALL selling
- **Protection**: Use tools like Token Sniffer before buying

### 9. Rug Pull Risk
**Score: +85**
- Detects protocols with centralized control mechanisms
- **Warning signs**:
  - "Liquidity migration" (can drain pool)
  - "Emergency withdraw" (owner escape hatch)
  - "Owner can mint unlimited"
  - "Admin privileges", "Pause transfers"
  - "Centralized control"
- **How it works**: Developers drain liquidity pool and disappear
- **Risk**: All invested funds stolen in minutes
- **Famous examples**: Squid Game Token, Meerkat Finance
- **Protection**: Check contract ownership and admin functions

### 10. Exit Scam Indicators
**Score: +65**
- Urgency tactics to pressure quick decisions
- **Patterns detected**:
  - "Final sale", "Last chance", "Closing soon"
  - "Limited time only", "Presale ending"
  - "Hurry - slots filling fast"
- **How it works**: Creates FOMO (fear of missing out) to rush investors
- **Risk**: Team collects funds then abandons project
- **Protection**: Never invest under pressure, do thorough research

### 11. Fake Audit Claims
**Score: +60**
- Suspicious or unverified audit claims
- **Red flags detected**:
  - "Self-audited" (not a real audit)
  - "Audit pending" (no actual audit)
  - "Community audited" (meaningless)
  - "SAFU certified" (fake certification)
  - "Audited by team" (conflict of interest)
- **Risk**: Hidden vulnerabilities, undetected backdoors
- **Real auditors**: CertiK, Trail of Bits, OpenZeppelin, ConsenSys Diligence
- **Protection**: Verify audit reports from legitimate firms

### 12. Suspicious Tokenomics
**Score: +45**
- Unfair token distribution favoring developers
- **Warning patterns**:
  - "50% team tokens" (too much centralization)
  - "90% dev wallet" (obvious scam)
  - "Massive burn incoming" (pump and dump)
  - "Deflationary 100x" (unrealistic)
  - "Reflections guaranteed" (ponzi-like)
- **Risk**: Team dumps tokens, price crashes
- **Healthy tokenomics**: <20% team allocation, vested over time
- **Protection**: Check token distribution on blockchain explorers

### 13. Smart Contract Vulnerabilities
**Score: +50**
- Potential code vulnerabilities that can be exploited
- **Vulnerability types detected**:
  - Flash loan attacks
  - Re-entrancy vulnerabilities
  - Unchecked external calls
  - Dangerous functions: `delegatecall`, `selfdestruct`
- **Risk**: Funds drained by hackers exploiting code flaws
- **Famous examples**: The DAO hack, Poly Network hack
- **Protection**: Only use audited protocols, start with small amounts

---

## 🟠 STANDARD PROTOCOL RISK FACTORS

### 14. New Contract Risk
**Score: +40**
- Flags contracts less than 7 days old
- **Risk**: Unproven protocol, potential rug pull
- **Rationale**: 90% of scams exit within first 2 weeks
- **Example**: Brand new token launched yesterday
- **Action**: Wait for protocol to establish track record

### 15. No Security Audit
**Score: +30**
- Protocol has no third-party security audit
- **Risk**: Unverified smart contracts, unknown vulnerabilities
- **Industry Standard**: Legitimate projects get audited by top firms
- **Audit cost**: $50k-$200k+ (shows team commitment)
- **Action**: Avoid investing significant funds in unaudited projects

### 16. Anonymous Team
**Score: +25**
- No Twitter or GitHub presence detected
- **Risk**: Zero accountability, easy exit scam
- **Red Flag**: Legitimate teams are public and doxxed
- **Why it matters**: Can't pursue legal action against anonymous devs
- **Action**: Research team credentials before investing

### 17. Low Liquidity
**Score: +20**
- TVL (Total Value Locked) below $50,000
- **Risks**: 
  - Difficulty exiting positions
  - Easy price manipulation
  - High slippage on trades
  - Potential for pump and dump
- **Action**: Only invest amounts you can afford to lose entirely

### 18. Unrealistic Returns Promised
**Score: +30**
- Advertising guaranteed profits or extreme APY
- **Examples detected**:
  - "1000% APY guaranteed"
  - "100x returns in 30 days"
  - "Zero risk, high reward"
  - "Passive income forever"
- **Risk**: Ponzi scheme, unsustainable economics
- **Reality**: If it sounds too good to be true, IT IS
- **Math check**: Even 100% APY is extremely rare and unsustainable

---

## 📊 UNIFIED SECURITY SCORING SYSTEM

**Lower Scores = Safer Protocols** (0 = Best, 100 = Worst)

### Score Ranges:
- **0-19**: **SAFE** ✅ (Highly secure, audited, no threats - like Uniswap, Aave, Lido)
- **20-39**: **LOW RISK** 🔵 (Generally secure with minor concerns)
- **40-59**: **MEDIUM RISK** ⚠️ (Some security risks identified, research thoroughly)
- **60-79**: **HIGH RISK** 🔶 (Multiple concerns detected, only if you accept risks)
- **80-100**: **CRITICAL RISK** ⛔ (Severe threats detected, AUTO-BLACKLISTED, AVOID)

### Score Calculation Examples:

**Example 1: Legitimate Protocol (Lido)**
- Starting score: 100 (baseline)
- Has audits: -25 points
- High TVL ($20B+): -25 points
- Public team (Twitter verified): -25 points
- GitHub verified: -15 points
- Established (>1000 days): -10 points
- **Total: 0 points = SAFE** ✅

**Example 2: Unaudited New Protocol**
- Starting score: 100 (baseline)
- No audit: +0 (no deduction)
- Low TVL ($100k): +0 (no deduction)
- Some social presence: -10 points
- **Total: 90 points = CRITICAL RISK** ⛔

**Example 3: Wallet Drainer Site**
- Starting score: 100 (baseline)
- Contains drainer patterns: +0 (already at max)
- No legitimate indicators: +0 (no deductions)
- **Total: 100 points = CRITICAL RISK** ⛔ IMMEDIATE BLACKLIST

---

## 🛡️ HOW TO USE THE ENHANCED SCANNER

### Automatic Scanning:
1. Navigate to **Dashboard**
2. Click **"Scan All"** button
3. System scans protocols for ALL 19+ threat types
4. Results appear in real-time
5. Critical threats (≥80 points) automatically blacklisted

### What Gets Scanned:
- ✅ Protocol names and descriptions
- ✅ Website URLs and domains
- ✅ Contract age and audit status
- ✅ Team social presence
- ✅ Liquidity levels (TVL)
- ✅ Promised returns and claims
- ✅ Token distribution patterns
- ✅ Smart contract functions

### Viewing Results:
- **Dashboard**: See security scores for all protocols
- **Protocol Details**: Click any protocol to see specific threats detected
- **Blacklist Page**: View all auto-blacklisted critical threats
- **Scan History**: Review past scans and threat evolution

---

## ✅ BEST PRACTICES - STAY SAFE

### Before Investing:
1. ✅ **Run "Scan All"** on Dashboard before ANY investment
2. ✅ **Check Blacklist page** for newly detected threats
3. ✅ **Research team** - verify real identities, LinkedIn profiles
4. ✅ **Verify audits** - check audit firm's website directly
5. ✅ **Start small** - test with $50-100 first
6. ✅ **Check contract** on Etherscan/BSCscan
7. ✅ **Join community** - active Discord/Telegram is good sign

### Wallet Security:
1. ✅ Use **hardware wallets** (Ledger, Trezor) for large amounts
2. ✅ **Bookmark** legitimate sites, never click email links
3. ✅ **Verify URLs** character by character before connecting wallet
4. ✅ **Revoke approvals** regularly using Revoke.cash
5. ✅ **Never share** seed phrase or private keys (EVER!)
6. ✅ **Enable 2FA** on exchanges
7. ✅ Use **separate wallets** for experiments vs. main holdings

### Red Flags - NEVER Invest If:
1. ❌ Security score ≥80 (CRITICAL)
2. ❌ Asks for seed phrase or private keys
3. ❌ Promises "guaranteed returns"
4. ❌ Anonymous team with no social presence
5. ❌ Contract <7 days old with no audit
6. ❌ Uses urgent language ("last chance", "closing soon")
7. ❌ Can't find ANY information about team
8. ❌ Only discussed in private Telegram groups
9. ❌ Promises "risk-free" anything (nothing is risk-free)
10. ❌ Name typosquats popular protocols

---

## 🎯 TEST THE SCANNER

The system includes **3 test drainer protocols** to demonstrate threat detection:

### Test Protocol 1: ETH Airdrop Claimer
- Contains "claim" keyword → SCAM_PATTERN (+100)
- 3 days old → NEW_CONTRACT (+40)
- No audit → NO_AUDIT (+30)
- Anonymous → ANONYMOUS_TEAM (+25)
- Low TVL → LOW_LIQUIDITY (+20)
- **TOTAL: 215 points → CRITICAL** ⛔

### Test Protocol 2: Unisvvap (Fake)
- Typosquats "Uniswap" → IMPOSTER (+90)
- 5 days old → NEW_CONTRACT (+40)
- No audit → NO_AUDIT (+30)
- **TOTAL: 160 points → CRITICAL** ⛔

### Test Protocol 3: Vitalik Giveaway 10000 ETH
- Contains "vitalik giveaway" → KNOWN_SCAM (+95)
- 2 days old → NEW_CONTRACT (+40)
- No audit → NO_AUDIT (+30)
- **TOTAL: 165 points → CRITICAL** ⛔

**Try it**: Click "Scan All" to see these threats detected in real-time!

---

## 📈 COMPREHENSIVE THREAT COVERAGE

The scanner now monitors for:
- **19+ distinct threat types**
- **150+ scam keywords and patterns**
- **50+ phishing indicators**
- **30+ known imposter patterns**
- **Real-time threat detection**
- **Automatic blacklisting**
- **Persistent threat database**

---

## 🔄 CONTINUOUS UPDATES

The scanner's threat detection is continuously updated with:
- ✅ New scam patterns identified in the wild
- ✅ Community-reported threats
- ✅ Security research findings
- ✅ Emerging attack vectors
- ✅ DeFi security incidents analysis
- ✅ Blockchain forensics data

---

## 📞 EMERGENCY RESPONSE

### If You've Been Scammed:
1. **Immediately** revoke all token approvals (Revoke.cash)
2. **Transfer** remaining funds to new wallet
3. **Report** to FBI IC3 (ic3.gov) and FTC (reportfraud.ftc.gov)
4. **Document** everything: transactions, screenshots, communications
5. **Warn** others in community

### If Site Asks for Seed Phrase:
1. **STOP** immediately - DO NOT enter anything
2. **Close** website/app immediately
3. **Never** return to that site
4. **Report** to Google Safe Browsing
5. **Warn** others about the scam

---

**🔒 REMEMBER**: No security system is perfect. The JERUSALEM scanner detects known threats, but new scams appear daily. **Always do your own research (DYOR)** before investing in ANY DeFi protocol.

**⚠️ CRITICAL RULE**: If a website asks for your seed phrase or private keys, it's a scam. Period. No exceptions. NEVER share these with ANYONE.
