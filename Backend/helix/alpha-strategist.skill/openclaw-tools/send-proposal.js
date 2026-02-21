#!/usr/bin/env node
/**
 * OpenClaw Tool: Send Proposal
 * Sends trading proposal to AuditOracle via Nerve-Cord with x402 payment
 */

const { execSync } = require('child_process');
const path = require('path');
const { KiteWalletManager } = require('../lib/kite-wallet');

const NERVE_CORD_PATH = process.env.NERVE_CORD_PATH || path.join(__dirname, '..', '..', '..', 'nerve-cord');
const AUDIT_ORACLE_ADDRESS = process.env.AUDIT_ORACLE_ADDRESS || '0xF3bbD5682e671CdcDC42f52bDdecCB6a35D53aE1';

async function sendProposal(proposalData) {
  try {
    const { subject, message } = proposalData;
    
    // 1. Send proposal via Nerve-Cord
    execSync(`npm run send audit-oracle "${subject}" "${message}"`, {
      cwd: NERVE_CORD_PATH,
      stdio: 'inherit'
    });
    
    // 2. Execute x402 payment
    const kiteWallet = new KiteWalletManager();
    await kiteWallet.initialize();
    
    const proposalId = `PROP-${Date.now()}`;
    const payment = await kiteWallet.sendPayment(
      AUDIT_ORACLE_ADDRESS,
      '0.001',
      {
        service: 'risk-analysis',
        proposalId,
        agent: 'alpha-strategist',
        recipient: 'audit-oracle',
        description: `Payment for ${proposalData.asset} ${proposalData.direction} analysis`
      }
    );
    
    // 3. Log to Nerve-Cord
    if (payment.success) {
      execSync(`npm run log "💰 PAID: ${proposalId} → 0.001 KITE → AuditOracle (tx: ${payment.txHash.substring(0, 10)}...)" "alpha-strategist,payment"`, {
        cwd: NERVE_CORD_PATH,
        stdio: 'inherit'
      });
    }
    
    return {
      success: true,
      proposalId,
      paymentTxHash: payment.txHash,
      explorerUrl: `https://testnet.kitescan.ai/tx/${payment.txHash}`
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// If called directly with args
if (require.main === module) {
  const proposalData = JSON.parse(process.argv[2]);
  sendProposal(proposalData).then(result => {
    console.log(JSON.stringify(result, null, 2));
  });
}

module.exports = { sendProposal };
