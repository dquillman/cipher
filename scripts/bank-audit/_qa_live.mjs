import { initializeApp, applicationDefault, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
if (!getApps().length) initializeApp({ credential: applicationDefault() });
const db = getFirestore();
const LIVE = {
 '6kECziMtR1BS3MpABLW5':{n:'PMP v2026',mock:180},
 '79cuGMNydTwDMhyiDjry':{n:'Security+ SY0-701',mock:90},
 'N5mrEby0gKLFs1y88DpM':{n:'Network+ N10-009',mock:90},
 '12396VsKMFLnPMXivHKQ':{n:'A+ Core 2 220-1202',mock:90},
};
const snap = await db.collection('questions').get();
const acc={};
const statusVals={};
for (const d of snap.docs){
  const q=d.data();
  statusVals[String(q.status)]=(statusVals[String(q.status)]||0)+1;
  const e=q.examId; if(!LIVE[e]) continue;
  acc[e]=acc[e]||{total:0,servable:0,servableGradable:0,noCA:0};
  acc[e].total++;
  const servable = q.status!=='quarantined';

  if(servable){acc[e].servable++;
    const t=q.type;
    if(t===undefined||t===null||t==='mcq'||t==='emv'){acc[e].servableGradable++; if(typeof q.correctAnswer!=='number') acc[e].noCA++;}
  }
}
console.log('status field values across bank:',JSON.stringify(statusVals));
for(const [id,v] of Object.entries(acc)){
  const m=LIVE[id].mock;
  console.log(`${LIVE[id].n}: total=${v.total} servable=${v.servable} servable+gradable=${v.servableGradable} mockAsks=${m} overlapBetweenTwoMocks=${v.servableGradable>=m?Math.round((2*m-v.servableGradable)/m*100):100}% ungradableKey=${v.noCA}`);
}
