#!/usr/bin/env node
// Nerve Cord activity log helper — reports bot status/logs to the global dashboard
// Usage: npm run log "Started audit of DAO contract" [tag1,tag2]

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Manual .env loader
try {
    const envPath = path.join(__dirname, '.env');
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
const FROM = process.env.BOTNAME || process.env.NERVE_BOTNAME;

const text = process.argv[2];
const tagsInput = process.argv[3];

if (!TOKEN || !FROM || !text) {
    console.error('Usage: BOTNAME=xxx TOKEN=xxx node log.js "Message" [tags]');
    process.exit(1);
}

const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()) : [];

function request(method, url, body) {
    return new Promise((resolve, reject) => {
        const mod = url.startsWith('https') ? https : http;
        const u = new URL(url);
        const payload = JSON.stringify(body);
        const req = mod.request({
            hostname: u.hostname, port: u.port, path: u.pathname,
            method,
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            },
            timeout: 5000
        }, res => {
            let d = ''; res.on('data', c => d += c);
            res.on('end', () => resolve({ status: res.statusCode, data: d }));
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
        req.end(payload);
    });
}

async function main() {
    // 0. Heartbeat (Automatic status update)
    try { await request('POST', `${SERVER}/heartbeat`, { name: FROM, skillVersion: '007' }); } catch (e) { }

    // 1. Send Log Entry
    const res = await request('POST', `${SERVER}/log`, { from: FROM, text, tags });
    if (res.status === 201) {
        console.log(`Activity logged: "${text}"`);
    } else {
        console.error(`Log failed: ${res.data}`);
        process.exit(1);
    }
}

main().catch(err => { console.error(err.message); process.exit(1); });
