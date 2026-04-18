const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'exam-coach-ai-platform' });
const db = admin.firestore();

const UNKNOWN = [
    '6kECziMtR1BS3MpABLW5',
    'vltfkxHhhlHH95JLg6vQ',
    'vytqVZsPEy7u7KNTB7aA',
    'wjA7OjeAGpURXrbzDe5O',
    'XDL93JSkkNPlofn0cjhM',
    'capm-exam',
];

async function main() {
    // Try exams collection first (name lookup)
    console.log('=== EXAMS COLLECTION LOOKUP ===\n');
    for (const id of UNKNOWN) {
        try {
            const doc = await db.collection('exams').doc(id).get();
            if (doc.exists) {
                const d = doc.data();
                console.log(`${id}  →  ${d.name || d.title || '(no name field)'}`);
                console.log(`    fields: ${Object.keys(d).join(', ')}\n`);
            } else {
                console.log(`${id}  →  NOT IN exams COLLECTION`);
            }
        } catch (e) {
            console.log(`${id}  →  error: ${e.message}`);
        }
    }

    // Sample one question from each to infer the exam from content
    console.log('\n=== SAMPLE QUESTION FROM EACH ===\n');
    for (const examId of UNKNOWN) {
        const snap = await db.collection('questions').where('examId', '==', examId).limit(1).get();
        if (snap.empty) {
            console.log(`${examId}  →  no questions found`);
            continue;
        }
        const q = snap.docs[0].data();
        console.log(`--- ${examId} ---`);
        console.log(`domain: ${q.domain || '(none)'}`);
        console.log(`stem:   ${(q.stem || '').slice(0, 200)}`);
        console.log('');
    }
    process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
