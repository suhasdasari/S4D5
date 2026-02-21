/**
 * Payment Manager
 * Manages x402 micropayments on Kite AI
 * Handles balance checking, payment execution, and error handling
 */

const { KiteWalletManager } = require('./kite-wallet');
const { execSync } = require('child_process');
const path = require('path');

class PaymentManager {
  constructor(nerveCordPath, options = {}) {
    this.nerveCordPath = nerveCordPath;
    this.wallet = null;
    this.minBalance = options.minBalance || 0.01; // Minimum 0.01 KITE
    this.paymentAmount = options.paymentAmount || '0.001'; // 0.001 KITE per proposal
    this.auditOracleAddress = options.auditOracleAddress || '0xF3bbD5682e671CdcDC42f52bDdecCB6a35D53aE1';
  }

  /**
   * Initialize payment manager
   */
  async initialize() {
    try {
      this.wallet = new KiteWalletManager();
      await this.wallet.initialize();
      console.log('[Payment] ✓ Wallet initialized');
      
      // Check initial balance
      const balance = await this.checkBalance();
      console.log(`[Payment] Current balance: ${balance} KITE`);
      
      if (parseFloat(balance) < this.minBalance) {
        console.warn(`[Payment] ⚠️  Balance below minimum (${this.minBalance} KITE)`);
      }
      
    } catch (error) {
      console.error(`[Payment] ✗ Initialization failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check wallet balance
   */
  async checkBalance() {
    try {
      const balance = await this.wallet.getBalance();
      return balance;
    } catch (error) {
      console.error(`[Payment] Error checking balance: ${error.message}`);
      throw error;
    }
  }

  /**
   * Verify sufficient balance before payment
   */
  async verifyBalance() {
    try {
      const balance = await this.checkBalance();
      const balanceNum = parseFloat(balance);
      const paymentNum = parseFloat(this.paymentAmount);
      
      if (balanceNum < paymentNum) {
        return {
          sufficient: false,
          balance: balanceNum,
          required: paymentNum,
          message: `Insufficient balance: ${balanceNum} KITE (need ${paymentNum} KITE)`
        };
      }
      
      if (balanceNum < this.minBalance) {
        console.warn(`[Payment] ⚠️  Balance low: ${balanceNum} KITE (min: ${this.minBalance} KITE)`);
      }
      
      return {
        sufficient: true,
        balance: balanceNum,
        required: paymentNum
      };
      
    } catch (error) {
      console.error(`[Payment] Error verifying balance: ${error.message}`);
      return {
        sufficient: false,
        error: error.message
      };
    }
  }

  /**
   * Send x402 payment for proposal
   */
  async sendPayment(proposalId, proposalData) {
    try {
      console.log(`[Payment] Sending payment for ${proposalId}...`);
      
      // Verify balance first
      const verification = await this.verifyBalance();
      
      if (!verification.sufficient) {
        console.error(`[Payment] ✗ ${verification.message || verification.error}`);
        return {
          success: false,
          error: verification.message || verification.error,
          proposalId
        };
      }
      
      // Format payment metadata
      const metadata = this.formatMetadata(proposalId, proposalData);
      
      // Execute payment
      const payment = await this.wallet.sendPayment(
        this.auditOracleAddress,
        this.paymentAmount,
        metadata
      );
      
      if (payment.success) {
        console.log(`[Payment] ✓ Sent ${this.paymentAmount} KITE: ${payment.txHash.substring(0, 10)}...`);
        
        // Log to Nerve-Cord
        await this.logPayment(proposalId, payment.txHash);
        
        return {
          success: true,
          proposalId,
          txHash: payment.txHash,
          amount: this.paymentAmount,
          recipient: this.auditOracleAddress,
          timestamp: Date.now()
        };
        
      } else {
        console.error(`[Payment] ✗ Failed: ${payment.error}`);
        return {
          success: false,
          proposalId,
          error: payment.error
        };
      }
      
    } catch (error) {
      console.error(`[Payment] ✗ Exception: ${error.message}`);
      
      // Check if it's an RPC failure
      if (error.message.includes('RPC') || error.message.includes('network')) {
        console.error(`[Payment] Blockchain RPC failure detected`);
      }
      
      return {
        success: false,
        proposalId,
        error: error.message
      };
    }
  }

  /**
   * Format payment metadata
   */
  formatMetadata(proposalId, proposalData) {
    return {
      service: 'risk-analysis',
      proposalId,
      agent: 'alpha-strategist',
      recipient: 'audit-oracle',
      asset: proposalData.asset,
      direction: proposalData.direction,
      confidence: proposalData.confidence,
      description: `Payment for ${proposalData.asset} ${proposalData.direction} analysis`
    };
  }

  /**
   * Log payment to Nerve-Cord
   */
  async logPayment(proposalId, txHash) {
    try {
      const shortHash = txHash.substring(0, 10);
      execSync(
        `npm run log "💰 PAID: ${proposalId} → ${this.paymentAmount} KITE → AuditOracle (tx: ${shortHash}...)" "alpha-strategist,payment"`,
        {
          cwd: this.nerveCordPath,
          stdio: 'pipe',
          timeout: 5000
        }
      );
    } catch (error) {
      console.error(`[Payment] Error logging payment: ${error.message}`);
    }
  }

  /**
   * Get wallet address
   */
  getAddress() {
    return this.wallet ? this.wallet.address : null;
  }

  /**
   * Get payment amount
   */
  getPaymentAmount() {
    return this.paymentAmount;
  }

  /**
   * Get recipient address
   */
  getRecipientAddress() {
    return this.auditOracleAddress;
  }
}

module.exports = { PaymentManager };
