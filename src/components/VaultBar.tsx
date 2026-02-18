import { motion } from "framer-motion";
import { ArrowDownLeft, ArrowUpRight, Shield } from "lucide-react";

const VaultBar = () => {
  return (
    <div className="shrink-0 border-t border-foreground/10 bg-background px-4 py-2 flex items-center gap-3">
      <Shield className="w-4 h-4 text-muted-foreground" />
      <span className="text-[10px] font-display tracking-[0.2em] uppercase text-muted-foreground mr-auto">
        Vault Controls
      </span>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center gap-2 px-5 py-2 text-[11px] font-display tracking-[0.15em] uppercase bg-positive/10 border border-positive/30 text-positive rounded-sm transition-colors hover:bg-positive/20"
      >
        <ArrowDownLeft className="w-3.5 h-3.5" />
        Deposit
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center gap-2 px-5 py-2 text-[11px] font-display tracking-[0.15em] uppercase bg-negative/10 border border-negative/30 text-negative rounded-sm transition-colors hover:bg-negative/20"
      >
        <ArrowUpRight className="w-3.5 h-3.5" />
        Withdraw
      </motion.button>
    </div>
  );
};

export default VaultBar;
