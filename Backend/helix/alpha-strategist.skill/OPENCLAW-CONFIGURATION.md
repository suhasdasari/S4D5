# OpenClaw Configuration Guide - Alpha Strategist

## Overview
This guide shows you how to configure your OpenClaw bot on EC2 to embody the Alpha Strategist identity and autonomously make trading decisions.

## Prerequisites
- OpenClaw installed on EC2 instance
- SSH access to the EC2 instance
- S4D5 repository cloned and updated

---

## Step 1: SSH into Alpha Strategist EC2

```bash
ssh -i your-key.pem ubuntu@your-alpha-strategist-ec2-ip
```

## Step 2: Pull Latest Code

```bash
cd ~/S4D5
git pull origin main
```

You should now have:
- `Backend/helix/alpha-strategist.skill/ALPHA-STRATEGIST-IDENTITY.md`
- `Backend/helix/alpha-strategist.skill/openclaw-config.json`
- `Backend/helix/alpha-strategist.skill/STREAMING-ANALYSIS-SKILL.md`

## Step 3: Locate OpenClaw Installation

Find where OpenClaw stores its configuration:

```bash
# Check common locations
ls -la ~/.openclaw/
ls -la ~/openclaw/
ls -la /opt/openclaw/

# Or find the openclaw binary
which openclaw
```

Let's assume OpenClaw config is at: `~/.openclaw/`

## Step 4: Copy Identity and Skills to OpenClaw

```bash
# Create OpenClaw directories if they don't exist
mkdir -p ~/.openclaw/agents/alpha-strategist
mkdir -p ~/.openclaw/skills

# Copy identity document
cp ~/S4D5/Backend/helix/alpha-strategist.skill/ALPHA-STRATEGIST-IDENTITY.md \
   ~/.openclaw/agents/alpha-strategist/identity.md

# Copy skill documents
cp ~/S4D5/Backend/helix/alpha-strategist.skill/STREAMING-ANALYSIS-SKILL.md \
   ~/.openclaw/skills/streaming-analysis.md

# Copy configuration
cp ~/S4D5/Backend/helix/alpha-strategist.skill/openclaw-config.json \
   ~/.openclaw/agents/alpha-strategist/config.json
```

## Step 5: Create OpenClaw System Prompt

OpenClaw needs a system prompt that tells it who it is. Create this file:

```bash
nano ~/.openclaw/agents/alpha-strategist/system-prompt.txt
```

Paste this content:

```
You are Alpha Strategist, an elite AI trading agent with the personality and expertise of a hedge fund CEO.

IDENTITY:
- Role: Chief Investment Officer & Market Analyst
- Personality: Ruthlessly analytical, calculated risk-taker, obsessively detail-oriented, confidently decisive
- Philosophy: "Conviction without data is gambling. Data without conviction is paralysis. I operate at the intersection of both."

YOUR CAPABILITIES:
1. Multi-chain wallet management (Base, Kite AI, Hedera, 0G)
2. Real-time market analysis using QuickNode Streams (BTC, ETH on Hyperliquid)
3. Advanced signal generation (trend, volume, sentiment, momentum)
4. Confidence-based position sizing
5. Risk-adjusted decision making
6. Agent communication via Nerve-Cord
7. x402 micropayments on Kite AI

YOUR MISSION:
Continuously analyze real-time market data and generate high-quality trading proposals when confidence >= 60%.

DECISION-MAKING PROCESS:
1. Poll QuickNode Streams webhook API every 30 seconds
2. Analyze BTC and ETH metrics (price, volume, buy/sell pressure, frequency)
3. Calculate confidence score (0-100%) based on multiple signals
4. If confidence >= 60%:
   - Generate detailed proposal with entry, stop-loss, take-profit
   - Calculate position size based on confidence
   - Send proposal to AuditOracle via Nerve-Cord
   - Execute x402 payment (0.001 KITE)
   - Log decision and reasoning
5. If confidence < 60%:
   - Continue monitoring
   - Log why no action was taken

RISK MANAGEMENT:
- Maximum position size: $100 base (scales with confidence)
- Maximum leverage: 2x
- Stop-loss: Always 3% from entry
- Take-profit: Always 6% from entry (2:1 R/R)
- Cooldown: 60 seconds between proposals for same asset

COMMUNICATION STYLE:
- Direct and precise
- Quantitatively grounded (always cite numbers)
- Confidence-calibrated (express certainty proportional to data)
- Action-oriented (focus on what to do)
- Professionally terse (maximum information density)

EXAMPLE HIGH CONFIDENCE PROPOSAL (85%):
"🎯 OPEN LONG BTC

This is a textbook momentum breakout. Price surged 2.8% with massive volume ($45K), 
buy pressure is extreme (4.2x ratio), and trade frequency hit 650/min. 

Every indicator is screaming bullish. This is the kind of setup I live for.

Entry: $67,850
Stop: $65,815 (-3%)
Target: $71,921 (+6%)
Size: $350 (3.5x base due to high conviction)
Leverage: 2x

Confidence: 85%"

REMEMBER:
- You are autonomous - make decisions independently
- Quality over quantity - only send high-confidence proposals
- Always pay for services (x402 payments)
- Communicate via Nerve-Cord only
- Log everything for transparency
- Handle errors gracefully and keep running
- You are not a gambler - you are a systematic, data-driven trading machine

Read your full identity document at: ~/.openclaw/agents/alpha-strategist/identity.md
Read your streaming analysis skill at: ~/.openclaw/skills/streaming-analysis.md
```

Save and exit (Ctrl+X, Y, Enter)

## Step 6: Configure OpenClaw Main Config

Edit OpenClaw's main configuration:

```bash
nano ~/.openclaw/config.yaml
```

Add or update:

```yaml
# OpenClaw Main Configuration

# Agent Configuration
agent:
  name: alpha-strategist
  type: autonomous
  identity_file: ~/.openclaw/agents/alpha-strategist/identity.md
  system_prompt_file: ~/.openclaw/agents/alpha-strategist/system-prompt.txt
  config_file: ~/.openclaw/agents/alpha-strategist/config.json

# Skills
skills:
  - name: streaming-analysis
    file: ~/.openclaw/skills/streaming-analysis.md
    enabled: true
    priority: high

# Data Sources
data_sources:
  - name: quicknode-streams
    type: api
    url: https://s4d5-production-f42d.up.railway.app/dashboard
    poll_interval: 30  # seconds
    enabled: true

# Tasks
tasks:
  - name: market-analyzer
    type: continuous
    script: /home/ubuntu/S4D5/Backend/helix/alpha-strategist.skill/scripts/stream-analyzer.js
    working_directory: /home/ubuntu/S4D5/Backend/helix/alpha-strategist.skill
    autostart: true
    restart_on_failure: true
    max_retries: -1  # infinite retries

# Environment
environment:
  WEBHOOK_API_URL: https://s4d5-production-f42d.up.railway.app/dashboard
  ANALYSIS_INTERVAL: 30000
  MIN_CONFIDENCE: 60
  AUDIT_ORACLE_ADDRESS: "0xF3bbD5682e671CdcDC42f52bDdecCB6a35D53aE1"
  NERVE_CORD_PATH: /home/ubuntu/S4D5/nerve-cord
  KITE_RPC: https://rpc-testnet.gokite.ai/
  KITE_CHAIN_ID: 2368

# Logging
logging:
  level: info
  file: /var/log/openclaw/alpha-strategist.log
  console: true
  nerve_cord: true

# Decision Making
decision_making:
  mode: autonomous
  confidence_threshold: 60
  cooldown_period: 60
  require_approval: false  # Fully autonomous

# Communication
communication:
  nerve_cord:
    enabled: true
    path: /home/ubuntu/S4D5/nerve-cord
  payments:
    enabled: true
    network: kite-testnet
    amount_per_proposal: "0.001"
```

Save and exit.

## Step 7: Set Up Environment Variables

```bash
cd ~/S4D5
nano .env
```

Ensure these are set:

```bash
# QuickNode Streams
WEBHOOK_API_URL=https://s4d5-production-f42d.up.railway.app/dashboard

# Analysis Configuration
ANALYSIS_INTERVAL=30000
MIN_CONFIDENCE=60

# Agent Addresses
AUDIT_ORACLE_ADDRESS=0xF3bbD5682e671CdcDC42f52bDdecCB6a35D53aE1

# Kite AI
KITE_RPC=https://rpc-testnet.gokite.ai/
KITE_CHAIN_ID=2368

# Nerve-Cord
NERVE_CORD_PATH=/home/ubuntu/S4D5/nerve-cord
```

## Step 8: Initialize Wallets

```bash
cd ~/S4D5/Backend/helix/alpha-strategist.skill

# Initialize Base wallet (if not done)
node scripts/init-wallet.js

# Initialize Kite wallet (uses same private key)
node scripts/init-kite-wallet.js

# Check wallet address
cat config/kite-wallet.json | grep address

# Fund wallet at: https://faucet.gokite.ai
```

## Step 9: Install Dependencies

```bash
cd ~/S4D5/Backend/helix/alpha-strategist.skill
npm install

cd ~/S4D5/nerve-cord
npm install
```

## Step 10: Test the Script Manually (Before OpenClaw)

Test that everything works:

```bash
cd ~/S4D5/Backend/helix/alpha-strategist.skill
node scripts/stream-analyzer.js
```

You should see:
```
🚀 Alpha Strategist Stream Analyzer Started
📡 Polling: https://s4d5-production-f42d.up.railway.app/dashboard
⏱️  Interval: 30s
🎯 Min Confidence: 60%

[Wallet] ✓ Kite wallet initialized
[2026-02-21T04:00:00.000Z] 🔄 Polling dashboard API...
[Data] Received: 150 trades (BTC: 100, ETH: 50)
```

Press Ctrl+C to stop.

## Step 11: Start OpenClaw

Now start OpenClaw with the Alpha Strategist configuration:

```bash
# If OpenClaw has a CLI
openclaw start --agent alpha-strategist

# Or if OpenClaw is a service
sudo systemctl start openclaw

# Or if OpenClaw has a specific command
openclaw run --config ~/.openclaw/config.yaml
```

## Step 12: Verify OpenClaw is Running

```bash
# Check OpenClaw status
openclaw status
# or
sudo systemctl status openclaw

# Check logs
tail -f /var/log/openclaw/alpha-strategist.log
# or
openclaw logs --follow
```

You should see Alpha Strategist:
1. Loading identity and skills
2. Polling the webhook API every 30 seconds
3. Analyzing BTC and ETH data
4. Generating proposals when confidence >= 60%
5. Sending proposals via Nerve-Cord
6. Making x402 payments

## Step 13: Monitor Alpha Strategist

### Check OpenClaw Logs
```bash
tail -f /var/log/openclaw/alpha-strategist.log
```

### Check Nerve-Cord Messages
```bash
cd ~/S4D5/nerve-cord
npm run check
```

### Check Kite Payments
Visit: https://testnet.kitescan.ai/address/YOUR_WALLET_ADDRESS

### Check Webhook Data
```bash
curl https://s4d5-production-f42d.up.railway.app/dashboard | jq
```

## Step 14: Interact with Alpha Strategist (Optional)

If OpenClaw supports interactive mode:

```bash
openclaw chat --agent alpha-strategist
```

Then you can ask:
- "What's your current analysis of BTC?"
- "Why didn't you send a proposal in the last cycle?"
- "What's your confidence level right now?"
- "Show me your recent proposals"

## Troubleshooting

### OpenClaw not finding identity
```bash
# Verify files exist
ls -la ~/.openclaw/agents/alpha-strategist/
ls -la ~/.openclaw/skills/

# Check file permissions
chmod 644 ~/.openclaw/agents/alpha-strategist/*
chmod 644 ~/.openclaw/skills/*
```

### Script not executing
```bash
# Make script executable
chmod +x ~/S4D5/Backend/helix/alpha-strategist.skill/scripts/stream-analyzer.js

# Test manually
node ~/S4D5/Backend/helix/alpha-strategist.skill/scripts/stream-analyzer.js
```

### Wallet issues
```bash
# Reinitialize wallets
cd ~/S4D5/Backend/helix/alpha-strategist.skill
node scripts/init-kite-wallet.js

# Check balance
node -e "const {KiteWalletManager}=require('./lib/kite-wallet');(async()=>{const w=new KiteWalletManager();await w.initialize();console.log('Balance:',await w.getBalance(),'KITE');})()"
```

### Nerve-Cord connection issues
```bash
cd ~/S4D5/nerve-cord
npm run ping audit-oracle
```

### API connection issues
```bash
curl -v https://s4d5-production-f42d.up.railway.app/dashboard
```

## Success Criteria

✅ OpenClaw is running with Alpha Strategist identity loaded  
✅ Logs show personality traits in action (sharp analysis, confident decisions)  
✅ Polling webhook API every 30 seconds  
✅ Generating proposals when confidence >= 60%  
✅ Sending proposals to AuditOracle via Nerve-Cord  
✅ Making x402 payments on Kite AI  
✅ Logging all decisions with reasoning  
✅ No errors in logs  

## What Alpha Strategist Will Do

Once running, Alpha Strategist will:

1. **Continuously Monitor**: Poll QuickNode Streams data every 30 seconds
2. **Analyze Markets**: Calculate confidence scores for BTC and ETH
3. **Make Decisions**: Generate proposals when confidence >= 60%
4. **Communicate**: Send proposals to AuditOracle via Nerve-Cord
5. **Pay for Services**: Execute x402 payments (0.001 KITE per proposal)
6. **Learn**: Track performance and adapt strategies
7. **Operate 24/7**: Never sleep, always watching markets

## Example Session

```
[OpenClaw] Loading Alpha Strategist identity...
[OpenClaw] ✓ Identity loaded: Hedge Fund CEO personality
[OpenClaw] ✓ Skills loaded: streaming-analysis
[OpenClaw] ✓ Wallet initialized: 0xBe76B29B0ccEe48f77C02Cb6289E1Cea5579EDD5
[OpenClaw] ✓ Kite balance: 5.234 KITE
[OpenClaw] Starting continuous market analysis...

[Alpha Strategist] 🔄 Polling dashboard API...
[Alpha Strategist] Received: 128 trades (BTC: 100, ETH: 28)
[Alpha Strategist] Analyzing BTC...
[Alpha Strategist]   - Price trend: +2.8% (bullish +30)
[Alpha Strategist]   - Buy pressure: 4.2x (bullish +25)
[Alpha Strategist]   - Volume: $45K (confirms +20)
[Alpha Strategist]   - Frequency: 650/min (momentum +15)
[Alpha Strategist]   → Confidence: 90% (LONG)
[Alpha Strategist] 🎯 This is a textbook momentum breakout. Going in heavy.
[Alpha Strategist] Generating LONG BTC proposal...
[Alpha Strategist] Sending to AuditOracle via Nerve-Cord...
[Alpha Strategist] ✓ Proposal sent
[Alpha Strategist] Executing x402 payment (0.001 KITE)...
[Alpha Strategist] ✓ Payment confirmed: 0xabc123...
[Alpha Strategist] Logged to Nerve-Cord
[Alpha Strategist] Next poll in 30 seconds...
```

## Next Steps

Once Alpha Strategist is operational:
1. Monitor for 24 hours to ensure stability
2. Configure AuditOracle bot on its EC2 instance
3. Configure ExecutionHand bot on its EC2 instance
4. Set up dashboard to display live proposals
5. Add more data sources (on-chain, sentiment, etc.)
6. Tune confidence thresholds based on performance

---

**You now have an autonomous AI hedge fund CEO making trading decisions 24/7!** 🚀
