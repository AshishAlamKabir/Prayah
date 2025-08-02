import { test, expect, Page, BrowserContext } from '@playwright/test';

// Cross-browser compatibility tests for Prayas application
test.describe('Cross-Browser Compatibility Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to homepage before each test
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('Homepage loads correctly across all browsers', async ({ page, browserName }) => {
    // Check page title
    await expect(page).toHaveTitle(/Prayas/);
    
    // Check main navigation elements
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
    
    // Check hero section
    const hero = page.locator('[data-testid="hero-section"]').first();
    await expect(hero).toBeVisible();
    
    // Take screenshot for visual comparison
    await page.screenshot({ 
      path: `test-results/screenshots/homepage-${browserName}.png`,
      fullPage: true 
    });
  });

  test('Responsive navigation works on all devices', async ({ page, isMobile }) => {
    if (isMobile) {
      // Test mobile hamburger menu
      const menuButton = page.locator('[data-testid="mobile-menu-button"]').first();
      if (await menuButton.isVisible()) {
        await menuButton.click();
        const mobileMenu = page.locator('[data-testid="mobile-menu"]');
        await expect(mobileMenu).toBeVisible();
      }
    } else {
      // Test desktop navigation
      const desktopNav = page.locator('[data-testid="desktop-nav"]');
      await expect(desktopNav).toBeVisible();
    }
  });

  test('Schools page renders correctly', async ({ page, browserName }) => {
    await page.goto('/schools');
    await page.waitForLoadState('networkidle');
    
    // Check page loads
    await expect(page.locator('h1')).toContainText(/Schools|শিক্ষা প্ৰতিষ্ঠান/);
    
    // Check school cards are visible
    const schoolCards = page.locator('[data-testid="school-card"]');
    await expect(schoolCards.first()).toBeVisible({ timeout: 10000 });
    
    // Take screenshot
    await page.screenshot({ 
      path: `test-results/screenshots/schools-${browserName}.png`,
      fullPage: true 
    });
  });

  test('Culture page loads and displays content', async ({ page, browserName }) => {
    await page.goto('/culture');
    await page.waitForLoadState('networkidle');
    
    // Check page title
    await expect(page.locator('h1')).toContainText(/Culture|শিল্প আৰু সংস্কৃতি/);
    
    // Check culture categories
    const cultureCards = page.locator('[data-testid="culture-card"]');
    await expect(cultureCards.first()).toBeVisible({ timeout: 10000 });
    
    // Take screenshot
    await page.screenshot({ 
      path: `test-results/screenshots/culture-${browserName}.png`,
      fullPage: true 
    });
  });

  test('Books store functionality', async ({ page, browserName }) => {
    await page.goto('/books');
    await page.waitForLoadState('networkidle');
    
    // Check books are displayed
    const bookCards = page.locator('[data-testid="book-card"]');
    await expect(bookCards.first()).toBeVisible({ timeout: 10000 });
    
    // Test book interaction (click on first book)
    await bookCards.first().click();
    
    // Check if modal or detail view opens
    const bookDetail = page.locator('[data-testid="book-detail"], [role="dialog"]');
    await expect(bookDetail).toBeVisible({ timeout: 5000 });
    
    // Take screenshot
    await page.screenshot({ 
      path: `test-results/screenshots/books-${browserName}.png`,
      fullPage: true 
    });
  });

  test('CSS Grid and Flexbox layouts work correctly', async ({ page, browserName }) => {
    await page.goto('/');
    
    // Check CSS Grid support
    const gridContainer = page.locator('[class*="grid"]').first();
    if (await gridContainer.isVisible()) {
      const boundingBox = await gridContainer.boundingBox();
      expect(boundingBox?.width).toBeGreaterThan(0);
    }
    
    // Check Flexbox support
    const flexContainer = page.locator('[class*="flex"]').first();
    if (await flexContainer.isVisible()) {
      const boundingBox = await flexContainer.boundingBox();
      expect(boundingBox?.width).toBeGreaterThan(0);
    }
  });

  test('Form interactions work across browsers', async ({ page, browserName }) => {
    // Test login form if available
    const loginButton = page.locator('text=/Login|লগইন/').first();
    if (await loginButton.isVisible()) {
      await loginButton.click();
      
      // Wait for form to appear
      const loginForm = page.locator('form, [data-testid="login-form"]');
      await expect(loginForm).toBeVisible({ timeout: 5000 });
      
      // Test form inputs
      const emailInput = page.locator('input[type="email"], input[name="email"]').first();
      const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
      
      if (await emailInput.isVisible()) {
        await emailInput.fill('test@example.com');
        await expect(emailInput).toHaveValue('test@example.com');
      }
      
      if (await passwordInput.isVisible()) {
        await passwordInput.fill('testpassword');
        await expect(passwordInput).toHaveValue('testpassword');
      }
    }
  });

  test('JavaScript functionality works', async ({ page, browserName }) => {
    // Test if JavaScript is working by checking for dynamic content
    await page.goto('/');
    
    // Check if React has loaded (look for React-generated attributes)
    const reactRoot = page.locator('#root, [data-reactroot]');
    await expect(reactRoot).toBeVisible();
    
    // Test interactive elements
    const buttons = page.locator('button:visible');
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThan(0);
    
    // Test that clicking doesn't cause JavaScript errors
    if (buttonCount > 0) {
      await buttons.first().click();
      // Check console for JavaScript errors
      const consoleErrors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });
      
      // Wait a bit for any errors to surface
      await page.waitForTimeout(1000);
      
      // Report any console errors found
      if (consoleErrors.length > 0) {
        console.warn(`Console errors in ${browserName}:`, consoleErrors);
      }
    }
  });

  test('Images and media load correctly', async ({ page, browserName }) => {
    await page.goto('/');
    
    // Check if images are loading
    const images = page.locator('img');
    const imageCount = await images.count();
    
    if (imageCount > 0) {
      // Check first image loads
      const firstImage = images.first();
      await expect(firstImage).toBeVisible();
      
      // Check image has loaded (not broken)
      const naturalWidth = await firstImage.evaluate((img: HTMLImageElement) => img.naturalWidth);
      expect(naturalWidth).toBeGreaterThan(0);
    }
  });

  test('Font rendering and text display', async ({ page, browserName }) => {
    await page.goto('/');
    
    // Check text is visible and readable
    const headings = page.locator('h1, h2, h3');
    const headingCount = await headings.count();
    
    if (headingCount > 0) {
      const firstHeading = headings.first();
      await expect(firstHeading).toBeVisible();
      
      // Check text content is not empty
      const textContent = await firstHeading.textContent();
      expect(textContent?.trim().length).toBeGreaterThan(0);
    }
    
    // Check for any text overflow issues
    const textElements = page.locator('p, span, div');
    const count = Math.min(await textElements.count(), 5); // Check first 5 elements
    
    for (let i = 0; i < count; i++) {
      const element = textElements.nth(i);
      if (await element.isVisible()) {
        const boundingBox = await element.boundingBox();
        if (boundingBox) {
          expect(boundingBox.width).toBeGreaterThan(0);
          expect(boundingBox.height).toBeGreaterThan(0);
        }
      }
    }
  });

  test('Performance and loading times', async ({ page, browserName }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Log loading time for comparison
    console.log(`${browserName} page load time: ${loadTime}ms`);
    
    // Ensure page loads within reasonable time (10 seconds)
    expect(loadTime).toBeLessThan(10000);
    
    // Check if page is interactive
    const interactiveElement = page.locator('button, a, input').first();
    if (await interactiveElement.isVisible()) {
      await expect(interactiveElement).toBeEnabled();
    }
  });

  test('Local storage and session handling', async ({ page, browserName, context }) => {
    await page.goto('/');
    
    // Test localStorage functionality
    await page.evaluate(() => {
      localStorage.setItem('testKey', 'testValue');
    });
    
    const storedValue = await page.evaluate(() => {
      return localStorage.getItem('testKey');
    });
    
    expect(storedValue).toBe('testValue');
    
    // Clean up
    await page.evaluate(() => {
      localStorage.removeItem('testKey');
    });
  });
});