import { useEffect, useState, useRef } from "react";
import { AreaChart, Area, ResponsiveContainer, Tooltip, YAxis } from "recharts";

interface DataPoint {
  time: number;
  value: number;
}

const PortfolioChart = () => {
  const baseValue = 1240500;
  const [data, setData] = useState<DataPoint[]>(() => {
    const now = Date.now();
    return Array.from({ length: 40 }, (_, i) => ({
      time: now - (40 - i) * 3000,
      value: baseValue + (Math.random() - 0.48) * 8000 * (i / 40),
    }));
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setData((prev) => {
        const last = prev[prev.length - 1].value;
        const delta = (Math.random() - 0.47) * 1200;
        return [
          ...prev.slice(-59),
          { time: Date.now(), value: Math.max(1180000, last + delta) },
        ];
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const latest = data[data.length - 1]?.value ?? baseValue;
  const first = data[0]?.value ?? baseValue;
  const isUp = latest >= first;

  return (
    <div className="glass-panel px-4 pt-3 pb-2 flex flex-col gap-1" style={{ height: "120px" }}>
      <div className="flex items-center justify-between shrink-0">
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-display">
          Portfolio Value
        </p>
        <span className={`text-xs font-mono font-bold ${isUp ? "text-positive" : "text-negative"}`}>
          ${latest.toLocaleString("en-US", { maximumFractionDigits: 0 })}
        </span>
      </div>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="portfolioGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(0 0% 100%)" stopOpacity={0.15} />
                <stop offset="100%" stopColor="hsl(0 0% 100%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <YAxis domain={["auto", "auto"]} hide />
            <Tooltip
              contentStyle={{
                background: "hsl(0 0% 3%)",
                border: "1px solid hsl(0 0% 100% / 0.1)",
                borderRadius: "2px",
                fontSize: "10px",
                fontFamily: "JetBrains Mono",
                color: "hsl(0 0% 100%)",
              }}
              formatter={(v: number) => [`$${v.toLocaleString("en-US", { maximumFractionDigits: 0 })}`, "NAV"]}
              labelFormatter={() => ""}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="hsl(0 0% 100%)"
              strokeWidth={1.5}
              fill="url(#portfolioGrad)"
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PortfolioChart;
