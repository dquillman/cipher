import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../App';
import { useSidebar } from '../contexts/SidebarContext';
import { useExam } from '../contexts/ExamContext';
import { LayoutDashboard, BookOpen, ChevronLeft, ChevronRight, Calendar, BarChart2, Mic, Target, HelpCircle, PlayCircle, Flag, AlertTriangle } from 'lucide-react';
import ReportIssueModal from './ReportIssueModal';
import { quizReportStore } from '../utils/quizReportStore';
import { auth } from '../firebase';
import { QuizRunService } from '../services/QuizRunService';
import { DISPLAY_VERSION } from '../version';

export default function Sidebar() {
    const { logout, user } = useAuth();

    const navigate = useNavigate();
    const location = useLocation();
    const { isCollapsed, toggleSidebar } = useSidebar();
    const { selectedExamId, examName } = useExam();
    const [showReportModal, setShowReportModal] = useState(false);
    const [showResetModal, setShowResetModal] = useState(false);
    const [resetInput, setResetInput] = useState('');
    const [resetting, setResetting] = useState(false);

    const handleLogout = async () => {
        try {
            await logout();
            navigate("/");
        } catch (error) {
            console.error("Failed to logout", error);
        }
    };

    const handleReset = async () => {
        if (resetInput !== 'RESET') return;
        try {
            setResetting(true);

            // Abandon any in_progress runs for this exam
            const userId = auth.currentUser!.uid;
            await QuizRunService.abandonInProgressRuns(userId, selectedExamId);

            const { httpsCallable, getFunctions } = await import('firebase/functions');
            const functions = getFunctions();
            const resetFn = httpsCallable(functions, 'resetExamProgress');
            await resetFn({ examId: selectedExamId });

            // Clear Thinking Traps localStorage to prevent stale insights
            localStorage.removeItem('exam_coach_reinforcement');
            localStorage.removeItem('exam_coach_last_reinforcement_shown');
            localStorage.removeItem('exam_coach_suggestion_history');

            // Clear Onboarding Flag so Intro Video plays again
            localStorage.removeItem('ec_onboarding_ack');

            // Clear study plan reinforcement ack keys
            Object.keys(localStorage)
                .filter(k => k.startsWith('ec_reinforcement_ack_'))
                .forEach(k => localStorage.removeItem(k));

            // Suppress Thinking Traps until a new run completes
            localStorage.setItem('exam_coach_traps_suppressed', 'true');

            // Simple refresh
            window.location.reload();
        } catch (e) {
            console.error(e);
            alert('Failed to reset progress.');
            setResetting(false);
        }
    };

    const allMenuItems = [
        { label: "Dashboard", path: "/app", icon: <LayoutDashboard className="w-5 h-5" /> },
        { label: "New to CipherExam?", path: "/app/start-here", icon: <PlayCircle className="w-5 h-5" /> },
        { label: "Study Plan", path: "/app/planner", icon: <Calendar className="w-5 h-5" /> },
        { label: "Verbal Mode", path: "/app/verbal", icon: <Mic className="w-5 h-5" /> },
        { label: "Readiness", path: "/app/readiness", icon: <Target className="w-5 h-5" /> },
        { label: "Exams", path: "/app/exams", icon: <BookOpen className="w-5 h-5" /> },
        { label: "Stats", path: "/app/stats", icon: <BarChart2 className="w-5 h-5" /> },
        { label: "FAQ", path: "/app/faq", icon: <HelpCircle className="w-5 h-5" /> },
    ];

    const menuItems = allMenuItems;

    return (
        <aside className={`fixed left-0 top-0 z-40 h-screen hidden md:flex ${isCollapsed ? 'w-20' : 'w-64'} bg-slate-950 border-r border-slate-800 flex-col transition-all duration-300`}>
            {/* Brand */}
            <div className={`flex px-6 py-6 items-center gap-2 border-b border-slate-900 ${isCollapsed ? 'justify-center' : ''} relative`}>
                <img src="/favicon.png" alt="CipherExam" className="h-8 w-8 min-w-8 rounded-lg object-contain" />
                {!isCollapsed && (
                    <div className="flex flex-col overflow-hidden">
                        <span className="text-lg font-bold tracking-tight text-white truncate">CipherExam</span>
                        <span className="text-xs font-bold text-slate-400 font-mono truncate">v{DISPLAY_VERSION}</span>
                    </div>
                )}
                {/* Toggle Button */}
                <button
                    onClick={toggleSidebar}
                    className={`absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors shadow-lg z-50`}
                >
                    {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto overflow-x-hidden">
                {menuItems.map((item) => {
                    const isActive = location.pathname.startsWith(item.path);
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            title={isCollapsed ? item.label : ''}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive
                                ? "bg-brand-600/10 text-brand-400 border border-brand-600/20"
                                : "text-slate-400 hover:text-white hover:bg-slate-900"
                                } ${isCollapsed ? 'justify-center' : ''}`}
                        >
                            {item.icon}
                            {!isCollapsed && <span>{item.label}</span>}
                        </Link>
                    );
                })}
            </nav>

            {/* Report a Problem */}
            <div className={`px-4 pb-2 ${isCollapsed ? 'flex justify-center' : ''}`}>
                <button
                    onClick={() => setShowReportModal(true)}
                    title={isCollapsed ? 'Report a Problem' : ''}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors ${isCollapsed ? 'justify-center' : ''}`}
                >
                    <Flag className="w-5 h-5" />
                    {!isCollapsed && <span>Report a Problem</span>}
                </button>
            </div>

            {/* Reset Progress */}
            <div className={`px-4 pb-2 ${isCollapsed ? 'flex justify-center' : ''}`}>
                <button
                    onClick={() => { setResetInput(''); setShowResetModal(true); }}
                    title={isCollapsed ? 'Reset Progress' : ''}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors ${isCollapsed ? 'justify-center' : ''}`}
                >
                    <AlertTriangle className="w-5 h-5" />
                    {!isCollapsed && <span>Reset Progress</span>}
                </button>
            </div>

            {/* User Profile / Logout */}
            <div className={`p-4 border-t border-slate-800 ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
                <div className={`flex items-center gap-3 mb-4 ${isCollapsed ? 'justify-center' : ''}`}>
                    <div className="h-10 w-10 min-w-10 rounded-full bg-slate-800 border-2 border-slate-700 overflow-hidden">
                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-400">
                            {user?.displayName ? user.displayName[0].toUpperCase() : 'U'}
                        </div>
                    </div>
                    {!isCollapsed && (
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium text-white truncate">{user?.displayName || 'User'}</p>
                            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                        </div>
                    )}
                </div>
                <button
                    onClick={handleLogout}
                    className={`w-full flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors ${isCollapsed ? 'justify-center' : ''}`}
                    title={isCollapsed ? "Log out" : ""}
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    {!isCollapsed && "Log out"}
                </button>
            </div>

            {/* Report Issue Modal */}
            <ReportIssueModal
                isOpen={showReportModal}
                onClose={() => setShowReportModal(false)}
                context={quizReportStore.get() || undefined}
            />

            {/* Reset Confirmation Modal */}
            {showResetModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-red-900/50 shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-red-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                                <AlertTriangle className="w-5 h-5 text-red-500" />
                            </div>
                            <h3 className="text-xl font-bold text-red-500 font-display">Reset All Progress</h3>
                        </div>

                        <p className="text-slate-300 text-sm mb-4">
                            This will permanently delete all progress for <strong className="text-white">{examName}</strong>:
                        </p>

                        <ul className="text-sm text-slate-400 space-y-1.5 mb-5 pl-1">
                            <li className="flex items-start gap-2">
                                <span className="text-red-500 mt-0.5">&#x2022;</span>
                                Diagnostic results
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-red-500 mt-0.5">&#x2022;</span>
                                All quiz history
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-red-500 mt-0.5">&#x2022;</span>
                                Domain mastery data
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-red-500 mt-0.5">&#x2022;</span>
                                Study plan for this exam
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-red-500 mt-0.5">&#x2022;</span>
                                Smart review data
                            </li>
                        </ul>

                        <p className="text-sm text-slate-400 mb-3">
                            Type <strong className="text-white font-mono">RESET</strong> to confirm:
                        </p>

                        <input
                            type="text"
                            value={resetInput}
                            onChange={(e) => setResetInput(e.target.value)}
                            placeholder="Type RESET"
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-red-500/50 font-mono text-sm mb-4"
                            autoFocus
                        />

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowResetModal(false)}
                                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-400 bg-slate-700/50 hover:bg-slate-700 transition-colors"
                                disabled={resetting}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReset}
                                disabled={resetInput !== 'RESET' || resetting}
                                className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-bold transition-colors ${
                                    resetInput === 'RESET' && !resetting
                                        ? 'bg-red-600 hover:bg-red-500 text-white'
                                        : 'bg-slate-700/30 text-slate-600 cursor-not-allowed'
                                }`}
                            >
                                {resetting ? 'Resetting...' : 'Reset All Progress'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </aside>
    );
}
