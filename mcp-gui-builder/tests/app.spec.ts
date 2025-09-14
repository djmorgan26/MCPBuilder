import { test, expect } from '@playwright/test';

test.describe('MCP GUI Builder App', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('has correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/MCP GUI Builder/);
  });

  test('displays header with navigation', async ({ page }) => {
    // Check header is visible
    const header = page.locator('header');
    await expect(header).toBeVisible();

    // Check title and description
    await expect(page.getByText('MCP GUI Builder')).toBeVisible();
    await expect(page.getByText('Visual MCP Server Creator')).toBeVisible();

    // Check version badge
    await expect(page.getByText('v1.0.0')).toBeVisible();

    // Check navigation buttons
    await expect(page.getByRole('button', { name: /preview code/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /generate & deploy/i })).toBeVisible();

    // Check help and GitHub links
    await expect(page.getByRole('button', { name: /help/i })).toBeVisible();
    const githubButton = page.getByRole('button').filter({ hasText: /github/i });
    await expect(githubButton).toBeVisible();
  });

  test('displays server configuration panel', async ({ page }) => {
    // Check server config section
    const serverConfig = page.locator('text=Server Configuration').locator('..');
    await expect(serverConfig).toBeVisible();

    // Check form fields
    await expect(page.getByLabel(/server name/i)).toBeVisible();
    await expect(page.getByLabel(/description/i)).toBeVisible();
    await expect(page.getByLabel(/author/i)).toBeVisible();
    await expect(page.getByLabel(/version/i)).toBeVisible();
    await expect(page.getByLabel(/python version/i)).toBeVisible();

    // Check default values
    await expect(page.getByLabel(/server name/i)).toHaveValue('my-mcp-server');
    await expect(page.getByLabel(/version/i)).toHaveValue('1.0.0');
  });

  test('displays tool templates panel', async ({ page }) => {
    // Check tool templates section
    const toolTemplates = page.locator('text=Tool Templates').locator('..');
    await expect(toolTemplates).toBeVisible();

    // Check search functionality
    const searchInput = page.getByPlaceholder(/search tools/i);
    await expect(searchInput).toBeVisible();

    // Check category filters
    await expect(page.getByText('All Tools')).toBeVisible();
    await expect(page.getByText('I/O')).toBeVisible();
    await expect(page.getByText('Compute')).toBeVisible();
    await expect(page.getByText('Integration')).toBeVisible();

    // Check at least some tool templates are visible
    await expect(page.getByText('File Reader')).toBeVisible();
    await expect(page.getByText('API Caller')).toBeVisible();
    await expect(page.getByText('Calculator')).toBeVisible();
  });

  test('displays main content tabs', async ({ page }) => {
    // Check all tabs are visible
    await expect(page.getByRole('button', { name: 'Tools' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Resources' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Code' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Deploy' })).toBeVisible();

    // Tools tab should be active by default
    const toolsTab = page.getByRole('button', { name: 'Tools' });
    await expect(toolsTab).toHaveClass(/text-mcp-primary/);
  });

  test('displays active tools section when no tools added', async ({ page }) => {
    // Should show empty state
    await expect(page.getByText('No Tools Added Yet')).toBeVisible();
    await expect(page.getByText('Add tools from the templates')).toBeVisible();

    // Check getting started instructions
    await expect(page.getByText('Browse tool templates in the sidebar')).toBeVisible();
    await expect(page.getByText('Click on a template to add it')).toBeVisible();
  });

  test('displays help panel', async ({ page }) => {
    // Check help section
    const helpPanel = page.locator('text=Quick Help').locator('..');
    await expect(helpPanel).toBeVisible();

    // Check getting started section
    await expect(page.getByText('Getting Started')).toBeVisible();
    await expect(page.getByText('1. Configure your server details')).toBeVisible();
    await expect(page.getByText('2. Add tools from templates')).toBeVisible();

    // Check tips section
    await expect(page.getByText('Tips')).toBeVisible();
    await expect(page.getByText('Drag tools to reorder them')).toBeVisible();
    await expect(page.getByText('Use environment variables for secrets')).toBeVisible();
  });

  test('can switch between tabs', async ({ page }) => {
    // Start on Tools tab
    const toolsTab = page.getByRole('button', { name: 'Tools' });
    const resourcesTab = page.getByRole('button', { name: 'Resources' });
    const codeTab = page.getByRole('button', { name: 'Code' });

    await expect(toolsTab).toHaveClass(/text-mcp-primary/);

    // Click Resources tab
    await resourcesTab.click();
    await expect(resourcesTab).toHaveClass(/text-mcp-primary/);
    await expect(toolsTab).not.toHaveClass(/text-mcp-primary/);

    // Click Code tab
    await codeTab.click();
    await expect(codeTab).toHaveClass(/text-mcp-primary/);
    await expect(page.getByText('No Code Generated Yet')).toBeVisible();

    // Go back to Tools tab
    await toolsTab.click();
    await expect(toolsTab).toHaveClass(/text-mcp-primary/);
    await expect(page.getByText('No Tools Added Yet')).toBeVisible();
  });

  test('can filter tool templates', async ({ page }) => {
    // Test search functionality
    const searchInput = page.getByPlaceholder(/search tools/i);
    await searchInput.fill('file');

    // Should show only file-related tools
    await expect(page.getByText('File Reader')).toBeVisible();
    await expect(page.getByText('API Caller')).not.toBeVisible();

    // Clear search
    await searchInput.clear();
    await expect(page.getByText('API Caller')).toBeVisible();

    // Test category filtering
    const computeCategory = page.getByText('Compute');
    await computeCategory.click();

    // Should show compute tools
    await expect(page.getByText('Calculator')).toBeVisible();
    await expect(page.getByText('Image Processor')).toBeVisible();
    await expect(page.getByText('File Reader')).not.toBeVisible();

    // Go back to all tools
    await page.getByText('All Tools').click();
    await expect(page.getByText('File Reader')).toBeVisible();
  });

  test('responsive design works on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Check that the page still displays properly
    await expect(page.getByText('MCP GUI Builder')).toBeVisible();

    // On mobile, the layout should stack vertically
    // This is a basic check - you might want to be more specific based on your responsive design
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
  });
});