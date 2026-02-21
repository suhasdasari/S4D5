const { Client, TopicMessageSubmitTransaction, PrivateKey } = require("@hashgraph/sdk");
require("dotenv").config();

async function postMessage(agentName, agentKey, action, messageBody) {
    // Uses your main Account ID as the operator for fees
    const client = Client.forTestnet().setOperator(
        process.env.ACCOUNT_ID,
        PrivateKey.fromString(process.env.PRIVATE_KEY)
    );

    console.log(`[HCS] 🛰️ Initializing transaction for topic: ${process.env.HEDERA_TOPIC_ID}`);
    const transaction = await new TopicMessageSubmitTransaction()
        .setTopicId(process.env.HEDERA_TOPIC_ID)
        .setMessage(JSON.stringify(messageBody))
        .freezeWith(client);

    console.log(`[HCS] ✍️ Signing transaction for ${agentName}...`);
    const signedTx = await transaction.sign(PrivateKey.fromString(agentKey));

    console.log(`[HCS] 🚀 Executing transaction...`);
    const response = await signedTx.execute(client);

    console.log(`[HCS] 📑 Waiting for receipt...`);
    const receipt = await response.getReceipt(client);

    return {
        sequenceNumber: receipt.topicSequenceNumber.toString(),
        transactionId: response.transactionId.toString()
    };
}

module.exports = { postMessage };