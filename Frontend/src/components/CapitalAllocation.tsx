import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownLeft } from "lucide-react";

const CapitalAllocation = () => {
  return (
    <div className="glass-panel p-4 flex flex-col gap-3">
      <h3 className="font-display text-xs tracking-[0.3em] uppercase text-foreground">
        Capital Allocation
      </h3>
      <div className="flex gap-2">
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-display tracking-wider uppercase bg-positive/10 border border-positive/20 rounded-sm text-positive transition-colors hover:bg-positive/20"
        >
          <ArrowDownLeft className="w-3.5 h-3.5" />
          Deposit
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-display tracking-wider uppercase bg-negative/10 border border-negative/20 rounded-sm text-negative transition-colors hover:bg-negative/20"
        >
          <ArrowUpRight className="w-3.5 h-3.5" />
          Request Withdrawal
        </motion.button>
      </div>
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
        <div className="w-1.5 h-1.5 rounded-full bg-silver" />
        Execution handled by Hedera Schedule Service
      </div>
    </div>
  );
};

export default CapitalAllocation;
