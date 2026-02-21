#!/usr/bin/env node
/**
 * LLM-Powered Alpha Strategist
 * Entry point for the LLM reasoning agent
 * Replaces hardcoded rules with actual AI thinking
 */

const { AlphaStrategistSkill } = require('../lib/alpha-strategist-skill');
const OpenAI = require('openai');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '..', '.env') });

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Create and run skill
async function main() {
  try {
    // Create skill instance
    const skill = new AlphaStrategistSkill(openai, {
      webhookUrl: process.env.WEBHOOK_API_URL,
      nerveCordPath: process.env.NERVE_CORD_PATH,
      pollingInterval: parseInt(process.env.ANALYSIS_INTERVAL) || 30000,
      minConfidence: parseInt(process.env.MIN_CONFIDENCE) || 60
    });
    
    // Initialize
    await skill.initialize();
    
    // Handle shutdown signals
    process.on('SIGINT', async () => {
      console.log('');
      console.log('Received SIGINT signal');
      await skill.shutdown();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      console.log('');
      console.log('Received SIGTERM signal');
      await skill.shutdown();
      process.exit(0);
    });
    
    // Run main loop
    await skill.run();
    
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Start
main();
