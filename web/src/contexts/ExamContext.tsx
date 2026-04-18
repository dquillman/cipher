import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { doc, getDoc, collection, query, where, limit, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { DiagnosticService } from '../services/DiagnosticService';
import { DEFAULT_EXAM_ID } from '../config/exams';

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

export function ExamProvider({ children }: { children: ReactNode }) {
    const [selectedExamId, setSelectedExamId] = useState<string>(() => {
        return localStorage.getItem('selectedExamId') || DEFAULT_EXAM_ID;
    });
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
                        setExamName(data.name || 'Unknown Exam');
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
                            setExamName(data.name || 'Unknown Exam');
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
