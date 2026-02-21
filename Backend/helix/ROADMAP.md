# Helix / Alpha Strategist Roadmap

**Owner:** Suhas (Helix) + Alpha Strategist bot  
**Immediate Goal:** Deliver the control-room UI on Scaffold-ETH 2 and keep the strategist brain running while Nerve Cord integration is in progress.

## Workstreams

1. **Frontend Migration (critical, due ASAP)
   - [ ] Port existing Lovable UI components (TopBar, AgentTerminal, MarketWatch, etc.) into `scaffold-eth-2/packages/nextjs`.
   - [ ] Reconcile Tailwind + shadcn config between Vite app and Scaffold-ETH (tokens, fonts, global styles).
   - [ ] Re-create routing: `/` (control room) + `/audit-trail` placeholder page.
   - [ ] Validate with `yarn next:lint` + `yarn next:build`, then push + deploy to Vercel staging.

2. **Strategist Pipeline
   - [ ] Connect QuickNode Hyperliquid + Polymarket data fetchers.
<<<<<<< HEAD
   - [ ] Add Kite x402 handler for paid research bursts.
=======
   - [ ] Add Kite x402 handler for paid research bursts (respect $100 cap).
>>>>>>> Og_integration
   - [ ] Swap LLM calls to Bedrock Claude Sonnet 4.6 (Haiku fallback) via AWS creds.
   - [ ] Emit proposal JSON + audit log to shared queue (to be consumed by AuditOracle).

3. **Nerve Cord Prep
   - [ ] Study https://github.com/clawdbotatg/nerve-cord to understand how to bridge multiple OpenClaw agents without Telegram.
   - [ ] Define required message schema (proposal, veto, execution approval) so we can drop it in once the bridge is ready.

## Blockers / Needs

- Need Sonnet/Opus bedrock access (requested 2026-02-18).  
- Need ExecutionHand & AuditOracle status updates via their humans until Nerve Cord is wired.
