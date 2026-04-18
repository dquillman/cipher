const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'exam-coach-ai-platform' });

admin.auth().listUsers(20).then(result => {
    console.log('Auth users:', result.users.length);
    result.users.forEach(u => {
        console.log(u.uid, '|', u.email, '| created:', u.metadata.creationTime);
    });
    process.exit(0);
}).catch(e => { console.error(e); process.exit(1); });
