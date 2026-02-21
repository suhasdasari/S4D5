#!/usr/bin/env node
const path = require('path');
const fs = require('fs');

// Load .env (same as 0g_upload.js)
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (m && !process.env[m[1]]) {
      let v = (m[2] || '').trim();
      if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
      process.env[m[1]] = v;
    }
  });
}

const INDEXER_RPC = process.env['0G_INDEXER_RPC'];
const rootHash = process.argv[2] || process.argv[1] || '0xdbcc32bc179c5ae55f881a0a5a993124812e61f4f3cf9b945c00227d6a69b42f';

(async () => {
  const { Indexer } = await import('@0glabs/0g-ts-sdk');
  const indexer = new Indexer(INDEXER_RPC);
  const tmp = path.join(require('os').tmpdir(), '0g-fetch-' + Date.now() + '.bin');
  const err = await indexer.download(rootHash, tmp, false);
  if (err) { console.error(err.message); process.exit(1); }
  const buf = fs.readFileSync(tmp);
  fs.unlinkSync(tmp);
  console.log(buf.toString('utf8'));
})();