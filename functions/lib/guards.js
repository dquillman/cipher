"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requirePro = void 0;
const admin = require("firebase-admin");
const https_1 = require("firebase-functions/v2/https");
async function requirePro(context) {
    if (!context.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated.');
    }
    const uid = context.auth.uid;
    const db = admin.firestore();
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
        throw new https_1.HttpsError('permission-denied', 'User profile not found.');
    }
    const userData = userDoc.data();
    const isPro = (userData === null || userData === void 0 ? void 0 : userData.isPro) === true ||
        (userData === null || userData === void 0 ? void 0 : userData.plan) === 'pro' ||
        (userData === null || userData === void 0 ? void 0 : userData.trialActive) === true ||
        (userData === null || userData === void 0 ? void 0 : userData.testerOverride) === true ||
        (userData === null || userData === void 0 ? void 0 : userData.billingStatus) === 'comped';
    if (!isPro) {
        throw new https_1.HttpsError('permission-denied', 'Pro subscription required.');
    }
    return true;
}
exports.requirePro = requirePro;
//# sourceMappingURL=guards.js.map