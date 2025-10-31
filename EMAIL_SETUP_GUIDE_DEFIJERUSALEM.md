# Professional Email Setup for defijerusalem.com

## Overview
This guide will help you set up professional email addresses for defijerusalem.com using **Zoho Mail FREE** (recommended for startups).

---

## Option 1: Zoho Mail FREE (Recommended)

### ✅ Benefits:
- **FREE for up to 5 users**
- 5GB storage per user
- Ad-free email
- Custom domain (@defijerusalem.com)
- Professional webmail interface
- Mobile apps available

### ⚠️ Limitations:
- Webmail access only (no IMAP/POP3 in free tier)
- Upgrade to $1/month per user for email client access (Outlook, Apple Mail, etc.)

---

## Step-by-Step Setup Process

### Step 1: Sign Up for Zoho Mail (5 minutes)

1. Go to: **https://www.zoho.com/mail/zohomail-pricing.html**
2. Click **"SIGN UP FOR FREE"** under the Forever Free plan
3. Enter your details:
   - Email: Your personal email
   - Password: Create a strong password
   - Company Name: JERUSALEM DeFi Security
   - Country: Select your country

4. Click **"Get Started"**

---

### Step 2: Add Your Domain (2 minutes)

1. After signup, you'll see "Add your domain"
2. Enter: **defijerusalem.com**
3. Click **"Add Domain"**
4. Select **"I already have a domain"**

---

### Step 3: Verify Domain Ownership (10 minutes)

Zoho will ask you to verify domain ownership by adding a TXT record to your DNS.

#### Where to Add DNS Records:
You need to access your domain's DNS settings. This depends on where you registered defijerusalem.com:

**If registered with Namecheap:**
1. Log in to Namecheap
2. Go to Domain List → Manage
3. Click "Advanced DNS"

**If registered with GoDaddy:**
1. Log in to GoDaddy
2. My Products → Domains → DNS
3. Click "Manage DNS"

**If using Cloudflare:**
1. Log in to Cloudflare
2. Select defijerusalem.com
3. Click "DNS" tab

#### Add the Verification TXT Record:

Zoho will show you something like:

```
Type: TXT
Name/Host: @ (or leave blank)
Value: zoho-verification=zmverify.zoho.com.1234567890
TTL: 3600 (or automatic)
```

**Steps:**
1. In your DNS console, click "Add Record"
2. Select **TXT** as record type
3. Enter the values exactly as shown by Zoho
4. Save the record
5. Wait 5-15 minutes for DNS propagation
6. Return to Zoho and click **"Verify"**

✅ You should see a success message!

---

### Step 4: Configure Email DNS Records (15 minutes)

Now you need to add MX, SPF, DKIM, and DMARC records.

#### A. MX Records (Mail Exchange)

Add these **TWO** MX records:

```
Type: MX
Name/Host: @ (or leave blank)
Priority: 10
Value: mx.zoho.com
TTL: 3600

Type: MX
Name/Host: @ (or leave blank)  
Priority: 20
Value: mx2.zoho.com
TTL: 3600

Type: MX
Name/Host: @ (or leave blank)
Priority: 50
Value: mx3.zoho.com
TTL: 3600
```

**Important**: Delete any existing MX records first!

---

#### B. SPF Record (Sender Policy Framework)

Prevents email spoofing:

```
Type: TXT
Name/Host: @ (or leave blank)
Value: v=spf1 include:zoho.com ~all
TTL: 3600
```

**Note**: If you already have an SPF record, modify it to include `include:zoho.com`

---

#### C. DKIM Record (Email Authentication)

1. In Zoho Admin Console, go to **Email Configuration → DKIM**
2. Click **"Add Selector"**
3. Selector name: `zoho` (or default)
4. Zoho will generate a DKIM key like:

```
Type: TXT
Name/Host: zoho._domainkey (or as shown by Zoho)
Value: k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKB... (very long string)
TTL: 3600
```

5. Copy the exact values from Zoho
6. Add this TXT record to your DNS
7. Return to Zoho and click **"Verify DKIM"**

---

#### D. DMARC Record (Email Policy)

Tells email providers how to handle failed authentication:

```
Type: TXT
Name/Host: _dmarc
Value: v=DMARC1; p=quarantine; rua=mailto:admin@defijerusalem.com
TTL: 3600
```

**Policy options:**
- `p=none` - Monitor only (start with this)
- `p=quarantine` - Send suspicious emails to spam
- `p=reject` - Block suspicious emails completely

---

### Step 5: Wait for DNS Propagation (1-48 hours)

- **Typical time**: 1-4 hours
- **Maximum time**: 48 hours

**Check DNS propagation:**
- Visit: https://mxtoolbox.com/
- Enter: defijerusalem.com
- Click "MX Lookup"
- You should see Zoho's mail servers

---

### Step 6: Create Email Accounts (5 minutes)

Once verified, create your email addresses:

1. Go to Zoho Admin Console
2. Click **"Users"** → **"Add User"**

**Recommended email addresses:**

| Email | Purpose | User |
|-------|---------|------|
| contact@defijerusalem.com | General inquiries | Main contact |
| support@defijerusalem.com | User support | Support team |
| partnerships@defijerusalem.com | Business deals | BD/Sales |
| admin@defijerusalem.com | Administrative | Admin |
| security@defijerusalem.com | Security reports | Security team |

3. For each email:
   - Enter first name, last name
   - Email address (e.g., `contact`)
   - Generate password or set your own
   - Click **"Add"**

4. Save passwords securely!

---

### Step 7: Access Your Email

**Webmail:**
- Go to: **https://mail.zoho.com**
- Login with full email (e.g., contact@defijerusalem.com)
- Enter password

**Mobile Apps:**
- Download **Zoho Mail** app (iOS/Android)
- Login with your email and password

**Email Clients** (requires paid plan $1/month):
- Upgrade to Zoho Mail Lite for IMAP/POP3/SMTP access
- Then configure Outlook, Apple Mail, Thunderbird, etc.

---

## Email Client Configuration (If Upgraded to Paid)

### IMAP Settings (Receiving):
```
Server: imap.zoho.com
Port: 993
Security: SSL/TLS
Username: contact@defijerusalem.com
Password: [your password]
```

### SMTP Settings (Sending):
```
Server: smtp.zoho.com
Port: 465 (SSL) or 587 (TLS)
Security: SSL/TLS
Username: contact@defijerusalem.com
Password: [your password]
```

---

## Testing Your Email Setup

### 1. Send Test Email
- Login to contact@defijerusalem.com
- Send email to your personal Gmail/Outlook
- Check it arrives and doesn't go to spam

### 2. Reply Test
- Reply from your personal email
- Check it arrives at contact@defijerusalem.com

### 3. Check Email Authentication
- Visit: **https://www.mail-tester.com**
- Send an email to the address they provide
- Check your spam score (should be 9/10 or 10/10)

### 4. Verify DNS Records
- Visit: **https://mxtoolbox.com/SuperTool.aspx**
- Test:
  - `MX: defijerusalem.com`
  - `SPF: defijerusalem.com`
  - `DMARC: defijerusalem.com`
  - `DKIM: zoho._domainkey.defijerusalem.com`

All should show **green checkmarks**!

---

## Email Forwarding Setup (Optional)

Forward emails to your personal inbox:

1. Login to Zoho Admin Console
2. Go to **Email Forwarding**
3. Set up forwarding rules:
   - contact@defijerusalem.com → your-personal@gmail.com
   - support@defijerusalem.com → your-personal@gmail.com

**Benefit**: You can manage all emails from one inbox while still replying from professional addresses.

---

## Email Signatures (Recommended)

Create professional signatures:

1. Login to webmail
2. Go to Settings → Mail → Signature
3. Add:

```
Best regards,
[Your Name]
[Your Title]

JERUSALEM DeFi Security Scanner
🔒 Protecting DeFi across 126+ blockchains
🌐 defijerusalem.com
🐦 @jerusalem_defi (if you have Twitter)

⚠️ This email and any attachments are confidential.
```

---

## Cost Breakdown

### FREE Plan (What you get):
- 5 email accounts
- 5GB per account = 25GB total
- Webmail access
- Mobile apps
- **Cost: $0/month**

### Upgrade Options (When needed):

**Zoho Mail Lite** ($1/user/month):
- Everything in free +
- IMAP/POP3/SMTP access
- Email client support (Outlook, Apple Mail)
- 10GB storage per user
- **Cost for 5 users: $5/month = $60/year**

**Zoho Mail Premium** ($4/user/month):
- Everything in Lite +
- 50GB storage per user
- Calendar, notes, bookmarks
- eDiscovery, email retention
- **Cost for 5 users: $20/month = $240/year**

---

## Alternative: Google Workspace

If you prefer Google's ecosystem:

**Business Starter** ($7/user/month):
- Custom Gmail (@defijerusalem.com)
- 30GB storage
- Google Drive, Docs, Sheets, Meet
- **Cost for 5 users: $35/month = $420/year**

**Setup**: Similar DNS records but with Google's servers
- Visit: https://workspace.google.com

---

## Troubleshooting

### Emails not arriving?
1. Check MX records are correct
2. Wait full 48 hours for DNS propagation
3. Verify SPF, DKIM, DMARC records

### Emails going to spam?
1. Verify all DNS records (SPF, DKIM, DMARC)
2. Start with low sending volume (warm up domain)
3. Don't send mass emails immediately
4. Ask recipients to mark as "Not Spam"

### DNS records not updating?
1. Clear browser cache
2. Try different DNS checker (Google DNS, Cloudflare DNS)
3. Contact domain registrar support
4. Check TTL settings (lower = faster propagation)

### Verification failing?
1. Double-check TXT record value (no typos!)
2. Ensure @ or blank for Name/Host
3. Remove any quotes around the value
4. Wait 15-30 minutes and retry

---

## Security Best Practices

### 1. Enable Two-Factor Authentication (2FA)
- Login to Zoho Admin
- Go to Security → Two-Factor Authentication
- Enable for all users

### 2. Set Strong Passwords
- Minimum 12 characters
- Mix uppercase, lowercase, numbers, symbols
- Use password manager (1Password, Bitwarden)

### 3. Monitor Email Activity
- Review login locations regularly
- Check for suspicious activity
- Enable login alerts

### 4. Backup Emails
- Export important emails periodically
- Use Zoho's backup features (paid plans)

### 5. Phishing Protection
- Train team on phishing recognition
- Enable Zoho's spam filters
- Never click suspicious links

---

## Next Steps After Setup

### 1. Update Website
Add email addresses to your website:
- Contact page: contact@defijerusalem.com
- Footer: Link to contact form
- About page: Team member emails

### 2. Update Social Media
- Twitter bio: Contact: contact@defijerusalem.com
- LinkedIn: Update company email
- GitHub: Update organization email

### 3. Update Documentation
- README.md: Add contact info
- Security.md: security@defijerusalem.com for vulnerability reports

### 4. Email Marketing Tools
Connect to:
- Mailchimp (email campaigns)
- SendGrid (transactional emails)
- HubSpot (CRM)

### 5. Professional Outreach
Start using partnerships@defijerusalem.com for:
- Protocol outreach (Top 200 list)
- Business development
- Partnership inquiries

---

## Quick Reference Card

### Login URLs:
- **Webmail**: https://mail.zoho.com
- **Admin Console**: https://mailadmin.zoho.com

### Support:
- **Zoho Help**: https://help.zoho.com/portal/en/home
- **DNS Checker**: https://mxtoolbox.com
- **Email Test**: https://www.mail-tester.com

### Email Addresses Created:
- contact@defijerusalem.com
- support@defijerusalem.com
- partnerships@defijerusalem.com
- admin@defijerusalem.com
- security@defijerusalem.com

---

## Timeline Estimate

| Step | Time Required |
|------|---------------|
| Sign up for Zoho | 5 minutes |
| Add domain | 2 minutes |
| Add DNS records | 15 minutes |
| DNS propagation | 1-48 hours (usually 2-4 hours) |
| Create email accounts | 5 minutes |
| Test emails | 10 minutes |
| **Total active time** | **~37 minutes** |
| **Total with DNS wait** | **2-48 hours** |

---

## Summary Checklist

- [ ] Sign up for Zoho Mail FREE
- [ ] Add defijerusalem.com domain
- [ ] Add verification TXT record
- [ ] Wait for verification
- [ ] Add MX records (3 records)
- [ ] Add SPF record (1 TXT record)
- [ ] Add DKIM record (1 TXT record)
- [ ] Add DMARC record (1 TXT record)
- [ ] Wait for DNS propagation (1-48 hours)
- [ ] Create 5 email accounts
- [ ] Test sending/receiving emails
- [ ] Check spam score (mail-tester.com)
- [ ] Verify all DNS records (mxtoolbox.com)
- [ ] Set up email signatures
- [ ] Enable 2FA security
- [ ] Update website with new emails
- [ ] Update social media profiles
- [ ] Start using for business outreach

---

**Questions or need help?**
- Zoho Support: https://help.zoho.com
- DNS Help: Check your domain registrar's knowledge base

---

Generated for: JERUSALEM DeFi Security Scanner  
Date: October 31, 2025  
Recommended Plan: Zoho Mail FREE (5 users)
