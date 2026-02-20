const { postMessage } = require("./postToCouncil");
require("dotenv").config();

async function runCouncilCycle() {
    console.log("🚀 Starting S4D5 Council Decision Cycle...\n");

    try {
        // 1. Alpha Strategist Proposes
        console.log("--- Phase 1: Strategy Proposal ---");
        await postMessage("Alpha Strategist", process.env.STRATEGIST_KEY, "PROPOSAL: Long ETH/USDC | Leverage: 3x.");

        await new Promise(r => setTimeout(r, 2000));

        // 2. Risk Officer Approves
        console.log("\n--- Phase 2: Risk Audit ---");
        await postMessage("Risk Officer", process.env.RISK_KEY, "APPROVED: Risk parameters within tolerance.");

        await new Promise(r => setTimeout(r, 2000));

        // 3. Executioner Finalizes
        console.log("\n--- Phase 3: Market Execution ---");
        
        // Debugging line:
        if (!process.env.EXECUTIONER_KEY) {
            throw new Error("CRITICAL: The variable 'EXECUTIONER_KEY' was not found in your .env file. Please check for typos or extra spaces.");
        }

        await postMessage("Executioner", process.env.EXECUTIONER_KEY, "EXECUTED: Trade placed on Hyperliquid. TxID: 0x9a8b7c6d");

        console.log("\n✅ [SUCCESS] All three agents have spoken!");
        
    } catch (error) {
        console.error("\n❌ Council Breakdown:", error.message);
    }
}

runCouncilCycle();
