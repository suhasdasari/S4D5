#!/usr/bin/env node
/**
 * Polymarket Sentiment Fetcher
 * Fetches prediction market data and calculates sentiment scores
 * Usage: node fetch-sentiment.js <keywords...>
 * Example: node fetch-sentiment.js crypto bitcoin
 */

const axios = require('axios');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const POLYMARKET_BASE_URL = process.env.POLYMARKET_BASE_URL || 'https://gamma-api.polymarket.com';

async function fetchSentiment(keywords = ['crypto', 'bitcoin']) {
  try {
    // Fetch active markets
    const response = await axios.get(`${POLYMARKET_BASE_URL}/markets`, {
      params: {
        active: true,
        closed: false,
        limit: 50
      },
      timeout: 10000
    });

    const markets = response.data;
    
    // Filter markets by keywords
    const relevantMarkets = markets.filter(market => {
      const question = (market.question || '').toLowerCase();
      const description = (market.description || '').toLowerCase();
      const tags = (market.tags || []).map(t => t.toLowerCase());
      
      return keywords.some(keyword => 
        question.includes(keyword.toLowerCase()) ||
        description.includes(keyword.toLowerCase()) ||
        tags.includes(keyword.toLowerCase())
      );
    });

    // Extract sentiment signals
    const signals = relevantMarkets.map(market => extractSentiment(market));
    
    // Calculate aggregate sentiment
    const aggregateScore = calculateAggregateSentiment(signals);

    return {
      timestamp: Date.now(),
      signals: signals,
      aggregateScore: aggregateScore,
      marketCount: signals.length
    };
  } catch (error) {
    if (error.response) {
      throw new Error(`Polymarket API error: ${error.response.status}`);
    } else if (error.request) {
      throw new Error(`Polymarket API timeout or network error`);
    } else {
      throw new Error(`Error fetching sentiment: ${error.message}`);
    }
  }
}

function extractSentiment(market) {
  const question = market.question.toLowerCase();
  const outcomes = market.outcomes || ['Yes', 'No'];
  const outcomePrices = market.outcomePrices || [0.5, 0.5];
  
  // Determine if question is bullish or bearish
  const bullishKeywords = ['reach', 'above', 'increase', 'rise', 'higher', 'up', 'gain', 'rally'];
  const bearishKeywords = ['crash', 'below', 'decrease', 'fall', 'lower', 'down', 'drop', 'decline'];
  
  const isBullish = bullishKeywords.some(kw => question.includes(kw));
  const isBearish = bearishKeywords.some(kw => question.includes(kw));
  
  // Calculate sentiment score (-1 to +1)
  let sentiment = 0;
  const yesPrice = outcomePrices[0];
  
  if (isBullish) {
    // Higher yes price = more bullish
    sentiment = (yesPrice - 0.5) * 2; // Maps 0.5->0, 1.0->+1
  } else if (isBearish) {
    // Higher yes price = more bearish (inverse)
    sentiment = (0.5 - yesPrice) * 2; // Maps 0.5->0, 0.0->+1
  } else {
    // Neutral question, treat yes as bullish
    sentiment = (yesPrice - 0.5) * 2;
  }
  
  // Weight by market volume (higher volume = more reliable)
  const volume = market.volume || 0;
  const weight = Math.min(volume / 100000, 1.0);
  
  return {
    marketId: market.id,
    question: market.question,
    probability: yesPrice,
    sentiment: sentiment,
    volume: volume,
    weight: weight,
    isBullish: isBullish,
    isBearish: isBearish
  };
}

function calculateAggregateSentiment(signals) {
  if (signals.length === 0) return 0;
  
  // Weighted average of sentiment scores
  const totalWeight = signals.reduce((sum, s) => sum + s.weight, 0);
  
  if (totalWeight === 0) {
    // Unweighted average
    return signals.reduce((sum, s) => sum + s.sentiment, 0) / signals.length;
  }
  
  const weightedSum = signals.reduce((sum, s) => sum + (s.sentiment * s.weight), 0);
  return weightedSum / totalWeight;
}

// CLI execution
if (require.main === module) {
  const keywords = process.argv.slice(2);
  
  if (keywords.length === 0) {
    keywords.push('crypto', 'bitcoin');
  }
  
  fetchSentiment(keywords)
    .then(data => {
      console.log(JSON.stringify(data, null, 2));
    })
    .catch(error => {
      console.error('ERROR:', error.message);
      process.exit(1);
    });
}

module.exports = { fetchSentiment };
