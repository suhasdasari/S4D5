# S4D5 EC2 Deployment Guide

## Quick Deploy (Automated)

```bash
# Make script executable
chmod +x deploy-to-ec2.sh

# Deploy to specific instance
./deploy-to-ec2.sh as4   # Alpha Strategist
./deploy-to-ec2.sh ao4   # Audit Oracle
./deploy-to-ec2.sh eh4   # Execution Hand

# Deploy to all instances
./deploy-to-ec2.sh all
```

## Manual Deployment Steps

### For Each EC2 Instance (AS4, AO4, EH4)

#### 1. SSH into the instance
```bash
# Alpha Strategist (AS4)
ssh -i ~/Downloads/AS4.pem ubuntu@34.239.119.14

# Audit Oracle (AO4)
ssh -i ~/Downloads/AO4.pem ubuntu@<AO4-IP>

# Execution Hand (EH4)
ssh -i ~/Downloads/EH4.pem ubuntu@<EH4-IP>
```

#### 2. Create root .env file (IMPORTANT - Do this FIRST!)
```bash
cd ~/S4D5

# Create .env file
nano .env
```

Paste this content:
```env
# =============================================================================
# S4D5 Project Environment Variables
# =============================================================================

# -----------------------------------------------------------------------------
# Nerve-Cord (Communication Hub)
# -----------------------------------------------------------------------------
NERVE_PORT=9999
NERVE_TOKEN=s4d5-suhas-susmitha-karthik
NERVE_SERVER=https://s4d5-production.up.railway.app

# -----------------------------------------------------------------------------
# Alpha Strategist (Trading Bot)
# -----------------------------------------------------------------------------
BOTNAME=alpha-strategist

# Analysis Configuration
ANALYSIS_INTERVAL=300000
MIN_CONFIDENCE=60
TARGET_ASSETS=BTC,ETH
MAX_POSITION_SIZE=10000
RISK_MULTIPLIER=0.5

# Position Management
TAKE_PROFIT_PCT=5
STOP_LOSS_PCT=3
MAX_POSITION_AGE_HOURS=24

# -----------------------------------------------------------------------------
# Audit Oracle (Compliance Bot)
# -----------------------------------------------------------------------------
# Add audit oracle config here when needed

# -----------------------------------------------------------------------------
# Execution Hand (Trade Execution Bot)
# -----------------------------------------------------------------------------
# Add execution hand config here when needed
```

Save and exit (Ctrl+X, Y, Enter)

#### 3. Pull latest code
```bash
cd ~/S4D5
git pull
```

#### 4. Install dependencies
```bash
cd Backend/helix/alpha-strategist.skill
npm install
```

#### 5. Test the bot
```bash
npm run send-proposals
```

You should see output like:
```
Analyzing BTC...
BTC: orderbook=0.05, momentum=0.18, confidence=24.9%, threshold=60%
Analyzing ETH...
ETH: orderbook=-0.18, momentum=-0.24, confidence=90.2%, threshold=60%
Generated 1 proposals
```

#### 6. Restart the cron job (if running)
```bash
# Check if cron is running
crontab -l

# If you see the alpha-strategist cron job, it will automatically use the new code
# No restart needed - it will pick up changes on next run
```

## What Changed

### ✅ Improvements
- **Single data source**: Now using 100% Binance.US (more reliable)
- **Consolidated config**: All env variables in root `.env`
- **Cleaner code**: Removed unused QuickNode/Hyperliquid scripts
- **Better data**: Real 24h price change and volume

### ⚠️ Breaking Changes
- Moved `.env` from `Backend/helix/alpha-strategist.skill/.env` to root `.env`
- Deleted `fetch-market-data.js` (now using Binance.US directly)
- Removed `QUICKNODE_BASE_URL` and `QUICKNODE_API_KEY` env variables

## Troubleshooting

### Error: "Cannot find module"
```bash
cd ~/S4D5/Backend/helix/alpha-strategist.skill
npm install
```

### Error: "process.env.NERVE_TOKEN is undefined"
Make sure you created the root `.env` file in `~/S4D5/.env`

### Bot not generating proposals
- Check `MIN_CONFIDENCE` is set correctly (default: 60%)
- Verify Binance.US API is accessible from your EC2 region
- Check logs: `npm run send-proposals`

## EC2 Instance IPs

- **AS4 (Alpha Strategist)**: 34.239.119.14
- **AO4 (Audit Oracle)**: TBD
- **EH4 (Execution Hand)**: TBD

## Support

If you encounter issues, check:
1. Root `.env` file exists and has correct values
2. Git pull completed successfully
3. npm install ran without errors
4. Binance.US API is accessible
