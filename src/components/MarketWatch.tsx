import { motion } from "framer-motion";

interface MarketRow {
  symbol: string;
  price: string;
  change: string;
  positive: boolean;
}

const STOCKS: MarketRow[] = [
  { symbol: "NVDA", price: "$1,247.30", change: "+3.42%", positive: true },
  { symbol: "AAPL", price: "$234.56", change: "-0.18%", positive: false },
  { symbol: "MSFT", price: "$478.91", change: "+1.07%", positive: true },
];

const CRYPTO: MarketRow[] = [
  { symbol: "BTC", price: "$104,872", change: "+2.14%", positive: true },
  { symbol: "ETH", price: "$3,847.22", change: "+4.67%", positive: true },
  { symbol: "SOL", price: "$287.45", change: "-1.33%", positive: false },
];

const COMMODITIES: MarketRow[] = [
  { symbol: "GOLD", price: "$2,934.10", change: "+0.52%", positive: true },
  { symbol: "OIL", price: "$78.34", change: "-0.87%", positive: false },
];

const POLYMARKET: { question: string; odds: string }[] = [
  { question: "Fed Rate Cut by Q2 2030?", odds: "72%" },
  { question: "BTC > $150K by EOY?", odds: "58%" },
  { question: "AI Regulation Bill Passes?", odds: "41%" },
];


const DataSection = ({ title, rows }: { title: string; rows: MarketRow[] }) => (
  <div className="mb-4">
    <h4 className="font-display text-[10px] tracking-[0.25em] uppercase text-muted-foreground mb-2">
      {title}
    </h4>
    <div className="space-y-1">
      {rows.map((row) => (
        <div key={row.symbol} className="flex items-center justify-between text-xs py-1 px-2 rounded hover:bg-white/[0.03] transition-colors">
          <span className="font-semibold text-foreground">{row.symbol}</span>
          <span className="text-foreground/60">{row.price}</span>
          <span className={row.positive ? "text-positive" : "text-negative"}>
            {row.change}
          </span>
        </div>
      ))}
    </div>
  </div>
);

const MarketWatch = ({ onOpenProof }: { onOpenProof: (tradeId: string) => void }) => {
  return (
    <motion.div
      className="glass-panel h-full flex flex-col scanline overflow-hidden"
      whileHover={{ scale: 1.003 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <div className="px-4 py-3 border-b border-foreground/5 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-foreground animate-pulse-glow" />
        <h3 className="font-display text-xs tracking-[0.3em] uppercase text-foreground">
          Market Pulse
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto p-4 terminal-scrollbar">
        <DataSection title="Equities" rows={STOCKS} />
        <DataSection title="Crypto" rows={CRYPTO} />
        <DataSection title="Commodities" rows={COMMODITIES} />

        <div className="mb-4">
          <h4 className="font-display text-[10px] tracking-[0.25em] uppercase text-muted-foreground mb-2">
            Polymarket Odds
          </h4>
          <div className="space-y-2">
            {POLYMARKET.map((p) => (
              <div key={p.question} className="text-xs px-2 py-1.5 rounded hover:bg-white/[0.03] transition-colors">
                <div className="text-foreground/60 mb-1">{p.question}</div>
                <div className="font-bold text-foreground">{p.odds}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </motion.div>
  );
};

export default MarketWatch;
