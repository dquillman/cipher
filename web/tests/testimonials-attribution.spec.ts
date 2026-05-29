import { test, expect } from "@playwright/test";

/**
 * Attribution hygiene — guards the PMI-LP rule encoded in cipher-exam-context.
 *
 * Renders each PMI-product LP and asserts that the HTML output contains
 * NONE of the banned attribution strings, while still containing the
 * institutional credential. Also asserts that non-PMI LPs DO carry the
 * full attribution (proves the variant separation is wired correctly).
 *
 * Fail this test → fail CI → block deploy. Do not weaken it without
 * updating the cipher-exam-context rule first.
 */

const BANNED_ON_PMI_LPS = ["Markus", "Kopko", "PgMP"] as const;

// Tier 1 ad-LP routes — verified from web/src/App.tsx + prerender output.
// (cipher-exam-context historically said "-practice" suffix; that's stale.
// The actual paths are short — these are the truth.)
const PMI_LP_PATHS = ["/lp/pmp"] as const;

const NON_PMI_LP_PATHS = ["/lp/security-plus", "/lp/shrm-cp"] as const;

for (const path of PMI_LP_PATHS) {
  test(`${path} contains no banned attribution strings`, async ({ page }) => {
    await page.goto(path);
    const html = await page.content();
    for (const banned of BANNED_ON_PMI_LPS) {
      expect(
        html,
        `banned string "${banned}" leaked into rendered HTML for ${path} — see cipher-exam-context.`,
      ).not.toContain(banned);
    }
  });

  test(`${path} renders the institutional credential`, async ({ page }) => {
    await page.goto(path);
    await expect(
      page.getByText(/PMI AI Standards Core Team Member/).first(),
    ).toBeVisible();
  });
}

for (const path of NON_PMI_LP_PATHS) {
  test(`${path} renders full attribution (non-PMI surface)`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByText(/Markus Kopko/).first()).toBeVisible();
  });
}
