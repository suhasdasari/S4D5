import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface MarketRow {
  symbol: string;
  price: string;
  change: string;
  positive: boolean;
}


const DataSection = ({ title, rows }: { title: string; rows: MarketRow[] }) => (
  <div className="mb-4">
    <h4 className="font-display text-[10px] tracking-[0.25em] uppercase text-white/80 mb-2">
      {title}
    </h4>
    <div className="space-y-1">
      {rows.map((row) => (
        <div key={row.symbol} className="flex items-center justify-between text-xs py-1 px-2 rounded hover:bg-white/[0.03] transition-colors">
          <span className="font-semibold text-white">{row.symbol}</span>
          <span className="text-white/80">{row.price}</span>
          <span className={row.positive ? "text-positive" : "text-negative"}>
            {row.change}
          </span>
        </div>
      ))}
    </div>
  </div>
);

const MarketWatch = ({ onOpenProof }: { onOpenProof: (tradeId: string) => void }) => {
  const [cryptoPrices, setCryptoPrices] = useState<MarketRow[]>([
    { symbol: "BTC", price: "$104,872", change: "+2.14%", positive: true },
    { symbol: "ETH", price: "$3,847.22", change: "+4.67%", positive: true },
  ]);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const response = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true"
        );
        const data = await response.json();

        const btcPrice = data.bitcoin?.usd || 0;
        const btcChange = data.bitcoin?.usd_24h_change || 0;
        const ethPrice = data.ethereum?.usd || 0;
        const ethChange = data.ethereum?.usd_24h_change || 0;

        setCryptoPrices([
          {
            symbol: "BTC",
            price: `$${btcPrice.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
            change: `${btcChange >= 0 ? "+" : ""}${btcChange.toFixed(2)}%`,
            positive: btcChange >= 0,
          },
          {
            symbol: "ETH",
            price: `$${ethPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            change: `${ethChange >= 0 ? "+" : ""}${ethChange.toFixed(2)}%`,
            positive: ethChange >= 0,
          },
        ]);
      } catch (error) {
        console.error("Failed to fetch crypto prices:", error);
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      className="glass-panel h-full flex flex-col scanline overflow-hidden"
      whileHover={{ scale: 1.003 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2 shrink-0">
        <div className="w-2 h-2 rounded-full bg-white animate-pulse-glow" />
        <h3 className="font-display text-xs tracking-[0.3em] uppercase text-white">
          Market Pulse
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto p-4 terminal-scrollbar">
        <DataSection title="Crypto" rows={cryptoPrices} />
      </div>
    </motion.div>
  );
};

export default MarketWatch;
