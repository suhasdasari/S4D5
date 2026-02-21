#!/usr/bin/env node

/**
 * Test Swap Script - Execute a real swap on Base mainnet
 * 
 * This script demonstrates a complete swap execution using the Uniswap API integration.
 * It will swap $1 USDC to SHIB
 * 
 * Usage:
 *   node scripts/test-swap.js
 * 
 * Environment variables required:
 *   UNISWAP_API_KEY - Your Uniswap API key
 *   BASE_RPC_URL - Base network RPC URL
 *   SHIB_TOKEN_ADDRESS - SHIB token address on Base
 */

require('dotenv').config();
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Import components
const ConfigManager = require('../lib/config-manager');
const UniswapAPIClient = require('../lib/uniswap-api-client');
const QuoteService = require('../lib/quote-service');
const SwapExecutor = require('../lib/swap-executor');
const CircuitBreaker = require('../lib/circuit-breaker');
const MetricsCollector = require('../lib/metrics-collector');
const ExecutionHandMessageHandler = require('../lib/message-handler');

// Vault ABI
const VAULT_ABI = [
  'function executeTrade(address tokenIn, address tokenOut, uint256 amountIn, uint256 minAmountOut, address dexRouter, bytes calldata swapCalldata) external returns (uint256)',
  'function isBotAuthorized(address botWallet) external view returns (bool)',
  'function isDexRouterWhitelisted(address dexRouter) external view returns (bool)',
  'function isTokenWhitelisted(address token) external view returns (bool)',
  'function getTokenBalance(address token) external view returns (uint256)',
  'function owner() external view returns (address)'
];

// Token addresses on Base
const TOKENS = {
  USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  WETH: '0x4200000000000000000000000000000000000006'
};

// Get SHIB address from environment
const SHIB_ADDRESS = process.env.SHIB_TOKEN_ADDRESS;

async function main() {
  console.log('\n' + '='.repeat(80));
  console.log('🔄 Test Swap Execution - Uniswap API Integration');
  console.log('='.repeat(80) + '\n');

  try {
    // Step 1: Load configuration
    console.log('📋 Step 1: Loading configuration...');
    const configManager = new ConfigManager();
    const config = configManager.load();
    console.log('✅ Configuration loaded');
    console.log(`   Vault: ${config.network.vaultAddress}`);
    console.log(`   Chain ID: ${config.network.chainId}`);
    console.log(`   Slippage: ${config.trading.slippageTolerance}%\n`);

    // Step 2: Connect to blockchain
    console.log('🔗 Step 2: Connecting to Base network...');
    const provider = new ethers.JsonRpcProvider(config.network.rpcUrl);
    
    // Load wallet from config/wallet.json (created by init-wallet.js)
    const walletPath = path.join(__dirname, '../config/wallet.json');
    
    if (!fs.existsSync(walletPath)) {
      console.error('❌ Wallet not found!');
      console.log('   Run: node scripts/init-wallet.js first\n');
      process.exit(1);
    }
    
    const walletConfig = JSON.parse(fs.readFileSync(walletPath, 'utf8'));
    const wallet = new ethers.Wallet(walletConfig.privateKey, provider);
    const vaultContract = new ethers.Contract(config.network.vaultAddress, VAULT_ABI, wallet);
    
    const blockNumber = await provider.getBlockNumber();
    const balance = await provider.getBalance(wallet.address);
    
    console.log('✅ Connected to Base');
    console.log(`   Block: ${blockNumber}`);
    console.log(`   Wallet: ${wallet.address}`);
    console.log(`   ETH Balance: ${ethers.formatEther(balance)}\n`);

    // Check SHIB address
    if (!SHIB_ADDRESS || SHIB_ADDRESS === '0x0000000000000000000000000000000000000000') {
      console.error('❌ SHIB token address not configured!');
      console.log('   Please set SHIB_TOKEN_ADDRESS in your .env file');
      console.log('   Example: SHIB_TOKEN_ADDRESS=0x...\n');
      process.exit(1);
    }

    // Step 3: Verify vault permissions
    console.log('🔐 Step 3: Verifying vault permissions...');
    const isAuthorized = await vaultContract.isBotAuthorized(wallet.address);
    const isRouterWhitelisted = await vaultContract.isDexRouterWhitelisted(config.network.uniswapRouter);
    const isUSDCWhitelisted = await vaultContract.isTokenWhitelisted(TOKENS.USDC);
    const isSHIBWhitelisted = await vaultContract.isTokenWhitelisted(SHIB_ADDRESS);
    
    console.log(`   Bot authorized: ${isAuthorized ? '✅' : '❌'}`);
    console.log(`   Router whitelisted: ${isRouterWhitelisted ? '✅' : '❌'}`);
    console.log(`   USDC whitelisted: ${isUSDCWhitelisted ? '✅' : '❌'}`);
    console.log(`   SHIB whitelisted: ${isSHIBWhitelisted ? '✅' : '❌'}`);
    
    if (!isAuthorized || !isRouterWhitelisted || !isUSDCWhitelisted || !isSHIBWhitelisted) {
      console.error('\n❌ Vault permissions not set up correctly!');
      console.log('   Run: node scripts/setup-vault-permissions.js\n');
      process.exit(1);
    }
    console.log('✅ All permissions verified\n');

    // Step 4: Check vault balances
    console.log('💰 Step 4: Checking vault balances...');
    const usdcBalance = await vaultContract.getTokenBalance(TOKENS.USDC);
    
    let shibBalance = 0n;
    try {
      shibBalance = await vaultContract.getTokenBalance(SHIB_ADDRESS);
    } catch (error) {
      console.log('   Note: Could not check SHIB balance (vault may not have SHIB yet)');
    }
    
    console.log(`   USDC: ${ethers.formatUnits(usdcBalance, 6)}`);
    console.log(`   SHIB: ${shibBalance.toString()}\n`);
    
    if (usdcBalance === 0n) {
      console.error('❌ Vault has no USDC balance!');
      console.log('   Please deposit USDC to the vault first.\n');
      process.exit(1);
    }
    
    if (usdcBalance < ethers.parseUnits('1', 6)) {
      console.warn('⚠️  Vault has less than $1 USDC');
      console.log('   Swap may fail due to insufficient balance.\n');
    }

    // Step 5: Initialize components
    console.log('⚙️  Step 5: Initializing components...');
    const metricsCollector = new MetricsCollector();
    const circuitBreaker = new CircuitBreaker(configManager.getCircuitBreakerConfig());
    const uniswapClient = new UniswapAPIClient(
      configManager.getUniswapConfig(),
      circuitBreaker,
      metricsCollector
    );
    const quoteService = new QuoteService(
      uniswapClient,
      configManager.getTradingConfig(),
      metricsCollector
    );
    const swapExecutor = new SwapExecutor(
      uniswapClient,
      vaultContract,
      configManager.getTradingConfig(),
      metricsCollector
    );
    const messageHandler = new ExecutionHandMessageHandler(
      quoteService,
      swapExecutor,
      null, // No Nerve Cord for this test
      config,
      circuitBreaker,
      metricsCollector
    );
    console.log('✅ All components initialized\n');

    // Step 6: Create test proposal
    console.log('📝 Step 6: Creating test swap proposal...');
    const swapAmount = ethers.parseUnits('1', 6); // 1 USDC ($1)
    const proposal = {
      proposalId: 'test-swap-' + Date.now(),
      timestamp: new Date().toISOString(),
      data: {
        tokenIn: TOKENS.USDC,
        tokenOut: SHIB_ADDRESS,
        amountIn: swapAmount.toString(),
        minAmountOut: '0', // Will be calculated from quote
        strategy: 'uniswap_optimal_routing'
      }
    };
    
    console.log(`   Proposal ID: ${proposal.proposalId}`);
    console.log(`   Token In: USDC (${TOKENS.USDC})`);
    console.log(`   Token Out: SHIB (${SHIB_ADDRESS})`);
    console.log(`   Amount In: ${ethers.formatUnits(swapAmount, 6)} USDC ($1)\n`);

    // Step 7: Execute swap
    console.log('🚀 Step 7: Executing swap...');
    console.log('   This may take 30-60 seconds...\n');
    
    const result = await messageHandler.handleApprovedProposal(proposal);
    
    if (result.success) {
      console.log('✅ SWAP SUCCESSFUL!\n');
      console.log('   Transaction Details:');
      console.log(`   📝 TX Hash: ${result.txHash}`);
      console.log(`   🔗 View on BaseScan: https://basescan.org/tx/${result.txHash}`);
      console.log(`   💰 Output: ${result.actualOutput || '0'} SHIB`);
      console.log(`   📊 Slippage: ${result.slippage || 'N/A'}%`);
      console.log(`   ⛽ Gas Used: ${result.gasUsed || 'N/A'}\n`);
    } else {
      console.log('❌ SWAP FAILED\n');
      console.log(`   Error: ${result.error}\n`);
      
      if (circuitBreaker.isOpen()) {
        console.log('⚠️  Circuit breaker is now OPEN - trading paused');
        const state = circuitBreaker.getState();
        console.log(`   Failures: ${state.failureCount}/${config.circuitBreaker.failureThreshold}`);
        console.log(`   Will reset in: ${config.circuitBreaker.resetTimeout}s\n`);
      }
    }

    // Step 8: Display metrics
    console.log('📊 Step 8: Metrics Summary');
    console.log('-'.repeat(80));
    const metrics = metricsCollector.getMetrics();
    
    console.log('\nAPI Requests:');
    console.log(`   Total: ${metrics.apiRequests.total}`);
    console.log(`   Success: ${metrics.apiRequests.success}`);
    console.log(`   Failed: ${metrics.apiRequests.failure}`);
    
    console.log('\nQuotes:');
    console.log(`   Total: ${metrics.quotes.total}`);
    console.log(`   Valid: ${metrics.quotes.valid}`);
    console.log(`   Invalid: ${metrics.quotes.invalid}`);
    
    console.log('\nSwaps:');
    console.log(`   Total: ${metrics.swaps.total}`);
    console.log(`   Success: ${metrics.swaps.success}`);
    console.log(`   Failed: ${metrics.swaps.failure}`);
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ Test completed!');
    console.log('='.repeat(80) + '\n');

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = { main };
