#!/usr/bin/env node
/**
 * Wallet Initialization Script for ExecutionHand
 * Initializes the bot's Ethereum wallet on Base network
 * Usage: node init-wallet.js
 */

const WalletManager = require('../lib/wallet');
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '..', '.env') });

const BOT_NAME = 'ExecutionHand';

async function initializeWallet() {
  try {
    console.log(`[${BOT_NAME}] Starting wallet initialization...`);
    
    // Create wallet manager instance
    const walletManager = new WalletManager(BOT_NAME);
    
    // Initialize wallet
    const address = await walletManager.initialize();
    
    console.log(`[${BOT_NAME}] ✓ Wallet initialized successfully`);
    console.log(`[${BOT_NAME}] Address: ${address}`);
    console.log(`[${BOT_NAME}] Network: Base Mainnet`);
    
    // Get balances
    try {
      const ethBalance = await walletManager.getBalance();
      const usdcBalance = await walletManager.getUSDCBalance();
      console.log(`[${BOT_NAME}] ETH Balance: ${ethBalance}`);
      console.log(`[${BOT_NAME}] USDC Balance: ${usdcBalance}`);
    } catch (error) {
      console.log(`[${BOT_NAME}] Note: Could not fetch balances (wallet may need funding)`);
    }
    
    console.log(`[${BOT_NAME}] Wallet configuration saved to config/wallet.json`);
    console.log(`\n⚠️  NEXT STEPS:`);
    console.log(`1. Save this address: ${address}`);
    console.log(`2. Fund the wallet from your vault contract`);
    console.log(`3. Verify balance with: npm run check-balance\n`);
    
    process.exit(0);
  } catch (error) {
    console.error(`[${BOT_NAME}] ✗ Wallet initialization failed:`, error.message);
    process.exit(1);
  }
}

// Run initialization
initializeWallet();
