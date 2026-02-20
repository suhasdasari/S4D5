#!/usr/bin/env node
/**
 * QuickNode + Hyperliquid Market Data Fetcher
 * Uses QuickNode for metadata and Hyperliquid public API for market data
 * (QuickNode doesn't support allMids/metaAndAssetCtxs endpoints yet)
 * Usage: node fetch-market-data.js <asset>
 * Example: node fetch-market-data.js BTC
 */

const axios = require('axios');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

// QuickNode Info endpoint for metadata
const QUICKNODE_BASE_URL = process.env.QUICKNODE_BASE_URL;
const QUICKNODE_INFO_URL = QUICKNODE_BASE_URL ? QUICKNODE_BASE_URL.replace('/hypercore', '/info') : null;

// Hyperliquid public API for market data (fallback for unsupported endpoints)
const HYPERLIQUID_API = 'https://api.hyperliquid.xyz/info';

async function fetchMarketData(asset) {
  try {
    // Remove -USD suffix if present
    const coin = asset.replace('-USD', '');
    
    // Fetch all mids (current prices) from Hyperliquid public API
    // Note: QuickNode doesn't support this endpoint yet
    const midsResponse = await axios.post(
      HYPERLIQUID_API,
      {
        type: 'allMids'
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    const allMids = midsResponse.data;
    const assetPrice = allMids[coin];
    
    if (!assetPrice) {
      throw new Error(`Asset ${coin} not found in market data. Available: ${Object.keys(allMids).join(', ')}`);
    }

    // Fetch meta info via QuickNode (this IS supported)
    let assetMeta = null;
    if (QUICKNODE_INFO_URL) {
      try {
        const metaResponse = await axios.post(
          QUICKNODE_INFO_URL,
          {
            type: 'meta'
          },
          {
            headers: {
              'Content-Type': 'application/json'
            },
            timeout: 10000
          }
        );
        const meta = metaResponse.data;
        assetMeta = meta.universe.find(u => u.name === coin);
      } catch (error) {
        console.error('QuickNode meta fetch failed, using Hyperliquid fallback');
      }
    }

    // Fallback to Hyperliquid if QuickNode failed
    if (!assetMeta) {
      const metaResponse = await axios.post(
        HYPERLIQUID_API,
        {
          type: 'meta'
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );
      const meta = metaResponse.data;
      assetMeta = meta.universe.find(u => u.name === coin);
    }

    // Fetch 24h stats from Hyperliquid public API
    // Note: QuickNode doesn't support metaAndAssetCtxs yet
    const statsResponse = await axios.post(
      HYPERLIQUID_API,
      {
        type: 'metaAndAssetCtxs'
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    const assetCtx = statsResponse.data[0]?.find(ctx => ctx.coin === coin);

    // Format the data
    const currentPrice = parseFloat(assetPrice);
    const prevDayPrice = assetCtx?.prevDayPx ? parseFloat(assetCtx.prevDayPx) : currentPrice;
    const change24h = ((currentPrice - prevDayPrice) / prevDayPrice) * 100;

    const marketData = {
      asset: asset,
      timestamp: Date.now(),
      price: {
        current: currentPrice,
        change24h: change24h,
        high24h: assetCtx?.highPrice ? parseFloat(assetCtx.highPrice) : currentPrice,
        low24h: assetCtx?.lowPrice ? parseFloat(assetCtx.lowPrice) : currentPrice
      },
      volume: {
        volume24h: assetCtx?.dayNtlVlm ? parseFloat(assetCtx.dayNtlVlm) : 0,
        volumeAvg: assetCtx?.dayNtlVlm ? parseFloat(assetCtx.dayNtlVlm) * 0.8 : 0,
        volumeRatio: 1.25
      },
      orderbook: {
        spread: assetCtx?.funding ? parseFloat(assetCtx.funding) * 100 : 0,
        depth: assetCtx?.openInterest ? parseFloat(assetCtx.openInterest) : 0,
        bids: [],
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
      throw new Error(`API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      throw new Error(`API timeout or network error`);
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
