# Chainlink Price Oracle Guide

## Why Chainlink Instead of Mock?

### MockPriceOracle Problems:
- ❌ Manual price updates required
- ❌ Single point of failure (owner)
- ❌ No real-time market data
- ❌ Vulnerable to manipulation
- ❌ Not suitable for production

### Chainlink Benefits:
- ✅ Real-time market prices
- ✅ Decentralized oracle network
- ✅ Battle-tested and secure
- ✅ Automatic updates
- ✅ Production-ready
- ✅ Used by major DeFi protocols (Aave, Compound, Synthetix)

---

## How It Works

### Architecture:

```
S4D5Vault
    ↓ (calls getPrice)
ChainlinkPriceOracle
    ↓ (reads from)
Chainlink Price Feed (ETH/USD, BTC/USD, etc.)
    ↓ (aggregates from)
Multiple Data Providers (Coinbase, Binance, Kraken, etc.)
```

### Price Calculation:

1. **Vault calls `totalAssets()`**
2. **For each non-USDC token:**
   - Calls `ChainlinkPriceOracle.getPrice(token)`
   - Oracle reads from Chainlink feed
   - Converts price to USDC terms (6 decimals)
   - Adjusts for token decimals
3. **Returns total value in USDC**

---

## Available Price Feeds on Base

### Base Mainnet:

| Asset | Feed Address | Decimals |
|-------|-------------|----------|
| ETH/USD | `0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70` | 8 |
| BTC/USD | `0x64c911996D3c6aC71f9b455B1E8E7266BcbD848F` | 8 |
| LINK/USD | `0x5f0423B1a6935dc5596e7A24d98532b67A0AeFd8` | 8 |
| USDC/USD | `0x7e860098F58bBFC8648a4311b374B1D669a2bc6B` | 8 |
| DAI/USD | `0x591e79239a7d679378eC8c847e5038150364C78F` | 8 |

**Full list:** https://docs.chain.link/data-feeds/price-feeds/addresses?network=base

### Base Sepolia (Testnet):

| Asset | Feed Address | Decimals |
|-------|-------------|----------|
| ETH/USD | `0x4aDC67696bA383F43DD60A9e78F2C97Fbbfc7cb1` | 8 |

**Note:** Limited feeds on testnet. For testing other assets, you can:
1. Use mainnet feeds (they work on testnet)
2. Deploy MockPriceOracle for assets without feeds
3. Use ETH as proxy for testing

---

## Deployment

### Deploy Chainlink Oracle:

```bash
cd scaffold-eth-2/packages/hardhat
yarn deploy --network baseSepolia --tags ChainlinkPriceOracle
```

This will:
1. Deploy ChainlinkPriceOracle contract
2. Configure ETH/USD price feed automatically
3. Verify on BaseScan

### Link to Vault:

```bash
yarn hardhat run scripts/configure-vault.ts --network baseSepolia
```

Or manually:
```javascript
await vault.setPriceOracle(chainlinkOracleAddress);
```

---

## Configuration

### Add Price Feed for a Token:

```javascript
// In Hardhat console
const oracle = await ethers.getContract("ChainlinkPriceOracle");

// Add WBTC (8 decimals)
await oracle.setPriceFeed(
  "0xWBTCAddress",
  "0x64c911996D3c6aC71f9b455B1E8E7266BcbD848F", // BTC/USD feed
  8 // WBTC decimals
);
```

### Add Multiple Feeds at Once:

```javascript
const tokens = [
  "0xWETHAddress",
  "0xWBTCAddress",
  "0xLINKAddress"
];

const feeds = [
  "0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70", // ETH/USD
  "0x64c911996D3c6aC71f9b455B1E8E7266BcbD848F", // BTC/USD
  "0x5f0423B1a6935dc5596e7A24d98532b67A0AeFd8"  // LINK/USD
];

const decimals = [18, 8, 18];

await oracle.setPriceFeeds(tokens, feeds, decimals);
```

---

## Security Features

### 1. Staleness Check
```solidity
require(block.timestamp - updatedAt < 1 hours, "Price data stale");
```
- Rejects prices older than 1 hour
- Prevents using outdated data

### 2. Price Validation
```solidity
require(answer > 0, "Invalid price from Chainlink");
```
- Ensures price is positive
- Catches feed errors

### 3. Feed Verification
```solidity
priceFeed.latestRoundData(); // Will revert if feed is invalid
```
- Validates feed on setup
- Prevents invalid feed addresses

### 4. Decimal Normalization
- Converts all prices to 6 decimals (USDC standard)
- Handles different token decimals (8, 18, etc.)
- Ensures consistent valuation

---

## Testing

### Test Price Retrieval:

```javascript
// In Hardhat console
const oracle = await ethers.getContract("ChainlinkPriceOracle");
const WETH = "0x4200000000000000000000000000000000000006";

// Get ETH price in USDC
const price = await oracle.getPrice(WETH);
console.log("ETH Price:", ethers.formatUnits(price, 6), "USDC");

// Check if feed is set
const hasFeed = await oracle.hasPriceFeed(WETH);
console.log("Has feed:", hasFeed);

// Get feed address
const feedAddress = await oracle.getPriceFeed(WETH);
console.log("Feed address:", feedAddress);
```

### Test Vault Integration:

```javascript
const vault = await ethers.getContract("S4D5Vault");

// Check oracle is set
const oracleAddress = await vault.priceOracle();
console.log("Oracle:", oracleAddress);

// Check total assets (includes all tokens valued in USDC)
const totalAssets = await vault.totalAssets();
console.log("Total assets:", ethers.formatUnits(totalAssets, 6), "USDC");
```

---

## Common Issues & Solutions

### Issue: "Price feed not set for token"
**Solution:** Add price feed for the token
```javascript
await oracle.setPriceFeed(tokenAddress, feedAddress, decimals);
```

### Issue: "Price data stale"
**Solution:** Chainlink feed hasn't updated in >1 hour
- Check feed status on Chainlink docs
- May need to use different feed
- Contact Chainlink if persistent

### Issue: "Invalid price from Chainlink"
**Solution:** Feed returned 0 or negative price
- Check feed is correct for network
- Verify feed is active
- May be temporary issue, retry

### Issue: Incorrect token valuation
**Solution:** Check token decimals are correct
```javascript
// Verify decimals match token
const token = await ethers.getContractAt("IERC20Metadata", tokenAddress);
const decimals = await token.decimals();
console.log("Token decimals:", decimals);

// Update oracle if wrong
await oracle.setPriceFeed(tokenAddress, feedAddress, decimals);
```

---

## Comparison: Mock vs Chainlink

| Feature | MockPriceOracle | ChainlinkPriceOracle |
|---------|----------------|---------------------|
| **Price Source** | Manual updates | Real-time market data |
| **Decentralization** | Single owner | Decentralized network |
| **Update Frequency** | Manual | Automatic (minutes) |
| **Security** | Low (manipulation risk) | High (battle-tested) |
| **Maintenance** | High (constant updates) | Low (automatic) |
| **Production Ready** | ❌ No | ✅ Yes |
| **Cost** | Free (gas only) | Free (gas only) |
| **Use Case** | Testing only | Production |

---

## Migration from Mock to Chainlink

If you already deployed MockPriceOracle:

### Step 1: Deploy Chainlink Oracle
```bash
yarn deploy --network baseSepolia --tags ChainlinkPriceOracle
```

### Step 2: Configure Price Feeds
```javascript
const oracle = await ethers.getContract("ChainlinkPriceOracle");
// Add all your tokens...
```

### Step 3: Update Vault
```javascript
const vault = await ethers.getContract("S4D5Vault");
await vault.setPriceOracle(await oracle.getAddress());
```

### Step 4: Verify
```javascript
// Check prices match expectations
const totalAssets = await vault.totalAssets();
console.log("Total assets:", ethers.formatUnits(totalAssets, 6), "USDC");
```

---

## Best Practices

### 1. Always Use Chainlink for Production
- MockPriceOracle is for testing only
- Chainlink is industry standard

### 2. Verify Feed Addresses
- Double-check feed addresses from official docs
- Test on testnet first
- Verify prices are reasonable

### 3. Monitor Feed Health
- Check Chainlink status page
- Set up alerts for stale data
- Have backup plan for feed failures

### 4. Handle Edge Cases
- What if feed goes down?
- What if price is stale?
- Consider circuit breakers

### 5. Test Thoroughly
- Test with real market conditions
- Test with multiple tokens
- Test edge cases (stale data, invalid feeds)

---

## Resources

- **Chainlink Docs:** https://docs.chain.link/
- **Base Price Feeds:** https://docs.chain.link/data-feeds/price-feeds/addresses?network=base
- **Chainlink Status:** https://status.chain.link/
- **Feed Registry:** https://docs.chain.link/data-feeds/feed-registry

---

## Summary

**Use ChainlinkPriceOracle for:**
- ✅ Production deployments
- ✅ Real trading
- ✅ Mainnet
- ✅ Accurate valuations

**Use MockPriceOracle for:**
- ✅ Local testing
- ✅ Development
- ✅ Quick prototyping
- ❌ Never for production!

**The vault is now production-ready with Chainlink integration!**
