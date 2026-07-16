import { Sun, Moon } from 'lucide-react';
import type { StudyTheme } from '../../hooks/useStudyTheme';

/**
 * Dark / Daylight switch shown in study-surface headers. Deliberately small:
 * a labelled icon pill, not a settings menu — comfort should be one tap.
 */
export default function StudyThemeToggle({
    theme,
    onToggle,
}: {
    theme: StudyTheme;
    onToggle: () => void;
}) {
    const isDaylight = theme === 'daylight';
    return (
        <button
            onClick={onToggle}
            aria-label={isDaylight ? 'Switch to dark mode' : 'Switch to daylight mode'}
            title={isDaylight ? 'Dark mode' : 'Daylight mode'}
            className="flex items-center gap-1.5 rounded-full border border-slate-600 bg-slate-800/60 px-3 py-1.5 text-xs font-bold text-slate-300 hover:text-white hover:border-slate-500 transition-colors"
        >
            {isDaylight ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isDaylight ? 'Dark' : 'Daylight'}</span>
        </button>
    );
}
