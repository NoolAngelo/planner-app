#!/bin/bash

echo "🚀 Planner App - Phase 1 Setup Script"
echo "===================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if PostgreSQL is installed
echo -e "${BLUE}Checking PostgreSQL installation...${NC}"
if command -v psql &> /dev/null; then
    echo -e "${GREEN}✓ PostgreSQL found${NC}"
else
    echo -e "${RED}✗ PostgreSQL not found${NC}"
    echo -e "${YELLOW}Please install PostgreSQL first:${NC}"
    echo "  macOS: brew install postgresql"
    echo "  Ubuntu: sudo apt install postgresql postgresql-contrib"
    echo "  Windows: Download from postgresql.org"
    exit 1
fi

# Check if Node.js is installed
echo -e "${BLUE}Checking Node.js installation...${NC}"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓ Node.js found (${NODE_VERSION})${NC}"
else
    echo -e "${RED}✗ Node.js not found${NC}"
    echo -e "${YELLOW}Please install Node.js (v16+) from nodejs.org${NC}"
    exit 1
fi

# Check if .env file exists
echo -e "${BLUE}Checking environment configuration...${NC}"
if [ -f ".env" ]; then
    echo -e "${GREEN}✓ .env file found${NC}"
else
    echo -e "${YELLOW}! Creating .env file...${NC}"
    cat > .env << 'EOF'
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=planner_app_dev
DB_USER=postgres
DB_PASSWORD=

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_with_at_least_32_characters
JWT_EXPIRES_IN=7d
JWT_COOKIE_EXPIRE=7

# CORS Configuration
FRONTEND_URL=http://localhost:3000

# Security Configuration
BCRYPT_ROUNDS=12

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF
    echo -e "${GREEN}✓ .env file created${NC}"
    echo -e "${YELLOW}! Please update the database credentials in .env if needed${NC}"
fi

# Install npm dependencies
echo -e "${BLUE}Installing npm dependencies...${NC}"
if npm install; then
    echo -e "${GREEN}✓ Dependencies installed${NC}"
else
    echo -e "${RED}✗ Failed to install dependencies${NC}"
    exit 1
fi

# Check database connection
echo -e "${BLUE}Testing database connection...${NC}"
echo "Creating database if it doesn't exist..."

# Try to create database (will fail if it exists, which is fine)
createdb planner_app_dev 2>/dev/null && echo -e "${GREEN}✓ Database created${NC}" || echo -e "${YELLOW}! Database already exists or connection failed${NC}"

echo ""
echo -e "${GREEN}🎉 Setup Complete!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Update database credentials in .env if needed"
echo "2. Run: npm run dev"
echo "3. Test: curl http://localhost:3001/health"
echo ""
echo -e "${BLUE}API Documentation:${NC}"
echo "See SETUP.md for complete API documentation"
echo ""
echo -e "${BLUE}Phase 1 Features Implemented:${NC}"
echo "✓ Complete Authentication System"
echo "✓ Advanced Task Management with Subtasks"
echo "✓ Hierarchical Project Organization"
echo "✓ Flexible Tag System"
echo "✓ File Attachment Support"
echo "✓ Rich Search and Filtering"
echo "✓ User Analytics and Statistics"
echo ""
echo -e "${GREEN}Ready to start development! 🚀${NC}" 