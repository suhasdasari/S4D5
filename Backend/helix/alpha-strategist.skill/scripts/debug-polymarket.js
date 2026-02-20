#!/usr/bin/env node
/**
 * Debug script to see what Polymarket markets are available
 */

const axios = require('axios');

const POLYMARKET_BASE_URL = 'https://gamma-api.polymarket.com';

async function debugPolymarket() {
  try {
    const response = await axios.get(`${POLYMARKET_BASE_URL}/markets`, {
      params: {
        active: true,
        closed: false,
        limit: 100
      },
      timeout: 10000
    });

    const markets = response.data;
    
    console.log(`Total markets: ${markets.length}\n`);
    
    // Filter for bitcoin-related markets
    const bitcoinMarkets = markets.filter(market => {
      const question = (market.question || '').toLowerCase();
      return question.includes('bitcoin') || question.includes('btc');
    });
    
    console.log(`Bitcoin-related markets: ${bitcoinMarkets.length}\n`);
    
    // Show first 10 bitcoin markets
    bitcoinMarkets.slice(0, 10).forEach((market, i) => {
      console.log(`${i + 1}. ${market.question}`);
      console.log(`   ID: ${market.id}`);
      console.log(`   Volume: ${market.volume || 0}`);
      console.log(`   Prices: ${JSON.stringify(market.outcomePrices)}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

debugPolymarket();
