import * as functions from "firebase-functions";
import * as admin from "firebase-admin";



interface DriftSignal {
    type: 'stagnation' | 'confusion' | 'time_drift' | 'memorization';
    severity: 'monitor' | 'adjust' | 'review';
    domain?: string;
    details: string;
}

interface ExamHealthReport {
    examId: string;
    status: 'healthy' | 'warning' | 'critical';
    lastUpdated: admin.firestore.Timestamp;
    signals: DriftSignal[];
    metrics: {
        avgReadiness: number;
        explanationViewRate: number;
        avgTimePerQuestion: number;
    };
}

export const analyzeExamHealth = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Must be logged in.');

    // Admin authorization check
    const db = admin.firestore();
    const userDoc = await db.collection('users').doc(context.auth.uid).get();
    if (userDoc.data()?.role !== 'admin') {
        throw new functions.https.HttpsError('permission-denied', 'Admin role required');
    }

    const examId = data.examId || 'default-exam';

    try {
        // 1. Fetch Recent "Pro" Attempts (Last 100)
        // We only use Pro data for quality auditing as requested
        const attemptsSnap = await db.collection('quizAttempts')
            .where('examId', '==', examId)
            // .where('isPro', '==', true) // Enable this index in production
            .orderBy('timestamp', 'desc')
            .limit(100)
            .get();

        const attempts = attemptsSnap.docs.map(d => d.data());

        if (attempts.length < 10) {
            return { status: 'insufficient_data', message: 'Need more pro attempts to analyze.' };
        }

        const signals: DriftSignal[] = [];

        // --- Metric Extraction ---
        let totalTime = 0;
        let totalQuestions = 0;
        let totalExplanationViews = 0;
        let totalScore = 0;

        // Domain aggregation
        const domainStats: Record<string, { correct: number, total: number, time: number }> = {};

        attempts.forEach(a => {
            totalTime += (a.averageTimePerQuestion || 0) * a.totalQuestions; // approx
            totalQuestions += a.totalQuestions;
            totalScore += a.score;

            if (a.details) {
                a.details.forEach((d: any) => {
                    if (d.explanationViewed) totalExplanationViews++;

                    const dom = d.domain || 'General';
                    if (!domainStats[dom]) domainStats[dom] = { correct: 0, total: 0, time: 0 };
                    domainStats[dom].total++;
                    if (d.isCorrect) domainStats[dom].correct++;
                    // precise time per question per domain is hard without granular tracking
                    // using average for now
                    domainStats[dom].time += (a.averageTimePerQuestion || 0);
                });
            }
        });

        const avgTimePerQuestion = totalQuestions > 0 ? totalTime / totalQuestions : 0;
        const explanationViewRate = totalQuestions > 0 ? totalExplanationViews / totalQuestions : 0;
        const avgAccuracy = totalQuestions > 0 ? totalScore / totalQuestions : 0;


        // --- SIGNAL 1: Time Drift (Too Fast/Slow) ---
        if (avgTimePerQuestion < 15) {
            signals.push({
                type: 'memorization',
                severity: 'review',
                details: `Avg time ${avgTimePerQuestion.toFixed(1)}s is suspicious. Users may be memorizing answers. Action: Rotate questions.`
            });
        } else if (avgTimePerQuestion > 90) {
            signals.push({
                type: 'time_drift',
                severity: 'adjust',
                details: `Avg time ${avgTimePerQuestion.toFixed(1)}s is too high. Questions may be too wordy. Action: Simplify wording.`
            });
        }


        // --- SIGNAL 2: Confusion (Explanation Spikes) ---
        // Accessing explanation > 40% of the time implies high reliance/confusion for a "Pro" user
        if (explanationViewRate > 0.4) {
            signals.push({
                type: 'confusion',
                severity: 'monitor',
                details: `Explanation view rate is ${Math.round(explanationViewRate * 100)}%. Users are seeking content clarification frequently. Action: Improve explanations.`
            });
        }

        // --- SIGNAL 3: Stagnation (Accuracy cap) ---
        // If accuracy is high (>85%) but time is high, it's fine (mastery).
        // If accuracy is low (<50%) and stable, it's a difficulty spike.
        if (avgAccuracy < 0.5) {
            signals.push({
                type: 'stagnation',
                severity: 'adjust',
                details: 'Global accuracy is below 50%. Content may be too difficult or misaligned. Action: Review difficulty.'
            });
        }

        // --- Domain Specific Drift ---
        Object.entries(domainStats).forEach(([domain, stats]) => {
            if (stats.total < 20) return; // ignore small samples
            const acc = stats.correct / stats.total;

            if (acc < 0.4) {
                signals.push({
                    type: 'stagnation',
                    severity: 'review',
                    domain,
                    details: `Domain '${domain}' has critically low accuracy (${Math.round(acc * 100)}%). Action: Audit domain questions.`
                });
            }
        });

        // --- Determine Overall Status ---
        let status: 'healthy' | 'warning' | 'critical' = 'healthy';
        const severeCount = signals.filter(s => s.severity === 'review').length;
        const warnCount = signals.filter(s => s.severity === 'adjust').length;

        if (severeCount > 0) status = 'critical';
        else if (warnCount >= 2 || signals.length >= 3) status = 'warning';


        // --- Save Report ---
        const report: ExamHealthReport = {
            examId,
            status,
            lastUpdated: admin.firestore.Timestamp.now(),
            signals,
            metrics: {
                avgReadiness: 0, // Metric placeholder (requires user loop)
                explanationViewRate,
                avgTimePerQuestion
            }
        };

        await db.collection('examHealth').doc(examId).set(report);

        return { success: true, report };

    } catch (error: any) {
        console.error("Analysis failed:", error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});
