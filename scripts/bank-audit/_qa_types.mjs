import { initializeApp, applicationDefault, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
if (!getApps().length) initializeApp({ credential: applicationDefault() });
const db = getFirestore();
const ids = {'6kECziMtR1BS3MpABLW5':'PMP','79cuGMNydTwDMhyiDjry':'SecPlus','N5mrEby0gKLFs1y88DpM':'NetPlus','12396VsKMFLnPMXivHKQ':'APlus'};
const OK = new Set([undefined,null,'mcq','emv']);
for (const [id,name] of Object.entries(ids)) {
  const qs = await db.collection('questions').where('examId','==',id).get();
  const t = new Map(); let servable=0, gradable=0;
  for (const q of qs.docs){ const d=q.data();
    const key = ('type' in d) ? JSON.stringify(d.type) : 'ABSENT';
    t.set(key,(t.get(key)||0)+1);
    const s = d.status !== 'quarantined';
    if (s) { servable++; if (OK.has(d.type)) gradable++; }
  }
  console.log(name,'total',qs.size,'servable',servable,'SERVABLE+GRADABLE',gradable,'types',JSON.stringify([...t]));
}
