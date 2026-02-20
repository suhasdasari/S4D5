const { ethers } = require("ethers");
const fs = require("fs").promises;
const path = require("path");

/**
 * Wallet Manager for bot agents
 * Manages Ethereum wallets for autonomous payments on Base network
 */
class WalletManager {
  constructor(botName) {
    this.botName = botName;
    this.wallet = null;
    this.provider = null;
  }

  /**
   * Initialize wallet - either load existing or create new
   * @returns {Promise<string>} Wallet address
   */
  async initialize() {
    try {
      console.log(`[${this.botName}] Initializing wallet...`);
      
      // Setup provider for Base mainnet
      const rpcUrl = process.env.BASE_RPC_URL || "https://mainnet.base.org";
      this.provider = new ethers.JsonRpcProvider(rpcUrl);
      
      // Check if wallet already exists
      const configPath = path.join(__dirname, "../config/wallet.json");
      
      try {
        const configData = await fs.readFile(configPath, "utf8");
        const config = JSON.parse(configData);
        
        // Load existing wallet
        this.wallet = new ethers.Wallet(config.privateKey, this.provider);
        console.log(`[${this.botName}] Loaded existing wallet: ${this.wallet.address}`);
        
        return this.wallet.address;
      } catch (error) {
        // Wallet doesn't exist, create new one
        console.log(`[${this.botName}] Creating new wallet...`);
        this.wallet = ethers.Wallet.createRandom(this.provider);
        
        // Save wallet config
        await this.saveWalletConfig(this.wallet.privateKey, this.wallet.address);
        
        console.log(`[${this.botName}] New wallet created: ${this.wallet.address}`);
        console.log(`[${this.botName}] ⚠️  IMPORTANT: Fund this wallet to enable operations`);
        
        return this.wallet.address;
      }
    } catch (error) {
      console.error(`[${this.botName}] Wallet initialization failed:`, error);
      throw error;
    }
  }

  /**
   * Get wallet balance in ETH
   * @returns {Promise<string>} Balance in ETH
   */
  async getBalance() {
    try {
      if (!this.wallet) {
        throw new Error("Wallet not initialized");
      }
      
      const balance = await this.provider.getBalance(this.wallet.address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error(`[${this.botName}] Failed to get balance:`, error);
      throw error;
    }
  }

  /**
   * Get USDC balance
   * @returns {Promise<string>} Balance in USDC
   */
  async getUSDCBalance() {
    try {
      if (!this.wallet) {
        throw new Error("Wallet not initialized");
      }
      
      // USDC contract on Base mainnet
      const usdcAddress = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
      const usdcAbi = [
        "function balanceOf(address) view returns (uint256)",
        "function decimals() view returns (uint8)"
      ];
      
      const usdc = new ethers.Contract(usdcAddress, usdcAbi, this.provider);
      const balance = await usdc.balanceOf(this.wallet.address);
      
      return ethers.formatUnits(balance, 6); // USDC has 6 decimals
    } catch (error) {
      console.error(`[${this.botName}] Failed to get USDC balance:`, error);
      throw error;
    }
  }

  /**
   * Transfer USDC to another address
   * @param {string} to Recipient address
   * @param {string} amount Amount in USDC (e.g., "10.5")
   * @returns {Promise<string>} Transaction hash
   */
  async transferUSDC(to, amount) {
    try {
      if (!this.wallet) {
        throw new Error("Wallet not initialized");
      }
      
      console.log(`[${this.botName}] Transferring ${amount} USDC to ${to}...`);
      
      // USDC contract on Base mainnet
      const usdcAddress = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
      const usdcAbi = [
        "function transfer(address to, uint256 amount) returns (bool)"
      ];
      
      const usdc = new ethers.Contract(usdcAddress, usdcAbi, this.wallet);
      const amountWei = ethers.parseUnits(amount, 6); // USDC has 6 decimals
      
      const tx = await usdc.transfer(to, amountWei);
      console.log(`[${this.botName}] Transaction sent: ${tx.hash}`);
      
      await tx.wait();
      console.log(`[${this.botName}] Transfer confirmed: ${tx.hash}`);
      
      return tx.hash;
    } catch (error) {
      console.error(`[${this.botName}] Transfer failed:`, error);
      throw error;
    }
  }

  /**
   * Get wallet address
   * @returns {string} Wallet address
   */
  getAddress() {
    if (!this.wallet) {
      throw new Error("Wallet not initialized");
    }
    return this.wallet.address;
  }

  /**
   * Save wallet configuration to file
   * @param {string} privateKey Wallet private key
   * @param {string} address Wallet address
   */
  async saveWalletConfig(privateKey, address) {
    const configDir = path.join(__dirname, "../config");
    const configPath = path.join(configDir, "wallet.json");
    
    const config = {
      botName: this.botName,
      address: address,
      privateKey: privateKey,
      network: "base-mainnet",
      createdAt: new Date().toISOString(),
    };
    
    // Create config directory if it doesn't exist
    await fs.mkdir(configDir, { recursive: true });
    
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    console.log(`[${this.botName}] Wallet config saved to ${configPath}`);
  }
}

module.exports = WalletManager;
