"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useAccount } from "wagmi";
import { parseUnits, formatUnits, erc20Abi } from "viem";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"; // Base mainnet USDC
const VAULT_ADDRESS = "0xed8E9E422D4681E177423BCe0Ebaf03BF413a83B"; // S4D5Vault on Base

const DepositModal = ({ isOpen, onClose }: DepositModalProps) => {
  const { address: connectedAddress } = useAccount();
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<"input" | "approve" | "deposit" | "success">("input");

  // Read USDC balance
  const { data: usdcBalance } = useScaffoldReadContract({
    contractName: "S4D5Vault",
    functionName: "balanceOf",
    args: [connectedAddress as string],
    chainId: 8453,
  });

  // Approve USDC using wagmi's useWriteContract
  const { writeContract: approveUsdc, data: approveHash } = useWriteContract();
  const { isLoading: isApproving } = useWaitForTransactionReceipt({ hash: approveHash });

  // Deposit to vault
  const { writeContractAsync: depositToVault, isPending: isDepositing } = useScaffoldWriteContract({
    contractName: "S4D5Vault",
  });

  const handleDeposit = async () => {
    if (!amount || !connectedAddress) return;

    try {
      const amountInUsdc = parseUnits(amount, 6); // USDC has 6 decimals

      // Step 1: Approve USDC
      setStep("approve");
      approveUsdc({
        address: USDC_ADDRESS,
        abi: erc20Abi,
        functionName: "approve",
        args: [VAULT_ADDRESS, amountInUsdc],
        chainId: 8453,
      });

      // Wait for approval to complete
      if (approveHash) {
        // Step 2: Deposit
        setStep("deposit");
        await depositToVault({
          functionName: "deposit",
          args: [amountInUsdc, connectedAddress],
        });

        // Success
        setStep("success");
        setTimeout(() => {
          setAmount("");
          setStep("input");
          onClose();
        }, 2000);
      }
    } catch (error) {
      console.error("Deposit failed:", error);
      setStep("input");
    }
  };

  if (!isOpen) return null;

  const maxBalance = usdcBalance ? Number(formatUnits(usdcBalance, 6)) : 0;

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
              <div className="mb-2">
                <p className="text-xs font-display tracking-wider uppercase text-foreground/60">
                  Available: ${maxBalance.toFixed(2)} USDC
                </p>
              </div>

              <div className="mb-4">
                <label className="text-xs font-display tracking-wider uppercase text-foreground/60 mb-2 block">
                  Amount (USDC)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  max={maxBalance}
                  className="w-full bg-transparent border border-foreground/20 rounded px-4 py-2 text-foreground font-mono"
                />
                <button
                  onClick={() => setAmount(maxBalance.toString())}
                  className="text-xs text-foreground/60 hover:text-foreground mt-1"
                >
                  Max
                </button>
              </div>

              <button
                onClick={handleDeposit}
                disabled={!amount || !connectedAddress || Number(amount) > maxBalance}
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

          {step === "success" && (
            <div className="text-center py-8">
              <p className="text-green-500 mb-2">✓ Deposit successful!</p>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default DepositModal;
