const { logIntent } = require("../../hedera/scripts/logIntent");
const { postToNerveCord } = require("../../hedera/scripts/postToNerveCord");
require("dotenv").config();

/**
 * Execution Hand Logic
 * Triggered when an APPROVED verdict is found on Hedera HCS.
 */
async function runExecution(auditPayload, hcsSequence) {
    console.log(`⚡ [EXECUTION HAND] Executing Proposal based on Approved Audit at Seq #${hcsSequence}`);
    console.log(`🔗 Target Proposal: ${auditPayload.responding_to}`);

    // SIMULATED ON-CHAIN EXECUTION (BASE NETWORK)
    // In production, this would call a smart contract on Base.
    const simulatedTxHash = "0x" + [...Array(64)].map(() => Math.floor(Math.random() * 16).toString(16)).join("");

    const executionReceipt = {
        execution_id: "EXE-" + Date.now(),
        responding_to_audit: auditPayload.responding_to,
        status: "SUCCESS",
        network: "Base Mainnet",
        tx_hash: simulatedTxHash,
        gas_used: "125,000",
        timestamp: new Date().toISOString()
    };

    console.log(`✅ [EXECUTION HAND] Trade Executed on Base. Tx: ${simulatedTxHash.substring(0, 10)}...`);

    // ANCHOR RECEIPT TO HEDERA HCS
    try {
        await logIntent("Execution Hand", "execution_receipt", executionReceipt, 99);
        console.log(`🏁 [EXECUTION HAND] Receipt anchored. Society Loop Complete.`);
    } catch (error) {
        console.error(`❌ [EXECUTION HAND] Failed to anchor receipt:`, error.message);
    }

    // Pin receipt to 0G via Nerve-Cord
    try {
        const nc = await postToNerveCord({
            from: "execution-hand",
            text: `Executed ${executionReceipt.responding_to_audit} on ${executionReceipt.network} — tx ${simulatedTxHash.substring(0, 10)}...`,
            tags: ["execution"],
            details: executionReceipt,
        });
        if (nc && nc.cid) console.log(`✅ [EXECUTION HAND] Receipt pinned to 0G: ${nc.cid}`);
    } catch (err) {
        console.warn(`⚠️ [EXECUTION HAND] Nerve-Cord/0G pin skipped:`, err.message);
    }
}

module.exports = { runExecution };
