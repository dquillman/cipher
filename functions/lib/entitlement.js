"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasProAccess = exports.resolveProAccess = void 0;
function asDate(value) {
    if (value instanceof Date)
        return Number.isNaN(value.getTime()) ? null : value;
    if (value && typeof value === 'object' && 'toDate' in value) {
        const candidate = value;
        if (typeof candidate.toDate === 'function') {
            const date = candidate.toDate();
            return date instanceof Date && !Number.isNaN(date.getTime()) ? date : null;
        }
    }
    return null;
}
function resolveProAccess(userData, now = new Date()) {
    if (!userData)
        return null;
    if (userData.billingStatus === 'comped')
        return 'comped';
    const subscriptionNotCanceled = userData.subscriptionStatus !== 'canceled';
    const paid = subscriptionNotCanceled &&
        (userData.billingStatus === 'paid' ||
            (userData.isPro === true && userData.trial !== true));
    if (paid)
        return 'paid';
    const testerExpiresAt = asDate(userData.testerExpiresAt);
    const isTester = userData.testerOverride === true || userData.role === 'tester';
    if (isTester && (!testerExpiresAt || testerExpiresAt > now))
        return 'tester';
    const trialEndsAt = asDate(userData.trialEndsAt);
    const isTrial = userData.trial === true ||
        userData.trialActive === true ||
        userData.plan === 'trial';
    if (isTrial && trialEndsAt && trialEndsAt > now)
        return 'trial';
    if (hasActiveExamPass(userData, now))
        return 'exam-pass';
    return null;
}
exports.resolveProAccess = resolveProAccess;
/**
 * True when the user holds an unexpired 90-day Exam Pass.
 *
 * examPass.ts writes ONLY the `entitlement` field on fulfilment — no isPro, no
 * plan, no accessLevel. Nothing on the server read it, so every server gate
 * treated a $59 pass buyer as free tier: validateQuizStart dropped them into
 * the free daily cap and told them to upgrade, and requirePro rejected every AI
 * Coach breakdown and end-of-quiz review. The client's own passEntitlement.ts
 * said they had access, so the app showed the features and the server refused
 * them.
 *
 * Deliberately NOT scoped to a particular exam here. validateQuizStart and
 * requirePro never receive an examId, and taking one from the client would let
 * a caller name any exam they liked. Exam scoping still happens on the five
 * client gates via isPassActiveFor(). The over-grant is bounded and small — a
 * pass is $59 for 90 days against $19/month for Pro, so it is roughly
 * price-neutral — and it is strictly better than denying a paying customer.
 * When validateQuizStart learns the examId, scope this the way the client does,
 * by lineage rather than strict id equality.
 */
function hasActiveExamPass(userData, now) {
    const raw = userData.entitlement;
    if (!raw || typeof raw !== 'object')
        return false;
    const pass = raw;
    if (pass.type !== 'exam-pass')
        return false;
    const expiresAt = asDate(pass.expiresAt);
    return expiresAt !== null && expiresAt > now;
}
function hasProAccess(userData, now = new Date()) {
    return resolveProAccess(userData, now) !== null;
}
exports.hasProAccess = hasProAccess;
//# sourceMappingURL=entitlement.js.map