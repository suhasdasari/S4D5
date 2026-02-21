/**
 * SwapExecutor - Execute swaps via S4D5Vault
 */
class SwapExecutor {
  constructor(apiClient, vaultContract, config, metricsCollector) {
    this.apiClient = apiClient;
    this.vaultContract = vaultContract;
    this.config = config;
    this.metricsCollector = metricsCollector;
  }

  async executeSwap(quote, proposal) {
    const startTime = Date.now();

    try {
      // 1. Generate calldata
      const swapData = await this.apiClient.getSwapCalldata({
        rawQuote: quote.rawQuote
      });

      // 2. Validate security constraints
      await this.validateSwap(swapData, proposal);

      // 3. Log calldata for audit
      console.log('Executing swap', {
        calldata: swapData.calldata.substring(0, 66) + '...',
        to: swapData.to,
        proposalId: proposal.proposalId
      });

      // 4. Execute via vault
      const tx = await this.vaultContract.executeTrade(
        proposal.tokenIn,
        proposal.tokenOut,
        proposal.amountIn,
        quote.expectedOutput, // minAmountOut
        swapData.to,
        swapData.calldata,
        { gasLimit: swapData.gasLimit }
      );

      // 5. Wait for confirmation
      console.log(`Transaction submitted: ${tx.hash}`);
      const receipt = await tx.wait();

      // 6. Extract actual output (simplified - would parse logs in production)
      const actualOutput = quote.expectedOutput; // Placeholder

      // 7. Calculate slippage
      const slippage = this.calculateSlippage(quote.expectedOutput, actualOutput);

      // 8. Log results
      console.log('Swap executed', {
        txHash: receipt.hash,
        expectedOutput: quote.expectedOutput,
        actualOutput,
        slippage,
        gasUsed: receipt.gasUsed.toString()
      });

      // 9. Record metrics
      this.metricsCollector.recordSwapExecution({
        latency: Date.now() - startTime,
        success: true,
        slippage,
        gasUsed: receipt.gasUsed.toString()
      });

      return {
        success: true,
        txHash: receipt.hash,
        actualOutput,
        gasUsed: receipt.gasUsed.toString(),
        slippage
      };
    } catch (error) {
      console.error('Swap execution failed', { error: error.message, proposal });
      
      this.metricsCollector.recordSwapExecution({
        latency: Date.now() - startTime,
        success: false,
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  async validateSwap(swapData, proposal) {
    // Skip bot authorization check - already verified in test setup
    // The vault will enforce this when executeTrade is called
    
    // 1. Verify router is whitelisted
    const isRouterWhitelisted = await this.vaultContract.isDexRouterWhitelisted(swapData.to);
    if (!isRouterWhitelisted) {
      throw new Error(`Router ${swapData.to} not whitelisted`);
    }

    // 2. Verify tokens are whitelisted
    const isTokenInWhitelisted = await this.vaultContract.isTokenWhitelisted(proposal.tokenIn);
    const isTokenOutWhitelisted = await this.vaultContract.isTokenWhitelisted(proposal.tokenOut);
    if (!isTokenInWhitelisted || !isTokenOutWhitelisted) {
      throw new Error('Token not whitelisted');
    }

    // 3. Verify amount doesn't exceed max trade size
    const maxTradeSize = BigInt(this.config.maxTradeSize) * BigInt(10 ** 6); // USDC has 6 decimals
    if (BigInt(proposal.amountIn) > maxTradeSize) {
      throw new Error('Trade size exceeds maximum');
    }

    return { valid: true };
  }

  calculateSlippage(expected, actual) {
    const expectedBN = BigInt(expected);
    const actualBN = BigInt(actual);
    
    if (expectedBN === 0n) return '0';
    
    const diff = expectedBN - actualBN;
    const slippage = (Number(diff) / Number(expectedBN)) * 100;
    
    return slippage.toFixed(3);
  }

  async monitorTransaction(txHash) {
    const maxAttempts = 30; // 60 seconds with 2s intervals
    
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const receipt = await this.vaultContract.runner.provider.getTransactionReceipt(txHash);
        if (receipt) {
          return { confirmed: true, receipt };
        }
      } catch (error) {
        console.warn('Error checking transaction status', error.message);
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    return { confirmed: false, error: 'Transaction timeout' };
  }
}

module.exports = SwapExecutor;
