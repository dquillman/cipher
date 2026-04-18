
import { useState, useEffect } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useAuth } from '../App';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useExam } from '../contexts/ExamContext';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Zap, ArrowRight, X } from 'lucide-react';
import { type PatternData } from './PatternInsightCard';


export default function ThinkingTrapsCard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { checkPermission } = useSubscription();
    const { selectedExamId } = useExam();
    const [patterns, setPatterns] = useState<PatternData[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showProModal, setShowProModal] = useState(false);

    useEffect(() => {
        if (!user) return;

        // Skip fetch if traps are suppressed (post-reset state)
        const isSuppressed = localStorage.getItem('exam_coach_traps_suppressed') === 'true';
        if (isSuppressed) {
            setPatterns([]);
            setLoading(false);
            return;
        }

        const fetchPatterns = async () => {
            try {
                const functions = getFunctions();
                const getWeakest = httpsCallable(functions, 'getWeakestPatterns');
                const result = await getWeakest({ examId: selectedExamId });
                const data = result.data as PatternData[];
                setPatterns(data.filter(p => p.times_missed >= 2).slice(0, 3));
            } catch (err) {
                console.error("Failed to fetch traps:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchPatterns();
    }, [user, selectedExamId]);

    const handleReviewClick = () => {
        if (checkPermission('analytics')) {
            setShowProModal(true);
        } else {
            setShowModal(true);
        }
    };

    if (loading) {
        // ...
        return (
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 animate-pulse h-64">
                <div className="h-6 bg-slate-700 rounded w-1/2 mb-4"></div>
                <div className="space-y-2">
                    <div className="h-4 bg-slate-700/50 rounded w-full"></div>
                    <div className="h-4 bg-slate-700/50 rounded w-3/4"></div>
                </div>
            </div>
        );
    }

    // ...

    return (
        <>
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl relative overflow-hidden flex flex-col h-full">
                {/* Header */}
                <div className="mb-4">
                    {/* ... */}
                    <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                        🧠 Your Thinking Traps
                    </h3>
                    <p className="text-slate-400 text-sm">
                        These are the exam patterns that keep catching you off guard.
                    </p>
                </div>

                {/* Body */}
                <div className="flex-1">
                    {/* ... */}
                    <p className="text-slate-300 text-sm mb-4 font-medium">
                        You’ve missed questions tied to these patterns more than once:
                    </p>

                    {patterns.length > 0 ? (
                        <div className="space-y-3 mb-6">
                            {patterns.map(p => (
                                <div key={p.pattern_id} className="p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-white font-medium text-sm truncate pr-2">
                                            {p.pattern_name}
                                        </span>
                                        {p.mastery_score < 50 ? (
                                            <span className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" title="High Risk" />
                                        ) : (
                                            <span className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" title="Medium Risk" />
                                        )}
                                    </div>
                                    <button
                                        onClick={() => navigate('/app/quiz', {
                                            state: {
                                                mode: 'trap-drill',
                                                patternId: p.pattern_id,
                                                patternName: p.pattern_name,
                                                domainTags: p.domain_tags,
                                                masteryScore: p.mastery_score,
                                                examId: selectedExamId
                                            }
                                        })}
                                        className="w-full py-1.5 text-xs font-semibold text-brand-400 hover:text-white bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/20 rounded-lg transition-colors"
                                    >
                                        Start 5-Question Drill
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-4 bg-slate-900/30 rounded-lg border border-slate-700/30 text-center mb-6">
                            <p className="text-slate-400 text-sm italic">
                                No thinking traps detected yet. We'll highlight patterns once you answer more questions.
                            </p>
                        </div>
                    )}
                </div>

                {/* CTA */}
                <button
                    onClick={handleReviewClick}
                    disabled={patterns.length === 0}
                    className="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl shadow-lg shadow-brand-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    Review These Traps <ArrowRight className="w-4 h-4" />
                </button>

                {/* Reinforcement Memory Display */}
                {(() => {
                    const MEMORY_KEY = 'exam_coach_reinforcement';
                    try {
                        const memoryStr = localStorage.getItem(MEMORY_KEY);
                        if (memoryStr) {
                            const memory = JSON.parse(memoryStr);
                            const age = Date.now() - memory.timestamp;

                            // Only show if < 24 hours
                            if (age < 24 * 60 * 60 * 1000) {
                                return (
                                    <div className="mt-4 text-center animate-in fade-in duration-700">
                                        <p className="text-slate-500 text-xs italic">
                                            "{memory.message}"
                                        </p>
                                    </div>
                                );
                            }
                        }
                    } catch (e) {
                        // ignore errors logic
                    }
                    return null;
                })()}

            </div>

            {/* FREE USER MODAL */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-800 rounded-2xl max-w-md w-full border border-slate-700 shadow-2xl overflow-hidden relative animate-in fade-in zoom-in duration-200">
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-white"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <div className="p-8 text-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-500/20 rotate-3">
                                <Lock className="w-8 h-8 text-white" />
                            </div>

                            <h2 className="text-2xl font-bold text-white mb-3">Unlock Thinking Trap Mastery</h2>

                            <p className="text-slate-300 mb-8 leading-relaxed">
                                See why these traps keep appearing, how PMI designs them, and how to avoid them in 5 seconds or less.
                            </p>

                            <Link
                                to="/app/pricing"
                                className="block w-full py-3.5 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl shadow-lg shadow-brand-500/25 transition-all transform hover:-translate-y-0.5"
                            >
                                Upgrade to Unlock
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* PRO USER MODAL (REVIEW MODE PLACEHOLDER) */}
            {showProModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                    <div className="bg-slate-900 rounded-2xl max-w-2xl w-full border border-slate-700 shadow-2xl overflow-hidden relative animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
                            <div>
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    🛡️ Trap Review Mode
                                </h2>
                                <p className="text-slate-400 text-xs mt-1">
                                    Master your weakest patterns.
                                </p>
                            </div>
                            <button
                                onClick={() => setShowProModal(false)}
                                className="text-slate-400 hover:text-white bg-slate-800 p-2 rounded-lg hover:bg-slate-700 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-6">
                            {patterns.map(p => (
                                <div key={p.pattern_id} className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-lg font-bold text-white">{p.pattern_name}</h3>
                                        <span className={`text-xs font-bold px-2 py-1 rounded border ${p.mastery_score < 50 ? 'border-red-500/30 text-red-400 bg-red-500/10' : 'border-amber-500/30 text-amber-400 bg-amber-500/10'}`}>
                                            Score: {p.mastery_score}
                                        </span>
                                    </div>

                                    <div className="mb-4">
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Core Rule</p>
                                        <p className="text-slate-300 text-sm leading-relaxed">{p.core_rule}</p>
                                    </div>

                                    <div className="bg-indigo-900/20 border border-indigo-500/20 rounded-lg p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Zap className="w-4 h-4 text-amber-400" />
                                            <span className="text-sm font-bold text-indigo-300">5-Second Heuristic</span>
                                        </div>
                                        <p className="text-indigo-100 text-sm font-medium">
                                            {p.five_second_heuristic || "No heuristic available."}
                                        </p>
                                    </div>

                                    <button
                                        onClick={() => {
                                            setShowProModal(false);
                                            navigate('/app/quiz', {
                                                state: {
                                                    mode: 'trap',
                                                    patternId: p.pattern_id,
                                                    patternName: p.pattern_name,
                                                    domainTags: p.domain_tags,
                                                    masteryScore: p.mastery_score // PASS SCORE FOR ADAPTATION
                                                }
                                            });
                                        }}
                                        className="w-full mt-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-lg shadow-lg shadow-brand-500/20 transition-all flex items-center justify-center gap-2 text-sm"
                                    >
                                        [ Practice This Trap ]
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
