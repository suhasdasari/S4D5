/**
 * LLM Reasoning Engine
 * Core decision-making using OpenClaw's LLM interface
 * Replaces hardcoded rules with actual reasoning
 */

const fs = require('fs').promises;
const path = require('path');

class LLMReasoningEngine {
  constructor(openclawClient, personalityDocPath = 'ALPHA-STRATEGIST-IDENTITY.md') {
    this.openclawClient = openclawClient;
    this.personalityDocPath = personalityDocPath;
    this.personalityGuidelines = null;
  }

  /**
   * Initialize engine by loading personality guidelines
   */
  async initialize() {
    try {
      const filePath = path.join(__dirname, '..', this.personalityDocPath);
      this.personalityGuidelines = await fs.readFile(filePath, 'utf8');
      console.log('[LLM] Personality guidelines loaded');
    } catch (error) {
      console.error('[LLM] Error loading personality guidelines:', error.message);
      this.personalityGuidelines = 'Default: Analytical, data-driven trading agent';
    }
  }

  /**
   * Analyze market data and make decision
   * This is where LLM reasoning replaces hardcoded formulas
   */
  async analyzeAndDecide(marketData, context) {
    if (!this.personalityGuidelines) {
      await this.initialize();
    }

    // Build prompt for market analysis
    const prompt = this.buildAnalysisPrompt(marketData, context);

    try {
      // Call LLM for reasoning
      const response = await this._callLLM(prompt, {
        temperature: 0.7,
        max_tokens: 1500,
        response_format: { type: 'json_object' }
      });

      // Parse and validate LLM response
      const analysis = this._parseAnalysisResponse(response);
      
      console.log(`[LLM] Analysis complete: ${analysis.asset} - ${analysis.decision} (${analysis.confidence}%)`);
      
      return analysis;
    } catch (error) {
      console.error('[LLM] Error during analysis:', error.message);
      throw error;
    }
  }

  /**
   * Generate proposal content based on analysis
   */
  async generateProposal(analysis, marketData) {
    if (!this.personalityGuidelines) {
      await this.initialize();
    }

    // Build prompt for proposal generation
    const prompt = this.buildProposalPrompt(analysis, marketData);

    try {
      // Call LLM for proposal generation
      const response = await this._callLLM(prompt, {
        temperature: 0.8,
        max_tokens: 1000
      });

      // Parse proposal response
      const proposal = this._parseProposalResponse(response, analysis, marketData);
      
      console.log(`[LLM] Proposal generated for ${analysis.asset} ${analysis.direction}`);
      
      return proposal;
    } catch (error) {
      console.error('[LLM] Error generating proposal:', error.message);
      throw error;
    }
  }

  /**
   * Build prompt for market analysis
   */
  buildAnalysisPrompt(marketData, context) {
    const contextText = context.getContextForPrompt ? context.getContextForPrompt(10) : 'No historical context available.';
    
    // Extract personality summary (first 500 chars)
    const personalitySummary = this.personalityGuidelines.substring(0, 500);

    const prompt = `You are Alpha Strategist, an elite AI trading agent with the personality of a hedge fund CEO.

PERSONALITY SUMMARY:
${personalitySummary}

CURRENT MARKET DATA:
Timestamp: ${marketData.timestamp}
Total Trades: ${marketData.totalTrades}

BTC:
- Price: $${marketData.assets.BTC.price}
- Volume: $${marketData.assets.BTC.volume}
- Price Change: ${marketData.assets.BTC.priceChange}%
- Trend: ${marketData.assets.BTC.trend}
- Buy/Sell Ratio: ${marketData.assets.BTC.buySellRatio}x
- Trade Frequency: ${marketData.assets.BTC.tradeFrequency} trades/min
- Trade Count: ${marketData.assets.BTC.tradeCount}

ETH:
- Price: $${marketData.assets.ETH.price}
- Volume: $${marketData.assets.ETH.volume}
- Price Change: ${marketData.assets.ETH.priceChange}%
- Trend: ${marketData.assets.ETH.trend}
- Buy/Sell Ratio: ${marketData.assets.ETH.buySellRatio}x
- Trade Frequency: ${marketData.assets.ETH.tradeFrequency} trades/min
- Trade Count: ${marketData.assets.ETH.tradeCount}

${contextText}

TASK:
Analyze the current market data and decide whether to send a trading proposal.

Consider:
1. Price trends and momentum - Is this sustainable or overextended?
2. Volume patterns and liquidity - Does volume confirm the move?
3. Buy/sell pressure and sentiment - Who's in control?
4. Trade frequency and activity - Is this a liquid market?
5. Historical outcomes from similar conditions - What worked before?
6. Risk factors and market context - What could go wrong?

IMPORTANT: You make JUDGMENT-BASED decisions, NOT formula-based calculations.
Don't just add up scores. THINK about what the data means.

Provide your analysis in this JSON format:
{
  "asset": "BTC" or "ETH",
  "analysis": "Your detailed market analysis (2-3 sentences)",
  "confidence": 0-100,
  "confidenceReasoning": "Why this confidence level (1-2 sentences)",
  "decision": "send_proposal" or "wait",
  "decisionReasoning": "Why this decision (1-2 sentences)",
  "direction": "LONG" or "SHORT" (only if decision is send_proposal),
  "riskFactors": ["factor1", "factor2"],
  "opportunities": ["opportunity1", "opportunity2"]
}

Remember: Only send proposals when you have genuine conviction based on the data.`;

    return prompt;
  }

  /**
   * Build prompt for proposal generation
   */
  buildProposalPrompt(analysis, marketData) {
    const asset = analysis.asset;
    const assetData = marketData.assets[asset];
    
    // Calculate entry, stop-loss, take-profit
    const entryPrice = assetData.price;
    const stopLoss = analysis.direction === 'LONG' 
      ? entryPrice * 0.97  // -3%
      : entryPrice * 1.03; // +3%
    const takeProfit = analysis.direction === 'LONG'
      ? entryPrice * 1.06  // +6%
      : entryPrice * 0.94; // -6%
    
    // Calculate position size based on confidence
    const baseSize = 100;
    const confidenceMultiplier = Math.max(1, (analysis.confidence - 60) / 10);
    const positionSize = Math.round(baseSize * confidenceMultiplier);
    
    // Determine leverage based on confidence
    const leverage = analysis.confidence >= 80 ? 2 : (analysis.confidence >= 70 ? 1.5 : 1);

    const prompt = `You are Alpha Strategist. Generate a trading proposal for AuditOracle.

ANALYSIS RESULTS:
Asset: ${asset}
Direction: ${analysis.direction}
Confidence: ${analysis.confidence}%
Analysis: ${analysis.analysis}
Reasoning: ${analysis.confidenceReasoning}

MARKET DATA:
Price: $${entryPrice}
Volume: $${assetData.volume}
Trend: ${assetData.trend} (${assetData.priceChange}%)
Buy/Sell Ratio: ${assetData.buySellRatio}x
Trade Frequency: ${assetData.tradeFrequency} trades/min

TRADE PARAMETERS:
Entry: $${entryPrice.toFixed(2)}
Stop-Loss: $${stopLoss.toFixed(2)} (${analysis.direction === 'LONG' ? '-3%' : '+3%'})
Take-Profit: $${takeProfit.toFixed(2)} (${analysis.direction === 'LONG' ? '+6%' : '-6%'})
Position Size: $${positionSize}
Leverage: ${leverage}x

TASK:
Generate a compelling trading proposal that embodies your hedge fund CEO personality.

Format:
🎯 OPEN ${analysis.direction} ${asset}

[Your commentary - be direct, precise, and confidence-calibrated]

Entry: $${entryPrice.toFixed(2)}
Stop-Loss: $${stopLoss.toFixed(2)} (${analysis.direction === 'LONG' ? '-3%' : '+3%'})
Take-Profit: $${takeProfit.toFixed(2)} (${analysis.direction === 'LONG' ? '+6%' : '-6%'})
Position Size: $${positionSize} (${confidenceMultiplier.toFixed(1)}x base)
Leverage: ${leverage}x

Market Snapshot:
- Price: $${entryPrice.toFixed(2)}
- Volume: $${assetData.volume}K
- Trend: ${assetData.trend} (${assetData.priceChange}%)
- Frequency: ${assetData.tradeFrequency} trades/min
- Buy/Sell: ${assetData.buySellRatio}x

Your Analysis:
[Explain your reasoning - why this trade makes sense]

Risk Assessment:
- Max Loss: $[calculate] ([calculate]% of capital)
- Expected Profit: $[calculate]
- Risk/Reward: 1:2

Confidence: ${analysis.confidence}%

Use your characteristic direct, data-driven communication style.`;

    return prompt;
  }

  /**
   * Call LLM API (mock implementation - replace with actual OpenClaw client)
   */
  async _callLLM(prompt, options = {}) {
    // TODO: Replace with actual OpenClaw LLM client call
    // For now, this is a placeholder that would be replaced with:
    // return await this.openclawClient.chat.completions.create({
    //   model: 'gpt-4',
    //   messages: [{ role: 'user', content: prompt }],
    //   ...options
    // });
    
    console.log('[LLM] Calling LLM API...');
    console.log('[LLM] Prompt length:', prompt.length, 'chars');
    
    // Mock response for development
    throw new Error('LLM client not implemented. Replace _callLLM with actual OpenClaw client.');
  }

  /**
   * Parse analysis response from LLM
   */
  _parseAnalysisResponse(response) {
    try {
      // Extract JSON from response
      const content = response.choices[0].message.content;
      const analysis = JSON.parse(content);
      
      // Validate required fields
      const required = ['asset', 'analysis', 'confidence', 'confidenceReasoning', 
                       'decision', 'decisionReasoning'];
      for (const field of required) {
        if (!analysis[field]) {
          throw new Error(`Missing required field: ${field}`);
        }
      }
      
      // Validate confidence range
      if (analysis.confidence < 0 || analysis.confidence > 100) {
        throw new Error('Confidence must be between 0 and 100');
      }
      
      // Validate decision
      if (!['send_proposal', 'wait'].includes(analysis.decision)) {
        throw new Error('Decision must be "send_proposal" or "wait"');
      }
      
      // If sending proposal, direction is required
      if (analysis.decision === 'send_proposal' && !analysis.direction) {
        throw new Error('Direction required when decision is send_proposal');
      }
      
      return analysis;
    } catch (error) {
      console.error('[LLM] Error parsing analysis response:', error.message);
      throw new Error(`Failed to parse LLM analysis: ${error.message}`);
    }
  }

  /**
   * Parse proposal response from LLM
   */
  _parseProposalResponse(response, analysis, marketData) {
    try {
      const content = response.choices[0].message.content;
      
      // Extract subject from first line
      const lines = content.split('\n');
      const subject = lines[0].replace('🎯 ', '').trim();
      
      return {
        subject: subject,
        message: content,
        metadata: {
          asset: analysis.asset,
          direction: analysis.direction,
          confidence: analysis.confidence,
          entryPrice: marketData.assets[analysis.asset].price,
          stopLoss: analysis.direction === 'LONG' 
            ? marketData.assets[analysis.asset].price * 0.97
            : marketData.assets[analysis.asset].price * 1.03,
          takeProfit: analysis.direction === 'LONG'
            ? marketData.assets[analysis.asset].price * 1.06
            : marketData.assets[analysis.asset].price * 0.94,
          positionSize: Math.round(100 * Math.max(1, (analysis.confidence - 60) / 10)),
          leverage: analysis.confidence >= 80 ? 2 : (analysis.confidence >= 70 ? 1.5 : 1)
        }
      };
    } catch (error) {
      console.error('[LLM] Error parsing proposal response:', error.message);
      throw new Error(`Failed to parse LLM proposal: ${error.message}`);
    }
  }

  /**
   * Get personality guidelines (for debugging)
   */
  getPersonalityGuidelines() {
    return this.personalityGuidelines;
  }
}

module.exports = { LLMReasoningEngine };
