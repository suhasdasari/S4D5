const { TopicMessageQuery } = require("@hashgraph/sdk");
const { Client, PrivateKey } = require("@hashgraph/sdk");
const { runAudit } = require("../../agents/AuditOracle/logic");
const { runExecution } = require("../../agents/ExecutionHand/logic");
const { settlePerformanceReward } = require("./truthSettlement");
require("dotenv").config();

async function startSociety() {
    // Check for required operator credentials
    if (!process.env.ACCOUNT_ID || !process.env.PRIVATE_KEY) {
        throw new Error("Missing ACCOUNT_ID or PRIVATE_KEY in .env for HCS Operator.");
    }
    if (!process.env.HEDERA_TOPIC_ID) {
        throw new Error("Missing HEDERA_TOPIC_ID in .env.");
    }

    const client = Client.forTestnet().setOperator(
        process.env.ACCOUNT_ID,
        PrivateKey.fromString(process.env.PRIVATE_KEY)
    );

    console.log(`🤖 S4D5 Society Online: Listening on Topic ${process.env.HEDERA_TOPIC_ID}...`);

    new TopicMessageQuery()
        .setTopicId(process.env.HEDERA_TOPIC_ID)
        .subscribe(client, null, async (message) => {
            try {
                const data = JSON.parse(Buffer.from(message.contents).toString());
                const seq = message.sequenceNumber.toString();

                console.log(`📩 [HCS Signal #${seq}] ${data.agent}: ${data.intent}`);

                // 1. Audit Oracle Reacts to Alpha Strategist
                if (data.agent === "Alpha Strategist" && data.intent === "create_checkout") {
                    console.log("⚖️ Audit Oracle: Analyzing new trade proposal...");
                    await runAudit(data.payload, seq);
                }

                // 2. Execution Hand Reacts to Audit Oracle
                if (data.agent === "Audit Oracle" && data.intent === "payment_handler") {
                    if (data.payload.status === "APPROVED") {
                        console.log("⚡ Execution Hand: Executing on Base...");

                        // Performance Reward: Standard Audit (Approved)
                        console.log("🏦 Initiating Audit Settlement...");
                        await settlePerformanceReward(
                            "Audit Oracle",
                            data.intent,
                            data.payload,
                            data.erc8004 ? data.erc8004.reputation_score : 0,
                            seq
                        );

                        await runExecution(data.payload, seq);
                    } else {
                        console.log("🛑 Audit Oracle VETOED this proposal. Loop terminated.");

                        // Performance Reward: The Protector (Veto Bonus)
                        console.log("🏦 Initiating Protector Settlement...");
                        await settlePerformanceReward(
                            "Audit Oracle",
                            data.intent,
                            data.payload,
                            data.erc8004 ? data.erc8004.reputation_score : 0,
                            seq
                        );
                    }
                }

                // 3. Loop Termination Logging (Execution Hand Reward)
                if (data.agent === "Execution Hand" && data.intent === "execution_receipt") {
                    console.log(`🏁 Full loop completed gracefully for Proposal: ${data.payload.responding_to_audit}`);

                    // Performance Reward: Standard Execution
                    console.log("🏦 Initiating Execution Settlement...");
                    await settlePerformanceReward(
                        "Execution Hand",
                        data.intent,
                        data.payload,
                        data.erc8004 ? data.erc8004.reputation_score : 0,
                        seq
                    );
                }

            } catch (err) {
                console.error("❌ Error processing HCS message:", err.message);
            }
        });
}

startSociety().catch(console.error);