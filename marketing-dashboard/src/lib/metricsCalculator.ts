import type { BudgetEntry } from '../types/budget.ts';
import type { FunnelEntry } from '../types/funnel.ts';
import type { First100User } from '../types/users.ts';

export interface CalculatedMetrics {
  totalSpend: number;
  totalTrials: number;
  totalSignups: number;
  totalActivated: number;
  totalExplanationViews: number;
  costPerTrial: number | null;
  costPerSignup: number | null;
  costPerActivated: number | null;
  activationRate: number | null;
  explanationViewRate: number | null;
  first100Count: number;
  first100Activated: number;
  first100ActivationRate: number | null;
}

export function calculateMetrics(
  budget: BudgetEntry[],
  funnel: FunnelEntry[],
  users: First100User[],
): CalculatedMetrics {
  const totalSpend = budget.reduce(
    (sum, b) => sum + b.googleSearch + b.googleRetargeting + b.metaRetargeting + b.linkedin,
    0,
  );

  const totalTrials = funnel.reduce((s, f) => s + f.trialStarts, 0);
  const totalSignups = funnel.reduce((s, f) => s + f.signupCompletes, 0);
  const totalActivated = funnel.reduce((s, f) => s + f.activatedUsers, 0);
  const totalExplanationViews = funnel.reduce((s, f) => s + f.explanationViews, 0);

  const costPerTrial = totalTrials > 0 ? totalSpend / totalTrials : null;
  const costPerSignup = totalSignups > 0 ? totalSpend / totalSignups : null;
  const costPerActivated = totalActivated > 0 ? totalSpend / totalActivated : null;
  const activationRate = totalSignups > 0 ? totalActivated / totalSignups : null;
  const explanationViewRate = totalActivated > 0 ? totalExplanationViews / totalActivated : null;

  const first100Count = users.length;
  const first100Activated = users.filter((u) => u.activated).length;
  const first100ActivationRate = first100Count > 0 ? first100Activated / first100Count : null;

  return {
    totalSpend, totalTrials, totalSignups, totalActivated, totalExplanationViews,
    costPerTrial, costPerSignup, costPerActivated, activationRate, explanationViewRate,
    first100Count, first100Activated, first100ActivationRate,
  };
}
