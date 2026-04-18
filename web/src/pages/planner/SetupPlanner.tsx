import { useState, useEffect } from 'react';
import { Calendar, Clock, ChevronRight, Check } from 'lucide-react';
import { useAuth } from '../../App';
import { StudyPlanService } from '../../services/StudyPlanService';
import { UsageEventService } from '../../services/UsageEventService';
import { useNavigate, useLocation } from 'react-router-dom';
import { useExam } from '../../contexts/ExamContext';
import { DEFAULT_EXAM_ID } from '../../config/exams';

export default function SetupPlanner() {
    const { user } = useAuth();
    const { selectedExamId, examName, examDomains } = useExam();
    const navigate = useNavigate();
    const location = useLocation();

    // Check if we are in edit mode
    const editMode = location.state?.editMode;
    const currentSettings = location.state?.currentSettings;

    // Check if coming from diagnostic
    const fromDiagnostic = location.state?.source === 'diagnostic';
    const recommendedDomain = location.state?.recommendedDomain;

    const [step, setStep] = useState(1);
    const [examDate, setExamDate] = useState('');
    const [weeklyHours, setWeeklyHours] = useState(10);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (editMode && currentSettings) {
            // Pre-fill data
            // examDate in Date object or string? 
            // Usually passed as Date object from StudySchedule, need YYYY-MM-DD string for input
            if (currentSettings.examDate) {
                const d = new Date(currentSettings.examDate);
                setExamDate(d.toISOString().split('T')[0]);
            }
            if (currentSettings.weeklyHours) {
                setWeeklyHours(currentSettings.weeklyHours);
            }
        }
    }, [editMode, currentSettings]);

    const handleGenerate = async () => {
        if (!user || !examDate) return;

        setLoading(true);
        try {
            // Use context ID consistently
            const examId = selectedExamId || DEFAULT_EXAM_ID;

            // Guard: domains must be loaded before generating a plan
            if (!examDomains || examDomains.length === 0) {
                alert("Exam domains haven't loaded yet. Please wait a moment and try again.");
                setLoading(false);
                return;
            }

            // Always archive any existing active plans for this exam before creating a new one.
            // Previously guarded by editMode — but fresh plan creation also creates a second
            // active document, causing getCurrentPlan() to return the wrong doc after recalculate.
            await StudyPlanService.archiveCurrentPlan(user.uid, examId);

            const plan = StudyPlanService.generatePlan(
                user.uid,
                examId,
                new Date(examDate),
                weeklyHours,
                examName || undefined,
                examDomains || [],
                recommendedDomain || undefined  // Pass diagnostic's lowest domain as anchor
            );

            await StudyPlanService.savePlan(plan);
            UsageEventService.emit(user.uid, 'completion');

            // Navigate to main planner view
            navigate('/app/planner');
        } catch (error: any) {
            console.error("Plan creation failed:", error);
            alert(`Failed to create plan: ${error?.message || error}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl">
                {/* Flexible Practice Microcopy - shown when user doesn't have a plan yet */}
                {!editMode && !fromDiagnostic && (
                    <p className="text-sm text-slate-500 text-center mb-6">
                        You're practicing freely. Your diagnostic unlocks a personalized study plan.
                    </p>
                )}

                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold font-display text-white mb-2">
                        {editMode ? 'Update Your Study Plan' : 'Your Custom Plan is Ready.'}
                    </h1>
                    <p className="text-slate-400">
                        {editMode
                            ? 'Adjust your schedule and availability.'
                            : fromDiagnostic
                                ? "Based on your diagnostic results, I've designed a schedule to target your specific gaps."
                                : "Let's create a personalized study plan for your exam."}
                    </p>
                    {fromDiagnostic && recommendedDomain && (
                        <p className="text-indigo-400 text-sm mt-2">
                            We'll prioritize <strong>{recommendedDomain}</strong> to maximize your improvement.
                        </p>
                    )}
                </div>

                {/* Progress Steps */}
                <div className="flex justify-center gap-2 mb-8">
                    <div className={`h-1 flex-1 rounded-full ${step >= 1 ? 'bg-indigo-500' : 'bg-slate-700'}`}></div>
                    <div className={`h-1 flex-1 rounded-full ${step >= 2 ? 'bg-indigo-500' : 'bg-slate-700'}`}></div>
                </div>

                {step === 1 && (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-slate-300 font-medium mb-2 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-indigo-400" />
                                When is your exam?
                            </label>
                            <input
                                type="date"
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                value={examDate}
                                onChange={(e) => setExamDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                            />
                        </div>

                        <button
                            onClick={() => setStep(2)}
                            disabled={!examDate}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                        >
                            Next Step <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-slate-300 font-medium mb-4 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-indigo-400" />
                                Hours per week for study: <span className="text-white font-bold">{weeklyHours}h</span>
                            </label>
                            <input
                                type="range"
                                min="2"
                                max="40"
                                step="1"
                                value={weeklyHours}
                                onChange={(e) => setWeeklyHours(parseInt(e.target.value))}
                                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                            />
                            <div className="flex justify-between text-xs text-slate-500 mt-2">
                                <span>Casual (2h)</span>
                                <span>Intense (40h)</span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setStep(1)}
                                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 rounded-xl transition-all"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleGenerate}
                                disabled={loading}
                                className="flex-[2] bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        {editMode ? 'Update Plan' : 'Generate Plan'} <Check className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
