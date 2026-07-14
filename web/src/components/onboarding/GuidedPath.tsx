import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronRight, Map, X } from 'lucide-react';

export interface GuidedPathSteps {
    diagnostic: boolean;
    practice: boolean;
    breakdown: boolean;
    plan: boolean;
    mock: boolean;
}

const HIDDEN_KEY = 'ec_guided_path_hidden';
const DONE_KEY = 'ec_guided_path_done';

interface StepDef {
    key: keyof GuidedPathSteps;
    title: string;
    why: string;
    cta: string;
    to: string;
    state?: Record<string, unknown>;
}

const STEPS: StepDef[] = [
    {
        key: 'diagnostic',
        title: 'Take the diagnostic',
        why: 'Maps your baseline so everything else can personalize.',
        cta: 'Start diagnostic',
        to: '/app/quiz',
        state: { mode: 'diagnostic' },
    },
    {
        key: 'practice',
        title: 'Run your first practice session',
        why: 'Smart Practice picks questions based on your diagnostic.',
        cta: 'Start practicing',
        to: '/app/quiz',
        state: { mode: 'smart' },
    },
    {
        key: 'breakdown',
        title: 'Read a Coach Breakdown',
        why: "After you answer, the coach shows why the exam thinks you're right or wrong — this is the core of CipherExam.",
        cta: 'Practice & open one',
        to: '/app/quiz',
        state: { mode: 'smart' },
    },
    {
        key: 'plan',
        title: 'Set up your study plan',
        why: 'Turns your weak domains into a day-by-day schedule.',
        cta: 'Build my plan',
        to: '/app/planner',
    },
    {
        key: 'mock',
        title: 'Take a mock exam',
        why: 'The simulator mirrors real exam pacing and scoring.',
        cta: 'Open simulator',
        to: '/app/simulator',
    },
];

/**
 * Stage-aware getting-started checklist for the dashboard. Always points at
 * exactly ONE next action; completed steps collapse to a ✓ row. Dismissible;
 * disappears permanently once every step is complete (persisted so a step
 * scrolling out of the recent-runs window can't resurrect the card).
 */
export default function GuidedPath({ steps }: { steps: GuidedPathSteps }) {
    const navigate = useNavigate();
    const [hidden, setHidden] = useState(() => localStorage.getItem(HIDDEN_KEY) === '1');

    const doneCount = STEPS.filter((s) => steps[s.key]).length;
    const allDone = doneCount === STEPS.length;
    const previouslyCompleted = localStorage.getItem(DONE_KEY) === '1';

    if (allDone && !previouslyCompleted) {
        localStorage.setItem(DONE_KEY, '1');
    }
    if (allDone || previouslyCompleted) return null;

    if (hidden) {
        return (
            <button
                onClick={() => { localStorage.removeItem(HIDDEN_KEY); setHidden(false); }}
                className="mt-6 inline-flex items-center gap-2 text-xs font-mono tracking-wider text-slate-500 hover:text-brand-300 transition-colors"
            >
                <Map className="w-3.5 h-3.5" />
                GETTING-STARTED GUIDE ({doneCount}/{STEPS.length}) — SHOW
            </button>
        );
    }

    const nextKey = STEPS.find((s) => !steps[s.key])?.key;

    return (
        <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-800/40 overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-700/70">
                <Map className="w-4 h-4 text-brand-400" />
                <span className="font-mono text-[11px] tracking-[0.22em] text-slate-400 uppercase">Your path to exam-ready</span>
                <span className="font-mono text-[11px] text-brand-300 ml-1">{doneCount}/{STEPS.length}</span>
                <div className="flex-1 h-1 rounded-full bg-slate-700/60 max-w-[120px]">
                    <div
                        className="h-1 rounded-full bg-brand-400 transition-all duration-500"
                        style={{ width: `${(doneCount / STEPS.length) * 100}%` }}
                    />
                </div>
                <button
                    onClick={() => { localStorage.setItem(HIDDEN_KEY, '1'); setHidden(true); }}
                    className="ml-auto p-1 text-slate-500 hover:text-slate-300 transition-colors"
                    aria-label="Hide guide"
                    title="Hide guide"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div>
                {STEPS.map((s, i) => {
                    const done = steps[s.key];
                    const isNext = s.key === nextKey;
                    return (
                        <div
                            key={s.key}
                            className={`flex items-center gap-4 px-5 py-3 border-b border-slate-800 last:border-0 ${
                                isNext ? 'bg-brand-500/[0.06]' : ''
                            }`}
                        >
                            <div
                                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border ${
                                    done
                                        ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-400'
                                        : isNext
                                            ? 'border-brand-400 text-brand-300'
                                            : 'border-slate-700 text-slate-600'
                                }`}
                            >
                                {done ? <Check className="w-4 h-4" /> : <span className="font-mono text-xs">{i + 1}</span>}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className={`font-bold text-sm ${done ? 'text-slate-500 line-through decoration-slate-600' : isNext ? 'text-white' : 'text-slate-400'}`}>
                                    {s.title}
                                </div>
                                {isNext && <p className="text-xs text-slate-400 mt-0.5">{s.why}</p>}
                            </div>
                            {isNext && (
                                <button
                                    onClick={() => navigate(s.to, s.state ? { state: s.state } : undefined)}
                                    className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold px-4 py-2 transition-colors"
                                >
                                    {s.cta}
                                    <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
