# S4D5Vault Contract Function Guide (v2.0.0)

This guide explains all functions available in the security-hardened S4D5Vault contract.

---

## ⚠️ CRITICAL: INITIALIZATION REQUIRED

Before accepting any deposits, the vault MUST be initialized to prevent inflation attacks:

```solidity
// 1. Approve USDC
usdc.approve(vaultAddress, 1000000000); // 1000 USDC

// 2. Initialize vault
vault.initializeVault(1000000000); // Mints 1000 shares to dead address
```

**This is a one-time operation that protects all future depositors!**

---

## 🏦 CORE VAULT FUNCTIONS (User Actions)

### `deposit(uint256 assets, address receiver)`
**What it does:** Deposit USDC into the vault and receive vault shares  
**Who can call:** Anyone with USDC  
**Parameters:**
- `assets`: Amount of USDC to deposit (in USDC units, 6 decimals)
- `receiver`: Address that will receive the vault shares

**Example:** Deposit 100 USDC for yourself
```
assets: 100000000  (100 USDC with 6 decimals)
receiver: 0xYourAddress
```

**Before calling:** You must first call `approve()` on the USDC contract to allow the vault to spend your USDC.

---

### `withdraw(uint256 assets, address receiver, address owner)`
**What it does:** Withdraw USDC from the vault by burning vault shares  
**Who can call:** Share owners or approved operators  
**Parameters:**
- `assets`: Amount of USDC to withdraw (in USDC units, 6 decimals)
- `receiver`: Address that will receive the USDC
- `owner`: Address whose shares will be burned

**Example:** Withdraw 50 USDC to yourself
```
assets: 50000000  (50 USDC with 6 decimals)
receiver: 0xYourAddress
owner: 0xYourAddress
```

---

### `mint(uint256 shares, address receiver)`
**What it does:** Mint exact amount of vault shares by depositing USDC  
**Who can call:** Anyone with USDC  
**Parameters:**
- `shares`: Exact number of vault shares to mint
- `receiver`: Address that will receive the shares

**Note:** This is the opposite of `deposit()`. Instead of specifying USDC amount, you specify share amount.

---

### `redeem(uint256 shares, address receiver, address owner)`
**What it does:** Burn exact amount of vault shares to receive USDC  
**Who can call:** Share owners or approved operators  
**Parameters:**
- `shares`: Exact number of vault shares to burn
- `receiver`: Address that will receive the USDC
- `owner`: Address whose shares will be burned

**Note:** This is the opposite of `withdraw()`. Instead of specifying USDC amount, you specify share amount.

---

## 🔧 INITIALIZATION & CONFIGURATION (Owner Only)

### `initializeVault(uint256 initialDeposit)`
**What it does:** Initialize vault with seed deposit to prevent inflation attack  
**Who can call:** Owner only (one-time operation)  
**Parameters:**
- `initialDeposit`: Amount of USDC to seed (minimum 1000 USDC recommended)

**Example:** Initialize with 1000 USDC
```
initialDeposit: 1000000000  (1000 USDC with 6 decimals)
```

**CRITICAL:** This MUST be called before accepting public deposits!

**What it does internally:**
- Mints 1000 shares to dead address (0x...dEaD)
- Mints remaining shares to owner
- Prevents first depositor inflation attack

---

### `setPriceOracle(address oracle)`
**What it does:** Set price oracle for multi-asset valuation  
**Who can call:** Owner only  
**Parameters:**
- `oracle`: Address of price oracle contract

**Example:** Set Chainlink oracle
```
oracle: 0xChainlinkOracleAddress
```

**Required for:** Multi-asset accounting (tracking non-USDC tokens)

**Oracle Interface:**
```solidity
interface IPriceOracle {
    function getPrice(address token) external view returns (uint256 price);
}
```

---

### `whitelistToken(address token)`
**What it does:** Add a token to the whitelist (vault can hold this token)  
**Who can call:** Owner only  
**Parameters:**
- `token`: Address of the token to whitelist

**Example:** Whitelist WETH
```
token: 0xWETHAddress
```

**Use case:** Before bots can trade for a token, it must be whitelisted.

---

### `removeToken(address token)`
**What it does:** Remove a token from whitelist  
**Who can call:** Owner only  
**Parameters:**
- `token`: Address of the token to remove

**Requirement:** Token balance must be zero before removal.

---

## 🤖 BOT MANAGEMENT FUNCTIONS (Owner Only)

### `authorizeBotWallet(address botWallet)`
**What it does:** Authorize a bot to execute trades and transfer USDC  
**Who can call:** Owner only  
**Parameters:**
- `botWallet`: Address of the bot's CDP wallet

**Example:** Authorize Alpha Strategist bot
```
botWallet: 0xAlphaStrategistCDPWalletAddress
```

**Important:** Once authorized, the bot can execute trades and send USDC on behalf of the vault!

**Security:** Bots are limited to 10 USDC per day for micropayments and can only use whitelisted DEX routers.

---

### `deauthorizeBotWallet(address botWallet)`
**What it does:** Remove bot's authorization to execute trades  
**Who can call:** Owner only  
**Parameters:**
- `botWallet`: Address of the bot to deauthorize

**Use case:** Revoke access if a bot is compromised or no longer needed.

---

### `whitelistDexRouter(address dexRouter)`
**What it does:** Add a DEX router to the whitelist for trading  
**Who can call:** Owner only  
**Parameters:**
- `dexRouter`: Address of the DEX router (e.g., Uniswap V3 Router, Aerodrome Router)

**Example:** Whitelist Uniswap V3 Router
```
dexRouter: 0xUniswapV3RouterAddress
```

**Security:** Only whitelisted DEX routers can be used by bots. This prevents malicious contracts from being approved.

---

### `removeDexRouter(address dexRouter)`
**What it does:** Remove a DEX router from the whitelist  
**Who can call:** Owner only  
**Parameters:**
- `dexRouter`: Address of the DEX router to remove

**Use case:** Remove compromised or deprecated DEX routers.

---

## 🔄 BOT TRADING FUNCTIONS (Authorized Bots Only)

### `executeTrade(address tokenIn, address tokenOut, uint256 amountIn, uint256 minAmountOut, address dexRouter, bytes calldata swapCalldata)`
**What it does:** Execute a trade with atomic swap (approve + swap + reset)  
**Who can call:** Authorized bots only  
**Parameters:**
- `tokenIn`: Address of input token (e.g., USDC)
- `tokenOut`: Address of output token (e.g., WETH)
- `amountIn`: Amount of input token to spend
- `minAmountOut`: Minimum output tokens to receive (slippage protection)
- `dexRouter`: Address of DEX router (must be whitelisted)
- `swapCalldata`: Encoded swap function call for the DEX router

**Example:** Bot trades 1000 USDC for WETH via Uniswap V3
```javascript
// Encode Uniswap V3 swap call
const swapCalldata = uniswapRouter.interface.encodeFunctionData(
  'exactInputSingle',
  [{
    tokenIn: USDC_ADDRESS,
    tokenOut: WETH_ADDRESS,
    fee: 3000,
    recipient: vaultAddress,
    deadline: Math.floor(Date.now() / 1000) + 300,
    amountIn: ethers.parseUnits("1000", 6),
    amountOutMinimum: ethers.parseEther("0.3"),
    sqrtPriceLimitX96: 0
  }]
);

// Execute trade
await vault.executeTrade(
  USDC_ADDRESS,
  WETH_ADDRESS,
  ethers.parseUnits("1000", 6),
  ethers.parseEther("0.3"),
  UNISWAP_V3_ROUTER,
  swapCalldata
);
```

**Security:** 
- Only authorized bots can call this
- Only whitelisted DEX routers are allowed
- Only whitelisted tokens can be traded
- Atomic execution: approve + swap + reset in one transaction
- Slippage protection enforced on-chain
- Approval reset to 0 after swap

**Returns:** Actual amount of output tokens received

---

### `transferUSDC(address recipient, uint256 amount)`
**What it does:** Transfer USDC from vault to another address  
**Who can call:** Authorized bots only  
**Parameters:**
- `recipient`: Address to receive USDC
- `amount`: Amount of USDC to transfer

**Example:** Bot sends 0.001 USDC for x402 micropayment
```
recipient: 0xAuditOracleCDPWallet
amount: 1000  (0.001 USDC with 6 decimals)
```

**Use case:** x402 micropayments between bots (Alpha Strategist pays AuditOracle).

**Security:** Each bot is limited to 10 USDC per day. The limit resets every 24 hours.

---

## 🚨 EMERGENCY FUNCTIONS (Owner Only)

### `emergencyWithdraw(address token)`
**What it does:** Withdraw specific token from vault to owner  
**Who can call:** Owner only  
**Parameters:**
- `token`: Address of token to withdraw (use `address(0)` for ETH)

**Example:** Withdraw all USDC
```
token: 0xUSDCAddress
```

**Example:** Withdraw ETH
```
token: 0x0000000000000000000000000000000000000000
```

**Use case:** Emergency situations where you need to recover funds immediately.

**Warning:** This withdraws everything! Use only in emergencies.

---

## 👤 OWNERSHIP FUNCTIONS

### `transferOwnership(address newOwner)`
**What it does:** Transfer contract ownership to a new address  
**Who can call:** Current owner only  
**Parameters:**
- `newOwner`: Address of the new owner

**Important:** New owner will have full control over bot authorization and emergency withdrawals.

---

## 📊 VIEW FUNCTIONS (Read-Only, No Gas Cost)

### `balanceOf(address account)`
**What it does:** Check how many vault shares an address owns  
**Returns:** Number of vault shares

**Example:**
```
account: 0xYourAddress
Returns: 1000000000000000000  (1 share with 18 decimals)
```

---

### `totalAssets()`
**What it does:** Get total assets under management in USDC terms  
**Returns:** Total value in USDC (6 decimals)

**How it works:**
- Counts USDC balance
- If price oracle is set, adds value of all other tokens
- Uses oracle to convert token balances to USDC value
- Conservative: skips tokens if oracle fails

**Example:**
```
Returns: 50000000000  (50,000 USDC equivalent)
```

**Note:** This is the heart of the vault's accounting system!

---

### `convertToShares(uint256 assets)`
**What it does:** Calculate how many shares you'd get for a USDC amount  
**Parameters:**
- `assets`: Amount of USDC

**Returns:** Number of vault shares

**Use case:** Preview how many shares you'll receive before depositing.

---

### `convertToAssets(uint256 shares)`
**What it does:** Calculate how much USDC you'd get for a share amount  
**Parameters:**
- `shares`: Number of vault shares

**Returns:** Amount of USDC

**Use case:** Preview how much USDC you'll receive before withdrawing.

---

### `previewDeposit(uint256 assets)`
**What it does:** Preview shares you'll receive for a deposit  
**Parameters:**
- `assets`: Amount of USDC to deposit

**Returns:** Number of shares you'll receive

---

### `previewWithdraw(uint256 assets)`
**What it does:** Preview shares you'll need to burn to withdraw USDC  
**Parameters:**
- `assets`: Amount of USDC to withdraw

**Returns:** Number of shares that will be burned

---

### `previewMint(uint256 shares)`
**What it does:** Preview USDC needed to mint exact shares  
**Parameters:**
- `shares`: Number of shares to mint

**Returns:** Amount of USDC needed

---

### `previewRedeem(uint256 shares)`
**What it does:** Preview USDC you'll receive for redeeming shares  
**Parameters:**
- `shares`: Number of shares to redeem

**Returns:** Amount of USDC you'll receive

---

### `maxDeposit(address)`
**What it does:** Get maximum USDC that can be deposited  
**Returns:** Maximum deposit amount (usually unlimited)

---

### `maxMint(address)`
**What it does:** Get maximum shares that can be minted  
**Returns:** Maximum mint amount (usually unlimited)

---

### `maxWithdraw(address owner)`
**What it does:** Get maximum USDC an address can withdraw  
**Parameters:**
- `owner`: Address to check

**Returns:** Maximum USDC withdrawable (based on their shares)

---

### `maxRedeem(address owner)`
**What it does:** Get maximum shares an address can redeem  
**Parameters:**
- `owner`: Address to check

**Returns:** Maximum shares redeemable (their balance)

---

### `getHeldTokens()`
**What it does:** Get list of all tokens held by vault  
**Returns:** Array of token addresses

**Example:**
```
Returns: [0xUSDCAddress, 0xWETHAddress, 0xWBTCAddress]
```

**Use case:** See what tokens the vault currently holds.

---

### `getTokenBalance(address token)`
**What it does:** Get balance of specific token in vault  
**Parameters:**
- `token`: Address of token to check

**Returns:** Token balance

**Example:**
```
token: 0xWETHAddress
Returns: 5000000000000000000  (5 WETH with 18 decimals)
```

---

### `isBotAuthorized(address botWallet)`
**What it does:** Check if a bot is authorized  
**Parameters:**
- `botWallet`: Bot address to check

**Returns:** `true` if authorized, `false` if not

**Example:**
```
botWallet: 0xAlphaStrategistAddress
Returns: true
```

---

### `isDexRouterWhitelisted(address dexRouter)`
**What it does:** Check if a DEX router is whitelisted  
**Parameters:**
- `dexRouter`: DEX router address to check

**Returns:** `true` if whitelisted, `false` if not

**Example:**
```
dexRouter: 0xUniswapV3RouterAddress
Returns: true
```

**Use case:** Verify a DEX router is approved before attempting trades.

---

### `isTokenWhitelisted(address token)`
**What it does:** Check if a token is whitelisted  
**Parameters:**
- `token`: Token address to check

**Returns:** `true` if whitelisted, `false` if not

**Example:**
```
token: 0xWETHAddress
Returns: true
```

---

### `getRemainingMicropaymentAllowance(address bot)`
**What it does:** Get how much USDC a bot can still transfer today  
**Parameters:**
- `bot`: Bot address to check

**Returns:** Remaining USDC amount (6 decimals)

**Example:**
```
bot: 0xAlphaStrategistAddress
Returns: 8500000  (8.5 USDC remaining today)
```

**Use case:** Check if a bot has enough daily allowance before sending micropayments.

**Note:** The allowance resets to 10 USDC every 24 hours.

---

### `authorizedBots(address)`
**What it does:** Direct mapping lookup for bot authorization  
**Parameters:**
- Address to check

**Returns:** `true` if authorized, `false` if not

**Note:** Same as `isBotAuthorized()` but direct mapping access.

---

### `whitelistedDexRouters(address)`
**What it does:** Direct mapping lookup for DEX router whitelist status  
**Parameters:**
- Address to check

**Returns:** `true` if whitelisted, `false` if not

**Note:** Same as `isDexRouterWhitelisted()` but direct mapping access.

---

### `whitelistedTokens(address)`
**What it does:** Direct mapping lookup for token whitelist status  
**Parameters:**
- Address to check

**Returns:** `true` if whitelisted, `false` if not

**Note:** Same as `isTokenWhitelisted()` but direct mapping access.

---

### `dailyMicropaymentUsed(address)`
**What it does:** Get how much USDC a bot has used today  
**Parameters:**
- Bot address to check

**Returns:** USDC amount used today (6 decimals)

**Example:**
```
bot: 0xAlphaStrategistAddress
Returns: 1500000  (1.5 USDC used today)
```

---

### `lastMicropaymentReset(address)`
**What it does:** Get timestamp of last daily limit reset for a bot  
**Parameters:**
- Bot address to check

**Returns:** Unix timestamp

**Use case:** Check when the bot's daily allowance will reset.

---

### `DAILY_MICROPAYMENT_LIMIT()`
**What it does:** Get the daily micropayment limit per bot  
**Returns:** 10000000 (10 USDC with 6 decimals)

**Note:** This is a constant value that applies to all bots.

---

### `priceOracle()`
**What it does:** Get the current price oracle address  
**Returns:** Address of price oracle contract (or address(0) if not set)

---

### `heldTokens(uint256 index)`
**What it does:** Get token address at specific index in held tokens array  
**Parameters:**
- `index`: Array index

**Returns:** Token address

**Note:** Use `getHeldTokens()` to get the full array instead.

---

### `totalTradesExecuted()`
**What it does:** Get total number of trades executed by bots  
**Returns:** Number of trades

---

## 🔐 ERC-20 TOKEN FUNCTIONS (Vault Shares)

### `transfer(address to, uint256 value)`
**What it does:** Transfer vault shares to another address  
**Parameters:**
- `to`: Recipient address
- `value`: Number of shares to transfer

**Use case:** Send your vault shares to someone else.

---

### `transferFrom(address from, address to, uint256 value)`
**What it does:** Transfer shares on behalf of another address  
**Parameters:**
- `from`: Address to transfer from
- `to`: Recipient address
- `value`: Number of shares to transfer

**Requirement:** You must have approval from the `from` address.

---

### `approve(address spender, uint256 value)`
**What it does:** Allow another address to spend your vault shares  
**Parameters:**
- `spender`: Address that can spend your shares
- `value`: Maximum number of shares they can spend

**Use case:** Approve a contract or address to transfer your shares.

---

### `allowance(address owner, address spender)`
**What it does:** Check how many shares a spender is allowed to use  
**Parameters:**
- `owner`: Share owner address
- `spender`: Approved spender address

**Returns:** Number of shares the spender can use

---

## 📝 CONTRACT METADATA (Read-Only)

### `name()`
**What it does:** Get the vault share token name  
**Returns:** "S4D5 Vault Shares"

---

### `symbol()`
**What it does:** Get the vault share token symbol  
**Returns:** "S4D5-VAULT"

---

### `decimals()`
**What it does:** Get the number of decimals for vault shares  
**Returns:** 18 (standard for ERC-20 tokens)

---

### `asset()`
**What it does:** Get the underlying asset address (USDC)  
**Returns:** USDC token address on Base network

---

### `totalSupply()`
**What it does:** Get total number of vault shares in existence  
**Returns:** Total supply of vault shares

---

### `owner()`
**What it does:** Get the current owner address  
**Returns:** Owner's address

---

## 🎯 QUICK START GUIDE

### For Owner (Initial Setup):
1. **Deploy Contract**: `yarn deploy --network baseSepolia`
2. **Initialize Vault**: 
   ```javascript
   await usdc.approve(vaultAddress, ethers.parseUnits("1000", 6));
   await vault.initializeVault(ethers.parseUnits("1000", 6));
   ```
3. **Set Price Oracle**: `await vault.setPriceOracle(oracleAddress)`
4. **Whitelist DEX Routers**: `await vault.whitelistDexRouter(uniswapRouter)`
5. **Whitelist Tokens**: `await vault.whitelistToken(wethAddress)`
6. **Authorize Bots**: `await vault.authorizeBotWallet(botAddress)`

### For Users (Depositing/Withdrawing):
1. **Approve USDC**: Call `approve()` on USDC contract
2. **Deposit**: Call `deposit(amount, yourAddress)`
3. **Check Balance**: Call `balanceOf(yourAddress)`
4. **Withdraw**: Call `withdraw(amount, yourAddress, yourAddress)`

### For Bots (Trading):
1. **Encode Swap**: Create swap calldata for DEX
2. **Execute Trade**: Call `executeTrade(...)` with encoded calldata
3. **Send Payment**: Call `transferUSDC(recipient, amount)` for x402 payments

---

## ⚠️ IMPORTANT NOTES

1. **USDC has 6 decimals**, not 18! Always multiply by 1,000,000 (1e6) for USDC amounts.
2. **Vault shares have 18 decimals** (standard ERC-20).
3. **Always initialize vault** before accepting public deposits (prevents inflation attack).
4. **Set price oracle** for multi-asset accounting to work properly.
5. **Whitelist tokens** before bots can trade for them.
6. **Whitelist DEX routers** before bots can use them.
7. **Only owner** can authorize/deauthorize bots and whitelist assets.
8. **Only authorized bots** can execute trades and transfer USDC.
9. **USDC stays in vault** - bots don't hold funds directly.
10. **Daily micropayment limit**: Each bot can transfer max 10 USDC per day (resets every 24 hours).

---

## 🔒 SECURITY FEATURES

### Multi-Asset Accounting
- Tracks all tokens held by vault
- Uses price oracle to value non-USDC tokens
- Conservative approach: skips tokens if oracle fails
- Prevents share price manipulation

### Inflation Attack Protection
- Requires initialization with seed deposit
- Mints 1000 shares to dead address
- Makes first depositor attack economically infeasible

### Atomic Swap Execution
- Approve + swap + reset in one transaction
- No dangling approvals
- Balance verification before/after
- On-chain slippage protection

### DEX Router Whitelist
- Prevents bots from approving arbitrary contracts
- Owner must explicitly whitelist each DEX router
- Protects against malicious contract approvals

### Token Whitelist
- Vault can only hold whitelisted tokens
- Prevents bots from buying scam tokens
- Owner controls which assets are allowed

### Daily Micropayment Limits
- Each bot limited to 10 USDC per day
- Prevents excessive fund drainage
- Resets automatically every 24 hours
- Check remaining allowance with `getRemainingMicropaymentAllowance()`

### Bot Authorization
- Only owner can authorize/deauthorize bots
- Bots can only execute trades and micropayments
- Cannot withdraw all funds (only owner via emergency)

---

## 🔗 USDC Addresses

- **Base Mainnet**: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- **Base Sepolia**: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`

---

## 📚 RELATED DOCUMENTS

- **S4D5Vault-SECURITY.md** - Detailed security analysis and fixes
- **SECURITY-FIXES-SUMMARY.md** - Quick reference for v2.0.0 changes
- **S4D5Vault.sol** - Contract source code

---

## 📞 SUPPORT

For questions or issues:
- Review the security guide: `S4D5Vault-SECURITY.md`
- Check the fixes summary: `SECURITY-FIXES-SUMMARY.md`
- Test on Base Sepolia before mainnet
- Consider professional audit before mainnet deployment

---

**Contract Version:** 2.0.0 (Security Hardened)  
**Last Updated:** February 2026  
**Status:** Ready for Testnet
