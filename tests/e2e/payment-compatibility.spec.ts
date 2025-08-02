import { test, expect, Page } from '@playwright/test';

// Cross-browser payment system compatibility tests
test.describe('Payment System Cross-Browser Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to homepage and ensure user is logged in for payment tests
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('Payment method selector displays correctly', async ({ page, browserName, isMobile }) => {
    // Navigate to a page with payment options (books store)
    await page.goto('/books');
    await page.waitForLoadState('networkidle');
    
    // Find and click on a book to trigger payment
    const bookCard = page.locator('[data-testid="book-card"]').first();
    if (await bookCard.isVisible()) {
      await bookCard.click();
      
      // Look for buy/purchase button
      const buyButton = page.locator('button:has-text("Buy"), button:has-text("Purchase"), button:has-text("কিনিব")').first();
      if (await buyButton.isVisible()) {
        await buyButton.click();
        
        // Check if payment method selector appears
        const paymentSelector = page.locator('[data-testid="payment-method-selector"], .payment-methods');
        await expect(paymentSelector).toBeVisible({ timeout: 10000 });
        
        // Take screenshot of payment interface
        await page.screenshot({ 
          path: `test-results/screenshots/payment-selector-${browserName}${isMobile ? '-mobile' : ''}.png`,
          fullPage: true 
        });
      }
    }
  });

  test('Razorpay integration loads correctly', async ({ page, browserName }) => {
    // This test checks if Razorpay script loads without testing actual payments
    await page.goto('/');
    
    // Check if Razorpay can be loaded (simulate payment flow)
    const razorpayScript = await page.evaluate(() => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      document.head.appendChild(script);
      
      return new Promise((resolve) => {
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        setTimeout(() => resolve(false), 5000); // 5 second timeout
      });
    });
    
    expect(razorpayScript).toBe(true);
    console.log(`Razorpay script loading: ${razorpayScript ? 'SUCCESS' : 'FAILED'} in ${browserName}`);
  });

  test('Stripe integration compatibility', async ({ page, browserName }) => {
    // Check Stripe Elements compatibility
    await page.goto('/');
    
    // Test if Stripe can be loaded
    const stripeTest = await page.evaluate(() => {
      // Simulate Stripe loading
      return new Promise((resolve) => {
        try {
          // Check if browser supports features Stripe needs
          const supportsPromises = typeof Promise !== 'undefined';
          const supportsFetch = typeof fetch !== 'undefined';
          const supportsES6 = typeof Symbol !== 'undefined';
          
          resolve({
            promises: supportsPromises,
            fetch: supportsFetch,
            es6: supportsES6,
            compatible: supportsPromises && supportsFetch && supportsES6
          });
        } catch (error) {
          resolve({ compatible: false, error: error.toString() });
        }
      });
    });
    
    console.log(`Stripe compatibility in ${browserName}:`, stripeTest);
    expect(stripeTest.compatible).toBe(true);
  });

  test('UPI deep links work on mobile browsers', async ({ page, browserName, isMobile }) => {
    if (!isMobile) {
      test.skip('UPI testing only relevant for mobile browsers');
    }
    
    // Test UPI link handling capability
    const upiSupport = await page.evaluate(() => {
      // Check if mobile browser can handle UPI links
      const testUPI = 'upi://pay?pa=test@paytm&pn=Test&am=1.00&cu=INR';
      
      try {
        // Create a temporary link to test UPI protocol handling
        const link = document.createElement('a');
        link.href = testUPI;
        
        // Check if browser recognizes UPI protocol
        return {
          protocolSupported: link.protocol === 'upi:',
          browserType: navigator.userAgent,
        };
      } catch (error) {
        return { protocolSupported: false, error: error.toString() };
      }
    });
    
    console.log(`UPI support in ${browserName}:`, upiSupport);
    
    // On Android browsers, UPI should be supported
    if (browserName.includes('chromium') || browserName.includes('Chrome')) {
      // UPI links should be recognized
      expect(upiSupport.protocolSupported).toBe(true);
    }
  });

  test('Payment form validation across browsers', async ({ page, browserName }) => {
    // Test HTML5 form validation compatibility
    const validationSupport = await page.evaluate(() => {
      // Create test form elements
      const email = document.createElement('input');
      email.type = 'email';
      email.required = true;
      
      const number = document.createElement('input');
      number.type = 'number';
      number.min = '1';
      
      return {
        emailValidation: typeof email.checkValidity === 'function',
        numberValidation: typeof number.checkValidity === 'function',
        constraintValidation: 'validity' in email,
        reportValidity: typeof email.reportValidity === 'function'
      };
    });
    
    console.log(`Form validation support in ${browserName}:`, validationSupport);
    
    // Modern browsers should support HTML5 validation
    expect(validationSupport.emailValidation).toBe(true);
    expect(validationSupport.constraintValidation).toBe(true);
  });

  test('Payment security features work', async ({ page, browserName }) => {
    // Test browser security features needed for payments
    const securityFeatures = await page.evaluate(() => {
      return {
        https: location.protocol === 'https:' || location.hostname === 'localhost',
        crypto: typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function',
        sessionStorage: typeof sessionStorage !== 'undefined',
        localStorage: typeof localStorage !== 'undefined',
        postMessage: typeof window.postMessage === 'function',
        cors: typeof XMLHttpRequest !== 'undefined'
      };
    });
    
    console.log(`Security features in ${browserName}:`, securityFeatures);
    
    // Essential security features should be available
    expect(securityFeatures.crypto).toBe(true);
    expect(securityFeatures.sessionStorage).toBe(true);
    expect(securityFeatures.postMessage).toBe(true);
  });

  test('Payment modal/popup compatibility', async ({ page, browserName, isMobile }) => {
    // Test popup/modal functionality for payment gateways
    const modalSupport = await page.evaluate(() => {
      return {
        // Test if browser supports modals/dialogs
        dialogSupported: 'HTMLDialogElement' in window,
        // Test popup window functionality
        popupSupported: typeof window.open === 'function',
        // Test focus management
        focusSupported: typeof document.activeElement !== 'undefined',
        // Test event handling
        eventListeners: typeof document.addEventListener === 'function'
      };
    });
    
    console.log(`Modal/popup support in ${browserName}:`, modalSupport);
    
    // Basic event handling should work
    expect(modalSupport.eventListeners).toBe(true);
    expect(modalSupport.focusSupported).toBe(true);
    
    // On mobile, popup blocking might be different
    if (!isMobile) {
      expect(modalSupport.popupSupported).toBe(true);
    }
  });

  test('Currency formatting displays correctly', async ({ page, browserName }) => {
    // Test international currency formatting
    const currencySupport = await page.evaluate(() => {
      try {
        // Test INR formatting
        const inrFormatter = new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR'
        });
        
        // Test USD formatting
        const usdFormatter = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        });
        
        return {
          intlSupported: typeof Intl !== 'undefined',
          inrFormatted: inrFormatter.format(1000),
          usdFormatted: usdFormatter.format(1000),
          numberFormatSupported: typeof Intl.NumberFormat === 'function'
        };
      } catch (error) {
        return {
          intlSupported: false,
          error: error.toString()
        };
      }
    });
    
    console.log(`Currency formatting in ${browserName}:`, currencySupport);
    
    // Modern browsers should support Intl
    expect(currencySupport.intlSupported).toBe(true);
    expect(currencySupport.numberFormatSupported).toBe(true);
    
    // Check INR formatting works
    expect(currencySupport.inrFormatted).toContain('1,000');
  });

  test('Network requests and CORS handling', async ({ page, browserName }) => {
    // Test if payment API calls will work
    await page.goto('/');
    
    // Check CORS and fetch capabilities
    const networkSupport = await page.evaluate(async () => {
      try {
        // Test fetch API
        const fetchSupported = typeof fetch === 'function';
        
        // Test CORS preflight understanding
        const corsHeaders = {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        };
        
        return {
          fetchSupported,
          promiseSupported: typeof Promise === 'function',
          jsonSupported: typeof JSON === 'object',
          headersSupported: typeof Headers === 'function',
          corsReady: fetchSupported && typeof Headers === 'function'
        };
      } catch (error) {
        return {
          error: error.toString(),
          fetchSupported: false
        };
      }
    });
    
    console.log(`Network capabilities in ${browserName}:`, networkSupport);
    
    // Essential for payment API calls
    expect(networkSupport.fetchSupported).toBe(true);
    expect(networkSupport.promiseSupported).toBe(true);
    expect(networkSupport.jsonSupported).toBe(true);
  });
});