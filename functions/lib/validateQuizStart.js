"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateQuizStart = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const db = admin.firestore();
const DAILY_LIMIT = 5;
exports.validateQuizStart = functions.https.onCall(async (_data, context) => {
    var _a;
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }
    const uid = context.auth.uid;
    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data();
    // Pro users bypass daily limit
    const isPro = (userData === null || userData === void 0 ? void 0 : userData.isPro) === true || (userData === null || userData === void 0 ? void 0 : userData.plan) === 'pro';
    const isTrialActive = (userData === null || userData === void 0 ? void 0 : userData.trial) === true && ((_a = userData === null || userData === void 0 ? void 0 : userData.trialEndsAt) === null || _a === void 0 ? void 0 : _a.toDate()) > new Date();
    const isTester = (userData === null || userData === void 0 ? void 0 : userData.testerOverride) === true && (!(userData === null || userData === void 0 ? void 0 : userData.testerExpiresAt) || (userData === null || userData === void 0 ? void 0 : userData.testerExpiresAt.toDate()) > new Date());
    if (isPro || isTrialActive || isTester) {
        return { allowed: true };
    }
    // Count today's answered questions
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = admin.firestore.Timestamp.fromDate(today);
    const runsSnap = await db.collection('quizRuns').doc(uid).collection('runs')
        .where('completedAt', '>=', todayTimestamp)
        .get();
    let totalAnswered = 0;
    runsSnap.forEach(doc => {
        const answers = doc.data().answers;
        if (Array.isArray(answers)) {
            totalAnswered += answers.filter((a) => (a === null || a === void 0 ? void 0 : a.selectedOption) !== undefined).length;
        }
    });
    if (totalAnswered >= DAILY_LIMIT) {
        return { allowed: false, reason: 'daily_limit', used: totalAnswered, limit: DAILY_LIMIT };
    }
    return { allowed: true, remaining: DAILY_LIMIT - totalAnswered };
});
//# sourceMappingURL=validateQuizStart.js.map