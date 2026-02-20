#!/usr/bin/env node
/**
 * Debug script to see what Kalshi markets are available
 * Kalshi API docs: https://trading-api.readme.io/reference/getmarkets
 */

const axios = require('axios');
const crypto = require('crypto');

const KALSHI_BASE_URL = 'https://api.elections.kalshi.com/trade-api/v2';
const KALSHI_API_KEY = process.env.KALSHI_API_KEY || '7a9b65b1-1970-4c17-ab70-346cdc9cbd12';
const KALSHI_PRIVATE_KEY = process.env.KALSHI_PRIVATE_KEY || `-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEApoZjnpOzmFaid3kahCMOjo/0aeoTA7OUTqdvcfX63O0dUWwk
TMXVkhZn7/xRMfTWT9rRSjowq03gr+A7jFvOSz0l/UxKHQNGAsGvAT0r17OtjK6j
xI4Kmc4/hf3B/cvf6AecIaK+4cSUzRjX8GkM2EgVRqSUI2q0rV5Z+J4HeNDN0RVr
qn238rhJ2a6tYGDgScF1lH0teeL26neg/oTFL+mYKS8KtnjRPmAPs5cOp19TZa+J
n4W++Y9Rq31DZQZm+lAtvzBx4VHP7wP19HASVPaBFjlU7U4IXeEgsXWgcFgavzDv
FBwAiiTFkJ5KTcBj8FwDexa7LGsJP8Qnm804KQIDAQABAoIBAArEugBxMLXzNEJh
lHNjCPfzGy0WM/CTVk3Xyf8mlvheZPz070v/pxXxWPtN57pBSPKVBd+075zERnlZ
GMC01xxKcgB1RH2nzokzGSwNVp52QgzM5k45mTnk+nqhtD/DRVFt3IzYR1u2KKEy
sBQd1vTNhIKy9dlsdw6XAV5waa9IRq0Yk6A5hP0/KGTssoAdWJx8ILLXkr9sOV+O
rXNWshTaUaNjEjYxohG8m8V10mV5vXzxRCR/cznk3sxDvdPYcTiXKVeHpAvIhNuz
26oZl3G6YlYGKeMsP44OsiJsjSWh6HnF2uawijNcMLTgtE9U5fImJinnosvFX/rE
mWfP/gECgYEAxjFUUzsXyP3N1FkZzLmE5t3HzL7POvKsLnK9hLHwL/anP4/FLTL
pxiEVSEXUvpfdW4RbdCoYXxyHSuY5QO7oQLUZMfy+YrRLkKrSKwg5S8rRTTvVdGd
Orbha7lSJgAD3srvuBSNohypOW8Pc9laNpU0IYpk3GQuXl0kLM3qMaSECgYEA1xh9
hKJPwGXdrLVPcg9e4+1w1ESwY21NNLppd9+Zc02IBlgh4sDR1h28AmF19+kU0S3g
pKKDvcYSQO7pwfkPtV6u1S3JrGL+PBylU68g0LqZ5xztXbl0f1rY8O+qyyGClugt
+QJApjOYy5fBIqwZ5q8pFXZc/lfn4J5fyLvOxgkCgYEArEae3QZFw5FSxF16/qjY
bHGlxkSqD7x3jJxyPpEJjjeh469OHt7dtDp3rG3+4nlRkcZ4VH5u1uYOeD2s0NOa
kPyaXQgsWdIMyUCjFYK9gzNWQgNbpSZTjs/sQrS7HMg6h2OyH0dLCgrtN/kF7h8I
WwKd4k76RMv9xiRZFzNUL+ECgYBV/VxwodLwP8kXOoTAPJTa2hm5Qpyhoxiyc7Om
UKWwCtbOcn1ZgWxiBREcgon+yhegaI7eQnoYbA7wFpMtELzO7UNHxj5RxGGO9oTB
p8meqHrOgioCxhlksJT5/VZyTrs+SSPX4KanywjSm6CCk/rm1i++fMtAgzQYADia
rzpCwQKBgBRhe1XalJsJ1OEQXriqyq+BVoetI+GI/lSfcHJBbqxAXNHB/U7jj0J7
5VuE1y2KKgqVynZ+T1Hvb0T5+jNX2QWPy3/e7kE9x1jFQsojLrgW4+z847LhBsKE
N8pcI0AM7KS23xH8Z8boVq03B2v6rrKplOkVyI9dT9YEtId5uDWc
-----END RSA PRIVATE KEY-----`;

function signRequest(method, path, body = '') {
  const timestamp = Date.now().toString();
  const message = timestamp + method + path + body;
  
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(message);
  sign.end();
  
  const signature = sign.sign(KALSHI_PRIVATE_KEY, 'base64');
  
  return {
    timestamp,
    signature
  };
}

async function debugKalshi() {
  try {
    const path = '/markets';
    const method = 'GET';
    const { timestamp, signature } = signRequest(method, path);
    
    // Fetch markets with authentication
    const response = await axios.get(`${KALSHI_BASE_URL}${path}`, {
      params: {
        limit: 200,
        status: 'open'
      },
      headers: {
        'KALSHI-ACCESS-KEY': KALSHI_API_KEY,
        'KALSHI-ACCESS-SIGNATURE': signature,
        'KALSHI-ACCESS-TIMESTAMP': timestamp
      },
      timeout: 10000
    });

    const markets = response.data.markets || [];
    
    console.log(`Total markets: ${markets.length}\n`);
    
    // Filter for crypto-related markets
    const cryptoMarkets = markets.filter(market => {
      const title = (market.title || '').toLowerCase();
      const ticker = (market.ticker_name || '').toLowerCase();
      
      return title.includes('bitcoin') || title.includes('btc') || 
             title.includes('ethereum') || title.includes('eth') ||
             title.includes('crypto') || 
             ticker.includes('btc') || ticker.includes('eth');
    });
    
    console.log(`Crypto-related markets: ${cryptoMarkets.length}\n`);
    
    cryptoMarkets.forEach((market, i) => {
      console.log(`${i + 1}. ${market.title}`);
      console.log(`   Ticker: ${market.ticker_name}`);
      console.log(`   Volume: ${market.volume || 0}`);
      console.log(`   Yes Price: ${market.yes_bid || 'N/A'}`);
      console.log(`   Category: ${market.category || 'N/A'}`);
      console.log('');
    });
    
    // Show available categories
    const categories = [...new Set(markets.map(m => m.category).filter(Boolean))];
    console.log(`\nAvailable categories (${categories.length}): ${categories.join(', ')}\n`);
    
    // Show sample of market titles to understand what's available
    console.log('\nSample market titles:');
    markets.slice(0, 20).forEach((market, i) => {
      console.log(`${i + 1}. ${market.title} (${market.category || 'No category'})`);
    });
    
  } catch (error) {
    if (error.response) {
      console.error('Kalshi API error:', error.response.status, JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('Kalshi API timeout or network error');
    } else {
      console.error('Error:', error.message);
    }
  }
}

debugKalshi();
