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

test('LP: Exam Pass CTA carries intent=exam-pass, other CTAs do not', async ({ page }) => {
    // Regression test for the 2026-08-12 fix: all three /lp/pmp pricing CTAs
    // used to link to the identical signupHref, so "Get the Exam Pass" was
    // indistinguishable from "Start Free Trial" by the time auth completed —
    // Login.tsx had no way to route a Pass buyer anywhere but the generic
    // dashboard. Only the Exam Pass link should carry the intent param.
    await page.goto('/lp/pmp');

    const pricing = page.locator('#pricing');
    await pricing.scrollIntoViewIfNeeded();

    await expect(pricing.getByRole('link', { name: 'Get the Exam Pass' }))
        .toHaveAttribute('href', /[?&]intent=exam-pass(&|$)/);
    await expect(pricing.getByRole('link', { name: 'Start Free Trial' }))
        .not.toHaveAttribute('href', /intent=/);
    await expect(pricing.getByRole('link', { name: 'Get Started Free' }))
        .not.toHaveAttribute('href', /intent=/);
});

test('LP: Exam Pass card leads the pricing section', async ({ page }) => {
    // Regression test for the 2026-08-12 fix: Exam Pass sat last (Starter,
    // Pro "POPULAR", Exam Pass), the opposite of the locked pricing decision
    // that it should be the primary/first offer on every /lp/* page.
    await page.goto('/lp/pmp');

    const cardHeadings = page.locator('#pricing h3');
    await expect(cardHeadings.first()).toContainText('Exam Pass');
});
