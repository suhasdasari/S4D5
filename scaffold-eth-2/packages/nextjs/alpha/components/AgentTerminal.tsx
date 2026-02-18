import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

interface LogEntry {
  agent: string;
  colorClass: string;
  message: string;
  timestamp: string;
  glowType?: "positive" | "negative" | null;
  proposalId: string;
  txHash?: string;
}

const AGENTS = [
  { name: "ALPHA STRATEGIST", colorClass: "text-foreground", prefix: "α" },
  { name: "RISK OFFICER",     colorClass: "dynamic",          prefix: "Ω" },
  { name: "COMPLIANCE SCRIBE",colorClass: "text-silver",      prefix: "§" },
  { name: "EXECUTIONER",      colorClass: "dynamic",          prefix: "✕" },
];

// Strictly technical — zero geographic clichés
const MESSAGES: (string | { text: string; approved: boolean })[][] = [
  // STR — Alpha Strategist: pure signal & quant logic
  [
    "Momentum divergence detected in BTC/ETH ratio — initiating rebalance protocol.",
    "Long bias confirmed on NQ futures. Probability score: 87.3%.",
    "Signal lock on Vol Surface — IV crush incoming T+2. Gamma scalp initiated.",
    "Delta-neutral SPX 0DTE structure deployed. Theta burn rate acceptable.",
    "Order-flow imbalance on ES_F: 3.4:1 bid-to-ask ratio. Positioning long.",
    "Mean-reversion signal on EURUSD — Bollinger band breach at 2.7σ.",
    "Cross-asset correlation shift detected. Risk-parity rebalance queued.",
    "VWAP deviation on BTC/USD exceeds 1.8σ. Statistical arbitrage window open.",
    "Yield curve inversion signal confirmed. Duration risk elevated — hedge initiated.",
    "Options flow imbalance: 4.2:1 put/call on SPX 30-day expiry. Contrarian long bias.",
  ],
  // RSK — Risk Officer: portfolio risk analysis
  [
    { text: "Portfolio VaR within tolerance: 2.1σ. APPROVED.", approved: true },
    { text: "Tail risk monitor: Black Swan probability 0.03%. APPROVED.", approved: true },
    { text: "Correlation matrix: crypto-equity decorrelation triggers rebalance. VETOED.", approved: false },
    { text: "Drawdown threshold breach detected on ETH position. Trade REJECTED.", approved: false },
    { text: "Max drawdown within 4.8% boundary. Position size: APPROVED.", approved: true },
    { text: "Sharpe ratio degradation beyond threshold. VETOED.", approved: false },
    { text: "Beta-adjusted exposure within mandate limits. APPROVED.", approved: true },
    { text: "Liquidity stress test passed at 3σ shock scenario. APPROVED.", approved: true },
    { text: "Greeks exposure: net delta 0.12, vega within band. APPROVED.", approved: true },
    { text: "Counterparty exposure limit exceeded on prime broker. VETOED.", approved: false },
  ],
  // COM — Compliance Scribe: regulatory & audit
  [
    "SEC Form ADV filing updated. Status: ACCEPTED.",
    "KYC/AML sweep complete. 0 flags raised. All wallets verified clean.",
    "Regulatory pulse: EU MiCA compliance updated to v2.7. No action required.",
    "Audit trail hash committed to 0G chain. Block confirmed.",
    "AML screening: counterparty risk score 0.02. ACCEPTED.",
    "FATF Travel Rule compliance verified on cross-chain settlement.",
    "FINRA best-execution obligation verified. Spread within mandate threshold.",
    "CFTC position limit compliance confirmed. Notional within allocated band.",
    "On-chain wallet sanction screening: OFAC clear. ACCEPTED.",
    "MiFID II transaction reporting submitted. Acknowledgement: RECEIVED.",
  ],
  // EXE — Executioner: order routing & settlement
  [
    { text: "Market order: SELL 150 ETH @ $3,847.22. EXECUTED.", approved: true },
    { text: "Limit order queued: BUY 10,000 MATIC @ $0.89. APPROVED.", approved: true },
    { text: "Slippage report: 0.02% on last 50 trades. EXECUTED.", approved: true },
    { text: "Cross-chain settlement REJECTED. Insufficient liquidity at target price.", approved: false },
    { text: "TWAP execution complete: BUY 500 SOL over 4H. EXECUTED.", approved: true },
    { text: "Smart order router: routed via 3 venues. EXECUTED.", approved: true },
    { text: "DMA fill: SELL 25 BTC @ $104,720 — zero slippage. EXECUTED.", approved: true },
    { text: "Block trade: BUY 1,000 ETH via dark pool. EXECUTED.", approved: true },
    { text: "Partial fill detected: 72% of SOL order. REJECTED — requeuing.", approved: false },
    { text: "VWAP order complete: SELL 500 NQ over 2H. EXECUTED.", approved: true },
  ],
];

// Export for globe pulse events
export const tradeEventBus = {
  listeners: [] as ((type: "positive" | "negative") => void)[],
  emit(type: "positive" | "negative") {
    this.listeners.forEach((fn) => fn(type));
  },
  subscribe(fn: (type: "positive" | "negative") => void) {
    this.listeners.push(fn);
    return () => { this.listeners = this.listeners.filter((l) => l !== fn); };
  },
};

// Proposal ID counter + event bus
let proposalCounter = 100;
export const proposalEventBus = {
  listeners: [] as ((id: string, status: "PASSED" | "VETOED" | null) => void)[],
  emit(id: string, status: "PASSED" | "VETOED" | null) {
    this.listeners.forEach((fn) => fn(id, status));
  },
  subscribe(fn: (id: string, status: "PASSED" | "VETOED" | null) => void) {
    this.listeners.push(fn);
    return () => { this.listeners = this.listeners.filter((l) => l !== fn); };
  },
};

export const getNextProposalId = () => {
  proposalCounter++;
  return `PROP-${String(proposalCounter).padStart(4, "0")}`;
};

const getGlowType = (message: string): "positive" | "negative" | null => {
  if (/VETOED|REJECTED/i.test(message)) return "negative";
  if (/EXECUTED|APPROVED/i.test(message)) return "positive";
  return null;
};

// Generate a fake 0G Labs tx hash
const genTxHash = () => {
  const chars = "0123456789abcdef";
  const start = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  const end   = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `0x${start}...${end}`;
};

// Audio context
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

const AgentTerminal = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const createEntry = useCallback((agentIdx: number, msgIdx: number, time: Date): LogEntry => {
    const agent = AGENTS[agentIdx];
    const rawMsg = MESSAGES[agentIdx][msgIdx];
    const propId = getNextProposalId();
    let message: string;
    let colorClass: string;

    if (typeof rawMsg === "string") {
      message = rawMsg;
      colorClass = agent.colorClass;
    } else {
      message = rawMsg.text;
      colorClass = rawMsg.approved ? "text-positive" : "text-negative";
    }

    const fullMessage = `[${propId}] [${agent.prefix}] ${message}`;
    const glowType = getGlowType(fullMessage);

    if (glowType) tradeEventBus.emit(glowType);

    const proposalStatus = glowType === "positive" ? "PASSED" as const : glowType === "negative" ? "VETOED" as const : null;
    proposalEventBus.emit(propId, proposalStatus);

    // Audio: fire only on final EXE result
    if (agentIdx === 3) {
      if (/VETOED|REJECTED/i.test(fullMessage)) playSubThud();
      else if (/EXECUTED/i.test(fullMessage)) playCrystalPing();
    }

    // 0G Hash attached to EXECUTED messages
    const txHash = /EXECUTED/i.test(fullMessage) ? genTxHash() : undefined;

    return {
      agent: agent.name,
      colorClass,
      message: fullMessage,
      timestamp: time.toLocaleTimeString("en-US", { hour12: false }),
      glowType,
      proposalId: propId,
      txHash,
    };
  }, []);

  useEffect(() => {
    // Seed with standby entry first, then real entries
    const standby: LogEntry = {
      agent: "S4D5",
      colorClass: "text-muted-foreground",
      message: "[S4D5] STANDBY: SCANNING GLOBAL LIQUIDITY...",
      timestamp: new Date(Date.now() - 9000).toLocaleTimeString("en-US", { hour12: false }),
      glowType: null,
      proposalId: "INIT",
    };

    const initial: LogEntry[] = [standby];
    for (let i = 0; i < 7; i++) {
      const agentIdx = i % 4;
      const msgIdx = Math.floor(Math.random() * MESSAGES[agentIdx].length);
      initial.push(createEntry(agentIdx, msgIdx, new Date(Date.now() - (7 - i) * 3000)));
    }
    setLogs(initial);

    const interval = setInterval(() => {
      const agentIdx = Math.floor(Math.random() * 4);
      const msgIdx = Math.floor(Math.random() * MESSAGES[agentIdx].length);
      setLogs((prev) => [...prev.slice(-19), createEntry(agentIdx, msgIdx, new Date())]);
    }, 2500);

    return () => clearInterval(interval);
  }, [createEntry]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="glass-panel flex flex-col scanline overflow-hidden" style={{ height: "100%" }}>
      <div className="px-4 py-3 border-b border-foreground/5 flex items-center gap-2 shrink-0">
        <div className="w-2 h-2 rounded-full bg-foreground animate-pulse-glow" />
        <h3 className="font-display text-xs tracking-[0.3em] uppercase text-foreground">
          Agent Council
        </h3>
      </div>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 space-y-2 terminal-scrollbar"
      >
        {logs.map((log, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className={`text-[11px] leading-relaxed ${
              log.glowType === "negative"
                ? "glow-negative"
                : log.glowType === "positive"
                ? "glow-positive"
                : ""
            }`}
          >
            <span className="text-muted-foreground">{log.timestamp}</span>{" "}
            <span className={log.glowType ? "" : log.colorClass}>[{log.agent}]</span>{" "}
            <span className={log.glowType ? "" : "text-foreground/70"}>{log.message}</span>
            {log.txHash && (
              <span
                className="ml-2 text-[9px] font-mono"
                style={{ color: "hsl(0 0% 50%)", letterSpacing: "0.05em" }}
              >
                ↳ 0G:{log.txHash}
              </span>
            )}
          </motion.div>
        ))}
      </div>
      <div className="px-4 py-2 border-t border-foreground/5 shrink-0">
        <Link
          to="/audit-trail"
          className="text-[10px] font-display tracking-[0.2em] uppercase text-silver hover:text-foreground transition-colors"
        >
          [ VIEW FULL AUDIT TRAIL ]
        </Link>
      </div>
    </div>
  );
};

export default AgentTerminal;
