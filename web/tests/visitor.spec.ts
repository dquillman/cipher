import { test, expect } from '@playwright/test';

test('visitor: get started button routes to signup', async ({ page }) => {
    await page.goto('/');

    // Click the 'Get Started' button in the nav
    await page.getByRole('button', { name: 'Get Started' }).click();

    // Assert URL contains mode=signup
    await expect(page).toHaveURL(/.*login\?mode=signup/);
});

test('visitor: start for free button routes to signup', async ({ page }) => {
    await page.goto('/');

    // Click the 'Start For Free' button in the CTA section
    await page.getByRole('button', { name: 'Start For Free' }).click();

    // Assert URL contains mode=signup
    await expect(page).toHaveURL(/.*login\?mode=signup/);
});
