"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";

interface LogEntry {
  agent: string;
  message: string;
  timestamp: string;
  glowType: "positive" | "negative" | null;
  proposalId: string;
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

let auditPropCounter = 200;

const AuditTrail = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const initial: LogEntry[] = [];
    for (let i = 0; i < 50; i++) {
      const msg = SAMPLE_MESSAGES[Math.floor(Math.random() * SAMPLE_MESSAGES.length)];
      auditPropCounter++;
      const propId = `PROP-${String(auditPropCounter).padStart(4, "0")}`;
      initial.push({
        agent: AGENTS[Math.floor(Math.random() * AGENTS.length)],
        message: `[${propId}] ${msg}`,
        timestamp: new Date(Date.now() - (50 - i) * 3000).toLocaleTimeString("en-US", { hour12: false }),
        glowType: getGlowType(msg),
        proposalId: propId,
      });
    }
    setLogs(initial);

    const interval = setInterval(() => {
      const msg = SAMPLE_MESSAGES[Math.floor(Math.random() * SAMPLE_MESSAGES.length)];
      auditPropCounter++;
      const propId = `PROP-${String(auditPropCounter).padStart(4, "0")}`;
      setLogs((prev) => [
        {
          agent: AGENTS[Math.floor(Math.random() * AGENTS.length)],
          message: `[${propId}] ${msg}`,
          timestamp: new Date().toLocaleTimeString("en-US", { hour12: false }),
          glowType: getGlowType(msg),
          proposalId: propId,
        },
        ...prev,
      ]);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const filteredLogs = search
    ? logs.filter(
      (log) =>
        log.message.toLowerCase().includes(search.toLowerCase()) ||
        log.agent.toLowerCase().includes(search.toLowerCase()) ||
        log.proposalId.toLowerCase().includes(search.toLowerCase())
    )
    : logs;

  return (
    <div className="h-screen bg-background flex flex-col scanline-global overflow-hidden">
      <header className="flex items-center gap-4 px-4 py-3 hud-border shrink-0">
        <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="font-display text-xs tracking-[0.2em] uppercase">Back to Dashboard</span>
        </Link>
        <h1 className="font-display text-base tracking-[0.3em] uppercase text-foreground font-bold ml-auto">
          Full Audit Trail
        </h1>
      </header>

      {/* Search bar */}
      <div className="px-4 py-3 shrink-0">
        <div className="flex items-center gap-3 border border-foreground/20 rounded-sm px-3 py-2">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="SEARCH PROPOSALS, AGENTS, OR ASSETS..."
            className="flex-1 bg-transparent text-xs font-mono text-foreground placeholder:text-muted-foreground outline-none tracking-wider"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-1 terminal-scrollbar">
        {filteredLogs.map((log, i) => (
          <motion.div
            key={`${log.proposalId}-${i}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            className={`text-[11px] leading-relaxed font-mono px-2 py-1 rounded ${log.glowType === "negative"
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
