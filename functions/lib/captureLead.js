"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.captureLead = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const rateLimit_1 = require("./rateLimit");
const db = admin.firestore();
const PDF_PATHS = {
    'pmp': '/lead-magnets/pmp-exam-lens-cheat-sheet.pdf',
    'security-plus': '/lead-magnets/security-plus-pbq-walkthroughs.pdf',
    'shrm-cp': '/lead-magnets/shrm-cp-competency-map.pdf',
};
const VALID_CLUSTERS = ['pmp', 'security-plus', 'shrm-cp'];
// Clusters whose lead-magnet PDF actually exists in web/public/lead-magnets/.
// Other valid clusters still capture the lead but return no download link, so we
// never hand back a URL that 404s. Add a cluster here once its PDF is published.
const READY_CLUSTERS = ['pmp', 'security-plus', 'shrm-cp'];
function isValidEmail(s) {
    if (typeof s !== 'string')
        return false;
    // Permissive — actually-bad emails will bounce on welcome-email send, not at form
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) && s.length <= 320;
}
function isValidCluster(s) {
    return typeof s === 'string' && VALID_CLUSTERS.includes(s);
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
            referrer }, (existing.exists ? {} : { firstCapturedAt: admin.firestore.FieldValue.serverTimestamp() })), { lastCapturedAt: admin.firestore.FieldValue.serverTimestamp(), 
            // Aggregated info for later drip-email targeting
            uid: (_b = (_a = context.auth) === null || _a === void 0 ? void 0 : _a.uid) !== null && _b !== void 0 ? _b : null, ip: (_d = (_c = context.rawRequest) === null || _c === void 0 ? void 0 : _c.ip) !== null && _d !== void 0 ? _d : null, userAgent: (_g = (_f = (_e = context.rawRequest) === null || _e === void 0 ? void 0 : _e.headers) === null || _f === void 0 ? void 0 : _f['user-agent']) !== null && _g !== void 0 ? _g : null }), { merge: true });
    });
    // Lead is captured above regardless. Only return a download link when the
    // cluster's PDF is actually published — otherwise the link would 404.
    if (!READY_CLUSTERS.includes(cluster)) {
        return { ok: true, downloadUrl: null, pending: true };
    }
    const downloadUrl = `https://cipherexam.com${PDF_PATHS[cluster]}`;
    return { ok: true, downloadUrl, pending: false };
});
//# sourceMappingURL=captureLead.js.map