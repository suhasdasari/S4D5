# S4D5 Vault Frontend Integration

## Overview
The frontend now displays the real vault NAV ($10 USDC) and allows users to deposit/withdraw USDC.

## What Was Implemented

### 1. Real Vault NAV Display
- **SnakeHUD Component** now reads from the deployed S4D5Vault contract on Base mainnet
- Shows live Portfolio NAV: $10.00 (the actual vault balance)
- Displays connection status when wallet is connected

### 2. Deposit Modal
- Users can deposit USDC into the vault
- Two-step process:
  1. Approve USDC spending
  2. Deposit to vault
- Shows loading states during transactions
- Validates user has sufficient USDC balance

### 3. Withdraw Modal
- Users can withdraw their USDC from the vault
- Shows available balance (based on user's vault shares)
- "Max" button to withdraw all available funds
- Validates withdrawal amount doesn't exceed balance

## Contract Details

**Deployed on Base Mainnet (Chain ID: 8453)**
- Vault Address: `0xed8E9E422D4681E177423BCe0Ebaf03BF413a83B`
- Oracle Address: `0x15E03b7942F6976bE340EdAc738ECF494f154Af5`
- USDC Address: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`

**Current Vault Status:**
- Total Assets (NAV): $10.00 USDC
- Initialized: ✅
- Oracle Connected: ✅
- WETH Whitelisted: ✅

## How to Test

1. **Start the frontend:**
   ```bash
   cd scaffold-eth-2/packages/nextjs
   yarn dev
   ```

2. **Connect your wallet:**
   - Make sure you're on Base mainnet
   - Connect the wallet that has vault shares (deployer wallet: `0xD88b67ca80fCBD126fF0405F0de899911d78eb78`)

3. **View Portfolio:**
   - You should see "Portfolio NAV (Live)" showing $10.00
   - The display updates automatically from the blockchain

4. **Test Deposit:**
   - Click "Deposit" button
   - Enter USDC amount
   - Approve USDC (first transaction)
   - Confirm deposit (second transaction)
   - Your vault shares will increase

5. **Test Withdraw:**
   - Click "Withdraw" button
   - Enter amount or click "Max"
   - Confirm withdrawal transaction
   - USDC will be sent to your wallet

## Files Modified

1. `alpha/components/SnakeHUD.tsx` - Added real vault NAV reading
2. `alpha/pages/Index.tsx` - Added modal state management
3. `alpha/components/DepositModal.tsx` - NEW: Deposit functionality
4. `alpha/components/WithdrawModal.tsx` - NEW: Withdraw functionality
5. `alpha/components/VaultDisplay.tsx` - NEW: Vault data hook (unused but available)

## Next Steps

After testing the frontend:

1. **Add DEX Router Addresses** - Enable trading by whitelisting Uniswap/other DEXs
2. **Set Up CDP Wallets** - Create Coinbase Developer Platform wallets for the 3 bots
3. **Authorize Bot Wallets** - Add bot addresses to the vault's authorized list
4. **Implement x402 Payments** - Enable micropayments between bots
5. **Integrate Kite AI Passports** - Add spending limit enforcement

## Troubleshooting

**"Insufficient USDC balance" error:**
- Make sure you have USDC on Base mainnet
- USDC contract: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`

**"Wrong network" error:**
- Switch to Base mainnet (Chain ID: 8453)
- The app only works on Base mainnet

**Transactions failing:**
- Ensure you have enough ETH for gas (~$0.50 per transaction)
- Check BaseScan for transaction details

## BaseScan Links

- [Vault Contract](https://basescan.org/address/0xed8E9E422D4681E177423BCe0Ebaf03BF413a83B)
- [Oracle Contract](https://basescan.org/address/0x15E03b7942F6976bE340EdAc738ECF494f154Af5)
- [Initialization TX](https://basescan.org/tx/0x3c2df3551039d794a5ca32c1ac5c08342132d3bba6bba4957cd01e283cc15e9b)
