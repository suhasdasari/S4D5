# 0G Storage Integration — S4D5 Nerve-Cord

This document describes the 0G Labs storage integration for pinning council decisions and audit evidence to decentralized storage.

---

## Overview

**What it does:** Automatically uploads selected Nerve-Cord activity log entries to 0G Storage, providing a decentralized, verifiable audit trail for AI council decisions.

**When it triggers:** Log entries with tags `audit`, `proposal`, `consensus`, or `execution` (or `pinTo0g: true`) are pinned to 0G.

**What gets stored:** 
- **Single log entries** (default): The log entry JSON as-is.
- **Full decision blobs** (when provided): Structured evidence with `proposalId`, `strategist`, `audit`, `execution`, `created` (for Hedera `transcriptCid`).

---

## Prerequisites

### 1. EVM Wallet (One App Wallet)

Create a single EVM wallet for your application (not per-agent, not the user's):

- **How:** Use MetaMask or any EVM wallet, export the private key.
- **Address:** This wallet will pay for all 0G uploads (gas + storage fee).
- **Security:** Keep the private key secret; never commit it to git.

### 2. 0G Testnet Tokens

Fund the wallet with 0G testnet tokens:

- **Faucet:** https://faucet.0g.ai
- **Connect:** Use the same wallet address as above.
- **Request:** Get testnet tokens (e.g., 0.1 OG per day limit).
- **Verify:** Check balance on https://chainscan-galileo.0g.ai

### 3. Environment Variables

Add these to `nerve-cord/.env`:

```env
# 0G Storage (testnet)
0G_EVM_RPC=https://evmrpc-testnet.0g.ai
0G_INDEXER_RPC=https://indexer-storage-testnet-turbo.0g.ai
0G_PRIVATE_KEY=0x_your_64_hex_characters_here
```

**Important:** 
- Use the **same wallet address** that you funded at the faucet.
- Never commit `.env` to git (add to `.gitignore`).

---

## Implementation

### Files Created/Modified

| File | Purpose |
|------|---------|
| `nerve-cord/0g_upload.js` | 0G upload helper: `uploadTo0g(data)` using `@0glabs/0g-ts-sdk` with `MemData` |
| `nerve-cord/server.js` | POST `/log` calls `uploadTo0g()` for entries with tags `audit`, `proposal`, `consensus`, or `execution` |
| `nerve-cord/package.json` | Dependencies: `@0glabs/0g-ts-sdk`, `ethers` |
| `hedera/scripts/postToNerveCord.js` | Helper to POST log entries to Nerve-Cord (used by agents and society) |
| `agents/AuditOracle/logic.js` | After HCS anchor, posts verdict to Nerve-Cord with tag `audit` → pinned to 0G |
| `agents/ExecutionHand/logic.js` | After HCS anchor, posts receipt to Nerve-Cord with tag `execution` → pinned to 0G |
| `hedera/scripts/agentSociety.js` | After execution_receipt, posts consensus blob with tag `consensus` → pinned to 0G |

### How It Works

1. **Log Entry Posted** → Agent or orchestrator sends `POST /log` with tags `audit`, `proposal`, `consensus`, or `execution` (or `pinTo0g: true`). Audit Oracle and Execution Hand post via `postToNerveCord()`; society posts the consensus blob after execution.

2. **0G Check** → Server checks if entry should be pinned (tags match or `pinTo0g: true`).

3. **Upload to 0G** → If yes:
   - Builds file from entry (or `body.details` if full decision blob provided).
   - Uses `MemData` (in-memory) to create file object.
   - Computes merkle tree and root hash.
   - Calls 0G flow contract `submit()` with storage fee.
   - Returns `rootHash` (content id).

4. **Attach CID** → On success, `entry.cid = rootHash`. On failure, logs error and continues without `cid`.

5. **Save Entry** → Log entry is saved to Nerve-Cord (with or without `cid`).

---

## Usage

### Basic: Single Log Entry

```bash
curl -X POST http://localhost:9998/log \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{
    "from": "alpha-strategist",
    "text": "Proposed BUY 0.5 ETH",
    "tags": ["proposal"]
  }'
```

**Result:** Entry saved; if 0G succeeds, response includes `"cid": "0x..."`.

### Advanced: Full Decision Blob

```bash
curl -X POST http://localhost:9998/log \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{
    "from": "audit-oracle",
    "text": "Consensus: PROP-0201 APPROVED",
    "tags": ["consensus"],
    "details": {
      "proposalId": "PROP-0201",
      "strategist": {
        "from": "alpha-strategist",
        "proposal": "BUY 0.5 ETH spot, max slippage 0.5%"
      },
      "audit": {
        "from": "audit-oracle",
        "verdict": "APPROVED",
        "reasoning": "VaR within 2σ, liquidity sufficient"
      },
      "execution": null,
      "created": "2026-02-19T14:32:00Z"
    }
  }'
```

**Result:** 0G stores the full evidence blob; `cid` can be used as `transcriptCid` in Hedera HCS attestation.

---

## Testing

### Test 0G Upload Helper (CLI)

```bash
cd nerve-cord
node 0g_upload.js '{"from":"alpha-strategist","text":"Test proposal","tags":["audit"]}'
```

**Expected:** `Upload OK` with `rootHash` (if testnet works) or error message (if contract reverts).

### Test Server Integration

1. **Start server:**
   ```bash
   PORT=9998 TOKEN=test-token node server.js
   ```

2. **POST with 0G tag:**
   ```bash
   curl -X POST http://localhost:9998/log \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer test-token" \
     -d '{"from":"alpha-strategist","text":"Test","tags":["audit"]}'
   ```

3. **Check response:** Should include `cid` if 0G succeeds, or no `cid` if it fails (but entry still saved).

---

## Current Status

### ✅ Working

- 0G SDK integration (`MemData`, merkle tree, upload).
- Server pins to 0G for tags `audit`, `proposal`, `consensus`, and `execution`.
- Audit Oracle and Execution Hand post verdict/receipt to Nerve-Cord (pinned to 0G).
- Society posts consensus/full decision blob to Nerve-Cord after execution (pinned to 0G).
- Error handling: server continues and saves entry even if 0G upload fails.
- Full decision blob: when `body.details` has `proposalId`, that blob is uploaded for Hedera `transcriptCid`.

### ⚠️ Notes

- **Transient failures:** Some uploads (e.g. duplicate root hash or 0G rate limits) may fail; the log entry is still saved and the server logs `0G upload failed (continuing without cid)`.
- **Hedera/agents:** Set `NERVE_CORD_SERVER` and `NERVE_CORD_TOKEN` (or `NERVE_SERVER` / `NERVE_TOKEN`) where the society and agents run so they can POST to Nerve-Cord.

---

## Optional: Skip 0G for Local Testing

To test the integration flow without spending 0G tokens:

1. **Add to `.env`:**
   ```env
   SKIP_0G_UPLOAD=true
   ```

2. **Modify `0g_upload.js`** (add at start of `uploadTo0g` function):
   ```javascript
   if (process.env.SKIP_0G_UPLOAD === 'true' || process.env.SKIP_0G_UPLOAD === '1') {
     const buf = Buffer.isBuffer(data) ? data : Buffer.from(String(data), 'utf8');
     const uint8 = new Uint8Array(buf);
     const { MemData } = await import('@0glabs/0g-ts-sdk');
     const file = new MemData(uint8);
     const [tree, treeErr] = await file.merkleTree();
     if (treeErr != null) throw new Error(`0G merkle tree: ${treeErr}`);
     return { rootHash: tree.rootHash(), txHash: '0x_skipped_for_testing' };
   }
   ```

**Effect:** Returns a real `rootHash` (from merkle tree) without calling the blockchain. **Never enable in production.**

---

## Dependencies

```json
{
  "@0glabs/0g-ts-sdk": "^0.3.3",
  "ethers": "^6.10.0"
}
```

Install: `npm install` in `nerve-cord/`

---

## Integration with Hedera

- **Hedera HCS:** Agents anchor intents (create_checkout, payment_handler, execution_receipt) to HCS.
- **0G Storage:** Nerve-Cord pins proposal, audit verdict, execution receipt, and consensus blob to 0G; each returns a `cid`.
- **Society flow:** After Execution Hand posts execution_receipt, `agentSociety.js` assembles the full decision blob (proposalId, strategist, audit, execution) and posts it to Nerve-Cord with tag `consensus`, which is pinned to 0G. That `cid` can be used as `transcriptCid` in Hedera attestations.

**Flow:**
1. Proposal → Audit Oracle verdict → Execution Hand receipt (all anchored to HCS and posted to Nerve-Cord → 0G).
2. Society posts consensus blob to Nerve-Cord → 0G; response includes `cid`.
3. Use `cid` as `transcriptCid` when sending attestations to Hedera HCS.

---

## Resources

- **0G Docs:** https://docs.0g.ai
- **0G Builder Hub:** https://build.0g.ai
- **Testnet Faucet:** https://faucet.0g.ai
- **Testnet Explorer:** https://chainscan-galileo.0g.ai
- **SDK:** https://github.com/0glabs/0g-ts-sdk

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `0G config missing` | Set `0G_EVM_RPC`, `0G_INDEXER_RPC`, `0G_PRIVATE_KEY` in `.env` |
| `execution reverted` | Check wallet balance on explorer; verify contract not paused; ask 0G Discord |
| `ZgFile.fromStream is not a function` | Use `MemData` instead (already implemented) |
| No `cid` in response | 0G upload failed (check server logs); entry still saved |

---

## Summary

**What we built:** 0G Storage integration that pins council decisions and audit evidence (proposal, audit verdict, execution receipt, consensus blob) to decentralized storage, returning content IDs (`cid`) for use in Hedera attestations. Audit Oracle and Execution Hand post to Nerve-Cord after HCS; the society posts the full consensus blob after execution.

**Status:** Integration complete; upload and fetch verified on testnet.

**Optional:** Store Hedera HCS attestations with `transcriptCid` pointing to 0G blobs.

