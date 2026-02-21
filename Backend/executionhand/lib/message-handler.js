/**
 * ExecutionHandMessageHandler - Orchestrate quote-to-execution flow
 */
class ExecutionHandMessageHandler {
  constructor(quoteService, swapExecutor, nerveCord, config, circuitBreaker, metricsCollector) {
    this.quoteService = quoteService;
    this.swapExecutor = swapExecutor;
    this.nerveCord = nerveCord;
    this.config = config;
    this.circuitBreaker = circuitBreaker;
    this.metricsCollector = metricsCollector;
  }

  async handleApprovedProposal(message) {
    const startTime = Date.now();

    try {
      // 1. Check feature flag
      if (!this.config.features?.uniswapEnabled) {
        console.log('Uniswap feature disabled, using legacy flow');
        return { success: false, error: 'Uniswap feature disabled' };
      }

      // 2. Check circuit breaker
      if (this.circuitBreaker.isOpen()) {
        console.warn('Circuit breaker open, rejecting trade');
        return { success: false, error: 'Circuit breaker active' };
      }

      // 3. Parse proposal
      const proposal = {
        proposalId: message.proposalId,
        tokenIn: message.data.tokenIn,
        tokenOut: message.data.tokenOut,
        amountIn: message.data.amountIn,
        minAmountOut: message.data.minAmountOut || '0'
      };

      console.log('Processing approved proposal', { proposalId: proposal.proposalId });

      // 4. Fetch quote
      const quoteResult = await this.quoteService.getQuote(proposal);
      if (!quoteResult.valid) {
        console.warn('Quote validation failed', {
          proposalId: proposal.proposalId,
          reason: quoteResult.reason
        });
        return { success: false, error: quoteResult.reason };
      }

      // 5. Execute swap
      const result = await this.swapExecutor.executeSwap(quoteResult.quote, proposal);

      // 6. Record circuit breaker state
      if (result.success) {
        this.circuitBreaker.recordSuccess();
      } else {
        this.circuitBreaker.recordFailure(result.error);
      }

      return result;
    } catch (error) {
      console.error('Unexpected error in message handler', { error: error.message });
      this.circuitBreaker.recordFailure(error.message);
      return { success: false, error: error.message };
    }
  }

  async start() {
    console.log('ExecutionHand message handler started');
    // In production, this would listen to Nerve Cord
  }

  async stop() {
    console.log('ExecutionHand message handler stopped');
    // In production, this would disconnect from Nerve Cord
  }
}

module.exports = ExecutionHandMessageHandler;
