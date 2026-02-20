"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useAccount } from "wagmi";
import { parseUnits } from "viem";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"; // Base mainnet USDC

const DepositModal = ({ isOpen, onClose }: DepositModalProps) => {
  const { address: connectedAddress } = useAccount();
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<"input" | "approve" | "deposit">("input");

  // Read USDC balance
  const { data: usdcBalance } = useScaffoldReadContract({
    contractName: "S4D5Vault",
    functionName: "asset",
    chainId: 8453,
  });

  // Approve USDC
  const { writeContractAsync: approveUsdc, isMining: isApproving } = useScaffoldWriteContract({
    contractName: "S4D5Vault",
    chainId: 8453,
  });

  // Deposit to vault
  const { writeContractAsync: depositToVault, isMining: isDepositing } = useScaffoldWriteContract({
    contractName: "S4D5Vault",
    chainId: 8453,
  });

  const handleDeposit = async () => {
    if (!amount || !connectedAddress) return;

    try {
      const amountInUsdc = parseUnits(amount, 6); // USDC has 6 decimals

      // Step 1: Approve USDC
      setStep("approve");
      await approveUsdc({
        functionName: "approve",
        args: [USDC_ADDRESS, amountInUsdc],
      });

      // Step 2: Deposit
      setStep("deposit");
      await depositToVault({
        functionName: "deposit",
        args: [amountInUsdc, connectedAddress],
      });

      // Success
      setAmount("");
      setStep("input");
      onClose();
    } catch (error) {
      console.error("Deposit failed:", error);
      setStep("input");
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-black border border-foreground/20 rounded-lg p-6 w-full max-w-md relative"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-foreground/60 hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>

          <h2 className="text-xl font-display tracking-wider uppercase mb-4">Deposit USDC</h2>

          {step === "input" && (
            <>
              <div className="mb-4">
                <label className="text-xs font-display tracking-wider uppercase text-foreground/60 mb-2 block">
                  Amount (USDC)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-transparent border border-foreground/20 rounded px-4 py-2 text-foreground font-mono"
                />
              </div>

              <button
                onClick={handleDeposit}
                disabled={!amount || !connectedAddress}
                className="w-full bg-foreground text-background py-2 rounded font-display tracking-wider uppercase disabled:opacity-50"
              >
                Deposit
              </button>
            </>
          )}

          {step === "approve" && (
            <div className="text-center py-8">
              <p className="text-foreground/60 mb-2">Approving USDC...</p>
              <div className="animate-spin w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full mx-auto" />
            </div>
          )}

          {step === "deposit" && (
            <div className="text-center py-8">
              <p className="text-foreground/60 mb-2">Depositing to vault...</p>
              <div className="animate-spin w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full mx-auto" />
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default DepositModal;
