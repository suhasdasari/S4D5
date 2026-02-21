# Architecture Overview

## System Design

S4D5 is a multi-agent autonomous trading system where three OpenClaw bots collaborate to analyze markets, manage risk, and execute trades.

## Components

### 1. Data Layer
- **QuickNode Streams**: Monitors blockchain for BTC/ETH trades
- **Railway Webhook**: Aggregates data, exposes REST API

### 2. Agent Layer (OpenClaw Bots)
- **Alpha Strategist**: Analyzes markets, generates proposals
- **AuditOracle**: Reviews risk, approves/rejects proposals
- **ExecutionHand**: Executes approved trades

### 3. Communication Layer
- **Nerve-Cord**: Message broker between agents
- **Kite AI**: x402 micropayments (0.001 KITE per proposal)

### 4. Frontend Layer
- **Next.js Dashboard**: Real-time monitoring and control

## Data Flow

```
┌─────────────────┐
│ QuickNode       │ Real-time blockchain events
│ Streams         │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ Railway         │ Aggregates: price, volume, buy/sell ratio
│ Webhook         │ API: /dashboard
└────────┬────────┘
         │
         ↓ (Polls every 30s)
┌─────────────────────────────────┐
│ Alpha Strategist (EC2 #1)       │
│ - OpenClaw bot                  │
│ - Analyzes market data          │
│ - Calculates confidence         │
│ - Generates proposals           │
└────────┬────────────────────────┘
         │
         ↓ (Sends proposal + 0.001 KITE)
┌─────────────────┐
│ Nerve-Cord      │ Message queue (JSON file)
└────────┬────────┘
         │
         ↓ (Polls every 10s)
┌─────────────────────────────────┐
│ AuditOracle (EC2 #2)            │
│ - OpenClaw bot                  │
│ - Reviews risk                  │
│ - Approves or rejects           │
└────────┬────────────────────────┘
         │
         ↓ (Approved proposals)
┌─────────────────┐
│ Nerve-Cord      │
└────────┬────────┘
         │
         ↓ (Polls every 10s)
┌─────────────────────────────────┐
│ ExecutionHand (EC2 #3)          │
│ - OpenClaw bot                  │
│ - Executes trades               │
│ - Monitors positions            │
│ - Reports outcomes              │
└─────────────────────────────────┘
```

## OpenClaw Integration

Each bot runs on OpenClaw framework:

```
OpenClaw Bot
├── Cron Jobs (scheduled tasks)
├── Skills (markdown files defining capabilities)
├── Tools (executable scripts)
└── Message Handlers (process Nerve-Cord messages)
```

**How it works:**
1. OpenClaw cron job triggers every 30s (Alpha Strategist) or on message (AuditOracle, ExecutionHand)
2. Executes Node.js script (e.g., `stream-analyzer.js`)
3. Script uses skills and tools to perform task
4. Results sent via Nerve-Cord to next agent

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    EC2 Instance #1                       │
│                  Alpha Strategist                        │
│  - OpenClaw framework                                    │
│  - Node.js scripts                                       │
│  - Kite wallet (for payments)                            │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    EC2 Instance #2                       │
│                     AuditOracle                          │
│  - OpenClaw framework                                    │
│  - Node.js scripts                                       │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    EC2 Instance #3                       │
│                   ExecutionHand                          │
│  - OpenClaw framework                                    │
│  - Node.js scripts                                       │
│  - Exchange API connections                              │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                Railway or EC2                            │
│                  Nerve-Cord Server                       │
│  - HTTP API                                              │
│  - Message queue (data/messages.json)                    │
└─────────────────────────────────────────────────────────┘
```

## Security

- **Encrypted messaging**: RSA-2048 + AES-256-GCM
- **Wallet security**: Private keys stored securely on each EC2
- **Access control**: Bearer tokens for Nerve-Cord API
- **Network isolation**: Each bot on separate EC2 instance

## Scalability

- **Horizontal**: Add more agents (e.g., SentimentAnalyzer, PortfolioManager)
- **Vertical**: Increase EC2 instance sizes
- **Data**: Railway webhook can handle high-frequency streams

---

Next: [Quick Start Guide](./02-quick-start.md)
