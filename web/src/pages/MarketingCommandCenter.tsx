import { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../App';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import {
  BarChart3, ExternalLink, FileText, Target, Users, TrendingUp,
  CheckCircle, AlertCircle, Megaphone, PenTool, Globe
} from 'lucide-react';

/* ─── Marketing Plan Tracker ──────────────────────────────────────────── */

interface Task {
  name: string;
  status: 'done' | 'in-progress' | 'not-started';
  link?: string;
  notes?: string;
}

interface Day {
  day: number;
  title: string;
  tasks: Task[];
}

const MARKETING_PLAN: Day[] = [
  {
    day: 1,
    title: 'Foundation — Story, Tracking, Demo',
    tasks: [
      { name: 'Publish founder story (/story)', status: 'done', link: '/story' },
      { name: 'Define signup_complete + activated_user events', status: 'done', link: '/app/mcc' },
      { name: 'Implement GA4 full-funnel tracking (8 events)', status: 'done' },
      { name: 'Add UTM capture + user_id to north-star events', status: 'done' },
      { name: 'Build interactive product demo on landing page', status: 'done', link: '/' },
      { name: 'Create /pricing public page', status: 'done', link: '/pricing' },
      { name: 'Build event verifier dashboard', status: 'done', link: '/verify-events' },
      { name: 'Verify all 10 events fire end-to-end', status: 'done' },
    ],
  },
  {
    day: 2,
    title: 'Content — Blog + Core Article',
    tasks: [
      { name: 'Create blog section (/blog)', status: 'done', link: '/blog' },
      { name: 'Publish: "Why Cert Exam Questions Are So Confusing"', status: 'done', link: '/blog/why-certification-exam-questions-are-so-confusing' },
      { name: 'Publish: "5 Study Mistakes That Cost Your Cert Exam"', status: 'done', link: '/blog/5-study-mistakes-that-cost-your-certification-exam' },
      { name: 'Publish: "How AI Explanations Change Study"', status: 'done', link: '/blog/how-ai-explanations-change-the-way-you-study' },
      { name: 'Publish: "First 30 Days Study Plan"', status: 'done', link: '/blog/first-30-days-certification-study-plan' },
      { name: 'Add Terms + Privacy pages', status: 'done', link: '/terms' },
    ],
  },
  {
    day: 3,
    title: 'Distribution — Reddit, LinkedIn, Communities',
    tasks: [
      { name: 'Post core article to r/projectmanagement', status: 'not-started' },
      { name: 'Post core article to r/CompTIA', status: 'not-started' },
      { name: 'Post core article to r/pmp', status: 'not-started' },
      { name: 'Share on LinkedIn with personal commentary', status: 'not-started' },
      { name: 'Post in 2-3 cert study Discord/Facebook groups', status: 'not-started' },
    ],
  },
  {
    day: 4,
    title: 'Paid Ads — Google + Meta Setup',
    tasks: [
      { name: 'Create Google Ads search campaign (PMP keywords)', status: 'not-started' },
      { name: 'Create Meta/Facebook ad with 30s demo clip', status: 'not-started' },
      { name: 'Set up conversion tracking in Google Ads', status: 'not-started' },
      { name: 'Set up Custom Conversions in Meta Events Manager', status: 'not-started' },
      { name: 'Launch with $20/day budget', status: 'not-started' },
    ],
  },
  {
    day: 5,
    title: 'Optimize — Analyze + Iterate',
    tasks: [
      { name: 'Review GA4 funnel: landing → signup → activation rates', status: 'not-started' },
      { name: 'Check ad platform ROAS / CPA', status: 'not-started' },
      { name: 'Kill underperforming ad sets', status: 'not-started' },
      { name: 'A/B test landing page headline', status: 'not-started' },
      { name: 'Plan week 2 content calendar', status: 'not-started' },
    ],
  },
];

/* ─── Quick Links ─────────────────────────────────────────────────────── */

const QUICK_LINKS = [
  { label: 'Landing Page', url: '/', icon: Globe },
  { label: 'Blog', url: '/blog', icon: FileText },
  { label: 'Pricing', url: '/pricing', icon: Target },
  { label: 'Founder Story', url: '/story', icon: PenTool },
  { label: 'Event Verifier', url: '/verify-events', icon: BarChart3 },
  { label: 'GA4 Dashboard', url: 'https://analytics.google.com', icon: TrendingUp, external: true },
  { label: 'Google Ads', url: 'https://ads.google.com', icon: Megaphone, external: true },
  { label: 'Meta Ads Manager', url: 'https://business.facebook.com/adsmanager', icon: Users, external: true },
];

/* ─── Component ───────────────────────────────────────────────────────── */

export default function MarketingCommandCenter() {
  const { user } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [roleLoaded, setRoleLoaded] = useState(false);

  useEffect(() => {
    if (!user) { setRoleLoaded(true); return; }
    getDoc(doc(db, 'users', user.uid))
      .then(snap => setRole(snap.exists() ? (snap.data()?.role || 'user') : 'user'))
      .catch(() => setRole('user'))
      .finally(() => setRoleLoaded(true));
  }, [user]);

  if (!roleLoaded) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
      </div>
    );
  }
  if (role?.toLowerCase() !== 'admin') return <Navigate to="/app" replace />;

  // Stats
  const totalTasks = MARKETING_PLAN.flatMap(d => d.tasks).length;
  const doneTasks = MARKETING_PLAN.flatMap(d => d.tasks).filter(t => t.status === 'done').length;
  const inProgressTasks = MARKETING_PLAN.flatMap(d => d.tasks).filter(t => t.status === 'in-progress').length;
  const pct = Math.round((doneTasks / totalTasks) * 100);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold font-display text-white mb-2">
          Marketing Command Center
        </h1>
        <p className="text-slate-400 text-sm">
          Track progress, access assets, and manage the marketing plan.
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8 rounded-xl border border-slate-700 bg-slate-800/50 p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-white">Overall Progress</span>
          <span className="text-sm text-slate-400">
            <span className="text-emerald-400 font-bold">{doneTasks}</span>
            {inProgressTasks > 0 && <> + <span className="text-amber-400 font-bold">{inProgressTasks}</span> in progress</>}
            {' '}/ {totalTasks} tasks
          </span>
        </div>
        <div className="h-3 bg-slate-900 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-500 to-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="text-right mt-1 text-xs text-slate-500">{pct}% complete</div>
      </div>

      {/* Quick Links */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-white mb-3">Quick Links</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {QUICK_LINKS.map((link) => {
            const Icon = link.icon;
            const isExternal = 'external' in link && link.external;
            return isExternal ? (
              <a
                key={link.label}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-slate-700 bg-slate-800/30 hover:border-brand-500/30 hover:bg-slate-800/60 transition-all text-sm text-slate-300 hover:text-white"
              >
                <Icon className="w-4 h-4 text-slate-500" />
                {link.label}
                <ExternalLink className="w-3 h-3 text-slate-600 ml-auto" />
              </a>
            ) : (
              <Link
                key={link.label}
                to={link.url}
                className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-slate-700 bg-slate-800/30 hover:border-brand-500/30 hover:bg-slate-800/60 transition-all text-sm text-slate-300 hover:text-white"
              >
                <Icon className="w-4 h-4 text-slate-500" />
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* GA4 Funnel Events */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-white mb-3">GA4 Funnel Events</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { name: 'landing_page_view', label: 'Landing View', status: 'active' },
            { name: 'pricing_view', label: 'Pricing View', status: 'active' },
            { name: 'cta_click', label: 'CTA Click', status: 'active' },
            { name: 'trial_start', label: 'Trial Start', status: 'active' },
            { name: 'signup_complete', label: 'Signup Complete', status: 'north-star' },
            { name: 'exam_selected', label: 'Exam Selected', status: 'active' },
            { name: 'activated_user', label: 'Activated User', status: 'north-star' },
            { name: 'explanation_viewed', label: 'Explanation Viewed', status: 'active' },
          ].map((evt) => (
            <div
              key={evt.name}
              className={`px-4 py-3 rounded-xl border text-sm ${
                evt.status === 'north-star'
                  ? 'border-brand-500/30 bg-brand-500/10'
                  : 'border-slate-700 bg-slate-800/30'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className={`w-3.5 h-3.5 ${evt.status === 'north-star' ? 'text-brand-400' : 'text-emerald-500'}`} />
                <span className={`font-medium ${evt.status === 'north-star' ? 'text-brand-300' : 'text-white'}`}>
                  {evt.label}
                </span>
              </div>
              <code className="text-xs text-slate-500">{evt.name}</code>
              {evt.status === 'north-star' && (
                <div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-brand-400">North Star</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Marketing Plan Timeline */}
      <div>
        <h2 className="text-lg font-bold text-white mb-3">5-Day Marketing Plan</h2>
        <div className="space-y-4">
          {MARKETING_PLAN.map((day) => {
            const dayDone = day.tasks.filter(t => t.status === 'done').length;
            const dayTotal = day.tasks.length;
            const allDone = dayDone === dayTotal;

            return (
              <div
                key={day.day}
                className={`rounded-xl border p-5 ${
                  allDone
                    ? 'border-emerald-500/20 bg-emerald-500/5'
                    : 'border-slate-700 bg-slate-800/30'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      allDone
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-slate-700 text-slate-300'
                    }`}>
                      {allDone ? <CheckCircle className="w-4 h-4" /> : day.day}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm">Day {day.day}: {day.title}</h3>
                      <span className="text-xs text-slate-500">{dayDone}/{dayTotal} complete</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 ml-11">
                  {day.tasks.map((task, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-sm">
                      {task.status === 'done' ? (
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      ) : task.status === 'in-progress' ? (
                        <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-slate-600 shrink-0" />
                      )}
                      <span className={task.status === 'done' ? 'text-slate-500' : 'text-slate-300'}>
                        {task.name}
                      </span>
                      {task.link && (
                        <Link to={task.link} className="text-brand-400 hover:text-brand-300 transition-colors">
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
