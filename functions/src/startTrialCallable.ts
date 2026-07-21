import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { resolveProAccess } from './entitlement';

const db = admin.firestore();
const TRIAL_DAYS = 14;

export const startTrial = functions.https.onCall(async (_data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }

    const uid = context.auth.uid;
    const userRef = db.collection('users').doc(uid);
    const endDate = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

    await db.runTransaction(async transaction => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) {
            throw new functions.https.HttpsError('failed-precondition', 'User profile is not ready.');
        }

        const userData = userDoc.data();
        if (userData?.trialConsumed === true || userData?.trial === true) {
            throw new functions.https.HttpsError('failed-precondition', 'Trial already used');
        }
        const accessReason = resolveProAccess(userData);
        if (accessReason === 'paid' || accessReason === 'comped' || accessReason === 'tester') {
            throw new functions.https.HttpsError('failed-precondition', 'Pro access already active');
        }

        transaction.update(userRef, {
            plan: 'trial',
            trial: true,
            trialStartedAt: admin.firestore.FieldValue.serverTimestamp(),
            trialEndsAt: admin.firestore.Timestamp.fromDate(endDate),
            trialLengthDays: TRIAL_DAYS,
            trialConsumed: true,
            access: 'trial',
            accessLevel: 'pro',
        });
    });

    console.log(`Trial started for user ${uid}, expires ${endDate.toISOString()}`);
    return { success: true, trialEndsAt: endDate.toISOString() };
});
