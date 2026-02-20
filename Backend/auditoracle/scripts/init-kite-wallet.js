#!/usr/bin/env node
/**
 * Initialize Kite AI wallet for Alpha Strategist agent
 * 
 * Usage: node scripts/init-kite-wallet.js
 */

const { KiteWalletManager } = require('../lib/kite-wallet');

async function main() {
  console.log('=== Alpha Strategist - Kite Wallet Initialization ===\n');

  const walletManager = new KiteWalletManager();
  await walletManager.initialize();

  const info = walletManager.getInfo();
  const balance = await walletManager.getBalance();

  console.log('\n=== Wallet Info ===');
  console.log(`Address: ${info.address}`);
  console.log(`Balance: ${balance} KITE`);
  console.log(`Chain ID: ${info.chainId}`);
  console.log(`Explorer: ${info.explorerUrl}`);
  console.log('\n=== Next Steps ===');
  console.log(`1. Fund this wallet at: https://faucet.gokite.ai`);
  console.log(`2. Paste address: ${info.address}`);
  console.log(`3. Wait for testnet tokens to arrive`);
  console.log(`4. Run this script again to verify balance\n`);
}

main().catch(console.error);
