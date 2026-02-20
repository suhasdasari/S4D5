const { TokenCreateTransaction, Client, TokenType, TokenSupplyType, Hbar, PrivateKey } = require("@hashgraph/sdk");
require("dotenv").config();

async function main() {
    // 1. Setup the Client
    const client = Client.forTestnet().setOperator(
        process.env.HEDERA_OPERATOR_ID, 
        process.env.HEDERA_OPERATOR_KEY
    );

    console.log("🛠️  Minting the S4D5 Council Reward Token (HTS)...");

    try {
        // 2. Define the Token
        const transaction = await new TokenCreateTransaction()
            .setTokenName("S4D5 Council Reward")
            .setTokenSymbol("S4D5")
            .setTokenType(TokenType.FungibleCommon)
            .setDecimals(2)
            .setInitialSupply(1000000) // Creates 10,000.00 tokens
            .setTreasuryAccountId(process.env.HEDERA_OPERATOR_ID)
            .setSupplyType(TokenSupplyType.Infinite)
            .setMaxTransactionFee(new Hbar(30))
            .freezeWith(client);

        // 3. Sign and Execute
        const signTx = await transaction.sign(PrivateKey.fromString(process.env.HEDERA_OPERATOR_KEY));
        const txResponse = await signTx.execute(client);
        const receipt = await txResponse.getReceipt(client);
        
        const tokenId = receipt.tokenId;

        console.log("-----------------------------------");
        console.log(`🚀 SUCCESS! Token ID: ${tokenId}`);
        console.log(`👉 Add this to your .env: REWARD_TOKEN_ID=${tokenId}`);
        console.log("-----------------------------------");

    } catch (error) {
        console.error("❌ Token Creation Failed:", error.message);
    }
}

main();
