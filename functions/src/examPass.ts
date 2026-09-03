import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import Stripe from "stripe";
import { getCheckoutUrls } from "./billingConfig";

/**
 * 90-Day Exam Pass (docs/exam-pass-spec.md).
 *
 * - createPassCheckoutSession: $59 one-time Stripe Checkout (inline price_data,
 *   so no pre-created Price ID is needed — works unchanged when live keys land).
 * - fulfillExamPassCheckout: called from the existing stripeWebhook on
 *   checkout.session.completed when metadata.type === 'exam-pass'. Writes the
 *   entitlement to users/{uid}.
 * - extendExamPass: the one free self-service extension ("your pass covers you
 *   through your exam"). Paid $19/30d extension is NOT built yet.
 */

const PASS_DAYS = 90;
const FREE_EXTENSION_WINDOW_DAYS = 30; // examDateSnapshot must fall within 30d AFTER expiry
const FREE_EXTENSION_BUFFER_DAYS = 7;  // extend to examDate + 7 days...
const FREE_EXTENSION_CAP_DAYS = 30;    // ...capped at old expiry + 30 days

const DAY_MS = 24 * 60 * 60 * 1000;

function isValidDocumentId(value: string): boolean {
    return value.length > 0 && value.length <= 128 && !value.includes('/');
}

// Mirrors getStripe() in stripe.ts — key from functions/.env (TEST mode today).
const getStripe = () => {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
        throw new Error("Missing STRIPE_SECRET_KEY env variable");
    }
    return new Stripe(key, {
        apiVersion: "2025-11-17.clover", // Exact match for installed SDK
    });
};

/**
 * Finds the user's active study plan for an exam and returns its examDate,
 * or null if no active plan with a valid examDate exists.
 * Schema (see examCountdown.ts): study_plans/{planId} with top-level
 * userId, examId, examDate (Timestamp), status ('active').
 * Status is filtered in code (same approach as examCountdown) to avoid
 * requiring a composite index.
 */
async function getActivePlanExamDate(
    uid: string,
    examId: string,
): Promise<admin.firestore.Timestamp | null> {
    const db = admin.firestore();
    const plansSnap = await db.collection('study_plans')
        .where('userId', '==', uid)
        .where('examId', '==', examId)
        .get();

    for (const doc of plansSnap.docs) {
        const plan = doc.data();
        if (plan.status !== 'active') continue;
        const examDate = plan.examDate;
        if (examDate instanceof admin.firestore.Timestamp) {
            return examDate;
        }
    }
    return null;
}

/**
 * Creates a Stripe Checkout Session for the one-time 90-day Exam Pass.
 * Uses inline price_data (not a pre-created Price ID) so the same code works
 * in test mode today and unchanged when live keys land.
 */
export const createPassCheckoutSession = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    }

    const examId = typeof data?.examId === 'string' ? data.examId.trim() : '';
    if (!isValidDocumentId(examId)) {
        throw new functions.https.HttpsError('invalid-argument', 'A valid examId is required.');
    }

    const examSnap = await admin.firestore().collection('exams').doc(examId).get();
    if (!examSnap.exists) {
        throw new functions.https.HttpsError('not-found', 'Exam not found.');
    }

    const metadata = {
        type: 'exam-pass',
        uid: context.auth.uid,
        examId,
    };

    try {
        const stripe = getStripe();
        const urls = getCheckoutUrls();
        const session = await stripe.checkout.sessions.create({
            mode: 'payment',
            payment_method_types: ['card'],
            // Payment-mode checkout defaults to customer_creation 'if_required',
            // which for a card payment creates NO customer. Pass buyers were
            // therefore left with no stripeCustomerId and no billing portal —
            // they had paid $59 and could not pull their own receipt. Always
            // create one so the portal works for them too.
            customer_creation: 'always',
            line_items: [{
                price_data: {
                    currency: 'usd',
                    unit_amount: 5900,
                    product_data: { name: 'CipherExam Exam Pass — 90 days' },
                },
                quantity: 1,
            }],
            success_url: urls.passSuccessUrl,
            cancel_url: urls.passCancelUrl,
            metadata,
            payment_intent_data: { metadata },
            customer_email: context.auth.token.email,
        });

        return { sessionId: session.id, url: session.url };
    } catch (error: unknown) {
        console.error('Stripe createPassCheckoutSession error:', error);
        throw new functions.https.HttpsError('internal', 'Unable to create checkout session.');
    }
});

/**
 * Fulfillment for checkout.session.completed with metadata.type === 'exam-pass'.
 * Invoked from the existing stripeWebhook handler (stripe.ts) — do NOT wire a
 * second webhook endpoint for this.
 *
 * Idempotent: the entitlement is stamped with the session id; a replayed event
 * for the same session is a no-op (on top of the webhook's event-claim guard).
 */
export async function fulfillExamPassCheckout(session: Stripe.Checkout.Session): Promise<void> {
    const uid = session.metadata?.uid;
    const examId = session.metadata?.examId;

    if (!uid || !examId || !isValidDocumentId(uid) || !isValidDocumentId(examId)) {
        throw new Error(`[exam-pass] Invalid uid/examId metadata on session ${session.id}`);
    }
    if (session.mode !== 'payment' ||
        session.status !== 'complete' ||
        session.payment_status !== 'paid' ||
        session.amount_total !== 5900 ||
        session.currency !== 'usd') {
        throw new Error(`[exam-pass] Refusing unverified payment session ${session.id}`);
    }

    const db = admin.firestore();
    const userRef = db.collection('users').doc(uid);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
        console.error(`[exam-pass] Refusing grant: no user document for ${uid} (session ${session.id})`);
        return;
    }

    // Idempotency: already fulfilled from this exact session.
    const existing = userSnap.data()?.entitlement;
    if (existing?.stripeSessionId === session.id) {
        console.log(`[exam-pass] Session ${session.id} already fulfilled for user ${uid}, skipping`);
        return;
    }

    const now = admin.firestore.Timestamp.now();
    const expiresAt = admin.firestore.Timestamp.fromMillis(now.toMillis() + PASS_DAYS * DAY_MS);

    // Anti-gaming snapshot: examDate at purchase (or first entry later, see extendExamPass).
    const examDateSnapshot = await getActivePlanExamDate(uid, examId);

    console.log(`[exam-pass] Granting 90-day pass for exam ${examId} to user ${uid} (session ${session.id})`);

    // Persist the Stripe customer so the billing portal works for pass-only
    // buyers (createPortalSession reads users/{uid}.stripeCustomerId, which was
    // previously written only by the subscription flow). Never overwrite an
    // existing id — a Pro subscriber who also buys a pass keeps their original
    // customer record.
    const passCustomerId = typeof session.customer === 'string' ? session.customer : null;
    const existingCustomerId = userSnap.data()?.stripeCustomerId;

    await userRef.set({
        entitlement: {
            type: 'exam-pass',
            examId: examId,
            purchasedAt: now,
            expiresAt: expiresAt,
            examDateSnapshot: examDateSnapshot,
            freeExtensionUsed: false,
            stripeSessionId: session.id,
        },
        ...(passCustomerId && !existingCustomerId ? { stripeCustomerId: passCustomerId } : {}),
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
}

/**
 * One free self-service extension per pass (spec "Rescheduler rule"):
 * eligible iff an exam-pass entitlement exists, freeExtensionUsed is false,
 * and examDateSnapshot falls within 30 days AFTER the current expiresAt.
 * New expiresAt = min(examDateSnapshot + 7 days, old expiresAt + 30 days).
 *
 * Eligibility reads the CURRENT study-plan exam date, falling back to the
 * purchase-time snapshot when no plan exists. Moving your exam date is the
 * whole point of the feature; the caps (one per pass, +30 days maximum) are
 * what bound it.
 *
 * Not eligible → { eligible: false, reason }. The paid $19/30d extension is
 * not built yet; 'paid_extension_required' signals that path.
 */
export const extendExamPass = functions.https.onCall(async (_data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    }

    const uid = context.auth.uid;
    const db = admin.firestore();
    const userRef = db.collection('users').doc(uid);

    const userSnap = await userRef.get();
    const entitlement = userSnap.data()?.entitlement;

    if (!entitlement || entitlement.type !== 'exam-pass') {
        return { eligible: false, reason: 'no_pass' };
    }

    if (entitlement.freeExtensionUsed === true) {
        return { eligible: false, reason: 'paid_extension_required' };
    }

    const expiresAt: admin.firestore.Timestamp | undefined = entitlement.expiresAt;
    if (!(expiresAt instanceof admin.firestore.Timestamp)) {
        console.error(`[exam-pass] users/${uid} entitlement has no valid expiresAt`);
        return { eligible: false, reason: 'paid_extension_required' };
    }

    // The exam date to honour is the CURRENT one, not the one snapshotted at
    // purchase.
    //
    // This is what the pass is sold on: "Free reschedule if your exam date
    // moves" (PublicPricing) and "Rescheduled? Your pass moves with your exam"
    // (PricingCard). Reading the purchase-time snapshot inverted that promise.
    // A buyer whose exam sat inside the 90 days at purchase -- the normal case,
    // since the study plan is set during onboarding -- has snapshot <= expiry,
    // which the window test below rejects outright. The only people who could
    // ever extend were those whose exam was ALREADY past expiry when they paid,
    // or who had no study plan at all. The advertised scenario was the one
    // scenario that could not qualify.
    //
    // The snapshot is still recorded for audit, and abuse stays bounded by the
    // two limits that were always here: one free extension per pass, and a hard
    // cap of expiry + 30 days no matter how far out the new date is.
    const liveExamDate = await getActivePlanExamDate(uid, entitlement.examId);
    const storedSnapshot: admin.firestore.Timestamp | null =
        entitlement.examDateSnapshot instanceof admin.firestore.Timestamp
            ? entitlement.examDateSnapshot
            : null;
    const examDate = liveExamDate ?? storedSnapshot;

    if (examDate === null) {
        // No study plan and no snapshot: there is no exam date to move the pass
        // to. Distinct from having spent the free extension.
        return { eligible: false, reason: 'no_exam_date' };
    }

    if (storedSnapshot === null && liveExamDate !== null) {
        await userRef.set({
            entitlement: { examDateSnapshot: liveExamDate },
        }, { merge: true });
    }

    // Free extension window: the exam date falls within 30 days AFTER expiresAt.
    const expiresMs = expiresAt.toMillis();
    const snapshotMs = examDate.toMillis();
    const windowEndMs = expiresMs + FREE_EXTENSION_WINDOW_DAYS * DAY_MS;

    if (snapshotMs <= expiresMs) {
        // The pass already covers the exam. Not a refusal worth dressing up.
        return { eligible: false, reason: 'pass_already_covers_exam' };
    }
    if (snapshotMs > windowEndMs) {
        return { eligible: false, reason: 'beyond_free_window' };
    }

    // New expiry = min(examDate + 7 days, old expiry + 30 days).
    const newExpiresMs = Math.min(
        snapshotMs + FREE_EXTENSION_BUFFER_DAYS * DAY_MS,
        expiresMs + FREE_EXTENSION_CAP_DAYS * DAY_MS,
    );
    const newExpiresAt = admin.firestore.Timestamp.fromMillis(newExpiresMs);

    await userRef.set({
        entitlement: {
            expiresAt: newExpiresAt,
            freeExtensionUsed: true,
        },
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    console.log(`[exam-pass] Free extension applied for user ${uid}: expiresAt -> ${newExpiresAt.toDate().toISOString()}`);

    return {
        eligible: true,
        newExpiresAt: newExpiresAt.toMillis(),
        expiresAt: newExpiresAt.toMillis(),
    };
});
