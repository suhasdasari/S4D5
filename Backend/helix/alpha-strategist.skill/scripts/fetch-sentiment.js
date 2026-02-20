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

async function fetchSentiment(keywords = ['bitcoin']) {
  try {
    // Fetch active markets
    const response = await axios.get(`${POLYMARKET_BASE_URL}/markets`, {
      params: {
        active: true,
        closed: false,
        limit: 100  // Increased to get more options
      },
      timeout: 10000
    });

    const markets = response.data;
    
    // Filter for price-prediction markets with timeframes
    const relevantMarkets = markets.filter(market => {
      const question = (market.question || '').toLowerCase();
      const description = (market.description || '').toLowerCase();
      
      // Must contain the asset keyword
      const hasKeyword = keywords.some(keyword => 
        question.includes(keyword.toLowerCase()) ||
        description.includes(keyword.toLowerCase())
      );
      
      if (!hasKeyword) return false;
      
      // Exclude non-trading markets
      const excludeKeywords = [
        'nhl', 'nba', 'nfl', 'mlb', 'soccer', 'football', 'hockey', 'basketball', 'baseball', 'sports', 'game',
        'election', 'president', 'trump', 'biden', 'politics',
        'gta', 'gta vi', 'video game', 'movie', 'album', 'release',
        'elon', 'musk', 'tweet', 'twitter', 'x.com'
      ];
      const isExcluded = excludeKeywords.some(kw => question.includes(kw));
      
      if (isExcluded) return false;
      
      // Prioritize markets with price predictions and timeframes
      const priceKeywords = ['price', 'hit', 'reach', 'above', 'below', 'up or down'];
      const timeKeywords = ['february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december', 
                           'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
                           'week', 'month', 'day', '2026', '2027', 'q1', 'q2', 'q3', 'q4'];
      
      const hasPrice = priceKeywords.some(kw => question.includes(kw));
      const hasTime = timeKeywords.some(kw => question.includes(kw));
      
      // Accept if it has both price and time indicators
      return hasPrice && hasTime;
    });

    console.error(`Found ${relevantMarkets.length} relevant markets out of ${markets.length} total`);

    // Extract sentiment signals
    const signals = relevantMarkets.map(market => extractSentiment(market)).filter(s => s.sentiment !== null);
    
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
  
  // Parse outcomePrices - handle string, array, or number format
  let yesPrice = 0.5; // Default neutral
  
  if (market.outcomePrices) {
    if (typeof market.outcomePrices === 'string') {
      // Try to parse as JSON array
      try {
        const parsed = JSON.parse(market.outcomePrices);
        yesPrice = Array.isArray(parsed) ? parseFloat(parsed[0]) : parseFloat(parsed);
      } catch {
        // If parsing fails, try direct float conversion
        yesPrice = parseFloat(market.outcomePrices) || 0.5;
      }
    } else if (Array.isArray(market.outcomePrices)) {
      yesPrice = parseFloat(market.outcomePrices[0]) || 0.5;
    } else if (typeof market.outcomePrices === 'number') {
      yesPrice = market.outcomePrices;
    }
  }
  
  // Validate yesPrice is a valid number
  if (isNaN(yesPrice) || yesPrice < 0 || yesPrice > 1) {
    return {
      marketId: market.id,
      question: market.question,
      probability: null,
      sentiment: null,
      volume: market.volume || 0,
      weight: 0,
      isBullish: false,
      isBearish: false
    };
  }
  
  // Determine if question is bullish or bearish
  const bullishKeywords = ['reach', 'above', 'increase', 'rise', 'higher', 'up', 'gain', 'rally'];
  const bearishKeywords = ['crash', 'below', 'decrease', 'fall', 'lower', 'down', 'drop', 'decline'];
  
  const isBullish = bullishKeywords.some(kw => question.includes(kw));
  const isBearish = bearishKeywords.some(kw => question.includes(kw));
  
  // Calculate sentiment score (-1 to +1)
  let sentiment = 0;
  
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
  const volume = parseFloat(market.volume) || 0;
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
  // Filter out null sentiments
  const validSignals = signals.filter(s => s.sentiment !== null && !isNaN(s.sentiment));
  
  if (validSignals.length === 0) return 0;
  
  // Weighted average of sentiment scores
  const totalWeight = validSignals.reduce((sum, s) => sum + s.weight, 0);
  
  if (totalWeight === 0) {
    // Unweighted average
    return validSignals.reduce((sum, s) => sum + s.sentiment, 0) / validSignals.length;
  }
  
  const weightedSum = validSignals.reduce((sum, s) => sum + (s.sentiment * s.weight), 0);
  return weightedSum / totalWeight;
}

// CLI execution
if (require.main === module) {
  const keywords = process.argv.slice(2);
  
  if (keywords.length === 0) {
    keywords.push('bitcoin');
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
