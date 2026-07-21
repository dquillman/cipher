export interface TimestampLike {
  toDate(): Date;
}

export interface EntitlementRecord {
  billingStatus?: unknown;
  isPro?: unknown;
  plan?: unknown;
  trial?: unknown;
  trialActive?: unknown;
  trialEndsAt?: unknown;
  testerOverride?: unknown;
  testerExpiresAt?: unknown;
  role?: unknown;
  subscriptionStatus?: unknown;
}

export type ProAccessReason = 'paid' | 'comped' | 'trial' | 'tester' | null;

function asDate(value: unknown): Date | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (value && typeof value === 'object' && 'toDate' in value) {
    const candidate = value as TimestampLike;
    if (typeof candidate.toDate === 'function') {
      const date = candidate.toDate();
      return date instanceof Date && !Number.isNaN(date.getTime()) ? date : null;
    }
  }
  return null;
}

export function resolveProAccess(
  userData: EntitlementRecord | undefined,
  now: Date = new Date(),
): ProAccessReason {
  if (!userData) return null;

  if (userData.billingStatus === 'comped') return 'comped';

  const subscriptionNotCanceled = userData.subscriptionStatus !== 'canceled';
  const paid = subscriptionNotCanceled &&
    (userData.billingStatus === 'paid' ||
      (userData.isPro === true && userData.trial !== true));
  if (paid) return 'paid';

  const testerExpiresAt = asDate(userData.testerExpiresAt);
  const isTester = userData.testerOverride === true || userData.role === 'tester';
  if (isTester && (!testerExpiresAt || testerExpiresAt > now)) return 'tester';

  const trialEndsAt = asDate(userData.trialEndsAt);
  const isTrial = userData.trial === true ||
    userData.trialActive === true ||
    userData.plan === 'trial';
  if (isTrial && trialEndsAt && trialEndsAt > now) return 'trial';

  return null;
}

export function hasProAccess(
  userData: EntitlementRecord | undefined,
  now: Date = new Date(),
): boolean {
  return resolveProAccess(userData, now) !== null;
}
