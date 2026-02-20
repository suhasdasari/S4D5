// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

/**
 * @title ChainlinkPriceOracle
 * @notice Production-ready price oracle using Chainlink Price Feeds
 * @dev Converts token prices to USDC terms using Chainlink data feeds
 * 
 * Chainlink Price Feeds on Base:
 * - ETH/USD: 0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70
 * - BTC/USD: 0x64c911996D3c6aC71f9b455B1E8E7266BcbD848F
 * - More feeds: https://docs.chain.link/data-feeds/price-feeds/addresses?network=base
 */
contract ChainlinkPriceOracle {
    // Owner can add/update price feeds
    address public owner;
    
    // Token address => Chainlink price feed address
    mapping(address => address) public priceFeeds;
    
    // Token address => decimals adjustment (to normalize to 6 decimals for USDC)
    mapping(address => uint8) public tokenDecimals;
    
    // Events
    event PriceFeedSet(address indexed token, address indexed feed, uint8 decimals, uint256 timestamp);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    
    constructor() {
        owner = msg.sender;
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
        address feedAddress = priceFeeds[token];
        require(feedAddress != address(0), "Price feed not set for token");
        
        AggregatorV3Interface priceFeed = AggregatorV3Interface(feedAddress);
        
        // Get latest price from Chainlink
        (
            /* uint80 roundID */,
            int256 answer,
            /* uint256 startedAt */,
            uint256 updatedAt,
            /* uint80 answeredInRound */
        ) = priceFeed.latestRoundData();
        
        require(answer > 0, "Invalid price from Chainlink");
        require(updatedAt > 0, "Price data not updated");
        require(block.timestamp - updatedAt < 1 hours, "Price data stale");
        
        // Chainlink price feeds typically have 8 decimals
        // We need to convert to 6 decimals for USDC
        uint8 feedDecimals = priceFeed.decimals();
        uint256 rawPrice = uint256(answer);
        
        // Convert to 6 decimals (USDC standard)
        if (feedDecimals > 6) {
            price = rawPrice / (10 ** (feedDecimals - 6));
        } else if (feedDecimals < 6) {
            price = rawPrice * (10 ** (6 - feedDecimals));
        } else {
            price = rawPrice;
        }
        
        // Adjust for token decimals if needed
        // For example, if token has 18 decimals and we're pricing 1 token
        // we need to account for that in the final price calculation
        uint8 tokenDecimal = tokenDecimals[token];
        if (tokenDecimal > 0 && tokenDecimal != 18) {
            // Adjust price based on token decimals
            // This ensures proper valuation in totalAssets()
            if (tokenDecimal < 18) {
                price = price * (10 ** (18 - tokenDecimal));
            } else {
                price = price / (10 ** (tokenDecimal - 18));
            }
        }
        
        return price;
    }
    
    /**
     * @notice Set Chainlink price feed for a token
     * @param token Address of token
     * @param feed Address of Chainlink price feed
     * @param decimals Token decimals (e.g., 18 for WETH, 8 for WBTC)
     */
    function setPriceFeed(address token, address feed, uint8 decimals) external onlyOwner {
        require(token != address(0), "Invalid token");
        require(feed != address(0), "Invalid feed");
        require(decimals > 0 && decimals <= 18, "Invalid decimals");
        
        // Verify the feed is valid by calling it
        AggregatorV3Interface priceFeed = AggregatorV3Interface(feed);
        priceFeed.latestRoundData(); // Will revert if feed is invalid
        
        priceFeeds[token] = feed;
        tokenDecimals[token] = decimals;
        
        emit PriceFeedSet(token, feed, decimals, block.timestamp);
    }
    
    /**
     * @notice Set multiple price feeds at once
     * @param tokens Array of token addresses
     * @param feeds Array of Chainlink price feed addresses
     * @param decimals Array of token decimals
     */
    function setPriceFeeds(
        address[] calldata tokens,
        address[] calldata feeds,
        uint8[] calldata decimals
    ) external onlyOwner {
        require(
            tokens.length == feeds.length && tokens.length == decimals.length,
            "Array length mismatch"
        );
        
        for (uint256 i = 0; i < tokens.length; i++) {
            require(tokens[i] != address(0), "Invalid token");
            require(feeds[i] != address(0), "Invalid feed");
            require(decimals[i] > 0 && decimals[i] <= 18, "Invalid decimals");
            
            // Verify the feed is valid
            AggregatorV3Interface priceFeed = AggregatorV3Interface(feeds[i]);
            priceFeed.latestRoundData();
            
            priceFeeds[tokens[i]] = feeds[i];
            tokenDecimals[tokens[i]] = decimals[i];
            
            emit PriceFeedSet(tokens[i], feeds[i], decimals[i], block.timestamp);
        }
    }
    
    /**
     * @notice Check if price feed is set for a token
     * @param token Address of token
     * @return True if price feed is set
     */
    function hasPriceFeed(address token) external view returns (bool) {
        return priceFeeds[token] != address(0);
    }
    
    /**
     * @notice Get price feed address for a token
     * @param token Address of token
     * @return Address of Chainlink price feed
     */
    function getPriceFeed(address token) external view returns (address) {
        return priceFeeds[token];
    }
    
    /**
     * @notice Transfer ownership
     * @param newOwner Address of new owner
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid new owner");
        address oldOwner = owner;
        owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}
