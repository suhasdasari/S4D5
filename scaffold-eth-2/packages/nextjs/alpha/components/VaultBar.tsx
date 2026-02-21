import { motion } from "framer-motion";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

interface VaultBarProps {
  onDeposit?: () => void;
  onWithdraw?: () => void;
}

const VaultBar = ({ onDeposit, onWithdraw }: VaultBarProps) => {
  return (
    <div className="flex items-center gap-1.5">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onDeposit}
        className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-display tracking-[0.15em] uppercase bg-transparent border border-foreground text-foreground rounded-sm transition-colors hover:bg-foreground/10 whitespace-nowrap cursor-pointer"
      >
        <ArrowDownLeft className="w-3 h-3" />
        Deposit
      </motion.button>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onWithdraw}
        className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-display tracking-[0.15em] uppercase bg-transparent border border-foreground text-foreground rounded-sm transition-colors hover:bg-foreground/10 whitespace-nowrap cursor-pointer"
      >
        <ArrowUpRight className="w-3 h-3" />
        Withdraw
      </motion.button>
    </div>
  );
};

export default VaultBar;
