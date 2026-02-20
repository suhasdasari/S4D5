const { Coinbase, Wallet } = require("@coinbase/coinbase-sdk");
const fs = require("fs").promises;
const path = require("path");

/**
 * CDP Wallet Manager for bot agents
 * Manages Coinbase Developer Platform wallets for autonomous payments
 */
class CDPWalletManager {
  constructor(botName) {
    this.botName = botName;
    this.wallet = null;
    this.coinbase = null;
  }

  /**
   * Initialize CDP wallet using Coinbase SDK
   * @returns {Promise<string>} Wallet address
   */
  async initialize() {
    try {
      console.log(`[${this.botName}] Initializing CDP wallet...`);
      
      // Configure Coinbase SDK
      Coinbase.configure({
        apiKeyName: process.env.CDP_API_KEY_NAME,
        privateKey: process.env.CDP_API_KEY_PRIVATE_KEY,
      });
      
      // Create wallet
      this.wallet = await Wallet.create({
        networkId: process.env.NETWORK_ID || "base-mainnet",
      });
      
      const address = await this.wallet.getDefaultAddress();
      
      console.log(`[${this.botName}] CDP wallet created: ${address}`);
      
      // Store wallet address in config
      await this.saveWalletConfig(address.getId());
      
      return address.getId();
    } catch (error) {
      console.error(`[${this.botName}] CDP wallet initialization failed:`, error);
      throw error;
    }
  }

  /**
   * Get wallet balance
   * @returns {Promise<string>} Balance in USDC
   */
  async getBalance() {
    try {
      const balance = await this.wallet.getBalance("usdc");
      return balance.toString();
    } catch (error) {
      console.error(`[${this.botName}] Failed to get balance:`, error);
      throw error;
    }
  }

  /**
   * Transfer USDC to another address
   * @param {string} to Recipient address
   * @param {string} amount Amount in USDC (e.g., "0.001")
   * @returns {Promise<string>} Transaction hash
   */
  async transfer(to, amount) {
    try {
      console.log(`[${this.botName}] Transferring ${amount} USDC to ${to}...`);
      
      const transfer = await this.wallet.createTransfer({
        amount: amount,
        assetId: "usdc",
        destination: to,
      });
      
      await transfer.wait();
      const txHash = transfer.getTransactionHash();
      
      console.log(`[${this.botName}] Transfer successful: ${txHash}`);
      
      return txHash;
    } catch (error) {
      console.error(`[${this.botName}] Transfer failed:`, error);
      throw error;
    }
  }

  /**
   * Get wallet address
   * @returns {Promise<string>} Wallet address
   */
  async getAddress() {
    try {
      if (!this.wallet) {
        throw new Error("Wallet not initialized");
      }
      const address = await this.wallet.getDefaultAddress();
      return address.getId();
    } catch (error) {
      console.error(`[${this.botName}] Failed to get address:`, error);
      throw error;
    }
  }

  /**
   * Save wallet configuration to file
   * @param {string} address Wallet address
   */
  async saveWalletConfig(address) {
    const configDir = path.join(__dirname, "../config");
    const configPath = path.join(configDir, "wallet.json");
    
    const config = {
      botName: this.botName,
      address: address,
      network: process.env.NETWORK_ID || "base-mainnet",
      createdAt: new Date().toISOString(),
    };
    
    // Create config directory if it doesn't exist
    try {
      await fs.mkdir(configDir, { recursive: true });
    } catch (error) {
      // Directory might already exist, ignore error
    }
    
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    console.log(`[${this.botName}] Wallet config saved to ${configPath}`);
  }
}

module.exports = CDPWalletManager;
