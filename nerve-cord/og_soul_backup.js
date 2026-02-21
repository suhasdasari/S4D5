#!/usr/bin/env node
// 0G Soul Backup — uploads agent Soul files to 0G Storage
// Usage: node og_soul_backup.js
// Requires: 0G_EVM_RPC, 0G_INDEXER_RPC, 0G_PRIVATE_KEY in .env

const path = require('path');
const fs = require('fs');

// Load .env from nerve-cord root (same pattern as 0g_Upload.js)
function loadEnv() {
  try {
    const envPath = path.join(__dirname, '.env');
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

// Require uploadTo0g from 0g_Upload.js
const { uploadTo0g } = require('./0g_Upload');

// Soul files to upload
const SOUL_DIR = path.join(__dirname, 'automation', 'soul_templates');
const SOUL_FILES = [
  'alpha_strategist.md',
  'audit_oracle.md',
  'execution_hand.md'
];

/**
 * Upload all Soul files to 0G Storage
 */
async function backupSouls() {
  console.log('Starting Soul backup to 0G...\n');

  const results = [];

  for (const filename of SOUL_FILES) {
    const filePath = path.join(SOUL_DIR, filename);
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  ${filename}: File not found, skipping`);
      results.push({ filename, status: 'skipped', reason: 'not found' });
      continue;
    }

    try {
      console.log(`📄 Uploading ${filename}...`);
      const content = fs.readFileSync(filePath, 'utf8');
      const { rootHash, txHash } = await uploadTo0g(content);
      
      console.log(`✅ ${filename}: Upload OK`);
      console.log(`   rootHash: ${rootHash}`);
      if (txHash) console.log(`   txHash: ${txHash}`);
      console.log('');
      
      results.push({ filename, status: 'success', rootHash, txHash });
    } catch (err) {
      console.error(`❌ ${filename}: Upload failed`);
      console.error(`   Error: ${err.message}`);
      console.log('');
      results.push({ filename, status: 'failed', error: err.message });
    }
  }

  // Summary
  console.log('--- Summary ---');
  const successful = results.filter(r => r.status === 'success').length;
  const failed = results.filter(r => r.status === 'failed').length;
  const skipped = results.filter(r => r.status === 'skipped').length;
  
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⚠️  Skipped: ${skipped}`);
  
  if (successful > 0) {
    console.log('\nSuccessfully uploaded Souls:');
    results.filter(r => r.status === 'success').forEach(r => {
      console.log(`  - ${r.filename}: ${r.rootHash}`);
    });
  }

  return results;
}

// Run if executed directly
if (require.main === module) {
  backupSouls()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.error('Fatal error:', err.message);
      process.exit(1);
    });
}

module.exports = { backupSouls };
