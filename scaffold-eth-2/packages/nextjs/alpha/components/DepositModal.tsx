"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DepositModal = ({ isOpen, onClose }: DepositModalProps) => {
  const { address: connectedAddress } = useAccount();
  const [amount, setAmount] = useState("");
  const [isDepositing, setIsDepositing] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [success, setSuccess] = useState(false);

  const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
  const VAULT_ADDRESS = "0xed8E9E422D4681E177423BCe0Ebaf03BF413a83B";

  const ERC20_ABI = [
    {
      inputs: [{ name: "account", type: "address" }],
      name: "balanceOf",
      outputs: [{ name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { name: "owner", type: "address" },
        { name: "spender", type: "address" },
      ],
      name: "allowance",
      outputs: [{ name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { name: "spender", type: "address" },
        { name: "amount", type: "uint256" },
      ],
      name: "approve",
      outputs: [{ name: "", type: "bool" }],
      stateMutability: "nonpayable",
      type: "function",
    },
  ] as const;

  const { data: usdcBalance } = useReadContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: connectedAddress ? [connectedAddress] : undefined,
    chainId: 8453,
    query: {
      enabled: typeof window !== "undefined" && !!connectedAddress,
    },
  });

  const { data: allowance } = useReadContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: connectedAddress ? [connectedAddress, VAULT_ADDRESS] : undefined,
    chainId: 8453,
    query: {
      enabled: typeof window !== "undefined" && !!connectedAddress,
    },
  });

  const { writeContractAsync: approveUsdc } = useWriteContract();

  const { writeContractAsync: depositToVault } = useScaffoldWriteContract({
    contractName: "S4D5Vault",
  });

  const maxDeposit = usdcBalance ? Number(formatUnits(usdcBalance, 6)) : 0;

  const handleDeposit = async () => {
    if (!amount || !connectedAddress) return;

    try {
      const amountInUsdc = parseUnits(amount, 6);

      if (!allowance || allowance < amountInUsdc) {
        setIsApproving(true);
        await approveUsdc({
          address: USDC_ADDRESS,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [VAULT_ADDRESS, amountInUsdc],
          chainId: 8453,
        });
        setIsApproving(false);
      }

      setIsDepositing(true);
      await depositToVault({
        functionName: "deposit",
        args: [amountInUsdc, connectedAddress],
      });

      setSuccess(true);
      setTimeout(() => {
        setAmount("");
        setIsDepositing(false);
        setSuccess(false);
        onClose();
      }, 2000);
    } catch (error) {
      console.error("Deposit failed:", error);
      setIsDepositing(false);
      setIsApproving(false);
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
            className="bg-gray-900/95 backdrop-blur-md border-2 border-green-500/40 rounded-lg p-4 w-80 relative shadow-2xl pointer-events-auto mt-16"
          >
            <button onClick={onClose} className="absolute top-2 right-2 text-white/60 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>

            <h2 className="text-sm font-display tracking-wider uppercase mb-3 text-white">Deposit USDC</h2>

            {!isApproving && !isDepositing && !success ? (
              <>
                <div className="mb-2">
                  <p className="text-[10px] font-display tracking-wider uppercase text-white/60">
                    Wallet Balance: ${maxDeposit.toFixed(2)} USDC
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
                    max={maxDeposit}
                    className="w-full bg-gray-800 border border-white/20 rounded px-3 py-1.5 text-sm text-white font-mono focus:outline-none focus:border-green-500/40"
                  />
                  <button
                    onClick={() => setAmount(maxDeposit.toString())}
                    className="text-[10px] text-white/60 hover:text-white mt-1 transition-colors"
                  >
                    Max
                  </button>
                </div>

                <button
                  onClick={handleDeposit}
                  disabled={!amount || !connectedAddress || Number(amount) > maxDeposit}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-1.5 text-xs rounded font-display tracking-wider uppercase disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Confirm Deposit
                </button>
              </>
            ) : success ? (
              <div className="text-center py-6">
                <p className="text-xs text-green-500 mb-2">✓ Deposit successful!</p>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-[10px] text-white/60 mb-2">
                  {isApproving ? "Approving USDC..." : "Depositing to vault..."}
                </p>
                <div className="animate-spin w-6 h-6 border-2 border-white/20 border-t-white rounded-full mx-auto" />
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default DepositModal;
