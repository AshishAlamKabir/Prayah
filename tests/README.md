# Cross-Browser Testing for Prayas

This directory contains comprehensive cross-browser compatibility tests for the Prayas application, ensuring it works correctly across all major browsers and devices.

## Overview

Our cross-browser testing suite covers:

- **Desktop Browsers**: Chrome, Firefox, Safari/WebKit
- **Mobile Devices**: iOS Safari, Android Chrome, Samsung Internet
- **Tablets**: iPad Pro, Android tablets
- **Screen Resolutions**: From mobile (375px) to 4K (3840px)
- **Accessibility**: Keyboard navigation, screen readers, color contrast
- **Payment Systems**: Razorpay and Stripe compatibility across browsers
- **Performance**: Load times, memory usage, rendering performance

## Quick Start

### Run All Tests

```bash
# Install dependencies first
npm install

# Run complete test suite
./tests/scripts/run-cross-browser-tests.sh
```

### Run Specific Test Categories

```bash
# Basic compatibility only
npx playwright test tests/e2e/cross-browser.spec.ts

# Payment system compatibility
npx playwright test tests/e2e/payment-compatibility.spec.ts

# Accessibility testing
npx playwright test tests/e2e/accessibility.spec.ts

# Generate compatibility report
npx playwright test tests/e2e/browser-compatibility-report.spec.ts
```

### Run with Specific Browsers

```bash
# Test only Chrome and Firefox
./tests/scripts/run-cross-browser-tests.sh --browsers=chromium,firefox

# Run in headed mode (see browser)
./tests/scripts/run-cross-browser-tests.sh --headed

# Debug mode
./tests/scripts/run-cross-browser-tests.sh --debug
```

## Test Coverage

### 1. Cross-Browser Compatibility (`cross-browser.spec.ts`)

Tests core functionality across all browsers:

- **Page Loading**: Homepage, schools, culture, books pages
- **Navigation**: Responsive menu, desktop navigation
- **CSS Layout**: Grid, Flexbox, responsive design
- **JavaScript**: ES6+ features, React initialization
- **Images & Media**: Loading, rendering, responsiveness
- **Forms**: Input validation, interaction
- **Performance**: Loading times, memory usage
- **Local Storage**: Data persistence

### 2. Payment Compatibility (`payment-compatibility.spec.ts`)

Ensures payment systems work across browsers:

- **Razorpay Integration**: Script loading, UPI support
- **Stripe Compatibility**: Elements support, international cards
- **UPI Deep Links**: Mobile browser protocol handling
- **Form Validation**: HTML5 validation across browsers
- **Security Features**: Crypto API, secure contexts
- **Modal/Popup Support**: Payment gateway dialogs
- **Currency Formatting**: International number formatting
- **Network Requests**: CORS, fetch API compatibility

### 3. Accessibility Testing (`accessibility.spec.ts`)

Validates accessibility across browsers:

- **Keyboard Navigation**: Tab order, focus management
- **Screen Readers**: ARIA labels, semantic HTML
- **Color Contrast**: High contrast mode compatibility
- **Text Scaling**: Zoom and font size handling
- **Focus Management**: Modal focus trapping
- **Form Accessibility**: Label association, validation
- **Internationalization**: Unicode, RTL text support
- **Motion Preferences**: Reduced motion detection

### 4. Compatibility Report (`browser-compatibility-report.spec.ts`)

Generates comprehensive reports:

- **Feature Matrix**: ES6, CSS, HTML5 support by browser
- **Performance Metrics**: Load times, memory usage
- **Error Detection**: Console errors, JavaScript failures
- **Compatibility Scores**: Overall browser compatibility ratings
- **Visual Reports**: HTML dashboard with charts and graphs

## Browser Configuration

### Desktop Browsers

```javascript
{
  name: 'chromium',
  use: { ...devices['Desktop Chrome'], viewport: { width: 1920, height: 1080 } }
},
{
  name: 'firefox', 
  use: { ...devices['Desktop Firefox'], viewport: { width: 1920, height: 1080 } }
},
{
  name: 'webkit',
  use: { ...devices['Desktop Safari'], viewport: { width: 1920, height: 1080 } }
}
```

### Mobile Devices

```javascript
{
  name: 'Mobile Chrome',
  use: { ...devices['Pixel 5'] }
},
{
  name: 'Mobile Safari',
  use: { ...devices['iPhone 12'] }
},
{
  name: 'Mobile Samsung',
  use: { ...devices['Galaxy S21'] }
}
```

### Special Configurations

- **1366x768**: Common laptop resolution
- **4K Display**: Ultra-high resolution testing
- **iPhone SE**: Small screen compatibility
- **Android 10**: Older mobile OS compatibility

## Test Reports

After running tests, find reports in:

### HTML Dashboard
- **Location**: `test-results/html-report/index.html`
- **Content**: Interactive test results with screenshots and videos
- **Features**: Filter by browser, test status, duration

### Compatibility Matrix
- **Location**: `test-results/compatibility/compatibility-report.html`
- **Content**: Browser feature support matrix
- **Features**: Feature-by-feature compatibility scores

### Screenshots & Videos
- **Screenshots**: `test-results/screenshots/`
- **Videos**: `test-results/videos/` (on failures)
- **Traces**: `test-results/traces/` (debugging info)

### JSON Reports
- **Individual**: `test-results/compatibility/{browser}.json`
- **Aggregated**: `test-results/compatibility/aggregated-report.json`
- **JUnit**: `test-results/junit.xml`

## Key Features Tested

### JavaScript Compatibility
- Arrow functions and ES6+ syntax
- Promises and async/await
- Template literals and destructuring
- Module imports and dynamic imports
- Class syntax and inheritance

### CSS Features
- Flexbox and CSS Grid layouts
- Custom properties (CSS variables)
- calc() function support
- CSS transforms and animations
- Media queries and responsive design

### HTML5 Features
- Form validation and input types
- Local and session storage
- History API and SPA navigation
- File API and drag-and-drop
- Canvas and SVG support

### Payment Systems
- **Razorpay**: UPI integration, Indian payment methods
- **Stripe**: International cards, Elements API
- **Security**: Crypto API, secure contexts
- **Mobile**: UPI deep links, mobile wallets

### Accessibility Standards
- **WCAG 2.1 AA**: Color contrast, keyboard navigation
- **Screen Readers**: ARIA labels, semantic markup
- **Focus Management**: Visible focus indicators
- **Responsive**: Works with zoom and text scaling

## Continuous Integration

### GitHub Actions Integration

```yaml
- name: Run Cross-Browser Tests
  run: |
    npm ci
    npx playwright install
    ./tests/scripts/run-cross-browser-tests.sh
    
- name: Upload Test Results
  uses: actions/upload-artifact@v3
  with:
    name: test-results
    path: test-results/
```

### Docker Integration

```bash
# Run tests in Docker
docker run --rm -v $(pwd):/app -w /app \
  mcr.microsoft.com/playwright:latest \
  ./tests/scripts/run-cross-browser-tests.sh
```

## Troubleshooting

### Common Issues

**Tests fail to start**
```bash
# Install Playwright browsers
npx playwright install

# Check if development server is running
curl http://localhost:5000/api/health
```

**Browser crashes**
```bash
# Increase timeout in playwright.config.ts
timeout: 60000 // 60 seconds

# Run with more memory
node --max-old-space-size=4096 npx playwright test
```

**Screenshots not capturing**
```bash
# Ensure directory exists
mkdir -p test-results/screenshots

# Check disk space
df -h
```

### Debug Mode

```bash
# Run single test in debug mode
PWDEBUG=1 npx playwright test tests/e2e/cross-browser.spec.ts

# Run with browser visible
npx playwright test --headed

# Record video of all tests
npx playwright test --video=on
```

## Performance Benchmarks

### Expected Load Times
- **Homepage**: < 2000ms
- **Books Page**: < 3000ms (with images)
- **Schools Page**: < 2500ms
- **Culture Page**: < 2500ms

### Memory Usage
- **Initial Load**: < 50MB heap
- **After Navigation**: < 100MB heap
- **Peak Usage**: < 200MB heap

### Feature Support Targets
- **ES6 Features**: 100% on modern browsers
- **CSS Grid/Flexbox**: 100% on all tested browsers
- **Payment APIs**: 95%+ compatibility
- **Accessibility**: 90%+ WCAG compliance

## Contributing

### Adding New Tests

1. Create test file in `tests/e2e/`
2. Use `TestUtils` class for common operations
3. Follow naming convention: `{feature}-{type}.spec.ts`
4. Add browser-specific configurations if needed

### Test Structure

```typescript
import { test, expect } from '@playwright/test';
import { TestUtils } from '../setup/test-utils';

test.describe('New Feature Tests', () => {
  let utils: TestUtils;
  
  test.beforeEach(async ({ page }) => {
    utils = new TestUtils(page);
    await page.goto('/');
    await utils.waitForAppLoad();
  });
  
  test('feature works across browsers', async ({ page, browserName }) => {
    // Test implementation
    await utils.takeScreenshot(`feature-${browserName}`);
  });
});
```

### Best Practices

1. **Use data-testid attributes** for reliable element selection
2. **Wait for network idle** before assertions
3. **Take screenshots** on both success and failure
4. **Test responsive breakpoints** for layout changes
5. **Check console errors** for JavaScript issues
6. **Validate accessibility** in every test
7. **Test payment flows** without real transactions

This comprehensive testing suite ensures Prayas works flawlessly across all browser environments, providing a consistent user experience for all users regardless of their browser choice.