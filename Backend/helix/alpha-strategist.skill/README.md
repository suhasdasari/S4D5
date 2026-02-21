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

## Architecture

```
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
```

## Troubleshooting

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
