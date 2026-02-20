# ExecutionHand Roadmap

**Owner:** Karthik + ExecutionHand bot  
**Mission:** Own wallets, Hedera/ADI plumbing, and deployment pipelines while Helix/AuditOracle finalize strategist + risk components.

## Workstreams

1. **Infra & Wallets**
   - [ ] Provision separate Hedera accounts (Strategist, Risk, Compliance, Execution) + record IDs in `wallets/` with encrypted storage.
   - [ ] Spin up ADI/Lighter testnet access + QuickNode endpoints as needed.
   - [ ] Install Hedera SDK + Hedera Agent Kit; verify Schedule Service calls from CLI.

2. **Execution Agent v1**
   - [ ] Build a service that waits for: (a) Risk approval signature + (b) Compliance hash, then schedules trades via Hedera Schedule Service.
   - [ ] Mock light vault (ERC-4626) on ADI chain for end-to-end tests.
   - [ ] Emit execution receipts (tx hash, schedule ID) back to strategist UI.

3. **Deployment Pipeline**
   - [ ] Set up Vercel project pointing to `scaffold-eth-2/packages/nextjs` (create staging + prod envs).
   - [ ] Maintain `.env.vault` template with RPC URLs, Hedera creds, etc.
   - [ ] Document deploy commands (`yarn deploy` script) and add to repo.

4. **Nerve Cord Prep**
   - [ ] Read https://github.com/clawdbotatg/nerve-cord and outline how ExecutionHand will subscribe to approvals from AuditOracle.
   - [ ] Prepare message handlers / adapters so we can drop them in once integration is green.

## Blockers / Needs

- Needs strategist front-end deployed to Vercel (pending Helix commit).
- Needs Risk + Compliance schemas finalized to know which signatures/hashes to expect.
- Requires AWS budget tracking to ensure Bedrock + QuickNode spend stays < $100 unless updated.
