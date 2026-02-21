#!/usr/bin/env node
/**
 * Alpha Strategist - Real-Time Stream Analyzer
 * 
 * Continuously polls QuickNode Streams webhook API, analyzes market data,
 * and generates trading proposals when confidence >= 60%
 * 
 * This is the core autonomous decision-making engine for Alpha Strategist
 */

const axios = require('axios');
const { execSync } = require('child_process');
const path = require('path');
const { KiteWalletManager } = require('../lib/kite-wallet');
const { logIntent } = require('../../../../hedera/scripts/logIntent');
require('dotenv').config({
  path: path.join(__dirname, '..', '..', '..', '..', '.env'),
  override: true
});

// Configuration
const WEBHOOK_API_URL = process.env.WEBHOOK_API_URL || 'https://s4d5-production-f42d.up.railway.app/dashboard';
const ANALYSIS_INTERVAL = parseInt(process.env.ANALYSIS_INTERVAL) || 30000; // 30 seconds
const MIN_CONFIDENCE = parseInt(process.env.MIN_CONFIDENCE) || 30; // Lowered to 30 for initial testing
const AUDIT_ORACLE_ADDRESS = process.env.AUDIT_ORACLE_ADDRESS || '0xF3bbD5682e671CdcDC42f52bDdecCB6a35D53aE1';
const NERVE_CORD_PATH = process.env.NERVE_CORD_PATH || path.join(__dirname, '..', '..', '..', '..', 'nerve-cord');

// State tracking
const state = {
  lastProposalTime: {},
  proposalCooldown: 60000, // 60 seconds between proposals for same asset
  kiteWallet: null
};

// Initialize Kite wallet
async function initializeWallet() {
  try {
    state.kiteWallet = new KiteWalletManager();
    await state.kiteWallet.initialize();
    console.log('[Wallet] ✓ Kite wallet initialized');
    return true;
  } catch (error) {
    console.error('[Wallet] ⚠️  Failed to initialize:', error.message);
    console.error('[Wallet] Proposals will be sent without x402 payments');
    return false;
  }
}

// Fetch dashboard data
async function fetchDashboardData() {
  try {
    const response = await axios.get(WEBHOOK_API_URL, { timeout: 10000 });
    return response.data;
  } catch (error) {
    console.error('[API] Failed to fetch dashboard:', error.message);
    return null;
  }
}

// Calculate confidence score based on multiple signals
function calculateConfidence(asset, metrics, recentTrades) {
  if (!metrics || !recentTrades || recentTrades.length === 0) {
    return { confidence: 0, direction: 'NONE', signals: {} };
  }

  let confidence = 0;
  const signals = {};

  // Signal 1: Price Trend (max 30 points)
  const priceChange = parseFloat(metrics.priceChange);
  if (Math.abs(priceChange) > 2.5) {
    signals.trend = { score: 30, reason: `Strong ${priceChange > 0 ? 'upward' : 'downward'} trend (${priceChange}%)` };
    confidence += 30;
  } else if (Math.abs(priceChange) > 1.5) {
    signals.trend = { score: 20, reason: `Moderate trend (${priceChange}%)` };
    confidence += 20;
  } else if (Math.abs(priceChange) > 0.5) {
    signals.trend = { score: 10, reason: `Weak trend (${priceChange}%)` };
    confidence += 10;
  } else {
    signals.trend = { score: 0, reason: `No clear trend (${priceChange}%)` };
  }

  // Signal 2: Volume (max 20 points)
  const volume = parseFloat(metrics.totalVolume);
  const volumeThresholds = { BTC: 10000, ETH: 1000 };
  const threshold = volumeThresholds[asset] || 1000;

  if (volume > threshold * 3) {
    signals.volume = { score: 20, reason: `Massive volume ($${(volume / 1000).toFixed(1)}K)` };
    confidence += 20;
  } else if (volume > threshold * 1.5) {
    signals.volume = { score: 15, reason: `High volume ($${(volume / 1000).toFixed(1)}K)` };
    confidence += 15;
  } else if (volume > threshold) {
    signals.volume = { score: 10, reason: `Good volume ($${(volume / 1000).toFixed(1)}K)` };
    confidence += 10;
  } else {
    signals.volume = { score: 0, reason: `Low volume ($${(volume / 1000).toFixed(1)}K)` };
  }

  // Signal 3: Buy/Sell Pressure (max 25 points)
  const buySellRatio = parseFloat(metrics.buySellRatio);

  if (buySellRatio > 3.0) {
    signals.pressure = { score: 25, reason: `Extreme buy pressure (${buySellRatio.toFixed(1)}x)` };
    confidence += 25;
  } else if (buySellRatio < 0.33) {
    signals.pressure = { score: 25, reason: `Extreme sell pressure (${buySellRatio.toFixed(2)}x)` };
    confidence += 25;
  } else if (buySellRatio > 2.0) {
    signals.pressure = { score: 15, reason: `Strong buy pressure (${buySellRatio.toFixed(1)}x)` };
    confidence += 15;
  } else if (buySellRatio < 0.5) {
    signals.pressure = { score: 15, reason: `Strong sell pressure (${buySellRatio.toFixed(2)}x)` };
    confidence += 15;
  } else {
    signals.pressure = { score: 0, reason: `Neutral pressure (${buySellRatio.toFixed(2)}x)` };
  }

  // Signal 4: Trade Frequency/Momentum (max 15 points)
  const frequency = parseFloat(metrics.tradeFrequency);

  if (frequency > 200) {
    signals.momentum = { score: 15, reason: `High momentum (${frequency.toFixed(0)}/min)` };
    confidence += 15;
  } else if (frequency > 100) {
    signals.momentum = { score: 10, reason: `Good momentum (${frequency.toFixed(0)}/min)` };
    confidence += 10;
  } else if (frequency > 50) {
    signals.momentum = { score: 5, reason: `Moderate momentum (${frequency.toFixed(0)}/min)` };
    confidence += 5;
  } else {
    signals.momentum = { score: 0, reason: `Low momentum (${frequency.toFixed(0)}/min)` };
  }

  // Signal 5: Consistency Bonus (max 10 points)
  // If trend and pressure align, add bonus
  const trendDirection = priceChange > 0 ? 'bullish' : 'bearish';
  const pressureDirection = buySellRatio > 1 ? 'bullish' : 'bearish';

  if (trendDirection === pressureDirection && Math.abs(priceChange) > 1) {
    signals.consistency = { score: 10, reason: 'Trend and pressure aligned' };
    confidence += 10;
  } else {
    signals.consistency = { score: 0, reason: 'Mixed signals' };
  }

  // Determine direction
  let direction = 'NONE';
  if (confidence >= MIN_CONFIDENCE) {
    // Direction based on dominant signals
    const bullishScore = (priceChange > 0 ? signals.trend.score : 0) +
      (buySellRatio > 1 ? signals.pressure.score : 0);
    const bearishScore = (priceChange < 0 ? signals.trend.score : 0) +
      (buySellRatio < 1 ? signals.pressure.score : 0);

    direction = bullishScore > bearishScore ? 'LONG' : 'SHORT';
  }

  return { confidence, direction, signals };
}

// Generate trading proposal
function generateProposal(asset, direction, confidence, metrics, signals) {
  const currentPrice = parseFloat(metrics.averagePrice);

  // Position sizing based on confidence
  const baseSize = 100; // $100 base position
  const confidenceMultiplier = (confidence - MIN_CONFIDENCE) / 10;
  const positionSize = baseSize * (1 + confidenceMultiplier);

  // Risk management
  const stopLossPercent = 3; // 3% stop-loss
  const takeProfitPercent = 6; // 6% take-profit (2:1 R/R)

  let entryPrice, stopLoss, takeProfit;

  if (direction === 'LONG') {
    entryPrice = currentPrice;
    stopLoss = currentPrice * (1 - stopLossPercent / 100);
    takeProfit = currentPrice * (1 + takeProfitPercent / 100);
  } else { // SHORT
    entryPrice = currentPrice;
    stopLoss = currentPrice * (1 + stopLossPercent / 100);
    takeProfit = currentPrice * (1 - takeProfitPercent / 100);
  }

  // Leverage based on confidence
  let leverage = 1;
  if (confidence >= 85) leverage = 2;
  else if (confidence >= 75) leverage = 1.5;

  return {
    asset,
    direction,
    confidence,
    entryPrice,
    stopLoss,
    takeProfit,
    positionSize,
    leverage,
    signals,
    metrics: {
      currentPrice,
      volume: metrics.totalVolume,
      trend: metrics.trend,
      priceChange: metrics.priceChange,
      frequency: metrics.tradeFrequency,
      buySellRatio: metrics.buySellRatio
    },
    timestamp: new Date().toISOString()
  };
}

// Format proposal message for Nerve-Cord
function formatProposalMessage(proposal) {
  const { asset, direction, confidence, entryPrice, stopLoss, takeProfit, positionSize, leverage, signals, metrics } = proposal;

  // Calculate risk/reward
  const risk = Math.abs(entryPrice - stopLoss);
  const reward = Math.abs(takeProfit - entryPrice);
  const rrRatio = (reward / risk).toFixed(1);
  const maxLoss = (positionSize * leverage * (risk / entryPrice)).toFixed(2);
  const expectedProfit = (positionSize * leverage * (reward / entryPrice)).toFixed(2);

  // Personality-driven commentary based on confidence
  let commentary = '';
  if (confidence >= 85) {
    commentary = `This is a textbook setup. Every signal aligned. Going in heavy.`;
  } else if (confidence >= 75) {
    commentary = `Strong conviction here. The data is clear.`;
  } else if (confidence >= 65) {
    commentary = `Decent setup. Not perfect, but worth taking.`;
  } else {
    commentary = `Marginal setup. Sizing conservatively.`;
  }

  return `🎯 OPEN ${direction} ${asset}

${commentary}

Entry: $${entryPrice.toFixed(2)}
Stop-Loss: $${stopLoss.toFixed(2)} (-${((Math.abs(entryPrice - stopLoss) / entryPrice) * 100).toFixed(1)}%)
Take-Profit: $${takeProfit.toFixed(2)} (+${((Math.abs(takeProfit - entryPrice) / entryPrice) * 100).toFixed(1)}%)
Position Size: $${positionSize.toFixed(0)} (${(positionSize / 100).toFixed(1)}x base)
Leverage: ${leverage}x

Market Snapshot:
- Price: $${metrics.currentPrice}
- Volume: $${(parseFloat(metrics.volume) / 1000).toFixed(1)}K
- Trend: ${metrics.trend} (${metrics.priceChange})
- Frequency: ${parseFloat(metrics.frequency).toFixed(0)} trades/min
- Buy/Sell: ${parseFloat(metrics.buySellRatio).toFixed(2)}x

Signal Breakdown:
- Trend: ${signals.trend.score}/30 (${signals.trend.reason})
- Volume: ${signals.volume.score}/20 (${signals.volume.reason})
- Pressure: ${signals.pressure.score}/25 (${signals.pressure.reason})
- Momentum: ${signals.momentum.score}/15 (${signals.momentum.reason})
- Consistency: ${signals.consistency.score}/10 (${signals.consistency.reason})

Total Confidence: ${confidence}%

Risk Assessment:
- Max Loss: $${maxLoss} (${((parseFloat(maxLoss) / (positionSize * leverage)) * 100).toFixed(2)}% of position)
- Expected Profit: $${expectedProfit}
- Risk/Reward: 1:${rrRatio}

Timestamp: ${proposal.timestamp}
Source: QuickNode Streams (Hyperliquid)`;
}

// Send proposal via Nerve-Cord
async function sendProposal(proposal) {
  const subject = `Trade Proposal: ${proposal.direction} ${proposal.asset}`;
  const message = formatProposalMessage(proposal);

  try {
    console.log(`[Proposal] Sending to AuditOracle: ${subject}`);

    // ANCHOR TO HEDERA HCS: Prioritize the ledger as the Single Source of Truth
    console.log(`[${proposal.asset}] ⚓ Anchoring intent to Hedera HCS...`);
    try {
      await logIntent("Alpha Strategist", "create_checkout", {
        proposalId: `PROP-${Date.now()}`,
        asset: proposal.asset,
        direction: proposal.direction,
        logic: subject, // Use subject as fallback for logic
        timestamp: new Date().toISOString()
      }, proposal.confidence);
    } catch (hcsError) {
      console.error(`[${proposal.asset}] ❌ HCS Anchoring failed:`, hcsError.message);
    }

    // Optional: Send via Nerve-Cord for legacy support/logging
    try {
      execSync(`npm run send audit-oracle "${subject}" "${message}"`, {
        cwd: NERVE_CORD_PATH,
        stdio: 'inherit'
      });
      console.log('[Proposal] ✓ Nerve-Cord message sent');
    } catch (ncError) {
      console.warn('[Proposal] ⚠️ Nerve-Cord delivery skipped (Optional service)');
    }

    // Send x402 payment
    if (state.kiteWallet) {
      try {
        const proposalId = `PROP-${Date.now()}`;

        const payment = await state.kiteWallet.sendPayment(
          AUDIT_ORACLE_ADDRESS,
          '0.001',
          {
            service: 'risk-analysis',
            proposalId,
            agent: 'alpha-strategist',
            recipient: 'audit-oracle',
            description: `Payment for ${proposal.direction} ${proposal.asset} analysis`
          }
        );

        if (payment.success) {
          console.log(`[Payment] ✓ x402 payment sent: ${payment.txHash.substring(0, 10)}...`);
          console.log(`[Payment] Explorer: https://testnet.kitescan.ai/tx/${payment.txHash}`);

          // Log to Nerve-Cord
          execSync(`npm run log "💰 PAID: ${proposalId} → 0.001 KITE → AuditOracle (tx: ${payment.txHash.substring(0, 10)}...)" "alpha-strategist,payment"`, {
            cwd: NERVE_CORD_PATH,
            stdio: 'inherit'
          });
        } else {
          console.error(`[Payment] ❌ Failed: ${payment.error}`);

          // Log failure
          execSync(`npm run log "⚠️  Payment failed for ${proposalId}: ${payment.error}" "alpha-strategist,error"`, {
            cwd: NERVE_CORD_PATH,
            stdio: 'inherit'
          });
        }
      } catch (paymentError) {
        console.error(`[Payment] ❌ Exception: ${paymentError.message}`);
      }
    }

    // Optional: Log final status to Nerve-Cord
    try {
      execSync(`npm run log "📊 Sent proposal: ${subject} (Confidence: ${proposal.confidence}%)" "alpha-strategist,proposal"`, {
        cwd: NERVE_CORD_PATH,
        stdio: 'inherit'
      });
    } catch (finalLogErr) {
      console.warn('[Proposal] ⚠️ Final log skipped');
    }

    return true;
  } catch (error) {
    console.error(`[Proposal] ✗ Failed to send: ${error.message}`);
    return false;
  }
}

// Check if asset is in cooldown
function isInCooldown(asset) {
  const lastTime = state.lastProposalTime[asset];
  if (!lastTime) return false;

  const elapsed = Date.now() - lastTime;
  return elapsed < state.proposalCooldown;
}

// Main analysis loop
async function analyzeMarkets() {
  console.log(`[${new Date().toISOString()}] 🔄 Polling dashboard API...`);

  const data = await fetchDashboardData();

  if (!data) {
    console.log('[Analysis] No data received, skipping cycle');
    return;
  }

  console.log(`[Data] Received: ${data.stats.totalTrades} trades (BTC: ${data.BTC?.metrics?.tradeCount || 0}, ETH: ${data.ETH?.metrics?.tradeCount || 0})`);

  // Analyze each asset
  for (const asset of ['BTC', 'ETH']) {
    const assetData = data[asset];

    if (!assetData || !assetData.metrics || !assetData.recentTrades) {
      console.log(`[${asset}] No data available`);
      continue;
    }

    // Check cooldown
    if (isInCooldown(asset)) {
      const remaining = Math.ceil((state.proposalCooldown - (Date.now() - state.lastProposalTime[asset])) / 1000);
      console.log(`[${asset}] In cooldown (${remaining}s remaining)`);
      continue;
    }

    // Calculate confidence
    const analysis = calculateConfidence(asset, assetData.metrics, assetData.recentTrades);

    console.log(`[${asset}] Analyzing...`);
    console.log(`[${asset}]   - Trend: ${analysis.signals.trend?.score || 0}/30 (${analysis.signals.trend?.reason || 'N/A'})`);
    console.log(`[${asset}]   - Volume: ${analysis.signals.volume?.score || 0}/20 (${analysis.signals.volume?.reason || 'N/A'})`);
    console.log(`[${asset}]   - Pressure: ${analysis.signals.pressure?.score || 0}/25 (${analysis.signals.pressure?.reason || 'N/A'})`);
    console.log(`[${asset}]   - Momentum: ${analysis.signals.momentum?.score || 0}/15 (${analysis.signals.momentum?.reason || 'N/A'})`);
    console.log(`[${asset}]   - Consistency: ${analysis.signals.consistency?.score || 0}/10 (${analysis.signals.consistency?.reason || 'N/A'})`);
    console.log(`[${asset}]   → Confidence: ${analysis.confidence}% (${analysis.direction})`);

    // Generate proposal if confidence >= threshold
    if (analysis.confidence >= MIN_CONFIDENCE && analysis.direction !== 'NONE') {
      console.log(`[${asset}] 🎯 High confidence detected! Generating proposal...`);

      const proposal = generateProposal(asset, analysis.direction, analysis.confidence, assetData.metrics, analysis.signals);

      const sent = await sendProposal(proposal);

      if (sent) {
        state.lastProposalTime[asset] = Date.now();
        console.log(`[${asset}] ✓ Proposal sent, cooldown activated (60s)`);
      }
    } else {
      console.log(`[${asset}] No action (confidence below ${MIN_CONFIDENCE}%)`);
    }
  }

  console.log(`[Analysis] Next poll in ${ANALYSIS_INTERVAL / 1000}s...\n`);
}

// Main function
async function main() {
  console.log('\n🚀 Alpha Strategist Stream Analyzer Started');
  console.log(`📡 Polling: ${WEBHOOK_API_URL}`);
  console.log(`⏱️  Interval: ${ANALYSIS_INTERVAL / 1000}s`);
  console.log(`🎯 Min Confidence: ${MIN_CONFIDENCE}%`);
  console.log('');

  // Initialize wallet
  await initializeWallet();

  // Run analysis loop
  while (true) {
    try {
      await analyzeMarkets();
    } catch (error) {
      console.error('[Error]', error.message);
    }

    // Wait for next interval
    await new Promise(resolve => setTimeout(resolve, ANALYSIS_INTERVAL));
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  process.exit(0);
});

// Start
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
