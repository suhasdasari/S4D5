# EC2 Installation Guide for CDP Wallet Infrastructure

This guide provides step-by-step instructions for installing Coinbase AgentKit on the three EC2 instances that host the S4D5 bots.

## Instance Information

| Instance | Bot Name | Purpose |
|----------|----------|---------|
| AS4 | Alpha Strategist | Market analysis and trade proposals |
| AO3 | AuditOracle | Risk assessment and proposal auditing |
| EH6 | ExecutionHand | Trade execution with spending limits |

## Prerequisites

- SSH access to all three EC2 instances
- Sudo privileges on the instances
- Node.js v18+ installed (verify with `node --version`)
- Git access to the S4D5 repository

## Installation Steps

### Step 1: Update Repository on Each Instance

Connect to each instance and pull the latest code:

```bash
# For AS4 (Alpha Strategist)
ssh ubuntu@<AS4_IP>
cd ~/S4D5
git pull origin main

# For AO3 (AuditOracle)
ssh ubuntu@<AO3_IP>
cd ~/S4D5
git pull origin main

# For EH6 (ExecutionHand)
ssh ubuntu@<EH6_IP>
cd ~/S4D5
git pull origin main
```

### Step 2: Install AgentKit Dependencies

#### On AS4 (Alpha Strategist)

```bash
ssh ubuntu@<AS4_IP>
cd ~/S4D5/Backend/helix/alpha-strategist.skill

# Install dependencies including AgentKit
npm install

# Verify AgentKit installation
npm list @coinbase/cdp-agentkit

# Expected output:
# alpha-strategist-skill@1.0.0 /home/ubuntu/S4D5/Backend/helix/alpha-strategist.skill
# └── @coinbase/cdp-agentkit@0.0.1
```

#### On AO3 (AuditOracle)

```bash
ssh ubuntu@<AO3_IP>
cd ~/S4D5/Backend/auditoracle

# Install dependencies including AgentKit
npm install

# Verify AgentKit installation
npm list @coinbase/cdp-agentkit
```

#### On EH6 (ExecutionHand)

```bash
ssh ubuntu@<EH6_IP>
cd ~/S4D5/Backend/executionhand

# Install dependencies including AgentKit
npm install

# Verify AgentKit installation
npm list @coinbase/cdp-agentkit
```

### Step 3: Configure Environment Variables

On each instance, update the `.env` file with CDP credentials:

```bash
# Navigate to project root
cd ~/S4D5

# Edit .env file (use nano, vim, or your preferred editor)
nano .env

# Add these lines:
CDP_API_KEY_NAME=your_cdp_api_key_name
CDP_API_KEY_PRIVATE_KEY=your_cdp_private_key
NETWORK_ID=base-mainnet

# For testnet, use:
# NETWORK_ID=base-sepolia

# Save and exit (Ctrl+X, then Y, then Enter in nano)
```

**Security Note:** Ensure the `.env` file has restricted permissions:

```bash
chmod 600 ~/S4D5/.env
```

### Step 4: Initialize CDP Wallets

Run the wallet initialization script on each bot:

#### Alpha Strategist (AS4)

```bash
ssh ubuntu@<AS4_IP>
cd ~/S4D5/Backend/helix/alpha-strategist.skill
npm run init-wallet
```

**Expected Output:**
```
[Alpha Strategist] Starting CDP wallet initialization...
[Alpha Strategist] Initializing CDP wallet...
[Alpha Strategist] CDP wallet created: 0xABCD...1234
[Alpha Strategist] ✓ CDP wallet initialized successfully
[Alpha Strategist] Wallet address: 0xABCD...1234
[Alpha Strategist] Network: base-mainnet
[Alpha Strategist] Note: Could not fetch balance (wallet may need funding)
[Alpha Strategist] Wallet configuration saved to config/wallet.json
```

**Save the wallet address** - you'll need it for funding and configuration.

#### AuditOracle (AO3)

```bash
ssh ubuntu@<AO3_IP>
cd ~/S4D5/Backend/auditoracle
npm run init-wallet
```

Save the wallet address from the output.

#### ExecutionHand (EH6)

```bash
ssh ubuntu@<EH6_IP>
cd ~/S4D5/Backend/executionhand
npm run init-wallet
```

Save the wallet address from the output.

### Step 5: Verify Installation

On each instance, verify the wallet configuration was created:

```bash
# Check wallet config file exists
cat config/wallet.json

# Expected output:
# {
#   "botName": "Alpha Strategist",
#   "address": "0xABCD...1234",
#   "network": "base-mainnet",
#   "createdAt": "2024-01-15T10:30:00.000Z"
# }
```

### Step 6: Test Wallet Functionality

Run a quick test to ensure the wallet can be loaded:

```bash
# Test wallet loading
node -e "
const CDPWalletManager = require('./lib/cdp-wallet');
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const wallet = new CDPWalletManager('Test');
wallet.initialize()
  .then(() => wallet.getAddress())
  .then(addr => console.log('✓ Wallet loaded successfully:', addr))
  .catch(err => console.error('✗ Error:', err.message));
"
```

## Troubleshooting

### Issue: "Cannot find module '@coinbase/cdp-agentkit'"

**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Issue: "Missing required environment variables"

**Solution:**
```bash
# Verify .env file exists and contains CDP credentials
cat ~/S4D5/.env | grep CDP

# Should show:
# CDP_API_KEY_NAME=...
# CDP_API_KEY_PRIVATE_KEY=...
```

### Issue: "Permission denied" when creating config directory

**Solution:**
```bash
# Ensure proper ownership
sudo chown -R ubuntu:ubuntu ~/S4D5/Backend
```

### Issue: "Network timeout" during initialization

**Possible causes:**
1. EC2 security group blocking outbound HTTPS
2. CDP API endpoint unreachable
3. Invalid API credentials

**Solution:**
```bash
# Test network connectivity
curl -I https://api.cdp.coinbase.com

# Check security group allows outbound HTTPS (port 443)
```

## Post-Installation Checklist

- [ ] AgentKit installed on AS4
- [ ] AgentKit installed on AO3
- [ ] AgentKit installed on EH6
- [ ] Environment variables configured on all instances
- [ ] CDP wallet initialized for Alpha Strategist
- [ ] CDP wallet initialized for AuditOracle
- [ ] CDP wallet initialized for ExecutionHand
- [ ] All wallet addresses saved for funding
- [ ] Wallet config files verified on all instances

## Next Steps

After completing installation:

1. **Fund the wallets** from the vault contract (see CDP-WALLET-SETUP.md)
2. **Implement x402 payment protocol** (Task 6)
3. **Register Kite AI Agent Passports** (Task 7)

## Wallet Addresses Reference

Record your wallet addresses here for easy reference:

```
Alpha Strategist (AS4): 0x_____________________
AuditOracle (AO3):      0x_____________________
ExecutionHand (EH6):    0x_____________________
```

## Automated Installation Script

For convenience, you can use the automated installation script:

```bash
# On each instance
cd ~/S4D5/Backend
./install-agentkit.sh
```

This script will:
1. Install AgentKit in all three bot directories
2. Verify installations
3. Display next steps

## Security Reminders

1. **Never commit `.env` files** to version control
2. **Restrict file permissions** on sensitive files:
   ```bash
   chmod 600 ~/S4D5/.env
   chmod 600 ~/S4D5/Backend/*/config/wallet.json
   ```
3. **Rotate API keys** regularly
4. **Monitor wallet activity** on BaseScan
5. **Use testnet first** before mainnet deployment

## Support

For installation issues:
- Check the [CDP-WALLET-SETUP.md](./CDP-WALLET-SETUP.md) guide
- Review [Coinbase AgentKit Documentation](https://docs.cdp.coinbase.com/agentkit)
- Contact the S4D5 development team

---

**Last Updated:** 2024-01-15
**Version:** 1.0.0
