import { motion } from "framer-motion";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

const VaultBar = () => {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[9px] font-display tracking-[0.2em] uppercase text-muted-foreground text-right pr-0.5">
        Vault Controls
      </p>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-display tracking-[0.15em] uppercase bg-positive/10 border border-positive/30 text-positive rounded-sm transition-colors hover:bg-positive/20 whitespace-nowrap"
      >
        <ArrowDownLeft className="w-3 h-3" />
        Deposit
      </motion.button>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-display tracking-[0.15em] uppercase bg-negative/10 border border-negative/30 text-negative rounded-sm transition-colors hover:bg-negative/20 whitespace-nowrap"
      >
        <ArrowUpRight className="w-3 h-3" />
        Withdraw
      </motion.button>
    </div>
  );
};

export default VaultBar;
