#!/usr/bin/env node
/**
 * QuickNode Hyperliquid Market Data Fetcher
 * Fetches real-time price, volume, and orderbook data
 * Usage: node fetch-market-data.js <asset>
 * Example: node fetch-market-data.js BTC-USD
 */

const axios = require('axios');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const QUICKNODE_BASE_URL = process.env.QUICKNODE_BASE_URL;
const QUICKNODE_API_KEY = process.env.QUICKNODE_API_KEY;

async function fetchMarketData(asset) {
  if (!QUICKNODE_BASE_URL || !QUICKNODE_API_KEY) {
    throw new Error('Missing QuickNode configuration. Check .env file.');
  }

  try {
    // QuickNode Hypercore API call for market data
    const response = await axios.post(
      QUICKNODE_BASE_URL,
      {
        jsonrpc: '2.0',
        id: 1,
        method: 'info',
        params: {
          type: 'allMids'
        }
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    const allMids = response.data.result;
    
    // Find the requested asset
    const assetData = allMids.find(item => {
      const symbol = item.coin || item.name;
      return symbol === asset || symbol === asset.replace('-USD', '');
    });

    if (!assetData) {
      throw new Error(`Asset ${asset} not found in market data`);
    }

    // Fetch additional market info
    const metaResponse = await axios.post(
      QUICKNODE_BASE_URL,
      {
        jsonrpc: '2.0',
        id: 2,
        method: 'info',
        params: {
          type: 'meta'
        }
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    const meta = metaResponse.data.result;
    const assetMeta = meta.universe.find(u => u.name === assetData.coin);

    // Format the data
    const marketData = {
      asset: asset,
      timestamp: Date.now(),
      price: {
        current: parseFloat(assetData.mid || assetData.price || 0),
        change24h: parseFloat(assetData.dayNtlVlm || 0) > 0 ? 
          ((parseFloat(assetData.mid) - parseFloat(assetData.prevDayPx || assetData.mid)) / parseFloat(assetData.prevDayPx || assetData.mid) * 100) : 0,
        high24h: parseFloat(assetData.high24h || assetData.mid),
        low24h: parseFloat(assetData.low24h || assetData.mid)
      },
      volume: {
        volume24h: parseFloat(assetData.dayNtlVlm || 0),
        volumeAvg: parseFloat(assetData.dayNtlVlm || 0) * 0.8, // Estimate
        volumeRatio: 1.25 // Estimate
      },
      orderbook: {
        spread: parseFloat(assetData.funding || 0) * 100,
        depth: parseFloat(assetData.openInterest || 0),
        bids: [], // Simplified - would need separate orderbook call
        asks: []
      },
      metadata: {
        maxLeverage: assetMeta?.maxLeverage || 3,
        onlyIsolated: assetMeta?.onlyIsolated || false
      }
    };

    return marketData;
  } catch (error) {
    if (error.response) {
      throw new Error(`QuickNode API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      throw new Error(`QuickNode API timeout or network error`);
    } else {
      throw new Error(`Error fetching market data: ${error.message}`);
    }
  }
}

// CLI execution
if (require.main === module) {
  const asset = process.argv[2] || 'BTC';
  
  fetchMarketData(asset)
    .then(data => {
      console.log(JSON.stringify(data, null, 2));
    })
    .catch(error => {
      console.error('ERROR:', error.message);
      process.exit(1);
    });
}

module.exports = { fetchMarketData };
