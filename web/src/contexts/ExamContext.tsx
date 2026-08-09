import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { doc, getDoc, collection, query, where, limit, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { DiagnosticService } from '../services/DiagnosticService';
import { DEFAULT_EXAM_ID, EXAMS } from '../config/exams';

interface ExamContextType {
    selectedExamId: string;
    examName: string;
    bankVersion: string;
    examDomains: string[];
    loading: boolean;
    hasCompletedDiagnostic: boolean | null;
    switchExam: (examId: string) => Promise<void>;
    markDiagnosticComplete: () => void;
}

const ExamContext = createContext<ExamContextType | undefined>(undefined);

/**
 * PMP has two banks in Firestore, both declared in web/src/config/exams.ts:
 * `PMP_EXAM_ID` (retired, written against the 2021 outline) and
 * `PMP_2026_EXAM_ID` (live, aligned to the PMI "PMP Examination Content
 * Outline – July 2026": People 33% / Process 41% / Business Environment 26%).
 *
 * No cutover date is asserted anywhere in this file. The July 2026 ECO PDF
 * prints no effective date and never mentions the 2021 outline, so there is
 * nothing to cite — the same standard components/QuestionProvenanceBadge.tsx
 * already sets. Only the supersession itself is claimed.
 *
 * There is deliberately NO automatic remapping of a stored retired-bank ID
 * onto the live bank. `selectedExamId` is the key that paid access and all
 * per-exam state hang off:
 *   - utils/passEntitlement.ts `isPassActiveFor` matches `pass.examId` by
 *     strict equality, so rewriting the stored ID revokes a paid $59 Exam
 *     Pass on the very next app load. Gates that would flip: App.tsx:292,
 *     MockExamGuard.tsx:20, Quiz.tsx:125, SimulatorIntro.tsx:125,
 *     analytics/BloomHeatmap.tsx:392.
 *   - Dashboard progress queries and DiagnosticService.hasCompletedRun are
 *     scoped by examId, so a rewrite also blanks visible progress/readiness
 *     and re-locks the mock exam for "no diagnostic".
 * Entitlement records cannot be rewritten from the client, so until a
 * server-side migration moves pass documents onto the new bank ID, moving a
 * user between banks stays a deliberate act through the exam picker
 * (`switchExam`) — never a side effect of loading the app.
 *
 * The retired bank is surfaced rather than silently swapped: `examName` below
 * resolves from EXAMS, so it reads "PMP (2021 outline — retired)" wherever the
 * app shows the exam name, and QuestionProvenanceBadge labels every question
 * drawn from it as coming from the superseded outline.
 */

/**
 * Resolves the exam ID the app boots with: the user's last selection, else
 * DEFAULT_EXAM_ID (the live 2026 bank, so new users never start on the
 * retired outline).
 *
 * Pure read by contract. This is a `useState` initializer, so under
 * <StrictMode> (web/src/main.tsx) and concurrent rendering it can run more
 * than once and can run for a render that is thrown away. It must never
 * write storage or have any other side effect.
 */
function resolveInitialExamId(): string {
    try {
        return localStorage.getItem('selectedExamId') || DEFAULT_EXAM_ID;
    } catch {
        // localStorage unavailable (private mode, prerender) — fall back cleanly.
        return DEFAULT_EXAM_ID;
    }
}

export function ExamProvider({ children }: { children: ReactNode }) {
    const [selectedExamId, setSelectedExamId] = useState<string>(resolveInitialExamId);
    const [examName, setExamName] = useState<string>('');
    const [bankVersion, setBankVersion] = useState<string>('1.0');
    const [examDomains, setExamDomains] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    // Diagnostic completion — single source of truth (tri-state: null = loading)
    const [hasCompletedDiagnostic, setHasCompletedDiagnostic] = useState<boolean | null>(null);

    useEffect(() => {
        setHasCompletedDiagnostic(null);
        if (!selectedExamId) return;
        const unsub = onAuthStateChanged(auth, (user) => {
            if (!user) return;
            console.log('[ExamContext] checking diagnostic for examId:', selectedExamId, 'userId:', user.uid);
            DiagnosticService.hasCompletedRun(user.uid, selectedExamId)
                .then(completed => {
                    console.log('[ExamContext] hasCompletedRun returned:', completed, 'for examId:', selectedExamId);
                    setHasCompletedDiagnostic(completed);
                })
                .catch((err) => {
                    console.error('[ExamContext] hasCompletedRun error:', err);
                    setHasCompletedDiagnostic(true);
                });
        });
        return () => unsub();
    }, [selectedExamId]);

    const markDiagnosticComplete = useCallback(() => setHasCompletedDiagnostic(true), []);

    // Load exam metadata whenever selectedExamId changes
    useEffect(() => {
        const loadExamData = async () => {
            setLoading(true);
            console.log('[ExamContext] loadExamData called for:', selectedExamId);
            try {
                // If it's a "default" placeholder, we might want to fetch the "first" available exam
                // But for now, let's assume we look up the ID.
                if (selectedExamId) {
                    console.log('[ExamContext] Fetching exam doc:', selectedExamId);
                    const examRef = doc(db, 'exams', selectedExamId);
                    const snap = await getDoc(examRef);
                    console.log('[ExamContext] getDoc returned, exists:', snap.exists());

                    if (snap.exists()) {
                        const data = snap.data();
                        // config/exams.ts wins over the Firestore `name`: it is the
                        // repo's source of truth and carries the retirement label
                        // ("PMP (2021 outline — retired)"). A stale Firestore name
                        // must not be able to present a retired bank as current.
                        setExamName(EXAMS[selectedExamId]?.name || data.name || 'Unknown Exam');
                        setBankVersion(data.bankVersion || '1.0');
                        setExamDomains(data.domains || []);
                    } else {
                        // Fallback if ID is invalid: Auto-select first published exam
                        console.warn(`Exam ${selectedExamId} not found, searching for published exam...`);

                        const q = query(collection(db, 'exams'), where('isPublished', '==', true), limit(1));
                        const querySnap = await getDocs(q);

                        if (!querySnap.empty) {
                            const firstExam = querySnap.docs[0];
                            const data = firstExam.data();

                            console.log(`Auto-switching to ${firstExam.id} (${data.name})`);
                            setSelectedExamId(firstExam.id);
                            localStorage.setItem('selectedExamId', firstExam.id);

                            // State updates will trigger re-render, but we set them here to be immediate for this cycle if needed
                            // Actually, updating selectedExamId triggers the effect again, so we can just return or let it re-run.
                            // But to avoid flicker, we can set them:
                            setExamName(EXAMS[firstExam.id]?.name || data.name || 'Unknown Exam');
                            setBankVersion(data.bankVersion || '1.0');
                            setExamDomains(data.domains || []);
                        } else {
                            setExamName('No Exams Found');
                            setExamDomains([]);
                        }
                    }
                }
            } catch (error: any) {
                console.error("[ExamContext] Failed to load exam data:", error?.message || error, error?.code);
            } finally {
                setLoading(false);
            }
        };

        loadExamData();
    }, [selectedExamId]);

    // Sync usage to User Profile (optional persistence)
    // We listen to Auth to ensure we save the preference to the user's profile for cross-device sync
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user && selectedExamId) {
                // Update lastActiveExam in Firestore?
                // await updateDoc(doc(db, 'users', user.uid), { lastActiveExam: selectedExamId });
            }
        });
        return () => unsubscribe();
    }, []);

    // The only path that changes which bank a user is on. It is user-initiated
    // and reversible (the picker can switch straight back), and it sets no
    // sticky opt-out flag: nothing here may leave a permanent mark that a
    // future content-outline migration would have to work around.
    const switchExam = async (examId: string) => {
        localStorage.setItem('selectedExamId', examId);
        setSelectedExamId(examId);
    };

    return (
        <ExamContext.Provider value={{ selectedExamId, examName, bankVersion, examDomains, loading, hasCompletedDiagnostic, switchExam, markDiagnosticComplete }}>
            {children}
        </ExamContext.Provider>
    );
}

export function useExam() {
    const context = useContext(ExamContext);
    if (context === undefined) {
        throw new Error('useExam must be used within an ExamProvider');
    }
    return context;
}
