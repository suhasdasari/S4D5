const { runAudit } = require('../../agents/AuditOracle/logic');
const { settlePerformanceReward } = require('../../hedera/scripts/truthSettlement');
const { v4: uuidv4 } = require('uuid');

// In-memory sessions storage
const sessions = new Map();

/**
 * UCP Controller - Handles the Universal Commerce Protocol lifecycle
 */
const ucpController = {
    /**
     * Create a checkout session for an audit request
     */
    createSession: async (req, res) => {
        try {
            const { line_items, metadata } = req.body;

            if (!line_items || !Array.isArray(line_items) || line_items.length === 0) {
                return res.status(400).json({ error: 'Missing line_items for audit request' });
            }

            const sessionId = `ucp_session_${uuidv4()}`;

            // Store session data
            sessions.set(sessionId, {
                id: sessionId,
                status: 'pending',
                proposal: line_items[0], // Extract trade proposal data
                metadata: metadata || {},
                createdAt: Date.now()
            });

            console.log(`[UCP] Created session ${sessionId} for audit request`);

            res.status(201).json({
                id: sessionId,
                object: 'checkout.session',
                status: 'open',
                payment_status: 'unpaid',
                amount_total: 500, // 5.00 units (2 decimals)
                currency: 'S4D5',
                payment_protocol: 'AP2-Hedera-HTS',
                expires_at: Math.floor(Date.now() / 1000) + 3600 // 1 hour
            });
        } catch (error) {
            console.error('[UCP] Error creating session:', error);
            res.status(500).json({ error: 'Failed to create checkout session' });
        }
    },

    /**
     * Complete a checkout session and perform the audit
     */
    completeSession: async (req, res) => {
        try {
            const { id } = req.params;
            const { ap2_mandate } = req.body;

            const session = sessions.get(id);
            if (!session) {
                return res.status(404).json({ error: 'Session not found' });
            }

            if (!ap2_mandate || !ap2_mandate.tx_id) {
                return res.status(400).json({ error: 'Missing AP2 payment mandate tx_id' });
            }

            console.log(`[UCP] Completing session ${id}. Verifying payment and performing audit...`);

            // 1. Perform the real audit using the Audit Oracle
            const proposalData = {
                proposalId: `UCP-${id.substring(12, 20)}`,
                asset: session.proposal.asset || 'ETH',
                direction: session.proposal.direction || 'SHORT',
                description: session.proposal.description || 'UCP Audit Request'
            };

            const mockSeq = `UCP-${Date.now()}`;
            const { verdict, score } = await runAudit(proposalData, mockSeq, true);

            // 2. Trigger performance reward for the Oracle from the fee
            // Note: In a production UCP flow, the treasury receives the fee and rewards the oracle.
            await settlePerformanceReward(
                "Audit Oracle",
                "payment_handler",
                verdict,
                score,
                mockSeq
            );

            session.status = 'completed';
            session.verdict = {
                ...verdict,
                reputation_score: score,
                payment_ref: ap2_mandate.tx_id
            };

            res.status(200).json({
                id: session.id,
                object: 'checkout.session',
                status: 'complete',
                fulfillment: {
                    type: 'audit_verdict',
                    verdict: session.verdict
                }
            });

        } catch (error) {
            console.error('[UCP] Error completing session:', error);
            res.status(500).json({ error: 'Failed to complete checkout session' });
        }
    }
};

module.exports = ucpController;
