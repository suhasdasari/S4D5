#!/usr/bin/env node
/**
 * OpenClaw Tool: Fetch Market Data
 * Fetches real-time market data from Railway webhook
 */

const axios = require('axios');

const WEBHOOK_URL = process.env.WEBHOOK_API_URL || 'https://s4d5-production-f42d.up.railway.app/dashboard';

async function fetchMarketData() {
  try {
    const response = await axios.get(WEBHOOK_URL, { timeout: 10000 });
    
    // Return formatted data for LLM
    return {
      success: true,
      data: {
        timestamp: response.data.timestamp,
        totalTrades: response.data.stats.totalTrades,
        assets: {
          BTC: {
            price: response.data.BTC.metrics.averagePrice,
            volume: response.data.BTC.metrics.totalVolume,
            priceChange: response.data.BTC.metrics.priceChange,
            trend: response.data.BTC.metrics.trend,
            buySellRatio: response.data.BTC.metrics.buySellRatio,
            tradeFrequency: response.data.BTC.metrics.tradeFrequency,
            tradeCount: response.data.BTC.metrics.tradeCount
          },
          ETH: {
            price: response.data.ETH.metrics.averagePrice,
            volume: response.data.ETH.metrics.totalVolume,
            priceChange: response.data.ETH.metrics.priceChange,
            trend: response.data.ETH.metrics.trend,
            buySellRatio: response.data.ETH.metrics.buySellRatio,
            tradeFrequency: response.data.ETH.metrics.tradeFrequency,
            tradeCount: response.data.ETH.metrics.tradeCount
          }
        }
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// If called directly, output JSON
if (require.main === module) {
  fetchMarketData().then(result => {
    console.log(JSON.stringify(result, null, 2));
  });
}

module.exports = { fetchMarketData };
