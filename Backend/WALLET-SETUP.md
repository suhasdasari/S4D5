# Bot Wallet Setup Guide

Simple guide to create Ethereum wallets for your 3 bots on Base network.

## Quick Start

### 1. Install Dependencies

On each EC2 instance (AS4, AO3, EH6):

```bash
cd ~/S4D5
git pull origin main

# For ExecutionHand (EH6)
cd Backend/executionhand
npm install

# For AuditOracle (AO3)
cd Backend/auditoracle
npm install

# For Alpha Strategist (AS4)
cd Backend/helix/alpha-strategist.skill
npm install
```

### 2. Initialize Wallets

Run on each EC2 instance:

```bash
npm run init-wallet
```

This will:
- Create a new Ethereum wallet
- Save it to `config/wallet.json`
- Display the wallet address
- Show current balances (ETH and USDC)

### 3. Save Wallet Addresses

Copy the 3 wallet addresses:

```
Alpha Strategist (AS4): 0x_____________________
AuditOracle (AO3):      0x_____________________
ExecutionHand (EH6):    0x_____________________
```

### 4. Fund Wallets

Fund each wallet with:
- **ETH**: For gas fees (~0.01 ETH per wallet)
- **USDC**: For operations (amount depends on your strategy)

You can fund them:
1. Directly from your deployer wallet
2. Through your vault contract (recommended)

## Wallet Storage

Each bot's wallet is stored in:
- `Backend/executionhand/config/wallet.json`
- `Backend/auditoracle/config/wallet.json`
- `Backend/helix/alpha-strategist.skill/config/wallet.json`

**⚠️ SECURITY**: These files contain private keys. Never commit them to git!

## Checking Balances

To check wallet balances at any time:

```bash
cd Backend/<bot-directory>
npm run init-wallet
```

This will load the existing wallet and display current balances.

## Network Details

- **Network**: Base Mainnet
- **Chain ID**: 8453
- **RPC URL**: https://mainnet.base.org
- **USDC Contract**: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913

## Next Steps

After wallet setup:
1. Implement x402 micropayment protocol
2. Register Kite AI Agent Passports
3. Integrate with vault contract for funding

## Troubleshooting

**"Cannot find module 'ethers'"**
- Run `npm install` in the bot directory

**"Wallet not initialized"**
- Run `npm run init-wallet` first

**"Insufficient funds"**
- Fund the wallet with ETH for gas and USDC for operations

## Security Best Practices

- ✅ Keep `config/wallet.json` files secure
- ✅ Never share private keys
- ✅ Use `.gitignore` to exclude wallet files
- ✅ Monitor wallet activity on BaseScan
- ✅ Set up spending limits in your vault contract
