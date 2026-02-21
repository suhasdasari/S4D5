#!/usr/bin/env node
/**
 * Test QuickNode Hyperliquid Hypercore Connection
 * Verify we can fetch real market data from Hyperliquid
 */

const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '..', '.env') });

// QuickNode Hyperliquid uses /info endpoint for market data
// Note: Some endpoints not supported by QuickNode, using official Hyperliquid API as fallback
const BASE_URL = process.env.QUICKNODE_HYPERCORE_URL || 'https://delicate-autumn-panorama.hype-mainnet.quiknode.pro/be68a12b4eb1d20e571f7a19a5d4779a756b0467/hypercore';
const INFO_URL = BASE_URL.replace('/hypercore', '/info');
const HYPERLIQUID_API = 'https://api.hyperliquid.xyz/info'; // Official API for unsupported endpoints

async function testQuickNode() {
  console.log('🔍 Testing QuickNode Hyperliquid Info API...\n');
  console.log(`Endpoint: ${INFO_URL}\n`);

  if (!INFO_URL) {
    console.error('❌ QuickNode URL not configured');
    process.exit(1);
  }

  try {
    // Test 1: Get exchange metadata (all available assets)
    console.log('1️⃣ Fetching exchange metadata...');
    const metaResponse = await axios.post(INFO_URL, {
      type: 'meta'
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });

    const { universe } = metaResponse.data;
    console.log(`✅ Found ${universe.length} assets on Hyperliquid\n`);

    // Find BTC and ETH
    const btc = universe.find(a => a.name === 'BTC');
    const eth = universe.find(a => a.name === 'ETH');

    if (!btc || !eth) {
      console.error('❌ BTC or ETH not found on Hyperliquid');
      return;
    }

    console.log('📊 Available Assets:');
    console.log(`   BTC: ${btc.name} (${btc.szDecimals} decimals)`);
    console.log(`   ETH: ${eth.name} (${eth.szDecimals} decimals)`);
    console.log('');

    // Test 2: Get BTC order book (this gives us current price from best bid/ask)
    console.log('2️⃣ Fetching BTC order book...');
    const btcOrderbookResponse = await axios.post(INFO_URL, {
      type: 'l2Book',
      coin: 'BTC'
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });

    const btcBook = btcOrderbookResponse.data;
    const [btcBids, btcAsks] = btcBook.levels;
    const btcBestBid = parseFloat(btcBids[0][0]);
    const btcBestAsk = parseFloat(btcAsks[0][0]);
    const btcMidPrice = (btcBestBid + btcBestAsk) / 2;

    console.log(`✅ BTC Order book fetched (timestamp: ${btcBook.time})`);
    console.log(`   Mid Price: $${btcMidPrice.toLocaleString()}`);
    console.log(`   Best Bid: $${btcBestBid.toLocaleString()}`);
    console.log(`   Best Ask: $${btcBestAsk.toLocaleString()}`);
    console.log(`   Spread: ${(((btcBestAsk - btcBestBid) / btcBestBid) * 100).toFixed(4)}%`);
    console.log('');

    console.log(`   Top 5 Bids:`);
    btcBids.slice(0, 5).forEach(([price, size]) => {
      console.log(`      $${parseFloat(price).toLocaleString()} × ${size}`);
    });
    console.log(`   Top 5 Asks:`);
    btcAsks.slice(0, 5).forEach(([price, size]) => {
      console.log(`      $${parseFloat(price).toLocaleString()} × ${size}`);
    });
    console.log('');

    // Test 3: Get ETH order book
    console.log('3️⃣ Fetching ETH order book...');
    const ethOrderbookResponse = await axios.post(INFO_URL, {
      type: 'l2Book',
      coin: 'ETH'
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });

    const ethBook = ethOrderbookResponse.data;
    const [ethBids, ethAsks] = ethBook.levels;
    const ethBestBid = parseFloat(ethBids[0][0]);
    const ethBestAsk = parseFloat(ethAsks[0][0]);
    const ethMidPrice = (ethBestBid + ethBestAsk) / 2;

    console.log(`✅ ETH Order book fetched`);
    console.log(`   Mid Price: $${ethMidPrice.toLocaleString()}`);
    console.log(`   Best Bid: $${ethBestBid.toLocaleString()}`);
    console.log(`   Best Ask: $${ethBestAsk.toLocaleString()}`);
    console.log(`   Spread: ${(((ethBestAsk - ethBestBid) / ethBestBid) * 100).toFixed(4)}%`);
    console.log('');

    // Test 4: Get historical candles
    console.log('4️⃣ Fetching BTC historical candles (1h interval)...');
    const candlesResponse = await axios.post(INFO_URL, {
      type: 'candleSnapshot',
      req: {
        coin: 'BTC',
        interval: '1h',
        startTime: Date.now() - (24 * 60 * 60 * 1000), // Last 24 hours
        endTime: Date.now()
      }
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });

    console.log(`✅ Fetched ${candlesResponse.data.length} candles`);
    if (candlesResponse.data.length > 0) {
      const latestCandle = candlesResponse.data[candlesResponse.data.length - 1];
      console.log(`   Latest Candle:`);
      console.log(`      Open: $${parseFloat(latestCandle.o).toLocaleString()}`);
      console.log(`      High: $${parseFloat(latestCandle.h).toLocaleString()}`);
      console.log(`      Low: $${parseFloat(latestCandle.l).toLocaleString()}`);
      console.log(`      Close: $${parseFloat(latestCandle.c).toLocaleString()}`);
      console.log(`      Volume: $${(parseFloat(latestCandle.v) / 1000000).toFixed(2)}M`);
    }
    console.log('');

    console.log('✅ QuickNode Hyperliquid Info API connection successful!');
    console.log('✅ All market data endpoints working!');
    console.log('\n🚀 Ready to integrate into Alpha Strategist bot!');

  } catch (error) {
    console.error('❌ Error testing QuickNode:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

testQuickNode()
  .then(() => console.log('\n✅ Test complete'))
  .catch(err => {
    console.error('❌ Test failed:', err.message);
    process.exit(1);
  });
