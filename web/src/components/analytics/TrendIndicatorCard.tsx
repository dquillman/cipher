import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, Minus, Lock, ChevronRight } from 'lucide-react';
import { auth } from '../../firebase';
import { useExam } from '../../contexts/ExamContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { PerformanceTrendService, type OverallTrendResult } from '../../services/performanceTrendService';

export default function TrendIndicatorCard() {
    const { selectedExamId } = useExam();
    const { checkPermission } = useSubscription();
    const [trend, setTrend] = useState<OverallTrendResult | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const uid = auth.currentUser?.uid;
        if (!uid || !selectedExamId) return;
        setLoading(true);
        PerformanceTrendService.getRollingOverallTrend(uid, selectedExamId)
            .then(setTrend)
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [selectedExamId]);

    const isProGated = !checkPermission('analytics');

    // Loading skeleton
    if (loading) {
        return (
            <div className="mt-8 bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-5 animate-pulse">
                <div className="h-5 w-48 bg-slate-700 rounded" />
            </div>
        );
    }

    // No data at all — don't render
    if (!trend || trend.totalQuestions === 0) return null;

    // Building profile state for users with fewer than 50 questions
    if (trend.totalQuestions < 50) {
        const progress = Math.round((trend.totalQuestions / 50) * 100);
        return (
            <div className="mt-8">
                <Link
                    to="/app/stats"
                    className="block bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-5 hover:border-brand-500/40 hover:bg-slate-800/70 transition-all group"
                >
                    <div className="relative">
                        <div className={isProGated ? 'blur-sm opacity-50 select-none' : ''}>
                            <div className="flex items-center justify-between">
                                <div className="flex flex-col gap-2 flex-1 mr-4">
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Overall Trend</span>
                                        <span className="text-sm text-slate-500">Building your profile... ({trend.totalQuestions}/50 questions)</span>
                                    </div>
                                    <div className="bg-slate-700/50 rounded-full h-1.5 w-full">
                                        <div
                                            className="bg-brand-500 h-1.5 rounded-full transition-all duration-500"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-brand-400 transition-colors" />
                            </div>
                        </div>

                        {isProGated && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="flex items-center gap-2 text-sm text-slate-400">
                                    <Lock className="w-4 h-4" />
                                    <span>Upgrade to see trends</span>
                                </div>
                            </div>
                        )}
                    </div>
                </Link>
            </div>
        );
    }

    const DirectionIcon = trend.direction === 'improving'
        ? TrendingUp
        : trend.direction === 'declining'
            ? TrendingDown
            : Minus;

    const directionColor = trend.direction === 'improving'
        ? 'text-emerald-400'
        : trend.direction === 'declining'
            ? 'text-red-400'
            : 'text-slate-400';

    const directionLabel = trend.direction === 'improving'
        ? 'Improving'
        : trend.direction === 'declining'
            ? 'Declining'
            : 'Stable';

    return (
        <div className="mt-8">
            <Link
                to="/app/stats"
                className="block bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-5 hover:border-brand-500/40 hover:bg-slate-800/70 transition-all group"
            >
                <div className="relative">
                    <div className={isProGated ? 'blur-sm opacity-50 select-none' : ''}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Overall Trend</span>
                                <div className={`flex items-center gap-1.5 ${directionColor}`}>
                                    <DirectionIcon className="w-4 h-4" />
                                    <span className="text-sm font-semibold">{directionLabel}</span>
                                </div>
                                {trend.currentAverage !== null && (
                                    <span className="text-sm text-slate-500">
                                        (Last {Math.min(trend.totalQuestions, 50)}: {trend.currentAverage}%)
                                    </span>
                                )}
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-brand-400 transition-colors" />
                        </div>
                    </div>

                    {isProGated && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="flex items-center gap-2 text-sm text-slate-400">
                                <Lock className="w-4 h-4" />
                                <span>Upgrade to see trends</span>
                            </div>
                        </div>
                    )}
                </div>
            </Link>
        </div>
    );
}
