#!/usr/bin/env node
/**
 * Send Proposals to ExecutionHand via Nerve-Cord
 * This script runs the analysis and sends proposals via Nerve-Cord
 * Usage: node send-proposals.js
 */

const { execSync } = require('child_process');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '..', '.env') });
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

Order Book Analysis:
- Buy Pressure: ${proposal.orderBookAnalysis.buyPressure}%
- Sell Pressure: ${proposal.orderBookAnalysis.sellPressure}%
- Spread: ${proposal.orderBookAnalysis.spread}%
- Trend: ${proposal.orderBookAnalysis.trend}

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
  
  // Send via Nerve-Cord
  try {
    console.error(`Sending proposal to execution-hand: ${subject}`);
    execSync(`npm run send execution-hand "${subject}" "${message}"`, {
      cwd: path.join(__dirname, '..', '..', '..', '..', 'nerve-cord'),
      stdio: 'inherit'
    });
    console.error('✓ Sent successfully');
  } catch (error) {
    console.error(`✗ Failed to send: ${error.message}`);
  }
}

console.log(`Sent ${result.proposals.length} proposals to execution-hand`);
