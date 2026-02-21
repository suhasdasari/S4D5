# Quick Deploy Guide - LLM-Powered Alpha Strategist

## What's Been Built

You now have an LLM-powered trading agent that THINKS instead of following hardcoded rules.

**Core Components:**
1. ✅ OpenClaw skill definition (`OPENCLAW-LLM-SKILL.md`)
2. ✅ Decision context manager (`lib/decision-context.js`)
3. ✅ LLM reasoning engine (`lib/llm-agent.js`)
4. ✅ Configuration (`openclaw-config.json`)
5. ✅ Three tools (fetch-market-data, check-balance, send-proposal)

## Deploy to EC2 (5 Steps)

### Step 1: Push to GitHub
```bash
# On your local machine
cd ~/S4D5
git add .
git commit -m "Add LLM-powered Alpha Strategist core implementation"
git push origin main
```

### Step 2: Pull on EC2
```bash
# SSH into EC2
ssh ubuntu@your-ec2-instance

# Pull latest code
cd ~/S4D5
git pull origin main
```

### Step 3: Install Dependencies (if needed)
```bash
cd ~/S4D5/Backend/helix/alpha-strategist.skill
npm install axios ethers dotenv
```

### Step 4: Integrate OpenClaw LLM Client

Edit `lib/llm-agent.js` and replace the `_callLLM()` method:

```javascript
// Find this method (around line 100):
async _callLLM(prompt, options = {}) {
  // TODO: Replace with actual OpenClaw LLM client call
  throw new Error('LLM client not implemented...');
}

// Replace with actual OpenClaw client:
async _callLLM(prompt, options = {}) {
  return await this.openclawClient.chat.completions.create({
    model: options.model || 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    temperature: options.temperature || 0.7,
    max_tokens: options.max_tokens || 2000,
    response_format: options.response_format
  });
}
```

**Note**: Check OpenClaw documentation for the exact API syntax.

### Step 5: Test Components

```bash
cd ~/S4D5/Backend/helix/alpha-strategist.skill

# Test 1: Decision Context Manager
node -e "const {DecisionContextManager} = require('./lib/decision-context'); const ctx = new DecisionContextManager(); ctx.load().then(() => console.log('✓ Context manager works'));"

# Test 2: LLM Agent initialization
node -e "const {LLMReasoningEngine} = require('./lib/llm-agent'); const llm = new LLMReasoningEngine(null); llm.initialize().then(() => console.log('✓ LLM agent initialized'));"

# Test 3: Existing tools
node openclaw-tools/fetch-market-data.js
node openclaw-tools/check-balance.js

# All tests should pass (except LLM call which needs OpenClaw client)
```

## What Happens Next

Once OpenClaw client is integrated, the agent will:

1. **Every 30 seconds**:
   - Fetch market data from Railway webhook
   - Load historical context
   - Call LLM to analyze and decide
   - If LLM decides to send proposal:
     - Generate proposal with LLM
     - Check wallet balance
     - Send proposal via Nerve-Cord
     - Execute x402 payment
     - Record decision in context

2. **LLM Reasoning** (not hardcoded rules):
   ```
   "BTC up 2.8% with massive volume ($250K). Buy/sell ratio of 4.2x 
   shows extreme buying pressure. Trade frequency at 650/min indicates 
   strong momentum. This looks like a genuine breakout, not a fake-out.
   
   I remember a similar setup last week that worked well. The key 
   difference is even higher volume this time, which increases my 
   conviction.
   
   My confidence: 85% LONG"
   ```

3. **Learning from Outcomes**:
   - Records every decision
   - Tracks approval/rejection from AuditOracle
   - Includes historical context in future prompts
   - Adapts strategy based on what works

## Parallel Deployment (Recommended)

Run both hardcoded and LLM agents in parallel initially:

```bash
# Keep hardcoded script running
ps aux | grep stream-analyzer
# Should show: node scripts/stream-analyzer.js (PID 246764)

# Start LLM agent (once OpenClaw client integrated)
# openclaw start alpha-strategist-llm

# Compare decisions
tail -f ~/alpha-strategist-analyzer.log  # Hardcoded
tail -f ~/.openclaw/logs/alpha-strategist.log  # LLM-powered
```

## Monitoring

### Check Decision Context
```bash
cat ~/S4D5/Backend/helix/alpha-strategist.skill/data/decision-context.json
```

### Check Logs
```bash
# OpenClaw logs
openclaw logs --tail 100

# Or specific agent
tail -f ~/.openclaw/logs/alpha-strategist.log
```

### Check Wallet Balance
```bash
cd ~/S4D5/Backend/helix/alpha-strategist.skill
node openclaw-tools/check-balance.js
```

## Troubleshooting

### Issue: "LLM client not implemented"
**Solution**: Edit `lib/llm-agent.js` and replace `_callLLM()` with actual OpenClaw client (see Step 4)

### Issue: "Context file not found"
**Solution**: File will be created automatically on first run. Check permissions:
```bash
mkdir -p ~/S4D5/Backend/helix/alpha-strategist.skill/data
chmod 755 ~/S4D5/Backend/helix/alpha-strategist.skill/data
```

### Issue: "Personality guidelines not found"
**Solution**: Verify file exists:
```bash
ls -la ~/S4D5/Backend/helix/alpha-strategist.skill/ALPHA-STRATEGIST-IDENTITY.md
```

### Issue: "Tools not found"
**Solution**: Make tools executable:
```bash
chmod +x ~/S4D5/Backend/helix/alpha-strategist.skill/openclaw-tools/*.js
```

## Next Steps

1. **Integrate OpenClaw client** (Step 4 above)
2. **Test end-to-end flow** with one analysis cycle
3. **Run in parallel** with hardcoded script for comparison
4. **Monitor for 24 hours** to validate reasoning quality
5. **Adjust prompts** based on results
6. **Full cutover** once confident

## Files to Review

- `OPENCLAW-LLM-SKILL.md` - Skill definition (what LLM sees)
- `lib/llm-agent.js` - LLM reasoning engine (needs OpenClaw client)
- `lib/decision-context.js` - Context manager (tracks history)
- `openclaw-config.json` - Configuration (LLM settings)
- `LLM-IMPLEMENTATION-STATUS.md` - Detailed status

## Success Indicators

✅ LLM generates reasoning (not just scores)  
✅ Decisions include "why" explanations  
✅ Context persists across restarts  
✅ Proposals formatted correctly  
✅ Approval rate >= 70%  

---

**You're 60% done!** Core infrastructure is complete. Remaining work: integrate OpenClaw client, test, and deploy.
