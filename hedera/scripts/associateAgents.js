const { TokenAssociateTransaction, PrivateKey, Client } = require("@hashgraph/sdk");
require("dotenv").config();

async function associateAgents() {
    const client = Client.forTestnet().setOperator(
        process.env.ACCOUNT_ID,
        PrivateKey.fromString(process.env.PRIVATE_KEY)
    );

    const tokenId = process.env.REWARD_TOKEN_ID;
    const agents = [
        { name: "Audit Oracle", id: process.env.AUDIT_ORACLE_ID, key: process.env.AUDIT_ORACLE_KEY },
        { name: "Execution Hand", id: process.env.EXECUTION_HAND_ID, key: process.env.EXECUTION_HAND_KEY }
    ];

    for (const agent of agents) {
        console.log(`🔗 Associating ${agent.name} with Token ${tokenId}...`);

        const transaction = await new TokenAssociateTransaction()
            .setAccountId(agent.id)
            .setTokenIds([tokenId])
            .freezeWith(client);

        // The Agent must sign the association themselves
        const signTx = await transaction.sign(PrivateKey.fromString(agent.key));
        const response = await signTx.execute(client);
        await response.getReceipt(client);

        console.log(`✅ ${agent.name} is now associated.`);
    }
}

associateAgents().catch(console.error);