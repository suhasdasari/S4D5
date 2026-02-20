# Base Sepolia Deployment Setup Guide

This guide will help you deploy the S4D5Vault contract to Base Sepolia testnet.

---

## Prerequisites Checklist

- [ ] Node.js and Yarn installed
- [ ] Wallet with private key (MetaMask or similar)
- [ ] Base Sepolia ETH for gas fees
- [ ] Base Sepolia USDC for vault initialization
- [ ] BaseScan API key for contract verification

---

## Step 1: Generate or Import Deployer Account

### Option A: Generate New Account (Recommended for Testing)

```bash
cd scaffold-eth-2/packages/hardhat
yarn generate
```

This will:
- Create a new wallet
- Encrypt the private key
- Save it to `.env` as `DEPLOYER_PRIVATE_KEY_ENCRYPTED`
- Display the public address

**Save the mnemonic phrase securely!**

### Option B: Import Existing Account

```bash
cd scaffold-eth-2/packages/hardhat
yarn account:import
```

This will:
- Prompt you for your private key
- Encrypt it
- Save it to `.env` as `DEPLOYER_PRIVATE_KEY_ENCRYPTED`

---

## Step 2: Get Base Sepolia ETH

You need ETH on Base Sepolia for gas fees (~0.01 ETH should be enough).

### Method 1: Base Sepolia Faucet
1. Go to https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet
2. Connect your wallet
3. Request testnet ETH
4. Wait for confirmation

### Method 2: Bridge from Sepolia
1. Get Sepolia ETH from https://sepoliafaucet.com/
2. Bridge to Base Sepolia at https://bridge.base.org/
3. Select Sepolia → Base Sepolia
4. Bridge your ETH

### Verify Balance
```bash
yarn account
```

This will show your balance on all configured networks.

---

## Step 3: Get Base Sepolia USDC

You need at least 1000 USDC to initialize the vault (prevents inflation attack).

### Base Sepolia USDC Address
```
0x036CbD53842c5426634e7929541eC2318f3dCF7e
```

### Method 1: Circle Faucet (if available)
Check https://faucet.circle.com/ for Base Sepolia USDC

### Method 2: Uniswap Testnet
1. Go to https://app.uniswap.org/
2. Connect to Base Sepolia network
3. Swap some ETH for USDC
4. Use address: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`

### Method 3: Manual Contract Interaction
If USDC has a mint function on testnet:
1. Go to BaseScan: https://sepolia.basescan.org/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e
2. Click "Contract" → "Write Contract"
3. Connect wallet
4. Look for `mint()` or `faucet()` function
5. Mint 1000 USDC (1000000000 with 6 decimals)

---

## Step 4: Get BaseScan API Key

1. Go to https://basescan.org/
2. Sign up for a free account
3. Go to "API Keys" section
4. Create a new API key
5. Copy the API key

---

## Step 5: Configure Environment Variables

Create `.env` file in `scaffold-eth-2/packages/hardhat/`:

```bash
cd scaffold-eth-2/packages/hardhat
cp .env.example .env
```

Edit `.env` and add:

```env
# BaseScan API Key (for contract verification)
BASESCAN_API_KEY=YOUR_BASESCAN_API_KEY_HERE

# Deployer private key (generated/imported in Step 1)
DEPLOYER_PRIVATE_KEY_ENCRYPTED=<already filled by yarn generate/import>

# Optional: Alchemy API key for better RPC reliability
ALCHEMY_API_KEY=YOUR_ALCHEMY_KEY_HERE
```

### Get Alchemy API Key (Optional but Recommended)
1. Go to https://www.alchemy.com/
2. Sign up for free account
3. Create new app
4. Select "Base Sepolia" network
5. Copy API key

---

## Step 6: Verify Setup

Check your deployer account balance:

```bash
cd scaffold-eth-2/packages/hardhat
yarn account
```

You should see:
- Base Sepolia ETH balance > 0.01 ETH
- Your deployer address

Check USDC balance manually:
1. Go to https://sepolia.basescan.org/
2. Search for your deployer address
3. Check token holdings for USDC

---

## Step 7: Deploy Contract

```bash
cd scaffold-eth-2/packages/hardhat
yarn deploy --network baseSepolia
```

This will:
1. Deploy S4D5Vault contract
2. Wait for confirmations
3. Verify contract on BaseScan
4. Print deployment address and next steps

**Expected output:**
```
📦 Deploying S4D5Vault...
Network: baseSepolia
Deployer: 0xYourAddress
Using Base Sepolia USDC: 0x036CbD53842c5426634e7929541eC2318f3dCF7e

✅ S4D5Vault deployed!
Address: 0xVaultAddress
Transaction: 0xTxHash

🔍 Waiting for block confirmations before verification...
✅ Contract verified on BaseScan!

📝 Next steps:
1. CRITICAL: Initialize vault with seed deposit...
```

---

## Step 8: Initialize Vault (CRITICAL!)

After deployment, you MUST initialize the vault before accepting deposits.

### Using Hardhat Console

```bash
cd scaffold-eth-2/packages/hardhat
yarn hardhat console --network baseSepolia
```

Then in the console:

```javascript
// Get deployed contracts
const vault = await ethers.getContract("S4D5Vault");
const usdc = await ethers.getContractAt("IERC20", "0x036CbD53842c5426634e7929541eC2318f3dCF7e");

// Check your USDC balance
const balance = await usdc.balanceOf(await ethers.provider.getSigner().getAddress());
console.log("USDC Balance:", ethers.formatUnits(balance, 6));

// Approve vault to spend USDC
const approveTx = await usdc.approve(await vault.getAddress(), ethers.parseUnits("1000", 6));
await approveTx.wait();
console.log("✅ USDC approved");

// Initialize vault with 1000 USDC
const initTx = await vault.initializeVault(ethers.parseUnits("1000", 6));
await initTx.wait();
console.log("✅ Vault initialized!");

// Verify initialization
const totalSupply = await vault.totalSupply();
console.log("Total shares:", ethers.formatEther(totalSupply));
```

### Using Remix (Alternative)

1. Go to https://remix.ethereum.org/
2. Load S4D5Vault.sol
3. Compile contract
4. Connect to "Injected Provider" (MetaMask on Base Sepolia)
5. Load deployed contract at address
6. First approve USDC:
   - Go to USDC contract: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
   - Call `approve(vaultAddress, 1000000000)`
7. Then initialize vault:
   - Call `initializeVault(1000000000)`

---

## Step 9: Configure Vault (Required for Trading)

### Set Price Oracle (Required for Multi-Asset Accounting)

For testing, you can deploy a simple mock oracle or skip this until you have a real oracle.

```javascript
// In Hardhat console
await vault.setPriceOracle(oracleAddress);
```

### Whitelist Tokens

```javascript
// Whitelist WETH
await vault.whitelistToken("0x4200000000000000000000000000000000000006");

// Whitelist other tokens as needed
```

### Whitelist DEX Routers

```javascript
// Whitelist Uniswap V3 Router on Base Sepolia
await vault.whitelistDexRouter("0x...");

// Whitelist Aerodrome Router
await vault.whitelistDexRouter("0x...");
```

### Authorize Bot Wallets

```javascript
// Authorize Alpha Strategist
await vault.authorizeBotWallet("0xAlphaStrategistCDPWallet");

// Authorize AuditOracle
await vault.authorizeBotWallet("0xAuditOracleCDPWallet");

// Authorize ExecutionHand
await vault.authorizeBotWallet("0xExecutionHandCDPWallet");
```

---

## Step 10: Verify Deployment

### Check on BaseScan

1. Go to https://sepolia.basescan.org/
2. Search for your vault address
3. Verify:
   - Contract is verified (green checkmark)
   - Total supply > 0 (vault initialized)
   - Owner is your address

### Test Deposit/Withdraw

```javascript
// In Hardhat console
const depositAmount = ethers.parseUnits("100", 6); // 100 USDC

// Approve USDC
await usdc.approve(await vault.getAddress(), depositAmount);

// Deposit
const depositTx = await vault.deposit(depositAmount, await ethers.provider.getSigner().getAddress());
await depositTx.wait();
console.log("✅ Deposited 100 USDC");

// Check shares
const shares = await vault.balanceOf(await ethers.provider.getSigner().getAddress());
console.log("Vault shares:", ethers.formatEther(shares));

// Withdraw
const withdrawTx = await vault.withdraw(depositAmount, await ethers.provider.getSigner().getAddress(), await ethers.provider.getSigner().getAddress());
await withdrawTx.wait();
console.log("✅ Withdrew 100 USDC");
```

---

## Troubleshooting

### "Insufficient funds for gas"
- Get more Base Sepolia ETH from faucet
- Check balance: `yarn account`

### "Vault already initialized"
- Vault can only be initialized once
- Check if totalSupply > 0
- If already initialized, skip to Step 9

### "USDC transfer failed"
- Check USDC balance: `usdc.balanceOf(yourAddress)`
- Ensure you have at least 1000 USDC
- Check approval: `usdc.allowance(yourAddress, vaultAddress)`

### "Contract verification failed"
- Wait longer (30-60 seconds) before verification
- Verify manually: `yarn hardhat verify --network baseSepolia <address> <constructor args>`
- Check BaseScan API key is correct

### "Network not configured"
- Ensure you're in `scaffold-eth-2/packages/hardhat` directory
- Check `hardhat.config.ts` has Base Sepolia configuration
- Try: `yarn hardhat --network baseSepolia accounts`

---

## Quick Reference

### Useful Commands

```bash
# Check account balance
yarn account

# Deploy to Base Sepolia
yarn deploy --network baseSepolia

# Verify contract manually
yarn hardhat verify --network baseSepolia <address> <usdc> "S4D5 Vault Shares" "S4D5-VAULT"

# Open Hardhat console
yarn hardhat console --network baseSepolia

# Check deployment info
cat deployments/baseSepolia/S4D5Vault.json
```

### Important Addresses

**Base Sepolia:**
- USDC: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
- WETH: `0x4200000000000000000000000000000000000006`
- Chain ID: `84532`

**Base Mainnet:**
- USDC: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- WETH: `0x4200000000000000000000000000000000000006`
- Chain ID: `8453`

### Links

- Base Sepolia Faucet: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet
- BaseScan Sepolia: https://sepolia.basescan.org/
- Base Bridge: https://bridge.base.org/
- Alchemy: https://www.alchemy.com/

---

## Security Reminders

1. **Never commit `.env` file** - It's in `.gitignore`
2. **Use testnet for testing** - Don't deploy to mainnet until fully tested
3. **Initialize vault immediately** - Prevents inflation attack
4. **Set price oracle** - Required for multi-asset accounting
5. **Whitelist carefully** - Only add trusted DEX routers and tokens
6. **Test thoroughly** - Verify all functions work before mainnet

---

## Next Steps After Deployment

1. ✅ Deploy contract
2. ✅ Initialize vault
3. ✅ Configure price oracle
4. ✅ Whitelist tokens and DEX routers
5. ✅ Authorize bot wallets
6. ⏭️ Implement bot infrastructure (CDP wallets, x402 payments)
7. ⏭️ Implement frontend
8. ⏭️ Integration testing
9. ⏭️ Deploy to mainnet

---

**Need Help?**
- Check the contract guide: `contracts/S4D5Vault-GUIDE.md`
- Check security docs: `contracts/S4D5Vault-SECURITY.md`
- Review deploy script: `deploy/01_deploy_vault.ts`
