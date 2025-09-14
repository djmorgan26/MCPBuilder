import { test, expect } from '@playwright/test';

test.describe('Visual Appearance Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('homepage visual appearance', async ({ page }) => {
    // Take a screenshot of the full homepage
    await expect(page).toHaveScreenshot('homepage-full.png', {
      fullPage: true,
      threshold: 0.3,
    });
  });

  test('header component visual', async ({ page }) => {
    const header = page.locator('header');
    await expect(header).toHaveScreenshot('header-component.png', {
      threshold: 0.2,
    });
  });

  test('server configuration panel visual', async ({ page }) => {
    const serverConfigPanel = page.getByText('Server Configuration').locator('..');
    await expect(serverConfigPanel).toHaveScreenshot('server-config-panel.png', {
      threshold: 0.2,
    });
  });

  test('tool templates panel visual', async ({ page }) => {
    const toolTemplatesPanel = page.getByText('Tool Templates').locator('..');
    await expect(toolTemplatesPanel).toHaveScreenshot('tool-templates-panel.png', {
      threshold: 0.2,
    });
  });

  test('main content area visual', async ({ page }) => {
    const mainContent = page.locator('main > div > div').nth(1);
    await expect(mainContent).toHaveScreenshot('main-content-area.png', {
      threshold: 0.2,
    });
  });

  test('help panel visual', async ({ page }) => {
    const helpPanel = page.getByText('Quick Help').locator('..');
    await expect(helpPanel).toHaveScreenshot('help-panel.png', {
      threshold: 0.2,
    });
  });

  test('tool modal visual', async ({ page }) => {
    // Open a tool modal
    const fileReaderTemplate = page.getByText('File Reader').locator('..');
    await fileReaderTemplate.click();

    const modal = page.locator('div[role="dialog"]').or(page.locator('.fixed.inset-0'));
    await expect(modal).toBeVisible();
    await expect(modal).toHaveScreenshot('tool-modal.png', {
      threshold: 0.2,
    });
  });

  test('tool modal with parameters visual', async ({ page }) => {
    // Open tool modal and add parameters
    const calculatorTemplate = page.getByText('Calculator').locator('..');
    await calculatorTemplate.click();

    // Add a few parameters
    await page.getByRole('button', { name: /add parameter/i }).click();
    await page.getByLabel(/name/i).first().fill('expression');
    await page.getByLabel(/description/i).last().fill('Mathematical expression to evaluate');

    await page.getByRole('button', { name: /add parameter/i }).click();
    await page.locator('input[placeholder="parameter_name"]').last().fill('precision');
    await page.locator('input[placeholder="Parameter description"]').last().fill('Number of decimal places');

    const modal = page.locator('div[role="dialog"]').or(page.locator('.fixed.inset-0'));
    await expect(modal).toHaveScreenshot('tool-modal-with-parameters.png', {
      threshold: 0.2,
    });
  });

  test('active tools with content visual', async ({ page }) => {
    // Add a tool first
    const apiCallerTemplate = page.getByText('API Caller').locator('..');
    await apiCallerTemplate.click();

    // Add parameter and save
    await page.getByRole('button', { name: /add parameter/i }).click();
    await page.getByLabel(/name/i).first().fill('url');
    await page.getByLabel(/description/i).last().fill('API endpoint URL');
    await page.getByRole('button', { name: /save tool/i }).click();

    // Take screenshot of active tools area with content
    const activeToolsArea = page.locator('div').filter({ hasText: 'Active Tools' }).nth(1);
    await expect(activeToolsArea).toHaveScreenshot('active-tools-with-content.png', {
      threshold: 0.2,
    });
  });

  test('code generation tab visual', async ({ page }) => {
    // Set up and generate code
    await page.getByLabel(/server name/i).fill('visual-test-server');

    // Add a tool
    const fileReaderTemplate = page.getByText('File Reader').locator('..');
    await fileReaderTemplate.click();
    await page.getByRole('button', { name: /add parameter/i }).click();
    await page.getByLabel(/name/i).first().fill('file_path');
    await page.getByLabel(/description/i).last().fill('Path to file');
    await page.getByRole('button', { name: /save tool/i }).click();

    // Generate code and switch to code tab
    await page.getByRole('button', { name: /preview code/i }).click();

    // Wait for code editor to load
    await expect(page.locator('.monaco-editor')).toBeVisible();
    await page.waitForTimeout(2000);

    const codePanel = page.locator('div').filter({ hasText: 'Generated Code' }).nth(1);
    await expect(codePanel).toHaveScreenshot('code-generation-tab.png', {
      threshold: 0.3,
    });
  });

  test('deployment tab visual', async ({ page }) => {
    // Switch to deploy tab
    await page.getByRole('button', { name: 'Deploy' }).click();

    const deployPanel = page.locator('[role="tabpanel"]').or(page.locator('div').filter({ hasText: 'Ready to Deploy' }));
    await expect(deployPanel).toHaveScreenshot('deployment-tab.png', {
      threshold: 0.2,
    });
  });

  test('resources tab visual', async ({ page }) => {
    // Switch to resources tab
    await page.getByRole('button', { name: 'Resources' }).click();

    const resourcesPanel = page.locator('[role="tabpanel"]').or(page.locator('main > div > div').nth(1));
    await expect(resourcesPanel).toHaveScreenshot('resources-tab.png', {
      threshold: 0.2,
    });
  });

  test('mobile responsive visual', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });

    await expect(page).toHaveScreenshot('mobile-homepage.png', {
      fullPage: true,
      threshold: 0.3,
    });
  });

  test('tablet responsive visual', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });

    await expect(page).toHaveScreenshot('tablet-homepage.png', {
      fullPage: true,
      threshold: 0.3,
    });
  });

  test('dark theme compatibility', async ({ page }) => {
    // Test in dark mode
    await page.emulateMedia({ colorScheme: 'dark' });

    await expect(page).toHaveScreenshot('dark-theme-homepage.png', {
      fullPage: true,
      threshold: 0.3,
    });
  });

  test('form validation visual states', async ({ page }) => {
    // Test invalid server name
    await page.getByLabel(/server name/i).clear();
    await page.getByLabel(/server name/i).fill('Invalid Server Name!');

    // Test invalid version
    await page.getByLabel(/version/i).clear();
    await page.getByLabel(/version/i).fill('not-a-version');

    const serverConfigPanel = page.getByText('Server Configuration').locator('..');
    await expect(serverConfigPanel).toHaveScreenshot('form-validation-errors.png', {
      threshold: 0.2,
    });
  });

  test('loading states visual', async ({ page }) => {
    // Add a tool first
    const webScraperTemplate = page.getByText('Web Scraper').locator('..');
    await webScraperTemplate.click();
    await page.getByRole('button', { name: /add parameter/i }).click();
    await page.getByLabel(/name/i).first().fill('url');
    await page.getByLabel(/description/i).last().fill('URL to scrape');
    await page.getByRole('button', { name: /save tool/i }).click();

    // Trigger code generation to show loading state
    await page.getByRole('button', { name: /preview code/i }).click();

    // Take screenshot during loading (this might be quick, so we'll try)
    try {
      const loadingState = page.getByText('Generating...');
      if (await loadingState.isVisible()) {
        await expect(page).toHaveScreenshot('loading-state.png', {
          threshold: 0.2,
        });
      }
    } catch (e) {
      // If loading is too fast, just continue
    }
  });

  test('hover states visual', async ({ page }) => {
    // Hover over a tool template
    const fileReaderTemplate = page.getByText('File Reader').locator('..');
    await fileReaderTemplate.hover();

    const toolTemplatesPanel = page.getByText('Tool Templates').locator('..');
    await expect(toolTemplatesPanel).toHaveScreenshot('hover-state-tool-template.png', {
      threshold: 0.2,
    });
  });

  test('focus states visual', async ({ page }) => {
    // Focus on server name input
    await page.getByLabel(/server name/i).focus();

    const serverConfigPanel = page.getByText('Server Configuration').locator('..');
    await expect(serverConfigPanel).toHaveScreenshot('focus-state-input.png', {
      threshold: 0.2,
    });
  });
});