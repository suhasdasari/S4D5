import { useState } from "react";
import TopBar from "@/components/TopBar";
import AgentTerminal from "@/components/AgentTerminal";
import FractalSphere from "@/components/FractalSphere";
import MarketWatch from "@/components/MarketWatch";
import BiometricDropzone from "@/components/BiometricDropzone";
import DecisionMatrix from "@/components/DecisionMatrix";
import ProofModal from "@/components/ProofModal";
import VaultBar from "@/components/VaultBar";
import PortfolioChart from "@/components/PortfolioChart";

const Index = () => {
  const [ripple, setRipple] = useState(false);
  const [proofTradeId, setProofTradeId] = useState<string | null>(null);

  const handleDeposit = () => {
    setRipple(true);
    setTimeout(() => setRipple(false), 1500);
  };

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden scanline-global">
      <TopBar />

      {/* Portfolio Chart strip */}
      <div className="px-3 pb-0 pt-1 shrink-0">
        <PortfolioChart />
      </div>

      <main className="flex-1 grid grid-cols-[260px_1fr_260px] gap-3 p-3 pt-2 min-h-0">
        {/* Left: Agent Council */}
        <div className="flex flex-col gap-3 min-h-0 overflow-hidden">
          <div className="flex-1 min-h-0">
            <AgentTerminal />
          </div>
          <DecisionMatrix />
        </div>

        {/* Center: Sphere + Intel */}
        <div className="flex flex-col gap-3 min-h-0 overflow-hidden">
          <div className="flex-1 relative min-h-0">
            <FractalSphere ripple={ripple} />
            {/* Corner brackets */}
            <div className="absolute top-3 left-3 w-5 h-5 border-l border-t border-foreground/10 pointer-events-none" />
            <div className="absolute top-3 right-3 w-5 h-5 border-r border-t border-foreground/10 pointer-events-none" />
            <div className="absolute bottom-3 left-3 w-5 h-5 border-l border-b border-foreground/10 pointer-events-none" />
            <div className="absolute bottom-3 right-3 w-5 h-5 border-r border-b border-foreground/10 pointer-events-none" />

            {/* Vault Controls overlay — top-right of globe */}
            <div className="absolute top-4 right-14 flex flex-col gap-2 pointer-events-auto z-10">
              <VaultBar />
            </div>
          </div>
          <BiometricDropzone onDeposit={handleDeposit} />
        </div>

        {/* Right: Market Watch */}
        <MarketWatch onOpenProof={setProofTradeId} />
      </main>

      <ProofModal tradeId={proofTradeId} onClose={() => setProofTradeId(null)} />
    </div>
  );
};

export default Index;
