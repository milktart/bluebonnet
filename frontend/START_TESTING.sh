#!/bin/bash

# Bluebonnet Svelte Frontend - Testing Quick Start
# This script helps you set up and start testing the application

set -e

echo "🧪 Bluebonnet Svelte - Testing Quick Start"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print section headers
print_header() {
    echo ""
    echo -e "${BLUE}■ $1${NC}"
    echo "═══════════════════════════════════════"
}

# Function to print success
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Function to print warning
print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Check prerequisites
print_header "Checking Prerequisites"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js not found${NC}"
    echo "Please install Node.js from https://nodejs.org"
    exit 1
fi
print_success "Node.js $(node -v)"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ npm not found${NC}"
    exit 1
fi
print_success "npm $(npm -v)"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}✗ package.json not found${NC}"
    echo "Please run this script from the bluebonnet-frontend directory"
    exit 1
fi
print_success "In correct directory: bluebonnet-frontend"

# Install dependencies
print_header "Installing Dependencies"

if [ -d "node_modules" ]; then
    print_warning "node_modules already exists"
    read -p "Reinstall dependencies? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        npm install
    fi
else
    npm install
fi

print_success "Dependencies installed"

# Show configuration
print_header "Configuration"

echo "Frontend URL: ${BLUE}http://localhost:3001${NC}"
echo "Backend API: ${BLUE}http://localhost:3000${NC}"
echo ""
echo "Make sure the Express backend is running!"
echo "In another terminal, run:"
echo -e "  ${BLUE}cd /home/home/bluebonnet${NC}"
echo -e "  ${BLUE}npm run dev${NC}"

# Start the development server
print_header "Starting Development Server"

echo "Starting Svelte development server..."
echo ""
echo -e "${YELLOW}Opening http://localhost:3001 in your browser...${NC}"
echo ""
echo "Press ${YELLOW}Ctrl+C${NC} to stop the server"
echo ""

# Give user a moment to see the output
sleep 2

# Start the dev server
npm run dev
