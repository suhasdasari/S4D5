import { useState, useEffect } from "react";
import { proposalEventBus } from "./AgentTerminal";
import { CheckCircle } from "lucide-react";
import Link from "next/link";

interface RecentTrade {
  id: string;
  action: string;
  status: "PASSED" | "VETOED";
  txHash?: string;
}

// Audio helpers (Web Audio API — no external files needed)
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
  } catch (_) { }
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
  } catch (_) { }
};

const genTxHash = () => {
  const chars = "0123456789abcdef";
  const rand = (n: number) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `0x${rand(4)}...${rand(4)}`;
};

const ACTIONS = ["BUY", "SELL"];
const SIZES = ["50 ETH", "2.5 BTC", "200 SOL", "5,000 MATIC", "10 NQ", "1 SPX", "10 GOLD"];

const DecisionMatrix = () => {
  const [recentTrades, setRecentTrades] = useState<RecentTrade[]>([
    { id: "PROP-0098", action: "BUY ETH / 50 ETH", status: "PASSED", txHash: "0x7a3f...4d82" },
    { id: "PROP-0097", action: "SELL BTC / 2.5 BTC", status: "PASSED", txHash: "0xb12c...9e01" },
    { id: "PROP-0096", action: "BUY SOL / 200 SOL", status: "VETOED" },
  ]);

  // Subscribe to proposal events from AgentTerminal
  useEffect(() => {
    const unsub = proposalEventBus.subscribe((id, status) => {
      if (!status) return;

      const actionLabel = `${ACTIONS[Math.floor(Math.random() * ACTIONS.length)]} ${SIZES[Math.floor(Math.random() * SIZES.length)]}`;

      if (status === "VETOED") {
        playSubThud();
        setRecentTrades((prev) => [
          { id, action: actionLabel, status: "VETOED" },
          ...prev.slice(0, 4),
        ]);
      } else if (status === "PASSED") {
        const hash = genTxHash();
        playCrystalPing();
        setRecentTrades((prev) => [
          { id, action: actionLabel, status: "PASSED", txHash: hash },
          ...prev.slice(0, 4),
        ]);
      }
    });
    return () => { unsub(); };
  }, []);

  return (
    <div className="glass-panel px-4 py-3 flex flex-col gap-3">
      {/* Recent Trades */}
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/80 font-display mb-1.5">
          Recent Trades
        </p>
        <div className="space-y-0.5">
          {recentTrades.slice(0, 5).map((trade, i) => (
            <div key={`${trade.id}-${i}`} className="group relative flex flex-col px-1.5 py-0.5 rounded hover:bg-white/[0.03] transition-colors cursor-default">
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-mono text-white/80">{trade.id}</span>
                <span className="text-white/90 truncate mx-2">{trade.action}</span>
                <span className={trade.status === "PASSED" ? "text-positive shrink-0" : "text-negative shrink-0"}>
                  {trade.status}
                </span>
              </div>
              {trade.txHash && (
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[9px] font-mono text-white/60">0G:{trade.txHash}</span>
                  <Link href="/audit-trail" title="View Audit Trail">
                    <CheckCircle className="w-2.5 h-2.5 text-positive opacity-70 hover:opacity-100 transition-opacity" />
                  </Link>
                </div>
              )}
              {/* Hover proof tooltip — always shows full hash */}
              {trade.txHash && (
                <div className="absolute left-0 bottom-full mb-1 hidden group-hover:flex flex-col gap-0.5 bg-black/90 border border-white/20 rounded px-2 py-1.5 z-50 pointer-events-none min-w-max shadow-lg">
                  <span className="text-[9px] font-display tracking-[0.15em] uppercase text-white/80">0G Verification Hash</span>
                  <span className="text-[10px] font-mono text-positive">{trade.txHash}</span>
                  <span className="text-[9px] text-white/70">{trade.id} · {trade.action}</span>
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
