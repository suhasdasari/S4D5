import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

/**
 * Chainlink Price Feed Addresses on Base
 * Source: https://docs.chain.link/data-feeds/price-feeds/addresses?network=base
 */
const CHAINLINK_FEEDS = {
  base: {
    // Base Mainnet
    ETH_USD: "0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70",
    BTC_USD: "0x64c911996D3c6aC71f9b455B1E8E7266BcbD848F",
    LINK_USD: "0x5f0423B1a6935dc5596e7A24d98532b67A0AeFd8",
    // Add more as needed
  },
  baseSepolia: {
    // Base Sepolia Testnet
    ETH_USD: "0x4aDC67696bA383F43DD60A9e78F2C97Fbbfc7cb1",
    // Note: Limited feeds on testnet, may need to use mainnet feeds or mock
  },
};

const deployChainlinkOracle: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // Only deploy on Base networks
  if (hre.network.name !== "base" && hre.network.name !== "baseSepolia") {
    console.log("⚠️  Skipping ChainlinkPriceOracle deployment (only for Base networks)");
    return;
  }

  console.log("\n📦 Deploying ChainlinkPriceOracle...");
  console.log("Network:", hre.network.name);
  console.log("Deployer:", deployer);

  // Deploy ChainlinkPriceOracle
  const oracle = await deploy("ChainlinkPriceOracle", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  console.log("\n✅ ChainlinkPriceOracle deployed!");
  console.log("Address:", oracle.address);
  console.log("Transaction:", oracle.transactionHash);

  // Verify on BaseScan (only on live networks)
  const isLiveNetwork = hre.network.name === "base" || hre.network.name === "baseSepolia";
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

  // Configure price feeds
  console.log("\n⚙️  Configuring Chainlink price feeds...");
  const oracleContract = await hre.ethers.getContractAt("ChainlinkPriceOracle", oracle.address);

  const feeds = hre.network.name === "base" ? CHAINLINK_FEEDS.base : CHAINLINK_FEEDS.baseSepolia;

  // WETH (18 decimals)
  const WETH_ADDRESS = "0x4200000000000000000000000000000000000006";

  try {
    console.log("Setting ETH/USD price feed...");
    const tx = await oracleContract.setPriceFeed(WETH_ADDRESS, feeds.ETH_USD, 18);
    await tx.wait();
    console.log("✅ ETH/USD price feed configured");
  } catch (error) {
    console.log("⚠️  Failed to set price feed:", error);
  }

  console.log("\n📝 Next steps:");
  console.log("1. Add more price feeds: oracle.setPriceFeed(token, feed, decimals)");
  console.log("2. Link to vault: vault.setPriceOracle(oracleAddress)");
  console.log("\n📊 Chainlink Price Feeds:");
  console.log("Base Mainnet: https://docs.chain.link/data-feeds/price-feeds/addresses?network=base");
  console.log("Base Sepolia: https://docs.chain.link/data-feeds/price-feeds/addresses?network=base-sepolia");
};

export default deployChainlinkOracle;
deployChainlinkOracle.tags = ["ChainlinkPriceOracle"];
