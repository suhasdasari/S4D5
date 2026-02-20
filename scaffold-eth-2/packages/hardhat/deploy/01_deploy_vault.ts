import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { USDC_ADDRESSES } from "../constants/addresses";

const deployVault: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log("\n📦 Deploying S4D5Vault...");
  console.log("Network:", hre.network.name);
  console.log("Deployer:", deployer);

  // Get USDC address based on network
  let usdcAddress: string;
  if (hre.network.name === "base") {
    usdcAddress = USDC_ADDRESSES.base;
    console.log("Using Base Mainnet USDC:", usdcAddress);
  } else if (hre.network.name === "baseSepolia") {
    usdcAddress = USDC_ADDRESSES.baseSepolia;
    console.log("Using Base Sepolia USDC:", usdcAddress);
  } else {
    console.log("⚠️  Warning: Not deploying on Base network");
    console.log("Supported networks: base, baseSepolia");
    return;
  }

  // Deploy S4D5Vault
  const vault = await deploy("S4D5Vault", {
    from: deployer,
    args: [usdcAddress, "S4D5 Vault Shares", "S4D5-VAULT"],
    log: true,
    autoMine: true,
  });

  console.log("\n✅ S4D5Vault deployed!");
  console.log("Address:", vault.address);
  console.log("Transaction:", vault.transactionHash);
  
  // Verify on BaseScan (only on live networks)
  const isLiveNetwork = hre.network.name === "base" || hre.network.name === "baseSepolia";
  if (isLiveNetwork) {
    console.log("\n🔍 Waiting for block confirmations before verification...");
    // Wait for 5 block confirmations
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    try {
      await hre.run("verify:verify", {
        address: vault.address,
        constructorArguments: [
          usdcAddress,
          "S4D5 Vault Shares",
          "S4D5-VAULT",
        ],
      });
      console.log("✅ Contract verified on BaseScan!");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("Already Verified")) {
        console.log("✅ Contract already verified on BaseScan");
      } else {
        console.log("⚠️  Verification failed:", errorMessage);
        console.log("You can verify manually later with:");
        console.log(
          `npx hardhat verify --network ${hre.network.name} ${vault.address} ${usdcAddress} "S4D5 Vault Shares" "S4D5-VAULT"`,
        );
      }
    }
  }

  console.log("\n📝 Next steps:");
  console.log("1. CRITICAL: Initialize vault with seed deposit to prevent inflation attack");
  console.log("   - Approve USDC: usdc.approve(vaultAddress, 1000000000)");
  console.log("   - Initialize: vault.initializeVault(1000000000) // 1000 USDC");
  console.log("2. Set price oracle: vault.setPriceOracle(oracleAddress)");
  console.log("3. Whitelist DEX routers: vault.whitelistDexRouter(routerAddress)");
  console.log("4. Whitelist tokens: vault.whitelistToken(tokenAddress)");
  console.log("5. Authorize bot wallets: vault.authorizeBotWallet(botAddress)");
  console.log("6. Read security guide: contracts/S4D5Vault-SECURITY.md");
  console.log("\n⚠️  WARNING: Do NOT accept public deposits until vault is initialized!");
};


export default deployVault;
deployVault.tags = ["S4D5Vault"];
