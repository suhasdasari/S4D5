#!/usr/bin/env node
/**
 * Test x402 micropayment between agents
 * 
 * Demonstrates: AuditOracle pays ExecutionHand for trade execution
 * 
 * Usage: node scripts/test-x402-payment.js
 */

const { KiteWalletManager } = require('../lib/kite-wallet');
const path = require('path');

async function main() {
  console.log('=== x402 Agent-to-Agent Payment Test ===\n');

  // Initialize AuditOracle wallet (payer)
  console.log('[1/4] Loading AuditOracle wallet...');
  const auditOracleWallet = new KiteWalletManager(
    path.join(__dirname, '../config/wallet.json')
  );
  await auditOracleWallet.initialize();

  // ExecutionHand wallet address (recipient)
  console.log('[2/4] Loading ExecutionHand wallet address...');
  const executionHandAddress = '0x7a41a15474bC6F534Be1D5F898A44C533De68A91';
  console.log(`ExecutionHand address: ${executionHandAddress}`);

  // Check balance
  console.log('[3/4] Checking balance...');
  const balance = await auditOracleWallet.getBalance();
  console.log(`AuditOracle balance: ${balance} KITE`);

  if (parseFloat(balance) < 0.01) {
    console.error('❌ Insufficient balance. Fund wallet at: https://faucet.gokite.ai');
    console.error(`   Address: ${auditOracleWallet.getInfo().address}`);
    process.exit(1);
  }

  // Send x402 payment
  console.log('[4/4] Sending x402 payment...');
  const paymentResult = await auditOracleWallet.sendPayment(
    executionHandAddress,
    '0.001', // 0.001 KITE (~$0.01 equivalent)
    {
      service: 'trade-execution',
      proposalId: 'PROP-TEST-002',
      agent: 'audit-oracle',
      recipient: 'execution-hand',
      description: 'Payment for executing approved trade'
    }
  );

  console.log('\n=== Payment Result ===');
  if (paymentResult.success) {
    console.log('✅ Payment successful!');
    console.log(`   Transaction: ${paymentResult.txHash}`);
    console.log(`   Explorer: ${paymentResult.explorerUrl}`);
    console.log(`   Block: ${paymentResult.blockNumber}`);
    console.log(`   Gas Used: ${paymentResult.gasUsed}`);
    console.log(`   Amount: ${paymentResult.amount} KITE`);
  } else {
    console.log('❌ Payment failed!');
    console.log(`   Error: ${paymentResult.error}`);
  }

  console.log('\n=== Next Steps ===');
  console.log('1. View transaction on Kite Explorer');
  console.log('2. Integrate this into agent workflow');
  console.log('3. Add payment logging to frontend\n');
}

main().catch(console.error);
