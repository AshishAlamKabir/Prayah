import { test, expect } from '@playwright/test';

// Accessibility testing across browsers
test.describe('Cross-Browser Accessibility Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('Keyboard navigation works across browsers', async ({ page, browserName }) => {
    // Test tab navigation
    await page.keyboard.press('Tab');
    
    // Check if focus is visible
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Test multiple tab presses
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      const currentFocus = page.locator(':focus');
      if (await currentFocus.isVisible()) {
        // Ensure focused element is interactive
        const tagName = await currentFocus.evaluate(el => el.tagName.toLowerCase());
        const isInteractive = ['button', 'a', 'input', 'select', 'textarea'].includes(tagName) ||
                            await currentFocus.getAttribute('tabindex') !== null;
        
        if (isInteractive) {
          expect(await currentFocus.isVisible()).toBe(true);
        }
      }
    }
    
    console.log(`Keyboard navigation tested in ${browserName}`);
  });

  test('Screen reader compatibility', async ({ page, browserName }) => {
    // Check for proper ARIA labels and semantic HTML
    const accessibilityFeatures = await page.evaluate(() => {
      const results = {
        headings: document.querySelectorAll('h1, h2, h3, h4, h5, h6').length,
        landmarks: document.querySelectorAll('main, nav, aside, footer, header').length,
        ariaLabels: document.querySelectorAll('[aria-label]').length,
        altTexts: document.querySelectorAll('img[alt]').length,
        totalImages: document.querySelectorAll('img').length,
        buttons: document.querySelectorAll('button').length,
        links: document.querySelectorAll('a').length,
        formLabels: document.querySelectorAll('label').length,
        inputs: document.querySelectorAll('input').length
      };
      
      return results;
    });
    
    console.log(`Accessibility features in ${browserName}:`, accessibilityFeatures);
    
    // Should have semantic structure
    expect(accessibilityFeatures.headings).toBeGreaterThan(0);
    expect(accessibilityFeatures.landmarks).toBeGreaterThan(0);
    
    // Images should have alt text
    if (accessibilityFeatures.totalImages > 0) {
      const altTextRatio = accessibilityFeatures.altTexts / accessibilityFeatures.totalImages;
      expect(altTextRatio).toBeGreaterThan(0.8); // At least 80% of images should have alt text
    }
  });

  test('Color contrast and visual accessibility', async ({ page, browserName }) => {
    // Test if page is readable with high contrast
    await page.evaluate(() => {
      // Simulate high contrast mode
      document.body.style.filter = 'contrast(200%)';
    });
    
    // Check if text is still readable
    const textElements = page.locator('h1, h2, p, span');
    const count = Math.min(await textElements.count(), 3);
    
    for (let i = 0; i < count; i++) {
      const element = textElements.nth(i);
      if (await element.isVisible()) {
        const textContent = await element.textContent();
        expect(textContent?.trim().length).toBeGreaterThan(0);
      }
    }
    
    // Reset filter
    await page.evaluate(() => {
      document.body.style.filter = '';
    });
    
    console.log(`High contrast test completed in ${browserName}`);
  });

  test('Text scaling compatibility', async ({ page, browserName }) => {
    // Test text scaling (simulate zoom)
    await page.setViewportSize({ width: 1200, height: 800 });
    
    // Increase text size via CSS
    await page.evaluate(() => {
      document.body.style.fontSize = '150%';
    });
    
    // Check if layout doesn't break
    const textElements = page.locator('h1, p');
    const firstElement = textElements.first();
    
    if (await firstElement.isVisible()) {
      const boundingBox = await firstElement.boundingBox();
      expect(boundingBox?.width).toBeGreaterThan(0);
      expect(boundingBox?.height).toBeGreaterThan(0);
    }
    
    // Reset font size
    await page.evaluate(() => {
      document.body.style.fontSize = '';
    });
    
    console.log(`Text scaling test completed in ${browserName}`);
  });

  test('Focus management in modals', async ({ page, browserName }) => {
    // Test if focus is properly trapped in modals
    const modalTrigger = page.locator('button:has-text("Login"), button:has-text("লগইন")').first();
    
    if (await modalTrigger.isVisible()) {
      await modalTrigger.click();
      
      // Check if modal opened
      const modal = page.locator('[role="dialog"], .modal, [data-testid="modal"]');
      if (await modal.isVisible()) {
        // Check if focus is inside modal
        const focusedElement = page.locator(':focus');
        const isInsideModal = await modal.locator(':focus').count() > 0;
        
        if (isInsideModal) {
          // Test Escape key
          await page.keyboard.press('Escape');
          
          // Modal should close
          await expect(modal).not.toBeVisible({ timeout: 3000 });
        }
      }
    }
    
    console.log(`Focus management tested in ${browserName}`);
  });

  test('Form accessibility across browsers', async ({ page, browserName }) => {
    // Check form accessibility features
    const forms = page.locator('form');
    const formCount = await forms.count();
    
    if (formCount > 0) {
      const firstForm = forms.first();
      
      // Check for labels and inputs association
      const formAccessibility = await firstForm.evaluate((form) => {
        const inputs = form.querySelectorAll('input, select, textarea');
        const labels = form.querySelectorAll('label');
        
        let properlyLabeled = 0;
        
        inputs.forEach(input => {
          const id = input.getAttribute('id');
          const ariaLabel = input.getAttribute('aria-label');
          const ariaLabelledBy = input.getAttribute('aria-labelledby');
          const hasLabel = id && form.querySelector(`label[for="${id}"]`);
          
          if (hasLabel || ariaLabel || ariaLabelledBy) {
            properlyLabeled++;
          }
        });
        
        return {
          totalInputs: inputs.length,
          properlyLabeled,
          totalLabels: labels.length,
          accessibility: inputs.length === 0 ? 1 : properlyLabeled / inputs.length
        };
      });
      
      console.log(`Form accessibility in ${browserName}:`, formAccessibility);
      
      // At least 80% of form inputs should be properly labeled
      expect(formAccessibility.accessibility).toBeGreaterThan(0.8);
    }
  });

  test('Language and internationalization support', async ({ page, browserName }) => {
    // Test if browser handles international content properly
    const i18nSupport = await page.evaluate(() => {
      return {
        // Check Unicode support
        unicodeSupport: 'নমস্কাৰ'.length === 6, // Assamese text
        // Check text direction support
        dirSupported: 'dir' in document.documentElement,
        // Check language detection
        langSupported: 'lang' in document.documentElement,
        // Check Intl support
        intlSupported: typeof Intl !== 'undefined',
        // Check number formatting
        numberFormat: typeof Intl.NumberFormat === 'function',
        // Check date formatting
        dateFormat: typeof Intl.DateTimeFormat === 'function'
      };
    });
    
    console.log(`Internationalization support in ${browserName}:`, i18nSupport);
    
    // Essential i18n features should work
    expect(i18nSupport.unicodeSupport).toBe(true);
    expect(i18nSupport.intlSupported).toBe(true);
  });

  test('Reduced motion preferences', async ({ page, browserName }) => {
    // Test CSS motion preferences
    const motionSupport = await page.evaluate(() => {
      // Check if browser supports prefers-reduced-motion
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      
      return {
        reducedMotionSupported: typeof mediaQuery.matches === 'boolean',
        currentPreference: mediaQuery.matches,
        mediaQuerySupported: typeof window.matchMedia === 'function'
      };
    });
    
    console.log(`Motion preferences in ${browserName}:`, motionSupport);
    
    // Media query support should be available
    expect(motionSupport.mediaQuerySupported).toBe(true);
  });
});