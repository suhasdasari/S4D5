const { TokenCreateTransaction, TokenType, TokenSupplyType, PrivateKey, Client } = require("@hashgraph/sdk");
require("dotenv").config();

async function createSocietyToken() {
    const client = Client.forTestnet().setOperator(
        process.env.ACCOUNT_ID,
        PrivateKey.fromString(process.env.PRIVATE_KEY)
    );

    const transaction = await new TokenCreateTransaction()
        .setTokenName("S4D5 Reward Token")
        .setTokenSymbol("S4D5")
        .setTokenType(TokenType.FungibleCommon)
        .setDecimals(2)
        .setInitialSupply(1000000) // 10,000.00 tokens
        .setTreasuryAccountId(process.env.ALPHA_STRATEGIST_ID)
        .setAdminKey(PrivateKey.fromString(process.env.PRIVATE_KEY))
        .setSupplyType(TokenSupplyType.Infinite)
        .freezeWith(client);

    // Sign with both the Operator and the Treasury (Strategist)
    const signTx = await transaction.sign(PrivateKey.fromString(process.env.PRIVATE_KEY));
    const response = await signTx.execute(client);
    const receipt = await response.getReceipt(client);

    console.log(`🪙 Society Token Created! ID: ${receipt.tokenId}`);
    console.log(`👉 ADD THIS TO .ENV: REWARD_TOKEN_ID=${receipt.tokenId}`);
}

createSocietyToken().catch(console.error);