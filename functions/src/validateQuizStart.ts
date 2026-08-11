import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { getFreeTierDailyLimit } from './freeTier';
import { resolveProAccess } from './entitlement';
import { getAnsweredToday } from './usageLedger';

const db = admin.firestore();

// minInstances: 1 keeps one warm instance — this callable gates EVERY quiz
// start, so a cold start here adds 1-3s to question load for the first user
// after any idle period. Costs roughly $4-6/month at 256MB; cut it back to 0
// if that ever matters more than the latency.
export const validateQuizStart = functions
    .runWith({ minInstances: 1 })
    .https.onCall(async (_data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }

    const uid = context.auth.uid;
    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data();

    if (resolveProAccess(userData)) {
        return { allowed: true };
    }

    // Free-tier cap — 20/day during the 7-day taste window
    // (post-signup or post-trial-end, whichever is later), then 5/day.
    // See ./freeTier.ts for policy. MUST match web/src/utils/freeTier.ts.
    const accountCreatedAt = userData?.createdAt?.toDate?.() ?? null;
    const trialEndsAt = userData?.trialEndsAt?.toDate?.() ?? null;
    const dailyLimit = getFreeTierDailyLimit({ accountCreatedAt, trialEndsAt });

    // Read the count from the server-written ledger, NOT by scanning quizRuns.
    // quizRuns is owned by this user, so the old scan (a) counted only runs with
    // completedAt, letting "Quit & Save" hide answered questions forever, and
    // (b) could be zeroed by deleting the runs. usageCounters is Admin-SDK-only
    // and monotonic per day — see usageLedger.ts.
    const totalAnswered = await getAnsweredToday(uid);

    if (totalAnswered >= dailyLimit) {
        return { allowed: false, reason: 'daily_limit', used: totalAnswered, limit: dailyLimit };
    }

    return { allowed: true, remaining: dailyLimit - totalAnswered };
});
