import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
const key = JSON.parse(fs.readFileSync('G:/Users/daveq/Cipher/functions/serviceAccountKey.json','utf8'));
if (!getApps().length) initializeApp({ credential: cert(key) });
const db = getFirestore();
const snap = await db.collection('questions').get();
const byExam = {};
for (const d of snap.docs) {
  const q = d.data();
  const e = q.examId || 'NONE';
  byExam[e] = byExam[e] || { total:0, quarantined:0, domains:{} };
  byExam[e].total++;
  if (q.status === 'quarantined') byExam[e].quarantined++;
  const dm = q.domain || '(none)';
  byExam[e].domains[dm] = (byExam[e].domains[dm]||0)+1;
}
console.log(JSON.stringify(byExam,null,1));
const exams = await db.collection('exams').get();
console.log('EXAMS:', exams.docs.map(d=>({id:d.id, name:d.data().name, published:d.data().isPublished, domains:(d.data().domains||[]).length})));
