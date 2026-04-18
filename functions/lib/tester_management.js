"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkTesterExpirations = exports.revokeTesterPro = exports.grantTesterPro = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
// Helper to verify admin
const requireAdmin = async (context) => {
    var _a;
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
    }
    const db = admin.firestore();
    const userDoc = await db.collection('users').doc(context.auth.uid).get();
    if (((_a = userDoc.data()) === null || _a === void 0 ? void 0 : _a.role) !== 'admin') {
        throw new functions.https.HttpsError('permission-denied', 'Admin role required');
    }
    return context.auth.uid;
};
exports.grantTesterPro = functions.https.onCall(async (data, context) => {
    var _a;
    console.log("grantTesterPro Invoked", { data, uid: (_a = context.auth) === null || _a === void 0 ? void 0 : _a.uid });
    const adminUserId = await requireAdmin(context);
    const { targetUserId } = data;
    if (!targetUserId) {
        throw new functions.https.HttpsError('invalid-argument', 'Target User ID required');
    }
    const db = admin.firestore();
    try {
        const expiresAt = admin.firestore.Timestamp.fromMillis(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days
        await db.collection('users').doc(targetUserId).update({
            // Force plan to Pro, but mark as override so we know not to bill them
            isPro: true,
            plan: 'pro',
            testerOverride: true,
            testerExpiresAt: expiresAt,
            testerGrantedAt: admin.firestore.FieldValue.serverTimestamp(),
            testerGrantedBy: adminUserId,
            trial: null,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        // Audit Log
        await db.collection('admin_audit_logs').add({
            action: 'GRANT_TESTER_PRO',
            adminUserId,
            targetUserId,
            details: { expiresAt },
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
        return { success: true, message: 'Tester Pro Access Granted (14 Days)' };
    }
    catch (error) {
        console.error("Grant Tester Pro Failed:", error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});
exports.revokeTesterPro = functions.https.onCall(async (data, context) => {
    var _a;
    console.log("revokeTesterPro Invoked", { data, uid: (_a = context.auth) === null || _a === void 0 ? void 0 : _a.uid });
    const adminUserId = await requireAdmin(context);
    const { targetUserId } = data;
    if (!targetUserId) {
        throw new functions.https.HttpsError('invalid-argument', 'Target User ID required');
    }
    const db = admin.firestore();
    try {
        await db.collection('users').doc(targetUserId).update({
            isPro: false,
            plan: 'starter',
            testerOverride: false,
            testerExpiresAt: null,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        // Audit Log
        await db.collection('admin_audit_logs').add({
            action: 'REVOKE_TESTER_PRO',
            adminUserId,
            targetUserId,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            automated: false
        });
        return { success: true, message: 'Tester Pro Access Revoked' };
    }
    catch (error) {
        console.error("Revoke Tester Pro Failed:", error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});
exports.checkTesterExpirations = functions.pubsub.schedule('every 1 hours').onRun(async (context) => {
    const db = admin.firestore();
    const now = admin.firestore.Timestamp.now();
    try {
        // Find expired testers
        const snapshot = await db.collection('users')
            .where('testerOverride', '==', true)
            .where('testerExpiresAt', '<', now)
            .get();
        if (snapshot.empty) {
            console.log("No expired testers found.");
            return null;
        }
        const batch = db.batch();
        let count = 0;
        snapshot.docs.forEach(doc => {
            const userRef = db.collection('users').doc(doc.id);
            batch.update(userRef, {
                isPro: false,
                plan: 'starter',
                testerOverride: false,
                testerExpiresAt: null,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            // Log expiration
            const logRef = db.collection('admin_audit_logs').doc();
            batch.set(logRef, {
                action: 'EXPIRE_TESTER_PRO',
                targetUserId: doc.id,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                automated: true
            });
            count++;
        });
        await batch.commit();
        console.log(`Expired ${count} tester accounts.`);
        return null;
    }
    catch (error) {
        console.error("Error checking tester expirations:", error);
        return null;
    }
});
//# sourceMappingURL=tester_management.js.map