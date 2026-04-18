const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'exam-coach-ai-platform' });
const db = admin.firestore();

async function main() {
    const questions = await db.collection('questions').get();
    const stats = {};
    questions.docs.forEach(doc => {
        const d = doc.data();
        const examId = d.examId || 'unknown';
        const type = d.type || 'mcq';
        if (!stats[examId]) stats[examId] = {};
        stats[examId][type] = (stats[examId][type] || 0) + 1;
    });

    const examNames = {
        '7qmPagj9A6RpkC0CwGkY': 'PMP',
        'IpECw0XAtBkgD1HyvYas': 'CSM',
        'bpfawZDj3qalhoU4mdd3': 'SHRM-CP',
        'XGfL6RE2ls7cokP2tqMa': 'Six Sigma GB',
        'Vs3aNmifAJc9bYRFCxXc': 'CPP',
        'dtgTymjijqUr4NEIHbE1': 'CIA Part 1',
        '6FKeXlV2dzv4I03tewcU': 'ITIL 4',
        '79cuGMNydTwDMhyiDjry': 'Security+',
        'gp6QwBz0FXFIntLSQSYr': 'Network+',
        'cxBsVz8AVaocdEYbgSMA': 'A+ Core 2',
    };

    for (const [examId, types] of Object.entries(stats)) {
        const name = examNames[examId] || examId;
        const total = Object.values(types).reduce((a, b) => a + b, 0);
        console.log(name, '| total:', total, '| types:', JSON.stringify(types));
    }
    process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
