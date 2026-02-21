#!/usr/bin/env node
// 0G Storage upload helper for Nerve-Cord — pins log entries to 0G
// Requires: 0G_EVM_RPC, 0G_INDEXER_RPC, 0G_PRIVATE_KEY in env or .env

const path = require('path');

// --- Load .env from nerve-cord root (same pattern as log.js) ---
function loadEnv() {
  try {
    const envPath = path.join(__dirname, '.env');
    const fs = require('fs');
    if (fs.existsSync(envPath)) {
      fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
          const key = match[1];
          let value = (match[2] || '').trim();
          if (value.length > 0 && value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
          if (!process.env[key]) process.env[key] = value;
        }
      });
    }
  } catch (e) { /* ignore */ }
}
loadEnv();

const RPC_URL = process.env['0G_EVM_RPC'];
const INDEXER_RPC = process.env['0G_INDEXER_RPC'];
const PRIVATE_KEY = process.env['0G_PRIVATE_KEY'];

/**
 * Upload a string or Buffer to 0G Storage.
 * @param {string|Buffer} data - Content to store (e.g. JSON.stringify(entry))
 * @returns {Promise<{ rootHash: string, txHash?: string }>} - rootHash is the 0G content id for later download
 * @throws {Error} if env is missing or upload fails
 */
async function uploadTo0g(data) {
  if (!RPC_URL || !INDEXER_RPC || !PRIVATE_KEY) {
    throw new Error('0G config missing: set 0G_EVM_RPC, 0G_INDEXER_RPC, 0G_PRIVATE_KEY in .env');
  }

  const buf = Buffer.isBuffer(data) ? data : Buffer.from(String(data), 'utf8');
  const uint8 = new Uint8Array(buf);

  const { MemData, Indexer } = await import('@0glabs/0g-ts-sdk');
  const { ethers } = await import('ethers');

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const signer = new ethers.Wallet(PRIVATE_KEY, provider);
  const indexer = new Indexer(INDEXER_RPC);

  const file = new MemData(uint8);
  const [tree, treeErr] = await file.merkleTree();
  if (treeErr != null) {
    throw new Error(`0G merkle tree: ${treeErr}`);
  }
  const opts = { gasLimit: 500000n }; // optional 5th param is TransactionOptions
  const [tx, uploadErr] = await indexer.upload(file, RPC_URL, signer, undefined, undefined, opts);
  if (uploadErr != null) {
    throw new Error(`0G upload: ${uploadErr}`);
  }
  return { rootHash: tx.rootHash, txHash: tx.txHash };
}

// --- Export for server.js ---
module.exports = { uploadTo0g };

// --- CLI test: node 0g_Upload.js '{"test": true}' ---
if (require.main === module) {
  const payload = process.argv[2] || '{"message":"0G test from Nerve-Cord"}';
  uploadTo0g(payload)
    .then(({ rootHash, txHash }) => {
      console.log('Upload OK');
      console.log('rootHash:', rootHash);
      if (txHash) console.log('txHash:', txHash);
    })
    .catch((err) => {
      console.error('Upload failed:', err.message);
      process.exit(1);
    });
}