import { motion } from "framer-motion";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Wallet, CheckCircle } from "lucide-react";

const MetricsBar = () => {
  return (
    <div className="flex items-center gap-3 flex-1">
      <motion.div
        className="glass-panel px-4 py-2.5 flex items-center gap-3 flex-1 min-w-0"
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
      >
        <CheckCircle className="w-4 h-4 shrink-0 text-white/80" />
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.15em] text-white/70">0G Verified</p>
          <p className="text-sm font-bold truncate text-white">VERIFIED</p>
        </div>
        <span className="text-[10px] text-white/70 ml-auto shrink-0">On-Chain</span>
      </motion.div>
    </div>
  );
};

const TopBar = () => {
  return (
    <header className="flex items-center gap-4 px-4 py-3 hud-border shrink-0">
      <div className="flex items-center gap-3 mr-4">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <h1 className="text-xl font-bold tracking-tighter leading-none text-white">S4D5</h1>
            <span className="text-[9px] tracking-[0.3em] font-display uppercase text-white/80">
              Institutional Grade
            </span>
          </div>
          <div className="h-6 w-px bg-white/20 mx-2" />
          <div className="flex items-center gap-1.5 px-2 py-1 bg-white/10 rounded-full border border-white/10">
            <div className="w-1.5 h-1.5 rounded-full bg-positive animate-pulse" />
            <span className="text-[10px] font-mono text-white tracking-wide">0G Verified</span>
          </div>
        </div>
      </div>

      <MetricsBar />

      <ConnectButton.Custom>
        {({
          account,
          chain,
          openAccountModal,
          openChainModal,
          openConnectModal,
          authenticationStatus,
          mounted,
        }) => {
          const ready = mounted && authenticationStatus !== "loading";
          const connected =
            ready &&
            account &&
            chain &&
            (!authenticationStatus ||
              authenticationStatus === "authenticated");

          return (
            <div
              {...(!ready && {
                "aria-hidden": true,
                style: {
                  opacity: 0,
                  pointerEvents: "none",
                  userSelect: "none",
                },
              })}
            >
              {(() => {
                if (!connected) {
                  return (
                    <motion.button
                      onClick={openConnectModal}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="wallet-btn relative overflow-hidden px-4 py-2 flex items-center gap-2 text-xs font-display tracking-wider uppercase cursor-pointer shrink-0 text-white bg-black border border-white/60 rounded-sm"
                    >
                      <Wallet className="w-4 h-4" />
                      Connect Wallet
                      <span className="wallet-scan-sweep" />
                    </motion.button>
                  );
                }

                if (chain.unsupported) {
                  return (
                    <button
                      onClick={openChainModal}
                      className="px-4 py-2 text-xs font-display tracking-wider uppercase text-negative border border-negative/50 rounded-sm hover:bg-negative/10 transition-colors"
                    >
                      Wrong network
                    </button>
                  );
                }

                return (
                  <div className="flex items-center gap-3 px-4 py-2 border border-white/20 rounded-sm shrink-0">
                    <div className="w-2 h-2 rounded-full bg-positive shadow-[0_0_6px_hsl(120_100%_50%/0.6)]" />
                    <span className="text-[9px] uppercase tracking-wider text-positive font-display">Live</span>
                    <button onClick={openAccountModal} className="font-mono text-xs text-white hover:text-white/80 transition-colors">
                      {account.displayName}
                    </button>
                    <span className="text-[10px] text-white/60">|</span>
                    <span className="font-mono text-xs text-white">
                      {account.displayBalance
                        ? ` ${account.displayBalance}`
                        : ""}
                    </span>
                  </div>
                );
              })()}
            </div>
          );
        }}
      </ConnectButton.Custom>
    </header>
  );
};

export default TopBar;
