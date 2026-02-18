import { useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, DollarSign, Wallet, CheckCircle } from "lucide-react";

const MetricsBar = () => {
  const cards = [
    {
      label: "NAV",
      value: "$1,240,500.00",
      icon: DollarSign,
      sub: "Net Asset Value",
    },
    {
      label: "Performance",
      value: "+0.12%",
      icon: TrendingUp,
      sub: "24H",
      positive: true,
    },
    {
      label: "0G Verified",
      value: "VERIFIED",
      icon: CheckCircle,
      sub: "On-Chain",
      badge: true,
    },
  ];

  return (
    <div className="flex items-center gap-3 flex-1">
      {cards.map((card) => (
        <motion.div
          key={card.label}
          className="glass-panel px-4 py-2.5 flex items-center gap-3 flex-1 min-w-0"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
        >
          <card.icon className={`w-4 h-4 shrink-0 ${card.badge ? "text-silver" : "text-muted-foreground"}`} />
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">{card.label}</p>
            <p className={`text-sm font-bold truncate ${card.positive ? "text-positive" : card.badge ? "text-silver" : "text-foreground"}`}>
              {card.value}
            </p>
          </div>
          <span className="text-[10px] text-muted-foreground ml-auto shrink-0">{card.sub}</span>
        </motion.div>
      ))}
    </div>
  );
};

const TopBar = () => {
  const [connected, setConnected] = useState(false);
  const [address] = useState("0x7a3f...e91d");
  const [balance] = useState("$124,500.00");

  return (
    <header className="flex items-center gap-4 px-4 py-3 hud-border shrink-0">
      <div className="flex items-center gap-3 mr-4">
        <h1 className="font-display text-base tracking-[0.3em] uppercase text-foreground font-bold">
          S4D5
        </h1>
        <span className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground border border-muted-foreground/30 px-2 py-0.5 rounded-sm">
          Institutional Grade
        </span>
      </div>

      <MetricsBar />

      {connected ? (
        <div className="flex items-center gap-3 px-4 py-2 border border-foreground/10 rounded-sm shrink-0">
          <div className="w-2 h-2 rounded-full bg-positive shadow-[0_0_6px_hsl(120_100%_50%/0.6)]" />
          <span className="text-[9px] uppercase tracking-wider text-positive font-display">Live</span>
          <span className="font-mono text-xs text-foreground">{address}</span>
          <span className="text-[10px] text-muted-foreground">|</span>
          <span className="font-mono text-xs text-foreground">{balance}</span>
        </div>
      ) : (
        <motion.button
          onClick={() => setConnected(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="wallet-btn relative overflow-hidden px-4 py-2 flex items-center gap-2 text-xs font-display tracking-wider uppercase cursor-pointer shrink-0 text-foreground bg-background border border-foreground/80 rounded-sm"
        >
          <Wallet className="w-4 h-4" />
          Connect Wallet
          <span className="wallet-scan-sweep" />
        </motion.button>
      )}
    </header>
  );
};

export default TopBar;
