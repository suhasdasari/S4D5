import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

interface LogEntry {
  agent: string;
  colorClass: string;
  message: string;
  timestamp: string;
}

const AGENTS = [
  { name: "ALPHA STRATEGIST", colorClass: "text-foreground", prefix: "α" },
  { name: "RISK OFFICER", colorClass: "dynamic", prefix: "Ω" },
  { name: "COMPLIANCE SCRIBE", colorClass: "text-silver", prefix: "§" },
  { name: "EXECUTIONER", colorClass: "dynamic", prefix: "✕" },
];

const MESSAGES = [
  [
    "Identified momentum divergence in BTC/ETH ratio. Initiating rebalance protocol.",
    "Long bias confirmed on NQ futures. Probability score: 87.3%.",
    "Signal lock acquired on Vol Surface — IV crush incoming T+2.",
    "Deploying gamma scalp on SPX 0DTE. Delta-neutral confirmed.",
  ],
  [
    { text: "Portfolio VaR within tolerance: 2.1σ. No breach detected.", approved: true },
    { text: "Tail risk monitor: Black Swan probability at 0.03%. Status GREEN.", approved: true },
    { text: "Correlation matrix update — crypto-equity decorrelation detected. CAUTION.", approved: false },
    { text: "Drawdown threshold: 4.2% of NAV. Current: 1.7%. CLEAR.", approved: true },
  ],
  [
    "SEC Form ADV filed. Status: ACCEPTED.",
    "KYC/AML sweep complete. 0 flags raised. All wallets clean.",
    "Regulatory pulse: EU MiCA compliance updated to v2.7.",
    "Audit trail hash committed to chain. Block #18,442,107.",
  ],
  [
    { text: "Market order: SELL 150 ETH @ $3,847.22. Fill: 100%.", approved: true },
    { text: "Limit order queued: BUY 10,000 MATIC @ $0.89. Expiry: 4h.", approved: true },
    { text: "Slippage report: 0.02% on last 50 trades. Within bounds.", approved: true },
    { text: "Cross-chain settlement REJECTED. Insufficient liquidity.", approved: false },
  ],
];

const AgentTerminal = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const createEntry = (agentIdx: number, msgIdx: number, time: Date): LogEntry => {
    const agent = AGENTS[agentIdx];
    const rawMsg = MESSAGES[agentIdx][msgIdx];
    let message: string;
    let colorClass: string;

    if (typeof rawMsg === "string") {
      message = rawMsg;
      colorClass = agent.colorClass;
    } else {
      message = rawMsg.text;
      colorClass = rawMsg.approved ? "text-positive" : "text-negative";
    }

    return {
      agent: agent.name,
      colorClass,
      message: `[${agent.prefix}] ${message}`,
      timestamp: time.toLocaleTimeString("en-US", { hour12: false }),
    };
  };

  useEffect(() => {
    const initial: LogEntry[] = [];
    for (let i = 0; i < 8; i++) {
      const agentIdx = i % 4;
      const msgIdx = Math.floor(Math.random() * MESSAGES[agentIdx].length);
      initial.push(createEntry(agentIdx, msgIdx, new Date(Date.now() - (8 - i) * 3000)));
    }
    setLogs(initial);

    const interval = setInterval(() => {
      const agentIdx = Math.floor(Math.random() * 4);
      const msgIdx = Math.floor(Math.random() * MESSAGES[agentIdx].length);
      setLogs((prev) => [...prev.slice(-30), createEntry(agentIdx, msgIdx, new Date())]);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="glass-panel h-full flex flex-col scanline overflow-hidden">
      <div className="px-4 py-3 border-b border-foreground/5 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-foreground animate-pulse-glow" />
        <h3 className="font-display text-xs tracking-[0.3em] uppercase text-foreground">
          S4D5 Internal Debate
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
            className="text-[11px] leading-relaxed"
          >
            <span className="text-muted-foreground">{log.timestamp}</span>{" "}
            <span className={log.colorClass}>[{log.agent}]</span>{" "}
            <span className="text-foreground/70">{log.message}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default AgentTerminal;
