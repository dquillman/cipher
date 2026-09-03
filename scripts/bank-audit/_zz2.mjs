import { initializeApp, applicationDefault, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
if (!getApps().length) initializeApp({ credential: applicationDefault() });
const db = getFirestore();
const LIVE = {'6kECziMtR1BS3MpABLW5':'PMP v2026','79cuGMNydTwDMhyiDjry':'Security+','N5mrEby0gKLFs1y88DpM':'Network+','12396VsKMFLnPMXivHKQ':'A+ Core 2'};
const snap = await db.collection('questions').get();
const acc={};
const srcVals={}, pubVals={};
for (const d of snap.docs){
  const q=d.data(); const e=q.examId; if(!LIVE[e]) continue; if(q.status==='quarantined') continue;
  acc[e]=acc[e]||{n:0,dom:{},bl:{},pub:{},diff:{}};
  const a=acc[e]; a.n++;
  a.dom[q.domain]=(a.dom[q.domain]||0)+1;
  a.bl[q.bloomLevel]=(a.bl[q.bloomLevel]||0)+1;
  a.pub[String(q.isPublished)]=(a.pub[String(q.isPublished)]||0)+1;
  a.diff[String(q.difficulty)]=(a.diff[String(q.difficulty)]||0)+1;
  srcVals[String(q.source)]=(srcVals[String(q.source)]||0)+1;
}
for(const [id,v] of Object.entries(acc)){
  console.log(`\n### ${LIVE[id]} n=${v.n}`);
  const tot=v.n;
  console.log(' domains:', Object.entries(v.dom).map(([k,c])=>`${k}=${c} (${(c/tot*100).toFixed(1)}%)`).join(' | '));
  console.log(' bloom:', JSON.stringify(v.bl));
  console.log(' isPublished:', JSON.stringify(v.pub));
  console.log(' difficulty:', JSON.stringify(v.diff));
}
console.log('\nsource values:', JSON.stringify(srcVals));
