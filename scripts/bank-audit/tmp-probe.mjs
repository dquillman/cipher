import { initializeApp, applicationDefault, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
if (!getApps().length) initializeApp({ credential: applicationDefault() });
const db = getFirestore();
const cols = await db.listCollections();
console.log('collections:', cols.map(c => c.id).join(', '));
const snap = await db.collection('questions').get();
console.log('questions total:', snap.size);
const byExam = {};
for (const d of snap.docs) { const e = d.data().examId ?? '(none)'; byExam[e] = (byExam[e]||0)+1; }
console.log(JSON.stringify(byExam, null, 1));
