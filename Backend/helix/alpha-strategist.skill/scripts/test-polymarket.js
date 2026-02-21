#!/usr/bin/env node
/**
 * Test Polymarket Gamma API
 * Check if crypto prediction markets are available
 */

const axios = require('axios');

const GAMMA_API = 'https://gamma-api.polymarket.com';

async function testPolymarket() {
  console.log('🔍 Testing Polymarket Gamma API...\n');

  try {
    // Test 1: Use public search for crypto
    console.log('1️⃣ Searching for "Bitcoin" markets...');
    const btcSearch = await axios.get(`${GAMMA_API}/public-search`, {
      params: {
        q: 'Bitcoin',
        limit: 10
      }
    });

    console.log(`Bitcoin search results: ${btcSearch.data.markets?.length || 0} markets\n`);

    // Test 2: Search for "Ethereum"
    console.log('2️⃣ Searching for "Ethereum" markets...');
    const ethSearch = await axios.get(`${GAMMA_API}/public-search`, {
      params: {
        q: 'Ethereum',
        limit: 10
      }
    });

    console.log(`Ethereum search results: ${ethSearch.data.markets?.length || 0} markets\n`);

    // Test 3: Search for "crypto"
    console.log('3️⃣ Searching for "crypto" markets...');
    const cryptoSearch = await axios.get(`${GAMMA_API}/public-search`, {
      params: {
        q: 'crypto',
        limit: 10
      }
    });

    console.log(`Crypto search results: ${cryptoSearch.data.markets?.length || 0} markets\n`);

    // Combine all crypto markets
    const allCryptoMarkets = [
      ...(btcSearch.data.markets || []),
      ...(ethSearch.data.markets || []),
      ...(cryptoSearch.data.markets || [])
    ];

    // Remove duplicates by conditionId
    const uniqueMarkets = Array.from(
      new Map(allCryptoMarkets.map(m => [m.conditionId, m])).values()
    );

    console.log(`📊 Found ${uniqueMarkets.length} unique crypto-related markets:\n`);

    if (uniqueMarkets.length > 0) {
      uniqueMarkets.slice(0, 10).forEach((market, i) => {
        console.log(`${i + 1}. ${market.question}`);
        console.log(`   Market ID: ${market.conditionId}`);
        console.log(`   Outcomes: ${market.outcomes}`);
        console.log(`   Prices: ${market.outcomePrices}`);
        console.log(`   Volume: $${(market.volume || 0).toLocaleString()}`);
        console.log(`   Active: ${market.active}`);
        console.log('');
      });

      console.log('\n✅ Polymarket Gamma API is accessible!');
      console.log('✅ Crypto prediction markets are available!');
      console.log('\n💡 We can use this for sentiment analysis!');
      
      // Show example sentiment extraction
      if (uniqueMarkets[0]) {
        const market = uniqueMarkets[0];
        const outcomes = JSON.parse(market.outcomes);
        const prices = JSON.parse(market.outcomePrices);
        
        console.log('\n📈 Example Sentiment Extraction:');
        console.log(`Question: ${market.question}`);
        console.log(`${outcomes[0]}: ${(parseFloat(prices[0]) * 100).toFixed(1)}% probability`);
        console.log(`${outcomes[1]}: ${(parseFloat(prices[1]) * 100).toFixed(1)}% probability`);
        
        // Determine if bullish or bearish
        const isBullish = market.question.toLowerCase().includes('reach') || 
                         market.question.toLowerCase().includes('above') ||
                         market.question.toLowerCase().includes('higher');
        const yesProbability = parseFloat(prices[0]);
        
        if (isBullish) {
          const sentiment = (yesProbability - 0.5) * 2; // -1 to +1
          console.log(`Sentiment Score: ${sentiment.toFixed(2)} (${sentiment > 0 ? 'BULLISH' : 'BEARISH'})`);
        }
      }
    } else {
      console.log('⚠️  No crypto markets found');
      console.log('💡 Polymarket API works, but crypto markets may be limited');
      console.log('💡 We can still use it when crypto markets are available');
    }

    // Test 4: Check available tags
    console.log('\n4️⃣ Checking available tags...');
    const tagsResponse = await axios.get(`${GAMMA_API}/tags`);
    console.log(`Total tags: ${tagsResponse.data.length}`);
    
    const cryptoTags = tagsResponse.data.filter(t => 
      t.label.toLowerCase().includes('crypto') || 
      t.label.toLowerCase().includes('bitcoin') ||
      t.label.toLowerCase().includes('ethereum') ||
      t.label.toLowerCase().includes('btc') ||
      t.label.toLowerCase().includes('eth')
    );
    
    if (cryptoTags.length > 0) {
      console.log('📌 Crypto-related tags found:', cryptoTags.map(t => t.label).join(', '));
    } else {
      console.log('No crypto-specific tags found');
    }

  } catch (error) {
    console.error('❌ Error testing Polymarket API:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testPolymarket()
  .then(() => console.log('\n✅ Test complete'))
  .catch(err => console.error('❌ Test failed:', err.message));
