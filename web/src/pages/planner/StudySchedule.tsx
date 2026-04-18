import { useEffect, useState } from 'react';
import { Calendar as CalendarIcon, CheckCircle, BookOpen, Brain, Clock, X, RefreshCw } from 'lucide-react';
import DashboardLink from '../../components/DashboardLink';
import { useAuth } from '../../App';
import { StudyPlanService } from '../../services/StudyPlanService';
import { useExam } from '../../contexts/ExamContext';
import type { StudyPlan, DailyTask } from '../../types/StudyPlan';
import { useNavigate, useLocation } from 'react-router-dom';
import MockExamConfigModal from '../../components/planner/MockExamConfigModal';
import { DEFAULT_EXAM_ID } from '../../config/exams';

// Injected reinforcement task after diagnostic/mock
interface InjectedTask {
    id: string;
    runId: string;
    domain: string;
    source: 'diagnostic' | 'mock-exam';
}

export default function StudySchedule() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [plan, setPlan] = useState<StudyPlan | null>(null);
    const [loading, setLoading] = useState(true);
    const [showExamConfig, setShowExamConfig] = useState(false);

    // Recalculation state
    const [recalculating, setRecalculating] = useState(false);
    const [recalcToast, setRecalcToast] = useState<{ show: boolean; domain: string | null; reason?: 'underMeasured' | 'lowestAccuracy'; error?: string }>({ show: false, domain: null });

    // Readiness state for mock exam gating (v15 trust fix)
    const [, setReadinessScore] = useState<number | null>(null);
    const [, setReadinessPreliminary] = useState(false);
    const [readinessLoaded, setReadinessLoaded] = useState(false);

    // Injected reinforcement task state (post-diagnostic/mock)
    const [, setInjectedTask] = useState<InjectedTask | null>(null);

    // Diagnostic context from navigation (used only for one-time exam date prompt)
    const fromDiagnostic = location.state?.source === 'diagnostic';

    // Exam date prompt state
    const EXAM_DATE_KEY = `exam_coach_${DEFAULT_EXAM_ID}_exam_date`;
    const [showExamDatePrompt, setShowExamDatePrompt] = useState(false);
    const [pendingExamDate, setPendingExamDate] = useState('');

    // Check if exam date prompt should be shown (one-time, on mount)
    useEffect(() => {
        const storedDate = localStorage.getItem(EXAM_DATE_KEY);
        if (!storedDate && fromDiagnostic) {
            setShowExamDatePrompt(true);
        }
    }, [fromDiagnostic]);

    const handleSaveExamDate = () => {
        if (pendingExamDate) {
            localStorage.setItem(EXAM_DATE_KEY, pendingExamDate);
        }
        setShowExamDatePrompt(false);
    };

    const handleSkipExamDate = () => {
        setShowExamDatePrompt(false);
    };


    // Use the global Exam context
    const { selectedExamId, examName, examDomains, loading: examLoading } = useExam();

    // v15: Reinforcement derived from plan.anchorDomain (single source of truth).
    // No independent diagnostic query — the plan IS the canonical domain source.
    useEffect(() => {
        if (!user || !plan?.anchorDomain) return;

        // Ack key uses plan ID + domain so it re-shows when plan is recalculated to a new domain
        const ackKey = `ec_reinforcement_ack_${plan.id}_${plan.anchorDomain}`;
        if (localStorage.getItem(ackKey)) return;

        setInjectedTask({
            id: `reinforcement-${plan.id}`,
            runId: plan.id || '',
            domain: plan.anchorDomain,
            source: 'diagnostic'
        });
    }, [user, plan]);

    // Check readiness BEFORE Today's Mission renders (v15 trust fix)
    // Score thresholds: <50 High Risk, 50-69 Borderline, >=70 Ready
    useEffect(() => {
        if (!user || !selectedExamId) return;

        const checkReadiness = async () => {
            try {
                const { PredictionEngine } = await import('../../services/PredictionEngine');
                const report = await PredictionEngine.calculateReadiness(user.uid, selectedExamId, examDomains);
                setReadinessScore(report?.overallScore ?? 100);
                setReadinessPreliminary(report?.isPreliminary ?? false);
            } catch (error) {
                console.error('Readiness check failed:', error);
                setReadinessScore(100); // Default to safe if check fails
            } finally {
                setReadinessLoaded(true);
            }
        };

        checkReadiness();
    }, [user, selectedExamId]);

    useEffect(() => {
        if (!user || !selectedExamId) return;

        const loadPlan = async () => {
            setLoading(true);
            try {
                // Use ID from context
                console.log("StudySchedule loading plan for exam:", selectedExamId);
                const currentPlan = await StudyPlanService.getCurrentPlan(user.uid, selectedExamId);
                if (!currentPlan) {
                    navigate('/app/planner/setup');
                    return;
                }

                // Auto-recalculate if plan has no anchorDomain (e.g. created without diagnostic)
                if (!currentPlan.anchorDomain) {
                    try {
                        const result = await StudyPlanService.recalculatePlanFromProgress(
                            user.uid, selectedExamId, currentPlan, examName || undefined, examDomains || []
                        );
                        if (result.success && result.domain) {
                            const freshPlan = result.plan
                                ?? await StudyPlanService.getCurrentPlan(user.uid, selectedExamId);
                            setPlan(freshPlan ? { ...freshPlan, anchorDomain: result.domain } : currentPlan);
                            return;
                        }
                    } catch (e) {
                        console.warn('Auto-recalculate failed, showing plan as-is:', e);
                    }
                }

                setPlan(currentPlan);
            } catch (error) {
                console.error("Failed to load plan", error);
            } finally {
                setLoading(false);
            }
        };

        loadPlan();
    }, [user, navigate, selectedExamId]);

    if (loading || !readinessLoaded) return <div className="p-8 text-center text-slate-400">Loading your personalized roadmap...</div>;
    if (!plan) return null;

    // Group tasks by date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Sort tasks — used by deepenTask (tasks may be absent on lean plans)
    const sortedTasks: DailyTask[] = [...(plan.tasks || [])].sort((a, b) => a.date.getTime() - b.date.getTime());

    // Reading task for Deepen Understanding section
    // Priority: anchor domain + incomplete today/future → anchor domain any → any incomplete → any reading task
    const deepenTask = sortedTasks.find(
        t => t.activityType === 'reading' && t.domain === plan.anchorDomain && !t.completed && t.date >= today
    ) || sortedTasks.find(
        t => t.activityType === 'reading' && t.domain === plan.anchorDomain && !t.completed
    ) || sortedTasks.find(
        t => t.activityType === 'reading' && !t.completed
    ) || sortedTasks.find(
        t => t.activityType === 'reading'
    );

    const handleToggleComplete = async (taskId: string, currentStatus: boolean) => {
        if (!plan || !user) return;

        // Optimistic update
        setPlan(prev => {
            if (!prev) return null;
            return {
                ...prev,
                tasks: (prev.tasks || []).map(t =>
                    t.id === taskId ? { ...t, completed: !currentStatus } : t
                )
            };
        });

        try {
            await StudyPlanService.markTaskComplete(plan.id!, taskId, !currentStatus);
        } catch (error) {
            console.error("Failed to update task", error);
            // Revert on failure
            setPlan(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    tasks: (prev.tasks || []).map(t =>
                        t.id === taskId ? { ...t, completed: currentStatus } : t
                    )
                };
            });
        }
    };

    // Handle recalculation based on current progress
    const handleRecalculatePlan = async () => {
        if (!user || !plan || !selectedExamId) return;

        setRecalculating(true);
        setRecalcToast({ show: false, domain: null });

        try {
            const result = await StudyPlanService.recalculatePlanFromProgress(
                user.uid,
                selectedExamId,
                plan,
                examName || undefined,
                examDomains || []
            );

            if (result.success && result.domain) {
                // result.plan is built from getDoc(planRef) inside recalculatePlanFromProgress —
                // always the exact document that was updated, bypassing query-mismatch risk.
                // Fall back to getCurrentPlan only if result.plan is unexpectedly absent.
                const freshPlan = result.plan
                    ?? await StudyPlanService.getCurrentPlan(user.uid, selectedExamId);
                if (freshPlan) {
                    setPlan({ ...freshPlan, anchorDomain: result.domain });
                } else {
                    setPlan(prev => prev ? { ...prev, anchorDomain: result.domain! } : prev);
                }
                setRecalcToast({ show: true, domain: result.domain, reason: result.reason });
                // Auto-hide toast after 5 seconds
                setTimeout(() => setRecalcToast({ show: false, domain: null }), 5000);
            } else {
                setRecalcToast({ show: true, domain: null, error: result.error || 'Could not update plan.' });
                setTimeout(() => setRecalcToast({ show: false, domain: null }), 5000);
            }
        } catch (error) {
            console.error('Recalculation failed:', error);
            setRecalcToast({ show: true, domain: null, error: 'Failed to update plan. Please try again.' });
            setTimeout(() => setRecalcToast({ show: false, domain: null }), 5000);
        } finally {
            setRecalculating(false);
        }
    };

    return (
        <div className="p-4 md:p-10 max-w-6xl mx-auto text-slate-100">
            {/* Back to Dashboard */}
            <DashboardLink />

            {/* Guided Plan Microcopy */}
            <p className="text-sm text-slate-500 mb-4">
                You're on the <span className="text-slate-400">Guided Plan</span>. Complete today's Smart Practice — your plan adapts as you go.
            </p>

            <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold font-display text-white mb-2">My {examName || ''} Plan</h1>
                    <p className="text-slate-400 flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4" />
                        Target Exam Date: <span className="text-emerald-400 font-bold">{plan.examDate.toLocaleDateString()}</span>
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 md:gap-3">
                    <div className="bg-slate-800 px-3 md:px-4 py-2 rounded-lg border border-slate-700 text-sm">
                        {plan.weeklyHours} hrs / week
                    </div>
                    {!selectedExamId || examLoading ? (
                        <span className="px-3 md:px-4 py-2 rounded-lg text-sm text-slate-500 border border-slate-700 cursor-not-allowed">
                            Please select an exam.
                        </span>
                    ) : (
                        <button
                            onClick={handleRecalculatePlan}
                            disabled={recalculating}
                            className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 px-3 md:px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-indigo-500 hover:border-indigo-400 flex items-center gap-2"
                            title="Adjusts your plan based on your current quiz performance"
                        >
                            <RefreshCw className={`w-4 h-4 ${recalculating ? 'animate-spin' : ''}`} />
                            {recalculating ? 'Updating...' : 'Update Plan'}
                        </button>
                    )}
                    <button
                        onClick={() => navigate('/app/planner/setup', {
                            state: {
                                editMode: true,
                                currentSettings: {
                                    examDate: plan.examDate,
                                    weeklyHours: plan.weeklyHours
                                }
                            }
                        })}
                        className="bg-slate-700 hover:bg-slate-600 px-3 md:px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-slate-600 hover:border-slate-500"
                    >
                        Edit Settings
                    </button>
                </div>
            </header>

            {/* Diagnostic Context Banner — v15: reads plan.anchorDomain (single source of truth) */}
            {plan.anchorDomain && (
                <div className="mb-6 bg-indigo-900/30 border border-indigo-500/30 rounded-xl p-4">
                    <p className="text-indigo-200 text-sm">
                        <span className="font-semibold">&#10003; Your study plan automatically adapts based on your performance.</span>
                        <span className="block mt-1 text-indigo-300">
                            Your plan focuses on <strong className="text-white">{plan.anchorDomain}</strong>, your biggest opportunity for improvement.
                        </span>
                    </p>
                </div>
            )}


            {/* Exam Date Prompt Modal */}
            {showExamDatePrompt && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-300">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h3 className="text-xl font-bold text-white font-display">When is your {examName || 'certification'} exam?</h3>
                                <p className="text-slate-400 text-sm mt-1">This helps us pace your study plan.</p>
                            </div>
                            <button
                                onClick={handleSkipExamDate}
                                className="text-slate-500 hover:text-slate-300 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <input
                            type="date"
                            value={pendingExamDate}
                            onChange={(e) => setPendingExamDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all mb-4"
                        />

                        <div className="flex gap-3">
                            <button
                                onClick={handleSkipExamDate}
                                className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium py-2.5 rounded-xl transition-all text-sm"
                            >
                                I'll add this later
                            </button>
                            <button
                                onClick={handleSaveExamDate}
                                disabled={!pendingExamDate}
                                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-xl transition-all text-sm"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Today's Mission */}
            <section className="mb-12">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <span className="w-2 h-8 bg-indigo-500 rounded-full"></span>
                    Today's Mission
                </h2>

                <div className="grid gap-4">
                    {plan?.anchorDomain ? (
                        <div className="bg-gradient-to-r from-amber-900/40 to-slate-800 border-2 border-amber-500/50 rounded-xl p-4 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl -mr-12 -mt-12 pointer-events-none"></div>

                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="bg-amber-600/20 text-amber-300 text-xs font-semibold px-2 py-1 rounded">
                                            PRIORITY
                                        </span>
                                        <span className="text-xs text-slate-400">~20 min</span>
                                    </div>

                                    <h3 className="font-bold text-white">
                                        Focused Reinforcement: {plan.anchorDomain}
                                    </h3>

                                    <p className="text-xs text-slate-400 mt-1">
                                        This is currently your highest-impact domain for improvement.
                                        Strengthening this area will raise your overall performance fastest.
                                    </p>
                                </div>

                                <button
                                    onClick={() =>
                                        navigate('/app/quiz', {
                                            state: {
                                                mode: 'weakest',
                                                filterDomain: plan.anchorDomain,
                                                source: 'reinforcement'
                                            }
                                        })
                                    }
                                    className="shrink-0 bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors"
                                >
                                    Start Domain Quiz
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 text-center text-slate-400">
                            <p>No tasks available yet.</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Deepen Understanding */}
            <section>
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <span className="w-2 h-8 bg-slate-600 rounded-full"></span>
                    Deepen Understanding
                </h2>
                <div className="grid gap-4">
                    {deepenTask ? (
                        <TaskCard
                            key={deepenTask.id}
                            task={deepenTask}
                            onToggleComplete={() => handleToggleComplete(deepenTask.id, deepenTask.completed)}
                            onStartMock={() => setShowExamConfig(true)}
                        />
                    ) : (
                        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                            <div className="flex items-start gap-4">
                                <BookOpen className="w-8 h-8 text-indigo-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="font-semibold text-white mb-1">
                                        Review: {plan.anchorDomain || 'Core Concepts'}
                                    </h3>
                                    <p className="text-sm text-slate-400">
                                        Spend 20–30 minutes reviewing key concepts in your focus domain.
                                        Use the Coach Breakdown after each quiz question for targeted explanations.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* Recalculation Toast */}
            {recalcToast.show && (
                <div className={`fixed bottom-6 right-6 z-50 px-5 py-4 rounded-xl shadow-lg border ${recalcToast.error
                    ? 'bg-red-900/90 border-red-500/50 text-red-100'
                    : 'bg-emerald-900/90 border-emerald-500/50 text-emerald-100'
                    }`}>
                    <div className="flex items-center gap-3">
                        {recalcToast.error ? (
                            <X className="w-5 h-5" />
                        ) : (
                            <CheckCircle className="w-5 h-5" />
                        )}
                        <span className="font-medium">
                            {recalcToast.error || (
                                recalcToast.reason === 'underMeasured'
                                    ? `Plan updated. We're strengthening your coverage in ${recalcToast.domain}.`
                                    : `Plan updated. ${recalcToast.domain} is currently your weakest domain based on recent performance.`
                            )}
                        </span>
                    </div>
                </div>
            )}

            <MockExamConfigModal
                isOpen={showExamConfig}
                onClose={() => setShowExamConfig(false)}
                onStart={(config) => {
                    setShowExamConfig(false);
                    navigate('/app/simulator', {
                        state: config
                    });
                }}
            />
        </div>
    );
}

// Helper to generate consistent colors from domain names
const getDomainColor = (domain: string) => {
    const colors = [
        'bg-pink-500/10 text-pink-400 border-pink-500/20',
        'bg-amber-500/10 text-amber-400 border-amber-500/20',
        'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        'bg-blue-500/10 text-blue-400 border-blue-500/20',
        'bg-purple-500/10 text-purple-400 border-purple-500/20',
        'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
        'bg-rose-500/10 text-rose-400 border-rose-500/20',
        'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    ];

    if (domain === 'All Domains') return 'bg-slate-500/10 text-slate-400 border-slate-500/20';

    // Simple hash
    let hash = 0;
    for (let i = 0; i < domain.length; i++) {
        hash = domain.charCodeAt(i) + ((hash << 5) - hash);
    }

    const index = Math.abs(hash) % colors.length;
    return colors[index];
};

function TaskCard({ task, isUpcoming = false, onToggleComplete, onStartMock }: { task: DailyTask, isUpcoming?: boolean, onToggleComplete?: () => void, onStartMock?: () => void }) {
    const navigate = useNavigate();

    const handleAction = () => {
        if (task.activityType === 'mock-exam') {
            if (onStartMock) onStartMock();
        } else if (task.activityType === 'quiz') {
            // Route based on quiz type
            if (task.topic.startsWith('Smart Quiz')) {
                navigate('/app/quiz', { state: { mode: 'smart' } });
            } else {
                navigate('/app/quiz', { state: { mode: 'domain', filterDomain: task.domain } });
            }
        } else {
            // For reading/review, toggle complete
            if (onToggleComplete) {
                onToggleComplete();
            }
        }
    };

    return (
        <div className={`
            flex items-center gap-4 p-4 rounded-xl border transition-all
            ${isUpcoming ? 'bg-slate-900 border-slate-800' : 'bg-slate-800 border-slate-700 hover:border-indigo-500/50'}
        `}>
            {/* Icon based on Type */}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0
                ${task.activityType === 'quiz' ? 'bg-purple-500/10 text-purple-400' :
                    task.activityType === 'mock-exam' ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'}
            `}>
                {task.activityType === 'quiz' ? <Brain className="w-5 h-5" /> :
                    task.activityType === 'mock-exam' ? <Clock className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded border ${getDomainColor(task.domain)}`}>
                        {task.domain}
                    </span>
                    {isUpcoming && <span className="text-xs text-slate-500">{task.date.toLocaleDateString()}</span>}
                </div>
                <h3 className="font-bold text-slate-200 truncate">{task.topic}</h3>
                <p className="text-xs text-slate-400 mt-1">
                    {task.activityType === 'reading'
                        ? "Read a chapter or watch a video lesson on this topic."
                        : task.activityType === 'quiz'
                            ? (task.topic.startsWith('Smart Quiz')
                                ? "Smart Quiz — Mixed questions for reinforcement."
                                : `Domain Quiz — Focus on ${task.domain} concepts.`)
                            : "Mock Exam — Full length simulation to build endurance. Block out 4 hours."}
                </p>
            </div>

            <div className="flex items-center gap-4 text-slate-500 text-sm">
                <div className="flex items-center gap-1" title="Estimated duration">
                    <Clock className="w-4 h-4" />
                    {task.durationMinutes}m
                </div>
                {!isUpcoming && (
                    <button
                        onClick={handleAction}
                        className={`w-6 h-6 rounded-full border-2 border-slate-600 transition-colors flex items-center justify-center group
                            ${task.activityType === 'reading' ? 'hover:border-emerald-500 hover:bg-emerald-500/10' : 'hover:border-indigo-500 hover:bg-indigo-500/10'}
                        `}
                        title={task.activityType === 'reading' ? "Mark as Complete" : "Start Activity"}
                    >
                        {task.activityType === 'reading' ? (
                            <CheckCircle className={`w-4 h-4 text-emerald-500 transition-opacity ${task.completed ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
                        ) : (
                            <div className="w-2 h-2 bg-indigo-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}

                    </button>
                )}
            </div>
        </div>
    );
}
