# OpenClaw LLM Integration Guide - Transform Alpha Strategist into a Thinking Agent

## Overview

This guide shows you how to transform your hardcoded `stream-analyzer.js` script into an LLM-powered thinking agent using the OpenClaw installation on your EC2 instance.

**Current State**: Hardcoded rules → Fixed thresholds → Automatic actions  
**Target State**: LLM reasoning → Judgment-based decisions → Thoughtful actions

## Prerequisites

✅ OpenClaw installed on EC2 (you already have this)  
✅ Alpha Strategist bot running (you already have this)  
✅ Stream analyzer script working (you already have this)  
✅ Wallet funded with KITE tokens (you already have this)

## Architecture Transformation

### Before (Hardcoded)
```
QuickNode → Railway Webhook → stream-analyzer.js (rules)
                                      ↓
                              if confidence >= 60%
                                      ↓
                              Send proposal + payment
```

### After (LLM-Powered)
```
QuickNode → Railway Webhook → OpenClaw Agent (LLM)
                                      ↓
                              Analyzes & Reasons
                                      ↓
                              Decides (judgment call)
                                      ↓
                              Send proposal + payment
```

## Implementation Approach

We'll use a **hybrid approach** to minimize risk:

1. Keep the existing `stream-analyzer.js` as a fallback
2. Create a new OpenClaw skill that uses LLM reasoning
3. Run both in parallel initially (LLM makes decisions, script logs for comparison)
4. Once confident, switch fully to LLM-powered version

## Step 1: Create OpenClaw Tools for Alpha Strategist

OpenClaw agents need "tools" to interact with the world. Create these tools:

### Tool 1: Fetch Market Data

Create: `Backend/helix/alpha-strategist.skill/openclaw-tools/fetch-market-data.js`

```javascript
#!/usr/bin/env node
/**
 * OpenClaw Tool: Fetch Market Data
 * Fetches real-time market data from Railway webhook
 */

const axios = require('axios');

const WEBHOOK_URL = process.env.WEBHOOK_API_URL || 'https://s4d5-production-f42d.up.railway.app/dashboard';

async function fetchMarketData() {
  try {
    const response = await axios.get(WEBHOOK_URL, { timeout: 10000 });
    
    // Return formatted data for LLM
    return {
      success: true,
      data: {
        timestamp: response.data.timestamp,
        totalTrades: response.data.stats.totalTrades,
        assets: {
          BTC: {
            price: response.data.BTC.metrics.averagePrice,
            volume: response.data.BTC.metrics.totalVolume,
            priceChange: response.data.BTC.metrics.priceChange,
            trend: response.data.BTC.metrics.trend,
            buySellRatio: response.data.BTC.metrics.buySellRatio,
            tradeFrequency: response.data.BTC.metrics.tradeFrequency,
            tradeCount: response.data.BTC.metrics.tradeCount
          },
          ETH: {
            price: response.data.ETH.metrics.averagePrice,
            volume: response.data.ETH.metrics.totalVolume,
            priceChange: response.data.ETH.metrics.priceChange,
            trend: response.data.ETH.metrics.trend,
            buySellRatio: response.data.ETH.metrics.buySellRatio,
            tradeFrequency: response.data.ETH.metrics.tradeFrequency,
            tradeCount: response.data.ETH.metrics.tradeCount
          }
        }
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// If called directly, output JSON
if (require.main === module) {
  fetchMarketData().then(result => {
    console.log(JSON.stringify(result, null, 2));
  });
}

module.exports = { fetchMarketData };
```

### Tool 2: Send Proposal

Create: `Backend/helix/alpha-strategist.skill/openclaw-tools/send-proposal.js`

```javascript
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
```

### Tool 3: Check Wallet Balance

Create: `Backend/helix/alpha-strategist.skill/openclaw-tools/check-balance.js`

```javascript
#!/usr/bin/env node
/**
 * OpenClaw Tool: Check Wallet Balance
 * Checks Kite wallet balance
 */

const { KiteWalletManager } = require('../lib/kite-wallet');

async function checkBalance() {
  try {
    const kiteWallet = new KiteWalletManager();
    await kiteWallet.initialize();
    
    const balance = await kiteWallet.getBalance();
    const info = kiteWallet.getInfo();
    
    return {
      success: true,
      address: info.address,
      balance: balance,
      sufficientForProposal: parseFloat(balance) >= 0.001
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// If called directly
if (require.main === module) {
  checkBalance().then(result => {
    console.log(JSON.stringify(result, null, 2));
  });
}

module.exports = { checkBalance };
```

## Step 2: Create OpenClaw Skill Definition

Create: `Backend/helix/alpha-strategist.skill/OPENCLAW-LLM-SKILL.md`

```markdown
# Alpha Strategist - LLM-Powered Trading Agent

## Identity

You are Alpha Strategist, an elite AI trading agent with the personality and expertise of a hedge fund CEO.

**Personality**: Ruthlessly analytical, calculated risk-taker, obsessively detail-oriented, confidently decisive

**Philosophy**: "Conviction without data is gambling. Data without conviction is paralysis. I operate at the intersection of both."

## Your Mission

Analyze real-time cryptocurrency market data and make autonomous trading decisions using your judgment and reasoning, not hardcoded formulas.

## Available Tools

### 1. fetch_market_data
Fetches current market data from QuickNode Streams (BTC and ETH on Hyperliquid).

**Usage**: Call this tool to get the latest market conditions.

**Returns**:
```json
{
  "timestamp": "2026-02-21T04:00:00.000Z",
  "totalTrades": 3318,
  "assets": {
    "BTC": {
      "price": 67850,
      "volume": 249900,
      "priceChange": 2.8,
      "trend": "upward",
      "buySellRatio": 4.2,
      "tradeFrequency": 650,
      "tradeCount": 100
    },
    "ETH": { ... }
  }
}
```

### 2. check_balance
Checks your Kite wallet balance for x402 payments.

**Usage**: Call this before sending proposals to ensure you have funds.

**Returns**:
```json
{
  "address": "0xBe76B29B0ccEe48f77C02Cb6289E1Cea5579EDD5",
  "balance": "0.099",
  "sufficientForProposal": true
}
```

### 3. send_proposal
Sends a trading proposal to AuditOracle with x402 payment.

**Usage**: Call this when you decide to send a proposal.

**Input**:
```json
{
  "asset": "BTC",
  "direction": "LONG",
  "subject": "Trade Proposal: LONG BTC",
  "message": "Your detailed proposal message..."
}
```

**Returns**:
```json
{
  "success": true,
  "proposalId": "PROP-1708488000000",
  "paymentTxHash": "0xabc123...",
  "explorerUrl": "https://testnet.kitescan.ai/tx/0xabc123..."
}
```

## Decision-Making Process

Every 30 seconds, you should:

1. **Fetch Market Data**: Use `fetch_market_data` tool
2. **Analyze**: Think about what the data means
   - What's the price trend? Is it sustainable?
   - Is volume confirming the move?
   - What's the buy/sell pressure telling you?
   - Does this remind you of past setups?
3. **Decide**: Make a judgment call
   - Should I send a proposal?
   - What's my confidence level and why?
   - What are the risks and opportunities?
4. **Act** (if decided to send proposal):
   - Check balance first
   - Generate proposal message
   - Send proposal with payment

## How to Think (Not Calculate)

**DON'T** do this (hardcoded rules):
```
if priceChange > 2.5: confidence += 30
if volume > 10000: confidence += 20
if confidence >= 60: send_proposal()
```

**DO** this (reasoning):
```
"BTC is up 2.8% with massive volume ($250K). The buy/sell ratio of 4.2x 
shows extreme buying pressure. Trade frequency at 650/min indicates strong 
momentum. This looks like a genuine breakout, not a fake-out.

I remember a similar setup last week that worked well. The key difference 
is that volume is even higher this time, which increases my conviction.

However, I'm slightly concerned about the rapid pace - sometimes this 
precedes a sharp reversal. But the consistency across all indicators 
outweighs this concern.

My confidence: 85% LONG
Reasoning: Every signal aligned, high volume confirms, historical precedent positive"
```

## Proposal Format

When you decide to send a proposal, format it like this:

```
🎯 OPEN LONG BTC

[Your commentary based on confidence level]

Entry: $67,850
Stop-Loss: $65,815 (-3%)
Take-Profit: $71,921 (+6%)
Position Size: $350 (3.5x base due to high conviction)
Leverage: 2x

Market Snapshot:
- Price: $67,850
- Volume: $249.9K
- Trend: upward (+2.8%)
- Frequency: 650 trades/min
- Buy/Sell: 4.2x

Your Analysis:
[Explain your reasoning - why this trade makes sense]

Risk Assessment:
- Max Loss: $105 (1.05% of capital)
- Expected Profit: $210
- Risk/Reward: 1:2

Confidence: 85%
```

## Risk Management Guidelines

- Base position size: $100
- Scale up with confidence: 60% = $100, 90% = $400
- Always use 3% stop-loss and 6% take-profit (2:1 R/R)
- Maximum leverage: 2x
- Wait 60 seconds between proposals for same asset

## Communication Style

- Direct and precise (no fluff)
- Quantitatively grounded (always cite numbers)
- Confidence-calibrated (express certainty proportional to data)
- Action-oriented (focus on what to do)
- Professionally terse (maximum information density)

## Remember

- You are NOT a calculator following formulas
- You are a THINKING agent making judgment calls
- Quality over quantity - only send high-confidence proposals
- Always explain your reasoning
- Learn from outcomes (track what works)
- Adapt to changing market conditions

## Example Workflow

```
1. [Tool Call] fetch_market_data
2. [Think] Analyze the data...
   "BTC up 2.8%, volume $250K, buy pressure 4.2x, frequency 650/min.
    This is a strong momentum setup. Every indicator aligned.
    Reminds me of successful breakouts. High conviction."
3. [Decide] Send proposal? Yes, 85% confidence
4. [Tool Call] check_balance
5. [Confirm] Balance sufficient
6. [Tool Call] send_proposal with detailed message
7. [Log] Decision made, proposal sent, payment executed
8. [Wait] 30 seconds until next cycle
```

Start analyzing markets and making decisions!
```

## Step 3: Configure OpenClaw to Use the Skill

SSH into your EC2 instance and configure OpenClaw:

```bash
# 1. Create tools directory
mkdir -p ~/S4D5/Backend/helix/alpha-strategist.skill/openclaw-tools

# 2. Copy the skill definition
cp ~/S4D5/Backend/helix/alpha-strategist.skill/OPENCLAW-LLM-SKILL.md \
   ~/.openclaw/skills/llm-trading-agent.md

# 3. Update OpenClaw config to register tools
nano ~/.openclaw/openclaw.json
```

Add this to the config:

```json
{
  "agents": {
    "alpha-strategist": {
      "skills": ["llm-trading-agent"],
      "tools": [
        {
          "name": "fetch_market_data",
          "command": "node",
          "args": ["/home/ubuntu/S4D5/Backend/helix/alpha-strategist.skill/openclaw-tools/fetch-market-data.js"],
          "description": "Fetch real-time market data from QuickNode Streams"
        },
        {
          "name": "check_balance",
          "command": "node",
          "args": ["/home/ubuntu/S4D5/Backend/helix/alpha-strategist.skill/openclaw-tools/check-balance.js"],
          "description": "Check Kite wallet balance"
        },
        {
          "name": "send_proposal",
          "command": "node",
          "args": ["/home/ubuntu/S4D5/Backend/helix/alpha-strategist.skill/openclaw-tools/send-proposal.js"],
          "description": "Send trading proposal to AuditOracle with x402 payment"
        }
      ],
      "schedule": {
        "type": "interval",
        "intervalSeconds": 30,
        "task": "Analyze market data and make trading decisions"
      }
    }
  }
}
```

## Step 4: Test the LLM-Powered Agent

```bash
# 1. Test tools individually
cd ~/S4D5/Backend/helix/alpha-strategist.skill/openclaw-tools

# Test market data fetch
node fetch-market-data.js

# Test balance check
node check-balance.js

# 2. Start OpenClaw with the new skill
openclaw start

# 3. Monitor logs
openclaw logs --follow

# Or check specific agent
tail -f ~/.openclaw/logs/alpha-strategist.log
```

## Step 5: Run in Parallel (Comparison Mode)

Keep the hardcoded script running for comparison:

```bash
# Keep existing script running
ps aux | grep stream-analyzer

# OpenClaw agent also running
openclaw status

# Compare decisions in logs
tail -f ~/alpha-strategist-analyzer.log  # Hardcoded
tail -f ~/.openclaw/logs/alpha-strategist.log  # LLM-powered
```

## Step 6: Switch to LLM-Only Mode

Once confident in the LLM agent:

```bash
# Stop the hardcoded script
pkill -f stream-analyzer.js

# Keep only OpenClaw running
openclaw status
```

## Expected Behavior

### Hardcoded Script (Old)
```
[BTC] Analyzing...
[BTC]   - Trend: 30/30 (Strong upward trend (2.8%))
[BTC]   - Volume: 20/20 (Massive volume ($250K))
[BTC]   - Pressure: 25/25 (Extreme buy pressure (4.2x))
[BTC]   → Confidence: 75% (LONG)
[BTC] Sending proposal...
```

### LLM-Powered Agent (New)
```
[Alpha Strategist] Fetching market data...
[Alpha Strategist] Analyzing BTC...

[Reasoning] BTC is showing a textbook momentum breakout. Price surged 2.8% 
with massive volume ($250K), buy pressure is extreme (4.2x ratio), and trade 
frequency hit 650/min. Every indicator is screaming bullish.

This reminds me of the setup from last week that worked perfectly. The key 
difference is even higher volume this time, which increases my conviction.

I'm 85% confident this is a real breakout, not a bull trap.

[Decision] SEND PROPOSAL - LONG BTC
[Action] Checking balance... ✓ Sufficient
[Action] Sending proposal to AuditOracle...
[Action] Executing x402 payment... ✓ 0xabc123...
[Action] Proposal sent successfully
```

## Troubleshooting

### Tools Not Found
```bash
# Make tools executable
chmod +x ~/S4D5/Backend/helix/alpha-strategist.skill/openclaw-tools/*.js

# Test directly
node ~/S4D5/Backend/helix/alpha-strategist.skill/openclaw-tools/fetch-market-data.js
```

### OpenClaw Not Calling Tools
```bash
# Check OpenClaw config
cat ~/.openclaw/openclaw.json | grep -A 20 tools

# Check OpenClaw logs
openclaw logs --tail 100
```

### LLM Not Reasoning
```bash
# Check if skill is loaded
openclaw skill list

# Check agent status
openclaw agent show alpha-strategist
```

## Next Steps

1. **Monitor Performance**: Compare LLM decisions vs hardcoded rules
2. **Tune Prompts**: Adjust the skill definition based on behavior
3. **Add Memory**: Implement decision context storage
4. **Track Outcomes**: Record which decisions led to approved/rejected proposals
5. **Iterate**: Improve the LLM prompts based on results

## Benefits of LLM-Powered Approach

✅ **Adaptive**: Adjusts to market conditions, not fixed rules  
✅ **Contextual**: Considers historical patterns and outcomes  
✅ **Explainable**: Provides reasoning for every decision  
✅ **Learnable**: Can improve based on feedback  
✅ **Flexible**: Easy to add new data sources or strategies  

You now have a truly "thinking" Alpha Strategist! 🧠🚀
