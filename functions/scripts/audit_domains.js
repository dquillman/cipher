const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'exam-coach-ai-platform' });
const db = admin.firestore();

async function main() {
    const exams = await db.collection('exams').get();

    for (const doc of exams.docs) {
        const d = doc.data();
        const firestoreDomains = d.domains || [];
        console.log(`\n=== ${d.name} (${doc.id}) ===`);
        console.log('Firestore exam domains:', JSON.stringify(firestoreDomains));

        // Get unique domains from seeded questions
        const qSnap = await db.collection('questions')
            .where('examId', '==', doc.id)
            .get();

        const questionDomains = [...new Set(qSnap.docs.map(q => q.data().domain))].sort();
        console.log('Question domains:      ', JSON.stringify(questionDomains));
        console.log('Question count:        ', qSnap.size);

        // Find mismatches
        const inQuestionsNotExam = questionDomains.filter(d => !firestoreDomains.includes(d));
        const inExamNotQuestions = firestoreDomains.filter(d => !questionDomains.includes(d));

        if (inQuestionsNotExam.length > 0) {
            console.log('!! IN QUESTIONS BUT NOT EXAM CONFIG:', JSON.stringify(inQuestionsNotExam));
        }
        if (inExamNotQuestions.length > 0) {
            console.log('!! IN EXAM CONFIG BUT NO QUESTIONS:', JSON.stringify(inExamNotQuestions));
        }
        if (inQuestionsNotExam.length === 0 && inExamNotQuestions.length === 0) {
            console.log('✓ All domains match');
        }
    }

    process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
