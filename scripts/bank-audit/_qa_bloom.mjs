import { initializeApp, applicationDefault, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
if (!getApps().length) initializeApp({ credential: applicationDefault() });
const db = getFirestore();
const ids = {'6kECziMtR1BS3MpABLW5':'PMP','79cuGMNydTwDMhyiDjry':'SecPlus','N5mrEby0gKLFs1y88DpM':'NetPlus','12396VsKMFLnPMXivHKQ':'APlus'};
let grand=0, grandBloom=0;
for (const [id,name] of Object.entries(ids)) {
  const qs = await db.collection('questions').where('examId','==',id).get();
  let bloom=0, active=0, types=new Map(), inactive=0;
  for (const q of qs.docs){ const d=q.data();
    if (d.bloomLevel||d.bloom) bloom++;
    if (d.isActive===false||d.status==='quarantined'||d.status==='retired') inactive++;
    types.set(d.type||d.questionType||'standard',(types.get(d.type||d.questionType||'standard')||0)+1);
  }
  grand+=qs.size; grandBloom+=bloom;
  console.log(name, id, 'total:',qs.size,'bloom:',bloom,'inactive-ish:',inactive,'types:',JSON.stringify([...types]));
}
console.log('GRAND', grand, 'bloom', grandBloom);
