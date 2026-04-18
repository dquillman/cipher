import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import Stripe from "stripe";



// Initialize Stripe with secret key from environment variables
// We use a getter to avoid initializing if the key is missing during build
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
 * Creates a Stripe Checkout Session for a subscription.
 */
export const createCheckoutSession = functions.https.onCall(async (data, context) => {
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
    } catch (error: any) {
        console.error("Stripe createCheckoutSession error:", error);
        throw new functions.https.HttpsError('internal', error.message || 'Unable to create checkout session.');
    }
});

/**
 * Creates a Stripe Customer Portal session for managing subscriptions.
 */
export const createPortalSession = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    }

    const { returnUrl } = data;
    const userId = context.auth.uid;

    try {
        const db = admin.firestore();
        const userDoc = await db.collection('users').doc(userId).get();
        const customerId = userDoc.data()?.stripeCustomerId;

        if (!customerId) {
            throw new functions.https.HttpsError('failed-precondition', 'No Stripe customer ID found for user.');
        }

        const stripe = getStripe();
        const session = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: returnUrl || 'https://exam-coach-ai-platform.web.app/pricing',
        });

        return { url: session.url };
    } catch (error: any) {
        console.error("Error creating portal session:", error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});

/**
 * Retrieves subscription details for the authenticated user.
 */
export const getSubscriptionDetails = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');

    const userId = context.auth.uid;
    const db = admin.firestore();
    const userDoc = await db.collection('users').doc(userId).get();
    const customerId = userDoc.data()?.stripeCustomerId;

    if (!customerId) return { status: 'none', isPro: false };

    try {
        const stripe = getStripe();
        const subscriptions = await stripe.subscriptions.list({
            customer: customerId,
            status: 'all',
            expand: ['data.default_payment_method'],
            limit: 1,
        });

        if (subscriptions.data.length === 0) return { status: 'none', isPro: false };

        const sub: any = subscriptions.data[0];
        const paymentMethod = sub.default_payment_method as Stripe.PaymentMethod | undefined;

        // Map Stripe SKU to readable name
        // MVP: Assuming single plan type or mapping by amount
        const planName = (sub.items.data[0].price.unit_amount || 0) > 2000 ? 'Yearly Pro' : 'Monthly Pro';

        return {
            status: sub.status,
            currentPeriodEnd: sub.current_period_end,
            cancelAtPeriodEnd: sub.cancel_at_period_end,
            planName: planName, // "Monthly Pro" or "Yearly Pro"
            last4: paymentMethod?.card?.last4 || '••••',
            brand: paymentMethod?.card?.brand || 'card',
            amount: (sub.items.data[0].price.unit_amount || 0) / 100,
            interval: sub.items.data[0].price.recurring?.interval,
            subscriptionId: sub.id
        };
    } catch (error: any) {
        console.error("Error fetching subscription:", error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});

/**
 * Cancels the user's subscription at the end of the billing period.
 */
export const cancelSubscription = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');

    const userId = context.auth.uid;
    const { subscriptionId } = data;

    if (!subscriptionId) throw new functions.https.HttpsError('invalid-argument', 'Subscription ID required.');

    try {
        const stripe = getStripe();

        // OPTIONAL: Verify ownership? 
        // Stripe doesn't inherently check if `subscriptionId` belongs to `userId` unless we fetch customer first.
        // For robustness, getting the customer ID from user doc is safer.
        const db = admin.firestore();
        const userDoc = await db.collection('users').doc(userId).get();
        const customerId = userDoc.data()?.stripeCustomerId;

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

    } catch (error: any) {
        console.error("Error canceling subscription:", error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});
export const stripeWebhook = functions.https.onRequest(async (req, res) => {
    const signature = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!endpointSecret || !signature) {
        console.error("Missing Stripe Webhook Secret or Signature");
        res.status(400).send("Webhook Error: Missing config.");
        return;
    }

    let event: Stripe.Event;

    try {
        const stripe = getStripe();
        // Verify the event came from Stripe
        event = stripe.webhooks.constructEvent(
            req.rawBody,
            signature,
            endpointSecret
        );
    } catch (err: any) {
        console.error(`Webhook Signature Verification Failed: ${err.message}`);
        res.status(400).send(`Webhook Error: ${err.message}`);
        return;
    }

    // Handle the event
    try {
        switch (event.type) {
            case 'checkout.session.completed':
                const session = event.data.object as Stripe.Checkout.Session;
                await handleCheckoutSessionCompleted(session);
                break;
            case 'customer.subscription.deleted':
                const sub = event.data.object as Stripe.Subscription;
                await handleSubscriptionDeleted(sub);
                break;
            default:
                console.log(`Unhandled event type ${event.type}`);
        }
        res.json({ received: true });
    } catch (error) {
        console.error("Error processing webhook:", error);
        res.status(500).send("Internal Server Error");
    }
});

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
    const userId = session.metadata?.userId;
    const customerId = session.customer as string;

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

async function handleSubscriptionDeleted(sub: Stripe.Subscription) {
    // Ideally we find the user by stripeCustomerId
    // For MVP, if we don't have a direct mapping easily accessible without querying, 
    // we might need to query users by stripeCustomerId.
    const customerId = sub.customer as string;
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
    } else {
        console.warn(`No user found for customer ID ${customerId} during subscription deletion.`);
    }
}
