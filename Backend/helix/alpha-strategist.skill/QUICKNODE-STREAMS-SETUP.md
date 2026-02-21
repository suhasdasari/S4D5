# QuickNode Streams Webhook Setup Guide

## Step 1: Install Dependencies

```bash
cd Backend/helix/alpha-strategist.skill
npm install
```

## Step 2: Start the Webhook Receiver

```bash
npm run webhook
```

You should see:
```
🚀 QuickNode Streams Webhook Receiver Started
📡 Listening on port 3000
🔗 Webhook URL: http://localhost:3000/webhook/quicknode-streams
📊 Dashboard: http://localhost:3000/dashboard
💚 Health Check: http://localhost:3000/health

Waiting for QuickNode Streams data...
```

## Step 3: Expose Webhook to Internet (for QuickNode to reach it)

### Option A: Using ngrok (Recommended for Testing)

1. Install ngrok: https://ngrok.com/download
2. Run: `ngrok http 3000`
3. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)
4. Your webhook URL will be: `https://abc123.ngrok.io/webhook/quicknode-streams`

### Option B: Deploy to EC2 (Production)

1. Upload webhook-receiver.js to your EC2 instance
2. Install dependencies: `npm install`
3. Run with PM2: `pm2 start webhook-receiver.js --name quicknode-webhook`
4. Your webhook URL will be: `http://YOUR_EC2_IP:3000/webhook/quicknode-streams`

**Note**: Make sure port 3000 is open in your EC2 security group!

## Step 4: Configure QuickNode Stream

In the QuickNode dashboard where you're creating the stream:

1. **Destination type**: Select "Webhook"
2. **Destination URL**: Enter your webhook URL from Step 3
   - ngrok: `https://abc123.ngrok.io/webhook/quicknode-streams`
   - EC2: `http://YOUR_EC2_IP:3000/webhook/quicknode-streams`
3. **Timeout**: 30 seconds (default is fine)
4. **Retry**: 3 retries (default is fine)
5. Click "Check Connection" to test
6. Click "Create Stream"

## Step 5: Monitor Incoming Data

### View Console Output
The webhook receiver will log each incoming trade:
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

### View Dashboard
Open in browser: `http://localhost:3000/dashboard`

Returns JSON with:
- Last 20 trades for BTC and ETH
- Real-time metrics (volume, price, trend, frequency)

### Health Check
`http://localhost:3000/health`

Returns:
```json
{
  "status": "ok",
  "uptime": 3600,
  "bufferSizes": {
    "BTC": 45,
    "ETH": 38
  }
}
```

## What the Webhook Does

1. **Receives** streaming trade data from QuickNode
2. **Filters** for BTC and ETH trades only
3. **Stores** last 100 trades per asset in memory
4. **Calculates** real-time metrics:
   - Total volume
   - Average price
   - Price trend (upward/downward/neutral)
   - Trade frequency (trades per minute)
   - Buy/sell ratio
5. **Displays** live data in console and dashboard

## Next Steps

After the webhook is receiving data:
1. Integrate with LLM for trade signal generation
2. Connect to Nerve-Cord for sending proposals to AuditOracle
3. Add x402 payment flow
4. Display streaming data on main dashboard at `scaffold-eth-2/packages/nextjs/app/dashboard/page.tsx`

## Troubleshooting

### Webhook not receiving data
- Check that the server is running (`npm run webhook`)
- Verify the URL is publicly accessible (test with curl)
- Check QuickNode dashboard for stream status
- Look for errors in QuickNode stream logs

### Port already in use
Change the port:
```bash
WEBHOOK_PORT=3001 npm run webhook
```

### Connection refused
- If using EC2, check security group allows inbound on port 3000
- If using ngrok, make sure ngrok is running

## Environment Variables

Optional configuration:

```bash
# .env file
WEBHOOK_PORT=3000          # Default: 3000
MAX_BUFFER_SIZE=100        # Default: 100 trades per asset
```
