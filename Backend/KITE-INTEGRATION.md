# Kite AI Integration - x402 Agent Payments

This document describes the Kite AI integration for agent-to-agent micropayments using the x402 protocol.

## Overview

**What it does:** Enables AI agents to pay each other for services using Kite AI's native payment rails.

**When it triggers:** Agents automatically pay for services (e.g., Alpha Strategist pays AuditOracle for risk analysis).

**What gets paid:** Micropayments in KITE tokens (e.g., $0.01 per service call).

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  S4D5 Agent Economy                      │
└─────────────────────────────────────────────────────────┘

1. Alpha Strategist proposes trade
   ↓
2. Pays AuditOracle 0.001 KITE for risk analysis (x402)
   ↓
3. AuditOracle validates and returns verdict
   ↓
4. Pays ExecutionHand 0.001 KITE for execution (x402)
   ↓
5. ExecutionHand executes trade on Base
   ↓
6. All payments logged on Kite chain
```

---

## Setup

### 1. Install Dependencies

```bash
cd Backend/helix/alpha-strategist.skill
npm install ethers
```

### 2. Initialize Agent Wallets

Create Kite wallets for all 3 agents:

```bash
# Alpha Strategist
cd Backend/helix/alpha-strategist.skill
node scripts/init-kite-wallet.js

# AuditOracle
cd Backend/auditoracle
node scripts/init-kite-wallet.js

# ExecutionHand
cd Backend/executionhand
node scripts/init-kite-wallet.js
```

Each agent will get a unique Kite wallet address.

### 3. Fund Wallets

Visit https://faucet.gokite.ai and fund each wallet:

- Paste the wallet address
- Request testnet tokens
- Wait for confirmation

### 4. Verify Balances

Run init script again to check balance:

```bash
node scripts/init-kite-wallet.js
```

---

## Usage

### Test x402 Payment

```bash
cd Backend/helix/alpha-strategist.skill
node scripts/test-x402-payment.js
```

This will:
1. Load Alpha Strategist wallet
2. Load AuditOracle wallet address
3. Send 0.001 KITE payment
4. Log transaction to Kite chain
5. Return transaction hash and explorer URL

### Integration with Agent Workflow

```javascript
const { KiteWalletManager } = require('./lib/kite-wallet');

// Initialize wallet
const wallet = new KiteWalletManager();
await wallet.initialize();

// Send payment for service
const payment = await wallet.sendPayment(
  recipientAddress,
  '0.001', // Amount in KITE
  {
    service: 'risk-analysis',
    proposalId: 'PROP-0201',
    agent: 'alpha-strategist'
  }
);

if (payment.success) {
  console.log(`Payment sent: ${payment.txHash}`);
  console.log(`View on explorer: ${payment.explorerUrl}`);
}
```

---

## Configuration

### Environment Variables

Add to `.env`:

```env
# Kite AI Testnet
KITE_RPC=https://rpc-testnet.gokite.ai/
KITE_CHAIN_ID=2368
```

### Wallet Files

Each agent stores its wallet in:
- `Backend/helix/alpha-strategist.skill/config/kite-wallet.json`
- `Backend/auditoracle/config/kite-wallet.json`
- `Backend/executionhand/config/kite-wallet.json`

**⚠️ NEVER commit these files to git!** (Already in `.gitignore`)

---

## x402 Payment Flow

### 1. Service Request
Alpha Strategist needs risk analysis from AuditOracle.

### 2. Payment Authorization
Alpha Strategist signs payment transaction:
```javascript
const payment = await strategistWallet.sendPayment(
  auditOracleAddress,
  '0.001',
  { service: 'risk-analysis', proposalId: 'PROP-0201' }
);
```

### 3. On-Chain Settlement
Transaction is broadcast to Kite chain and confirmed in ~2 seconds.

### 4. Service Delivery
AuditOracle receives payment confirmation and performs risk analysis.

### 5. Verification
All payments are logged on-chain and can be verified at:
https://testnet.kitescan.ai/address/{agentAddress}

---

## Resources

- **Kite AI Docs**: https://docs.gokite.ai/
- **Testnet Faucet**: https://faucet.gokite.ai
- **Testnet Explorer**: https://testnet.kitescan.ai
- **RPC Endpoint**: https://rpc-testnet.gokite.ai/
- **Chain ID**: 2368

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `Wallet not initialized` | Run `init-kite-wallet.js` first |
| `Insufficient balance` | Fund wallet at https://faucet.gokite.ai |
| `Transaction failed` | Check balance and RPC endpoint |
| `Recipient address not found` | Initialize recipient wallet first |

---

## Integration with Other Chains

### Hedera (Governance)
- Hedera HCS logs agent decisions
- Kite logs agent payments
- Both reference the same `proposalId`

### 0G Storage (Audit Trail)
- 0G stores full decision blobs
- Kite stores payment receipts
- Both linked via `proposalId`

### Base (Execution)
- Base executes trades with USDC
- Kite pays agents for services
- Separate chains, complementary roles

---

## Demo Flow

1. **Show Agent Wallets**
   - Display 3 agent addresses
   - Show balances on Kite Explorer

2. **Trigger Payment**
   - Run `test-x402-payment.js`
   - Show transaction hash
   - Open Kite Explorer to verify

3. **Show Payment History**
   - Query agent address on Kite Explorer
   - Show all incoming/outgoing payments
   - Prove agent-to-agent economy

---

## Next Steps

1. **Integrate with Nerve-Cord**
   - Log payments to Nerve-Cord activity feed
   - Show payment status in agent terminal

2. **Add to Frontend**
   - Display agent wallet balances
   - Show recent x402 payments
   - Link to Kite Explorer

3. **Automate Payments**
   - Trigger payments automatically when agents interact
   - No manual intervention required

---

## Summary

**What we built:** x402 micropayment system for agent-to-agent services on Kite AI.

**Status:** Wallets created, payment flow implemented, ready for testnet demo.

**Next:** Fund wallets, test payments, integrate with frontend.
