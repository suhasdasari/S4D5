/**
 * Market Data Fetcher
 * Fetches real-time market data from Railway webhook
 * Handles retries, validation, and caching
 */

const fetch = require('node-fetch');

class MarketDataFetcher {
  constructor(webhookUrl, options = {}) {
    this.webhookUrl = webhookUrl;
    this.maxRetries = options.maxRetries || 3;
    this.baseDelay = options.baseDelay || 1000; // 1 second
    this.timeout = options.timeout || 5000; // 5 seconds
    this.cache = null;
    this.cacheTimestamp = null;
    this.cacheMaxAge = options.cacheMaxAge || 60000; // 1 minute
  }

  /**
   * Fetch market data with retry logic
   */
  async fetchData() {
    return await this.fetchWithRetry();
  }

  /**
   * Fetch with exponential backoff retry
   */
  async fetchWithRetry() {
    let lastError = null;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`[Fetcher] Attempt ${attempt}/${this.maxRetries}: Fetching market data...`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        
        const response = await fetch(this.webhookUrl, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json'
          }
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const rawData = await response.json();
        const parsedData = this.parseData(rawData);
        
        // Update cache
        this.cache = parsedData;
        this.cacheTimestamp = Date.now();
        
        console.log(`[Fetcher] ✓ Data fetched successfully`);
        return parsedData;
        
      } catch (error) {
        lastError = error;
        console.error(`[Fetcher] ✗ Attempt ${attempt} failed: ${error.message}`);
        
        // If this was the last attempt, try cache fallback
        if (attempt === this.maxRetries) {
          return this.getCachedData();
        }
        
        // Exponential backoff
        const delay = this.baseDelay * Math.pow(2, attempt - 1);
        console.log(`[Fetcher] Retrying in ${delay}ms...`);
        await this.sleep(delay);
      }
    }
    
    // Should not reach here, but just in case
    throw lastError || new Error('Failed to fetch market data');
  }

  /**
   * Parse raw webhook data into structured format
   */
  parseData(rawData) {
    try {
      // Validate required fields
      if (!rawData || typeof rawData !== 'object') {
        throw new Error('Invalid data format: expected object');
      }
      
      if (!rawData.stats || !rawData.BTC || !rawData.ETH) {
        throw new Error('Missing required fields: stats, BTC, or ETH');
      }
      
      // Extract and validate BTC data
      const btcData = this.extractAssetData('BTC', rawData.BTC);
      
      // Extract and validate ETH data
      const ethData = this.extractAssetData('ETH', rawData.ETH);
      
      // Build structured response
      const parsed = {
        timestamp: new Date().toISOString(),
        totalTrades: this.validateNumber(rawData.stats.totalTrades, 'totalTrades'),
        assets: {
          BTC: btcData,
          ETH: ethData
        }
      };
      
      console.log(`[Fetcher] Parsed: ${parsed.totalTrades} trades (BTC: ${btcData.tradeCount}, ETH: ${ethData.tradeCount})`);
      
      return parsed;
      
    } catch (error) {
      console.error(`[Fetcher] Parse error: ${error.message}`);
      throw new Error(`Data parsing failed: ${error.message}`);
    }
  }

  /**
   * Extract and validate asset-specific data
   */
  extractAssetData(asset, data) {
    if (!data || !data.metrics) {
      throw new Error(`Missing metrics for ${asset}`);
    }
    
    const metrics = data.metrics;
    
    return {
      price: this.validateNumber(metrics.averagePrice, `${asset}.price`),
      volume: this.validateNumber(metrics.totalVolume, `${asset}.volume`),
      priceChange: this.validateNumber(metrics.priceChange, `${asset}.priceChange`),
      trend: this.validateString(metrics.trend, `${asset}.trend`),
      buySellRatio: this.validateNumber(metrics.buySellRatio, `${asset}.buySellRatio`),
      tradeFrequency: this.validateNumber(metrics.tradeFrequency, `${asset}.tradeFrequency`),
      tradeCount: this.validateNumber(metrics.tradeCount, `${asset}.tradeCount`)
    };
  }

  /**
   * Validate and sanitize number field
   */
  validateNumber(value, fieldName) {
    if (value === null || value === undefined) {
      throw new Error(`Missing field: ${fieldName}`);
    }
    
    const num = parseFloat(value);
    
    if (isNaN(num)) {
      throw new Error(`Invalid number for ${fieldName}: ${value}`);
    }
    
    return num;
  }

  /**
   * Validate and sanitize string field
   */
  validateString(value, fieldName) {
    if (value === null || value === undefined) {
      throw new Error(`Missing field: ${fieldName}`);
    }
    
    if (typeof value !== 'string') {
      return String(value);
    }
    
    return value.trim();
  }

  /**
   * Get cached data as fallback
   */
  getCachedData() {
    if (!this.cache) {
      throw new Error('No cached data available');
    }
    
    const age = Date.now() - this.cacheTimestamp;
    
    if (age > this.cacheMaxAge) {
      console.warn(`[Fetcher] ⚠️  Cache is stale (${Math.round(age/1000)}s old)`);
    }
    
    console.log(`[Fetcher] Using cached data (${Math.round(age/1000)}s old)`);
    return this.cache;
  }

  /**
   * Sleep utility for retry delays
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = { MarketDataFetcher };
