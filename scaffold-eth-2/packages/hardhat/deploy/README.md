# Deploy Scripts Explained

## What Are Deploy Files?

Deploy files in the `deploy/` folder are scripts that automatically deploy your smart contracts to blockchain networks. They use the `hardhat-deploy` plugin to manage deployments.

---

## How They Work

### File Naming Convention
Files are executed in **alphabetical order**:
- `00_deploy_your_contract.ts` runs first
- `01_deploy_vault.ts` runs second
- `02_deploy_something_else.ts` would run third

The numbers ensure deployment order (useful when contracts depend on each other).

---

## File Structure

Each deploy file exports a function with this structure:

```typescript
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployMyContract: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  // 1. Get deployer account
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // 2. Deploy contract
  await deploy("ContractName", {
    from: deployer,
    args: [constructorArg1, constructorArg2],
    log: true,
    autoMine: true,
  });
};

export default deployMyContract;
deployMyContract.tags = ["ContractName"];
```

---

## Key Components

### 1. HardhatRuntimeEnvironment (hre)
Provides access to:
- `hre.network.name` - Current network (e.g., "base", "baseSepolia", "localhost")
- `hre.deployments` - Deployment functions
- `hre.ethers` - Ethers.js library
- `hre.getNamedAccounts()` - Get configured accounts

### 2. Deployer Account
```typescript
const { deployer } = await hre.getNamedAccounts();
```
- On localhost: Uses Hardhat's default funded account
- On live networks: Uses account from your private key (configured in `.env`)

### 3. Deploy Function
```typescript
await deploy("ContractName", {
  from: deployer,           // Who pays for deployment
  args: [...],              // Constructor arguments
  log: true,                // Print deployment info
  autoMine: true,           // Auto-mine on local networks
});
```

### 4. Tags
```typescript
deployMyContract.tags = ["ContractName"];
```
Allows selective deployment:
```bash
yarn deploy --tags ContractName  # Only deploy this contract
```

---

## Our Deploy Files

### `00_deploy_your_contract.ts`
**Purpose:** Example/template deployment script from Scaffold-ETH 2

**What it does:**
- Deploys a sample "YourContract" contract
- Uses deployer address as constructor argument
- Logs initial greeting after deployment

**Usage:** This is a template - you can modify or delete it.

---

### `01_deploy_vault.ts`
**Purpose:** Deploy S4D5Vault contract to Base networks

**What it does:**
1. Checks network (only deploys on Base or Base Sepolia)
2. Selects correct USDC address based on network
3. Deploys S4D5Vault with:
   - USDC address as underlying asset
   - "S4D5 Vault Shares" as token name
   - "S4D5-VAULT" as token symbol
4. Waits for confirmations
5. Verifies contract on BaseScan
6. Prints next steps for initialization

**Network Detection:**
```typescript
if (hre.network.name === "base") {
  usdcAddress = USDC_ADDRESSES.base;  // Mainnet USDC
} else if (hre.network.name === "baseSepolia") {
  usdcAddress = USDC_ADDRESSES.baseSepolia;  // Testnet USDC
} else {
  return;  // Don't deploy on other networks
}
```

**Verification:**
- Automatically verifies on BaseScan after deployment
- Handles "Already Verified" errors gracefully
- Provides manual verification command if auto-verify fails

---

## Running Deploy Scripts

### Deploy All Contracts
```bash
# Local network (Hardhat)
yarn deploy

# Base Sepolia (testnet)
yarn deploy --network baseSepolia

# Base Mainnet
yarn deploy --network base
```

### Deploy Specific Contract
```bash
# Only deploy vault
yarn deploy --network baseSepolia --tags S4D5Vault

# Only deploy YourContract
yarn deploy --network baseSepolia --tags YourContract
```

### Reset Deployments
```bash
# Clear deployment history and redeploy
yarn deploy --network baseSepolia --reset
```

---

## Deployment Flow

### 1. Before Deployment
- Ensure you have funds in deployer account
- Check network configuration in `hardhat.config.ts`
- Verify constructor arguments are correct

### 2. During Deployment
- Script checks network
- Deploys contract with specified arguments
- Waits for transaction confirmation
- Saves deployment info to `deployments/` folder

### 3. After Deployment
- Contract address saved in `deployments/<network>/ContractName.json`
- Verification attempted on block explorer
- Next steps printed to console

---

## Deployment Artifacts

After deployment, files are created in `deployments/<network>/`:

```
deployments/
├── baseSepolia/
│   ├── S4D5Vault.json          # Contract ABI + address
│   ├── .chainId                # Network chain ID
│   └── solcInputs/             # Compiler inputs for verification
└── base/
    └── S4D5Vault.json
```

These files contain:
- Contract address
- ABI (Application Binary Interface)
- Constructor arguments
- Transaction hash
- Block number

---

## Common Patterns

### Network-Specific Configuration
```typescript
let config;
if (hre.network.name === "base") {
  config = MAINNET_CONFIG;
} else if (hre.network.name === "baseSepolia") {
  config = TESTNET_CONFIG;
} else {
  throw new Error("Unsupported network");
}
```

### Conditional Verification
```typescript
const isLiveNetwork = hre.network.name === "base" || hre.network.name === "baseSepolia";
if (isLiveNetwork) {
  await hre.run("verify:verify", {
    address: contract.address,
    constructorArguments: [...],
  });
}
```

### Getting Deployed Contracts
```typescript
// Get previously deployed contract
const vault = await hre.ethers.getContract("S4D5Vault", deployer);
console.log("Vault address:", await vault.getAddress());
```

### Deploying with Dependencies
```typescript
// Deploy Token first
const token = await deploy("Token", { ... });

// Then deploy Vault with Token address
await deploy("Vault", {
  args: [token.address],
  ...
});
```

---

## Best Practices

### 1. Network Checks
Always verify you're on the correct network:
```typescript
if (hre.network.name !== "base" && hre.network.name !== "baseSepolia") {
  console.log("⚠️  Warning: Not deploying on Base network");
  return;
}
```

### 2. Constructor Validation
Validate constructor arguments before deployment:
```typescript
require(usdcAddress !== ethers.ZeroAddress, "Invalid USDC address");
```

### 3. Deployment Logging
Log important information:
```typescript
console.log("Network:", hre.network.name);
console.log("Deployer:", deployer);
console.log("USDC Address:", usdcAddress);
```

### 4. Error Handling
Handle verification errors gracefully:
```typescript
try {
  await hre.run("verify:verify", { ... });
} catch (error) {
  console.log("Verification failed:", error.message);
  console.log("Manual verification command: ...");
}
```

### 5. Post-Deployment Instructions
Guide users on next steps:
```typescript
console.log("\n📝 Next steps:");
console.log("1. Initialize vault: vault.initializeVault(...)");
console.log("2. Set price oracle: vault.setPriceOracle(...)");
```

---

## Troubleshooting

### "Insufficient funds for gas"
- Check deployer account balance: `yarn account`
- Get testnet funds from faucet (for Base Sepolia)

### "Contract already deployed"
- Use `--reset` flag to redeploy
- Or delete `deployments/<network>/` folder

### "Verification failed"
- Wait longer before verification (increase timeout)
- Verify manually using provided command
- Check BaseScan API key in `.env`

### "Network not configured"
- Add network to `hardhat.config.ts`
- Ensure RPC URL is correct
- Check network name matches config

---

## Summary

**Deploy files:**
- Automate contract deployment
- Run in alphabetical order
- Support network-specific configuration
- Handle verification automatically
- Save deployment artifacts
- Can be run selectively with tags

**Our setup:**
- `00_deploy_your_contract.ts` - Example template
- `01_deploy_vault.ts` - S4D5Vault deployment for Base networks

**Commands:**
- `yarn deploy` - Deploy all
- `yarn deploy --network <network>` - Deploy to specific network
- `yarn deploy --tags <tag>` - Deploy specific contract
- `yarn deploy --reset` - Redeploy everything

---

For more information, see:
- Hardhat Deploy docs: https://github.com/wighawag/hardhat-deploy
- Scaffold-ETH 2 docs: https://docs.scaffoldeth.io/
