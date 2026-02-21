const { TopicMessageQuery } = require("@hashgraph/sdk");
const { Client, PrivateKey } = require("@hashgraph/sdk");
require("dotenv").config();

// Import your agent logic
const { runAudit } = require("../../agents/AuditOracle/logic");
const { runExecution } = require("../../agents/ExecutionHand/logic");

async function startClawWorkflow() {
    const client = Client.forTestnet().setOperator(
        process.env.ACCOUNT_ID,
        PrivateKey.fromString(process.env.PRIVATE_KEY)
    );

    console.log("🌊 ClawWorkflow: Society Heartbeat Active...");

    new TopicMessageQuery()
        .setTopicId(process.env.HEDERA_TOPIC_ID)
        .subscribe(client, null, async (message) => {
            const data = JSON.parse(Buffer.from(message.contents).toString());
            const seq = message.sequenceNumber.toString();

            switch (data.intent) {
                case "create_checkout":
                    console.log(`[HCS Seq #${seq}] 🔎 New Proposal from Alpha Strategist. Alerting Audit Oracle...`);
                    // The workflow triggers the next agent automatically
                    await runAudit(data.payload, seq);
                    break;

                case "payment_handler":
                    if (data.payload.status === "APPROVED") {
                        console.log(`[HCS Seq #${seq}] ✅ Audit Passed. Alerting Execution Hand...`);
                        await runExecution(data.payload, seq);
                    } else {
                        console.log(`[HCS Seq #${seq}] ❌ Audit Vetoed. Workflow Terminated.`);
                    }
                    break;

                case "execution_receipt":
                    console.log(`[HCS Seq #${seq}] 🏁 Cycle Complete. Trade finalized on Base.`);
                    break;
            }
        });
}

startClawWorkflow().catch(console.error);