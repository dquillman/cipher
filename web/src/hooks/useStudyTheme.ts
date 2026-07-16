import { useEffect, useState } from 'react';

export type StudyTheme = 'dark' | 'daylight';

const STORAGE_KEY = 'studyTheme';

/**
 * Daylight study mode — a light skin scoped to the study surfaces (Quiz,
 * Simulator, Verbal Mode) for bright rooms and long reading sessions.
 *
 * Works by toggling `daylight` on <html>; index.css remaps the dark slate
 * utilities under that scope, so every study subcomponent recolors without
 * touching its markup. The class is removed on unmount, so the rest of the
 * app (and the marketing site) stays dark — dark is the brand default.
 */
export function useStudyTheme() {
    const [theme, setTheme] = useState<StudyTheme>(
        () => (localStorage.getItem(STORAGE_KEY) as StudyTheme) || 'dark'
    );

    useEffect(() => {
        const root = document.documentElement;
        root.classList.toggle('daylight', theme === 'daylight');
        localStorage.setItem(STORAGE_KEY, theme);
        return () => root.classList.remove('daylight');
    }, [theme]);

    const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'daylight' : 'dark'));

    return { theme, toggleTheme };
}
