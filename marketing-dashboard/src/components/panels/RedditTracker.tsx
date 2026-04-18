import { useState, useCallback } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, MessageCircle } from 'lucide-react';
import { useCollection } from '../../hooks/useCollection.ts';
import {
  addCommunity, updateCommunity, deleteCommunity,
  addActivity, deleteActivity, quickComment,
} from '../../services/redditService.ts';
import { DataEntryModal } from '../ui/DataEntryModal.tsx';
import { Card } from '../ui/Card.tsx';
import { StatusBadge } from '../ui/StatusBadge.tsx';
import { ProgressBar } from '../ui/ProgressBar.tsx';
import { DashboardGrid } from '../layout/DashboardGrid.tsx';
import { today } from '../../lib/dateUtils.ts';
import {
  DEFAULT_SUBREDDITS, ACTIVITY_TYPES, ACTIVITY_TYPE_LABELS, ACTIVITY_TYPE_VARIANT,
  CTA_ALLOWANCE_OPTIONS,
  type RedditCommunity, type RedditActivity, type CtaAllowance,
} from '../../types/reddit.ts';
import { RedditContentDrafts } from './RedditContentDrafts.tsx';

type TabKey = 'communities' | 'content';

type CommunityStatus = 'not-joined' | 'building' | 'ready' | 'active';

function computeStatus(c: RedditCommunity): CommunityStatus {
  if (!c.joined) return 'not-joined';
  if (c.postsMade > 0) return 'active';
  const threshold = c.minKarma ?? 0;
  if (threshold > 0 && c.karma < threshold) return 'building';
  // minKarma is 0 (no requirement) or karma meets threshold
  if (c.karma > 0 || threshold === 0) return 'ready';
  return 'building';
}

const STATUS_META: Record<CommunityStatus, { label: string; variant: 'gray' | 'amber' | 'green' | 'blue' }> = {
  'not-joined': { label: 'Not Joined', variant: 'gray' },
  'building':   { label: 'Building Karma', variant: 'amber' },
  'ready':      { label: 'Ready to Post', variant: 'green' },
  'active':     { label: 'Active', variant: 'blue' },
};

function karmaBarColor(karma: number, minKarma: number): string {
  if (minKarma <= 0) return 'bg-emerald-500';
  const pct = (karma / minKarma) * 100;
  if (pct >= 100) return 'bg-emerald-500';
  if (pct >= 75) return 'bg-green-500';
  if (pct >= 25) return 'bg-amber-500';
  return 'bg-red-500';
}

const defaultRulesProfile = {
  postingRules: '',
  toneNotes: '',
  bannedTopics: '',
  minKarma: 0,
  minAccountAge: 0,
  ctaAllowance: 'none' as CtaAllowance,
  postingFrequency: '',
};

export function RedditTracker() {
  const { data: communities } = useCollection<RedditCommunity>('marketing_reddit_communities');
  const { data: activities } = useCollection<RedditActivity>('marketing_reddit_activity');
  const [activeTab, setActiveTab] = useState<TabKey>('communities');
  const [subModalOpen, setSubModalOpen] = useState(false);
  const [actModalOpen, setActModalOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [subForm, setSubForm] = useState({ subreddit: '' });
  const [actForm, setActForm] = useState<Omit<RedditActivity, 'id'>>({
    subredditId: '',
    date: today(),
    type: 'comment' as RedditActivity['type'],
    description: '',
  });
  // Track which buttons are in "flash" state after clicking +1 Comment
  const [flashingIds, setFlashingIds] = useState<Set<string>>(new Set());

  const handleAddSub = async () => {
    const name = subForm.subreddit.trim();
    if (!name) return;
    const formatted = name.startsWith('r/') ? name : `r/${name}`;
    await addCommunity({
      subreddit: formatted,
      joined: false,
      canPost: false,
      karma: 0,
      postsMade: 0,
      commentsMade: 0,
      notes: '',
      ...defaultRulesProfile,
    });
    setSubModalOpen(false);
    setSubForm({ subreddit: '' });
  };

  const handleAddActivity = async () => {
    if (!actForm.description.trim() || !actForm.subredditId) return;
    await addActivity({ ...actForm });
    setActModalOpen(false);
    setActForm({ subredditId: '', date: today(), type: 'comment', description: '' });
  };

  const handleSeedDefaults = async () => {
    for (const sub of DEFAULT_SUBREDDITS) {
      const exists = communities.some((c) => c.subreddit.toLowerCase() === sub.toLowerCase());
      if (!exists) {
        await addCommunity({
          subreddit: sub,
          joined: false,
          canPost: false,
          karma: 0,
          postsMade: 0,
          commentsMade: 0,
          notes: '',
          ...defaultRulesProfile,
        });
      }
    }
  };

  const handleQuickComment = useCallback(async (c: RedditCommunity) => {
    // Flash the button green
    setFlashingIds((prev) => new Set(prev).add(c.id));
    await quickComment(c.id, c.subreddit, today());
    // Remove flash after 800ms
    setTimeout(() => {
      setFlashingIds((prev) => {
        const next = new Set(prev);
        next.delete(c.id);
        return next;
      });
    }, 800);
  }, []);

  // --- Computed summary stats ---
  const todayStr = today();
  const todayActivities = activities.filter((a) => a.date === todayStr);
  const todayComments = todayActivities.filter((a) => a.type === 'comment').length;

  const totalJoined = communities.filter((c) => c.joined).length;
  const subsReady = communities.filter((c) => {
    const st = computeStatus(c);
    return st === 'ready' || st === 'active';
  }).length;
  const subsBuilding = communities.filter((c) => computeStatus(c) === 'building').length;
  const totalComments = communities.reduce((sum, c) => sum + c.commentsMade, 0);
  const totalPosts = communities.reduce((sum, c) => sum + c.postsMade, 0);

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'communities', label: 'Communities' },
    { key: 'content', label: 'Content Drafts' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-display font-bold">Reddit Tracker</h2>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-slate-800/60 border border-slate-700/50 rounded-lg p-1 w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === t.key
                ? 'bg-brand-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'communities' && (
        <>
          <div className="flex items-center justify-end gap-2">
            {communities.length === 0 && (
              <button
                onClick={handleSeedDefaults}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium transition-colors"
              >
                Seed Defaults
              </button>
            )}
            <button
              onClick={() => setSubModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Subreddit
            </button>
          </div>

          {/* Karma Builder Summary Card */}
          <Card className="border-brand-500/30">
            <h3 className="font-display font-semibold mb-3 text-brand-300">Karma Builder Summary</h3>
            <DashboardGrid columns={4}>
              <div>
                <p className="text-xs text-slate-400 mb-1">Subs Joined</p>
                <p className="text-2xl font-bold text-brand-300">{totalJoined} <span className="text-sm text-slate-500">/ {communities.length}</span></p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Ready to Post</p>
                <p className="text-2xl font-bold text-emerald-400">{subsReady} <span className="text-sm text-slate-500">/ {totalJoined > 0 ? totalJoined : communities.length}</span></p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Building Karma</p>
                <p className="text-2xl font-bold text-amber-400">{subsBuilding}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Comments Today</p>
                <p className="text-2xl font-bold text-blue-400">{todayComments}</p>
                <p className="text-xs text-slate-500 mt-1">{totalComments} total comments &middot; {totalPosts} posts</p>
              </div>
            </DashboardGrid>
          </Card>

          {/* Community list */}
          <Card>
            <h3 className="font-display font-semibold mb-3">Subreddits</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400 border-b border-slate-700">
                    <th className="pb-2 pr-4 w-6"></th>
                    <th className="pb-2 pr-4">Subreddit</th>
                    <th className="pb-2 pr-4">Status</th>
                    <th className="pb-2 pr-4">Joined</th>
                    <th className="pb-2 pr-4 min-w-[180px]">Karma Progress</th>
                    <th className="pb-2 pr-4">Posts</th>
                    <th className="pb-2 pr-4">Comments</th>
                    <th className="pb-2 pr-4">Notes</th>
                    <th className="pb-2 pr-4 w-32"></th>
                    <th className="pb-2 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {communities.map((c) => {
                    const status = computeStatus(c);
                    const meta = STATUS_META[status];
                    const isExpanded = expandedId === c.id;
                    const minK = c.minKarma ?? 0;
                    const isFlashing = flashingIds.has(c.id);
                    const karmaNeeded = minK > 0 ? Math.max(0, minK - c.karma) : 0;
                    const estDays = karmaNeeded > 0 ? Math.ceil(karmaNeeded / 3) : 0;

                    return (
                      <>
                        <tr key={c.id} className="border-b border-slate-700/50">
                          <td className="py-2 pr-2">
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : c.id)}
                              className="p-0.5 text-slate-500 hover:text-slate-300"
                            >
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                          </td>
                          <td className="py-2 pr-4">
                            <a
                              href={`https://reddit.com/${c.subreddit}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-brand-400 hover:underline"
                            >
                              {c.subreddit}
                            </a>
                          </td>
                          <td className="py-2 pr-4">
                            <StatusBadge variant={meta.variant}>{meta.label}</StatusBadge>
                          </td>
                          <td className="py-2 pr-4">
                            <input
                              type="checkbox"
                              checked={c.joined}
                              onChange={(e) => updateCommunity(c.id, { joined: e.target.checked })}
                              className="rounded"
                            />
                          </td>
                          <td className="py-2 pr-4">
                            {minK > 0 ? (
                              <div className="space-y-1">
                                <ProgressBar
                                  value={Math.min(c.karma, minK)}
                                  max={minK}
                                  color={karmaBarColor(c.karma, minK)}
                                  showCount={false}
                                />
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="number"
                                    min={0}
                                    value={c.karma}
                                    onChange={(e) => updateCommunity(c.id, { karma: parseInt(e.target.value) || 0 })}
                                    className="w-14 bg-slate-700 border border-slate-600 rounded px-1.5 py-0.5 text-xs"
                                  />
                                  <span className="text-xs text-slate-400">/ {minK} karma ({minK > 0 ? Math.min(100, Math.round((c.karma / minK) * 100)) : 100}%)</span>
                                  {c.karma >= minK && (
                                    <StatusBadge variant="green">Ready to Post</StatusBadge>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="number"
                                  min={0}
                                  value={c.karma}
                                  onChange={(e) => updateCommunity(c.id, { karma: parseInt(e.target.value) || 0 })}
                                  className="w-14 bg-slate-700 border border-slate-600 rounded px-1.5 py-0.5 text-xs"
                                />
                                <span className="text-xs text-slate-500">No req</span>
                              </div>
                            )}
                            {/* Daily karma goal estimator */}
                            {status === 'building' && karmaNeeded > 0 && (
                              <p className="text-xs text-amber-400/80 mt-1">
                                Need {karmaNeeded} more. ~{estDays}d at 3/day
                              </p>
                            )}
                          </td>
                          <td className="py-2 pr-4">
                            <input
                              type="number"
                              min={0}
                              value={c.postsMade}
                              onChange={(e) => updateCommunity(c.id, { postsMade: parseInt(e.target.value) || 0 })}
                              className="w-14 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs"
                            />
                          </td>
                          <td className="py-2 pr-4">
                            <input
                              type="number"
                              min={0}
                              value={c.commentsMade}
                              onChange={(e) => updateCommunity(c.id, { commentsMade: parseInt(e.target.value) || 0 })}
                              className="w-14 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs"
                            />
                          </td>
                          <td className="py-2 pr-4">
                            <input
                              type="text"
                              value={c.notes}
                              onChange={(e) => updateCommunity(c.id, { notes: e.target.value })}
                              className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs"
                              placeholder="Notes..."
                            />
                          </td>
                          <td className="py-2 pr-4">
                            <button
                              onClick={() => handleQuickComment(c)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                                isFlashing
                                  ? 'bg-emerald-600 text-white scale-105'
                                  : 'bg-brand-600 hover:bg-brand-500 text-white'
                              }`}
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              {isFlashing ? 'Logged!' : '+1 Comment'}
                            </button>
                          </td>
                          <td className="py-2">
                            <button onClick={() => deleteCommunity(c.id)} className="p-1 text-slate-500 hover:text-red-400">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr key={`${c.id}-rules`} className="border-b border-slate-700/50 bg-slate-800/40">
                            <td colSpan={10} className="px-4 py-3">
                              <div className="space-y-3">
                                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Rules Profile</h4>
                                <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
                                  <div>
                                    <label className="block text-xs text-slate-400 mb-1">Posting Rules</label>
                                    <textarea
                                      value={c.postingRules ?? ''}
                                      onChange={(e) => updateCommunity(c.id, { postingRules: e.target.value })}
                                      className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs"
                                      rows={2}
                                      placeholder="Summary of rules..."
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-slate-400 mb-1">Tone Notes</label>
                                    <textarea
                                      value={c.toneNotes ?? ''}
                                      onChange={(e) => updateCommunity(c.id, { toneNotes: e.target.value })}
                                      className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs"
                                      rows={2}
                                      placeholder="Expected tone..."
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-slate-400 mb-1">Banned Topics</label>
                                    <textarea
                                      value={c.bannedTopics ?? ''}
                                      onChange={(e) => updateCommunity(c.id, { bannedTopics: e.target.value })}
                                      className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs"
                                      rows={2}
                                      placeholder="Topics to avoid..."
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-slate-400 mb-1">Min Karma</label>
                                    <input
                                      type="number"
                                      min={0}
                                      value={c.minKarma ?? 0}
                                      onChange={(e) => updateCommunity(c.id, { minKarma: parseInt(e.target.value) || 0 })}
                                      className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-slate-400 mb-1">Min Account Age (days)</label>
                                    <input
                                      type="number"
                                      min={0}
                                      value={c.minAccountAge ?? 0}
                                      onChange={(e) => updateCommunity(c.id, { minAccountAge: parseInt(e.target.value) || 0 })}
                                      className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-slate-400 mb-1">CTA Allowance</label>
                                    <select
                                      value={c.ctaAllowance ?? 'none'}
                                      onChange={(e) => updateCommunity(c.id, { ctaAllowance: e.target.value as CtaAllowance })}
                                      className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs"
                                    >
                                      {CTA_ALLOWANCE_OPTIONS.map((o) => (
                                        <option key={o.value} value={o.value}>{o.label}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-xs text-slate-400 mb-1">Posting Frequency</label>
                                    <input
                                      type="text"
                                      value={c.postingFrequency ?? ''}
                                      onChange={(e) => updateCommunity(c.id, { postingFrequency: e.target.value })}
                                      className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs"
                                      placeholder="e.g. max 1/day"
                                    />
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                  {communities.length === 0 && (
                    <tr>
                      <td colSpan={10} className="py-4 text-center text-slate-500">
                        No subreddits tracked yet. Click &quot;Seed Defaults&quot; to add the recommended list.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Activity log */}
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-semibold">Activity Log</h3>
              <button
                onClick={() => setActModalOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-brand-600 hover:bg-brand-500 rounded-lg text-xs font-medium transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Log Activity
              </button>
            </div>
            <div className="space-y-2">
              {activities
                .sort((a, b) => b.date.localeCompare(a.date))
                .slice(0, 20)
                .map((a) => {
                  const sub = communities.find((c) => c.id === a.subredditId);
                  return (
                    <div key={a.id} className="flex items-center justify-between text-sm border-b border-slate-700/50 pb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs text-slate-500 whitespace-nowrap">{a.date}</span>
                        <StatusBadge variant={ACTIVITY_TYPE_VARIANT[a.type]}>{ACTIVITY_TYPE_LABELS[a.type]}</StatusBadge>
                        {sub && <span className="text-brand-400 text-xs">{sub.subreddit}</span>}
                        <span className="text-slate-300 truncate">{a.description}</span>
                      </div>
                      <button onClick={() => deleteActivity(a.id)} className="p-1 text-slate-500 hover:text-red-400 shrink-0">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              {activities.length === 0 && <p className="text-sm text-slate-500">No activity logged yet.</p>}
            </div>
          </Card>

          {/* Add subreddit modal */}
          <DataEntryModal open={subModalOpen} onClose={() => setSubModalOpen(false)} title="Add Subreddit">
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1">Subreddit</label>
                <input
                  type="text"
                  value={subForm.subreddit}
                  onChange={(e) => setSubForm({ subreddit: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm"
                  placeholder="r/subreddit or just subreddit"
                />
              </div>
              <button
                onClick={handleAddSub}
                className="w-full py-2.5 bg-brand-600 hover:bg-brand-500 rounded-lg font-medium transition-colors"
              >
                Add Subreddit
              </button>
            </div>
          </DataEntryModal>

          {/* Log activity modal */}
          <DataEntryModal open={actModalOpen} onClose={() => setActModalOpen(false)} title="Log Activity">
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1">Subreddit</label>
                <select
                  value={actForm.subredditId}
                  onChange={(e) => setActForm({ ...actForm, subredditId: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Select subreddit...</option>
                  {communities.map((c) => (
                    <option key={c.id} value={c.id}>{c.subreddit}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Type</label>
                  <select
                    value={actForm.type}
                    onChange={(e) => setActForm({ ...actForm, type: e.target.value as RedditActivity['type'] })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm"
                  >
                    {ACTIVITY_TYPES.map((t) => (
                      <option key={t} value={t}>{ACTIVITY_TYPE_LABELS[t]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Date</label>
                  <input
                    type="date"
                    value={actForm.date}
                    onChange={(e) => setActForm({ ...actForm, date: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Description</label>
                <textarea
                  value={actForm.description}
                  onChange={(e) => setActForm({ ...actForm, description: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm"
                  rows={2}
                  placeholder="e.g. Commented on 3 posts about PMP prep"
                />
              </div>
              <button
                onClick={handleAddActivity}
                className="w-full py-2.5 bg-brand-600 hover:bg-brand-500 rounded-lg font-medium transition-colors"
              >
                Log Activity
              </button>
            </div>
          </DataEntryModal>
        </>
      )}

      {activeTab === 'content' && (
        <RedditContentDrafts communities={communities} />
      )}
    </div>
  );
}
