// scripts/logIntent.js
const { postMessage } = require("./postToCouncil");
require("dotenv").config();

/**
 * Anchors an AI Intent to Hedera HCS with ERC-8004 Reputation Logic
 * @param {string} agentName - 'Strategist', 'Risk Officer', or 'Executioner'
 * @param {string} action - UCP Action (e.g., 'create_checkout', 'payment_handler')
 * @param {object} data - The payload/details of the intent
 * @param {number} confidenceScore - ERC-8004 Reputation Score (0-100)
 */
async function logIntent(agentName, action, data, confidenceScore) {
    // 1. DYNAMIC KEY MAPPING 
    // This handles both UpperCase and CamelCase from your .env
    let agentKey;

    if (agentName === "Strategist") {
        agentKey = process.env.STRATEGIST_KEY || process.env.Strategist_Key;
    } else if (agentName === "Risk Officer") {
        agentKey = process.env.RISK_KEY || process.env.Risk_Key;
    } else if (agentName === "Executioner") {
        agentKey = process.env.EXECUTIONER_KEY || process.env.Executioner_Key;
    }

    // 2. SAFETY CHECK
    if (!agentKey) {
        console.error(`\n❌ Error: Private Key for "${agentName}" not found in .env!`);
        console.log(`   Expected keys: ${agentName}_Key or ${agentName.toUpperCase().replace(' ', '_')}_KEY`);
        return null;
    }

    // 3. ERC-8004 & UCP MESSAGE STRUCTURE
    const messageBody = {
        protocol: "UCP-1.0",
        agent: agentName,
        intent: action,
        payload: data,
        erc8004: {
            reputation_score: confidenceScore, // Vital for the $10k bounty
            attestation_standard: "ERC-8004",
            timestamp: new Date().toISOString()
        }
    };

    // 4. BROADCAST TO HEDERA
    try {
        console.log(`🔗 [HCS LINK] ${agentName} anchoring: ${action}`);
        const result = await postMessage(agentName, agentKey, action, messageBody);
        return result;
    } catch (error) {
        console.error(`❌ HCS Link Failed for ${agentName}:`, error.message);
        throw error;
    }
}

module.exports = { logIntent };