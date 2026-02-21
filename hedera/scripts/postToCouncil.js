const { Client, TopicMessageSubmitTransaction, PrivateKey } = require("@hashgraph/sdk");
require("dotenv").config();

async function postMessage(agentName, agentKey, action, messageBody) {
    // Uses your main Account ID as the operator for fees
    const client = Client.forTestnet().setOperator(
        process.env.ACCOUNT_ID,
        PrivateKey.fromString(process.env.PRIVATE_KEY)
    );

    const transaction = await new TopicMessageSubmitTransaction()
        .setTopicId(process.env.HEDERA_TOPIC_ID)
        .setMessage(JSON.stringify(messageBody))
        .freezeWith(client);

    // Sign with the specific Agent's Key for Identity Proof
    const signedTx = await transaction.sign(PrivateKey.fromString(agentKey));
    const response = await signedTx.execute(client);
    const receipt = await response.getReceipt(client);

    return {
        sequenceNumber: receipt.topicSequenceNumber.toString(),
        transactionId: response.transactionId.toString()
    };
}

module.exports = { postMessage };