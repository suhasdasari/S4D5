/**
 * Alpha Strategist Skill
 * Main orchestration class for LLM-powered trading agent
 * Integrates all components: fetcher, context, LLM, executor, payment
 */

const { MarketDataFetcher } = require('./market-data-fetcher');
const { DecisionContextManager } = require('./decision-context');
const { LLMReasoningEngine } = require('./llm-agent');
const { ProposalExecutor } = require('./proposal-executor');
const { PaymentManager } = require('./payment-manager');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '..', '.env') });

class AlphaStrategistSkill {
  constructor(openaiClient, options = {}) {
    // Configuration
    this.webhookUrl = options.webhookUrl || process.env.WEBHOOK_API_URL || 'https://s4d5-production-f42d.up.railway.app/dashboard';
    this.nerveCordPath = options.nerveCordPath || process.env.NERVE_CORD_PATH || path.join(__dirname, '..', '..', '..', 'nerve-cord');
    this.pollingInterval = options.pollingInterval || parseInt(process.env.ANALYSIS_INTERVAL) || 30000;
    this.minConfidence = options.minConfidence || parseInt(process.env.MIN_CONFIDENCE) || 60;
    
    // Components
    this.fetcher = new MarketDataFetcher(this.webhookUrl);
    this.context = new DecisionContextManager();
    this.llm = new LLMReasoningEngine(openaiClient);
    this.executor = new ProposalExecutor(this.nerveCordPath);
    this.payment = new PaymentManager(this.nerveCordPath);
    
    // State
    this.isRunning = false;
    this.cycleCount = 0;
    this.lastError = null;
  }

  /**
   * Initialize all components
   */
  async initialize() {
    try {
      console.log('🚀 Alpha Strategist LLM Skill Initializing...');
      console.log(`📡 Webhook: ${this.webhookUrl}`);
      console.log(`⏱️  Interval: ${this.pollingInterval/1000}s`);
      console.log(`🎯 Min Confidence: ${this.minConfidence}%`);
      console.log('');
      
      // Initialize context manager
      await this.context.load();
      console.log('[Init] ✓ Context manager loaded');
      
      // Initialize LLM engine
      await this.llm.initialize();
      console.log('[Init] ✓ LLM engine initialized');
      
      // Initialize proposal executor
      await this.executor.initialize();
      console.log('[Init] ✓ Proposal executor initialized');
      
      // Initialize payment manager
      await this.payment.initialize();
      console.log('[Init] ✓ Payment manager initialized');
      
      console.log('');
      console.log('✅ Initialization complete');
      console.log('');
      
    } catch (error) {
      console.error(`❌ Initialization failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Main execution loop
   */
  async run() {
    this.isRunning = true;
    
    console.log('🎯 Starting execution loop...');
    console.log('');
    
    while (this.isRunning) {
      try {
        this.cycleCount++;
        console.log(`[Cycle ${this.cycleCount}] ========================================`);
        console.log(`[Cycle ${this.cycleCount}] ${new Date().toISOString()}`);
        
        // Execute one cycle
        await this.executeCycle();
        
        // Process queued proposals
        await this.executor.processQueue();
        
        console.log(`[Cycle ${this.cycleCount}] Complete. Next cycle in ${this.pollingInterval/1000}s`);
        console.log('');
        
        // Wait for next cycle
        await this.sleep(this.pollingInterval);
        
      } catch (error) {
        await this.handleError(error);
      }
    }
  }

  /**
   * Execute one analysis cycle
   */
  async executeCycle() {
    try {
      // Step 1: Fetch market data
      console.log(`[Cycle ${this.cycleCount}] Step 1: Fetching market data...`);
      const marketData = await this.fetcher.fetchData();
      
      // Step 2: Analyze BTC
      console.log(`[Cycle ${this.cycleCount}] Step 2: Analyzing BTC...`);
      await this.analyzeAsset('BTC', marketData);
      
      // Step 3: Analyze ETH
      console.log(`[Cycle ${this.cycleCount}] Step 3: Analyzing ETH...`);
      await this.analyzeAsset('ETH', marketData);
      
      // Step 4: Save context
      console.log(`[Cycle ${this.cycleCount}] Step 4: Saving context...`);
      await this.context.save();
      
    } catch (error) {
      console.error(`[Cycle ${this.cycleCount}] ✗ Cycle failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Analyze single asset and make decision
   */
  async analyzeAsset(asset, marketData) {
    try {
      // Prepare asset-specific market data
      const assetMarketData = {
        timestamp: marketData.timestamp,
        totalTrades: marketData.totalTrades,
        assets: {
          [asset]: marketData.assets[asset]
        }
      };
      
      // Call LLM for analysis and decision
      console.log(`[${asset}] Calling LLM for analysis...`);
      const analysis = await this.llm.analyzeAndDecide(assetMarketData, this.context);
      
      console.log(`[${asset}] Decision: ${analysis.decision}`);
      console.log(`[${asset}] Confidence: ${analysis.confidence}%`);
      console.log(`[${asset}] Analysis: ${analysis.analysis}`);
      
      // Record decision in context
      await this.context.addDecision({
        asset: analysis.asset,
        decision: analysis.decision,
        confidence: analysis.confidence,
        analysis: analysis.analysis,
        confidenceReasoning: analysis.confidenceReasoning,
        decisionReasoning: analysis.decisionReasoning,
        marketData: assetMarketData,
        timestamp: Date.now()
      });
      
      // If decision is to send proposal, execute it
      if (analysis.decision === 'send_proposal') {
        await this.executeProposal(analysis, assetMarketData);
      } else {
        console.log(`[${asset}] No proposal sent (decision: wait)`);
      }
      
    } catch (error) {
      console.error(`[${asset}] ✗ Analysis failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Execute proposal (send + payment)
   */
  async executeProposal(analysis, marketData) {
    try {
      const asset = analysis.asset;
      
      console.log(`[${asset}] Generating proposal...`);
      
      // Generate proposal using LLM
      const proposal = await this.llm.generateProposal(analysis, marketData);
      
      console.log(`[${asset}] Proposal generated: ${proposal.subject}`);
      
      // Send proposal via Nerve-Cord
      console.log(`[${asset}] Sending proposal...`);
      const sendResult = await this.executor.sendProposal({
        asset,
        direction: analysis.direction,
        confidence: analysis.confidence,
        analysis: analysis.analysis,
        confidenceReasoning: analysis.confidenceReasoning,
        metadata: proposal.metadata,
        marketData: marketData.assets[asset]
      });
      
      if (!sendResult.success) {
        console.error(`[${asset}] ✗ Proposal send failed: ${sendResult.error}`);
        return;
      }
      
      console.log(`[${asset}] ✓ Proposal sent: ${sendResult.proposalId}`);
      
      // Send x402 payment
      console.log(`[${asset}] Sending payment...`);
      const paymentResult = await this.payment.sendPayment(sendResult.proposalId, {
        asset,
        direction: analysis.direction,
        confidence: analysis.confidence
      });
      
      if (paymentResult.success) {
        console.log(`[${asset}] ✓ Payment sent: ${paymentResult.txHash.substring(0, 10)}...`);
      } else {
        console.error(`[${asset}] ✗ Payment failed: ${paymentResult.error}`);
      }
      
    } catch (error) {
      console.error(`[${analysis.asset}] ✗ Proposal execution failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Handle errors during execution
   */
  async handleError(error) {
    this.lastError = error;
    console.error('');
    console.error(`❌ ERROR: ${error.message}`);
    console.error('');
    
    // Log error details
    if (error.stack) {
      console.error('Stack trace:');
      console.error(error.stack);
      console.error('');
    }
    
    // Determine if error is critical
    const isCritical = this.isCriticalError(error);
    
    if (isCritical) {
      console.error('🚨 CRITICAL ERROR - Shutting down');
      await this.shutdown();
      process.exit(1);
    } else {
      console.log('⚠️  Non-critical error - Continuing operation');
      console.log(`Retrying in ${this.pollingInterval/1000}s...`);
      console.log('');
    }
  }

  /**
   * Determine if error is critical
   */
  isCriticalError(error) {
    const criticalPatterns = [
      'wallet not initialized',
      'cannot read property',
      'cannot access',
      'out of memory'
    ];
    
    const errorMsg = error.message.toLowerCase();
    return criticalPatterns.some(pattern => errorMsg.includes(pattern));
  }

  /**
   * Shutdown gracefully
   */
  async shutdown() {
    console.log('');
    console.log('🛑 Shutting down Alpha Strategist...');
    
    this.isRunning = false;
    
    try {
      // Save context
      await this.context.save();
      console.log('[Shutdown] ✓ Context saved');
      
      // Process remaining queued proposals
      await this.executor.processQueue();
      console.log('[Shutdown] ✓ Queue processed');
      
      console.log('');
      console.log('✅ Shutdown complete');
      
    } catch (error) {
      console.error(`[Shutdown] Error: ${error.message}`);
    }
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      cycleCount: this.cycleCount,
      lastError: this.lastError ? this.lastError.message : null,
      config: {
        webhookUrl: this.webhookUrl,
        pollingInterval: this.pollingInterval,
        minConfidence: this.minConfidence
      }
    };
  }
}

module.exports = { AlphaStrategistSkill };
