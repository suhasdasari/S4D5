const { postMessage } = require("./postToCouncil");
const { Client, TransferTransaction, Hbar } = require("@hashgraph/sdk");
require("dotenv").config();

async function runSociety() {
    console.log("🏛️  S4D5 AGENTIC SOCIETY SESSION STARTING...\n");

    try {
        // --- PHASE 1: UCP COMMERCE (STRATEGIST PROPOSES) ---
        console.log("📡 Phase 1: Strategist issuing UCP create_checkout...");
        await postMessage("Alpha Strategist", process.env.STRATEGIST_KEY, "create_checkout", {
            ucp_version: "1.0",
            item: "ETH-LONG-3X",
            price: "5.00",
            currency: "S4D5",
            reputation_stake: 85 
        });

        await new Promise(r => setTimeout(r, 2000));

        // --- PHASE 2: REPUTATION AUDIT (RISK OFFICER) ---
        console.log("\n📡 Phase 2: Risk Officer performing ERC-8004 validation...");
        await postMessage("Risk Officer", process.env.RISK_KEY, "payment_handler", {
            status: "COMPLETED",
            validation: {
                score: 98,
                tag: "SAFE_PASS",
                proof: "0x7f83b1..." 
            }
        });

        await new Promise(r => setTimeout(r, 2000));

        // --- PHASE 3: HTS SETTLEMENT (EXECUTIONER PAYS) ---
        console.log("\n💸 Phase 3: Executing HTS Token Settlement...");
        const client = Client.forTestnet().setOperator(
            process.env.HEDERA_OPERATOR_ID, 
            process.env.HEDERA_OPERATOR_KEY
        );
        
        const tx = await new TransferTransaction()
            .addTokenTransfer(process.env.REWARD_TOKEN_ID, process.env.HEDERA_OPERATOR_ID, -5)
            .addTokenTransfer(process.env.REWARD_TOKEN_ID, process.env.STRATEGIST_ID, 5)
            .execute(client);
        
        const receipt = await tx.getReceipt(client);
        console.log(`\n✅ SETTLEMENT SUCCESSFUL: Status ${receipt.status}`);
        console.log(`🔗 Audit Trail: https://hashscan.io/testnet/topic/${process.env.HEDERA_TOPIC_ID}`);
        
    } catch (error) {
        console.error("\n❌ Society Runtime Error:", error.message);
    }
}

runSociety();
