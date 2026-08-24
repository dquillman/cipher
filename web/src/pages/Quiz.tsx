import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';
import { type TutorResponse, type CoachMode } from '../components/TutorBreakdown';
import type { PatternData } from '../components/PatternInsightCard';
import { doc, setDoc, getDoc, collection, query, getDocs, where } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { XPService } from '../services/xpService';
import { useSubscription } from '../contexts/SubscriptionContext';
import SubscriptionUpsellModal from '../components/SubscriptionUpsellModal';
import { useExam } from '../contexts/ExamContext';
import { SmartQuizService } from '../services/smartQuiz';
import { QuizRunService, deriveDomainResultsFromAnswers } from '../services/QuizRunService';
import { fetchQuestionDocsByIds } from '../services/questionFetch';
import { UsageEventService } from '../services/UsageEventService';
import { useSmartQuizReview } from '../contexts/SmartQuizReviewContext';
import QuestionProvenanceBadge from '../components/QuestionProvenanceBadge';
import { quizReportStore } from '../utils/quizReportStore';
import MatchingQuestion, { shuffleMatchPairs } from '../components/MatchingQuestion';
import PBQQuestion, { initPBQState, isPBQCorrect, type PBQState } from '../components/PBQQuestion';
import { FrictionEventService } from '../services/FrictionEventService';
import { trackExplanationViewed, trackActivatedUser } from '../lib/ga4';
import { DEFAULT_EXAM_ID, EXAM_LENS, EXAMS } from '../config/exams';
import type { Question } from '../types/Question';
import { canSubmitMultiResponse, toggleSelection, gradeAnswer, gradesBySingleIndex } from '../utils/scoring';
import QuizCompletionSummary from '../components/quiz/QuizCompletionSummary';
import QuizModeBanner from '../components/quiz/QuizModeBanner';
import ActiveFilterPill from '../components/quiz/ActiveFilterPill';
import AnswerOptions from '../components/quiz/AnswerOptions';
import ExplanationPanel from '../components/quiz/ExplanationPanel';
import StudyThemeToggle from '../components/quiz/StudyThemeToggle';
import { useStudyTheme } from '../hooks/useStudyTheme';

/** Persisted `selectedOption` for a format that has no single chosen index
 *  (matching, pbq, multi-response). Never a real option index — consumers only
 *  test this field for `!== undefined` to mean "answered". */
const NO_SINGLE_INDEX = -1;

export default function Quiz() {
    // Daylight study mode — light skin for bright rooms / long sessions
    const { theme: studyTheme, toggleTheme: toggleStudyTheme } = useStudyTheme();
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const loadStartRef = useRef(Date.now());
    const [showExplanation, setShowExplanation] = useState(false);
    const [explanationExpanded, setExplanationExpanded] = useState(false); // New: Track manual expansion
    const [tutorBreakdown, setTutorBreakdown] = useState<TutorResponse | null>(null);
    const [loadingBreakdown, setLoadingBreakdown] = useState(false);
    const [coachMode, setCoachMode] = useState<CoachMode>(() => (localStorage.getItem('coachMode') as CoachMode) || 'quick');
    const lastBreakdownRef = useRef<{ question: any; selectedOptIdx: number } | null>(null);
    const handleCoachModeChange = (mode: CoachMode) => {
        setCoachMode(mode);
        localStorage.setItem('coachMode', mode);
        // Re-fetch current breakdown with the new mode
        if (lastBreakdownRef.current) {
            const { question, selectedOptIdx } = lastBreakdownRef.current;
            setTutorBreakdown(null);
            setDepthContent(null);
            fetchTutorBreakdownWithMode(question, selectedOptIdx, mode);
        }
    };
    const [score, setScore] = useState(0);
    const [quizCompleted, setQuizCompleted] = useState(false);
    const [domainResults, setDomainResults] = useState<Record<string, { correct: number; total: number }>>({});
    const [quizDetails, setQuizDetails] = useState<any[]>([]);

    // Thinking Trap Suggestion State
    const [sessionTraps, setSessionTraps] = useState<Map<string, { count: number, pattern: PatternData }>>(new Map());

    // Mastery Transparency State
    const [questionProgressMap, setQuestionProgressMap] = useState<Map<string, any>>(new Map());

    // Active filter pill state (surfaces domain + Bloom-level filter + fallback banner)
    const [activeFilters, setActiveFilters] = useState<{ domain?: string; bloomLevel?: string; bloomFallback?: boolean }>({});

    // EC-119: Matching question state
    const [matchingState, setMatchingState] = useState<{
        shuffledDefinitions: string[];
        correctOrder: number[];
        currentOrder: number[];
    } | null>(null);

    // PBQ: Performance-based question state
    const [pbqState, setPbqState] = useState<PBQState | null>(null);

    // ECO "Multiple-Response": ticked option indices for the current question.
    // Kept separate from `selectedOption` so single-select MCQ — 100% of current
    // production content — is untouched by this format. Scoring lives in
    // utils/scoring.ts (all-or-nothing, matching PMI's no-partial-credit rule).
    const [multiSelected, setMultiSelected] = useState<number[]>([]);

    // Smart Quiz Review (app-level context)
    const smartReview = useSmartQuizReview();

    // Diagnostic Persistence State -> MOVED to below line 77 to access 'location'


    const { isPro, canTakeQuiz, incrementDailyCount, hasPassFor, passEntitlement } = useSubscription();
    const [showUpsell, setShowUpsell] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);

    // Measurement Metrics
    const [explanationRenderTime, setExplanationRenderTime] = useState<number | null>(null);



    // ...


    // ...
    const { examId: paramExamId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    // Unified Quiz Run State
    const [activeRunId, setActiveRunId] = useState<string | null>(null);
    const [quizType, setQuizType] = useState<string>('standard');

    // Initialize activeRunId from location state on mount if resuming
    useEffect(() => {
        if (location.state?.runId) {
            setActiveRunId(location.state.runId);
        }
    }, [location.state]);

    // Global context fallback
    const { selectedExamId, examName, bankVersion, examDomains, loading: examContextLoading } = useExam();

    const [activeExamId, setActiveExamId] = useState<string>('');
    const [reinforcementMessage, setReinforcementMessage] = useState<string | null>(null);

    // Exam Pass: content for this exam is unlocked if isPro OR an active pass covers it.
    const passCoversExam = activeExamId ? hasPassFor(activeExamId) : false;
    const hasContentAccess = isPro || passCoversExam;

    // Block access immediately if limit reached via direct URL, but handle graceful redirect/modal.
    // Pass holders bypass the free-tier daily limit for their covered exam.
    useEffect(() => {
        if (!loading && !canTakeQuiz && !passCoversExam) {
            setShowUpsell(true);
        }
    }, [loading, canTakeQuiz, passCoversExam]);

    useEffect(() => {
        // Determine the effective exam ID
        // Priority: URL Param > Context > Default
        const effectiveId = paramExamId || selectedExamId || DEFAULT_EXAM_ID;
        setActiveExamId(effectiveId);

        // Pre-Quiz Reinforcement Check
        const checkReinforcement = () => {
            const MEMORY_KEY = 'exam_coach_reinforcement';
            const FREQUENCY_KEY = 'exam_coach_last_reinforcement_shown';
            const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
            const ONE_DAY = 24 * 60 * 60 * 1000;

            try {
                const memoryStr = localStorage.getItem(MEMORY_KEY);
                if (!memoryStr) return;

                const memory = JSON.parse(memoryStr);
                const now = Date.now();

                if ((now - memory.timestamp) > SEVEN_DAYS) return;

                const lastShownStr = localStorage.getItem(FREQUENCY_KEY);
                if (lastShownStr) {
                    const lastShown = parseInt(lastShownStr, 10);
                    if ((now - lastShown) < ONE_DAY) return;
                }

                setReinforcementMessage(`Quick reminder: You’re getting better at spotting ${memory.patternName}.`);
                localStorage.setItem(FREQUENCY_KEY, now.toString());
            } catch (e) {
                console.error("Reinforcement check failed", e);
            }
        };
        checkReinforcement();
    }, [paramExamId, selectedExamId]);

    useEffect(() => {
        // Per-phase stopwatch for the quiz load.
        //
        // v1.25.5 shipped a Firestore persistence change on the theory that
        // re-downloading the exam bank was the cost. It was not: getDocs is
        // server-first, so a warm cache changes nothing for this path, and the
        // load still measured 10-17s on production. Rather than guess a second
        // time, record where the time actually goes and read it back from
        // friction_events.
        //
        // Every mark is relative to component mount (loadStartRef), so the
        // numbers line up with the loadTimeMs already on slow_load. `waited`
        // is the gap since the previous mark — the per-step cost.
        const marks: Array<{ phase: string; at: number; waited: number; n?: number }> = [];
        const mark = (phase: string, n?: number) => {
            const at = Date.now() - loadStartRef.current;
            const waited = at - (marks.length ? marks[marks.length - 1].at : 0);
            marks.push(n === undefined ? { phase, at, waited } : { phase, at, waited, n });
        };

        const fetchSmartQuestions = async () => {
            // Wait for ExamContext to finish resolving before creating diagnostic runs.
            // This ensures activeExamId is the fully-resolved exam ID and examDomains
            // are populated for domain-balanced question selection.
            if (!activeExamId || examContextLoading) return;

            // First mark: how long the effect sat blocked on ExamContext before
            // it was allowed to do anything at all.
            mark('examContextReady');

            try {
                const user = auth.currentUser;
                if (!user) return;

                // Server-side daily quiz quota validation (fail-closed)
                let validationData: { allowed: boolean; reason?: string };
                try {
                    const validateQuizStartFn = httpsCallable(functions, 'validateQuizStart');
                    const validationResult = await validateQuizStartFn({});
                    validationData = validationResult.data as { allowed: boolean; reason?: string };
                    mark('validateQuizStart');
                } catch (err) {
                    console.error('Server-side quiz validation failed:', err);
                    setValidationError('Unable to verify usage limits. Please try again.');
                    FrictionEventService.emit(user.uid, 'validation_blocked', { examId: activeExamId, errorMessage: 'Server validation failed' });
                    setLoading(false);
                    return;
                }

                if (!validationData.allowed) {
                    console.log('Server denied quiz start:', validationData);
                    FrictionEventService.emit(user.uid, 'paywall_hit', { page: 'quiz', quizType: location.state?.mode || 'standard', examId: activeExamId });
                    setShowUpsell(true);
                    setLoading(false);
                    return;
                }

                console.log("Fetching questions and progress for:", activeExamId);
                setLoading(true);

                // TRAP MODE
                if (location.state?.mode === 'trap') {
                    console.log("Initializing Trap Practice Mode...");
                    const trapIds = await SmartQuizService.generateTrapQuiz(
                        location.state.patternId,
                        location.state.domainTags,
                        activeExamId,
                        hasContentAccess ? 7 : 5,
                        location.state.masteryScore || 0
                    );

                    try {
                        const newRunId = await QuizRunService.createRun(
                            user.uid,
                            activeExamId,
                            'trap',
                            'trap',
                            trapIds,
                            {
                                patternId: location.state.patternId,
                                patternName: location.state.patternName || 'Thinking Trap'
                            }
                        );
                        setActiveRunId(newRunId);
                        setQuizType('trap');
                    } catch (e) {
                        console.error("Failed to persist trap run", e);
                    }

                    const fetchedQs = await fetchQuestionDocsByIds<Question>(trapIds);
                    setQuestions(fetchedQs);
                    setLoading(false);
                    return;
                }

                // TRAP DRILL MODE (5-question micro-drill)
                if (location.state?.mode === 'trap-drill') {
                    console.log("Initializing Trap Drill Mode...");
                    const drillIds = await SmartQuizService.generateTrapQuiz(
                        location.state.patternId,
                        location.state.domainTags,
                        activeExamId,
                        5,
                        location.state.masteryScore || 0
                    );

                    try {
                        const newRunId = await QuizRunService.createRun(
                            user.uid,
                            activeExamId,
                            'trap',
                            'trap-drill',
                            drillIds,
                            {
                                patternId: location.state.patternId,
                                patternName: location.state.patternName || 'Thinking Trap'
                            }
                        );
                        setActiveRunId(newRunId);
                        setQuizType('trap');
                    } catch (e) {
                        console.error("Failed to persist trap-drill run", e);
                    }

                    UsageEventService.emit(user.uid, 'trap_drill_started', activeExamId, {
                        patternId: location.state.patternId,
                    });

                    const fetchedQs = await fetchQuestionDocsByIds<Question>(drillIds);
                    setQuestions(fetchedQs);
                    setLoading(false);
                    return;
                }

                // DIAGNOSTIC CHECK (Legacy/Specific Logic) OR UNIFIED RESUME
                // If we have a runId, we resume regardless of mode
                if (location.state?.runId) {
                    console.log("Resuming Quiz Run:", location.state.runId);
                    const run = await QuizRunService.getRunById(user.uid, location.state.runId);

                    if (run) {
                        // Re-fetch questions from snapshot IDs
                        setQuizType(run.quizType || run.type || 'standard'); // Derived from DATA
                        const fetchedQs = await fetchQuestionDocsByIds<Question>(run.snapshot.questionIds);
                        setQuestions(fetchedQs);
                        if (run.snapshot.currentQuestionIndex !== undefined) {
                            setCurrentQuestionIndex(run.snapshot.currentQuestionIndex);
                        }

                        // Restore the progress already earned in this run.
                        //
                        // Resume used to rehydrate only questions and position, leaving
                        // score at 0, domainResults at {} and quizDetails at []. So a
                        // 10-question run answered 6 correct, saved, resumed, then
                        // finished 2-of-4 showed "2 / 10, 20%" on the completion
                        // summary, credited XP for 2 instead of 8, and reported domain
                        // results covering only the post-resume questions — while
                        // completeRun derived 8 from the persisted answers and wrote
                        // THAT to history. The dashboard and the summary the user had
                        // just read disagreed, and the summary was the wrong one.
                        //
                        // run.answers is the authoritative record for every format;
                        // isCorrect is already graded there (see QuizRunService).
                        const priorAnswers = (run.answers || []).filter(
                            (a: any) => a.selectedOption !== undefined
                        );
                        if (priorAnswers.length) {
                            setScore(priorAnswers.filter((a: any) => a.isCorrect).length);
                            setDomainResults(deriveDomainResultsFromAnswers(priorAnswers));
                            setQuizDetails(priorAnswers.map((a: any) => ({
                                questionId: a.questionId,
                                selectedOption: a.selectedOption,
                                selectedOptions: a.selectedOptions,
                                isCorrect: a.isCorrect,
                                domain: a.domain,
                            })));
                        }

                        setLoading(false);
                        return;
                    }
                }

                // If Diagnostic Mode AND NO runId -> Create Logic
                if (location.state?.mode === 'diagnostic' && !location.state?.runId) {
                    console.log("Initializing Diagnostic Mode...");

                    // Domain-balanced diagnostic: 3 questions per domain
                    const diagIds = await SmartQuizService.generateDiagnosticExam(activeExamId, examDomains);

                    // Fetch the question bodies WHILE the run is being written.
                    // The two are independent — createRun only needs the ids —
                    // but this path used to await them back to back, so the
                    // very first screen a new user ever sees paid for both.
                    // This is the diagnostic, i.e. the new-signup path.
                    const diagQuestionsPromise = fetchQuestionDocsByIds<Question>(diagIds);
                    diagQuestionsPromise.catch(() => { });

                    // PERSISTENCE: Create Run
                    try {
                        const runId = await QuizRunService.createRun(
                            auth.currentUser!.uid,
                            activeExamId,
                            'diagnostic',
                            'diagnostic',
                            diagIds
                        );

                        setActiveRunId(runId);
                        setQuizType('diagnostic');
                    } catch (e) {
                        console.error("Failed to persist diagnostic start", e);
                    }

                    const fetchedQs = await diagQuestionsPromise;
                    setQuestions(fetchedQs);
                    setLoading(false);
                    return;
                }

                // Check for Smart Quiz (passed via state)
                const stateIds = location.state?.questionIds as string[] | undefined;
                if (stateIds && stateIds.length > 0) {
                    console.log("Loading specific Smart Quiz questions:", stateIds);
                    const fetchedQs = await fetchQuestionDocsByIds<Question>(stateIds);
                    setQuestions(fetchedQs);
                    setLoading(false);
                    return;
                }

                // Kick off the two reads that do NOT depend on the question
                // query before issuing it, so all three fly in parallel
                // instead of costing three sequential round-trips. Both are
                // awaited further down, at the point they are actually needed.
                //
                // The bare .catch() on progressPromise only suppresses the
                // unhandled-rejection warning for the window before we await
                // it — the await below still throws and still lands in the
                // outer catch, so error handling is unchanged.
                const progressPromise = getDocs(
                    collection(db, 'users', user.uid, 'questionProgress')
                );
                progressPromise.catch(() => { });

                const masteryPromise = getDoc(doc(db, 'userMastery', `${user.uid}_${activeExamId}`))
                    .then(s => (s.exists() ? s.data()?.masteryData || {} : {}))
                    .catch(err => { console.warn('userMastery read failed, continuing without it:', err); return {}; });

                // 1. Fetch questions (optionally filtered by domain and/or Bloom level)
                const questionsRef = collection(db, 'questions');
                const constraints: any[] = [where('examId', '==', activeExamId)];

                const filterDomain = location.state?.filterDomain as string | undefined;
                if (filterDomain) {
                    console.log("Filtering quiz by domain:", filterDomain);
                    constraints.push(where('domain', '==', filterDomain));
                }

                const filterBloomLevel = location.state?.filterBloomLevel as string | undefined;
                let bloomConstraint: any = null;
                if (filterBloomLevel) {
                    console.log("Filtering quiz by Bloom level:", filterBloomLevel);
                    bloomConstraint = where('bloomLevel', '==', filterBloomLevel);
                    constraints.push(bloomConstraint);
                }

                let q = query(questionsRef, ...constraints);

                let questionsSnap = await getDocs(q);
                mark('questionBankFetched', questionsSnap.size);
                let allQuestions = questionsSnap.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Question[];

                // Empty-result fallback: if bloom filter returned nothing, drop it and keep domain filter.
                // This avoids stranding users on an empty quiz when a domain/Bloom cell has no questions.
                let bloomFallbackApplied = false;
                if (allQuestions.length === 0 && filterBloomLevel) {
                    console.warn(`No questions for domain=${filterDomain ?? 'any'} + bloom=${filterBloomLevel}. Falling back to domain-only filter.`);
                    const fallbackConstraints = constraints.filter(c => c !== bloomConstraint);
                    q = query(questionsRef, ...fallbackConstraints);
                    questionsSnap = await getDocs(q);
                    allQuestions = questionsSnap.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    })) as Question[];
                    bloomFallbackApplied = true;
                }

                // Final safety fallback: if ANY filter (domain and/or Bloom) still
                // left us with zero questions, drop ALL filters and load the full
                // exam bank. This is what strands users on "No questions found"
                // when a stale cross-exam filter lingers in navigation state — e.g.
                // clicking a "People" mastery ring on PMP, then switching to an
                // exam that has no "People" domain. The exam has questions; the
                // filter just matched none. Recover instead of dead-ending.
                let filterFellBackToAll = false;
                if (allQuestions.length === 0 && (filterDomain || filterBloomLevel)) {
                    console.warn(`No questions for examId=${activeExamId} with domain=${filterDomain ?? 'any'}/bloom=${filterBloomLevel ?? 'any'}. Falling back to the full exam bank.`);
                    questionsSnap = await getDocs(query(questionsRef, where('examId', '==', activeExamId)));
                    allQuestions = questionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Question[];
                    filterFellBackToAll = true;
                }

                // Surface active filters to the UI (pill + fallback banner).
                // Cleared when we fell all the way back to the full bank.
                setActiveFilters({
                    domain: filterFellBackToAll ? undefined : filterDomain,
                    bloomLevel: (bloomFallbackApplied || filterFellBackToAll) ? undefined : filterBloomLevel,
                    bloomFallback: bloomFallbackApplied && !filterFellBackToAll,
                });

                if (allQuestions.length === 0) {
                    setQuestions([]);
                    setLoading(false);
                    return;
                }

                // 2. Collect the user's progress (read started in parallel above)
                const progressSnap = await progressPromise;
                mark('progressFetched', progressSnap.size);
                const progressMap = new Map();
                progressSnap.forEach(doc => {
                    progressMap.set(doc.id, doc.data());
                });
                setQuestionProgressMap(progressMap);

                // 3. Categorize Questions
                const learning: Question[] = [];
                const newQs: Question[] = [];
                const mastered: Question[] = [];

                allQuestions.forEach(q => {
                    const prog = progressMap.get(q.id);
                    if (!prog) {
                        newQs.push(q);
                    } else if (prog.status === 'mastered') {
                        mastered.push(q);
                    } else {
                        learning.push(q);
                    }
                });

                console.log(`Smart Stats: New: ${newQs.length}, Learning: ${learning.length}, Mastered: ${mastered.length}`);

                // 4. Selection Logic (SRS Algorithm)
                // Priority: Learning (Review) > New > Mastered (Refresh)

                const TARGET_SIZE = hasContentAccess ? 10 : 5;
                let selected: Question[] = [];
                const selectedIds = new Set<string>();
                const shuffle = (arr: any[]) => arr.sort(() => 0.5 - Math.random());

                if (!filterDomain && examDomains && examDomains.length >= 2) {
                    // --- Adaptive multi-domain distribution ---
                    // Resilient: a failed mastery read (rules hiccup, offline)
                    // must degrade to "no mastery data", never kill the loader.
                    const mData = await masteryPromise;
                    mark('masteryFetched');

                    // Rank domains weakest → strongest
                    const ranked = examDomains
                        .map(d => ({
                            domain: d,
                            score: mData[d]?.total > 0 ? (mData[d].correct / mData[d].total) * 100 : 0
                        }))
                        .sort((a, b) => a.score - b.score);

                    // Distribution: gap between #1 and #2 weakest determines spread
                    const gap = ranked[1].score - ranked[0].score;
                    const base = gap < 3 ? [5, 3, 2] : [6, 3, 1];

                    // Scale to TARGET_SIZE (handles Pro=10, Free=5)
                    const dist = base.map(n => Math.round((n / 10) * TARGET_SIZE));
                    let sum = dist.reduce((a, b) => a + b, 0);
                    while (sum < TARGET_SIZE) { dist[0]++; sum++; }
                    while (sum > TARGET_SIZE) { dist[dist.length - 1] = Math.max(0, dist[dist.length - 1] - 1); sum--; }

                    // Per-domain selection with SRS priority (learning → new → mastered)
                    for (let i = 0; i < Math.min(ranked.length, dist.length); i++) {
                        const d = ranked[i].domain;
                        const quota = dist[i];
                        let added = 0;

                        for (const pool of [
                            shuffle(learning.filter(q => q.domain === d)),
                            shuffle(newQs.filter(q => q.domain === d)),
                            shuffle(mastered.filter(q => q.domain === d)),
                        ]) {
                            for (const q of pool) {
                                if (added >= quota || selected.length >= TARGET_SIZE) break;
                                if (!selectedIds.has(q.id)) {
                                    selected.push(q);
                                    selectedIds.add(q.id);
                                    added++;
                                }
                            }
                        }
                    }

                    // Fallback: if any domain was sparse, fill from remaining questions
                    if (selected.length < TARGET_SIZE) {
                        for (const pool of [shuffle(learning), shuffle(newQs), shuffle(mastered)]) {
                            for (const q of pool) {
                                if (selected.length >= TARGET_SIZE) break;
                                if (!selectedIds.has(q.id)) {
                                    selected.push(q);
                                    selectedIds.add(q.id);
                                }
                            }
                        }
                    }
                } else {
                    // --- Single-domain mode (mastery ring clicks) ---
                    const addUnique = (candidates: Question[]) => {
                        for (const c of candidates) {
                            if (selected.length >= TARGET_SIZE) break;
                            if (!selectedIds.has(c.id)) {
                                selected.push(c);
                                selectedIds.add(c.id);
                            }
                        }
                    };

                    addUnique(shuffle(learning));
                    if (selected.length < TARGET_SIZE) addUnique(shuffle(newQs));
                    if (selected.length < TARGET_SIZE && mastered.length > 0) {
                        const remaining = TARGET_SIZE - selected.length;
                        const toTake = filterDomain ? remaining : Math.min(remaining, Math.ceil(TARGET_SIZE * 0.3));
                        const shuffledMastered = shuffle(mastered);
                        let taken = 0;
                        for (const m of shuffledMastered) {
                            if (taken >= toTake || selected.length >= TARGET_SIZE) break;
                            if (!selectedIds.has(m.id)) {
                                selected.push(m);
                                selectedIds.add(m.id);
                                taken++;
                            }
                        }
                    }
                }

                // --- First-Exposure Guarantee (subtype-level) ---
                // For each non-standard question subtype, ensure the user sees at least
                // one instance if they have never encountered that subtype before.
                // Generic: works for 'emv' and any future subtypes.
                const subtypes = new Set(
                    allQuestions
                        .filter(q => q.type && q.type !== 'mcq')
                        .map(q => q.type!)
                );

                for (const subtype of subtypes) {
                    // Already have one in the session?
                    if (selected.some(q => q.type === subtype)) continue;

                    // Has the user ever seen this subtype?
                    const seenSubtype = allQuestions
                        .filter(q => q.type === subtype)
                        .some(q => progressMap.has(q.id));
                    if (seenSubtype) continue;

                    // Find a candidate of this subtype — prefer unseen, pick randomly,
                    // avoid repeating the same question from the previous session.
                    const lastServedKey = `lastServed_${subtype}`;
                    const lastServedId = localStorage.getItem(lastServedKey);

                    const subtypePool = allQuestions.filter(
                        q => q.type === subtype && !selectedIds.has(q.id)
                    );
                    if (subtypePool.length === 0) continue;

                    const unseen = subtypePool.filter(q => !progressMap.has(q.id));
                    let pickFrom = unseen.length > 0 ? unseen : subtypePool;

                    // Exclude last-served if alternatives exist
                    if (lastServedId && pickFrom.length > 1) {
                        pickFrom = pickFrom.filter(q => q.id !== lastServedId);
                    }

                    const candidate = pickFrom[Math.floor(Math.random() * pickFrom.length)];

                    // Remove one question to keep session size constant
                    if (selected.length >= TARGET_SIZE) {
                        let removeIdx = -1;

                        // Prefer removing a "new" non-subtype question (lowest priority)
                        for (let i = selected.length - 1; i >= 0; i--) {
                            if (!progressMap.has(selected[i].id) && selected[i].type !== subtype) {
                                removeIdx = i;
                                break;
                            }
                        }

                        // Fallback: remove last question in array
                        if (removeIdx === -1) {
                            removeIdx = selected.length - 1;
                        }

                        selectedIds.delete(selected[removeIdx].id);
                        selected.splice(removeIdx, 1);
                    }

                    selected.push(candidate);
                    selectedIds.add(candidate.id);
                    localStorage.setItem(lastServedKey, candidate.id);
                    console.log(`First-exposure: injected ${subtype} question ${candidate.id}`);
                }

                if (selected.length !== TARGET_SIZE) {
                    console.warn("Session size mismatch:", selected.length);
                }

                selected = selected.sort(() => 0.5 - Math.random());
                console.log("Selected Smart Questions:", selected.length, selected.map(q => q.domain));
                mark('selectionComputed', selected.length);
                setQuestions(selected);

                // UNIFIED PERSISTENCE: Create Run for Smart/Weakest Modes if not resuming
                if (!location.state?.runId) {
                    const mode = location.state?.mode || 'smart';
                    const type = mode === 'diagnostic' ? 'diagnostic' : 'daily'; // map simple types
                    const qIds = selected.map(q => q.id);

                    // Preserve active filters in run meta so history/history-detail can label runs correctly
                    const runMeta: { filterDomain?: string; filterBloomLevel?: string } = {};
                    if (filterDomain) runMeta.filterDomain = filterDomain;
                    if (filterBloomLevel && !bloomFallbackApplied) runMeta.filterBloomLevel = filterBloomLevel;

                    try {
                        const newRunId = await QuizRunService.createRun(
                            user.uid,
                            activeExamId,
                            type,
                            mode,
                            qIds,
                            Object.keys(runMeta).length > 0 ? runMeta : undefined
                        );
                        setActiveRunId(newRunId);
                        setQuizType(type);
                        mark('runCreated');
                    } catch (e) {
                        console.error("Failed to create start run persistence", e);
                    }
                }

            } catch (error) {
                console.error("Error fetching smart questions:", error);
                const uid = auth.currentUser?.uid;
                if (uid) FrictionEventService.emit(uid, 'error_shown', { page: 'quiz', examId: activeExamId, errorMessage: String(error) });
                // A loader failure is NOT "the question bank is empty" — surface
                // the retry UI instead of the misleading "No questions found".
                setValidationError('Could not load your questions. Please retry.');
            } finally {
                setLoading(false);
                mark('loaderDone');
                const loadMs = Date.now() - loadStartRef.current;

                // EC-130: Log slow loads (> 5s). Threshold unchanged so the
                // count stays comparable with the 87 events logged before this.
                if (loadMs > 5000 && auth.currentUser) {
                    FrictionEventService.emit(auth.currentUser.uid, 'slow_load', { page: 'quiz', examId: activeExamId, loadTimeMs: loadMs });
                }

                // Phase breakdown on EVERY load, fast or slow — a fast load is
                // just as informative here, and slow_load alone never said
                // which step was the expensive one.
                //
                // `slowestPhase` is precomputed rather than derived at read
                // time so a glance at the raw document answers the question.
                if (auth.currentUser) {
                    const slowest = marks.reduce(
                        (a, b) => (b.waited > a.waited ? b : a),
                        { phase: 'none', at: 0, waited: -1 }
                    );
                    FrictionEventService.emit(auth.currentUser.uid, 'quiz_load_timing', {
                        page: 'quiz',
                        examId: activeExamId,
                        loadTimeMs: loadMs,
                        mode: location.state?.mode || 'smart',
                        phases: marks,
                        slowestPhase: slowest.phase,
                        slowestPhaseMs: slowest.waited,
                        // Time from browser navigation to loader finish. When
                        // this is much larger than loadTimeMs, the cost is
                        // before Quiz ever mounts (bundle, auth, ExamContext)
                        // and no amount of tuning in here will touch it.
                        sinceNavigationMs: Math.round(performance.now()),
                    });
                }
            }
        };

        fetchSmartQuestions();
    }, [activeExamId, examContextLoading, retryCount]);

    // Time to the first question actually being on screen.
    //
    // The loader's own loadTimeMs stops when the data is ready, but a hand-timed
    // run on production measured 10-17s from navigation to a visible question
    // while that metric read 5.9s. Something after the fetch is costing seconds,
    // and nothing recorded it. This does — one event per mount, on the frame
    // after React commits the first question.
    const paintReportedRef = useRef(false);
    useEffect(() => {
        if (paintReportedRef.current) return;
        if (loading || questions.length === 0) return;
        paintReportedRef.current = true;

        requestAnimationFrame(() => {
            const uid = auth.currentUser?.uid;
            if (!uid) return;
            FrictionEventService.emit(uid, 'quiz_load_timing', {
                page: 'quiz',
                examId: activeExamId,
                phase: 'firstQuestionPainted',
                sinceMountMs: Date.now() - loadStartRef.current,
                sinceNavigationMs: Math.round(performance.now()),
                questionCount: questions.length,
            });
        });
    }, [loading, questions, activeExamId]);

    // EC-119: Initialize matching question state when question changes
    useEffect(() => {
        const q = questions[currentQuestionIndex];
        if (q?.type === 'matching' && q.matchPairs) {
            const { shuffledDefinitions, correctOrder, initialOrder } = shuffleMatchPairs(q.matchPairs);
            setMatchingState({ shuffledDefinitions, correctOrder, currentOrder: initialOrder });
        } else {
            setMatchingState(null);
        }
        // PBQ: Initialize PBQ state when question changes
        if (q?.type === 'pbq' && q.pbqConfig) {
            setPbqState(initPBQState(q.pbqConfig));
        } else {
            setPbqState(null);
        }
        // Multiple-response: always start the question with nothing ticked.
        setMultiSelected([]);
    }, [currentQuestionIndex, questions]);

    const handleOptionSelect = (index: number) => {
        if (showExplanation) return;
        // Multiple-response: tick/untick, never replace. Single-select is
        // unchanged — it still swaps the one chosen option.
        if (questions[currentQuestionIndex]?.type === 'multi-response') {
            setMultiSelected(prev => toggleSelection(prev, index));
            return;
        }
        setSelectedOption(index);
    };

    const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
    const [questionDurations, setQuestionDurations] = useState<number[]>([]);

    useEffect(() => {
        setQuestionStartTime(Date.now());
    }, [currentQuestionIndex, loading]);

    // ── THE grading call ───────────────────────────────────────────────────
    // Every place that decides "was this answer right?" goes through here:
    // handleSubmit, handleNext, and the Quit & Save path. Those three used to
    // each carry their own copy of the format ternary, which meant adding a
    // format was three edits and missing one produced a question graded right
    // on screen and wrong in the saved record — invisible until someone reads
    // their stats. The branch itself lives in utils/scoring.ts (gradeAnswer)
    // and is unit tested there; Quiz.wiring.test.ts asserts this stays the
    // only grading site in this file.
    const gradeCurrentQuestion = (q: Question): boolean => gradeAnswer({
        type: q.type,
        isPbqCorrect: q.pbqConfig && pbqState ? () => isPBQCorrect(q.pbqConfig!, pbqState) : undefined,
        isMatchingCorrect: matchingState
            ? () => matchingState.currentOrder.every((v, i) => v === matchingState.correctOrder[i])
            : undefined,
        correctAnswers: q.correctAnswers,
        multiSelected,
        correctAnswer: q.correctAnswer,
        selectedOption,
    });

    const handleSubmit = () => {
        const currentQuestion = questions[currentQuestionIndex];

        // EC-119: Matching questions use matchingState instead of selectedOption
        const isMatching = currentQuestion.type === 'matching' && matchingState;
        const isPBQ = currentQuestion.type === 'pbq' && pbqState && currentQuestion.pbqConfig;
        // Multiple-response uses multiSelected instead of selectedOption.
        const isMultiResponse = currentQuestion.type === 'multi-response';
        if (isMultiResponse && !canSubmitMultiResponse(multiSelected)) return;
        if (!isMatching && !isPBQ && !isMultiResponse && selectedOption === null) return;

        const endTime = Date.now();
        const duration = (endTime - questionStartTime) / 1000; // in seconds
        setQuestionDurations([...questionDurations, duration]);

        const isCorrect = gradeCurrentQuestion(currentQuestion);

        if (isCorrect) {
            setScore(prev => prev + 1);
        }

        // Track domain results
        const domain = currentQuestion.domain;
        if (domain) {
            setDomainResults(prev => ({
                ...prev,
                [domain]: {
                    correct: (prev[domain]?.correct || 0) + (isCorrect ? 1 : 0),
                    total: (prev[domain]?.total || 0) + 1
                }
            }));
        }

        // Track Details for Readiness Engine
        // We can't know if they viewed the explanation yet (it happens AFTER this function).
        // So we just push the basic info here, and we'll need to UPDATE the last item in the array 
        // when they click "Next" or "Show Explanation". 
        // ACTUALLY: Easier to just save it to a temp state 'currentResult' and push to 'quizDetails' on handleNext.
        // But to keep diff small, I will push it now with 'explanationViewed: false', and we can ignore exact precision for now,
        // OR better: tracked via the separate 'explanationExpanded' state which we can read during 'saveQuizResults' if we stored the whole array in state?
        // Wait, 'quizDetails' is updated here.

        // REFACTOR: We need to push to quizDetails AFTER the question is finished (on handleNext), not on submit.
        // But existing logic pushes on submit. 
        // Let's modify handleNext to append the detail for the COMPLETED question.

        // Temporary fix: We will rely on 'explanationExpanded' being set during the review phase.
        // But 'quizDetails' is an array. We need to update the LAST item? 
        setShowExplanation(true);
        setExplanationRenderTime(Date.now()); // Start latency timer
        setExplanationExpanded(true); // Auto-expand for immediate learning reinforcement

        // GA4: Track explanation view
        trackExplanationViewed(currentQuestion.id, selectedExamId || '');
        setTutorBreakdown(null); // Reset breakdown

        // Always fetch tutor breakdown for learning reinforcement.
        // `?? -1` only ever fires for formats that carry no single selected
        // index (matching / pbq / multi-response), and those return early
        // inside fetchTutorBreakdownWithMode before the value is read.
        fetchTutorBreakdown(currentQuestion, selectedOption ?? -1);

        // Save Granular Question Progress (SRS)
        updateQuestionProgress(currentQuestion.id, isCorrect);

        // Usage event: core action (answer submitted), capped at 20/session
        const userId = auth.currentUser?.uid;
        const coreKey = 'ec_usage_core_count';
        const count = parseInt(sessionStorage.getItem(coreKey) || '0', 10);
        if (count < 20 && userId) {
            UsageEventService.emit(userId, 'coreAction', activeExamId);
            sessionStorage.setItem(coreKey, String(count + 1));
        }
    };

    const updateQuestionProgress = async (questionId: string, isCorrect: boolean) => {
        const user = auth.currentUser;
        if (!user) return;

        // PERSISTENCE: Save diagnostic progress if applicable
        // Unified Persistence: Save progress
        if (activeRunId) {
            try {
                if (selectedOption !== null) {
                    await QuizRunService.saveProgress(user.uid, activeRunId, {
                        questionId,
                        selectedOption: selectedOption,
                        isCorrect,
                        domain: currentQuestion?.domain
                    }, questions.length > currentQuestionIndex + 1 ? currentQuestionIndex + 1 : currentQuestionIndex);
                }
            } catch (e) {
                console.error("Failed to save quiz progress", e);
            }
        }

        const progressRef = doc(db, 'users', user.uid, 'questionProgress', questionId);

        try {
            const docSnap = await getDoc(progressRef);
            let currentConsecutive = 0;
            let existingData: any = null;

            if (docSnap.exists()) {
                existingData = docSnap.data();
                currentConsecutive = existingData.consecutiveCorrect || 0;
            }

            const newConsecutive = isCorrect ? currentConsecutive + 1 : 0;

            // ---- NEW MASTERY MODEL ----

            // Existing values from Firestore doc (if any)
            const oldTotalAttempts = existingData?.totalAttempts ?? 0;
            const oldCorrectCount = existingData?.correctCount ?? 0;
            const oldRecentAttempts = existingData?.recentAttempts ?? [];

            // Update counters
            const newTotalAttempts = oldTotalAttempts + 1;
            const newCorrectCount = oldCorrectCount + (isCorrect ? 1 : 0);

            // Maintain rolling window of last 3 attempts
            const newRecentAttempts = [...oldRecentAttempts, isCorrect].slice(-3);

            // Calculate accuracy
            const accuracy = newCorrectCount / newTotalAttempts;
            const recentCorrectCount = newRecentAttempts.filter(Boolean).length;

            // Determine mastery
            let newStatus = 'learning';

            if (
                newTotalAttempts >= 5 &&
                accuracy >= 0.75 &&
                recentCorrectCount >= 2
            ) {
                newStatus = 'mastered';
            }

            await setDoc(progressRef, {
                questionId,
                status: newStatus,
                consecutiveCorrect: newConsecutive,
                totalAttempts: newTotalAttempts,
                correctCount: newCorrectCount,
                recentAttempts: newRecentAttempts,
                lastAttempted: new Date(),
                examId: questions[currentQuestionIndex].examId || 'unknown',
                domain: questions[currentQuestionIndex].domain || 'General'
            }, { merge: true });

            console.log(`Updated progress for ${questionId}: ${newStatus} (attempts: ${newTotalAttempts}, accuracy: ${(accuracy * 100).toFixed(0)}%, recent: ${newRecentAttempts})`);

        } catch (error) {
            console.error("Error updating question progress:", error);
        }
    };

    const fetchTutorBreakdownWithMode = async (question: Question, selectedOptIdx: number, mode: CoachMode) => {
        // The callable's contract is a single correctAnswerIndex +
        // userSelectedOptionIndex. Formats that don't grade by a single index
        // (matching / pbq / multiple-response) have neither, and inventing one
        // would coach against the wrong answer. Same predicate ExplanationPanel
        // uses to hide the "Load Coach Breakdown" button, so the button can
        // never be offered for a request that returns here.
        if (!gradesBySingleIndex(question.type)) return;

        setLoadingBreakdown(true);
        lastBreakdownRef.current = { question, selectedOptIdx };

        // Stopwatch on the coach call. This sits directly on the post-answer
        // path, so its latency IS the "answer speed" a learner feels. The
        // callable is warm (minInstances:1) and reads a shared tutor_cache
        // first, but that cache held 86 entries against a key space of roughly
        // 17,000 (question x picked option x mode), so a miss — a full OpenAI
        // call — is the normal case. Recorded per answer so the hit/miss split
        // and the real spread are visible instead of assumed.
        const coachStart = Date.now();
        let coachOutcome: 'ok' | 'error' = 'ok';

        try {
            const examLensConfig = EXAM_LENS[activeExamId] || null;
            const generateFn = httpsCallable(functions, 'generateTutorBreakdown');
            const result = await generateFn({
                questionStem: question.stem,
                options: question.options,
                correctAnswerIndex: question.correctAnswer,
                userSelectedOptionIndex: selectedOptIdx,
                correctRationale: question.explanation,
                examDomain: question.domain,
                examId: activeExamId,
                coachMode: mode,
                lensName: examLensConfig?.lensName,
                lensFramework: examLensConfig?.framework,
            });
            setTutorBreakdown(result.data as TutorResponse);
            // Guided path (dashboard): the "read a Coach Breakdown" step
            localStorage.setItem('ec_breakdown_seen', '1');

            // Track Thinking Traps for Suggestion Engine
            const responseData = result.data as TutorResponse;
            if (responseData.pattern && responseData.pattern.pattern_id) {
                setSessionTraps(prev => {
                    const newMap = new Map(prev);
                    const pid = responseData.pattern!.pattern_id;
                    const existing = newMap.get(pid);

                    if (existing) {
                        newMap.set(pid, { ...existing, count: existing.count + 1 });
                    } else {
                        newMap.set(pid, { count: 1, pattern: responseData.pattern! });
                    }
                    console.log("Tracked Pattern Miss:", pid, newMap.get(pid)?.count);
                    return newMap;
                });
            }
        } catch (err) {
            coachOutcome = 'error';
            console.error("Failed to generate tutor breakdown:", err);
            // Fallback: Create a simple breakdown from the existing explanation
            setTutorBreakdown({
                verdict: "Coach is seemingly offline. Here is the standard explanation:",
                comparison: [{
                    optionIndex: question.correctAnswer ?? 0,
                    text: question.options?.[question.correctAnswer ?? 0] ?? '',
                    explanation: "Correct Answer" // Minimal placeholder
                }],
                examLens: question.explanation
            });
        } finally {
            setLoadingBreakdown(false);

            const uid = auth.currentUser?.uid;
            if (uid) {
                FrictionEventService.emit(uid, 'coach_timing', {
                    page: 'quiz',
                    examId: activeExamId,
                    coachMode: mode,
                    questionType: question.type,
                    outcome: coachOutcome,
                    // A cache hit is a single Firestore read inside the
                    // callable and lands well under a second; a miss is a full
                    // OpenAI completion. There is no flag on the response, so
                    // the duration is the only way to tell them apart — the
                    // split should be obvious once there are samples.
                    coachMs: Date.now() - coachStart,
                });
            }
        }
    };

    // Convenience wrapper that uses current coachMode state
    const fetchTutorBreakdown = (question: Question, selectedOptIdx: number) =>
        fetchTutorBreakdownWithMode(question, selectedOptIdx, coachMode);

    const [depthContent, setDepthContent] = useState<string | null>(null);
    const [depthLoading, setDepthLoading] = useState(false);

    const handleExpandDepth = async (type: 'simple' | 'memory') => {
        setDepthLoading(true);
        try {
            const generateFn = httpsCallable(functions, 'generateTutorDeepDive');
            const result = await generateFn({
                context: tutorBreakdown,
                style: type
            });
            // @ts-expect-error Callable result is narrowed by the deployed function contract.
            setDepthContent(result.data.content);
        } catch (err) {
            console.error("Failed to generate depth:", err);
            setDepthContent("Could not generate deep dive at this time.");
        } finally {
            setDepthLoading(false);
        }
    };

    const saveQuizResults = async (explicitDetails?: any[]) => {
        const user = auth.currentUser;
        if (!user) {
            console.error("No user logged in, cannot save results");
            return;
        }

        const userId = user.uid;
        // Don't re-derive activeExamId from question. Use the state variable which directed the fetch.
        // const activeExamId = questions[currentQuestionIndex]?.examId || 'default-exam';

        const masteryId = `${userId}_${activeExamId}`;
        const masteryRef = doc(db, 'userMastery', masteryId);

        // Prep Data for both specific persistence and legacy run completion
        const totalDuration = questionDurations.reduce((a, b) => a + b, 0);
        // Use the number of questions actually answered (details captured) as the total
        const rawDetails = explicitDetails || quizDetails;
        const finalDetails = rawDetails.filter((d: any) => d.selectedOption !== undefined);
        const answeredCount = finalDetails.length;

        // Derive domainResults from persisted answers[] (authoritative source)
        // Handles save & resume correctly — React state only tracks current session
        let derivedDomainResults = domainResults; // fallback if no activeRunId
        if (activeRunId) {
            try {
                const runDoc = await QuizRunService.getRunById(userId, activeRunId);
                if (runDoc) {
                    const persistedAnswers = (runDoc.answers || []).filter((a: any) => a.selectedOption !== undefined);
                    derivedDomainResults = deriveDomainResultsFromAnswers(persistedAnswers);
                }
            } catch (e) {
                console.warn('[saveQuizResults] Could not read persisted answers, using React state fallback:', e);
            }
        }

        try {
            const masteryDoc = await getDoc(masteryRef);
            let newMastery: Record<string, { correct: number; total: number }> = {};

            if (masteryDoc.exists()) {
                const currentData = masteryDoc.data();
                newMastery = { ...(currentData.masteryData || {}) };
            }

            Object.entries(derivedDomainResults).forEach(([domain, stats]) => {
                if (!newMastery[domain]) {
                    newMastery[domain] = { correct: 0, total: 0 };
                }
                newMastery[domain].correct += stats.correct;
                newMastery[domain].total += stats.total;
            });

            await setDoc(masteryRef, {
                userId,
                examId: activeExamId,
                masteryData: newMastery
            }, { merge: true });

            console.log('Mastery updated successfully');

            if (answeredCount === 0) return; // Don't save empty attempts

        } catch (error) {
            console.error("Error saving results:", error);
        }

        // Award XP
        // Base XP per question: 10
        // Bonus for score: score * 5
        const xpEarned = (questions.length * 10) + (score * 5);
        await XPService.awardXP(xpEarned, `Completed Quiz (${score}/${questions.length})`, activeExamId);

        // Update Subscription Context optimistically.
        //
        // finalDetails, not quizDetails. quizDetails is React state and is one
        // render behind at this point — the last answer is in explicitDetails,
        // which is exactly why finalDetails exists above. Counting the stale
        // array undercounted the daily quota by one question on every quiz, so
        // a free user got a free extra question per session, compounding.
        incrementDailyCount(finalDetails.length);

        // PERSISTENCE: Complete Diagnostic
        // PERSISTENCE: Complete Run
        if (activeRunId) {
            await QuizRunService.completeRun(userId, activeRunId, {
                score,
                domainResults: derivedDomainResults,
                timeSpent: totalDuration,
                averageTimePerQuestion: answeredCount > 0 ? totalDuration / answeredCount : 0,
                mode: location.state?.mode || 'standard'
            });
        }

        // Usage event: diagnostic completion
        if ((location.state?.mode || 'standard') === 'diagnostic' && userId) {
            UsageEventService.emit(userId, 'completion', activeExamId);
        }
    };

    const triggerSmartQuizReview = async (isPartial: boolean) => {
        const mode = location.state?.mode;
        // Only trigger for smart-family modes (smart, weakest, standard/undefined)
        if (mode === 'diagnostic' || mode === 'trap') return;

        // Open modal via app-level context (survives route changes)
        smartReview.openReview({ isPartial, isPro: hasContentAccess });

        // Free users: locked modal, no OpenAI call
        if (!hasContentAccess) return;

        try {
            const answeredCount = quizDetails.length;
            const total = isPartial ? answeredCount : questions.length;
            const percent = total > 0 ? Math.round((score / total) * 100) : 0;

            // Derive weakest domain from domainResults
            let weakest_domain: string = examDomains[0] || 'Process';
            let worstAccuracy = Infinity;
            for (const [domain, stats] of Object.entries(domainResults)) {
                if (stats.total > 0) {
                    const acc = stats.correct / stats.total;
                    if (acc < worstAccuracy) {
                        worstAccuracy = acc;
                        weakest_domain = domain;
                    }
                }
            }

            // Derive thinking traps summary
            const traps = Array.from(sessionTraps.values());
            const trapNames = traps.filter(t => t.count >= 1).map(t => t.pattern.pattern_name);
            const thinking_traps = trapNames.length > 0 ? trapNames.join(', ') : '';

            const generateReview = httpsCallable(functions, 'generateSmartQuizReview');
            const result = await generateReview({
                total,
                correct: score,
                percent,
                weakest_domain,
                thinking_traps
            });

            const data = result.data as { reviewText: string };
            smartReview.setReviewText(data.reviewText);
        } catch (error) {
            console.error('Failed to generate smart quiz review:', error);
            smartReview.setLoading(false);
        }
    };

    const handleNext = async () => {
        // Save details for the JUST FINISHED question
        const currentQuestion = questions[currentQuestionIndex];
        const isMultiResponse = currentQuestion.type === 'multi-response';
        const isCorrect = gradeCurrentQuestion(currentQuestion);

        setQuizDetails(prev => [...prev, {
            questionId: currentQuestion.id,
            selectedOption,
            // A multiple-response item has no single correct index. `null` is
            // the honest value; the whole key goes in correctOptions alongside.
            // Nothing reads these two fields today (the results view derives
            // everything from isCorrect + domain) — they are recorded so the
            // stored detail is a truthful record of the answer, not because a
            // consumer is currently broken without them.
            correctOption: isMultiResponse ? null : currentQuestion.correctAnswer,
            ...(isMultiResponse ? { selectedOptions: multiSelected, correctOptions: currentQuestion.correctAnswers ?? [] } : {}),
            isCorrect,
            domain: currentQuestion.domain,
            explanationViewed: explanationExpanded,
            actionLatency: explanationRenderTime ? (Date.now() - explanationRenderTime) / 1000 : null, // Metric: Time to Next
        }]);

        // PERSISTENCE: Save Progress
        if (activeRunId && auth.currentUser) {
            try {
                await QuizRunService.saveProgress(
                    auth.currentUser.uid,
                    activeRunId,
                    {
                        questionId: currentQuestion.id,
                        // NO_SINGLE_INDEX (-1) for formats that have no single
                        // chosen option — matching, pbq, multi-response. It is a
                        // sentinel, not an option index: every consumer of this
                        // field only asks `!== undefined` ("was this answered?"),
                        // which -1 correctly answers yes to. See the field doc on
                        // QuizRun.answers in QuizRunService.ts.
                        selectedOption: selectedOption !== null ? selectedOption : NO_SINGLE_INDEX,
                        // For multi-response, the real answer is the tick set —
                        // persist it so the record isn't just the sentinel.
                        ...(isMultiResponse ? { selectedOptions: multiSelected } : {}),
                        isCorrect: isCorrect,
                        domain: currentQuestion.domain
                    },
                    currentQuestionIndex + 1 // Next Index to resume from
                );
            } catch (e) {
                console.error("Failed to save progress", e);
            }
        }

        // GA4: Track activated_user on 10th question answered (0-indexed: index 9)
        // Deduplication handled inside trackActivatedUser via localStorage
        if (currentQuestionIndex === 9) {
            const uid = auth.currentUser?.uid || '';
            trackActivatedUser(selectedExamId || '', uid);
            // Surface the testimonial prompt via App-level host (so it
            // survives end-of-quiz navigation to /results). Skip if user
            // already responded once.
            if (uid && !localStorage.getItem(`ec_testimonial_prompted_${uid}`)) {
                localStorage.setItem(
                    `ec_testimonial_pending_${uid}`,
                    JSON.stringify({ examId: selectedExamId || '', examName: examName || 'this exam' })
                );
                window.dispatchEvent(new Event('ec-testimonial-pending'));
            }
        }

        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
            setSelectedOption(null);
            setShowExplanation(false);
            setExplanationExpanded(false);
            setTutorBreakdown(null);
            setDepthContent(null);
            setMatchingState(null); // Reset for next question (initialized via effect)
            setMultiSelected([]);   // Reset multiple-response ticks
        } else {
            // End of quiz. We need to save this last question's details immediately before saving results.
            // But state updates are async. 
            // So we'll construct the final details array manually for the save function.
            const finalDetails = [...quizDetails, {
                questionId: currentQuestion.id,
                selectedOption,
                correctOption: isMultiResponse ? null : currentQuestion.correctAnswer,
                ...(isMultiResponse ? { selectedOptions: multiSelected, correctOptions: currentQuestion.correctAnswers ?? [] } : {}),
                isCorrect,
                domain: currentQuestion.domain,
                explanationViewed: explanationExpanded,
                actionLatency: explanationRenderTime ? (Date.now() - explanationRenderTime) / 1000 : null
            }];

            await saveQuizResults(finalDetails);
            triggerSmartQuizReview(false);

            // Re-enable Thinking Traps display after quiz completion
            localStorage.removeItem('exam_coach_traps_suppressed');

            // Trap drill completion telemetry
            if (location.state?.mode === 'trap-drill' && auth.currentUser) {
                const drillAccuracy = Math.round((score / questions.length) * 100);
                UsageEventService.emit(auth.currentUser.uid, 'trap_drill_completed', activeExamId, {
                    patternId: location.state.patternId,
                    score: drillAccuracy,
                });
            }

            setQuizCompleted(true);
        }
    };

    // Populate quiz report store so Sidebar's "Report a Problem" can attach context
    useEffect(() => {
        if (!loading && !quizCompleted && questions.length > 0) {
            quizReportStore.set({
                source: 'quiz',
                questionId: questions[currentQuestionIndex]?.id,
                quizType,
                examId: activeExamId || undefined,
            });
        }
        return () => { quizReportStore.clear(); };
    }, [loading, quizCompleted, currentQuestionIndex, quizType, activeExamId, questions]);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading quiz...</div>;
    }

    if (validationError) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="bg-slate-900/50 backdrop-blur-md p-4 sm:p-8 rounded-2xl shadow-2xl shadow-black/20 text-center max-w-md w-full border border-slate-700">
                    <p className="text-slate-300 text-base sm:text-lg mb-4">{validationError}</p>
                    <button
                        onClick={() => { setValidationError(null); setLoading(true); setRetryCount(c => c + 1); }}
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (questions.length === 0) {
        // Reached only if the exam bank is genuinely empty (the loader now falls
        // back to the full bank when a filter matches nothing). Give the learner
        // a way out instead of an admin-facing dead end.
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="bg-slate-900/50 backdrop-blur-md p-8 rounded-2xl border border-slate-700 text-center max-w-md w-full">
                    <p className="text-slate-200 text-lg font-semibold mb-2">No questions available for this exam yet.</p>
                    <p className="text-slate-400 text-sm mb-6">We’re still building this question bank. Try another exam in the meantime.</p>
                    <button
                        onClick={() => navigate('/app')}
                        className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg font-bold transition-colors"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    if (quizCompleted) {
        return (
            <QuizCompletionSummary
                score={score}
                totalQuestions={questions.length}
                sessionTraps={sessionTraps}
                domainResults={domainResults}
                isPro={hasContentAccess}
                activeExamId={activeExamId}
                onUpsell={() => setShowUpsell(true)}
            />
        );
    }

    const currentQuestion = questions[currentQuestionIndex];

    return (
        <div className="min-h-screen flex flex-col">
            {/* Header */}
            <header className="bg-slate-800/50 backdrop-blur-md border-b border-slate-700 px-4 py-4 sticky top-0 z-50">
                <div className="mx-auto max-w-4xl flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        {quizType === 'diagnostic' ? (
                            <button
                                onClick={async () => {
                                    if (window.confirm("Exit Diagnostic? Your progress will not be saved.")) {
                                        const uid = auth.currentUser!.uid;
                                        FrictionEventService.emit(uid, 'quiz_abandon', { quizType: 'diagnostic', examId: activeExamId, questionIndex: currentQuestionIndex, totalQuestions: questions.length });
                                        if (activeRunId) {
                                            const { QuizRunService } = await import('../services/QuizRunService');
                                            await QuizRunService.completeRun(uid, activeRunId, {
                                                abort: true,
                                                score: score
                                            });
                                        }
                                        navigate('/app');
                                    }
                                }}
                                className="text-slate-400 hover:text-red-400 transition-colors flex items-center gap-2 group"
                            >
                                <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                <span className="hidden sm:inline text-sm font-medium">Exit Diagnostic</span>
                            </button>
                        ) : (
                            <button
                                onClick={async () => {
                                    if (window.confirm("Quit and save your progress so far?")) {
                                        if (auth.currentUser) FrictionEventService.emit(auth.currentUser.uid, 'quiz_abandon', { quizType: quizType || 'standard', examId: activeExamId, questionIndex: currentQuestionIndex, totalQuestions: questions.length });
                                        triggerSmartQuizReview(true);
                                        if (activeRunId) {
                                            // Unified Mode: Pause — navigate (modal survives in App.tsx)
                                            navigate('/app');
                                        } else {
                                            // Legacy Mode: Submit immediately
                                            // BUG FIX: If user has SUBMITTED the current question (showExplanation is true),
                                            // but not yet clicked NEXT, we need to include this question's details.
                                            let finalDetails = quizDetails;

                                            if (showExplanation) {
                                                const currentQuestion = questions[currentQuestionIndex];
                                                const isMultiResponse = currentQuestion.type === 'multi-response';
                                                const isCorrect = gradeCurrentQuestion(currentQuestion);

                                                const isPbqOrMatching = currentQuestion.type === 'matching' || currentQuestion.type === 'pbq';
                                                const noSingleIndex = isPbqOrMatching || isMultiResponse;
                                                finalDetails = [...quizDetails, {
                                                    questionId: currentQuestion.id,
                                                    selectedOption: noSingleIndex ? null : selectedOption,
                                                    correctOption: noSingleIndex ? null : currentQuestion.correctAnswer,
                                                    ...(isMultiResponse ? { selectedOptions: multiSelected, correctOptions: currentQuestion.correctAnswers ?? [] } : {}),
                                                    isCorrect,
                                                    domain: currentQuestion.domain,
                                                    explanationViewed: explanationExpanded,
                                                    actionLatency: explanationRenderTime ? (Date.now() - explanationRenderTime) / 1000 : null
                                                }];
                                            }

                                            await saveQuizResults(finalDetails);
                                            // Re-enable Thinking Traps display after quiz completion
                                            localStorage.removeItem('exam_coach_traps_suppressed');
                                            setQuizCompleted(true);
                                        }
                                    }
                                }}
                                className="text-slate-400 hover:text-white transition-colors flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                <span className="hidden sm:inline text-sm font-medium">Quit & Save</span>
                            </button>
                        )}
                        <div className="h-6 w-px bg-slate-700"></div>
                        <span className="text-sm font-medium text-slate-400 font-display">{currentQuestion.domain}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <StudyThemeToggle theme={studyTheme} onToggle={toggleStudyTheme} />
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-brand-400">Q{currentQuestionIndex + 1}</span>
                            <span className="text-sm text-slate-500">/ {questions.length}</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Progress Bar */}
            <div className="h-1 bg-slate-800 w-full">
                <div
                    className="h-full bg-brand-500 shadow-[0_0_10px_rgba(99,102,241,0.5)] transition-all duration-500"
                    style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                ></div>
            </div>

            {/* Main Content */}
            <main className="flex-1 flex flex-col items-center justify-center p-4">
                {/* Mode Info Header */}
                <QuizModeBanner quizType={quizType} />

                <div className="w-full max-w-3xl mb-4">
                    <QuestionProvenanceBadge />
                </div>

                {/* Active filter pill — surfaces domain / Bloom focused drill and fallback banner */}
                <ActiveFilterPill filters={activeFilters} />

                <div className="w-full max-w-3xl">
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl shadow-black/20 border border-slate-700 overflow-hidden max-w-full">

                        {/* AI Scenario Image */}
                        {currentQuestion.imageUrl && (
                            <div className="w-full h-32 sm:h-48 md:h-64 bg-slate-900 relative overflow-hidden group">
                                <img
                                    src={currentQuestion.imageUrl}
                                    alt="Scenario Visualization"
                                    className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-700 group-hover:scale-105 transform"
                                />
                                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10">
                                    <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1">
                                        <svg className="w-3 h-3 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                                        AI Scene
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Pre-Quiz Reinforcement Banner (Only on Q1) */}
                        {reinforcementMessage && currentQuestionIndex === 0 && (
                            <div className="px-4 sm:px-8 pt-6 pb-0 animate-in slide-in-from-top-2 duration-700">
                                <p className="text-slate-500 text-xs italic text-center">
                                    {reinforcementMessage}
                                </p>
                            </div>
                        )}

                        <div className="p-4 sm:p-6 md:p-10">
                            {questionProgressMap.has(currentQuestion.id) && (
                                <p className="text-xs text-slate-500 mb-2 tracking-wide uppercase">Mastery check</p>
                            )}
                            <h2 className="text-xl md:text-2xl font-medium text-white leading-relaxed mb-8 font-display">
                                {currentQuestion.stem}
                            </h2>

                            {/* EC-119: Matching questions use drag-and-drop, MCQ uses radio options */}
                            {/* PBQ: Performance-based questions */}
                            {currentQuestion.type === 'pbq' && currentQuestion.pbqConfig && pbqState ? (
                                <PBQQuestion
                                    config={currentQuestion.pbqConfig}
                                    state={pbqState}
                                    locked={showExplanation}
                                    onChange={setPbqState}
                                />
                            ) : currentQuestion.type === 'matching' && currentQuestion.matchPairs && matchingState ? (
                                <MatchingQuestion
                                    pairs={currentQuestion.matchPairs}
                                    locked={showExplanation}
                                    correctOrder={matchingState.correctOrder}
                                    shuffledDefinitions={matchingState.shuffledDefinitions}
                                    currentOrder={matchingState.currentOrder}
                                    onReorder={(newOrder) => setMatchingState(prev => prev ? { ...prev, currentOrder: newOrder } : prev)}
                                />
                            ) : (
                            <AnswerOptions
                                options={currentQuestion.options || []}
                                selectedOption={selectedOption}
                                correctAnswer={currentQuestion.correctAnswer}
                                showExplanation={showExplanation}
                                onSelect={handleOptionSelect}
                                // Multiple-response renders checkboxes; `multi`
                                // is false for every other type, so single-select
                                // MCQ renders exactly as before.
                                multi={currentQuestion.type === 'multi-response'}
                                selectedOptions={multiSelected}
                                correctAnswers={currentQuestion.correctAnswers}
                            />
                            )}

                            {showExplanation && explanationExpanded && (
                                <ExplanationPanel
                                    question={currentQuestion}
                                    activeExamId={activeExamId}
                                    tutorBreakdown={tutorBreakdown}
                                    loadingBreakdown={loadingBreakdown}
                                    depthContent={depthContent}
                                    depthLoading={depthLoading}
                                    coachMode={coachMode}
                                    onCoachModeChange={handleCoachModeChange}
                                    onExpandDepth={handleExpandDepth}
                                    onLoadBreakdown={() => fetchTutorBreakdown(currentQuestion, selectedOption ?? -1)}
                                />
                            )}
                        </div>

                        <div className="bg-slate-900/30 px-4 sm:px-8 py-4 border-t border-slate-700/50 flex justify-end">
                            {!showExplanation ? (
                                <button
                                    onClick={handleSubmit}
                                    disabled={currentQuestion.type === 'pbq' ? !pbqState : currentQuestion.type === 'matching' ? !matchingState : currentQuestion.type === 'multi-response' ? !canSubmitMultiResponse(multiSelected) : selectedOption === null}
                                    className="w-full sm:w-auto bg-brand-600 text-white px-8 py-3 rounded-xl font-medium shadow-lg shadow-brand-500/30 hover:bg-brand-500 hover:shadow-brand-500/40 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                >
                                    {currentQuestion.type === 'pbq' ? 'Submit PBQ' : currentQuestion.type === 'matching' ? 'Check Matches' : currentQuestion.type === 'multi-response' ? 'Submit Answers' : 'Submit Answer'}
                                </button>
                            ) : (
                                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto">
                                    <button
                                        onClick={() => setExplanationExpanded(!explanationExpanded)}
                                        className="w-full sm:w-auto bg-blue-600/20 text-blue-300 border border-blue-500/30 px-6 py-3 rounded-xl font-medium hover:bg-blue-600/30 transition-all"
                                    >
                                        {explanationExpanded ? 'Hide Explanation' : 'Show Explanation'}
                                    </button>
                                    <button
                                        onClick={handleNext}
                                        className="w-full sm:w-auto bg-brand-600 text-white px-8 py-3 rounded-xl font-medium shadow-lg shadow-brand-500/30 hover:bg-brand-500 hover:shadow-brand-500/40 transition-all transform hover:-translate-y-0.5"
                                    >
                                        {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
            <footer className="py-6 text-center text-xs text-slate-600">
                {examName} Bank v{bankVersion}
            </footer>

            <SubscriptionUpsellModal
                isOpen={showUpsell}
                onClose={() => window.location.href = '/app'}
                reason="daily_limit"
                passCoversExamName={
                    passEntitlement && passEntitlement.expiresAt.getTime() > Date.now() && passEntitlement.examId !== activeExamId
                        ? (EXAMS[passEntitlement.examId]?.name ?? 'your exam')
                        : undefined
                }
            />
        </div>
    );
}

