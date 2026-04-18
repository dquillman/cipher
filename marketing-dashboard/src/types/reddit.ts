export type CtaAllowance = 'none' | 'soft' | 'direct';

export interface RedditCommunity {
  id: string;
  subreddit: string;
  joined: boolean;
  canPost: boolean;
  karma: number;
  postsMade: number;
  commentsMade: number;
  notes: string;
  // Subreddit Rules Profile (Feature 2)
  postingRules: string;
  toneNotes: string;
  bannedTopics: string;
  minKarma: number;
  minAccountAge: number;
  ctaAllowance: CtaAllowance;
  postingFrequency: string;
}

export const CTA_ALLOWANCE_OPTIONS: { value: CtaAllowance; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'soft', label: 'Soft' },
  { value: 'direct', label: 'Direct' },
];

export interface RedditActivity {
  id: string;
  subredditId: string;
  date: string;
  type: 'comment' | 'post' | 'engagement';
  description: string;
}

export const ACTIVITY_TYPES: RedditActivity['type'][] = ['comment', 'post', 'engagement'];

export const ACTIVITY_TYPE_LABELS: Record<RedditActivity['type'], string> = {
  comment: 'Comment',
  post: 'Post',
  engagement: 'Engagement',
};

export const ACTIVITY_TYPE_VARIANT: Record<RedditActivity['type'], 'blue' | 'purple' | 'amber'> = {
  comment: 'blue',
  post: 'purple',
  engagement: 'amber',
};

export const DEFAULT_SUBREDDITS = [
  'r/pmp',
  'r/projectmanagement',
  'r/cissp',
  'r/itcareerquestions',
  'r/CompTIA',
];
