"use client";

import { useEffect, useState } from "react";
import { formatEther } from "viem";
import { ExternalLinkIcon } from "@heroicons/react/24/outline";

type AgentBalance = {
  name: string;
  address: string;
  balance: string;
  loading: boolean;
};

type Payment = {
  hash: string;
  from: string;
  to: string;
  value: string;
  timestamp: number;
  blockNumber: number;
};

const AGENTS = [
  {
    name: "Alpha Strategist",
    address: "0xBe76B29B0ccEe48f77C02Cb6289E1Cea5579EDD5",
    role: "Market Analysis",
  },
  {
    name: "AuditOracle",
    address: "0xF3bbD5682e671CdcDC42f52bDdecCB6a35D53aE1",
    role: "Risk Assessment",
  },
  {
    name: "ExecutionHand",
    address: "0x7a41a15474bC6F534Be1D5F898A44C533De68A91",
    role: "Trade Execution",
  },
];

const KITE_RPC = "https://rpc-testnet.gokite.ai/";
const KITE_EXPLORER = "https://testnet.kitescan.ai";

export default function KiteDashboard() {
  const [balances, setBalances] = useState<AgentBalance[]>(
    AGENTS.map(agent => ({
      name: agent.name,
      address: agent.address,
      balance: "0",
      loading: true,
    }))
  );
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(true);

  useEffect(() => {
    // Fetch balances for all agents
    const fetchBalances = async () => {
      const updatedBalances = await Promise.all(
        AGENTS.map(async agent => {
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
            const balanceEth = formatEther(balanceWei);

            return {
              name: agent.name,
              address: agent.address,
              balance: parseFloat(balanceEth).toFixed(4),
              loading: false,
            };
          } catch (error) {
            console.error(`Error fetching balance for ${agent.name}:`, error);
            return {
              name: agent.name,
              address: agent.address,
              balance: "Error",
              loading: false,
            };
          }
        })
      );
      setBalances(updatedBalances);
    };

    fetchBalances();
    const interval = setInterval(fetchBalances, 30000); // Refresh every 30s

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Fetch recent transactions (mock data for now - would need Kite API)
    const mockPayments: Payment[] = [
      {
        hash: "0x673533bcc22f07572426809066823edd5b362df6342ce8608a6e58750adaa0ed",
        from: AGENTS[0].address,
        to: AGENTS[1].address,
        value: "0.001",
        timestamp: Date.now() - 3600000,
        blockNumber: 19988818,
      },
    ];
    setPayments(mockPayments);
    setLoadingPayments(false);
  }, []);

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getAgentName = (address: string) => {
    const agent = AGENTS.find(a => a.address.toLowerCase() === address.toLowerCase());
    return agent ? agent.name : shortenAddress(address);
  };

  return (
    <div className="flex items-center flex-col flex-grow pt-10">
      <div className="px-5 w-full max-w-7xl">
        <h1 className="text-center mb-8">
          <span className="block text-4xl font-bold">Kite AI Dashboard</span>
          <span className="block text-2xl mt-2 text-gray-400">Agent x402 Micropayments</span>
        </h1>

        {/* Agent Balances */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Agent Wallet Balances</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {balances.map((agent, index) => (
              <div key={agent.address} className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <h3 className="card-title text-lg">{agent.name}</h3>
                  <p className="text-sm text-gray-400">{AGENTS[index].role}</p>
                  <div className="divider my-2"></div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Balance:</span>
                    {agent.loading ? (
                      <span className="loading loading-spinner loading-sm"></span>
                    ) : (
                      <span className="text-xl font-bold text-primary">{agent.balance} KITE</span>
                    )}
                  </div>
                  <div className="mt-2">
                    <a
                      href={`${KITE_EXPLORER}/address/${agent.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-outline btn-primary w-full"
                    >
                      View on Explorer
                      <ExternalLinkIcon className="h-4 w-4 ml-1" />
                    </a>
                  </div>
                  <div className="text-xs text-gray-500 mt-2 break-all">{agent.address}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Payments */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Recent x402 Payments</h2>
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              {loadingPayments ? (
                <div className="flex justify-center py-8">
                  <span className="loading loading-spinner loading-lg"></span>
                </div>
              ) : payments.length === 0 ? (
                <div className="text-center py-8 text-gray-400">No recent payments</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table table-zebra w-full">
                    <thead>
                      <tr>
                        <th>From</th>
                        <th>To</th>
                        <th>Amount</th>
                        <th>Block</th>
                        <th>Transaction</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map(payment => (
                        <tr key={payment.hash}>
                          <td>
                            <div className="font-bold">{getAgentName(payment.from)}</div>
                            <div className="text-xs text-gray-500">{shortenAddress(payment.from)}</div>
                          </td>
                          <td>
                            <div className="font-bold">{getAgentName(payment.to)}</div>
                            <div className="text-xs text-gray-500">{shortenAddress(payment.to)}</div>
                          </td>
                          <td>
                            <span className="badge badge-primary">{payment.value} KITE</span>
                          </td>
                          <td>{payment.blockNumber.toLocaleString()}</td>
                          <td>
                            <a
                              href={`${KITE_EXPLORER}/tx/${payment.hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-xs btn-ghost"
                            >
                              {shortenAddress(payment.hash)}
                              <ExternalLinkIcon className="h-3 w-3 ml-1" />
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h3 className="card-title">About x402 Payments</h3>
              <p className="text-sm">
                x402 is Kite AI's protocol for agent-to-agent micropayments. Each service call triggers an automatic
                payment on-chain with full transparency.
              </p>
              <div className="mt-4">
                <div className="text-sm font-bold mb-2">Payment Flow:</div>
                <ul className="text-xs space-y-1">
                  <li>• Alpha Strategist → AuditOracle (0.001 KITE for risk analysis)</li>
                  <li>• AuditOracle → ExecutionHand (0.001 KITE for trade execution)</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h3 className="card-title">Kite AI Resources</h3>
              <div className="space-y-2">
                <a
                  href="https://docs.gokite.ai/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-outline w-full"
                >
                  Documentation
                  <ExternalLinkIcon className="h-4 w-4 ml-1" />
                </a>
                <a
                  href="https://faucet.gokite.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-outline w-full"
                >
                  Testnet Faucet
                  <ExternalLinkIcon className="h-4 w-4 ml-1" />
                </a>
                <a
                  href={KITE_EXPLORER}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-outline w-full"
                >
                  Block Explorer
                  <ExternalLinkIcon className="h-4 w-4 ml-1" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
