
const admin = require('firebase-admin');
const serviceAccount = require('../../serviceAccountKey.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function listExams() {
    console.log("Fetching exams...");
    const snapshot = await db.collection('exams').get();
    if (snapshot.empty) {
        console.log("No exams found.");
        return;
    }

    snapshot.docs.forEach(doc => {
        const data = doc.data();
        console.log(`\nID: ${doc.id}`);
        console.log(`Name: ${data.name}`);
        console.log(`Published: ${data.isPublished}`);
        console.log(`Domains Length: ${data.domains ? data.domains.length : 'UNDEFINED'}`);
        if (data.domains) {
            console.log(`Domains: ${JSON.stringify(data.domains)}`);
        }
    });
}

listExams().catch(console.error);
