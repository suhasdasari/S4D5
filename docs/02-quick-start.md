# Quick Start Guide

Get S4D5 running in 10 minutes.

## Prerequisites

- 3 EC2 instances (Ubuntu 22.04)
- Node.js 18+ installed on each
- OpenClaw installed on each
- QuickNode account (for blockchain data)
- OpenAI API key (for LLM agent)

## Step 1: Clone Repository (on each EC2)

```bash
cd ~
git clone https://github.com/suhasdasari/S4D5.git
cd S4D5
```

## Step 2: Configure Environment

Create `.env` file:

```bash
cd ~/S4D5
nano .env
```

Add:

```bash
# QuickNode
WEBHOOK_API_URL=https://s4d5-production-f42d.up.railway.app/dashboard

# Nerve-Cord
NERVE_CORD_PATH=/home/ubuntu/S4D5/nerve-cord
NERVE_SERVER=https://s4d5-production.up.railway.app
NERVE_TOKEN=your-bearer-token
NERVE_BOTNAME=alpha-strategist  # or audit-oracle, execution-hand

# Agent Config
ANALYSIS_INTERVAL=30000
MIN_CONFIDENCE=60

# Kite AI
KITE_RPC=https://rpc-testnet.gokite.ai/
KITE_CHAIN_ID=2368

# Addresses
AUDIT_ORACLE_ADDRESS=0xF3bbD5682e671CdcDC42f52bDdecCB6a35D53aE1

# OpenAI (for LLM agent)
OPENAI_API_KEY=sk-your-key-here
```

## Step 3: Install Dependencies

```bash
# Alpha Strategist
cd ~/S4D5/Backend/helix/alpha-strategist.skill
npm install

# Nerve-Cord
cd ~/S4D5/nerve-cord
npm install
```

## Step 4: Initialize Wallets

```bash
cd ~/S4D5/Backend/helix/alpha-strategist.skill

# Create wallets
node scripts/init-wallet.js
node scripts/init-kite-wallet.js

# Fund Kite wallet
cat config/kite-wallet.json | grep address
# Visit: https://faucet.gokite.ai
```

## Step 5: Setup OpenClaw Skills

```bash
# Copy skills to OpenClaw
mkdir -p ~/.openclaw/skills
cp ~/S4D5/Backend/helix/alpha-strategist.skill/STREAMING-ANALYSIS-SKILL.md \
   ~/.openclaw/skills/streaming-analysis.md

mkdir -p ~/.openclaw/agents/alpha-strategist
cp ~/S4D5/Backend/helix/alpha-strategist.skill/ALPHA-STRATEGIST-IDENTITY.md \
   ~/.openclaw/agents/alpha-strategist/identity.md
```

## Step 6: Register OpenClaw Cron Job

```bash
# Create cron job for Alpha Strategist
openclaw cron add \
  --name "stream-analyzer" \
  --schedule "*/30 * * * * *" \
  --command "node ~/S4D5/Backend/helix/alpha-strategist.skill/scripts/stream-analyzer.js"

# Verify
openclaw cron list
```

## Step 7: Start Nerve-Cord Polling

```bash
cd ~/S4D5/nerve-cord

# Test poll
node poll.js

# Setup systemd service (recommended)
sudo cp automation/nerve-poll@.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable nerve-poll@alpha-strategist
sudo systemctl start nerve-poll@alpha-strategist
```

## Step 8: Verify Everything Works

```bash
# Check Alpha Strategist is running
ps aux | grep stream-analyzer

# Check Nerve-Cord polling
sudo systemctl status nerve-poll@alpha-strategist

# Check logs
tail -f /var/log/alpha-strategist.log

# Check Nerve-Cord messages
cd ~/S4D5/nerve-cord
npm run check
```

## Step 9: Monitor

```bash
# Real-time logs
tail -f /var/log/alpha-strategist.log

# Check proposals
cd ~/S4D5/nerve-cord
npm run check

# Check Kite balance
cd ~/S4D5/Backend/helix/alpha-strategist.skill
node openclaw-tools/check-balance.js
```

## Step 10: Test End-to-End

Wait 30 seconds for first analysis cycle. You should see:

```
[2026-02-21T05:00:00.000Z] 🔄 Polling dashboard API...
[Data] Received: 150 trades (BTC: 100, ETH: 50)
[BTC] Analyzing...
[BTC] → Confidence: 75% (LONG)
[BTC] 🎯 Proposal generated
[Proposal] ✓ Sent successfully
[Payment] ✓ Sent 0.001 KITE
```

## Troubleshooting

**No proposals being sent:**
- Check `MIN_CONFIDENCE` in `.env` (lower to 30 for testing)
- Verify webhook is accessible: `curl $WEBHOOK_API_URL`

**Wallet errors:**
- Reinitialize: `node scripts/init-kite-wallet.js`
- Fund wallet: https://faucet.gokite.ai

**OpenClaw not triggering:**
- Check cron job: `openclaw cron list`
- Check logs: `openclaw logs`

---

Next: [Environment Setup](./03-environment-setup.md)
