import { Page, expect, Locator } from '@playwright/test';

/**
 * Utility functions for cross-browser testing
 */

export class TestUtils {
  constructor(private page: Page) {}

  /**
   * Wait for the application to be fully loaded
   */
  async waitForAppLoad(timeout = 10000) {
    await this.page.waitForLoadState('networkidle');
    
    // Wait for React to be initialized
    await this.page.waitForFunction(() => {
      return document.querySelector('#root') && 
             document.querySelector('#root')?.children.length > 0;
    }, { timeout });
  }

  /**
   * Take a screenshot with browser and device info
   */
  async takeScreenshot(name: string, options: { fullPage?: boolean } = {}) {
    const context = this.page.context();
    const browserName = context.browser()?.browserType().name() || 'unknown';
    const viewportSize = this.page.viewportSize();
    
    const filename = `${name}-${browserName}-${viewportSize?.width}x${viewportSize?.height}.png`;
    
    await this.page.screenshot({
      path: `test-results/screenshots/${filename}`,
      fullPage: options.fullPage || false
    });
    
    return filename;
  }

  /**
   * Check if element is properly visible (not just in DOM)
   */
  async isProperlyVisible(selector: string): Promise<boolean> {
    const element = this.page.locator(selector);
    
    if (!(await element.isVisible())) {
      return false;
    }
    
    // Check if element has actual dimensions
    const boundingBox = await element.boundingBox();
    return boundingBox !== null && boundingBox.width > 0 && boundingBox.height > 0;
  }

  /**
   * Test responsive behavior at different breakpoints
   */
  async testResponsiveBreakpoints(testCallback: (width: number) => Promise<void>) {
    const breakpoints = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1024, height: 768 },
      { name: 'large', width: 1440, height: 900 }
    ];

    for (const bp of breakpoints) {
      await this.page.setViewportSize({ width: bp.width, height: bp.height });
      await this.page.waitForTimeout(500); // Allow layout to settle
      await testCallback(bp.width);
    }
  }

  /**
   * Check for JavaScript errors in console
   */
  async getConsoleErrors(): Promise<string[]> {
    const errors: string[] = [];
    
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    this.page.on('pageerror', err => {
      errors.push(err.message);
    });
    
    return errors;
  }

  /**
   * Test keyboard navigation
   */
  async testKeyboardNavigation(): Promise<{ focusableElements: number; tabTraps: boolean }> {
    const focusableElements = await this.page.locator(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    ).count();
    
    let currentFocus = 0;
    let tabTraps = true;
    
    // Test tab navigation
    for (let i = 0; i < Math.min(focusableElements, 10); i++) {
      await this.page.keyboard.press('Tab');
      const focusedElement = this.page.locator(':focus');
      
      if (await focusedElement.count() === 0) {
        tabTraps = false;
        break;
      }
      currentFocus++;
    }
    
    return { focusableElements, tabTraps };
  }

  /**
   * Test form accessibility
   */
  async testFormAccessibility(): Promise<{ 
    formsFound: number; 
    properlyLabeled: number; 
    accessibilityScore: number 
  }> {
    const forms = this.page.locator('form');
    const formsFound = await forms.count();
    
    if (formsFound === 0) {
      return { formsFound: 0, properlyLabeled: 0, accessibilityScore: 100 };
    }
    
    let totalInputs = 0;
    let properlyLabeled = 0;
    
    for (let i = 0; i < formsFound; i++) {
      const form = forms.nth(i);
      const inputs = form.locator('input, select, textarea');
      const inputCount = await inputs.count();
      totalInputs += inputCount;
      
      for (let j = 0; j < inputCount; j++) {
        const input = inputs.nth(j);
        
        // Check for proper labeling
        const id = await input.getAttribute('id');
        const ariaLabel = await input.getAttribute('aria-label');
        const ariaLabelledBy = await input.getAttribute('aria-labelledby');
        
        let hasLabel = false;
        
        if (id) {
          const label = this.page.locator(`label[for="${id}"]`);
          hasLabel = await label.count() > 0;
        }
        
        if (hasLabel || ariaLabel || ariaLabelledBy) {
          properlyLabeled++;
        }
      }
    }
    
    const accessibilityScore = totalInputs > 0 ? (properlyLabeled / totalInputs) * 100 : 100;
    
    return { formsFound, properlyLabeled, accessibilityScore };
  }

  /**
   * Test page performance
   */
  async measurePagePerformance(): Promise<{
    loadTime: number;
    domContentLoaded: number;
    firstContentfulPaint?: number;
    largestContentfulPaint?: number;
  }> {
    const startTime = Date.now();
    
    await this.page.reload();
    await this.page.waitForLoadState('domcontentloaded');
    
    const domContentLoaded = Date.now() - startTime;
    
    await this.page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    // Get Web Vitals if available
    const webVitals = await this.page.evaluate(() => {
      return new Promise(resolve => {
        if ('PerformanceObserver' in window) {
          const observer = new PerformanceObserver(list => {
            const entries = list.getEntries();
            const results: any = {};
            
            entries.forEach(entry => {
              if (entry.entryType === 'paint') {
                if (entry.name === 'first-contentful-paint') {
                  results.firstContentfulPaint = entry.startTime;
                }
              } else if (entry.entryType === 'largest-contentful-paint') {
                results.largestContentfulPaint = entry.startTime;
              }
            });
            
            observer.disconnect();
            resolve(results);
          });
          
          observer.observe({ entryTypes: ['paint', 'largest-contentful-paint'] });
          
          // Timeout after 5 seconds
          setTimeout(() => {
            observer.disconnect();
            resolve({});
          }, 5000);
        } else {
          resolve({});
        }
      });
    });
    
    return {
      loadTime,
      domContentLoaded,
      ...webVitals
    };
  }

  /**
   * Test browser feature support
   */
  async testBrowserFeatures(): Promise<Record<string, boolean>> {
    return await this.page.evaluate(() => {
      return {
        // Core JavaScript features
        es6_arrow_functions: (() => true)(),
        es6_const_let: (() => { const x = 1; let y = 2; return true; })(),
        es6_template_literals: `test` === 'test',
        es6_promises: typeof Promise === 'function',
        es6_async_await: (async () => true)() instanceof Promise,
        
        // CSS features
        css_flexbox: CSS.supports('display', 'flex'),
        css_grid: CSS.supports('display', 'grid'),
        css_custom_properties: CSS.supports('--custom', 'value'),
        css_calc: CSS.supports('width', 'calc(100% - 10px)'),
        
        // HTML5 features
        html5_local_storage: typeof localStorage === 'object',
        html5_session_storage: typeof sessionStorage === 'object',
        html5_history_api: typeof history.pushState === 'function',
        html5_canvas: !!document.createElement('canvas').getContext,
        
        // Network features
        fetch_api: typeof fetch === 'function',
        websockets: typeof WebSocket === 'function',
        
        // Payment features
        payment_request_api: typeof PaymentRequest === 'function',
        web_crypto: typeof crypto.subtle === 'object',
        intl_currency: typeof Intl.NumberFormat === 'function',
        
        // Mobile features
        touch_events: 'ontouchstart' in window,
        device_orientation: typeof DeviceOrientationEvent === 'function',
        vibration: typeof navigator.vibrate === 'function',
        
        // Accessibility features
        aria_support: 'ariaLabel' in document.createElement('div'),
        focus_visible: CSS.supports('selector(:focus-visible)'),
        prefers_reduced_motion: window.matchMedia('(prefers-reduced-motion)').matches !== undefined
      };
    });
  }

  /**
   * Simulate different network conditions
   */
  async simulateSlowNetwork() {
    const context = this.page.context();
    await context.route('**/*', route => {
      setTimeout(() => route.continue(), 1000); // Add 1s delay
    });
  }

  /**
   * Test color contrast (basic check)
   */
  async testColorContrast(): Promise<{ passedElements: number; totalElements: number }> {
    return await this.page.evaluate(() => {
      const elements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, a, button');
      let passedElements = 0;
      
      elements.forEach(element => {
        const style = window.getComputedStyle(element);
        const color = style.color;
        const backgroundColor = style.backgroundColor;
        
        // Basic check: ensure color is not the same as background
        if (color !== backgroundColor && color !== 'rgba(0, 0, 0, 0)' && backgroundColor !== 'rgba(0, 0, 0, 0)') {
          passedElements++;
        }
      });
      
      return {
        passedElements,
        totalElements: elements.length
      };
    });
  }
}

/**
 * Cross-browser test helpers
 */
export class CrossBrowserHelpers {
  static async getBrowserInfo(page: Page) {
    return await page.evaluate(() => {
      return {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        screen: {
          width: screen.width,
          height: screen.height,
          colorDepth: screen.colorDepth
        }
      };
    });
  }

  static async testLocalStorage(page: Page): Promise<boolean> {
    try {
      await page.evaluate(() => {
        localStorage.setItem('test', 'value');
        const retrieved = localStorage.getItem('test');
        localStorage.removeItem('test');
        return retrieved === 'value';
      });
      return true;
    } catch {
      return false;
    }
  }

  static async testSessionStorage(page: Page): Promise<boolean> {
    try {
      await page.evaluate(() => {
        sessionStorage.setItem('test', 'value');
        const retrieved = sessionStorage.getItem('test');
        sessionStorage.removeItem('test');
        return retrieved === 'value';
      });
      return true;
    } catch {
      return false;
    }
  }

  static getScoreColor(score: number): string {
    if (score >= 90) return 'green';
    if (score >= 70) return 'orange';
    return 'red';
  }

  static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}