const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'exam-coach-ai-platform' });
const db = admin.firestore();

db.collection('users').limit(20).get().then(snap => {
    console.log('Total:', snap.size);
    snap.docs.forEach(doc => {
        const d = doc.data();
        console.log(doc.id, '|', d.email, '| plan:', d.plan, '| isPro:', d.isPro, '| role:', d.role, '| testerOverride:', d.testerOverride, '| accessLevel:', d.accessLevel, '| trial:', d.trial, '| subscriptionStatus:', d.subscriptionStatus);
    });
    process.exit(0);
}).catch(e => { console.error(e); process.exit(1); });
