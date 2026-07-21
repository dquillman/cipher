"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateQuizStart = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const freeTier_1 = require("./freeTier");
const entitlement_1 = require("./entitlement");
const db = admin.firestore();
// minInstances: 1 keeps one warm instance — this callable gates EVERY quiz
// start, so a cold start here adds 1-3s to question load for the first user
// after any idle period. Costs roughly $4-6/month at 256MB; cut it back to 0
// if that ever matters more than the latency.
exports.validateQuizStart = functions
    .runWith({ minInstances: 1 })
    .https.onCall(async (_data, context) => {
    var _a, _b, _c, _d, _e, _f;
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }
    const uid = context.auth.uid;
    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data();
    if ((0, entitlement_1.resolveProAccess)(userData)) {
        return { allowed: true };
    }
    // Free-tier cap — 20/day during the 7-day taste window
    // (post-signup or post-trial-end, whichever is later), then 5/day.
    // See ./freeTier.ts for policy. MUST match web/src/utils/freeTier.ts.
    const accountCreatedAt = (_c = (_b = (_a = userData === null || userData === void 0 ? void 0 : userData.createdAt) === null || _a === void 0 ? void 0 : _a.toDate) === null || _b === void 0 ? void 0 : _b.call(_a)) !== null && _c !== void 0 ? _c : null;
    const trialEndsAt = (_f = (_e = (_d = userData === null || userData === void 0 ? void 0 : userData.trialEndsAt) === null || _d === void 0 ? void 0 : _d.toDate) === null || _e === void 0 ? void 0 : _e.call(_d)) !== null && _f !== void 0 ? _f : null;
    const dailyLimit = (0, freeTier_1.getFreeTierDailyLimit)({ accountCreatedAt, trialEndsAt });
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
            totalAnswered += answers.filter(answer => (answer === null || answer === void 0 ? void 0 : answer.selectedOption) !== undefined).length;
        }
    });
    if (totalAnswered >= dailyLimit) {
        return { allowed: false, reason: 'daily_limit', used: totalAnswered, limit: dailyLimit };
    }
    return { allowed: true, remaining: dailyLimit - totalAnswered };
});
//# sourceMappingURL=validateQuizStart.js.map