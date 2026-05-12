import { Link, useParams, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';
import TutorBreakdown, { type TutorResponse, type CoachMode } from '../components/TutorBreakdown';
import type { PatternData } from '../components/PatternInsightCard';
import { doc, setDoc, getDoc, collection, query, getDocs, where } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { XPService } from '../services/xpService';
import { useSubscription } from '../contexts/SubscriptionContext';
import SubscriptionUpsellModal from '../components/SubscriptionUpsellModal';
import { useExam } from '../contexts/ExamContext';
import { SmartQuizService } from '../services/smartQuiz';
import { useMarketingCopy } from '../hooks/useMarketingCopy';
import { QuizRunService, deriveDomainResultsFromAnswers } from '../services/QuizRunService';
import { UsageEventService } from '../services/UsageEventService';
import { ChevronDown, ChevronUp, Brain } from 'lucide-react';
import { useSmartQuizReview } from '../contexts/SmartQuizReviewContext';
import QuestionProvenanceBadge from '../components/QuestionProvenanceBadge';
import { quizReportStore } from '../utils/quizReportStore';
import StructuredExplanation from '../components/explanations/StructuredExplanation';
import EmvCalculation from '../components/explanations/EmvCalculation';
import MatchingQuestion, { shuffleMatchPairs } from '../components/MatchingQuestion';
import PBQQuestion, { initPBQState, isPBQCorrect, type PBQConfig, type PBQState } from '../components/PBQQuestion';
import { DOMAIN_CITATIONS, EXAM_REFERENCES } from '../utils/domainCitations';
import { FrictionEventService } from '../services/FrictionEventService';
import { trackExplanationViewed, trackActivatedUser } from '../lib/ga4';
import { DEFAULT_EXAM_ID, EXAM_LENS } from '../config/exams';
import { BLOOM_LEVELS, BLOOM_DESCRIPTIONS, type BloomLevel } from '../types/Bloom';

interface MatchPairData {
    term: string;
    definition: string;
}

interface Question {
    id: string;
    stem: string;
    options?: string[];
    correctAnswer?: number;
    explanation: string;
    domain: string;
    examId?: string;
    imageUrl?: string; // New field for AI image
    difficulty?: number; // 1-10
    bloomLevel?: BloomLevel; // Bloom's Taxonomy cognitive level
    type?: 'mcq' | 'emv' | 'matching' | 'pbq';
    scenarios?: {
        label: string;
        probability: number;
        impact: number;
    }[];
    correctLabel?: string;
    matchPairs?: MatchPairData[]; // EC-119: drag-and-drop matching pairs
    pbqConfig?: PBQConfig;        // PBQ: performance-based question config
}

export default function Quiz() {
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
    const [showMasteryInfo, setShowMasteryInfo] = useState(false);
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

    // Smart Quiz Review (app-level context)
    const smartReview = useSmartQuizReview();

    // Diagnostic Persistence State -> MOVED to below line 77 to access 'location'


    const { isPro, canTakeQuiz, incrementDailyCount } = useSubscription();
    const [showUpsell, setShowUpsell] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);
    const copy = useMarketingCopy();

    // Measurement Metrics
    const [explanationRenderTime, setExplanationRenderTime] = useState<number | null>(null);

    // Block access immediately if limit reached via direct URL, but handle graceful redirect/modal
    useEffect(() => {
        if (!loading && !canTakeQuiz) {
            setShowUpsell(true);
        }
    }, [loading, canTakeQuiz]);



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
        const fetchSmartQuestions = async () => {
            // Wait for ExamContext to finish resolving before creating diagnostic runs.
            // This ensures activeExamId is the fully-resolved exam ID and examDomains
            // are populated for domain-balanced question selection.
            if (!activeExamId || examContextLoading) return;

            try {
                const user = auth.currentUser;
                if (!user) return;

                // Server-side daily quiz quota validation (fail-closed)
                let validationData: { allowed: boolean; reason?: string };
                try {
                    const validateQuizStartFn = httpsCallable(functions, 'validateQuizStart');
                    const validationResult = await validateQuizStartFn({});
                    validationData = validationResult.data as { allowed: boolean; reason?: string };
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
                        isPro ? 7 : 5,
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

                    const fetchedQs: Question[] = [];
                    for (const id of trapIds) {
                        const docRef = doc(db, 'questions', id);
                        const d = await getDoc(docRef);
                        if (d.exists()) {
                            const data = d.data();
                            fetchedQs.push({
                                id: d.id,
                                ...data,
                                difficulty: data.difficulty
                            } as Question);
                        }
                    }
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

                    const fetchedQs: Question[] = [];
                    for (const id of drillIds) {
                        const docRef = doc(db, 'questions', id);
                        const d = await getDoc(docRef);
                        if (d.exists()) {
                            const data = d.data();
                            fetchedQs.push({
                                id: d.id,
                                ...data,
                                difficulty: data.difficulty
                            } as Question);
                        }
                    }
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
                        const fetchedQs: Question[] = [];
                        for (const id of run.snapshot.questionIds) {
                            const docRef = doc(db, 'questions', id);
                            const d = await getDoc(docRef);
                            if (d.exists()) {
                                fetchedQs.push({ id: d.id, ...d.data() } as Question);
                            }
                        }
                        setQuestions(fetchedQs);
                        if (run.snapshot.currentQuestionIndex !== undefined) {
                            setCurrentQuestionIndex(run.snapshot.currentQuestionIndex);
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

                    const fetchedQs: Question[] = [];
                    for (const id of diagIds) {
                        const docRef = doc(db, 'questions', id);
                        const d = await getDoc(docRef);
                        if (d.exists()) {
                            fetchedQs.push({ id: d.id, ...d.data() } as Question);
                        }
                    }
                    setQuestions(fetchedQs);
                    setLoading(false);
                    return;
                }

                // Check for Smart Quiz (passed via state)
                const stateIds = location.state?.questionIds as string[] | undefined;
                if (stateIds && stateIds.length > 0) {
                    console.log("Loading specific Smart Quiz questions:", stateIds);
                    const fetchedQs: Question[] = [];
                    for (const id of stateIds) {
                        // Note: In a real app, use where('documentId', 'in', [...]) for better performance if < 30 items
                        const docRef = doc(db, 'questions', id);
                        const d = await getDoc(docRef);
                        if (d.exists()) {
                            fetchedQs.push({ id: d.id, ...d.data() } as Question);
                        }
                    }
                    setQuestions(fetchedQs);
                    setLoading(false);
                    return;
                }

                // 1. Fetch questions (optionally filtered by domain and/or Bloom level)
                const questionsRef = collection(db, 'questions');
                let constraints: any[] = [where('examId', '==', activeExamId)];

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

                // Surface active filters to the UI (pill + fallback banner)
                setActiveFilters({
                    domain: filterDomain,
                    bloomLevel: bloomFallbackApplied ? undefined : filterBloomLevel,
                    bloomFallback: bloomFallbackApplied,
                });

                if (allQuestions.length === 0) {
                    setQuestions([]);
                    setLoading(false);
                    return;
                }

                // 2. Fetch User's Progress for these questions
                const progressRef = collection(db, 'users', user.uid, 'questionProgress');
                const progressSnap = await getDocs(progressRef);
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

                const TARGET_SIZE = isPro ? 10 : 5;
                let selected: Question[] = [];
                const selectedIds = new Set<string>();
                const shuffle = (arr: any[]) => arr.sort(() => 0.5 - Math.random());

                if (!filterDomain && examDomains && examDomains.length >= 2) {
                    // --- Adaptive multi-domain distribution ---
                    const masterySnap = await getDoc(doc(db, 'userMastery', `${user.uid}_${activeExamId}`));
                    const mData = masterySnap.exists() ? masterySnap.data()?.masteryData || {} : {};

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
                    } catch (e) {
                        console.error("Failed to create start run persistence", e);
                    }
                }

            } catch (error) {
                console.error("Error fetching smart questions:", error);
                const uid = auth.currentUser?.uid;
                if (uid) FrictionEventService.emit(uid, 'error_shown', { page: 'quiz', examId: activeExamId, errorMessage: String(error) });
            } finally {
                setLoading(false);
                // EC-130: Log slow loads (> 5s)
                const loadMs = Date.now() - loadStartRef.current;
                if (loadMs > 5000 && auth.currentUser) {
                    FrictionEventService.emit(auth.currentUser.uid, 'slow_load', { page: 'quiz', examId: activeExamId, loadTimeMs: loadMs });
                }
            }
        };

        fetchSmartQuestions();
    }, [activeExamId, examContextLoading, retryCount]);

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
    }, [currentQuestionIndex, questions]);

    const handleOptionSelect = (index: number) => {
        if (showExplanation) return;
        setSelectedOption(index);
    };

    const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
    const [questionDurations, setQuestionDurations] = useState<number[]>([]);

    useEffect(() => {
        setQuestionStartTime(Date.now());
    }, [currentQuestionIndex, loading]);

    const handleSubmit = () => {
        const currentQuestion = questions[currentQuestionIndex];

        // EC-119: Matching questions use matchingState instead of selectedOption
        const isMatching = currentQuestion.type === 'matching' && matchingState;
        const isPBQ = currentQuestion.type === 'pbq' && pbqState && currentQuestion.pbqConfig;
        if (!isMatching && !isPBQ && selectedOption === null) return;

        const endTime = Date.now();
        const duration = (endTime - questionStartTime) / 1000; // in seconds
        setQuestionDurations([...questionDurations, duration]);

        const isCorrect = isPBQ
            ? isPBQCorrect(currentQuestion.pbqConfig!, pbqState!)
            : isMatching
            ? matchingState!.currentOrder.every((v, i) => v === matchingState!.correctOrder[i])
            : selectedOption === currentQuestion.correctAnswer;

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

        // Always fetch tutor breakdown for learning reinforcement
        fetchTutorBreakdown(currentQuestion, selectedOption!);

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
        // Matching / PBQ questions don't use the tutor breakdown flow
        if (question.type === 'matching' || question.type === 'pbq') return;

        setLoadingBreakdown(true);
        lastBreakdownRef.current = { question, selectedOptIdx };
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
            // @ts-ignore
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

        // Update Subscription Context optimistically
        incrementDailyCount(quizDetails.length);

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
        smartReview.openReview({ isPartial, isPro });

        // Free users: locked modal, no OpenAI call
        if (!isPro) return;

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
        const isCorrect = currentQuestion.type === 'pbq' && pbqState && currentQuestion.pbqConfig
            ? isPBQCorrect(currentQuestion.pbqConfig, pbqState)
            : currentQuestion.type === 'matching' && matchingState
            ? matchingState.currentOrder.every((v, i) => v === matchingState.correctOrder[i])
            : selectedOption === currentQuestion.correctAnswer;

        setQuizDetails(prev => [...prev, {
            questionId: currentQuestion.id,
            selectedOption,
            correctOption: currentQuestion.correctAnswer,
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
                        selectedOption: selectedOption !== null ? selectedOption : -1, // -1 for skip if allowed? Assuming selectedOption is required by UI
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
        } else {
            // End of quiz. We need to save this last question's details immediately before saving results.
            // But state updates are async. 
            // So we'll construct the final details array manually for the save function.
            const finalDetails = [...quizDetails, {
                questionId: currentQuestion.id,
                selectedOption,
                correctOption: currentQuestion.correctAnswer,
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
        return <div className="min-h-screen flex items-center justify-center">No questions found. Please add some in the Admin CMS.</div>;
    }

    if (quizCompleted) {
        // DIAGNOSTIC SUMMARY (First Session Reveal)
        if (location.state?.mode === 'diagnostic') {
            const traps = Array.from(sessionTraps.values());
            const topTrap = traps.length > 0 ? traps.sort((a, b) => b.count - a.count)[0] : null;

            // Derive weakest domain for display
            let weakestDomain: string | null = null;
            let worstAcc = Infinity;
            for (const [domain, stats] of Object.entries(domainResults)) {
                if (stats.total > 0) {
                    const acc = stats.correct / stats.total;
                    if (acc < worstAcc) {
                        worstAcc = acc;
                        weakestDomain = domain;
                    }
                }
            }

            return (
                <div className="min-h-screen flex items-center justify-center bg-slate-950">
                    <div className="bg-slate-900/50 backdrop-blur-md p-4 sm:p-8 rounded-2xl shadow-2xl shadow-black/20 text-center max-w-md w-full border border-slate-700 animate-in fade-in zoom-in duration-500 max-h-[90vh] overflow-y-auto">

                        <div className="mb-6">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-indigo-500/20">
                                <span className="text-3xl sm:text-4xl">🔎</span>
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-bold text-white font-display mb-2">Analysis Complete. Here’s what I found.</h2>
                            <p className="text-slate-400">I've mapped your baseline strengths and blind spots.</p>
                        </div>

                        {/* REVEAL LOGIC */}
                        {topTrap ? (
                            <div className="bg-gradient-to-br from-indigo-900/40 to-slate-800 border border-indigo-500/30 rounded-xl p-6 mb-8 text-left relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none"></div>
                                <h3 className="text-indigo-300 font-bold uppercase tracking-wider text-xs mb-2">Insight Detected</h3>
                                <p className="text-white text-lg font-medium leading-relaxed mb-4">
                                    "You just encountered a common PMI Thinking Trap: <strong className="text-indigo-400">{topTrap.pattern.pattern_name}</strong>."
                                </p>
                                <p className="text-slate-400 text-sm italic border-l-2 border-indigo-500/30 pl-3">
                                    {topTrap.pattern.core_rule}
                                </p>
                            </div>
                        ) : (
                            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-8">
                                <h3 className="text-slate-300 font-bold mb-2">Analysis</h3>
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    "As you practice, the system learns exactly how PMI patterns affect your answers. Keep going to unlock deeper insights."
                                </p>
                            </div>
                        )}

                        <div className="text-left mb-6">
                            <h4 className="text-slate-300 font-semibold text-sm mb-2">What this analysis means</h4>
                            <p className="text-slate-400 text-sm leading-relaxed mb-2">
                                This was not a pass/fail test. It was a short diagnostic designed to help us understand how you think and where you'll benefit most from practice.
                            </p>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Based on your responses, we'll guide you toward your weakest domain so you can focus your time where it matters most.
                            </p>
                            {weakestDomain && (
                                <p className="text-slate-300 text-sm leading-relaxed mt-2">
                                    Based on your responses so far, your weakest domain appears to be <strong className="text-white">{weakestDomain}</strong>. That's where focused practice is likely to give you the fastest improvement.
                                </p>
                            )}
                            {topTrap && (
                                <p className="text-slate-400 text-sm leading-relaxed mt-2">
                                    We also noticed a recurring pattern related to <strong className="text-slate-300">{topTrap.pattern.pattern_name}</strong>. You may see questions designed to challenge this area as you continue — this helps strengthen real-world decision-making.
                                </p>
                            )}
                        </div>

                        {/* Mastery Explanation Disclosure */}
                        <div className="mb-6 text-left">
                            <button
                                onClick={() => setShowMasteryInfo(!showMasteryInfo)}
                                className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-300 transition-colors mx-auto"
                            >
                                <span>Why you may see repeated questions</span>
                                {showMasteryInfo ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                            {showMasteryInfo && (
                                <div className="mt-3 bg-slate-700/30 border border-slate-600 rounded-xl p-5 text-sm text-slate-400 space-y-4">
                                    <div>
                                        <h4 className="font-semibold text-slate-300 mb-1">How mastery works</h4>
                                        <p>CipherExam confirms understanding by requiring correct answers more than once. This prevents progress through guessing and mirrors how the PMP exam tests consistency across scenarios.</p>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-300 mb-1">About the questions</h4>
                                        <p>All questions are original and written to PMP standards. They are modeled on real exam patterns and domains — not copied from actual PMP exam questions.</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-3">
                            {topTrap ? (
                                <button
                                    onClick={() => {
                                        if (isPro) {
                                            navigate('/app/quiz', {
                                                state: {
                                                    mode: 'trap',
                                                    patternId: topTrap.pattern.pattern_id,
                                                    patternName: topTrap.pattern.pattern_name,
                                                    domainTags: topTrap.pattern.domain_tags,
                                                    masteryScore: 0 // Reset for practice
                                                }
                                            });
                                        } else {
                                            setShowUpsell(true);
                                        }
                                    }}
                                    className="w-full bg-indigo-600 text-white px-6 py-3.5 rounded-xl font-bold hover:bg-indigo-500 shadow-lg shadow-indigo-500/30 transition-all"
                                >
                                    {isPro ? `[ Practice This Trap ]` : `[ ${copy.pro_value_primary} ]`}
                                </button>
                            ) : (
                                <button
                                    onClick={() => navigate('/app/planner', {
                                        state: {
                                            source: 'diagnostic',
                                            recommendedDomain: weakestDomain
                                        }
                                    })}
                                    className="w-full bg-brand-600 text-white px-6 py-3.5 rounded-xl font-bold hover:bg-brand-500 shadow-lg shadow-brand-500/30 transition-all"
                                >
                                    Continue to Your Study Plan
                                </button>
                            )}

                            {topTrap && (
                                <button
                                    onClick={() => navigate('/app/planner', {
                                        state: {
                                            source: 'diagnostic',
                                            recommendedDomain: weakestDomain
                                        }
                                    })}
                                    className="block text-slate-500 hover:text-white text-sm font-medium py-2 w-full"
                                >
                                    Continue to Your Study Plan
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            );
        }

        // TRAP DRILL SUMMARY
        if (location.state?.mode === 'trap-drill') {
            const accuracy = (score / questions.length) * 100;
            const trapName = location.state.patternName || "Thinking Trap";

            return (
                <div className="min-h-screen flex items-center justify-center bg-slate-950">
                    <div className="bg-slate-900/50 backdrop-blur-md p-8 rounded-2xl shadow-2xl shadow-black/20 text-center max-w-md w-full border border-slate-700">
                        <div className="w-16 h-16 bg-brand-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-brand-500/20">
                            {accuracy >= 70 ? '🎯' : '🔧'}
                        </div>

                        <h2 className="text-2xl font-bold text-white mb-1 font-display">Trap Practice Complete</h2>
                        <p className="text-slate-400 text-sm mb-6">Pattern: {trapName}</p>

                        <div className="bg-slate-800/50 rounded-xl p-6 mb-6 border border-slate-700/50">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-slate-400 text-sm">Accuracy</span>
                                <span className={`font-bold text-lg ${accuracy >= 70 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                    {Math.round(accuracy)}%
                                </span>
                            </div>
                            <div className="w-full bg-slate-700/50 rounded-full h-2 mb-4">
                                <div
                                    className={`h-2 rounded-full transition-all ${accuracy >= 70 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                    style={{ width: `${accuracy}%` }}
                                ></div>
                            </div>
                            <p className="text-slate-300 text-sm italic">
                                {accuracy >= 70
                                    ? "You are improving on this pattern."
                                    : "This pattern still needs work. Try another drill."}
                            </p>
                        </div>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => navigate('/app/quiz', {
                                    state: {
                                        mode: 'trap-drill',
                                        patternId: location.state.patternId,
                                        patternName: trapName,
                                        domainTags: location.state.domainTags,
                                        masteryScore: location.state.masteryScore,
                                        examId: activeExamId
                                    },
                                    replace: true
                                })}
                                className="w-full bg-brand-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-500 shadow-lg shadow-brand-500/30 transition-all"
                            >
                                Practice Again
                            </button>
                            <Link to="/app" className="block w-full bg-slate-800 text-slate-300 px-6 py-3 rounded-xl font-bold hover:bg-slate-700 transition-all border border-slate-700">
                                Back to Dashboard
                            </Link>
                        </div>
                    </div>
                </div>
            );
        }

        // TRAP MODE SUMMARY
        if (location.state?.mode === 'trap') {
            const accuracy = (score / questions.length) * 100;
            const trapName = location.state.patternName || "Thinking Trap";

            return (
                <div className="min-h-screen flex items-center justify-center bg-slate-950">
                    <div className="bg-slate-900/50 backdrop-blur-md p-8 rounded-2xl shadow-2xl shadow-black/20 text-center max-w-md w-full border border-slate-700">
                        {/* Reinforcement Memory Generation */}
                        {(() => {
                            // Generate and store if not already done for this session
                            // We can use a simple check or just overwrite since it's the end of session
                            const REINFORCEMENT_KEY = 'exam_coach_reinforcement';

                            // Only generate if accuracy is decent (e.g. > 40%) to avoid reinforcing failure
                            if (accuracy > 40) {
                                const messages = [
                                    "You’re starting to recognize this trap earlier.",
                                    "You’re catching this pattern faster than before.",
                                    "This trap is becoming easier to spot."
                                ];
                                // Specific deterministic choice based on pattern name length to differ slightly per pattern but be consistent
                                const idx = (trapName.length + Math.floor(accuracy)) % messages.length;
                                const message = messages[idx];

                                try {
                                    localStorage.setItem(REINFORCEMENT_KEY, JSON.stringify({
                                        message,
                                        patternId: location.state.patternId,
                                        patternName: trapName,
                                        timestamp: Date.now()
                                    }));
                                } catch (e) {
                                    console.error("Failed to save reinforcement", e);
                                }
                            }
                            return null;
                        })()}

                        <div className="w-16 h-16 bg-brand-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-brand-500/20">
                            {accuracy > 70 ? '📈' : accuracy > 40 ? '⚖️' : '🔧'}
                        </div>

                        <h2 className="text-2xl font-bold text-white mb-2 font-display">{trapName}</h2>
                        <p className="text-slate-400 text-sm mb-6 uppercase tracking-wider font-bold">Session Complete</p>

                        <div className="bg-slate-800/50 rounded-xl p-6 mb-8 border border-slate-700/50">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-slate-400 text-sm">Session Accuracy</span>
                                <span className={`font-bold text-lg ${accuracy > 70 ? 'text-emerald-400' : 'text-slate-200'}`}>
                                    {Math.round(accuracy)}%
                                </span>
                            </div>
                            <div className="w-full bg-slate-700/50 rounded-full h-2 mb-4">
                                <div
                                    className={`h-2 rounded-full transition-all ${accuracy > 70 ? 'bg-emerald-500' : 'bg-brand-500'}`}
                                    style={{ width: `${accuracy}%` }}
                                ></div>
                            </div>
                            <p className="text-slate-300 text-sm italic">
                                "{accuracy > 80
                                    ? "Excellent work. You successfully avoided the trap signals."
                                    : accuracy > 50
                                        ? "You’re starting to recognize this trap earlier. Keep going."
                                        : "This pattern is tricky. Review the core rule and try again tomorrow."}"
                            </p>
                        </div>

                        {/* Mastery Explanation Disclosure */}
                        <div className="mb-6 text-left">
                            <button
                                onClick={() => setShowMasteryInfo(!showMasteryInfo)}
                                className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-300 transition-colors mx-auto"
                            >
                                <span>Why you may see repeated questions</span>
                                {showMasteryInfo ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                            {showMasteryInfo && (
                                <div className="mt-3 bg-slate-700/30 border border-slate-600 rounded-xl p-5 text-sm text-slate-400 space-y-4">
                                    <div>
                                        <h4 className="font-semibold text-slate-300 mb-1">How mastery works</h4>
                                        <p>CipherExam confirms understanding by requiring correct answers more than once. This prevents progress through guessing and mirrors how the PMP exam tests consistency across scenarios.</p>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-300 mb-1">About the questions</h4>
                                        <p>All questions are original and written to PMP standards. They are modeled on real exam patterns and domains — not copied from actual PMP exam questions.</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <Link to="/app" className="block w-full bg-brand-600 text-white px-6 py-3.5 rounded-xl font-bold hover:bg-brand-500 shadow-lg shadow-brand-500/30 transition-all transform hover:-translate-y-0.5">
                            Return to Dashboard
                        </Link>
                    </div>
                </div>
            );
        }

        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="bg-slate-800/50 backdrop-blur-md p-4 sm:p-8 rounded-2xl shadow-2xl shadow-black/20 text-center max-w-md w-full border border-slate-700 max-h-[90vh] overflow-y-auto">
                    <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 font-display">Quiz Completed!</h2>
                    <p className="text-lg sm:text-xl text-slate-300 mb-6">You scored <span className="font-bold text-brand-400">{score} / {questions.length}</span></p>

                    {/* Mastery Explanation Disclosure */}
                    <div className="mb-6 text-left">
                        <button
                            onClick={() => setShowMasteryInfo(!showMasteryInfo)}
                            className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-300 transition-colors mx-auto"
                        >
                            <span>Why you may see repeated questions</span>
                            {showMasteryInfo ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        {showMasteryInfo && (
                            <div className="mt-3 bg-slate-700/30 border border-slate-600 rounded-xl p-5 text-sm text-slate-400 space-y-4">
                                <div>
                                    <h4 className="font-semibold text-slate-300 mb-1">How mastery works</h4>
                                    <p>CipherExam confirms understanding by requiring correct answers more than once. This prevents progress through guessing and mirrors how the PMP exam tests consistency across scenarios.</p>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-slate-300 mb-1">About the questions</h4>
                                    <p>All questions are original and written to PMP standards. They are modeled on real exam patterns and domains — not copied from actual PMP exam questions.</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Thinking Trap Suggestion Logic */}
                    {(() => {
                        // Logic: Find first pattern with >= 2 misses
                        if (location.state?.mode === 'trap') return null; // Don't suggest while already in a trap session

                        const traps = Array.from(sessionTraps.values());
                        // Sort by count desc
                        traps.sort((a, b) => b.count - a.count);
                        const topTrap = traps[0];

                        // THRESHOLD: >= 2 misses to trigger suggestion
                        if (topTrap && topTrap.count >= 2) {
                            // COOLDOWN CHECK
                            const STORAGE_KEY = 'exam_coach_suggestion_history';
                            const COOLDOWN_HOURS = 4;

                            try {
                                const historyStr = localStorage.getItem(STORAGE_KEY);
                                if (historyStr) {
                                    const history = JSON.parse(historyStr);
                                    const lastId = history.patternId;
                                    const lastTime = history.timestamp;
                                    const now = Date.now();

                                    // If same pattern and within cooldown window, SUPPRESS
                                    if (lastId === topTrap.pattern.pattern_id && (now - lastTime) < (COOLDOWN_HOURS * 60 * 60 * 1000)) {
                                        console.log("Suppressing suggestion due to cooldown:", topTrap.pattern.pattern_name);
                                        return null;
                                    }
                                }

                                // valid suggestion, save to history (side effect in render is bad practice usually, but for this simple key update it's acceptable vs useEffect complexity)
                                // Better: We should ideally do this in a useEffect, but to keep the architecture simple for this MVP polish:
                                localStorage.setItem(STORAGE_KEY, JSON.stringify({
                                    patternId: topTrap.pattern.pattern_id,
                                    timestamp: Date.now()
                                }));

                            } catch (e) {
                                console.error("Error reading suggestion history", e);
                            }

                            return (
                                <div className="mb-8 bg-indigo-900/30 border border-indigo-500/30 rounded-xl p-6 relative overflow-hidden group">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                                    <div className="flex items-start gap-3 text-left">
                                        <div className="bg-indigo-500/20 p-2 rounded-lg text-xl">🛡️</div>
                                        <div>
                                            <h4 className="text-indigo-200 font-bold text-sm uppercase tracking-wide mb-1">
                                                Suggested Thinking Trap
                                            </h4>
                                            <h3 className="text-white font-bold text-lg mb-2">
                                                {topTrap.pattern.pattern_name}
                                            </h3>
                                            <p className="text-indigo-200/80 text-sm mb-4">
                                                This pattern may be worth practicing next.
                                            </p>

                                            <button
                                                onClick={() => {
                                                    if (isPro) {
                                                        navigate('/app/quiz', {
                                                            state: {
                                                                mode: 'trap',
                                                                patternId: topTrap.pattern.pattern_id,
                                                                patternName: topTrap.pattern.pattern_name,
                                                                domainTags: topTrap.pattern.domain_tags
                                                            }
                                                        });
                                                    } else {
                                                        setShowUpsell(true);
                                                    }
                                                }}
                                                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 text-sm"
                                            >
                                                {isPro ? "[ Practice This Trap ]" : "[ Unlock Trap Mastery ]"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        }
                        return null;
                    })()}

                    <Link to="/app" className="inline-block bg-brand-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-brand-500 shadow-lg shadow-brand-500/30 transition-all transform hover:-translate-y-0.5">
                        Return to Dashboard
                    </Link>
                </div>
            </div>
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
                                                const isCorrect = currentQuestion.type === 'pbq' && pbqState && currentQuestion.pbqConfig
                                                    ? isPBQCorrect(currentQuestion.pbqConfig, pbqState)
                                                    : currentQuestion.type === 'matching' && matchingState
                                                    ? matchingState.currentOrder.every((v, i) => v === matchingState.correctOrder[i])
                                                    : selectedOption === currentQuestion.correctAnswer;

                                                const isPbqOrMatching = currentQuestion.type === 'matching' || currentQuestion.type === 'pbq';
                                                finalDetails = [...quizDetails, {
                                                    questionId: currentQuestion.id,
                                                    selectedOption: isPbqOrMatching ? null : selectedOption,
                                                    correctOption: isPbqOrMatching ? null : currentQuestion.correctAnswer,
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
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-brand-400">Q{currentQuestionIndex + 1}</span>
                        <span className="text-sm text-slate-500">/ {questions.length}</span>
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
                <div className="w-full max-w-3xl mb-6">
                    {location.state?.mode === 'smart' ? (
                        <div className="bg-brand-900/30 border border-brand-500/30 rounded-xl p-3 sm:p-4 flex items-start gap-2 sm:gap-3">
                            <span className="text-lg sm:text-2xl">🧠</span>
                            <div>
                                <h3 className="text-brand-300 font-bold mb-1">Daily Practice Mode</h3>
                                <p className="text-sm text-slate-300">
                                    Our AI selects questions to optimize your learning: introducing new topics while reviewing past material to ensure implementation.
                                </p>
                            </div>
                        </div>
                    ) : location.state?.mode === 'weakest' ? (
                        <div className="bg-purple-900/30 border border-purple-500/30 rounded-xl p-3 sm:p-4 flex items-start gap-2 sm:gap-3">
                            <span className="text-lg sm:text-2xl">⚡</span>
                            <div>
                                <h3 className="text-purple-300 font-bold mb-1">Smart Practice: {location.state.filterDomain}</h3>
                                <p className="text-sm text-slate-300">
                                    We identified <strong>{location.state.filterDomain}</strong> as your weakest area. This session is focused on turning that weakness into a strength.
                                </p>
                            </div>
                        </div>
                    ) : location.state?.filterDomain ? (
                        <div className="bg-purple-900/30 border border-purple-500/30 rounded-xl p-3 sm:p-4 flex items-start gap-2 sm:gap-3">
                            <span className="text-lg sm:text-2xl">⚡</span>
                            <div>
                                <h3 className="text-purple-300 font-bold mb-1">{location.state.filterDomain} Practice Mode</h3>
                                <p className="text-sm text-slate-300">
                                    This session targets the <strong>{location.state.filterDomain}</strong> domain to help you turn weaknesses into strengths.
                                </p>
                            </div>
                        </div>
                    ) : location.state?.mode === 'trap-drill' ? (
                        <div className="bg-indigo-900/30 border border-indigo-500/30 rounded-xl p-3 sm:p-4 flex items-start gap-2 sm:gap-3">
                            <span className="text-lg sm:text-2xl">🎯</span>
                            <div>
                                <h3 className="text-indigo-300 font-bold mb-1">Trap Drill: {location.state.patternName}</h3>
                                <p className="text-sm text-slate-300">
                                    5-question micro-drill targeting this thinking trap.
                                </p>
                            </div>
                        </div>
                    ) : location.state?.mode === 'trap' ? (
                        <div className="bg-indigo-900/30 border border-indigo-500/30 rounded-xl p-3 sm:p-4 flex items-start gap-2 sm:gap-3">
                            <span className="text-lg sm:text-2xl">🛡️</span>
                            <div>
                                <h3 className="text-indigo-300 font-bold mb-1">Trap Repair: {location.state.patternName}</h3>
                                <p className="text-sm text-slate-300">
                                    Focused practice to master this specific exam pattern.
                                </p>
                            </div>
                        </div>
                    ) : quizType === 'diagnostic' ? (
                        <div className="bg-gradient-to-r from-brand-900/30 to-brand-800/30 border border-brand-500/30 rounded-xl p-3 sm:p-4 flex items-start gap-2 sm:gap-3">
                            <span className="text-lg sm:text-2xl">🔎</span>
                            <div>
                                <h3 className="text-brand-300 font-bold mb-1">I’m analyzing your logic, not just your score.</h3>
                                <p className="text-sm text-slate-300">
                                    Don't worry about getting these wrong. I'm just finding your baseline.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 sm:p-4 flex items-start gap-2 sm:gap-3">
                            <span className="text-lg sm:text-2xl">📝</span>
                            <div>
                                <h3 className="text-slate-300 font-bold mb-1">General Practice Mode</h3>
                                <p className="text-sm text-slate-400">
                                    Standard practice mode using questions from the current exam config.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="w-full max-w-3xl mb-4">
                    <QuestionProvenanceBadge />
                </div>

                {/* Active filter pill — surfaces domain / Bloom focused drill and fallback banner */}
                {(activeFilters.domain || activeFilters.bloomLevel || activeFilters.bloomFallback) && (
                    <div className="w-full max-w-3xl mb-4">
                        <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-3 flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-indigo-300">
                                Focused Drill
                            </span>
                            {activeFilters.domain && (
                                <span className="inline-flex items-center rounded-full bg-slate-800/70 border border-slate-700 px-2.5 py-0.5 text-xs text-slate-200">
                                    Domain: <span className="font-semibold text-white ml-1">{activeFilters.domain}</span>
                                </span>
                            )}
                            {activeFilters.bloomLevel && (
                                <span className="inline-flex items-center rounded-full bg-slate-800/70 border border-slate-700 px-2.5 py-0.5 text-xs text-slate-200">
                                    Bloom: <span className="font-semibold text-white ml-1">{activeFilters.bloomLevel}</span>
                                </span>
                            )}
                            <span className="text-xs text-slate-400 ml-auto">
                                Answers still count toward mastery &amp; readiness.
                            </span>
                        </div>
                        {activeFilters.bloomFallback && (
                            <div className="mt-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-200">
                                No questions matched that Bloom level in this domain yet — running the full domain instead. The Bloom filter will activate once content is tagged.
                            </div>
                        )}
                    </div>
                )}

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
                            <div className="space-y-3">
                                {(currentQuestion.options || []).map((opt, i) => {
                                    let borderClass = 'border-slate-700 hover:border-brand-500/50 hover:bg-slate-700/50';
                                    let textClass = 'text-slate-300';
                                    let dotClass = 'border-slate-500 group-hover:border-brand-400';
                                    let resultIcon = '';

                                    if (selectedOption === i) {
                                        borderClass = 'border-brand-500 bg-brand-500/10 shadow-lg shadow-brand-500/10';
                                        textClass = 'text-brand-300 font-medium';
                                        dotClass = 'border-brand-500 bg-brand-500';
                                    }

                                    if (showExplanation) {
                                        if (i === currentQuestion.correctAnswer) {
                                            borderClass = 'border-emerald-500 bg-emerald-500/10';
                                            textClass = 'text-emerald-300 font-medium';
                                            dotClass = 'border-emerald-500 bg-emerald-500';
                                            resultIcon = '✓';
                                        } else if (selectedOption === i) {
                                            // Gentle incorrect styling — no flash, just a subdued border
                                            borderClass = 'border-red-500/60 bg-red-500/5';
                                            textClass = 'text-red-300/80 font-medium';
                                            dotClass = 'border-red-500/60 bg-red-500/40';
                                            resultIcon = '✗';
                                        }
                                    }

                                    return (
                                        <button
                                            key={i}
                                            onClick={() => handleOptionSelect(i)}
                                            disabled={showExplanation}
                                            className={`w-full text-left p-4 rounded-xl border-2 transition-colors duration-500 ease-in-out flex items-center gap-4 group motion-reduce:transition-none ${borderClass}`}
                                        >
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors duration-500 ease-in-out ${dotClass}`}>
                                                {showExplanation && resultIcon ? (
                                                    <span className="text-xs font-bold text-white">{resultIcon}</span>
                                                ) : (
                                                    selectedOption === i && <div className="w-2 h-2 bg-white rounded-full" />
                                                )}
                                            </div>
                                            <span className={`text-base transition-colors duration-500 ease-in-out ${textClass}`}>
                                                {opt}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                            )}

                            {showExplanation && explanationExpanded && (
                                <div className="mt-8 pt-6 border-t border-slate-700">
                                    <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-lg p-3 sm:p-6 lg:p-10">
                                        {currentQuestion.type === "emv" && currentQuestion.scenarios && (
                                            <EmvCalculation scenarios={currentQuestion.scenarios} />
                                        )}

                                        <div className="bg-blue-900/20 rounded-lg border border-blue-500/30 text-blue-200 p-4 mb-4">
                                            <p className="text-xl md:text-2xl font-bold text-white mb-1">Let’s walk through the thinking behind this question.</p>
                                            {currentQuestion.bloomLevel && BLOOM_LEVELS.includes(currentQuestion.bloomLevel) && (
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className="text-sm md:text-base text-blue-300/70">Bloom's Taxonomy level:</span>
                                                    <span
                                                        title={`Bloom's Taxonomy: ${BLOOM_DESCRIPTIONS[currentQuestion.bloomLevel as BloomLevel]}`}
                                                        className="text-sm md:text-base font-bold px-3 py-1 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5"
                                                    >
                                                        <Brain className="w-5 h-5" />
                                                        {currentQuestion.bloomLevel}
                                                    </span>
                                                    <span className="text-sm md:text-base text-blue-200/60 hidden md:inline">
                                                        — {BLOOM_DESCRIPTIONS[currentQuestion.bloomLevel as BloomLevel]}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {!tutorBreakdown && !loadingBreakdown ? (
                                            <div className="text-center p-4">
                                                <button
                                                    onClick={() => fetchTutorBreakdown(currentQuestion, selectedOption!)}
                                                    className="text-brand-400 hover:text-brand-300 underline"
                                                >
                                                    Load Coach Breakdown
                                                </button>
                                                <div className="mt-4 p-4 text-left leading-relaxed text-base md:text-lg text-slate-200">
                                                    <StructuredExplanation explanation={currentQuestion.explanation} title="Standard Explanation" />
                                                </div>
                                            </div>
                                        ) : (
                                            <TutorBreakdown
                                                breakdown={tutorBreakdown}
                                                loading={loadingBreakdown}
                                                onExpandDepth={handleExpandDepth}
                                                depthContent={depthContent}
                                                depthLoading={depthLoading}
                                                coachMode={coachMode}
                                                onCoachModeChange={handleCoachModeChange}
                                                correctAnswerIndex={currentQuestion.correctAnswer}
                                            />
                                        )}

                                        <div className="mt-6 border-t border-slate-700/50 pt-4">
                                            <div className="text-sm md:text-base font-semibold text-slate-200 tracking-wide">
                                                📘 Reference
                                            </div>
                                            <div className="mt-1 text-sm md:text-base text-slate-400 italic">
                                                {DOMAIN_CITATIONS[currentQuestion.domain] ?? EXAM_REFERENCES[activeExamId] ?? "Exam Reference Guide"}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="bg-slate-900/30 px-4 sm:px-8 py-4 border-t border-slate-700/50 flex justify-end">
                            {!showExplanation ? (
                                <button
                                    onClick={handleSubmit}
                                    disabled={currentQuestion.type === 'pbq' ? !pbqState : currentQuestion.type === 'matching' ? !matchingState : selectedOption === null}
                                    className="w-full sm:w-auto bg-brand-600 text-white px-8 py-3 rounded-xl font-medium shadow-lg shadow-brand-500/30 hover:bg-brand-500 hover:shadow-brand-500/40 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                >
                                    {currentQuestion.type === 'pbq' ? 'Submit PBQ' : currentQuestion.type === 'matching' ? 'Check Matches' : 'Submit Answer'}
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
            />
        </div>
    );
}

