export interface ContentItem {
  id: string;
  week: number;
  title: string;
  type: 'article' | 'video' | 'social' | 'ad';
  status: 'idea' | 'draft' | 'ready' | 'published' | 'promoted' | 'skipped';
  channel: string;
  scheduledDate: string;   // ISO date string e.g. "2026-03-20"
  scheduledTime: string;   // e.g. "9:00 AM EST"
  body: string;            // actual content / copy to post
  notes: string;
  createdAt: string;
}
