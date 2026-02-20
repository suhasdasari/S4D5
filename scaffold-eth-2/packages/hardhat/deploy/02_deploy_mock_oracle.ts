import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployMockOracle: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // Only deploy on testnets
  if (hre.network.name !== "baseSepolia" && hre.network.name !== "localhost") {
    console.log("⚠️  Skipping MockPriceOracle deployment (only for testnets)");
    return;
  }

  console.log("\n📦 Deploying MockPriceOracle...");
  console.log("Network:", hre.network.name);
  console.log("Deployer:", deployer);

  // Deploy MockPriceOracle
  const oracle = await deploy("MockPriceOracle", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  console.log("\n✅ MockPriceOracle deployed!");
  console.log("Address:", oracle.address);
  console.log("Transaction:", oracle.transactionHash);

  // Verify on BaseScan (only on live networks)
  const isLiveNetwork = hre.network.name === "baseSepolia";
  if (isLiveNetwork) {
    console.log("\n🔍 Waiting for block confirmations before verification...");
    await new Promise(resolve => setTimeout(resolve, 30000));

    try {
      await hre.run("verify:verify", {
        address: oracle.address,
        constructorArguments: [],
      });
      console.log("✅ Contract verified on BaseScan!");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("Already Verified")) {
        console.log("✅ Contract already verified on BaseScan");
      } else {
        console.log("⚠️  Verification failed:", errorMessage);
        console.log("You can verify manually later with:");
        console.log(`npx hardhat verify --network ${hre.network.name} ${oracle.address}`);
      }
    }
  }

  console.log("\n📝 Next steps:");
  console.log("1. Set prices for tokens: oracle.setPrice(tokenAddress, priceInUSDC)");
  console.log("2. Link to vault: vault.setPriceOracle(oracleAddress)");
  console.log("\n⚠️  WARNING: This is a MOCK oracle for TESTING ONLY!");
  console.log("   Use Chainlink Price Feeds for production!");
};

export default deployMockOracle;
deployMockOracle.tags = ["MockPriceOracle"];
