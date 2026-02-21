/**
 * Decision Context Manager
 * Maintains and persists historical context for LLM reasoning
 * Enables learning from past decisions and outcomes
 */

const fs = require('fs').promises;
const path = require('path');

class DecisionContextManager {
  constructor(storageFile = 'data/decision-context.json', maxContextSize = 100) {
    this.storageFile = storageFile;
    this.maxContextSize = maxContextSize;
    this.context = null;
  }

  /**
   * Load context from persistent storage
   * Creates new context if file doesn't exist
   */
  async load() {
    try {
      const filePath = path.join(__dirname, '..', this.storageFile);
      const data = await fs.readFile(filePath, 'utf8');
      this.context = JSON.parse(data);
      
      // Validate schema
      if (!this.context.version || !this.context.decisions || !this.context.summary) {
        throw new Error('Invalid context schema');
      }
      
      console.log(`[Context] Loaded ${this.context.decisions.length} decisions from storage`);
      return this.context;
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File doesn't exist, create new context
        console.log('[Context] No existing context found, creating new');
        this.context = this._createEmptyContext();
        await this.save();
        return this.context;
      }
      throw error;
    }
  }

  /**
   * Add new decision to context
   */
  addDecision(decision) {
    if (!this.context) {
      throw new Error('Context not loaded. Call load() first.');
    }

    const decisionEntry = {
      id: decision.id || `DEC-${Date.now()}`,
      timestamp: decision.timestamp || new Date().toISOString(),
      asset: decision.asset,
      marketData: decision.marketData,
      analysis: decision.analysis,
      confidence: decision.confidence,
      decision: decision.decision, // 'send_proposal' or 'wait'
      reasoning: decision.reasoning,
      proposalSent: decision.proposalSent || false,
      proposalId: decision.proposalId || null
    };

    this.context.decisions.push(decisionEntry);
    
    // Update summary
    this.context.summary.totalDecisions++;
    if (decision.proposalSent) {
      this.context.summary.proposalsSent++;
    }
    this.context.summary.lastUpdated = new Date().toISOString();

    // Check if context size limit exceeded
    if (this.context.decisions.length > this.maxContextSize) {
      this.summarizeOldEntries();
    }

    console.log(`[Context] Added decision ${decisionEntry.id} (${decision.decision})`);
    return decisionEntry.id;
  }

  /**
   * Add outcome for previous decision
   */
  addOutcome(proposalId, outcome) {
    if (!this.context) {
      throw new Error('Context not loaded. Call load() first.');
    }

    const decision = this.context.decisions.find(d => d.proposalId === proposalId);
    if (!decision) {
      console.warn(`[Context] Decision with proposalId ${proposalId} not found`);
      return false;
    }

    decision.outcome = {
      approved: outcome.approved,
      executed: outcome.executed,
      result: outcome.result,
      timestamp: outcome.timestamp || new Date().toISOString()
    };

    // Update approval rate
    const decisionsWithOutcomes = this.context.decisions.filter(d => d.outcome);
    const approvedCount = decisionsWithOutcomes.filter(d => d.outcome.approved).length;
    this.context.summary.approvalRate = approvedCount / decisionsWithOutcomes.length;

    console.log(`[Context] Added outcome for ${proposalId}: ${outcome.approved ? 'APPROVED' : 'REJECTED'}`);
    return true;
  }

  /**
   * Get context formatted for LLM prompt
   * Returns recent decisions and summary statistics
   */
  getContextForPrompt(limit = 10) {
    if (!this.context) {
      return 'No historical context available.';
    }

    const recentDecisions = this.context.decisions.slice(-limit);
    
    let contextText = `HISTORICAL CONTEXT:\n\n`;
    contextText += `Summary Statistics:\n`;
    contextText += `- Total Decisions: ${this.context.summary.totalDecisions}\n`;
    contextText += `- Proposals Sent: ${this.context.summary.proposalsSent}\n`;
    contextText += `- Approval Rate: ${(this.context.summary.approvalRate * 100).toFixed(1)}%\n`;
    contextText += `- Average Confidence: ${this.context.summary.avgConfidence?.toFixed(1) || 'N/A'}%\n\n`;

    if (recentDecisions.length > 0) {
      contextText += `Recent Decisions (last ${recentDecisions.length}):\n\n`;
      
      recentDecisions.forEach((dec, idx) => {
        contextText += `${idx + 1}. [${dec.timestamp}] ${dec.asset} - ${dec.decision.toUpperCase()}\n`;
        contextText += `   Confidence: ${dec.confidence}%\n`;
        contextText += `   Reasoning: ${dec.reasoning.substring(0, 150)}...\n`;
        
        if (dec.outcome) {
          contextText += `   Outcome: ${dec.outcome.approved ? '✓ APPROVED' : '✗ REJECTED'}`;
          if (dec.outcome.result) {
            contextText += ` (${dec.outcome.result})`;
          }
          contextText += `\n`;
        }
        contextText += `\n`;
      });
    } else {
      contextText += `No recent decisions available.\n`;
    }

    return contextText;
  }

  /**
   * Summarize old entries when size limit reached
   * Keeps recent detailed history, summarizes older entries
   */
  summarizeOldEntries() {
    const keepDetailed = Math.floor(this.maxContextSize * 0.7); // Keep 70% as detailed
    const toSummarize = this.context.decisions.length - keepDetailed;

    if (toSummarize <= 0) return;

    const oldEntries = this.context.decisions.slice(0, toSummarize);
    const recentEntries = this.context.decisions.slice(toSummarize);

    // Calculate summary statistics for old entries
    const summary = {
      count: oldEntries.length,
      timeRange: {
        start: oldEntries[0].timestamp,
        end: oldEntries[oldEntries.length - 1].timestamp
      },
      proposalsSent: oldEntries.filter(d => d.proposalSent).length,
      avgConfidence: oldEntries.reduce((sum, d) => sum + d.confidence, 0) / oldEntries.length,
      outcomes: {
        approved: oldEntries.filter(d => d.outcome?.approved).length,
        rejected: oldEntries.filter(d => d.outcome && !d.outcome.approved).length
      }
    };

    // Create summarized entry
    const summarizedEntry = {
      id: `SUMMARY-${Date.now()}`,
      type: 'summary',
      timestamp: new Date().toISOString(),
      summary: summary,
      note: `Summarized ${toSummarize} old entries to maintain context size`
    };

    // Replace old entries with summary + recent entries
    this.context.decisions = [summarizedEntry, ...recentEntries];

    console.log(`[Context] Summarized ${toSummarize} old entries, kept ${keepDetailed} detailed`);
  }

  /**
   * Persist context to disk
   */
  async save() {
    if (!this.context) {
      throw new Error('No context to save');
    }

    try {
      const filePath = path.join(__dirname, '..', this.storageFile);
      const dirPath = path.dirname(filePath);
      
      // Ensure directory exists
      await fs.mkdir(dirPath, { recursive: true });
      
      // Update summary statistics
      if (this.context.decisions.length > 0) {
        const decisionsWithConfidence = this.context.decisions.filter(d => d.confidence);
        if (decisionsWithConfidence.length > 0) {
          this.context.summary.avgConfidence = 
            decisionsWithConfidence.reduce((sum, d) => sum + d.confidence, 0) / 
            decisionsWithConfidence.length;
        }
      }
      
      this.context.summary.lastUpdated = new Date().toISOString();
      
      // Write to file
      await fs.writeFile(filePath, JSON.stringify(this.context, null, 2), 'utf8');
      console.log(`[Context] Saved ${this.context.decisions.length} decisions to ${filePath}`);
    } catch (error) {
      console.error('[Context] Error saving context:', error.message);
      throw error;
    }
  }

  /**
   * Create empty context structure
   */
  _createEmptyContext() {
    return {
      version: '1.0',
      lastUpdated: new Date().toISOString(),
      decisions: [],
      summary: {
        totalDecisions: 0,
        proposalsSent: 0,
        approvalRate: 0,
        avgConfidence: 0,
        lastUpdated: new Date().toISOString()
      }
    };
  }

  /**
   * Get full context (for debugging/analysis)
   */
  getFullContext() {
    return this.context;
  }

  /**
   * Clear all context (use with caution)
   */
  async clear() {
    this.context = this._createEmptyContext();
    await this.save();
    console.log('[Context] Context cleared');
  }
}

module.exports = { DecisionContextManager };
