# Quick Installation Guide for EC2 Instances

Follow these steps to install CDP wallets on your three EC2 instances.

## Prerequisites

Before starting, you need:
1. **CDP API Credentials** from Coinbase Developer Platform
   - Go to https://portal.cdp.coinbase.com/
   - Create API key and save:
     - API Key Name
     - API Key Private Key

2. **EC2 Instance Access**
   - AS4 (Alpha Strategist)
   - AO3 (AuditOracle)  
   - EH6 (ExecutionHand)

---

## Step 1: Get Your CDP API Credentials

1. Visit https://portal.cdp.coinbase.com/
2. Sign in or create account
3. Create a new API key
4. **SAVE THESE VALUES** (you'll need them in Step 3):
   ```
   API Key Name: organizations/xxxxx/apiKeys/xxxxx
   API Key Private Key: -----BEGIN EC PRIVATE KEY-----
   xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   -----END EC PRIVATE KEY-----
   ```

---

## Step 2: Push Code to Git (Run on your local machine)

```bash
# In your local S4D5 directory
git add -A
git commit -m "feat: add CDP wallet infrastructure"
git push origin main
```

---

## Step 3: Install on AS4 (Alpha Strategist)

### 3.1 SSH to AS4
```bash
ssh ubuntu@<AS4_IP_ADDRESS>
```

### 3.2 Pull Latest Code
```bash
cd ~/S4D5
git pull origin main
```

### 3.3 Create .env File
```bash
cd ~/S4D5
nano .env
```

**Add these lines to the EXISTING .env file** (don't delete what's already there):
```bash
# Add these CDP credentials at the top of the file
CDP_API_KEY_NAME=organizations/xxxxx/apiKeys/xxxxx
CDP_API_KEY_PRIVATE_KEY=-----BEGIN EC PRIVATE KEY-----
xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
-----END EC PRIVATE KEY-----
NETWORK_ID=base-mainnet
```

**Save and exit**: Press `Ctrl+X`, then `Y`, then `Enter`

### 3.4 Secure the .env File
```bash
chmod 600 ~/S4D5/.env
```

### 3.5 Install Dependencies
```bash
cd ~/S4D5/Backend/helix/alpha-strategist.skill
npm install
```

### 3.6 Initialize Wallet
```bash
npm run init-wallet
```

**IMPORTANT**: Copy the wallet address from the output!
```
[Alpha Strategist] Wallet address: 0xABCD...1234
```

Save this address - you'll need it to fund the wallet.

---

## Step 4: Install on AO3 (AuditOracle)

### 4.1 SSH to AO3
```bash
ssh ubuntu@<AO3_IP_ADDRESS>
```

### 4.2 Pull Latest Code
```bash
cd ~/S4D5
git pull origin main
```

### 4.3 Update .env File (Already exists from AS4)
```bash
cd ~/S4D5
# The .env file should already have CDP credentials from AS4
# Verify it exists and has the correct content
cat .env | grep CDP_API_KEY_NAME
```

If the file doesn't exist or is missing CDP credentials, create/update it:
```bash
nano .env
```

**Add these lines if missing**:
```bash
CDP_API_KEY_NAME=organizations/xxxxx/apiKeys/xxxxx
CDP_API_KEY_PRIVATE_KEY=-----BEGIN EC PRIVATE KEY-----
xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
-----END EC PRIVATE KEY-----
NETWORK_ID=base-mainnet
```

**Save and exit**: Press `Ctrl+X`, then `Y`, then `Enter`

### 4.4 Secure the .env File
```bash
chmod 600 ~/S4D5/.env
```

### 4.5 Install Dependencies
```bash
cd ~/S4D5/Backend/auditoracle
npm install
```

### 4.6 Initialize Wallet
```bash
npm run init-wallet
```

**IMPORTANT**: Copy the wallet address from the output!

---

## Step 5: Install on EH6 (ExecutionHand)

### 5.1 SSH to EH6
```bash
ssh ubuntu@<EH6_IP_ADDRESS>
```

### 5.2 Pull Latest Code
```bash
cd ~/S4D5
git pull origin main
```

### 5.3 Update .env File (Already exists from AS4 and AO3)
```bash
cd ~/S4D5
# The .env file should already have CDP credentials
# Verify it exists and has the correct content
cat .env | grep CDP_API_KEY_NAME
```

If the file doesn't exist or is missing CDP credentials, create/update it:
```bash
nano .env
```

**Add these lines if missing**:
```bash
CDP_API_KEY_NAME=organizations/xxxxx/apiKeys/xxxxx
CDP_API_KEY_PRIVATE_KEY=-----BEGIN EC PRIVATE KEY-----
xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
-----END EC PRIVATE KEY-----
NETWORK_ID=base-mainnet
```

**Save and exit**: Press `Ctrl+X`, then `Y`, then `Enter`

### 5.4 Secure the .env File
```bash
chmod 600 ~/S4D5/.env
```

### 5.5 Install Dependencies
```bash
cd ~/S4D5/Backend/executionhand
npm install
```

### 5.6 Initialize Wallet
```bash
npm run init-wallet
```

**IMPORTANT**: Copy the wallet address from the output!

---

## Step 6: Record Your Wallet Addresses

After completing all installations, you should have 3 wallet addresses:

```
Alpha Strategist (AS4): 0x_____________________
AuditOracle (AO3):      0x_____________________
ExecutionHand (EH6):    0x_____________________
```

**Save these addresses** - you'll need them to fund the wallets from your vault contract.

---

## Troubleshooting

### Error: "Cannot find module '@coinbase/cdp-agentkit'"
**Solution**: Run `npm install` again in the bot directory

### Error: "Missing required environment variables"
**Solution**: Check that your .env file exists and has the correct CDP credentials
```bash
cat ~/S4D5/.env
```

### Error: "Permission denied"
**Solution**: Make sure you're in the right directory and have proper permissions
```bash
ls -la ~/S4D5/.env
# Should show: -rw------- (600 permissions)
```

### Error: "git pull failed"
**Solution**: Make sure you pushed the code from your local machine first (Step 2)

---

## Next Steps

After installation:

1. **Fund the wallets** from your vault contract:
   ```javascript
   // Use the vault contract to fund each bot
   await vault.authorizeBotWallet("0x<AlphaStrategist_Address>");
   await vault.fundBotWallet("0x<AlphaStrategist_Address>", ethers.parseUnits("10", 6));
   
   // Repeat for AO3 and EH6
   ```

2. **Verify balances** on each bot:
   ```bash
   # On each EC2 instance
   cd ~/S4D5/Backend/<bot-directory>
   node -e "const CDPWalletManager = require('./lib/cdp-wallet'); require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') }); const w = new CDPWalletManager('Test'); w.initialize().then(() => w.getBalance()).then(b => console.log('Balance:', b));"
   ```

3. **Continue with x402 payment integration** (Task 6)

---

## Security Reminders

- ✅ Never commit .env files to git
- ✅ Keep .env file permissions at 600 (owner read/write only)
- ✅ Store CDP credentials securely
- ✅ Monitor wallet activity on BaseScan

---

## Quick Reference Commands

**Check if wallet is initialized:**
```bash
cat config/wallet.json
```

**View wallet address:**
```bash
cat config/wallet.json | grep address
```

**Reinstall if needed:**
```bash
rm -rf node_modules package-lock.json
npm install
npm run init-wallet
```

---

**Need help?** Check the detailed guides:
- `Backend/CDP-WALLET-SETUP.md` - Full setup documentation
- `Backend/EC2-INSTALLATION-GUIDE.md` - Detailed EC2 procedures
