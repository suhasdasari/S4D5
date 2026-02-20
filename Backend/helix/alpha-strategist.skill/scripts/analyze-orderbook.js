#!/usr/bin/env node
/**
 * Binance.US Order Book Analyzer
 * Analyzes order book depth to determine market sentiment and pressure
 */

const axios = require('axios');

const BINANCE_US_API = 'https://api.binance.us/api/v3';

/**
 * Fetch and analyze order book
 * Returns buy/sell pressure, spread, and sentiment
 */
async function analyzeOrderBook(symbol = 'BTCUSDT', depth = 100) {
  try {
    // Fetch order book
    const response = await axios.get(`${BINANCE_US_API}/depth`, {
      params: { symbol, limit: depth },
      timeout: 5000
    });

    const { bids, asks } = response.data;
    
    // Calculate total volume on each side
    const bidVolume = bids.reduce((sum, [price, qty]) => sum + parseFloat(qty), 0);
    const askVolume = asks.reduce((sum, [price, qty]) => sum + parseFloat(qty), 0);
    
    // Calculate weighted average prices
    const bidValue = bids.reduce((sum, [price, qty]) => sum + (parseFloat(price) * parseFloat(qty)), 0);
    const askValue = asks.reduce((sum, [price, qty]) => sum + (parseFloat(price) * parseFloat(qty)), 0);
    
    const avgBidPrice = bidValue / bidVolume;
    const avgAskPrice = askValue / askVolume;
    
    // Best bid/ask
    const bestBid = parseFloat(bids[0][0]);
    const bestAsk = parseFloat(asks[0][0]);
    const spread = ((bestAsk - bestBid) / bestBid) * 100;
    
    // Buy/Sell pressure ratio
    const totalVolume = bidVolume + askVolume;
    const buyPressure = bidVolume / totalVolume;
    const sellPressure = askVolume / totalVolume;
    
    // Sentiment score (-1 to +1)
    // More bids = bullish, more asks = bearish
    const sentiment = (buyPressure - sellPressure) * 2;
    
    // Confidence based on volume and spread
    const volumeConfidence = Math.min(totalVolume / 100, 1); // Normalize
    const spreadConfidence = Math.max(0, 1 - (spread * 10)); // Tighter spread = higher confidence
    const confidence = (volumeConfidence * 0.7 + spreadConfidence * 0.3) * 100;
    
    return {
      timestamp: Date.now(),
      symbol,
      orderBook: {
        bestBid,
        bestAsk,
        spread: spread.toFixed(4),
        bidVolume: bidVolume.toFixed(4),
        askVolume: askVolume.toFixed(4),
        totalVolume: totalVolume.toFixed(4)
      },
      pressure: {
        buy: (buyPressure * 100).toFixed(2),
        sell: (sellPressure * 100).toFixed(2)
      },
      sentiment: sentiment.toFixed(3),
      confidence: confidence.toFixed(1),
      analysis: {
        trend: sentiment > 0.1 ? 'BULLISH' : sentiment < -0.1 ? 'BEARISH' : 'NEUTRAL',
        strength: Math.abs(sentiment) > 0.3 ? 'STRONG' : Math.abs(sentiment) > 0.1 ? 'MODERATE' : 'WEAK'
      }
    };
    
  } catch (error) {
    throw new Error(`Order book analysis failed: ${error.message}`);
  }
}

// CLI execution
if (require.main === module) {
  const symbol = process.argv[2] || 'BTCUSDT';
  
  analyzeOrderBook(symbol)
    .then(data => {
      console.log(JSON.stringify(data, null, 2));
    })
    .catch(error => {
      console.error('ERROR:', error.message);
      process.exit(1);
    });
}

module.exports = { analyzeOrderBook };
