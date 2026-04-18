import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useExam } from '../contexts/ExamContext';

export default function DashboardLink({ className }: { className?: string }) {
    const { hasCompletedDiagnostic } = useExam();

    // Hide when confirmed no diagnostic (pre-onboarding)
    if (hasCompletedDiagnostic === false) return null;

    return (
        <Link
            to="/app"
            className={className || "inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-white transition-colors"}
        >
            <ChevronLeft className="w-4 h-4" />
            Dashboard
        </Link>
    );
}
