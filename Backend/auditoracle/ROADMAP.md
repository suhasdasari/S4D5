# AuditOracle Roadmap

**Owner:** Susmitha + AuditOracle bot  
**Mission:** Stand up the Risk Officer + Compliance Scribe stack while Helix finishes the frontend migration. Keep everything self-contained in this directory until Nerve Cord connects the bots.

## Deliverables (pre–Nerve Cord)

1. **Risk Engine v1**
   - [ ] Define rule set (max slippage 2%, exposure caps, correlation alerts, event risk rules).
   - [ ] Implement Python service that ingests Strategist proposal JSON and returns approve/veto + risk score.
   - [ ] Include structured reasoning output (for 0g log + UI display).

2. **Compliance Scribe v1**
   - [ ] Format the Strategist↔Risk debate as a JSON transcript.
   - [ ] Upload transcript hashes to 0g Labs storage + store CID/URI locally.
   - [ ] Submit Hedera HCS attestation referencing the transcript hash and proposal ID.

3. **Interfaces for later wiring**
   - [ ] Document expected input/output schema (share in `API.md`).
   - [ ] Provide CLI stubs so we can hand-call the services before Nerve Cord is online.

## Immediate Tasks

- [ ] Create `services/risk_engine.py` and `services/compliance_logger.py` with mocked data flows.
- [ ] Add `.env.example` noting required secrets (0g endpoint, Hedera account).
- [ ] Coordinate with ExecutionHand on Hedera account provisioning.

## Blockers / Dependencies

- Needs read-only access to Strategist proposal JSON format.  
- Requires Hedera account IDs + private keys from ExecutionHand for attestation.  
- Waiting on Nerve Cord integration for automated message passing; until then, run scripts manually.
