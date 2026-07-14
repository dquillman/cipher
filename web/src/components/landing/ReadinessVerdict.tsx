import { useInView } from '../../hooks/useInView';
import CountUp from '../CountUp';
import { Clock, CheckCircle2 } from 'lucide-react';

// Sample data mirrors a real Simulator Results screen: an honest near-miss.
// The pass line is 70% (see SimulatorResults.tsx `passed = percentage >= 70`);
// 68% fails by two points, and one domain clearly drags the score down — which
// is exactly the "domain X-ray" story this section sells.
const SCORE = 34;
const TOTAL = 50;
const PCT = 68;          // 34/50, FAILED (pass line 70%)
const PASS_LINE = 70;
const DOMAINS = [
    { name: 'Process', pct: 76 },
    { name: 'People', pct: 71 },
    { name: 'Business Environment', pct: 44 },   // the gap
];

const R = 42.5;
const C = 2 * Math.PI * R;

/**
 * Landing section 07 — "The Readiness Verdict". Recreates the mock-exam results
 * dashboard as a marketing feature: the ring draws in, numbers count up, and
 * the domain bars fill when the section scrolls into view. Lives inside the
 * `.decoder` landing scope, so brand-* utilities resolve to signal cyan.
 */
export default function ReadinessVerdict() {
    const { ref, inView } = useInView<HTMLDivElement>(0.3);

    // Correct arc = 68% of the ring (drawn from top); the remaining 32% stays
    // dark track. Amber, because the score is below the pass line — "so close".
    const correctOffset = inView ? C * (1 - PCT / 100) : C;

    return (
        <div ref={ref} className="rounded-2xl border border-slate-700 bg-gradient-to-b from-slate-900/80 to-slate-950 overflow-hidden shadow-2xl shadow-black/40">
            {/* board header */}
            <div className="border-b border-slate-800 px-6 py-5 text-center">
                <h3 className="text-2xl font-bold text-white font-display">Exam Results</h3>
                <p className="text-slate-500 text-sm mt-0.5">Here is how you performed on this simulation.</p>
            </div>

            {/* keep-going banner */}
            <div className="mx-5 mt-5 flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-800/40 px-5 py-4">
                <div className="flex-1">
                    <span className="block text-sm font-bold text-white">So close — 2 points from passing.</span>
                    <span className="text-xs text-slate-400">Your gap is almost entirely one domain. Here's the fix.</span>
                </div>
                <span className="hidden sm:inline-flex font-mono text-xs font-bold tracking-wide bg-brand-500 text-slate-950 rounded-lg px-4 py-2.5 whitespace-nowrap">
                    Start Smart Practice →
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4 p-5">
                {/* verdict ring */}
                <div className="relative rounded-xl border border-slate-800 bg-slate-950 px-5 py-6 flex flex-col items-center overflow-hidden">
                    <div className="absolute top-0 inset-x-0 h-1 bg-red-500" />
                    <div className="relative w-44 h-44">
                        <svg viewBox="0 0 120 120" className="w-full h-full">
                            <circle cx="60" cy="60" r={R} fill="none" stroke="#101E36" strokeWidth="11" />
                            <circle
                                cx="60" cy="60" r={R} fill="none" stroke="#FFB224" strokeWidth="11" strokeLinecap="round"
                                transform="rotate(-90 60 60)"
                                strokeDasharray={C}
                                strokeDashoffset={correctOffset}
                                style={{ transition: 'stroke-dashoffset 1.3s cubic-bezier(0.16,1,0.3,1)' }}
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <CountUp value={`${PCT}%`} className="text-5xl font-extrabold text-white font-display tabular-nums" />
                        </div>
                    </div>
                    <div className="mt-4 font-mono text-sm font-bold tracking-widest text-red-400 bg-red-500/10 border border-red-500/30 rounded-full px-5 py-1.5">
                        FAILED
                    </div>
                    <p className="mt-3 text-[11px] text-slate-500 font-mono tracking-wide text-center">
                        {PASS_LINE - PCT} PTS BELOW THE {PASS_LINE}% PASS LINE
                    </p>
                </div>

                {/* right column */}
                <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-950 px-5 py-4">
                            <div className="w-10 h-10 rounded-lg bg-brand-500/10 border border-brand-500/25 text-brand-400 flex items-center justify-center">
                                <CheckCircle2 className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-xs text-slate-500">Score</div>
                                <div className="text-2xl font-extrabold text-white font-display tabular-nums">
                                    <CountUp value={`${SCORE}`} /> <span className="text-sm text-slate-500 font-semibold">/ {TOTAL}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-950 px-5 py-4">
                            <div className="w-10 h-10 rounded-lg bg-fuchsia-500/10 border border-fuchsia-500/25 text-fuchsia-400 flex items-center justify-center">
                                <Clock className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-xs text-slate-500">Time Taken</div>
                                <div className="text-2xl font-extrabold text-white font-display">41m 12s</div>
                            </div>
                        </div>
                    </div>

                    {/* per-domain */}
                    <div className="rounded-xl border border-slate-800 bg-slate-950 px-5 py-5">
                        <h4 className="font-bold text-white font-display mb-4">This Exam Performance</h4>
                        {DOMAINS.map((d) => {
                            const weak = d.pct < PASS_LINE;
                            return (
                                <div key={d.name} className="mb-4 last:mb-0">
                                    <div className="flex justify-between text-sm mb-1.5">
                                        <span className="text-slate-300">{d.name}</span>
                                        <span className={`font-mono font-semibold tabular-nums ${weak ? 'text-amber-400' : 'text-emerald-400'}`}>{d.pct}%</span>
                                    </div>
                                    <div className="h-3 rounded-full bg-slate-800 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${weak ? 'bg-gradient-to-r from-orange-600 to-amber-400' : 'bg-gradient-to-r from-emerald-600 to-emerald-400'}`}
                                            style={{ width: inView ? `${d.pct}%` : '0%', transition: 'width 1.3s cubic-bezier(0.16,1,0.3,1)' }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
