import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Crosshair, Wrench, TrendingUp, Scale, ShieldCheck } from 'lucide-react';
import type { PatternData } from '../PatternInsightCard';
import { useMarketingCopy } from '../../hooks/useMarketingCopy';
import MasteryDisclosure from './MasteryDisclosure';

interface QuizCompletionSummaryProps {
    score: number;
    totalQuestions: number;
    sessionTraps: Map<string, { count: number; pattern: PatternData }>;
    domainResults: Record<string, { correct: number; total: number }>;
    isPro: boolean;
    activeExamId: string;
    onUpsell: () => void;
}

// Post-quiz summary screens: diagnostic reveal, trap-drill, trap session,
// and the default completion card. Which one renders is driven by
// location.state.mode, exactly as it was inline in Quiz.tsx.
export default function QuizCompletionSummary({
    score,
    totalQuestions,
    sessionTraps,
    domainResults,
    isPro,
    activeExamId,
    onUpsell,
}: QuizCompletionSummaryProps) {
    const location = useLocation();
    const navigate = useNavigate();
    const copy = useMarketingCopy();

    // DIAGNOSTIC SUMMARY (First Session Reveal)
    if (location.state?.mode === 'diagnostic') {
        const traps = Array.from(sessionTraps.values());
        const topTrap = traps.length > 0 ? traps.sort((a, b) => b.count - a.count)[0] : null;

        // Derive weakest domain for display
        let weakestDomain: string | null = null;
        let worstAcc = Infinity;
        for (const [domain, stats] of Object.entries(domainResults)) {
            if (stats.total > 0) {
                const acc = stats.correct / stats.total;
                if (acc < worstAcc) {
                    worstAcc = acc;
                    weakestDomain = domain;
                }
            }
        }

        return (
            <div className="min-h-dvh flex items-center justify-center bg-slate-950">
                <div className="bg-slate-900/50 backdrop-blur-md p-4 sm:p-8 rounded-2xl shadow-2xl shadow-black/20 text-center max-w-md w-full border border-slate-700 animate-in fade-in zoom-in duration-500 max-h-[90vh] overflow-y-auto">

                    <div className="mb-6">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-indigo-500/20">
                            <span className="text-3xl sm:text-4xl">🔎</span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white font-display mb-2">Analysis Complete. Here’s what I found.</h2>
                        <p className="text-slate-400">I've mapped your baseline strengths and blind spots.</p>
                    </div>

                    {/* REVEAL LOGIC */}
                    {topTrap ? (
                        <div className="bg-gradient-to-br from-indigo-900/40 to-slate-800 border border-indigo-500/30 rounded-xl p-6 mb-8 text-left relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none"></div>
                            <h3 className="text-indigo-300 font-bold uppercase tracking-wider text-xs mb-2">Insight Detected</h3>
                            <p className="text-white text-lg font-medium leading-relaxed mb-4">
                                "You just encountered a common PMI Thinking Trap: <strong className="text-indigo-400">{topTrap.pattern.pattern_name}</strong>."
                            </p>
                            <p className="text-slate-400 text-sm italic border-l-2 border-indigo-500/30 pl-3">
                                {topTrap.pattern.core_rule}
                            </p>
                        </div>
                    ) : (
                        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-8">
                            <h3 className="text-slate-300 font-bold mb-2">Analysis</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                "As you practice, the system learns exactly how PMI patterns affect your answers. Keep going to unlock deeper insights."
                            </p>
                        </div>
                    )}

                    <div className="text-left mb-6">
                        <h4 className="text-slate-300 font-semibold text-sm mb-2">What this analysis means</h4>
                        <p className="text-slate-400 text-sm leading-relaxed mb-2">
                            This was not a pass/fail test. It was a short diagnostic designed to help us understand how you think and where you'll benefit most from practice.
                        </p>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            Based on your responses, we'll guide you toward your weakest domain so you can focus your time where it matters most.
                        </p>
                        {weakestDomain && (
                            <p className="text-slate-300 text-sm leading-relaxed mt-2">
                                Based on your responses so far, your weakest domain appears to be <strong className="text-white">{weakestDomain}</strong>. That's where focused practice is likely to give you the fastest improvement.
                            </p>
                        )}
                        {topTrap && (
                            <p className="text-slate-400 text-sm leading-relaxed mt-2">
                                We also noticed a recurring pattern related to <strong className="text-slate-300">{topTrap.pattern.pattern_name}</strong>. You may see questions designed to challenge this area as you continue — this helps strengthen real-world decision-making.
                            </p>
                        )}
                    </div>

                    <MasteryDisclosure />

                    <div className="space-y-3">
                        {topTrap ? (
                            <button
                                onClick={() => {
                                    if (isPro) {
                                        navigate('/app/quiz', {
                                            state: {
                                                mode: 'trap',
                                                patternId: topTrap.pattern.pattern_id,
                                                patternName: topTrap.pattern.pattern_name,
                                                domainTags: topTrap.pattern.domain_tags,
                                                masteryScore: 0 // Reset for practice
                                            }
                                        });
                                    } else {
                                        onUpsell();
                                    }
                                }}
                                className="w-full bg-indigo-600 text-white px-6 py-3.5 rounded-xl font-bold hover:bg-indigo-500 shadow-lg shadow-indigo-500/30 transition-all"
                            >
                                {isPro ? `[ Practice This Trap ]` : `[ ${copy.pro_value_primary} ]`}
                            </button>
                        ) : (
                            <button
                                onClick={() => navigate('/app/planner', {
                                    state: {
                                        source: 'diagnostic',
                                        recommendedDomain: weakestDomain
                                    }
                                })}
                                className="w-full bg-brand-600 text-white px-6 py-3.5 rounded-xl font-bold hover:bg-brand-500 shadow-lg shadow-brand-500/30 transition-all"
                            >
                                Continue to Your Study Plan
                            </button>
                        )}

                        {topTrap && (
                            <button
                                onClick={() => navigate('/app/planner', {
                                    state: {
                                        source: 'diagnostic',
                                        recommendedDomain: weakestDomain
                                    }
                                })}
                                className="block text-slate-500 hover:text-white text-sm font-medium py-2 w-full"
                            >
                                Continue to Your Study Plan
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // TRAP DRILL SUMMARY
    if (location.state?.mode === 'trap-drill') {
        const accuracy = (score / totalQuestions) * 100;
        const trapName = location.state.patternName || "Thinking Trap";

        return (
            <div className="min-h-dvh flex items-center justify-center bg-slate-950">
                <div className="bg-slate-900/50 backdrop-blur-md p-8 rounded-2xl shadow-2xl shadow-black/20 text-center max-w-md w-full border border-slate-700">
                    <div className="w-16 h-16 bg-brand-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-brand-500/20 text-brand-400">
                        {accuracy >= 70 ? <Crosshair className="h-7 w-7" strokeWidth={1.75} /> : <Wrench className="h-7 w-7" strokeWidth={1.75} />}
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-1 font-display">Trap Practice Complete</h2>
                    <p className="text-slate-400 text-sm mb-6">Pattern: {trapName}</p>

                    <div className="bg-slate-800/50 rounded-xl p-6 mb-6 border border-slate-700/50">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-slate-400 text-sm">Accuracy</span>
                            <span className={`font-bold text-lg ${accuracy >= 70 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                {Math.round(accuracy)}%
                            </span>
                        </div>
                        <div className="w-full bg-slate-700/50 rounded-full h-2 mb-4">
                            <div
                                className={`h-2 rounded-full transition-all ${accuracy >= 70 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                style={{ width: `${accuracy}%` }}
                            ></div>
                        </div>
                        <p className="text-slate-300 text-sm italic">
                            {accuracy >= 70
                                ? "You are improving on this pattern."
                                : "This pattern still needs work. Try another drill."}
                        </p>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => navigate('/app/quiz', {
                                state: {
                                    mode: 'trap-drill',
                                    patternId: location.state.patternId,
                                    patternName: trapName,
                                    domainTags: location.state.domainTags,
                                    masteryScore: location.state.masteryScore,
                                    examId: activeExamId
                                },
                                replace: true
                            })}
                            className="w-full bg-brand-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-500 shadow-lg shadow-brand-500/30 transition-all"
                        >
                            Practice Again
                        </button>
                        <Link to="/app" className="block w-full bg-slate-800 text-slate-300 px-6 py-3 rounded-xl font-bold hover:bg-slate-700 transition-all border border-slate-700">
                            Back to Dashboard
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // TRAP MODE SUMMARY
    if (location.state?.mode === 'trap') {
        const accuracy = (score / totalQuestions) * 100;
        const trapName = location.state.patternName || "Thinking Trap";

        return (
            <div className="min-h-dvh flex items-center justify-center bg-slate-950">
                <div className="bg-slate-900/50 backdrop-blur-md p-8 rounded-2xl shadow-2xl shadow-black/20 text-center max-w-md w-full border border-slate-700">
                    {/* Reinforcement Memory Generation */}
                    {(() => {
                        // Generate and store if not already done for this session
                        // We can use a simple check or just overwrite since it's the end of session
                        const REINFORCEMENT_KEY = 'exam_coach_reinforcement';

                        // Only generate if accuracy is decent (e.g. > 40%) to avoid reinforcing failure
                        if (accuracy > 40) {
                            const messages = [
                                "You’re starting to recognize this trap earlier.",
                                "You’re catching this pattern faster than before.",
                                "This trap is becoming easier to spot."
                            ];
                            // Specific deterministic choice based on pattern name length to differ slightly per pattern but be consistent
                            const idx = (trapName.length + Math.floor(accuracy)) % messages.length;
                            const message = messages[idx];

                            try {
                                localStorage.setItem(REINFORCEMENT_KEY, JSON.stringify({
                                    message,
                                    patternId: location.state.patternId,
                                    patternName: trapName,
                                    timestamp: Date.now()
                                }));
                            } catch (e) {
                                console.error("Failed to save reinforcement", e);
                            }
                        }
                        return null;
                    })()}

                    <div className="w-16 h-16 bg-brand-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-brand-500/20 text-brand-400">
                        {accuracy > 70 ? <TrendingUp className="h-7 w-7" strokeWidth={1.75} /> : accuracy > 40 ? <Scale className="h-7 w-7" strokeWidth={1.75} /> : <Wrench className="h-7 w-7" strokeWidth={1.75} />}
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-2 font-display">{trapName}</h2>
                    <p className="text-slate-400 text-sm mb-6 uppercase tracking-wider font-bold">Session Complete</p>

                    <div className="bg-slate-800/50 rounded-xl p-6 mb-8 border border-slate-700/50">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-slate-400 text-sm">Session Accuracy</span>
                            <span className={`font-bold text-lg ${accuracy > 70 ? 'text-emerald-400' : 'text-slate-200'}`}>
                                {Math.round(accuracy)}%
                            </span>
                        </div>
                        <div className="w-full bg-slate-700/50 rounded-full h-2 mb-4">
                            <div
                                className={`h-2 rounded-full transition-all ${accuracy > 70 ? 'bg-emerald-500' : 'bg-brand-500'}`}
                                style={{ width: `${accuracy}%` }}
                            ></div>
                        </div>
                        <p className="text-slate-300 text-sm italic">
                            "{accuracy > 80
                                ? "Excellent work. You successfully avoided the trap signals."
                                : accuracy > 50
                                    ? "You’re starting to recognize this trap earlier. Keep going."
                                    : "This pattern is tricky. Review the core rule and try again tomorrow."}"
                        </p>
                    </div>

                    <MasteryDisclosure />

                    <Link to="/app" className="block w-full bg-brand-600 text-white px-6 py-3.5 rounded-xl font-bold hover:bg-brand-500 shadow-lg shadow-brand-500/30 transition-all transform hover:-translate-y-0.5">
                        Return to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-dvh flex items-center justify-center">
            <div className="bg-slate-800/50 backdrop-blur-md p-4 sm:p-8 rounded-2xl shadow-2xl shadow-black/20 text-center max-w-md w-full border border-slate-700 max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 font-display">Quiz Completed!</h2>
                <p className="text-lg sm:text-xl text-slate-300 mb-6">You scored <span className="font-bold text-brand-400">{score} / {totalQuestions}</span></p>

                <MasteryDisclosure />

                {/* Thinking Trap Suggestion Logic */}
                {(() => {
                    // Logic: Find first pattern with >= 2 misses
                    if (location.state?.mode === 'trap') return null; // Don't suggest while already in a trap session

                    const traps = Array.from(sessionTraps.values());
                    // Sort by count desc
                    traps.sort((a, b) => b.count - a.count);
                    const topTrap = traps[0];

                    // THRESHOLD: >= 2 misses to trigger suggestion
                    if (topTrap && topTrap.count >= 2) {
                        // COOLDOWN CHECK
                        const STORAGE_KEY = 'exam_coach_suggestion_history';
                        const COOLDOWN_HOURS = 4;

                        try {
                            const historyStr = localStorage.getItem(STORAGE_KEY);
                            if (historyStr) {
                                const history = JSON.parse(historyStr);
                                const lastId = history.patternId;
                                const lastTime = history.timestamp;
                                const now = Date.now();

                                // If same pattern and within cooldown window, SUPPRESS
                                if (lastId === topTrap.pattern.pattern_id && (now - lastTime) < (COOLDOWN_HOURS * 60 * 60 * 1000)) {
                                    console.log("Suppressing suggestion due to cooldown:", topTrap.pattern.pattern_name);
                                    return null;
                                }
                            }

                            // valid suggestion, save to history (side effect in render is bad practice usually, but for this simple key update it's acceptable vs useEffect complexity)
                            // Better: We should ideally do this in a useEffect, but to keep the architecture simple for this MVP polish:
                            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                                patternId: topTrap.pattern.pattern_id,
                                timestamp: Date.now()
                            }));

                        } catch (e) {
                            console.error("Error reading suggestion history", e);
                        }

                        return (
                            <div className="mb-8 bg-indigo-900/30 border border-indigo-500/30 rounded-xl p-6 relative overflow-hidden group">
                                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                                <div className="flex items-start gap-3 text-left">
                                    <div className="bg-indigo-500/20 p-2 rounded-lg text-indigo-300"><ShieldCheck className="h-5 w-5" strokeWidth={1.75} /></div>
                                    <div>
                                        <h4 className="text-indigo-200 font-bold text-sm uppercase tracking-wide mb-1">
                                            Suggested Thinking Trap
                                        </h4>
                                        <h3 className="text-white font-bold text-lg mb-2">
                                            {topTrap.pattern.pattern_name}
                                        </h3>
                                        <p className="text-indigo-200/80 text-sm mb-4">
                                            This pattern may be worth practicing next.
                                        </p>

                                        <button
                                            onClick={() => {
                                                if (isPro) {
                                                    navigate('/app/quiz', {
                                                        state: {
                                                            mode: 'trap',
                                                            patternId: topTrap.pattern.pattern_id,
                                                            patternName: topTrap.pattern.pattern_name,
                                                            domainTags: topTrap.pattern.domain_tags
                                                        }
                                                    });
                                                } else {
                                                    onUpsell();
                                                }
                                            }}
                                            className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 text-sm"
                                        >
                                            {isPro ? "[ Practice This Trap ]" : "[ Unlock Trap Mastery ]"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    }
                    return null;
                })()}

                <Link to="/app" className="inline-block bg-brand-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-brand-500 shadow-lg shadow-brand-500/30 transition-all transform hover:-translate-y-0.5">
                    Return to Dashboard
                </Link>
            </div>
        </div>
    );
}
