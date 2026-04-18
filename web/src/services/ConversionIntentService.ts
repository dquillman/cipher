import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * EC-111: Conversion Intent Signals
 *
 * Tracks behavioral signals that indicate a free-tier user may be
 * ready to convert. Used for targeted nudges and cohort analysis.
 * Fire-and-forget — never blocks the UI.
 */

export type IntentSignal =
    | 'pricing_view'         // User visited the pricing page
    | 'pro_feature_attempt'  // User tried to use a Pro-only feature
    | 'upsell_modal_shown'   // Upsell modal was displayed
    | 'upsell_modal_cta'     // User clicked CTA in upsell modal
    | 'limit_reached'        // User hit daily quiz limit
    | 'high_engagement'      // User completed 3+ quizzes in a session
    | 'tutor_locked'         // User saw "unlock tutor" prompt
    | 'return_visit';        // User returned within 48h of last session

interface IntentMeta {
    feature?: string;
    sessionQuizCount?: number;
    examId?: string;
    [key: string]: unknown;
}

const SESSION_KEY = 'ec_intent_signals';

export const ConversionIntentService = {
    emit(signal: IntentSignal, meta?: IntentMeta) {
        const userId = auth.currentUser?.uid;
        if (!userId) return;

        // Session-level dedup: max 3 per signal type per session
        const counts: Record<string, number> = JSON.parse(sessionStorage.getItem(SESSION_KEY) || '{}');
        if ((counts[signal] || 0) >= 3) return;
        counts[signal] = (counts[signal] || 0) + 1;
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(counts));

        addDoc(collection(db, 'conversion_intent'), {
            userId,
            signal,
            meta: meta || {},
            url: window.location.pathname,
            timestamp: serverTimestamp(),
        }).catch(() => {}); // Silent fail
    },
};
