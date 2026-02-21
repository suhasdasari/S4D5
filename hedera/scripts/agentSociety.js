const { TopicMessageQuery } = require("@hashgraph/sdk");
const { logIntent } = require("../hedera/scripts/logIntent");
const { Client, PrivateKey } = require("@hashgraph/sdk");
require("dotenv").config();

async function startSociety() {
    const client = Client.forTestnet().setOperator(
        process.env.ACCOUNT_ID,
        PrivateKey.fromString(process.env.PRIVATE_KEY)
    );

    console.log("🤖 S4D5 Society Online: Listening for HCS signals...");

    new TopicMessageQuery()
        .setTopicId(process.env.HEDERA_TOPIC_ID)
        .subscribe(client, null, async (message) => {
            const data = JSON.parse(Buffer.from(message.contents).toString());
            console.log(`📩 [HCS Signal] ${data.agent}: ${data.intent}`);

            // 1. Audit Oracle Reacts to Alpha Strategist
            if (data.agent === "Alpha Strategist" && data.intent === "create_checkout") {
                console.log("⚖️ Audit Oracle: Analyzing new trade proposal...");
                // Trigger Audit logic here
            }

            // 2. Execution Hand Reacts to Audit Oracle
            if (data.agent === "Audit Oracle" && data.intent === "payment_handler" && data.payload.status === "APPROVED") {
                console.log("⚡ Execution Hand: Executing on Base...");
                // Trigger Execution logic here
            }
        });
}

startSociety().catch(console.error);