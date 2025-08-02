#!/bin/bash

# Quick cross-browser testing demo for Prayas
# This script demonstrates the testing capabilities

set -e

echo "🎯 Cross-Browser Testing Demo for Prayas"
echo "========================================"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[DEMO]${NC} $1"
}

demo_step() {
    echo -e "${BLUE}▶ $1${NC}"
}

# Check if Playwright is available
if ! command -v npx &> /dev/null; then
    echo "❌ Node.js/npm not found. Please install Node.js first."
    exit 1
fi

# Install Playwright if needed
if ! npx playwright --version &> /dev/null; then
    log "Installing Playwright..."
    npm install @playwright/test
fi

# Install browsers
log "Installing browsers (this may take a few minutes on first run)..."
npx playwright install chromium firefox webkit

# Check if server is running
log "Checking if Prayas is running..."
if ! curl -f http://localhost:5000/api/health &> /dev/null; then
    echo "❌ Prayas development server not running!"
    echo "Please start it with: npm run dev"
    exit 1
fi

demo_step "Running Homepage Compatibility Test"
npx playwright test tests/e2e/cross-browser.spec.ts \
    --grep "Homepage loads correctly" \
    --project=chromium \
    --project=firefox \
    --timeout=30000

demo_step "Testing Payment Method Selector"
npx playwright test tests/e2e/payment-compatibility.spec.ts \
    --grep "Payment method selector" \
    --project=chromium \
    --timeout=30000

demo_step "Testing Keyboard Navigation"  
npx playwright test tests/e2e/accessibility.spec.ts \
    --grep "Keyboard navigation" \
    --project=chromium \
    --timeout=30000

demo_step "Testing Mobile Responsiveness"
npx playwright test tests/e2e/cross-browser.spec.ts \
    --grep "Responsive navigation" \
    --project="Mobile Chrome" \
    --timeout=30000

log "Demo completed! Check results in test-results/ directory"

# Show summary
echo ""
echo "📊 Test Results Summary:"
echo "======================="

# Count screenshots
screenshots=$(find test-results/screenshots -name "*.png" 2>/dev/null | wc -l || echo 0)
echo "Screenshots captured: $screenshots"

# Show recent screenshots
if [ $screenshots -gt 0 ]; then
    echo "Latest screenshots:"
    ls -t test-results/screenshots/*.png | head -3 | sed 's/^/  - /'
fi

echo ""
echo "🚀 To run full test suite:"
echo "   ./tests/scripts/run-cross-browser-tests.sh"
echo ""
echo "📱 View HTML report:"
echo "   open test-results/html-report/index.html"
echo ""
echo "🌐 Browser compatibility matrix:"
echo "   open test-results/compatibility/compatibility-report.html"