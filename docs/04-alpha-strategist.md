# Alpha Strategist

The trading strategy bot that analyzes markets and generates proposals.

## Overview

Alpha Strategist is an OpenClaw bot that:
- Polls Railway webhook every 30 seconds for market data
- Analyzes BTC and ETH using hardcoded rules OR LLM reasoning
- Generates trading proposals when confident
- Sends proposals to AuditOracle via Nerve-Cord
- Pays 0.001 KITE per proposal (x402 protocol)

## Two Modes

### Mode 1: Hardcoded Rules (Current)

**Script**: `scripts/stream-analyzer.js`

**Logic**:
```javascript
confidence = 0
if (priceChange > 2.5%) confidence += 30
if (buySellRatio > 3.0) confidence += 25
if (volume > 10000) confidence += 20
if (tradeFrequency > 100) confidence += 15

if (confidence >= 60%) sendProposal()
```

**Pros**: Fast, predictable, no API costs
**Cons**: Fixed rules, doesn't learn

### Mode 2: LLM-Powered (New)

**Script**: `scripts/llm-agent.js`

**Logic**:
```javascript
1. Fetch market data
2. Load decision history
3. Call OpenAI API with:
   - Current market data
   - Historical context
   - Personality guidelines
4. LLM analyzes and decides
5. If LLM says "send_proposal":
   - Generate proposal
   - Send to Nerve-Cord
   - Pay 0.001 KITE
6. Record decision for learning
```

**Pros**: Adaptive, learns from outcomes, natural language reasoning
**Cons**: API costs, slower (2-3s per analysis)

## File Structure

```
Backend/helix/alpha-strategist.skill/
├── scripts/
│   ├── stream-analyzer.js       # Hardcoded agent
│   ├── llm-agent.js              # LLM agent (NEW)
│   ├── init-wallet.js            # Wallet setup
│   └── test-x402-payment.js      # Payment testing
├── lib/
│   ├── market-data-fetcher.js    # Fetches from Railway
│   ├── decision-context.js       # Tracks history
│   ├── llm-agent.js              # LLM reasoning engine
│   ├── proposal-executor.js      # Sends proposals
│   ├── payment-manager.js        # Manages payments
│   └── kite-wallet.js            # Kite AI wallet
├── openclaw-tools/
│   ├── fetch-market-data.js      # OpenClaw tool
│   ├── check-balance.js          # OpenClaw tool
│   └── send-proposal.js          # OpenClaw tool
├── data/
│   ├── decision-context.json     # Decision history
│   └── proposal-queue.json       # Failed proposals
├── ALPHA-STRATEGIST-IDENTITY.md  # Personality
├── STREAMING-ANALYSIS-SKILL.md   # OpenClaw skill
└── package.json
```

## Configuration

**Environment Variables** (`.env`):
```bash
WEBHOOK_API_URL=https://s4d5-production-f42d.up.railway.app/dashboard
ANALYSIS_INTERVAL=30000           # 30 seconds
MIN_CONFIDENCE=60                 # Minimum confidence to send proposal
AUDIT_ORACLE_ADDRESS=0xF3bbD5682e671CdcDC42f52bDdecCB6a35D53aE1
KITE_RPC=https://rpc-testnet.gokite.ai/
KITE_CHAIN_ID=2368
OPENAI_API_KEY=sk-your-key-here  # For LLM mode
```

## OpenClaw Setup

**Cron Job**:
```bash
openclaw cron add \
  --name "stream-analyzer" \
  --schedule "*/30 * * * * *" \
  --command "node ~/S4D5/Backend/helix/alpha-strategist.skill/scripts/stream-analyzer.js"
```

**Skills**:
- `~/.openclaw/skills/streaming-analysis.md`
- `~/.openclaw/agents/alpha-strategist/identity.md`

## Running

### Hardcoded Mode
```bash
# Via OpenClaw (recommended)
openclaw cron run stream-analyzer

# Or directly
node scripts/stream-analyzer.js
```

### LLM Mode
```bash
# Update OpenClaw cron to use llm-agent.js
openclaw cron update stream-analyzer \
  --command "node ~/S4D5/Backend/helix/alpha-strategist.skill/scripts/llm-agent.js"

# Or run directly
node scripts/llm-agent.js
```

## Testing

```bash
cd ~/S4D5/Backend/helix/alpha-strategist.skill

# Test market data fetch
node openclaw-tools/fetch-market-data.js

# Test balance check
node openclaw-tools/check-balance.js

# Test payment
node scripts/test-x402-payment.js

# Test full cycle (hardcoded)
node scripts/stream-analyzer.js

# Test LLM agent
node scripts/llm-agent.js
```

## Monitoring

```bash
# Check if running
ps aux | grep stream-analyzer

# View logs
tail -f /var/log/alpha-strategist.log

# Check proposals sent
cd ~/S4D5/nerve-cord
npm run check

# Check Kite balance
node openclaw-tools/check-balance.js

# Check decision history (LLM mode)
cat data/decision-context.json
```

## Proposal Format

```
Subject: Trade Proposal: LONG BTC

🎯 OPEN LONG BTC
Leverage: 2x
Entry Price: 67655.10
Stop-Loss: 65665.45 (-3%)
Take-Profit: 71714.41 (+6%)
Position Size: 100
Confidence: 75.0%

Market Data:
- Price: 67655.10
- Volume: 159.6K
- Trend: bullish (+2.8%)
- Trade Frequency: 388 trades/min
- Buy/Sell Ratio: 4.2x

Reasons:
- Strong upward trend: +2.8%
- Extreme buy pressure: 4.2x
- High volume confirms bullish: 159.6K
- High momentum: 388 trades/min

Timestamp: 2026-02-21T05:00:00.000Z
```

## Troubleshooting

**No proposals being sent:**
- Lower `MIN_CONFIDENCE` to 30 for testing
- Check webhook: `curl $WEBHOOK_API_URL`
- Check logs for errors

**Payment failures:**
- Check balance: `node openclaw-tools/check-balance.js`
- Fund wallet: https://faucet.gokite.ai
- Check RPC: `curl $KITE_RPC`

**LLM errors:**
- Verify `OPENAI_API_KEY` is set
- Check API quota: https://platform.openai.com/account/usage
- Check logs for API errors

---

Next: [AuditOracle](./05-audit-oracle.md)
