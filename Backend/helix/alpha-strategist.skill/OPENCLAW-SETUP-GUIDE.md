# Alpha Strategist OpenClaw Bot - EC2 Setup Guide

## Overview
This guide shows you how to configure your Alpha Strategist OpenClaw bot on EC2 to use the streaming analysis skill.

## Prerequisites
- EC2 instance with OpenClaw installed
- Node.js and npm installed
- Git installed
- Access to the EC2 instance via SSH

## Step 1: SSH into Alpha Strategist EC2 Instance

```bash
ssh -i your-key.pem ubuntu@your-alpha-strategist-ec2-ip
```

## Step 2: Clone or Update the S4D5 Repository

If not already cloned:
```bash
cd ~
git clone https://github.com/suhasdasari/S4D5.git
cd S4D5
```

If already cloned:
```bash
cd ~/S4D5
git pull origin main
```

## Step 3: Set Up Environment Variables

Create or update the `.env` file:
```bash
cd ~/S4D5
nano .env
```

Add these required variables:
```bash
# Kite AI Wallet (for x402 payments)
KITE_RPC=https://rpc-testnet.gokite.ai/
KITE_CHAIN_ID=2368

# QuickNode Streams Webhook API
WEBHOOK_API_URL=https://s4d5-production-f42d.up.railway.app/dashboard

# Nerve-Cord Configuration
NERVE_CORD_PATH=/home/ubuntu/S4D5/nerve-cord

# Agent Configuration
BOTNAME=alpha-strategist
ANALYSIS_INTERVAL=30000  # 30 seconds
MIN_CONFIDENCE=60        # Minimum 60% confidence to send proposals

# AuditOracle Address (for x402 payments)
AUDIT_ORACLE_ADDRESS=0xF3bbD5682e671CdcDC42f52bDdecCB6a35D53aE1
```

Save and exit (Ctrl+X, Y, Enter)

## Step 4: Install Dependencies

```bash
cd ~/S4D5/Backend/helix/alpha-strategist.skill
npm install
```

## Step 5: Initialize Wallets

### Initialize Base Wallet (if not already done)
```bash
node scripts/init-wallet.js
```

This creates `config/wallet.json` with your Base wallet.

### Initialize Kite Wallet (uses same private key)
```bash
node scripts/init-kite-wallet.js
```

This creates `config/kite-wallet.json` using the same private key.

### Fund the Kite Wallet
```bash
# Get your wallet address
cat config/kite-wallet.json | grep address

# Fund it at: https://faucet.gokite.ai
# Paste your address and request testnet KITE tokens
```

## Step 6: Locate OpenClaw Installation

Find where OpenClaw is installed:
```bash
which openclaw
# or
ls -la /usr/local/bin/openclaw
# or
ls -la ~/openclaw
```

Let's assume it's at `/usr/local/bin/openclaw` or `~/openclaw/`

## Step 7: Create OpenClaw Skill File

OpenClaw reads skills from a specific directory. Create the skill file:

```bash
# Find OpenClaw's skill directory
# Usually: ~/.openclaw/skills/ or ~/openclaw/skills/

# Create the skills directory if it doesn't exist
mkdir -p ~/.openclaw/skills

# Copy the skill file
cp ~/S4D5/Backend/helix/alpha-strategist.skill/STREAMING-ANALYSIS-SKILL.md \
   ~/.openclaw/skills/streaming-analysis.md
```

## Step 8: Create the Polling Script

Create a script that OpenClaw will execute:

```bash
nano ~/S4D5/Backend/helix/alpha-strategist.skill/scripts/stream-analyzer.js
```

Paste this content:
```javascript
#!/usr/bin/env node
/**
 * Stream Analyzer - Polls Railway webhook and analyzes streaming data
 * This script is executed by OpenClaw Alpha Strategist bot
 */

const fetch = require('node-fetch');
const { execSync } = require('child_process');
const path = require('path');
const { KiteWalletManager } = require('../lib/kite-wallet');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '..', '.env') });

const WEBHOOK_API = process.env.WEBHOOK_API_URL || 'https://s4d5-production-f42d.up.railway.app/dashboard';
const ANALYSIS_INTERVAL = parseInt(process.env.ANALYSIS_INTERVAL) || 30000;
const MIN_CONFIDENCE = parseInt(process.env.MIN_CONFIDENCE) || 60;
const AUDIT_ORACLE_ADDRESS = process.env.AUDIT_ORACLE_ADDRESS || '0xF3bbD5682e671CdcDC42f52bDdecCB6a35D53aE1';

// Track last proposal time to avoid spam
const lastProposalTime = {};
const COOLDOWN = 60000; // 1 minute

// Initialize Kite wallet
let kiteWallet = null;

async function initializeWallet() {
  try {
    kiteWallet = new KiteWalletManager();
    await kiteWallet.initialize();
    console.log('[Wallet] ✓ Kite wallet initialized');
  } catch (error) {
    console.error('[Wallet] ⚠️  Kite wallet not available:', error.message);
  }
}

// Analyze metrics and generate proposal
function analyzeMetrics(asset, metrics) {
  if (metrics.tradeCount < 20) {
    return null; // Not enough data
  }
  
  // Check cooldown
  const now = Date.now();
  if (lastProposalTime[asset] && (now - lastProposalTime[asset]) < COOLDOWN) {
    return null;
  }
  
  let bullishScore = 0;
  let bearishScore = 0;
  const reasons = [];
  
  // 1. Price Trend (30%)
  const priceChange = parseFloat(metrics.priceChange);
  if (priceChange > 2.0) {
    bullishScore += 30;
    reasons.push(`Strong upward trend: +${priceChange.toFixed(2)}%`);
  } else if (priceChange < -2.0) {
    bearishScore += 30;
    reasons.push(`Strong downward trend: ${priceChange.toFixed(2)}%`);
  }
  
  // 2. Buy/Sell Pressure (25%)
  const buySellRatio = parseFloat(metrics.buySellRatio);
  if (buySellRatio > 3.0) {
    bullishScore += 25;
    reasons.push(`Extreme buy pressure: ${buySellRatio.toFixed(2)}x`);
  } else if (buySellRatio < 0.33) {
    bearishScore += 25;
    reasons.push(`Extreme sell pressure: ${buySellRatio.toFixed(2)}x`);
  }
  
  // 3. Volume (20%)
  const volume = parseFloat(metrics.totalVolume);
  if (volume > 10000) {
    const boost = 20;
    if (bullishScore > bearishScore) {
      bullishScore += boost;
      reasons.push(`High volume confirms bullish: $${(volume/1000).toFixed(1)}K`);
    } else if (bearishScore > bullishScore) {
      bearishScore += boost;
      reasons.push(`High volume confirms bearish: $${(volume/1000).toFixed(1)}K`);
    }
  }
  
  // 4. Trade Frequency (15%)
  const frequency = parseFloat(metrics.tradeFrequency);
  if (frequency > 100) {
    const boost = 15;
    if (bullishScore > bearishScore) {
      bullishScore += boost;
      reasons.push(`High momentum: ${frequency.toFixed(0)} trades/min`);
    } else if (bearishScore > bullishScore) {
      bearishScore += boost;
      reasons.push(`High momentum: ${frequency.toFixed(0)} trades/min`);
    }
  }
  
  // Determine direction and confidence
  let direction, confidence;
  if (bullishScore > bearishScore) {
    direction = 'LONG';
    confidence = Math.min(bullishScore, 95);
  } else if (bearishScore > bullishScore) {
    direction = 'SHORT';
    confidence = Math.min(bearishScore, 95);
  } else {
    return null; // Neutral
  }
  
  if (confidence < MIN_CONFIDENCE) {
    return null; // Below threshold
  }
  
  // Generate proposal
  const currentPrice = parseFloat(metrics.averagePrice);
  const stopLoss = direction === 'LONG' ? currentPrice * 0.97 : currentPrice * 1.03;
  const takeProfit = direction === 'LONG' ? currentPrice * 1.06 : currentPrice * 0.94;
  
  lastProposalTime[asset] = now;
  
  return {
    action: 'OPEN',
    asset,
    direction,
    leverage: 2,
    entryPrice: currentPrice,
    stopLoss,
    takeProfit,
    size: 100,
    confidence,
    reasons,
    marketData: {
      price: currentPrice,
      volume24h: volume,
      change24h: priceChange,
      trend: metrics.trend,
      tradeFrequency: frequency,
      buySellRatio: buySellRatio
    },
    timestamp: now,
    source: 'quicknode-streams'
  };
}

// Send proposal via Nerve-Cord
async function sendProposal(proposal) {
  const subject = `Trade Proposal: ${proposal.direction} ${proposal.asset}`;
  const message = `🎯 OPEN ${proposal.direction} ${proposal.asset}
Leverage: ${proposal.leverage}x
Entry Price: $${proposal.entryPrice.toFixed(2)}
Stop-Loss: $${proposal.stopLoss.toFixed(2)} (${proposal.direction === 'LONG' ? '-' : '+'}3%)
Take-Profit: $${proposal.takeProfit.toFixed(2)} (${proposal.direction === 'LONG' ? '+' : '-'}6%)
Position Size: $${proposal.size}
Confidence: ${proposal.confidence.toFixed(1)}%

Market Data:
- Current Price: $${proposal.marketData.price.toFixed(2)}
- 24h Volume: $${(proposal.marketData.volume24h/1000).toFixed(1)}K
- 24h Change: ${proposal.marketData.change24h.toFixed(2)}%
- Trade Frequency: ${proposal.marketData.tradeFrequency.toFixed(0)} trades/min
- Buy/Sell Ratio: ${proposal.marketData.buySellRatio.toFixed(2)}x

Reasons:
${proposal.reasons.map(r => `- ${r}`).join('\n')}

Timestamp: ${new Date(proposal.timestamp).toISOString()}`;

  try {
    console.log(`[Proposal] Sending to AuditOracle: ${subject}`);
    
    // Send via Nerve-Cord
    const nerveCordPath = process.env.NERVE_CORD_PATH || path.join(__dirname, '..', '..', '..', '..', 'nerve-cord');
    execSync(`npm run send audit-oracle "${subject}" "${message}"`, {
      cwd: nerveCordPath,
      stdio: 'inherit'
    });
    
    console.log('[Proposal] ✓ Sent successfully');
    
    // Send x402 payment
    if (kiteWallet) {
      try {
        const proposalId = `PROP-${proposal.timestamp}`;
        const payment = await kiteWallet.sendPayment(
          AUDIT_ORACLE_ADDRESS,
          '0.001',
          {
            service: 'risk-analysis',
            proposalId,
            agent: 'alpha-strategist',
            recipient: 'audit-oracle',
            description: `Payment for ${proposal.action} ${proposal.asset} analysis`
          }
        );
        
        if (payment.success) {
          console.log(`[Payment] ✓ Sent 0.001 KITE: ${payment.txHash.substring(0, 10)}...`);
          
          // Log to Nerve-Cord
          execSync(`npm run log "💰 PAID: ${proposalId} → 0.001 KITE → AuditOracle (tx: ${payment.txHash.substring(0, 10)}...)" "alpha-strategist,payment"`, {
            cwd: nerveCordPath,
            stdio: 'inherit'
          });
        } else {
          console.error(`[Payment] ❌ Failed: ${payment.error}`);
        }
      } catch (paymentError) {
        console.error(`[Payment] ❌ Exception: ${paymentError.message}`);
      }
    }
    
    // Log proposal
    execSync(`npm run log "📊 Sent proposal: ${subject}" "alpha-strategist,proposal"`, {
      cwd: nerveCordPath,
      stdio: 'inherit'
    });
    
  } catch (error) {
    console.error(`[Proposal] ✗ Failed: ${error.message}`);
  }
}

// Main polling loop
async function poll() {
  try {
    console.log(`[${new Date().toISOString()}] 🔄 Polling dashboard API...`);
    
    const response = await fetch(WEBHOOK_API);
    const data = await response.json();
    
    console.log(`[Data] Received: ${data.stats.totalTrades} trades (BTC: ${data.BTC.metrics.tradeCount}, ETH: ${data.ETH.metrics.tradeCount})`);
    
    // Analyze BTC
    const btcProposal = analyzeMetrics('BTC', data.BTC.metrics);
    if (btcProposal) {
      console.log(`[BTC] 🎯 Proposal generated: ${btcProposal.direction} (${btcProposal.confidence.toFixed(1)}%)`);
      await sendProposal(btcProposal);
    }
    
    // Analyze ETH
    const ethProposal = analyzeMetrics('ETH', data.ETH.metrics);
    if (ethProposal) {
      console.log(`[ETH] 🎯 Proposal generated: ${ethProposal.direction} (${ethProposal.confidence.toFixed(1)}%)`);
      await sendProposal(ethProposal);
    }
    
  } catch (error) {
    console.error(`[Error] ${error.message}`);
  }
}

// Start
async function main() {
  console.log('🚀 Alpha Strategist Stream Analyzer Started');
  console.log(`📡 Polling: ${WEBHOOK_API}`);
  console.log(`⏱️  Interval: ${ANALYSIS_INTERVAL/1000}s`);
  console.log(`🎯 Min Confidence: ${MIN_CONFIDENCE}%`);
  console.log('');
  
  await initializeWallet();
  
  // Poll continuously
  while (true) {
    await poll();
    await new Promise(resolve => setTimeout(resolve, ANALYSIS_INTERVAL));
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
```

Save and exit, then make it executable:
```bash
chmod +x ~/S4D5/Backend/helix/alpha-strategist.skill/scripts/stream-analyzer.js
```

## Step 9: Test the Script Manually

Before giving it to OpenClaw, test it:
```bash
cd ~/S4D5/Backend/helix/alpha-strategist.skill
node scripts/stream-analyzer.js
```

You should see:
```
🚀 Alpha Strategist Stream Analyzer Started
📡 Polling: https://s4d5-production-f42d.up.railway.app/dashboard
⏱️  Interval: 30s
🎯 Min Confidence: 60%

[Wallet] ✓ Kite wallet initialized
[2026-02-21T04:00:00.000Z] 🔄 Polling dashboard API...
[Data] Received: 150 trades (BTC: 100, ETH: 50)
[BTC] 🎯 Proposal generated: LONG (75.5%)
[Proposal] Sending to AuditOracle: Trade Proposal: LONG BTC
[Proposal] ✓ Sent successfully
[Payment] ✓ Sent 0.001 KITE: 0xabc123...
```

Press Ctrl+C to stop.

## Step 10: Configure OpenClaw to Run the Script

Now configure OpenClaw to execute this script continuously.

### Option A: Using OpenClaw's Task Scheduler

Edit OpenClaw's configuration:
```bash
nano ~/.openclaw/config.json
```

Add a scheduled task:
```json
{
  "tasks": [
    {
      "name": "stream-analyzer",
      "script": "/home/ubuntu/S4D5/Backend/helix/alpha-strategist.skill/scripts/stream-analyzer.js",
      "schedule": "continuous",
      "skill": "streaming-analysis"
    }
  ]
}
```

### Option B: Using systemd Service (Recommended)

Create a systemd service:
```bash
sudo nano /etc/systemd/system/alpha-strategist.service
```

Paste:
```ini
[Unit]
Description=Alpha Strategist Stream Analyzer
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/S4D5/Backend/helix/alpha-strategist.skill
ExecStart=/usr/bin/node /home/ubuntu/S4D5/Backend/helix/alpha-strategist.skill/scripts/stream-analyzer.js
Restart=always
RestartSec=10
StandardOutput=append:/var/log/alpha-strategist.log
StandardError=append:/var/log/alpha-strategist-error.log

[Install]
WantedBy=multi-user.target
```

Enable and start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable alpha-strategist
sudo systemctl start alpha-strategist
```

Check status:
```bash
sudo systemctl status alpha-strategist
```

View logs:
```bash
sudo tail -f /var/log/alpha-strategist.log
```

## Step 11: Monitor the Bot

### Check if it's running:
```bash
sudo systemctl status alpha-strategist
```

### View real-time logs:
```bash
sudo tail -f /var/log/alpha-strategist.log
```

### Check Nerve-Cord for proposals:
```bash
cd ~/S4D5/nerve-cord
npm run check
```

### Check Kite wallet balance:
```bash
cd ~/S4D5/Backend/helix/alpha-strategist.skill
node -e "const {KiteWalletManager} = require('./lib/kite-wallet'); (async()=>{const w=new KiteWalletManager();await w.initialize();console.log('Balance:',await w.getBalance(),'KITE');})()"
```

## Step 12: Verify End-to-End Flow

1. **Check webhook is receiving data**:
   ```bash
   curl https://s4d5-production-f42d.up.railway.app/dashboard
   ```

2. **Check Alpha Strategist is analyzing**:
   ```bash
   sudo tail -f /var/log/alpha-strategist.log
   ```

3. **Check proposals are sent to Nerve-Cord**:
   ```bash
   cd ~/S4D5/nerve-cord
   npm run check
   ```

4. **Check x402 payments on Kite**:
   Visit: https://testnet.kitescan.ai/address/YOUR_WALLET_ADDRESS

## Troubleshooting

### Bot not starting:
```bash
sudo journalctl -u alpha-strategist -f
```

### Wallet issues:
```bash
cd ~/S4D5/Backend/helix/alpha-strategist.skill
node scripts/init-kite-wallet.js
```

### Nerve-Cord connection issues:
```bash
cd ~/S4D5/nerve-cord
npm run ping audit-oracle
```

### API connection issues:
```bash
curl -v https://s4d5-production-f42d.up.railway.app/dashboard
```

## Success Criteria

✅ Alpha Strategist service is running
✅ Logs show continuous polling every 30 seconds
✅ Proposals are generated when confidence >= 60%
✅ Proposals are sent to AuditOracle via Nerve-Cord
✅ x402 payments are sent on Kite AI
✅ No errors in logs

## Next Steps

Once Alpha Strategist is working:
1. Configure AuditOracle bot on its EC2 instance
2. Configure ExecutionHand bot on its EC2 instance
3. Monitor the full agent workflow
4. Update the main dashboard to show live proposals

## Support

If you encounter issues:
1. Check logs: `sudo tail -f /var/log/alpha-strategist.log`
2. Check service status: `sudo systemctl status alpha-strategist`
3. Test manually: `node scripts/stream-analyzer.js`
4. Verify wallet balance: Check Kite faucet
5. Verify API access: `curl` the webhook URL
