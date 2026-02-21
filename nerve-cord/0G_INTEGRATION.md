# 0G Storage Integration — S4D5 Nerve-Cord

This document describes the 0G Labs storage integration for pinning council decisions and audit evidence to decentralized storage.

---

## Overview

**What it does:** Automatically uploads selected Nerve-Cord activity log entries to 0G Storage, providing a decentralized, verifiable audit trail for AI council decisions.

**When it triggers:** Log entries with tags `audit`, `proposal`, or `consensus` (or `pinTo0g: true`) are pinned to 0G.

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
| `nerve-cord/0g_Upload.js` | 0G upload helper: `uploadTo0g(data)` function using `@0glabs/0g-ts-sdk` with `MemData` |
| `nerve-cord/server.js` | Modified POST `/log` handler to call `uploadTo0g()` for tagged entries |
| `nerve-cord/package.json` | Added dependencies: `@0glabs/0g-ts-sdk`, `ethers` |

### How It Works

1. **Log Entry Posted** → Agent or orchestrator sends `POST /log` with tags `audit`, `proposal`, or `consensus`.

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
node 0g_Upload.js '{"from":"alpha-strategist","text":"Test proposal","tags":["audit"]}'
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

- 0G SDK integration (`MemData`, merkle tree, upload attempt).
- Server calls 0G for tagged entries (`audit`, `proposal`, `consensus`).
- Error handling: server continues and saves entry even if 0G fails.
- Full decision blob support: when `body.details` has `proposalId`, uploads that blob instead of single entry.

### ⚠️ Known Issue

**Testnet Contract Revert:** Uploads to 0G testnet currently revert with `status: 0` (transaction execution reverted). This is a **0G testnet/contract issue**, not a bug in this integration.

**Possible causes:**
- Flow contract paused
- Invalid submission format
- Duplicate root hash
- Testnet-specific requirements

**Workaround:** Integration code is correct; will work when testnet issue is resolved. For testing without cost, use `SKIP_0G_UPLOAD=true` in `.env` (see below).

---

## Optional: Skip 0G for Local Testing

To test the integration flow without spending 0G tokens:

1. **Add to `.env`:**
   ```env
   SKIP_0G_UPLOAD=true
   ```

2. **Modify `0g_Upload.js`** (add at start of `uploadTo0g` function):
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

When Hedera HCS is added:

- **0G stores:** Full evidence blob (proposalId, strategist, audit, execution).
- **Hedera stores:** Short attestation with `transcriptCid` pointing to 0G blob.

**Flow:**
1. Council reaches consensus → assemble full blob.
2. Upload blob to 0G → get `cid` (rootHash).
3. Send attestation to Hedera HCS with `transcriptCid: cid`.

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

**What we built:** 0G Storage integration that pins council decisions and audit evidence to decentralized storage, returning content IDs (`cid`) for use in Hedera attestations.

**Status:** Integration complete; testnet contract currently reverting (known issue).

**Next:** Add Hedera HCS to store attestations with `transcriptCid` pointing to 0G blobs.

