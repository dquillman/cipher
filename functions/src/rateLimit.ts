import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

/**
 * Lightweight per-IP daily rate limiter for publicly-callable functions.
 *
 * Counters live in `rateLimits/{scope}__{ip}__{yyyy-mm-dd}` and are bumped in a
 * transaction (1 read + 1 write per call). Docs carry an `expiresAt` field —
 * enable a Firestore TTL policy on `rateLimits.expiresAt` to garbage-collect
 * them automatically.
 *
 * Fail-open by design: if the caller IP is unavailable or Firestore errors,
 * the request is allowed. The limiter exists to stop scripted abuse from
 * running up Firestore/AI costs, not to be a security boundary.
 */
export async function enforceRateLimit(
    scope: string,
    context: functions.https.CallableContext,
    dailyLimit: number,
): Promise<void> {
    const ip = context.rawRequest?.ip;
    if (!ip) return; // No IP available (e.g. emulator) — allow.

    const day = new Date().toISOString().split('T')[0];
    // IPv6 contains ':' which is fine in a doc ID; '/' is not — normalize.
    const safeIp = ip.replace(/\//g, '_');
    const ref = admin.firestore().collection('rateLimits').doc(`${scope}__${safeIp}__${day}`);

    let overLimit = false;
    try {
        await admin.firestore().runTransaction(async (tx) => {
            const snap = await tx.get(ref);
            const count = (snap.data()?.count as number | undefined) ?? 0;
            if (count >= dailyLimit) {
                overLimit = true;
                return;
            }
            tx.set(ref, {
                count: count + 1,
                scope,
                expiresAt: admin.firestore.Timestamp.fromMillis(Date.now() + 48 * 60 * 60 * 1000),
            }, { merge: true });
        });
    } catch (err) {
        console.warn(`rateLimit(${scope}): transaction failed, allowing request`, err);
        return;
    }

    if (overLimit) {
        console.warn(`rateLimit(${scope}): IP ${ip} exceeded ${dailyLimit}/day`);
        throw new functions.https.HttpsError('resource-exhausted', 'Too many requests. Try again tomorrow.');
    }
}
