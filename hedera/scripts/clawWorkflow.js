const path = require('path');
const { postMessage } = require(path.join(__dirname, 'postToCouncil.js'));
require("dotenv").config();

async function runClawSequence(proposalData) {
    console.log("🧩 Starting OpenClaw + Hedera Workflow...");
    try {
        console.log("\n📡 [1/3] AlphaStrategist anchoring proposal...");
        const proposalId = "PROP-" + Date.now();

        await postMessage("Alpha Strategist", process.env.STRATEGIST_KEY, "create_checkout", {
            proposal_id: proposalId,
            content: proposalData,
            status: "PENDING_RISK_REVIEW"
        });

        await new Promise(r => setTimeout(r, 2000));

        console.log("\n📡 [2/3] Risk Manager auditing ledger...");
        const isSafe = Math.random() > 0.2;
        const decision = isSafe ? "APPROVED" : "VETOED";

        await postMessage("Risk Officer", process.env.RISK_KEY, "payment_handler", {
            responding_to: proposalId,
            decision: decision,
            reason: isSafe ? "Risk parameters within expected range." : "Volatility threshold exceeded."
        });

        console.log("\n✅ State saved to Hedera. Decision: " + decision);
    } catch (error) {
        console.error("❌ Workflow Error:", error.message);
    }
}

runClawSequence({ pair: "ETH/USDT", side: "LONG", amount: "500" });