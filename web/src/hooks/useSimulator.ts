import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth } from '../firebase';
import { SmartQuizService } from '../services/smartQuiz';
import { fetchQuestionDocsByIds } from '../services/questionFetch';
import { XPService } from '../services/xpService';
import { useExam } from '../contexts/ExamContext';
import { EXAMS, isExam, type QuestionType } from '../config/exams';
import { filterToSingleIndexGraded } from '../utils/scoring';
import { QuizRunService } from '../services/QuizRunService';
import type { BloomLevel } from '../types/Bloom';
import { withTimeout } from '../utils/withTimeout';

export interface Question {
    id: string;
    stem: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
    domain: string;
    examId?: string;
    imageUrl?: string;
    bloomLevel?: BloomLevel; // Bloom's Taxonomy cognitive level
    type?: QuestionType;
    scenarios?: {
        label: string;
        probability: number;
        impact: number;
    }[];
    correctLabel?: string;
    pbqConfig?: import('../components/PBQQuestion').PBQConfig;
}

/** Mirrors Quiz.tsx: -1 means "no single chosen option", used here for a
 *  question the candidate never reached. */
const NO_SINGLE_INDEX = -1;

export const useSimulator = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { selectedExamId } = useExam();
    const [loading, setLoading] = useState(true);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [flagged, setFlagged] = useState<Record<number, boolean>>({});
    const [timeLeft, setTimeLeft] = useState(3600); // Default 60 mins
    const [isSubmitting, setIsSubmitting] = useState(false);
    const submitGuardRef = useRef(false);
    const [currentExamId, setCurrentExamId] = useState<string>(selectedExamId);

    // Always points at the current render's submitExam, so the expiry effect
    // below grades the answers the candidate actually gave. See the comment on
    // the countdown effect for what happens without it.
    const submitExamRef = useRef<(autoSubmit?: boolean) => void>(() => {});

    // The persisted run id for this sitting. The simulator used to create no
    // run at all — results lived only in router state, so a refresh on the
    // results page lost the attempt permanently and "Previous Attempts" (which
    // queries runs where mode === 'simulation') could never populate for
    // anyone. Created on load, completed on submit.
    const [runId, setRunId] = useState<string | null>(null);

    /* Absolute epoch-ms deadline for this sitting. The clock is derived from it
     * rather than being a free-running countdown, so closing the tab cannot buy
     * the candidate time. */
    const endsAtRef = useRef<number | null>(null);

    /* The start intent, captured once and IMMEDIATELY consumed.
     *
     * The previous attempt keyed "did they deliberately start a new sitting?"
     * off location.state being present, on the stated premise that a refresh
     * loses it. That premise is false. React Router keeps location.state in
     * window.history.state.usr (react-router 7.17, chunk-KFNXW4AL.js:136/217)
     * and the browser preserves history.state across a reload — so after F5 the
     * state is still there, the guard is still true, resume never runs, and the
     * fresh createRun then abandons the interrupted run. The sitting is not
     * merely skipped, it is destroyed.
     *
     * It looked verified because a scripted navigate() to the URL creates a new
     * history entry with no state, which is not what pressing reload does.
     *
     * Consuming it is the fix: read it on first render, strip usr from
     * history.state, and from then on a reload genuinely sees nothing. */
    const startIntentRef = useRef<{ mode?: string; count?: number; durationMinutes?: number } | null | undefined>(undefined);
    if (startIntentRef.current === undefined) {
        startIntentRef.current = (location.state as { mode?: string; count?: number; durationMinutes?: number } | null) ?? null;
        if (typeof window !== 'undefined' && window.history.state?.usr) {
            window.history.replaceState({ ...window.history.state, usr: null }, '');
        }
    }
    /* The full allotted duration in seconds, so time-spent is measured against
     * what this sitting actually allowed rather than a per-question guess. */
    const totalDurationRef = useRef<number>(0);
    /* Set while restoring, to stop the checkpoint effect writing back the
     * initial empty state over the sitting it just loaded. */
    const restoringRef = useRef(false);

    useEffect(() => {
        const loadExam = async () => {
            const user = auth.currentUser;
            setCurrentExamId(selectedExamId);

            if (!user) {
                navigate('/login');
                return;
            }

            try {
                // RESUME FIRST. Without this the mock had no memory at all: a
                // refresh — or a phone browser reloading a backgrounded tab —
                // two hours into a 180-question sitting generated a completely
                // different question set and put the full clock back. The
                // candidate lost every answer and had no way to tell that the
                // exam in front of them was not the one they started.
                // Only resume when the navigation carried no start intent. A
                // refresh loses location.state, which is precisely the case this
                // is for; arriving from the intro screen with a mode set means
                // they deliberately asked for a new sitting and must get one,
                // not silently rejoin an old exam.
                const intent = startIntentRef.current;
                const deliberateStart = Boolean(intent?.mode) || Boolean(intent?.count);
                const existing = deliberateStart
                    ? null
                    : await QuizRunService.getActiveSimulationRun(user.uid, selectedExamId);
                const snap = existing?.snapshot;
                if (existing && snap?.questionIds?.length && snap.endsAt) {
                    const remaining = Math.max(0, Math.round((snap.endsAt - Date.now()) / 1000));
                    const restored = filterToSingleIndexGraded(
                        await fetchQuestionDocsByIds<Question>(snap.questionIds),
                    );
                    // If the bank has moved under them — a question withdrawn
                    // mid-sitting — the saved indices no longer line up with the
                    // list, so the honest thing is a fresh exam rather than a
                    // silently reshuffled one.
                    if (restored.length === snap.questionIds.length) {
                        restoringRef.current = true;
                        endsAtRef.current = snap.endsAt;
                        totalDurationRef.current = snap.totalDuration ?? remaining;
                        setQuestions(restored);
                        setAnswers(snap.simAnswers ?? {});
                        setFlagged(snap.simFlagged ?? {});
                        setCurrentIndex(Math.min(snap.currentQuestionIndex ?? 0, restored.length - 1));
                        setTimeLeft(remaining);
                        setRunId(existing.id);
                        setLoading(false);
                        // Let the restore commit before checkpoints resume.
                        setTimeout(() => { restoringRef.current = false; }, 0);
                        return;
                    }
                    console.warn('[useSimulator] saved sitting no longer matches the bank; starting fresh');
                }

                // Check if directed from Planner with specific settings
                const state = startIntentRef.current;

                // Default to 50 questions (Standard Drill)
                let questionCount = 50;
                let durationSeconds = questionCount * 72; // ~1.2 mins per question

                if (state?.mode === 'full-mock') {
                    // Find fullMock config for the current exam
                    const examConfig = Object.values(EXAMS).find(e => isExam(selectedExamId, e.id));
                    const mockConfig = examConfig?.fullMock ?? { questionCount: 50, durationMinutes: 60 };
                    questionCount = mockConfig.questionCount;
                    durationSeconds = mockConfig.durationMinutes * 60;
                } else if (state?.count) {
                    // Custom overrides
                    questionCount = state.count;
                    if (state.durationMinutes) {
                        durationSeconds = state.durationMinutes * 60;
                    } else {
                        durationSeconds = questionCount * 72;
                    }
                }

                setTimeLeft(durationSeconds);
                endsAtRef.current = Date.now() + durationSeconds * 1000;
                totalDurationRef.current = durationSeconds;

                // Note: The SmartQuizService might need to handle fetching 180 unique questions.
                // If the DB is small, this might return duplicates or fewer questions.
                // Over-fetch. generateSimulationExam returns exactly questionCount
                // ids, and filterToSingleIndexGraded below then DROPS the pbq and
                // matching items the simulator cannot grade — after the slice. So
                // "50 Questions" on the intro card delivered 40, and "90
                // Questions" for the full mock delivered fewer still, with the
                // shortfall growing as we author more interactive items. Ask for
                // headroom and trim back to the promised number.
                const overFetch = Math.min(questionCount * 2, questionCount + 60);
                const ids = await SmartQuizService.generateSimulationExam(selectedExamId, overFetch);

                if (ids.length === 0) {
                    alert("No questions found for this exam.");
                    navigate('/app/simulator');
                    return;
                }

                const questionsData = await fetchQuestionDocsByIds<Question>(ids);

                // GUARD — do not let a format this surface cannot grade into the
                // exam. The simulator stores one option index per question
                // (`answers: Record<number, number>`) and grades with
                // `selected === q.correctAnswer`. A multi-response doc has no
                // `correctAnswer` at all, so it would be marked wrong no matter
                // what the candidate picked, and SimulatorResults would highlight
                // no option as correct — a silent mis-grade on a full mock, which
                // is the single worst place in the product to be quietly wrong.
                // `fetchQuestionDocsByIds` is an unvalidated cast from the same
                // bank Quiz.tsx reads, so the runtime filter is the only thing
                // standing here; the local `Question` interface above declaring
                // `correctAnswer: number` as required proves nothing at runtime.
                // Drop this filter only when this surface renders multi-select.
                const gradable = filterToSingleIndexGraded(questionsData);
                if (gradable.length !== questionsData.length) {
                    console.warn(
                        `[useSimulator] Excluded ${questionsData.length - gradable.length} question(s) whose format the simulator cannot grade.`
                    );
                }
                // Trim to the number the intro card promised. If the bank cannot
                // supply that many gradable items the sitting is honestly shorter
                // rather than padded, and the warning above already says so.
                const sized = gradable.slice(0, questionCount);
                if (sized.length < questionCount) {
                    console.warn(
                        `[useSimulator] ${selectedExamId} could only supply ${sized.length} gradable questions of the ${questionCount} promised.`,
                    );
                }
                setQuestions(sized);

                // Persist the run so the attempt survives a refresh and shows
                // up under Previous Attempts. mode 'simulation' is what
                // SimulatorIntro queries on. A failure here must not block the
                // exam — the candidate can still sit it, they just lose history
                // for this one attempt, so it is caught and logged, not thrown.
                try {
                    const id = await QuizRunService.createRun(
                        user.uid,
                        selectedExamId,
                        'simulation',
                        'simulation',
                        sized.map((q) => q.id),
                    );
                    setRunId(id);
                    // The deadline has to reach Firestore immediately: a refresh
                    // ten seconds in must still find a sitting it can restore.
                    await QuizRunService.saveSimulatorState(user.uid, id, {
                        currentQuestionIndex: 0,
                        questionIds: sized.map((q) => q.id),
                        simAnswers: {},
                        simFlagged: {},
                        endsAt: endsAtRef.current ?? Date.now() + durationSeconds * 1000,
                        totalDuration: durationSeconds,
                    });
                } catch (runErr) {
                    console.error('[useSimulator] could not create run — attempt will not be saved:', runErr);
                }

            } catch (error) {
                console.error("Error loading exam:", error);
                alert("Failed to load exam. Please try again.");
                navigate('/app/simulator');
            } finally {
                setLoading(false);
            }
        };

        loadExam();
    }, [navigate]);

    // The countdown only decrements. Calling submitExam from inside the
    // setTimeLeft updater made the updater impure, and — because this effect's
    // deps never change after loading flips false — it called whichever
    // submitExam was captured on that first render. On that render `answers`
    // was still {}, and the binding never updated, so letting the clock run out
    // on a finished 180-question mock graded an empty answer map and scored 0%.
    // The expiry now lives in its own effect and reads state through a ref.
    useEffect(() => {
        if (loading || isSubmitting) return;
        const timer = setInterval(() => {
            const endsAt = endsAtRef.current;
            if (endsAt == null) {
                setTimeLeft((prev) => (prev <= 0 ? 0 : prev - 1));
                return;
            }
            // Recomputed from the deadline every tick rather than decremented.
            // Phone browsers throttle timers in a backgrounded tab, so a
            // decrementing counter silently hands back minutes the candidate
            // did not have.
            setTimeLeft(Math.max(0, Math.round((endsAt - Date.now()) / 1000)));
        }, 1000);
        return () => clearInterval(timer);
    }, [loading, isSubmitting]);

    // Declared BEFORE the expiry effect on purpose: effects run in declaration
    // order after commit, so the ref has to be re-pointed at this render's
    // closure before the expiry effect reads it. No dependency array — it must
    // refresh on every render, including the one where timeLeft reaches 0.
    useEffect(() => {
        submitExamRef.current = submitExam;
    });

    useEffect(() => {
        if (loading || isSubmitting || timeLeft > 0) return;
        submitExamRef.current(true);
    }, [timeLeft, loading, isSubmitting]);

    /* Checkpoint the sitting. Debounced because it fires on every answer, flag
     * and navigation, and none of them is worth a round trip on its own — but
     * the gap between the last write and a refresh is exactly what a candidate
     * loses, so it is short. */
    useEffect(() => {
        if (loading || isSubmitting || !runId || restoringRef.current) return;
        const uid = auth.currentUser?.uid;
        const endsAt = endsAtRef.current;
        if (!uid || !endsAt || questions.length === 0) return;

        const write = () => withTimeout(
            QuizRunService.saveSimulatorState(uid, runId, {
                currentQuestionIndex: currentIndex,
                questionIds: questions.map((q) => q.id),
                simAnswers: answers,
                simFlagged: flagged,
                endsAt,
                totalDuration: totalDurationRef.current || undefined,
            }),
            5000, 'simulator checkpoint');

        const t = setTimeout(write, 1200);
        // A refresh or a closed tab is the case this whole feature exists for,
        // so flush rather than waiting out the debounce.
        const flush = () => { clearTimeout(t); void write(); };
        window.addEventListener('pagehide', flush);
        return () => {
            clearTimeout(t);
            window.removeEventListener('pagehide', flush);
        };
    }, [loading, isSubmitting, runId, currentIndex, answers, flagged, questions]);

    /* "Exit Exam (Progress Lost)" was a bare navigate in Simulator.tsx. The run
     * stayed in_progress with its deadline still running and its checkpointed
     * answers intact — so browser Back walked straight into the exam the
     * candidate had been told was discarded, and if the deadline passed
     * meanwhile the expiry effect auto-submitted it and filed a scored attempt
     * in their history. Say what we do, then do it. */
    const quitExam = useCallback(async () => {
        const user = auth.currentUser;
        if (user && runId) {
            await withTimeout(
                QuizRunService.completeRun(user.uid, runId, { abort: true, score: 0, total: questions.length }),
                4000, 'simulator quit');
        }
        // replace, so Back cannot return to the exam route.
        navigate('/app', { replace: true });
    }, [runId, questions.length, navigate]);

    const handleAnswer = useCallback((optionIndex: number) => {
        setAnswers(prev => ({ ...prev, [currentIndex]: optionIndex }));
    }, [currentIndex]);

    const handleFlag = useCallback(() => {
        setFlagged(prev => ({ ...prev, [currentIndex]: !prev[currentIndex] }));
    }, [currentIndex]);

    const submitExam = async (autoSubmit = false) => {
        // Re-entrancy guard. submitExam awaits three timed writes (6s + 6s + 4s)
        // before it navigates, and the hook never surfaced isSubmitting, so the
        // page could not disable the three Finish controls. On a weak signal the
        // screen sat unchanged for up to sixteen seconds and pressing Finish
        // again re-ran the whole submit -- awarding the exam XP a second time,
        // via an increment(), into the readiness score that gates the mock.
        //
        // A ref rather than the state flag: two clicks in the same tick would
        // both read the stale state value.
        if (submitGuardRef.current) return;

        if (!autoSubmit && !window.confirm("Are you sure you want to finish the exam?")) {
            return;
        }

        submitGuardRef.current = true;
        setIsSubmitting(true);
        const user = auth.currentUser;
        if (!user) {
            submitGuardRef.current = false;
            setIsSubmitting(false);
            return;
        }

        let score = 0;
        const details: { questionId: string; selectedOption: number; correctOption: number; isCorrect: boolean; domain: string; }[] = [];

        questions.forEach((q, index) => {
            const selected = answers[index];
            const isCorrect = selected === q.correctAnswer;
            if (isCorrect) score++;

            details.push({
                questionId: q.id,
                selectedOption: selected,
                correctOption: q.correctAnswer,
                isCorrect,
                domain: q.domain
            });
        });

        // Was (questions.length * 72) - timeLeft, which assumes every sitting
        // allots 72 seconds per question. That is true of the practice
        // simulator by coincidence and false of every full mock: Security+ is
        // 90 questions in 90 minutes, so this over-reported time spent by
        // 18 minutes, and PMP's 180-in-240 by 36. The deadline is the only
        // thing that knows the real duration.
        const endsAt = endsAtRef.current;
        const timeSpent = endsAt != null
            ? Math.max(0, Math.round((totalDurationRef.current - timeLeft)))
            : (questions.length * 72) - timeLeft;

        const resultState = {
            score,
            total: questions.length,
            timeSpent,
            questions,
            answers_map: answers,
            flagged,
            examId: currentExamId,
            runId,
        };

        // Persist the completed run BEFORE navigating, so the attempt is durable
        // the moment the results page opens. completeRun re-derives score and
        // domainResults from the persisted answers, so it is authoritative even
        // if the details below drift. answers is Record<index, optionIndex>;
        // build the answer records completeRun expects from it.
        if (runId) {
            /* Unanswered questions are PERSISTED, as wrong.
             *
             * This used to drop them before the write, and deriveMetrics divides
             * by the number of records it finds — so a skipped question counted
             * as neither right nor wrong, and leaving questions blank strictly
             * RAISED the Smart Readiness Score. Answer 20 of 180 PMP questions,
             * get 15 right, and readiness read high while the results screen
             * read 8%. Guessing the rest could only make it worse, which is
             * backwards for the meter that gates the mock.
             *
             * On a timed mock an unanswered question is wrong. That is what the
             * results screen already scores, and now the two agree. */
            const answerRecords = questions.map((q, index) => ({
                questionId: q.id,
                selectedOption: answers[index] ?? NO_SINGLE_INDEX,
                isCorrect: answers[index] === q.correctAnswer,
                domain: q.domain,
                unanswered: answers[index] === undefined,
            }));

            // Timed out rather than plainly awaited: a hanging write used to
            // leave the tester on the last question of a finished exam with no
            // spinner and no error. Results are computed locally and passed in
            // navigation state, so showing them does not depend on the write.
            await withTimeout(
                QuizRunService.overwriteAnswers(user.uid, runId, answerRecords),
                6000, 'simulator overwriteAnswers');
            await withTimeout(
                QuizRunService.completeRun(user.uid, runId, {
                    score,
                    total: questions.length,
                    timeSpent,
                    examId: currentExamId,
                    mode: 'simulation',
                }), 6000, 'simulator completeRun');
        }

        await withTimeout(
            XPService.awardXP(questions.length * 5 + score * 10, "Completed Exam Simulator", currentExamId),
            4000, 'simulator awardXP');

        navigate('/app/simulator/results', { state: resultState });
    };

    return {
        loading,
        questions,
        currentIndex,
        setCurrentIndex,
        answers,
        flagged,
        timeLeft,
        handleAnswer,
        handleFlag,
        quitExam,
        submitExam,
        isSubmitting
    };
};
