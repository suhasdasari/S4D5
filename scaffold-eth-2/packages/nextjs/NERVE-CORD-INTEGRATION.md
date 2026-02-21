# Nerve-Cord Integration

This document explains how the frontend integrates with Nerve-Cord to display real-time agent messages.

## Overview

The Agent Council terminal in the dashboard now displays real messages from the Nerve-Cord message broker instead of dummy data.

## Architecture

```
Nerve-Cord (Railway)
       ↓
Next.js API Routes (/api/nerve-cord/*)
       ↓
AgentTerminal Component
       ↓
User Interface
```

## Components

### 1. API Routes

**`/api/nerve-cord/messages/route.ts`**
- Fetches all messages from Nerve-Cord
- Server-side only (uses NERVE_TOKEN)
- Returns messages in JSON format

**`/api/nerve-cord/log/route.ts`**
- Fetches activity log entries from Nerve-Cord
- Supports limit parameter (default: 50)
- Returns logs in JSON format

### 2. AgentTerminal Component

**Location**: `alpha/components/AgentTerminal.tsx`

**Features**:
- Fetches real messages and logs every 5 seconds
- Converts Nerve-Cord format to display format
- Maps bot names to display names:
  - `alpha-strategist` → ALPHA STRATEGIST (α)
  - `audit-oracle` → RISK OFFICER (Ω)
  - `compliance-scribe` → COMPLIANCE SCRIBE (§)
  - `execution-hand` → EXECUTIONER (✕)
- Detects approval/rejection keywords
- Extracts proposal IDs and transaction hashes
- Triggers visual effects (glow) for positive/negative events
- Toggle between LIVE and DEMO mode

## Configuration

### Environment Variables

Add to `.env.local`:

```bash
NERVE_SERVER=https://s4d5-production.up.railway.app
NERVE_TOKEN=s4d5-suhas-susmitha-karthik
```

**Important**: These are server-side only variables. They are NOT exposed to the client.

## Message Format

### Nerve-Cord Message
```json
{
  "id": "msg_abc123",
  "from": "alpha-strategist",
  "to": "audit-oracle",
  "subject": "Trade Proposal: LONG BTC",
  "body": "🎯 OPEN LONG BTC\nLeverage: 2x\n...",
  "status": "pending",
  "created": "2026-02-21T05:00:00.000Z"
}
```

### Nerve-Cord Log
```json
{
  "id": "log_xyz789",
  "from": "alpha-strategist",
  "text": "📊 Sent proposal: PROP-1234 (Confidence: 75%)",
  "tags": ["proposal", "alpha-strategist"],
  "created": "2026-02-21T05:00:00.000Z"
}
```

### Display Format
```typescript
{
  agent: "ALPHA STRATEGIST",
  colorClass: "text-white",
  message: "[PROP-1234] [α] Trade Proposal: LONG BTC",
  timestamp: "05:00:00",
  glowType: "positive",
  proposalId: "PROP-1234",
  txHash: "0x1234...5678"
}
```

## Features

### 1. Real-Time Updates
- Polls Nerve-Cord every 5 seconds
- Automatically updates the terminal with new messages
- Maintains last 20 entries

### 2. Visual Feedback
- **Positive glow**: APPROVED, EXECUTED, PASSED
- **Negative glow**: REJECTED, VETOED, FAILED
- **Neutral**: All other messages

### 3. Transaction Hashes
- Automatically extracts 0x addresses from messages
- Displays shortened format: `0x1234...5678`
- Links to 0G Labs explorer (future enhancement)

### 4. Mode Toggle
- **LIVE MODE**: Fetches real Nerve-Cord data
- **DEMO MODE**: Uses dummy messages for testing
- Toggle button in terminal header

## Testing

### 1. Check API Routes

```bash
# Test messages endpoint
curl http://localhost:3000/api/nerve-cord/messages

# Test logs endpoint
curl http://localhost:3000/api/nerve-cord/log?limit=10
```

### 2. Check Nerve-Cord Directly

```bash
# View dashboard
open https://s4d5-production.up.railway.app/stats

# Fetch messages
curl https://s4d5-production.up.railway.app/messages \
  -H "Authorization: Bearer s4d5-suhas-susmitha-karthik"

# Fetch logs
curl https://s4d5-production.up.railway.app/log?limit=10 \
  -H "Authorization: Bearer s4d5-suhas-susmitha-karthik"
```

### 3. Send Test Message

```bash
cd nerve-cord

# Send test proposal
npm run send audit-oracle "Test Proposal: LONG ETH" "This is a test message"

# Check if it appears in frontend (within 5 seconds)
```

## Troubleshooting

### No messages appearing

1. Check Nerve-Cord is running:
   ```bash
   curl https://s4d5-production.up.railway.app/health
   ```

2. Check API routes are working:
   ```bash
   curl http://localhost:3000/api/nerve-cord/messages
   ```

3. Check browser console for errors

4. Verify environment variables are set:
   ```bash
   echo $NERVE_SERVER
   echo $NERVE_TOKEN
   ```

### Messages not updating

1. Check polling interval (5 seconds)
2. Check browser network tab for API calls
3. Verify Nerve-Cord has new messages:
   ```bash
   curl https://s4d5-production.up.railway.app/messages \
     -H "Authorization: Bearer s4d5-suhas-susmitha-karthik"
   ```

### Wrong agent names

1. Check bot name mapping in `NERVE_TO_AGENT`
2. Verify bot names in Nerve-Cord match expected values
3. Add new bot names to mapping if needed

## Future Enhancements

1. **WebSocket Support**: Replace polling with real-time WebSocket connection
2. **Message Filtering**: Filter by agent, status, or time range
3. **Message Details**: Click to expand full message body
4. **Transaction Links**: Link tx hashes to 0G Labs explorer
5. **Audio Notifications**: Play sounds for new messages
6. **Message Search**: Search through message history
7. **Export**: Export messages to CSV/JSON

## Related Files

- `alpha/components/AgentTerminal.tsx` - Main component
- `app/api/nerve-cord/messages/route.ts` - Messages API
- `app/api/nerve-cord/log/route.ts` - Logs API
- `.env.local` - Environment configuration
- `nerve-cord/server.js` - Nerve-Cord server
- `nerve-cord/README.md` - Nerve-Cord documentation

## Security Notes

- Nerve-Cord token is server-side only
- API routes act as proxy to prevent token exposure
- Messages are fetched server-side and passed to client
- No sensitive data is exposed to browser

---

**Status**: ✅ Implemented and working
**Last Updated**: 2026-02-21
