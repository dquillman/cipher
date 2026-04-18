export interface FunnelEntry {
  id: string;
  date: string;
  landingPageViews: number;
  pricingViews: number;
  ctaClicks: number;
  trialStarts: number;
  signupCompletes: number;
  examSelections: number;
  activatedUsers: number;
  explanationViews: number;
}

export const FUNNEL_STAGES = [
  { key: 'landingPageViews', label: 'Landing Page Views', color: '#6366f1' },
  { key: 'pricingViews', label: 'Pricing Views', color: '#818cf8' },
  { key: 'ctaClicks', label: 'CTA Clicks', color: '#a5b4fc' },
  { key: 'trialStarts', label: 'Trial Starts', color: '#f59e0b' },
  { key: 'signupCompletes', label: 'Signup Complete', color: '#fbbf24' },
  { key: 'examSelections', label: 'Exam Selected', color: '#34d399' },
  { key: 'activatedUsers', label: 'Activated Users', color: '#10b981' },
  { key: 'explanationViews', label: 'Explanation Viewed', color: '#059669' },
] as const;

export type FunnelStageKey = typeof FUNNEL_STAGES[number]['key'];
