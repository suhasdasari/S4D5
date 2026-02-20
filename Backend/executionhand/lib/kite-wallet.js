/**
 * Kite AI Wallet Manager for Agent Payments
 * 
 * Handles x402 micropayments between AI agents on Kite testnet
 * REUSES existing Base wallet (same private key, different chain)
 */

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Kite AI Testnet Configuration
const KITE_TESTNET_RPC = process.env.KITE_RPC || 'https://rpc-testnet.gokite.ai/';
const KITE_CHAIN_ID = 2368;

class KiteWalletManager {
  constructor(baseWalletPath = path.join(__dirname, '../config/wallet.json')) {
    this.baseWalletPath = baseWalletPath;
    this.provider = new ethers.JsonRpcProvider(KITE_TESTNET_RPC, KITE_CHAIN_ID);
    this.wallet = null;
    this.config = null;
  }

  /**
   * Initialize Kite wallet using existing Base wallet private key
   */
  async initialize() {
    try {
      // Load existing Base wallet
      if (!fs.existsSync(this.baseWalletPath)) {
        throw new Error(`Base wallet not found at ${this.baseWalletPath}. Run init-wallet.js first.`);
      }

      this.config = JSON.parse(fs.readFileSync(this.baseWalletPath, 'utf8'));
      
      // Create Kite wallet using same private key
      this.wallet = new ethers.Wallet(this.config.privateKey, this.provider);
      
      console.log(`[Kite] Loaded wallet: ${this.wallet.address}`);
      console.log(`[Kite] ✅ Same address as Base wallet - multi-chain identity!`);

      // Check balance
      const balance = await this.getBalance();
      console.log(`[Kite] Balance: ${balance} KITE`);

      if (parseFloat(balance) === 0) {
        console.log(`[Kite] ⚠️  Fund this wallet at: https://faucet.gokite.ai`);
        console.log(`[Kite] Address: ${this.wallet.address}`);
      }

      return this.wallet;
    } catch (error) {
      console.error('[Kite] Wallet initialization failed:', error.message);
      throw error;
    }
  }

  /**
   * Get wallet balance in KITE tokens
   */
  async getBalance() {
    if (!this.wallet) throw new Error('Wallet not initialized');
    const balance = await this.provider.getBalance(this.wallet.address);
    return ethers.formatEther(balance);
  }

  /**
   * Send x402 micropayment to another agent
   * 
   * @param {string} toAddress - Recipient agent's Kite wallet address
   * @param {string} amount - Amount in KITE tokens (e.g., "0.01")
   * @param {object} metadata - Payment metadata (service, proposalId, etc.)
   * @returns {object} Transaction receipt with payment details
   */
  async sendPayment(toAddress, amount, metadata = {}) {
    if (!this.wallet) throw new Error('Wallet not initialized');

    try {
      console.log(`[Kite] Sending ${amount} KITE to ${toAddress}`);
      console.log(`[Kite] Metadata:`, metadata);

      // Convert amount to wei
      const amountWei = ethers.parseEther(amount);

      // Check balance
      const balance = await this.provider.getBalance(this.wallet.address);
      if (balance < amountWei) {
        throw new Error(`Insufficient balance. Have: ${ethers.formatEther(balance)} KITE, Need: ${amount} KITE`);
      }

      // Send transaction
      const tx = await this.wallet.sendTransaction({
        to: toAddress,
        value: amountWei,
        // Encode metadata in transaction data (optional)
        data: metadata ? ethers.toUtf8Bytes(JSON.stringify(metadata)) : '0x'
      });

      console.log(`[Kite] Transaction sent: ${tx.hash}`);
      console.log(`[Kite] View on explorer: https://testnet.kitescan.ai/tx/${tx.hash}`);

      // Wait for confirmation
      const receipt = await tx.wait();
      console.log(`[Kite] Payment confirmed in block ${receipt.blockNumber}`);

      return {
        success: true,
        txHash: receipt.hash,
        from: this.wallet.address,
        to: toAddress,
        amount,
        amountWei: amountWei.toString(),
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        explorerUrl: `https://testnet.kitescan.ai/tx/${receipt.hash}`,
        metadata,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('[Kite] Payment failed:', error.message);
      return {
        success: false,
        error: error.message,
        from: this.wallet.address,
        to: toAddress,
        amount,
        metadata,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get wallet info
   */
  getInfo() {
    if (!this.wallet) throw new Error('Wallet not initialized');
    return {
      address: this.wallet.address,
      chainId: KITE_CHAIN_ID,
      rpc: KITE_TESTNET_RPC,
      explorerUrl: `https://testnet.kitescan.ai/address/${this.wallet.address}`
    };
  }
}

module.exports = { KiteWalletManager };
