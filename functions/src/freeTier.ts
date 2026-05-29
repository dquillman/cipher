/**
 * Free-tier daily-question cap with a 7-day "taste window."
 *
 * MIRROR FILE: `web/src/utils/freeTier.ts` — same constants, same function.
 * If you change one, change the other. See that file for full docs.
 *
 * Policy (encoded in cipher-exam-context 2026-05-28):
 *   - Pro / trial / tester users are unlimited (handled upstream).
 *   - A free-tier user gets TASTE_LIMIT (20/day) during their first 7 days
 *     of free-tier life, then STEADY_LIMIT (5/day) thereafter.
 *   - The 7-day window anchors to the LATER of (account creation, trial end).
 */

export const FREE_TIER = {
  STEADY_LIMIT: 5,
  TASTE_LIMIT: 20,
  TASTE_WINDOW_DAYS: 7,
} as const;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

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
