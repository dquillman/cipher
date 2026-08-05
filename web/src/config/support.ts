/**
 * Support + refund contact, in one place.
 *
 * The 60-day money-back guarantee is a promise made in Terms, on the public
 * pricing page, in the FAQ schema, and inside the app. There is no self-serve
 * refund endpoint — every refund is a human replying to this inbox and issuing
 * it from the Stripe dashboard. That makes two things true:
 *
 *   1. This address must be monitored, or the guarantee is a lie.
 *   2. It must be identical everywhere it appears. A refund request sent to an
 *      address that only exists on the marketing site is a support ticket the
 *      customer thinks they filed and nobody receives.
 */
export const SUPPORT_EMAIL = 'support@cipherexam.com';

/** Prefilled refund request — the subject is what makes it triageable in the inbox. */
export const REFUND_MAILTO =
  `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Refund request — 60-day guarantee')}`;
