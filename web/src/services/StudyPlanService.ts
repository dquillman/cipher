import { db } from '../firebase';
import { collection, addDoc, query, where, getDocs, Timestamp, orderBy, limit, doc, updateDoc, getDoc } from 'firebase/firestore';
import type { StudyPlan } from '../types/StudyPlan';
import { getExamDomains } from './ExamMetadata';
import { deriveDomainResultsFromAnswers } from './QuizRunService';

/** Safely convert a Firestore Timestamp or plain value to a JS Date. */
function toDate(val: any): Date {
    if (val instanceof Timestamp) return val.toDate();
    if (val instanceof Date) return val;
    if (typeof val?.toDate === 'function') return val.toDate();
    if (typeof val?.seconds === 'number') return new Date(val.seconds * 1000);
    return new Date(val);
}

/** Maps a raw Firestore document snapshot to a typed StudyPlan. */
function mapFirestorePlan(id: string, data: Record<string, any>): StudyPlan {
    return {
        ...data,
        id,
        anchorDomain: data.anchorDomain as string | undefined,
        startDate: toDate(data.startDate),
        examDate: toDate(data.examDate),
        createdAt: toDate(data.createdAt),
        tasks: (data.tasks || []).map((t: any) => ({
            ...t,
            date: toDate(t.date),
        })),
    } as StudyPlan;
}

export const StudyPlanService = {
    /**
     * Creates a lean study plan — metadata + anchorDomain only.
     * No day-by-day tasks are generated; the UI derives actions from anchorDomain.
     */
    generatePlan: (
        userId: string,
        examId: string,
        examDate: Date,
        weeklyHours: number,
        _examName?: string,
        _domainNames?: string[],
        anchorDomain?: string
    ): StudyPlan => {
        return {
            userId,
            examId,
            startDate: new Date(),
            examDate,
            weeklyHours,
            createdAt: new Date(),
            status: 'active',
            ...(anchorDomain ? { anchorDomain } : {}),
        };
    },

    savePlan: async (plan: StudyPlan) => {
        try {
            const docRef = await addDoc(collection(db, 'study_plans'), plan);
            return docRef.id;
        } catch (error) {
            console.error("Error saving study plan:", error);
            throw error;
        }
    },

    archiveCurrentPlan: async (userId: string, examId?: string) => {
        try {
            const q = query(
                collection(db, 'study_plans'),
                where("userId", "==", userId),
                where("status", "==", "active")
            );
            const snapshot = await getDocs(q);

            const docsToArchive = examId
                ? snapshot.docs.filter(d => d.data().examId === examId)
                : snapshot.docs;

            await Promise.all(
                docsToArchive.map(d =>
                    updateDoc(doc(db, 'study_plans', d.id), { status: 'archived' })
                )
            );
        } catch (error) {
            console.error("Error archiving plan:", error);
            throw error;
        }
    },

    getCurrentPlan: async (userId: string, examId?: string): Promise<StudyPlan | null> => {
        console.log("StudyPlanService.getCurrentPlan called with:", { userId, examId });
        try {
            const constraints = [
                where("userId", "==", userId),
                where("status", "==", "active")
            ];

            if (examId) {
                constraints.push(where("examId", "==", examId));
            }

            const q = query(
                collection(db, 'study_plans'),
                ...constraints,
                orderBy("createdAt", "desc"),
                limit(1)
            );

            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                const d = querySnapshot.docs[0];
                return mapFirestorePlan(d.id, d.data());
            }
            return null;
        } catch (error) {
            console.error("Error fetching study plan:", error);
            return null;
        }
    },

    /**
     * Recalculates the study plan anchor domain using a performance-first model.
     *
     * Priority order:
     *   1. Real quiz history (non-diagnostic, completed) — primary signal.
     *      Minimum sample of 5 total answered questions required to trust the data.
     *      - Domains with < 5 answers → "under-measured": rotate exposure (fewest answers first)
     *      - All domains ≥ 5 answers → pick lowest accuracy domain
     *   2. Completed diagnostic run — fallback when quiz history is insufficient.
     *
     * Updates anchorDomain on the plan doc. No tasks are generated.
     */
    recalculatePlanFromProgress: async (
        userId: string,
        examId: string,
        existingPlan: StudyPlan,
        _examName?: string,
        domainNames?: string[]
    ): Promise<{ success: boolean; domain?: string; reason?: 'underMeasured' | 'lowestAccuracy'; plan?: StudyPlan; error?: string }> => {
        try {
            const runsRef = collection(db, 'quizRuns', userId, 'runs');
            const MIN_SAMPLE = 5;

            // ── Step 1: Fetch completed quiz runs ─────────────────────────────────────
            let totalQuizAnswers = 0;
            const domainStats: Record<string, { totalAnswered: number; totalCorrect: number }> = {};

            try {
                const quizQuery = query(
                    runsRef,
                    where('status', '==', 'completed'),
                    limit(50)
                );
                const quizSnap = await getDocs(quizQuery);

                const filteredRuns = quizSnap.docs
                    .map(d => d.data())
                    .filter(run =>
                        run.examId === examId &&
                        // Top-level field is the real one; meta is checked only
                        // for any legacy document written before the split.
                        run.quizType !== 'diagnostic' &&
                        run.meta?.quizType !== 'diagnostic'
                    );

                // ── Step 2: Aggregate domain performance across all quiz runs ─────────
                for (const run of filteredRuns) {
                    const answers: any[] = run.answers || [];
                    for (const a of answers) {
                        if (!a.domain) continue;
                        if (!domainStats[a.domain]) {
                            domainStats[a.domain] = { totalAnswered: 0, totalCorrect: 0 };
                        }
                        domainStats[a.domain].totalAnswered++;
                        if (a.isCorrect) domainStats[a.domain].totalCorrect++;
                    }
                }

                totalQuizAnswers = Object.values(domainStats).reduce(
                    (sum, s) => sum + s.totalAnswered, 0
                );
            } catch (quizErr: any) {
                console.warn('[PLAN] quiz run query failed, will use diagnostic fallback:', quizErr?.code);
            }

            console.log('[PLAN] totalQuizAnswers:', totalQuizAnswers);
            console.log('[PLAN] domainStats:', JSON.stringify(domainStats));

            // ── Step 3: Apply Minimum Sample Rule ────────────────────────────────────
            let newAnchorDomain: string | null = null;
            let reason: 'underMeasured' | 'lowestAccuracy' | undefined;
            let fallbackToDiagnostic = false;

            if (totalQuizAnswers >= MIN_SAMPLE) {
                const knownDomains = getExamDomains(domainNames || []);
                const knownDomainNames = knownDomains.map(d => d.name);

                const underMeasured = knownDomainNames
                    .filter(d => (domainStats[d]?.totalAnswered ?? 0) < MIN_SAMPLE)
                    .sort((a, b) => {
                        const diff = (domainStats[a]?.totalAnswered ?? 0) - (domainStats[b]?.totalAnswered ?? 0);
                        return diff !== 0 ? diff : a.localeCompare(b);
                    });

                if (underMeasured.length > 0) {
                    newAnchorDomain = underMeasured[0];
                    reason = 'underMeasured';
                } else {
                    const ranked = Object.entries(domainStats)
                        .filter(([d]) => knownDomainNames.includes(d))
                        .map(([d, s]) => ({
                            domain: d,
                            accuracy: s.totalAnswered > 0 ? s.totalCorrect / s.totalAnswered : 0
                        }))
                        .sort((a, b) => {
                            const diff = a.accuracy - b.accuracy;
                            return diff !== 0 ? diff : a.domain.localeCompare(b.domain);
                        });

                    newAnchorDomain = ranked[0]?.domain ?? null;
                    reason = 'lowestAccuracy';
                }
            } else {
                fallbackToDiagnostic = true;
            }

            console.log('[PLAN] fallbackToDiagnostic:', fallbackToDiagnostic);

            // ── Step 4: Diagnostic fallback ───────────────────────────────────────────
            if (fallbackToDiagnostic) {
                const { DiagnosticService } = await import('./DiagnosticService');

                const diagQuery = query(
                    runsRef,
                    where('quizType', '==', 'diagnostic'),
                    where('status', '==', 'completed'),
                    limit(10)
                );
                const diagSnap = await getDocs(diagQuery);

                const examDiagDocs = diagSnap.docs
                    .filter(d => d.data().examId === examId)
                    .sort((a, b) => (b.data().completedAt?.seconds ?? 0) - (a.data().completedAt?.seconds ?? 0));

                for (const d of examDiagDocs) {
                    const data = d.data();
                    newAnchorDomain = DiagnosticService.getWeakestDomain(data);

                    if (!newAnchorDomain && Array.isArray(data.answers) && data.answers.length > 0) {
                        const answersWithDomain = (data.answers as any[]).filter(
                            a => a.domain && a.selectedOption !== undefined
                        );
                        if (answersWithDomain.length > 0) {
                            const rederived = deriveDomainResultsFromAnswers(answersWithDomain);
                            newAnchorDomain = DiagnosticService.getWeakestDomain({
                                results: { domainResults: rederived }
                            });
                        }
                    }

                    if (newAnchorDomain) break;
                }
            }

            // ── Step 5: Safety fallback ───────────────────────────────────────────────
            if (!newAnchorDomain && Object.keys(domainStats).length > 0) {
                const safetyRanked = Object.entries(domainStats)
                    .map(([d, s]) => ({
                        domain: d,
                        accuracy: s.totalAnswered > 0 ? s.totalCorrect / s.totalAnswered : 0,
                        totalAnswered: s.totalAnswered
                    }))
                    .sort((a, b) => {
                        const diff = a.accuracy - b.accuracy;
                        return diff !== 0 ? diff : a.totalAnswered - b.totalAnswered;
                    });
                newAnchorDomain = safetyRanked[0]?.domain ?? null;
                reason = 'lowestAccuracy';
                console.log('[PLAN] safetyFallbackTriggered:', newAnchorDomain);
            }

            console.log('[PLAN] chosenDomain:', newAnchorDomain);

            if (!newAnchorDomain) {
                return {
                    success: false,
                    error: 'Not enough progress yet. Complete a quiz or run a diagnostic to start your plan.'
                };
            }

            // ── Persist: just update anchorDomain ─────────────────────────────────────
            if (!existingPlan.id) {
                return { success: false, error: 'Plan ID not found.' };
            }

            const planRef = doc(db, 'study_plans', existingPlan.id);
            await updateDoc(planRef, {
                anchorDomain: newAnchorDomain,
                lastRecalculatedAt: new Date()
            });

            const verifySnap = await getDoc(planRef);
            const freshPlan = verifySnap.exists()
                ? mapFirestorePlan(existingPlan.id, verifySnap.data())
                : undefined;

            return { success: true, domain: newAnchorDomain ?? undefined, reason, plan: freshPlan };

        } catch (error: any) {
            console.error('[PLAN] EXCEPTION in recalculatePlanFromProgress:', error?.code, error?.message, error);
            return { success: false, error: 'Failed to update plan. Please try again.' };
        }
    },

    /**
     * Toggles a task's completion state on a study plan.
     * Reads the plan doc, updates the matching task in the tasks array, and writes it back.
     */
    markTaskComplete: async (planId: string, taskId: string, completed: boolean): Promise<void> => {
        const planRef = doc(db, 'study_plans', planId);
        const snap = await getDoc(planRef);
        if (!snap.exists()) {
            throw new Error(`Study plan ${planId} not found`);
        }
        const data = snap.data() as any;
        const tasks = Array.isArray(data.tasks) ? data.tasks : [];
        const updatedTasks = tasks.map((t: any) =>
            t.id === taskId ? { ...t, completed } : t
        );
        await updateDoc(planRef, { tasks: updatedTasks });
    }
};
