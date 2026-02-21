#!/usr/bin/env node
/**
 * QuickNode Streams Webhook Receiver
 * Receives real-time Hyperliquid trade data from QuickNode Streams
 */

const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.STREAM_WEBHOOK_PORT || 3001;

// Middleware
app.use(express.json({ limit: '10mb' }));

// Store for recent trades (in-memory for now)
const recentTrades = [];
const MAX_TRADES = 1000;

// Statistics
let stats = {
  totalMessages: 0,
  totalTrades: 0,
  lastMessageTime: null,
  startTime: Date.now()
};

/**
 * Main webhook endpoint - receives QuickNode Streams data
 */
app.post('/webhook/quicknode-streams', (req, res) => {
  try {
    const payload = req.body;
    
    // Update stats
    stats.totalMessages++;
    stats.lastMessageTime = new Date().toISOString();
    
    // Log received data
    console.log(`\n📨 Received QuickNode Stream message #${stats.totalMessages}`);
    console.log(`Blocks: ${payload.metadata.batch_start_range} - ${payload.metadata.batch_end_range}`);
    console.log(`Data size: ${payload.metadata.data_size_bytes} bytes`);
    
    // Process each block in the batch
    if (payload.data && Array.isArray(payload.data)) {
      payload.data.forEach(block => {
        if (block.trades && Array.isArray(block.trades)) {
          block.trades.forEach(trade => {
            // Store trade
            recentTrades.unshift({
              ...trade,
              block_number: block.block_number,
              block_time: block.block_time,
              received_at: new Date().toISOString()
            });
            
            stats.totalTrades++;
            
            // Log trade details
            console.log(`  💱 Trade: ${trade.coin} ${trade.side} ${trade.sz} @ $${trade.px}`);
          });
          
          // Keep only recent trades
          if (recentTrades.length > MAX_TRADES) {
            recentTrades.splice(MAX_TRADES);
          }
        }
      });
    }
    
    // Respond with 200 OK
    res.status(200).json({ 
      success: true, 
      processed: stats.totalMessages,
      trades: stats.totalTrades
    });
    
  } catch (error) {
    console.error('❌ Error processing webhook:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: Date.now() - stats.startTime,
    stats: stats
  });
});

/**
 * Get recent trades
 */
app.get('/trades/recent', (req, res) => {
  const limit = parseInt(req.query.limit) || 100;
  res.json({
    trades: recentTrades.slice(0, limit),
    total: recentTrades.length,
    stats: stats
  });
});

/**
 * Get trades for specific coin
 */
app.get('/trades/:coin', (req, res) => {
  const coin = req.params.coin.toUpperCase();
  const limit = parseInt(req.query.limit) || 100;
  
  const coinTrades = recentTrades
    .filter(t => t.coin === coin)
    .slice(0, limit);
  
  res.json({
    coin: coin,
    trades: coinTrades,
    count: coinTrades.length
  });
});

/**
 * Get statistics
 */
app.get('/stats', (req, res) => {
  const uptime = Date.now() - stats.startTime;
  const uptimeMinutes = Math.floor(uptime / 60000);
  
  // Calculate trades per minute
  const tradesPerMinute = uptimeMinutes > 0 
    ? (stats.totalTrades / uptimeMinutes).toFixed(2) 
    : 0;
  
  // Get coin distribution
  const coinCounts = {};
  recentTrades.forEach(t => {
    coinCounts[t.coin] = (coinCounts[t.coin] || 0) + 1;
  });
  
  res.json({
    uptime: {
      ms: uptime,
      minutes: uptimeMinutes,
      hours: (uptimeMinutes / 60).toFixed(2)
    },
    messages: {
      total: stats.totalMessages,
      lastReceived: stats.lastMessageTime
    },
    trades: {
      total: stats.totalTrades,
      stored: recentTrades.length,
      perMinute: tradesPerMinute,
      byAsset: coinCounts
    }
  });
});

/**
 * Root endpoint - show API info
 */
app.get('/', (req, res) => {
  res.json({
    service: 'QuickNode Streams Webhook Receiver',
    version: '1.0.0',
    endpoints: {
      webhook: 'POST /webhook/quicknode-streams',
      health: 'GET /health',
      recentTrades: 'GET /trades/recent?limit=100',
      coinTrades: 'GET /trades/:coin?limit=100',
      stats: 'GET /stats'
    },
    stats: stats
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 QuickNode Streams Webhook Receiver started`);
  console.log(`📡 Listening on port ${PORT}`);
  console.log(`🔗 Webhook URL: http://localhost:${PORT}/webhook/quicknode-streams`);
  console.log(`📊 Stats URL: http://localhost:${PORT}/stats`);
  console.log(`\n⏳ Waiting for stream data...\n`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n📊 Final Statistics:');
  console.log(`   Messages received: ${stats.totalMessages}`);
  console.log(`   Trades processed: ${stats.totalTrades}`);
  console.log(`   Uptime: ${Math.floor((Date.now() - stats.startTime) / 60000)} minutes`);
  console.log('\n👋 Shutting down...\n');
  process.exit(0);
});
