# S4D5 x Kite AI - Agent Economy Demo

**Live Demo:** https://s4-d5.vercel.app/

**GitHub:** https://github.com/suhasdasari/S4D5

---

## 🎯 What We Built

An autonomous AI hedge fund with 3 agents that use **Kite AI x402 micropayments** to pay each other for services. No human intervention required.

### The Agent Economy

```
┌─────────────────────────────────────────────────────────┐
│              S4D5 Multi-Agent Trading System             │
└─────────────────────────────────────────────────────────┘

1. Alpha Strategist analyzes market
   ↓
2. Sends proposal to AuditOracle
   💰 Pays 0.001 KITE for risk analysis (x402)
   ↓
3. AuditOracle validates proposal
   ↓
4. Sends to ExecutionHand
   💰 Pays 0.001 KITE for trade execution (x402)
   ↓
5. ExecutionHand executes on Base
   ↓
6. All payments logged on Kite chain
```

---

## 🔑 Key Features

### ✅ Agent Autonomy
- 3 autonomous agents running 24/7 on AWS EC2
- Automatic market analysis, proposal generation, and execution
- Zero manual wallet clicking

### ✅ x402 Micropayments
- **Alpha Strategist → AuditOracle**: 0.001 KITE per risk analysis
- **AuditOracle → ExecutionHand**: 0.001 KITE per trade execution
- Payments include metadata: service type, proposalId, description
- All payments logged on-chain with full transparency

### ✅ Multi-Chain Identity
- Same wallet address works on 4 chains:
  - **Kite AI** (payments)
  - **Base** (trade execution)
  - **Hedera** (governance)
  - **0G** (storage)

### ✅ Error Handling
- Graceful handling of insufficient funds
- Clear error messages and fallback behavior
- Proposals sent even if payment fails (with warning)

### ✅ Multi-Agent Coordination
- Claw/Bot consensus: 3 agents must agree before execution
- Agent-to-agent messaging via Nerve-Cord
- Glass box transparency: every decision logged

---

## 🔗 Live Transactions on Kite Testnet

### Agent Wallet Addresses

| Agent | Address | Kite Explorer |
|-------|---------|---------------|
| Alpha Strategist | `0xBe76B29B0ccEe48f77C02Cb6289E1Cea5579EDD5` | [View](https://testnet.kitescan.ai/address/0xBe76B29B0ccEe48f77C02Cb6289E1Cea5579EDD5) |
| AuditOracle | `0xF3bbD5682e671CdcDC42f52bDdecCB6a35D53aE1` | [View](https://testnet.kitescan.ai/address/0xF3bbD5682e671CdcDC42f52bDdecCB6a35D53aE1) |
| ExecutionHand | `0x7a41a15474bC6F534Be1D5F898A44C533De68A91` | [View](https://testnet.kitescan.ai/address/0x7a41a15474bC6F534Be1D5F898A44C533De68A91) |

### Example Transactions

**Alpha Strategist → AuditOracle (Risk Analysis Payment)**
- TX: `0x673533bcc22f07572426809066823edd5b362df6342ce8608a6e58750adaa0ed`
- Amount: 0.001 KITE
- Service: risk-analysis
- Explorer: https://testnet.kitescan.ai/tx/0x673533bcc22f07572426809066823edd5b362df6342ce8608a6e58750adaa0ed

**AuditOracle → ExecutionHand (Trade Execution Payment)**
- Amount: 0.001 KITE
- Service: trade-execution
- View all transactions on Kite Explorer

---

## 🏗️ Architecture

### Multi-Chain Coordination

```
┌──────────────┐
│   Kite AI    │  x402 micropayments between agents
│   (Testnet)  │  Agent identity & authentication
└──────────────┘
       ↓
┌──────────────┐
│   Hedera     │  HCS: Agent-to-agent messaging
│  (Mainnet)   │  HTS: Internal agent rewards ($S4D5)
└──────────────┘
       ↓
┌──────────────┐
│  0G Storage  │  Audit trail for all decisions
│  (Testnet)   │  Returns CID for attestations
└──────────────┘
       ↓
┌──────────────┐
│     Base     │  USDC vault for trading capital
│  (Mainnet)   │  Smart contract execution
└──────────────┘
```

### Payment Flow with Error Handling

```javascript
// 1. Initialize Kite wallet
const kiteWallet = new KiteWalletManager();
await kiteWallet.initialize();

// 2. Send proposal to AuditOracle
sendProposal(auditOracle, proposal);

// 3. Send x402 payment
const payment = await kiteWallet.sendPayment(
  auditOracleAddress,
  '0.001',
  {
    service: 'risk-analysis',
    proposalId: 'PROP-123',
    agent: 'alpha-strategist'
  }
);

// 4. Handle payment result
if (payment.success) {
  console.log(`✓ Paid: ${proposalId} → ${payment.txHash}`);
  console.log(`  Mapping: ${proposalId} → ${payment.txHash} → risk-analysis`);
} else {
  console.error(`❌ Payment failed: ${payment.error}`);
  
  if (payment.error.includes('Insufficient balance')) {
    console.error(`⚠️  CRITICAL: Wallet out of KITE!`);
    console.error(`   Fund at: https://faucet.gokite.ai`);
  }
  
  console.error(`ℹ️  Proposal sent but not paid.`);
  console.error(`ℹ️  AuditOracle may reject unpaid proposals.`);
}
```

---

## 🚀 How to Test

### Prerequisites
- Node.js v18+
- Git

### 1. Clone Repository
```bash
git clone https://github.com/suhasdasari/S4D5
cd S4D5
```

### 2. Install Dependencies
```bash
cd Backend/helix/alpha-strategist.skill
npm install
```

### 3. Test x402 Payment
```bash
node scripts/test-x402-payment.js
```

**Expected Output:**
```
=== x402 Agent-to-Agent Payment Test ===
[1/4] Loading Alpha Strategist wallet...
[Kite] Loaded wallet: 0xBe76B29B0ccEe48f77C02Cb6289E1Cea5579EDD5
[Kite] Balance: 0.1 KITE
[2/4] Loading AuditOracle wallet address...
[3/4] Checking balance...
[4/4] Sending x402 payment...
✅ Payment successful!
   Transaction: 0x673533bcc...
   Explorer: https://testnet.kitescan.ai/tx/0x673533bcc...
```

### 4. View on Kite Explorer
Open the explorer URL to see:
- Transaction details
- Payment metadata
- Block confirmation
- Gas used

---

## 📊 Action-to-Payment Mapping

Every agent action has a corresponding x402 payment:

| Action | Payer | Recipient | Amount | Service | ProposalId |
|--------|-------|-----------|--------|---------|------------|
| Market Analysis | Alpha Strategist | AuditOracle | 0.001 KITE | risk-analysis | PROP-123 |
| Trade Execution | AuditOracle | ExecutionHand | 0.001 KITE | trade-execution | PROP-123 |

**Logs show clear mapping:**
```
📊 Sent proposal to AuditOracle: Trade Proposal: LONG BTC
💰 PAID: PROP-123 → 0.001 KITE → AuditOracle (tx: 0x673533...) | Service: risk-analysis
```

---

## 🛡️ Security & Safety

### Key Management
- Private keys stored securely in `config/wallet.json` (gitignored)
- Each agent has isolated wallet
- Multi-chain identity (same key, different chains)

### Rate Limits
- Maximum 1 proposal per minute per agent
- Position size limits enforced
- Stop-loss and take-profit automatically set

### Error Handling
- Insufficient funds: Clear warning + fund instructions
- Payment failure: Proposal sent with warning flag
- Network errors: Retry logic with exponential backoff

---

## 🎨 Frontend Visualization

**Live Demo:** https://s4-d5.vercel.app/

Features:
- Real-time agent activity feed
- USDC vault balance
- Deposit/Withdraw functionality
- Position tracking
- (Coming soon: Kite payment history)

---

## 📚 Documentation

- **Kite Integration Guide**: [Backend/KITE-INTEGRATION.md](Backend/KITE-INTEGRATION.md)
- **EC2 Setup Guide**: [Backend/EC2-INSTALLATION-GUIDE.md](Backend/EC2-INSTALLATION-GUIDE.md)
- **Main README**: [README.md](README.md)

---

## 🏆 Why This Qualifies for Kite AI Bounty

### ✅ Requirements Met

1. **Build on Kite AI Testnet** ✅
   - All payments on Kite testnet
   - RPC: https://rpc-testnet.gokite.ai/
   - Chain ID: 2368

2. **x402 Payment Flows** ✅
   - Agent-to-agent micropayments
   - Payments tied to specific actions
   - Clear action-to-payment mapping in logs

3. **Verifiable Agent Identity** ✅
   - Wallet-based authentication
   - Each agent has unique address
   - Multi-chain identity

4. **Autonomous Execution** ✅
   - No manual wallet clicking
   - Agents run 24/7 on EC2
   - Automatic payment triggers

5. **Open Source** ✅
   - GitHub: https://github.com/suhasdasari/S4D5
   - MIT License

### ✅ Bonus Features

1. **Multi-Agent Coordination** ✅
   - 3 agents working together
   - Consensus mechanism
   - Agent-to-agent economy

2. **Error Handling** ✅
   - Insufficient funds detection
   - Graceful failure messages
   - Clear user instructions

3. **Real-World Applicability** ✅
   - Live trading system
   - Production deployment on AWS
   - Integrated with Base, Hedera, 0G

4. **Security Controls** ✅
   - Rate limits
   - Position size limits
   - Secure key management

---

## 🎯 Impact on Kite AI

### Reference Implementation
- Shows how to integrate x402 into existing agent systems
- Demonstrates multi-agent coordination with payments
- Provides error handling patterns

### Protocol Feedback
- Need for batch payments (multiple proposals at once)
- Request for payment history API
- Suggestion: Agent reputation based on payment history

### Use Cases Validated
- Agent-to-agent service marketplace
- Micropayments for AI services
- Multi-chain agent identity

---

## 📞 Contact

- **Team**: Suhas, Susmitha, Karthik
- **GitHub**: https://github.com/suhasdasari/S4D5
- **Demo**: https://s4-d5.vercel.app/

---

## 🙏 Acknowledgments

Built with:
- **Kite AI** - Agent payment infrastructure
- **Base** - Smart contract execution
- **Hedera** - Agent messaging & governance
- **0G** - Decentralized storage
- **Coinbase AgentKit** - Wallet management

---

**Last Updated**: February 21, 2025
