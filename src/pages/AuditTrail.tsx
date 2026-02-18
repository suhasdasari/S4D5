import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

interface LogEntry {
  agent: string;
  message: string;
  timestamp: string;
  glowType: "positive" | "negative" | null;
}

const AGENTS = ["ALPHA STRATEGIST", "RISK OFFICER", "COMPLIANCE SCRIBE", "EXECUTIONER"];

const SAMPLE_MESSAGES = [
  "Identified momentum divergence in BTC/ETH ratio. APPROVED.",
  "Portfolio VaR within tolerance: 2.1σ. APPROVED.",
  "Correlation matrix update — crypto-equity decorrelation. VETOED.",
  "Market order: SELL 150 ETH @ $3,847.22. EXECUTED.",
  "Drawdown threshold breach detected. Trade REJECTED.",
  "SEC Form ADV filed. Status: ACCEPTED.",
  "KYC/AML sweep complete. 0 flags raised.",
  "Cross-chain settlement REJECTED. Insufficient liquidity.",
  "Long bias confirmed on NQ futures. EXECUTED.",
  "Tail risk monitor: Black Swan probability at 0.03%. APPROVED.",
];

const getGlowType = (msg: string): "positive" | "negative" | null => {
  if (/VETOED|REJECTED/i.test(msg)) return "negative";
  if (/EXECUTED|APPROVED/i.test(msg)) return "positive";
  return null;
};

const AuditTrail = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initial: LogEntry[] = [];
    for (let i = 0; i < 50; i++) {
      const msg = SAMPLE_MESSAGES[Math.floor(Math.random() * SAMPLE_MESSAGES.length)];
      initial.push({
        agent: AGENTS[Math.floor(Math.random() * AGENTS.length)],
        message: msg,
        timestamp: new Date(Date.now() - (50 - i) * 3000).toLocaleTimeString("en-US", { hour12: false }),
        glowType: getGlowType(msg),
      });
    }
    setLogs(initial);

    const interval = setInterval(() => {
      const msg = SAMPLE_MESSAGES[Math.floor(Math.random() * SAMPLE_MESSAGES.length)];
      setLogs((prev) => [
        ...prev,
        {
          agent: AGENTS[Math.floor(Math.random() * AGENTS.length)],
          message: msg,
          timestamp: new Date().toLocaleTimeString("en-US", { hour12: false }),
          glowType: getGlowType(msg),
        },
      ]);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="min-h-screen bg-background flex flex-col scanline-global">
      <header className="flex items-center gap-4 px-4 py-3 hud-border">
        <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="font-display text-xs tracking-[0.2em] uppercase">Back to Dashboard</span>
        </Link>
        <h1 className="font-display text-base tracking-[0.3em] uppercase text-foreground font-bold ml-auto">
          Full Audit Trail
        </h1>
      </header>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-1 terminal-scrollbar">
        {logs.map((log, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            className={`text-[11px] leading-relaxed font-mono px-2 py-1 rounded ${
              log.glowType === "negative"
                ? "glow-negative"
                : log.glowType === "positive"
                ? "glow-positive"
                : "text-foreground/70"
            }`}
          >
            <span className="text-muted-foreground">{log.timestamp}</span>{" "}
            <span>[{log.agent}]</span>{" "}
            <span>{log.message}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default AuditTrail;
