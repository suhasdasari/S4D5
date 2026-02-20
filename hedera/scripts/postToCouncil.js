const { Client, TopicMessageSubmitTransaction, PrivateKey } = require("@hashgraph/sdk");
require("dotenv").config();

async function postMessage(agentName, agentKey, message) {
    try {
        const client = Client.forTestnet().setOperator(
            process.env.HEDERA_OPERATOR_ID, 
            process.env.HEDERA_OPERATOR_KEY
        );

        const topicId = process.env.HEDERA_TOPIC_ID;
        const formattedMessage = `[${agentName}]: ${message}`;

        console.log(`📡 Broadcasting from ${agentName}...`);

        const transaction = await new TopicMessageSubmitTransaction({
            topicId: topicId,
            message: formattedMessage,
        })
        .freezeWith(client)
        .sign(PrivateKey.fromString(agentKey)); // The Agent signs with its own Soul

        const response = await transaction.execute(client);
        const receipt = await response.getReceipt(client);

        console.log(`✅ Sequence #${receipt.topicSequenceNumber}: Message anchored to Hedera!`);
    } catch (error) {
        console.error("❌ Broadcast failed:", error.message);
    }
}

// Quick Test Execution
if (require.main === module) {
    // This tests with the Strategist credentials from your .env
    postMessage("Alpha Strategist", process.env.STRATEGIST_KEY, "S4D5 Council is now online. Awaiting market data.");
}

module.exports = { postMessage };
