import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * EC-130: Friction Event Logging
 *
 * Captures moments where users experience friction that may lead to churn.
 * Fire-and-forget — never blocks the UI or throws.
 */

export type FrictionEventType =
    | 'slow_load'           // Page or quiz took > 5s to load
    | 'quiz_load_timing'    // Per-phase breakdown of a quiz load (emitted every load)
    | 'quiz_abandon'        // User quit a quiz mid-way
    | 'error_shown'         // An error message was displayed to the user
    | 'paywall_hit'         // User hit a subscription gate
    | 'validation_blocked'  // Server-side validation denied quiz start
    | 'explanation_timeout'  // Tutor breakdown took > 10s
    | 'network_error'       // A network request failed
    | 'empty_state';        // User saw an empty/no-data screen

interface FrictionMeta {
    page?: string;
    quizType?: string;
    questionIndex?: number;
    totalQuestions?: number;
    loadTimeMs?: number;
    errorMessage?: string;
    examId?: string;
    [key: string]: unknown;
}

// Per-session emit cap. 5 is the right ceiling for genuine friction — the
// point is to know it happened, not to count every occurrence.
//
// quiz_load_timing is different: it is diagnostic instrumentation, it fires
// twice on a normal load (loader finished, then first question painted), and a
// session where someone starts several quizzes is exactly the session worth
// measuring. At 5 the useful samples would be gone after two loads.
const DEFAULT_MAX_PER_SESSION = 5;
const MAX_PER_SESSION: Partial<Record<FrictionEventType, number>> = {
    quiz_load_timing: 40,
};

export const FrictionEventService = {
    emit(userId: string, eventType: FrictionEventType, meta?: FrictionMeta) {
        // Session-level dedup: avoid spamming the same event type
        const dedupKey = `ec_friction_${eventType}`;
        const count = parseInt(sessionStorage.getItem(dedupKey) || '0', 10);
        if (count >= (MAX_PER_SESSION[eventType] ?? DEFAULT_MAX_PER_SESSION)) return;

        sessionStorage.setItem(dedupKey, String(count + 1));

        addDoc(collection(db, 'friction_events'), {
            userId,
            eventType,
            meta: meta || {},
            url: window.location.pathname,
            timestamp: serverTimestamp(),
        }).catch(() => {}); // Silent fail — never block UI
    },
};
