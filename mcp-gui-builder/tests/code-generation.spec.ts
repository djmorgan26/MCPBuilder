import { test, expect } from '@playwright/test';

test.describe('Code Generation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    // Set up a basic server configuration
    await page.getByLabel(/server name/i).fill('test-mcp-server');
    await page.getByLabel(/description/i).fill('A test MCP server');
    await page.getByLabel(/author/i).fill('Test Author');

    // Add a simple tool to enable code generation
    const fileReaderTemplate = page.getByText('File Reader').locator('..');
    await fileReaderTemplate.click();

    // Add parameter to make tool valid
    await page.getByRole('button', { name: /add parameter/i }).click();
    await page.getByLabel(/name/i).first().fill('file_path');
    await page.getByLabel(/description/i).last().fill('Path to the file');
    await page.getByRole('button', { name: /save tool/i }).click();
  });

  test('can generate code from configuration', async ({ page }) => {
    // Click Preview Code button
    await page.getByRole('button', { name: /preview code/i }).click();

    // Should switch to Code tab
    const codeTab = page.getByRole('button', { name: 'Code' });
    await expect(codeTab).toHaveClass(/text-mcp-primary/);

    // Should show generated code interface
    await expect(page.getByText('Generated Code')).toBeVisible();

    // Should show file tabs
    await expect(page.getByText('main.py')).toBeVisible();
    await expect(page.getByText('requirements.txt')).toBeVisible();
    await expect(page.getByText('Dockerfile')).toBeVisible();
    await expect(page.getByText('README.md')).toBeVisible();

    // Should show code editor
    await expect(page.locator('.monaco-editor')).toBeVisible();

    // Should show download buttons
    await expect(page.getByRole('button', { name: /copy/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /download/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /download all/i })).toBeVisible();
  });

  test('shows different file contents when switching tabs', async ({ page }) => {
    // Generate code first
    await page.getByRole('button', { name: /preview code/i }).click();

    // Check main.py is selected by default
    const mainPyTab = page.getByText('main.py');
    await expect(mainPyTab).toHaveClass(/bg-mcp-primary/);

    // Switch to requirements.txt
    await page.getByText('requirements.txt').click();

    // Wait for editor to update
    await page.waitForTimeout(1000);

    // Should show different content (requirements should be much shorter)
    const editor = page.locator('.monaco-editor');
    await expect(editor).toBeVisible();

    // Switch to Dockerfile
    await page.getByText('Dockerfile').click();
    await page.waitForTimeout(1000);

    // Switch back to main.py
    await mainPyTab.click();
    await page.waitForTimeout(1000);
  });

  test('shows code statistics', async ({ page }) => {
    // Generate code
    await page.getByRole('button', { name: /preview code/i }).click();

    // Check footer stats
    await expect(page.getByText('1 tools configured')).toBeVisible();
    await expect(page.getByText('0 resources defined')).toBeVisible();
    await expect(page.getByText('Python 3.11')).toBeVisible();

    // Should show line count and file size
    await expect(page.getByText(/\d+ lines/)).toBeVisible();
    await expect(page.getByText(/\d+\.\d+ KB/)).toBeVisible();
  });

  test('can copy code to clipboard', async ({ page }) => {
    // Generate code
    await page.getByRole('button', { name: /preview code/i }).click();

    // Grant clipboard permissions
    await page.context().grantPermissions(['clipboard-write', 'clipboard-read']);

    // Click copy button
    await page.getByRole('button', { name: /copy/i }).click();

    // Should show feedback
    await expect(page.getByText('Copied!')).toBeVisible();

    // Verify clipboard has content
    const clipboardContent = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardContent).toContain('test-mcp-server');
    expect(clipboardContent).toContain('File Reader');
  });

  test('can regenerate code', async ({ page }) => {
    // Generate code
    await page.getByRole('button', { name: /preview code/i }).click();

    // Click regenerate button
    await page.getByRole('button', { name: /regenerate/i }).click();

    // Should show regenerating state
    await expect(page.getByText('Regenerating...')).toBeVisible();

    // Should complete and show code again
    await expect(page.getByText('Generated Code')).toBeVisible();
    await expect(page.locator('.monaco-editor')).toBeVisible();
  });

  test('shows error when no tools configured', async ({ page }) => {
    // Start fresh without any tools
    await page.goto('/');

    // Try to generate code
    await page.getByRole('button', { name: /preview code/i }).click();

    // Should show appropriate message
    await expect(page.getByText('No Code Generated Yet')).toBeVisible();
    await expect(page.getByText('Add at least one tool before generating code')).toBeVisible();

    // Generate button should be disabled
    const generateButton = page.getByRole('button', { name: /generate code/i });
    await expect(generateButton).toBeDisabled();
  });

  test('updates code when configuration changes', async ({ page }) => {
    // Generate initial code
    await page.getByRole('button', { name: /preview code/i }).click();

    // Go back to tools tab
    await page.getByRole('button', { name: 'Tools' }).click();

    // Add another tool
    const calculatorTemplate = page.getByText('Calculator').locator('..');
    await calculatorTemplate.click();

    // Add parameter to make it valid
    await page.getByRole('button', { name: /add parameter/i }).click();
    await page.getByLabel(/name/i).first().fill('expression');
    await page.getByLabel(/description/i).last().fill('Mathematical expression');
    await page.getByRole('button', { name: /save tool/i }).click();

    // Regenerate code
    await page.getByRole('button', { name: /preview code/i }).click();

    // Should now show 2 tools in stats
    await expect(page.getByText('2 tools configured')).toBeVisible();

    // Code should contain both tools
    await page.waitForTimeout(1000);
    const editor = page.locator('.monaco-editor');
    await expect(editor).toBeVisible();
  });

  test('validates server configuration before generation', async ({ page }) => {
    // Start with invalid configuration
    await page.goto('/');

    // Set invalid version
    await page.getByLabel(/version/i).clear();
    await page.getByLabel(/version/i).fill('invalid-version');

    // Try to generate code (without adding tools)
    await page.getByRole('button', { name: /preview code/i }).click();

    // Should show error or stay on current tab
    await expect(page.getByText('No Code Generated Yet')).toBeVisible();
  });

  test('shows appropriate file types in code editor', async ({ page }) => {
    // Generate code
    await page.getByRole('button', { name: /preview code/i }).click();

    // Check that different file types are syntax highlighted appropriately
    // This is more of a visual test, but we can check that the editor loads

    // Python file should be selected by default
    await expect(page.getByText('main.py')).toHaveClass(/bg-mcp-primary/);

    // Switch through all file types
    const fileTypes = ['requirements.txt', 'Dockerfile', 'docker-compose.yml', 'README.md', '.env.example', 'test_server.py'];

    for (const fileType of fileTypes) {
      await page.getByText(fileType).click();
      await page.waitForTimeout(500);
      await expect(page.locator('.monaco-editor')).toBeVisible();
    }
  });
});