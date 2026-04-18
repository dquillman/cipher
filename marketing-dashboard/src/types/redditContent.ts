export type DraftType = 'post' | 'comment' | 'reply';
export type DraftStatus = 'idea' | 'drafted' | 'approved' | 'posted' | 'archived';
export type ContentType = 'educate' | 'contrarian' | 'discussion' | 'framework' | 'soft_cta';

export interface RedditDraft {
  id: string;
  subreddit: string;
  type: DraftType;
  title: string;
  body: string;
  sourceThreadUrl: string;
  status: DraftStatus;
  contentType: ContentType;
  productId: string;
  createdAt: string;
  updatedAt: string;
  // Performance tracking (Feature 3)
  postedAt: string | null;
  redditUrl: string;
  upvotes: number;
  commentCount: number;
  repliesReceived: number;
  profileVisits: number;
  conversions: number;
  performanceNotes: string;
}

export const DRAFT_TYPES: DraftType[] = ['post', 'comment', 'reply'];

export const DRAFT_TYPE_LABELS: Record<DraftType, string> = {
  post: 'Post',
  comment: 'Comment',
  reply: 'Reply',
};

export const DRAFT_STATUSES: DraftStatus[] = ['idea', 'drafted', 'approved', 'posted', 'archived'];

export const DRAFT_STATUS_LABELS: Record<DraftStatus, string> = {
  idea: 'Idea',
  drafted: 'Drafted',
  approved: 'Approved',
  posted: 'Posted',
  archived: 'Archived',
};

export const DRAFT_STATUS_VARIANT: Record<DraftStatus, 'gray' | 'blue' | 'green' | 'purple' | 'amber'> = {
  idea: 'gray',
  drafted: 'blue',
  approved: 'green',
  posted: 'purple',
  archived: 'amber',
};

export const CONTENT_TYPES: ContentType[] = ['educate', 'contrarian', 'discussion', 'framework', 'soft_cta'];

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  educate: 'Educate',
  contrarian: 'Contrarian',
  discussion: 'Discussion',
  framework: 'Framework',
  soft_cta: 'Soft CTA',
};

export const CONTENT_TYPE_VARIANT: Record<ContentType, 'blue' | 'red' | 'purple' | 'green' | 'amber'> = {
  educate: 'blue',
  contrarian: 'red',
  discussion: 'purple',
  framework: 'green',
  soft_cta: 'amber',
};

export const PRODUCTS = [
  { id: 'all', label: 'All Products' },
  { id: 'cipher', label: 'CIPHER' },
] as const;

export function emptyDraft(): Omit<RedditDraft, 'id'> {
  const now = new Date().toISOString();
  return {
    subreddit: '',
    type: 'post',
    title: '',
    body: '',
    sourceThreadUrl: '',
    status: 'idea',
    contentType: 'educate',
    productId: 'examcoach',
    createdAt: now,
    updatedAt: now,
    postedAt: null,
    redditUrl: '',
    upvotes: 0,
    commentCount: 0,
    repliesReceived: 0,
    profileVisits: 0,
    conversions: 0,
    performanceNotes: '',
  };
}
