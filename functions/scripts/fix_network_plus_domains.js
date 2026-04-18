const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'exam-coach-ai-platform' });
const db = admin.firestore();

const NETWORK_PLUS_ID = 'gp6QwBz0FXFIntLSQSYr';

async function main() {
    // Find Network+ questions with orphaned "Project Management" domain
    const snap = await db.collection('questions')
        .where('examId', '==', NETWORK_PLUS_ID)
        .where('domain', '==', 'Project Management')
        .get();

    if (snap.empty) {
        console.log('No "Project Management" Network+ questions found.');
        process.exit(0);
    }

    console.log(`Found ${snap.size} Network+ questions with domain "Project Management"`);

    // Remap to "Network Operations" (closest Firestore domain)
    const batch = db.batch();
    snap.docs.forEach(doc => {
        batch.update(doc.ref, { domain: 'Network Operations' });
    });
    await batch.commit();
    console.log(`Remapped ${snap.size} questions from "Project Management" → "Network Operations"`);

    process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
