#!/bin/bash
# Deploy S4D5 updates to EC2 instances
# Usage: ./deploy-to-ec2.sh [as4|ao4|eh4|all]

set -e

# EC2 instance details
AS4_IP="34.239.119.14"
AO4_IP="your-ao4-ip"
EH4_IP="your-eh4-ip"
KEY_PATH="~/Downloads/AS4.pem"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

deploy_to_instance() {
    local instance_name=$1
    local instance_ip=$2
    
    echo -e "${YELLOW}Deploying to ${instance_name} (${instance_ip})...${NC}"
    
    # Create root .env file
    echo -e "${GREEN}Creating root .env file...${NC}"
    ssh -i ${KEY_PATH} ubuntu@${instance_ip} << 'EOF'
cd ~/S4D5

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    cat > .env << 'ENVEOF'
# =============================================================================
# S4D5 Project Environment Variables
# =============================================================================

# -----------------------------------------------------------------------------
# Nerve-Cord (Communication Hub)
# -----------------------------------------------------------------------------
NERVE_PORT=9999
NERVE_TOKEN=s4d5-suhas-susmitha-karthik
NERVE_SERVER=https://s4d5-production.up.railway.app

# -----------------------------------------------------------------------------
# Alpha Strategist (Trading Bot)
# -----------------------------------------------------------------------------
BOTNAME=alpha-strategist

# Analysis Configuration
ANALYSIS_INTERVAL=300000
MIN_CONFIDENCE=60
TARGET_ASSETS=BTC,ETH
MAX_POSITION_SIZE=10000
RISK_MULTIPLIER=0.5

# Position Management
TAKE_PROFIT_PCT=5
STOP_LOSS_PCT=3
MAX_POSITION_AGE_HOURS=24

# -----------------------------------------------------------------------------
# Audit Oracle (Compliance Bot)
# -----------------------------------------------------------------------------
# Add audit oracle config here when needed

# -----------------------------------------------------------------------------
# Execution Hand (Trade Execution Bot)
# -----------------------------------------------------------------------------
# Add execution hand config here when needed
ENVEOF
    echo "✓ Created root .env file"
else
    echo "✓ Root .env file already exists"
fi
EOF

    # Pull latest code
    echo -e "${GREEN}Pulling latest code...${NC}"
    ssh -i ${KEY_PATH} ubuntu@${instance_ip} << 'EOF'
cd ~/S4D5
git pull
echo "✓ Code updated"
EOF

    # Install dependencies if needed
    echo -e "${GREEN}Installing dependencies...${NC}"
    ssh -i ${KEY_PATH} ubuntu@${instance_ip} << 'EOF'
cd ~/S4D5/Backend/helix/alpha-strategist.skill
npm install
echo "✓ Dependencies installed"
EOF

    # Test the bot
    echo -e "${GREEN}Testing bot...${NC}"
    ssh -i ${KEY_PATH} ubuntu@${instance_ip} << 'EOF'
cd ~/S4D5/Backend/helix/alpha-strategist.skill
npm run send-proposals
EOF

    echo -e "${GREEN}✓ ${instance_name} deployment complete!${NC}\n"
}

# Main deployment logic
case "$1" in
    as4)
        deploy_to_instance "AS4 (Alpha Strategist)" ${AS4_IP}
        ;;
    ao4)
        deploy_to_instance "AO4 (Audit Oracle)" ${AO4_IP}
        ;;
    eh4)
        deploy_to_instance "EH4 (Execution Hand)" ${EH4_IP}
        ;;
    all)
        deploy_to_instance "AS4 (Alpha Strategist)" ${AS4_IP}
        deploy_to_instance "AO4 (Audit Oracle)" ${AO4_IP}
        deploy_to_instance "EH4 (Execution Hand)" ${EH4_IP}
        ;;
    *)
        echo "Usage: $0 [as4|ao4|eh4|all]"
        echo ""
        echo "Examples:"
        echo "  $0 as4   # Deploy to Alpha Strategist only"
        echo "  $0 all   # Deploy to all instances"
        exit 1
        ;;
esac

echo -e "${GREEN}All deployments complete!${NC}"
