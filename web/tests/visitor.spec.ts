import { test, expect } from '@playwright/test';

test('visitor: nav CTA routes to signup', async ({ page }) => {
    await page.goto('/');

    // Nav + hero both render "Start Free Trial"; the nav CTA is first in DOM order.
    await page.getByRole('button', { name: 'Start Free Trial' }).first().click();

    // Assert URL contains mode=signup
    await expect(page).toHaveURL(/.*login\?mode=signup/);
});

test('visitor: final CTA routes to signup', async ({ page }) => {
    await page.goto('/');

    // Final CTA section uses unique text "Start Your Free Trial".
    await page.getByRole('button', { name: 'Start Your Free Trial' }).click();

    // Assert URL contains mode=signup
    await expect(page).toHaveURL(/.*login\?mode=signup/);
});
