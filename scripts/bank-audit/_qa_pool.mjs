import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
const key = JSON.parse(fs.readFileSync('G:/Users/daveq/Cipher/functions/serviceAccountKey.json','utf8'));
if (!getApps().length) initializeApp({ credential: cert(key) });
const db = getFirestore();
const snap = await db.collection('questions').get();
console.log('total docs', snap.size);
const SINGLE = new Set(['multiple-choice','scenario','risk-matrix','drag-drop','ordering', undefined]);
const byExam = {};
for (const d of snap.docs) {
  const q = d.data();
  const e = q.examId || 'NONE';
  byExam[e] = byExam[e] || { total:0, servable:0, types:{} };
  byExam[e].total++;
  if (q.status === 'quarantined') continue;
  byExam[e].servable++;
  const t = q.type === undefined ? '(undefined)' : q.type;
  byExam[e].types[t] = (byExam[e].types[t]||0)+1;
}
console.log(JSON.stringify(byExam,null,1));
