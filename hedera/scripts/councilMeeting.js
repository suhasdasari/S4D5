const { TransferTransaction, Hbar } = require("@hashgraph/sdk");
require("dotenv").config();

async function payoutAgents(winnerName) {
    // Standardized payout map
    const payoutMap = {
        "Alpha Strategist": process.env.ALPHA_STRATEGIST_ID,
        "Audit Oracle": process.env.AUDIT_ORACLE_ID,
        "Execution Hand": process.env.EXECUTION_HAND_ID
    };

    console.log(`💰 Paying Hbar reward to ${winnerName}...`);
    // Logic for TransferTransaction goes here using payoutMap[winnerName]
}