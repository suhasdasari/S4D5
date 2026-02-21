#!/usr/bin/env node
/**
 * OpenClaw Tool: Check Wallet Balance
 * Checks Kite wallet balance
 */

const { KiteWalletManager } = require('../lib/kite-wallet');

async function checkBalance() {
  try {
    const kiteWallet = new KiteWalletManager();
    await kiteWallet.initialize();
    
    const balance = await kiteWallet.getBalance();
    const info = kiteWallet.getInfo();
    
    return {
      success: true,
      address: info.address,
      balance: balance,
      sufficientForProposal: parseFloat(balance) >= 0.001
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// If called directly
if (require.main === module) {
  checkBalance().then(result => {
    console.log(JSON.stringify(result, null, 2));
  });
}

module.exports = { checkBalance };
