const { Client, TopicMessageQuery } = require("@hashgraph/sdk");
require("dotenv").config();

async function main() {
    try {
        const client = Client.forTestnet().setOperator(
            process.env.HEDERA_OPERATOR_ID, 
            process.env.HEDERA_OPERATOR_KEY
        );
        const topicId = process.env.HEDERA_TOPIC_ID;

        console.log(`👂 Council Auditor is listening to: ${topicId}\n`);

        new TopicMessageQuery()
            .setTopicId(topicId)
            .subscribe(client, null, (message) => {
                const msg = Buffer.from(message.contents, "utf8").toString();
                console.log(`📖 [Seq #${message.sequenceNumber}]: ${msg}`);
            });
    } catch (err) {
        console.error("Error:", err.message);
    }
}
main();
