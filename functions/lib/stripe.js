"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripeWebhook = exports.cancelSubscription = exports.getSubscriptionDetails = exports.createPortalSession = exports.createCheckoutSession = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const stripe_1 = require("stripe");
const examPass_1 = require("./examPass");
const billingConfig_1 = require("./billingConfig");
// Initialize Stripe with secret key from environment variables
// We use a getter to avoid initializing if the key is missing during build
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
 * Creates a Stripe Checkout Session for a subscription.
 */
exports.createCheckoutSession = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    }
    const billingInterval = (0, billingConfig_1.parseBillingInterval)(data === null || data === void 0 ? void 0 : data.billingInterval);
    if (!billingInterval) {
        throw new functions.https.HttpsError('invalid-argument', 'Billing interval must be month or year.');
    }
    try {
        const stripe = getStripe();
        const priceId = (0, billingConfig_1.getSubscriptionPrices)()[billingInterval];
        const urls = (0, billingConfig_1.getCheckoutUrls)();
        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: urls.subscriptionSuccessUrl,
            cancel_url: urls.subscriptionCancelUrl,
            metadata: {
                userId: context.auth.uid,
                billingInterval,
                expectedPriceId: priceId,
            },
            customer_email: context.auth.token.email,
        });
        return { sessionId: session.id, url: session.url };
    }
    catch (error) {
        console.error('Stripe createCheckoutSession error:', error);
        throw new functions.https.HttpsError('internal', 'Unable to create checkout session.');
    }
});
/**
 * Creates a Stripe Customer Portal session for managing subscriptions.
 */
exports.createPortalSession = functions.https.onCall(async (_data, context) => {
    var _a;
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    }
    const userId = context.auth.uid;
    try {
        const db = admin.firestore();
        const userDoc = await db.collection('users').doc(userId).get();
        const customerId = (_a = userDoc.data()) === null || _a === void 0 ? void 0 : _a.stripeCustomerId;
        if (!customerId) {
            throw new functions.https.HttpsError('failed-precondition', 'No Stripe customer ID found for user.');
        }
        const stripe = getStripe();
        const session = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: (0, billingConfig_1.getCheckoutUrls)().portalReturnUrl,
        });
        return { url: session.url };
    }
    catch (error) {
        console.error("Error creating portal session:", error);
        // Preserve HttpsError codes. This catch used to re-wrap everything as
        // 'internal', including the failed-precondition thrown just above for
        // "no Stripe customer" — so the client could not tell "you have never
        // been billed" from "something broke" and showed a generic retry error
        // to users for whom retrying can never work.
        if (error instanceof functions.https.HttpsError)
            throw error;
        throw new functions.https.HttpsError('internal', error.message);
    }
});
/**
 * Retrieves subscription details for the authenticated user.
 */
exports.getSubscriptionDetails = functions.https.onCall(async (data, context) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    const userId = context.auth.uid;
    const db = admin.firestore();
    const userDoc = await db.collection('users').doc(userId).get();
    const customerId = (_a = userDoc.data()) === null || _a === void 0 ? void 0 : _a.stripeCustomerId;
    if (!customerId)
        return { status: 'none', isPro: false };
    try {
        const stripe = getStripe();
        const subscriptions = await stripe.subscriptions.list({
            customer: customerId,
            status: 'all',
            expand: ['data.default_payment_method'],
            limit: 1,
        });
        if (subscriptions.data.length === 0)
            return { status: 'none', isPro: false };
        const sub = subscriptions.data[0];
        const item = (_c = (_b = sub.items) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c[0];
        const paymentMethod = sub.default_payment_method;
        // Map Stripe SKU to readable name
        // MVP: Assuming single plan type or mapping by amount
        const planName = (sub.items.data[0].price.unit_amount || 0) > 2000 ? 'Yearly Pro' : 'Monthly Pro';
        // current_period_end moved OFF the subscription and onto the subscription
        // ITEM in recent Stripe API versions (we construct the SDK with
        // 2025-11-17.clover). Reading the old top-level field returned undefined,
        // which the client rendered as "Access ends December 31, 1969" — epoch 0.
        // Prefer the item, fall back to the legacy field, then to cancel_at.
        const periodEnd = (_f = (_e = (_d = item === null || item === void 0 ? void 0 : item.current_period_end) !== null && _d !== void 0 ? _d : sub.current_period_end) !== null && _e !== void 0 ? _e : sub.cancel_at) !== null && _f !== void 0 ? _f : null;
        return {
            status: sub.status,
            currentPeriodEnd: periodEnd,
            cancelAtPeriodEnd: sub.cancel_at_period_end,
            planName: planName,
            last4: ((_g = paymentMethod === null || paymentMethod === void 0 ? void 0 : paymentMethod.card) === null || _g === void 0 ? void 0 : _g.last4) || '••••',
            brand: ((_h = paymentMethod === null || paymentMethod === void 0 ? void 0 : paymentMethod.card) === null || _h === void 0 ? void 0 : _h.brand) || 'card',
            amount: (sub.items.data[0].price.unit_amount || 0) / 100,
            interval: (_j = sub.items.data[0].price.recurring) === null || _j === void 0 ? void 0 : _j.interval,
            subscriptionId: sub.id
        };
    }
    catch (error) {
        console.error("Error fetching subscription:", error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});
/**
 * Cancels the user's subscription at the end of the billing period.
 */
exports.cancelSubscription = functions.https.onCall(async (data, context) => {
    var _a;
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    const userId = context.auth.uid;
    const { subscriptionId } = data;
    if (!subscriptionId)
        throw new functions.https.HttpsError('invalid-argument', 'Subscription ID required.');
    try {
        const stripe = getStripe();
        // OPTIONAL: Verify ownership? 
        // Stripe doesn't inherently check if `subscriptionId` belongs to `userId` unless we fetch customer first.
        // For robustness, getting the customer ID from user doc is safer.
        const db = admin.firestore();
        const userDoc = await db.collection('users').doc(userId).get();
        const customerId = (_a = userDoc.data()) === null || _a === void 0 ? void 0 : _a.stripeCustomerId;
        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        if (sub.customer !== customerId) {
            throw new functions.https.HttpsError('permission-denied', 'Subscription does not belong to user.');
        }
        const updatedSub = await stripe.subscriptions.update(subscriptionId, {
            cancel_at_period_end: true,
        });
        // Update local DB status if desired, or wait for webhook
        await db.collection('users').doc(userId).set({
            subscriptionStatus: 'canceling'
        }, { merge: true });
        return { status: updatedSub.status, cancelAtPeriodEnd: updatedSub.cancel_at_period_end };
    }
    catch (error) {
        console.error("Error canceling subscription:", error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});
exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
    var _a;
    const signature = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!endpointSecret || !signature) {
        console.error("Missing Stripe Webhook Secret or Signature");
        res.status(400).send("Webhook Error: Missing config.");
        return;
    }
    let event;
    try {
        const stripe = getStripe();
        // Verify the event came from Stripe
        event = stripe.webhooks.constructEvent(req.rawBody, signature, endpointSecret);
    }
    catch (err) {
        console.error(`Webhook Signature Verification Failed: ${err.message}`);
        res.status(400).send(`Webhook Error: ${err.message}`);
        return;
    }
    // Idempotency: Stripe retries deliveries, and the handlers below are not
    // all safe to re-run (subscription-deleted does a user lookup + write).
    //
    // A plain check-then-write is not atomic: two concurrent deliveries of the
    // same event can both read "not seen" and both process it. Instead we
    // atomically CLAIM the event in a transaction (create a marker with
    // status 'processing' iff it does not already exist). Only one invocation
    // wins the claim; the rest short-circuit. After the handlers succeed we
    // flip the marker to 'done'; if they throw we delete the claim so Stripe's
    // retry re-processes the event (marker is never left as a false "done").
    const db = admin.firestore();
    const eventRef = db.collection('stripe_events').doc(event.id);
    let claimed = false;
    try {
        claimed = await db.runTransaction(async (tx) => {
            const seen = await tx.get(eventRef);
            if (seen.exists)
                return false;
            tx.set(eventRef, {
                type: event.type,
                status: 'processing',
                claimedAt: admin.firestore.FieldValue.serverTimestamp(),
                // expiresAt supports a Firestore TTL policy on
                // stripe_events.expiresAt (Stripe retries span days, 30d is plenty).
                expiresAt: admin.firestore.Timestamp.fromMillis(Date.now() + 30 * 24 * 60 * 60 * 1000),
            });
            return true;
        });
    }
    catch (err) {
        // Fail-open: better to risk a duplicate than to drop an event.
        console.warn("Stripe event claim transaction failed, processing anyway:", err);
        claimed = true;
    }
    if (!claimed) {
        console.log(`Skipping already-processed Stripe event ${event.id} (${event.type})`);
        res.json({ received: true, duplicate: true });
        return;
    }
    // Handle the event
    try {
        switch (event.type) {
            case 'checkout.session.completed':
                const session = event.data.object;
                if (((_a = session.metadata) === null || _a === void 0 ? void 0 : _a.type) === 'exam-pass') {
                    // One-time 90-day Exam Pass purchase (docs/exam-pass-spec.md).
                    await (0, examPass_1.fulfillExamPassCheckout)(session);
                }
                else {
                    await handleCheckoutSessionCompleted(session, getStripe());
                }
                break;
            case 'customer.subscription.deleted':
                const sub = event.data.object;
                await handleSubscriptionDeleted(sub);
                break;
            default:
                console.log(`Unhandled event type ${event.type}`);
        }
        // Handlers succeeded — finalize the claim.
        await eventRef.set({
            status: 'done',
            processedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        res.json({ received: true });
    }
    catch (error) {
        console.error("Error processing webhook:", error);
        // Release the claim so Stripe's retry can re-process this event.
        // Swallow cleanup errors: the 500 below already triggers a retry, and
        // a stale 'processing' marker will simply block that retry — we prefer
        // surfacing the original failure to the log.
        try {
            await eventRef.delete();
        }
        catch (cleanupErr) {
            console.error("Failed to release Stripe event claim after error:", cleanupErr);
        }
        res.status(500).send("Internal Server Error");
    }
});
async function handleCheckoutSessionCompleted(session, stripe) {
    var _a, _b, _c, _d;
    const userId = (_a = session.metadata) === null || _a === void 0 ? void 0 : _a.userId;
    if (!userId || !isValidUid(userId)) {
        throw new Error(`Refusing Pro grant for invalid user metadata on session ${session.id}`);
    }
    if (session.mode !== 'subscription' ||
        session.status !== 'complete' ||
        session.payment_status !== 'paid' ||
        typeof session.subscription !== 'string' ||
        typeof session.customer !== 'string') {
        throw new Error(`Refusing Pro grant for incomplete subscription session ${session.id}`);
    }
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 1 });
    const actualPriceId = (_c = (_b = lineItems.data[0]) === null || _b === void 0 ? void 0 : _b.price) === null || _c === void 0 ? void 0 : _c.id;
    const allowedPriceIds = Object.values((0, billingConfig_1.getSubscriptionPrices)());
    if (!actualPriceId || !allowedPriceIds.includes(actualPriceId)) {
        throw new Error(`Refusing Pro grant for unexpected Stripe price on session ${session.id}`);
    }
    if (((_d = session.metadata) === null || _d === void 0 ? void 0 : _d.expectedPriceId) !== actualPriceId) {
        throw new Error(`Refusing Pro grant for mismatched Stripe metadata on session ${session.id}`);
    }
    const db = admin.firestore();
    const userRef = db.collection('users').doc(userId);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
        throw new Error(`Refusing Pro grant: no user document for ${userId}`);
    }
    console.log(`Granting Pro access to user ${userId}`);
    await userRef.set({
        isPro: true,
        plan: 'pro',
        trial: false,
        trialConsumed: true,
        access: 'paid',
        accessLevel: 'pro',
        stripeCustomerId: session.customer,
        subscriptionStatus: 'active',
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
}
// Firebase Auth UIDs are 1–128 chars. Reject anything with path-breaking or
// obviously non-UID characters before using the value as a Firestore doc id.
function isValidUid(uid) {
    return typeof uid === 'string'
        && uid.length > 0
        && uid.length <= 128
        && !uid.includes('/');
}
async function handleSubscriptionDeleted(sub) {
    // Ideally we find the user by stripeCustomerId
    // For MVP, if we don't have a direct mapping easily accessible without querying, 
    // we might need to query users by stripeCustomerId.
    const customerId = sub.customer;
    const db = admin.firestore();
    const usersSnap = await db.collection('users').where('stripeCustomerId', '==', customerId).limit(1).get();
    if (!usersSnap.empty) {
        const userDoc = usersSnap.docs[0];
        console.log(`Revoking Pro access for user ${userDoc.id}`);
        await userDoc.ref.set({
            isPro: false,
            plan: 'starter',
            trial: false,
            access: 'free',
            accessLevel: 'free',
            subscriptionStatus: 'canceled',
            lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
    }
    else {
        console.warn(`No user found for customer ID ${customerId} during subscription deletion.`);
    }
}
//# sourceMappingURL=stripe.js.map