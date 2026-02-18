import { useState, useEffect } from "react";

interface StatusNode {
  label: string;
  key: string;
}

const NODES: StatusNode[] = [
  { label: "STRAT", key: "strat" },
  { label: "RISK", key: "risk" },
  { label: "COMP", key: "comp" },
  { label: "EXEC", key: "exec" },
];

const DecisionMatrix = () => {
  const [states, setStates] = useState<Record<string, boolean>>({
    strat: true,
    risk: true,
    comp: true,
    exec: false,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setStates((prev) => {
        const keys = Object.keys(prev);
        const randomKey = keys[Math.floor(Math.random() * keys.length)];
        return { ...prev, [randomKey]: Math.random() > 0.3 };
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass-panel px-4 py-3">
      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-3 font-display">
        Consensus State
      </p>
      <div className="flex items-center justify-between gap-2">
        {NODES.map((node) => {
          const approved = states[node.key];
          return (
            <div key={node.key} className="flex flex-col items-center gap-1.5">
              <div
                className={`w-3 h-3 rounded-full transition-all duration-500 ${
                  approved
                    ? "bg-positive shadow-[0_0_8px_hsl(120_100%_50%/0.6)]"
                    : "bg-negative shadow-[0_0_8px_hsl(0_100%_50%/0.6)]"
                }`}
              />
              <span className="text-[10px] font-display tracking-wider text-muted-foreground">
                [{node.label}]
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DecisionMatrix;
