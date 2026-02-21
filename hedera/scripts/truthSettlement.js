const { TransferTransaction, Client, PrivateKey } = require("@hashgraph/sdk");
require("dotenv").config();

/**
 * S4D5 Truth Settlement Engine
 * Calculates and executes performance-based rewards on Hedera Token Service (HTS).
 * 
 * @param {string} agentName - Name of the agent being rewarded
 * @param {string} intent - The action intent (e.g., 'payment_handler', 'execution_receipt')
 * @param {object} payload - The message payload containing status and metadata
 * @param {number} reputationScore - The ERC-8004 reputation score
 * @param {string} hcsSeq - The HCS sequence number triggering this reward
 */
async function settlePerformanceReward(agentName, intent, payload, reputationScore, hcsSeq) {
    const client = Client.forTestnet().setOperator(
        process.env.ACCOUNT_ID,
        PrivateKey.fromString(process.env.PRIVATE_KEY)
    );

    const tokenId = process.env.S4D5_TOKEN_ID;
    const strategistId = process.env.ALPHA_STRATEGIST_ID;
    const strategistKey = process.env.ALPHA_STRATEGIST_KEY;

    let recipientId;
    if (agentName === "Audit Oracle") recipientId = process.env.AUDIT_ORACLE_ID;
    if (agentName === "Execution Hand") recipientId = process.env.EXECUTION_HAND_ID;

    if (!recipientId || recipientId === "0.0.0000000") {
        console.error(`❌ [SETTLEMENT] Cannot payout: ID for ${agentName} is not set.`);
        return;
    }

    // BASE CALCULATIONS
    let rewardAmount = 5.00; // Base Society Fee
    let bonuses = [];

    // RULE A: The Protector (Veto Bonus)
    if (intent === "payment_handler" && payload.status === "VETOED") {
        rewardAmount += 10.00;
        bonuses.push("Protector Bonus (+10 S4D5)");
    }

    // RULE B: The Precision (Quality Bonus)
    if (reputationScore > 90) {
        rewardAmount += 5.00;
        bonuses.push("Precision Bonus (+5 S4D5)");
    }

    console.log(`🏦 [SETTLEMENT] HCS Seq #${hcsSeq} | Agent: ${agentName} | Intent: ${intent}`);
    if (bonuses.length > 0) console.log(`✨ Bonuses: ${bonuses.join(", ")}`);
    console.log(`💰 Final Reward: ${rewardAmount.toFixed(2)} S4D5`);

    try {
        const transaction = await new TransferTransaction()
            .addTokenTransfer(tokenId, strategistId, -(rewardAmount * 100)) // 2 decimals
            .addTokenTransfer(tokenId, recipientId, (rewardAmount * 100))
            .setTransactionMemo(`S4D5 Reward: Seq #${hcsSeq} | ${agentName}`)
            .freezeWith(client);

        // Strategist (Treasury) Signs the Transfer
        const signTx = await transaction.sign(PrivateKey.fromString(strategistKey));
        const response = await signTx.execute(client);
        const receipt = await response.getReceipt(client);

        console.log(`✅ [SETTLEMENT] HTS Transfer Successful for Seq #${hcsSeq}. Status: ${receipt.status.toString()}`);
        console.log(`🔗 Tx ID: ${response.transactionId.toString()}`);

        return {
            success: true,
            amount: rewardAmount,
            txId: response.transactionId.toString(),
            seq: hcsSeq
        };
    } catch (error) {
        console.error(`❌ [SETTLEMENT] HTS Transfer Failed for Seq #${hcsSeq}:`, error.message);
        return { success: false, error: error.message };
    }
}

module.exports = { settlePerformanceReward };
