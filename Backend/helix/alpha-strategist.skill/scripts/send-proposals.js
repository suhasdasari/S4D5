#!/usr/bin/env node
/**
 * Send Proposals to ExecutionHand via Nerve-Cord
 * This script runs the analysis and sends proposals via Nerve-Cord
<<<<<<< HEAD
 * Includes x402 micropayments to AuditOracle for risk analysis
=======
>>>>>>> Og_integration
 * Usage: node send-proposals.js
 */

const { execSync } = require('child_process');
const path = require('path');
<<<<<<< HEAD
const { KiteWalletManager } = require('../lib/kite-wallet');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '..', '.env') });

async function main() {
  // Run analysis
  console.error('Running market analysis...');
  const analysisOutput = execSync('node scripts/analyze-and-propose.js', {
    cwd: path.join(__dirname, '..'),
    encoding: 'utf8'
  });

  const result = JSON.parse(analysisOutput);

  if (result.proposals.length === 0) {
    console.log('No proposals generated');
    process.exit(0);
  }

  console.error(`Generated ${result.proposals.length} proposals`);

// Initialize Kite wallet for x402 payments
let kiteWallet = null;
const AUDIT_ORACLE_ADDRESS = '0xF3bbD5682e671CdcDC42f52bDdecCB6a35D53aE1';

try {
  kiteWallet = new KiteWalletManager();
  await kiteWallet.initialize();
  console.error('✓ Kite wallet initialized for x402 payments');
} catch (error) {
  console.error('⚠️  Kite wallet not available:', error.message);
  console.error('   Proposals will be sent without x402 payments');
}

=======

// Run analysis
console.error('Running market analysis...');
const analysisOutput = execSync('node scripts/analyze-and-propose.js', {
  cwd: path.join(__dirname, '..'),
  encoding: 'utf8'
});

const result = JSON.parse(analysisOutput);

if (result.proposals.length === 0) {
  console.log('No proposals generated');
  process.exit(0);
}

console.error(`Generated ${result.proposals.length} proposals`);

>>>>>>> Og_integration
// Send each proposal via Nerve-Cord
for (const proposal of result.proposals) {
  let message = '';
  let subject = '';
  
  if (proposal.action === 'OPEN') {
    subject = `Trade Proposal: ${proposal.direction} ${proposal.asset}`;
    message = `🎯 OPEN ${proposal.direction} ${proposal.asset}
Leverage: ${proposal.leverage}x
Entry Price: $${proposal.entryPrice.toFixed(2)}
Stop-Loss: $${proposal.stopLoss.toFixed(2)} (-${((proposal.entryPrice - proposal.stopLoss) / proposal.entryPrice * 100).toFixed(1)}%)
Take-Profit: $${proposal.takeProfit.toFixed(2)} (+${((proposal.takeProfit - proposal.entryPrice) / proposal.entryPrice * 100).toFixed(1)}%)
Position Size: $${proposal.size.toFixed(2)}
Confidence: ${proposal.confidence.toFixed(1)}%

Market Data:
- Current Price: $${proposal.marketData.price.toFixed(2)}
- 24h Volume: $${(proposal.marketData.volume24h / 1000000).toFixed(2)}M
- 24h Change: ${proposal.marketData.change24h.toFixed(2)}%

Sentiment Score: ${proposal.sentimentScore.toFixed(2)} (${proposal.sentimentScore > 0 ? 'Bullish' : 'Bearish'})

<<<<<<< HEAD
Order Book Analysis:
- Buy Pressure: ${proposal.orderBookAnalysis.buyPressure}%
- Sell Pressure: ${proposal.orderBookAnalysis.sellPressure}%
- Spread: ${proposal.orderBookAnalysis.spread}%
- Trend: ${proposal.orderBookAnalysis.trend}
=======
Top Signals:
${proposal.sentimentSignals.map(s => `- ${s.question} (${(s.probability * 100).toFixed(0)}%)`).join('\n')}
>>>>>>> Og_integration

Timestamp: ${new Date(proposal.timestamp).toISOString()}`;
  } else if (proposal.action === 'CLOSE') {
    subject = `Close Position: ${proposal.asset}`;
    message = `🛑 CLOSE ${proposal.asset}
Position ID: ${proposal.positionId}
Current Price: $${proposal.currentPrice.toFixed(2)}

Reasons:
${proposal.reasons.map(r => `- ${r.type}: ${r.detail}`).join('\n')}

Timestamp: ${new Date(proposal.timestamp).toISOString()}`;
  }
  
<<<<<<< HEAD
  // Send via Nerve-Cord to AuditOracle for review
  try {
    console.error(`Sending proposal to audit-oracle: ${subject}`);
    execSync(`npm run send audit-oracle "${subject}" "${message}"`, {
=======
  // Send via Nerve-Cord
  try {
    console.error(`Sending proposal to execution-hand: ${subject}`);
    execSync(`npm run send execution-hand "${subject}" "${message}"`, {
>>>>>>> Og_integration
      cwd: path.join(__dirname, '..', '..', '..', '..', 'nerve-cord'),
      stdio: 'inherit'
    });
    console.error('✓ Sent successfully');
<<<<<<< HEAD
    
    // Send x402 micropayment to AuditOracle for risk analysis service
    if (kiteWallet) {
      try {
        const proposalId = proposal.action === 'OPEN' ? `PROP-${Date.now()}` : proposal.positionId;
        
        const payment = await kiteWallet.sendPayment(
          AUDIT_ORACLE_ADDRESS,
          '0.001', // 0.001 KITE per proposal analysis
          {
            service: 'risk-analysis',
            proposalId: proposalId,
            agent: 'alpha-strategist',
            recipient: 'audit-oracle',
            description: `Payment for ${proposal.action} ${proposal.asset} analysis`
          }
        );
        
        if (payment.success) {
          console.error(`✓ x402 payment sent: ${payment.txHash.substring(0, 10)}...`);
          console.error(`  Explorer: https://testnet.kitescan.ai/tx/${payment.txHash}`);
          console.error(`  Mapping: ${proposalId} → ${payment.txHash.substring(0, 10)}... → risk-analysis`);
          
          // Log payment to Nerve-Cord with clear action-to-payment mapping
          execSync(`npm run log "💰 PAID: ${proposalId} → 0.001 KITE → AuditOracle (tx: ${payment.txHash.substring(0, 10)}...) | Service: risk-analysis" "alpha-strategist,payment,kite"`, {
            cwd: path.join(__dirname, '..', '..', '..', '..', 'nerve-cord'),
            stdio: 'inherit'
          });
        } else {
          console.error(`❌ x402 payment FAILED: ${payment.error}`);
          console.error(`   Proposal: ${proposalId}`);
          console.error(`   Reason: ${payment.error}`);
          
          // Check if it's insufficient funds
          if (payment.error && payment.error.includes('Insufficient balance')) {
            console.error(`   ⚠️  CRITICAL: Wallet out of KITE tokens!`);
            console.error(`   Action: Fund wallet at https://faucet.gokite.ai`);
            console.error(`   Address: ${kiteWallet.getInfo().address}`);
            
            // Log critical error to Nerve-Cord
            execSync(`npm run log "🚨 PAYMENT FAILED: Insufficient KITE balance. Proposal ${proposalId} sent but NOT PAID. Manual intervention required." "alpha-strategist,error,payment"`, {
              cwd: path.join(__dirname, '..', '..', '..', '..', 'nerve-cord'),
              stdio: 'inherit'
            });
          } else {
            // Log other payment failures
            execSync(`npm run log "⚠️  Payment failed for ${proposalId}: ${payment.error}. Proposal sent but not paid." "alpha-strategist,error,payment"`, {
              cwd: path.join(__dirname, '..', '..', '..', '..', 'nerve-cord'),
              stdio: 'inherit'
            });
          }
          
          console.error(`   ℹ️  Proposal was sent to AuditOracle but payment failed.`);
          console.error(`   ℹ️  AuditOracle may reject unpaid proposals.`);
        }
      } catch (paymentError) {
        console.error(`❌ x402 payment exception: ${paymentError.message}`);
        console.error(`   Proposal sent but payment system error occurred.`);
        
        // Log exception to Nerve-Cord
        execSync(`npm run log "🚨 Payment system error: ${paymentError.message}" "alpha-strategist,error,payment"`, {
          cwd: path.join(__dirname, '..', '..', '..', '..', 'nerve-cord'),
          stdio: 'inherit'
        });
      }
    }
    
    // Log to Nerve-Cord dashboard
    execSync(`npm run log "📊 Sent proposal to AuditOracle: ${subject}" "alpha-strategist,proposal"`, {
      cwd: path.join(__dirname, '..', '..', '..', '..', 'nerve-cord'),
      stdio: 'inherit'
    });
=======
>>>>>>> Og_integration
  } catch (error) {
    console.error(`✗ Failed to send: ${error.message}`);
  }
}

<<<<<<< HEAD
console.log(`Sent ${result.proposals.length} proposals to audit-oracle for review`);
}

// Run main function
main().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
=======
console.log(`Sent ${result.proposals.length} proposals to execution-hand`);
>>>>>>> Og_integration
