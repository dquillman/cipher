"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extendExamPass = exports.fulfillExamPassCheckout = exports.createPassCheckoutSession = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const stripe_1 = require("stripe");
const billingConfig_1 = require("./billingConfig");
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
const FREE_EXTENSION_BUFFER_DAYS = 7; // extend to examDate + 7 days...
const FREE_EXTENSION_CAP_DAYS = 30; // ...capped at old expiry + 30 days
const DAY_MS = 24 * 60 * 60 * 1000;
function isValidDocumentId(value) {
    return value.length > 0 && value.length <= 128 && !value.includes('/');
}
// Mirrors getStripe() in stripe.ts — key from functions/.env (TEST mode today).
const getStripe = () => {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
        throw new Error("Missing STRIPE_SECRET_KEY env variable");
    }
    return new stripe_1.default(key, {
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
async function getActivePlanExamDate(uid, examId) {
    const db = admin.firestore();
    const plansSnap = await db.collection('study_plans')
        .where('userId', '==', uid)
        .where('examId', '==', examId)
        .get();
    for (const doc of plansSnap.docs) {
        const plan = doc.data();
        if (plan.status !== 'active')
            continue;
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
exports.createPassCheckoutSession = functions.https.onCall(async (data, context) => {
    var _a;
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    }
    const examId = typeof (data === null || data === void 0 ? void 0 : data.examId) === 'string' ? data.examId.trim() : '';
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
        const urls = (0, billingConfig_1.getCheckoutUrls)();
        // Reuse the customer this user already has, if any.
        //
        // The same fault as the subscription side, mirrored: passing only
        // customer_email makes Stripe mint a NEW Customer every time. A user who
        // already had a stripeCustomerId (a lapsed Pro subscriber, or someone
        // buying a second pass) therefore paid $59 against a customer no user
        // document references -- and fulfilment below refuses to overwrite the
        // stored id, so the link is never made. handleChargeRefunded looks users
        // up by that single field, so refunding that pass matched nobody, logged
        // a warning, and returned: money back, 90 days of access retained.
        const existingCustomerId = (_a = (await admin.firestore()
            .collection('users').doc(context.auth.uid).get())
            .data()) === null || _a === void 0 ? void 0 : _a.stripeCustomerId;
        const session = await stripe.checkout.sessions.create(Object.assign(Object.assign(Object.assign({ mode: 'payment', payment_method_types: ['card'] }, (existingCustomerId ? {} : { customer_creation: 'always' })), { line_items: [{
                    price_data: {
                        currency: 'usd',
                        unit_amount: 5900,
                        product_data: { name: 'CipherExam Exam Pass — 90 days' },
                    },
                    quantity: 1,
                }], success_url: urls.passSuccessUrl, cancel_url: urls.passCancelUrl, metadata, payment_intent_data: { metadata } }), (existingCustomerId
            ? { customer: existingCustomerId }
            : { customer_email: context.auth.token.email })));
        return { sessionId: session.id, url: session.url };
    }
    catch (error) {
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
async function fulfillExamPassCheckout(session) {
    var _a, _b, _c, _d;
    const uid = (_a = session.metadata) === null || _a === void 0 ? void 0 : _a.uid;
    const examId = (_b = session.metadata) === null || _b === void 0 ? void 0 : _b.examId;
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
    const existing = (_c = userSnap.data()) === null || _c === void 0 ? void 0 : _c.entitlement;
    if ((existing === null || existing === void 0 ? void 0 : existing.stripeSessionId) === session.id) {
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
    const existingCustomerId = (_d = userSnap.data()) === null || _d === void 0 ? void 0 : _d.stripeCustomerId;
    await userRef.set(Object.assign(Object.assign({ entitlement: {
            type: 'exam-pass',
            examId: examId,
            purchasedAt: now,
            expiresAt: expiresAt,
            examDateSnapshot: examDateSnapshot,
            freeExtensionUsed: false,
            stripeSessionId: session.id,
        } }, (passCustomerId && !existingCustomerId ? { stripeCustomerId: passCustomerId } : {})), { lastUpdated: admin.firestore.FieldValue.serverTimestamp() }), { merge: true });
}
exports.fulfillExamPassCheckout = fulfillExamPassCheckout;
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
exports.extendExamPass = functions.https.onCall(async (_data, context) => {
    var _a;
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    }
    const uid = context.auth.uid;
    const db = admin.firestore();
    const userRef = db.collection('users').doc(uid);
    const userSnap = await userRef.get();
    const entitlement = (_a = userSnap.data()) === null || _a === void 0 ? void 0 : _a.entitlement;
    if (!entitlement || entitlement.type !== 'exam-pass') {
        return { eligible: false, reason: 'no_pass' };
    }
    if (entitlement.freeExtensionUsed === true) {
        return { eligible: false, reason: 'paid_extension_required' };
    }
    const expiresAt = entitlement.expiresAt;
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
    const storedSnapshot = entitlement.examDateSnapshot instanceof admin.firestore.Timestamp
        ? entitlement.examDateSnapshot
        : null;
    const examDate = liveExamDate !== null && liveExamDate !== void 0 ? liveExamDate : storedSnapshot;
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
    const newExpiresMs = Math.min(snapshotMs + FREE_EXTENSION_BUFFER_DAYS * DAY_MS, expiresMs + FREE_EXTENSION_CAP_DAYS * DAY_MS);
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
//# sourceMappingURL=examPass.js.map