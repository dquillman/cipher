# CipherExam Referral Program — Spec v1

**Status:** Spec approved-pending-Dave · blocked on Stripe live mode (rewards are Stripe credits)
**Mechanic:** "Give a month, get a month."

## Goal
Cert students study in cohorts and share tools on Reddit/LinkedIn already. Attribute that
sharing and reward both sides, at a cost (2 free months ≈ $38 list) far below any paid CAC.

## Mechanic
- Every user gets a permanent referral link: `https://cipherexam.com/?ref=<code>`
  (`code` = 8-char slug stored on `users/{uid}.referralCode`, generated on first Dashboard view).
- Referred visitor signs up → `users/{newUid}.referredBy = <referrerUid>` (captured from the
  `ref` param persisted in localStorage through the signup flow, alongside the existing UTM capture).
- When the referred user's **first real payment settles** (Stripe `invoice.paid`, amount > 0):
  - Referred user: 1 free month → Stripe coupon (100% off 1 month) applied to their sub.
  - Referrer: 1 free month → Stripe customer balance credit of one month's price OR coupon
    on next invoice (balance credit is simpler across monthly/yearly mixes).

## Data model
```
users/{uid}.referralCode        string, unique (enforced via referralCodes/{code} -> {uid} lookup collection)
users/{uid}.referredBy          uid | null  (write-once, set at signup only)
users/{uid}.referralStats       { invited: n, converted: n, monthsEarned: n }
referralEvents/{autoId}         { referrer, referred, stage: 'signup'|'converted'|'rewarded'|'clawed_back', at }
```
Firestore rules live in **Admin-Core** (`G:\Users\daveq\Admin-Core\firestore.rules`):
users may read their own code/stats; `referredBy` writable only when absent (write-once);
`referralEvents` writable only by Cloud Functions. Run `npm run test:rules` before deploy.

## Edge cases (decided)
1. **Self-referral:** reject when referrer uid == new uid, same email domain+plus-alias, or same
   Stripe payment fingerprint. Log to referralEvents as rejected.
2. **60-day guarantee clawback:** rewards vest only after the referred user's payment passes
   **day 61** (outside the money-back window). Until then stats show "pending". This kills the
   refund-cycle exploit (refer alt account → refund → keep credit).
3. **Yearly referred user:** same rule — one month credit each, vests day 61.
4. **Referrer churned before vesting:** credit applies if they return within 6 months (Stripe
   customer balance persists on the customer object).
5. **Trial-only referrals:** signup counts in `invited`; no reward without a settled payment.
6. **Cap:** 12 earned months per referrer per year (abuse ceiling; revisit if hit honestly).

## Implementation order (post-Stripe-live)
1. Code + capture (`referralCode`, `referredBy`, Dashboard share card with copy button) — no money moves; ship immediately, attribution starts accruing.
2. Stripe webhook: on `invoice.paid` for a referred user, write `referralEvents/converted` + schedule vesting check (day 61) via scheduled function.
3. Vesting function grants both credits, stamps `rewarded`.
4. Emails via Resend: "Your friend joined" and "You earned a free month" (drip patterns in functions/src/onboardingDrip.ts).

## Copy
Dashboard card: **"Give a month, get a month."** "Studying with someone? Send them your link —
they get a free month of Pro when they join, and so do you." (No mention of vesting mechanics in UI;
FAQ covers it: "Referral months are granted 60 days after your friend's first payment — the same
window as our money-back guarantee.")

## Deploy gotchas (from memory)
- Functions deploy **by name only** (migraine-tracker codebase collision).
- Firestore rules **only from Admin-Core**.
- Stripe is TEST mode until Dave flips live keys — build against test, verify, then swap.
