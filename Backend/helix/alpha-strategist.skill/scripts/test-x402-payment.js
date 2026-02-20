#!/usr/bin/env node
/**
 * Test x402 micropayment between agents
 * 
 * Demonstrates: Alpha Strategist pays AuditOracle for risk analysis
 * 
 * Usage: node scripts/test-x402-payment.js
 */

const { KiteWalletManager } = require('../lib/kite-wallet');
const path = require('path');

async function main() {
  console.log('=== x402 Agent-to-Agent Payment Test ===\n');

  // Initialize Alpha Strategist wallet (payer)
  console.log('[1/4] Loading Alpha Strategist wallet...');
  const strategistWallet = new KiteWalletManager(
    path.join(__dirname, '../config/kite-wallet.json')
  );
  await strategistWallet.initialize();

  // Load AuditOracle wallet address (recipient)
  console.log('[2/4] Loading AuditOracle wallet address...');
  const auditOracleConfigPath = path.join(__dirname, '../../../auditoracle/config/kite-wallet.json');
  
  let auditOracleAddress;
  try {
    const auditOracleConfig = require(auditOracleConfigPath);
    auditOracleAddress = auditOracleConfig.address;
    console.log(`AuditOracle address: ${auditOracleAddress}`);
  } catch (error) {
    console.error('❌ AuditOracle wallet not found. Run init-kite-wallet.js in auditoracle first.');
    process.exit(1);
  }

  // Check balance
  console.log('[3/4] Checking balance...');
  const balance = await strategistWallet.getBalance();
  console.log(`Alpha Strategist balance: ${balance} KITE`);

  if (parseFloat(balance) < 0.01) {
    console.error('❌ Insufficient balance. Fund wallet at: https://faucet.gokite.ai');
    console.error(`   Address: ${strategistWallet.getInfo().address}`);
    process.exit(1);
  }

  // Send x402 payment
  console.log('[4/4] Sending x402 payment...');
  const paymentResult = await strategistWallet.sendPayment(
    auditOracleAddress,
    '0.001', // 0.001 KITE (~$0.01 equivalent)
    {
      service: 'risk-analysis',
      proposalId: 'PROP-TEST-001',
      agent: 'alpha-strategist',
      recipient: 'audit-oracle',
      description: 'Payment for trade risk analysis'
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
