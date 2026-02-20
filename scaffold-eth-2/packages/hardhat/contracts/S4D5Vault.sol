// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title S4D5Vault
 * @notice ERC-4626 compliant vault for S4D5 AI Hedge Fund
 * @dev Holds USDC on Base network, allows authorized bots to execute trades
 */
contract S4D5Vault is ERC4626, Ownable {
    // Events
    event BotAuthorized(address indexed botWallet, uint256 timestamp);
    event BotDeauthorized(address indexed botWallet, uint256 timestamp);
    event TradeExecuted(
        address indexed bot,
        address indexed token,
        uint256 amountIn,
        uint256 amountOut,
        uint256 timestamp
    );
    event EmergencyWithdraw(address indexed owner, uint256 amount, uint256 timestamp);
    
    // Bot authorization
    mapping(address => bool) public authorizedBots;
    
    // Trade tracking
    uint256 public totalTradesExecuted;
    
    /**
     * @notice Constructor
     * @param _asset USDC token address on Base
     * @param _name Vault token name
     * @param _symbol Vault token symbol
     */
    constructor(
        IERC20 _asset,
        string memory _name,
        string memory _symbol
    ) ERC4626(_asset) ERC20(_name, _symbol) Ownable(msg.sender) {}
    
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
     * @notice Execute a trade (authorized bots only)
     * @dev Bots call this to trade USDC for other tokens or vice versa
     * @param token Address of token to trade (or USDC address to sell tokens for USDC)
     * @param amountIn Amount of USDC to spend (or tokens to sell)
     * @param minAmountOut Minimum amount of tokens to receive (slippage protection)
     * @param dexRouter Address of DEX router to execute trade
     */
    function executeTrade(
        address token,
        uint256 amountIn,
        uint256 minAmountOut,
        address dexRouter,
        address[] calldata /* path */
    ) external returns (uint256 amountOut) {
        require(authorizedBots[msg.sender], "Not authorized");
        require(amountIn > 0, "Amount must be greater than 0");
        require(token != address(0), "Invalid token");
        require(dexRouter != address(0), "Invalid DEX router");
        
        // For now, just approve and track the trade
        // In production, this would interact with a DEX router
        IERC20(asset()).approve(dexRouter, amountIn);
        
        // Placeholder for actual DEX interaction
        // In production: call dexRouter.swapExactTokensForTokens(..., path)
        amountOut = minAmountOut; // Placeholder
        
        totalTradesExecuted++;
        
        emit TradeExecuted(msg.sender, token, amountIn, amountOut, block.timestamp);
        
        return amountOut;
    }
    
    /**
     * @notice Transfer USDC to a specific address (authorized bots only)
     * @dev Used for x402 micropayments between bots
     * @param recipient Address to receive USDC
     * @param amount Amount of USDC to transfer
     */
    function transferUSDC(address recipient, uint256 amount) external {
        require(authorizedBots[msg.sender], "Not authorized");
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be greater than 0");
        require(IERC20(asset()).balanceOf(address(this)) >= amount, "Insufficient vault balance");
        
        IERC20(asset()).transfer(recipient, amount);
    }
    
    /**
     * @notice Emergency withdraw all funds (owner only)
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = IERC20(asset()).balanceOf(address(this));
        require(balance > 0, "No funds to withdraw");
        
        IERC20(asset()).transfer(owner(), balance);
        
        emit EmergencyWithdraw(owner(), balance, block.timestamp);
    }
    
    /**
     * @notice Get total assets under management
     * @return Total USDC in vault
     */
    function totalAssets() public view virtual override returns (uint256) {
        return IERC20(asset()).balanceOf(address(this));
    }
    
    /**
     * @notice Check if a bot is authorized
     * @param botWallet Address to check
     * @return True if authorized
     */
    function isBotAuthorized(address botWallet) external view returns (bool) {
        return authorizedBots[botWallet];
    }
}
