// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MockPriceOracle
 * @notice Simple mock price oracle for testing S4D5Vault
 * @dev Returns hardcoded prices for common tokens on Base
 * 
 * WARNING: This is for TESTING ONLY! Do NOT use in production!
 * Production should use Chainlink Price Feeds or similar reliable oracle.
 */
contract MockPriceOracle {
    // Owner can update prices
    address public owner;
    
    // Token address => Price in USDC (6 decimals)
    mapping(address => uint256) public prices;
    
    // Events
    event PriceUpdated(address indexed token, uint256 price, uint256 timestamp);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    
    constructor() {
        owner = msg.sender;
        
        // Set default prices for Base Sepolia tokens (approximate values)
        // WETH: ~$3000 per ETH
        prices[0x4200000000000000000000000000000000000006] = 3000 * 1e6;
        
        // Add more default prices as needed
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    /**
     * @notice Get price of token in USDC terms
     * @param token Address of token to price
     * @return price Price in USDC (6 decimals)
     */
    function getPrice(address token) external view returns (uint256 price) {
        price = prices[token];
        require(price > 0, "Price not set for token");
        return price;
    }
    
    /**
     * @notice Set price for a token (owner only)
     * @param token Address of token
     * @param price Price in USDC (6 decimals)
     */
    function setPrice(address token, uint256 price) external onlyOwner {
        require(token != address(0), "Invalid token");
        require(price > 0, "Price must be greater than 0");
        
        prices[token] = price;
        emit PriceUpdated(token, price, block.timestamp);
    }
    
    /**
     * @notice Set prices for multiple tokens (owner only)
     * @param tokens Array of token addresses
     * @param _prices Array of prices in USDC (6 decimals)
     */
    function setPrices(address[] calldata tokens, uint256[] calldata _prices) external onlyOwner {
        require(tokens.length == _prices.length, "Array length mismatch");
        
        for (uint256 i = 0; i < tokens.length; i++) {
            require(tokens[i] != address(0), "Invalid token");
            require(_prices[i] > 0, "Price must be greater than 0");
            
            prices[tokens[i]] = _prices[i];
            emit PriceUpdated(tokens[i], _prices[i], block.timestamp);
        }
    }
    
    /**
     * @notice Transfer ownership (owner only)
     * @param newOwner Address of new owner
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid new owner");
        address oldOwner = owner;
        owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}
