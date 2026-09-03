import { initializeApp, applicationDefault, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
if (!getApps().length) initializeApp({ credential: applicationDefault() });
const db = getFirestore();
const qs = await db.collection('questions').where('examId','==','79cuGMNydTwDMhyiDjry').get();
for (const d of qs.docs){ const x=d.data(); if (x.status==='quarantined') continue;
  if (x.type==='pbq'||x.type==='matching'){
    console.log(d.id, x.type, 'options=', Array.isArray(x.options)?x.options.length:JSON.stringify(x.options), 'correctAnswer=', JSON.stringify(x.correctAnswer), 'hasPbqConfig=', !!x.pbqConfig);
  }
}
