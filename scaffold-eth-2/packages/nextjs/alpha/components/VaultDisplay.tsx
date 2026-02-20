"use client";

import { useAccount } from "wagmi";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { formatEther, formatUnits } from "viem";

const VaultDisplay = () => {
  const { address: connectedAddress } = useAccount();

  // Read total assets (NAV) from vault
  const { data: totalAssets } = useScaffoldReadContract({
    contractName: "S4D5Vault",
    functionName: "totalAssets",
    chainId: 8453, // Base mainnet
  });

  // Read user's share balance
  const { data: userShares } = useScaffoldReadContract({
    contractName: "S4D5Vault",
    functionName: "balanceOf",
    args: connectedAddress ? [connectedAddress] : undefined,
    chainId: 8453,
  });

  // Read total supply of shares
  const { data: totalSupply } = useScaffoldReadContract({
    contractName: "S4D5Vault",
    functionName: "totalSupply",
    chainId: 8453,
  });

  // Calculate user's portion of NAV
  const userNav =
    totalAssets && userShares && totalSupply && totalSupply > 0n
      ? (totalAssets * userShares) / totalSupply
      : 0n;

  // Format values (USDC has 6 decimals, shares have 18)
  const navValue = totalAssets ? Number(formatUnits(totalAssets, 6)) : 10;
  const userNavValue = userNav ? Number(formatUnits(userNav, 6)) : 0;
  const userSharesValue = userShares ? Number(formatEther(userShares)) : 0;

  return {
    navValue,
    userNavValue,
    userSharesValue,
    isConnected: !!connectedAddress,
  };
};

export default VaultDisplay;
