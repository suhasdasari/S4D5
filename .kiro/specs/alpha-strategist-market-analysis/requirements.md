# Requirements Document

## Introduction

The Alpha Strategist Market Analysis Bot is an OpenClaw-based autonomous trading agent that analyzes cryptocurrency market data and generates trade proposals for the S4D5 AI Hedge Fund. As part of a 3-agent council system, the Alpha Strategist fetches real-time market data from QuickNode (Hyperliquid) and sentiment data from Polymarket, uses its configured LLM for reasoning about market conditions, and communicates trade proposals to the AuditOracle agent via the Nerve-Cord messaging system.

## Glossary

- **Alpha_Strategist**: The market analysis bot responsible for generating trade proposals
- **AuditOracle**: The risk management agent that reviews and approves/rejects trade proposals
- **ExecutionHand**: The execution agent that implements approved trades
- **Nerve_Cord**: The terminal-based inter-agent messaging system using npm scripts
- **QuickNode_API**: The API service providing Hyperliquid market data (price, volume, order book)
- **Polymarket_API**: The API service providing prediction market sentiment data
- **Trade_Proposal**: A structured JSON message containing asset, action, quantity, price target, reasoning, confidence score, and risk assessment
- **OpenClaw**: The bot framework that enables shell command execution and provides LLM capabilities
- **Analysis_Interval**: The configurable time period between market analysis runs
- **Confidence_Score**: A numerical value (0-100) indicating the bot's confidence in a trade proposal

## Requirements

### Requirement 1: Fetch Hyperliquid Market Data

**User Story:** As the Alpha Strategist bot, I want to fetch real-time market data from QuickNode Hyperliquid API, so that I can analyze current market conditions for trading decisions.

#### Acceptance Criteria

1. WHEN the Analysis_Interval timer triggers, THE Alpha_Strategist SHALL fetch price data from QuickNode_API
2. WHEN the Analysis_Interval timer triggers, THE Alpha_Strategist SHALL fetch volume data from QuickNode_API
3. WHEN the Analysis_Interval timer triggers, THE Alpha_Strategist SHALL fetch order book depth data from QuickNode_API
4. WHEN QuickNode_API returns valid data, THE Alpha_Strategist SHALL parse the response into structured market data objects
5. IF QuickNode_API returns an error response, THEN THE Alpha_Strategist SHALL log the error and retry after 30 seconds
6. IF QuickNode_API fails after 3 retry attempts, THEN THE Alpha_Strategist SHALL skip the current analysis cycle and wait for the next Analysis_Interval

### Requirement 2: Fetch Polymarket Sentiment Data

**User Story:** As the Alpha Strategist bot, I want to fetch sentiment data from Polymarket API, so that I can incorporate prediction market signals into my trading analysis.

#### Acceptance Criteria

1. WHEN the Analysis_Interval timer triggers, THE Alpha_Strategist SHALL fetch relevant prediction market data from Polymarket_API
2. WHEN Polymarket_API returns valid data, THE Alpha_Strategist SHALL parse sentiment indicators from the response
3. IF Polymarket_API returns an error response, THEN THE Alpha_Strategist SHALL log the error and continue analysis without sentiment data
4. THE Alpha_Strategist SHALL correlate Polymarket sentiment data with cryptocurrency market conditions

### Requirement 3: Analyze Market Conditions

**User Story:** As the Alpha Strategist bot, I want to analyze market trends and patterns using my configured LLM, so that I can identify profitable trading opportunities with clear reasoning.

#### Acceptance Criteria

1. WHEN market data is successfully fetched, THE Alpha_Strategist SHALL analyze price trends over the last 24 hours
2. WHEN market data is successfully fetched, THE Alpha_Strategist SHALL analyze volume patterns to identify unusual activity
3. WHEN market data is successfully fetched, THE Alpha_Strategist SHALL analyze order book depth to assess liquidity
4. WHEN sentiment data is available, THE Alpha_Strategist SHALL incorporate Polymarket signals into the analysis
5. WHEN analyzing market conditions, THE Alpha_Strategist SHALL use its configured LLM to generate reasoning about market trends and trading opportunities
6. WHEN using the LLM, THE Alpha_Strategist SHALL include market context, risk factors, and sentiment data in the prompt
7. THE Alpha_Strategist SHALL generate trading signals with values of BUY, SELL, or HOLD
8. THE Alpha_Strategist SHALL calculate a Confidence_Score between 0 and 100 for each trading signal
9. THE Alpha_Strategist SHALL extract natural language reasoning from the LLM response to explain each trading signal
10. WHERE multiple analysis strategies are configured, THE Alpha_Strategist SHALL execute each strategy and aggregate results

### Requirement 4: Create Trade Proposals

**User Story:** As the Alpha Strategist bot, I want to generate structured trade proposals, so that the AuditOracle can review them efficiently.

#### Acceptance Criteria

1. WHEN a BUY or SELL signal is generated with Confidence_Score above 60, THE Alpha_Strategist SHALL create a Trade_Proposal
2. THE Alpha_Strategist SHALL include the asset symbol in each Trade_Proposal
3. THE Alpha_Strategist SHALL include the action (buy or sell) in each Trade_Proposal
4. THE Alpha_Strategist SHALL include the recommended quantity in each Trade_Proposal
5. THE Alpha_Strategist SHALL include the target price in each Trade_Proposal
6. THE Alpha_Strategist SHALL include the natural language reasoning in each Trade_Proposal
7. THE Alpha_Strategist SHALL include the Confidence_Score in each Trade_Proposal
8. THE Alpha_Strategist SHALL include a risk assessment in each Trade_Proposal
9. THE Alpha_Strategist SHALL include an expected return estimate in each Trade_Proposal
10. THE Alpha_Strategist SHALL format each Trade_Proposal as valid JSON

### Requirement 5: Send Proposals via Nerve-Cord

**User Story:** As the Alpha Strategist bot, I want to send trade proposals to the AuditOracle via Nerve-Cord, so that they can be reviewed for risk and compliance.

#### Acceptance Criteria

1. WHEN a Trade_Proposal is created, THE Alpha_Strategist SHALL execute the Nerve_Cord send command with the proposal as payload
2. THE Alpha_Strategist SHALL address Trade_Proposals to the AuditOracle agent
3. WHEN the Nerve_Cord send command completes successfully, THE Alpha_Strategist SHALL log the sent proposal
4. IF the Nerve_Cord send command fails, THEN THE Alpha_Strategist SHALL retry up to 3 times with exponential backoff

### Requirement 6: Check Inbox for Responses

**User Story:** As the Alpha Strategist bot, I want to check my Nerve-Cord inbox for responses from AuditOracle, so that I can track which proposals were approved or rejected.

#### Acceptance Criteria

1. WHEN the Analysis_Interval timer triggers, THE Alpha_Strategist SHALL execute the Nerve_Cord check command
2. WHEN the Nerve_Cord check command returns messages, THE Alpha_Strategist SHALL parse each message
3. WHEN a message contains an approval, THE Alpha_Strategist SHALL log the approved proposal
4. WHEN a message contains a rejection, THE Alpha_Strategist SHALL log the rejection reason

### Requirement 7: Log Activities to Dashboard

**User Story:** As a system operator, I want the Alpha Strategist to log major milestones to the Nerve-Cord dashboard, so that I can monitor bot activity and performance.

#### Acceptance Criteria

1. WHEN the Alpha_Strategist starts an analysis cycle, THE Alpha_Strategist SHALL execute the Nerve_Cord log command with a cycle start message
2. WHEN the Alpha_Strategist sends a Trade_Proposal, THE Alpha_Strategist SHALL execute the Nerve_Cord log command with proposal details
3. WHEN the Alpha_Strategist receives a response from AuditOracle, THE Alpha_Strategist SHALL execute the Nerve_Cord log command with the response
4. WHEN an error occurs, THE Alpha_Strategist SHALL execute the Nerve_Cord log command with error details

### Requirement 8: Configure Analysis Parameters

**User Story:** As a system operator, I want to configure analysis intervals and thresholds via environment variables, so that I can control bot behavior without code changes.

#### Acceptance Criteria

1. THE Alpha_Strategist SHALL read the Analysis_Interval from environment variables with a default value of 300 seconds
2. THE Alpha_Strategist SHALL read the minimum Confidence_Score threshold from environment variables with a default value of 60
3. THE Alpha_Strategist SHALL read QuickNode_API credentials from environment variables
4. THE Alpha_Strategist SHALL read Polymarket_API credentials from environment variables
5. IF any required environment variable is missing, THEN THE Alpha_Strategist SHALL log an error and exit with a non-zero status code

### Requirement 9: Handle API Failures Gracefully

**User Story:** As a system operator, I want the Alpha Strategist to handle API failures gracefully with retries and fallbacks, so that temporary outages do not crash the bot.

#### Acceptance Criteria

1. WHEN an API call fails with a network error, THE Alpha_Strategist SHALL retry the request after 30 seconds
2. WHEN an API call fails with a rate limit error, THE Alpha_Strategist SHALL wait for the rate limit reset time before retrying
3. IF an API call fails 3 consecutive times, THEN THE Alpha_Strategist SHALL skip the current operation and continue with the next scheduled task
4. WHEN an API failure occurs, THE Alpha_Strategist SHALL log the failure details including error message and timestamp
5. THE Alpha_Strategist SHALL continue running after API failures without crashing

### Requirement 10: Run on Configurable Intervals

**User Story:** As a system operator, I want the Alpha Strategist to run analysis cycles on configurable intervals, so that I can balance data freshness with API costs.

#### Acceptance Criteria

1. WHEN the Alpha_Strategist starts, THE Alpha_Strategist SHALL initialize a timer with the configured Analysis_Interval
2. WHEN the timer expires, THE Alpha_Strategist SHALL execute a complete analysis cycle
3. WHEN an analysis cycle completes, THE Alpha_Strategist SHALL reset the timer for the next cycle
4. THE Alpha_Strategist SHALL continue running indefinitely until explicitly stopped
5. WHEN the Analysis_Interval is updated in environment variables, THE Alpha_Strategist SHALL apply the new interval after the current cycle completes

### Requirement 11: Update Agent Priorities

**User Story:** As the Alpha Strategist bot, I want to update my priority status in Nerve-Cord based on market conditions, so that other agents understand the urgency of my proposals.

#### Acceptance Criteria

1. WHEN the Alpha_Strategist detects high-confidence trading opportunities (Confidence_Score above 80), THE Alpha_Strategist SHALL execute the Nerve_Cord priority command with high priority
2. WHEN the Alpha_Strategist detects moderate opportunities (Confidence_Score between 60 and 80), THE Alpha_Strategist SHALL execute the Nerve_Cord priority command with normal priority
3. WHEN the Alpha_Strategist detects no opportunities, THE Alpha_Strategist SHALL execute the Nerve_Cord priority command with low priority
