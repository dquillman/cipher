import { initializeApp, applicationDefault, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
if (!getApps().length) initializeApp({ credential: applicationDefault() });
const db = getFirestore();
const ids = {'6kECziMtR1BS3MpABLW5':'PMP v2026','79cuGMNydTwDMhyiDjry':'Sec+','N5mrEby0gKLFs1y88DpM':'Net+','12396VsKMFLnPMXivHKQ':'A+ Core2'};
for (const [id,name] of Object.entries(ids)) {
  const qs = await db.collection('questions').where('examId','==',id).get();
  const t={}; let serv=0;
  for (const d of qs.docs){ const x=d.data(); if (x.status==='quarantined') continue; serv++;
    t[x.type||x.questionType||'(none)']=(t[x.type||x.questionType||'(none)']||0)+1; }
  console.log(name,'servable',serv,'types',JSON.stringify(t));
}
