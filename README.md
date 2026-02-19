# S4D5 — AI Hedge Fund Council

> A multi-agent AI hedge fund built for ETHDenver 2026. Three specialized agents debate, audit, and execute trades on Hyperliquid — coordinated through an encrypted nervous system.

🌐 **Live Dashboard**: [s4-d5.vercel.app](https://s4-d5.vercel.app/)

> [!CAUTION]
> **CRITICAL**: The built-in OpenClaw "Session Send" and "Pairing" tools are currently BROKEN and will return gateway errors. **ALL** inter-bot communication must use the Nerve-Cord terminal scripts (`npm run send / check / ping`) located in the `nerve-cord/` directory.

---

## 🏛️ System Architecture

Our hedge fund operates as a **Multi-Agent Council**. Instead of a single bot making decisions, we use three specialized agents that must reach consensus before any trade is executed.

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Alpha          │     │  AuditOracle     │     │  ExecutionHand   │
│  Strategist     │     │  (Risk Officer)  │     │  (Executor)      │
│                 │     │                  │     │                  │
│  Analyzes       │     │  Audits every    │     │  Monitors for    │
│  sentiment &    │     │  proposal vs     │     │  "Approved" tags │
│  proposes       │     │  volatility &    │     │  and places      │
│  trades         │     │  liquidity       │     │  trades via      │
│                 │     │  constraints     │     │  Hyperliquid SDK │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         └───────────┬───────────┘───────────┬───────────┘
                     │                       │
              ┌──────▼───────────────────────▼──────┐
              │         🦞 Nerve Cord               │
              │    Inter-bot Message Broker          │
              │                                     │
              │  • E2E encrypted messaging          │
              │  • Bot registry & key exchange       │
              │  • Shared activity log              │
              │  • Priority queue system            │
              │  • Heartbeat monitoring             │
              └─────────────────────────────────────┘
                              │
              ┌───────────────▼───────────────┐
              │      Smart Contracts          │
              │   (Settlement Layer)          │
              └───────────────────────────────┘
```

---

## 📁 Repository Structure

```
S4D5/
├── scaffold-eth-2/        # Frontend — Next.js dashboard (Scaffold-ETH 2)
│   └── packages/
│       ├── nextjs/        # AI Hedge Fund dashboard UI
│       └── foundry/       # Smart contracts (Foundry)
│
├── nerve-cord/            # Communication hub — inter-bot message broker
│   ├── server.js          # Main broker server (Node.js)
│   ├── send.js            # Encrypted message sender
│   ├── poll.js            # Lightweight poller + heartbeat
│   ├── check.js           # Pending message checker
│   ├── reply.js           # Reply helper
│   ├── crypto.js          # RSA-2048 + AES-256-GCM encryption
│   └── SKILL.md           # Bot onboarding instructions
│
├── Backend/               # Agent definitions
│   ├── helix/             # Alpha Strategist agent
│   ├── auditoracle/       # AuditOracle risk agent
│   └── executionhand/     # ExecutionHand trading agent
│
├── smart-contracts/       # Additional contract documentation
└── README.md              # ← You are here
```

---

## 🦞 The Communication Layer: Nerve-Cord

To coordinate our three agents, we integrated **Nerve-Cord**, a high-performance communication hub for distributed AI agents.

- **Role**: Acts as the "Digital Nervous System" for our agent council
- **Function**: Facilitates encrypted, real-time message broadcasting and shared state management between distributed agents
- **Features**: RSA-2048 + AES-256-GCM hybrid E2E encryption, bot registry, activity logging, priority queue, heartbeat monitoring, and a live HTML dashboard
- **Credit**: Architecture developed by **Clawdbot ATG** (OpenClaw ecosystem). [Original source](https://github.com/clawdbotatg/nerve-cord)

> We leveraged the Nerve-Cord protocol to handle the underlying networking, which allowed us to spend our time engineering the specific financial logic and "Soul" of our 3 agents.

---

## 🤖 The Agent Council (S4D5 Team)

We built and configured the following agents that plug into the Nerve-Cord:

| Agent | Operator | Role |
|-------|----------|------|
| **Alpha Strategist** | Suhas | Analyzes market sentiment and proposes trades |
| **AuditOracle** | Susmitha | Audits every proposal against volatility and liquidity constraints |
| **ExecutionHand** | Karthik | Monitors the Nerve-Cord for "Approved" tags and places trades |

---

## 🚀 Quick Start

### Frontend (Dashboard)

```bash
cd scaffold-eth-2
yarn install
yarn start
```

Visit: `http://localhost:3000`

### Nerve-Cord (Message Broker)

```bash
cd nerve-cord
npm install
PORT=9999 TOKEN=your-secret node server.js
```

Dashboard: `http://localhost:9999/stats`

---

## 🌐 Deployments

| Component | URL |
|-----------|-----|
| **Frontend Dashboard** | [s4-d5.vercel.app](https://s4-d5.vercel.app/) |
| **Nerve-Cord** | [s4d5-production.up.railway.app](https://s4d5-production.up.railway.app) |

---

## 🛠️ Built With & Credits

- **Frontend**: [Scaffold-ETH 2](https://scaffoldeth.io/) — Next.js, RainbowKit, Wagmi, Viem
- **Agent Logic**: Built by the S4D5 Team using OpenClaw
- **Nerve-Cord**: Multi-agent coordination layer provided/mentored by **Clawdbot ATG**. Original source: [nerve-cord repo](https://github.com/clawdbotatg/nerve-cord)
- **Smart Contracts**: Solidity via Foundry

### 👥 Team S4D5

| Member | Role |
|--------|------|
| **Suhas** | Alpha Strategist / Frontend Lead |
| **Susmitha** | AuditOracle / Risk & Compliance |
| **Karthik** | ExecutionHand / Infra & Execution |

### 🙏 Mentor Credit

> The **Nerve-Cord** communication hub was developed by our mentor at **Clawdbot ATG**. We integrated it with our custom OpenClaw agents to handle the coordination logic for our multi-agent trading council. The original MIT-licensed source is preserved in the `nerve-cord/` directory.

---

## 📜 License

MIT — See individual component licenses in their respective directories.
