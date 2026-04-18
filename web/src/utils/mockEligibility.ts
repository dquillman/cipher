export type MockGateReason = 'no-diagnostic' | 'not-pro' | 'no-data' | 'low-readiness' | null;

export interface MockEligibilityResult {
  canAccess: boolean;
  reason: MockGateReason;
}

export function getMockEligibility({
  hasCompletedDiagnostic, readiness, isPro,
}: { hasCompletedDiagnostic: boolean; readiness: number | null; isPro: boolean }): MockEligibilityResult {
  if (!hasCompletedDiagnostic) return { canAccess: false, reason: 'no-diagnostic' };
  if (!isPro) return { canAccess: false, reason: 'not-pro' };
  if (readiness == null) return { canAccess: false, reason: 'no-data' };
  if (readiness < 50) return { canAccess: false, reason: 'low-readiness' };
  return { canAccess: true, reason: null };
}
