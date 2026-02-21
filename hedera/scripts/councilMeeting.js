const { TransferTransaction, TokenAssociateTransaction, PrivateKey, Client } = require("@hashgraph/sdk");
require("dotenv").config();

/**
 * Utility to pay out S4D5 Reward Tokens for successful cycles
 * @param {string} agentName - The recipient (usually 'Audit Oracle')
 * @param {number} amount - Amount in S4D5 (e.g., 5.00)
 */
async function payoutRiskFee(agentName, amount) {
    const client = Client.forTestnet().setOperator(
        process.env.ACCOUNT_ID,
        PrivateKey.fromString(process.env.PRIVATE_KEY)
    );

    const tokenId = process.env.REWARD_TOKEN_ID;
    const strategistId = process.env.ALPHA_STRATEGIST_ID;
    const strategistKey = process.env.ALPHA_STRATEGIST_KEY;

    let recipientId;
    if (agentName === "Audit Oracle") recipientId = process.env.AUDIT_ORACLE_ID;
    if (agentName === "Execution Hand") recipientId = process.env.EXECUTION_HAND_ID;

    if (!recipientId || recipientId === "0.0.0000000") {
        console.error(`❌ Cannot payout: ID for ${agentName} is not set.`);
        return;
    }

    console.log(`💰 Transferring ${amount} S4D5 tokens from Strategist to ${agentName}...`);

    try {
        const transaction = await new TransferTransaction()
            .addTokenTransfer(tokenId, strategistId, -(amount * 100)) // Multiply by 100 for 2 decimals
            .addTokenTransfer(tokenId, recipientId, (amount * 100))
            .freezeWith(client);

        // Treasury (Strategist) must sign the transfer
        const signTx = await transaction.sign(PrivateKey.fromString(strategistKey));
        const response = await signTx.execute(client);
        const receipt = await response.getReceipt(client);

        console.log(`✅ Payout Successful! Status: ${receipt.status.toString()}`);
        return receipt;
    } catch (error) {
        console.error(`❌ Payout Failed:`, error.message);
        throw error;
    }
}

module.exports = { payoutRiskFee };