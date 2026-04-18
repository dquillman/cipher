export interface BudgetEntry {
  id: string;
  date: string;
  googleSearch: number;
  googleRetargeting: number;
  metaRetargeting: number;
  linkedin: number;
  notes: string;
}

export type BudgetChannel = 'googleSearch' | 'googleRetargeting' | 'metaRetargeting' | 'linkedin';

export const CHANNEL_LABELS: Record<BudgetChannel, string> = {
  googleSearch: 'Google Search',
  googleRetargeting: 'Google/YT Retargeting',
  metaRetargeting: 'Meta Retargeting',
  linkedin: 'LinkedIn',
};

export const CHANNEL_COLORS: Record<BudgetChannel, string> = {
  googleSearch: '#6366f1',
  googleRetargeting: '#818cf8',
  metaRetargeting: '#f59e0b',
  linkedin: '#0077b5',
};
