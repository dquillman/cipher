import { db } from '../firebase';
import { collection, doc, setDoc, getDoc, updateDoc, serverTimestamp, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

export interface DiagnosticRun {
    id: string;
    userId: string;
    examId: string;
    status: 'in_progress' | 'completed';
    startedAt: any;
    completedAt?: any;
    questionsShown: string[]; // List of Question IDs
    answers: {
        questionId: string;
        selectedOption: number;
        isCorrect: boolean;
        timestamp: any;
    }[];
    score?: number;
    summary?: any; // For any final breakdown data
}

export const DiagnosticService = {
    /**
     * Starts a new diagnostic run.
     */
    startDiagnostic: async (userId: string, examId: string, questions: string[]): Promise<string> => {
        try {
            // Create a ref for the new run
            const runsRef = collection(db, 'diagnostics', userId, 'runs');
            const newRunRef = doc(runsRef);

            const runData: DiagnosticRun = {
                id: newRunRef.id,
                userId,
                examId,
                status: 'in_progress',
                startedAt: serverTimestamp(),
                questionsShown: questions,
                answers: []
            };

            await setDoc(newRunRef, runData);
            console.log("Started Diagnostic Run:", newRunRef.id);
            return newRunRef.id;

        } catch (error) {
            console.error("Error starting diagnostic run:", error);
            throw error;
        }
    },

    /**
     * Saves a single answer to the current run.
     */
    saveProgress: async (userId: string, runId: string, answer: { questionId: string, selectedOption: number, isCorrect: boolean }) => {
        try {
            const runRef = doc(db, 'diagnostics', userId, 'runs', runId);

            // We need to append to the answers array.
            // Firestore arrayUnion is good, but let's just use it safely.
            // Note: Timestamp in arrayUnion might be tricky if we want serverTimestamp, so we use client date for array items usually,
            // or we read-modify-write if we need strict ordering?
            // arrayUnion puts it at the end usually if unique. 
            // Better to just update the doc with the new list if we had local state, 
            // but here we might not called with the full list.
            // Let's use getDoc -> update to be safe and simple for maintaining order.

            const snap = await getDoc(runRef);
            if (!snap.exists()) throw new Error("Run not found");

            const data = snap.data() as DiagnosticRun;
            const newAnswers = [...(data.answers || []), {
                ...answer,
                timestamp: new Date() // Client timestamp for the answer event itself
            }];

            await updateDoc(runRef, {
                answers: newAnswers,
                // update last active? 
                updatedAt: serverTimestamp()
            } as any);

        } catch (error) {
            console.error("Error saving progress:", error);
            // Non-blocking error? 
        }
    },

    /**
     * Marks the diagnostic as completed.
     */
    completeDiagnostic: async (userId: string, runId: string, finalScore: number, summary?: any) => {
        try {
            const runRef = doc(db, 'diagnostics', userId, 'runs', runId);
            await updateDoc(runRef, {
                status: 'completed',
                completedAt: serverTimestamp(),
                score: finalScore,
                summary: summary || {}
            });
            console.log("Completed Diagnostic Run:", runId);
        } catch (error) {
            console.error("Error completing diagnostic:", error);
        }
    },

    /**
     * Checks if there is an incomplete diagnostic run for this exam.
     */
    getLatestRun: async (userId: string, examId: string): Promise<DiagnosticRun | null> => {
        try {
            const runsRef = collection(db, 'diagnostics', userId, 'runs');
            const q = query(
                runsRef,
                where('examId', '==', examId),
                orderBy('startedAt', 'desc'),
                limit(1)
            );

            const snap = await getDocs(q);
            if (snap.empty) return null;

            return snap.docs[0].data() as DiagnosticRun;
        } catch (error) {
            console.error("Error getting latest run:", error);
            return null;
        }
    },

    /**
     * Returns true if ANY completed diagnostic run exists for this exam.
     * Queries quizRuns (the unified collection where Quiz.tsx persists all runs)
     * — NOT the legacy diagnostics collection (which has zero writers).
     */
    hasCompletedRun: async (userId: string, examId: string): Promise<boolean> => {
        console.log('[hasCompletedRun] called with userId:', userId, 'examId:', examId);
        try {
            // Diagnostic runs are persisted via QuizRunService.createRun() into quizRuns/{userId}/runs
            // with quizType='diagnostic' and status='completed'.
            // Query 2 fields to avoid 3-field composite index; filter examId client-side.
            const runsRef = collection(db, 'quizRuns', userId, 'runs');
            const q = query(
                runsRef,
                where('quizType', '==', 'diagnostic'),
                where('status', '==', 'completed'),
                limit(5)
            );
            const snap = await getDocs(q);
            console.log('[hasCompletedRun] docs returned:', snap.size);
            snap.docs.forEach((d, i) => {
                const data = d.data();
                console.log(`[hasCompletedRun] doc[${i}]:`, {
                    id: d.id,
                    examId: data.examId,
                    quizType: data.quizType,
                    status: data.status,
                    mode: data.mode,
                    completedAt: data.completedAt,
                });
            });
            const result = snap.docs.some(d => d.data().examId === examId);
            console.log('[hasCompletedRun] examId match result:', result);
            return result;
        } catch (error: any) {
            console.error('[hasCompletedRun] QUERY FAILED:', error.code, error.message);
            if (error.code === 'failed-precondition') {
                // Missing composite index — fall back to single-field query
                console.warn('[DiagnosticService] Missing index for hasCompletedRun, using fallback');
                try {
                    const runsRef = collection(db, 'quizRuns', userId, 'runs');
                    const fallbackQ = query(runsRef, where('status', '==', 'completed'));
                    const fallbackSnap = await getDocs(fallbackQ);
                    console.log('[hasCompletedRun] fallback docs:', fallbackSnap.size);
                    fallbackSnap.docs.forEach((d, i) => {
                        const data = d.data();
                        console.log(`[hasCompletedRun] fallback doc[${i}]:`, {
                            id: d.id,
                            examId: data.examId,
                            quizType: data.quizType,
                            status: data.status,
                        });
                    });
                    return fallbackSnap.docs.some(d => {
                        const data = d.data();
                        return data.quizType === 'diagnostic' && data.examId === examId;
                    });
                } catch {
                    return false;
                }
            }
            console.error("Error checking diagnostic completion:", error);
            return false;
        }
    },

    /**
     * Determines the weakest domain from a diagnostic run.
     * STRICT RULE: Diagnostic only. No external mastery.
     * 
     * TODO: v16+ Replace diagnostic-only domain selection with blended performance model 
     * (diagnostic + quiz history + readiness). Do not implement blended logic in v15.
     */
    getWeakestDomain: (run: any): string | null => {
        // Primary source: results.domainResults (written by QuizRunService.completeRun)
        // Shape: Record<string, { correct: number; total: number }>
        const domainResults = run.results?.domainResults;
        if (!domainResults || typeof domainResults !== 'object') return null;

        const domains = Object.keys(domainResults).map(domain => {
            const stats = domainResults[domain];
            return {
                domain,
                accuracy: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0
            };
        });

        if (domains.length === 0) return null;

        // Sort: Lowest Accuracy first. Tie-breaker: Alphabetical.
        domains.sort((a, b) => {
            if (Math.abs(a.accuracy - b.accuracy) > 0.01) {
                return a.accuracy - b.accuracy;
            }
            return a.domain.localeCompare(b.domain);
        });

        return domains[0].domain;
    }
};
