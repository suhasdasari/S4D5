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
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-end p-4 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, x: 20, y: -20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: 20, y: -20 }}
            className="bg-gray-900/95 backdrop-blur-md border-2 border-red-500/40 rounded-lg p-4 w-80 relative shadow-2xl pointer-events-auto mt-16"
          >
            <button
              onClick={onClose}
              className="absolute top-2 right-2 text-white/60 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <h2 className="text-sm font-display tracking-wider uppercase mb-3 text-white">Withdraw USDC</h2>

            {!isWithdrawing && !success ? (
              <>
                <div className="mb-2">
                  <p className="text-[10px] font-display tracking-wider uppercase text-white/60">
                    Available: ${maxWithdraw.toFixed(2)} USDC
                  </p>
                </div>

                <div className="mb-3">
                  <label className="text-[10px] font-display tracking-wider uppercase text-white/60 mb-1 block">
                    Amount (USDC)
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    max={maxWithdraw}
                    className="w-full bg-gray-800 border border-white/20 rounded px-3 py-1.5 text-sm text-white font-mono focus:outline-none focus:border-red-500/40"
                  />
                  <button
                    onClick={() => setAmount(maxWithdraw.toString())}
                    className="text-[10px] text-white/60 hover:text-white mt-1 transition-colors"
                  >
                    Max
                  </button>
                </div>

                <button
                  onClick={handleWithdraw}
                  disabled={!amount || !connectedAddress || Number(amount) > maxWithdraw}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-1.5 text-xs rounded font-display tracking-wider uppercase disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Confirm Withdraw
                </button>
              </>
            ) : success ? (
              <div className="text-center py-6">
                <p className="text-xs text-green-500 mb-2">✓ Withdrawal successful!</p>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-[10px] text-white/60 mb-2">Withdrawing from vault...</p>
                <div className="animate-spin w-6 h-6 border-2 border-white/20 border-t-white rounded-full mx-auto" />
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default WithdrawModal;
