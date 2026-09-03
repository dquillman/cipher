import { initializeApp, applicationDefault, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
if (!getApps().length) initializeApp({ credential: applicationDefault() });
const db = getFirestore();
const snap = await db.collection('questions').get();
const out = snap.docs.map(d=>({__id:d.id, ...d.data()}));
fs.writeFileSync(process.argv[2], JSON.stringify(out,null,1));
console.log('docs', out.length);
// exams collection
const ex = await db.collection('exams').get();
fs.writeFileSync(process.argv[3], JSON.stringify(ex.docs.map(d=>({__id:d.id,...d.data()})),null,1));
console.log('exams', ex.size);
