import { initializeApp, applicationDefault, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
if (!getApps().length) initializeApp({ credential: applicationDefault() });
const db = getFirestore();
const snap = await db.collection('questions').get();
console.log('total questions:', snap.size);
const byExam = new Map();
const fieldFreq = new Map();
for (const d of snap.docs) {
  const q = d.data();
  const e = q.examId ?? '(none)';
  if (!byExam.has(e)) byExam.set(e, { total:0, byStatus:{}, byType:{}, byDomain:{}, bySource:{} });
  const b = byExam.get(e); b.total++;
  b.byStatus[q.status ?? 'active'] = (b.byStatus[q.status??'active']||0)+1;
  b.byType[q.type ?? '(none)'] = (b.byType[q.type??'(none)']||0)+1;
  b.byDomain[q.domain ?? '(none)'] = (b.byDomain[q.domain??'(none)']||0)+1;
  b.bySource[q.source ?? '(none)'] = (b.bySource[q.source??'(none)']||0)+1;
  for (const k of Object.keys(q)) fieldFreq.set(k, (fieldFreq.get(k)||0)+1);
}
for (const [e,b] of [...byExam].sort((a,z)=>z[1].total-a[1].total)) {
  console.log('\n===', e, b.total);
  console.log('  status:', JSON.stringify(b.byStatus));
  console.log('  type:', JSON.stringify(b.byType));
  console.log('  source:', JSON.stringify(b.bySource));
  console.log('  domain:', JSON.stringify(b.byDomain));
}
console.log('\nfields:', JSON.stringify([...fieldFreq].sort((a,z)=>z[1]-a[1])));
// list root collections
const cols = await db.listCollections();
console.log('\nroot collections:', cols.map(c=>c.id).join(', '));
