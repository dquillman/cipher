const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'exam-coach-ai-platform' });
const db = admin.firestore();

async function main() {
    const uids = process.argv.slice(2);
    if (uids.length === 0) {
        console.error('Usage: node check_user.js <uid1> [uid2] ...');
        process.exit(1);
    }

    for (const uid of uids) {
        const snap = await db.collection('users').doc(uid).get();
        console.log(uid, '-> exists:', snap.exists);
        if (snap.exists) console.log('  data:', JSON.stringify(snap.data()));
    }

    process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
