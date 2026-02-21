"use client";

import { useEffect, useState } from "react";
import { formatEther } from "viem";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";

const AGENTS = [
  { name: "Alpha Strategist", address: "0xBe76B29B0ccEe48f77C02Cb6289E1Cea5579EDD5" },
  { name: "AuditOracle", address: "0xF3bbD5682e671CdcDC42f52bDdecCB6a35D53aE1" },
  { name: "ExecutionHand", address: "0x7a41a15474bC6F534Be1D5F898A44C533De68A91" },
];

const KITE_RPC = "https://rpc-testnet.gokite.ai/";
const KITE_EXPLORER = "https://testnet.kitescan.ai";

export default function Dashboard() {
  const [kiteBalances, setKiteBalances] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchKiteBalances = async () => {
      const balances: { [key: string]: string } = {};
      for (const agent of AGENTS) {
        try {
          const response = await fetch(KITE_RPC, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              jsonrpc: "2.0",
              method: "eth_getBalance",
              params: [agent.address, "latest"],
              id: 1,
            }),
          });
          const data = await response.json();
          const balanceWei = BigInt(data.result || "0");
          balances[agent.address] = parseFloat(formatEther(balanceWei)).toFixed(4);
        } catch (error) {
          balances[agent.address] = "0";
        }
      }
      setKiteBalances(balances);
      setLoading(false);
    };

    fetchKiteBalances();
    const interval = setInterval(fetchKiteBalances, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center flex-col flex-grow pt-10">
      <div className="px-5 w-full max-w-7xl">
        <h1 className="text-center mb-8">
          <span className="block text-4xl font-bold">Multi-Chain Dashboard</span>
          <span className="block text-xl mt-2 text-gray-400">Agent Infrastructure Across 4 Chains</span>
        </h1>

        {/* 2x2 Grid for 4 chains */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* KITE AI - Top Left */}
          <div className="card bg-black border border-white shadow-xl">
            <div className="card-body p-4">
              <div className="flex justify-between items-center mb-2">
                <h2 className="card-title text-lg text-white">🪁 Kite AI</h2>
                <span className="badge badge-sm bg-white text-black">x402 Payments</span>
              </div>

              {/* Agent Balances - Compact */}
              <div className="space-y-1 mb-3">
                {AGENTS.map(agent => (
                  <div key={agent.address} className="flex justify-between items-center text-xs text-white">
                    <a
                      href={`${KITE_EXPLORER}/address/${agent.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-green-400 flex items-center gap-1"
                    >
                      {agent.name}
                      <ArrowTopRightOnSquareIcon className="h-3 w-3" />
                    </a>
                    <span className="font-mono">
                      {loading ? "..." : `${kiteBalances[agent.address]} KITE`}
                    </span>
                  </div>
                ))}
              </div>

              {/* Payment Flow */}
              <div className="bg-white/10 rounded p-2 mb-2">
                <div className="text-xs font-bold mb-1 text-white">Payment Flow:</div>
                <div className="text-xs space-y-0.5 text-white">
                  <div>💰 Alpha → Audit (0.001 KITE)</div>
                  <div className="text-gray-400">Risk analysis service</div>
                </div>
              </div>

              {/* Recent Transaction */}
              <div className="bg-white/10 rounded p-2">
                <div className="text-xs font-bold mb-1 text-white">Recent TX:</div>
                <a
                  href={`${KITE_EXPLORER}/tx/0x673533bcc22f07572426809066823edd5b362df6342ce8608a6e58750adaa0ed`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs hover:text-green-400 flex items-center gap-1 text-white"
                >
                  Alpha → AuditOracle
                  <ArrowTopRightOnSquareIcon className="h-3 w-3" />
                </a>
                <div className="text-xs text-gray-400">Block: 19,988,818</div>
              </div>
            </div>
          </div>

          {/* HEDERA - Top Right */}
          <div className="card bg-black border border-white shadow-xl">
            <div className="card-body p-4">
              <div className="flex justify-between items-center mb-2">
                <h2 className="card-title text-lg text-white">ℏ Hedera</h2>
                <span className="badge badge-sm bg-white text-black">Governance</span>
              </div>

              {/* HCS Topic */}
              <div className="space-y-1 mb-3">
                <div className="flex justify-between items-center text-xs text-white">
                  <span>HCS Topic:</span>
                  <a
                    href="https://hashscan.io/mainnet/topic/0.0.7987903"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-green-400 flex items-center gap-1 font-mono"
                  >
                    0.0.7987903
                    <ArrowTopRightOnSquareIcon className="h-3 w-3" />
                  </a>
                </div>
                <div className="flex justify-between items-center text-xs text-white">
                  <span>HTS Token:</span>
                  <a
                    href="https://hashscan.io/mainnet/token/0.0.7988233"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-green-400 flex items-center gap-1 font-mono"
                  >
                    0.0.7988233
                    <ArrowTopRightOnSquareIcon className="h-3 w-3" />
                  </a>
                </div>
              </div>

              {/* Purpose */}
              <div className="bg-white/10 rounded p-2 mb-2">
                <div className="text-xs font-bold mb-1 text-white">Purpose:</div>
                <div className="text-xs space-y-0.5 text-white">
                  <div>📨 Agent messaging (HCS)</div>
                  <div>🪙 Internal rewards ($S4D5)</div>
                  <div>🏛️ Council governance</div>
                </div>
              </div>

              {/* Status */}
              <div className="bg-white/10 rounded p-2">
                <div className="text-xs font-bold mb-1 text-white">Status:</div>
                <div className="text-xs text-green-400">✓ Live on Mainnet</div>
              </div>
            </div>
          </div>

          {/* 0G STORAGE - Bottom Left */}
          <div className="card bg-black border border-white shadow-xl">
            <div className="card-body p-4">
              <div className="flex justify-between items-center mb-2">
                <h2 className="card-title text-lg text-white">📦 0G Storage</h2>
                <span className="badge badge-sm bg-white text-black">Audit Trail</span>
              </div>

              {/* Purpose */}
              <div className="bg-white/10 rounded p-2 mb-2">
                <div className="text-xs font-bold mb-1 text-white">Purpose:</div>
                <div className="text-xs space-y-0.5 text-white">
                  <div>📝 Decision audit trail</div>
                  <div>🔗 Returns CID for attestations</div>
                  <div>💾 Immutable storage</div>
                </div>
              </div>

              {/* Workflow */}
              <div className="bg-white/10 rounded p-2 mb-2">
                <div className="text-xs font-bold mb-1 text-white">Workflow:</div>
                <div className="text-xs space-y-0.5 text-white">
                  <div>1. Council decision made</div>
                  <div>2. Upload to 0G → Get CID</div>
                  <div>3. Use CID in Hedera HCS</div>
                </div>
              </div>

              {/* Status */}
              <div className="bg-white/10 rounded p-2">
                <div className="text-xs font-bold mb-1 text-white">Status:</div>
                <div className="text-xs text-green-400">✓ Integrated</div>
              </div>
            </div>
          </div>

          {/* BASE - Bottom Right */}
          <div className="card bg-black border border-white shadow-xl">
            <div className="card-body p-4">
              <div className="flex justify-between items-center mb-2">
                <h2 className="card-title text-lg text-white">🔵 Base</h2>
                <span className="badge badge-sm bg-white text-black">Execution</span>
              </div>

              {/* Smart Contract */}
              <div className="space-y-1 mb-3">
                <div className="flex justify-between items-center text-xs text-white">
                  <span>S4D5Vault:</span>
                  <a
                    href="https://basescan.org/address/0xed8E9E422D4681E177423BCe0Ebaf03BF413a83B"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-green-400 flex items-center gap-1 font-mono text-xs"
                  >
                    0xed8E...a83B
                    <ArrowTopRightOnSquareIcon className="h-3 w-3" />
                  </a>
                </div>
              </div>

              {/* Purpose */}
              <div className="bg-white/10 rounded p-2 mb-2">
                <div className="text-xs font-bold mb-1 text-white">Purpose:</div>
                <div className="text-xs space-y-0.5 text-white">
                  <div>💵 USDC vault for trading</div>
                  <div>📊 Trade execution</div>
                  <div>🔒 Smart contract security</div>
                </div>
              </div>

              {/* Status */}
              <div className="bg-white/10 rounded p-2">
                <div className="text-xs font-bold mb-1 text-white">Status:</div>
                <div className="text-xs text-green-400">✓ Live on Mainnet</div>
                <div className="text-xs text-gray-400 mt-1">
                  <a
                    href="https://s4-d5.vercel.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-green-400"
                  >
                    View Frontend →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Architecture Overview */}
        <div className="card bg-black border border-white shadow-xl mt-6">
          <div className="card-body p-4">
            <h3 className="card-title text-lg mb-2 text-white">Multi-Chain Architecture</h3>
            <div className="text-sm space-y-2 text-white">
              <div className="flex items-center gap-2">
                <span className="badge badge-sm bg-white text-black">Kite AI</span>
                <span>→ Agent payments & identity</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="badge badge-sm bg-white text-black">Hedera</span>
                <span>→ Agent messaging & governance</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="badge badge-sm bg-white text-black">0G</span>
                <span>→ Audit trail storage</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="badge badge-sm bg-white text-black">Base</span>
                <span>→ Trade execution with USDC</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
