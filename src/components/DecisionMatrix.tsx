import { useState, useEffect } from "react";
import { proposalEventBus } from "./AgentTerminal";

interface StatusNode {
  label: string;
  key: string;
}

interface RecentTrade {
  id: string;
  action: string;
  asset: string;
  status: "PASSED" | "VETOED";
}

const NODES: StatusNode[] = [
  { label: "STRAT", key: "strat" },
  { label: "RISK", key: "risk" },
  { label: "COMP", key: "comp" },
  { label: "EXEC", key: "exec" },
];

const DecisionMatrix = () => {
  const [states, setStates] = useState<Record<string, boolean>>({
    strat: true,
    risk: true,
    comp: true,
    exec: false,
  });
  const [activeProposal, setActiveProposal] = useState<string>("PROP-0100");
  const [flashStatus, setFlashStatus] = useState<{ text: string; type: "PASSED" | "VETOED" } | null>(null);
  const [recentTrades, setRecentTrades] = useState<RecentTrade[]>([
    { id: "PROP-0098", action: "BUY ETH", asset: "50 ETH", status: "PASSED" },
    { id: "PROP-0097", action: "SELL BTC", asset: "2.5 BTC", status: "PASSED" },
    { id: "PROP-0096", action: "BUY SOL", asset: "200 SOL", status: "VETOED" },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setStates((prev) => {
        const keys = Object.keys(prev);
        const randomKey = keys[Math.floor(Math.random() * keys.length)];
        return { ...prev, [randomKey]: Math.random() > 0.3 };
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const unsub = proposalEventBus.subscribe((id, status) => {
      setActiveProposal(id);
      if (status) {
        setFlashStatus({ text: status, type: status });
        // Add to recent trades
        const assets = ["ETH", "BTC", "SOL", "MATIC", "NQ"];
        const actions = ["BUY", "SELL"];
        setRecentTrades((prev) => [
          {
            id,
            action: `${actions[Math.floor(Math.random() * actions.length)]} ${assets[Math.floor(Math.random() * assets.length)]}`,
            asset: `${(Math.random() * 100).toFixed(1)}`,
            status,
          },
          ...prev.slice(0, 4),
        ]);
        setTimeout(() => setFlashStatus(null), 2000);
      }
    });
    return unsub;
  }, []);

  return (
    <div className="glass-panel px-4 py-3 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-display">
          Consensus State
        </p>
        <span className="text-[10px] font-mono text-foreground/60">{activeProposal}</span>
      </div>

      <div className="flex items-center justify-between gap-2">
        {NODES.map((node) => {
          const approved = states[node.key];
          return (
            <div key={node.key} className="flex flex-col items-center gap-1.5">
              <div
                className={`w-3 h-3 rounded-full transition-all duration-500 ${
                  approved
                    ? "bg-positive shadow-[0_0_8px_hsl(120_100%_50%/0.6)]"
                    : "bg-negative shadow-[0_0_8px_hsl(0_100%_50%/0.6)]"
                }`}
              />
              <span className="text-[10px] font-display tracking-wider text-muted-foreground">
                [{node.label}]
              </span>
            </div>
          );
        })}
      </div>

      {/* Flash status */}
      {flashStatus && (
        <div
          className={`text-center text-[11px] font-display tracking-[0.3em] uppercase font-bold py-1 rounded-sm ${
            flashStatus.type === "PASSED"
              ? "text-positive bg-positive/10"
              : "text-negative bg-negative/10"
          }`}
        >
          {flashStatus.text}
        </div>
      )}

      {/* Recent Trades mini-table */}
      <div>
        <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-display mb-1.5">
          Recent Trades
        </p>
        <div className="space-y-0.5">
          {recentTrades.slice(0, 4).map((trade, i) => (
            <div key={`${trade.id}-${i}`} className="flex items-center justify-between text-[10px] px-1.5 py-0.5 rounded hover:bg-foreground/[0.03] transition-colors">
              <span className="font-mono text-muted-foreground">{trade.id}</span>
              <span className="text-foreground/70">{trade.action}</span>
              <span
                className={
                  trade.status === "PASSED" ? "text-positive" : "text-negative"
                }
              >
                {trade.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DecisionMatrix;
