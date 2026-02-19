#!/usr/bin/env node
// Nerve Cord checker — polls for pending messages and prints them
// Usage: TOKEN=xxx BOTNAME=clawdheart SERVER=http://localhost:9999 node check.js
// Exit 0 with JSON if messages found, exit 0 with empty string if none

const http = require('http');
const https = require('https');

const fs = require('fs');

// Manual .env loader (dependency-free)
try {
  const envPath = require('path').join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        if (value.length > 0 && value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        if (!process.env[key]) process.env[key] = value;
      }
    });
  }
} catch (e) { }

const SERVER = process.env.SERVER || process.env.NERVE_SERVER || 'https://s4d5-production.up.railway.app';
const TOKEN = process.env.TOKEN || process.env.NERVE_TOKEN;
const BOTNAME = process.env.BOTNAME || process.env.NERVE_BOTNAME;

if (!TOKEN || !BOTNAME) { console.error('TOKEN and BOTNAME required'); process.exit(1); }

const url = `${SERVER}/messages?to=${BOTNAME}&status=pending`;
const mod = url.startsWith('https') ? https : http;

mod.get(url, { headers: { Authorization: `Bearer ${TOKEN}` } }, res => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    try {
      let msgs = JSON.parse(data);
      // Loop prevention:
      // 1. Self-replies (Re: anything from myself) — always a loop
      // 2. Deep reply chains (Re: Re: from anyone) — ping-pong between bots
      msgs = msgs.filter(m => {
        const subj = m.subject || '';
        if (m.from === BOTNAME && subj.startsWith('Re:')) return false;
        if (subj.startsWith('Re: Re:')) return false;
        return true;
      });
      // Limit to 3 messages per poll to avoid timeouts
      msgs = msgs.slice(0, 3);
      if (!msgs.length) process.exit(0); // no output = nothing to do
      console.log(JSON.stringify(msgs, null, 2));
    } catch (e) { console.error('Parse error:', e.message); process.exit(1); }
  });
}).on('error', e => { console.error('Request error:', e.message); process.exit(1); });
