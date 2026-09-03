import { initializeApp, applicationDefault, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
if (!getApps().length) initializeApp({ credential: applicationDefault() });
const db = getFirestore();
const exams = await db.collection('exams').get();
console.log('exams:', exams.size);
for (const d of exams.docs) {
  const x = d.data();
  console.log(d.id, '|', x.name, '| pub:', x.isPublished, '| domains:', JSON.stringify(x.domains));
}
const qs = await db.collection('questions').get();
console.log('questions:', qs.size);
const doms = new Map();
for (const q of qs.docs) { const dd = q.data().domain; doms.set(dd, (doms.get(dd)||0)+1); }
console.log([...doms.entries()].sort((a,b)=>b[1]-a[1]));
