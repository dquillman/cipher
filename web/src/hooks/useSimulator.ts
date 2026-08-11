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

    useEffect(() => {
        const loadExam = async () => {
            const user = auth.currentUser;
            setCurrentExamId(selectedExamId);

            if (!user) {
                navigate('/login');
                return;
            }

            try {
                // Check if directed from Planner with specific settings
                const state = location.state as { mode?: string; count?: number; durationMinutes?: number } | null;

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

                // Note: The SmartQuizService might need to handle fetching 180 unique questions.
                // If the DB is small, this might return duplicates or fewer questions.
                const ids = await SmartQuizService.generateSimulationExam(selectedExamId, questionCount);

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
                setQuestions(gradable);

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
                        gradable.map((q) => q.id),
                    );
                    setRunId(id);
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
            setTimeLeft((prev) => (prev <= 0 ? 0 : prev - 1));
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

    const handleAnswer = useCallback((optionIndex: number) => {
        setAnswers(prev => ({ ...prev, [currentIndex]: optionIndex }));
    }, [currentIndex]);

    const handleFlag = useCallback(() => {
        setFlagged(prev => ({ ...prev, [currentIndex]: !prev[currentIndex] }));
    }, [currentIndex]);

    const submitExam = async (autoSubmit = false) => {
        if (!autoSubmit && !window.confirm("Are you sure you want to finish the exam?")) {
            return;
        }

        setIsSubmitting(true);
        const user = auth.currentUser;
        if (!user) return;

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

        const timeSpent = (questions.length * 72) - timeLeft; // Crude calc based on initial time

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
            const answerRecords = questions.map((q, index) => ({
                questionId: q.id,
                selectedOption: answers[index],
                isCorrect: answers[index] === q.correctAnswer,
                domain: q.domain,
            })).filter((a) => a.selectedOption !== undefined);

            try {
                await QuizRunService.overwriteAnswers(user.uid, runId, answerRecords);
                await QuizRunService.completeRun(user.uid, runId, {
                    score,
                    total: questions.length,
                    timeSpent,
                    examId: currentExamId,
                    mode: 'simulation',
                });
            } catch (err) {
                console.error('[useSimulator] completeRun failed — attempt may not appear in history:', err);
            }
        }

        try {
            await XPService.awardXP(questions.length * 5 + score * 10, "Completed Exam Simulator", currentExamId);
        } catch (error) {
            console.error("Error awarding XP:", error);
        }

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
        submitExam
    };
};
