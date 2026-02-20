# 🚀 Quick Start: Install CDP Wallets on EC2

## What You Need

1. **CDP API Credentials** from https://portal.cdp.coinbase.com/
2. **SSH access** to your 3 EC2 instances

---

## 📋 Installation Checklist

### ☐ Step 1: Get CDP Credentials (5 minutes)
1. Go to https://portal.cdp.coinbase.com/
2. Create API key
3. Copy API Key Name and Private Key

### ☐ Step 2: Push Code to Git (1 minute)
```bash
# On your local machine
git add -A
git commit -m "feat: add CDP wallet infrastructure"
git push origin main
```

### ☐ Step 3: Install on Each EC2 Instance (5 minutes per instance)

**For each instance (AS4, AO3, EH6), run these commands:**

```bash
# 1. SSH to instance
ssh ubuntu@<INSTANCE_IP>

# 2. Pull latest code
cd ~/S4D5
git pull origin main

# 3. Create .env file
nano .env
# Paste your CDP credentials (see format below)
# Save: Ctrl+X, Y, Enter

# 4. Secure .env file
chmod 600 .env

# 5. Install dependencies
cd Backend/<bot-directory>
# For AS4: cd Backend/helix/alpha-strategist.skill
# For AO3: cd Backend/auditoracle
# For EH6: cd Backend/executionhand
npm install

# 6. Initialize wallet
npm run init-wallet

# 7. SAVE THE WALLET ADDRESS from output!
```

---

## 📝 .env File Format

**Location**: `~/S4D5/.env` (root of project) on each EC2 instance

Add these lines to your existing .env file:

```bash
# CDP Wallet Configuration
CDP_API_KEY_NAME=organizations/xxxxx/apiKeys/xxxxx
CDP_API_KEY_PRIVATE_KEY=-----BEGIN EC PRIVATE KEY-----
xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
-----END EC PRIVATE KEY-----
NETWORK_ID=base-mainnet
```

**Important**: 
- Add to the EXISTING .env file (don't delete other variables)
- Use the SAME credentials on all 3 instances
- The file is at the project root: `~/S4D5/.env`

---

## ✅ Verification

After installation, you should have:

- ✅ 3 wallet addresses (one per bot)
- ✅ 3 `config/wallet.json` files created
- ✅ No errors during `npm run init-wallet`

**Save your wallet addresses:**
```
AS4 (Alpha Strategist): 0x_____________________
AO3 (AuditOracle):      0x_____________________
EH6 (ExecutionHand):    0x_____________________
```

---

## 🆘 Common Issues

**"Cannot find module"** → Run `npm install` again

**"Missing environment variables"** → Check your .env file exists and has correct format

**"Permission denied"** → Run `chmod 600 .env`

---

## 📚 Detailed Guides

- **Step-by-step**: `Backend/INSTALL-ON-EC2.md`
- **Full documentation**: `Backend/CDP-WALLET-SETUP.md`
- **EC2 specifics**: `Backend/EC2-INSTALLATION-GUIDE.md`

---

## ⏭️ Next Steps

After installation:
1. Fund wallets from vault contract
2. Implement x402 payment protocol
3. Register Kite AI Agent Passports
