import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Layout,
    CheckCircle2,
    Zap,
    Target,
    Trophy,
    MessageSquare,
    CalendarDays,
    RefreshCw,
    BarChart3,
    Sparkles
} from 'lucide-react';
import DashboardLink from '../components/DashboardLink';
import ReportIssueModal from '../components/ReportIssueModal';

export default function Help() {
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-brand-500/30">
            {/* Header */}
            <header className="bg-slate-800/50 backdrop-blur-md border-b border-slate-700 sticky top-0 z-50">
                <div className="mx-auto max-w-5xl px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400">
                            <Zap className="w-6 h-6" />
                        </div>
                        <h1 className="text-xl font-bold font-display text-white">
                            Success Roadmap
                        </h1>
                    </div>
                </div>
            </header>

            <div className="mx-auto max-w-2xl px-6 py-12">
                <DashboardLink />

                {/* Intro */}
                <div className="text-center mb-16 space-y-4">
                    <h2 className="text-4xl font-bold font-display text-white">Your Path to Mastery</h2>
                    <p className="text-lg text-slate-400">
                        Two ways to prepare. Pick the one that fits your style.
                    </p>
                </div>

                {/* Path Selection */}
                <div className="grid md:grid-cols-2 gap-6 mb-12">
                    {/* Guided Plan - Recommended */}
                    <div className="bg-gradient-to-br from-brand-900/40 to-slate-900/40 rounded-2xl p-6 border-2 border-brand-500/50 relative">
                        <div className="absolute -top-3 left-6">
                            <span className="text-xs font-bold px-3 py-1 rounded-full bg-brand-500 text-white">RECOMMENDED</span>
                        </div>
                        <div className="flex items-center gap-3 mb-4 mt-2">
                            <div className="p-2 bg-brand-500/20 rounded-lg">
                                <CalendarDays className="w-6 h-6 text-brand-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white">Guided Plan</h3>
                        </div>
                        <p className="text-slate-400 text-sm leading-relaxed mb-4">
                            Start with a diagnostic, get a personalized study plan, and let the system guide your preparation.
                        </p>
                        <div className="text-xs text-slate-500 space-y-1">
                            <div className="flex items-center gap-2"><Sparkles className="w-3 h-3 text-brand-400" /> AI-generated schedule</div>
                            <div className="flex items-center gap-2"><RefreshCw className="w-3 h-3 text-brand-400" /> Adapts to your progress</div>
                            <div className="flex items-center gap-2"><BarChart3 className="w-3 h-3 text-brand-400" /> Evidence-based readiness</div>
                        </div>
                    </div>

                    {/* Flexible Practice */}
                    <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-slate-700 rounded-lg">
                                <Zap className="w-6 h-6 text-slate-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white">Flexible Practice</h3>
                        </div>
                        <p className="text-slate-400 text-sm leading-relaxed mb-4">
                            Jump straight into Smart Practice. Get domain feedback as you go, add a plan later if you want.
                        </p>
                        <div className="text-xs text-slate-500 space-y-1">
                            <div className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-slate-500" /> Start immediately</div>
                            <div className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-slate-500" /> No commitment</div>
                            <div className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-slate-500" /> Add plan anytime</div>
                        </div>
                    </div>
                </div>

                {/* Guided Plan Flow */}
                <div className="mb-12">
                    <h3 className="text-lg font-bold text-brand-400 mb-6 flex items-center gap-2">
                        <CalendarDays className="w-5 h-5" />
                        Guided Plan Flow
                    </h3>
                    <div className="relative space-y-6">
                        {/* Connecting Line */}
                        <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-brand-500/30 rounded-full -z-10"></div>

                        {/* Step 1: Diagnostic */}
                        <div className="relative flex gap-4 group">
                            <div className="w-12 h-12 rounded-xl bg-slate-800 border-2 border-brand-500/50 group-hover:border-brand-400 flex items-center justify-center shrink-0 transition-all z-10">
                                <Target className="w-5 h-5 text-brand-400" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-white">1. Take the Diagnostic</h4>
                                <p className="text-sm text-slate-400">One-time baseline assessment. The AI learns where you stand and uses this to build your plan.</p>
                            </div>
                        </div>

                        {/* Step 2: Study Plan */}
                        <div className="relative flex gap-4 group">
                            <div className="w-12 h-12 rounded-xl bg-slate-800 border-2 border-brand-500/50 group-hover:border-brand-400 flex items-center justify-center shrink-0 transition-all z-10">
                                <CalendarDays className="w-5 h-5 text-brand-400" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-white">2. Get Your Study Plan</h4>
                                <p className="text-sm text-slate-400">Set your exam date. We generate a day-by-day schedule focused on your weak areas.</p>
                            </div>
                        </div>

                        {/* Step 3: Daily Practice */}
                        <div className="relative flex gap-4 group">
                            <div className="w-12 h-12 rounded-xl bg-slate-800 border-2 border-brand-500/50 group-hover:border-brand-400 flex items-center justify-center shrink-0 transition-all z-10">
                                <Zap className="w-5 h-5 text-brand-400" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-white">3. Follow Daily Tasks</h4>
                                <p className="text-sm text-slate-400">Complete the Smart Practice tasks on your planner. Mark them done as you go.</p>
                            </div>
                        </div>

                        {/* Step 4: Recalculate */}
                        <div className="relative flex gap-4 group">
                            <div className="w-12 h-12 rounded-xl bg-slate-800 border-2 border-brand-500/50 group-hover:border-brand-400 flex items-center justify-center shrink-0 transition-all z-10">
                                <RefreshCw className="w-5 h-5 text-brand-400" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-white">4. Update Your Plan</h4>
                                <p className="text-sm text-slate-400">Click "Update Plan" anytime to re-anchor your schedule around your current weakest domain.</p>
                            </div>
                        </div>

                        {/* Step 5: Readiness */}
                        <div className="relative flex gap-4 group">
                            <div className="w-12 h-12 rounded-xl bg-slate-800 border-2 border-brand-500/50 group-hover:border-brand-400 flex items-center justify-center shrink-0 transition-all z-10">
                                <BarChart3 className="w-5 h-5 text-brand-400" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-white">5. Track Readiness</h4>
                                <p className="text-sm text-slate-400">After 50+ questions, your Exam Readiness score becomes reliable. Watch it grow as you practice.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Flexible Practice Flow */}
                <div className="mb-12">
                    <h3 className="text-lg font-bold text-slate-400 mb-6 flex items-center gap-2">
                        <Zap className="w-5 h-5" />
                        Flexible Practice Flow
                    </h3>
                    <div className="relative space-y-6">
                        <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-slate-700 rounded-full -z-10"></div>

                        {/* Step 1: Smart Practice */}
                        <div className="relative flex gap-4 group">
                            <div className="w-12 h-12 rounded-xl bg-slate-800 border-2 border-slate-600 group-hover:border-slate-500 flex items-center justify-center shrink-0 transition-all z-10">
                                <Zap className="w-5 h-5 text-slate-400" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-white">1. Start Smart Practice</h4>
                                <p className="text-sm text-slate-400">Hit "Smart Start" from the dashboard. The AI picks questions you need most.</p>
                            </div>
                        </div>

                        {/* Step 2: Domain Feedback */}
                        <div className="relative flex gap-4 group">
                            <div className="w-12 h-12 rounded-xl bg-slate-800 border-2 border-slate-600 group-hover:border-slate-500 flex items-center justify-center shrink-0 transition-all z-10">
                                <Layout className="w-5 h-5 text-slate-400" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-white">2. See Domain Feedback</h4>
                                <p className="text-sm text-slate-400">Your Mastery Rings show progress by domain. Focus on the weakest ones.</p>
                            </div>
                        </div>

                        {/* Step 3: Optional Plan */}
                        <div className="relative flex gap-4 group">
                            <div className="w-12 h-12 rounded-xl bg-slate-800 border-2 border-slate-600 group-hover:border-slate-500 flex items-center justify-center shrink-0 transition-all z-10">
                                <CalendarDays className="w-5 h-5 text-slate-400" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-white">3. Add a Plan (Optional)</h4>
                                <p className="text-sm text-slate-400">Ready for structure? Take the diagnostic to unlock your personalized study plan.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pro Features */}
                <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 mb-12">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-rose-400" />
                        Pro Features
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-start gap-3">
                            <Target className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                            <div>
                                <strong className="text-white">Deep Analytics</strong>
                                <p className="text-slate-400">Detailed readiness reports and domain trend analysis.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Trophy className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                            <div>
                                <strong className="text-white">Exam Simulator</strong>
                                <p className="text-slate-400">50 questions in 60 minutes. Real test conditions.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Zap className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                            <div>
                                <strong className="text-white">Unlimited Practice</strong>
                                <p className="text-slate-400">No daily question limits. Accelerate your prep.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <CalendarDays className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                            <div>
                                <strong className="text-white">Study Planner</strong>
                                <p className="text-slate-400">AI-generated, adaptive daily schedule.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* About Performance Trends */}
                <div className="bg-slate-800/30 rounded-2xl p-6 border border-slate-700/50 mb-12">
                    <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-slate-400" />
                        About Performance Trends
                    </h3>
                    <p className="text-sm text-slate-400 leading-relaxed">
                        Performance trends are based on your Smart Practice sessions. Your diagnostic establishes your baseline and is not included in trend charts. If you reset your progress, your visible trends and practice history will be cleared.
                    </p>
                </div>

                {/* Practice Data & Readiness */}
                <div className="mt-12 bg-slate-800/30 rounded-2xl p-8 border border-slate-700/50">
                    <h3 className="text-2xl font-bold text-white mb-6 font-display text-center">How Practice Data Improves Your Readiness Score</h3>
                    <div className="space-y-6 text-sm text-slate-400 leading-relaxed">
                        <p>
                            Every question you answer contributes to a growing dataset specific to the exam you are studying. This data drives your Exam Readiness prediction, which estimates how likely you are to pass based on observed accuracy, domain coverage, and consistency.
                        </p>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-brand-500/20 rounded-lg text-brand-400">
                                        <BarChart3 className="w-5 h-5" />
                                    </div>
                                    <h4 className="font-bold text-white">Prediction Confidence</h4>
                                </div>
                                <p>
                                    With fewer than 50 validated responses, your readiness score is marked as preliminary. As your response count grows, the prediction becomes more statistically reliable and the confidence rating increases from Low through Moderate, High, and Very High.
                                </p>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-brand-500/20 rounded-lg text-brand-400">
                                        <Target className="w-5 h-5" />
                                    </div>
                                    <h4 className="font-bold text-white">Exam-Scoped Data</h4>
                                </div>
                                <p>
                                    Your practice data is tracked per exam. Studying for one certification does not influence readiness predictions for another. Each exam has its own accuracy history, domain breakdown, and confidence rating.
                                </p>
                            </div>
                        </div>
                        <p className="text-slate-500 border-t border-slate-700/50 pt-4">
                            The system does not reward volume for its own sake. Answering more questions matters only because it produces better data for the prediction model. Focus on understanding, not accumulation.
                        </p>
                    </div>
                </div>
                <p className="text-slate-500 mb-8 italic">
                    "Consistency is the key to mastery."
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link to="/app" className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-brand-600 to-brand-500 text-white px-8 py-4 rounded-xl font-bold hover:from-brand-500 hover:to-brand-400 transition-all shadow-lg hover:shadow-brand-500/25 group">
                        Start My Session
                        <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </Link>

                    <button
                        onClick={() => setIsReportModalOpen(true)}
                        className="inline-flex items-center justify-center gap-2 bg-slate-800 text-slate-300 border border-slate-700 px-8 py-4 rounded-xl font-bold hover:bg-slate-700 hover:text-white transition-all group"
                    >
                        <MessageSquare className="w-5 h-5 text-slate-400 group-hover:text-white" />
                        Report a Problem
                    </button>
                </div>
            </div>

            <ReportIssueModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
            />

        </div>

    );
}
