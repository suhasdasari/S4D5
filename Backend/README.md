# Backend Workspace (Rebooted)

This folder now tracks the three-agent council for the ETHDenver hedge fund build. Each subdirectory is owned by a specific operator + clawbot:

| Directory        | Human + Bot            | Focus                                                         |
|------------------|------------------------|---------------------------------------------------------------|
| `helix/`         | Suhas + Alpha Strategist| Frontend migration to Scaffold-ETH 2, strategist brain, orchestration|
| `auditoracle/`   | Susmitha + AuditOracle | Risk engine, compliance scribe, 0g + Hedera attestation flows |
| `executionhand/` | Karthik + ExecutionHand| Hedera/ADI execution stack, wallets, infra, Vercel deployment |

Each folder contains a living `ROADMAP.md` to capture tasks until the Nerve Cord bridge is online. Update them as you ship.

## CDP Wallet Infrastructure

The bots now support Coinbase Developer Platform (CDP) wallets for autonomous x402 micropayments on Base network.

### Quick Setup

1. **Install AgentKit on all bots:**
   ```bash
   cd Backend
   ./install-agentkit.sh
   ```

2. **Configure environment variables** in `.env`:
   ```bash
   CDP_API_KEY_NAME=your_api_key_name
   CDP_API_KEY_PRIVATE_KEY=your_private_key
   NETWORK_ID=base-mainnet
   ```

3. **Initialize wallets:**
   ```bash
   cd helix/alpha-strategist.skill && npm run init-wallet
   cd ../../auditoracle && npm run init-wallet
   cd ../executionhand && npm run init-wallet
   ```

For detailed instructions, see [CDP-WALLET-SETUP.md](./CDP-WALLET-SETUP.md).

### Bot Wallet Addresses

After initialization, wallet addresses are saved in each bot's `config/wallet.json`:
- Alpha Strategist: `helix/alpha-strategist.skill/config/wallet.json`
- AuditOracle: `auditoracle/config/wallet.json`
- ExecutionHand: `executionhand/config/wallet.json`