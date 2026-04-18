"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripeWebhook = exports.cancelSubscription = exports.getSubscriptionDetails = exports.createPortalSession = exports.createCheckoutSession = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const stripe_1 = require("stripe");
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
    const userId = context.auth.uid;
    const { priceId, successUrl, cancelUrl } = data;
    if (!priceId) {
        throw new functions.https.HttpsError('invalid-argument', 'Price ID is required.');
    }
    try {
        const stripe = getStripe();
        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            success_url: successUrl,
            cancel_url: cancelUrl,
            metadata: {
                userId: userId,
            },
            customer_email: context.auth.token.email, // Pre-fill email
        });
        return { sessionId: session.id, url: session.url };
    }
    catch (error) {
        console.error("Stripe createCheckoutSession error:", error);
        throw new functions.https.HttpsError('internal', error.message || 'Unable to create checkout session.');
    }
});
/**
 * Creates a Stripe Customer Portal session for managing subscriptions.
 */
exports.createPortalSession = functions.https.onCall(async (data, context) => {
    var _a;
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    }
    const { returnUrl } = data;
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
            return_url: returnUrl || 'https://exam-coach-ai-platform.web.app/pricing',
        });
        return { url: session.url };
    }
    catch (error) {
        console.error("Error creating portal session:", error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});
/**
 * Retrieves subscription details for the authenticated user.
 */
exports.getSubscriptionDetails = functions.https.onCall(async (data, context) => {
    var _a, _b, _c, _d;
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
        const paymentMethod = sub.default_payment_method;
        // Map Stripe SKU to readable name
        // MVP: Assuming single plan type or mapping by amount
        const planName = (sub.items.data[0].price.unit_amount || 0) > 2000 ? 'Yearly Pro' : 'Monthly Pro';
        return {
            status: sub.status,
            currentPeriodEnd: sub.current_period_end,
            cancelAtPeriodEnd: sub.cancel_at_period_end,
            planName: planName,
            last4: ((_b = paymentMethod === null || paymentMethod === void 0 ? void 0 : paymentMethod.card) === null || _b === void 0 ? void 0 : _b.last4) || '••••',
            brand: ((_c = paymentMethod === null || paymentMethod === void 0 ? void 0 : paymentMethod.card) === null || _c === void 0 ? void 0 : _c.brand) || 'card',
            amount: (sub.items.data[0].price.unit_amount || 0) / 100,
            interval: (_d = sub.items.data[0].price.recurring) === null || _d === void 0 ? void 0 : _d.interval,
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
    // Handle the event
    try {
        switch (event.type) {
            case 'checkout.session.completed':
                const session = event.data.object;
                await handleCheckoutSessionCompleted(session);
                break;
            case 'customer.subscription.deleted':
                const sub = event.data.object;
                await handleSubscriptionDeleted(sub);
                break;
            default:
                console.log(`Unhandled event type ${event.type}`);
        }
        res.json({ received: true });
    }
    catch (error) {
        console.error("Error processing webhook:", error);
        res.status(500).send("Internal Server Error");
    }
});
async function handleCheckoutSessionCompleted(session) {
    var _a;
    const userId = (_a = session.metadata) === null || _a === void 0 ? void 0 : _a.userId;
    const customerId = session.customer;
    if (!userId) {
        console.error("No userId in session metadata:", session.id);
        return;
    }
    console.log(`Granting Pro access to user ${userId}`);
    // Update user document
    const db = admin.firestore();
    await db.collection('users').doc(userId).set({
        isPro: true,
        stripeCustomerId: customerId,
        subscriptionStatus: 'active',
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
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
            subscriptionStatus: 'canceled',
            lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
    }
    else {
        console.warn(`No user found for customer ID ${customerId} during subscription deletion.`);
    }
}
//# sourceMappingURL=stripe.js.map