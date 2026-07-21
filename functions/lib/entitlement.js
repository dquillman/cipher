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
    return null;
}
exports.resolveProAccess = resolveProAccess;
function hasProAccess(userData, now = new Date()) {
    return resolveProAccess(userData, now) !== null;
}
exports.hasProAccess = hasProAccess;
//# sourceMappingURL=entitlement.js.map