# Quick Start: Deploy to Base Sepolia

This is a streamlined guide to get your vault deployed and running quickly.

---

## 🚀 5-Minute Setup

### Step 1: Generate Deployer Account (30 seconds)

```bash
cd scaffold-eth-2/packages/hardhat
yarn generate
```

**Save the mnemonic phrase!** Then copy your address.

---

### Step 2: Get Test Funds (2-3 minutes)

1. **Get Base Sepolia ETH:**
   - Go to: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet
   - Paste your address
   - Request ETH

2. **Get Base Sepolia USDC:**
   - Go to: https://sepolia.basescan.org/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e#writeContract
   - Connect wallet
   - Look for `mint()` or similar function
   - Mint 1000 USDC (enter: `1000000000` with 6 decimals)

---

### Step 3: Get BaseScan API Key (1 minute)

1. Go to: https://basescan.org/
2. Sign up (free)
3. Create API key
4. Copy it

---

### Step 4: Configure Environment (30 seconds)

```bash
cd scaffold-eth-2/packages/hardhat
cp .env.example .env
```

Edit `.env` and add your BaseScan API key:

```env
BASESCAN_API_KEY=YOUR_KEY_HERE
```

(DEPLOYER_PRIVATE_KEY_ENCRYPTED is already filled by `yarn generate`)

---

### Step 5: Deploy Everything (1 minute)

```bash
yarn deploy --network baseSepolia
```

This deploys:
- S4D5Vault contract
- MockPriceOracle (for testing)

Wait for verification to complete.

---

### Step 6: Initialize Vault (30 seconds)

```bash
yarn hardhat run scripts/initialize-vault.ts --network baseSepolia
```

This:
- Approves 1000 USDC
- Initializes vault (prevents inflation attack)
- Mints shares

---

### Step 7: Configure Vault (30 seconds)

```bash
yarn hardhat run scripts/configure-vault.ts --network baseSepolia
```

This:
- Sets price oracle
- Whitelists WETH
- Ready for trading

---

## ✅ You're Done!

Your vault is now deployed and ready on Base Sepolia!

### What You Have:

- ✅ S4D5Vault deployed and verified
- ✅ MockPriceOracle for testing
- ✅ Vault initialized (inflation-attack protected)
- ✅ WETH whitelisted for trading
- ✅ Ready for bot integration

### Vault Address:

Check `deployments/baseSepolia/S4D5Vault.json` for your vault address.

Or run:
```bash
cat deployments/baseSepolia/S4D5Vault.json | grep '"address"'
```

---

## 🧪 Test Your Vault

### Quick Test in Hardhat Console:

```bash
yarn hardhat console --network baseSepolia
```

Then:

```javascript
// Get contracts
const vault = await ethers.getContract("S4D5Vault");
const usdc = await ethers.getContractAt("IERC20", "0x036CbD53842c5426634e7929541eC2318f3dCF7e");

// Check vault status
console.log("Vault address:", await vault.getAddress());
console.log("Total supply:", ethers.formatEther(await vault.totalSupply()));
console.log("Total assets:", ethers.formatUnits(await vault.totalAssets(), 6), "USDC");

// Test deposit
const amount = ethers.parseUnits("10", 6); // 10 USDC
await usdc.approve(await vault.getAddress(), amount);
await vault.deposit(amount, await ethers.provider.getSigner().getAddress());
console.log("✅ Deposited 10 USDC");

// Check shares
const shares = await vault.balanceOf(await ethers.provider.getSigner().getAddress());
console.log("Your shares:", ethers.formatEther(shares));
```

---

## 📋 Next Steps

### For Bot Integration:

1. **Set up CDP wallets** (Task 5)
   - Install Coinbase AgentKit on EC2 instances
   - Create CDP wallets for each bot
   - Get wallet addresses

2. **Authorize bots** (update `scripts/configure-vault.ts`):
   ```javascript
   const bots = [
     { name: "Alpha Strategist", address: "0x..." },
     { name: "AuditOracle", address: "0x..." },
     { name: "ExecutionHand", address: "0x..." },
   ];
   ```
   Then run: `yarn hardhat run scripts/configure-vault.ts --network baseSepolia`

3. **Whitelist DEX routers** (for trading):
   - Find Uniswap V3 router on Base Sepolia
   - Add to `scripts/configure-vault.ts`
   - Run configuration script again

### For Frontend:

1. Update contract addresses in frontend config
2. Test deposit/withdraw UI
3. Implement activity feed
4. Test x402 payment display

---

## 🔗 Useful Links

- **Your Vault on BaseScan:**
  `https://sepolia.basescan.org/address/YOUR_VAULT_ADDRESS`

- **USDC Contract:**
  `https://sepolia.basescan.org/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e`

- **Base Sepolia Faucet:**
  `https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet`

---

## 🆘 Troubleshooting

### "Insufficient funds"
```bash
yarn account  # Check balance
```
Get more ETH from faucet if needed.

### "Vault already initialized"
That's fine! It means Step 6 already ran successfully.

### "Contract verification failed"
Wait 30-60 seconds and try manual verification:
```bash
yarn hardhat verify --network baseSepolia <vault-address> <usdc-address> "S4D5 Vault Shares" "S4D5-VAULT"
```

### Need more help?
Check `DEPLOYMENT-SETUP.md` for detailed instructions.

---

## 📊 Check Deployment Status

```bash
# Check if vault is deployed
cat deployments/baseSepolia/S4D5Vault.json

# Check if oracle is deployed
cat deployments/baseSepolia/MockPriceOracle.json

# Check your account balance
yarn account

# Open console for manual testing
yarn hardhat console --network baseSepolia
```

---

**Ready to continue?** Proceed to Task 5: Implement CDP wallet infrastructure for bots!
