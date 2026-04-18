import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should show sign in button', async ({ page }) => {
    const signInButton = page.locator('button:has-text("Sign in")');
    await expect(signInButton).toBeVisible();
  });

  test('should show email input when sign in clicked', async ({ page }) => {
    const signInButton = page.locator('button:has-text("Sign in")');
    await signInButton.click();
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
  });

  test('should hide input when cancel clicked', async ({ page }) => {
    const signInButton = page.locator('button:has-text("Sign in")');
    await signInButton.click();
    const cancelButton = page.locator('button:has-text("Cancel")');
    await cancelButton.click();
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).not.toBeVisible();
  });
});
