/**
 * Seed script: Initialize system_config/app_versions document.
 *
 * Usage:
 *   npx ts-node scripts/seed_app_versions.ts
 *
 * This sets the current required version for ExamCoach.
 * Update the version here before running to push a new required version.
 */
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

async function seed() {
    const version = '1.14.0';

    await db.doc('system_config/app_versions').set({
        examcoach: {
            currentVersion: version,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
    }, { merge: true });

    console.log(`system_config/app_versions.examcoach.currentVersion set to "${version}"`);
}

seed().then(() => process.exit(0)).catch((err) => {
    console.error(err);
    process.exit(1);
});
