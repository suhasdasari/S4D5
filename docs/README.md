# S4D5 AI Hedge Fund - Documentation

Complete documentation for the S4D5 autonomous trading system.

## Quick Links

### Getting Started
- [Architecture Overview](./01-architecture.md) - System design and components
- [Quick Start Guide](./02-quick-start.md) - Get up and running in 10 minutes
- [Environment Setup](./03-environment-setup.md) - Configuration and prerequisites

### Components
- [Alpha Strategist](./04-alpha-strategist.md) - Trading strategy bot
- [AuditOracle](./05-audit-oracle.md) - Risk management bot
- [ExecutionHand](./06-execution-hand.md) - Trade execution bot
- [Nerve-Cord](./07-nerve-cord.md) - Message broker

### Infrastructure
- [QuickNode Streams](./08-quicknode-streams.md) - Real-time blockchain data
- [Railway Webhook](./09-railway-webhook.md) - Data aggregation service
- [Kite AI Payments](./10-kite-payments.md) - x402 micropayments

### Deployment
- [EC2 Deployment](./11-ec2-deployment.md) - Production deployment guide
- [OpenClaw Setup](./12-openclaw-setup.md) - Bot framework configuration
- [Troubleshooting](./13-troubleshooting.md) - Common issues and solutions

## System Flow

```
QuickNode Streams → Railway Webhook → Alpha Strategist (OpenClaw)
                                            ↓
                                       Nerve-Cord
                                            ↓
                                      AuditOracle (OpenClaw)
                                            ↓
                                       Nerve-Cord
                                            ↓
                                     ExecutionHand (OpenClaw)
```

## Tech Stack

- **Bot Framework**: OpenClaw
- **Runtime**: Node.js
- **Blockchain**: Ethereum, Base, Polygon
- **Payments**: Kite AI (x402 protocol)
- **Data**: QuickNode Streams
- **Messaging**: Nerve-Cord (custom protocol)
- **Frontend**: Next.js + Scaffold-ETH 2

## Repository Structure

```
S4D5/
├── docs/                    # Documentation (you are here)
├── Backend/
│   ├── helix/
│   │   └── alpha-strategist.skill/  # Alpha Strategist bot
│   ├── auditoracle/         # AuditOracle bot
│   └── executionhand/       # ExecutionHand bot
├── nerve-cord/              # Message broker
├── quicknode-webhook/       # Data aggregation
└── scaffold-eth-2/          # Frontend dashboard
```

## Support

For issues or questions:
1. Check [Troubleshooting Guide](./13-troubleshooting.md)
2. Review component-specific docs
3. Check GitHub issues

---

**Last Updated**: 2026-02-21
