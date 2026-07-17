# 90-Day Exam Pass — Spec v1 (future experiment)

**Status:** Agreed shape (Dave, 2026-07-16). NOT to be built until Stripe is live AND 50–100 real
trials show subscription hesitation at checkout. This is a data-triggered experiment, not a launch item.

## Shape
- **Duration:** 90 days from purchase. Covers the real behavior: exams scheduled ~60 days out,
  plus slip buffer and a retake window. (A 45-day pass was considered and rejected — it expires
  *before* the typical buyer's exam date, the worst possible experience.)
- **Price:** $59 one-time, no auto-renew. Deliberately priced ABOVE the 2–3-month subscription
  path ($38–57 at $19/mo) so it never cannibalizes; its premium buys "no recurring bill" peace of mind.
- **Scope:** ONE exam, chosen at purchase.

## Guarantee — one universal promise, unchanged
The standard 60-day money-back guarantee applies exactly as written everywhere else:
email support@cipherexam.com within 60 days of payment → full refund, no conditions.
- Days 1–60 of the pass: fully refundable.
- Days 61–90: past the window (same as any subscriber's third month).
- NO pass-specific guarantee variant. "No fine print" survives only if there is exactly one rule.
- Rejected: guarantee = full pass length (structurally free product — use 100%, refund on the last day).

## Entitlement model
`users/{uid}.entitlement = { type: 'exam-pass', examId, purchasedAt, expiresAt }`
- Access checks become: `isPro || hasActivePassFor(examId)` at every current isPro gate
  (quiz fetch, simulator, AI explanations). Server-side enforcement via rules/functions —
  rules changes go through Admin-Core (test with npm run test:rules there).
- Other 10 certs render visible-but-locked with upsell: "Your pass covers PMP. Want all 11? Upgrade to Pro."
  The lock screen is the pass→subscription conversion surface.
- Expiry UX: banner from D-14 ("Your pass ends <date>"), graceful read-only after expiry, one-click
  extend/upgrade. Never hard-cut a user mid-study without warning.
- Stripe: one Product "Exam Pass", one $59 one-time Price; examId captured via checkout metadata.

## Decision triggers (revisit when)
- Trial→paid conversion is healthy but checkout-page abandonment cites subscription objections, or
- Support/refund emails mention "didn't want a subscription" ≥3 times.
If neither appears in the first 100 trials, shelve this — the "Built to be canceled" band may have
already solved the objection for free.

Related: [referral-program-spec.md](referral-program-spec.md) (also post-Stripe-live; rewards vest day 61).
