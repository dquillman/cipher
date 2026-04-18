import { useState, useEffect } from 'react';
import { Plus, RefreshCw, ChevronDown, ChevronRight, Copy, CheckCircle, Calendar, Clock, ExternalLink, SkipForward, CalendarPlus, AlertTriangle } from 'lucide-react';
import { useMarketingData } from '../../hooks/useMarketingData.ts';
import { addContent, updateContent, seedContent, reseedContent } from '../../services/contentService.ts';
import { DataEntryModal } from '../ui/DataEntryModal.tsx';
import { Card } from '../ui/Card.tsx';
import { StatusBadge } from '../ui/StatusBadge.tsx';
import type { ContentItem } from '../../types/content.ts';

type ContentType = ContentItem['type'];
type ContentStatus = ContentItem['status'];

const TYPE_VARIANT: Record<ContentType, 'blue' | 'purple' | 'amber' | 'red'> = {
  article: 'blue',
  video: 'purple',
  social: 'amber',
  ad: 'red',
};

const STATUS_VARIANT: Record<ContentStatus, 'gray' | 'blue' | 'green' | 'amber' | 'red' | 'purple'> = {
  idea: 'gray',
  draft: 'blue',
  ready: 'amber',
  published: 'green',
  promoted: 'purple',
  skipped: 'gray',
};

const STATUSES: ContentStatus[] = ['idea', 'draft', 'ready', 'published', 'promoted', 'skipped'];

const CHANNEL_COLORS: Record<string, string> = {
  'LinkedIn': 'text-blue-400',
  'Twitter/X': 'text-sky-400',
  'Reddit': 'text-orange-400',
  'Blog': 'text-emerald-400',
  'Google Ads': 'text-yellow-400',
  'Meta Ads': 'text-purple-400',
};

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function isToday(dateStr: string): boolean {
  if (!dateStr) return false;
  const today = new Date().toISOString().split('T')[0];
  return dateStr === today;
}

function isPast(dateStr: string): boolean {
  if (!dateStr) return false;
  const today = new Date().toISOString().split('T')[0];
  return dateStr < today;
}

export function ContentCalendar() {
  const { content } = useMarketingData();
  const [modalOpen, setModalOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'today' | 'upcoming' | 'overdue' | 'published'>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [seeding, setSeeding] = useState(false);
  const [form, setForm] = useState({
    week: 1,
    title: '',
    type: 'social' as ContentType,
    status: 'ready' as ContentStatus,
    channel: '',
    scheduledDate: '',
    scheduledTime: '',
    body: '',
    notes: '',
  });

  // Auto-seed on first load if empty
  useEffect(() => {
    if (content.length === 0) {
      seedContent();
    }
  }, [content.length]);

  const handleAdd = async () => {
    await addContent({ ...form, createdAt: new Date().toISOString() });
    setModalOpen(false);
    setForm({ week: 1, title: '', type: 'social', status: 'ready', channel: '', scheduledDate: '', scheduledTime: '', body: '', notes: '' });
  };

  const handleReseed = async () => {
    if (!confirm('This will delete all content items and re-seed from the template. Are you sure?')) return;
    setSeeding(true);
    await reseedContent();
    setSeeding(false);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleMarkPosted = (item: ContentItem) => {
    updateContent(item.id, { status: 'published' });
  };

  const handleSkip = (item: ContentItem) => {
    updateContent(item.id, { status: 'skipped' });
  };

  const handlePostToday = (item: ContentItem) => {
    const todayStr = new Date().toISOString().split('T')[0];
    updateContent(item.id, { scheduledDate: todayStr });
  };

  const handleBulkRescheduleOverdue = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const overdueItems = content.filter(c =>
      isPast(c.scheduledDate) && !isToday(c.scheduledDate) &&
      c.status !== 'published' && c.status !== 'promoted' && c.status !== 'skipped'
    );
    if (overdueItems.length === 0) return;
    if (!confirm(`Move ${overdueItems.length} overdue items to today?`)) return;
    overdueItems.forEach(item => {
      updateContent(item.id, { scheduledDate: todayStr });
    });
  };

  const handleBulkSkipOverdue = () => {
    const overdueItems = content.filter(c =>
      isPast(c.scheduledDate) && !isToday(c.scheduledDate) &&
      c.status !== 'published' && c.status !== 'promoted' && c.status !== 'skipped'
    );
    if (overdueItems.length === 0) return;
    if (!confirm(`Skip ${overdueItems.length} overdue items? You can always change their status later.`)) return;
    overdueItems.forEach(item => {
      updateContent(item.id, { status: 'skipped' });
    });
  };

  // Get unique channels
  const channels = [...new Set(content.map(c => c.channel))].sort();

  // Filter content
  let filtered = [...content];
  const today = new Date().toISOString().split('T')[0];

  if (filter === 'today') {
    filtered = filtered.filter(c => c.scheduledDate === today);
  } else if (filter === 'upcoming') {
    filtered = filtered.filter(c => c.scheduledDate >= today && c.status !== 'published');
  } else if (filter === 'overdue') {
    filtered = filtered.filter(c => isPast(c.scheduledDate) && !isToday(c.scheduledDate) && c.status !== 'published' && c.status !== 'promoted' && c.status !== 'skipped');
  } else if (filter === 'published') {
    filtered = filtered.filter(c => c.status === 'published');
  }

  if (channelFilter !== 'all') {
    filtered = filtered.filter(c => c.channel === channelFilter);
  }

  // Sort by date, then time
  filtered.sort((a, b) => {
    const dateComp = (a.scheduledDate || '').localeCompare(b.scheduledDate || '');
    if (dateComp !== 0) return dateComp;
    return (a.scheduledTime || '').localeCompare(b.scheduledTime || '');
  });

  // Group by week
  const weeks = [...new Set(filtered.map(c => c.week))].sort((a, b) => a - b);

  // Stats
  const totalItems = content.length;
  const publishedCount = content.filter(c => c.status === 'published').length;
  const todayCount = content.filter(c => c.scheduledDate === today).length;
  const todayPosted = content.filter(c => c.scheduledDate === today && c.status === 'published').length;
  const overdueCount = content.filter(c => isPast(c.scheduledDate) && !isToday(c.scheduledDate) && c.status !== 'published' && c.status !== 'promoted' && c.status !== 'skipped').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-display font-bold">Content Calendar</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReseed}
            disabled={seeding}
            className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${seeding ? 'animate-spin' : ''}`} /> Re-seed
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Content
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="!p-3 text-center">
          <div className="text-2xl font-bold text-brand-400">{todayCount}</div>
          <div className="text-xs text-slate-400">Due Today</div>
          <div className="text-xs text-slate-500">{todayPosted} posted</div>
        </Card>
        <Card className="!p-3 text-center">
          <div className="text-2xl font-bold text-emerald-400">{publishedCount}</div>
          <div className="text-xs text-slate-400">Published</div>
          <div className="text-xs text-slate-500">of {totalItems} total</div>
        </Card>
        <Card className="!p-3 text-center">
          <div className={`text-2xl font-bold ${overdueCount > 0 ? 'text-red-400' : 'text-slate-500'}`}>{overdueCount}</div>
          <div className="text-xs text-slate-400">Overdue</div>
          <div className="text-xs text-slate-500">not yet posted</div>
        </Card>
        <Card className="!p-3 text-center">
          <div className="text-2xl font-bold text-amber-400">{Math.round((publishedCount / Math.max(totalItems, 1)) * 100)}%</div>
          <div className="text-xs text-slate-400">Completion</div>
          <div className="text-xs text-slate-500">overall progress</div>
        </Card>
      </div>

      {/* Overdue Banner */}
      {overdueCount > 0 && filter !== 'overdue' && (
        <div className="flex items-center justify-between bg-red-500/10 border border-red-500/20 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-300">You have {overdueCount} overdue post{overdueCount !== 1 ? 's' : ''}</p>
              <p className="text-xs text-slate-400 mt-0.5">Past their scheduled date and not yet posted</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setFilter('overdue')}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-500 rounded-lg text-xs font-medium transition-colors"
            >
              View Overdue
            </button>
            <button
              onClick={handleBulkRescheduleOverdue}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-medium transition-colors"
            >
              <CalendarPlus className="w-3 h-3" /> Move All to Today
            </button>
            <button
              onClick={handleBulkSkipOverdue}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-medium transition-colors"
            >
              <SkipForward className="w-3 h-3" /> Skip All
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {(['all', 'today', 'upcoming', 'overdue', 'published'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === f
                ? f === 'overdue' ? 'bg-red-600 text-white' : 'bg-brand-600 text-white'
                : f === 'overdue' && overdueCount > 0 ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {f === 'all' ? `All (${content.length})` :
             f === 'today' ? `Today (${todayCount})` :
             f === 'upcoming' ? 'Upcoming' :
             f === 'overdue' ? `Overdue (${overdueCount})` :
             `Published (${publishedCount})`}
          </button>
        ))}
        <select
          value={channelFilter}
          onChange={e => setChannelFilter(e.target.value)}
          className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-xs"
        >
          <option value="all">All Channels</option>
          {channels.map(ch => <option key={ch} value={ch}>{ch}</option>)}
        </select>
      </div>

      {/* Content by Week */}
      {weeks.length === 0 ? (
        <Card className="text-center !py-12">
          <p className="text-slate-400">No content matches your filters.</p>
        </Card>
      ) : (
        weeks.map(week => {
          const weekItems = filtered.filter(c => c.week === week);
          // Group by date within week
          const dates = [...new Set(weekItems.map(c => c.scheduledDate))].sort();

          return (
            <div key={week}>
              <h3 className="font-display font-semibold text-brand-300 mb-3 text-lg">
                Week {week}
                <span className="text-xs text-slate-500 ml-2 font-normal">
                  {weekItems.filter(c => c.status === 'published').length}/{weekItems.length} posted
                </span>
              </h3>

              {dates.map(date => {
                const dateItems = weekItems.filter(c => c.scheduledDate === date);
                const dateIsToday = isToday(date);
                const dateIsPast = isPast(date);

                return (
                  <div key={date} className={`mb-4 ${dateIsToday ? 'ring-1 ring-brand-500/30 rounded-xl p-3 bg-brand-500/5' : ''}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className={`w-3.5 h-3.5 ${dateIsToday ? 'text-brand-400' : 'text-slate-500'}`} />
                      <span className={`text-sm font-medium ${dateIsToday ? 'text-brand-300' : 'text-slate-400'}`}>
                        {formatDate(date)}
                        {dateIsToday && <span className="ml-2 text-xs bg-brand-600 text-white px-2 py-0.5 rounded-full">TODAY</span>}
                        {dateIsPast && !dateIsToday && (
                          <span className="ml-2 text-xs text-slate-600">past</span>
                        )}
                      </span>
                    </div>

                    <div className="space-y-1.5 ml-5">
                      {dateItems.map(item => {
                        const isExpanded = expandedId === item.id;
                        const isOverdue = dateIsPast && !dateIsToday && item.status !== 'published' && item.status !== 'promoted';

                        return (
                          <Card key={item.id} className={`!p-0 overflow-hidden ${isOverdue ? 'border-red-500/30' : ''}`}>
                            {/* Row header */}
                            <div
                              className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-800/50 transition-colors"
                              onClick={() => setExpandedId(isExpanded ? null : item.id)}
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
                                <StatusBadge variant={TYPE_VARIANT[item.type]}>{item.type}</StatusBadge>
                                <span className={`text-xs font-medium ${CHANNEL_COLORS[item.channel] || 'text-slate-400'}`}>
                                  {item.channel}
                                </span>
                                <span className="text-sm text-slate-200 truncate">{item.title}</span>
                                {isOverdue && <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-medium">OVERDUE</span>}
                              </div>
                              <div className="flex items-center gap-2 shrink-0 ml-2">
                                <Clock className="w-3 h-3 text-slate-600" />
                                <span className="text-xs text-slate-500">{item.scheduledTime}</span>
                                <StatusBadge variant={STATUS_VARIANT[item.status]}>{item.status}</StatusBadge>
                              </div>
                            </div>

                            {/* Expanded content */}
                            {isExpanded && (
                              <div className="border-t border-slate-700/50 p-4 bg-slate-800/30">
                                {/* Content body */}
                                {item.body && (
                                  <div className="mb-4">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Content to Post</span>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleCopy(item.body, item.id); }}
                                        className="flex items-center gap-1 px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs transition-colors"
                                      >
                                        {copiedId === item.id ? (
                                          <><CheckCircle className="w-3 h-3 text-green-400" /> Copied!</>
                                        ) : (
                                          <><Copy className="w-3 h-3" /> Copy</>
                                        )}
                                      </button>
                                    </div>
                                    <pre className="text-sm text-slate-300 whitespace-pre-wrap font-sans leading-relaxed bg-slate-900/50 rounded-lg p-4 max-h-80 overflow-y-auto">
                                      {item.body}
                                    </pre>
                                  </div>
                                )}

                                {/* Notes */}
                                {item.notes && (
                                  <div className="mb-4">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Notes</span>
                                    <p className="text-xs text-slate-400 mt-1">{item.notes}</p>
                                  </div>
                                )}

                                {/* Actions */}
                                <div className="flex items-center gap-2 flex-wrap">
                                  {item.status !== 'published' && item.status !== 'promoted' && item.status !== 'skipped' && (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleMarkPosted(item); }}
                                      className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium transition-colors"
                                    >
                                      <CheckCircle className="w-4 h-4" /> Mark as Posted
                                    </button>
                                  )}
                                  {isOverdue && (
                                    <>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handlePostToday(item); }}
                                        className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors"
                                      >
                                        <CalendarPlus className="w-4 h-4" /> Post Today
                                      </button>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleSkip(item); }}
                                        className="flex items-center gap-1.5 px-4 py-2 bg-slate-600 hover:bg-slate-500 rounded-lg text-sm font-medium transition-colors"
                                      >
                                        <SkipForward className="w-4 h-4" /> Skip
                                      </button>
                                    </>
                                  )}
                                  {item.status === 'published' && (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); updateContent(item.id, { status: 'promoted' }); }}
                                      className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm font-medium transition-colors"
                                    >
                                      <ExternalLink className="w-4 h-4" /> Mark as Promoted
                                    </button>
                                  )}
                                  {item.status === 'skipped' && (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); updateContent(item.id, { status: 'ready' }); }}
                                      className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded-lg text-sm font-medium transition-colors"
                                    >
                                      <RefreshCw className="w-4 h-4" /> Unskip
                                    </button>
                                  )}
                                  <select
                                    value={item.status}
                                    onClick={e => e.stopPropagation()}
                                    onChange={(e) => updateContent(item.id, { status: e.target.value as ContentStatus })}
                                    className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-xs"
                                  >
                                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                                  </select>
                                </div>
                              </div>
                            )}
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })
      )}

      {/* Add Content Modal */}
      <DataEntryModal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Content">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm"
              placeholder="Content title"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-300 mb-1">Scheduled Date</label>
              <input
                type="date"
                value={form.scheduledDate}
                onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Time</label>
              <input
                type="text"
                value={form.scheduledTime}
                onChange={(e) => setForm({ ...form, scheduledTime: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm"
                placeholder="e.g. 9:00 AM EST"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-slate-300 mb-1">Week</label>
              <input
                type="number"
                min={1}
                max={8}
                value={form.week}
                onChange={(e) => setForm({ ...form, week: parseInt(e.target.value) || 1 })}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as ContentType })}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm"
              >
                <option value="article">Article</option>
                <option value="video">Video</option>
                <option value="social">Social</option>
                <option value="ad">Ad</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Channel</label>
              <input
                type="text"
                value={form.channel}
                onChange={(e) => setForm({ ...form, channel: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm"
                placeholder="LinkedIn, Reddit..."
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Content / Copy</label>
            <textarea
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm font-mono"
              rows={6}
              placeholder="The actual content to post..."
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm"
              rows={2}
              placeholder="Reminders, hashtags, etc."
            />
          </div>
          <button
            onClick={handleAdd}
            className="w-full py-2.5 bg-brand-600 hover:bg-brand-500 rounded-lg font-medium transition-colors"
          >
            Add Content
          </button>
        </div>
      </DataEntryModal>
    </div>
  );
}
