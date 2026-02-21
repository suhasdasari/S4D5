const { logIntent } = require("../../hedera/scripts/logIntent");
const { postToNerveCord } = require("../../hedera/scripts/postToNerveCord");
require("dotenv").config();

/**
 * Audit Oracle Logic
 * Triggered when a new proposal is found on Hedera HCS.
 */
async function runAudit(proposalPayload, hcsSequence) {
    console.log(`🔍 [AUDIT ORACLE] Auditing Proposal anchored at HCS Seq #${hcsSequence}`);
    console.log(`📄 Proposal ID: ${proposalPayload.proposalId}`);

    // SIMULATED RISK AUDIT
    // In a production scenario, this would query market depth, slippage, and volatility.
    const isSafe = Math.random() > 0.1; // 90% chance of approval for demo
    const auditScore = isSafe ? 95 : 40;

    const auditVerdict = {
        responding_to: proposalPayload.proposalId,
        hcs_origin_seq: hcsSequence,
        status: isSafe ? "APPROVED" : "VETOED",
        reason: isSafe ? "Liquidity depth sufficient. Slippage within 0.5% tolerance." : "Market volatility exceeded safety threshold.",
        timestamp: new Date().toISOString()
    };

    console.log(`⚖️ Verdict: ${auditVerdict.status} | Score: ${auditScore}%`);

    // ANCHOR VERDICT TO HEDERA HCS
    try {
        await logIntent("Audit Oracle", "payment_handler", auditVerdict, auditScore);
        console.log(`✅ [AUDIT ORACLE] Verdict anchored for Proposal ${proposalPayload.proposalId}`);
    } catch (error) {
        console.error(`❌ [AUDIT ORACLE] Failed to anchor verdict:`, error.message);
    }

    // Pin verdict to 0G via Nerve-Cord
    try {
        const nc = await postToNerveCord({
            from: "audit-oracle",
            text: `Verdict: ${auditVerdict.status} for ${auditVerdict.responding_to} — ${auditVerdict.reason}`,
            tags: ["audit"],
            details: auditVerdict,
        });
        if (nc && nc.cid) console.log(`✅ [AUDIT ORACLE] Verdict pinned to 0G: ${nc.cid}`);
    } catch (err) {
        console.warn(`⚠️ [AUDIT ORACLE] Nerve-Cord/0G pin skipped:`, err.message);
    }
}

module.exports = { runAudit };
