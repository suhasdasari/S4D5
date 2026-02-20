#!/usr/bin/env node
/**
 * CDP Wallet Initialization Script for ExecutionHand
 * Initializes the bot's CDP wallet on startup
 * Usage: node init-wallet.js
 */

const CDPWalletManager = require('../lib/cdp-wallet');
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

const BOT_NAME = 'ExecutionHand';

async function initializeWallet() {
  try {
    console.log(`[${BOT_NAME}] Starting CDP wallet initialization...`);
    
    // Check required environment variables
    if (!process.env.CDP_API_KEY_NAME || !process.env.CDP_API_KEY_PRIVATE_KEY) {
      throw new Error('Missing required environment variables: CDP_API_KEY_NAME, CDP_API_KEY_PRIVATE_KEY');
    }
    
    // Create wallet manager instance
    const walletManager = new CDPWalletManager(BOT_NAME);
    
    // Initialize wallet
    const address = await walletManager.initialize();
    
    console.log(`[${BOT_NAME}] ✓ CDP wallet initialized successfully`);
    console.log(`[${BOT_NAME}] Wallet address: ${address}`);
    console.log(`[${BOT_NAME}] Network: ${process.env.NETWORK_ID || 'base-mainnet'}`);
    
    // Get initial balance
    try {
      const balance = await walletManager.getBalance();
      console.log(`[${BOT_NAME}] Current USDC balance: ${balance}`);
    } catch (error) {
      console.log(`[${BOT_NAME}] Note: Could not fetch balance (wallet may need funding)`);
    }
    
    console.log(`[${BOT_NAME}] Wallet configuration saved to config/wallet.json`);
    
    process.exit(0);
  } catch (error) {
    console.error(`[${BOT_NAME}] ✗ Wallet initialization failed:`, error.message);
    console.error(`[${BOT_NAME}] Stack trace:`, error.stack);
    process.exit(1);
  }
}

// Run initialization
initializeWallet();
