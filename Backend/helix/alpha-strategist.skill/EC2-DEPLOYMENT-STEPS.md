# EC2 Deployment Steps - LLM-Powered Alpha Strategist

## ✅ Step 1: Push to GitHub (COMPLETED)

Code has been pushed to GitHub successfully!

## Step 2: SSH into EC2 and Pull Latest Code

```bash
# SSH into your EC2 instance
ssh ubuntu@your-ec2-ip-address

# Navigate to project directory
cd ~/S4D5

# Pull latest code
git pull origin main

# You should see:
# - Backend/helix/alpha-strategist.skill/OPENCLAW-LLM-SKILL.md
# - Backend/helix/alpha-strategist.skill/lib/decision-context.js
# - Backend/helix/alpha-strategist.skill/lib/llm-agent.js
# - Backend/helix/alpha-strategist.skill/openclaw-config.json (updated)
# - Backend/helix/alpha-strategist.skill/data/decision-context.json
# - Backend/helix/alpha-strategist.skill/openclaw-tools/*.js
# - Backend/helix/alpha-strategist.skill/QUICK-DEPLOY-LLM.md
# - Backend/helix/alpha-strategist.skill/LLM-IMPLEMENTATION-STATUS.md
```

## Step 3: Verify Files

```bash
# Check that all new files are present
ls -la ~/S4D5/Backend/helix/alpha-strategist.skill/lib/
# Should show: decision-context.js, llm-agent.js, kite-wallet.js, wallet.js

ls -la ~/S4D5/Backend/helix/alpha-strategist.skill/openclaw-tools/
# Should show: fetch-market-data.js, check-balance.js, send-proposal.js

ls -la ~/S4D5/Backend/helix/alpha-strategist.skill/data/
# Should show: decision-context.json

# Make tools executable
chmod +x ~/S4D5/Backend/helix/alpha-strategist.skill/openclaw-tools/*.js
```

## Step 4: Test Components

```bash
cd ~/S4D5/Backend/helix/alpha-strategist.skill

# Test 1: Decision Context Manager
echo "Testing Decision Context Manager..."
node -e "const {DecisionContextManager} = require('./lib/decision-context'); const ctx = new DecisionContextManager(); ctx.load().then(() => console.log('✓ Context manager works')).catch(e => console.error('✗ Error:', e.message));"

# Test 2: LLM Agent Initialization
echo "Testing LLM Agent..."
node -e "const {LLMReasoningEngine} = require('./lib/llm-agent'); const llm = new LLMReasoningEngine(null); llm.initialize().then(() => console.log('✓ LLM agent initialized')).catch(e => console.error('✗ Error:', e.message));"

# Test 3: Fetch Market Data Tool
echo "Testing fetch-market-data tool..."
node openclaw-tools/fetch-market-data.js

# Test 4: Check Balance Tool
echo "Testing check-balance tool..."
node openclaw-tools/check-balance.js

# All tests should pass except LLM call (needs OpenClaw client)
```

## Step 5: Integrate OpenClaw LLM Client

Now you need to integrate the actual OpenClaw LLM client. Here's what to do:

### Option A: Check OpenClaw Documentation

```bash
# Find OpenClaw documentation
openclaw --help
openclaw docs

# Look for LLM client API documentation
# You need to find how to call the LLM from within OpenClaw
```

### Option B: Edit lib/llm-agent.js

```bash
# Open the file
nano ~/S4D5/Backend/helix/alpha-strategist.skill/lib/llm-agent.js

# Find this method (around line 100):
# async _callLLM(prompt, options = {}) {
#   throw new Error('LLM client not implemented...');
# }

# Replace with actual OpenClaw client call based on their docs
# Example (adjust based on OpenClaw's actual API):
# async _callLLM(prompt, options = {}) {
#   return await this.openclawClient.chat.completions.create({
#     model: 'gpt-4',
#     messages: [{ role: 'user', content: prompt }],
#     temperature: options.temperature || 0.7,
#     max_tokens: options.max_tokens || 2000,
#     response_format: options.response_format
#   });
# }
```

### Option C: Ask OpenClaw Community

If you're not sure about the API, check:
1. OpenClaw GitHub repository
2. OpenClaw Discord/Slack
3. OpenClaw documentation site
4. Example OpenClaw skills

## Step 6: Configure OpenClaw

```bash
# Check if OpenClaw is installed
which openclaw

# Check OpenClaw status
openclaw status

# List available skills
openclaw skill list

# Register the new skill
# (This might be automatic based on openclaw-config.json)
openclaw skill register ~/S4D5/Backend/helix/alpha-strategist.skill
```

## Step 7: Test End-to-End (Once OpenClaw Client Integrated)

```bash
# Create a test script
cat > ~/test-llm-agent.js << 'EOF'
const { LLMReasoningEngine } = require('./lib/llm-agent');
const { DecisionContextManager } = require('./lib/decision-context');

async function test() {
  // Initialize components
  const context = new DecisionContextManager();
  await context.load();
  
  // Mock OpenClaw client (replace with actual client)
  const mockClient = {
    chat: {
      completions: {
        create: async (params) => {
          console.log('LLM called with prompt length:', params.messages[0].content.length);
          // Return mock response for testing
          return {
            choices: [{
              message: {
                content: JSON.stringify({
                  asset: 'BTC',
                  analysis: 'Test analysis',
                  confidence: 75,
                  confidenceReasoning: 'Test reasoning',
                  decision: 'wait',
                  decisionReasoning: 'Testing only',
                  riskFactors: ['test'],
                  opportunities: ['test']
                })
              }
            }]
          };
        }
      }
    }
  };
  
  const llm = new LLMReasoningEngine(mockClient);
  await llm.initialize();
  
  // Mock market data
  const marketData = {
    timestamp: new Date().toISOString(),
    totalTrades: 100,
    assets: {
      BTC: {
        price: 67850,
        volume: 250000,
        priceChange: 2.8,
        trend: 'upward',
        buySellRatio: 4.2,
        tradeFrequency: 650,
        tradeCount: 100
      },
      ETH: {
        price: 1958,
        volume: 12000,
        priceChange: -1.2,
        trend: 'downward',
        buySellRatio: 0.75,
        tradeFrequency: 85,
        tradeCount: 45
      }
    }
  };
  
  // Test analysis
  console.log('Testing LLM analysis...');
  const analysis = await llm.analyzeAndDecide(marketData, context);
  console.log('Analysis result:', analysis);
  
  console.log('✓ End-to-end test passed!');
}

test().catch(console.error);
EOF

# Run test
cd ~/S4D5/Backend/helix/alpha-strategist.skill
node ~/test-llm-agent.js
```

## Step 8: Run in Parallel with Hardcoded Script

```bash
# Check if hardcoded script is still running
ps aux | grep stream-analyzer
# Should show: node scripts/stream-analyzer.js (PID 246764)

# If not running, start it
cd ~/S4D5/Backend/helix/alpha-strategist.skill
nohup node scripts/stream-analyzer.js > ~/alpha-strategist-analyzer.log 2>&1 &

# Start OpenClaw with LLM skill (once client integrated)
# openclaw start alpha-strategist-llm

# Monitor both logs
tail -f ~/alpha-strategist-analyzer.log  # Hardcoded
# tail -f ~/.openclaw/logs/alpha-strategist.log  # LLM-powered
```

## Step 9: Monitor and Compare

```bash
# Check decision context
cat ~/S4D5/Backend/helix/alpha-strategist.skill/data/decision-context.json | jq .

# Check wallet balance
cd ~/S4D5/Backend/helix/alpha-strategist.skill
node openclaw-tools/check-balance.js

# Check Railway webhook
curl https://s4d5-production-f42d.up.railway.app/dashboard | jq .

# Compare decisions
echo "=== Hardcoded Script Decisions ==="
tail -20 ~/alpha-strategist-analyzer.log

echo "=== LLM Agent Decisions ==="
# tail -20 ~/.openclaw/logs/alpha-strategist.log
```

## Step 10: Full Cutover (After Validation)

Once you're confident the LLM agent is working well:

```bash
# Stop hardcoded script
pkill -f stream-analyzer.js

# Verify it stopped
ps aux | grep stream-analyzer

# Keep only LLM agent running
# openclaw status

# Monitor for 24 hours
# tail -f ~/.openclaw/logs/alpha-strategist.log
```

## Troubleshooting

### Issue: "Cannot find module './lib/decision-context'"
```bash
# Check file exists
ls -la ~/S4D5/Backend/helix/alpha-strategist.skill/lib/decision-context.js

# Check permissions
chmod 644 ~/S4D5/Backend/helix/alpha-strategist.skill/lib/*.js
```

### Issue: "ENOENT: no such file or directory, open 'data/decision-context.json'"
```bash
# Create directory
mkdir -p ~/S4D5/Backend/helix/alpha-strategist.skill/data

# File will be created automatically on first run
```

### Issue: "LLM client not implemented"
This is expected! You need to integrate the OpenClaw LLM client (Step 5).

### Issue: "Permission denied" on tools
```bash
chmod +x ~/S4D5/Backend/helix/alpha-strategist.skill/openclaw-tools/*.js
```

## Next Steps After Deployment

1. **Monitor for 24 hours** - Watch decision quality
2. **Compare with hardcoded** - Which makes better decisions?
3. **Adjust prompts** - Tune based on results
4. **Track metrics** - Approval rate, win rate, etc.
5. **Iterate** - Improve prompts and logic

## Key Files to Monitor

- `data/decision-context.json` - Decision history
- `~/.openclaw/logs/alpha-strategist.log` - LLM agent logs
- `~/alpha-strategist-analyzer.log` - Hardcoded script logs

## Success Indicators

✅ LLM generates reasoning (not just scores)  
✅ Decisions include "why" explanations  
✅ Context persists across restarts  
✅ Proposals formatted correctly  
✅ Approval rate >= 70%  
✅ No crashes or errors  

---

**You're ready to deploy!** Follow these steps on your EC2 instance.
