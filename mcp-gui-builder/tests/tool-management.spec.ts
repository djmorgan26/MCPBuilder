import { test, expect } from '@playwright/test';

test.describe('Tool Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('can add a tool from template', async ({ page }) => {
    // Click on File Reader tool template
    const fileReaderTemplate = page.getByText('File Reader').locator('..');
    await fileReaderTemplate.click();

    // Tool modal should open
    await expect(page.getByText('Configure Tool: File Reader')).toBeVisible();

    // Check form fields are present
    await expect(page.getByLabel(/tool name/i)).toBeVisible();
    await expect(page.getByLabel(/description/i)).toBeVisible();
    await expect(page.getByLabel(/return type/i)).toBeVisible();

    // Add a parameter
    const addParamButton = page.getByRole('button', { name: /add parameter/i });
    await addParamButton.click();

    // Fill parameter details
    const paramNameInput = page.getByLabel(/name/i).first();
    await paramNameInput.fill('file_path');

    const paramDescInput = page.getByLabel(/description/i).last();
    await paramDescInput.fill('Path to the file to read');

    // Save the tool
    const saveButton = page.getByRole('button', { name: /save tool/i });
    await saveButton.click();

    // Modal should close and tool should appear in active tools
    await expect(page.getByText('Configure Tool')).not.toBeVisible();
    await expect(page.getByText('File Reader')).toBeVisible();
    await expect(page.getByText('Active Tools (1)')).toBeVisible();
  });

  test('shows validation errors for invalid tool configuration', async ({ page }) => {
    // Add a tool template
    const calculatorTemplate = page.getByText('Calculator').locator('..');
    await calculatorTemplate.click();

    // Clear the tool name to make it invalid
    const toolNameInput = page.getByLabel(/tool name/i);
    await toolNameInput.clear();

    // Try to save
    const saveButton = page.getByRole('button', { name: /save tool/i });

    // Save button should be disabled due to validation errors
    await expect(saveButton).toBeDisabled();

    // Check error messages
    await expect(page.getByText('Tool name is required')).toBeVisible();
    await expect(page.getByText(/error.*to fix/i)).toBeVisible();
  });

  test('can edit existing tool', async ({ page }) => {
    // First add a tool
    const apiCallerTemplate = page.getByText('API Caller').locator('..');
    await apiCallerTemplate.click();

    // Add a parameter and save
    await page.getByRole('button', { name: /add parameter/i }).click();
    await page.getByLabel(/name/i).first().fill('url');
    await page.getByLabel(/description/i).last().fill('URL to call');
    await page.getByRole('button', { name: /save tool/i }).click();

    // Now edit the tool
    const editButton = page.getByRole('button', { name: /edit tool/i });
    await editButton.click();

    // Modal should open with existing data
    await expect(page.getByText('Configure Tool: API Caller')).toBeVisible();
    await expect(page.getByDisplayValue('url')).toBeVisible();

    // Change the tool name
    const toolNameInput = page.getByLabel(/tool name/i);
    await toolNameInput.clear();
    await toolNameInput.fill('HTTP Client');

    // Save changes
    await page.getByRole('button', { name: /save tool/i }).click();

    // Tool name should be updated in the list
    await expect(page.getByText('HTTP Client')).toBeVisible();
    await expect(page.getByText('API Caller')).not.toBeVisible();
  });

  test('can delete a tool', async ({ page }) => {
    // First add a tool
    const webScraperTemplate = page.getByText('Web Scraper').locator('..');
    await webScraperTemplate.click();

    // Add parameter and save
    await page.getByRole('button', { name: /add parameter/i }).click();
    await page.getByLabel(/name/i).first().fill('url');
    await page.getByLabel(/description/i).last().fill('URL to scrape');
    await page.getByRole('button', { name: /save tool/i }).click();

    // Verify tool is added
    await expect(page.getByText('Active Tools (1)')).toBeVisible();
    await expect(page.getByText('Web Scraper')).toBeVisible();

    // Delete the tool
    const deleteButton = page.getByRole('button', { name: /delete tool/i });
    await deleteButton.click();

    // Tool should be removed
    await expect(page.getByText('No Tools Added Yet')).toBeVisible();
    await expect(page.getByText('Web Scraper')).not.toBeVisible();
  });

  test('can manage tool parameters', async ({ page }) => {
    // Add a tool
    const databaseTemplate = page.getByText('Database Query').locator('..');
    await databaseTemplate.click();

    // Add multiple parameters
    const addParamButton = page.getByRole('button', { name: /add parameter/i });

    // First parameter
    await addParamButton.click();
    await page.getByLabel(/name/i).first().fill('query');
    await page.getByLabel(/description/i).last().fill('SQL query to execute');
    await page.getByLabel(/type/i).last().selectOption('string');

    // Second parameter
    await addParamButton.click();
    await page.locator('input[placeholder="parameter_name"]').last().fill('timeout');
    await page.locator('input[placeholder="Parameter description"]').last().fill('Query timeout in seconds');
    await page.locator('select').last().selectOption('number');

    // Set default value for timeout
    await page.locator('input[placeholder="Optional default"]').last().fill('30');

    // Make first parameter required, second optional
    const requiredCheckboxes = page.getByLabel(/required/i);
    await requiredCheckboxes.first().check();

    // Delete a parameter
    const deleteParamButtons = page.getByRole('button').filter({ hasText: /delete|trash/i });
    const parameterDeleteButton = deleteParamButtons.last();
    await parameterDeleteButton.click();

    // Should have only one parameter left
    await expect(page.locator('text=Parameter #1')).toBeVisible();
    await expect(page.locator('text=Parameter #2')).not.toBeVisible();

    // Save tool
    await page.getByRole('button', { name: /save tool/i }).click();

    // Verify parameter count in tool list
    await expect(page.getByText('1 parameter')).toBeVisible();
  });

  test('displays tool validation status', async ({ page }) => {
    // Add a tool without required fields
    const emailTemplate = page.getByText('Email Sender').locator('..');
    await emailTemplate.click();

    // Don't add parameters, just save (should be invalid)
    await page.getByRole('button', { name: /save tool/i }).click();

    // Tool should show as invalid in the list
    await expect(page.getByText('Email Sender')).toBeVisible();

    // Should show error indicator
    const errorIcon = page.locator('[class*="text-red"]');
    await expect(errorIcon).toBeVisible();

    // Should show error count
    await expect(page.getByText(/error/i)).toBeVisible();

    // Edit tool to fix it
    await page.getByRole('button', { name: /edit tool/i }).click();

    // Add a parameter to make it valid
    await page.getByRole('button', { name: /add parameter/i }).click();
    await page.getByLabel(/name/i).first().fill('to_email');
    await page.getByLabel(/description/i).last().fill('Recipient email address');

    // Save
    await page.getByRole('button', { name: /save tool/i }).click();

    // Should now show as valid
    const successIcon = page.locator('[class*="text-green"]');
    await expect(successIcon).toBeVisible();
  });

  test('can search and filter tools in active list', async ({ page }) => {
    // Add multiple tools
    const tools = ['File Reader', 'API Caller', 'Calculator'];

    for (const toolName of tools) {
      const toolTemplate = page.getByText(toolName).locator('..');
      await toolTemplate.click();

      // Add a basic parameter to make it valid
      await page.getByRole('button', { name: /add parameter/i }).click();
      await page.getByLabel(/name/i).first().fill('input');
      await page.getByLabel(/description/i).last().fill('Input data');
      await page.getByRole('button', { name: /save tool/i }).click();
    }

    // Should show all tools
    await expect(page.getByText('Active Tools (3)')).toBeVisible();
    await expect(page.getByText('File Reader')).toBeVisible();
    await expect(page.getByText('API Caller')).toBeVisible();
    await expect(page.getByText('Calculator')).toBeVisible();

    // Check the validation summary
    await expect(page.getByText('3 valid')).toBeVisible();
  });
});