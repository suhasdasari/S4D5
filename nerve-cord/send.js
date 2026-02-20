#!/usr/bin/env node
// Nerve Cord send helper — fetch key, encrypt, send in one step
// Usage: TOKEN=xxx SERVER=http://server:9999 node send.js <to> <subject> <message>
// Env: TOKEN (required), SERVER or NERVE_SERVER (default: http://localhost:9999)

const http = require('http');
const https = require('https');
const crypto = require('crypto');

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
const FROM = process.env.BOTNAME || process.env.NERVE_BOTNAME;
const to = process.argv[2];
const subject = process.argv[3];
const message = process.argv[4];

if (!TOKEN || !FROM || !to || !subject || !message) {
  console.error('Usage: TOKEN=xxx BOTNAME=xxx node send.js <to> <subject> <message>');
  console.error('Env: TOKEN, BOTNAME (or NERVE_BOTNAME), SERVER (or NERVE_SERVER)');
  process.exit(1);
}

function request(method, url, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const u = new URL(url);
    const opts = {
      hostname: u.hostname, port: u.port, path: u.pathname + u.search,
      method, headers: { Authorization: `Bearer ${TOKEN}`, ...headers }, timeout: 10000
    };
    if (body) {
      const payload = typeof body === 'string' ? body : JSON.stringify(body);
      opts.headers['Content-Type'] = 'application/json';
      opts.headers['Content-Length'] = Buffer.byteLength(payload);
      const req = mod.request(opts, res => {
        let d = ''; res.on('data', c => d += c);
        res.on('end', () => resolve({ status: res.statusCode, data: d }));
      });
      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
      req.end(payload);
    } else {
      const req = mod.request(opts, res => {
        let d = ''; res.on('data', c => d += c);
        res.on('end', () => resolve({ status: res.statusCode, data: d }));
      });
      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
      req.end();
    }
  });
}

function encrypt(publicKeyPem, plaintext) {
  const aesKey = crypto.randomBytes(32);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', aesKey, iv);
  let encrypted = cipher.update(plaintext, 'utf8');
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  const authTag = cipher.getAuthTag();
  const encryptedKey = crypto.publicEncrypt(
    { key: publicKeyPem, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' },
    aesKey
  );
  const combined = Buffer.concat([encryptedKey, iv, authTag, encrypted]);
  return combined.toString('base64');
}

const NAME_MAP = {
  'susmitha': 'audit-oracle',
  'karthik': 'execution-hand',
  'suhas': 'alpha-strategist',
  'auditoracle': 'audit-oracle',
  'executionhand': 'execution-hand',
  'alphastrategist': 'alpha-strategist'
};

async function main() {
  // 0. Heartbeat (Let dashboard know we are active)
  try {
    const skillVersion = '007'; // Track system version
    await request('POST', `${SERVER}/heartbeat`, { name: FROM, skillVersion });
  } catch (e) { }

  // 1. Auto-Register (Self-Heal)
  try {
    const pubPath = require('path').join(__dirname, 'keys', `${FROM}.pub`);
    if (fs.existsSync(pubPath)) {
      const pubKey = fs.readFileSync(pubPath, 'utf8');
      await request('POST', `${SERVER}/bots`, { name: FROM, publicKey: pubKey });
    }
  } catch (e) { }

  // 2. Fetch recipient's public key (Robust matching)
  let recipientId = to.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (NAME_MAP[recipientId]) {
    process.stdout.write(`(Mapping "${to}" to "${NAME_MAP[recipientId]}")\n`);
    recipientId = NAME_MAP[recipientId];
  } else {
    // Fallback to fuzzy match logic if not in explicit map
    recipientId = to.toLowerCase().replace(/_/g, '-');
  }

  let botRes = await request('GET', `${SERVER}/bots/${recipientId}`);

  if (botRes.status !== 200) {
    if (botRes.status === 404) {
      console.error(`RECIPIENT NOT FOUND: "${to}" is not registered on the Nerve-Cord. Tell them to start their service!`);
    } else {
      console.error(`Failed to get public key for ${to}: ${botRes.data}`);
    }
    process.exit(1);
  }
  const bot = JSON.parse(botRes.data);
  const publicKey = bot.publicKey;

  // 3. Encrypt the message
  const encryptedBody = encrypt(publicKey, message);

  // 3. Send it
  const msgRes = await request('POST', `${SERVER}/messages`, {
    from: FROM, to, subject, body: encryptedBody, encrypted: true
  });
  if (msgRes.status === 201) {
    const msg = JSON.parse(msgRes.data);
    console.log(`Sent encrypted message ${msg.id} to ${to}`);
  } else {
    console.error(`Send failed: ${msgRes.data}`);
    process.exit(1);
  }
}

main().catch(e => { console.error(e.message); process.exit(1); });
