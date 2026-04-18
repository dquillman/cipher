import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, BookOpen, BarChart2, Calendar, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import { useExam } from '../contexts/ExamContext';

const primaryItems = [
    { label: 'Home', path: '/app', icon: LayoutDashboard, exact: true },
    { label: 'Plan', path: '/app/planner', icon: Calendar },
    { label: 'Exams', path: '/app/exams', icon: BookOpen },
    { label: 'Stats', path: '/app/stats', icon: BarChart2 },
];

const moreItems = [
    { label: 'Readiness', path: '/app/readiness' },
    { label: 'Verbal Mode', path: '/app/verbal' },
    { label: 'FAQ', path: '/app/faq' },
    { label: 'Start Here', path: '/app/start-here' },
];

export default function MobileNav() {
    const location = useLocation();
    const [showMore, setShowMore] = useState(false);
    const { hasCompletedDiagnostic } = useExam();

    // Hide mobile nav during quiz/simulator to avoid accidental taps
    if (location.pathname.includes('/quiz') || location.pathname.includes('/simulator')) {
        return null;
    }

    const isActive = (path: string, exact?: boolean) => {
        if (exact) return location.pathname === path;
        return location.pathname.startsWith(path);
    };

    // Hide Dashboard if diagnostic not completed
    const filteredPrimary = primaryItems.filter(item =>
        item.path !== '/app' || hasCompletedDiagnostic !== false
    );

    return (
        <>
            {/* More menu overlay */}
            {showMore && (
                <div className="fixed inset-0 z-[998] bg-black/50 backdrop-blur-sm md:hidden" onClick={() => setShowMore(false)}>
                    <div
                        className="absolute bottom-16 left-0 right-0 bg-slate-900 border-t border-slate-700 rounded-t-2xl p-4 space-y-1"
                        onClick={e => e.stopPropagation()}
                    >
                        {moreItems.map(item => (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setShowMore(false)}
                                className={`block px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                                    isActive(item.path)
                                        ? 'bg-brand-600/10 text-brand-400'
                                        : 'text-slate-300 hover:bg-slate-800'
                                }`}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Bottom nav bar */}
            <nav className="fixed bottom-0 left-0 right-0 z-[999] bg-slate-950/95 backdrop-blur-md border-t border-slate-800 md:hidden safe-area-bottom">
                <div className="flex items-center justify-around px-2 py-1">
                    {filteredPrimary.map(item => {
                        const Icon = item.icon;
                        const active = isActive(item.path, item.exact);
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg min-w-[3.5rem] transition-colors ${
                                    active
                                        ? 'text-brand-400'
                                        : 'text-slate-500 active:text-slate-300'
                                }`}
                            >
                                <Icon className="w-5 h-5" />
                                <span className="text-[10px] font-medium">{item.label}</span>
                            </Link>
                        );
                    })}
                    <button
                        onClick={() => setShowMore(!showMore)}
                        className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg min-w-[3.5rem] transition-colors ${
                            showMore ? 'text-brand-400' : 'text-slate-500 active:text-slate-300'
                        }`}
                    >
                        <MoreHorizontal className="w-5 h-5" />
                        <span className="text-[10px] font-medium">More</span>
                    </button>
                </div>
            </nav>
        </>
    );
}
