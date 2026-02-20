#!/usr/bin/env node
/**
 * Initialize Kite AI wallet for AuditOracle agent
 * REUSES existing Base wallet (same private key, different chain)
 * 
 * Usage: node scripts/init-kite-wallet.js
 */

const { KiteWalletManager } = require('../lib/kite-wallet');

async function main() {
  console.log('=== AuditOracle - Kite Wallet Initialization ===\n');
  console.log('ℹ️  Using existing Base wallet for Kite chain (multi-chain identity)\n');

  const walletManager = new KiteWalletManager();
  await walletManager.initialize();

  const info = walletManager.getInfo();
  const balance = await walletManager.getBalance();

  console.log('\n=== Wallet Info ===');
  console.log(`Address: ${info.address}`);
  console.log(`Balance: ${balance} KITE`);
  console.log(`Chain ID: ${info.chainId}`);
  console.log(`Explorer: ${info.explorerUrl}`);
  
  if (parseFloat(balance) === 0) {
    console.log('\n=== Next Steps ===');
    console.log(`1. Fund this wallet at: https://faucet.gokite.ai`);
    console.log(`2. Paste address: ${info.address}`);
    console.log(`3. Wait for testnet tokens to arrive`);
    console.log(`4. Run this script again to verify balance\n`);
  } else {
    console.log('\n✅ Wallet funded! Ready for x402 payments\n');
  }
}

main().catch(console.error);
