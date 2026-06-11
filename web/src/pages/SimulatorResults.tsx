
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, RotateCcw, LayoutDashboard, Clock, Info, Brain } from 'lucide-react';
import { useEffect, useState } from 'react';
import { auth } from '../firebase';
import { useExam } from '../contexts/ExamContext';
import { PredictionEngine, type DomainReadiness } from '../services/PredictionEngine';
import { BLOOM_LEVELS, BLOOM_DESCRIPTIONS, type BloomLevel } from '../types/Bloom';

interface BloomStat {
    level: BloomLevel;
    correct: number;
    total: number;
    score: number; // 0-100, undefined semantics if total === 0
}

export default function SimulatorResults() {
    const location = useLocation();
    const navigate = useNavigate();
    const { score, total, timeSpent, questions, answers_map, flagged = {} } = location.state || {}; // answers_map is index->optionIndex

    const { selectedExamId, examDomains } = useExam();
    const [domainStats, setDomainStats] = useState<any[]>([]);
    const [bloomStats, setBloomStats] = useState<BloomStat[]>([]);
    const [untaggedCount, setUntaggedCount] = useState(0);
    const [overallDomains, setOverallDomains] = useState<DomainReadiness[]>([]);
    const [showTooltip, setShowTooltip] = useState(false);
    const [showBloomTooltip, setShowBloomTooltip] = useState(false);
    const [filter, setFilter] = useState<'all' | 'correct' | 'wrong' | 'flagged' | 'unanswered'>('all');

    useEffect(() => {
        if (!questions) {
            navigate('/simulator');
            return;
        }

        // Calculate Domain Performance
        const domains: Record<string, { correct: number, total: number }> = {};

        questions.forEach((q: any, idx: number) => {
            const domain = q.domain || 'General';
            const isCorrect = answers_map[idx] === q.correctAnswer;

            if (!domains[domain]) domains[domain] = { correct: 0, total: 0 };
            domains[domain].total++;
            if (isCorrect) domains[domain].correct++;
        });

        const stats = Object.entries(domains).map(([name, data]) => ({
            name,
            score: Math.round((data.correct / data.total) * 100),
            correct: data.correct,
            total: data.total
        }));

        setDomainStats(stats);

        // Calculate Bloom's level performance (Cognitive Heatmap)
        const blooms: Record<BloomLevel, { correct: number, total: number }> = {
            Remember: { correct: 0, total: 0 },
            Understand: { correct: 0, total: 0 },
            Apply: { correct: 0, total: 0 },
            Analyze: { correct: 0, total: 0 },
            Evaluate: { correct: 0, total: 0 },
            Create: { correct: 0, total: 0 },
        };
        let untagged = 0;
        questions.forEach((q: any, idx: number) => {
            const level = q.bloomLevel as BloomLevel | undefined;
            if (!level || !BLOOM_LEVELS.includes(level)) { untagged++; return; }
            const isCorrect = answers_map[idx] === q.correctAnswer;
            blooms[level].total++;
            if (isCorrect) blooms[level].correct++;
        });

        const bStats: BloomStat[] = BLOOM_LEVELS.map(level => ({
            level,
            correct: blooms[level].correct,
            total: blooms[level].total,
            score: blooms[level].total > 0
                ? Math.round((blooms[level].correct / blooms[level].total) * 100)
                : 0,
        }));

        setBloomStats(bStats);
        setUntaggedCount(untagged);
    }, [questions]);

    // Fetch overall trend from PredictionEngine
    useEffect(() => {
        const user = auth.currentUser;
        if (!user || !selectedExamId) return;
        PredictionEngine.calculateReadiness(user.uid, selectedExamId, examDomains).then(report => {
            setOverallDomains(report.domainBreakdown.filter(d => d.status !== 'Insufficient'));
        }).catch(() => {});
    }, [selectedExamId]);

    if (!questions) return null;

    const percentage = Math.round((score / total) * 100);
    const passed = percentage >= 70;

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}m ${s}s`;
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8 font-sans">
            <div className="max-w-5xl mx-auto w-full">

                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-2xl sm:text-3xl font-bold text-white font-display mb-2">Exam Results</h1>
                    <p className="text-slate-400">Here is how you performed on this simulation.</p>
                </div>

                {/* Readiness Banner */}
                {percentage >= 65 ? (
                    <div className="rounded-lg p-4 mb-8 bg-emerald-900/40 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                            <p className="text-sm text-emerald-300 font-semibold">You're on track to pass the real exam.</p>
                            <p className="text-xs text-emerald-400/70 mt-1">Focus on your weaker domains and take another simulator to confirm.</p>
                        </div>
                        <button
                            onClick={() => navigate('/app/simulator')}
                            className="shrink-0 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors"
                        >
                            Take Another Simulator
                        </button>
                    </div>
                ) : percentage >= 55 ? (
                    <div className="rounded-lg p-4 mb-8 bg-amber-900/40 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                            <p className="text-sm text-amber-300 font-semibold">You're close.</p>
                            <p className="text-xs text-amber-400/70 mt-1">With a little more practice you should be ready soon. Focus on weak domains first.</p>
                        </div>
                        <button
                            onClick={() => navigate('/app/quiz')}
                            className="shrink-0 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold transition-colors"
                        >
                            Practice Weak Domains
                        </button>
                    </div>
                ) : (
                    <div className="rounded-lg p-4 mb-8 bg-slate-800 border border-slate-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                            <p className="text-sm text-slate-300 font-semibold">Keep going.</p>
                            <p className="text-xs text-slate-400 mt-1">You're building the knowledge foundation needed to pass. Keep practicing.</p>
                        </div>
                        <button
                            onClick={() => navigate('/app/quiz')}
                            className="shrink-0 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors"
                        >
                            Start Smart Practice
                        </button>
                    </div>
                )}

                {/* Score Card */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 mb-8 md:mb-12">
                    <div className="col-span-1 md:col-span-1 bg-slate-800 border border-slate-700 rounded-2xl p-4 md:p-8 flex flex-col items-center justify-center relative overflow-hidden">
                        <div className={`absolute top-0 w-full h-2 ${passed ? 'bg-emerald-500' : 'bg-red-500'}`}></div>

                        <div className="w-32 h-32 md:w-40 md:h-40 mb-4 md:mb-6">
                            {/* Two-segment results ring (correct = emerald over incorrect = red).
                                Plain SVG — replaced the chart.js Doughnut, which was this
                                library's only usage in the app. */}
                            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90" role="img" aria-label={`${score} of ${total} correct`}>
                                <circle cx="50" cy="50" r="42.5" fill="none" stroke="#EF4444" strokeWidth="15" />
                                <circle
                                    cx="50" cy="50" r="42.5" fill="none" stroke="#10B981" strokeWidth="15"
                                    strokeDasharray={`${(score / total) * 2 * Math.PI * 42.5} ${2 * Math.PI * 42.5}`}
                                />
                            </svg>
                        </div>

                        <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2">{percentage}%</div>
                        <div className={`text-lg font-bold px-4 py-1 rounded-full ${passed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-500'
                            }`}>
                            {passed ? 'PASSED' : 'FAILED'}
                        </div>
                    </div>

                    <div className="col-span-1 md:col-span-2 space-y-6">
                        {/* Summary Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-slate-800/50 p-4 md:p-6 rounded-xl border border-slate-700 flex items-center gap-3 md:gap-4">
                                <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                                    <CheckCircle className="w-5 h-5 md:w-6 md:h-6" />
                                </div>
                                <div>
                                    <p className="text-slate-400 text-xs md:text-sm">Score</p>
                                    <p className="text-xl md:text-2xl font-bold text-white">{score} <span className="text-slate-500 text-sm md:text-base">/ {total}</span></p>
                                </div>
                            </div>
                            <div className="bg-slate-800/50 p-4 md:p-6 rounded-xl border border-slate-700 flex items-center gap-3 md:gap-4">
                                <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-pink-500/20 flex items-center justify-center text-pink-400">
                                    <Clock className="w-5 h-5 md:w-6 md:h-6" />
                                </div>
                                <div>
                                    <p className="text-slate-400 text-xs md:text-sm">Time Taken</p>
                                    <p className="text-xl md:text-2xl font-bold text-white">{formatTime(timeSpent)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Domain Breakdown */}
                        <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
                            {/* This Exam Performance */}
                            <div className="flex items-center gap-2 mb-4">
                                <h3 className="font-bold text-white">This Exam Performance</h3>
                                <div className="relative">
                                    <button
                                        onClick={() => setShowTooltip(!showTooltip)}
                                        onMouseEnter={() => setShowTooltip(true)}
                                        onMouseLeave={() => setShowTooltip(false)}
                                        className="text-slate-500 hover:text-slate-300 transition-colors"
                                        aria-label="Domain ranking info"
                                    >
                                        <Info className="w-4 h-4" />
                                    </button>
                                    {showTooltip && (
                                        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 bg-slate-900 border border-slate-600 rounded-lg p-3 text-xs text-slate-300 leading-relaxed shadow-xl z-10">
                                            This section shows your performance on this exam.<br />Overall Trend reflects long-term performance across attempts.
                                            <div className="absolute left-1/2 -translate-x-1/2 top-full w-2 h-2 bg-slate-900 border-r border-b border-slate-600 rotate-45 -mt-1"></div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-4">
                                {domainStats.map((stat, idx) => (
                                    <div key={idx}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-slate-300">{stat.name}</span>
                                            <span className="font-bold text-white">{stat.score}%</span>
                                        </div>
                                        <div className="w-full bg-slate-700 rounded-full h-4 border border-slate-600/50 overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(0,0,0,0.2)]"
                                                style={{
                                                    width: `${stat.score}%`,
                                                    backgroundColor: `hsl(${Math.min(stat.score * 1.2, 120)}, 85%, 45%)`
                                                }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Overall Trend */}
                            {overallDomains.length > 0 && (
                                <>
                                    <div className="border-t border-slate-700/60 my-6"></div>
                                    <h3 className="font-bold text-slate-400 text-sm uppercase tracking-wider mb-4">Overall Trend</h3>
                                    <div className="space-y-3">
                                        {overallDomains.map((d) => (
                                            <div key={d.domain}>
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span className="text-slate-400">{d.domain}</span>
                                                    <span className="font-medium text-slate-300">{d.score}%</span>
                                                </div>
                                                <div className="w-full bg-slate-700/50 rounded-full h-2.5 overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full transition-all duration-500"
                                                        style={{
                                                            width: `${d.score}%`,
                                                            backgroundColor: `hsl(${Math.min(d.score * 1.2, 120)}, 60%, 40%)`
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Cognitive Heatmap — per-Bloom-level accuracy */}
                {bloomStats.some(b => b.total > 0) && (
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 mb-8">
                        <div className="flex items-start justify-between gap-4 mb-1 flex-col sm:flex-row">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                                    <Brain className="w-4 h-4" />
                                </div>
                                <h3 className="font-bold text-white">Cognitive Heatmap</h3>
                                <div className="relative">
                                    <button
                                        onClick={() => setShowBloomTooltip(!showBloomTooltip)}
                                        onMouseEnter={() => setShowBloomTooltip(true)}
                                        onMouseLeave={() => setShowBloomTooltip(false)}
                                        className="text-slate-500 hover:text-slate-300 transition-colors"
                                        aria-label="Bloom's Taxonomy info"
                                    >
                                        <Info className="w-4 h-4" />
                                    </button>
                                    {showBloomTooltip && (
                                        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-72 bg-slate-900 border border-slate-600 rounded-lg p-3 text-xs text-slate-300 leading-relaxed shadow-xl z-10">
                                            Every CIPHER question is tagged with its Bloom's level — the type of thinking it demands. Use this to see <em>where</em> your gap is, not just <em>what</em> you got wrong.
                                            <div className="absolute left-1/2 -translate-x-1/2 top-full w-2 h-2 bg-slate-900 border-r border-b border-slate-600 rotate-45 -mt-1"></div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {(() => {
                                const weakest = bloomStats
                                    .filter(b => b.total >= 2)
                                    .sort((a, b) => a.score - b.score)[0];
                                if (!weakest || weakest.score >= 75) return null;
                                return (
                                    <div className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300">
                                        <span className="font-semibold">Biggest gap:</span> {weakest.level} ({weakest.score}%)
                                    </div>
                                );
                            })()}
                        </div>
                        <p className="text-xs text-slate-400 mb-5">Your accuracy by Bloom's Taxonomy level — the type of thinking each question demands.</p>

                        <div className="space-y-3">
                            {bloomStats.map((b) => {
                                const hasQuestions = b.total > 0;
                                const barColor = hasQuestions
                                    ? `hsl(${Math.min(b.score * 1.2, 120)}, 85%, 45%)`
                                    : 'transparent';
                                return (
                                    <div key={b.level} className={hasQuestions ? '' : 'opacity-40'}>
                                        <div className="flex justify-between items-baseline text-sm mb-1 gap-4">
                                            <div className="flex items-baseline gap-2 min-w-0">
                                                <span className="text-slate-200 font-medium">{b.level}</span>
                                                <span className="text-xs text-slate-500 truncate hidden sm:inline">
                                                    {BLOOM_DESCRIPTIONS[b.level]}
                                                </span>
                                            </div>
                                            <div className="flex items-baseline gap-2 shrink-0">
                                                <span className="text-xs text-slate-500">
                                                    {hasQuestions ? `${b.correct}/${b.total}` : 'no questions'}
                                                </span>
                                                {hasQuestions && (
                                                    <span className="font-bold text-white tabular-nums w-10 text-right">{b.score}%</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="w-full bg-slate-700 rounded-full h-3 border border-slate-600/50 overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-500"
                                                style={{
                                                    width: hasQuestions ? `${b.score}%` : '0%',
                                                    backgroundColor: barColor,
                                                }}
                                            ></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {untaggedCount > 0 && (
                            <p className="text-xs text-slate-500 mt-4">
                                {untaggedCount} question{untaggedCount === 1 ? '' : 's'} not yet tagged with a cognitive level.
                            </p>
                        )}
                    </div>
                )}

                {/* Review Section */}
                <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden mb-12">
                    <div className="p-6 border-b border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <h3 className="text-xl font-bold text-white">Review Answers</h3>

                        <div className="flex flex-wrap gap-1.5 md:gap-2">
                            <button
                                onClick={() => setFilter('all')}
                                className={`px-2 py-1 md:px-3 md:py-1.5 rounded-lg text-xs md:text-sm font-medium transition-colors ${filter === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                            >
                                All ({questions.length})
                            </button>
                            <button
                                onClick={() => setFilter('correct')}
                                className={`px-2 py-1 md:px-3 md:py-1.5 rounded-lg text-xs md:text-sm font-medium transition-colors ${filter === 'correct' ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                            >
                                Correct ({questions.filter((q: any, i: number) => answers_map[i] === q.correctAnswer).length})
                            </button>
                            <button
                                onClick={() => setFilter('wrong')}
                                className={`px-2 py-1 md:px-3 md:py-1.5 rounded-lg text-xs md:text-sm font-medium transition-colors ${filter === 'wrong' ? 'bg-red-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                            >
                                Wrong ({questions.filter((q: any, i: number) => answers_map[i] !== undefined && answers_map[i] !== q.correctAnswer).length})
                            </button>
                            <button
                                onClick={() => setFilter('flagged')}
                                className={`px-2 py-1 md:px-3 md:py-1.5 rounded-lg text-xs md:text-sm font-medium transition-colors ${filter === 'flagged' ? 'bg-amber-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                            >
                                Flagged ({Object.values(flagged).filter(Boolean).length})
                            </button>
                            <button
                                onClick={() => setFilter('unanswered')}
                                className={`px-2 py-1 md:px-3 md:py-1.5 rounded-lg text-xs md:text-sm font-medium transition-colors ${filter === 'unanswered' ? 'bg-slate-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                            >
                                Unanswered ({questions.filter((_: any, i: number) => answers_map[i] === undefined).length})
                            </button>
                        </div>
                    </div>
                    <div className="divide-y divide-slate-700">
                        {questions.map((q: any, idx: number) => {
                            const userAnswer = answers_map[idx];
                            const isCorrect = userAnswer === q.correctAnswer;
                            const isFlagged = flagged[idx];
                            const isUnanswered = userAnswer === undefined;

                            // Filter Logic
                            if (filter === 'correct' && !isCorrect) return null;
                            if (filter === 'wrong' && (isCorrect || isUnanswered)) return null;
                            if (filter === 'flagged' && !isFlagged) return null;
                            if (filter === 'unanswered' && !isUnanswered) return null;

                            return (
                                <div key={q.id} className="p-6 hover:bg-slate-700/30 transition-colors">
                                    <div className="flex gap-4">
                                        <div className="mt-1 flex flex-col gap-2 items-center">
                                            {isCorrect ? (
                                                <CheckCircle className="w-6 h-6 text-emerald-500" />
                                            ) : isUnanswered ? (
                                                <div className="w-6 h-6 rounded-full border-2 border-slate-600 flex items-center justify-center text-slate-500 text-xs font-bold">?</div>
                                            ) : (
                                                <XCircle className="w-6 h-6 text-red-500" />
                                            )}
                                            {isFlagged && (
                                                <div title="Flagged for review" className="text-amber-500">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                <span className="text-sm font-mono text-slate-500">Q{idx + 1}</span>
                                                <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-700 text-slate-300 border border-slate-600">
                                                    {q.domain}
                                                </span>
                                                {q.bloomLevel && BLOOM_LEVELS.includes(q.bloomLevel) && (
                                                    <span
                                                        title={`Bloom's Taxonomy: ${BLOOM_DESCRIPTIONS[q.bloomLevel as BloomLevel]}`}
                                                        className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 flex items-center gap-1"
                                                    >
                                                        <Brain className="w-3 h-3" />
                                                        Bloom: {q.bloomLevel}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-lg text-white font-medium mb-4">{q.stem}</p>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                {q.options.map((opt: string, optIdx: number) => {
                                                    let borderClass = 'border-slate-700 bg-slate-800/50';
                                                    let textClass = 'text-slate-400';
                                                    let icon = null;

                                                    if (optIdx === q.correctAnswer) {
                                                        borderClass = 'border-emerald-500/50 bg-emerald-500/10';
                                                        textClass = 'text-emerald-400 font-bold';
                                                        icon = <CheckCircle className="w-4 h-4 ml-auto" />;
                                                    } else if (optIdx === userAnswer && !isCorrect) {
                                                        borderClass = 'border-red-500/50 bg-red-500/10';
                                                        textClass = 'text-red-400 line-through';
                                                        icon = <XCircle className="w-4 h-4 ml-auto" />;
                                                    }

                                                    return (
                                                        <div key={optIdx} className={`p-3 rounded-lg border flex items-center ${borderClass} ${textClass}`}>
                                                            {opt}
                                                            {icon}
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50 text-slate-300 text-sm leading-relaxed">
                                                <strong className="text-indigo-400 block mb-1">Explanation:</strong>
                                                {q.explanation}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 pb-12">
                    <button
                        onClick={() => navigate('/simulator')}
                        className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-slate-800 text-white font-bold hover:bg-slate-700 transition-colors w-full sm:w-auto"
                    >
                        <RotateCcw className="w-5 h-5" />
                        Take Another Exam
                    </button>
                    <button
                        onClick={() => navigate('/app')}
                        className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/20 w-full sm:w-auto"
                    >
                        <LayoutDashboard className="w-5 h-5" />
                        Back to Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
}
