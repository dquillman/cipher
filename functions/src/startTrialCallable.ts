import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

export const startTrial = functions.https.onCall(async (_data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }

    const uid = context.auth.uid;
    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data();

    // Block if trial was already consumed
    if (userData?.trialConsumed === true) {
        throw new functions.https.HttpsError('failed-precondition', 'Trial already used');
    }

    // Block if already Pro (paid)
    if (userData?.isPro === true && userData?.trial !== true) {
        throw new functions.https.HttpsError('failed-precondition', 'Already on Pro plan');
    }

    const now = new Date();
    const endDate = new Date();
    endDate.setDate(now.getDate() + 14);

    await db.collection('users').doc(uid).update({
        plan: 'pro',
        trial: true,
        trialStartedAt: admin.firestore.FieldValue.serverTimestamp(),
        trialEndsAt: admin.firestore.Timestamp.fromDate(endDate),
        trialLengthDays: 14,
        trialConsumed: true,
        accessLevel: 'pro'
    });

    console.log(`Trial started for user ${uid}, expires ${endDate.toISOString()}`);
    return { success: true, trialEndsAt: endDate.toISOString() };
});
