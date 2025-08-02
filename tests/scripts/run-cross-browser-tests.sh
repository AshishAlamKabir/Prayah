#!/bin/bash

# Cross-browser testing script for Prayas
# This script runs comprehensive browser compatibility tests

set -e

echo "🌐 Starting Cross-Browser Testing for Prayas"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TEST_TIMEOUT=300000  # 5 minutes per test
RETRIES=2
WORKERS=2

# Ensure test results directory exists
mkdir -p test-results/screenshots
mkdir -p test-results/compatibility
mkdir -p test-results/videos
mkdir -p test-results/traces

# Function to log with timestamp
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

# Check if Playwright is installed
if ! npx playwright --version &> /dev/null; then
    log "Installing Playwright..."
    npx playwright install
fi

# Install Playwright browsers if not already installed
log "Installing/updating Playwright browsers..."
npx playwright install chromium firefox webkit

# Check if the development server is running
check_server() {
    log "Checking if development server is running..."
    
    if curl -f http://localhost:5000/api/health &> /dev/null; then
        log "✓ Development server is running"
        return 0
    else
        log_warn "Development server not detected on port 5000"
        return 1
    fi
}

# Start development server if needed
start_server() {
    if ! check_server; then
        log "Starting development server..."
        npm run dev &
        SERVER_PID=$!
        
        # Wait for server to be ready
        for i in {1..30}; do
            if curl -f http://localhost:5000/api/health &> /dev/null; then
                log "✓ Development server started successfully"
                return 0
            fi
            sleep 2
        done
        
        log_error "Failed to start development server"
        return 1
    fi
}

# Cleanup function
cleanup() {
    if [ ! -z "$SERVER_PID" ]; then
        log "Stopping development server..."
        kill $SERVER_PID 2>/dev/null || true
    fi
}

# Set up cleanup trap
trap cleanup EXIT

# Test execution functions
run_basic_compatibility_tests() {
    log "Running basic cross-browser compatibility tests..."
    
    npx playwright test tests/e2e/cross-browser.spec.ts \
        --timeout=$TEST_TIMEOUT \
        --retries=$RETRIES \
        --workers=$WORKERS \
        --reporter=html \
        --reporter=junit
}

run_payment_compatibility_tests() {
    log "Running payment system compatibility tests..."
    
    npx playwright test tests/e2e/payment-compatibility.spec.ts \
        --timeout=$TEST_TIMEOUT \
        --retries=$RETRIES \
        --workers=$WORKERS \
        --reporter=html
}

run_accessibility_tests() {
    log "Running accessibility compatibility tests..."
    
    npx playwright test tests/e2e/accessibility.spec.ts \
        --timeout=$TEST_TIMEOUT \
        --retries=$RETRIES \
        --workers=$WORKERS \
        --reporter=html
}

generate_compatibility_report() {
    log "Generating comprehensive compatibility report..."
    
    npx playwright test tests/e2e/browser-compatibility-report.spec.ts \
        --timeout=60000 \
        --retries=1 \
        --workers=1 \
        --reporter=html
}

# Main execution
main() {
    log "Starting cross-browser test suite..."
    
    # Check prerequisites
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed!"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed!"
        exit 1
    fi
    
    # Start server if needed
    if ! start_server; then
        log_error "Cannot start development server. Exiting."
        exit 1
    fi
    
    # Wait a moment for server to stabilize
    sleep 3
    
    # Run test suites
    local test_results=0
    
    log "${BLUE}Phase 1: Basic Cross-Browser Compatibility${NC}"
    if run_basic_compatibility_tests; then
        log "✓ Basic compatibility tests passed"
    else
        log_error "✗ Basic compatibility tests failed"
        test_results=1
    fi
    
    log "${BLUE}Phase 2: Payment System Compatibility${NC}"
    if run_payment_compatibility_tests; then
        log "✓ Payment compatibility tests passed"
    else
        log_error "✗ Payment compatibility tests failed"
        test_results=1
    fi
    
    log "${BLUE}Phase 3: Accessibility Testing${NC}"
    if run_accessibility_tests; then
        log "✓ Accessibility tests passed"
    else
        log_error "✗ Accessibility tests failed"
        test_results=1
    fi
    
    log "${BLUE}Phase 4: Generating Reports${NC}"
    if generate_compatibility_report; then
        log "✓ Compatibility report generated"
    else
        log_error "✗ Report generation failed"
        test_results=1
    fi
    
    # Generate summary
    generate_test_summary
    
    # Show results
    if [ $test_results -eq 0 ]; then
        log "${GREEN}🎉 All cross-browser tests completed successfully!${NC}"
        log "📊 View detailed reports at:"
        log "   - HTML Report: test-results/html-report/index.html"
        log "   - Compatibility Matrix: test-results/compatibility/compatibility-report.html"
        log "   - Screenshots: test-results/screenshots/"
    else
        log_error "❌ Some tests failed. Check the reports for details."
        exit 1
    fi
}

# Generate test summary
generate_test_summary() {
    log "Generating test summary..."
    
    # Count test files
    local total_tests=$(find tests/e2e -name "*.spec.ts" | wc -l)
    
    # Count screenshots
    local screenshots=$(find test-results/screenshots -name "*.png" 2>/dev/null | wc -l || echo 0)
    
    # Count compatibility reports
    local reports=$(find test-results/compatibility -name "*.json" 2>/dev/null | wc -l || echo 0)
    
    cat > test-results/test-summary.txt << EOF
Prayas Cross-Browser Test Summary
=================================
Generated: $(date)

Test Configuration:
- Timeout: ${TEST_TIMEOUT}ms per test
- Retries: $RETRIES
- Workers: $WORKERS

Test Suites Executed:
- Basic Cross-Browser Compatibility
- Payment System Compatibility  
- Accessibility Testing
- Browser Feature Detection

Results:
- Test specifications: $total_tests
- Screenshots captured: $screenshots
- Browser reports generated: $reports

Files Generated:
- HTML Report: test-results/html-report/index.html
- JUnit Report: test-results/junit.xml
- JSON Results: test-results/results.json
- Compatibility Matrix: test-results/compatibility/compatibility-report.html
- Screenshots: test-results/screenshots/
- Videos (on failure): test-results/videos/
- Traces (on failure): test-results/traces/

Browser Coverage:
- Desktop Chrome (latest)
- Desktop Firefox (latest)
- Desktop Safari/WebKit (latest)
- Mobile Chrome (Pixel 5)
- Mobile Safari (iPhone 12)
- Mobile Samsung (Galaxy S21)
- iPad Pro
- Android Tablet (Galaxy Tab S4)
- Various resolutions (1366x768, 4K, etc.)

Feature Testing:
- JavaScript ES6+ compatibility
- CSS Grid and Flexbox support
- HTML5 form validation
- Payment gateway integration
- UPI and mobile payment support
- Accessibility standards (WCAG)
- Keyboard navigation
- Screen reader compatibility
- Color contrast validation
- Performance metrics
- Network request handling
- Local storage functionality

For detailed results, open the HTML report in your browser:
file://$(pwd)/test-results/html-report/index.html
EOF

    log "✓ Test summary saved to test-results/test-summary.txt"
}

# Help function
show_help() {
    echo "Cross-Browser Testing Script for Prayas"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --help              Show this help message"
    echo "  --browsers=LIST     Run tests only on specified browsers (chromium,firefox,webkit)"
    echo "  --headed            Run tests in headed mode (visible browser)"
    echo "  --debug             Run tests in debug mode"
    echo "  --update            Update Playwright browsers before testing"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Run all tests"
    echo "  $0 --browsers=chromium,firefox        # Test only Chrome and Firefox"
    echo "  $0 --headed --debug                   # Run in debug mode with visible browser"
    echo ""
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --help)
            show_help
            exit 0
            ;;
        --browsers=*)
            BROWSERS="${1#*=}"
            export PLAYWRIGHT_BROWSERS="$BROWSERS"
            ;;
        --headed)
            export PLAYWRIGHT_HEADLESS=false
            ;;
        --debug)
            export PWDEBUG=1
            ;;
        --update)
            log "Updating Playwright browsers..."
            npx playwright install
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
    shift
done

# Run main function
main "$@"