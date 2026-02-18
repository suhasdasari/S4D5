import { useState } from "react";
import TopBar from "@/components/TopBar";
import AgentTerminal from "@/components/AgentTerminal";
import FractalSphere from "@/components/FractalSphere";
import MarketWatch from "@/components/MarketWatch";
import BiometricDropzone from "@/components/BiometricDropzone";
import DecisionMatrix from "@/components/DecisionMatrix";
import CapitalAllocation from "@/components/CapitalAllocation";
import ProofModal from "@/components/ProofModal";

const Index = () => {
  const [ripple, setRipple] = useState(false);
  const [proofTradeId, setProofTradeId] = useState<string | null>(null);

  const handleDeposit = () => {
    setRipple(true);
    setTimeout(() => setRipple(false), 1500);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden">
      <TopBar />

      <main className="flex-1 grid grid-cols-[300px_1fr_300px] gap-3 p-3 min-h-0">
        {/* Left: Agent Council */}
        <div className="flex flex-col gap-3 min-h-0">
          <div className="flex-1 min-h-0">
            <AgentTerminal />
          </div>
          <DecisionMatrix />
        </div>

        {/* Center: Sphere + Intel + Vault */}
        <div className="flex flex-col gap-3 min-h-0">
          <div className="flex-1 relative">
            <FractalSphere ripple={ripple} />
            <div className="absolute top-3 left-3 w-5 h-5 border-l border-t border-foreground/10 pointer-events-none" />
            <div className="absolute top-3 right-3 w-5 h-5 border-r border-t border-foreground/10 pointer-events-none" />
            <div className="absolute bottom-3 left-3 w-5 h-5 border-l border-b border-foreground/10 pointer-events-none" />
            <div className="absolute bottom-3 right-3 w-5 h-5 border-r border-b border-foreground/10 pointer-events-none" />
          </div>
          <BiometricDropzone onDeposit={handleDeposit} />
          <CapitalAllocation />
        </div>

        {/* Right: Market Watch */}
        <MarketWatch onOpenProof={setProofTradeId} />
      </main>

      <ProofModal tradeId={proofTradeId} onClose={() => setProofTradeId(null)} />
    </div>
  );
};

export default Index;
