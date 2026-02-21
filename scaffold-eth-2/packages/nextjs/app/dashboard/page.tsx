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

interface Transaction {
  hash: string;
  from: string;
  to: string;
  blockNumber: string;
  value: string;
}

export default function Dashboard() {
  const [kiteBalances, setKiteBalances] = useState<{ [key: string]: string }>({});
  const [transactions, setTransactions] = useState<Transaction[]>([]);
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

    const fetchTransactions = async () => {
      try {
        // Fetch latest block
        const blockResponse = await fetch(KITE_RPC, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            method: "eth_blockNumber",
            params: [],
            id: 1,
          }),
        });
        const blockData = await blockResponse.json();
        const latestBlock = parseInt(blockData.result, 16);

        // Fetch last 3 blocks to find transactions
        const txs: Transaction[] = [];
        for (let i = 0; i < 50 && txs.length < 3; i++) {
          const blockNum = latestBlock - i;
          const response = await fetch(KITE_RPC, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              jsonrpc: "2.0",
              method: "eth_getBlockByNumber",
              params: [`0x${blockNum.toString(16)}`, true],
              id: 1,
            }),
          });
          const data = await response.json();
          
          if (data.result && data.result.transactions) {
            // Filter for transactions between our agents
            const agentAddresses = AGENTS.map(a => a.address.toLowerCase());
            const agentTxs = data.result.transactions.filter((tx: any) => 
              agentAddresses.includes(tx.from?.toLowerCase()) && 
              agentAddresses.includes(tx.to?.toLowerCase())
            );
            
            txs.push(...agentTxs.map((tx: any) => ({
              hash: tx.hash,
              from: tx.from,
              to: tx.to,
              blockNumber: data.result.number,
              value: tx.value,
            })));
          }
        }
        
        setTransactions(txs.slice(0, 3));
      } catch (error) {
        console.error("Failed to fetch transactions:", error);
      }
    };

    fetchKiteBalances();
    fetchTransactions();
    
    const balanceInterval = setInterval(fetchKiteBalances, 30000);
    const txInterval = setInterval(fetchTransactions, 15000); // Check for new txs every 15s
    
    return () => {
      clearInterval(balanceInterval);
      clearInterval(txInterval);
    };
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
                <h2 className="card-title text-lg text-white flex items-center gap-2">
                  <span className="text-2xl">🪁</span>
                  <span>Kite AI</span>
                </h2>
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
                <div className="text-xs space-y-1 text-white">
                  <div className="flex items-center gap-1">
                    <span>💰</span>
                    <span>Alpha → Audit (0.001 KITE)</span>
                  </div>
                  <div className="text-gray-400 pl-5">Risk analysis service</div>
                  <div className="flex items-center gap-1">
                    <span>💰</span>
                    <span>Audit → Execution (0.001 KITE)</span>
                  </div>
                  <div className="text-gray-400 pl-5">Trade execution service</div>
                </div>
              </div>

              {/* Recent Transactions */}
              <div className="bg-white/10 rounded p-2">
                <div className="text-xs font-bold mb-1 text-white">Recent Transactions:</div>
                {transactions.length === 0 ? (
                  <div className="text-xs text-gray-400">Loading transactions...</div>
                ) : (
                  <div className="space-y-1">
                    {transactions.map((tx, idx) => {
                      const fromAgent = AGENTS.find(a => a.address.toLowerCase() === tx.from.toLowerCase());
                      const toAgent = AGENTS.find(a => a.address.toLowerCase() === tx.to.toLowerCase());
                      const fromName = fromAgent?.name.split(' ')[0] || 'Unknown';
                      const toName = toAgent?.name.split(' ')[0] || 'Unknown';
                      const blockNum = parseInt(tx.blockNumber, 16);
                      
                      return (
                        <a
                          key={tx.hash}
                          href={`${KITE_EXPLORER}/tx/${tx.hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs hover:text-green-400 flex items-center justify-between text-white"
                        >
                          <span>{fromName} → {toName}</span>
                          <ArrowTopRightOnSquareIcon className="h-3 w-3" />
                        </a>
                      );
                    })}
                  </div>
                )}
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
