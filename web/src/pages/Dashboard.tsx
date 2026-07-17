import { auth, db } from '../firebase';
import { Link } from 'react-router-dom';
import MasteryRing from '../components/MasteryRing';
import { DashboardSkeleton } from '../components/ui/Skeleton';
import { useState, useEffect } from 'react';
import { doc, onSnapshot, collection, query, where, orderBy, limit, setDoc, getCountFromServer, updateDoc, serverTimestamp, type QuerySnapshot, type DocumentData } from 'firebase/firestore';
import { useNavigate, Navigate } from 'react-router-dom';
import { XPService } from '../services/xpService';
import { useExam } from '../contexts/ExamContext';


import ReportIssueModal from '../components/ReportIssueModal';
import PassExpiryBanner from '../components/PassExpiryBanner';
import { useTrial } from '../hooks/useTrial';
import ThinkingTrapsCard from '../components/ThinkingTrapsCard';
import TrendIndicatorCard from '../components/analytics/TrendIndicatorCard';
import { getAnsweredCount, deriveMetrics, type RunMetrics } from '../utils/questionMetrics';
import PrimaryButton from '../components/ui/PrimaryButton';
import { Flame } from 'lucide-react';
import GuidedPath from '../components/onboarding/GuidedPath';
import { StudyPlanService } from '../services/StudyPlanService';

const ACTIVITY_MODE_LABELS: Record<string, string> = {
    diagnostic: "Diagnostic Quiz",
    smart: "Smart Practice Quiz",
    daily: "Daily Practice",
    mock: "Mock Exam",
};

const ACTIVITY_MODE_STYLES: Record<string, string> = {
    diagnostic: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    smart: 'bg-brand-500/10 text-brand-400 border-brand-500/20',
    daily: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    practice: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    simulation: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    mock: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
};

const ACTIVITY_DEFAULT_STYLE = 'bg-slate-500/10 text-slate-400 border-slate-500/20';

export default function Dashboard() {
    // Use UseExam globally
    const { selectedExamId, examName, examDomains, loading: examLoading, hasCompletedDiagnostic: contextDiagnostic, markDiagnosticComplete } = useExam();

    const [domainMasteryCounts, setDomainMasteryCounts] = useState<Record<string, number>>({});
    const [domainTotalCounts, setDomainTotalCounts] = useState<Record<string, number>>({});

    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const [showStreakModal, setShowStreakModal] = useState(false);

    const [recentActivity, setRecentActivity] = useState<RunMetrics[]>([]);
    // Guided path: null = still probing (gates the card so steps never flicker)
    const [hasStudyPlan, setHasStudyPlan] = useState<boolean | null>(null);
    const [activeRuns, setActiveRuns] = useState<any[]>([]);
    const [dailyProgress, setDailyProgress] = useState(0);
    const [dailyGoal, setDailyGoal] = useState(10);
    const [isEditingGoal, setIsEditingGoal] = useState(false);
    const [newGoal, setNewGoal] = useState(10);
    const [userStreak, setUserStreak] = useState(0);

    const [showReportModal, setShowReportModal] = useState(false);

    const { trial } = useTrial();

    // Sync real-time activity detection back to global context
    useEffect(() => {
        if (contextDiagnostic === true) return;
        const done = recentActivity.some(
            a => (a.mode === 'diagnostic' || a.quizType === 'diagnostic') && a.score !== undefined
        );
        if (done) markDiagnosticComplete();
    }, [recentActivity, contextDiagnostic, markDiagnosticComplete]);

    // 1. Fetch domain totals when exam context changes
    useEffect(() => {
        if (examLoading) return;

        if (selectedExamId && examDomains.length > 0) {
            fetchDomainTotals(selectedExamId, examDomains);
        } else {
            setDomainTotalCounts({});
        }
    }, [selectedExamId, examDomains, examLoading]);

    // Guided path: does a study plan exist for this exam?
    useEffect(() => {
        let cancelled = false;
        const unsub = auth.onAuthStateChanged(async (user) => {
            if (!user || !selectedExamId) return;
            try {
                const plan = await StudyPlanService.getCurrentPlan(user.uid, selectedExamId);
                if (!cancelled) setHasStudyPlan(!!plan);
            } catch {
                if (!cancelled) setHasStudyPlan(false);
            }
        });
        return () => { cancelled = true; unsub(); };
    }, [selectedExamId]);

    // 2. Fetch User Data (Progress, Activity, Goals)
    useEffect(() => {
        let unsubscribeActivity: () => void;
        let unsubscribeGoal: () => void;
        let unsubscribeProgress: () => void;
        let unsubscribeActiveRuns: () => void;
        let unsubscribeDailyProgress: () => void;

        const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
            if (user) {
                const userId = user.uid;

                // --- Question Progress ---
                if (selectedExamId) {
                    const progressQuery = query(
                        collection(db, 'users', userId, 'questionProgress'),
                        where('examId', '==', selectedExamId)
                    );

                    unsubscribeProgress = onSnapshot(progressQuery, (snapshot) => {
                        const counts: Record<string, number> = {};
                        snapshot.docs.forEach(doc => {
                            const data = doc.data();
                            if (data.status === 'mastered' && data.domain) {
                                counts[data.domain] = (counts[data.domain] || 0) + 1;
                            }
                        });
                        setDomainMasteryCounts(counts);
                    });
                }

                // --- Recent Activity (from quizRuns) ---
                if (selectedExamId) {
                    const activityQuery = query(
                        collection(db, 'quizRuns', userId, 'runs'),
                        where('examId', '==', selectedExamId),
                        where('status', '==', 'completed'),
                        orderBy('completedAt', 'desc'),
                        limit(10)
                    );

                    const handleActivitySnapshot = (snapshot: QuerySnapshot<DocumentData>) => {
                        const rawRuns = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                        const { perRun } = deriveMetrics(rawRuns);
                        setRecentActivity(perRun);
                    };

                    unsubscribeActivity = onSnapshot(activityQuery, handleActivitySnapshot, (_err) => {
                        // Fallback if composite index missing
                        console.warn('[Dashboard] Composite index missing for activity query, using fallback');
                        const fallbackQuery = query(
                            collection(db, 'quizRuns', userId, 'runs'),
                            where('status', '==', 'completed'),
                            limit(100)
                        );
                        unsubscribeActivity = onSnapshot(fallbackQuery, (snap) => {
                            const rawRuns = snap.docs
                                .map(d => ({ id: d.id, ...d.data() }))
                                .filter((r: any) => r.examId === selectedExamId)
                                .sort((a: any, b: any) => (b.completedAt?.seconds || 0) - (a.completedAt?.seconds || 0))
                                .slice(0, 10);
                            const { perRun } = deriveMetrics(rawRuns);
                            setRecentActivity(perRun);
                        });
                    });
                }

                // --- Daily Progress (from quizRuns) ---
                const todayStart = new Date();
                todayStart.setHours(0, 0, 0, 0);

                const todayQuery = query(
                    collection(db, 'quizRuns', userId, 'runs'),
                    where('completedAt', '>=', todayStart)
                );

                unsubscribeDailyProgress = onSnapshot(todayQuery, (snapshot) => {
                    let count = 0;
                    snapshot.docs.forEach(doc => {
                        const data = doc.data();
                        // Only count for CURRENT exam, EXCLUDE diagnostic (it's a baseline, not practice)
                        if (data.examId === selectedExamId && data.quizType !== 'diagnostic' && data.mode !== 'diagnostic') {
                            count += getAnsweredCount(data);
                        }
                    });
                    setDailyProgress(count);
                });

                // --- User Stats (Goal, XP, Streak) ---
                const userRef = doc(db, 'users', userId);
                unsubscribeGoal = onSnapshot(userRef, (docSnap) => {
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        if (data.dailyGoal) {
                            setDailyGoal(data.dailyGoal);
                            setNewGoal(data.dailyGoal);
                        }

                        if (data.streak !== undefined) {
                            setUserStreak(data.streak);
                        }
                    }
                });

                XPService.checkStreak();

                // --- Active Runs (resumable, no examId filter) ---
                const activeRunsQuery = query(
                    collection(db, 'quizRuns', userId, 'runs'),
                    where('status', '==', 'in_progress')
                );

                unsubscribeActiveRuns = onSnapshot(activeRunsQuery, (snapshot) => {
                    const runs = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                    setActiveRuns(runs);
                });
            }
            setLoading(false);
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeActivity) unsubscribeActivity();
            if (unsubscribeGoal) unsubscribeGoal();
            if (unsubscribeProgress) unsubscribeProgress();
            if (unsubscribeActiveRuns) unsubscribeActiveRuns();
            if (unsubscribeDailyProgress) unsubscribeDailyProgress();
        };
    }, [selectedExamId]); // Re-subscribe when exam changes

    // Helper to fetch total questions per domain
    const fetchDomainTotals = async (examId: string, domains: string[]) => {
        const totals: Record<string, number> = {};

        for (const domain of domains) {
            try {
                const q = query(
                    collection(db, 'questions'),
                    where('examId', '==', examId),
                    where('domain', '==', domain)
                );
                const snapshot = await getCountFromServer(q);
                totals[domain] = snapshot.data().count;
            } catch (e) {
                console.error(`Error fetching total for ${domain}:`, e);
                totals[domain] = 100;
            }
        }
        setDomainTotalCounts(totals);
    };

    const saveGoal = async () => {
        if (!auth.currentUser) return;
        try {
            const userRef = doc(db, 'users', auth.currentUser.uid);
            await setDoc(userRef, { dailyGoal: newGoal }, { merge: true });
            setIsEditingGoal(false);
        } catch (error) {
            console.error("Error saving goal:", error);
        }
    };

    const getPercentage = (domain: string) => {
        const mastered = domainMasteryCounts[domain] || 0;
        const total = domainTotalCounts[domain] || 0;
        if (total === 0) return 0;
        return Math.min(100, Math.round((mastered / total) * 100));
    };

    if (loading || contextDiagnostic === null) {
        return <DashboardSkeleton />;
    }

    // Onboarding gate: first-time users go to orientation page (one-time only)
    const onboardingAck = localStorage.getItem('ec_onboarding_ack') === 'true';
    if (contextDiagnostic === false && !onboardingAck) {
        return <Navigate to="/app/start-here" replace />;
    }

    const resumableRuns = activeRuns.filter((r: any) => {
        if (r.quizType === 'diagnostic') return false;
        if (r.examId !== selectedExamId) return false;
        // Only show banner if the run has unanswered questions and no completedAt
        const answered = (r.answers || []).filter((a: any) => a?.selectedOption !== undefined).length;
        const total = r.snapshot?.questionIds?.length || 0;
        return total > 0 && answered < total && !r.completedAt;
    });
    const hasActiveRun = resumableRuns.length > 0;

    return (
        <>
                <div className="hidden md:flex items-center justify-end gap-4 mb-2 flex-wrap">
                    <Link to="/app/help" className="flex text-sm font-medium text-brand-400 hover:text-brand-300 transition-colors items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Guide
                    </Link>
                    <Link to="/about" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
                        About
                    </Link>
                    <button
                        onClick={() => setShowReportModal(true)}
                        className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
                    >
                        Report a Problem
                    </button>
                    <button
                        onClick={() => setShowStreakModal(true)}
                        className="flex items-center gap-2 px-3 py-1 bg-slate-700/50 text-brand-300 rounded-full text-sm font-medium border border-slate-600 hover:bg-slate-700 hover:border-brand-500/50 transition-all cursor-pointer"
                    >
                        <Flame className="h-4 w-4 text-amber-400" strokeWidth={1.75} />
                        <span>{userStreak} Day Streak</span>
                    </button>
                </div>

                <div className="space-y-6 md:space-y-8">
                    {/* Exam Pass expiry / free-extension banner (D-14 window) */}
                    <PassExpiryBanner />

                    {/* Trial Banner */}
                    {trial.status === 'active' && (
                        <div className={`rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border shadow-lg ${trial.daysRemaining <= 2
                            ? 'bg-gradient-to-r from-amber-600 to-orange-700 border-amber-400/30'
                            : 'bg-gradient-to-r from-indigo-600 to-indigo-800 border-indigo-400/30'
                            }`}>
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg backdrop-blur-sm ${trial.daysRemaining <= 2 ? 'bg-amber-500/20' : 'bg-indigo-500/20'
                                    }`}>
                                    <span className="text-xl">{trial.daysRemaining <= 2 ? '⏰' : '🎉'}</span>
                                </div>
                                <div>
                                    <h3 className="text-white font-bold text-base">
                                        {trial.daysRemaining <= 2 ? 'Your Pro trial ends soon' : "You're on a 14-day Pro Trial"}
                                    </h3>
                                    <p className={`${trial.daysRemaining <= 2 ? 'text-amber-100' : 'text-indigo-200'} text-sm`}>
                                        {trial.daysRemaining === 0 ? (
                                            <>You have <strong className="text-white">{trial.hoursRemaining} hours</strong> left of full access.</>
                                        ) : (
                                            <>
                                                {trial.daysRemaining <= 2
                                                    ? <>Time remaining: <strong className="text-white">{trial.daysRemaining} days, {trial.hoursRemaining} hours</strong></>
                                                    : <>Full access enabled. ⏳ <strong className="text-white">{trial.daysRemaining} days</strong> remaining</>
                                                }
                                            </>
                                        )}
                                    </p>
                                </div>
                            </div>
                            <Link to="/app/pricing" className="w-full md:w-auto text-center px-5 py-3 bg-white text-indigo-900 font-bold rounded-lg text-sm hover:bg-indigo-50 transition-colors shadow-md whitespace-nowrap">
                                Upgrade Now
                            </Link>
                        </div>
                    )}

                    {/* Expired Trial Blocker */}
                    {trial.status === 'expired' && (
                        <div className="bg-slate-800 rounded-2xl p-4 sm:p-8 text-center border border-slate-700 shadow-2xl relative overflow-hidden mb-8">
                            <div className="relative z-10">
                                <h3 className="text-xl md:text-2xl font-bold text-white mb-2 font-display">Your 14-day Pro trial has ended</h3>
                                <p className="text-slate-400 mb-6 max-w-lg mx-auto">
                                    We hope you enjoyed your practice sessions! To continue studying and access your detailed analytics, please upgrade your plan.
                                </p>
                                <div className="flex flex-col items-center gap-4">
                                    <Link
                                        to="/app/pricing"
                                        className="inline-flex items-center justify-center rounded-xl bg-brand-600 px-8 py-3 text-base font-bold text-white shadow-lg shadow-brand-500/30 hover:bg-brand-500 transition-all hover:-translate-y-0.5"
                                    >
                                        Upgrade to continue studying
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Main Content - Blurred if Expired */}
                    <div className={trial.status === 'expired' ? "opacity-10 pointer-events-none filter blur-sm select-none" : ""}>
                        {/* Onboarding / Welcome Section */}
                        {contextDiagnostic === false && recentActivity.length === 0 && !loading ? (
                            <>
                                {/* Step 1: Diagnostic Banner */}
                                <div className="bg-gradient-to-r from-brand-600 to-indigo-700 rounded-2xl p-5 md:p-8 shadow-2xl shadow-brand-900/40 border border-brand-500/30 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 md:w-64 md:h-64 bg-white/10 rounded-full blur-3xl -mr-8 md:-mr-16 -mt-8 md:-mt-16 pointer-events-none"></div>
                                    <div className="relative z-10">
                                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-xs font-bold uppercase tracking-wider mb-4 shadow-sm">
                                            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                                            Step 1 of 1
                                        </div>
                                        <h2 className="text-2xl md:text-3xl font-bold text-white font-display mb-3 tracking-tight">Start with a short diagnostic</h2>
                                        <p className="text-indigo-100 text-base md:text-lg leading-relaxed mb-4">
                                            Before we begin, I need to understand how you think. This quick assessment helps me personalize your entire study plan.
                                        </p>
                                        <ul className="text-indigo-200 text-sm space-y-2 mb-6">
                                            <li className="flex items-center gap-2">
                                                <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                                <span><strong>~10 minutes</strong> — just a few questions per domain</span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                                <span><strong>Not pass/fail</strong> — this is about finding your strengths</span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                                <span><strong>Unlocks everything</strong> — practice and mock exams become personalized</span>
                                            </li>
                                        </ul>
                                        <button
                                            onClick={() => navigate('/app/quiz', { state: { mode: 'diagnostic' } })}
                                            className="inline-flex items-center justify-center rounded-xl bg-white text-brand-700 px-8 py-4 text-lg font-bold shadow-xl hover:bg-indigo-50 transition-colors gap-2 group/btn"
                                        >
                                            Start Diagnostic
                                            <svg className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                {/* Gated Actions Preview */}
                                <div className="mt-6 grid grid-cols-1 gap-4">
                                    {/* Gated: Targeted Practice */}
                                    <div className="bg-slate-800/30 rounded-xl p-5 border border-slate-700/50 opacity-60">
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 flex-shrink-0">
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-300 flex items-center gap-2">
                                                    Targeted Practice
                                                    <span className="text-xs bg-slate-700 text-slate-400 px-2 py-0.5 rounded-full">After Diagnostic</span>
                                                </h4>
                                                <p className="text-slate-500 text-sm mt-1">
                                                    Focuses on your weakest areas. Requires diagnostic data to personalize.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div>
                                <h2 className="text-2xl md:text-3xl font-bold text-white font-display">Welcome back!</h2>
                                <p className="text-slate-400 mt-1">Consistency is key. Keep up your daily practice to master the <strong>{examName}</strong>.</p>
                                {/* Getting-started guide — stage-aware, self-hides once completed */}
                                {hasStudyPlan !== null && (
                                    <GuidedPath
                                        steps={{
                                            diagnostic: contextDiagnostic === true,
                                            practice: recentActivity.some(r => r.quizType !== 'diagnostic' && r.mode !== 'diagnostic'),
                                            breakdown: localStorage.getItem('ec_breakdown_seen') === '1',
                                            plan: hasStudyPlan,
                                            mock: recentActivity.some(r => r.quizType === 'simulation' || r.mode === 'simulation'),
                                        }}
                                    />
                                )}
                            </div>
                        )}

                        {/* Resume Active Run */}
                        {hasActiveRun && (
                            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 md:p-6 mt-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                                <div>
                                    <h3 className="text-lg font-bold text-amber-400">You have a {resumableRuns[0]?.mode === 'trap' ? 'Trap Practice' : 'Smart Quiz'} in progress <span className="text-sm font-medium text-amber-400/60">({examName})</span></h3>
                                    <p className="text-slate-400 text-sm mt-1">Pick up where you left off.</p>
                                </div>
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
                                    <button
                                        onClick={async () => {
                                            if (!auth.currentUser) return;
                                            const runId = resumableRuns[0]?.id;
                                            if (!runId) return;
                                            try {
                                                const runRef = doc(db, 'quizRuns', auth.currentUser.uid, 'runs', runId);
                                                await updateDoc(runRef, { status: 'abandoned', updatedAt: serverTimestamp() });
                                            } catch (e) {
                                                console.error('[Dashboard] Failed to dismiss run:', e);
                                            }
                                        }}
                                        className="px-4 py-2 sm:py-3 text-slate-400 hover:text-red-400 text-sm font-medium transition-colors"
                                        title="Dismiss this quiz"
                                    >
                                        Dismiss
                                    </button>
                                    <button
                                        onClick={() => navigate('/app/quiz', { state: { runId: resumableRuns[0].id, resume: true } })}
                                        className="px-4 sm:px-6 py-2.5 sm:py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold rounded-xl text-base shadow-lg shadow-amber-500/20 transition-colors"
                                    >
                                        Resume
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Mastery Rings Grid */}
                        {contextDiagnostic === false && recentActivity.length === 0 && (
                            <p className="text-sm text-slate-500 mt-6 mb--2 text-center">
                                Complete the diagnostic to personalize your mastery tracking.
                            </p>
                        )}
                        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mt-6 md:mt-8 ${contextDiagnostic === false && recentActivity.length === 0 ? 'opacity-50' : ''} transition-opacity`}>
                            {examDomains.map((domain, index) => {
                                const colors = ['#C084FC', '#F472B6', '#34D399']; // Neon Purple, Neon Pink, Neon Green
                                const color = colors[index % colors.length];
                                const mastered = domainMasteryCounts[domain] || 0;
                                const total = domainTotalCounts[domain] || 0;

                                return (
                                    <button
                                        key={domain}
                                        onClick={() => navigate('/app/quiz', { state: { filterDomain: domain } })}
                                        className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-2xl border border-slate-700 flex flex-col items-center hover:border-brand-500/50 hover:bg-slate-800/80 transition-all cursor-pointer group text-left w-full relative overflow-hidden"
                                    >
                                        <div className={`absolute top-0 left-0 w-1 h-full opacity-0 group-hover:opacity-100 transition-opacity`} style={{ backgroundColor: color }} />

                                        <MasteryRing percentage={getPercentage(domain)} color={color} label="" />

                                        <div className="mt-4 text-center">
                                            <h3 className="text-lg font-bold text-white group-hover:text-brand-300 transition-colors">{domain}</h3>
                                            <div className="mt-1">
                                                <div className="text-sm md:text-base font-medium text-slate-200">
                                                    {mastered} of {total} questions mastered
                                                </div>
                                                <div className="text-xs text-slate-400 mt-1">
                                                    Mastered: 75% accuracy, 5+ attempts, 2 of last 3 correct
                                                </div>
                                            </div>
                                            <div className="mt-4 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 duration-300">
                                                <span className="text-xs font-bold text-brand-400 uppercase tracking-widest border border-brand-500/30 px-4 py-1.5 rounded-full bg-brand-500/10 shadow-[0_0_10px_rgba(99,102,241,0.3)]">
                                                    Practice Domain
                                                </span>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                        <p className="text-xs text-slate-400 mt-2">These percentages reflect your lifetime mastery across all completed sessions for this exam.</p>

                        {/* Rolling Trend Indicator */}
                        <TrendIndicatorCard />

                        {/* Daily Goal */}
                        <div className="mt-8 bg-gradient-to-br from-brand-600 to-brand-900 rounded-2xl shadow-xl shadow-brand-900/50 p-4 sm:p-6 text-white relative overflow-hidden border border-brand-500/30">
                            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-brand-400 opacity-10 rounded-full blur-2xl"></div>
                            <div className="flex justify-between items-start mb-2 relative z-10">
                                <h3 className="text-lg font-bold font-display">Daily Goal</h3>
                                <button
                                    onClick={() => setIsEditingGoal(!isEditingGoal)}
                                    className="text-brand-200 hover:text-white transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                </button>
                            </div>

                            {
                                isEditingGoal ? (
                                    <div className="mb-4 relative z-10">
                                        <div className="flex gap-2">
                                            <input
                                                type="number"
                                                value={newGoal}
                                                onChange={(e) => setNewGoal(parseInt(e.target.value) || 0)}
                                                className="w-full bg-black/20 border border-brand-400/30 rounded-lg px-3 py-2 text-white placeholder-brand-300/50 focus:outline-none focus:border-brand-400"
                                            />
                                            <button
                                                onClick={saveGoal}
                                                className="bg-brand-500 text-white px-4 py-3 rounded-lg font-medium hover:bg-brand-400 transition-colors"
                                            >
                                                Save
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-end gap-2 mb-4 relative z-10">
                                            <span className="text-4xl font-bold">{dailyProgress}/{dailyGoal}</span>
                                            <span className="text-brand-200 mb-1 font-medium">questions</span>
                                        </div>
                                        <div className="w-full bg-black/20 rounded-full h-2 mb-4 backdrop-blur-sm relative z-10">
                                            <div
                                                className="bg-accent-400 h-2 rounded-full shadow-[0_0_10px_rgba(251,191,36,0.5)] transition-all duration-1000"
                                                style={{ width: `${Math.min((dailyProgress / dailyGoal) * 100, 100)}%` }}
                                            ></div>
                                        </div>
                                    </>
                                )
                            }
                            <p className="text-sm text-brand-100/80 relative z-10">
                                {dailyProgress >= dailyGoal
                                    ? "Daily goal reached — well done."
                                    : "Keep it up! Consistency is key to passing your exam."}
                            </p>
                        </div>

                        {/* Stats & Activity */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8 mt-6 md:mt-8">
                            {/* Recent Activity */}
                            <div className="lg:col-span-2 bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-6">
                                <h3 className="text-lg font-bold text-white mb-4 font-display">Recent Activity</h3>
                                <div className="space-y-3 max-h-64 md:max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800/50">
                                    <div className="space-y-3">
                                        {recentActivity.length === 0 ? (
                                            <p className="text-slate-400 text-sm">No recent activity. Take a quiz to see your progress!</p>
                                        ) : (
                                            (() => {
                                                let diagShown = false;
                                                return recentActivity.filter(a => {
                                                    if (a.mode === 'diagnostic' || a.quizType === 'diagnostic') {
                                                        if (diagShown) return false;
                                                        diagShown = true;
                                                    }
                                                    return true;
                                                });
                                            })().map((attempt) => {
                                                const label = ACTIVITY_MODE_LABELS[attempt.mode || ''] ?? "Smart Practice Quiz";
                                                const iconStyle = ACTIVITY_MODE_STYLES[attempt.mode || ''] ?? ACTIVITY_DEFAULT_STYLE;
                                                return (
                                                    <div key={attempt.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-700/30 border border-slate-700/50 hover:bg-slate-700/50 transition-colors">
                                                        <div className="flex items-center gap-4">
                                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold border ${iconStyle}`}>
                                                                Q
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <p className="font-medium text-slate-200">{label}</p>
                                                                    <span className="text-xs text-slate-500">
                                                                        {attempt.timestamp?.toDate ? attempt.timestamp.toDate().toLocaleString(undefined, {
                                                                            month: 'short',
                                                                            day: 'numeric',
                                                                            hour: 'numeric',
                                                                            minute: '2-digit'
                                                                        }) : 'Just now'}
                                                                    </span>
                                                                </div>
                                                                <p className="text-sm text-slate-500">{attempt.totalQuestions} Questions • <span className="text-base font-bold text-slate-300">{attempt.domain}</span></p>
                                                            </div>
                                                        </div>
                                                        {(attempt.mode === 'diagnostic' || attempt.quizType === 'diagnostic') ? (
                                                            <span className="px-3 py-1 rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20 text-sm font-medium">
                                                                Baseline captured
                                                            </span>
                                                        ) : (
                                                            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-sm font-medium">
                                                                {attempt.accuracy}%
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Thinking Traps Card */}
                            <ThinkingTrapsCard />
                        </div>
                    </div>
                </div>

                {/* Streak Modal */}
                {showStreakModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className="bg-slate-800 rounded-2xl p-4 sm:p-8 max-w-sm w-full border border-slate-700 shadow-2xl relative max-h-[90vh] overflow-y-auto">
                            <button
                                onClick={() => setShowStreakModal(false)}
                                className="absolute top-4 right-4 text-slate-400 hover:text-white"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                            <div className="text-center">
                                <div className="w-20 h-20 bg-brand-500/10 rounded-full flex items-center justify-center text-amber-400 mx-auto mb-6 border border-brand-500/20">
                                    <Flame className="h-10 w-10" strokeWidth={1.5} />
                                </div>
                                <h3 className="text-2xl font-bold text-white font-display mb-2">{userStreak} Day Streak!</h3>
                                <p className="text-slate-400 mb-6">
                                    You're on fire! Consistency is the #1 predictor of exam success. Keep showing up every day.
                                </p>
                                <PrimaryButton
                                    onClick={() => setShowStreakModal(false)}
                                    fullWidth
                                >
                                    Awesome!
                                </PrimaryButton>
                            </div>
                        </div>
                    </div>
                )}

                <ReportIssueModal
                    isOpen={showReportModal}
                    onClose={() => setShowReportModal(false)}
                />
        </>
    );
}



