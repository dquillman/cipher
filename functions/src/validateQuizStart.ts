import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { getFreeTierDailyLimit } from './freeTier';

const db = admin.firestore();

export const validateQuizStart = functions.https.onCall(async (_data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }

    const uid = context.auth.uid;
    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data();

    // Pro users bypass daily limit
    const isPro = userData?.isPro === true || userData?.plan === 'pro';
    const isTrialActive = userData?.trial === true && userData?.trialEndsAt?.toDate() > new Date();
    const isTester = userData?.testerOverride === true && (!userData?.testerExpiresAt || userData?.testerExpiresAt.toDate() > new Date());

    if (isPro || isTrialActive || isTester) {
        return { allowed: true };
    }

    // Free-tier cap — 20/day during the 7-day taste window
    // (post-signup or post-trial-end, whichever is later), then 5/day.
    // See ./freeTier.ts for policy. MUST match web/src/utils/freeTier.ts.
    const accountCreatedAt = userData?.createdAt?.toDate?.() ?? null;
    const trialEndsAt = userData?.trialEndsAt?.toDate?.() ?? null;
    const dailyLimit = getFreeTierDailyLimit({ accountCreatedAt, trialEndsAt });

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
            totalAnswered += answers.filter((a: any) => a?.selectedOption !== undefined).length;
        }
    });

    if (totalAnswered >= dailyLimit) {
        return { allowed: false, reason: 'daily_limit', used: totalAnswered, limit: dailyLimit };
    }

    return { allowed: true, remaining: dailyLimit - totalAnswered };
});
