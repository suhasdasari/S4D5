# S4D5Vault Contract Function Guide

This guide explains all functions available in the S4D5Vault contract.

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

---

### `deauthorizeBotWallet(address botWallet)`
**What it does:** Remove bot's authorization to execute trades  
**Who can call:** Owner only  
**Parameters:**
- `botWallet`: Address of the bot to deauthorize

**Use case:** Revoke access if a bot is compromised or no longer needed.

---

## 🔄 BOT TRADING FUNCTIONS (Authorized Bots Only)

### `executeTrade(address token, uint256 amountIn, uint256 minAmountOut, address dexRouter, address[] path)`
**What it does:** Execute a trade using vault's USDC  
**Who can call:** Authorized bots only  
**Parameters:**
- `token`: Address of token to trade for
- `amountIn`: Amount of USDC to spend
- `minAmountOut`: Minimum tokens to receive (slippage protection)
- `dexRouter`: Address of DEX router (e.g., Uniswap)
- `path`: Token swap path (currently unused in placeholder)

**Example:** Bot trades 1000 USDC for ETH
```
token: 0xETHAddress
amountIn: 1000000000  (1000 USDC)
minAmountOut: 500000000000000000  (0.5 ETH minimum)
dexRouter: 0xUniswapRouterAddress
path: []  (placeholder)
```

**Security:** Only authorized bots can call this. USDC stays in vault during trade.

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

---

## 🚨 EMERGENCY FUNCTIONS (Owner Only)

### `emergencyWithdraw()`
**What it does:** Withdraw ALL USDC from vault to owner  
**Who can call:** Owner only  
**Parameters:** None

**Use case:** Emergency situations where you need to recover all funds immediately.

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
**What it does:** Get total USDC held in the vault  
**Returns:** Total USDC amount (6 decimals)

**Example:**
```
Returns: 50000000000  (50,000 USDC)
```

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

### `authorizedBots(address)`
**What it does:** Direct mapping lookup for bot authorization  
**Parameters:**
- Address to check

**Returns:** `true` if authorized, `false` if not

**Note:** Same as `isBotAuthorized()` but direct mapping access.

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

### `totalTradesExecuted()`
**What it does:** Get total number of trades executed by bots  
**Returns:** Number of trades

---

## 🎯 QUICK START GUIDE

### For Users (Depositing/Withdrawing):
1. **Approve USDC**: Call `approve()` on USDC contract
2. **Deposit**: Call `deposit(amount, yourAddress)`
3. **Check Balance**: Call `balanceOf(yourAddress)`
4. **Withdraw**: Call `withdraw(amount, yourAddress, yourAddress)`

### For Owner (Managing Bots):
1. **Authorize Bot**: Call `authorizeBotWallet(botAddress)`
2. **Check Status**: Call `isBotAuthorized(botAddress)`
3. **Deauthorize**: Call `deauthorizeBotWallet(botAddress)` if needed

### For Bots (Trading):
1. **Execute Trade**: Call `executeTrade(...)` with trade parameters
2. **Send Payment**: Call `transferUSDC(recipient, amount)` for x402 payments

---

## ⚠️ IMPORTANT NOTES

1. **USDC has 6 decimals**, not 18! Always multiply by 1,000,000 (1e6) for USDC amounts.
2. **Vault shares have 18 decimals** (standard ERC-20).
3. **Always approve USDC** before depositing.
4. **Only owner** can authorize/deauthorize bots.
5. **Only authorized bots** can execute trades and transfer USDC.
6. **USDC stays in vault** - bots don't hold funds directly.

---

## 🔗 USDC Addresses

- **Base Mainnet**: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- **Base Sepolia**: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`

---

## 📞 SUPPORT

For questions or issues, refer to the main README or contact the development team.
