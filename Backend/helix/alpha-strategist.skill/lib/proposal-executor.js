/**
 * Proposal Executor
 * Sends trading proposals to AuditOracle via Nerve-Cord
 * Handles message formatting, retries, and queuing
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

class ProposalExecutor {
  constructor(nerveCordPath, options = {}) {
    this.nerveCordPath = nerveCordPath;
    this.maxRetries = options.maxRetries || 3;
    this.baseDelay = options.baseDelay || 2000; // 2 seconds
    this.queuePath = options.queuePath || path.join(__dirname, '..', 'data', 'proposal-queue.json');
    this.queue = [];
  }

  /**
   * Initialize executor (load queued proposals)
   */
  async initialize() {
    try {
      const data = await fs.readFile(this.queuePath, 'utf8');
      this.queue = JSON.parse(data);
      console.log(`[Executor] Loaded ${this.queue.length} queued proposals`);
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log('[Executor] No queued proposals found');
        this.queue = [];
      } else {
        console.error(`[Executor] Error loading queue: ${error.message}`);
        this.queue = [];
      }
    }
  }

  /**
   * Send proposal to AuditOracle
   */
  async sendProposal(proposal) {
    const proposalId = this.generateProposalId(proposal);
    
    console.log(`[Executor] Sending proposal ${proposalId}: ${proposal.direction} ${proposal.asset}`);
    
    try {
      // Format message
      const { subject, message } = this.formatMessage(proposal, proposalId);
      
      // Send with retry
      await this.sendWithRetry(subject, message, proposalId);
      
      console.log(`[Executor] ✓ Proposal ${proposalId} sent successfully`);
      
      return {
        success: true,
        proposalId,
        timestamp: Date.now()
      };
      
    } catch (error) {
      console.error(`[Executor] ✗ Failed to send proposal ${proposalId}: ${error.message}`);
      
      // Add to queue for retry later
      await this.addToQueue(proposal, proposalId);
      
      return {
        success: false,
        proposalId,
        error: error.message,
        queued: true
      };
    }
  }

  /**
   * Format proposal as message for AuditOracle
   */
  formatMessage(proposal, proposalId) {
    const subject = `Trade Proposal: ${proposal.direction} ${proposal.asset}`;
    
    const message = `🎯 OPEN ${proposal.direction} ${proposal.asset}
Proposal ID: ${proposalId}
Leverage: ${proposal.metadata.leverage}x
Entry Price: ${proposal.metadata.entryPrice.toFixed(2)}
Stop-Loss: ${proposal.metadata.stopLoss.toFixed(2)} (${proposal.direction === 'LONG' ? '-' : '+'}3%)
Take-Profit: ${proposal.metadata.takeProfit.toFixed(2)} (${proposal.direction === 'LONG' ? '+' : '-'}6%)
Position Size: ${proposal.metadata.positionSize}
Confidence: ${proposal.confidence.toFixed(1)}%

Market Snapshot:
- Price: ${proposal.metadata.entryPrice.toFixed(2)}
- Volume: ${(proposal.marketData.volume/1000).toFixed(1)}K
- Trend: ${proposal.marketData.trend} (${proposal.marketData.priceChange.toFixed(2)}%)
- Trade Frequency: ${proposal.marketData.tradeFrequency.toFixed(0)} trades/min
- Buy/Sell Ratio: ${proposal.marketData.buySellRatio.toFixed(2)}x

Analysis:
${proposal.analysis}

Reasoning:
${proposal.confidenceReasoning}

Risk Assessment:
- Max Loss: ${this.calculateMaxLoss(proposal)}
- Expected Profit: ${this.calculateExpectedProfit(proposal)}
- Risk/Reward: 1:2

Timestamp: ${new Date().toISOString()}
Source: LLM-Powered Alpha Strategist`;

    return { subject, message };
  }

  /**
   * Send message with exponential backoff retry
   */
  async sendWithRetry(subject, message, proposalId) {
    let lastError = null;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`[Executor] Attempt ${attempt}/${this.maxRetries}: Sending via Nerve-Cord...`);
        
        // Execute Nerve-Cord send command
        execSync(`npm run send audit-oracle "${subject}" "${message}"`, {
          cwd: this.nerveCordPath,
          stdio: 'pipe',
          timeout: 10000 // 10 second timeout
        });
        
        // Log to Nerve-Cord
        execSync(`npm run log "📊 Sent proposal: ${proposalId} - ${subject}" "alpha-strategist,proposal"`, {
          cwd: this.nerveCordPath,
          stdio: 'pipe',
          timeout: 5000
        });
        
        console.log(`[Executor] ✓ Message sent successfully`);
        return;
        
      } catch (error) {
        lastError = error;
        console.error(`[Executor] ✗ Attempt ${attempt} failed: ${error.message}`);
        
        // If this was the last attempt, throw
        if (attempt === this.maxRetries) {
          throw lastError;
        }
        
        // Exponential backoff
        const delay = this.baseDelay * Math.pow(2, attempt - 1);
        console.log(`[Executor] Retrying in ${delay}ms...`);
        await this.sleep(delay);
      }
    }
    
    throw lastError || new Error('Failed to send message');
  }

  /**
   * Generate unique proposal ID
   */
  generateProposalId(proposal) {
    const timestamp = Date.now();
    const asset = proposal.asset;
    const direction = proposal.direction;
    return `PROP-${asset}-${direction}-${timestamp}`;
  }

  /**
   * Calculate maximum loss for risk assessment
   */
  calculateMaxLoss(proposal) {
    const entryPrice = proposal.metadata.entryPrice;
    const stopLoss = proposal.metadata.stopLoss;
    const positionSize = proposal.metadata.positionSize;
    const leverage = proposal.metadata.leverage;
    
    const lossPerUnit = Math.abs(entryPrice - stopLoss);
    const totalLoss = lossPerUnit * positionSize * leverage;
    
    return `$${totalLoss.toFixed(2)} (${((lossPerUnit/entryPrice) * 100).toFixed(1)}% of capital)`;
  }

  /**
   * Calculate expected profit for risk assessment
   */
  calculateExpectedProfit(proposal) {
    const entryPrice = proposal.metadata.entryPrice;
    const takeProfit = proposal.metadata.takeProfit;
    const positionSize = proposal.metadata.positionSize;
    const leverage = proposal.metadata.leverage;
    
    const profitPerUnit = Math.abs(takeProfit - entryPrice);
    const totalProfit = profitPerUnit * positionSize * leverage;
    
    return `$${totalProfit.toFixed(2)}`;
  }

  /**
   * Add failed proposal to queue
   */
  async addToQueue(proposal, proposalId) {
    this.queue.push({
      proposalId,
      proposal,
      timestamp: Date.now(),
      attempts: 0
    });
    
    await this.saveQueue();
    console.log(`[Executor] Proposal ${proposalId} added to queue (${this.queue.length} total)`);
  }

  /**
   * Process queued proposals
   */
  async processQueue() {
    if (this.queue.length === 0) {
      return;
    }
    
    console.log(`[Executor] Processing ${this.queue.length} queued proposals...`);
    
    const processed = [];
    
    for (const item of this.queue) {
      try {
        const { subject, message } = this.formatMessage(item.proposal, item.proposalId);
        await this.sendWithRetry(subject, message, item.proposalId);
        
        console.log(`[Executor] ✓ Queued proposal ${item.proposalId} sent`);
        processed.push(item.proposalId);
        
      } catch (error) {
        console.error(`[Executor] ✗ Queued proposal ${item.proposalId} failed again: ${error.message}`);
        item.attempts++;
        
        // Remove if too many attempts
        if (item.attempts >= 5) {
          console.error(`[Executor] Removing ${item.proposalId} after 5 failed attempts`);
          processed.push(item.proposalId);
        }
      }
    }
    
    // Remove processed items
    this.queue = this.queue.filter(item => !processed.includes(item.proposalId));
    await this.saveQueue();
    
    console.log(`[Executor] Queue processing complete (${this.queue.length} remaining)`);
  }

  /**
   * Save queue to disk
   */
  async saveQueue() {
    try {
      await fs.writeFile(this.queuePath, JSON.stringify(this.queue, null, 2));
    } catch (error) {
      console.error(`[Executor] Error saving queue: ${error.message}`);
    }
  }

  /**
   * Sleep utility for retry delays
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = { ProposalExecutor };
