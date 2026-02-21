#!/bin/bash
# Test 0G Storage flow for S4D5 Nerve-Cord
# Run from nerve-cord/ with server running: PORT=9999 TOKEN=s4d5-suhas-susmitha-karthik node server.js
# Usage: ./test-0g-flow.sh [BASE_URL]
# Example: ./test-0g-flow.sh http://localhost:9999

set -e
BASE="${1:-http://localhost:9999}"
TOKEN="${TOKEN:-s4d5-suhas-susmitha-karthik}"
AUTH="Authorization: Bearer $TOKEN"

echo "=== S4D5 / 0G Storage flow test ==="
echo "Base URL: $BASE"
echo ""

# 1. Health
echo "1. Health check..."
HEALTH=$(curl -s -H "$AUTH" "$BASE/health")
if echo "$HEALTH" | grep -q '"ok":true'; then
  echo "   OK: $HEALTH"
else
  echo "   FAIL: $HEALTH"
  exit 1
fi
echo ""

# 2. Proposal (tag: proposal → pinned to 0G)
echo "2. POST /log (proposal)..."
R2=$(curl -s -X POST "$BASE/log" -H "Content-Type: application/json" -H "$AUTH" \
  -d '{"from":"alpha-strategist","text":"Proposed BUY 0.5 ETH spot, max slippage 0.5%","tags":["proposal"]}')
if echo "$R2" | grep -q '"cid":"0x'; then
  echo "   OK: entry has cid (pinned to 0G)"
  echo "$R2" | grep -o '"cid":"[^"]*"'
else
  echo "   Response (no cid or error): $R2"
fi
echo ""

# 3. Audit (tag: audit → pinned to 0G)
echo "3. POST /log (audit)..."
R3=$(curl -s -X POST "$BASE/log" -H "Content-Type: application/json" -H "$AUTH" \
  -d '{"from":"audit-oracle","text":"Verdict: APPROVED. VaR within 2σ, liquidity sufficient.","tags":["audit"]}')
if echo "$R3" | grep -q '"cid":"0x'; then
  echo "   OK: entry has cid (pinned to 0G)"
  echo "$R3" | grep -o '"cid":"[^"]*"'
else
  echo "   Response (no cid or error): $R3"
fi
echo ""

# 4. Execution (tag: execution → pinned to 0G)
echo "4. POST /log (execution)..."
R4a=$(curl -s -X POST "$BASE/log" -H "Content-Type: application/json" -H "$AUTH" \
  -d '{"from":"execution-hand","text":"Executed PROP-DEMO on Base Mainnet — tx 0xabc123...","tags":["execution"],"details":{"execution_id":"EXE-123","responding_to_audit":"PROP-DEMO","status":"SUCCESS","network":"Base Mainnet","tx_hash":"0xabc123","timestamp":"2026-02-21T04:00:00Z"}}')
if echo "$R4a" | grep -q '"cid":"0x'; then
  echo "   OK: entry has cid (pinned to 0G)"
  echo "$R4a" | grep -o '"cid":"[^"]*"'
else
  echo "   Response (no cid or error): $R4a"
fi
echo ""

# 5. Consensus + full decision blob (tag: consensus, details with proposalId → full blob to 0G)
echo "5. POST /log (consensus + full decision blob)..."
R4=$(curl -s -X POST "$BASE/log" -H "Content-Type: application/json" -H "$AUTH" \
  -d '{"from":"audit-oracle","text":"Consensus: PROP-DEMO APPROVED","tags":["consensus"],"details":{"proposalId":"PROP-DEMO","strategist":{"from":"alpha-strategist","proposal":"BUY 0.5 ETH spot"},"audit":{"from":"audit-oracle","verdict":"APPROVED","reasoning":"VaR OK"},"execution":null,"created":"2026-02-21T04:00:00Z"}}')
if echo "$R4" | grep -q '"cid":"0x'; then
  echo "   OK: full decision blob pinned to 0G (transcriptCid-ready)"
  echo "$R4" | grep -o '"cid":"[^"]*"'
else
  echo "   Response (no cid or error): $R4"
fi
echo ""

# 6. GET /log (today)
echo "6. GET /log (today)..."
R5=$(curl -s -H "$AUTH" "$BASE/log")
echo "   Entries: $(echo "$R5" | grep -o '"id":"log_' | wc -l | tr -d ' ')"
echo ""

echo "=== Flow test done ==="
echo "View pinned content on: https://storagescan.0g.ai (mainnet) or https://storagescan-galileo.0g.ai/tool (testnet)"
echo "Paste any cid above into StorageScan to verify."
