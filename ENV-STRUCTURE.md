# Environment Variables Structure

## 📁 Consolidated Structure

All environment variables are now in **ONE place**: the root `.env` file.

```
S4D5/
├── .env                    ← ALL environment variables here
├── .env.example            ← Template with all variables
├── Backend/
│   ├── helix/
│   ├── auditoracle/
│   └── executionhand/
└── scaffold-eth-2/
    └── packages/
        └── hardhat/
```

## ✅ Benefits

1. **Single source of truth** - All config in one file
2. **Easier management** - Update once, works everywhere
3. **Better organization** - All variables grouped by service
4. **Simpler deployment** - One file to copy to EC2 instances

## 📝 .env File Sections

The root `.env` file contains:

### 1. CDP Wallet Configuration
```bash
CDP_API_KEY_NAME=...
CDP_API_KEY_PRIVATE_KEY=...
NETWORK_ID=base-mainnet
```

### 2. Hardhat / Smart Contracts
```bash
BASESCAN_API_KEY=...
DEPLOYER_PRIVATE_KEY_ENCRYPTED=...
ALCHEMY_API_KEY=...
```

### 3. Nerve-Cord (Communication)
```bash
NERVE_PORT=9999
NERVE_TOKEN=...
NERVE_SERVER=...
```

### 4. Bot Configuration
```bash
BOTNAME=alpha-strategist
ANALYSIS_INTERVAL=300000
MIN_CONFIDENCE=60
...
```

## 🔧 How It Works

All scripts automatically load from the root `.env`:

```javascript
// Backend bots
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '..', '.env') });

// Hardhat scripts
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '..', '..', '.env') });
```

## 📋 What You Need to Do

1. **Fill in your CDP credentials** in the root `.env` file:
   ```bash
   nano .env
   # Add your CDP_API_KEY_NAME and CDP_API_KEY_PRIVATE_KEY
   ```

2. **Copy to EC2 instances**:
   ```bash
   # The same .env file goes on all 3 instances
   scp .env ubuntu@<AS4_IP>:~/S4D5/.env
   scp .env ubuntu@<AO3_IP>:~/S4D5/.env
   scp .env ubuntu@<EH6_IP>:~/S4D5/.env
   ```

3. **Secure the file**:
   ```bash
   chmod 600 .env
   ```

## 🚫 What NOT to Do

- ❌ Don't create separate .env files in subdirectories
- ❌ Don't commit .env to git (it's in .gitignore)
- ❌ Don't use different credentials on different instances
- ❌ Don't share your .env file publicly

## 📚 Reference

- Template: `.env.example` (root)
- Installation guide: `Backend/INSTALL-ON-EC2.md`
- Quick start: `Backend/QUICK-START-EC2.md`
