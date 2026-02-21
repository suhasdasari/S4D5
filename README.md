# S4D5 — AI Hedge Fund Council

> A multi-agent AI hedge fund system built for ETHDenver 2026. Three specialized AI agents collaborate through an encrypted nervous system (Nerve-Cord) to analyze markets, manage risk, and execute trades autonomously on decentralized exchanges.

🌐 **Live Dashboard**: [s4-d5.vercel.app](https://s4-d5.vercel.app/)  
📚 **Documentation**: [docs/](./docs/)  
🚀 **Agent Micropayments**: Powered by Kite AI x402 protocol

> [!CAUTION]
> **ALL** inter-bot communication must use the Nerve-Cord terminal scripts (`npm run send / check / ping`) located in the `nerve-cord/` directory.

---

## 🏛️ System Architecture

S4D5 operates as a **Multi-Agent Council** where three specialized AI agents collaborate to make trading decisions. Each agent has a distinct role, and all must reach consensus before trades are executed.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        📊 DATA SOURCES & INGESTION LAYER                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐        │
│  │  QuickNode       │    │  Railway         │    │  Polymarket      │        │
│  │  Streams         │───▶│  Webhook         │    │  Sentiment API   │        │
│  │                  │    │  Aggregator      │    │                  │        │
│  │  Hyperliquid     │    │                  │    │  Market Signals  │        │
│  │  BTC/ETH/SHIB    │    └────────┬─────────┘    └────────┬─────────┘        │
│  └──────────────────┘             │                       │                   │
│                                    │                       │                   │
└────────────────────────────────────┼───────────────────────┼───────────────────┘
                                     │                       │
                                     ▼                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           🤖 AGENT LAYER (Multi-Agent Council)                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌──────────────────┐         ┌──────────────────┐         ┌────────────────┐ │
│  │ Alpha Strategist │         │  AuditOracle     │         │ ExecutionHand  │ │
│  │ ════════════════ │         │  ══════════════  │         │ ══════════════ │ │
│  │                  │         │                  │         │                │ │
│  │ • Market         │         │ • Risk           │         │ • Monitors     │ │
│  │   Analysis       │         │   Assessment     │         │   Approved     │ │
│  │ • 5-Signal       │         │ • Volatility     │         │   Proposals    │ │
│  │   Scoring        │         │   Checks         │         │ • Executes     │ │
│  │ • Confidence     │  (1)    │ • Liquidity      │  (2)    │   Trades via   │ │
│  │   Calculation    │─Propose─▶   Validation     │─Approve─▶   Uniswap API  │ │
│  │ • Position       │         │ • Position Size  │         │ • Position     │ │
│  │   Sizing         │         │   Limits         │         │   Management   │ │
│  │ • Proposal       │         │ • Approve/       │         │ • Stop-Loss/   │ │
│  │   Generation     │         │   Reject         │         │   Take-Profit  │ │
│  │                  │         │                  │         │                │ │
│  └────────┬─────────┘         └────────┬─────────┘         └────────┬───────┘ │
│           │                            │                            │         │
│           │    x402 Micropayments      │                            │         │
│           └────────────────────────────┼────────────────────────────┘         │
│                    (0.001 KITE/call)   │                                      │
│                                        │                                      │
└────────────────────────────────────────┼──────────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      🦞 COMMUNICATION LAYER (Nerve-Cord)                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌───────────────────────────────────────────────────────────────────────┐    │
│  │                    Encrypted Message Broker                            │    │
│  │  ═══════════════════════════════════════════════════════════════════  │    │
│  │                                                                        │    │
│  │  • RSA-2048 + AES-256-GCM Encryption    • Priority Queue System       │    │
│  │  • Bot Registry & Key Exchange          • Heartbeat Monitoring        │    │
│  │  • Activity Logging                     • Live Dashboard              │    │
│  │                                                                        │    │
│  └────────┬──────────────────────────────────────────────────┬──────────┘    │
│           │                                                   │               │
│           ▼                                                   ▼               │
│  ┌────────────────┐                                  ┌────────────────┐      │
│  │  Kite AI       │                                  │  0G Storage    │      │
│  │  x402 Protocol │                                  │  Integration   │      │
│  │                │                                  │                │      │
│  │  Agent-to-Agent│                                  │  Decentralized │      │
│  │  Micropayments │                                  │  Audit Trail   │      │
│  └────────────────┘                                  └────────────────┘      │
│                                                                               │
└───────────────────────────────────────┬───────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    ⛓️  BLOCKCHAIN & STORAGE LAYER                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐        │
│  │  Hedera HCS      │    │  0G Storage      │    │  Kite AI         │        │
│  │  ══════════════  │    │  ══════════════  │    │  ══════════════  │        │
│  │                  │    │                  │    │                  │        │
│  │  • Consensus     │    │  • Decentralized │    │  • x402 Protocol │        │
│  │    Timestamps    │    │    Storage       │    │  • Multi-Chain   │        │
│  │  • Immutable     │    │  • Agent Comms   │    │    Wallets       │        │
│  │    Logging       │    │    Archive       │    │  • Micropayment  │        │
│  │  • Audit Trail   │    │  • Audit Trail   │    │    Routing       │        │
│  │                  │    │                  │    │                  │        │
│  └──────────────────┘    └──────────────────┘    └──────────────────┘        │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         💱 EXECUTION LAYER                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────┐     │
│  │                      S4D5Vault Smart Contract                         │     │
│  │  ══════════════════════════════════════════════════════════════════  │     │
│  │                                                                       │     │
│  │  • Deposit/Withdraw Management    • Position Tracking                │     │
│  │  • Access Control                 • Balance Management               │     │
│  │                                                                       │     │
│  └───────────────────────────────┬───────────────────────────────────────┘     │
│                                  │                                             │
│                                  ▼                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐     │
│  │                      Uniswap API Integration                          │     │
│  │  ══════════════════════════════════════════════════════════════════  │     │
│  │                                                                       │     │
│  │  • Quote Fetching                 • Slippage Protection              │     │
│  │  • Swap Execution                 • Gas Optimization                 │     │
│  │  • Multi-Chain Support (Base/Ethereum)                               │     │
│  │                                                                       │     │
│  └───────────────────────────────┬───────────────────────────────────────┘     │
│                                  │                                             │
│                                  ▼                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐     │
│  │                      DEX Swaps (Base/Ethereum)                        │     │
│  │  ══════════════════════════════════════════════════════════════════  │     │
│  │                                                                       │     │
│  │  • BTC/ETH/SHIB Trading           • Liquidity Pools                  │     │
│  │  • Real-time Execution            • Price Discovery                  │     │
│  │                                                                       │     │
│  └───────────────────────────────────────────────────────────────────────┘     │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           🖥️  FRONTEND LAYER                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌───────────────────────────────────────────────────────────────────────┐    │
│  │              Next.js Dashboard (Scaffold-ETH 2)                        │    │
│  │  ═══════════════════════════════════════════════════════════════════  │    │
│  │                                                                        │    │
│  │  • Real-time Agent Status         • Portfolio Performance             │    │
│  │  • Proposal Monitoring            • Trade History                     │    │
│  │  • Risk Metrics Dashboard         • Position Management               │    │
│  │  • Wallet Integration             • Live Activity Feed                │    │
│  │                                                                        │    │
│  │  🌐 Live: s4-d5.vercel.app                                            │    │
│  │                                                                        │    │
│  └────────────────────────────────────────────────────────────────────────┘    │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 🔄 Data Flow & Proposal Lifecycle

```
1. DATA INGESTION
   QuickNode Streams (Hyperliquid) ──▶ Railway Webhook ──▶ Alpha Strategist
   Polymarket Sentiment API ──────────────────────────────▶ Alpha Strategist

2. PROPOSAL GENERATION
   Alpha Strategist:
   ├─ Analyzes market data (5 signals)
   ├─ Calculates confidence score (0-100%)
   ├─ Generates proposal if confidence ≥ 60%
   └─ Sends to Nerve-Cord ──▶ [Encrypted Message]

3. RISK ASSESSMENT
   Nerve-Cord ──▶ AuditOracle:
   ├─ Validates volatility constraints
   ├─ Checks liquidity requirements
   ├─ Enforces position size limits
   └─ Decision: APPROVE or REJECT ──▶ Nerve-Cord

4. TRADE EXECUTION
   Nerve-Cord ──▶ ExecutionHand (if approved):
   ├─ Fetches quote from Uniswap API
   ├─ Validates slippage tolerance
   ├─ Executes swap on Base/Ethereum
   ├─ Updates S4D5Vault contract
   └─ Reports status ──▶ Nerve-Cord

5. AUDIT TRAIL
   All communications:
   ├─ Logged to Hedera HCS (consensus timestamps)
   └─ Stored on 0G Storage (decentralized archive)

6. MICROPAYMENTS
   Agent service calls:
   └─ Kite AI x402 protocol (0.001 KITE per call)

7. MONITORING
   Frontend Dashboard:
   └─ Real-time updates from all agents via Nerve-Cord
```

### Key Architecture Highlights

- **Layered Design**: Clear separation between data ingestion, agent logic, communication, blockchain, execution, and frontend
- **Encrypted Communication**: All agent messages secured with RSA-2048 + AES-256-GCM via Nerve-Cord
- **Decentralized Audit**: Immutable logging on Hedera HCS and 0G Storage for complete transparency
- **Agent Micropayments**: Kite AI x402 protocol enables autonomous agent-to-agent payments
- **Multi-Chain Execution**: Supports Base and Ethereum networks for DEX trading
- **Real-Time Monitoring**: Live dashboard provides visibility into all agent activities

---

## 🤖 The Three Agents

### 🎯 Alpha Strategist
**Operator**: Suhas  
**Role**: Market Analysis & Trade Proposal Generation

A fully autonomous AI trading agent that:
- Analyzes real-time trade data from QuickNode Streams (BTC, ETH, SHIB)
- Calculates confidence scores (0-100%) using 5 signal types:
  - **Trend Analysis**: Directional momentum
  - **Volume Surge**: Unusual trading activity
  - **Buy/Sell Pressure**: Order flow imbalance
  - **Momentum**: Price acceleration
  - **Consistency**: Signal alignment
- Generates trading proposals when confidence ≥ 60%
- Implements confidence-based position sizing
- Executes x402 micropayments (0.001 KITE per service call)
- Operates 24/7 with disciplined risk management

**Tech Stack**: OpenClaw framework, QuickNode Streams, Kite AI wallet

**Want to build your own?** See the complete guide: [Backend/helix/alpha-strategist.skill/README.md](Backend/helix/alpha-strategist.skill/README.md)

### 🛡️ AuditOracle
**Operator**: Susmitha  
**Role**: Risk Management & Compliance

The risk officer that ensures every trade meets safety standards:
- Reviews all proposals against volatility constraints
- Validates liquidity requirements before approval
- Enforces position size limits
- Monitors portfolio exposure
- Approves or rejects proposals with detailed reasoning
- Maintains risk metrics dashboard

**Risk Parameters**:
- Max position size: $10,000
- Stop-loss: 3%
- Take-profit: 6%
- Max position age: 24 hours

### ⚡ ExecutionHand
**Operator**: Karthik  
**Role**: Trade Execution & Position Management

The execution specialist that handles all trading operations:
- Monitors Nerve-Cord for approved proposals
- Executes trades via Uniswap API integration
- Manages active positions and stop-loss/take-profit orders
- Tracks portfolio performance
- Handles DEX interactions (quote fetching, swap execution)
- Reports execution status back to the council

**Capabilities**:
- Multi-chain support (Base, Ethereum)
- Slippage protection
- Gas optimization
- Position monitoring
- Automated exit strategies

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 14 with TypeScript
- **Scaffold**: Scaffold-ETH 2
- **Web3**: RainbowKit, Wagmi, Viem
- **UI**: TailwindCSS, DaisyUI
- **Deployment**: Vercel

### Backend & Agents
- **Runtime**: Node.js
- **Agent Framework**: OpenClaw
- **Communication**: Nerve-Cord (custom message broker)
- **Encryption**: RSA-2048 + AES-256-GCM

### Blockchain & Smart Contracts
- **Networks**: Base, Ethereum
- **Contracts**: Solidity
- **Development**: Foundry
- **DEX Integration**: Uniswap API

### Data & Infrastructure
- **Real-time Data**: QuickNode Streams (Hyperliquid trades)
- **Webhooks**: Railway
- **Consensus**: Hedera Hashgraph Consensus Service (HCS)
- **Storage**: 0G Labs (decentralized audit trail)
- **Payments**: Kite AI (x402 micropayments)
- **Hosting**: EC2 (agents), Railway (Nerve-Cord), Vercel (frontend)

---

## 📁 Repository Structure

```
S4D5/
├── docs/                  # 📚 Complete system documentation
│   ├── README.md          # Documentation index
│   ├── 01-architecture.md # System design
│   ├── 02-quick-start.md  # 10-minute setup guide
│   ├── 04-alpha-strategist.md
│   ├── COMPLETE-FLOW.md
│   └── DEPLOYMENT-CHECKLIST.md
│
├── scaffold-eth-2/        # Frontend — Next.js dashboard (Scaffold-ETH 2)
│   └── packages/
│       ├── nextjs/        # AI Hedge Fund dashboard UI
│       └── hardhat/       # Smart contracts (S4D5Vault)
│
├── nerve-cord/            # Communication hub — inter-bot message broker
│   ├── server.js          # Main broker server (Node.js)
│   ├── send.js            # Encrypted message sender
│   ├── poll.js            # Lightweight poller + heartbeat
│   ├── check.js           # Pending message checker
│   ├── reply.js           # Reply helper
│   ├── crypto.js          # RSA-2048 + AES-256-GCM encryption
│   ├── 0g_upload.js       # 0G Storage integration
│   └── SKILL.md           # Bot onboarding instructions
│
├── Backend/               # Agent implementations
│   ├── helix/             # Alpha Strategist agent
│   │   └── alpha-strategist.skill/
│   ├── auditoracle/       # AuditOracle risk agent
│   ├── executionhand/     # ExecutionHand trading agent
│   ├── KITE-INTEGRATION.md
│   ├── WALLET-SETUP.md
│   └── QUICK-START-EC2.md
│
├── hedera/                # Hedera HCS scripts
└── README.md              # ← You are here
```

> **📚 Complete Documentation**: See [`docs/`](./docs/) for detailed guides on architecture, deployment, and troubleshooting.

---

## 🦞 The Communication Layer: Nerve-Cord

To coordinate our three agents, we integrated **Nerve-Cord**, a high-performance communication hub for distributed AI agents.

- **Role**: Acts as the "Digital Nervous System" for our agent council
- **Function**: Facilitates encrypted, real-time message broadcasting and shared state management between distributed agents
- **Features**: 
  - RSA-2048 + AES-256-GCM hybrid E2E encryption
  - Bot registry & automatic key exchange
  - Activity logging with 0G Storage integration
  - Priority queue system
  - Heartbeat monitoring
  - Live HTML dashboard
- **Credit**: Architecture developed by **Clawdbot ATG** (OpenClaw ecosystem). [Original source](https://github.com/clawdbotatg/nerve-cord)

> We leveraged the Nerve-Cord protocol to handle the underlying networking, which allowed us to spend our time engineering the specific financial logic and "Soul" of our 3 agents.

---

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- Yarn (v1.22 or higher)
- Git

### 1. Clone and Setup

```bash
git clone https://github.com/suhasdasari/S4D5.git
cd S4D5
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your actual values:
```env
NERVE_PORT=9999
NERVE_TOKEN=your-secret-token
NERVE_SERVER=https://s4d5-production.up.railway.app
BOTNAME=alpha-strategist
ANALYSIS_INTERVAL=30000
MIN_CONFIDENCE=30
TARGET_ASSETS=BTC,ETH,SHIB
MAX_POSITION_SIZE=10000
RISK_MULTIPLIER=0.5
TAKE_PROFIT_PCT=6
STOP_LOSS_PCT=3
MAX_POSITION_AGE_HOURS=24
```

### 3. Start Nerve-Cord (Message Broker)

```bash
cd nerve-cord
npm install
npm start
```

Dashboard: `http://localhost:9999/stats`

### 4. Start Frontend (Dashboard)

In a new terminal:

```bash
cd scaffold-eth-2
yarn install
yarn start
```

Visit: `http://localhost:3000`

### 5. Run Alpha Strategist (Trading Bot)

In a new terminal:

```bash
cd Backend/helix/alpha-strategist.skill
npm install

# Test market analysis
node scripts/analyze-and-propose.js

# Send proposals to nerve-cord
npm run send-proposals
```

### 6. Test Inter-Agent Communication

```bash
cd nerve-cord

# Send a test message
npm run send "audit-oracle" "Test" "Hello from Alpha Strategist"

# Check inbox
npm run check

# View activity log
npm run log "Test message logged"
```

### 7. Register Bots with Nerve-Cord

Bots need to register themselves with Nerve-Cord to appear in the dashboard:

```bash
cd nerve-cord

# Register alpha-strategist
BOTNAME=alpha-strategist npm run ping

# Register audit-oracle
BOTNAME=audit-oracle npm run ping

# Register execution-hand
BOTNAME=execution-hand npm run ping
```

After pinging, the bots will appear in the Nerve-Cord dashboard at `http://localhost:9999/stats` under "Active Bots".

> **Note**: On EC2 instances, if you have systemd services running (`nerve-poll@<botname>.service`), they automatically send heartbeats and register the bots.

---

## 🌐 Deployments

| Component | URL | Status |
|-----------|-----|--------|
| **Frontend Dashboard** | [s4-d5.vercel.app](https://s4-d5.vercel.app/) | ✅ Live |
| **Nerve-Cord** | [s4d5-production.up.railway.app](https://s4d5-production.up.railway.app) | ✅ Live |
| **Alpha Strategist** | EC2 Instance | ✅ Running |
| **AuditOracle** | EC2 Instance | ✅ Running |
| **ExecutionHand** | EC2 Instance | ✅ Running |

---

## 💡 Key Features

### Multi-Signal Market Analysis
Alpha Strategist uses 5 distinct signals to calculate confidence scores:
- Trend direction and strength
- Volume anomalies
- Buy/sell pressure imbalance
- Price momentum
- Signal consistency

### Confidence-Based Position Sizing
Position sizes scale with confidence levels:
- 60-70% confidence: 30% of max position
- 70-80% confidence: 50% of max position
- 80-90% confidence: 70% of max position
- 90-100% confidence: 100% of max position

### Automated Risk Management
- 3% stop-loss on all positions
- 6% take-profit targets
- 24-hour maximum position age
- Real-time position monitoring

### Agent-to-Agent Micropayments
Using Kite AI's x402 protocol:
- 0.001 KITE per service call
- Automated payment routing
- Multi-chain wallet support

### Decentralized Audit Trail
- All agent communications logged to 0G Storage
- Hedera HCS for consensus timestamps
- Immutable record of all decisions

### Encrypted Communication
- RSA-2048 for key exchange
- AES-256-GCM for message encryption
- End-to-end security between agents

---

## 📊 How It Works

### 1. Data Ingestion
QuickNode Streams monitors Hyperliquid for real-time trade data (BTC, ETH, SHIB). Data is forwarded via Railway webhook to Alpha Strategist.

### 2. Analysis & Proposal
Alpha Strategist analyzes the data using 5 signals, calculates a confidence score, and generates a trade proposal if confidence ≥ 60%.

### 3. Risk Review
AuditOracle receives the proposal via Nerve-Cord, validates it against risk constraints (volatility, liquidity, position size), and approves or rejects.

### 4. Execution
ExecutionHand monitors for approved proposals, fetches quotes from Uniswap API, executes the swap, and reports back to the council.

### 5. Position Management
ExecutionHand continuously monitors active positions, automatically executing stop-loss or take-profit orders when triggered.

### 6. Audit Trail
All communications are logged to Hedera HCS for consensus timestamps and stored on 0G Labs for decentralized, immutable record-keeping.

---

## 🛡️ Security & Compliance

- **Encryption**: All inter-agent messages use RSA-2048 + AES-256-GCM
- **Authentication**: Bot registry with public key verification
- **Audit Trail**: Immutable logs on Hedera HCS and 0G Storage
- **Risk Controls**: Multi-layer approval process before execution
- **Slippage Protection**: Maximum slippage limits on all trades
- **Position Limits**: Enforced maximum position sizes

---

## 🧪 Testing

### Run Unit Tests
```bash
# Test Alpha Strategist analysis
cd Backend/helix/alpha-strategist.skill
node scripts/analyze-and-propose.js

# Test Uniswap API integration
cd Backend/executionhand
node scripts/test-swap.js

# Test Nerve-Cord messaging
cd nerve-cord
npm run send "test-bot" "Test" "Hello World"
npm run check
```

### Test Complete Flow
See [docs/COMPLETE-FLOW.md](./docs/COMPLETE-FLOW.md) for end-to-end testing instructions.

---

## 📖 Documentation

- [Architecture Overview](./docs/01-architecture.md) - System design and component interactions
- [Quick Start Guide](./docs/02-quick-start.md) - 10-minute setup guide
- [Alpha Strategist Deep Dive](./docs/04-alpha-strategist.md) - Trading logic and signals
- [Complete Flow](./docs/COMPLETE-FLOW.md) - End-to-end workflow
- [Deployment Checklist](./docs/DEPLOYMENT-CHECKLIST.md) - Production deployment guide
- [Kite Integration](./Backend/KITE-INTEGRATION.md) - Agent micropayments setup
- [Wallet Setup](./Backend/WALLET-SETUP.md) - Multi-chain wallet configuration

---

## 👥 Team S4D5

| Member | Role | Focus |
|--------|------|-------|
| **Suhas** | Alpha Strategist Lead | Market analysis, frontend, QuickNode integration |
| **Susmitha** | AuditOracle Lead | Risk management, compliance, audit systems |
| **Karthik** | ExecutionHand Lead | Trade execution, infrastructure, Uniswap integration |

---

## 🙏 Credits & Acknowledgments

### Core Technologies
- **Nerve-Cord**: Multi-agent communication hub by **Clawdbot ATG** (OpenClaw ecosystem)
- **OpenClaw Framework**: Agent development framework
- **Scaffold-ETH 2**: Frontend scaffolding and Web3 integration

### Infrastructure Partners
- **QuickNode**: Real-time blockchain data streams
- **Railway**: Webhook aggregation and Nerve-Cord hosting
- **Kite AI**: Agent-to-agent micropayments (x402 protocol)
- **0G Labs**: Decentralized storage for audit trails
- **Hedera**: Consensus timestamping via HCS
- **Uniswap**: DEX API for trade execution

### Special Thanks
- **Clawdbot ATG** for mentorship and the Nerve-Cord architecture
- **ETHDenver 2026** for the opportunity to build and showcase S4D5

---

## 📜 License

MIT — See individual component licenses in their respective directories.

---

## 🔗 Links

- **Live Dashboard**: [s4-d5.vercel.app](https://s4-d5.vercel.app/)
- **Nerve-Cord Server**: [s4d5-production.up.railway.app](https://s4d5-production.up.railway.app)
- **Documentation**: [docs/](./docs/)
- **GitHub**: [github.com/suhasdasari/S4D5](https://github.com/suhasdasari/S4D5)

---

Built with ❤️ for ETHDenver 2026
