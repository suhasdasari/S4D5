# Add Alpha Strategist Skill to Existing OpenClaw

This guide shows you how to add the Alpha Strategist skill to your already-running OpenClaw bot.

## Prerequisites
✅ OpenClaw installed and running on EC2  
✅ SSH access to EC2 instance  
✅ S4D5 repository cloned  

---

## Step 1: SSH into Your EC2 Instance

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
- `Backend/helix/alpha-strategist.skill/STREAMING-ANALYSIS-SKILL.md`
- `Backend/helix/alpha-strategist.skill/scripts/stream-analyzer.js`
- `Backend/helix/alpha-strategist.skill/openclaw-config.json`

## Step 3: Locate OpenClaw Skills Directory

Find where OpenClaw stores skills:

```bash
# Check common locations
ls -la ~/.openclaw/skills/
ls -la ~/openclaw/skills/
ls -la /opt/openclaw/skills/

# Or check OpenClaw config
openclaw config show
```

Let's assume OpenClaw skills are at: `~/.openclaw/skills/`

## Step 4: Copy Skill Files to OpenClaw

```bash
# Create skills directory if it doesn't exist
mkdir -p ~/.openclaw/skills

# Copy the streaming analysis skill
cp ~/S4D5/Backend/helix/alpha-strategist.skill/STREAMING-ANALYSIS-SKILL.md \
   ~/.openclaw/skills/streaming-analysis.md

# Copy the identity document (optional but recommended)
mkdir -p ~/.openclaw/agents/alpha-strategist
cp ~/S4D5/Backend/helix/alpha-strategist.skill/ALPHA-STRATEGIST-IDENTITY.md \
   ~/.openclaw/agents/alpha-strategist/identity.md
```

## Step 5: Install Dependencies

```bash
cd ~/S4D5/Backend/helix/alpha-strategist.skill
npm install

# Also ensure nerve-cord dependencies are installed
cd ~/S4D5/nerve-cord
npm install
```

## Step 6: Initialize Wallets (If Not Done)

```bash
cd ~/S4D5/Backend/helix/alpha-strategist.skill

# Initialize Base wallet (if not already done)
node scripts/init-wallet.js

# Initialize Kite wallet (uses same private key)
node scripts/init-kite-wallet.js

# Check wallet address
cat config/wallet.json | grep address

# Fund Kite wallet at: https://faucet.gokite.ai
```

## Step 7: Set Environment Variables

```bash
cd ~/S4D5
nano .env
```

Add or verify these variables:

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

Save and exit (Ctrl+X, Y, Enter)

## Step 8: Test the Script Manually

Before adding to OpenClaw, test that the script works:

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
[BTC] Analyzing...
[BTC]   - Trend: 20/30 (Moderate trend (1.8%))
[BTC]   - Volume: 15/20 (High volume ($35.2K))
[BTC]   - Pressure: 15/25 (Strong buy pressure (2.3x))
[BTC]   - Momentum: 10/15 (Good momentum (120/min))
[BTC]   - Consistency: 10/10 (Trend and pressure aligned)
[BTC]   → Confidence: 70% (LONG)
```

Press Ctrl+C to stop after verifying it works.

## Step 9: Add Skill to OpenClaw

There are different ways to add skills depending on your OpenClaw version:

### Option A: Using OpenClaw CLI (Recommended)

```bash
# Add the skill
openclaw skill add streaming-analysis \
  --file ~/.openclaw/skills/streaming-analysis.md \
  --enabled \
  --priority high

# Verify it was added
openclaw skill list
```

### Option B: Using OpenClaw Config File

Edit OpenClaw's configuration:

```bash
nano ~/.openclaw/config.yaml
```

Add to the `skills` section:

```yaml
skills:
  - name: streaming-analysis
    file: ~/.openclaw/skills/streaming-analysis.md
    enabled: true
    priority: high
    script: /home/ubuntu/S4D5/Backend/helix/alpha-strategist.skill/scripts/stream-analyzer.js
    working_directory: /home/ubuntu/S4D5/Backend/helix/alpha-strategist.skill
    autostart: true
    restart_on_failure: true
```

Save and exit.

### Option C: Using OpenClaw API (If Available)

```bash
curl -X POST http://localhost:8080/api/skills \
  -H "Content-Type: application/json" \
  -d '{
    "name": "streaming-analysis",
    "file": "~/.openclaw/skills/streaming-analysis.md",
    "enabled": true,
    "priority": "high"
  }'
```

## Step 10: Reload or Restart OpenClaw

After adding the skill, reload OpenClaw:

```bash
# Option 1: Reload configuration (if supported)
openclaw reload

# Option 2: Restart OpenClaw service
sudo systemctl restart openclaw

# Option 3: Restart OpenClaw process
openclaw restart
```

## Step 11: Verify Skill is Active

Check that OpenClaw loaded the skill:

```bash
# Check OpenClaw status
openclaw status

# Check loaded skills
openclaw skill list

# Check logs
tail -f /var/log/openclaw/alpha-strategist.log
# or
openclaw logs --follow
```

You should see:
```
[OpenClaw] Loading skills...
[OpenClaw] ✓ Loaded skill: streaming-analysis
[OpenClaw] Starting skill: streaming-analysis
[OpenClaw] ✓ Script running: stream-analyzer.js
```

## Step 12: Monitor Alpha Strategist Activity

### Check OpenClaw Logs
```bash
tail -f /var/log/openclaw/alpha-strategist.log
```

Look for:
- Polling dashboard API every 30 seconds
- Analyzing BTC and ETH
- Confidence scores
- Proposals being sent

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

## Step 13: Interact with Alpha Strategist (Optional)

If OpenClaw supports chat:

```bash
openclaw chat
```

Then ask:
- "What's your current analysis of BTC?"
- "What's your confidence level right now?"
- "Show me your recent proposals"
- "Why didn't you send a proposal in the last cycle?"

---

## Troubleshooting

### Skill not loading
```bash
# Check file exists
ls -la ~/.openclaw/skills/streaming-analysis.md

# Check file permissions
chmod 644 ~/.openclaw/skills/streaming-analysis.md

# Check OpenClaw logs for errors
openclaw logs --tail 50
```

### Script not executing
```bash
# Make script executable
chmod +x ~/S4D5/Backend/helix/alpha-strategist.skill/scripts/stream-analyzer.js

# Test manually
cd ~/S4D5/Backend/helix/alpha-strategist.skill
node scripts/stream-analyzer.js
```

### Wallet issues
```bash
# Check wallet exists
ls -la ~/S4D5/Backend/helix/alpha-strategist.skill/config/wallet.json

# Reinitialize if needed
cd ~/S4D5/Backend/helix/alpha-strategist.skill
node scripts/init-kite-wallet.js

# Check balance
node -e "const {KiteWalletManager}=require('./lib/kite-wallet');(async()=>{const w=new KiteWalletManager();await w.initialize();console.log('Balance:',await w.getBalance(),'KITE');})()"
```

### API connection issues
```bash
# Test webhook API
curl -v https://s4d5-production-f42d.up.railway.app/dashboard

# Check if data is flowing
curl https://s4d5-production-f42d.up.railway.app/stats
```

### Nerve-Cord connection issues
```bash
cd ~/S4D5/nerve-cord
npm run ping audit-oracle
```

### Dependencies missing
```bash
cd ~/S4D5/Backend/helix/alpha-strategist.skill
npm install axios ethers dotenv

cd ~/S4D5/nerve-cord
npm install
```

---

## Success Criteria

✅ Skill file copied to `~/.openclaw/skills/streaming-analysis.md`  
✅ OpenClaw shows skill as loaded and enabled  
✅ Script is running and polling every 30 seconds  
✅ Logs show market analysis for BTC and ETH  
✅ Proposals are generated when confidence >= 60%  
✅ Proposals are sent to AuditOracle via Nerve-Cord  
✅ x402 payments are being made on Kite AI  
✅ No errors in OpenClaw logs  

---

## What Happens Next

Once the skill is active, Alpha Strategist will:

1. **Poll QuickNode Streams** every 30 seconds for real-time trade data
2. **Analyze markets** using 5 signal types (trend, volume, pressure, momentum, consistency)
3. **Calculate confidence** scores (0-100%) for BTC and ETH
4. **Generate proposals** when confidence >= 60%
5. **Send to AuditOracle** via Nerve-Cord for risk review
6. **Pay for service** using x402 micropayments (0.001 KITE)
7. **Log everything** for transparency and debugging
8. **Operate 24/7** autonomously

---

## Example Session

```
[OpenClaw] Skill 'streaming-analysis' started
[Alpha Strategist] 🚀 Stream Analyzer Started
[Alpha Strategist] 📡 Polling: https://s4d5-production-f42d.up.railway.app/dashboard
[Alpha Strategist] [Wallet] ✓ Kite wallet initialized

[Alpha Strategist] [2026-02-21T04:00:00.000Z] 🔄 Polling dashboard API...
[Alpha Strategist] [Data] Received: 128 trades (BTC: 100, ETH: 28)
[Alpha Strategist] [BTC] Analyzing...
[Alpha Strategist] [BTC]   - Trend: 30/30 (Strong upward trend (2.8%))
[Alpha Strategist] [BTC]   - Volume: 20/20 (Massive volume ($45.0K))
[Alpha Strategist] [BTC]   - Pressure: 25/25 (Extreme buy pressure (4.2x))
[Alpha Strategist] [BTC]   - Momentum: 15/15 (High momentum (650/min))
[Alpha Strategist] [BTC]   - Consistency: 10/10 (Trend and pressure aligned)
[Alpha Strategist] [BTC]   → Confidence: 100% (LONG)
[Alpha Strategist] [BTC] 🎯 High confidence detected! Generating proposal...
[Alpha Strategist] [Proposal] Sending to AuditOracle: Trade Proposal: LONG BTC
[Alpha Strategist] [Proposal] ✓ Sent successfully
[Alpha Strategist] [Payment] ✓ x402 payment sent: 0xabc123...
[Alpha Strategist] [BTC] ✓ Proposal sent, cooldown activated (60s)
[Alpha Strategist] [Analysis] Next poll in 30s...
```

---

## Next Steps

1. Monitor Alpha Strategist for 24 hours to ensure stability
2. Configure AuditOracle bot to receive and review proposals
3. Configure ExecutionHand bot to execute approved trades
4. Set up dashboard to visualize proposals and performance
5. Add more data sources (on-chain, sentiment, etc.)
6. Tune confidence thresholds based on performance

---

**Your Alpha Strategist is now making autonomous trading decisions!** 🚀
