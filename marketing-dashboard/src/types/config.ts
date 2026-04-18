export interface MarketingConfig {
  launchDate: string;
  dailyBudgetMin: number;
  dailyBudgetMax: number;
  activationRateTarget: number;
  first100Target: number;
}

export const DEFAULT_CONFIG: MarketingConfig = {
  launchDate: '2026-03-16',
  dailyBudgetMin: 70,
  dailyBudgetMax: 120,
  activationRateTarget: 0.3,
  first100Target: 100,
};
