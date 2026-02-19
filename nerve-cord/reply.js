#!/usr/bin/env node
// Nerve Cord reply helper
// Usage: TOKEN=xxx SERVER=http://localhost:9999 node reply.js <msgId> <from> <body> [--encrypted]

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
const msgId = process.argv[2];
const from = process.argv[3];
const body = process.argv[4];
const encrypted = process.argv.includes('--encrypted');

if (!TOKEN || !msgId || !from || !body) {
  console.error('Usage: TOKEN=xxx node reply.js <msgId> <from> <body> [--encrypted]');
  process.exit(1);
}

const payload = JSON.stringify({ from, body, encrypted });
const url = new URL(`${SERVER}/messages/${msgId}/reply`);
const mod = url.protocol === 'https:' ? https : http;

const req = mod.request(url, {
  method: 'POST',
  headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
}, res => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => console.log(data));
});
req.on('error', e => { console.error('Error:', e.message); process.exit(1); });
req.end(payload);
