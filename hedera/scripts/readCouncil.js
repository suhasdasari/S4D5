const { Client, TopicMessageQuery } = require("@hashgraph/sdk");
require("dotenv").config();

async function readCouncil() {
    const client = Client.forTestnet();
    console.log("🧐 AUDITOR: Reading history from Topic", process.env.HEDERA_TOPIC_ID);

    new TopicMessageQuery()
        .setTopicId(process.env.HEDERA_TOPIC_ID)
        .setStartTime(0)
        .subscribe(client, null, (message) => {
            const data = JSON.parse(Buffer.from(message.contents).toString());
            const seq = message.sequenceNumber.toString();
            console.log(`[Seq #${seq}] ${data.agent} -> ${data.intent} (Rep: ${data.erc8004?.reputation_score})`);
        });
}

readCouncil();