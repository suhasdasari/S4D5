#!/usr/bin/env node
/**
 * Alpha Strategist Main Analysis Engine
 * Combines market data + sentiment to generate trade proposals
 * Manages position lifecycle (open/close decisions)
 * Usage: node analyze-and-propose.js [asset1,asset2,...]
 * Example: node analyze-and-propose.js BTC,ETH
 */

const { fetchMarketData } = require('./fetch-market-data');
const { analyzeOrderBook } = require('./analyze-orderbook');
const { listPositions } = require('./track-positions');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const TARGET_ASSETS = (process.env.TARGET_ASSETS || 'BTC,ETH').split(',');
const MIN_CONFIDENCE = parseFloat(process.env.MIN_CONFIDENCE || '30'); // Lowered for technical indicators
const MAX_POSITION_SIZE = parseFloat(process.env.MAX_POSITION_SIZE || '10000');
const RISK_MULTIPLIER = parseFloat(process.env.RISK_MULTIPLIER || '0.5');
const TAKE_PROFIT_PCT = parseFloat(process.env.TAKE_PROFIT_PCT || '5');
const STOP_LOSS_PCT = parseFloat(process.env.STOP_LOSS_PCT || '3');
const MAX_POSITION_AGE_HOURS = parseFloat(process.env.MAX_POSITION_AGE_HOURS || '24');

/**
 * Calculate leverage based on sentiment strength
 * Sentiment range: -1 (very bearish) to +1 (very bullish)
 * Returns: { direction: 'LONG'|'SHORT', leverage: 1-3 }
 */
function calculateLeverage(sentimentScore) {
  const absScore = Math.abs(sentimentScore);
  
  // Determine direction
  const direction = sentimentScore > 0 ? 'LONG' : 'SHORT';
  
  // Calculate leverage (1x-3x based on confidence)
  let leverage = 1;
  if (absScore >= 0.7) {
    leverage = 3; // Very strong signal
  } else if (absScore >= 0.4) {
    leverage = 2; // Moderate signal
  } else {
    leverage = 1; // Weak signal
  }
  
  return { direction, leverage };
}

/**
 * Calculate position size based on confidence and risk parameters
 */
function calculatePositionSize(confidence, maxSize, riskMultiplier) {
  const baseSize = maxSize * riskMultiplier;
  const confidenceMultiplier = confidence / 100;
  return baseSize * confidenceMultiplier;
}

/**
 * Check if existing position should be closed
 * Reasons: sentiment reversal, time-based, early profit
 */
function shouldClosePosition(position, currentSentiment, currentPrice) {
  const reasons = [];
  
  // 1. Sentiment reversal check
  const originalDirection = position.direction;
  const { direction: currentDirection } = calculateLeverage(currentSentiment);
  
  if (originalDirection !== currentDirection) {
    reasons.push({
      type: 'SENTIMENT_REVERSAL',
      detail: `Sentiment changed from ${originalDirection} to ${currentDirection}`
    });
  }
  
  // 2. Time-based check
  const ageHours = (Date.now() - position.openedAt) / (1000 * 60 * 60);
  if (ageHours >= MAX_POSITION_AGE_HOURS) {
    reasons.push({
      type: 'MAX_AGE_REACHED',
      detail: `Position age ${ageHours.toFixed(1)}h exceeds max ${MAX_POSITION_AGE_HOURS}h`
    });
  }
  
  // 3. Early profit check (>3% profit before TP)
  const entryPrice = position.entryPrice;
  const pnlPct = ((currentPrice - entryPrice) / entryPrice) * 100;
  const adjustedPnl = originalDirection === 'LONG' ? pnlPct : -pnlPct;
  
  if (adjustedPnl >= 3 && adjustedPnl < TAKE_PROFIT_PCT) {
    // Check if sentiment is weakening
    const originalSentiment = position.sentimentScore || 0;
    if (Math.abs(currentSentiment) < Math.abs(originalSentiment) * 0.6) {
      reasons.push({
        type: 'EARLY_PROFIT_WEAK_SENTIMENT',
        detail: `Profit ${adjustedPnl.toFixed(2)}% with weakening sentiment`
      });
    }
  }
  
  return reasons;
}

/**
 * Main analysis function
 */
async function analyzeAndPropose(assets = TARGET_ASSETS) {
  const proposals = [];
  
  try {
    // Load existing positions
    const openPositions = listPositions();
    
    // Analyze each asset
    for (const asset of assets) {
      try {
        console.error(`Analyzing ${asset}...`);
        
        // Fetch market data
        const marketData = await fetchMarketData(asset);
        
        // Analyze order book for real-time sentiment
        const symbol = `${asset.replace('-USD', '')}USDT`;
        const orderBookAnalysis = await analyzeOrderBook(symbol);
        
        // Combine technical indicators with order book
        const change24h = marketData.price.change24h || 0;
        const volume24h = marketData.volume.volume24h || 0;
        
        // Sentiment from order book (primary) + price momentum (secondary)
        const orderBookSentiment = parseFloat(orderBookAnalysis.sentiment);
        const priceMomentum = Math.max(-1, Math.min(1, change24h / 5));
        
        // Weighted combination: 70% order book, 30% price momentum
        const sentimentScore = (orderBookSentiment * 0.7) + (priceMomentum * 0.3);
        const confidence = parseFloat(orderBookAnalysis.confidence);
        
        console.error(`${asset}: orderbook=${orderBookSentiment.toFixed(2)}, momentum=${priceMomentum.toFixed(2)}, combined=${sentimentScore.toFixed(2)}, confidence=${confidence.toFixed(1)}%, threshold=${MIN_CONFIDENCE}%`);
        
        // Check existing positions for this asset
        const existingPosition = openPositions.find(p => p.asset === asset);
        
        if (existingPosition) {
          // Check if we should close
          const closeReasons = shouldClosePosition(
            existingPosition,
            sentimentScore,
            marketData.price.current
          );
          
          if (closeReasons.length > 0) {
            proposals.push({
              action: 'CLOSE',
              positionId: existingPosition.id,
              asset: asset,
              reasons: closeReasons,
              currentPrice: marketData.price.current,
              timestamp: Date.now()
            });
          }
        } else {
          // Check if we should open new position
          if (confidence >= MIN_CONFIDENCE) {
            const { direction, leverage } = calculateLeverage(sentimentScore);
            const positionSize = calculatePositionSize(confidence, MAX_POSITION_SIZE, RISK_MULTIPLIER);
            
            proposals.push({
              action: 'OPEN',
              asset: asset,
              direction: direction,
              leverage: leverage,
              size: positionSize,
              entryPrice: marketData.price.current,
              stopLoss: direction === 'LONG' 
                ? marketData.price.current * (1 - STOP_LOSS_PCT / 100)
                : marketData.price.current * (1 + STOP_LOSS_PCT / 100),
              takeProfit: direction === 'LONG'
                ? marketData.price.current * (1 + TAKE_PROFIT_PCT / 100)
                : marketData.price.current * (1 - TAKE_PROFIT_PCT / 100),
              confidence: confidence,
              sentimentScore: sentimentScore,
              marketData: {
                price: marketData.price.current,
                volume24h: marketData.volume.volume24h,
                change24h: marketData.price.change24h
              },
              orderBookAnalysis: {
                buyPressure: orderBookAnalysis.pressure.buy,
                sellPressure: orderBookAnalysis.pressure.sell,
                spread: orderBookAnalysis.orderBook.spread,
                trend: orderBookAnalysis.analysis.trend
              },
              timestamp: Date.now()
            });
          }
        }
      } catch (error) {
        console.error(`Error analyzing ${asset}: ${error.message}`);
      }
    }
    
    return {
      timestamp: Date.now(),
      proposals: proposals,
      openPositions: openPositions.length
    };
    
  } catch (error) {
    throw new Error(`Analysis failed: ${error.message}`);
  }
}

// CLI execution
if (require.main === module) {
  const assets = process.argv[2] ? process.argv[2].split(',') : TARGET_ASSETS;
  
  analyzeAndPropose(assets)
    .then(result => {
      console.log(JSON.stringify(result, null, 2));
    })
    .catch(error => {
      console.error('ERROR:', error.message);
      process.exit(1);
    });
}

module.exports = { analyzeAndPropose, calculateLeverage };
