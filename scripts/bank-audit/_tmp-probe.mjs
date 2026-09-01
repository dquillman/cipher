import { initializeApp, applicationDefault, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
if (!getApps().length) initializeApp({ credential: applicationDefault() });
const db = getFirestore();
const cols = await db.listCollections();
console.log('root collections:', cols.map(c=>c.id).join(', '));
const qs = await db.collection('questions').limit(1).get();
console.log('questions size sample', qs.size);
if (qs.size) console.log(Object.keys(qs.docs[0].data()));
// count by examId
const all = await db.collection('questions').select('examId','status').get();
const m = {};
for (const d of all.docs) { const e = d.get('examId') ?? '(none)'; m[e]=(m[e]||0)+1; }
console.log('total', all.size);
console.log(m);
const exams = await db.collection('exams').get();
for (const e of exams.docs) console.log('EXAM', e.id, JSON.stringify(e.data()).slice(0,200));
