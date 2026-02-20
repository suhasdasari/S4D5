const { TokenAssociateTransaction, Client, PrivateKey } = require("@hashgraph/sdk");
require("dotenv").config();

async function associate() {
    const client = Client.forTestnet().setOperator(
        process.env.HEDERA_OPERATOR_ID, 
        process.env.HEDERA_OPERATOR_KEY
    );
    const tokenId = process.env.REWARD_TOKEN_ID;

    // We define the agents using the variable names in your .env
    const agents = [
        { name: "Strategist", id: process.env.STRATEGIST_ID, key: process.env.STRATEGIST_KEY },
        { name: "Risk Officer", id: process.env.RISK_ID, key: process.env.RISK_KEY }
    ];

    for (const agent of agents) {
        try {
            if (!agent.id || !agent.key) {
                console.log(`❌ Missing ID or Key for ${agent.name} in .env`);
                continue;
            }

            console.log(`🤝 Associating ${agent.name} (${agent.id}) with Token ${tokenId}...`);
            
            const transaction = await new TokenAssociateTransaction()
                .setAccountId(agent.id)
                .setTokenIds([tokenId])
                .freezeWith(client)
                .sign(PrivateKey.fromString(agent.key));

            const response = await transaction.execute(client);
            await response.getReceipt(client);
            console.log(`✅ ${agent.name} is now ready to earn S4D5 tokens!`);
        } catch (e) {
            if (e.message.includes("TOKEN_ALREADY_ASSOCIATED_TO_ACCOUNT")) {
                console.log(`✅ ${agent.name} was already associated.`);
            } else {
                console.log(`❌ ${agent.name} failed: ${e.message}`);
            }
        }
    }
}
associate();
