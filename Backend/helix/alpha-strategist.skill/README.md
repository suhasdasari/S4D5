<<<<<<< HEAD
# Alpha Strategist - Autonomous AI Trading Agent

An autonomous AI trading agent built with OpenClaw that analyzes real-time market data and makes disciplined trading decisions.

## Overview

Alpha Strategist is an AI agent with the personality of a hedge fund CEO that:
- Analyzes real-time trade data from QuickNode Streams (BTC & ETH on Hyperliquid)
- Calculates confidence scores (0-100%) using 5 signal types
- Generates trading proposals when confidence ≥ 60%
- Sends proposals to AuditOracle via Nerve-Cord for review
- Executes x402 micropayments on Kite AI (0.001 KITE per proposal)
- Operates 24/7 autonomously with disciplined risk management
=======
# Alpha Strategist Skill

Market analysis skill for the S4D5 Alpha Strategist bot. Analyzes Hyperliquid markets and Polymarket sentiment to generate intelligent trade proposals.

## Quick Start

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Run analysis
npm run analyze
```

## What It Does

The Alpha Strategist skill:

1. **Fetches real-time market data** from QuickNode Hyperliquid Hypercore API
2. **Analyzes sentiment** from Polymarket prediction markets
3. **Calculates dynamic leverage** (1x-3x) based on sentiment strength
4. **Generates trade proposals** with LONG/SHORT direction
5. **Manages position lifecycle** (open/close decisions)
6. **Sets automatic risk controls** (stop-loss -3%, take-profit +5%)
>>>>>>> Og_integration

## Architecture

```
<<<<<<< HEAD
QuickNode Streams → Railway Webhook → Alpha Strategist (OpenClaw) 
                                            ↓
                                      Analyzes & Decides
                                            ↓
                                    Sends Proposal via Nerve-Cord
                                            ↓
                                      AuditOracle Reviews
                                            ↓
                                    ExecutionHand Executes
```

## Features

- **Real-time Analysis**: Polls market data every 30 seconds
- **Multi-signal Scoring**: Trend (30pts), Volume (20pts), Pressure (25pts), Momentum (15pts), Consistency (10pts)
- **Confidence-based Sizing**: Position size scales with confidence (60% = $100, 90% = $400)
- **Risk Management**: 3% stop-loss, 6% take-profit (2:1 R/R), max 2x leverage
- **Disciplined Execution**: Only acts when confidence ≥ 60%
- **Multi-chain Identity**: Same wallet across Base, Kite, Hedera, 0G
- **Payment-for-Service**: x402 micropayments for agent coordination

## Prerequisites

- AWS EC2 instance (Ubuntu 22.04+)
- Node.js 18+ and npm
- OpenClaw installed
- QuickNode account (for Streams API)
- Railway account (for webhook hosting)
- Kite AI testnet tokens (from faucet)

## Quick Start

### 1. Fork and Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/S4D5.git
cd S4D5
```

### 2. Install OpenClaw

```bash
npm install -g openclaw
openclaw init
```

Follow OpenClaw setup wizard to create your agent.

### 3. Set Up QuickNode Streams

1. Sign up at [QuickNode](https://www.quicknode.com/)
2. Create a Stream for Hyperliquid Hypercore Mainnet
3. Select "Trades" dataset
4. Filter for BTC and ETH only
5. Note your Stream ID

### 4. Deploy Webhook to Railway

```bash
cd quicknode-webhook
```

1. Sign up at [Railway](https://railway.app/)
2. Create new project
3. Deploy from GitHub (connect your fork)
4. Set environment variable: `PORT=8080`
5. Note your Railway URL (e.g., `https://your-app.up.railway.app`)

### 5. Configure QuickNode Stream

In QuickNode dashboard:
1. Go to your Stream settings
2. Add webhook destination: `https://your-app.up.railway.app/webhook/quicknode-streams`
3. Enable the stream

### 6. Install Dependencies

```bash
cd Backend/helix/alpha-strategist.skill
npm install
```

### 7. Initialize Wallets

```bash
# Create Base wallet
node scripts/init-wallet.js

# Create Kite wallet (uses same private key)
node scripts/init-kite-wallet.js

# Note your wallet address
cat config/wallet.json | grep address
```

### 8. Fund Kite Wallet

Visit https://faucet.gokite.ai and paste your wallet address to get testnet KITE tokens.

### 9. Configure Environment

```bash
cd ~/S4D5
nano .env
```

Add:
```bash
# QuickNode Streams
WEBHOOK_API_URL=https://your-app.up.railway.app/dashboard

# Analysis Configuration
ANALYSIS_INTERVAL=30000
MIN_CONFIDENCE=60

# Agent Addresses
AUDIT_ORACLE_ADDRESS=0xYourAuditOracleAddress
EXECUTION_HAND_ADDRESS=0xYourExecutionHandAddress

# Kite AI
KITE_RPC=https://rpc-testnet.gokite.ai/
KITE_CHAIN_ID=2368

# Nerve-Cord
NERVE_CORD_PATH=/home/ubuntu/S4D5/nerve-cord
```

### 10. Test the Analyzer

```bash
cd Backend/helix/alpha-strategist.skill
node scripts/stream-analyzer.js
```

You should see:
```
🚀 Alpha Strategist Stream Analyzer Started
📡 Polling: https://your-app.up.railway.app/dashboard
[Wallet] ✓ Kite wallet initialized
[Kite] Balance: 5.0 KITE
[2026-02-21T...] 🔄 Polling dashboard API...
[Data] Received: 128 trades (BTC: 100, ETH: 28)
[BTC] Analyzing...
[BTC]   → Confidence: 70% (LONG)
```

Press Ctrl+C to stop.

### 11. Run as Background Service

```bash
nohup node scripts/stream-analyzer.js > ~/alpha-strategist-analyzer.log 2>&1 &
```

### 12. Monitor Logs

```bash
tail -f ~/alpha-strategist-analyzer.log
```

## Configuration

### Confidence Thresholds

Edit `scripts/stream-analyzer.js`:

```javascript
const MIN_CONFIDENCE = 60; // Minimum confidence to act (60-95%)
```

### Risk Management

Edit `scripts/stream-analyzer.js`:

```javascript
const baseSize = 100;        // Base position size ($100)
const stopLossPercent = 3;   // Stop-loss (3%)
const takeProfitPercent = 6; // Take-profit (6%)
```

### Polling Interval

Edit `.env`:

```bash
ANALYSIS_INTERVAL=30000  # Poll every 30 seconds
```

## Personality & Identity

The Alpha Strategist has a distinct personality defined in `ALPHA-STRATEGIST-IDENTITY.md`:

- **Archetype**: Elite hedge fund CEO
- **Traits**: Ruthlessly analytical, calculated risk-taker, obsessively detail-oriented
- **Philosophy**: "Conviction without data is gambling. Data without conviction is paralysis."
- **Communication**: Direct, precise, quantitatively grounded

You can customize the personality by editing this file.

## Signal Scoring System

The analyzer uses 5 signal types to calculate confidence:

1. **Trend Signal (30 points)**: Price momentum analysis
   - Strong trend (>2.5%): 30 points
   - Moderate trend (>1.5%): 20 points
   - Weak trend (>0.5%): 10 points

2. **Volume Signal (20 points)**: Trading volume strength
   - Massive volume (>3x threshold): 20 points
   - High volume (>1.5x threshold): 15 points
   - Good volume (>threshold): 10 points

3. **Pressure Signal (25 points)**: Buy/sell ratio analysis
   - Extreme pressure (>3.0x or <0.33x): 25 points
   - Strong pressure (>2.0x or <0.5x): 15 points

4. **Momentum Signal (15 points)**: Trade frequency
   - High momentum (>200/min): 15 points
   - Good momentum (>100/min): 10 points
   - Moderate momentum (>50/min): 5 points

5. **Consistency Bonus (10 points)**: Signal alignment
   - Trend and pressure aligned: 10 points

**Total Confidence = Sum of all signals (0-100%)**

## Proposal Format

When confidence ≥ 60%, Alpha Strategist generates proposals like:

```
🎯 OPEN LONG BTC

This is a textbook momentum breakout. Price surged 2.8% with massive volume ($45K), 
buy pressure is extreme (4.2x ratio), and trade frequency hit 650/min.

Entry: $67,850
Stop-Loss: $65,815 (-3%)
Take-Profit: $71,921 (+6%)
Position Size: $350 (3.5x base due to high conviction)
Leverage: 2x

Market Snapshot:
- Price: $67,850
- Volume: $45.0K
- Trend: upward (+2.8%)
- Frequency: 650 trades/min
- Buy/Sell: 4.2x

Signal Breakdown:
- Trend: 30/30 (Strong upward trend (2.8%))
- Volume: 20/20 (Massive volume ($45.0K))
- Pressure: 25/25 (Extreme buy pressure (4.2x))
- Momentum: 15/15 (High momentum (650/min))
- Consistency: 10/10 (Trend and pressure aligned)

Total Confidence: 100%

Risk Assessment:
- Max Loss: $105 (1.05% of capital)
- Expected Profit: $210
- Risk/Reward: 1:2

Timestamp: 2026-02-21T04:30:00.000Z
Source: QuickNode Streams (Hyperliquid)
```

## File Structure

```
Backend/helix/alpha-strategist.skill/
├── ALPHA-STRATEGIST-IDENTITY.md    # Personality & decision framework
├── STREAMING-ANALYSIS-SKILL.md     # Skill description
├── ADD-SKILL-TO-OPENCLAW.md        # Setup guide
├── scripts/
│   ├── stream-analyzer.js          # Main autonomous analyzer
│   ├── init-wallet.js              # Wallet initialization
│   ├── init-kite-wallet.js         # Kite wallet setup
│   └── send-proposals.js           # Proposal sender
├── lib/
│   ├── wallet.js                   # Base wallet manager
│   └── kite-wallet.js              # Kite wallet manager
└── config/
    └── wallet.json                 # Wallet configuration
```

## Monitoring

### Check if Running

```bash
ps aux | grep stream-analyzer
```

### View Logs

```bash
tail -f ~/alpha-strategist-analyzer.log
```

### Check Kite Payments

Visit: https://testnet.kitescan.ai/address/YOUR_WALLET_ADDRESS

### Check Webhook Data

```bash
curl https://your-app.up.railway.app/dashboard | jq
=======
┌─────────────────────────────────────────────────────────────┐
│                    Alpha Strategist Bot                      │
│                  (OpenClaw Framework)                        │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            │ executes skill
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  Alpha Strategist Skill                      │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Market Data  │  │  Sentiment   │  │  Position    │     │
│  │   Fetcher    │  │   Analyzer   │  │   Tracker    │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
│                            ↓                                 │
│                  ┌──────────────────┐                       │
│                  │ Analyze & Propose │                       │
│                  └──────────────────┘                       │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            │ JSON proposals
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      Nerve-Cord                              │
│                  (Message Broker)                            │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   ExecutionHand Bot                          │
│              (Executes trades on Hyperliquid)                │
└─────────────────────────────────────────────────────────────┘
```

## Components

### 1. Market Data Fetcher (`scripts/fetch-market-data.js`)

Fetches real-time data from QuickNode Hyperliquid Hypercore API:
- Current price
- 24h volume
- Price changes
- Orderbook depth
- Max leverage available

### 2. Sentiment Analyzer (`scripts/fetch-sentiment.js`)

Analyzes Polymarket prediction markets:
- Filters markets by keywords (crypto, bitcoin, etc.)
- Extracts bullish/bearish signals
- Calculates weighted aggregate sentiment (-1 to +1)
- Considers market volume for reliability

### 3. Position Tracker (`scripts/track-positions.js`)

Manages open positions state:
- Stores positions in JSON file
- Tracks entry price, leverage, direction
- Monitors position age
- Provides CRUD operations

### 4. Analysis Engine (`scripts/analyze-and-propose.js`)

Main logic that combines everything:
- Calculates leverage (1x-3x) based on sentiment
- Generates OPEN proposals for new opportunities
- Generates CLOSE proposals for existing positions
- Applies risk management rules

## Configuration

Edit `.env` file:

```bash
# QuickNode API (already configured)
QUICKNODE_BASE_URL=https://orbital-compatible-wave.hype-mainnet.quiknode.pro/.../hypercore
QUICKNODE_API_KEY=your_api_key

# Target assets to analyze
TARGET_ASSETS=BTC,ETH

# Minimum confidence to open position (0-100)
MIN_CONFIDENCE=60

# Maximum position size in USD
MAX_POSITION_SIZE=10000

# Risk multiplier (0.0-1.0)
RISK_MULTIPLIER=0.5

# Position management
TAKE_PROFIT_PCT=5
STOP_LOSS_PCT=3
MAX_POSITION_AGE_HOURS=24
```

## Usage

### Run Full Analysis

```bash
npm run analyze
```

Output:
```json
{
  "timestamp": 1708380000000,
  "proposals": [
    {
      "action": "OPEN",
      "asset": "BTC",
      "direction": "LONG",
      "leverage": 3,
      "size": 5000,
      "entryPrice": 50000,
      "stopLoss": 48500,
      "takeProfit": 52500,
      "confidence": 75
    }
  ]
}
```

### Individual Components

```bash
# Fetch market data for BTC
npm run fetch-market BTC

# Fetch sentiment for crypto
npm run fetch-sentiment crypto bitcoin

# List open positions
npm run track-positions list
```

## Deployment on EC2

### Instance Details
- Instance ID: `i-0a88dc577111e995e` (AS4)
- IP: `34.239.119.14`
- Type: t3.large, Ubuntu 24.04
- SSH: `ssh -i ~/Downloads/AS4.pem ubuntu@34.239.119.14`

### Setup Steps

1. **SSH into EC2:**
```bash
ssh -i ~/Downloads/AS4.pem ubuntu@34.239.119.14
```

2. **Clone repository:**
```bash
cd ~
git clone https://github.com/suhasdasari/S4D5.git
cd S4D5/Backend/helix/alpha-strategist.skill
```

3. **Install dependencies:**
```bash
npm install
```

4. **Configure environment:**
```bash
cp .env.example .env
nano .env  # Edit with your credentials
```

5. **Test the skill:**
```bash
npm run analyze
```

6. **Set up cron job (run every 5 minutes):**
```bash
crontab -e
```

Add:
```
*/5 * * * * cd ~/S4D5/Backend/helix/alpha-strategist.skill && npm run send-proposals >> ~/logs/alpha-strategist.log 2>&1
```

7. **Create log directory:**
```bash
mkdir -p ~/logs
```

## Integration with OpenClaw Bot

The Alpha Strategist bot already has Nerve-Cord integration via npm scripts. The skill provides a wrapper script that:

1. **Runs analysis** (`analyze-and-propose.js`)
2. **Formats proposals** into natural language
3. **Sends to ExecutionHand** via Nerve-Cord automatically

### Send Proposals (Full Workflow)

```bash
npm run send-proposals
```

This will:
- Analyze markets and sentiment
- Generate trade proposals
- Format them as messages
- Send to `execution-hand` via Nerve-Cord

### Manual Testing

```bash
# Test analysis only (no sending)
npm run analyze

# Send proposals to ExecutionHand
npm run send-proposals
```

## Leverage Rules

| Sentiment | Direction | Leverage | Confidence |
|-----------|-----------|----------|------------|
| >= 0.7    | LONG      | 3x       | Very Strong |
| 0.4-0.7   | LONG      | 2x       | Moderate    |
| 0.0-0.4   | LONG      | 1x       | Weak        |
| -0.4-0.0  | SHORT     | 1x       | Weak        |
| -0.7--0.4 | SHORT     | 2x       | Moderate    |
| <= -0.7   | SHORT     | 3x       | Very Strong |

## Position Closing Logic

Positions are proposed for closure when:

1. **Sentiment Reversal**: Direction changes (LONG→SHORT or SHORT→LONG)
2. **Max Age**: Position open >= 24 hours
3. **Early Profit + Weak Sentiment**: 3%+ profit but sentiment weakened 40%+

ExecutionHand automatically closes at:
- Stop-loss: -3%
- Take-profit: +5%

## Monitoring

Check logs:
```bash
tail -f ~/logs/alpha-strategist.log
```

Monitor proposals:
```bash
watch -n 60 'npm run analyze'
>>>>>>> Og_integration
```

## Troubleshooting

<<<<<<< HEAD
### Script Not Running

```bash
# Check for errors
cat ~/alpha-strategist-analyzer.log

# Restart
pkill -f stream-analyzer.js
cd ~/S4D5/Backend/helix/alpha-strategist.skill
nohup node scripts/stream-analyzer.js > ~/alpha-strategist-analyzer.log 2>&1 &
```

### No Data from Webhook

```bash
# Test webhook
curl https://your-app.up.railway.app/health

# Check QuickNode Stream status in dashboard
```

### Wallet Issues

```bash
# Check balance
cd ~/S4D5/Backend/helix/alpha-strategist.skill
node -e "const {KiteWalletManager}=require('./lib/kite-wallet');(async()=>{const w=new KiteWalletManager();await w.initialize();console.log('Balance:',await w.getBalance(),'KITE');})()"

# Fund at https://faucet.gokite.ai
```

### Payment Failures

```bash
# Check logs for payment errors
grep "payment" ~/alpha-strategist-analyzer.log

# Verify AUDIT_ORACLE_ADDRESS in .env
```

## Customization

### Add New Data Sources

Edit `scripts/stream-analyzer.js` and add new data fetching in the `analyzeMarkets()` function.

### Modify Signal Weights

Edit the `calculateConfidence()` function in `scripts/stream-analyzer.js`:

```javascript
// Adjust max points for each signal
const trendMaxPoints = 30;
const volumeMaxPoints = 20;
const pressureMaxPoints = 25;
const momentumMaxPoints = 15;
const consistencyMaxPoints = 10;
```

### Change Trading Assets

Currently supports BTC and ETH. To add more assets:

1. Update QuickNode Stream filters
2. Modify the asset loop in `analyzeMarkets()`:

```javascript
for (const asset of ['BTC', 'ETH', 'SOL']) {
  // ...
}
```

## Security

- **Private Keys**: Never commit wallet.json to git (already in .gitignore)
- **Environment Variables**: Keep .env file secure
- **API Keys**: Store QuickNode and Railway keys securely
- **Wallet Permissions**: Use separate wallets for testing vs production

## Performance

- **Latency**: ~30 second polling interval (configurable)
- **Memory**: ~80MB RAM usage
- **CPU**: Minimal (<1% on modern EC2)
- **Network**: ~1KB per poll request

## Roadmap

Future enhancements:
- [ ] On-chain metrics integration
- [ ] Social sentiment analysis
- [ ] Macro indicators (Fed rates, inflation)
- [ ] Advanced order book analysis
- [ ] Machine learning models
- [ ] Multi-exchange support
- [ ] Portfolio optimization
- [ ] Performance tracking dashboard

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

See [LICENSE](../../../LICENSE) file for details.

## Support

- GitHub Issues: https://github.com/suhasdasari/S4D5/issues
- Documentation: See guides in this directory
- OpenClaw Docs: https://docs.openclaw.ai

## Credits

Built with:
- [OpenClaw](https://openclaw.ai) - AI agent framework
- [QuickNode](https://www.quicknode.com/) - Real-time blockchain data
- [Railway](https://railway.app/) - Webhook hosting
- [Kite AI](https://gokite.ai) - x402 micropayments
- [Hyperliquid](https://hyperliquid.xyz/) - Trading data source

---

**Disclaimer**: This is experimental software for educational purposes. Use at your own risk. Not financial advice.
=======
**No proposals generated:**
- Lower MIN_CONFIDENCE in .env
- Check Polymarket API is accessible
- Verify QuickNode API credentials

**API errors:**
- Check QuickNode API credits
- Verify network connectivity
- Check API endpoint URLs

**Position tracking errors:**
- Ensure `~/S4D5/data/positions/` directory exists
- Check file permissions
- Verify JSON format in positions file

## Development

Run tests:
```bash
# Test each component
node scripts/fetch-market-data.js BTC
node scripts/fetch-sentiment.js crypto
node scripts/track-positions.js list
node scripts/analyze-and-propose.js
```

## License

MIT
>>>>>>> Og_integration
