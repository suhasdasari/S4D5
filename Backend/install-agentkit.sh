#!/bin/bash
# Installation script for Coinbase AgentKit on all three bots
# Usage: ./install-agentkit.sh

set -e

echo "=========================================="
echo "Installing Coinbase AgentKit for S4D5 Bots"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to install AgentKit in a directory
install_in_directory() {
    local dir=$1
    local bot_name=$2
    
    echo -e "${YELLOW}Installing AgentKit for ${bot_name}...${NC}"
    
    if [ ! -d "$dir" ]; then
        echo -e "${RED}Error: Directory $dir does not exist${NC}"
        return 1
    fi
    
    cd "$dir"
    
    # Check if package.json exists
    if [ ! -f "package.json" ]; then
        echo -e "${RED}Error: package.json not found in $dir${NC}"
        return 1
    fi
    
    # Install dependencies
    npm install
    
    # Verify installation
    if npm list @coinbase/cdp-agentkit > /dev/null 2>&1; then
        echo -e "${GREEN}✓ AgentKit installed successfully for ${bot_name}${NC}"
    else
        echo -e "${RED}✗ AgentKit installation failed for ${bot_name}${NC}"
        return 1
    fi
    
    echo ""
}

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Install for Alpha Strategist
install_in_directory "$SCRIPT_DIR/helix/alpha-strategist.skill" "Alpha Strategist"

# Install for AuditOracle
install_in_directory "$SCRIPT_DIR/auditoracle" "AuditOracle"

# Install for ExecutionHand
install_in_directory "$SCRIPT_DIR/executionhand" "ExecutionHand"

echo "=========================================="
echo -e "${GREEN}Installation Complete!${NC}"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Configure environment variables in .env file:"
echo "   - CDP_API_KEY_NAME"
echo "   - CDP_API_KEY_PRIVATE_KEY"
echo "   - NETWORK_ID (base-mainnet or base-sepolia)"
echo ""
echo "2. Initialize wallets on each bot:"
echo "   cd helix/alpha-strategist.skill && npm run init-wallet"
echo "   cd auditoracle && npm run init-wallet"
echo "   cd executionhand && npm run init-wallet"
echo ""
echo "See CDP-WALLET-SETUP.md for detailed instructions."
