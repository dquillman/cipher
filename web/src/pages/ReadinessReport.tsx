import { useState, useEffect } from 'react';
import { useAuth } from '../App';
import DashboardLink from '../components/DashboardLink';
import { PredictionEngine, type ReadinessReport } from '../services/PredictionEngine';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle, BarChart2, Lock, Loader, Info } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useSubscription } from '../contexts/SubscriptionContext';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import PatternInsightCard, { type PatternData } from '../components/PatternInsightCard';
import { StudyPlanService } from '../services/StudyPlanService';
import { useExam } from '../contexts/ExamContext';
import { applyReadinessConfidence } from '../utils/readinessConfidence';
import CountUp from '../components/CountUp';
import { PerformanceTrendService, type OverallTrendResult } from '../services/performanceTrendService';

export default function ReadinessReportPage() {
    const { user } = useAuth();
    const { checkPermission } = useSubscription();
    const { selectedExamId, examName, examDomains } = useExam();
    const navigate = useNavigate();
    const [report, setReport] = useState<ReadinessReport | null>(null);
    const [minedPatterns, setMinedPatterns] = useState<PatternData[]>([]);
    const [loading, setLoading] = useState(true);
    const [daysUntilExam, setDaysUntilExam] = useState<number | null>(null);
    const [userXp, setUserXp] = useState(0);
    const [rollingTrend, setRollingTrend] = useState<OverallTrendResult | null>(null);

    // Evidence thresholds
    const MIN_EVIDENCE_THRESHOLD = 50;
    const EXAM_SOON_DAYS = 14;

    useEffect(() => {
        const fetchReport = async () => {
            if (!user || !selectedExamId) return;
            try {
                // Parallel fetch: Readiness + Weakest Patterns + User XP + Rolling Trend
                const [readinessData, patternsResult, userDocResult, rollingResult] = await Promise.allSettled([
                    PredictionEngine.calculateReadiness(user.uid, selectedExamId, examDomains),
                    httpsCallable(getFunctions(), 'getWeakestPatterns')({ examId: selectedExamId }),
                    getDoc(doc(db, 'users', user.uid)),
                    PerformanceTrendService.getRollingOverallTrend(user.uid, selectedExamId),
                ]);

                if (readinessData.status === 'fulfilled') {
                    setReport(readinessData.value);
                }

                if (patternsResult.status === 'fulfilled' && patternsResult.value.data) {
                    setMinedPatterns(patternsResult.value.data as PatternData[]);
                }

                if (rollingResult.status === 'fulfilled') {
                    setRollingTrend(rollingResult.value);
                }

                if (userDocResult.status === 'fulfilled' && userDocResult.value.exists()) {
                    const data = userDocResult.value.data();
                    let effectiveXp = 0;
                    if (selectedExamId && data.examXP && typeof data.examXP[selectedExamId] === 'number') {
                        effectiveXp = data.examXP[selectedExamId];
                    } else {
                        effectiveXp = 0;
                    }
                    setUserXp(effectiveXp);
                }
            } catch (error) {
                console.error("Failed to load readiness report", error);
            } finally {
                setLoading(false);
            }
        };

        const fetchExamDate = async () => {
            if (!user || !selectedExamId) return;
            try {
                const plan = await StudyPlanService.getCurrentPlan(user.uid, selectedExamId);
                if (plan?.examDate) {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const examDate = new Date(plan.examDate);
                    examDate.setHours(0, 0, 0, 0);
                    const diffTime = examDate.getTime() - today.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    setDaysUntilExam(diffDays);
                }
            } catch (error) {
                console.error('Failed to fetch exam date for readiness', error);
            }
        };

        fetchReport();
        fetchExamDate();
    }, [user, selectedExamId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    if (!report || report.totalQuestionsAnswered === 0) {
        return (
            <div className="min-h-screen bg-slate-900 p-8 flex flex-col items-center justify-center text-center">
                <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 max-w-md">
                    <BarChart2 className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-2">Not Enough Data</h2>
                    <p className="text-slate-400 mb-6">Complete a few quizzes or a mock exam to generate your readiness prediction.</p>
                    <Link to="/app/quiz" className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold transition-colors">
                        Take a Quiz
                    </Link>
                </div>
            </div>
        );
    }

    // Color Logic
    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-emerald-400 stroke-emerald-500';
        if (score >= 65) return 'text-amber-400 stroke-amber-500';
        return 'text-red-400 stroke-red-500';
    };

    const getStatusColor = (status: string) => {
        if (status === 'Strong') return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
        if (status === 'Moderate') return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
        if (status === 'Insufficient') return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
        return 'text-red-400 bg-red-400/10 border-red-400/20';
    };

    // Apply Readiness Confidence Modifier (display only — does not affect stored data or domain analytics)
    const displayedScore = applyReadinessConfidence(report.overallScore, userXp);

    // Confidence tier label derived from exam-scoped XP
    const getConfidenceLabel = (xp: number): string => {
        if (xp >= 1000) return 'Very High';
        if (xp >= 500) return 'High';
        if (xp >= 100) return 'Moderate';
        return 'Low';
    };
    const confidenceLabel = getConfidenceLabel(userXp);

    // Radial Progress Math
    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - ((displayedScore ?? 0) / 100) * circumference;

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8 pb-24">
            <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
                <DashboardLink />

                {/* Header */}
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Exam Readiness</h1>
                    {examName && <span className="text-sm font-bold text-indigo-400 uppercase tracking-wider mb-1 block">{examName}</span>}
                    <p className="text-slate-400">AI-powered prediction based on your recent performance.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Main Score Card */}
                    <div className="md:col-span-2 bg-slate-800 rounded-2xl p-5 md:p-8 border border-slate-700 shadow-xl relative overflow-hidden">

                        {!checkPermission('analytics') && (
                            <div className="absolute inset-0 z-20 bg-slate-800/60 backdrop-blur-md flex flex-col items-center justify-center text-center p-6">
                                <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mb-4 shadow-xl border border-slate-700">
                                    <Lock className="w-8 h-8 text-indigo-400" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">Detailed Analysis Locked</h3>
                                <p className="text-slate-300 mb-6 max-w-sm">
                                    Get detailed readiness predictions and trend analysis with Pro.
                                </p>
                                <button
                                    onClick={() => navigate('/app/pricing')}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-indigo-500/25 transition-all"
                                >
                                    Unlock Report
                                </button>
                            </div>
                        )}

                        <div className={`flex flex-col md:flex-row items-center gap-4 md:gap-8 ${!checkPermission('analytics') ? 'blur-sm opacity-50 pointer-events-none' : ''}`}>
                            {/* Radial Chart OR Building State */}
                            <div className="relative w-36 h-36 md:w-48 md:h-48 flex-shrink-0">
                                {report.isPreliminary ? (
                                    /* Building State - Insufficient Evidence */
                                    <div className="w-full h-full flex flex-col items-center justify-center text-center bg-slate-900/50 rounded-full border-2 border-dashed border-slate-600">
                                        <Loader className="w-10 h-10 text-slate-500 mb-2 animate-pulse" />
                                        <span className="text-sm text-slate-400 font-medium px-4">
                                            Building Profile
                                        </span>
                                        <span className="text-[10px] text-slate-500 mt-1">{report.totalQuestionsAnswered}/{MIN_EVIDENCE_THRESHOLD}</span>
                                    </div>
                                ) : (
                                    /* Normal Score Display */
                                    <>
                                        <svg className="w-full h-full -rotate-90">
                                            <circle
                                                cx="96" cy="96" r={radius}
                                                className="stroke-slate-700"
                                                strokeWidth="12"
                                                fill="none"
                                            />
                                            <circle
                                                cx="96" cy="96" r={radius}
                                                className={`${displayedScore !== null ? getScoreColor(displayedScore) : 'stroke-slate-600'} transition-all duration-1000 ease-out`}
                                                strokeWidth="12"
                                                strokeDasharray={circumference}
                                                strokeDashoffset={offset}
                                                strokeLinecap="round"
                                                fill="none"
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className={`text-4xl font-black ${displayedScore !== null ? getScoreColor(displayedScore).split(' ')[0] : 'text-slate-500'}`}>
                                                {displayedScore !== null ? <CountUp value={`${displayedScore}%`} /> : '—'}
                                            </span>
                                            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">
                                                Probability
                                            </span>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Stats & Trend */}
                            <div className="flex-1 w-full space-y-6">
                                <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
                                    <div>
                                        <p className="text-sm text-slate-400">Current Trend</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            {report.trend === 'improving' && <TrendingUp className="w-5 h-5 text-emerald-400" />}
                                            {report.trend === 'declining' && <TrendingDown className="w-5 h-5 text-red-400" />}
                                            {report.trend === 'stable' && <Minus className="w-5 h-5 text-slate-400" />}
                                            <span className="font-bold capitalize text-white">{report.trend}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-slate-400">Questions Analyzed</p>
                                        <p className="font-bold text-xl text-white mt-1">{report.totalQuestionsAnswered}</p>
                                    </div>
                                </div>

                                {/* Rolling 50-Question Trend */}
                                {rollingTrend && rollingTrend.totalQuestions >= 10 && (
                                    <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
                                        <div>
                                            <p className="text-sm text-slate-400">Rolling 50-Question Trend</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                {rollingTrend.direction === 'improving' && <TrendingUp className="w-5 h-5 text-emerald-400" />}
                                                {rollingTrend.direction === 'declining' && <TrendingDown className="w-5 h-5 text-red-400" />}
                                                {rollingTrend.direction === 'stable' && <Minus className="w-5 h-5 text-slate-400" />}
                                                <span className="font-bold capitalize text-white">{rollingTrend.direction}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-slate-400">Rolling Average</p>
                                            <p className="font-bold text-xl text-white mt-1">{rollingTrend.currentAverage}%</p>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                                        {report.isPreliminary ? (
                                            <div className="flex items-center gap-2 text-indigo-400">
                                                <Loader className="w-5 h-5 animate-spin" />
                                                <span>Building Your Readiness Profile</span>
                                            </div>
                                        ) : (
                                            (displayedScore ?? 0) >= 75 ? (
                                                <div className="flex items-center gap-2 text-emerald-400">
                                                    <CheckCircle className="w-5 h-5" />
                                                    <span>Assessment</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-amber-400">
                                                    <AlertTriangle className="w-5 h-5" />
                                                    <span>Assessment</span>
                                                </div>
                                            )
                                        )}
                                    </h3>
                                    <p className="text-slate-400 text-sm leading-relaxed">
                                        {report.isPreliminary
                                            ? `We need a bit more data to estimate your exam readiness accurately. Complete about ${MIN_EVIDENCE_THRESHOLD - report.totalQuestionsAnswered > 0 ? MIN_EVIDENCE_THRESHOLD - report.totalQuestionsAnswered : 'a few'} more questions for a reliable score.`
                                            : (displayedScore ?? 0) >= 80
                                                ? "You are showing strong readiness! Maintain this consistency and focus on time management."
                                                : (displayedScore ?? 0) >= 65
                                                    ? "You're getting close, but consistency is key. Focus on your weak domains below to boost your score."
                                                    : "We recommend more targeted practice before scheduling your exam. Focus on fundamental concepts."}
                                    </p>

                                    {/* Time-aware reassurance when exam is soon and evidence is low */}
                                    {report.isPreliminary && daysUntilExam !== null && daysUntilExam <= EXAM_SOON_DAYS && daysUntilExam > 0 && (
                                        <p className="text-slate-500 text-xs leading-relaxed mt-2 italic">
                                            Your exam is coming up soon. This reflects limited data, not your potential outcome.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {displayedScore !== null && !report.isPreliminary && (
                            <div className={`mt-4 pt-4 border-t border-slate-700/50 flex items-center justify-between text-sm ${!checkPermission('analytics') ? 'blur-sm opacity-50' : ''}`}>
                                <span className="text-slate-400">
                                    Confidence: <span className="text-slate-200 font-medium">{confidenceLabel}</span>
                                </span>
                                <span className="text-slate-500">
                                    Based on {report.totalQuestionsAnswered} validated responses.
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Progress to Full Readiness */}
                    {report.isPreliminary && (
                        <div className="md:col-span-3 p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
                            <div className="flex justify-between text-xs text-slate-400 mb-2">
                                <span>Progress to full readiness score</span>
                                <span>{report.totalQuestionsAnswered}/{MIN_EVIDENCE_THRESHOLD}</span>
                            </div>
                            <div className="w-full bg-slate-700/50 rounded-full h-2">
                                <div className="bg-brand-500 h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min((report.totalQuestionsAnswered / MIN_EVIDENCE_THRESHOLD) * 100, 100)}%` }} />
                            </div>
                            <p className="text-xs text-slate-500 mt-2">
                                Complete {Math.max(0, MIN_EVIDENCE_THRESHOLD - report.totalQuestionsAnswered)} more questions to unlock your full readiness prediction.
                            </p>
                        </div>
                    )}

                    {/* Quick Stats */}
                    <div className="space-y-6">
                        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                            <h3 className="text-slate-400 text-sm font-bold uppercase mb-4">Activity</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-white">Mock Exams</span>
                                    <span className="font-mono text-indigo-400">{report.mockExamsTaken}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-white">Total Qs</span>
                                    <span className="font-mono text-indigo-400">{report.totalQuestionsAnswered}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                            <h3 className="text-slate-400 text-sm font-bold uppercase mb-4">Top Focus Area</h3>
                            {(() => {
                                // Find the recommended domain (first non-Insufficient with score < 70)
                                const recommendedDomain = report.domainBreakdown.find(d => d.status !== 'Insufficient' && d.score < 70);
                                // Find any Insufficient domain that might appear weaker
                                const insufficientDomain = report.domainBreakdown.find(d => d.status === 'Insufficient');
                                // Check if there's an Insufficient domain that would otherwise be prioritized
                                const hasSkippedInsufficient = insufficientDomain && recommendedDomain &&
                                    (insufficientDomain.score < recommendedDomain.score || insufficientDomain.totalQuestions === 0);

                                if (recommendedDomain) {
                                    return (
                                        <div>
                                            <p className="text-white font-bold mb-1">{recommendedDomain.domain}</p>
                                            <Link
                                                to="/app/quiz"
                                                state={{ filterDomain: recommendedDomain.domain }}
                                                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 mt-2"
                                            >
                                                Practice this domain &rarr;
                                            </Link>

                                            {/* Explanation when Insufficient domain is skipped */}
                                            {hasSkippedInsufficient && (
                                                <div className="mt-4 pt-4 border-t border-slate-700">
                                                    <p className="text-slate-500 text-xs leading-relaxed">
                                                        <span className="text-slate-400 font-medium">Why {recommendedDomain.domain}?</span>{' '}
                                                        We don't yet have enough {insufficientDomain.domain} questions to make a reliable recommendation.
                                                        Answer a few {insufficientDomain.domain} questions to unlock targeted guidance for that domain.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    );
                                } else if (report.domainBreakdown.length > 0 && report.domainBreakdown[0].score < 70) {
                                    // Fallback to original logic if no non-Insufficient domain found
                                    return (
                                        <div>
                                            <p className="text-white font-bold mb-1">{report.domainBreakdown[0].domain}</p>
                                            <Link
                                                to="/app/quiz"
                                                state={{ filterDomain: report.domainBreakdown[0].domain }}
                                                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 mt-2"
                                            >
                                                Practice this domain &rarr;
                                            </Link>
                                        </div>
                                    );
                                } else {
                                    return <p className="text-emerald-400 text-sm">All domains looking good!</p>;
                                }
                            })()}
                        </div>
                    </div>
                </div>

                {/* Mock Exam CTA */}
                <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 text-center">
                    <button
                        onClick={() => navigate('/app/simulator')}
                        className="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl py-4 px-8 text-lg shadow-lg shadow-brand-500/25 transition-all hover:-translate-y-0.5"
                    >
                        Take Full Mock Exam
                    </button>
                    <p className="text-slate-400 text-sm mt-3">
                        Simulate the full exam experience under timed conditions.
                    </p>
                </div>

                {/* What This Means — Interpretive summary */}
                {!report.isPreliminary && report.overallScore !== null && (
                    <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-6">
                        <h3 className="font-bold text-white mb-3">What this means</h3>
                        <div className="text-sm text-slate-300 space-y-3 leading-relaxed">
                            <p>
                                {(displayedScore ?? 0) >= 80
                                    ? "You are making strong progress. Your accuracy is consistently high, which means your study approach is working. Stay the course and keep your practice sessions regular."
                                    : (displayedScore ?? 0) >= 65
                                        ? "You are on the right track but not yet consistent. Some domains are solid while others need more reps. That gap is normal at this stage — targeted practice will close it."
                                        : "You are still building your foundation. This is early in the process, and lower scores here are expected. Focus on understanding why the correct answer is correct, not just memorizing answers."}
                            </p>
                            <p>
                                {report.trend === 'improving'
                                    ? "Your recent sessions show improvement over your earlier attempts. That upward trend matters more than any single score."
                                    : report.trend === 'declining'
                                        ? "Your recent scores have dipped compared to earlier sessions. This can happen when you hit harder material or practice while fatigued. A short break or switching domains can help."
                                        : "Your performance is steady. Consistency is a good sign — it means your knowledge is holding. To push higher, focus on your weakest domain below."}
                            </p>
                            <p className="text-slate-400">
                                <span className="font-semibold text-slate-300">Speed note:</span>{' '}
                                Don't worry about how fast you answer right now. Accuracy comes first — speed follows naturally as concepts become familiar.
                            </p>
                            <p className="font-medium text-slate-200">
                                {report.domainBreakdown.length > 0 && report.domainBreakdown[0].score < 70
                                    ? `Next step: Run a focused session on "${report.domainBreakdown[0].domain}" — it's your biggest opportunity for improvement.`
                                    : "Next step: Keep your daily practice streak going. Consistency beats intensity for long-term retention."}
                            </p>
                        </div>
                    </div>
                )}

                {/* Mindset Gaps (Weakest Patterns) */}
                {minedPatterns.length > 0 && (
                    <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
                        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-white flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                    Mindset Gaps
                                </h3>
                                <p className="text-xs text-slate-400 mt-1">
                                    Common "User Traps" you are falling for. Master these to boost your score.
                                </p>
                            </div>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-900/30">
                            {minedPatterns.map(p => (
                                <PatternInsightCard key={p.pattern_id} pattern={p} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Domain Breakdown */}
                <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-visible relative">
                    <div className="p-6 border-b border-slate-700 flex items-center gap-2">
                        <h3 className="font-bold text-white">Domain Breakdown</h3>

                        <div className="relative group cursor-pointer">
                            <Info className="w-4 h-4 text-slate-400 hover:text-slate-200 transition-colors" />
                            <div className="absolute left-0 bottom-full mb-2 w-72 bg-slate-900 border border-slate-600 rounded-lg p-3 text-xs text-slate-300 leading-relaxed shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50">
                                Rankings reflect your overall performance across attempts, not just your most recent result.
                                <div className="absolute left-4 top-full w-2 h-2 bg-slate-900 border-r border-b border-slate-600 rotate-45 -mt-1"></div>
                            </div>
                        </div>
                    </div>
                    {report.isPreliminary && (
                        <div className="px-6 pb-4 text-xs text-amber-400">
                            Low data — rankings may stabilize as you answer more questions.
                        </div>
                    )}
                    <div className="divide-y divide-slate-700">
                        {report.domainBreakdown.map((domain) => (
                            <div key={domain.domain} className="p-6 hover:bg-slate-750 transition-colors">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-medium text-white">{domain.domain}</span>
                                    <span className={`text-sm font-medium px-2 py-0.5 rounded ${getStatusColor(domain.status)}`}>
                                        {domain.status} {domain.totalQuestions > 0 ? `(${Math.round(domain.score)}%)` : ''}
                                    </span>
                                </div>
                                <div className="w-full h-4 bg-slate-700 rounded-full overflow-hidden border border-slate-600/50">
                                    <div
                                        className="h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(0,0,0,0.2)]"
                                        style={{
                                            width: `${domain.score}%`,
                                            backgroundColor: `hsl(${Math.min(domain.score * 1.2, 120)}, 85%, 45%)`
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Legend / Help Text */}
                <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 text-sm text-slate-400 space-y-2">
                    <p><span className="font-bold text-slate-300">Insufficient Data:</span> A domain will be marked as "Insufficient" until you have answered at least 10 questions in that specific area.</p>
                    <p><span className="font-bold text-slate-300">Score (%):</span> This percentage represents your accuracy (Correct Answers / Total Attempts) within that domain.</p>
                    <div className="mt-2 text-slate-400">
                        <span className="font-bold text-slate-300">Current Trend:</span> Compares your last 5 attempts to your overall average:
                        <ul className="list-disc ml-5 mt-1 space-y-1">
                            <li><span className="text-emerald-400">Improving:</span> Recent accuracy is &gt;5% higher than overall.</li>
                            <li><span className="text-red-400">Declining:</span> Recent accuracy is &gt;5% lower than overall.</li>
                            <li><span className="text-slate-400">Stable:</span> Recent performance is consistent (within 5%).</li>
                        </ul>
                    </div>
                </div>

            </div>
        </div>
    );
}
