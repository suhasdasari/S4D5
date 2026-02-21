#!/usr/bin/env node

/**
 * Ping-Team Helper
 * Sends a status check message to both AuditOracle and ExecutionHand via Nerve-Cord.
 */

const { execSync } = require('child_process');

const RECIPIENTS = ['audit-oracle', 'execution-hand'];
const SUBJECT = 'TEAM_PING';
const MESSAGE = 'Suhas is asking if the team is online. Please acknowledge.';

console.log(`[${new Date().toISOString()}] Initiating team-wide ping...`);

for (const recipient of RECIPIENTS) {
    try {
        console.log(`Pinging ${recipient}...`);
        execSync(`node send.js "${recipient}" "${SUBJECT}" "${MESSAGE}"`, { encoding: 'utf8' });
        console.log(`✔ Success`);
    } catch (e) {
        console.error(`✘ Failed to ping ${recipient}: ${e.message}`);
    }
}

console.log(`\nTeam ping complete. Check back in 5-10 seconds for replies using 'node check.js'.`);
