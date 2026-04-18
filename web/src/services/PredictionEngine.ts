import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { getExamDomains } from './ExamMetadata';
import { deriveMetrics } from '../utils/questionMetrics';

export interface DomainReadiness {
    domain: string;
    score: number; // 0-100
    totalQuestions: number;
    status: 'Weak' | 'Moderate' | 'Strong' | 'Insufficient';
}

export interface ReadinessReport {
    overallScore: number | null; // 0-100, or null when preliminary
    trend: 'improving' | 'declining' | 'stable';
    domainBreakdown: DomainReadiness[];
    totalQuestionsAnswered: number;
    mockExamsTaken: number;
    examId: string;
    isPreliminary: boolean;
}

export const PredictionEngine = {
    /**
     * Calculates the user's readiness score for a specific exam.
     * Uses a weighted algorithm:
     * - 60% Overall Accuracy
     * - 30% Recent Performance (Last 5 attempts)
     * - 10% Consistency (Variance) - Simplified for now to just be part of recent trend
     */
    calculateReadiness: async (userId: string, examId: string, domains: string[] = []): Promise<ReadinessReport> => {
        try {
            // Query from quizRuns/{userId}/runs - the actual data source
            const runsRef = collection(db, 'quizRuns', userId, 'runs');

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let runs: any[] = [];

            // Helper: sort runs newest-first using completedAt if present, else updatedAt
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const runTime = (r: any): number => {
                const c = (r?.completedAt as any)?.seconds;
                if (typeof c === 'number') return c;
                const u = (r?.updatedAt as any)?.seconds;
                return typeof u === 'number' ? u : 0;
            };

            try {
                // Query completed + abandoned runs for this exam.
                // NOTE: abandoned runs lack `completedAt`, so we cannot orderBy that field
                // on the server (Firestore silently excludes docs missing the orderBy field).
                // We sort client-side using completedAt ?? updatedAt.
                const q = query(
                    runsRef,
                    where('examId', '==', examId),
                    where('status', 'in', ['completed', 'abandoned']),
                    limit(100)
                );
                const snapshot = await getDocs(q);
                runs = snapshot.docs
                    .map(d => d.data())
                    .sort((a, b) => runTime(b) - runTime(a))
                    .slice(0, 50);
            } catch {
                // Fallback: query only by status-in, filter exam client-side
                console.warn("PredictionEngine: Composite query failed, using fallback");
                const fallbackQ = query(
                    runsRef,
                    where('status', 'in', ['completed', 'abandoned']),
                    limit(200)
                );
                const snapshot = await getDocs(fallbackQ);
                runs = snapshot.docs
                    .map(d => d.data())
                    .filter(r => r.examId === examId)
                    .sort((a, b) => runTime(b) - runTime(a))
                    .slice(0, 50);
            }

            if (runs.length === 0) {
                return {
                    overallScore: null,
                    trend: 'stable',
                    domainBreakdown: [],
                    totalQuestionsAnswered: 0,
                    mockExamsTaken: 0,
                    examId,
                    isPreliminary: true
                };
            }

            // --- 1. Derive all metrics via single shared function ---
            const expectedDomains = getExamDomains(domains);
            const metrics = deriveMetrics(runs, expectedDomains.map(d => d.name));
            const { totalQuestions, overallAccuracy, mockCount,
                    domainStats, recentAccuracy } = metrics;

            let trend: 'improving' | 'declining' | 'stable' = 'stable';
            if (recentAccuracy > overallAccuracy + 5) trend = 'improving';
            if (recentAccuracy < overallAccuracy - 5) trend = 'declining';

            // --- 3. Weighted Score ---
            // 70% Overall, 30% Recent to reward improvement
            const weightedScore = Math.round((overallAccuracy * 0.7) + (recentAccuracy * 0.3));

            // --- 4. Volume Penalty (Confidence Adjustment) ---
            // If < 50 questions, apply a linear penalty to avoid overconfidence from small samples.
            // e.g. 10 questions = (50 - 10) * 0.5 = 20 points penalty.
            let confidencePenalty = 0;
            if (totalQuestions < 50) {
                confidencePenalty = (50 - totalQuestions) * 0.5;
            }

            const adjustedScore = Math.max(0, Math.round(weightedScore - confidencePenalty));

            // --- 5. Domain Breakdown ---
            const breakdown: DomainReadiness[] = Object.entries(domainStats).map(([domain, stats]) => {
                const s = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
                let status: 'Weak' | 'Moderate' | 'Strong' | 'Insufficient' = 'Insufficient';

                if (stats.total >= 10) {
                    if (s >= 75) status = 'Strong';
                    else if (s < 60) status = 'Weak';
                    else status = 'Moderate';
                }

                return {
                    domain,
                    score: Math.round(s),
                    totalQuestions: stats.total,
                    status
                };
            }).sort((a, b) => {
                // Sort Priority: Weak (0) -> Insufficient (1) -> Moderate (2) -> Strong (3)
                const priority = { 'Weak': 0, 'Insufficient': 1, 'Moderate': 2, 'Strong': 3 };
                return priority[a.status] - priority[b.status];
            });

            const isPreliminary = totalQuestions < 50;

            return {
                overallScore: isPreliminary ? null : adjustedScore,
                trend,
                domainBreakdown: breakdown,
                totalQuestionsAnswered: totalQuestions,
                mockExamsTaken: mockCount,
                examId,
                isPreliminary
            };

        } catch (error) {
            console.error("Prediction Engine Error:", error);
            throw error;
        }
    }
};
