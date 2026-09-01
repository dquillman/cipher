// READ ONLY
import { initializeApp, applicationDefault, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { writeFileSync } from 'node:fs';

if (!getApps().length) initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const OUT = process.argv[2];
const EXAM = process.argv[3];

const snap = await db.collection('questions').where('examId', '==', EXAM).get();
const rows = [];
for (const doc of snap.docs) {
  const q = doc.data();
  rows.push({
    id: doc.id,
    status: q.status ?? null,
    type: q.type ?? null,
    bloomLevel: q.bloomLevel ?? q.bloom ?? null,
    domain: q.domain ?? null,
    stem: q.stem ?? q.question ?? null,
    options: q.options ?? q.choices ?? null,
    correct: q.correctAnswer ?? q.correct ?? q.answer ?? null,
    explanation: q.explanation ?? null,
  });
}
rows.sort((a,b)=>a.id.localeCompare(b.id));
writeFileSync(OUT, JSON.stringify(rows, null, 2));
console.log(`${EXAM}: ${rows.length} docs`);
const st = {};
for (const r of rows) st[r.status ?? '(none)'] = (st[r.status ?? '(none)']||0)+1;
console.log(st);
const bl = {};
for (const r of rows) bl[r.bloomLevel ?? '(none)'] = (bl[r.bloomLevel ?? '(none)']||0)+1;
console.log(bl);
const ty = {};
for (const r of rows) ty[r.type ?? '(none)'] = (ty[r.type ?? '(none)']||0)+1;
console.log(ty);
