import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();
const DAILY_LIMIT = 5;

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

    if (totalAnswered >= DAILY_LIMIT) {
        return { allowed: false, reason: 'daily_limit', used: totalAnswered, limit: DAILY_LIMIT };
    }

    return { allowed: true, remaining: DAILY_LIMIT - totalAnswered };
});
