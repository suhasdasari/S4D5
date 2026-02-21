const { postMessage } = require("./postToCouncil");
require("dotenv").config();

/**
 * Anchors an AI Intent to Hedera HCS
 * @param {string} agentName - 'Alpha Strategist', 'Audit Oracle', or 'Execution Hand'
 * @param {string} action - create_checkout, payment_handler, or execution_receipt
 * @param {object} data - The payload
 * @param {number} confidenceScore - ERC-8004 Score (0-100)
 */
async function logIntent(agentName, action, data, confidenceScore) {
    let agentKey;

    // Standardized Mapping to Repo Names
    if (agentName === "Alpha Strategist") {
        agentKey = process.env.ALPHA_STRATEGIST_KEY;
    } else if (agentName === "Audit Oracle") {
        agentKey = process.env.AUDIT_ORACLE_KEY;
    } else if (agentName === "Execution Hand") {
        agentKey = process.env.EXECUTION_HAND_KEY;
    }

    if (!agentKey) {
        console.error(`❌ Error: Key for "${agentName}" not found in Environment.`);
        return null;
    }

    const messageBody = {
        protocol: "S4D5-UCP-1.0",
        agent: agentName,
        intent: action,
        payload: data,
        erc8004: {
            reputation_score: confidenceScore,
            timestamp: new Date().toISOString()
        }
    };

    try {
        const result = await postMessage(agentName, agentKey, action, messageBody);
        console.log(`✅ [HCS] ${agentName} anchored ${action} successfully.`);
        return result;
    } catch (error) {
        console.error(`❌ HCS Error for ${agentName}:`, error.message);
        throw error;
    }
}

module.exports = { logIntent };