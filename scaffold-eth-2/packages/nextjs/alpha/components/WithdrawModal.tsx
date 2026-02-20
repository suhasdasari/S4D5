"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useAccount } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WithdrawModal = ({ isOpen, onClose }: WithdrawModalProps) => {
  const { address: connectedAddress } = useAccount();
  const [amount, setAmount] = useState("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [success, setSuccess] = useState(false);

  // Read user's USDC value in vault
  const { data: userShares } = useScaffoldReadContract({
    contractName: "S4D5Vault",
    functionName: "balanceOf",
    args: [connectedAddress as string],
    chainId: 8453,
  });

  // Convert shares to assets
  const { data: userAssets } = useScaffoldReadContract({
    contractName: "S4D5Vault",
    functionName: "convertToAssets",
    args: [userShares || 0n],
    chainId: 8453,
  });

  // Withdraw from vault
  const { writeContractAsync: withdrawFromVault } = useScaffoldWriteContract({
    contractName: "S4D5Vault",
  });

  const maxWithdraw = userAssets ? Number(formatUnits(userAssets, 6)) : 0;

  const handleWithdraw = async () => {
    if (!amount || !connectedAddress) return;

    try {
      setIsWithdrawing(true);
      const amountInUsdc = parseUnits(amount, 6); // USDC has 6 decimals

      await withdrawFromVault({
        functionName: "withdraw",
        args: [amountInUsdc, connectedAddress, connectedAddress],
      });

      // Success
      setSuccess(true);
      setTimeout(() => {
        setAmount("");
        setIsWithdrawing(false);
        setSuccess(false);
        onClose();
      }, 2000);
    } catch (error) {
      console.error("Withdraw failed:", error);
      setIsWithdrawing(false);
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

          <h2 className="text-xl font-display tracking-wider uppercase mb-4">Withdraw USDC</h2>

          {!isWithdrawing && !success ? (
            <>
              <div className="mb-2">
                <p className="text-xs font-display tracking-wider uppercase text-foreground/60">
                  Available: ${maxWithdraw.toFixed(2)} USDC
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
                  max={maxWithdraw}
                  className="w-full bg-transparent border border-foreground/20 rounded px-4 py-2 text-foreground font-mono"
                />
                <button
                  onClick={() => setAmount(maxWithdraw.toString())}
                  className="text-xs text-foreground/60 hover:text-foreground mt-1"
                >
                  Max
                </button>
              </div>

              <button
                onClick={handleWithdraw}
                disabled={!amount || !connectedAddress || Number(amount) > maxWithdraw}
                className="w-full bg-foreground text-background py-2 rounded font-display tracking-wider uppercase disabled:opacity-50"
              >
                Withdraw
              </button>
            </>
          ) : success ? (
            <div className="text-center py-8">
              <p className="text-green-500 mb-2">✓ Withdrawal successful!</p>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-foreground/60 mb-2">Withdrawing from vault...</p>
              <div className="animate-spin w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full mx-auto" />
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default WithdrawModal;
