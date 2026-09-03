import { initializeApp, applicationDefault, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
if (!getApps().length) initializeApp({ credential: applicationDefault() });
const db = getFirestore();
const qs = await db.collection('questions').where('domain','==','TOTAL').get();
console.log('TOTAL-domain questions:', qs.size);
const byExam = new Map();
for (const q of qs.docs) { const e=q.data().examId; byExam.set(e,(byExam.get(e)||0)+1); }
console.log([...byExam.entries()]);
const s = qs.docs[0].data();
console.log(JSON.stringify({id:qs.docs[0].id, examId:s.examId, domain:s.domain, subdomain:s.subdomain, type:s.type, questionText:(s.questionText||s.question||'').slice(0,200), isActive:s.isActive, status:s.status}, null, 1));
