"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requirePro = void 0;
const admin = require("firebase-admin");
const https_1 = require("firebase-functions/v2/https");
const entitlement_1 = require("./entitlement");
async function requirePro(context) {
    if (!context.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated.');
    }
    const userDoc = await admin.firestore().collection('users').doc(context.auth.uid).get();
    if (!userDoc.exists) {
        throw new https_1.HttpsError('permission-denied', 'User profile not found.');
    }
    const accessReason = (0, entitlement_1.resolveProAccess)(userDoc.data());
    if (!accessReason) {
        throw new https_1.HttpsError('permission-denied', 'Pro subscription required.');
    }
    return accessReason;
}
exports.requirePro = requirePro;
//# sourceMappingURL=guards.js.map