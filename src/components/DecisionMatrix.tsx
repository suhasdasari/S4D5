import { useState, useEffect, useRef } from "react";
import { proposalEventBus } from "./AgentTerminal";
import { CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

// 4-node strict sequence: STR → RSK → COM → EXE
const NODES = [
  { label: "STR", key: "strat" },
  { label: "RSK", key: "risk" },
  { label: "COM",  key: "comp" },
  { label: "EXE",  key: "exec" },
];

type NodeState = "grey" | "green" | "red";

interface RecentTrade {
  id: string;
  action: string;
  status: "PASSED" | "VETOED";
  txHash?: string;
}

// Audio helpers (Web Audio API)
let audioCtx: AudioContext | null = null;
const getAudioCtx = () => {
  if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  return audioCtx;
};

const playSubThud = () => {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(60, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.35);
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.35);
  } catch (_) {}
};

const playCrystalPing = () => {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(1800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(2400, ctx.currentTime + 0.05);
    osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.3);
  } catch (_) {}
};

// Generate fake 0G Labs tx hash
const genTxHash = () => {
  const chars = "0123456789abcdef";
  const rand = (n: number) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `0x${rand(4)}...${rand(4)}`;
};

const DecisionMatrix = () => {
  const initialStates: Record<string, NodeState> = { strat: "grey", risk: "grey", comp: "grey", exec: "grey" };
  const [states, setStates] = useState<Record<string, NodeState>>(initialStates);
  const [activeProposal, setActiveProposal] = useState<string>("PROP-0100");
  const [flashStatus, setFlashStatus] = useState<{ text: string; type: "PASSED" | "VETOED" } | null>(null);
  const [recentTrades, setRecentTrades] = useState<RecentTrade[]>([
    { id: "PROP-0098", action: "BUY ETH / 50 ETH", status: "PASSED", txHash: "0x7a3f...4d82" },
    { id: "PROP-0097", action: "SELL BTC / 2.5 BTC", status: "PASSED", txHash: "0xb12c...9e01" },
    { id: "PROP-0096", action: "BUY SOL / 200 SOL", status: "VETOED" },
  ]);

  // Sequential lighting animation ref
  const seqTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearSeqTimer = () => {
    if (seqTimerRef.current) clearTimeout(seqTimerRef.current);
  };

  // Run a sequential light-up animation
  const runSequence = (propId: string, vetoAt: number | null) => {
    const keys = ["strat", "risk", "comp", "exec"];
    setStates({ strat: "grey", risk: "grey", comp: "grey", exec: "grey" });

    keys.forEach((key, idx) => {
      seqTimerRef.current = setTimeout(() => {
        if (vetoAt !== null && idx >= vetoAt) {
          // This node and all subsequent turn red
          setStates((prev) => {
            const next = { ...prev };
            for (let i = idx; i < keys.length; i++) next[keys[i]] = "red";
            return next;
          });

          if (idx === vetoAt) {
            // Only fire at the veto node
            setFlashStatus({ text: `${propId}: VETOED`, type: "VETOED" });
            playSubThud();
            setTimeout(() => setFlashStatus(null), 2500);

            const assets = ["ETH", "BTC", "SOL", "MATIC", "NQ"];
            const actions = ["BUY", "SELL"];
            setRecentTrades((prev) => [
              {
                id: propId,
                action: `${actions[Math.floor(Math.random() * actions.length)]} ${assets[Math.floor(Math.random() * assets.length)]}`,
                status: "VETOED",
              },
              ...prev.slice(0, 4),
            ]);
          }
        } else {
          setStates((prev) => ({ ...prev, [key]: "green" }));

          // All green → PASSED
          if (idx === keys.length - 1) {
            const hash = genTxHash();
            setFlashStatus({ text: `${propId}: PASSED`, type: "PASSED" });
            playCrystalPing();
            setTimeout(() => setFlashStatus(null), 2500);

            const assets = ["ETH", "BTC", "SOL", "MATIC", "NQ"];
            const actions = ["BUY", "SELL"];
            setRecentTrades((prev) => [
              {
                id: propId,
                action: `${actions[Math.floor(Math.random() * actions.length)]} ${assets[Math.floor(Math.random() * assets.length)]}`,
                status: "PASSED",
                txHash: hash,
              },
              ...prev.slice(0, 4),
            ]);
          }
        }
      }, idx * 600);
    });
  };

  // Subscribe to proposal events from AgentTerminal
  useEffect(() => {
    const unsub = proposalEventBus.subscribe((id, status) => {
      setActiveProposal(id);
      clearSeqTimer();

      if (!status) {
        // New proposal opening — just reset lights
        setStates({ strat: "grey", risk: "grey", comp: "grey", exec: "grey" });
        return;
      }

      // Determine veto position randomly for demo realism
      const vetoAt = status === "VETOED" ? Math.floor(Math.random() * 4) : null;
      runSequence(id, vetoAt);
    });
    return () => { unsub(); clearSeqTimer(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dotColor = (state: NodeState) => {
    if (state === "green") return "bg-positive shadow-[0_0_8px_hsl(120_100%_50%/0.7)]";
    if (state === "red")   return "bg-negative shadow-[0_0_8px_hsl(0_100%_50%/0.7)]";
    return "bg-foreground/20";
  };

  return (
    <div className="glass-panel px-4 py-3 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-display">
          Consensus State
        </p>
        <span className="text-[10px] font-mono text-foreground/60">ACTIVE: {activeProposal}</span>
      </div>

      {/* Sequential lights */}
      <div className="flex items-center gap-1">
        {NODES.map((node, idx) => (
          <div key={node.key} className="flex flex-col items-center gap-1.5 flex-1">
            <div className={`w-3 h-3 rounded-full transition-all duration-400 ${dotColor(states[node.key])}`} />
            <span className="text-[9px] font-display tracking-wider text-muted-foreground">[{node.label}]</span>
          </div>
        ))}
        {/* Arrow connectors */}
      </div>

      {/* Flash status */}
      {flashStatus && (
        <div
          className={`text-center text-[11px] font-display tracking-[0.25em] uppercase font-bold py-1 rounded-sm animate-fade-in ${
            flashStatus.type === "PASSED"
              ? "text-positive bg-positive/10 border border-positive/20"
              : "text-negative bg-negative/10 border border-negative/20"
          }`}
        >
          ▶ {flashStatus.text}
        </div>
      )}

      {/* Recent Trades */}
      <div>
        <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-display mb-1.5">
          Recent Trades
        </p>
        <div className="space-y-0.5">
          {recentTrades.slice(0, 4).map((trade, i) => (
            <div key={`${trade.id}-${i}`} className="flex flex-col px-1.5 py-0.5 rounded hover:bg-foreground/[0.03] transition-colors">
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-mono text-muted-foreground">{trade.id}</span>
                <span className="text-foreground/70 truncate mx-2">{trade.action}</span>
                <span className={trade.status === "PASSED" ? "text-positive shrink-0" : "text-negative shrink-0"}>
                  {trade.status}
                </span>
              </div>
              {trade.txHash && (
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[9px] font-mono text-muted-foreground/60">0G:{trade.txHash}</span>
                  <Link to="/audit-trail" title="View Audit Trail">
                    <CheckCircle className="w-2.5 h-2.5 text-positive opacity-70 hover:opacity-100 transition-opacity" />
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DecisionMatrix;
