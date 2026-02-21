# Design Document: Alpha Strategist Market Analysis Bot

## Overview

The Alpha Strategist Market Analysis Bot is an autonomous trading agent built on the OpenClaw framework that analyzes cryptocurrency market data and generates trade proposals for the S4D5 AI Hedge Fund. As the first agent in a 3-agent council system (Alpha Strategist → AuditOracle → ExecutionHand), it serves as the market intelligence and opportunity identification layer.

The bot operates on configurable intervals (default: 5 minutes), fetching real-time market data from QuickNode's Hyperliquid API and sentiment signals from Polymarket's prediction markets. It uses its configured LLM to reason about market conditions, identify trading opportunities, and generate structured trade proposals that are sent to the AuditOracle agent for risk review via the Nerve-Cord messaging system.

### Key Characteristics

- **Autonomous Operation**: Runs continuously on configurable intervals without human intervention
- **Multi-Source Analysis**: Combines price/volume data (QuickNode) with sentiment signals (Polymarket)
- **LLM-Powered Reasoning**: Uses configured LLM to generate natural language explanations for trade decisions
- **Resilient Design**: Graceful degradation with retry logic, fallbacks, and comprehensive error handling
- **Observable**: Logs all activities to Nerve-Cord dashboard for monitoring and debugging
- **Encrypted Communication**: All inter-agent messages use RSA-2048 + AES-256-GCM hybrid encryption

## Architecture

### High-Level System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    Alpha Strategist Bot                         │
│                   (OpenClaw Framework)                          │
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌─────────────────┐ │
│  │   Analysis   │───▶│   Market     │───▶│   Proposal      │ │
│  │   Scheduler  │    │   Analyzer   │    │   Generator     │ │
│  └──────────────┘    └──────────────┘    └─────────────────┘ │
│         │                    │                     │           │
│         │                    ▼                     ▼           │
│         │            ┌──────────────┐    ┌─────────────────┐ │
│         │            │  LLM Client  │    │  Nerve-Cord     │ │
│         │            │  (Reasoning) │    │  Client         │ │
│         │            └──────────────┘    └─────────────────┘ │
│         │                    │                     │           │
│         ▼                    │                     │           │
│  ┌──────────────┐           │                     │           │
│  │   Config     │           │                     │           │
│  │   Manager    │           │                     │           │
│  └──────────────┘           │                     │           │
│         │                    │                     │           │
└─────────┼────────────────────┼─────────────────────┼───────────┘
          │                    │                     │
          ▼                    ▼                     ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  Environment    │  │  External APIs  │  │  Nerve-Cord     │
│  Variables      │  │                 │  │  Broker         │
│  (.env)         │  │  • QuickNode    │  │  (Railway)      │
│                 │  │  • Polymarket   │  │                 │
└─────────────────┘  └─────────────────┘  └─────────────────┘
                              │                     │
                              ▼                     ▼
                     ┌─────────────────┐  ┌─────────────────┐
                     │  Hyperliquid    │  │  AuditOracle    │
                     │  Market Data    │  │  Agent          │
                     └─────────────────┘  └─────────────────┘
```

### Data Flow

1. **Initialization Phase**
   - Load configuration from environment variables
   - Validate required credentials (QuickNode API key, Polymarket API key, Nerve-Cord token)
   - Register bot with Nerve-Cord broker (name + public key)
   - Initialize analysis scheduler with configured interval

2. **Analysis Cycle** (Triggered every `ANALYSIS_INTERVAL` seconds)
   - Send heartbeat to Nerve-Cord
   - Log cycle start to dashboard
   - Fetch market data from QuickNode (parallel requests for price, volume, orderbook)
   - Fetch sentiment data from Polymarket (with fallback if unavailable)
   - Analyze data using LLM (generate trading signals with reasoning)
   - Generate trade proposals for high-confidence signals (>60)
   - Send proposals to AuditOracle via Nerve-Cord
   - Update priority status based on signal confidence
   - Check inbox for AuditOracle responses
   - Log cycle completion

3. **Error Handling Flow**
   - API failure → Retry with exponential backoff (30s, 60s, 120s)
   - Rate limit → Wait for reset time, then retry
   - 3 consecutive failures → Skip operation, continue to next task
   - All errors logged to Nerve-Cord dashboard

### Deployment Architecture

The bot runs as an OpenClaw agent on a Virtual Machine with:
- **Runtime**: Node.js (for Nerve-Cord npm scripts) + OpenClaw framework
- **Persistence**: None required (stateless operation)
- **Networking**: Outbound HTTPS to QuickNode, Polymarket, and Nerve-Cord broker
- **Scheduling**: Internal timer-based loop (no external cron required)
- **Monitoring**: Nerve-Cord dashboard at `https://s4d5-production.up.railway.app/stats`

## Components and Interfaces

### 1. Analysis Scheduler

**Responsibility**: Orchestrates the analysis cycle on configurable intervals.

**Interface**:
```typescript
class AnalysisScheduler {
  constructor(config: BotConfig)
  start(): void
  stop(): void
  private runCycle(): Promise<void>
}
```

**Behavior**:
- Initializes timer with `ANALYSIS_INTERVAL` from config
- Executes complete analysis cycle on each timer expiration
- Resets timer after cycle completion
- Continues indefinitely until explicitly stopped
- Catches and logs all errors to prevent crashes

### 2. Market Data Fetcher

**Responsibility**: Fetches real-time market data from QuickNode Hyperliquid API.

**Interface**:
```typescript
class MarketDataFetcher {
  constructor(apiKey: string, baseUrl: string)
  fetchMarketData(asset: string): Promise<MarketData>
  private fetchPrice(asset: string): Promise<PriceData>
  private fetchVolume(asset: string): Promise<VolumeData>
  private fetchOrderBook(asset: string): Promise<OrderBookData>
}
```

**QuickNode API Integration**:
- **Base URL**: `https://api.quicknode.com/hyperliquid/v1`
- **Authentication**: API key in `X-API-Key` header
- **Endpoints**:
  - `GET /markets/{asset}/ticker` - Current price and 24h change
  - `GET /markets/{asset}/volume` - 24h volume data
  - `GET /markets/{asset}/orderbook?depth=20` - Order book depth (top 20 levels)
- **Rate Limits**: 100 requests/minute (implement token bucket)
- **Retry Strategy**: Exponential backoff (30s, 60s, 120s) for 5xx errors

**Error Handling**:
- Network errors → Retry with backoff
- 429 Rate Limit → Wait for `Retry-After` header, then retry
- 4xx Client errors → Log and skip (invalid request)
- 5xx Server errors → Retry with backoff
- 3 consecutive failures → Return error, skip cycle

### 3. Sentiment Data Fetcher

**Responsibility**: Fetches prediction market sentiment from Polymarket API.

**Interface**:
```typescript
class SentimentDataFetcher {
  constructor(apiKey: string, baseUrl: string)
  fetchSentiment(keywords: string[]): Promise<SentimentData>
  private searchMarkets(query: string): Promise<Market[]>
  private extractSignals(markets: Market[]): SentimentSignal[]
}
```

**Polymarket API Integration**:
- **Base URL**: `https://gamma-api.polymarket.com`
- **Authentication**: API key in `Authorization: Bearer` header
- **Endpoints**:
  - `GET /markets?active=true&closed=false` - Active prediction markets
  - `GET /markets/{id}` - Market details with current odds
- **Rate Limits**: 60 requests/minute
- **Retry Strategy**: Same as QuickNode (exponential backoff)

**Sentiment Extraction Logic**:
- Search for markets related to crypto keywords (e.g., "Bitcoin", "ETH", "crypto crash")
- Extract probability signals (e.g., 75% chance of "BTC above $50k" = bullish)
- Normalize to sentiment scores: -1 (bearish) to +1 (bullish)
- Aggregate multiple market signals by weighted average

**Error Handling**:
- API failures → Log warning, continue analysis without sentiment data
- No matching markets → Return neutral sentiment (0)
- Invalid data → Log error, return neutral sentiment

### 4. Market Analyzer

**Responsibility**: Analyzes market data and generates trading signals using LLM reasoning.

**Interface**:
```typescript
class MarketAnalyzer {
  constructor(llmClient: LLMClient, config: AnalysisConfig)
  analyze(marketData: MarketData, sentiment: SentimentData): Promise<TradingSignal[]>
  private analyzeTrends(marketData: MarketData): TrendAnalysis
  private analyzeVolume(marketData: MarketData): VolumeAnalysis
  private analyzeLiquidity(marketData: MarketData): LiquidityAnalysis
  private generateSignalWithLLM(context: AnalysisContext): Promise<TradingSignal>
}
```

**Analysis Process**:

1. **Trend Analysis** (Technical)
   - Calculate 24h price change percentage
   - Identify support/resistance levels from orderbook
   - Detect momentum (accelerating vs decelerating)

2. **Volume Analysis** (Technical)
   - Compare current volume to 24h average
   - Flag unusual volume spikes (>2x average)
   - Assess volume trend (increasing/decreasing)

3. **Liquidity Analysis** (Technical)
   - Calculate bid-ask spread
   - Measure orderbook depth (total volume in top 20 levels)
   - Assess market impact for target trade sizes

4. **LLM Reasoning** (Synthesis)
   - Combine technical analysis + sentiment data
   - Generate natural language reasoning
   - Produce trading signal (BUY/SELL/HOLD)
   - Calculate confidence score (0-100)

**LLM Integration**:
- Uses OpenClaw's configured LLM (accessed via framework)
- Prompt template includes: market context, technical indicators, sentiment, risk factors
- Response parsed for: signal type, confidence, reasoning text
- Fallback to technical-only analysis if LLM fails

### 5. Proposal Generator

**Responsibility**: Creates structured JSON trade proposals from trading signals.

**Interface**:
```typescript
class ProposalGenerator {
  constructor(config: ProposalConfig)
  generateProposal(signal: TradingSignal, marketData: MarketData): TradeProposal | null
  private calculateQuantity(signal: TradingSignal, config: ProposalConfig): number
  private calculateTargetPrice(signal: TradingSignal, marketData: MarketData): number
  private assessRisk(signal: TradingSignal, marketData: MarketData): RiskAssessment
  private estimateReturn(signal: TradingSignal, marketData: MarketData): number
}
```

**Proposal Creation Logic**:
- **Threshold**: Only create proposals for signals with confidence ≥ 60
- **Quantity Calculation**: Based on confidence score and configured max position size
  - Formula: `quantity = maxPositionSize * (confidence / 100) * riskMultiplier`
- **Target Price**: 
  - BUY: Current ask + slippage buffer (0.5%)
  - SELL: Current bid - slippage buffer (0.5%)
- **Risk Assessment**: Categorize as LOW/MEDIUM/HIGH based on:
  - Liquidity (spread, depth)
  - Volatility (24h price range)
  - Confidence score
- **Expected Return**: Estimated profit based on target price and historical patterns

### 6. Nerve-Cord Client

**Responsibility**: Handles all inter-agent communication via Nerve-Cord npm scripts.

**Interface**:
```typescript
class NerveCordClient {
  constructor(config: NerveCordConfig)
  sendProposal(to: string, proposal: TradeProposal): Promise<void>
  checkInbox(): Promise<Message[]>
  logActivity(text: string, tags?: string[]): Promise<void>
  updatePriority(level: 'high' | 'normal' | 'low'): Promise<void>
  sendHeartbeat(): Promise<void>
}
```

**Implementation Details**:
- **Send Message**: Executes `cd ~/S4D5/nerve-cord && npm run send <recipient> "<subject>" "<message>"`
  - Recipient: "audit-oracle" (or "AuditOracle", "Susmitha" - auto-mapped)
  - Subject: "Trade Proposal: {asset} {action}"
  - Message: JSON.stringify(proposal)
- **Check Inbox**: Executes `cd ~/S4D5/nerve-cord && npm run check`
  - Parses JSON output
  - Filters for messages from AuditOracle
  - Marks messages as seen after processing
- **Log Activity**: Executes `cd ~/S4D5/nerve-cord && npm run log "<text>" [tags]`
  - Tags: ["analysis", "proposal", "error", etc.]
- **Update Priority**: Executes `cd ~/S4D5/nerve-cord && npm run prio "<text>"`
  - High: "URGENT: High-confidence trade opportunity ({asset})"
  - Normal: "Trade proposal ready for review"
  - Low: "No trading opportunities identified"
- **Heartbeat**: Automatically sent by npm scripts on each command execution

**Error Handling**:
- Command execution failures → Retry up to 3 times with exponential backoff
- JSON parse errors → Log error, skip message
- Network timeouts → Retry with backoff

### 7. Configuration Manager

**Responsibility**: Loads and validates configuration from environment variables.

**Interface**:
```typescript
class ConfigManager {
  static load(): BotConfig
  static validate(config: BotConfig): ValidationResult
}

interface BotConfig {
  // API Credentials
  quicknodeApiKey: string
  polymarketApiKey: string
  nerveCordToken: string
  nerveCordServer: string
  botName: string
  
  // Analysis Parameters
  analysisInterval: number  // seconds
  minConfidenceThreshold: number  // 0-100
  targetAssets: string[]  // e.g., ["BTC-USD", "ETH-USD"]
  
  // Trading Parameters
  maxPositionSize: number  // USD
  riskMultiplier: number  // 0-1
  
  // Retry Configuration
  maxRetries: number
  retryBackoffBase: number  // seconds
}
```

**Environment Variables**:
```bash
# Required
QUICKNODE_API_KEY=<key>
POLYMARKET_API_KEY=<key>
NERVE_TOKEN=<token>
NERVE_SERVER=https://s4d5-production.up.railway.app
BOTNAME=alpha-strategist

# Optional (with defaults)
ANALYSIS_INTERVAL=300  # 5 minutes
MIN_CONFIDENCE=60
TARGET_ASSETS=BTC-USD,ETH-USD
MAX_POSITION_SIZE=10000  # $10k
RISK_MULTIPLIER=0.5
MAX_RETRIES=3
RETRY_BACKOFF_BASE=30
```

**Validation Rules**:
- All required variables must be present (non-empty strings)
- `ANALYSIS_INTERVAL` must be ≥ 60 seconds (prevent API abuse)
- `MIN_CONFIDENCE` must be 0-100
- `MAX_POSITION_SIZE` must be > 0
- `RISK_MULTIPLIER` must be 0-1
- If validation fails, log detailed error and exit with code 1

### 8. Error Handler

**Responsibility**: Centralized error handling, retry logic, and logging.

**Interface**:
```typescript
class ErrorHandler {
  static async withRetry<T>(
    operation: () => Promise<T>,
    config: RetryConfig
  ): Promise<T>
  
  static handleApiError(error: ApiError): void
  static handleNerveCordError(error: Error): void
  static logError(context: string, error: Error): void
}

interface RetryConfig {
  maxRetries: number
  backoffBase: number  // seconds
  backoffMultiplier: number  // exponential factor
  retryableErrors: ErrorType[]
}
```

**Retry Strategy**:
- **Exponential Backoff**: delay = backoffBase * (backoffMultiplier ^ attemptNumber)
  - Attempt 1: 30s
  - Attempt 2: 60s
  - Attempt 3: 120s
- **Retryable Errors**: Network errors, 5xx server errors, rate limits
- **Non-Retryable Errors**: 4xx client errors (except 429), authentication failures
- **Max Retries**: 3 attempts, then fail gracefully

**Logging Strategy**:
- All errors logged to Nerve-Cord dashboard with context
- Error format: `[{timestamp}] {context}: {errorMessage} (attempt {n}/{max})`
- Critical errors (config validation, startup failures) → Exit with non-zero code
- Operational errors (API failures, analysis errors) → Log and continue

## Data Models

### MarketData

```typescript
interface MarketData {
  asset: string          // e.g., "BTC-USD"
  timestamp: number      // Unix timestamp (ms)
  price: PriceData
  volume: VolumeData
  orderbook: OrderBookData
}

interface PriceData {
  current: number        // Current price
  change24h: number      // 24h price change (%)
  high24h: number        // 24h high
  low24h: number         // 24h low
}

interface VolumeData {
  volume24h: number      // 24h volume (USD)
  volumeAvg: number      // Average volume
  volumeRatio: number    // Current/Average ratio
}

interface OrderBookData {
  bids: OrderLevel[]     // Top 20 bid levels
  asks: OrderLevel[]     // Top 20 ask levels
  spread: number         // Bid-ask spread (%)
  depth: number          // Total volume in top 20 levels
}

interface OrderLevel {
  price: number
  quantity: number
}
```

### SentimentData

```typescript
interface SentimentData {
  timestamp: number
  signals: SentimentSignal[]
  aggregateScore: number  // -1 (bearish) to +1 (bullish)
}

interface SentimentSignal {
  marketId: string
  question: string        // e.g., "Will BTC reach $50k by EOY?"
  probability: number     // 0-1
  sentiment: number       // -1 to +1
  volume: number          // Market volume (USD)
  weight: number          // Signal weight in aggregation
}
```

### TradingSignal

```typescript
interface TradingSignal {
  asset: string
  action: 'BUY' | 'SELL' | 'HOLD'
  confidence: number      // 0-100
  reasoning: string       // Natural language explanation
  timestamp: number
  technicalFactors: {
    trend: 'bullish' | 'bearish' | 'neutral'
    volumeAnomaly: boolean
    liquidityScore: number  // 0-100
  }
  sentimentFactors: {
    score: number         // -1 to +1
    confidence: number    // 0-100
  }
}
```

### TradeProposal

```typescript
interface TradeProposal {
  id: string              // Unique proposal ID (UUID)
  asset: string
  action: 'buy' | 'sell'
  quantity: number        // Number of units
  targetPrice: number     // Target execution price
  reasoning: string       // Natural language explanation
  confidence: number      // 0-100
  riskAssessment: RiskAssessment
  expectedReturn: number  // Estimated profit (USD)
  timestamp: number
  proposedBy: string      // "alpha-strategist"
}

interface RiskAssessment {
  level: 'LOW' | 'MEDIUM' | 'HIGH'
  factors: {
    liquidityRisk: number    // 0-100
    volatilityRisk: number   // 0-100
    sentimentRisk: number    // 0-100
  }
  maxLoss: number         // Maximum potential loss (USD)
}
```

### NerveCordMessage

```typescript
interface NerveCordMessage {
  id: string
  from: string
  to: string
  subject: string
  body: string            // Encrypted payload (or plaintext for logs)
  encrypted: boolean
  timestamp: number
  status: 'pending' | 'seen' | 'burned'
}

interface ProposalResponse {
  proposalId: string
  status: 'approved' | 'rejected'
  reason?: string
  modifications?: Partial<TradeProposal>
  timestamp: number
  reviewedBy: string      // "audit-oracle"
}
```


## API Integration Specifications

### QuickNode Hyperliquid API

**Base URL**: `https://api.quicknode.com/hyperliquid/v1`

**Authentication**:
```http
X-API-Key: {QUICKNODE_API_KEY}
Content-Type: application/json
```

**Endpoints**:

1. **Get Market Ticker**
   ```http
   GET /markets/{asset}/ticker
   ```
   **Response**:
   ```json
   {
     "asset": "BTC-USD",
     "price": 45230.50,
     "change24h": 2.34,
     "high24h": 45800.00,
     "low24h": 44100.00,
     "timestamp": 1704067200000
   }
   ```

2. **Get Volume Data**
   ```http
   GET /markets/{asset}/volume
   ```
   **Response**:
   ```json
   {
     "asset": "BTC-USD",
     "volume24h": 1234567890.50,
     "volumeAvg": 1100000000.00,
     "timestamp": 1704067200000
   }
   ```

3. **Get Order Book**
   ```http
   GET /markets/{asset}/orderbook?depth=20
   ```
   **Response**:
   ```json
   {
     "asset": "BTC-USD",
     "bids": [
       {"price": 45230.00, "quantity": 1.5},
       {"price": 45229.50, "quantity": 2.3}
     ],
     "asks": [
       {"price": 45231.00, "quantity": 1.2},
       {"price": 45231.50, "quantity": 1.8}
     ],
     "timestamp": 1704067200000
   }
   ```

**Rate Limiting**:
- **Limit**: 100 requests per minute per API key
- **Strategy**: Token bucket algorithm
  - Bucket capacity: 100 tokens
  - Refill rate: 100 tokens/minute (1.67 tokens/second)
  - Request cost: 1 token per endpoint call
- **Headers**: Response includes `X-RateLimit-Remaining` and `X-RateLimit-Reset`
- **429 Handling**: Wait until `Retry-After` timestamp, then retry

**Error Responses**:
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Retry after 45 seconds.",
    "retryAfter": 45
  }
}
```

### Polymarket API

**Base URL**: `https://gamma-api.polymarket.com`

**Authentication**:
```http
Authorization: Bearer {POLYMARKET_API_KEY}
Content-Type: application/json
```

**Endpoints**:

1. **List Active Markets**
   ```http
   GET /markets?active=true&closed=false&limit=50
   ```
   **Response**:
   ```json
   {
     "markets": [
       {
         "id": "0x123...",
         "question": "Will Bitcoin reach $50,000 by end of 2024?",
         "outcomes": ["Yes", "No"],
         "outcomePrices": [0.65, 0.35],
         "volume": 125000.50,
         "liquidity": 50000.00,
         "endDate": "2024-12-31T23:59:59Z"
       }
     ]
   }
   ```

2. **Get Market Details**
   ```http
   GET /markets/{marketId}
   ```
   **Response**:
   ```json
   {
     "id": "0x123...",
     "question": "Will Bitcoin reach $50,000 by end of 2024?",
     "outcomes": ["Yes", "No"],
     "outcomePrices": [0.65, 0.35],
     "volume": 125000.50,
     "liquidity": 50000.00,
     "endDate": "2024-12-31T23:59:59Z",
     "tags": ["crypto", "bitcoin", "price"]
   }
   ```

**Rate Limiting**:
- **Limit**: 60 requests per minute per API key
- **Strategy**: Same token bucket as QuickNode (60 capacity, 1 token/second refill)
- **429 Handling**: Exponential backoff (30s, 60s, 120s)

**Sentiment Extraction Algorithm**:
```typescript
function extractSentiment(market: Market): SentimentSignal {
  const question = market.question.toLowerCase()
  const yesPrice = market.outcomePrices[0]
  
  // Determine if question is bullish or bearish
  const isBullish = question.includes('reach') || 
                    question.includes('above') || 
                    question.includes('increase')
  const isBearish = question.includes('crash') || 
                    question.includes('below') || 
                    question.includes('decrease')
  
  // Calculate sentiment score (-1 to +1)
  let sentiment = 0
  if (isBullish) {
    sentiment = (yesPrice - 0.5) * 2  // 0.5 → 0, 1.0 → +1
  } else if (isBearish) {
    sentiment = (0.5 - yesPrice) * 2  // 0.5 → 0, 0.0 → +1 (inverse)
  }
  
  // Weight by market volume (higher volume = more reliable)
  const weight = Math.min(market.volume / 100000, 1.0)
  
  return {
    marketId: market.id,
    question: market.question,
    probability: yesPrice,
    sentiment,
    volume: market.volume,
    weight
  }
}
```

### Nerve-Cord Messaging API

**Base URL**: `https://s4d5-production.up.railway.app`

**Authentication**:
```http
Authorization: Bearer {NERVE_TOKEN}
```

**Communication via npm Scripts** (Preferred Method):

The bot uses npm scripts that wrap the HTTP API:

1. **Send Message**:
   ```bash
   cd ~/S4D5/nerve-cord && npm run send "audit-oracle" "Trade Proposal: BTC-USD buy" '{"asset":"BTC-USD","action":"buy",...}'
   ```
   - Automatically fetches recipient's public key
   - Encrypts message with RSA-2048 + AES-256-GCM
   - Sends encrypted payload to broker
   - Returns message ID on success

2. **Check Inbox**:
   ```bash
   cd ~/S4D5/nerve-cord && npm run check
   ```
   - Polls for pending messages addressed to bot
   - Decrypts messages using bot's private key
   - Returns JSON array of messages
   - Implements loop prevention (filters self-replies and deep chains)

3. **Log Activity**:
   ```bash
   cd ~/S4D5/nerve-cord && npm run log "Started analysis cycle" "analysis,cycle"
   ```
   - Posts to shared activity log
   - Stored in daily files (`data/log/YYYY-MM-DD.json`)
   - Visible on dashboard

4. **Update Priority**:
   ```bash
   cd ~/S4D5/nerve-cord && npm run prio "URGENT: High-confidence BTC trade opportunity"
   ```
   - Sets top priority on shared dashboard
   - Pushes other priorities down

**Direct HTTP API** (Used by npm scripts):

```http
POST /messages
{
  "from": "alpha-strategist",
  "to": "audit-oracle",
  "subject": "Trade Proposal: BTC-USD buy",
  "body": "<base64-encrypted-payload>",
  "encrypted": true
}
```

**Error Handling**:
- 404 Recipient Not Found → Log error, skip message
- 401 Unauthorized → Log error, exit (invalid token)
- Network timeout → Retry with exponential backoff
- Command execution failure → Retry up to 3 times

## Configuration Schema

### Environment Variables

```bash
# ============================================
# REQUIRED CONFIGURATION
# ============================================

# QuickNode API Configuration
QUICKNODE_API_KEY=qn_abc123def456...
QUICKNODE_BASE_URL=https://api.quicknode.com/hyperliquid/v1

# Polymarket API Configuration
POLYMARKET_API_KEY=pm_xyz789...
POLYMARKET_BASE_URL=https://gamma-api.polymarket.com

# Nerve-Cord Configuration
NERVE_TOKEN=mysecrettoken123
NERVE_SERVER=https://s4d5-production.up.railway.app
BOTNAME=alpha-strategist

# ============================================
# OPTIONAL CONFIGURATION (with defaults)
# ============================================

# Analysis Parameters
ANALYSIS_INTERVAL=300           # Analysis cycle interval (seconds)
MIN_CONFIDENCE=60               # Minimum confidence to create proposal (0-100)
TARGET_ASSETS=BTC-USD,ETH-USD   # Comma-separated list of assets to analyze

# Trading Parameters
MAX_POSITION_SIZE=10000         # Maximum position size (USD)
RISK_MULTIPLIER=0.5             # Risk adjustment factor (0-1)

# Retry Configuration
MAX_RETRIES=3                   # Maximum retry attempts for API calls
RETRY_BACKOFF_BASE=30           # Base backoff delay (seconds)
RETRY_BACKOFF_MULTIPLIER=2      # Exponential backoff multiplier

# LLM Configuration (OpenClaw Framework)
LLM_TEMPERATURE=0.7             # LLM temperature for reasoning (0-1)
LLM_MAX_TOKENS=500              # Max tokens for LLM response
```

### Configuration Validation

```typescript
interface ValidationRule {
  field: string
  required: boolean
  type: 'string' | 'number' | 'array'
  min?: number
  max?: number
  pattern?: RegExp
}

const VALIDATION_RULES: ValidationRule[] = [
  // Required fields
  { field: 'QUICKNODE_API_KEY', required: true, type: 'string' },
  { field: 'POLYMARKET_API_KEY', required: true, type: 'string' },
  { field: 'NERVE_TOKEN', required: true, type: 'string' },
  { field: 'NERVE_SERVER', required: true, type: 'string', pattern: /^https?:\/\// },
  { field: 'BOTNAME', required: true, type: 'string' },
  
  // Optional fields with constraints
  { field: 'ANALYSIS_INTERVAL', required: false, type: 'number', min: 60 },
  { field: 'MIN_CONFIDENCE', required: false, type: 'number', min: 0, max: 100 },
  { field: 'MAX_POSITION_SIZE', required: false, type: 'number', min: 1 },
  { field: 'RISK_MULTIPLIER', required: false, type: 'number', min: 0, max: 1 },
  { field: 'MAX_RETRIES', required: false, type: 'number', min: 1, max: 10 },
]
```

**Validation Process**:
1. Load environment variables from `.env` file and process.env
2. Check all required fields are present and non-empty
3. Validate types (string, number, array)
4. Validate constraints (min, max, pattern)
5. Apply default values for optional fields
6. If validation fails:
   - Log detailed error message with field name and violation
   - Exit with code 1 (prevent bot from running with invalid config)

**Default Values**:
```typescript
const DEFAULTS = {
  QUICKNODE_BASE_URL: 'https://api.quicknode.com/hyperliquid/v1',
  POLYMARKET_BASE_URL: 'https://gamma-api.polymarket.com',
  ANALYSIS_INTERVAL: 300,
  MIN_CONFIDENCE: 60,
  TARGET_ASSETS: ['BTC-USD', 'ETH-USD'],
  MAX_POSITION_SIZE: 10000,
  RISK_MULTIPLIER: 0.5,
  MAX_RETRIES: 3,
  RETRY_BACKOFF_BASE: 30,
  RETRY_BACKOFF_MULTIPLIER: 2,
  LLM_TEMPERATURE: 0.7,
  LLM_MAX_TOKENS: 500,
}
```

## Error Handling Strategy

### Error Categories

1. **Configuration Errors** (Fatal)
   - Missing required environment variables
   - Invalid configuration values
   - **Action**: Log detailed error, exit with code 1

2. **API Errors** (Recoverable)
   - Network timeouts
   - Rate limit exceeded (429)
   - Server errors (5xx)
   - **Action**: Retry with exponential backoff, skip after max retries

3. **Client Errors** (Non-Recoverable)
   - Invalid API key (401)
   - Bad request (400)
   - Not found (404)
   - **Action**: Log error, skip operation, continue

4. **Analysis Errors** (Recoverable)
   - LLM timeout or failure
   - Invalid market data
   - **Action**: Fallback to technical-only analysis or skip cycle

5. **Communication Errors** (Recoverable)
   - Nerve-Cord send failure
   - Message encryption failure
   - **Action**: Retry with backoff, log to local file if all retries fail

### Retry Logic Implementation

```typescript
async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig
): Promise<T> {
  let lastError: Error
  
  for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      
      // Check if error is retryable
      if (!isRetryable(error)) {
        throw error
      }
      
      // Calculate backoff delay
      const delay = config.backoffBase * Math.pow(config.backoffMultiplier, attempt - 1)
      
      // Log retry attempt
      await logError(`Attempt ${attempt}/${config.maxRetries} failed, retrying in ${delay}s`, error)
      
      // Wait before retry
      await sleep(delay * 1000)
    }
  }
  
  // All retries exhausted
  throw new Error(`Operation failed after ${config.maxRetries} attempts: ${lastError.message}`)
}

function isRetryable(error: Error): boolean {
  // Network errors
  if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
    return true
  }
  
  // HTTP errors
  if (error instanceof HttpError) {
    // Retry on 5xx server errors and 429 rate limit
    return error.status >= 500 || error.status === 429
  }
  
  return false
}
```

### Exponential Backoff Schedule

| Attempt | Delay (seconds) | Cumulative Time |
|---------|-----------------|-----------------|
| 1       | 30              | 30s             |
| 2       | 60              | 1m 30s          |
| 3       | 120             | 3m 30s          |

### Fallback Behaviors

1. **Polymarket API Failure**
   - Continue analysis without sentiment data
   - Use technical indicators only
   - Log warning to dashboard

2. **LLM Failure**
   - Fall back to rule-based signal generation
   - Use technical thresholds (e.g., >5% price change + high volume = BUY)
   - Set confidence to 50 (moderate)

3. **Nerve-Cord Send Failure**
   - Retry with exponential backoff
   - After 3 failures, log proposal to local file
   - Alert operator via dashboard log

4. **QuickNode API Failure**
   - Skip current analysis cycle
   - Log error to dashboard
   - Wait for next interval

### Logging Strategy

**Log Levels**:
- **ERROR**: Critical failures, configuration errors, max retries exhausted
- **WARN**: Recoverable errors, fallback behaviors, missing optional data
- **INFO**: Normal operations, cycle start/end, proposals sent
- **DEBUG**: Detailed analysis data, API responses (disabled in production)

**Log Destinations**:
1. **Nerve-Cord Dashboard** (Primary)
   - All ERROR and WARN logs
   - Major milestones (cycle start, proposals sent, responses received)
   - Format: `[{timestamp}] [{level}] {message}`

2. **Local File** (Backup)
   - All log levels
   - Rotated daily
   - Path: `~/S4D5/logs/alpha-strategist-YYYY-MM-DD.log`

3. **Console** (Development)
   - All log levels with color coding
   - Disabled in production

**Error Context**:
Every error log includes:
- Timestamp (ISO 8601)
- Error type/category
- Operation context (e.g., "Fetching QuickNode market data")
- Error message
- Retry attempt number (if applicable)
- Stack trace (for unexpected errors)

Example:
```
[2024-01-01T12:34:56.789Z] [ERROR] QuickNode API call failed (attempt 2/3): 
  Context: Fetching market data for BTC-USD
  Error: ETIMEDOUT - Connection timeout after 10s
  Retrying in 60s...
```

## LLM Integration

### LLM Role

The configured LLM serves as the reasoning engine that synthesizes technical analysis and sentiment data into actionable trading signals with natural language explanations.

### OpenClaw Framework Integration

The bot accesses the LLM through OpenClaw's framework capabilities:
- **No direct API calls**: OpenClaw handles LLM communication
- **Configuration**: LLM provider and model specified in OpenClaw config
- **Context**: Bot provides analysis context, receives structured response

### Prompt Template

```typescript
const ANALYSIS_PROMPT = `
You are the Alpha Strategist, a market analysis AI for the S4D5 hedge fund. Analyze the following market data and generate a trading signal.

MARKET DATA:
Asset: {asset}
Current Price: ${marketData.price.current}
24h Change: ${marketData.price.change24h}%
24h High/Low: ${marketData.price.high24h} / ${marketData.price.low24h}
24h Volume: ${marketData.volume.volume24h} (${marketData.volume.volumeRatio}x average)
Bid-Ask Spread: ${marketData.orderbook.spread}%
Order Book Depth: ${marketData.orderbook.depth}

TECHNICAL ANALYSIS:
Trend: ${technicalAnalysis.trend}
Volume Anomaly: ${technicalAnalysis.volumeAnomaly ? 'YES' : 'NO'}
Liquidity Score: ${technicalAnalysis.liquidityScore}/100

SENTIMENT DATA:
${sentimentData ? `
Aggregate Sentiment: ${sentimentData.aggregateScore.toFixed(2)} (-1 bearish, +1 bullish)
Key Signals:
${sentimentData.signals.map(s => `- ${s.question}: ${(s.probability * 100).toFixed(0)}% (${s.sentiment > 0 ? 'bullish' : 'bearish'})`).join('\n')}
` : 'Sentiment data unavailable'}

TASK:
Generate a trading signal (BUY, SELL, or HOLD) with:
1. Your confidence level (0-100)
2. Clear reasoning explaining your decision
3. Key risk factors to consider

Respond in JSON format:
{
  "signal": "BUY" | "SELL" | "HOLD",
  "confidence": <number 0-100>,
  "reasoning": "<2-3 sentence explanation>",
  "keyRisks": ["<risk 1>", "<risk 2>"]
}
`
```

### Response Parsing

```typescript
interface LLMResponse {
  signal: 'BUY' | 'SELL' | 'HOLD'
  confidence: number
  reasoning: string
  keyRisks: string[]
}

function parseLLMResponse(rawResponse: string): LLMResponse {
  try {
    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = rawResponse.match(/```json\n([\s\S]*?)\n```/) || 
                      rawResponse.match(/\{[\s\S]*\}/)
    
    if (!jsonMatch) {
      throw new Error('No JSON found in LLM response')
    }
    
    const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0])
    
    // Validate response structure
    if (!['BUY', 'SELL', 'HOLD'].includes(parsed.signal)) {
      throw new Error(`Invalid signal: ${parsed.signal}`)
    }
    
    if (typeof parsed.confidence !== 'number' || parsed.confidence < 0 || parsed.confidence > 100) {
      throw new Error(`Invalid confidence: ${parsed.confidence}`)
    }
    
    return {
      signal: parsed.signal,
      confidence: parsed.confidence,
      reasoning: parsed.reasoning || 'No reasoning provided',
      keyRisks: parsed.keyRisks || []
    }
  } catch (error) {
    throw new Error(`Failed to parse LLM response: ${error.message}`)
  }
}
```

### Fallback Strategy

If LLM fails or returns invalid response:

1. **Rule-Based Signal Generation**:
   ```typescript
   function generateFallbackSignal(
     marketData: MarketData,
     technicalAnalysis: TechnicalAnalysis
   ): TradingSignal {
     let signal: 'BUY' | 'SELL' | 'HOLD' = 'HOLD'
     let confidence = 50
     
     // Strong uptrend + high volume = BUY
     if (marketData.price.change24h > 5 && 
         marketData.volume.volumeRatio > 1.5 &&
         technicalAnalysis.trend === 'bullish') {
       signal = 'BUY'
       confidence = 65
     }
     
     // Strong downtrend + high volume = SELL
     else if (marketData.price.change24h < -5 && 
              marketData.volume.volumeRatio > 1.5 &&
              technicalAnalysis.trend === 'bearish') {
       signal = 'SELL'
       confidence = 65
     }
     
     return {
       asset: marketData.asset,
       action: signal,
       confidence,
       reasoning: 'Generated using rule-based fallback (LLM unavailable)',
       timestamp: Date.now(),
       technicalFactors: technicalAnalysis,
       sentimentFactors: { score: 0, confidence: 0 }
     }
   }
   ```

2. **Log Warning**: Alert operator that LLM is unavailable
3. **Continue Operation**: Don't crash, use fallback for current cycle

### LLM Configuration

```typescript
interface LLMConfig {
  temperature: number      // 0.7 (balanced creativity/consistency)
  maxTokens: number        // 500 (sufficient for structured response)
  timeout: number          // 30s (prevent hanging)
  retries: number          // 2 (quick fallback to rule-based)
}
```


## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property Reflection

After analyzing all acceptance criteria, I identified several opportunities to combine related properties:
- Requirements 1.1, 1.2, 1.3 all test that market data components are fetched → Combined into Property 1
- Requirements 4.2-4.9 all test that proposal fields are present → Combined into Property 8
- Requirements 3.1, 3.2, 3.3 all test that analysis components run → Combined into Property 4
- Requirements 11.1, 11.2, 11.3 all test priority thresholds → Combined into Property 20

This reduces redundancy while maintaining comprehensive coverage of all testable requirements.

### Property 1: Complete Market Data Fetching

For any analysis cycle trigger, the system shall fetch all three components of market data (price, volume, and orderbook) from QuickNode API.

**Validates: Requirements 1.1, 1.2, 1.3**

### Property 2: Market Data Parsing Round-Trip

For any valid QuickNode API response, parsing the response into a MarketData object and then serializing it back should produce equivalent data.

**Validates: Requirements 1.4**

### Property 3: API Error Retry Behavior

For any API error response, the system shall log the error and retry after exactly 30 seconds, up to a maximum of 3 attempts.

**Validates: Requirements 1.5, 1.6, 9.1, 9.3**

### Property 4: Complete Market Analysis Execution

For any valid market data, the analysis process shall execute all three analysis components (trend analysis, volume analysis, and liquidity analysis) and produce results for each.

**Validates: Requirements 3.1, 3.2, 3.3**

### Property 5: Sentiment Data Parsing

For any valid Polymarket API response, the system shall extract sentiment indicators with scores in the range [-1, 1].

**Validates: Requirements 2.2**

### Property 6: Graceful Sentiment Failure

For any Polymarket API error, the system shall log the error and continue analysis without crashing, producing a result with neutral sentiment (0).

**Validates: Requirements 2.3**

### Property 7: Sentiment Data Incorporation

For any analysis with available sentiment data, the resulting trading signal shall include sentiment factors, and the signal shall differ from analysis without sentiment data (given the same market data).

**Validates: Requirements 3.4**

### Property 8: Complete Proposal Structure

For any generated trade proposal, the proposal shall contain all required fields: asset, action, quantity, targetPrice, reasoning, confidence, riskAssessment, and expectedReturn.

**Validates: Requirements 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9**

### Property 9: Proposal JSON Round-Trip

For any trade proposal, serializing it to JSON and then parsing it back shall produce an equivalent proposal object.

**Validates: Requirements 4.10**

### Property 10: Confidence Threshold for Proposals

For any trading signal, a proposal shall be created if and only if the signal is BUY or SELL and the confidence score is greater than 60.

**Validates: Requirements 4.1**

### Property 11: Trading Signal Validity

For any generated trading signal, the action shall be one of BUY, SELL, or HOLD, and the confidence score shall be in the range [0, 100].

**Validates: Requirements 3.7, 3.8**

### Property 12: LLM Prompt Completeness

For any LLM analysis invocation, the generated prompt shall contain all required components: market context (price, volume, orderbook), risk factors, and sentiment data (if available).

**Validates: Requirements 3.6**

### Property 13: Signal Reasoning Presence

For any trading signal generated by the LLM, the signal shall include non-empty natural language reasoning text.

**Validates: Requirements 3.9**

### Property 14: Proposal Delivery to AuditOracle

For any created trade proposal, the system shall execute a Nerve-Cord send command with the recipient set to "audit-oracle".

**Validates: Requirements 5.1, 5.2**

### Property 15: Successful Send Logging

For any successful Nerve-Cord send operation, the system shall create a log entry containing the sent proposal details.

**Validates: Requirements 5.3**

### Property 16: Send Retry with Exponential Backoff

For any failed Nerve-Cord send command, the system shall retry up to 3 times with delays following exponential backoff (30s, 60s, 120s).

**Validates: Requirements 5.4**

### Property 17: Inbox Message Processing

For any N messages returned by the Nerve-Cord check command, the system shall parse all N messages and process each one.

**Validates: Requirements 6.2**

### Property 18: Response Logging

For any message from AuditOracle containing an approval or rejection, the system shall create a log entry with the response details.

**Validates: Requirements 6.3, 6.4**

### Property 19: Cycle Milestone Logging

For any analysis cycle, the system shall log at least three milestones: cycle start, proposal sent (if any), and cycle completion.

**Validates: Requirements 7.1, 7.2**

### Property 20: Priority Setting by Confidence

For any trading signal, the system shall set priority level based on confidence: high priority for confidence > 80, normal priority for confidence 60-80, and low priority for confidence < 60 or HOLD signals.

**Validates: Requirements 11.1, 11.2, 11.3**

### Property 21: Configuration Loading with Defaults

For any configuration parameter with a default value, if the environment variable is absent, the system shall use the default value; if present, the system shall use the environment variable value.

**Validates: Requirements 8.1, 8.2**

### Property 22: Required Configuration Validation

For any missing required environment variable (QUICKNODE_API_KEY, POLYMARKET_API_KEY, NERVE_TOKEN, BOTNAME), the system shall log an error and exit with a non-zero status code.

**Validates: Requirements 8.5**

### Property 23: Rate Limit Handling

For any API call that fails with a 429 rate limit error, the system shall wait for the time specified in the Retry-After header before retrying.

**Validates: Requirements 9.2**

### Property 24: Error Logging Completeness

For any API failure, the system shall create a log entry containing both the error message and a timestamp.

**Validates: Requirements 9.4**

### Property 25: Resilience to API Failures

For any API failure during an analysis cycle, the system shall continue running (not exit or crash) and proceed to the next scheduled cycle.

**Validates: Requirements 9.5**

### Property 26: Timer Initialization

For any bot startup, the system shall initialize a timer with an interval equal to the configured ANALYSIS_INTERVAL value.

**Validates: Requirements 10.1**

### Property 27: Timer-Triggered Analysis

For any timer expiration event, the system shall execute a complete analysis cycle including data fetching, analysis, and proposal generation.

**Validates: Requirements 10.2**

### Property 28: Timer Reset After Cycle

For any completed analysis cycle, the system shall reset the timer to trigger again after ANALYSIS_INTERVAL seconds.

**Validates: Requirements 10.3**

### Property 29: Dynamic Configuration Update

For any change to the ANALYSIS_INTERVAL environment variable, the system shall apply the new interval value after the current analysis cycle completes.

**Validates: Requirements 10.5**

### Property 30: Scheduled Inbox Checks

For any analysis cycle trigger, the system shall execute a Nerve-Cord check command to poll for new messages.

**Validates: Requirements 6.1**

### Property 31: Multiple Strategy Execution

For any configuration with N analysis strategies, the system shall execute all N strategies and aggregate their results into a final trading signal.

**Validates: Requirements 3.10**

## Testing Strategy

### Dual Testing Approach

The Alpha Strategist bot requires comprehensive testing using both unit tests and property-based tests:

**Unit Tests** focus on:
- Specific examples of market conditions and expected signals
- Edge cases (empty orderbook, zero volume, extreme price changes)
- Error conditions (malformed API responses, network timeouts)
- Integration points (Nerve-Cord command execution, LLM invocation)
- Configuration validation (missing vars, invalid values)

**Property-Based Tests** focus on:
- Universal properties that hold for all inputs (see Correctness Properties above)
- Comprehensive input coverage through randomization
- Round-trip properties (serialization/deserialization)
- Invariants (confidence always 0-100, signals always BUY/SELL/HOLD)
- Retry logic and error handling across many failure scenarios

Both approaches are complementary and necessary: unit tests catch concrete bugs in specific scenarios, while property tests verify general correctness across the input space.

### Property-Based Testing Configuration

**Framework Selection**: 
- **JavaScript/TypeScript**: Use `fast-check` library (mature, well-documented, good TypeScript support)
- Installation: `npm install --save-dev fast-check @types/fast-check`

**Test Configuration**:
- Minimum 100 iterations per property test (due to randomization)
- Timeout: 30 seconds per property test
- Seed: Logged on failure for reproducibility
- Shrinking: Enabled (fast-check automatically finds minimal failing examples)

**Property Test Structure**:
```typescript
import fc from 'fast-check'

describe('Alpha Strategist Properties', () => {
  it('Property 1: Complete Market Data Fetching', () => {
    // Feature: alpha-strategist-market-analysis, Property 1
    fc.assert(
      fc.property(
        fc.record({
          asset: fc.constantFrom('BTC-USD', 'ETH-USD'),
          timestamp: fc.integer({ min: Date.now() - 86400000, max: Date.now() })
        }),
        async (cycleContext) => {
          const fetcher = new MarketDataFetcher(config)
          const data = await fetcher.fetchMarketData(cycleContext.asset)
          
          // Assert all three components are present
          expect(data.price).toBeDefined()
          expect(data.volume).toBeDefined()
          expect(data.orderbook).toBeDefined()
        }
      ),
      { numRuns: 100 }
    )
  })
})
```

**Tagging Convention**:
Each property test must include a comment referencing the design document property:
```typescript
// Feature: alpha-strategist-market-analysis, Property {number}: {property_text}
```

### Unit Testing Strategy

**Framework**: Jest (standard for Node.js/TypeScript projects)

**Test Organization**:
```
tests/
├── unit/
│   ├── market-data-fetcher.test.ts
│   ├── sentiment-data-fetcher.test.ts
│   ├── market-analyzer.test.ts
│   ├── proposal-generator.test.ts
│   ├── nerve-cord-client.test.ts
│   ├── config-manager.test.ts
│   └── error-handler.test.ts
├── property/
│   ├── data-fetching.property.test.ts
│   ├── analysis.property.test.ts
│   ├── proposals.property.test.ts
│   ├── communication.property.test.ts
│   └── configuration.property.test.ts
└── integration/
    ├── full-cycle.test.ts
    └── error-scenarios.test.ts
```

**Key Unit Test Examples**:

1. **Edge Case: Empty Orderbook**
   ```typescript
   it('should handle empty orderbook gracefully', () => {
     const marketData = {
       asset: 'BTC-USD',
       price: { current: 45000, change24h: 2.5, high24h: 46000, low24h: 44000 },
       volume: { volume24h: 1000000, volumeAvg: 900000, volumeRatio: 1.11 },
       orderbook: { bids: [], asks: [], spread: 0, depth: 0 }
     }
     
     const analyzer = new MarketAnalyzer(llmClient, config)
     const signal = await analyzer.analyze(marketData, null)
     
     expect(signal.technicalFactors.liquidityScore).toBe(0)
     expect(signal.action).toBe('HOLD') // Low liquidity = no trade
   })
   ```

2. **Error Condition: Malformed API Response**
   ```typescript
   it('should handle malformed QuickNode response', async () => {
     const fetcher = new MarketDataFetcher(apiKey, baseUrl)
     mockApiResponse({ invalid: 'data' })
     
     await expect(fetcher.fetchMarketData('BTC-USD'))
       .rejects.toThrow('Invalid API response')
   })
   ```

3. **Integration: Nerve-Cord Command Execution**
   ```typescript
   it('should execute npm run send with correct arguments', async () => {
     const client = new NerveCordClient(config)
     const proposal = createMockProposal()
     
     const execSpy = jest.spyOn(childProcess, 'exec')
     await client.sendProposal('audit-oracle', proposal)
     
     expect(execSpy).toHaveBeenCalledWith(
       expect.stringContaining('npm run send "audit-oracle"')
     )
   })
   ```

### Test Coverage Goals

- **Line Coverage**: Minimum 80%
- **Branch Coverage**: Minimum 75%
- **Function Coverage**: Minimum 85%
- **Critical Paths**: 100% (configuration validation, retry logic, error handling)

### Continuous Integration

Tests run on every commit:
1. Lint and type check
2. Unit tests (fast, < 30s)
3. Property tests (slower, < 5min)
4. Integration tests (slowest, < 10min)
5. Coverage report generation

Fail the build if:
- Any test fails
- Coverage drops below thresholds
- Type errors present
- Linting errors present

