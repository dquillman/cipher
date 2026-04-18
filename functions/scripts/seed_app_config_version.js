/**
 * Seed script: Create app_config/version document.
 *
 * Usage (from functions directory):
 *   node scripts/seed_app_config_version.js
 */
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

async function seed() {
  await db.doc('app_config/version').set({
    latest: '1.13.3',
    minimum: '1.13.3',
  });
  console.log('app_config/version set to { latest: "1.13.3", minimum: "1.13.3" }');
}

seed().then(() => process.exit(0)).catch((err) => {
  console.error('Seed failed:', err.message || err);
  process.exit(1);
});
