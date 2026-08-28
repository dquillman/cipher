import DashboardLink from '../components/DashboardLink';
import SpeedAccuracyChart from '../components/analytics/SpeedAccuracyChart';
import RollingTrendChart from '../components/analytics/RollingTrendChart';
import UsageHeatmap from '../components/analytics/UsageHeatmap';
import BloomHeatmap from '../components/analytics/BloomHeatmap';
import { useSubscription } from '../contexts/SubscriptionContext';
import { Lock, TrendingUp, TrendingDown, Minus, BarChart2 } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useExam } from '../contexts/ExamContext';
import { useEffect, useState, useMemo } from 'react';
import { auth, db } from '../firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import {
    PerformanceTrendService,
    type OverallTrendResult,
    type DomainTrendResult,
} from '../services/performanceTrendService';

const DOMAIN_COLOR_PALETTE = ['#a78bfa', '#34d399', '#f59e0b', '#f472b6', '#60a5fa', '#fb923c'];

function DirectionBadge({ direction }: { direction: 'improving' | 'declining' | 'stable' }) {
    if (direction === 'improving') {
        return (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                <TrendingUp className="w-3.5 h-3.5" /> Improving
            </span>
        );
    }
    if (direction === 'declining') {
        return (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-full">
                <TrendingDown className="w-3.5 h-3.5" /> Declining
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 bg-slate-500/10 border border-slate-500/20 px-2.5 py-1 rounded-full">
            <Minus className="w-3.5 h-3.5" /> Stable
        </span>
    );
}

function EmptyChartState({ message, minHeight = 160 }: { message: string; minHeight?: number }) {
    return (
        <div className="flex flex-col items-center justify-center py-8 text-center bg-slate-800/30 rounded-xl border border-slate-700/50" style={{ minHeight }}>
            <BarChart2 className="w-8 h-8 text-slate-600 mb-3" />
            <p className="text-sm text-slate-500 mb-2">{message}</p>
            <Link to="/app/quiz" className="text-xs text-brand-400 hover:text-brand-300 font-medium transition-colors inline-flex items-center min-h-[44px] px-3">
                Start practicing &rarr;
            </Link>
        </div>
    );
}

export default function Stats() {
    const { checkPermission } = useSubscription();
    const { selectedExamId, examName, examDomains } = useExam();
    const navigate = useNavigate();
    const domains = examDomains.length > 0 ? examDomains : [];
    const domainColors = useMemo(() => {
        const colors: Record<string, string> = {};
        domains.forEach((d, i) => { colors[d] = DOMAIN_COLOR_PALETTE[i % DOMAIN_COLOR_PALETTE.length]; });
        return colors;
    }, [domains]);

    const [overallTrend, setOverallTrend] = useState<OverallTrendResult | null>(null);
    const [domainTrends, setDomainTrends] = useState<DomainTrendResult[]>([]);
    const [quizScores, setQuizScores] = useState<{ completedAt: number; scorePercent: number }[]>([]);
    const [trendLoading, setTrendLoading] = useState(true);

    useEffect(() => {
        const uid = auth.currentUser?.uid;
        if (!uid || !selectedExamId) return;
        setTrendLoading(true);

        const fetchQuizScores = async () => {
            try {
                const runsRef = collection(db, 'quizRuns', uid, 'runs');
                let runs: any[] = [];
                try {
                    const q = query(
                        runsRef,
                        where('examId', '==', selectedExamId),
                        where('status', '==', 'completed'),
                        orderBy('completedAt', 'desc'),
                        limit(200)
                    );
                    const snap = await getDocs(q);
                    runs = snap.docs.map(d => d.data());
                } catch {
                    // Fallback if composite index missing
                    const fallbackQ = query(runsRef, where('status', '==', 'completed'), limit(500));
                    const snap = await getDocs(fallbackQ);
                    runs = snap.docs.map(d => d.data()).filter((r: any) => r.examId === selectedExamId);
                }

                const scores = runs
                    .filter((r: any) => r.mode !== 'diagnostic' && r.quizType !== 'diagnostic')
                    .map((r: any) => {
                        const totalQ = r.snapshot?.questionIds?.length || 0;
                        const answers = (r.answers || []).filter(
                            (a: any) => a?.selectedOption !== undefined
                        );
                        const correctCount = answers.filter(
                            (a: any) => a.isCorrect
                        ).length;
                        const ts = r.completedAt?.seconds
                            ? r.completedAt.seconds * 1000
                            : r.completedAt?.toMillis?.()
                                ? r.completedAt.toMillis()
                                : Date.now();
                        return {
                            completedAt: ts,
                            scorePercent: totalQ > 0
                                ? Math.round((correctCount / totalQ) * 100)
                                : 0,
                        };
                    });
                setQuizScores(scores);
            } catch (err) {
                console.error('Failed to fetch quiz scores for bars:', err);
            }
        };

        Promise.all([
            PerformanceTrendService.getRollingOverallTrend(uid, selectedExamId),
            PerformanceTrendService.getAllDomainTrends(uid, selectedExamId, domains),
            fetchQuizScores(),
        ]).then(([overall, domains]) => {
            setOverallTrend(overall);
            setDomainTrends(domains);
        }).catch(err => {
            console.error('Failed to load performance trends:', err);
        }).finally(() => {
            setTrendLoading(false);
        });
    }, [selectedExamId]);

    const isProGated = !checkPermission('analytics', selectedExamId);

    return (
        <div className="space-y-6 md:space-y-8 pb-8">
            <DashboardLink />

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white font-display">Your Statistics</h1>
                    {examName && <span className="text-sm font-bold text-indigo-400 uppercase tracking-wider mb-1 block">{examName}</span>}
                    <p className="text-slate-400 mt-1">Deep dive into your performance metrics.</p>
                </div>
            </div>

            {/* Usage Heatmap (EC-109) + Bloom's Heatmap — side by side on lg, stacked below */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <UsageHeatmap examId={selectedExamId} />

                <div className="relative">
                    <div className={isProGated ? 'blur-md pointer-events-none opacity-50 select-none h-full' : 'h-full'}>
                        <BloomHeatmap examId={selectedExamId} examDomains={examDomains} />
                    </div>
                    {isProGated && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                            <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mb-4 shadow-xl border border-slate-700">
                                <Lock className="w-6 h-6 text-brand-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Pro Feature</h3>
                            <p className="text-slate-300 mb-6 text-center max-w-sm">
                                Upgrade to unlock your lifetime Bloom's Taxonomy heatmap.
                            </p>
                            <button
                                onClick={() => navigate('/app/pricing')}
                                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 text-white font-bold py-2 px-6 rounded-lg shadow-lg hover:shadow-purple-500/25 transition-all"
                            >
                                Upgrade Now
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Rolling Performance Trend Section */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-4 md:p-6">
                <h3 className="text-lg md:text-xl font-bold text-white font-display mb-2">Performance Trend</h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-6">
                    Performance Trend reflects your rolling average across your most recent 50 questions. This smooths out single-quiz volatility and highlights consistent improvement over time.
                </p>

                <div className="relative">
                    <div className={isProGated ? 'blur-md pointer-events-none opacity-50 select-none' : ''}>
                        {/* Overall Trend */}
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Overall Rolling Trend</h4>
                                {!trendLoading && overallTrend && overallTrend.totalQuestions >= 10 && (
                                    <div className="flex items-center gap-3">
                                        <DirectionBadge direction={overallTrend.direction} />
                                        <span className="text-xs text-slate-500">{overallTrend.totalQuestions} questions</span>
                                    </div>
                                )}
                            </div>
                            {!trendLoading && (!overallTrend || (overallTrend.dataPoints?.length ?? 0) === 0) ? (
                                <EmptyChartState message="Complete a few quizzes to see your rolling performance trend" minHeight={300} />
                            ) : (
                                <RollingTrendChart
                                    data={overallTrend?.dataPoints ?? []}
                                    color="#10b981"
                                    height={300}
                                    loading={trendLoading}
                                    emptyMessage="Complete a few quizzes to see your rolling performance trend."
                                    quizScores={quizScores}
                                />
                            )}
                        </div>

                        {/* Domain Trends */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {domains.map(domain => {
                                const trend = domainTrends.find(d => d.domain === domain);
                                const color = domainColors[domain] || '#94a3b8';
                                const qCount = trend?.totalQuestions ?? 0;
                                const remaining = Math.max(0, 10 - qCount);
                                const hasEnoughData = qCount >= 10;
                                const emptyMsg = qCount > 0
                                    ? `${qCount} question${qCount === 1 ? '' : 's'} completed — ${remaining} more needed for trend (min 10).`
                                    : `No ${domain} data yet`;
                                return (
                                    <div key={domain} className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-sm font-bold text-slate-300">{domain}</h4>
                                            {!trendLoading && trend && hasEnoughData && (
                                                <DirectionBadge direction={trend.direction} />
                                            )}
                                        </div>
                                        {!trendLoading && trend && hasEnoughData && (
                                            <span className="text-xs text-slate-500">{qCount} questions</span>
                                        )}
                                        {!trendLoading && !hasEnoughData ? (
                                            <div className="flex flex-col items-center justify-center py-8 text-center bg-slate-800/30 rounded-xl border border-slate-700/50" style={{ minHeight: 160 }}>
                                                <BarChart2 className="w-8 h-8 text-slate-600 mb-3" />
                                                <p className="text-sm text-slate-500 mb-2">{emptyMsg}</p>
                                                <Link to="/app/quiz" className="text-xs text-brand-400 hover:text-brand-300 font-medium transition-colors inline-flex items-center min-h-[44px] px-3">
                                                    Start practicing &rarr;
                                                </Link>
                                            </div>
                                        ) : (
                                            <RollingTrendChart
                                                data={trend?.dataPoints ?? []}
                                                color={color}
                                                height={220}
                                                loading={trendLoading}
                                                compact
                                                emptyMessage={emptyMsg}
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Pro gate overlay */}
                    {isProGated && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                            <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mb-4 shadow-xl border border-slate-700">
                                <Lock className="w-6 h-6 text-brand-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Pro Feature</h3>
                            <p className="text-slate-300 mb-6 text-center max-w-sm">
                                Upgrade to unlock detailed performance analytics and trends.
                            </p>
                            <button
                                onClick={() => navigate('/app/pricing')}
                                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 text-white font-bold py-2 px-6 rounded-lg shadow-lg hover:shadow-purple-500/25 transition-all"
                            >
                                Upgrade Now
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Existing Speed & Accuracy Chart */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-6">
                <h3 className="text-xl font-bold text-white font-display mb-6">Speed &amp; Accuracy per Session</h3>
                <div className="relative">
                    <div className={isProGated ? "blur-md pointer-events-none opacity-50 select-none" : ""}>
                        <SpeedAccuracyChart currentExamId={selectedExamId} />
                    </div>

                    {isProGated && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                            <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mb-4 shadow-xl border border-slate-700">
                                <Lock className="w-6 h-6 text-brand-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Pro Feature</h3>
                            <p className="text-slate-300 mb-6 text-center max-w-sm">
                                Upgrade to unlock detailed performance analytics and trends.
                            </p>
                            <button
                                onClick={() => navigate('/app/pricing')}
                                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 text-white font-bold py-2 px-6 rounded-lg shadow-lg hover:shadow-purple-500/25 transition-all"
                            >
                                Upgrade Now
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
