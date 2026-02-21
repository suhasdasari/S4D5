# Deploy QuickNode Webhook to Railway

## Quick Deploy (5 minutes)

### Step 1: Push to GitHub

```bash
# From your project root
git add quicknode-webhook/
git commit -m "Add QuickNode webhook receiver"
git push origin main
```

### Step 2: Deploy to Railway

1. Go to https://railway.app
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Railway will ask which folder to deploy - select `quicknode-webhook`
6. Click "Deploy"

Railway will automatically:
- Detect Node.js
- Run `npm install`
- Run `npm start`
- Assign a public URL

### Step 3: Get Your Webhook URL

After deployment completes (1-2 minutes):

1. Click on your deployment in Railway
2. Go to "Settings" tab
3. Click "Generate Domain" under "Domains"
4. Your URL will be: `https://your-app.up.railway.app`

Your webhook endpoint is:
```
https://your-app.up.railway.app/webhook/quicknode-streams
```

### Step 4: Configure QuickNode Stream

Go back to QuickNode dashboard:

1. **Destination URL**: `https://your-app.up.railway.app/webhook/quicknode-streams`
2. Click "Check Connection" - should show ✅ success
3. Click "Create Stream"

Done! Your webhook is now receiving real-time trade data.

## Verify It's Working

### Check Health
```bash
curl https://your-app.up.railway.app/health
```

Should return:
```json
{
  "status": "ok",
  "uptime": 123,
  "bufferSizes": {
    "BTC": 0,
    "ETH": 0
  }
}
```

### View Dashboard
Open in browser:
```
https://your-app.up.railway.app/dashboard
```

### View Logs
In Railway dashboard:
1. Click on your deployment
2. Go to "Deployments" tab
3. Click "View Logs"

You'll see:
```
🚀 QuickNode Streams Webhook Receiver Started
📡 Listening on port 3000
🔗 Webhook endpoint: POST /webhook/quicknode-streams
📊 Dashboard: GET /dashboard
💚 Health Check: GET /health
📈 Stats: GET /stats

Waiting for QuickNode Streams data...
```

When trades arrive:
```
=== Webhook Received ===
Timestamp: 2026-02-21T02:00:00.000Z
Payload size: 482 bytes
[BTC] buy 0.5 @ $45230.50 (block 900929758)
[ETH] sell 2.3 @ $2850.25 (block 900929759)
Processed 2 trades
Buffer sizes - BTC: 45 ETH: 38

--- Real-Time Metrics ---

BTC:
  Trades: 45
  Avg Price: $45180.25
  Volume: $2034567.89
  Trend: upward (+2.34%)
  Frequency: 15.2 trades/min
  Buy/Sell Ratio: 1.25
```

## Alternative: Railway CLI

If you prefer command line:

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Navigate to webhook folder
cd quicknode-webhook

# Initialize and deploy
railway init
railway up

# Get URL
railway domain
```

## Troubleshooting

### "Check Connection" fails in QuickNode
- Wait 1-2 minutes for Railway deployment to complete
- Check Railway logs for errors
- Verify the URL is correct (no trailing slash)

### No trades showing up
- Check QuickNode Stream status in dashboard
- Verify Stream is "Active"
- Check Railway logs for incoming webhooks
- Make sure you created the Stream (not just configured it)

### Railway deployment failed
- Check `package.json` has `"start": "node index.js"`
- Verify `index.js` exists
- Check Railway build logs for errors

## Cost

Railway free tier includes:
- $5 credit per month
- Enough for this webhook (very lightweight)
- Auto-sleeps after 30 min of inactivity
- Wakes up instantly on request

For production (24/7 uptime):
- Upgrade to Hobby plan ($5/month)
- Prevents auto-sleep

## Next Steps

After webhook is receiving data:

1. **Integrate with main dashboard**:
   - Fetch from `https://your-app.up.railway.app/dashboard`
   - Display in `scaffold-eth-2/packages/nextjs/app/dashboard/page.tsx`

2. **Add trade signal generation**:
   - Use metrics to generate BUY/SELL signals
   - Send proposals to AuditOracle via Nerve-Cord

3. **Add x402 payments**:
   - Integrate Kite wallet for agent payments

## Support

- Railway docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- QuickNode docs: https://www.quicknode.com/docs/streams
