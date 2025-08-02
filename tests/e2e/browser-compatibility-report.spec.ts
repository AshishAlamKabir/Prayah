import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

// Generate comprehensive browser compatibility report
test.describe('Browser Compatibility Report Generator', () => {
  
  test('Generate compatibility matrix', async ({ page, browserName }) => {
    const compatibility = {
      browser: browserName,
      timestamp: new Date().toISOString(),
      features: {},
      performance: {},
      errors: []
    };

    try {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Test core web technologies
      compatibility.features = await page.evaluate(() => {
        return {
          // JavaScript ES6+ features
          es6: {
            arrow_functions: (() => true)(),
            const_let: (() => { const x = 1; let y = 2; return true; })(),
            template_literals: `test` === 'test',
            destructuring: (() => { const [a] = [1]; return a === 1; })(),
            spread_operator: (() => { const arr = [1, 2]; return [...arr].length === 2; })(),
            promises: typeof Promise === 'function',
            async_await: (async () => true)() instanceof Promise,
            modules: typeof import === 'function'
          },
          
          // CSS features
          css: {
            flexbox: CSS.supports('display', 'flex'),
            grid: CSS.supports('display', 'grid'),
            custom_properties: CSS.supports('--custom-property', 'value'),
            calc: CSS.supports('width', 'calc(100% - 10px)'),
            transforms: CSS.supports('transform', 'translateX(10px)'),
            transitions: CSS.supports('transition', 'opacity 1s'),
            animations: CSS.supports('animation', 'spin 1s linear'),
            media_queries: typeof window.matchMedia === 'function'
          },
          
          // HTML5 features
          html5: {
            semantic_elements: 'article' in document.createElement('article'),
            form_validation: 'checkValidity' in document.createElement('input'),
            local_storage: typeof localStorage === 'object',
            session_storage: typeof sessionStorage === 'object',
            history_api: typeof history.pushState === 'function',
            file_api: typeof FileReader === 'function',
            drag_drop: 'draggable' in document.createElement('div'),
            canvas: !!document.createElement('canvas').getContext,
            svg: !!document.createElementNS && !!document.createElementNS('http://www.w3.org/2000/svg', 'svg').createSVGRect
          },
          
          // Network features
          network: {
            fetch: typeof fetch === 'function',
            xhr: typeof XMLHttpRequest === 'function',
            websockets: typeof WebSocket === 'function',
            sse: typeof EventSource === 'function',
            cors: true // Assumed if fetch works
          },
          
          // Security features
          security: {
            crypto: typeof crypto === 'object' && typeof crypto.getRandomValues === 'function',
            csp: 'SecurityPolicyViolationEvent' in window,
            https_only: location.protocol === 'https:' || location.hostname === 'localhost',
            secure_contexts: window.isSecureContext || location.protocol === 'https:' || location.hostname === 'localhost'
          },
          
          // Payment-specific features
          payment: {
            payment_request: typeof PaymentRequest === 'function',
            credential_management: typeof navigator.credentials === 'object',
            web_crypto: typeof crypto.subtle === 'object',
            intl_currency: typeof Intl.NumberFormat === 'function'
          },
          
          // Mobile features
          mobile: {
            touch_events: 'ontouchstart' in window,
            device_orientation: typeof DeviceOrientationEvent === 'function',
            geolocation: typeof navigator.geolocation === 'object',
            vibration: typeof navigator.vibrate === 'function',
            app_cache: typeof applicationCache === 'object'
          },
          
          // Accessibility features
          accessibility: {
            screen_reader: typeof speechSynthesis === 'object',
            high_contrast: window.matchMedia('(prefers-contrast: high)').matches !== undefined,
            reduced_motion: window.matchMedia('(prefers-reduced-motion)').matches !== undefined,
            focus_visible: CSS.supports('selector(:focus-visible)'),
            aria: 'ariaLabel' in document.createElement('div')
          }
        };
      });

      // Test performance features
      const performanceStart = performance.now();
      await page.reload();
      await page.waitForLoadState('networkidle');
      const performanceEnd = performance.now();
      
      compatibility.performance = {
        page_load_time: performanceEnd - performanceStart,
        dom_ready: await page.evaluate(() => {
          return performance.timing ? 
            performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart : 
            null;
        }),
        memory_usage: await page.evaluate(() => {
          return (performance as any).memory ? {
            used: (performance as any).memory.usedJSHeapSize,
            total: (performance as any).memory.totalJSHeapSize,
            limit: (performance as any).memory.jsHeapSizeLimit
          } : null;
        })
      };

    } catch (error) {
      compatibility.errors.push({
        type: 'test_error',
        message: error.toString(),
        stack: error.stack
      });
    }

    // Collect console errors during testing
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Test various pages for errors
    const testPages = ['/', '/schools', '/culture', '/books'];
    
    for (const testPage of testPages) {
      try {
        await page.goto(testPage);
        await page.waitForLoadState('networkidle');
        
        // Wait for any async errors
        await page.waitForTimeout(2000);
        
      } catch (error) {
        compatibility.errors.push({
          type: 'page_error',
          page: testPage,
          message: error.toString()
        });
      }
    }
    
    // Add console errors to report
    if (consoleErrors.length > 0) {
      compatibility.errors.push({
        type: 'console_errors',
        errors: consoleErrors
      });
    }

    // Save individual browser report
    const reportDir = path.join(process.cwd(), 'test-results', 'compatibility');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    const reportFile = path.join(reportDir, `${browserName.replace(/\s+/g, '_')}.json`);
    fs.writeFileSync(reportFile, JSON.stringify(compatibility, null, 2));
    
    console.log(`Compatibility report saved for ${browserName}`);
    
    // Basic assertions to ensure test validity
    expect(compatibility.features.html5.local_storage).toBe(true);
    expect(compatibility.features.css.flexbox).toBe(true);
    expect(compatibility.features.network.fetch).toBe(true);
  });

  test('Aggregate compatibility reports', async ({ browserName }) => {
    // This test runs after all browser tests and aggregates results
    test.setTimeout(60000);
    
    const reportDir = path.join(process.cwd(), 'test-results', 'compatibility');
    
    // Wait for other reports to be generated
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    if (!fs.existsSync(reportDir)) {
      console.log('No compatibility reports found yet');
      return;
    }
    
    const reports = fs.readdirSync(reportDir)
      .filter(file => file.endsWith('.json'))
      .map(file => {
        const content = fs.readFileSync(path.join(reportDir, file), 'utf8');
        return JSON.parse(content);
      });
    
    if (reports.length === 0) {
      console.log('No reports to aggregate');
      return;
    }
    
    // Create aggregated report
    const aggregated = {
      generated_at: new Date().toISOString(),
      browsers_tested: reports.length,
      browsers: reports.map(r => r.browser),
      feature_support: {},
      performance_summary: {},
      compatibility_matrix: {}
    };
    
    // Aggregate feature support
    const allFeatures = new Set();
    reports.forEach(report => {
      Object.keys(report.features || {}).forEach(category => {
        Object.keys(report.features[category] || {}).forEach(feature => {
          allFeatures.add(`${category}.${feature}`);
        });
      });
    });
    
    allFeatures.forEach(featurePath => {
      const [category, feature] = featurePath.split('.');
      if (!aggregated.feature_support[category]) {
        aggregated.feature_support[category] = {};
      }
      
      const support = reports.map(report => {
        const supported = report.features?.[category]?.[feature];
        return {
          browser: report.browser,
          supported: !!supported
        };
      });
      
      aggregated.feature_support[category][feature] = {
        total_support: support.filter(s => s.supported).length,
        total_browsers: support.length,
        support_percentage: (support.filter(s => s.supported).length / support.length) * 100,
        browser_support: support
      };
    });
    
    // Performance summary
    aggregated.performance_summary = {
      average_load_time: reports.reduce((sum, r) => sum + (r.performance?.page_load_time || 0), 0) / reports.length,
      load_times: reports.map(r => ({
        browser: r.browser,
        load_time: r.performance?.page_load_time || 0
      }))
    };
    
    // Create compatibility matrix
    reports.forEach(report => {
      aggregated.compatibility_matrix[report.browser] = {
        overall_score: calculateCompatibilityScore(report),
        critical_issues: report.errors?.length || 0,
        feature_support_score: calculateFeatureScore(report.features),
        performance_score: calculatePerformanceScore(report.performance)
      };
    });
    
    // Generate HTML report
    const htmlReport = generateHtmlReport(aggregated);
    fs.writeFileSync(path.join(reportDir, 'compatibility-report.html'), htmlReport);
    
    // Save aggregated JSON
    fs.writeFileSync(path.join(reportDir, 'aggregated-report.json'), JSON.stringify(aggregated, null, 2));
    
    console.log(`Aggregated compatibility report generated for ${reports.length} browsers`);
    console.log(`Report saved to: ${path.join(reportDir, 'compatibility-report.html')}`);
  });
});

function calculateCompatibilityScore(report: any): number {
  const features = report.features || {};
  let totalFeatures = 0;
  let supportedFeatures = 0;
  
  Object.values(features).forEach((category: any) => {
    Object.values(category).forEach((supported: any) => {
      totalFeatures++;
      if (supported) supportedFeatures++;
    });
  });
  
  return totalFeatures > 0 ? (supportedFeatures / totalFeatures) * 100 : 0;
}

function calculateFeatureScore(features: any): number {
  if (!features) return 0;
  
  const criticalFeatures = [
    'es6.promises', 'es6.async_await', 'css.flexbox', 'css.grid',
    'html5.local_storage', 'network.fetch', 'security.crypto'
  ];
  
  let supported = 0;
  criticalFeatures.forEach(feature => {
    const [category, featureName] = feature.split('.');
    if (features[category]?.[featureName]) {
      supported++;
    }
  });
  
  return (supported / criticalFeatures.length) * 100;
}

function calculatePerformanceScore(performance: any): number {
  if (!performance?.page_load_time) return 50;
  
  const loadTime = performance.page_load_time;
  if (loadTime < 1000) return 100;
  if (loadTime < 2000) return 80;
  if (loadTime < 3000) return 60;
  if (loadTime < 5000) return 40;
  return 20;
}

function generateHtmlReport(data: any): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Prayas - Cross-Browser Compatibility Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #d32f2f; color: white; padding: 20px; border-radius: 8px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 20px 0; }
        .card { background: #f5f5f5; padding: 20px; border-radius: 8px; border-left: 4px solid #d32f2f; }
        .compatibility-matrix { margin: 20px 0; }
        .browser-row { display: grid; grid-template-columns: 200px 1fr 100px 100px 100px; gap: 10px; padding: 10px; border-bottom: 1px solid #ddd; }
        .browser-row.header { background: #f0f0f0; font-weight: bold; }
        .score { padding: 5px 10px; border-radius: 4px; text-align: center; color: white; }
        .score.excellent { background: #4caf50; }
        .score.good { background: #ff9800; }
        .score.poor { background: #f44336; }
        .feature-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .feature-table th, .feature-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .feature-table th { background: #f0f0f0; }
        .supported { color: #4caf50; font-weight: bold; }
        .not-supported { color: #f44336; font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Prayas - Cross-Browser Compatibility Report</h1>
        <p>Generated: ${data.generated_at}</p>
        <p>Browsers tested: ${data.browsers_tested}</p>
    </div>
    
    <div class="summary">
        <div class="card">
            <h3>Browser Coverage</h3>
            <ul>
                ${data.browsers.map(browser => `<li>${browser}</li>`).join('')}
            </ul>
        </div>
        <div class="card">
            <h3>Performance Summary</h3>
            <p>Average Load Time: ${Math.round(data.performance_summary.average_load_time)}ms</p>
            <p>Fastest: ${Math.min(...data.performance_summary.load_times.map(t => t.load_time))}ms</p>
            <p>Slowest: ${Math.max(...data.performance_summary.load_times.map(t => t.load_time))}ms</p>
        </div>
    </div>
    
    <div class="compatibility-matrix">
        <h2>Browser Compatibility Matrix</h2>
        <div class="browser-row header">
            <div>Browser</div>
            <div>Overall Score</div>
            <div>Feature Score</div>
            <div>Performance</div>
            <div>Issues</div>
        </div>
        ${Object.entries(data.compatibility_matrix).map(([browser, scores]: [string, any]) => `
            <div class="browser-row">
                <div>${browser}</div>
                <div class="score ${getScoreClass(scores.overall_score)}">${Math.round(scores.overall_score)}%</div>
                <div class="score ${getScoreClass(scores.feature_support_score)}">${Math.round(scores.feature_support_score)}%</div>
                <div class="score ${getScoreClass(scores.performance_score)}">${Math.round(scores.performance_score)}%</div>
                <div>${scores.critical_issues}</div>
            </div>
        `).join('')}
    </div>
    
    <h2>Feature Support Details</h2>
    ${Object.entries(data.feature_support).map(([category, features]: [string, any]) => `
        <h3>${category.toUpperCase()}</h3>
        <table class="feature-table">
            <tr>
                <th>Feature</th>
                <th>Support Rate</th>
                ${data.browsers.map(browser => `<th>${browser}</th>`).join('')}
            </tr>
            ${Object.entries(features).map(([feature, support]: [string, any]) => `
                <tr>
                    <td>${feature.replace(/_/g, ' ')}</td>
                    <td>${Math.round(support.support_percentage)}%</td>
                    ${support.browser_support.map(bs => `
                        <td class="${bs.supported ? 'supported' : 'not-supported'}">
                            ${bs.supported ? '✓' : '✗'}
                        </td>
                    `).join('')}
                </tr>
            `).join('')}
        </table>
    `).join('')}
</body>
</html>`;
}

function getScoreClass(score: number): string {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  return 'poor';
}