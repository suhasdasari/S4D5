# 0G Storage flow test — S4D5

This describes how to test the full flow that matches the hackathon pitch.

## What we claim (pitch)

- Nerve-Cord writes an activity log; entries tagged **audit**, **proposal**, or **consensus** are **automatically pinned to 0G Storage**.
- We use `@0glabs/0g-ts-sdk` with **MemData** → merkle tree → **indexer.upload()** to 0G.
- Each pinned entry gets a **content ID (rootHash)** for use as **transcriptCid** in Hedera HCS.
- **0G = decentralized, verifiable audit trail** for AI council decisions.

## Prerequisites

1. **Server running** from `nerve-cord/`:
   ```bash
   cd nerve-cord
   PORT=9999 TOKEN=s4d5-suhas-susmitha-karthik node server.js
   ```
2. **0G configured** in `.env`: `0G_EVM_RPC`, `0G_INDEXER_RPC`, `0G_PRIVATE_KEY` (mainnet or testnet).
3. **Wallet funded** so uploads don’t revert (mainnet: buy 0G; testnet: faucet.0g.ai).

## Automated test (recommended)

From `nerve-cord/`:

```bash
./test-0g-flow.sh
```

Or against a different base URL (e.g. Railway):

```bash
TOKEN=s4d5-suhas-susmitha-karthik ./test-0g-flow.sh https://s4d5-production.up.railway.app
```

The script will:

1. **Health** — `GET /health` → expect `{"ok":true,...}`.
2. **Proposal** — `POST /log` with `tags: ["proposal"]` → expect response to include `"cid":"0x..."` if 0G succeeds.
3. **Audit** — `POST /log` with `tags: ["audit"]` → expect `cid` in response.
4. **Consensus + full blob** — `POST /log` with `tags: ["consensus"]` and `details: { proposalId, strategist, audit, execution, created }` → expect `cid` (full decision blob pinned; transcriptCid-ready).
5. **GET /log** — list today’s entries.

**Success:** Each of steps 2–4 returns a `cid`. You can paste any `cid` into [StorageScan (mainnet)](https://storagescan.0g.ai) or [StorageScan Galileo (testnet)](https://storagescan-galileo.0g.ai/tool) to verify the content.

**If 0G reverts (e.g. testnet):** Responses may have no `cid`; server logs will show `0G upload failed (continuing without cid): ...`. Log entries are still saved; only the on-chain pin fails.

## Manual curl examples

Same token as above; server on `http://localhost:9999`.

**Health:**
```bash
curl -s -H "Authorization: Bearer s4d5-suhas-susmitha-karthik" http://localhost:9999/health
```

**Proposal (pinned to 0G):**
```bash
curl -s -X POST http://localhost:9999/log \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer s4d5-suhas-susmitha-karthik" \
  -d '{"from":"alpha-strategist","text":"Proposed BUY 0.5 ETH","tags":["proposal"]}'
```

**Audit (pinned to 0G):**
```bash
curl -s -X POST http://localhost:9999/log \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer s4d5-suhas-susmitha-karthik" \
  -d '{"from":"audit-oracle","text":"APPROVED","tags":["audit"]}'
```

**Consensus + full decision blob (pinned as transcriptCid-ready blob):**
```bash
curl -s -X POST http://localhost:9999/log \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer s4d5-suhas-susmitha-karthik" \
  -d '{"from":"audit-oracle","text":"Consensus: PROP-1 APPROVED","tags":["consensus"],"details":{"proposalId":"PROP-1","strategist":{"from":"alpha-strategist","proposal":"BUY 0.5 ETH"},"audit":{"from":"audit-oracle","verdict":"APPROVED"},"execution":null,"created":"2026-02-21T04:00:00Z"}}'
```

## Direct 0G upload (no server)

Tests the 0G path only (no Nerve-Cord):

```bash
cd nerve-cord
node 0g_Upload.js '{"from":"alpha-strategist","text":"Test proposal","tags":["proposal"]}'
```

Expect: `Upload OK` and `rootHash: 0x...` (and optionally `txHash`). If you see an error (e.g. revert), that’s the same 0G issue the pitch describes.

## Flow summary (for demo)

| Step | Action | Expected |
|------|--------|----------|
| 1 | Start server (PORT=9999, TOKEN=…) | “Nerve cord broker listening on 0.0.0.0:9999” |
| 2 | Health check | `{"ok":true,...}` |
| 3 | POST /log (proposal) | 201, body includes `"cid":"0x..."` |
| 4 | POST /log (audit) | 201, body includes `"cid":"0x..."` |
| 5 | POST /log (consensus + details) | 201, body includes `"cid":"0x..."` (full blob on 0G) |
| 6 | Open StorageScan, paste cid | Content visible (or “My Files” when wallet connected) |

This matches the pitch: **proposal → audit → consensus → pin to 0G → show on StorageScan**.

## Before the hackathon (pitch checklist)

1. **Wallet address** — Fill in section 4 of the pitch with your 0G wallet address (the one in `0G_PRIVATE_KEY`).
2. **Reverted tx hash** — If you have a failed upload tx, keep the tx hash for 0G to triage.
3. **Docs** — Have `0G_INTEGRATION.md` (or “Current Status / Known Issue”) ready to show.
4. **Live demo** — Run `./test-0g-flow.sh` with server running and mainnet/testnet funded; show responses with `cid` and StorageScan.
