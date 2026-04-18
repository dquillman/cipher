const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'exam-coach-ai-platform' });
const db = admin.firestore();

async function main() {
    // Check exams collection
    const exams = await db.collection('exams').get();
    console.log('Exams collection size:', exams.size);
    exams.docs.forEach(doc => {
        const d = doc.data();
        console.log('  ID:', doc.id, '| name:', d.name, '| published:', d.isPublished, '| domains:', (d.domains || []).length);
    });

    // Check sample questions
    const questions = await db.collection('questions').limit(5).get();
    console.log('\nSample questions:');
    questions.docs.forEach(doc => {
        const d = doc.data();
        console.log('  examId:', d.examId, '| domain:', d.domain, '| stem:', (d.stem || '').substring(0, 50));
    });

    process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
