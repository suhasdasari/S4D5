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
   * Convert base64 private key to PEM format
   * @param {string} base64Key Base64 encoded private key
   * @returns {string} PEM formatted private key
   */
  base64ToPem(base64Key) {
    // EC private keys are 32 bytes, but the base64 might include additional data
    // We'll wrap it in PEM format for Ed25519
    const pemHeader = "-----BEGIN EC PRIVATE KEY-----";
    const pemFooter = "-----END EC PRIVATE KEY-----";
    
    // Split base64 into 64-character lines
    const lines = base64Key.match(/.{1,64}/g) || [];
    return `${pemHeader}\n${lines.join('\n')}\n${pemFooter}`;
  }

  /**
   * Initialize CDP wallet using Coinbase SDK
   * @returns {Promise<string>} Wallet address
   */
  async initialize() {
    try {
      console.log(`[${this.botName}] Initializing CDP wallet...`);
      
      let apiKeyName = process.env.CDP_API_KEY_NAME;
      let privateKey = process.env.CDP_API_KEY_PRIVATE_KEY;
      
      // Check if privateKey is base64 (doesn't start with -----)
      if (!privateKey.startsWith('-----')) {
        console.log(`[${this.botName}] Converting base64 private key to PEM format...`);
        privateKey = this.base64ToPem(privateKey);
      }
      
      // If apiKeyName is just a UUID, convert to proper format
      if (!apiKeyName.includes('/')) {
        // Assume it's in format: organizations/{org}/apiKeys/{keyId}
        // We'll use the UUID as the keyId
        apiKeyName = `organizations/${process.env.CDP_ORG_ID || 'default'}/apiKeys/${apiKeyName}`;
        console.log(`[${this.botName}] Using API key name: ${apiKeyName}`);
      }
      
      // Configure Coinbase SDK
      Coinbase.configure({
        apiKeyName: apiKeyName,
        privateKey: privateKey,
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
