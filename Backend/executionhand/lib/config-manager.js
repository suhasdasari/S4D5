/**
 * ConfigManager - Load and validate configuration from environment
 */
class ConfigManager {
  constructor() {
    this.config = null;
  }

  load() {
    this.config = {
      uniswap: {
        apiKey: process.env.UNISWAP_API_KEY,
        baseUrl: process.env.UNISWAP_API_BASE_URL || 'https://api.uniswap.org/v2',
        chainId: 8453 // Base mainnet
      },
      network: {
        rpcUrl: process.env.BASE_RPC_URL,
        chainId: 8453,
        vaultAddress: process.env.VAULT_ADDRESS || '0xed8E9E422D4681E177423BCe0Ebaf03BF413a83B',
        executionHandAddress: process.env.EXECUTION_HAND_ADDRESS || '0x7a41a15474bC6F534Be1D5F898A44C533De68A91',
        uniswapRouter: process.env.UNISWAP_ROUTER || '0x2626664c2603336E57B271c5C0b26F421741e481'
      },
      trading: {
        slippageTolerance: parseFloat(process.env.SLIPPAGE_TOLERANCE || '0.5'),
        maxTradeSize: process.env.MAX_TRADE_SIZE_USDC || '10000',
        quoteCacheDuration: parseInt(process.env.QUOTE_CACHE_DURATION || '30')
      },
      retry: {
        maxRetries: parseInt(process.env.MAX_RETRIES || '3'),
        initialDelay: parseInt(process.env.RETRY_INITIAL_DELAY || '1000'),
        maxDelay: parseInt(process.env.RETRY_MAX_DELAY || '8000')
      },
      circuitBreaker: {
        failureThreshold: parseInt(process.env.CIRCUIT_BREAKER_THRESHOLD || '3'),
        timeWindow: parseInt(process.env.CIRCUIT_BREAKER_WINDOW || '300'),
        resetTimeout: parseInt(process.env.CIRCUIT_BREAKER_RESET || '60')
      },
      features: {
        uniswapEnabled: process.env.UNISWAP_FEATURE_ENABLED !== 'false'
      }
    };

    this.validate();
    return this.config;
  }

  validate() {
    if (!this.config.uniswap.apiKey) {
      throw new Error('UNISWAP_API_KEY is required');
    }
    if (!this.config.network.rpcUrl) {
      throw new Error('BASE_RPC_URL is required');
    }
  }

  getUniswapConfig() {
    return this.config.uniswap;
  }

  getNetworkConfig() {
    return this.config.network;
  }

  getTradingConfig() {
    return this.config.trading;
  }

  getRetryConfig() {
    return this.config.retry;
  }

  getCircuitBreakerConfig() {
    return this.config.circuitBreaker;
  }
}

module.exports = ConfigManager;
