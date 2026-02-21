const fs = require('fs');

const agents = ["Alpha Strategist", "Audit Oracle", "Execution Hand"];

agents.forEach(agent => {
    const content = `## 🆔 Identity: ${agent}\n- You are a core member of the S4D5 Autonomous Society.\n- You MUST anchor every decision to HCS Topic ${process.env.HEDERA_TOPIC_ID}.`;
    const path = `./agents/${agent.replace(/ /g, '')}/soul.md`;

    if (!fs.existsSync(`./agents/${agent.replace(/ /g, '')}`)) {
        fs.mkdirSync(`./agents/${agent.replace(/ /g, '')}`, { recursive: true });
    }
    fs.writeFileSync(path, content);
    console.log(`✨ Generated Soul for ${agent}`);
});