"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateQuizStart = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const freeTier_1 = require("./freeTier");
const db = admin.firestore();
exports.validateQuizStart = functions.https.onCall(async (_data, context) => {
    var _a, _b, _c, _d, _e, _f, _g;
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
    // Free-tier cap — 20/day during the 7-day taste window
    // (post-signup or post-trial-end, whichever is later), then 5/day.
    // See ./freeTier.ts for policy. MUST match web/src/utils/freeTier.ts.
    const accountCreatedAt = (_d = (_c = (_b = userData === null || userData === void 0 ? void 0 : userData.createdAt) === null || _b === void 0 ? void 0 : _b.toDate) === null || _c === void 0 ? void 0 : _c.call(_b)) !== null && _d !== void 0 ? _d : null;
    const trialEndsAt = (_g = (_f = (_e = userData === null || userData === void 0 ? void 0 : userData.trialEndsAt) === null || _e === void 0 ? void 0 : _e.toDate) === null || _f === void 0 ? void 0 : _f.call(_e)) !== null && _g !== void 0 ? _g : null;
    const dailyLimit = (0, freeTier_1.getFreeTierDailyLimit)({ accountCreatedAt, trialEndsAt });
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
    if (totalAnswered >= dailyLimit) {
        return { allowed: false, reason: 'daily_limit', used: totalAnswered, limit: dailyLimit };
    }
    return { allowed: true, remaining: dailyLimit - totalAnswered };
});
//# sourceMappingURL=validateQuizStart.js.map