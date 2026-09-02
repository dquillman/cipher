import { db } from '../firebase';
import { collection, doc, setDoc, getDoc, updateDoc, serverTimestamp, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

export interface QuizRunSnapshot {
    currentQuestionIndex: number;
    questionIds: string[]; // Store order of question IDs

    /** Simulator sittings only. The mock had no resume at all: a refresh two
     *  hours into a 180-question exam generated a DIFFERENT question set and
     *  reset the clock to full. These three fields are what it takes to put
     *  someone back exactly where they were.
     *
     *  endsAt is an absolute epoch-ms deadline, deliberately not a remaining-
     *  seconds count. A countdown that is only decremented while the tab is
     *  open means closing the laptop pauses a timed exam, which is worth more
     *  to a candidate than any answer on it. */
    simAnswers?: Record<number, number>;
    simFlagged?: Record<number, boolean>;
    endsAt?: number;
    /** Full allotted duration in seconds, so a resumed sitting can still report
     *  time spent against what it actually allowed. */
    totalDuration?: number;
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
        /** Index into the question's `options`, OR -1 when the format has no
         *  single chosen option (matching, pbq, multi-response). -1 is a
         *  sentinel, never a real index. Every reader of this field in the app
         *  only tests `!== undefined` to mean "the candidate answered this",
         *  which -1 correctly satisfies; nothing dereferences it as an index.
         *  `isCorrect` is the authoritative grade for every format. */
        selectedOption: number;
        /** `multi-response` only: the indices actually ticked. Present because
         *  selectedOption cannot represent a set. */
        selectedOptions?: number[];
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
        filterDomain?: string;      // For "weakest" or domain filtered modes
        filterBloomLevel?: string;  // For Bloom-focused drill (e.g. "Apply" inside a domain)
        patternId?: string;         // For "trap" mode
        patternName?: string;       // For "trap" mode
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
            // Abandon orphaned in_progress runs for THIS exam AND THIS quizType.
            // Scoping to quizType matters: a simulation (full mock) and a
            // practice/smart/trap run are different activities that can legitimately
            // be in progress at once. Abandoning across types meant merely opening
            // the simulator silently killed a user's in-progress practice quiz and
            // erased its resume banner. quizType is filtered client-side to avoid a
            // new composite index on (examId, status, quizType).
            const orphanQ = query(
                collection(db, 'quizRuns', userId, 'runs'),
                where('examId', '==', examId),
                where('status', '==', 'in_progress')
            );
            const orphans = await getDocs(orphanQ);
            const sameType = orphans.docs.filter(d => (d.data() as any).quizType === quizType);
            if (sameType.length > 0) {
                console.log(`[createRun] Abandoning ${sameType.length} orphaned in_progress ${quizType} run(s) for exam ${examId}`);
                await Promise.all(sameType.map(d =>
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
        answer: { questionId: string, selectedOption: number, selectedOptions?: number[], isCorrect: boolean, domain?: string },
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
     * Replaces the entire answers array in one write.
     *
     * saveProgress appends one answer at a time, which fits the Quiz flow where
     * each question is answered in turn. The simulator collects every answer
     * locally and submits them together, so it needs a single overwrite rather
     * than N appends. completeRun reads this array as the authoritative record,
     * so it must land before completeRun is called.
     */
    overwriteAnswers: async (
        userId: string,
        runId: string,
        answers: { questionId: string; selectedOption: number; selectedOptions?: number[]; isCorrect: boolean; domain?: string }[]
    ) => {
        const runRef = doc(db, 'quizRuns', userId, 'runs', runId);
        await updateDoc(runRef, {
            answers,
            updatedAt: serverTimestamp()
        } as any);
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
    /**
     * The in-progress simulator sitting for this exam, if there is one.
     *
     * Scoped to quizType 'simulation' on purpose: getLatestActiveRun returns the
     * most recent in-progress run of ANY type, so an abandoned practice quiz
     * would be handed back as a mock to resume.
     */
    getActiveSimulationRun: async (userId: string, examId: string): Promise<QuizRun | null> => {
        try {
            const runsRef = collection(db, 'quizRuns', userId, 'runs');
            // EQUALITY FILTERS ONLY, no orderBy. firestore.indexes.json defines
            // exactly two composite indexes on `runs`, and both order by
            // completedAt — nothing covers orderBy('createdAt'). Adding one
            // throws, and the failure is silent: the catch below returns null,
            // the simulator generates a fresh exam, and resume looks like it
            // simply does not work. That is exactly what happened on the first
            // attempt at this feature.
            //
            // Equality-only queries need no composite index, so this one always
            // runs. Ordering and quizType are applied in memory over at most a
            // handful of in-progress runs.
            const q = query(
                runsRef,
                where('examId', '==', examId),
                where('status', '==', 'in_progress'),
                limit(20)
            );
            const snapshot = await getDocs(q);
            const sims = snapshot.docs
                .map((d) => ({ ...(d.data() as QuizRun), id: d.id }))
                .filter((r) => r.quizType === 'simulation');
            if (sims.length === 0) return null;
            // Newest first. createdAt is a serverTimestamp, so it can still be
            // null on a document written moments ago and read back from cache —
            // treat that as newest rather than dropping it, which is the other
            // way this silently returned nothing.
            const millis = (r: QuizRun) => {
                const t = (r as unknown as { createdAt?: { toMillis?: () => number } }).createdAt;
                return typeof t?.toMillis === 'function' ? t.toMillis() : Number.MAX_SAFE_INTEGER;
            };
            sims.sort((a, b) => millis(b) - millis(a));
            return sims[0];
        } catch (error) {
            // A missing composite index surfaces here. Returning null means the
            // candidate starts a fresh sitting rather than seeing an error — the
            // old behaviour, which is the right thing to degrade to.
            console.error('[QuizRunService] getActiveSimulationRun failed:', error);
            return null;
        }
    },

    /**
     * Checkpoint a simulator sitting. Called on every answer, flag and move, so
     * it writes the whole picture rather than appending — the exam is not a
     * sequence of committed answers, it is one editable sheet until submitted.
     */
    saveSimulatorState: async (
        userId: string,
        runId: string,
        state: {
            currentQuestionIndex: number;
            questionIds: string[];
            simAnswers: Record<number, number>;
            simFlagged: Record<number, boolean>;
            endsAt: number;
            totalDuration?: number;
        },
    ) => {
        const runRef = doc(db, 'quizRuns', userId, 'runs', runId);
        await updateDoc(runRef, {
            snapshot: {
                currentQuestionIndex: state.currentQuestionIndex,
                questionIds: state.questionIds,
                simAnswers: state.simAnswers,
                simFlagged: state.simFlagged,
                endsAt: state.endsAt,
                ...(state.totalDuration != null ? { totalDuration: state.totalDuration } : {}),
            },
            updatedAt: serverTimestamp(),
        });
    },

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
     * Abandons all in_progress runs for a specific exam (used by Reset Progress).
     */
    abandonInProgressRuns: async (userId: string, examId: string) => {
        const runsQuery = query(
            collection(db, 'quizRuns', userId, 'runs'),
            where('status', '==', 'in_progress'),
            where('examId', '==', examId)
        );
        const runsSnap = await getDocs(runsQuery);
        await Promise.all(runsSnap.docs.map(d =>
            updateDoc(d.ref, { status: 'abandoned', endedAt: serverTimestamp() })
        ));
    },

    /**
     * Gets completed runs, optionally scoped to an exam (used by the usage heatmap).
     */
    getCompletedRuns: async (userId: string, examId?: string): Promise<QuizRun[]> => {
        const runsRef = collection(db, 'quizRuns', userId, 'runs');
        try {
            const q = examId
                ? query(runsRef, where('examId', '==', examId), where('status', '==', 'completed'), limit(1000))
                : query(runsRef, where('status', '==', 'completed'), limit(1000));
            const snap = await getDocs(q);
            return snap.docs.map(d => d.data() as QuizRun);
        } catch {
            // Fallback if index missing
            const q = query(runsRef, where('status', '==', 'completed'), limit(1000));
            const snap = await getDocs(q);
            let runs = snap.docs.map(d => d.data() as QuizRun);
            if (examId) runs = runs.filter(r => r.examId === examId);
            return runs;
        }
    },

    /**
     * Gets the most recent completed runs for an exam, newest first (used by analytics charts).
     */
    getRecentCompletedRuns: async (userId: string, examId: string): Promise<QuizRun[]> => {
        const runsRef = collection(db, 'quizRuns', userId, 'runs');
        try {
            const q = query(
                runsRef,
                where('examId', '==', examId),
                where('status', '==', 'completed'),
                orderBy('completedAt', 'desc'),
                limit(50)
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as QuizRun));
        } catch {
            console.warn("SpeedAccuracyChart: Composite index not available, using fallback query");
            const fallbackQ = query(
                runsRef,
                where('status', '==', 'completed'),
                limit(100)
            );
            const snapshot = await getDocs(fallbackQ);
            return snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() } as QuizRun))
                .filter(r => r.examId === examId)
                .sort((a, b) => {
                    const aTime = a.completedAt?.seconds || 0;
                    const bTime = b.completedAt?.seconds || 0;
                    return bTime - aTime;
                })
                .slice(0, 50);
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
        } catch {
            return null;
        }
    }
};

