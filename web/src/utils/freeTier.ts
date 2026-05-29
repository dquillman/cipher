/**
 * Free-tier daily-question cap with a 7-day "taste window."
 *
 * Policy (encoded in cipher-exam-context 2026-05-28):
 *   - Pro / trial / tester users are unlimited (handled upstream).
 *   - A free-tier user gets TASTE_LIMIT (20/day) during their first 7 days
 *     of free-tier life, then STEADY_LIMIT (5/day) thereafter.
 *   - The 7-day window anchors to the LATER of (account creation, trial end).
 *     Rationale: a brand-new free user gets a soft landing; a trial-expired
 *     user gets a soft post-trial landing instead of a 5/day cliff.
 *
 * MIRROR FILE: `functions/src/freeTier.ts` — same constants, same function.
 * If you change one, change the other. There is no shared package in this
 * repo, so the duplication is intentional and the two files MUST stay in
 * sync. A drift would cause client and server to disagree on the cap,
 * which presents as flaky "you're over the limit / no you're not" UX.
 */

export const FREE_TIER = {
  STEADY_LIMIT: 5,
  TASTE_LIMIT: 20,
  TASTE_WINDOW_DAYS: 7,
} as const;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Returns the daily question cap for a free-tier user.
 *
 * Truth table (now = 2026-06-01):
 *   createdAt=2026-05-30, trialEndsAt=null         → ageDays=2  → 20 (taste)
 *   createdAt=2026-05-15, trialEndsAt=null         → ageDays=17 → 5  (steady)
 *   createdAt=2026-05-15, trialEndsAt=2026-05-29   → ageDays=3  → 20 (taste from trial end)
 *   createdAt=2026-05-15, trialEndsAt=2026-05-20   → ageDays=12 → 5  (steady; window expired)
 *   createdAt=null,       trialEndsAt=null         → safe default → 5
 */
export function getFreeTierDailyLimit(args: {
  accountCreatedAt: Date | null | undefined;
  trialEndsAt: Date | null | undefined;
  now?: Date;
}): number {
  const now = args.now ?? new Date();
  const candidates: Date[] = [];
  if (args.accountCreatedAt instanceof Date && !isNaN(args.accountCreatedAt.getTime())) {
    candidates.push(args.accountCreatedAt);
  }
  if (args.trialEndsAt instanceof Date && !isNaN(args.trialEndsAt.getTime())) {
    candidates.push(args.trialEndsAt);
  }
  if (candidates.length === 0) return FREE_TIER.STEADY_LIMIT;

  const tasteWindowStart = candidates.reduce(
    (latest, d) => (d > latest ? d : latest),
    candidates[0]
  );

  const msInWindow = FREE_TIER.TASTE_WINDOW_DAYS * MS_PER_DAY;
  const msSinceStart = now.getTime() - tasteWindowStart.getTime();

  if (msSinceStart < 0) return FREE_TIER.STEADY_LIMIT;
  return msSinceStart < msInWindow ? FREE_TIER.TASTE_LIMIT : FREE_TIER.STEADY_LIMIT;
}
