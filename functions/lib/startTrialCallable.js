"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startTrial = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const db = admin.firestore();
exports.startTrial = functions.https.onCall(async (_data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }
    const uid = context.auth.uid;
    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data();
    // Block if trial was already consumed
    if ((userData === null || userData === void 0 ? void 0 : userData.trialConsumed) === true) {
        throw new functions.https.HttpsError('failed-precondition', 'Trial already used');
    }
    // Block if already Pro (paid)
    if ((userData === null || userData === void 0 ? void 0 : userData.isPro) === true && (userData === null || userData === void 0 ? void 0 : userData.trial) !== true) {
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
//# sourceMappingURL=startTrialCallable.js.map