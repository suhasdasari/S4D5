const { logIntent } = require("../../hedera/scripts/logIntent");
require("dotenv").config();

/**
 * Audit Oracle Logic
 * Triggered when a new proposal is found on Hedera HCS.
 */
async function runAudit(proposalPayload, hcsSequence, isExternal = false) {
    const origin = isExternal ? "EXTERNAL REQUEST" : `HCS Seq #${hcsSequence}`;
    console.log(`🔍 [AUDIT ORACLE] Auditing Proposal from ${origin}`);
    console.log(`📄 Proposal ID: ${proposalPayload.proposalId}`);

    // SIMULATED RISK AUDIT
    const isSafe = Math.random() > 0.1;
    const auditScore = isSafe ? 95 : 40;

    const auditVerdict = {
        responding_to: proposalPayload.proposalId,
        hcs_origin_seq: hcsSequence,
        status: isSafe ? "APPROVED" : "VETOED",
        reason: isSafe ? "Liquidity depth sufficient. Slippage within 0.5% tolerance." : "Market volatility exceeded safety threshold.",
        is_external: isExternal,
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

    return { verdict: auditVerdict, score: auditScore };
}

module.exports = { runAudit };
