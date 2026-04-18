import { db } from '../firebase';
import { collection, doc, setDoc, getDoc, updateDoc, serverTimestamp, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

export interface QuizRunSnapshot {
    currentQuestionIndex: number;
    questionIds: string[]; // Store order of question IDs
}

export interface QuizRun {
    id: string;
    userId: string;
    examId: string;
    quizType: 'diagnostic' | 'daily' | 'practice' | 'trap' | 'simulation' | 'smart' | 'weakest' | 'eval';
    type?: string; // Legacy field - DEPRECATED
    mode: string; // "smart", "trap", "diagnostic", "standard", etc. (from location.state)
    status: 'in_progress' | 'completed' | 'abandoned';

    // For Resuming
    snapshot: QuizRunSnapshot;

    // Progress
    answers: {
        questionId: string;
        selectedOption: number;
        isCorrect: boolean;
        domain?: string;
        timestamp: any;
    }[];

    createdAt: any;
    updatedAt: any;
    completedAt?: any;
    results?: any;

    // Metadata for UI
    meta?: {
        filterDomain?: string; // For "weakest" or domain filtered modes
        patternId?: string;    // For "trap" mode
        patternName?: string;  // For "trap" mode
    };
}

/**
 * Derives domainResults from the authoritative answers[] array.
 * Single source of truth — ignores React state accumulation.
 */
export function deriveDomainResultsFromAnswers(
    answers: { isCorrect: boolean; domain?: string }[]
): Record<string, { correct: number; total: number }> {
    const results: Record<string, { correct: number; total: number }> = {};
    for (const a of answers) {
        if (!a.domain) continue;
        if (!results[a.domain]) {
            results[a.domain] = { correct: 0, total: 0 };
        }
        results[a.domain].total++;
        if (a.isCorrect) results[a.domain].correct++;
    }
    return results;
}

export const QuizRunService = {
    /**
     * Creates a new Quiz Run document.
     */
    createRun: async (
        userId: string,
        examId: string,
        quizType: QuizRun['quizType'],
        mode: string,
        questionIds: string[],
        meta?: QuizRun['meta']
    ): Promise<string> => {
        try {
            // Abandon any orphaned in_progress runs for THIS exam only
            const orphanQ = query(
                collection(db, 'quizRuns', userId, 'runs'),
                where('examId', '==', examId),
                where('status', '==', 'in_progress')
            );
            const orphans = await getDocs(orphanQ);
            if (orphans.size > 0) {
                console.log(`[createRun] Abandoning ${orphans.size} orphaned in_progress run(s) for exam ${examId}`);
                await Promise.all(orphans.docs.map(d =>
                    updateDoc(d.ref, { status: 'abandoned', updatedAt: serverTimestamp() })
                ));
            }

            const runsRef = collection(db, 'quizRuns', userId, 'runs');
            const newRunRef = doc(runsRef);

            const runData: QuizRun = {
                id: newRunRef.id,
                userId,
                examId,
                quizType,
                // type: quizType, // LEGACY: We explicitly STOP writing 'type' to catch schema drift
                mode,
                status: 'in_progress',
                snapshot: {
                    currentQuestionIndex: 0,
                    questionIds
                },
                answers: [],
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                meta: meta || {}
            };

            await setDoc(newRunRef, runData);
            console.log("Created Unified Quiz Run:", newRunRef.id);
            return newRunRef.id;

        } catch (error) {
            console.error("Error creating quiz run:", error);
            throw error;
        }
    },

    /**
     * Saves progress: Appends answer AND updates snapshot state.
     */
    saveProgress: async (
        userId: string,
        runId: string,
        answer: { questionId: string, selectedOption: number, isCorrect: boolean, domain?: string },
        nextIndex: number
    ) => {
        try {
            const runRef = doc(db, 'quizRuns', userId, 'runs', runId);

            // We use a transaction or just simple update. Simple update is fine for this MVP.
            // We need to read current answers to append? Or arrayUnion.
            // ArrayUnion is safer for concurrency but order matches insertion usually.
            // However, we also need to update 'snapshot.currentQuestionIndex'.

            // To ensure array integrity, let's just getDoc -> update. 
            // In a low-concurrency single-user scenario this is perfectly safe.

            const snap = await getDoc(runRef);
            if (!snap.exists()) return; // Run deleted?

            const data = snap.data() as QuizRun;

            const newAnswer = {
                ...answer,
                timestamp: new Date()
            };

            // DEDUPLICATION: Check if we already have an answer for this question
            const existingIndex = (data.answers || []).findIndex(a => a.questionId === newAnswer.questionId);

            let updatedAnswers;
            if (existingIndex !== -1) {
                // Replace existing answer
                updatedAnswers = [...(data.answers || [])];
                updatedAnswers[existingIndex] = newAnswer;
            } else {
                // Append new answer
                updatedAnswers = [...(data.answers || []), newAnswer];
            }

            await updateDoc(runRef, {
                answers: updatedAnswers,
                'snapshot.currentQuestionIndex': nextIndex,
                updatedAt: serverTimestamp()
            } as any);

        } catch (error) {
            console.error("Error saving quiz progress:", error);
        }
    },

    /**
     * Completes the run.
     */
    completeRun: async (userId: string, runId: string, results: any) => {
        try {
            const runRef = doc(db, 'quizRuns', userId, 'runs', runId);

            // Read persisted answers — authoritative source
            const snap = await getDoc(runRef);
            const updatePayload: any = {
                status: 'completed',
                completedAt: serverTimestamp(),
                results,
                updatedAt: serverTimestamp()
            };
            if (snap.exists()) {
                const data = snap.data();
                const rawAnswers = data.answers || [];
                const cleanAnswers = rawAnswers.filter((a: any) => a.selectedOption !== undefined);
                if (cleanAnswers.length !== rawAnswers.length) {
                    console.warn(`[completeRun] Filtered ${rawAnswers.length - cleanAnswers.length} answers with undefined selectedOption`);
                    updatePayload.answers = cleanAnswers;
                }

                // Derive score and domainResults from persisted answers, not React state.
                // If stored answers lack the domain field (old runs), fall back to the
                // caller-supplied domainResults which was derived from React state.
                const correctCount = cleanAnswers.filter((a: any) => a.isCorrect).length;
                const derivedFromAnswers = deriveDomainResultsFromAnswers(cleanAnswers);
                const finalDomainResults = Object.keys(derivedFromAnswers).length > 0
                    ? derivedFromAnswers
                    : (results.domainResults || {});
                updatePayload.results = {
                    ...results,
                    score: correctCount,
                    domainResults: finalDomainResults,
                };
            }

            await updateDoc(runRef, updatePayload);
        } catch (error) {
            console.error("Error completing quiz run:", error);
        }
    },

    /**
     * Gets the latest IN_PROGRESS run for the user, scoped to a specific exam.
     */
    getLatestActiveRun: async (userId: string, examId: string): Promise<QuizRun | null> => {
        try {
            const runsRef = collection(db, 'quizRuns', userId, 'runs');
            const q = query(
                runsRef,
                where('examId', '==', examId),
                where('status', '==', 'in_progress'),
                orderBy('createdAt', 'desc'),
                limit(1)
            );
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                return snapshot.docs[0].data() as QuizRun;
            }
            return null;
        } catch (error) {
            console.error("Error fetching latest run:", error);
            return null;
        }
    },

    /**
     * Get a specific run by ID (for resuming via direct link/startup).
     */
    getRunById: async (userId: string, runId: string): Promise<QuizRun | null> => {
        try {
            const docRef = doc(db, 'quizRuns', userId, 'runs', runId);
            const snap = await getDoc(docRef);
            if (snap.exists()) {
                return snap.data() as QuizRun;
            }
            return null;
        } catch (error) {
            return null;
        }
    }
};

