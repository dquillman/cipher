const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'exam-coach-ai-platform' });
const db = admin.firestore();

db.listCollections().then(collections => {
    console.log('Collections:');
    collections.forEach(c => console.log(' -', c.id));
    process.exit(0);
}).catch(e => { console.error(e); process.exit(1); });
