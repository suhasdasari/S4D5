# CDP Wallet Setup Guide

This guide explains how to install and configure Coinbase AgentKit for the three S4D5 bots (Alpha Strategist, AuditOracle, ExecutionHand) to enable x402 micropayments on Base network.

## Prerequisites

- Node.js v18 or higher installed on all EC2 instances
- Access to EC2 instances: AS4 (Alpha Strategist), AO3 (AuditOracle), EH6 (ExecutionHand)
- Coinbase Developer Platform (CDP) API credentials
- Base network RPC endpoint access

## Step 1: Obtain CDP API Credentials

1. Visit [Coinbase Developer Platform](https://portal.cdp.coinbase.com/)
2. Create a new project or select existing project
3. Generate API credentials:
   - API Key Name
   - API Key Private Key (keep secure!)
4. Save these credentials - you'll need them for environment variables

## Step 2: Install Coinbase AgentKit on EC2 Instances

### On AS4 (Alpha Strategist)

```bash
# SSH to AS4 instance
ssh ubuntu@<AS4_IP>

# Navigate to bot directory
cd ~/S4D5/Backend/helix/alpha-strategist.skill

# Install AgentKit
npm install @coinbase/cdp-agentkit

# Verify installation
npm list @coinbase/cdp-agentkit
```

### On AO3 (AuditOracle)

```bash
# SSH to AO3 instance
ssh ubuntu@<AO3_IP>

# Navigate to bot directory
cd ~/S4D5/Backend/auditoracle

# Install AgentKit
npm install @coinbase/cdp-agentkit

# Verify installation
npm list @coinbase/cdp-agentkit
```

### On EH6 (ExecutionHand)

```bash
# SSH to EH6 instance
ssh ubuntu@<EH6_IP>

# Navigate to bot directory
cd ~/S4D5/Backend/executionhand

# Install AgentKit
npm install @coinbase/cdp-agentkit

# Verify installation
npm list @coinbase/cdp-agentkit
```

## Step 3: Configure Environment Variables

Add the following environment variables to the `.env` file in the project root (or create bot-specific .env files):

```bash
# CDP Wallet Configuration
CDP_API_KEY_NAME=your_api_key_name_here
CDP_API_KEY_PRIVATE_KEY=your_private_key_here
NETWORK_ID=base-mainnet

# For testnet, use:
# NETWORK_ID=base-sepolia
```

**Security Note:** Never commit the `.env` file to version control. Ensure it's listed in `.gitignore`.

## Step 4: Initialize CDP Wallets

Run the initialization script on each bot to create their CDP wallets:

### Alpha Strategist (AS4)

```bash
cd ~/S4D5/Backend/helix/alpha-strategist.skill
node scripts/init-wallet.js
```

Expected output:
```
[Alpha Strategist] Starting CDP wallet initialization...
[Alpha Strategist] Initializing CDP wallet...
[Alpha Strategist] CDP wallet created: 0x1234...5678
[Alpha Strategist] ✓ CDP wallet initialized successfully
[Alpha Strategist] Wallet address: 0x1234...5678
[Alpha Strategist] Network: base-mainnet
[Alpha Strategist] Current USDC balance: 0
[Alpha Strategist] Wallet configuration saved to config/wallet.json
```

### AuditOracle (AO3)

```bash
cd ~/S4D5/Backend/auditoracle
node scripts/init-wallet.js
```

### ExecutionHand (EH6)

```bash
cd ~/S4D5/Backend/executionhand
node scripts/init-wallet.js
```

## Step 5: Save Wallet Addresses

After initialization, each bot will have a `config/wallet.json` file containing:

```json
{
  "botName": "Alpha Strategist",
  "address": "0x1234567890abcdef...",
  "network": "base-mainnet",
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

**Important:** Save these wallet addresses - you'll need them to:
1. Fund the wallets from the vault contract
2. Configure x402 payment recipients
3. Register Kite AI Agent Passports

## Step 6: Fund Bot Wallets

Once the vault contract is deployed and funded, use the vault's `fundBotWallet()` function to transfer USDC to each bot:

```javascript
// Example: Fund each bot with 10 USDC
await vault.authorizeBotWallet("0x<AlphaStrategist_Address>");
await vault.fundBotWallet("0x<AlphaStrategist_Address>", ethers.parseUnits("10", 6));

await vault.authorizeBotWallet("0x<AuditOracle_Address>");
await vault.fundBotWallet("0x<AuditOracle_Address>", ethers.parseUnits("10", 6));

await vault.authorizeBotWallet("0x<ExecutionHand_Address>");
await vault.fundBotWallet("0x<ExecutionHand_Address>", ethers.parseUnits("10", 6));
```

## Step 7: Verify Wallet Balances

Check that each bot received the funds:

```bash
# On each bot instance, run:
node -e "
const CDPWalletManager = require('./lib/cdp-wallet');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const wallet = new CDPWalletManager('Test');
wallet.initialize().then(() => wallet.getBalance()).then(b => console.log('Balance:', b));
"
```

## Troubleshooting

### Error: "Missing required environment variables"

**Solution:** Ensure `CDP_API_KEY_NAME` and `CDP_API_KEY_PRIVATE_KEY` are set in your `.env` file.

### Error: "CDP wallet initialization failed"

**Possible causes:**
1. Invalid API credentials - verify your CDP API keys
2. Network connectivity issues - check internet connection
3. Incorrect NETWORK_ID - ensure it's "base-mainnet" or "base-sepolia"

### Error: "Failed to get balance"

**Solution:** This is normal for newly created wallets. The wallet needs to be funded first via the vault contract.

### Wallet address not persisted

**Solution:** Ensure the bot has write permissions to create the `config/` directory and `wallet.json` file.

## Next Steps

After completing CDP wallet setup:

1. ✅ Install AgentKit on all three EC2 instances
2. ✅ Initialize CDP wallets for all bots
3. ✅ Fund wallets from vault contract
4. ⏭️ Implement x402 payment protocol (Task 6)
5. ⏭️ Register Kite AI Agent Passports (Task 7)

## File Structure

```
Backend/
├── helix/
│   └── alpha-strategist.skill/
│       ├── lib/
│       │   └── cdp-wallet.js          # CDP wallet manager
│       ├── scripts/
│       │   └── init-wallet.js         # Initialization script
│       └── config/
│           └── wallet.json            # Wallet configuration (generated)
├── auditoracle/
│   ├── lib/
│   │   └── cdp-wallet.js
│   ├── scripts/
│   │   └── init-wallet.js
│   └── config/
│       └── wallet.json
└── executionhand/
    ├── lib/
    │   └── cdp-wallet.js
    ├── scripts/
    │   └── init-wallet.js
    └── config/
        └── wallet.json
```

## Security Best Practices

1. **Never commit credentials:** Keep `.env` files out of version control
2. **Restrict file permissions:** Set wallet.json to 0600 (owner read/write only)
3. **Rotate keys regularly:** Update CDP API keys periodically
4. **Monitor wallet activity:** Check BaseScan for unexpected transactions
5. **Use testnet first:** Test on Base Sepolia before mainnet deployment

## Support

For issues with:
- **AgentKit:** Check [Coinbase AgentKit Documentation](https://docs.cdp.coinbase.com/agentkit)
- **Base Network:** Visit [Base Documentation](https://docs.base.org)
- **S4D5 Integration:** Contact the development team

---

**Last Updated:** 2024-01-15
**Version:** 1.0.0
