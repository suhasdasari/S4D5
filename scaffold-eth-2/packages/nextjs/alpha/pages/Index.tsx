"use client";

import { useState } from "react";
import TopBar from "@/components/TopBar";
import AgentTerminal, { systemLogBus } from "@/components/AgentTerminal";
import FractalSphere from "@/components/FractalSphere";
import MarketWatch from "@/components/MarketWatch";
import BiometricDropzone from "@/components/BiometricDropzone";
import DecisionMatrix from "@/components/DecisionMatrix";
import ProofModal from "@/components/ProofModal";
import VaultBar from "@/components/VaultBar";
import SnakeHUD from "@/components/SnakeHUD";
import DepositModal from "@/components/DepositModal";
import WithdrawModal from "@/components/WithdrawModal";

const Index = () => {
  const [ripple, setRipple] = useState(false);
  const [proofTradeId, setProofTradeId] = useState<string | null>(null);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  const handleDeposit = () => {
    setShowDepositModal(true);
    setRipple(true);
    systemLogBus.emit("DEPOSIT INITIATED: AWAITING CONFIRMATION...");
    setTimeout(() => setRipple(false), 1500);
  };

  const handleWithdraw = () => {
    setShowWithdrawModal(true);
    systemLogBus.emit("WITHDRAW INITIATED: VERIFYING LIQUIDITY...");
  };

  return (
    <div className="h-screen bg-black flex flex-col overflow-hidden scanline-global">
      <TopBar />

      <main className="flex-1 grid grid-cols-[260px_1fr_260px] gap-3 p-3 pt-2 min-h-0">
        {/* Left: Agent Council */}
        <div className="flex flex-col gap-3 min-h-0 overflow-hidden">
          <div className="flex-[1.5] min-h-0">
            <AgentTerminal />
          </div>
          <DecisionMatrix />
        </div>

        {/* Center: Globe + Snake HUD overlay */}
        <div className="flex flex-col gap-3 min-h-0 overflow-hidden">
          <div className="flex-1 relative min-h-0" style={{ background: "#000000" }}>
            {/* Corner brackets */}
            <div className="absolute top-3 left-3 w-5 h-5 border-l border-t border-foreground/10 pointer-events-none z-10" />
            <div className="absolute top-3 right-3 w-5 h-5 border-r border-t border-foreground/10 pointer-events-none z-10" />
            <div className="absolute bottom-3 left-3 w-5 h-5 border-l border-b border-foreground/10 pointer-events-none z-10" />
            <div className="absolute bottom-3 right-3 w-5 h-5 border-r border-b border-foreground/10 pointer-events-none z-10" />

            {/* Globe — brighter backdrop */}
            <div className="absolute inset-0 z-0" style={{ opacity: 0.82 }}>
              <FractalSphere ripple={ripple} />
            </div>

            {/* Snake Portfolio HUD */}
            <SnakeHUD />

            {/* Deposit / Withdraw — top-right, side-by-side, no header */}
            <div className="absolute top-3 right-3 pointer-events-auto z-[60]">
              <VaultBar onDeposit={handleDeposit} onWithdraw={handleWithdraw} />
            </div>
          </div>
          <BiometricDropzone onDeposit={handleDeposit} />
        </div>

        {/* Right: Market Watch */}
        <MarketWatch onOpenProof={setProofTradeId} />
      </main>

      <ProofModal tradeId={proofTradeId} onClose={() => setProofTradeId(null)} />
      <DepositModal isOpen={showDepositModal} onClose={() => setShowDepositModal(false)} />
      <WithdrawModal isOpen={showWithdrawModal} onClose={() => setShowWithdrawModal(false)} />
    </div>
  );
};

export default Index;
