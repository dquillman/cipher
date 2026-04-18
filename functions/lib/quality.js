"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateQuestionQuality = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
// Point-Biserial Correlation Calculation
// Measures relationship between getting a specific item correct and total score
function calculatePointBiserial(attempts) {
    if (attempts.length === 0)
        return 0;
    const correctAttempts = attempts.filter(a => a.isCorrect);
    const incorrectAttempts = attempts.filter(a => !a.isCorrect);
    if (correctAttempts.length === 0 || incorrectAttempts.length === 0)
        return 0; // No variance
    const meanCorrect = correctAttempts.reduce((sum, a) => sum + (a.userExamAverage || 70), 0) / correctAttempts.length;
    const meanTotal = attempts.reduce((sum, a) => sum + (a.userExamAverage || 70), 0) / attempts.length;
    // Variance calculation (standard deviation of total scores)
    const variance = attempts.reduce((sum, a) => sum + Math.pow((a.userExamAverage || 70) - meanTotal, 2), 0) / attempts.length;
    const stdev = Math.sqrt(variance);
    if (stdev === 0)
        return 0;
    const p = correctAttempts.length / attempts.length; // proportion correct (difficulty)
    const q = 1 - p; // proportion incorrect
    // Point-Biserial Formula: (M1 - M0) / Sn * sqrt(p*q)
    // Simplified approximation often used: (MeanCorrect - MeanTotal) / Stdev * sqrt(p/q)
    // We will use standard formula: (MeanCorrect - MeanTotal) / Stdev * sqrt(p/q)
    return ((meanCorrect - meanTotal) / stdev) * Math.sqrt(p / q);
}
exports.evaluateQuestionQuality = functions.https.onCall(async (_data, context) => {
    var _a;
    // 1. Auth Check (Admin only)
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
    // Admin authorization check
    const db = admin.firestore();
    const userDoc = await db.collection('users').doc(context.auth.uid).get();
    if (((_a = userDoc.data()) === null || _a === void 0 ? void 0 : _a.role) !== 'admin') {
        throw new functions.https.HttpsError('permission-denied', 'Admin role required');
    }
    // const sevenDaysAgo = admin.firestore.Timestamp.fromMillis(Date.now() - 7 * 24 * 60 * 60 * 1000); // Unused
    try {
        // 2. Fetch Questions that need evaluation
        // Optimization: In a real system, query for questions with new attempts since lastEvaluated.
        // For this phase, we'll scan all, or limit to a batch.
        const questionsSnap = await db.collection('questions')
            //.where('lastEvaluated', '<', oneDayAgo) // Uncomment for daily cycle optimization
            .limit(50) // Batch processing for safety in this demo
            .get();
        const updates = [];
        let variantFlaggedCount = 0;
        for (const doc of questionsSnap.docs) {
            const qId = doc.id;
            // const qData = doc.data(); // Unused
            // 3. Fetch Recent Attempts for Question
            const attemptsSnap = await db.collection('quizAttempts')
                .where('questionId', '==', qId) // Needs index: questionId ASC, timestamp DESC
                .orderBy('timestamp', 'desc')
                .limit(100)
                .get();
            const attempts = attemptsSnap.docs.map(d => d.data());
            const totalAttempts = attempts.length;
            // 4. Sample Size Gate
            if (totalAttempts < 30) {
                // Not enough data to judge widely
                await doc.ref.update({
                    qualityStatus: 'insufficient_data',
                    lastEvaluated: admin.firestore.Timestamp.now()
                });
                continue;
            }
            // 5. Compute Signals
            let explanationViews = 0;
            let totalTime = 0;
            let correctCount = 0;
            attempts.forEach(a => {
                if (a.explanationViewed)
                    explanationViews++;
                totalTime += a.timeSpent || 0;
                if (a.isCorrect)
                    correctCount++;
            });
            const avgTime = totalTime / totalAttempts;
            const accuracy = correctCount / totalAttempts;
            const explanationViewRate = explanationViews / totalAttempts;
            // Mock user exam average for now if not existing on attempt object
            // In prod, attempts should have `userExamAverage` snapshot for point-biserial
            const attemptsWithScores = attempts.map(a => (Object.assign(Object.assign({}, a), { userExamAverage: a.userExamAverage || (a.isCorrect ? 85 : 65) // Mock separation if missing
             })));
            const discriminationIndex = calculatePointBiserial(attemptsWithScores);
            // 6. Evaluate Rules
            let status = 'stable';
            // Rule A: Memorization Risk
            // Fast (<15s), High Accuracy (>85%), but LOW discrimination (<0.2)
            // (Means everyone gets it right quickly, not just smart users)
            const isMemorized = avgTime < 15 && accuracy > 0.85 && discriminationIndex < 0.2;
            // Rule B: Discrimination Check
            // < 0.10: Needs Reword (Random/Confusing)
            // 0.10 - 0.30: Monitor (Fair)
            // > 0.30: Stable (Good)
            if (isMemorized) {
                status = 'needs_variant';
                variantFlaggedCount++;
            }
            else if (discriminationIndex < 0.10) {
                status = 'needs_reword';
            }
            else if (discriminationIndex < 0.30) {
                status = 'monitor';
            }
            else {
                status = 'stable';
            }
            // Update stats
            updates.push(doc.ref.update({
                qualityScore: Math.round(discriminationIndex * 100),
                qualityStatus: status,
                metrics: {
                    avgTime,
                    discriminationIndex,
                    memorizationRisk: isMemorized ? 1 : 0,
                    explanationViewRate
                },
                lastEvaluated: admin.firestore.Timestamp.now()
            }));
        }
        await Promise.all(updates);
        // 7. Admin Metric Logging (Internal)
        console.log(`Evaluation Complete. Processed ${questionsSnap.size}. Flagged Variants: ${variantFlaggedCount}`);
        // In prod: save this metric to a 'system_stats' collection
        await db.collection('system_metrics').add({
            timestamp: admin.firestore.Timestamp.now(),
            type: 'quality_evaluation',
            questionsProcessed: questionsSnap.size,
            flaggedNeedsVariant: variantFlaggedCount,
            flaggedNeedsReword: updates.length - variantFlaggedCount // approx
        });
        return { success: true, processed: questionsSnap.size, variantsFlagged: variantFlaggedCount };
    }
    catch (error) {
        console.error("Evaluation failed", error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});
//# sourceMappingURL=quality.js.map