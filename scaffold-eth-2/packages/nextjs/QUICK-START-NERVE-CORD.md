# Quick Start: Nerve-Cord Integration

## 1. Setup Environment

Create `.env.local` in `scaffold-eth-2/packages/nextjs/`:

```bash
NERVE_SERVER=https://s4d5-production.up.railway.app
NERVE_TOKEN=s4d5-suhas-susmitha-karthik
```

## 2. Start Development Server

```bash
cd scaffold-eth-2/packages/nextjs
yarn dev
```

## 3. Open Dashboard

Navigate to: http://localhost:3000/dashboard

## 4. Verify Live Mode

Look for the green "● LIVE" indicator in the Agent Council terminal header.

## 5. Send Test Message

In a separate terminal:

```bash
cd nerve-cord
npm run send audit-oracle "Test Proposal: LONG BTC" "Testing live integration"
```

## 6. Watch It Appear

The message should appear in the Agent Council terminal within 5 seconds!

## Toggle Modes

Click the "DEMO MODE" / "LIVE MODE" button in the terminal header to switch between:
- **LIVE MODE**: Real Nerve-Cord messages
- **DEMO MODE**: Dummy messages for testing UI

## What You'll See

Messages from:
- **ALPHA STRATEGIST (α)**: Trading proposals
- **RISK OFFICER (Ω)**: Approvals/rejections
- **COMPLIANCE SCRIBE (§)**: Compliance checks
- **EXECUTIONER (✕)**: Trade executions

With:
- ✅ Green glow for approvals/executions
- ❌ Red glow for rejections/failures
- 🔗 Transaction hashes (when available)
- ⏰ Real timestamps

## Troubleshooting

**No messages?**
```bash
# Check Nerve-Cord is running
curl https://s4d5-production.up.railway.app/health

# Check API route
curl http://localhost:3000/api/nerve-cord/messages
```

**Not updating?**
- Check browser console for errors
- Verify Network tab shows requests every 5 seconds
- Try toggling DEMO/LIVE mode

---

That's it! You're now seeing real-time agent messages in your dashboard.
