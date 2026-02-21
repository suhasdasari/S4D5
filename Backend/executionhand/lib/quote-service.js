/**
 * QuoteService - Fetch and validate swap quotes
 */
class QuoteService {
  constructor(apiClient, config, metricsCollector) {
    this.apiClient = apiClient;
    this.config = config;
    this.metricsCollector = metricsCollector;
    this.quoteCache = new Map();
  }

  async getQuote(proposal, swapperAddress) {
    try {
      // Check cache first
      const cacheKey = this.getCacheKey(proposal);
      const cachedQuote = this.quoteCache.get(cacheKey);
      
      if (cachedQuote && this.isQuoteValid(cachedQuote)) {
        console.log('Using cached quote');
        return { quote: cachedQuote, valid: true };
      }

      // Fetch new quote
      const quote = await this.apiClient.getQuote({
        tokenIn: proposal.tokenIn,
        tokenOut: proposal.tokenOut,
        amount: proposal.amountIn,
        slippage: this.config.slippageTolerance,
        swapper: swapperAddress
      });

      // Validate quote
      const validation = this.validateQuote(quote, proposal);
      
      if (validation.valid) {
        // Cache the quote
        this.quoteCache.set(cacheKey, quote);
        this.metricsCollector.recordQuoteValidation(true);
      } else {
        this.metricsCollector.recordQuoteValidation(false, validation.reason);
      }

      return { quote, ...validation };
    } catch (error) {
      this.metricsCollector.recordQuoteValidation(false, 'fetch_error');
      return { quote: null, valid: false, reason: error.message };
    }
  }

  validateQuote(quote, proposal) {
    // Check expiration (30 seconds)
    const age = Date.now() - quote.timestamp;
    if (age > this.config.quoteCacheDuration * 1000) {
      return { valid: false, reason: 'Quote expired' };
    }

    // Check minimum output
    if (proposal.minAmountOut && proposal.minAmountOut !== '0') {
      if (BigInt(quote.expectedOutput) < BigInt(proposal.minAmountOut)) {
        return {
          valid: false,
          reason: `Output ${quote.expectedOutput} below minimum ${proposal.minAmountOut}`
        };
      }
    }

    // Check gas estimate
    if (parseInt(quote.gasEstimate) > 500000) {
      return { valid: false, reason: 'Gas estimate too high' };
    }

    // Check price impact
    if (parseFloat(quote.priceImpact) > 5.0) {
      return { valid: false, reason: 'Price impact too high' };
    }

    return { valid: true };
  }

  isQuoteValid(quote) {
    const age = Date.now() - quote.timestamp;
    return age < this.config.quoteCacheDuration * 1000;
  }

  getCacheKey(proposal) {
    return `${proposal.tokenIn}-${proposal.tokenOut}-${proposal.amountIn}-${this.config.slippageTolerance}`;
  }

  clearExpiredQuotes() {
    const now = Date.now();
    for (const [key, quote] of this.quoteCache.entries()) {
      if (now - quote.timestamp > this.config.quoteCacheDuration * 1000) {
        this.quoteCache.delete(key);
      }
    }
  }
}

module.exports = QuoteService;
