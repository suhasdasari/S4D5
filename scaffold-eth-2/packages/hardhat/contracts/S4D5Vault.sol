// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title S4D5Vault
 * @notice ERC-4626 compliant vault for S4D5 AI Hedge Fund with multi-asset accounting
 * @dev Holds USDC on Base network, allows authorized bots to execute trades
 * 
 * SECURITY FEATURES:
 * - Multi-asset accounting with price oracle integration
 * - DEX router whitelist (prevents malicious contract approvals)
 * - Daily micropayment limits per bot (10 USDC/day)
 * - Inflation attack protection via initial share offset
 * - Atomic swap execution (approve + swap in one transaction)
 */
contract S4D5Vault is ERC4626, Ownable {
    
    // Events
    event BotAuthorized(address indexed botWallet, uint256 timestamp);
    event BotDeauthorized(address indexed botWallet, uint256 timestamp);
    event DexRouterWhitelisted(address indexed dexRouter, uint256 timestamp);
    event DexRouterRemoved(address indexed dexRouter, uint256 timestamp);
    event PriceOracleSet(address indexed oracle, uint256 timestamp);
    event TradeExecuted(
        address indexed bot,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        uint256 timestamp
    );
    event EmergencyWithdraw(address indexed owner, address indexed token, uint256 amount, uint256 timestamp);
    event MicropaymentSent(address indexed bot, address indexed recipient, uint256 amount, uint256 timestamp);
    event TokenWhitelisted(address indexed token, uint256 timestamp);
    event TokenRemoved(address indexed token, uint256 timestamp);
    
    // Bot authorization
    mapping(address => bool) public authorizedBots;
    
    // DEX router whitelist
    mapping(address => bool) public whitelistedDexRouters;
    
    // Token whitelist (tokens the vault can hold)
    mapping(address => bool) public whitelistedTokens;
    address[] public heldTokens;
    
    // Price oracle for multi-asset valuation
    address public priceOracle;
    
    // Micropayment limits (per bot per day)
    uint256 public constant DAILY_MICROPAYMENT_LIMIT = 10 * 1e6; // 10 USDC per day
    mapping(address => uint256) public dailyMicropaymentUsed;
    mapping(address => uint256) public lastMicropaymentReset;
    
    // Trade tracking
    uint256 public totalTradesExecuted;
    
    // Inflation attack protection
    uint256 private constant INITIAL_SHARE_OFFSET = 1000;
    address private constant DEAD_ADDRESS = 0x000000000000000000000000000000000000dEaD;
    
    /**
     * @notice Constructor with inflation attack protection
     * @param _asset USDC token address on Base
     * @param _name Vault token name
     * @param _symbol Vault token symbol
     * @dev Mints initial shares to dead address to prevent first depositor attack
     */
    constructor(
        IERC20 _asset,
        string memory _name,
        string memory _symbol
    ) ERC4626(_asset) ERC20(_name, _symbol) Ownable(msg.sender) {
        // Whitelist USDC by default
        whitelistedTokens[address(_asset)] = true;
        heldTokens.push(address(_asset));
    }
    
    /**
     * @notice Initialize vault with seed deposit to prevent inflation attack
     * @dev Owner must call this after deployment with initial USDC
     * @param initialDeposit Amount of USDC to seed (recommended: 1000 USDC minimum)
     */
    function initializeVault(uint256 initialDeposit) external onlyOwner {
        require(totalSupply() == 0, "Vault already initialized");
        require(initialDeposit >= INITIAL_SHARE_OFFSET, "Initial deposit too small");
        
        // Transfer USDC from owner
        IERC20(asset()).transferFrom(msg.sender, address(this), initialDeposit);
        
        // Mint shares to dead address (prevents inflation attack)
        _mint(DEAD_ADDRESS, INITIAL_SHARE_OFFSET);
        
        // Mint remaining shares to owner
        _mint(msg.sender, initialDeposit - INITIAL_SHARE_OFFSET);
    }
    
    /**
     * @notice Set price oracle for multi-asset valuation
     * @param oracle Address of price oracle contract
     */
    function setPriceOracle(address oracle) external onlyOwner {
        require(oracle != address(0), "Invalid oracle address");
        priceOracle = oracle;
        emit PriceOracleSet(oracle, block.timestamp);
    }
    
    /**
     * @notice Whitelist a token that the vault can hold
     * @param token Address of the token to whitelist
     */
    function whitelistToken(address token) external onlyOwner {
        require(token != address(0), "Invalid token");
        require(!whitelistedTokens[token], "Token already whitelisted");
        
        whitelistedTokens[token] = true;
        heldTokens.push(token);
        emit TokenWhitelisted(token, block.timestamp);
    }
    
    /**
     * @notice Remove a token from whitelist
     * @param token Address of the token to remove
     */
    function removeToken(address token) external onlyOwner {
        require(whitelistedTokens[token], "Token not whitelisted");
        require(IERC20(token).balanceOf(address(this)) == 0, "Token balance must be zero");
        
        whitelistedTokens[token] = false;
        
        // Remove from heldTokens array
        for (uint256 i = 0; i < heldTokens.length; i++) {
            if (heldTokens[i] == token) {
                heldTokens[i] = heldTokens[heldTokens.length - 1];
                heldTokens.pop();
                break;
            }
        }
        
        emit TokenRemoved(token, block.timestamp);
    }

    
    /**
     * @notice Authorize a bot to execute trades
     * @param botWallet Address of the bot's CDP wallet
     */
    function authorizeBotWallet(address botWallet) external onlyOwner {
        require(botWallet != address(0), "Invalid bot wallet");
        require(!authorizedBots[botWallet], "Bot already authorized");
        
        authorizedBots[botWallet] = true;
        emit BotAuthorized(botWallet, block.timestamp);
    }
    
    /**
     * @notice Deauthorize a bot from executing trades
     * @param botWallet Address of the bot's CDP wallet
     */
    function deauthorizeBotWallet(address botWallet) external onlyOwner {
        require(authorizedBots[botWallet], "Bot not authorized");
        
        authorizedBots[botWallet] = false;
        emit BotDeauthorized(botWallet, block.timestamp);
    }
    
    /**
     * @notice Whitelist a DEX router for trading
     * @param dexRouter Address of the DEX router to whitelist
     */
    function whitelistDexRouter(address dexRouter) external onlyOwner {
        require(dexRouter != address(0), "Invalid DEX router");
        require(!whitelistedDexRouters[dexRouter], "DEX router already whitelisted");
        
        whitelistedDexRouters[dexRouter] = true;
        emit DexRouterWhitelisted(dexRouter, block.timestamp);
    }
    
    /**
     * @notice Remove a DEX router from whitelist
     * @param dexRouter Address of the DEX router to remove
     */
    function removeDexRouter(address dexRouter) external onlyOwner {
        require(whitelistedDexRouters[dexRouter], "DEX router not whitelisted");
        
        whitelistedDexRouters[dexRouter] = false;
        emit DexRouterRemoved(dexRouter, block.timestamp);
    }
    
    /**
     * @notice Execute a trade with atomic swap (authorized bots only)
     * @dev Performs approve + swap in single transaction to prevent dangling approvals
     * @param tokenIn Address of input token (usually USDC)
     * @param tokenOut Address of output token
     * @param amountIn Amount of input token to spend
     * @param minAmountOut Minimum output tokens to receive (slippage protection)
     * @param dexRouter Address of DEX router to execute trade
     * @param swapCalldata Encoded swap function call for the DEX router
     * @return amountOut Actual amount of output tokens received
     */
    function executeTrade(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut,
        address dexRouter,
        bytes calldata swapCalldata
    ) external returns (uint256 amountOut) {
        require(authorizedBots[msg.sender], "Not authorized");
        require(amountIn > 0, "Amount must be greater than 0");
        require(tokenIn != address(0) && tokenOut != address(0), "Invalid token");
        require(whitelistedDexRouters[dexRouter], "DEX router not whitelisted");
        require(whitelistedTokens[tokenIn], "Input token not whitelisted");
        require(whitelistedTokens[tokenOut], "Output token not whitelisted");
        require(IERC20(tokenIn).balanceOf(address(this)) >= amountIn, "Insufficient balance");
        
        // Record balances before swap
        uint256 balanceBefore = IERC20(tokenOut).balanceOf(address(this));
        
        // Approve DEX router to spend input tokens
        IERC20(tokenIn).approve(dexRouter, amountIn);
        
        // Execute swap via low-level call
        (bool success, ) = dexRouter.call(swapCalldata);
        require(success, "Swap failed");
        
        // Reset approval to 0 for security
        IERC20(tokenIn).approve(dexRouter, 0);
        
        // Calculate actual output amount
        uint256 balanceAfter = IERC20(tokenOut).balanceOf(address(this));
        amountOut = balanceAfter - balanceBefore;
        
        // Verify slippage protection
        require(amountOut >= minAmountOut, "Slippage too high");
        
        totalTradesExecuted++;
        
        emit TradeExecuted(msg.sender, tokenIn, tokenOut, amountIn, amountOut, block.timestamp);
        
        return amountOut;
    }
    
    /**
     * @notice Transfer USDC to a specific address (authorized bots only)
     * @dev Used for x402 micropayments between bots with daily limit
     * @param recipient Address to receive USDC
     * @param amount Amount of USDC to transfer
     */
    function transferUSDC(address recipient, uint256 amount) external {
        require(authorizedBots[msg.sender], "Not authorized");
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be greater than 0");
        require(IERC20(asset()).balanceOf(address(this)) >= amount, "Insufficient vault balance");
        
        // Reset daily limit if 24 hours have passed
        if (block.timestamp >= lastMicropaymentReset[msg.sender] + 1 days) {
            dailyMicropaymentUsed[msg.sender] = 0;
            lastMicropaymentReset[msg.sender] = block.timestamp;
        }
        
        // Check daily limit
        require(
            dailyMicropaymentUsed[msg.sender] + amount <= DAILY_MICROPAYMENT_LIMIT,
            "Daily micropayment limit exceeded"
        );
        
        // Update daily usage
        dailyMicropaymentUsed[msg.sender] += amount;
        
        // Transfer USDC
        IERC20(asset()).transfer(recipient, amount);
        
        emit MicropaymentSent(msg.sender, recipient, amount, block.timestamp);
    }
    
    /**
     * @notice Emergency withdraw specific token (owner only)
     * @param token Address of token to withdraw (address(0) for ETH)
     */
    function emergencyWithdraw(address token) external onlyOwner {
        if (token == address(0)) {
            // Withdraw ETH
            uint256 balance = address(this).balance;
            require(balance > 0, "No ETH to withdraw");
            payable(owner()).transfer(balance);
            emit EmergencyWithdraw(owner(), address(0), balance, block.timestamp);
        } else {
            // Withdraw ERC20
            uint256 balance = IERC20(token).balanceOf(address(this));
            require(balance > 0, "No tokens to withdraw");
            IERC20(token).transfer(owner(), balance);
            emit EmergencyWithdraw(owner(), token, balance, block.timestamp);
        }
    }

    
    /**
     * @notice Get total assets under management in USDC terms
     * @dev Sums USDC balance + value of all other tokens via price oracle
     * @return Total value in USDC (6 decimals)
     */
    function totalAssets() public view virtual override returns (uint256) {
        uint256 totalValue = IERC20(asset()).balanceOf(address(this));
        
        // If no oracle set, only count USDC
        if (priceOracle == address(0)) {
            return totalValue;
        }
        
        // Add value of all other tokens
        for (uint256 i = 0; i < heldTokens.length; i++) {
            address token = heldTokens[i];
            
            // Skip USDC (already counted)
            if (token == address(asset())) continue;
            
            uint256 balance = IERC20(token).balanceOf(address(this));
            if (balance == 0) continue;
            
            // Get token value in USDC from oracle
            // NOTE: Oracle must implement: getPrice(token) returns (uint256 priceInUSDC)
            // This is a placeholder - actual oracle integration needed
            try IPriceOracle(priceOracle).getPrice(token) returns (uint256 price) {
                totalValue += (balance * price) / 1e18; // Adjust for decimals
            } catch {
                // If oracle fails, skip this token (conservative approach)
                continue;
            }
        }
        
        return totalValue;
    }
    
    /**
     * @notice Get list of all tokens held by vault
     * @return Array of token addresses
     */
    function getHeldTokens() external view returns (address[] memory) {
        return heldTokens;
    }
    
    /**
     * @notice Get balance of specific token in vault
     * @param token Address of token to check
     * @return Token balance
     */
    function getTokenBalance(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }
    
    /**
     * @notice Check if a bot is authorized
     * @param botWallet Address to check
     * @return True if authorized
     */
    function isBotAuthorized(address botWallet) external view returns (bool) {
        return authorizedBots[botWallet];
    }
    
    /**
     * @notice Check if a DEX router is whitelisted
     * @param dexRouter Address to check
     * @return True if whitelisted
     */
    function isDexRouterWhitelisted(address dexRouter) external view returns (bool) {
        return whitelistedDexRouters[dexRouter];
    }
    
    /**
     * @notice Check if a token is whitelisted
     * @param token Address to check
     * @return True if whitelisted
     */
    function isTokenWhitelisted(address token) external view returns (bool) {
        return whitelistedTokens[token];
    }
    
    /**
     * @notice Get remaining micropayment allowance for a bot today
     * @param bot Address of the bot
     * @return Remaining USDC amount the bot can transfer today
     */
    function getRemainingMicropaymentAllowance(address bot) external view returns (uint256) {
        // Reset if 24 hours have passed
        if (block.timestamp >= lastMicropaymentReset[bot] + 1 days) {
            return DAILY_MICROPAYMENT_LIMIT;
        }
        
        uint256 used = dailyMicropaymentUsed[bot];
        if (used >= DAILY_MICROPAYMENT_LIMIT) {
            return 0;
        }
        
        return DAILY_MICROPAYMENT_LIMIT - used;
    }
    
    /**
     * @notice Fallback to receive ETH
     */
    receive() external payable {}
}

/**
 * @title IPriceOracle
 * @notice Interface for price oracle
 */
interface IPriceOracle {
    /**
     * @notice Get price of token in USDC terms
     * @param token Address of token to price
     * @return price Price in USDC (6 decimals)
     */
    function getPrice(address token) external view returns (uint256 price);
}
