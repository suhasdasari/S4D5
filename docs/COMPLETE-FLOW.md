# Complete System Flow - QuickNode to ExecutionHand

This document explains the complete end-to-end flow of a trade in the S4D5 system.

## Overview

```
QuickNode → Railway → Alpha Strategist → Nerve-Cord → AuditOracle → Nerve-Cord → ExecutionHand
```

## Detailed Flow

### Step 1: Data Collection (QuickNode → Railway)

**QuickNode Streams**:
- Monitors Hyperliquid blockchain
- Captures BTC and ETH trade events
- Sends to Railway webhook in real-time

**Railway Webhook**:
- Receives trade events
- Aggregates data:
  - Price (average)
  - Volume (total)
  - Price change (%)
  - Buy/sell ratio
  - Trade frequency (trades/min)
  - Trade count
- Exposes via REST API: `GET /dashboard`

**Data Format**:
```json
{
  "timestamp": "2026-02-21T05:00:00.000Z",
  "stats": { "totalTrades": 150 },
  "BTC": {
    "metrics": {
      "averagePrice": "67655.10",
      "totalVolume": "159626.14",
      "priceChange": "2.8",
      "trend": "bullish",
      "buySellRatio": "4.2",
      "tradeFrequency": "388.53",
      "tradeCount": 100
    }
  },
  "ETH": { "metrics": { ... } }
}
```

---

### Step 2: Analysis (Alpha Strategist)

**Location**: EC2 Instance #1

**OpenClaw Trigger**:
```bash
# Cron job runs every 30 seconds
openclaw cron run stream-analyzer
  ↓
Executes: node scripts/stream-analyzer.js
```

**Process**:

1. **Fetch Data**:
```javascript
const response = await fetch('https://s4d5-production-f42d.up.railway.app/dashboard');
const data = await response.json();
```

2. **Analyze** (Hardcoded Mode):
```javascript
let confidence = 0;

// Price trend (30%)
if (priceChange > 2.5%) confidence += 30;

// Buy/sell pressure (25%)
if (buySellRatio > 3.0) confidence += 25;

// Volume (20%)
if (volume > 10000) confidence += 20;

// Trade frequency (15%)
if (tradeFrequency > 100) confidence += 15;

// Consistency (10%)
if (trend === 'bullish' && buySellRatio > 1.5) confidence += 10;
```

3. **Decision**:
```javascript
if (confidence >= 60) {
  // Generate proposal
  const proposal = {
    action: 'OPEN',
    asset: 'BTC',
    direction: 'LONG',
    leverage: 2,
    entryPrice: 67655.10,
    stopLoss: 65665.45,  // -3%
    takeProfit: 71714.41, // +6%
    size: 100,
    confidence: 75
  };
  
  // Send to Nerve-Cord
  await sendProposal(proposal);
  
  // Pay 0.001 KITE
  await sendPayment('0xAuditOracleAddress', '0.001');
}
```

**Output**:
- Proposal sent to Nerve-Cord
- Payment transaction on Kite AI
- Logs written

---

### Step 3: Message Passing (Nerve-Cord)

**Location**: Railway or EC2

**Process**:

1. **Alpha Strategist sends**:
```bash
npm run send audit-oracle "Trade Proposal: LONG BTC" "proposal details"
```

2. **Nerve-Cord stores**:
```json
// data/messages.json
{
  "id": "msg-123",
  "from": "alpha-strategist",
  "to": "audit-oracle",
  "subject": "Trade Proposal: LONG BTC",
  "body": "🎯 OPEN LONG BTC\nLeverage: 2x\n...",
  "status": "pending",
  "timestamp": 1708491000000
}
```

3. **AuditOracle polls**:
```bash
# poll.js runs every 10 seconds
node nerve-cord/poll.js
  ↓
Checks: GET /messages?to=audit-oracle&status=pending
  ↓
If messages found:
  execSync('openclaw cron run audit-oracle-check')
```

---

### Step 4: Risk Review (AuditOracle)

**Location**: EC2 Instance #2

**OpenClaw Trigger**:
```bash
# Triggered by poll.js when messages arrive
openclaw cron run audit-oracle-check
  ↓
Executes: node scripts/review-proposal.js
```

**Process**:

1. **Read Proposal**:
```javascript
const messages = await nerveCord.getMessages('audit-oracle', 'pending');
const proposal = parseProposal(messages[0].body);
```

2. **Risk Analysis**:
```javascript
// Check position size
if (proposal.size > MAX_POSITION_SIZE) return reject('Position too large');

// Check leverage
if (proposal.leverage > MAX_LEVERAGE) return reject('Leverage too high');

// Check stop-loss
const stopLossPercent = Math.abs((proposal.stopLoss - proposal.entryPrice) / proposal.entryPrice);
if (stopLossPercent < 0.02) return reject('Stop-loss too tight');

// Check market conditions
if (proposal.confidence < 70 && proposal.leverage > 1) return reject('Low confidence with leverage');

// Approve
return approve(proposal);
```

3. **Decision**:
```javascript
if (approved) {
  await nerveCord.send('execution-hand', 'Approved: LONG BTC', proposalDetails);
  await nerveCord.markAsSeen(message.id);
} else {
  await nerveCord.send('alpha-strategist', 'Rejected: ' + reason, details);
  await nerveCord.markAsSeen(message.id);
}
```

**Output**:
- Approved proposal sent to ExecutionHand
- OR rejection sent back to Alpha Strategist
- Message marked as seen

---

### Step 5: Message Passing (Nerve-Cord Again)

Same process as Step 3, but:
- **From**: audit-oracle
- **To**: execution-hand
- **Subject**: "Approved: LONG BTC"

---

### Step 6: Trade Execution (ExecutionHand)

**Location**: EC2 Instance #3

**OpenClaw Trigger**:
```bash
# Triggered by poll.js when approved proposals arrive
openclaw cron run execution-hand-execute
  ↓
Executes: node scripts/execute-trade.js
```

**Process**:

1. **Read Approved Proposal**:
```javascript
const messages = await nerveCord.getMessages('execution-hand', 'pending');
const proposal = parseProposal(messages[0].body);
```

2. **Connect to Exchange**:
```javascript
// Example: Hyperliquid DEX
const exchange = new HyperliquidClient(API_KEY, API_SECRET);
await exchange.connect();
```

3. **Place Order**:
```javascript
const order = await exchange.placeOrder({
  symbol: 'BTC-USD',
  side: 'BUY',  // LONG
  type: 'MARKET',
  quantity: proposal.size,
  leverage: proposal.leverage
});

console.log('Order placed:', order.id);
```

4. **Set Stop-Loss and Take-Profit**:
```javascript
// Stop-loss order
await exchange.placeOrder({
  symbol: 'BTC-USD',
  side: 'SELL',
  type: 'STOP_MARKET',
  quantity: proposal.size,
  stopPrice: proposal.stopLoss
});

// Take-profit order
await exchange.placeOrder({
  symbol: 'BTC-USD',
  side: 'SELL',
  type: 'LIMIT',
  quantity: proposal.size,
  price: proposal.takeProfit
});
```

5. **Monitor Position**:
```javascript
// Track position in real-time
setInterval(async () => {
  const position = await exchange.getPosition('BTC-USD');
  
  if (position.pnl < -MAX_LOSS) {
    await exchange.closePosition('BTC-USD');
    await nerveCord.send('alpha-strategist', 'Position closed: Stop-loss hit', details);
  }
  
  if (position.pnl > TARGET_PROFIT) {
    await exchange.closePosition('BTC-USD');
    await nerveCord.send('alpha-strategist', 'Position closed: Take-profit hit', details);
  }
}, 5000); // Check every 5 seconds
```

6. **Report Outcome**:
```javascript
// When position closes
await nerveCord.send('alpha-strategist', 'Trade completed', {
  asset: 'BTC',
  direction: 'LONG',
  entryPrice: 67655.10,
  exitPrice: 71714.41,
  pnl: +4059.31,
  pnlPercent: +6.0,
  duration: '2h 15m'
});
```

**Output**:
- Trade executed on exchange
- Position monitored
- Outcome reported back to Alpha Strategist

---

### Step 7: Learning (Alpha Strategist)

**Process**:

1. **Receive Outcome**:
```javascript
const outcome = await nerveCord.getMessages('alpha-strategist', 'pending');
```

2. **Update Context** (LLM Mode Only):
```javascript
await decisionContext.addOutcome({
  decisionId: 'decision-123',
  outcome: 'success',
  pnl: +4059.31,
  pnlPercent: +6.0,
  exitReason: 'take-profit',
  duration: '2h 15m'
});

await decisionContext.save();
```

3. **Use in Future Decisions**:
```javascript
// Next analysis cycle
const context = await decisionContext.getContextForPrompt(10);
// Context includes: "Previous LONG BTC at similar conditions: +6.0% profit"

const analysis = await llm.analyzeAndDecide(marketData, context);
// LLM learns from past outcomes
```

---

## Complete Timeline Example

```
00:00:00 - QuickNode detects BTC trade
00:00:01 - Railway aggregates data
00:00:30 - Alpha Strategist polls Railway
00:00:31 - Alpha Strategist analyzes (confidence: 75%)
00:00:32 - Alpha Strategist sends proposal to Nerve-Cord
00:00:33 - Alpha Strategist pays 0.001 KITE
00:00:40 - AuditOracle polls Nerve-Cord
00:00:41 - AuditOracle reviews proposal (approved)
00:00:42 - AuditOracle sends to ExecutionHand
00:00:50 - ExecutionHand polls Nerve-Cord
00:00:51 - ExecutionHand places order on exchange
00:00:52 - ExecutionHand sets stop-loss and take-profit
02:15:00 - Take-profit hit (+6.0%)
02:15:01 - ExecutionHand closes position
02:15:02 - ExecutionHand reports outcome to Alpha Strategist
02:15:30 - Alpha Strategist receives outcome (next poll cycle)
02:15:31 - Alpha Strategist updates decision context
```

**Total Time**: ~2 hours 15 minutes (mostly position holding time)
**Agent Processing Time**: ~22 seconds (from analysis to execution)

---

## Key Points

1. **Asynchronous**: Each agent operates independently
2. **Polling-based**: Agents poll Nerve-Cord for messages
3. **OpenClaw-managed**: All agents run on OpenClaw framework
4. **Resilient**: Failed messages are queued and retried
5. **Auditable**: All messages and decisions are logged
6. **Paid**: x402 micropayments ensure accountability

---

Next: [Troubleshooting](./13-troubleshooting.md)
