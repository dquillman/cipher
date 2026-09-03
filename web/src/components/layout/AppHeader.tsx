import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import ExamSelector from '../ExamSelector';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { useExam } from '../../contexts/ExamContext';
import { useLocation } from 'react-router-dom';

interface AppHeaderProps {
    children?: ReactNode;
}

export default function AppHeader({ children }: AppHeaderProps) {
    const { isPro, hasPassFor } = useSubscription();
    const { selectedExamId } = useExam();
    const { pathname } = useLocation();

    /**
     * Do not offer an exam switch while a session is running.
     *
     * The selector sat in the header over the timed mock and the practice quiz,
     * one click, no confirmation. switchExam nulls hasCompletedDiagnostic, which
     * makes MockExamGuard render null for a beat -- unmounting Simulator -- and
     * the fresh instance that mounts afterwards still finds {mode:'full-mock'}
     * in the router's in-memory location, so it counts as a deliberate start and
     * calls createRun. createRun's first act is to mark every in_progress run
     * for that exam 'abandoned', and nothing reads 'abandoned'. Switch away and
     * back and 80 answered questions of a 180-question mock are gone.
     *
     * The practice quiz was worse: its loader re-runs on the exam change but
     * resets none of currentQuestionIndex, score, quizDetails or showExplanation,
     * so the tester landed mid-way through a different exam's question set with
     * the old score banked and the new question already showing its answer --
     * and if the new set was shorter than the carried index, the page threw.
     *
     * Switching exams mid-session is never something anyone wants; removing the
     * control is the whole fix, and it cannot be half-applied.
     */
    const inSession = pathname.startsWith('/app/simulator/exam') || pathname.startsWith('/app/quiz');
    const hasPaidAccess = isPro || hasPassFor(selectedExamId);

    return (
        <nav className="bg-slate-800/50 backdrop-blur-md border-b border-slate-700 sticky top-0 z-50">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex min-h-[3.5rem] py-2 justify-between items-center">
                    <div className="flex items-baseline gap-3 min-w-0">
                        <h1 className="text-sm md:text-xl font-bold text-white font-display tracking-tight whitespace-nowrap">CipherExam</h1>
                        <span className="hidden sm:inline text-xs md:text-sm text-slate-400 font-medium italic truncate">Certification prep, decoded.</span>
                    </div>
                    <div className="flex items-center gap-2 md:gap-4">
                        {!inSession && <ExamSelector />}
                        {children}
                        {!hasPaidAccess && (
                            <Link
                                to="/app/pricing"
                                className="text-xs md:text-sm font-bold text-brand-400 hover:text-brand-300 transition-colors border border-brand-500/30 px-3 py-1.5 rounded-full bg-brand-500/10"
                            >
                                Upgrade
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
