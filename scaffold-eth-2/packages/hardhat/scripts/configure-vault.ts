import * as dotenv from "dotenv";
dotenv.config();
import { ethers } from "hardhat";
import { Wallet } from "ethers";
import password from "@inquirer/password";

/**
 * Configure S4D5Vault after initialization
 * 
 * Usage:
 *   yarn hardhat run scripts/configure-vault.ts --network base
 * 
 * This script:
 *   - Sets price oracle
 *   - Whitelists tokens (WETH, etc.)
 *   - Whitelists DEX routers
 *   - Authorizes bot wallets
 */
async function main() {
  console.log("\n⚙️  Configuring S4D5Vault...\n");

  // Get signer from encrypted private key
  const encryptedKey = process.env.DEPLOYER_PRIVATE_KEY_ENCRYPTED;
  
  if (!encryptedKey) {
    console.log("🚫️ You don't have a deployer account. Run `yarn account:import` first");
    return;
  }

  const pass = await password({ message: "Enter your password to decrypt the private key:" });
  let wallet: Wallet;
  try {
    wallet = (await Wallet.fromEncryptedJson(encryptedKey, pass)) as Wallet;
  } catch {
    console.log("❌ Failed to decrypt private key. Wrong password?");
    return;
  }

  // Connect wallet to provider
  const signer = wallet.connect(ethers.provider);
  const signerAddress = await signer.getAddress();
  console.log("Signer address:", signerAddress);

  // Get deployed contracts
  const vaultAddress = "0xed8E9E422D4681E177423BCe0Ebaf03BF413a83B";
  const vault = await ethers.getContractAt("S4D5Vault", vaultAddress, signer);
  console.log("Vault address:", vaultAddress);

  // Check if vault is initialized
  const totalSupply = await vault.totalSupply();
  if (totalSupply === 0n) {
    throw new Error("Vault not initialized! Run initialize-vault.ts first.");
  }

  // Get network
  const network = await ethers.provider.getNetwork();
  console.log("Network:", network.name, `(${network.chainId})`);

  // 1. Set Price Oracle (Chainlink)
  const oracleAddress = "0x15E03b7942F6976bE340EdAc738ECF494f154Af5";
  console.log("\n📊 Setting Chainlink price oracle...");
  console.log("Oracle address:", oracleAddress);
  
  const currentOracle = await vault.priceOracle();
  if (currentOracle === ethers.ZeroAddress) {
    const tx = await vault.setPriceOracle(oracleAddress);
    await tx.wait();
    console.log("✅ Chainlink price oracle set");
  } else {
    console.log("⚠️  Price oracle already set:", currentOracle);
  }

  // 2. Whitelist Tokens
  console.log("\n🪙 Whitelisting tokens...");
  
  const tokens = [
    {
      name: "WETH",
      address: "0x4200000000000000000000000000000000000006", // Base WETH
    },
    // Add more tokens as needed
  ];

  for (const token of tokens) {
    const isWhitelisted = await vault.isTokenWhitelisted(token.address);
    if (!isWhitelisted) {
      console.log(`Whitelisting ${token.name}...`);
      const tx = await vault.whitelistToken(token.address);
      await tx.wait();
      console.log(`✅ ${token.name} whitelisted`);
    } else {
      console.log(`⚠️  ${token.name} already whitelisted`);
    }
  }

  // 3. Whitelist DEX Routers
  console.log("\n🔄 Whitelisting DEX routers...");
  
  // Note: Add actual DEX router addresses for Base mainnet
  const routers: Array<{ name: string; address: string }> = [
    // {
    //   name: "Uniswap V3",
    //   address: "0x...", // Add actual address
    // },
  ];

  if (routers.length === 0) {
    console.log("⚠️  No DEX routers configured. Add them manually or update this script.");
  }

  for (const router of routers) {
    const isWhitelisted = await vault.isDexRouterWhitelisted(router.address);
    if (!isWhitelisted) {
      console.log(`Whitelisting ${router.name}...`);
      const tx = await vault.whitelistDexRouter(router.address);
      await tx.wait();
      console.log(`✅ ${router.name} whitelisted`);
    } else {
      console.log(`⚠️  ${router.name} already whitelisted`);
    }
  }

  // 4. Authorize Bot Wallets
  console.log("\n🤖 Authorizing bot wallets...");
  
  // Note: Replace with actual CDP wallet addresses after bot setup
  const bots: Array<{ name: string; address: string }> = [
    // {
    //   name: "Alpha Strategist",
    //   address: "0x...", // Add actual CDP wallet address
    // },
    // {
    //   name: "AuditOracle",
    //   address: "0x...",
    // },
    // {
    //   name: "ExecutionHand",
    //   address: "0x...",
    // },
  ];

  if (bots.length === 0) {
    console.log("⚠️  No bot wallets configured. Add them after CDP wallet setup.");
  }

  for (const bot of bots) {
    const isAuthorized = await vault.isBotAuthorized(bot.address);
    if (!isAuthorized) {
      console.log(`Authorizing ${bot.name}...`);
      const tx = await vault.authorizeBotWallet(bot.address);
      await tx.wait();
      console.log(`✅ ${bot.name} authorized`);
    } else {
      console.log(`⚠️  ${bot.name} already authorized`);
    }
  }

  // Summary
  console.log("\n📋 Configuration Summary:");
  console.log("Vault address:", vaultAddress);
  console.log("Price oracle:", await vault.priceOracle());
  console.log("Total supply:", ethers.formatEther(await vault.totalSupply()), "shares");
  console.log("\n✅ Vault configuration complete!");
  console.log("\n📝 Next steps:");
  console.log("1. Update bot wallet addresses in this script after CDP setup");
  console.log("2. Add DEX router addresses for trading");
  console.log("3. Test deposit/withdraw flows");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
