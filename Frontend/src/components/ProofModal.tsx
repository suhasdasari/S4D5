import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface ProofModalProps {
  tradeId: string | null;
  onClose: () => void;
}

const generateAuditTrail = (tradeId: string) => ({
  trade_id: tradeId,
  timestamp: new Date().toISOString(),
  storage: "0G Labs Decentralized Storage",
  chain_proof: {
    block: 18442107,
    hash: "0x7a3f...e91d",
    network: "0G Testnet",
  },
  agent_reasoning: {
    alpha_strategist: {
      signal: "MOMENTUM_DIVERGENCE",
      confidence: 0.873,
      decision: "INITIATE",
    },
    risk_officer: {
      var_check: "PASS",
      drawdown_risk: 0.017,
      decision: "APPROVE",
    },
    compliance_scribe: {
      kyc_status: "CLEAN",
      regulatory_flags: 0,
      decision: "APPROVE",
    },
    executioner: {
      slippage: 0.0002,
      fill_rate: 1.0,
      decision: "EXECUTED",
    },
  },
  verification: "IMMUTABLE",
});

const ProofModal = ({ tradeId, onClose }: ProofModalProps) => {
  if (!tradeId) return null;

  const trail = generateAuditTrail(tradeId);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="glass-panel w-full max-w-lg mx-4 max-h-[80vh] flex flex-col"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-foreground/5">
            <h3 className="font-display text-xs tracking-[0.3em] uppercase text-foreground">
              Proof of Reason — {tradeId}
            </h3>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 terminal-scrollbar">
            <pre className="text-[11px] text-foreground/80 leading-relaxed whitespace-pre-wrap font-mono">
              {JSON.stringify(trail, null, 2)}
            </pre>
          </div>
          <div className="px-4 py-2 border-t border-foreground/5 text-[10px] text-muted-foreground">
            Stored on 0G Labs decentralized infrastructure · Immutable audit trail
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ProofModal;
