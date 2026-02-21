# Deployment Checklist

Complete checklist for deploying S4D5 to production.

## Pre-Deployment

### ✅ Infrastructure
- [ ] 3 EC2 instances provisioned (Ubuntu 22.04)
- [ ] Node.js 18+ installed on each
- [ ] OpenClaw installed on each
- [ ] Security groups configured (SSH, HTTPS)
- [ ] SSH keys configured

### ✅ Accounts & API Keys
- [ ] QuickNode account created
- [ ] QuickNode Stream configured ("S4D5-Alpha-Strategist-Trades")
- [ ] Railway account created
- [ ] Railway webhook deployed
- [ ] OpenAI API key obtained (for LLM mode)
- [ ] Kite AI wallets funded (testnet)

### ✅ Repository
- [ ] Code cloned on all 3 EC2 instances
- [ ] `.env` files configured on each
- [ ] Dependencies installed (`npm install`)

---

## Alpha Strategist (EC2 #1)

### Setup
- [ ] Clone repository: `git clone https://github.com/suhasdasari/S4D5.git`
- [ ] Install dependencies: `cd Backend/helix/alpha-strategist.skill && npm install`
- [ ] Configure `.env` with all required variables
- [ ] Initialize wallets: `node scripts/init-wallet.js && node scripts/init-kite-wallet.js`
- [ ] Fund Kite wallet: https://faucet.gokite.ai
- [ ] Copy skills to OpenClaw: `cp STREAMING-ANALYSIS-SKILL.md ~/.openclaw/skills/`
- [ ] Copy identity: `cp ALPHA-STRATEGIST-IDENTITY.md ~/.openclaw/agents/alpha-strategist/`

### OpenClaw Configuration
- [ ] Register cron job: `openclaw cron add --name stream-analyzer --schedule "*/30 * * * * *" --command "node ~/S4D5/Backend/helix/alpha-strategist.skill/scripts/stream-analyzer.js"`
- [ ] Verify cron: `openclaw cron list`
- [ ] Test manually: `openclaw cron run stream-analyzer`

### Nerve-Cord Setup
- [ ] Install dependencies: `cd ~/S4D5/nerve-cord && npm install`
- [ ] Configure `.env` with `NERVE_BOTNAME=alpha-strategist`
- [ ] Test poll: `node poll.js`
- [ ] Setup systemd: `sudo cp automation/nerve-poll@.service /etc/systemd/system/`
- [ ] Enable service: `sudo systemctl enable nerve-poll@alpha-strategist`
- [ ] Start service: `sudo systemctl start nerve-poll@alpha-strategist`

### Verification
- [ ] Check cron is running: `openclaw cron list`
- [ ] Check Nerve-Cord polling: `sudo systemctl status nerve-poll@alpha-strategist`
- [ ] Check logs: `tail -f /var/log/alpha-strategist.log`
- [ ] Verify wallet balance: `node openclaw-tools/check-balance.js`
- [ ] Test data fetch: `node openclaw-tools/fetch-market-data.js`
- [ ] Wait 30s and verify proposal sent: `cd ~/S4D5/nerve-cord && npm run check`

---

## AuditOracle (EC2 #2)

### Setup
- [ ] Clone repository: `git clone https://github.com/suhasdasari/S4D5.git`
- [ ] Install dependencies: `cd Backend/auditoracle && npm install`
- [ ] Configure `.env` with `NERVE_BOTNAME=audit-oracle`
- [ ] Initialize wallet: `node scripts/init-wallet.js`

### OpenClaw Configuration
- [ ] Register cron job: `openclaw cron add --name audit-check --command "node ~/S4D5/Backend/auditoracle/scripts/review-proposal.js"`
- [ ] Verify cron: `openclaw cron list`

### Nerve-Cord Setup
- [ ] Install dependencies: `cd ~/S4D5/nerve-cord && npm install`
- [ ] Test poll: `node poll.js`
- [ ] Setup systemd: `sudo systemctl enable nerve-poll@audit-oracle`
- [ ] Start service: `sudo systemctl start nerve-poll@audit-oracle`

### Verification
- [ ] Check polling: `sudo systemctl status nerve-poll@audit-oracle`
- [ ] Check logs: `tail -f /var/log/audit-oracle.log`
- [ ] Verify receives proposals: `cd ~/S4D5/nerve-cord && npm run check`

---

## ExecutionHand (EC2 #3)

### Setup
- [ ] Clone repository: `git clone https://github.com/suhasdasari/S4D5.git`
- [ ] Install dependencies: `cd Backend/executionhand && npm install`
- [ ] Configure `.env` with `NERVE_BOTNAME=execution-hand`
- [ ] Initialize wallet: `node scripts/init-wallet.js`
- [ ] Configure exchange API keys (Hyperliquid, etc.)

### OpenClaw Configuration
- [ ] Register cron job: `openclaw cron add --name execute-trade --command "node ~/S4D5/Backend/executionhand/scripts/execute-trade.js"`
- [ ] Verify cron: `openclaw cron list`

### Nerve-Cord Setup
- [ ] Install dependencies: `cd ~/S4D5/nerve-cord && npm install`
- [ ] Test poll: `node poll.js`
- [ ] Setup systemd: `sudo systemctl enable nerve-poll@execution-hand`
- [ ] Start service: `sudo systemctl start nerve-poll@execution-hand`

### Verification
- [ ] Check polling: `sudo systemctl status nerve-poll@execution-hand`
- [ ] Check logs: `tail -f /var/log/execution-hand.log`
- [ ] Verify receives approved proposals: `cd ~/S4D5/nerve-cord && npm run check`

---

## End-to-End Testing

### Test Flow
- [ ] Wait for Alpha Strategist analysis cycle (30s)
- [ ] Verify proposal sent: `cd ~/S4D5/nerve-cord && npm run check`
- [ ] Verify payment made: Check Kite explorer
- [ ] Wait for AuditOracle review (10s)
- [ ] Verify approval sent: `npm run check`
- [ ] Wait for ExecutionHand execution (10s)
- [ ] Verify trade placed: Check exchange
- [ ] Monitor position: Check ExecutionHand logs
- [ ] Verify outcome reported: `npm run check`

### Monitoring
- [ ] Setup log aggregation (optional)
- [ ] Setup alerting for errors (optional)
- [ ] Setup dashboard for real-time monitoring (optional)

---

## Production Hardening

### Security
- [ ] Rotate API keys regularly
- [ ] Enable firewall rules (only SSH, HTTPS)
- [ ] Setup fail2ban for SSH protection
- [ ] Encrypt wallet private keys at rest
- [ ] Use AWS Secrets Manager for sensitive data

### Reliability
- [ ] Setup automatic restarts: `Restart=always` in systemd
- [ ] Configure log rotation
- [ ] Setup disk space monitoring
- [ ] Configure backup for decision context
- [ ] Test failure scenarios (network outage, API failures)

### Performance
- [ ] Monitor CPU/memory usage
- [ ] Optimize polling intervals if needed
- [ ] Setup CloudWatch metrics (if on AWS)
- [ ] Profile slow operations

---

## Post-Deployment

### Day 1
- [ ] Monitor logs continuously
- [ ] Verify all 3 agents are running
- [ ] Check message flow through Nerve-Cord
- [ ] Verify payments are being made
- [ ] Check no errors in logs

### Week 1
- [ ] Review decision quality (Alpha Strategist)
- [ ] Review approval rate (AuditOracle)
- [ ] Review execution success rate (ExecutionHand)
- [ ] Analyze P&L
- [ ] Tune confidence thresholds if needed

### Month 1
- [ ] Full system audit
- [ ] Performance optimization
- [ ] Cost analysis (API costs, EC2 costs)
- [ ] Consider LLM mode if hardcoded mode is stable

---

## Rollback Plan

If issues occur:

1. **Stop all agents**:
```bash
# On each EC2
sudo systemctl stop nerve-poll@<botname>
openclaw cron pause <cron-id>
```

2. **Investigate**:
```bash
# Check logs
tail -100 /var/log/<botname>.log

# Check Nerve-Cord
cd ~/S4D5/nerve-cord
npm run check
```

3. **Fix and restart**:
```bash
# Fix issue
# ...

# Restart
sudo systemctl start nerve-poll@<botname>
openclaw cron resume <cron-id>
```

---

## Success Criteria

✅ All 3 agents running without errors
✅ Proposals being generated and sent
✅ Payments being made successfully
✅ Risk reviews happening automatically
✅ Trades being executed on exchange
✅ Outcomes being reported back
✅ System running 24/7 without intervention

---

**Deployment Time**: ~2 hours
**Testing Time**: ~1 hour
**Total**: ~3 hours to full production
