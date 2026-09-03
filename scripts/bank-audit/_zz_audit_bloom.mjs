import { initializeApp, applicationDefault, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
if (!getApps().length) initializeApp({ credential: applicationDefault() });
const db = getFirestore();
const LIVE = {
 '6kECziMtR1BS3MpABLW5':'PMP v2026',
 '79cuGMNydTwDMhyiDjry':'Security+ SY0-701',
 'N5mrEby0gKLFs1y88DpM':'Network+ N10-009',
 '12396VsKMFLnPMXivHKQ':'A+ Core 2 220-1202',
};
const snap = await db.collection('questions').get();
const acc={};
const fieldKeys=new Set();
let sample=null;
for (const d of snap.docs){
  const q=d.data();
  const e=q.examId; if(!LIVE[e]) continue;
  if(q.status==='quarantined') continue;
  acc[e]=acc[e]||{n:0,bloom:0,noBloom:[],expl:0,noExpl:[],types:{},domains:new Set()};
  const a=acc[e];
  a.n++;
  Object.keys(q).forEach(k=>fieldKeys.add(k));
  const bloom = q.bloomLevel ?? q.bloom ?? q.bloomsLevel ?? q.cognitiveLevel;
  if(bloom) a.bloom++; else a.noBloom.push(d.id);
  const ex = q.explanation ?? q.rationale;
  if(ex && String(ex).trim().length>0) a.expl++; else a.noExpl.push(d.id);
  const t=q.type||'mcq'; a.types[t]=(a.types[t]||0)+1;
  a.domains.add(q.domain);
  if(!sample) sample=q;
}
for(const [id,v] of Object.entries(acc)){
  console.log(`${LIVE[id]}: n=${v.n} bloomTagged=${v.bloom} missingBloom=${v.noBloom.length} withExplanation=${v.expl} missingExpl=${v.noExpl.length} types=${JSON.stringify(v.types)}`);
  if(v.noBloom.length) console.log('   missing bloom ids:', v.noBloom.slice(0,10).join(','));
  if(v.noExpl.length) console.log('   missing expl ids:', v.noExpl.slice(0,10).join(','));
  console.log('   domains:', [...v.domains].join(' | '));
}
console.log('ALL FIELD KEYS:', [...fieldKeys].sort().join(', '));
