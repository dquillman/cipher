
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { ArrowLeft, Play, History, Clock, FileText, Award, Lock } from 'lucide-react';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useExam } from '../contexts/ExamContext';
import { EXAMS, isExam } from '../config/exams';
import { applyReadinessConfidence } from '../utils/readinessConfidence';
import { getMockEligibility } from '../utils/mockEligibility';
import { getAnsweredCount } from '../utils/questionMetrics';


interface SimulationAttempt {
    id: string;
    score: number;
    totalQuestions: number;
    timestamp: any;
    timeSpent?: number;
    mode: string;
}

export default function SimulatorIntro() {
    const { isPro } = useSubscription();
    const navigate = useNavigate();
    const { examName, selectedExamId: activeExamId, examDomains, hasCompletedDiagnostic } = useExam();
    const examConfig = Object.values(EXAMS).find(e => isExam(activeExamId, e.id));
    const mockConfig = examConfig?.fullMock ?? { questionCount: 50, durationMinutes: 60 };
    const hasFullMock = examConfig?.fullMock != null;
    const [attempts, setAttempts] = useState<SimulationAttempt[]>([]);
    const [loading, setLoading] = useState(true);
    const [readiness, setReadiness] = useState<any>(null);
    const [userXp, setUserXp] = useState(0);

    useEffect(() => {
        const checkReadiness = async () => {
            if (!auth.currentUser) return;
            try {
                const { PredictionEngine } = await import('../services/PredictionEngine');
                const report = await PredictionEngine.calculateReadiness(auth.currentUser.uid, activeExamId, examDomains);
                setReadiness(report);

                // Fetch XP for confidence modifier
                const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    let effectiveXp = 0;
                    if (activeExamId && data.examXP && typeof data.examXP[activeExamId] === 'number') {
                        effectiveXp = data.examXP[activeExamId];
                    } else {
                        effectiveXp = 0;
                    }
                    setUserXp(effectiveXp);
                }
            } catch (err) {
                console.error("Readiness check failed", err);
            }
        };

        const fetchHistory = async () => {
            if (!auth.currentUser) return;
            try {
                const q = query(
                    collection(db, 'quizRuns', auth.currentUser.uid, 'runs'),
                    where('examId', '==', activeExamId),
                    where('mode', '==', 'simulation'),
                    where('status', '==', 'completed'),
                    orderBy('completedAt', 'desc')
                );

                let snapshot;
                try {
                    snapshot = await getDocs(q);
                } catch {
                    // Fallback if composite index missing
                    const fallbackQ = query(
                        collection(db, 'quizRuns', auth.currentUser!.uid, 'runs'),
                        where('status', '==', 'completed')
                    );
                    const fallbackSnap = await getDocs(fallbackQ);
                    const filtered = fallbackSnap.docs
                        .map(doc => ({ id: doc.id, ...doc.data() }))
                        .filter((r: any) => r.examId === activeExamId && r.mode === 'simulation')
                        .sort((a: any, b: any) => (b.completedAt?.seconds || 0) - (a.completedAt?.seconds || 0));
                    setAttempts(filtered.map((r: any) => ({
                        id: r.id,
                        score: r.results?.score ?? 0,
                        totalQuestions: getAnsweredCount(r),
                        timestamp: r.completedAt,
                        timeSpent: r.results?.timeSpent,
                        mode: r.mode,
                    })));
                    return;
                }

                const data = snapshot.docs.map(doc => {
                    const r = doc.data();
                    return {
                        id: doc.id,
                        score: r.results?.score ?? 0,
                        totalQuestions: getAnsweredCount(r),
                        timestamp: r.completedAt,
                        timeSpent: r.results?.timeSpent,
                        mode: r.mode,
                    };
                }) as SimulationAttempt[];
                setAttempts(data);
            } catch (error) {
                console.error("Error fetching simulation history:", error);
            } finally {
                setLoading(false);
            }
        };

        checkReadiness();
        fetchHistory();
    }, [activeExamId]);

    // ... (rest of history fetch)

    // Gate Logic (uses RCM-adjusted score so XP confidence influences gating)
    const displayedScore = readiness ? applyReadinessConfidence(readiness.overallScore, userXp) : null;
    const isBorderline = displayedScore !== null && displayedScore >= 50 && displayedScore < 70;
    const eligibility = getMockEligibility({ hasCompletedDiagnostic: hasCompletedDiagnostic ?? false, readiness: displayedScore, isPro });

    const formatTime = (seconds?: number) => {
        if (!seconds) return '--:--';
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}m ${s}s`;
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return '';
        // Handle Firestore Timestamp or JS Date
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Override for pro users who want to ignore warning? 
    // For now, strict warning but allow click with confirm?
    // Implementation Plan says: "Strict warning to avoid complete lock-out"

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col p-4 md:p-8 font-sans">
            <div className="max-w-5xl mx-auto w-full">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => navigate('/app')}
                        className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 transition-colors text-slate-400 hover:text-white"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold font-display text-white">Exam Simulator</h1>
                        {examName && <span className="text-sm font-bold text-indigo-400 uppercase tracking-wider mb-1 block">{examName}</span>}
                        <p className="text-slate-400">Full mock exam environment.</p>
                    </div>
                </div>

                {/* Readiness Gate Banner */}
                {readiness && (eligibility.reason === 'low-readiness' || isBorderline) && (
                    <div className={`mb-6 md:mb-8 p-4 md:p-6 rounded-2xl border ${eligibility.reason === 'low-readiness' ? 'bg-red-500/10 border-red-500/30' : 'bg-yellow-500/10 border-yellow-500/30'}`}>
                        <div className="flex items-start gap-3 md:gap-4">
                            <div className={`p-2 md:p-3 rounded-full flex-shrink-0 ${eligibility.reason === 'low-readiness' ? 'bg-red-500/20 text-red-500' : 'bg-yellow-500/20 text-yellow-500'}`}>
                                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            </div>
                            <div>
                                <h3 className={`text-base md:text-lg font-bold mb-1 ${eligibility.reason === 'low-readiness' ? 'text-red-400' : 'text-yellow-400'}`}>
                                    {eligibility.reason === 'low-readiness' ? 'High Risk of Failure Detected' : 'Readiness is Borderline'}
                                </h3>
                                <p className="text-slate-300 text-sm md:text-base mb-4 leading-relaxed">
                                    Your Smart Readiness Score is <strong>{displayedScore}%</strong>.
                                    {eligibility.reason === 'low-readiness'
                                        ? " A full exam right now is unlikely to give you useful feedback. We strongly recommend Verbal Mode or Domain Practice first."
                                        : " You may pass, but it will be close. Review your weakest domains before starting."}
                                </p>
                                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                                    <button
                                        onClick={() => navigate('/app/verbal')}
                                        className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-3 rounded-lg font-medium text-sm border border-slate-600 transition-colors"
                                    >
                                        Go to Verbal Mode
                                    </button>
                                    <button
                                        onClick={() => navigate('/app')}
                                        className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-3 rounded-lg font-medium text-sm border border-slate-600 transition-colors"
                                    >
                                        Practice Weakest Domain
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Simulator Options */}
                {eligibility.reason === 'not-pro' ? (
                    <div className="mb-8 lg:mb-12 bg-slate-800/50 border border-slate-700 rounded-2xl p-5 md:p-8 text-center">
                        <Lock className="w-8 h-8 text-slate-500 mx-auto mb-3" />
                        <h2 className="text-xl font-bold text-white mb-2">Pro Feature Only</h2>
                        <p className="text-slate-400 text-sm mb-4">Exam simulators are available for Pro members.</p>
                        <button
                            onClick={() => navigate('/app/pricing')}
                            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 text-white font-bold py-2 px-6 rounded-lg transition-all"
                        >
                            Upgrade to Pro
                        </button>
                    </div>
                ) : (
                    <div className={`grid grid-cols-1 ${hasFullMock ? 'md:grid-cols-2' : ''} gap-4 mb-8 lg:mb-12`}>
                        {/* Practice Simulator */}
                        <button
                            onClick={() => {
                                if (eligibility.reason === 'low-readiness') {
                                    if (!window.confirm("Your readiness score is low. Are you sure you want to proceed?")) return;
                                }
                                navigate('/app/simulator/exam', { state: { mode: 'practice', count: 50, durationMinutes: 60 } });
                            }}
                            className="group bg-gradient-to-br from-indigo-900/50 to-slate-900 border border-indigo-500/30 rounded-2xl p-5 md:p-8 text-left relative overflow-hidden shadow-xl hover:border-indigo-400/50 transition-all"
                        >
                            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                                        <Play className="w-5 h-5 text-indigo-400 fill-current" />
                                    </div>
                                    <h2 className="text-xl md:text-2xl font-bold text-white">Practice Simulator</h2>
                                </div>
                                <div className="flex flex-wrap gap-3 mb-4 text-sm text-slate-300">
                                    <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-indigo-400" /> 50 Questions</span>
                                    <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-pink-400" /> ~60 Minutes</span>
                                    <span className="flex items-center gap-1.5"><Award className="w-3.5 h-3.5 text-yellow-400" /> No Hints</span>
                                </div>
                                <p className="text-sm text-slate-400 leading-relaxed">Quick readiness check under timed exam conditions.</p>
                            </div>
                        </button>

                        {/* Full Mock Exam — only shown when config differs from practice */}
                        {hasFullMock && (
                            <button
                                onClick={() => {
                                    if (eligibility.reason === 'low-readiness') {
                                        if (!window.confirm("CRITICAL WARNING: Your readiness score indicates a high chance of failure. Are you sure you want to proceed?")) return;
                                    }
                                    navigate('/app/simulator/exam', { state: { mode: 'full-mock' } });
                                }}
                                className="group bg-gradient-to-br from-purple-900/50 to-slate-900 border border-purple-500/30 rounded-2xl p-5 md:p-8 text-left relative overflow-hidden shadow-xl hover:border-purple-400/50 transition-all"
                            >
                                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                            <Play className="w-5 h-5 text-purple-400 fill-current" />
                                        </div>
                                        <h2 className="text-xl md:text-2xl font-bold text-white">Full Mock Exam</h2>
                                    </div>
                                    <div className="flex flex-wrap gap-3 mb-4 text-sm text-slate-300">
                                        <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-purple-400" /> {mockConfig.questionCount} Questions</span>
                                        <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-pink-400" /> {mockConfig.durationMinutes} Minutes</span>
                                        <span className="flex items-center gap-1.5"><Award className="w-3.5 h-3.5 text-yellow-400" /> No Hints</span>
                                    </div>
                                    <p className="text-sm text-slate-400 leading-relaxed">Full-length exam simulation matching real test conditions.</p>
                                </div>
                            </button>
                        )}
                    </div>
                )}

                {/* Exam Tips */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 md:p-6 mb-8 lg:mb-12">
                    <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3">Exam Tips</h3>
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 text-slate-400 text-sm">
                        <span>1. Flag questions for review if you're unsure. Don't get stuck.</span>
                        <span>2. Pace yourself — roughly 1 minute per question.</span>
                    </div>
                </div>

                {/* History Table */}
                <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl overflow-hidden">
                    <div className="p-6 border-b border-slate-700/50 flex items-center gap-3">
                        <History className="w-5 h-5 text-slate-400" />
                        <h3 className="text-lg font-bold text-white">Past Attempts</h3>
                    </div>

                    {loading ? (
                        <div className="p-8 text-center text-slate-500">Loading history...</div>
                    ) : attempts.length === 0 ? (
                        <div className="p-12 text-center text-slate-500">
                            <p>No exams taken yet.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-400">
                                <thead className="bg-slate-800/50 text-slate-200 uppercase text-xs font-bold">
                                    <tr>
                                        <th className="px-6 py-4">Date</th>
                                        <th className="px-6 py-4">Score</th>
                                        <th className="px-6 py-4">Time</th>
                                        <th className="px-6 py-4 text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700/50">
                                    {attempts.map((attempt) => {
                                        const percentage = Math.round((attempt.score / attempt.totalQuestions) * 100);
                                        const passed = percentage >= 70;
                                        return (
                                            <tr key={attempt.id} className="hover:bg-slate-800/30 transition-colors">
                                                <td className="px-6 py-4 text-white font-medium">{formatDate(attempt.timestamp)}</td>
                                                <td className="px-6 py-4">
                                                    <span className="text-white font-bold">{percentage}%</span>
                                                    <span className="text-slate-500 ml-1">({attempt.score}/{attempt.totalQuestions})</span>
                                                </td>
                                                <td className="px-6 py-4">{formatTime(attempt.timeSpent)}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${passed
                                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                        : 'bg-red-500/10 text-red-500 border-red-500/20'
                                                        }`}>
                                                        {passed ? 'PASSED' : 'FAIL'}
                                                    </span>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
