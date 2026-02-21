# Alpha Strategist - Quick Start Checklist

Use this checklist to deploy your own Alpha Strategist trading agent.

## ✅ Prerequisites

- [ ] AWS EC2 instance (Ubuntu 22.04+) running
- [ ] Node.js 18+ installed
- [ ] OpenClaw installed (`npm install -g openclaw`)
- [ ] Git installed

## ✅ Accounts Setup

- [ ] QuickNode account created
- [ ] Railway account created  
- [ ] GitHub account (for forking)

## ✅ Step 1: Fork & Clone (5 min)

```bash
# Fork on GitHub first, then:
git clone https://github.com/YOUR_USERNAME/S4D5.git
cd S4D5
```

- [ ] Repository forked
- [ ] Repository cloned to EC2

## ✅ Step 2: QuickNode Streams Setup (10 min)

1. [ ] Sign up at https://www.quicknode.com/
2. [ ] Create new Stream
3. [ ] Select: Hyperliquid Hypercore Mainnet
4. [ ] Dataset: Trades
5. [ ] Filter: BTC and ETH only
6. [ ] Note Stream ID: `________________`

## ✅ Step 3: Deploy Webhook to Railway (10 min)

```bash
cd quicknode-webhook
```

1. [ ] Sign up at https://railway.app/
2. [ ] Create new project
3. [ ] Deploy from GitHub (connect your fork)
4. [ ] Set environment: `PORT=8080`
5. [ ] Note Railway URL: `https://________________.up.railway.app`

## ✅ Step 4: Configure QuickNode Stream (5 min)

1. [ ] Go to QuickNode Stream settings
2. [ ] Add webhook destination: `https://YOUR_APP.up.railway.app/webhook/quicknode-streams`
3. [ ] Enable stream
4. [ ] Test webhook: `curl https://YOUR_APP.up.railway.app/health`

## ✅ Step 5: Install Dependencies (5 min)

```bash
cd ~/S4D5/Backend/helix/alpha-strategist.skill
npm install
```

- [ ] Dependencies installed
- [ ] No errors in npm install

## ✅ Step 6: Initialize Wallets (10 min)

```bash
# Create Base wallet
node scripts/init-wallet.js

# Create Kite wallet (same private key)
node scripts/init-kite-wallet.js

# Note wallet address
cat config/wallet.json | grep address
```

- [ ] Base wallet created
- [ ] Kite wallet created
- [ ] Wallet address noted: `0x________________`

## ✅ Step 7: Fund Kite Wallet (5 min)

1. [ ] Visit https://faucet.gokite.ai
2. [ ] Paste wallet address
3. [ ] Request testnet KITE tokens
4. [ ] Verify balance:
```bash
node -e "const {KiteWalletManager}=require('./lib/kite-wallet');(async()=>{const w=new KiteWalletManager();await w.initialize();console.log('Balance:',await w.getBalance(),'KITE');})()"
```

- [ ] Wallet funded (balance > 0 KITE)

## ✅ Step 8: Configure Environment (5 min)

```bash
cd ~/S4D5
nano .env
```

Add these values:
```bash
WEBHOOK_API_URL=https://YOUR_APP.up.railway.app/dashboard
ANALYSIS_INTERVAL=30000
MIN_CONFIDENCE=60
AUDIT_ORACLE_ADDRESS=0xYourAuditOracleAddress
KITE_RPC=https://rpc-testnet.gokite.ai/
KITE_CHAIN_ID=2368
NERVE_CORD_PATH=/home/ubuntu/S4D5/nerve-cord
```

- [ ] .env file created
- [ ] All variables configured
- [ ] WEBHOOK_API_URL points to your Railway app
- [ ] AUDIT_ORACLE_ADDRESS set (or use placeholder)

## ✅ Step 9: Test the Analyzer (5 min)

```bash
cd ~/S4D5/Backend/helix/alpha-strategist.skill
node scripts/stream-analyzer.js
```

Expected output:
```
🚀 Alpha Strategist Stream Analyzer Started
📡 Polling: https://your-app.up.railway.app/dashboard
[Wallet] ✓ Kite wallet initialized
[Kite] Balance: 5.0 KITE
[Data] Received: 128 trades (BTC: 100, ETH: 28)
[BTC] Analyzing...
```

- [ ] Script starts without errors
- [ ] Wallet initialized successfully
- [ ] Receiving trade data
- [ ] Analyzing BTC and ETH
- [ ] Press Ctrl+C to stop

## ✅ Step 10: Run as Background Service (2 min)

```bash
cd ~/S4D5/Backend/helix/alpha-strategist.skill
nohup node scripts/stream-analyzer.js > ~/alpha-strategist-analyzer.log 2>&1 &
```

- [ ] Script running in background
- [ ] Process ID noted: `________________`

## ✅ Step 11: Verify It's Running (5 min)

```bash
# Check process
ps aux | grep stream-analyzer

# Monitor logs
tail -f ~/alpha-strategist-analyzer.log
```

Expected in logs:
- [ ] Polling every 30 seconds
- [ ] Analyzing BTC and ETH
- [ ] Calculating confidence scores
- [ ] No errors

## ✅ Step 12: Monitor & Verify (Ongoing)

### Check Logs
```bash
tail -f ~/alpha-strategist-analyzer.log
```

### Check Kite Payments
- [ ] Visit: https://testnet.kitescan.ai/address/YOUR_WALLET_ADDRESS
- [ ] Verify transactions appear when proposals are sent

### Check Webhook Data
```bash
curl https://YOUR_APP.up.railway.app/dashboard | jq
```

- [ ] Webhook receiving data
- [ ] Trade counts increasing

## 🎉 Success Criteria

Your Alpha Strategist is successfully deployed when:

- [x] Script running in background (check with `ps aux | grep stream-analyzer`)
- [x] Logs show polling every 30 seconds
- [x] Receiving trade data from QuickNode
- [x] Analyzing BTC and ETH markets
- [x] Calculating confidence scores
- [x] Wallet has KITE balance
- [x] No errors in logs

## 📊 What to Expect

### Normal Operation

You'll see logs like:
```
[2026-02-21T04:30:00.000Z] 🔄 Polling dashboard API...
[Data] Received: 1154 trades (BTC: 100, ETH: 84)
[BTC] Analyzing...
[BTC]   - Trend: 0/30 (No clear trend (0%))
[BTC]   - Volume: 20/20 (Massive volume ($31.9K))
[BTC]   - Pressure: 0/25 (Neutral pressure (0.75x))
[BTC]   - Momentum: 15/15 (High momentum (221/min))
[BTC]   - Consistency: 0/10 (Mixed signals)
[BTC]   → Confidence: 35% (NONE)
[BTC] No action (confidence below 60%)
```

This is **normal** - the agent is being disciplined and waiting for high-quality setups.

### When Confidence ≥ 60%

You'll see:
```
[BTC]   → Confidence: 85% (LONG)
[BTC] 🎯 High confidence detected! Generating proposal...
[Proposal] Sending to AuditOracle: Trade Proposal: LONG BTC
[Proposal] ✓ Sent successfully
[Payment] ✓ x402 payment sent: 0xabc123...
[BTC] ✓ Proposal sent, cooldown activated (60s)
```

## 🔧 Troubleshooting

### Script Won't Start

```bash
# Check for errors
cat ~/alpha-strategist-analyzer.log

# Verify dependencies
cd ~/S4D5/Backend/helix/alpha-strategist.skill
npm install
```

### No Data from Webhook

```bash
# Test webhook
curl https://YOUR_APP.up.railway.app/health

# Check QuickNode Stream status in dashboard
# Verify webhook URL is correct
```

### Wallet Issues

```bash
# Reinitialize wallet
cd ~/S4D5/Backend/helix/alpha-strategist.skill
node scripts/init-kite-wallet.js

# Check balance
node -e "const {KiteWalletManager}=require('./lib/kite-wallet');(async()=>{const w=new KiteWalletManager();await w.initialize();console.log('Balance:',await w.getBalance(),'KITE');})()"
```

### Payment Failures

- Check KITE balance (fund at https://faucet.gokite.ai)
- Verify AUDIT_ORACLE_ADDRESS in .env
- Check logs: `grep "payment" ~/alpha-strategist-analyzer.log`

## 📚 Next Steps

Once your Alpha Strategist is running:

1. **Monitor Performance**: Watch logs for 24 hours
2. **Tune Confidence**: Adjust MIN_CONFIDENCE in .env (60-95%)
3. **Add More Agents**: Deploy AuditOracle and ExecutionHand
4. **Customize Personality**: Edit ALPHA-STRATEGIST-IDENTITY.md
5. **Add Data Sources**: Integrate more market data feeds

## 🆘 Need Help?

- **Documentation**: See [README.md](README.md) for detailed guide
- **GitHub Issues**: https://github.com/suhasdasari/S4D5/issues
- **OpenClaw Docs**: https://docs.openclaw.ai

---

**Total Setup Time**: ~60 minutes

**Congratulations!** You now have an autonomous AI trading agent running 24/7! 🚀
