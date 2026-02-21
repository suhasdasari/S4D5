#!/usr/bin/env node
/**
 * QuickNode Hyperliquid Hypercore Client
 * Fetches real-time market data from Hyperliquid via QuickNode
 */

const axios = require('axios');

class QuickNodeClient {
  constructor(baseUrl, apiKey) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Get comprehensive market data for an asset
   */
  async getMarketData(symbol) {
    try {
      const [ticker, orderbook] = await Promise.all([
        this.getTicker(symbol),
        this.getOrderBook(symbol, 100)
      ]);

      return {
        symbol,
        ticker,
        orderbook,
        timestamp: Date.now()
      };
    } catch (error) {
      throw new Error(`Failed to fetch market data for ${symbol}: ${error.message}`);
    }
  }

  /**
   * Get ticker data (price, volume, 24h change)
   */
  async getTicker(symbol) {
    try {
      const response = await this.client.post('', {
        type: 'metaAndAssetCtxs'
      });

      // Find the asset in the response
      const assetIndex = response.data[0].universe.findIndex(
        u => u.name === symbol || u.name === symbol.replace('-USD', '')
      );

      if (assetIndex === -1) {
        throw new Error(`Asset ${symbol} not found`);
      }

      const assetCtx = response.data[1][assetIndex];
      const meta = response.data[0].universe[assetIndex];

      return {
        symbol: meta.name,
        lastPrice: parseFloat(assetCtx.markPx),
        volume24h: parseFloat(assetCtx.dayNtlVlm),
        priceChangePercent: 0, // Calculate from historical data if needed
        funding: parseFloat(assetCtx.funding),
        openInterest: parseFloat(assetCtx.openInterest),
        timestamp: Date.now()
      };
    } catch (error) {
      throw new Error(`Failed to fetch ticker for ${symbol}: ${error.message}`);
    }
  }

  /**
   * Get order book data
   */
  async getOrderBook(symbol, depth = 100) {
    try {
      const response = await this.client.post('', {
        type: 'l2Book',
        coin: symbol.replace('-USD', '')
      });

      const levels = response.data.levels;

      return {
        bids: levels[0].map(([price, size]) => [parseFloat(price), parseFloat(size)]),
        asks: levels[1].map(([price, size]) => [parseFloat(price), parseFloat(size)]),
        timestamp: response.data.time
      };
    } catch (error) {
      throw new Error(`Failed to fetch orderbook for ${symbol}: ${error.message}`);
    }
  }

  /**
   * Get historical candle data for technical indicators
   */
  async getCandles(symbol, interval = '1h', limit = 100) {
    try {
      const response = await this.client.post('', {
        type: 'candleSnapshot',
        req: {
          coin: symbol.replace('-USD', ''),
          interval,
          startTime: Date.now() - (limit * 60 * 60 * 1000) // limit hours ago
        }
      });

      return response.data.map(candle => ({
        timestamp: candle.t,
        open: parseFloat(candle.o),
        high: parseFloat(candle.h),
        low: parseFloat(candle.l),
        close: parseFloat(candle.c),
        volume: parseFloat(candle.v)
      }));
    } catch (error) {
      throw new Error(`Failed to fetch candles for ${symbol}: ${error.message}`);
    }
  }

  /**
   * Get all available assets
   */
  async getAssets() {
    try {
      const response = await this.client.post('', {
        type: 'metaAndAssetCtxs'
      });

      return response.data[0].universe.map(asset => ({
        name: asset.name,
        szDecimals: asset.szDecimals
      }));
    } catch (error) {
      throw new Error(`Failed to fetch assets: ${error.message}`);
    }
  }
}

module.exports = { QuickNodeClient };
