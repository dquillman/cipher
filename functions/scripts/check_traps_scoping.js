const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'exam-coach-ai-platform' });
const db = admin.firestore();

async function main() {
    // Check if any user has a top-level 'traps' subcollection (legacy unscoped)
    const users = await db.collection('users').get();
    console.log('Checking', users.size, 'users for legacy traps...\n');

    for (const userDoc of users.docs) {
        // Check legacy path: users/{uid}/traps
        const legacyTraps = await db.collection('users').doc(userDoc.id).collection('traps').get();
        if (!legacyTraps.empty) {
            console.log('LEGACY traps found for', userDoc.data().email, ':', legacyTraps.size, 'patterns');
        }

        // Check exam-scoped path: users/{uid}/examStats/{examId}/traps
        const examStats = await db.collection('users').doc(userDoc.id).collection('examStats').get();
        for (const examDoc of examStats.docs) {
            const traps = await db.collection('users').doc(userDoc.id)
                .collection('examStats').doc(examDoc.id)
                .collection('traps').get();
            if (!traps.empty) {
                console.log('Exam-scoped traps for', userDoc.data().email, '| exam:', examDoc.id, ':', traps.size, 'patterns');
            }
        }
    }

    console.log('\nDone.');
    process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
