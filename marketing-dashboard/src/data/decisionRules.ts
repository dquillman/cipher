import type { CalculatedMetrics } from '../lib/metricsCalculator.ts';

export interface DecisionRule {
  id: string;
  condition: string;
  action: string;
  threshold: number;
  unit: string;
  getValue: (m: CalculatedMetrics) => number | null;
  evaluate: (val: number) => boolean;
  evaluateAmber?: (val: number) => boolean;
}

export const decisionRules: DecisionRule[] = [
  {
    id: 'google_cps',
    condition: 'Google Search cost per signup > $50 after 100 clicks',
    action: 'Rewrite ad copy + check landing page match',
    threshold: 50,
    unit: '$',
    getValue: (m) => m.costPerSignup,
    evaluate: (v) => v > 50,
    evaluateAmber: (v) => v > 40,
  },
  {
    id: 'meta_vs_google',
    condition: 'Meta retargeting cost per signup > 2x Google',
    action: 'Pause Meta, reallocate to Google retargeting',
    threshold: 2,
    unit: 'x',
    getValue: () => null, // needs per-channel breakdown
    evaluate: (v) => v > 2,
  },
  {
    id: 'linkedin_vs_google',
    condition: 'LinkedIn cost per signup > 3x Google',
    action: 'Pause LinkedIn, revisit for employer sales only',
    threshold: 3,
    unit: 'x',
    getValue: () => null,
    evaluate: (v) => v > 3,
  },
  {
    id: 'trial_activation',
    condition: 'Trial-to-activation rate < 20%',
    action: 'Fix onboarding before spending more on traffic',
    threshold: 0.2,
    unit: '%',
    getValue: (m) => m.activationRate,
    evaluate: (v) => v < 0.2,
    evaluateAmber: (v) => v < 0.25,
  },
  {
    id: 'activation_paid',
    condition: 'Activation-to-paid rate < 5%',
    action: 'Fix product value delivery, not marketing',
    threshold: 0.05,
    unit: '%',
    getValue: () => null, // needs paid conversion data
    evaluate: (v) => v < 0.05,
  },
  {
    id: 'exam_2x',
    condition: 'One exam converts 2x better than others',
    action: 'Shift 80% of budget to that exam',
    threshold: 2,
    unit: 'x',
    getValue: () => null,
    evaluate: (v) => v > 2,
  },
  {
    id: 'community_yield',
    condition: 'Reddit/LinkedIn < 25% of projected users after 7 days',
    action: 'Shift effort to the channel that is producing',
    threshold: 0.25,
    unit: '%',
    getValue: (m) => m.first100Count > 0 ? m.first100Count / 100 : null,
    evaluate: (v) => v < 0.25,
    evaluateAmber: (v) => v < 0.35,
  },
  {
    id: 'content_time',
    condition: 'Content takes > 4 hours per article in month 1',
    action: 'Stay at 1x/week, do not force 2x',
    threshold: 4,
    unit: 'hrs',
    getValue: () => null, // manual tracking
    evaluate: (v) => v > 4,
  },
  {
    id: 'first100_activation',
    condition: 'First 100 signups but activation rate < 30%',
    action: 'Stop all marketing spend, fix onboarding first',
    threshold: 0.3,
    unit: '%',
    getValue: (m) => m.first100ActivationRate,
    evaluate: (v) => v < 0.3,
    evaluateAmber: (v) => v < 0.4,
  },
  {
    id: 'explanation_views',
    condition: 'Users answer questions but < 50% view explanations',
    action: 'Onboarding problem — make explanation viewing more prominent',
    threshold: 0.5,
    unit: '%',
    getValue: (m) => m.explanationViewRate,
    evaluate: (v) => v < 0.5,
    evaluateAmber: (v) => v < 0.65,
  },
];
