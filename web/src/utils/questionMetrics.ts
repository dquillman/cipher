import { flattenAnswers } from '../services/performanceTrendService';

/**
 * Canonical answered-question counter.
 * A question is "answered" if and only if selectedOption is NOT undefined.
 * This is the single source of truth for question counts across the entire app.
 */
export function getAnsweredCount(run: any): number {
    if (!Array.isArray(run.answers)) return 0;

    return run.answers.filter(
        (a: any) => a?.selectedOption !== undefined
    ).length;
}

// ─── Interfaces ──────────────────────────────────────────────────────────────

/** Metrics derived for a single quiz run. */
export interface RunMetrics {
    id?: string;
    totalQuestions: number;     // answered questions in this run
    correctCount: number;       // correct answers
    accuracy: number;           // 0-100, rounded
    score: number;              // raw results.score (quiz engine count)
    speed: number;              // seconds per question, 0 if unavailable
    domain: string;             // primary domain label ('All Domains' if multi)
    date: string;               // formatted "Jan 5"
    timestamp: any;             // raw completedAt
    timeSpent?: number;
    mode?: string;
    quizType?: string;
}

/** Aggregate + per-run metrics derived from an array of quiz runs. */
export interface DerivedMetrics {
    // Aggregates (non-diagnostic only)
    totalQuestions: number;
    totalCorrect: number;
    overallAccuracy: number;    // 0-100
    mockCount: number;
    domainStats: Record<string, { correct: number; total: number }>;
    recentTotal: number;        // last 5 non-diag runs
    recentCorrect: number;
    recentAccuracy: number;     // 0-100
    // Per-run (ALL runs including diagnostics)
    perRun: RunMetrics[];
}

// ─── deriveMetrics ───────────────────────────────────────────────────────────

/**
 * Single source of truth for all quiz-run metrics.
 *
 * ALL numeric aggregation (including domainStats) is computed exclusively from
 * flattenAnswers(). Each answer carries its own `domain` field (written at save
 * time by Quiz.tsx). Answers from legacy runs that lack a domain field are
 * counted in overall totals but excluded from domainStats.
 *
 * Aggregate fields exclude diagnostic runs. Per-run metrics include ALL runs
 * (diagnostics too) so consumers like Dashboard can display them.
 *
 * @param runs        Array of quizRun documents (raw Firestore data).
 *                    Expected sorted desc by completedAt for correct "recent" values.
 * @param examDomains Optional domain names to pre-seed domainStats keys.
 */
export function deriveMetrics(runs: any[], examDomains?: string[]): DerivedMetrics {
    // ── 1. Per-run metrics (ALL runs, including diagnostics) ─────────────
    const perRun: RunMetrics[] = runs.map((run: any) => {
        const answers = (run.answers || []).filter(
            (a: any) => a?.selectedOption !== undefined
        );
        const correctCount = answers.filter((a: any) => a.isCorrect).length;
        // Use snapshot.questionIds.length as authoritative quiz size;
        // fall back to answers.length only if snapshot is unavailable.
        const totalQuestions = run.snapshot?.questionIds?.length || answers.length;
        const accuracy = totalQuestions > 0
            ? Math.round((correctCount / totalQuestions) * 100)
            : 0;

        // Speed: prefer stored averageTimePerQuestion, fallback to timeSpent/total
        let speed = 0;
        if (run.results?.averageTimePerQuestion) {
            speed = Math.round(run.results.averageTimePerQuestion);
        } else if (run.results?.timeSpent && totalQuestions > 0) {
            speed = Math.round(run.results.timeSpent / totalQuestions);
        }

        // Domain label: derive from per-answer domains
        const domainSet = new Set<string>();
        for (const a of answers) {
            if (a.domain) domainSet.add(a.domain);
        }

        let domain: string;
        if (domainSet.size === 1) {
            domain = [...domainSet][0];
        } else if (domainSet.size > 1) {
            domain = 'All Domains';
        } else {
            // Legacy fallback: no answer-level domains — read run.results.domainResults keys
            const legacyDomains = Object.keys(run.results?.domainResults || {});
            domain = legacyDomains.length === 1 ? legacyDomains[0]
                : legacyDomains.length > 1 ? 'Mixed'
                : 'Unknown';
        }

        // Date formatting
        const ts = run.completedAt || run.updatedAt;
        const date = ts?.seconds
            ? new Date(ts.seconds * 1000).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
              })
            : 'Unknown';

        return {
            id: run.id,
            totalQuestions,
            correctCount,
            accuracy,
            score: run.results?.score ?? 0,
            speed,
            domain,
            date,
            timestamp: run.completedAt,
            timeSpent: run.results?.timeSpent,
            mode: run.mode,
            quizType: run.quizType,
        };
    });

    // ── 2. Aggregates (non-diagnostic runs only) ─────────────────────────
    const nonDiagnosticRuns = runs.filter(
        (run: any) => run.mode !== 'diagnostic' && run.quizType !== 'diagnostic'
    );

    // Overall counts from flattenAnswers (canonical source of truth)
    const allRecords = flattenAnswers(nonDiagnosticRuns);
    const totalQuestions = allRecords.length;
    const totalCorrect = allRecords.filter(r => r.isCorrect).length;
    const overallAccuracy = totalQuestions > 0
        ? (totalCorrect / totalQuestions) * 100
        : 0;

    const mockCount = nonDiagnosticRuns.filter(
        (r: any) => r.mode === 'simulation' || r.quizType === 'simulation'
    ).length;

    // Domain stats: computed exclusively from flattened answer records.
    // Each answer carries answer.domain (written at save time by Quiz.tsx).
    // Legacy answers without domain are counted in overall totals but skipped here.
    const domainStats: Record<string, { correct: number; total: number }> = {};
    if (examDomains) {
        examDomains.forEach(d => {
            domainStats[d] = { correct: 0, total: 0 };
        });
    }
    for (const record of allRecords) {
        if (!record.domain) continue;
        if (!domainStats[record.domain]) {
            domainStats[record.domain] = { correct: 0, total: 0 };
        }
        domainStats[record.domain].total++;
        if (record.isCorrect) domainStats[record.domain].correct++;
    }

    // Recent trend: last 5 non-diagnostic runs (assumes input sorted desc)
    const recentNonDiag = nonDiagnosticRuns.slice(0, 5);
    const recentRecords = flattenAnswers(recentNonDiag);
    const recentTotal = recentRecords.length;
    const recentCorrect = recentRecords.filter(r => r.isCorrect).length;
    const recentAccuracy = recentTotal > 0
        ? (recentCorrect / recentTotal) * 100
        : 0;

    return {
        totalQuestions,
        totalCorrect,
        overallAccuracy,
        mockCount,
        domainStats,
        recentTotal,
        recentCorrect,
        recentAccuracy,
        perRun,
    };
}
