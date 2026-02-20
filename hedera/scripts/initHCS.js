const { Client, TopicCreateTransaction } = require("@hashgraph/sdk");
require("dotenv").config();

async function main() {
    try {
        const operatorId = process.env.HEDERA_OPERATOR_ID;
        const operatorKey = process.env.HEDERA_OPERATOR_KEY;
        const client = Client.forTestnet().setOperator(operatorId, operatorKey);

        console.log("🛠️  Creating S4D5 Council Topic...");

        const transaction = await new TopicCreateTransaction()
            .setTopicMemo("S4D5 Agent Council - Immutable Audit Trail")
            .execute(client);

        const receipt = await transaction.getReceipt(client);
        const topicId = receipt.topicId.toString();

        console.log("\n✅ SUCCESS!");
        console.log(`Your HCS Topic ID is: ${topicId}`);
        console.log("\nNext: Add this ID to your .env file as HEDERA_TOPIC_ID");
    } catch (error) {
        console.error("\n❌ Failed to create topic:", error.message);
    }
}
main();
