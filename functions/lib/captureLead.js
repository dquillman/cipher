"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.captureLead = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const rateLimit_1 = require("./rateLimit");
const db = admin.firestore();
// Every magnet, keyed by id. Add a row here when a new PDF ships — and only
// set `ready: true` once the file is actually deployed, or we hand back a 404.
const MAGNETS = {
    'pmp-exam-lens-cheat-sheet': {
        cluster: 'pmp',
        path: '/lead-magnets/pmp-exam-lens-cheat-sheet.pdf',
        ready: true,
    },
    'security-plus-pbq-walkthroughs': {
        cluster: 'security-plus',
        path: '/lead-magnets/security-plus-pbq-walkthroughs.pdf',
        ready: true,
    },
    'shrm-cp-competency-map': {
        cluster: 'shrm-cp',
        path: '/lead-magnets/shrm-cp-competency-map.pdf',
        ready: true,
    },
};
// What a caller gets when it sends only `cluster` (every LP today).
const DEFAULT_MAGNET_BY_CLUSTER = {
    'pmp': 'pmp-exam-lens-cheat-sheet',
    'security-plus': 'security-plus-pbq-walkthroughs',
    'shrm-cp': 'shrm-cp-competency-map',
};
const VALID_CLUSTERS = ['pmp', 'security-plus', 'shrm-cp'];
function isValidEmail(s) {
    if (typeof s !== 'string')
        return false;
    // Permissive — actually-bad emails will bounce on welcome-email send, not at form
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) && s.length <= 320;
}
function isValidCluster(s) {
    return typeof s === 'string' && VALID_CLUSTERS.includes(s);
}
function resolveMagnetId(cluster, requested) {
    var _a;
    if (typeof requested === 'string' && ((_a = MAGNETS[requested]) === null || _a === void 0 ? void 0 : _a.cluster) === cluster) {
        return requested;
    }
    // Unknown or mismatched magnet id falls back to the cluster default rather
    // than erroring — a stale LP should still deliver something useful.
    return DEFAULT_MAGNET_BY_CLUSTER[cluster];
}
exports.captureLead = functions.https.onCall(async (data, context) => {
    // Publicly callable — cap per-IP so a script can't spam leadCaptures writes.
    await (0, rateLimit_1.enforceRateLimit)('captureLead', context, 15);
    const email = data.email;
    const cluster = data.cluster;
    const utm = (data.utm && typeof data.utm === 'object') ? data.utm : {};
    const referrer = typeof data.referrer === 'string' ? data.referrer.slice(0, 500) : null;
    if (!isValidEmail(email)) {
        throw new functions.https.HttpsError('invalid-argument', 'A valid email is required.');
    }
    if (!isValidCluster(cluster)) {
        throw new functions.https.HttpsError('invalid-argument', 'cluster must be pmp | security-plus | shrm-cp.');
    }
    const magnetId = resolveMagnetId(cluster, data.magnet);
    const magnet = MAGNETS[magnetId];
    const normalizedEmail = email.trim().toLowerCase();
    const captureId = `${normalizedEmail}__${cluster}`;
    const captureRef = db.collection('leadCaptures').doc(captureId);
    // Upsert: same email + cluster combination updates the prior record but
    // never duplicates. The same prospect getting the PDF twice is logged once
    // with the most recent UTMs — firstCapturedAt is preserved from the
    // original capture.
    await db.runTransaction(async (tx) => {
        var _a, _b, _c, _d, _e, _f, _g;
        const existing = await tx.get(captureRef);
        tx.set(captureRef, Object.assign(Object.assign({ email: normalizedEmail, cluster,
            utm,
            referrer, 
            // Most recent magnet requested, plus the full set this lead has
            // pulled from the cluster. The welcome sequence reads `cluster`;
            // `magnets` is for attribution — which magnet actually converts.
            magnet: magnetId, magnets: admin.firestore.FieldValue.arrayUnion(magnetId) }, (existing.exists ? {} : { firstCapturedAt: admin.firestore.FieldValue.serverTimestamp() })), { lastCapturedAt: admin.firestore.FieldValue.serverTimestamp(), 
            // Aggregated info for later drip-email targeting
            uid: (_b = (_a = context.auth) === null || _a === void 0 ? void 0 : _a.uid) !== null && _b !== void 0 ? _b : null, ip: (_d = (_c = context.rawRequest) === null || _c === void 0 ? void 0 : _c.ip) !== null && _d !== void 0 ? _d : null, userAgent: (_g = (_f = (_e = context.rawRequest) === null || _e === void 0 ? void 0 : _e.headers) === null || _f === void 0 ? void 0 : _f['user-agent']) !== null && _g !== void 0 ? _g : null }), { merge: true });
    });
    // Lead is captured above regardless. Only return a download link when the
    // magnet's PDF is actually deployed — otherwise the link would 404.
    if (!magnet.ready) {
        return { ok: true, downloadUrl: null, pending: true, magnet: magnetId };
    }
    const downloadUrl = `https://cipherexam.com${magnet.path}`;
    return { ok: true, downloadUrl, pending: false, magnet: magnetId };
});
//# sourceMappingURL=captureLead.js.map