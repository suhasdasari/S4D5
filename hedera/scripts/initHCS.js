const { Client, TopicCreateTransaction, PrivateKey } = require("@hashgraph/sdk");
require("dotenv").config();

async function initHCS() {
    const client = Client.forTestnet().setOperator(
        process.env.ACCOUNT_ID,
        PrivateKey.fromString(process.env.PRIVATE_KEY)
    );

    const transaction = await new TopicCreateTransaction()
        .setTopicMemo("S4D5 Autonomous Society Topic")
        .execute(client);

    const receipt = await transaction.getReceipt(client);
    console.log(`🚀 New Topic Created: ${receipt.topicId}`);
    console.log(`👉 ADD THIS TO YOUR .ENV: HEDERA_TOPIC_ID=${receipt.topicId}`);
}

initHCS();