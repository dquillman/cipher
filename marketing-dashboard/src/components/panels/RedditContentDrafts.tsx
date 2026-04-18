import { useState, useMemo } from 'react';
import { Plus, Trash2, Edit3, Copy, Check, ExternalLink } from 'lucide-react';
import { useCollection } from '../../hooks/useCollection.ts';
import { addDraft, updateDraft, deleteDraft } from '../../services/redditContentService.ts';
import { DataEntryModal } from '../ui/DataEntryModal.tsx';
import { Card } from '../ui/Card.tsx';
import { StatusBadge } from '../ui/StatusBadge.tsx';
import { DashboardGrid } from '../layout/DashboardGrid.tsx';
import {
  DRAFT_TYPES, DRAFT_TYPE_LABELS,
  DRAFT_STATUSES, DRAFT_STATUS_LABELS, DRAFT_STATUS_VARIANT,
  CONTENT_TYPES, CONTENT_TYPE_LABELS, CONTENT_TYPE_VARIANT,
  PRODUCTS, emptyDraft,
  type RedditDraft, type DraftType, type DraftStatus, type ContentType,
} from '../../types/redditContent.ts';
import type { RedditCommunity } from '../../types/reddit.ts';

type DraftTabKey = 'post' | 'comment' | 'reply';

interface Props {
  communities: RedditCommunity[];
}

/* ── Strategy Suggestions (Feature 4) ─────────────────────────── */

function StrategySuggestions({ drafts, communities }: { drafts: RedditDraft[]; communities: RedditCommunity[] }) {
  const suggestions: string[] = [];

  // Days since last post per subreddit
  const postedDrafts = drafts.filter((d) => d.status === 'posted' && d.postedAt);
  const subredditLastPosted = new Map<string, string>();
  for (const d of postedDrafts) {
    const existing = subredditLastPosted.get(d.subreddit);
    if (!existing || (d.postedAt && d.postedAt > existing)) {
      subredditLastPosted.set(d.subreddit, d.postedAt!);
    }
  }

  for (const c of communities) {
    const lastPosted = subredditLastPosted.get(c.subreddit);
    if (lastPosted) {
      const daysSince = Math.floor((Date.now() - new Date(lastPosted).getTime()) / 86_400_000);
      if (daysSince > 7) {
        suggestions.push(`You haven't posted in ${c.subreddit} in ${daysSince} days`);
      }
    } else if (c.canPost) {
      suggestions.push(`You haven't posted in ${c.subreddit} yet -- it's ready for content`);
    }
  }

  // Content type distribution
  const nonArchived = drafts.filter((d) => d.status !== 'archived');
  if (nonArchived.length >= 3) {
    const typeCounts = new Map<ContentType, number>();
    for (const d of nonArchived) {
      typeCounts.set(d.contentType, (typeCounts.get(d.contentType) || 0) + 1);
    }
    const total = nonArchived.length;
    for (const [ct, count] of typeCounts) {
      const pct = Math.round((count / total) * 100);
      if (pct >= 60) {
        const alternatives = CONTENT_TYPES.filter((t) => t !== ct);
        const suggest = alternatives[Math.floor(Math.random() * alternatives.length)];
        suggestions.push(`${pct}% of your content is "${CONTENT_TYPE_LABELS[ct]}" -- try a ${CONTENT_TYPE_LABELS[suggest]} piece`);
      }
    }
  }

  // Approved drafts ready to post
  const approved = drafts.filter((d) => d.status === 'approved');
  if (approved.length > 0) {
    suggestions.push(`You have ${approved.length} approved draft${approved.length > 1 ? 's' : ''} ready to post`);
  }

  if (suggestions.length === 0) return null;

  return (
    <Card className="border-brand-500/30">
      <h3 className="font-display font-semibold mb-2 text-brand-300">Strategy Suggestions</h3>
      <ul className="space-y-1.5">
        {suggestions.map((s, i) => (
          <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
            <span className="text-brand-400 mt-0.5 shrink-0">--</span>
            <span>{s}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/* ── Content Type Distribution Stats ──────────────────────────── */

function ContentTypeStats({ drafts }: { drafts: RedditDraft[] }) {
  const nonArchived = drafts.filter((d) => d.status !== 'archived');
  const total = nonArchived.length;
  if (total === 0) return null;

  const counts: Record<ContentType, number> = {
    educate: 0, contrarian: 0, discussion: 0, framework: 0, soft_cta: 0,
  };
  for (const d of nonArchived) {
    counts[d.contentType] = (counts[d.contentType] || 0) + 1;
  }

  return (
    <DashboardGrid columns={3}>
      {CONTENT_TYPES.map((ct) => (
        <Card key={ct}>
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400 mb-1">{CONTENT_TYPE_LABELS[ct]}</p>
            <StatusBadge variant={CONTENT_TYPE_VARIANT[ct]}>{CONTENT_TYPE_LABELS[ct]}</StatusBadge>
          </div>
          <p className="text-2xl font-bold text-brand-300">
            {counts[ct]}
            {total > 0 && <span className="text-sm text-slate-500 ml-1">({Math.round((counts[ct] / total) * 100)}%)</span>}
          </p>
        </Card>
      ))}
    </DashboardGrid>
  );
}

/* ── Performance Tracking Section (Feature 3) ─────────────────── */

function PerformanceSection({ draft }: { draft: RedditDraft }) {
  const numField = (label: string, field: keyof RedditDraft, value: number) => (
    <div>
      <label className="block text-xs text-slate-400 mb-1">{label}</label>
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => updateDraft(draft.id, { [field]: parseInt(e.target.value) || 0 })}
        className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs"
      />
    </div>
  );

  return (
    <div className="mt-3 pt-3 border-t border-slate-700/50 space-y-3">
      <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Performance Tracking</h4>
      <div>
        <label className="block text-xs text-slate-400 mb-1">Reddit URL</label>
        <input
          type="url"
          value={draft.redditUrl ?? ''}
          onChange={(e) => updateDraft(draft.id, { redditUrl: e.target.value })}
          className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs"
          placeholder="https://reddit.com/..."
        />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {numField('Upvotes', 'upvotes', draft.upvotes ?? 0)}
        {numField('Comments', 'commentCount', draft.commentCount ?? 0)}
        {numField('Replies Received', 'repliesReceived', draft.repliesReceived ?? 0)}
        {numField('Profile Visits', 'profileVisits', draft.profileVisits ?? 0)}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {numField('Conversions', 'conversions', draft.conversions ?? 0)}
        <div>
          <label className="block text-xs text-slate-400 mb-1">Notes</label>
          <input
            type="text"
            value={draft.performanceNotes ?? ''}
            onChange={(e) => updateDraft(draft.id, { performanceNotes: e.target.value })}
            className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs"
            placeholder="Performance notes..."
          />
        </div>
      </div>
    </div>
  );
}

/* ── Main Component ───────────────────────────────────────────── */

export function RedditContentDrafts({ communities }: Props) {
  const { data: drafts } = useCollection<RedditDraft>('marketing_reddit_drafts');
  const [draftTab, setDraftTab] = useState<DraftTabKey>('post');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [expandedDraftId, setExpandedDraftId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<DraftStatus | 'all'>('all');
  const [subredditFilter, setSubredditFilter] = useState('all');
  const [productFilter, setProductFilter] = useState('all');
  const [form, setForm] = useState(emptyDraft());

  // Unique subreddits from communities for filter
  const subredditOptions = useMemo(
    () => Array.from(new Set(communities.map((c) => c.subreddit))).sort(),
    [communities],
  );

  // Filtered drafts
  const filtered = useMemo(() => {
    let result = drafts.filter((d) => d.type === draftTab);
    if (statusFilter !== 'all') result = result.filter((d) => d.status === statusFilter);
    if (subredditFilter !== 'all') result = result.filter((d) => d.subreddit === subredditFilter);
    if (productFilter !== 'all') result = result.filter((d) => d.productId === productFilter);
    return result.sort((a, b) => (b.updatedAt ?? b.createdAt).localeCompare(a.updatedAt ?? a.createdAt));
  }, [drafts, draftTab, statusFilter, subredditFilter, productFilter]);

  const openCreateModal = () => {
    setEditId(null);
    setForm({ ...emptyDraft(), type: draftTab });
    setModalOpen(true);
  };

  const openEditModal = (d: RedditDraft) => {
    setEditId(d.id);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...rest } = d;
    setForm(rest);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.body.trim()) return;
    if (editId) {
      await updateDraft(editId, form);
    } else {
      await addDraft(form);
    }
    setModalOpen(false);
    setEditId(null);
    setForm(emptyDraft());
  };

  const handleStatusChange = async (draft: RedditDraft, newStatus: DraftStatus) => {
    const updates: Partial<RedditDraft> = { status: newStatus };
    if (newStatus === 'posted' && !draft.postedAt) {
      updates.postedAt = new Date().toISOString();
    }
    await updateDraft(draft.id, updates);
  };

  const handleCopy = async (d: RedditDraft) => {
    const text = d.type === 'post' && d.title
      ? `${d.title}\n\n${d.body}`
      : d.body;
    await navigator.clipboard.writeText(text);
    setCopiedId(d.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const draftTabs: { key: DraftTabKey; label: string }[] = [
    { key: 'post', label: 'Posts' },
    { key: 'comment', label: 'Comments' },
    { key: 'reply', label: 'Replies' },
  ];

  return (
    <div className="space-y-6">
      {/* Strategy suggestions at top (Feature 4) */}
      <StrategySuggestions drafts={drafts} communities={communities} />

      {/* Content type distribution (Feature 6) */}
      <ContentTypeStats drafts={drafts} />

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Type tabs */}
        <div className="flex gap-1 bg-slate-800/60 border border-slate-700/50 rounded-lg p-1">
          {draftTabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setDraftTab(t.key)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                draftTab === t.key
                  ? 'bg-brand-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as DraftStatus | 'all')}
          className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-xs"
        >
          <option value="all">All Statuses</option>
          {DRAFT_STATUSES.map((s) => (
            <option key={s} value={s}>{DRAFT_STATUS_LABELS[s]}</option>
          ))}
        </select>

        {/* Subreddit filter */}
        <select
          value={subredditFilter}
          onChange={(e) => setSubredditFilter(e.target.value)}
          className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-xs"
        >
          <option value="all">All Subreddits</option>
          {subredditOptions.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {/* Product filter (Feature 5) */}
        <select
          value={productFilter}
          onChange={(e) => setProductFilter(e.target.value)}
          className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-xs"
        >
          {PRODUCTS.map((p) => (
            <option key={p.id} value={p.id}>{p.label}</option>
          ))}
        </select>

        <div className="flex-1" />

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> New Draft
        </button>
      </div>

      {/* Drafts list */}
      <div className="space-y-3">
        {filtered.map((d) => {
          const isExpanded = expandedDraftId === d.id;
          return (
            <Card key={d.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs text-brand-400">{d.subreddit || 'No subreddit'}</span>
                    <StatusBadge variant={DRAFT_STATUS_VARIANT[d.status]}>{DRAFT_STATUS_LABELS[d.status]}</StatusBadge>
                    <StatusBadge variant={CONTENT_TYPE_VARIANT[d.contentType]}>{CONTENT_TYPE_LABELS[d.contentType]}</StatusBadge>
                    {d.productId && d.productId !== 'examcoach' && (
                      <span className="text-xs text-slate-500">{d.productId}</span>
                    )}
                  </div>
                  {d.type === 'post' && d.title && (
                    <h4 className="text-sm font-semibold text-slate-200 mb-1">{d.title}</h4>
                  )}
                  <p className="text-xs text-slate-400 line-clamp-2">{d.body}</p>
                  {d.sourceThreadUrl && (
                    <a
                      href={d.sourceThreadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-brand-400 hover:underline mt-1 inline-flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" /> Source thread
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {/* Inline status dropdown */}
                  <select
                    value={d.status}
                    onChange={(e) => handleStatusChange(d, e.target.value as DraftStatus)}
                    className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs"
                  >
                    {DRAFT_STATUSES.map((s) => (
                      <option key={s} value={s}>{DRAFT_STATUS_LABELS[s]}</option>
                    ))}
                  </select>

                  <button
                    onClick={() => handleCopy(d)}
                    className="p-1.5 text-slate-500 hover:text-brand-400 transition-colors"
                    title="Copy to clipboard"
                  >
                    {copiedId === d.id ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => openEditModal(d)}
                    className="p-1.5 text-slate-500 hover:text-brand-400 transition-colors"
                    title="Edit"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteDraft(d.id)}
                    className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Performance tracking for posted drafts */}
              {d.status === 'posted' && (
                <div className="mt-2">
                  <button
                    onClick={() => setExpandedDraftId(isExpanded ? null : d.id)}
                    className="text-xs text-brand-400 hover:underline"
                  >
                    {isExpanded ? 'Hide performance' : 'Show performance tracking'}
                  </button>
                  {isExpanded && <PerformanceSection draft={d} />}
                </div>
              )}

              {/* Reddit URL shortcut for posted */}
              {d.status === 'posted' && d.redditUrl && (
                <a
                  href={d.redditUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-brand-400 hover:underline mt-1 inline-flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" /> View on Reddit
                </a>
              )}

              <div className="mt-1 text-xs text-slate-600">
                Updated {new Date(d.updatedAt ?? d.createdAt).toLocaleDateString()}
              </div>
            </Card>
          );
        })}

        {filtered.length === 0 && (
          <Card>
            <p className="text-sm text-slate-500 text-center py-4">
              No {DRAFT_TYPE_LABELS[draftTab].toLowerCase()} drafts yet. Click &quot;New Draft&quot; to create one.
            </p>
          </Card>
        )}
      </div>

      {/* Create / Edit modal */}
      <DataEntryModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditId(null); }}
        title={editId ? 'Edit Draft' : 'New Draft'}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-300 mb-1">Subreddit</label>
              <select
                value={form.subreddit}
                onChange={(e) => setForm({ ...form, subreddit: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Select subreddit...</option>
                {subredditOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as DraftType })}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm"
              >
                {DRAFT_TYPES.map((t) => (
                  <option key={t} value={t}>{DRAFT_TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-300 mb-1">Content Type</label>
              <select
                value={form.contentType}
                onChange={(e) => setForm({ ...form, contentType: e.target.value as ContentType })}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm"
              >
                {CONTENT_TYPES.map((ct) => (
                  <option key={ct} value={ct}>{CONTENT_TYPE_LABELS[ct]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as DraftStatus })}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm"
              >
                {DRAFT_STATUSES.map((s) => (
                  <option key={s} value={s}>{DRAFT_STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">Product</label>
            <select
              value={form.productId}
              onChange={(e) => setForm({ ...form, productId: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm"
            >
              {PRODUCTS.filter((p) => p.id !== 'all').map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </div>

          {form.type === 'post' && (
            <div>
              <label className="block text-sm text-slate-300 mb-1">Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm"
                placeholder="Post title..."
              />
            </div>
          )}

          <div>
            <label className="block text-sm text-slate-300 mb-1">Body</label>
            <textarea
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm"
              rows={6}
              placeholder="Write your content..."
            />
          </div>

          {(form.type === 'comment' || form.type === 'reply') && (
            <div>
              <label className="block text-sm text-slate-300 mb-1">Source Thread URL</label>
              <input
                type="url"
                value={form.sourceThreadUrl}
                onChange={(e) => setForm({ ...form, sourceThreadUrl: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm"
                placeholder="https://reddit.com/..."
              />
            </div>
          )}

          <button
            onClick={handleSave}
            className="w-full py-2.5 bg-brand-600 hover:bg-brand-500 rounded-lg font-medium transition-colors"
          >
            {editId ? 'Save Changes' : 'Create Draft'}
          </button>
        </div>
      </DataEntryModal>
    </div>
  );
}
