"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateQuizStart = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const freeTier_1 = require("./freeTier");
const entitlement_1 = require("./entitlement");
const usageLedger_1 = require("./usageLedger");
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
    // Read the count from the server-written ledger, NOT by scanning quizRuns.
    // quizRuns is owned by this user, so the old scan (a) counted only runs with
    // completedAt, letting "Quit & Save" hide answered questions forever, and
    // (b) could be zeroed by deleting the runs. usageCounters is Admin-SDK-only
    // and monotonic per day — see usageLedger.ts.
    const totalAnswered = await (0, usageLedger_1.getAnsweredToday)(uid);
    if (totalAnswered >= dailyLimit) {
        return { allowed: false, reason: 'daily_limit', used: totalAnswered, limit: dailyLimit };
    }
    return { allowed: true, remaining: dailyLimit - totalAnswered };
});
//# sourceMappingURL=validateQuizStart.js.map