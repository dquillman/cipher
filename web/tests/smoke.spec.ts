import { test, expect } from '@playwright/test';

test('smoke: app renders', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('body')).toBeVisible();
});
