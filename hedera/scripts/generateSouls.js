const { Client, PrivateKey, AccountCreateTransaction, Hbar } = require("@hashgraph/sdk");
require("dotenv").config();

async function createAgent(client, agentName) {
    const newKey = PrivateKey.generateED25519();
    const transaction = new AccountCreateTransaction()
        .setKey(newKey.publicKey)
        .setInitialBalance(new Hbar(10))
        .execute(client);

    const receipt = await (await transaction).getReceipt(client);
    console.log(`--- ${agentName} Soul Created ---`);
    console.log(`Account ID: ${receipt.accountId}`);
    console.log(`Private Key: ${newKey.toString()}`);
    console.log(`Public Key: ${newKey.publicKey.toString()}\n`);
}

async function main() {
    if (!process.env.HEDERA_OPERATOR_ID || !process.env.HEDERA_OPERATOR_KEY) {
        console.error("Error: Please set HEDERA_OPERATOR_ID and HEDERA_OPERATOR_KEY in your .env file.");
        return;
    }
    const client = Client.forTestnet().setOperator(process.env.HEDERA_OPERATOR_ID, process.env.HEDERA_OPERATOR_KEY);
    await createAgent(client, "Alpha Strategist");
    await createAgent(client, "Risk Officer");
    await createAgent(client, "Executioner");
}
main();
