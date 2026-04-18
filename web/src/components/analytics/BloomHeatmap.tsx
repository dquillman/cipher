import { useEffect, useState } from 'react';
import { Brain, Info } from 'lucide-react';
import { auth } from '../../firebase';
import { BLOOM_LEVELS, BLOOM_DESCRIPTIONS } from '../../types/Bloom';
import { fetchBloomTrend, type BloomStatLine } from '../../services/bloomTrendService';

interface Props {
    examId: string | null;
}

export default function BloomHeatmap({ examId }: Props) {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<BloomStatLine[]>(
        BLOOM_LEVELS.map(level => ({ level, correct: 0, total: 0, score: 0 }))
    );
    const [untagged, setUntagged] = useState(0);
    const [totalAnswered, setTotalAnswered] = useState(0);
    const [showTooltip, setShowTooltip] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const uid = auth.currentUser?.uid;
        if (!uid || !examId) return;
        setLoading(true);
        setError(null);
        fetchBloomTrend(uid, examId)
            .then(res => {
                setStats(res.stats);
                setUntagged(res.untagged);
                setTotalAnswered(res.totalAnswered);
            })
            .catch(err => {
                console.error('BloomHeatmap: failed to load', err);
                setError('Could not load Bloom statistics.');
            })
            .finally(() => setLoading(false));
    }, [examId]);

    const hasData = stats.some(s => s.total > 0);
    const weakest = stats
        .filter(s => s.total >= 5)
        .sort((a, b) => a.score - b.score)[0];
    const showGap = weakest && weakest.score < 75;

    return (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-4 md:p-6 h-full flex flex-col">
            <div className="flex items-start justify-between gap-4 mb-1 flex-col sm:flex-row">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                        <Brain className="w-4 h-4" />
                    </div>
                    <h3 className="text-lg md:text-xl font-bold text-white font-display">
                        Bloom's Taxonomy Heatmap
                    </h3>
                    <div className="relative">
                        <button
                            onClick={() => setShowTooltip(!showTooltip)}
                            onMouseEnter={() => setShowTooltip(true)}
                            onMouseLeave={() => setShowTooltip(false)}
                            className="text-slate-500 hover:text-slate-300 transition-colors"
                            aria-label="Bloom's Taxonomy info"
                        >
                            <Info className="w-4 h-4" />
                        </button>
                        {showTooltip && (
                            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-72 bg-slate-900 border border-slate-600 rounded-lg p-3 text-xs text-slate-300 leading-relaxed shadow-xl z-10">
                                Every CIPHER question is tagged with its Bloom's level — the type of thinking it demands. This heatmap shows your lifetime accuracy per level so you can see <em>where</em> your gap is.
                                <div className="absolute left-1/2 -translate-x-1/2 top-full w-2 h-2 bg-slate-900 border-r border-b border-slate-600 rotate-45 -mt-1"></div>
                            </div>
                        )}
                    </div>
                </div>
                {showGap && (
                    <div className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300">
                        <span className="font-semibold">Biggest gap:</span> {weakest.level} ({weakest.score}%)
                    </div>
                )}
            </div>
            <p className="text-sm text-slate-400 leading-relaxed mb-6">
                Your lifetime accuracy by Bloom's Taxonomy level — the type of thinking each question demands.
            </p>

            {loading ? (
                <div className="flex items-center justify-center py-10">
                    <div className="h-4 w-4 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
                    <span className="ml-3 text-sm text-slate-400">Loading Bloom data…</span>
                </div>
            ) : error ? (
                <p className="text-sm text-red-400">{error}</p>
            ) : !hasData ? (
                <div className="flex flex-col items-center justify-center py-10 text-center bg-slate-800/30 rounded-xl border border-slate-700/50">
                    <Brain className="w-8 h-8 text-slate-600 mb-3" />
                    <p className="text-sm text-slate-500 mb-2">
                        Complete a few quizzes to build your Bloom's profile.
                    </p>
                </div>
            ) : (
                <>
                    <div className="space-y-3">
                        {stats.map(b => {
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
                                            <span className="text-slate-400 text-xs">
                                                {b.correct}/{b.total}
                                            </span>
                                            <span className="text-white font-semibold tabular-nums">
                                                {hasQuestions ? `${b.score}%` : '—'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-500"
                                            style={{
                                                width: hasQuestions ? `${b.score}%` : '0%',
                                                backgroundColor: barColor,
                                            }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <p className="text-xs text-slate-500 mt-5">
                        Based on {totalAnswered.toLocaleString()} answered question{totalAnswered === 1 ? '' : 's'}
                        {untagged > 0 && ` — ${untagged} unclassified`}.
                    </p>
                </>
            )}
        </div>
    );
}
