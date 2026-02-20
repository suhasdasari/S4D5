# Alpha Strategist Market Analysis Skill

Market analysis skill for the Alpha Strategist OpenClaw bot. Analyzes Hyperliquid market data and Polymarket sentiment to generate trade proposals with dynamic leverage (1x-3x) for LONG/SHORT positions.

## Capabilities

- Real-time market data from QuickNode Hyperliquid Hypercore API
- Sentiment analysis from Polymarket prediction markets
- Dynamic leverage calculation (1x-3x) based on sentiment strength
- Position lifecycle management (open/close decisions)
- Automatic stop-loss and take-profit recommendations
- Sentiment reversal detection for early position closure

## Configuration

Copy `.env.example` to `.env` and configure:

```bash
# QuickNode Hyperliquid API
QUICKNODE_BASE_URL=https://orbital-compatible-wave.hype-mainnet.quiknode.pro/03c818e464f2f0d1fd06ba9d5b4f374c05dd99b4/hypercore
QUICKNODE_API_KEY=03c818e464f2f0d1fd06ba9d5b4f374c05dd99b4

# Polymarket API (no auth required)
POLYMARKET_BASE_URL=https://gamma-api.polymarket.com

# Nerve-Cord Configuration
NERVE_TOKEN=your_nerve_token_here
NERVE_SERVER=https://s4d5-production.up.railway.app
BOTNAME=alpha-strategist

# Analysis Parameters
TARGET_ASSETS=BTC,ETH
MIN_CONFIDENCE=60
MAX_POSITION_SIZE=10000
RISK_MULTIPLIER=0.5

# Position Management
TAKE_PROFIT_PCT=5
STOP_LOSS_PCT=3
MAX_POSITION_AGE_HOURS=24
```

## Installation

```bash
cd Backend/helix/alpha-strategist.skill
npm install
```

## Usage

### Run Full Analysis

```bash
npm run analyze
# or
node scripts/analyze-and-propose.js
```

Output format:
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
      "confidence": 75,
      "sentimentScore": 0.75
    }
  ],
  "openPositions": 2
}
```

### Individual Components

```bash
# Fetch market data
npm run fetch-market BTC

# Fetch sentiment
npm run fetch-sentiment crypto bitcoin

# Track positions
npm run track-positions list
```

## Leverage Calculation Rules

Sentiment score ranges from -1 (very bearish) to +1 (very bullish):

| Sentiment Score | Direction | Leverage | Confidence |
|----------------|-----------|----------|------------|
| >= 0.7         | LONG      | 3x       | Very Strong |
| 0.4 to 0.7     | LONG      | 2x       | Moderate    |
| 0.0 to 0.4     | LONG      | 1x       | Weak        |
| -0.4 to 0.0    | SHORT     | 1x       | Weak        |
| -0.7 to -0.4   | SHORT     | 2x       | Moderate    |
| <= -0.7        | SHORT     | 3x       | Very Strong |

## Position Management Workflow

### Opening Positions

1. Fetch market data and sentiment for target assets
2. Calculate aggregate sentiment score from Polymarket signals
3. If confidence >= MIN_CONFIDENCE (default 60%):
   - Calculate direction (LONG/SHORT) and leverage (1x-3x)
   - Calculate position size based on confidence and risk parameters
   - Set automatic stop-loss (-3%) and take-profit (+5%)
   - Generate OPEN proposal

### Closing Positions

Positions are proposed for closure when:

1. **Sentiment Reversal**: Direction changes (LONG→SHORT or SHORT→LONG)
2. **Max Age Reached**: Position open for >= 24 hours
3. **Early Profit + Weak Sentiment**: 
   - Position has 3%+ profit (but below take-profit)
   - Sentiment has weakened by 40%+ from entry

### Automatic Closures (ExecutionHand)

ExecutionHand automatically closes positions at:
- Stop-loss: -3% loss
- Take-profit: +5% profit

## Bot Integration

The Alpha Strategist bot should run this skill on a schedule (e.g., every 5 minutes):

```bash
# Example cron job (every 5 minutes)
*/5 * * * * cd ~/S4D5/Backend/helix/alpha-strategist.skill && node scripts/analyze-and-propose.js >> ~/logs/alpha-strategist.log 2>&1
```

The bot reads the JSON output and:
1. Formats proposals into natural language
2. Sends proposals to ExecutionHand via Nerve-Cord
3. Updates position tracking when trades are executed

## Data Flow

```
QuickNode Hypercore API → Market Data (price, volume, orderbook)
                              ↓
Polymarket API → Sentiment Signals → Aggregate Sentiment Score
                              ↓
                    Leverage Calculator
                              ↓
                    Position Manager
                              ↓
                    Trade Proposals (JSON)
                              ↓
                    Alpha Strategist Bot
                              ↓
                    Nerve-Cord Message
                              ↓
                    ExecutionHand Bot
```

## Example Bot Commands

The bot can expose these commands to other agents:

- `!analyze` - Run full market analysis
- `!sentiment <asset>` - Check sentiment for specific asset
- `!positions` - List open positions
- `!market <asset>` - Get current market data

## Error Handling

- QuickNode API failures: Retry with exponential backoff
- Polymarket API failures: Use cached sentiment (max 10 minutes old)
- Position file corruption: Backup and recreate from Nerve-Cord history
- Invalid proposals: Log and skip, continue with next asset

## Testing

```bash
# Test market data fetch
node scripts/fetch-market-data.js BTC

# Test sentiment fetch
node scripts/fetch-sentiment.js crypto bitcoin

# Test position tracking
node scripts/track-positions.js list

# Test full analysis
node scripts/analyze-and-propose.js BTC,ETH
```

## Monitoring

Key metrics to monitor:
- Proposal generation rate (should be ~1-3 per analysis cycle)
- Sentiment data freshness (< 5 minutes old)
- Market data latency (< 2 seconds)
- Position file integrity (valid JSON, no duplicates)
- API error rates (< 5%)

## Troubleshooting

**No proposals generated:**
- Check MIN_CONFIDENCE setting (lower if too restrictive)
- Verify sentiment data is being fetched (check Polymarket API)
- Ensure target assets are available on Hyperliquid

**Incorrect leverage:**
- Verify sentiment score calculation in fetch-sentiment.js
- Check Polymarket market selection (keywords may need adjustment)

**Position tracking errors:**
- Check POSITIONS_FILE path and permissions
- Verify JSON format in positions file
- Ensure directory exists: `~/S4D5/data/positions/`
