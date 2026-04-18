import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

// ─── Types ────────────────────────────────────────────────────────────────────

/** A single data point on a rolling trend line */
export interface TrendDataPoint {
    date: string;            // formatted "Jan 5" for chart XAxis
    timestamp: number;       // epoch ms for sorting
    rollingAverage: number;  // 0-100%
    windowSize: number;      // actual window used (may be < WINDOW_SIZE early on)
}

export interface OverallTrendResult {
    dataPoints: TrendDataPoint[];
    currentAverage: number | null;  // latest rolling average, null if no data
    direction: 'improving' | 'declining' | 'stable';
    totalQuestions: number;
}

export interface DomainTrendResult {
    domain: string;
    dataPoints: TrendDataPoint[];
    currentAverage: number | null;
    direction: 'improving' | 'declining' | 'stable';
    totalQuestions: number;
}

// ─── Internal Types ───────────────────────────────────────────────────────────

export interface QuestionRecord {
    isCorrect: boolean;
    timestamp: number; // epoch ms
    domain?: string;   // from answer.domain (available on runs saved after v17)
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_WINDOW_SIZE = 50;
const MAX_CHART_POINTS = 200;

// ─── Pure Functions (exported for testability) ────────────────────────────────

/**
 * Computes a rolling average over a sorted array of question records.
 * At each index i, the window covers records[max(0, i - windowSize + 1) ... i].
 * Returns one TrendDataPoint per record.
 */
export function computeRollingAverage(
    records: QuestionRecord[],
    windowSize: number = DEFAULT_WINDOW_SIZE
): TrendDataPoint[] {
    if (records.length === 0) return [];

    const points: TrendDataPoint[] = [];
    let correctInWindow = 0;

    for (let i = 0; i < records.length; i++) {
        // Add current record to the window
        if (records[i].isCorrect) correctInWindow++;

        // Remove the record that just fell out of the window
        if (i >= windowSize) {
            if (records[i - windowSize].isCorrect) correctInWindow--;
        }

        const currentWindowSize = Math.min(i + 1, windowSize);
        const rollingAvg = Math.round((correctInWindow / currentWindowSize) * 100);

        const d = new Date(records[i].timestamp);
        points.push({
            date: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
            timestamp: records[i].timestamp,
            rollingAverage: rollingAvg,
            windowSize: currentWindowSize,
        });
    }

    return points;
}

/**
 * Determines trend direction by comparing the average of the first half
 * of data points against the second half.
 * improving: second half > first half + 5
 * declining: second half < first half - 5
 * stable: within ±5
 */
export function determineTrendDirection(
    dataPoints: TrendDataPoint[]
): 'improving' | 'declining' | 'stable' {
    if (dataPoints.length < 4) return 'stable';

    const mid = Math.floor(dataPoints.length / 2);
    const firstHalf = dataPoints.slice(0, mid);
    const secondHalf = dataPoints.slice(mid);

    const avgFirst = firstHalf.reduce((sum, p) => sum + p.rollingAverage, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((sum, p) => sum + p.rollingAverage, 0) / secondHalf.length;

    const delta = avgSecond - avgFirst;
    if (delta > 5) return 'improving';
    if (delta < -5) return 'declining';
    return 'stable';
}

/**
 * Extracts per-answer QuestionRecords for a target domain from sorted runs.
 * Primary path: reads real per-answer data from answers[].domain.
 * Fallback: if a run has no answers with domain data, uses results.domainResults
 * to produce synthetic correct/incorrect records for that run only.
 * Minor emit-order bias accepted in fallback — only affects legacy runs.
 * Returns records sorted by timestamp ascending.
 */
export function flattenDomainAnswers(runs: any[], targetDomain: string): QuestionRecord[] {
    const records: QuestionRecord[] = [];

    for (const run of runs) {
        const rawAnswers = (run.answers || []).filter((a: any) => a?.selectedOption !== undefined);
        const runTs = run.completedAt?.seconds
            ? run.completedAt.seconds * 1000
            : run.completedAt?.toMillis?.()
                ? run.completedAt.toMillis()
                : Date.now();

        // Check if any answer in this run has a domain field
        const hasDomainData = rawAnswers.some((a: any) => typeof a.domain === 'string');

        if (hasDomainData) {
            // Primary path: real per-answer data
            for (const answer of rawAnswers) {
                if (answer.domain !== targetDomain) continue;

                let ts = runTs;
                if (answer.timestamp?.seconds) {
                    ts = answer.timestamp.seconds * 1000;
                } else if (answer.timestamp?.toMillis) {
                    ts = answer.timestamp.toMillis();
                } else if (typeof answer.timestamp === 'number') {
                    ts = answer.timestamp;
                } else if (answer.timestamp instanceof Date) {
                    ts = answer.timestamp.getTime();
                }

                records.push({ isCorrect: !!answer.isCorrect, timestamp: ts });
            }
        } else {
            // Fallback: use results.domainResults for this run (legacy runs only)
            const domainStats = run.results?.domainResults?.[targetDomain];
            if (!domainStats || domainStats.total <= 0) continue;

            for (let i = 0; i < domainStats.correct; i++) {
                records.push({ isCorrect: true, timestamp: runTs });
            }
            for (let i = 0; i < domainStats.total - domainStats.correct; i++) {
                records.push({ isCorrect: false, timestamp: runTs });
            }
        }
    }

    records.sort((a, b) => a.timestamp - b.timestamp);
    return records;
}

/**
 * Down-samples an array of TrendDataPoints to at most maxPoints entries.
 * Preserves the first and last point; evenly spaces the rest.
 */
export function downsample(points: TrendDataPoint[], maxPoints: number = MAX_CHART_POINTS): TrendDataPoint[] {
    if (points.length <= maxPoints) return points;

    const result: TrendDataPoint[] = [points[0]];
    const step = (points.length - 1) / (maxPoints - 1);

    for (let i = 1; i < maxPoints - 1; i++) {
        result.push(points[Math.round(i * step)]);
    }

    result.push(points[points.length - 1]);
    return result;
}

// ─── Firestore Fetcher (shared across API methods) ───────────────────────────

async function fetchCompletedRuns(userId: string, examId: string): Promise<any[]> {
    const runsRef = collection(db, 'quizRuns', userId, 'runs');
    let runs: any[] = [];

    try {
        // Try composite index query first
        const q = query(
            runsRef,
            where('examId', '==', examId),
            where('status', '==', 'completed'),
            orderBy('completedAt', 'desc'),
            limit(200) // more than PredictionEngine's 50 — we want full history for trends
        );
        const snapshot = await getDocs(q);
        runs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch {
        // Fallback: simple query + client-side filter
        console.warn('PerformanceTrendService: Composite index not available, using fallback query');
        const fallbackQ = query(
            runsRef,
            where('status', '==', 'completed'),
            limit(500)
        );
        const snapshot = await getDocs(fallbackQ);
        runs = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter((r: any) => r.examId === examId);
    }

    // Exclude diagnostics and simulations — trend tracks smart/domain practice only
    runs = runs.filter((r: any) =>
        r.mode !== 'diagnostic' && r.quizType !== 'diagnostic' &&
        r.mode !== 'simulation' && r.quizType !== 'simulation'
    );

    // Sort ascending by completedAt (oldest first)
    runs.sort((a: any, b: any) => {
        const aTime = a.completedAt?.seconds || 0;
        const bTime = b.completedAt?.seconds || 0;
        return aTime - bTime;
    });

    return runs;
}

/**
 * Flatten all answers from sorted runs into QuestionRecord[], chronologically.
 * Uses per-answer timestamp when available, falls back to run's completedAt.
 */
export function flattenAnswers(runs: any[]): QuestionRecord[] {
    const records: QuestionRecord[] = [];

    for (const run of runs) {
        const rawAnswers = run.answers || [];
        // Only include answers where selectedOption is defined (actually answered)
        const answers = rawAnswers.filter((a: any) => a?.selectedOption !== undefined);
        const runTs = run.completedAt?.seconds
            ? run.completedAt.seconds * 1000
            : run.completedAt?.toMillis?.()
                ? run.completedAt.toMillis()
                : Date.now();

        for (const answer of answers) {
            // Per-answer timestamp (client Date stored as Firestore Timestamp or raw)
            let ts = runTs;
            if (answer.timestamp?.seconds) {
                ts = answer.timestamp.seconds * 1000;
            } else if (answer.timestamp?.toMillis) {
                ts = answer.timestamp.toMillis();
            } else if (typeof answer.timestamp === 'number') {
                ts = answer.timestamp;
            } else if (answer.timestamp instanceof Date) {
                ts = answer.timestamp.getTime();
            }

            records.push({
                isCorrect: !!answer.isCorrect,
                timestamp: ts,
                domain: answer.domain,
            });
        }
    }

    // Ensure chronological order
    records.sort((a, b) => a.timestamp - b.timestamp);

    return records;
}

// ─── Service API ──────────────────────────────────────────────────────────────

export const PerformanceTrendService = {
    /**
     * Computes the overall rolling 50-question trend.
     * One data point per answered question, chronologically.
     */
    getRollingOverallTrend: async (
        userId: string,
        examId: string,
        windowSize: number = DEFAULT_WINDOW_SIZE
    ): Promise<OverallTrendResult> => {
        const runs = await fetchCompletedRuns(userId, examId);
        const records = flattenAnswers(runs);

        if (records.length === 0) {
            return { dataPoints: [], currentAverage: null, direction: 'stable', totalQuestions: 0 };
        }

        const raw = computeRollingAverage(records, windowSize);
        const dataPoints = downsample(raw);
        const direction = determineTrendDirection(raw);
        const currentAverage = raw[raw.length - 1].rollingAverage;

        return {
            dataPoints,
            currentAverage,
            direction,
            totalQuestions: records.length,
        };
    },

    /**
     * Computes the rolling trend for a single domain.
     * Uses real per-answer data (answers[].domain) with run-level fallback for legacy runs.
     * Fed into computeRollingAverage — same function as overall trend.
     */
    getRollingDomainTrend: async (
        userId: string,
        examId: string,
        domain: string,
        windowSize: number = DEFAULT_WINDOW_SIZE
    ): Promise<DomainTrendResult> => {
        const runs = await fetchCompletedRuns(userId, examId);
        const records = flattenDomainAnswers(runs, domain);

        if (records.length === 0) {
            return { domain, dataPoints: [], currentAverage: null, direction: 'stable', totalQuestions: 0 };
        }

        const raw = computeRollingAverage(records, windowSize);
        const dataPoints = downsample(raw);
        const direction = determineTrendDirection(raw);
        const currentAverage = raw[raw.length - 1].rollingAverage;

        return {
            domain,
            dataPoints,
            currentAverage,
            direction,
            totalQuestions: records.length,
        };
    },

    /**
     * Fetches all domain trends in a single Firestore query.
     * Uses real per-answer data (answers[].domain) with run-level fallback for legacy runs.
     */
    getAllDomainTrends: async (
        userId: string,
        examId: string,
        domains: string[],
        windowSize: number = DEFAULT_WINDOW_SIZE
    ): Promise<DomainTrendResult[]> => {
        const runs = await fetchCompletedRuns(userId, examId);

        return domains.map(domain => {
            const records = flattenDomainAnswers(runs, domain);

            if (records.length === 0) {
                return { domain, dataPoints: [], currentAverage: null, direction: 'stable' as const, totalQuestions: 0 };
            }

            const raw = computeRollingAverage(records, windowSize);
            const dataPoints = downsample(raw);
            const direction = determineTrendDirection(raw);
            const currentAverage = raw[raw.length - 1].rollingAverage;

            return {
                domain,
                dataPoints,
                currentAverage,
                direction,
                totalQuestions: records.length,
            };
        });
    },
};

