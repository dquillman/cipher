/**
 * Module-level store for quiz context used by the Report Issue flow.
 * Quiz.tsx sets this on mount/update; Sidebar reads it at click time.
 * No React context needed — siblings can share via simple get/set.
 */

type QuizReportContext = Record<string, string | undefined>;

let _context: QuizReportContext | null = null;

export const quizReportStore = {
    set: (ctx: QuizReportContext) => { _context = ctx; },
    clear: () => { _context = null; },
    get: (): QuizReportContext | null => _context,
};
