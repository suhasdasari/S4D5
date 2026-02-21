#!/usr/bin/env node

/**
 * QuickNode Streams Webhook Receiver for Railway
 * Receives real-time Hyperliquid trade data from QuickNode Streams
 */

const express = require('express');
const app = express();

// Configuration
const PORT = process.env.PORT || 3000;
const WEBHOOK_PATH = '/webhook/quicknode-streams';

// Middleware
app.use(express.json({ limit: '10mb' }));

// CORS for dashboard access
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// In-memory storage for recent trades (last 100 per asset)
const tradeBuffers = {
  BTC: [],
  ETH: []
};

const MAX_BUFFER_SIZE = 100;

// Stats tracking
const stats = {
  totalWebhooksReceived: 0,
  totalTradesProcessed: 0,
  startTime: Date.now(),
  lastWebhookTime: null
};

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'QuickNode Streams Webhook Receiver',
    status: 'running',
    endpoints: {
      webhook: `POST ${WEBHOOK_PATH}`,
      dashboard: 'GET /dashboard',
      health: 'GET /health',
      stats: 'GET /stats'
    },
    uptime: Math.floor((Date.now() - stats.startTime) / 1000) + 's',
    totalWebhooks: stats.totalWebhooksReceived,
    totalTrades: stats.totalTradesProcessed
  });
});

// Webhook endpoint
app.post(WEBHOOK_PATH, (req, res) => {
  try {
    const payload = req.body;
    
    stats.totalWebhooksReceived++;
    stats.lastWebhookTime = Date.now();
    
    console.log('\n=== Webhook Received ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Payload size:', JSON.stringify(payload).length, 'bytes');
    console.log('Payload structure:', JSON.stringify(payload, null, 2).substring(0, 500));
    
    // Validate payload structure
    if (!payload.data || !Array.isArray(payload.data)) {
      console.error('Invalid payload: missing data array');
      return res.status(400).json({ error: 'Invalid payload structure' });
    }
    
    // Process each data item
    let tradesProcessed = 0;
    
    payload.data.forEach(dataItem => {
      const { block_time, block_number, events } = dataItem;
      
      console.log('Data item:', { block_time, block_number, eventsCount: events?.length || 0 });
      
      if (!events || !Array.isArray(events)) {
        console.log('No events array found in data item');
        return;
      }
      
      // Process each trade event
      events.forEach(event => {
        console.log('Event received:', JSON.stringify(event).substring(0, 200));
        // Extract trade information
        const { coin, px, sz, side } = event;
        
        // Filter for BTC and ETH only
        if (coin !== 'BTC' && coin !== 'ETH') {
          return;
        }
        
        // Validate required fields
        if (!px || !sz || !side) {
          console.warn('Skipping trade with missing fields:', event);
          return;
        }
        
        // Create trade record
        const trade = {
          timestamp: new Date(block_time).getTime(),
          blockNumber: block_number,
          asset: coin,
          price: parseFloat(px),
          quantity: parseFloat(sz),
          side: side.toLowerCase(), // 'buy' or 'sell'
          receivedAt: Date.now()
        };
        
        // Add to buffer
        const buffer = tradeBuffers[coin];
        buffer.push(trade);
        
        // Maintain buffer size
        if (buffer.length > MAX_BUFFER_SIZE) {
          buffer.shift(); // Remove oldest
        }
        
        tradesProcessed++;
        stats.totalTradesProcessed++;
        
        console.log(`[${coin}] ${side} ${sz} @ $${px} (block ${block_number})`);
      });
    });
    
    console.log(`Processed ${tradesProcessed} trades`);
    console.log('Buffer sizes - BTC:', tradeBuffers.BTC.length, 'ETH:', tradeBuffers.ETH.length);
    
    // Calculate and display metrics
    displayMetrics();
    
    // Acknowledge receipt
    res.status(200).json({ 
      success: true, 
      tradesProcessed,
      bufferSizes: {
        BTC: tradeBuffers.BTC.length,
        ETH: tradeBuffers.ETH.length
      }
    });
    
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    uptime: process.uptime(),
    bufferSizes: {
      BTC: tradeBuffers.BTC.length,
      ETH: tradeBuffers.ETH.length
    },
    lastWebhook: stats.lastWebhookTime ? new Date(stats.lastWebhookTime).toISOString() : null
  });
});

// Stats endpoint
app.get('/stats', (req, res) => {
  res.json({
    totalWebhooksReceived: stats.totalWebhooksReceived,
    totalTradesProcessed: stats.totalTradesProcessed,
    uptime: Math.floor((Date.now() - stats.startTime) / 1000),
    startTime: new Date(stats.startTime).toISOString(),
    lastWebhookTime: stats.lastWebhookTime ? new Date(stats.lastWebhookTime).toISOString() : null,
    bufferSizes: {
      BTC: tradeBuffers.BTC.length,
      ETH: tradeBuffers.ETH.length
    }
  });
});

// Dashboard endpoint - view recent trades
app.get('/dashboard', (req, res) => {
  const btcMetrics = calculateMetrics('BTC');
  const ethMetrics = calculateMetrics('ETH');
  
  res.json({
    timestamp: new Date().toISOString(),
    stats: {
      totalWebhooks: stats.totalWebhooksReceived,
      totalTrades: stats.totalTradesProcessed,
      uptime: Math.floor((Date.now() - stats.startTime) / 1000),
      lastWebhook: stats.lastWebhookTime ? new Date(stats.lastWebhookTime).toISOString() : null
    },
    BTC: {
      recentTrades: tradeBuffers.BTC.slice(-20),
      metrics: btcMetrics
    },
    ETH: {
      recentTrades: tradeBuffers.ETH.slice(-20),
      metrics: ethMetrics
    }
  });
});

// Calculate real-time metrics
function calculateMetrics(asset) {
  const buffer = tradeBuffers[asset];
  
  if (buffer.length === 0) {
    return {
      totalVolume: 0,
      averagePrice: 0,
      trend: 'neutral',
      tradeFrequency: 0,
      buySellRatio: 0,
      tradeCount: 0
    };
  }
  
  // Total volume
  const totalVolume = buffer.reduce((sum, trade) => sum + (trade.price * trade.quantity), 0);
  
  // Average price
  const averagePrice = buffer.reduce((sum, trade) => sum + trade.price, 0) / buffer.length;
  
  // Price trend (compare first half vs second half)
  const midpoint = Math.floor(buffer.length / 2);
  if (midpoint === 0) {
    return {
      totalVolume: totalVolume.toFixed(2),
      averagePrice: averagePrice.toFixed(2),
      trend: 'neutral',
      priceChange: '0.00%',
      tradeFrequency: 0,
      buySellRatio: 0,
      tradeCount: buffer.length
    };
  }
  
  const firstHalfAvg = buffer.slice(0, midpoint).reduce((sum, t) => sum + t.price, 0) / midpoint;
  const secondHalfAvg = buffer.slice(midpoint).reduce((sum, t) => sum + t.price, 0) / (buffer.length - midpoint);
  const priceChange = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;
  
  let trend = 'neutral';
  if (priceChange > 1) trend = 'upward';
  else if (priceChange < -1) trend = 'downward';
  
  // Trade frequency (trades per minute)
  const timeSpan = (buffer[buffer.length - 1].timestamp - buffer[0].timestamp) / 1000 / 60; // minutes
  const tradeFrequency = timeSpan > 0 ? buffer.length / timeSpan : 0;
  
  // Buy/Sell ratio
  const buyCount = buffer.filter(t => t.side === 'buy').length;
  const sellCount = buffer.filter(t => t.side === 'sell').length;
  const buySellRatio = sellCount > 0 ? buyCount / sellCount : buyCount;
  
  return {
    totalVolume: totalVolume.toFixed(2),
    averagePrice: averagePrice.toFixed(2),
    trend,
    priceChange: priceChange.toFixed(2) + '%',
    tradeFrequency: tradeFrequency.toFixed(2),
    buySellRatio: buySellRatio.toFixed(2),
    tradeCount: buffer.length
  };
}

// Display metrics in console
function displayMetrics() {
  console.log('\n--- Real-Time Metrics ---');
  
  ['BTC', 'ETH'].forEach(asset => {
    const metrics = calculateMetrics(asset);
    console.log(`\n${asset}:`);
    console.log(`  Trades: ${metrics.tradeCount}`);
    console.log(`  Avg Price: $${metrics.averagePrice}`);
    console.log(`  Volume: $${metrics.totalVolume}`);
    console.log(`  Trend: ${metrics.trend} (${metrics.priceChange})`);
    console.log(`  Frequency: ${metrics.tradeFrequency} trades/min`);
    console.log(`  Buy/Sell Ratio: ${metrics.buySellRatio}`);
  });
  
  console.log('========================\n');
}

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log('\n🚀 QuickNode Streams Webhook Receiver Started');
  console.log(`📡 Listening on port ${PORT}`);
  console.log(`🔗 Webhook endpoint: POST ${WEBHOOK_PATH}`);
  console.log(`📊 Dashboard: GET /dashboard`);
  console.log(`💚 Health Check: GET /health`);
  console.log(`📈 Stats: GET /stats`);
  console.log('\nWaiting for QuickNode Streams data...\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\nShutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  process.exit(0);
});
