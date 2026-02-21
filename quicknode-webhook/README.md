# QuickNode Streams Webhook Receiver

Real-time webhook receiver for QuickNode Streams delivering Hyperliquid trade data.

## Features

- ✅ Receives real-time trade events from QuickNode Streams
- ✅ Filters for BTC and ETH trades only
- ✅ Maintains rolling buffer of last 100 trades per asset
- ✅ Calculates real-time metrics (volume, price, trend, frequency)
- ✅ REST API for dashboard integration
- ✅ Health checks and stats endpoints
- ✅ Railway-ready deployment

## Endpoints

### POST /webhook/quicknode-streams
Receives webhook data from QuickNode Streams.

**Request Body**: QuickNode Streams payload
```json
{
  "data": [{
    "block_time": "2026-02-21T01:54:52.604025213",
    "block_number": 900929758,
    "events": [
      {
        "coin": "BTC",
        "px": "45230.50",
        "sz": "0.5",
        "side": "buy"
      }
    ]
  }],
  "metadata": {
    "dataset": "trades",
    "network": "hypercore-mainnet"
  }
}
```

**Response**:
```json
{
  "success": true,
  "tradesProcessed": 2,
  "bufferSizes": {
    "BTC": 45,
    "ETH": 38
  }
}
```

### GET /dashboard
Returns recent trades and real-time metrics.

**Response**:
```json
{
  "timestamp": "2026-02-21T02:00:00.000Z",
  "stats": {
    "totalWebhooks": 150,
    "totalTrades": 450,
    "uptime": 3600,
    "lastWebhook": "2026-02-21T02:00:00.000Z"
  },
  "BTC": {
    "recentTrades": [...],
    "metrics": {
      "totalVolume": "2034567.89",
      "averagePrice": "45180.25",
      "trend": "upward",
      "priceChange": "+2.34%",
      "tradeFrequency": "15.2",
      "buySellRatio": "1.25",
      "tradeCount": 45
    }
  },
  "ETH": { ... }
}
```

### GET /health
Health check endpoint.

**Response**:
```json
{
  "status": "ok",
  "uptime": 3600,
  "bufferSizes": {
    "BTC": 45,
    "ETH": 38
  },
  "lastWebhook": "2026-02-21T02:00:00.000Z"
}
```

### GET /stats
Service statistics.

**Response**:
```json
{
  "totalWebhooksReceived": 150,
  "totalTradesProcessed": 450,
  "uptime": 3600,
  "startTime": "2026-02-21T01:00:00.000Z",
  "lastWebhookTime": "2026-02-21T02:00:00.000Z",
  "bufferSizes": {
    "BTC": 45,
    "ETH": 38
  }
}
```

### GET /
Service information and available endpoints.

## Local Development

```bash
# Install dependencies
npm install

# Start server
npm start
```

Server runs on `http://localhost:3000`

## Deploy to Railway

### Option 1: Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Deploy
railway up
```

### Option 2: GitHub Integration

1. Push this folder to GitHub
2. Go to https://railway.app
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Railway will auto-detect Node.js and deploy

### Option 3: Railway Dashboard

1. Go to https://railway.app
2. Click "New Project" → "Empty Project"
3. Click "Deploy from GitHub repo" or upload files
4. Railway will auto-deploy

## After Deployment

1. **Get your Railway URL**: 
   - Format: `https://your-app.up.railway.app`
   
2. **Configure QuickNode Stream**:
   - Destination URL: `https://your-app.up.railway.app/webhook/quicknode-streams`
   - Click "Check Connection"
   - Click "Create Stream"

3. **Monitor your webhook**:
   - Dashboard: `https://your-app.up.railway.app/dashboard`
   - Health: `https://your-app.up.railway.app/health`
   - Stats: `https://your-app.up.railway.app/stats`

## Environment Variables

No environment variables required! The service uses Railway's auto-assigned `PORT`.

## Monitoring

View logs in Railway dashboard:
- Real-time trade events
- Metrics calculations
- Error messages

## Integration

Use the `/dashboard` endpoint to integrate with your main dashboard at:
`scaffold-eth-2/packages/nextjs/app/dashboard/page.tsx`

Example fetch:
```javascript
const response = await fetch('https://your-app.up.railway.app/dashboard');
const data = await response.json();
console.log(data.BTC.metrics);
```

## Support

For issues or questions, check the Railway logs or contact the S4D5 team.
