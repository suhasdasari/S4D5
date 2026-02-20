import * as dotenv from "dotenv";
dotenv.config();
import { ethers } from "hardhat";
import { S4D5Vault } from "../typechain-types";
import { Wallet } from "ethers";
import password from "@inquirer/password";

/**
 * Initialize S4D5Vault with seed deposit
 * 
 * Usage:
 *   yarn hardhat run scripts/initialize-vault.ts --network base
 * 
 * Prerequisites:
 *   - Vault must be deployed
 *   - Deployer must have at least 10 USDC
 */
async function main() {
  console.log("\n🚀 Initializing S4D5Vault...\n");

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
  const vault = (await ethers.getContractAt("S4D5Vault", "0xed8E9E422D4681E177423BCe0Ebaf03BF413a83B", signer)) as S4D5Vault;
  const vaultAddress = await vault.getAddress();
  console.log("Vault address:", vaultAddress);

  // Get USDC contract
  const network = await ethers.provider.getNetwork();
  let usdcAddress: string;
  
  if (network.chainId === 84532n) {
    // Base Sepolia
    usdcAddress = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
  } else if (network.chainId === 8453n) {
    // Base Mainnet
    usdcAddress = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
  } else {
    throw new Error(`Unsupported network: ${network.chainId}`);
  }

  const usdc = await ethers.getContractAt("IERC20", usdcAddress, signer);
  console.log("USDC address:", usdcAddress);

  // Check if vault is already initialized
  const totalSupply = await vault.totalSupply();
  if (totalSupply > 0n) {
    console.log("\n⚠️  Vault is already initialized!");
    console.log("Total supply:", ethers.formatEther(totalSupply), "shares");
    return;
  }

  // Check USDC balance
  const balance = await usdc.balanceOf(signerAddress);
  console.log("\nYour USDC balance:", ethers.formatUnits(balance, 6), "USDC");

  const initAmount = ethers.parseUnits("10", 6); // 10 USDC
  if (balance < initAmount) {
    throw new Error(`Insufficient USDC balance. Need 10 USDC, have ${ethers.formatUnits(balance, 6)}`);
  }

  // Approve USDC
  console.log("\n📝 Approving USDC...");
  const approveTx = await usdc.approve(vaultAddress, initAmount);
  await approveTx.wait();
  console.log("✅ USDC approved");

  // Initialize vault
  console.log("\n🔐 Initializing vault with 10 USDC...");
  const initTx = await vault.initializeVault(initAmount);
  const receipt = await initTx.wait();
  console.log("✅ Vault initialized!");
  console.log("Transaction hash:", receipt?.hash);

  // Verify initialization
  const newTotalSupply = await vault.totalSupply();
  const ownerShares = await vault.balanceOf(signerAddress);
  const deadShares = await vault.balanceOf("0x000000000000000000000000000000000000dEaD");

  console.log("\n📊 Vault Status:");
  console.log("Total supply:", ethers.formatEther(newTotalSupply), "shares");
  console.log("Your shares:", ethers.formatEther(ownerShares), "shares");
  console.log("Dead address shares:", ethers.formatEther(deadShares), "shares (locked forever)");
  console.log("\n✅ Vault is ready for deposits!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
