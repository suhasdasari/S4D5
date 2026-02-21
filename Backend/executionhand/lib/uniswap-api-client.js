/**
 * UniswapAPIClient - Handle HTTP communication with Uniswap API
 */
const axios = require('axios');

class UniswapAPIClient {
  constructor(config, circuitBreaker, metricsCollector) {
    this.config = config;
    this.circuitBreaker = circuitBreaker;
    this.metricsCollector = metricsCollector;
    
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: 10000,
      headers: {
        'x-api-key': config.apiKey,
        'Content-Type': 'application/json'
      }
    });
  }

  async getQuote(params) {
    const startTime = Date.now();
    const endpoint = '/quote';
    
    try {
      const response = await this.retryRequest(() =>
        this.client.post(endpoint, {
          tokenIn: params.tokenIn,
          tokenOut: params.tokenOut,
          tokenInChainId: this.config.chainId,
          tokenOutChainId: this.config.chainId,
          amount: params.amount,
          type: 'EXACT_INPUT',
          swapper: params.swapper,
          slippageTolerance: params.slippage || '0.5'
        })
      );

      const latency = Date.now() - startTime;
      this.metricsCollector.recordAPIRequest(endpoint, latency, true, response.status);

      // Parse the new API response format
      const quote = response.data.quote;
      const routing = response.data.routing;
      
      // Extract output amount from aggregatedOutputs
      const outputAmount = quote.aggregatedOutputs?.[0]?.amount || '0';
      
      return {
        quoteId: quote.quoteId,
        expectedOutput: outputAmount,
        route: routing || [],
        gasEstimate: quote.classicGasUseEstimateUSD || '200000',
        priceImpact: '0', // Not provided in new API
        timestamp: Date.now(),
        rawQuote: quote // Store the full quote for swap endpoint
      };
    } catch (error) {
      const latency = Date.now() - startTime;
      this.metricsCollector.recordAPIRequest(endpoint, latency, false, error.response?.status);
      throw new Error(`Quote fetch failed: ${error.message}`);
    }
  }

  async getSwapCalldata(params) {
    const startTime = Date.now();
    const endpoint = '/swap';
    
    try {
      const response = await this.retryRequest(() =>
        this.client.post(endpoint, {
          quote: params.rawQuote, // Pass the full quote object
          simulateTransaction: false,
          includeGasInfo: true
        })
      );

      const latency = Date.now() - startTime;
      this.metricsCollector.recordAPIRequest(endpoint, latency, true, response.status);

      return {
        calldata: response.data.calldata,
        to: response.data.to,
        value: response.data.value || '0',
        gasLimit: response.data.gasLimit || '300000',
        quoteId: params.rawQuote.quoteId
      };
    } catch (error) {
      const latency = Date.now() - startTime;
      this.metricsCollector.recordAPIRequest(endpoint, latency, false, error.response?.status);
      throw new Error(`Swap calldata generation failed: ${error.message}`);
    }
  }

  async retryRequest(requestFn) {
    let lastError;
    const maxRetries = 3;
    const initialDelay = 1000;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error;
        const statusCode = error.response?.status;

        // Don't retry on client errors
        if (statusCode && statusCode >= 400 && statusCode < 500 && statusCode !== 429) {
          throw error;
        }

        // Don't retry on last attempt
        if (attempt === maxRetries) {
          break;
        }

        // Exponential backoff
        const delay = Math.min(initialDelay * Math.pow(2, attempt), 8000);
        console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  async healthCheck() {
    try {
      const startTime = Date.now();
      await this.client.get('/health');
      return { healthy: true, latency: Date.now() - startTime };
    } catch (error) {
      return { healthy: false, latency: 0, error: error.message };
    }
  }
}

module.exports = UniswapAPIClient;
