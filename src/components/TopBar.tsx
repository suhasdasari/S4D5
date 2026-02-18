import { motion } from "framer-motion";
import { Shield, TrendingUp, DollarSign, Wallet, CheckCircle } from "lucide-react";

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
  return (
    <header className="flex items-center gap-4 px-4 py-3 hud-border">
      <div className="flex items-center gap-3 mr-4">
        <h1 className="font-display text-base tracking-[0.3em] uppercase text-foreground font-bold">
          S4D5
        </h1>
        <span className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground border border-muted-foreground/30 px-2 py-0.5 rounded-sm">
          Institutional Grade
        </span>
      </div>

      <MetricsBar />

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="glass-panel px-4 py-2 flex items-center gap-2 text-xs font-display tracking-wider uppercase cursor-pointer shrink-0 text-foreground"
      >
        <Wallet className="w-4 h-4" />
        Connect Wallet
      </motion.button>
    </header>
  );
};

export default TopBar;
