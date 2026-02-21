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
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async getQuote(params) {
    const startTime = Date.now();
    const endpoint = '/quote';
    
    try {
      const response = await this.retryRequest(() =>
        this.client.get(endpoint, {
          params: {
            chainId: this.config.chainId,
            tokenIn: params.tokenIn,
            tokenOut: params.tokenOut,
            amount: params.amount,
            slippageTolerance: params.slippage || '0.5',
            type: 'exactIn'
          }
        })
      );

      const latency = Date.now() - startTime;
      this.metricsCollector.recordAPIRequest(endpoint, latency, true, response.status);

      return {
        quoteId: response.data.quoteId,
        expectedOutput: response.data.amountOut,
        route: response.data.route || [],
        gasEstimate: response.data.gasEstimate || '200000',
        priceImpact: response.data.priceImpact || '0',
        timestamp: Date.now()
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
          quoteId: params.quoteId,
          slippageTolerance: params.slippage || '0.5',
          recipient: params.recipient,
          deadline: Math.floor(Date.now() / 1000) + 1200 // 20 minutes
        })
      );

      const latency = Date.now() - startTime;
      this.metricsCollector.recordAPIRequest(endpoint, latency, true, response.status);

      return {
        calldata: response.data.calldata,
        to: response.data.to,
        value: response.data.value || '0',
        gasLimit: response.data.gasLimit || '300000',
        quoteId: params.quoteId
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
