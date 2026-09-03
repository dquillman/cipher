import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import ExamSelector from '../ExamSelector';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { useExam } from '../../contexts/ExamContext';

interface AppHeaderProps {
    children?: ReactNode;
}

export default function AppHeader({ children }: AppHeaderProps) {
    const { isPro, hasPassFor } = useSubscription();
    const { selectedExamId } = useExam();
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
                        <ExamSelector />
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
