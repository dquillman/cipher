"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAnsweredToday = exports.trackAnswerUsage = exports.usageCounterId = exports.usageDayKey = exports.answeredDelta = exports.countAnswered = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
/**
 * Server-authoritative daily usage ledger for the free-tier question cap.
 *
 * THE PROBLEM. The free-tier cap was derived entirely from `quizRuns`, which
 * the metered user owns and can write and delete (firestore.rules:
 * `quizRuns/{uid}/runs/{runId}` allow read, write: if isOwner). Two ways out:
 *   1. validateQuizStart counted only runs with `completedAt` set, and
 *      "Quit & Save" leaves a run in_progress/abandoned forever — so answered
 *      questions in an unfinished run counted as zero, indefinitely.
 *   2. Even a completed run could just be deleted, resetting the count.
 * The quota was enforced against documents the person being limited controls.
 *
 * THE FIX. This trigger watches every write to a quiz run and increments a
 * ledger the user cannot touch: `usageCounters/{uid}_{yyyy-mm-dd}`, writable
 * only by the Admin SDK. The count is MONOTONIC within a day — deleting or
 * shrinking a run never decrements it — so neither exploit works. validateQuizStart
 * reads this ledger instead of scanning quizRuns.
 *
 * "Answered" is counted identically to the old logic: an answer entry with a
 * defined selectedOption. Re-answering the same question (saveProgress dedupes
 * by questionId) does not move the count, because before/after both include it.
 *
 * Cost: one invocation + one increment per answer write, off the user's
 * critical path (async trigger, never blocks the UI). Acceptable for a
 * correctness-critical meter; revisit only if answer volume ever makes it
 * material.
 */
const MS_PER_DAY = 24 * 60 * 60 * 1000;
function countAnswered(data) {
    const answers = data === null || data === void 0 ? void 0 : data.answers;
    if (!Array.isArray(answers))
        return 0;
    return answers.filter((a) => a && a.selectedOption !== undefined).length;
}
exports.countAnswered = countAnswered;
/**
 * How much to add to the ledger for a quiz-run write. Never negative: a shrink
 * (completeRun filtering answers) or a delete (the reset exploit) yields <= 0
 * and adds nothing, which is what makes the day's tally monotonic and therefore
 * un-gameable.
 */
function answeredDelta(before, after) {
    return Math.max(0, countAnswered(after) - countAnswered(before));
}
exports.answeredDelta = answeredDelta;
/** UTC date, matching validateQuizStart's day boundary (Cloud Functions run in UTC). */
function usageDayKey(now = new Date()) {
    return now.toISOString().slice(0, 10);
}
exports.usageDayKey = usageDayKey;
function usageCounterId(uid, day) {
    return `${uid}_${day}`;
}
exports.usageCounterId = usageCounterId;
exports.trackAnswerUsage = functions.firestore
    .document("quizRuns/{uid}/runs/{runId}")
    .onWrite(async (change, context) => {
    const uid = context.params.uid;
    const before = change.before.exists ? change.before.data() : undefined;
    const after = change.after.exists ? change.after.data() : undefined;
    // Monotonic: only ever add. A shrink (completeRun filtering answers) or a
    // delete (the reset exploit) yields 0 and adds nothing — that is the entire
    // point of moving the count off the user's own documents.
    const delta = answeredDelta(before, after);
    if (delta <= 0)
        return;
    const now = new Date();
    const day = usageDayKey(now);
    const ref = admin.firestore().doc(`usageCounters/${usageCounterId(uid, day)}`);
    // expiresAt is a TTL hint: enable a Firestore TTL policy on
    // usageCounters.expiresAt so yesterday's counters garbage-collect. Kept two
    // days so a late-arriving trigger near midnight cannot delete a live counter.
    const expiresAt = admin.firestore.Timestamp.fromDate(new Date(now.getTime() + 2 * MS_PER_DAY));
    try {
        await ref.set({
            uid,
            day,
            answeredCount: admin.firestore.FieldValue.increment(delta),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            expiresAt,
        }, { merge: true });
    }
    catch (err) {
        // A ledger write failure must not throw here — the trigger has no user to
        // return to, and an unhandled rejection just retries. Log loudly; a
        // persistent failure shows up as free users exceeding their cap, which is
        // recoverable, not as a broken quiz.
        console.error(`[usage-ledger] failed to increment ${ref.path} by ${delta}:`, err);
    }
});
/**
 * The day's answered-question count from the ledger. Server-side readers only —
 * this uses the Admin SDK and bypasses rules.
 */
async function getAnsweredToday(uid, now = new Date()) {
    var _a;
    const day = usageDayKey(now);
    const snap = await admin.firestore().doc(`usageCounters/${usageCounterId(uid, day)}`).get();
    return snap.exists ? Number(((_a = snap.data()) === null || _a === void 0 ? void 0 : _a.answeredCount) || 0) : 0;
}
exports.getAnsweredToday = getAnsweredToday;
//# sourceMappingURL=usageLedger.js.map