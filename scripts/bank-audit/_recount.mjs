import { initializeApp, applicationDefault, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
if (!getApps().length) initializeApp({ credential: applicationDefault() });
const db = getFirestore();
const banks = {'6kECziMtR1BS3MpABLW5':['PMP',180],'79cuGMNydTwDMhyiDjry':['Security+',90],'N5mrEby0gKLFs1y88DpM':['Network+',90],'12396VsKMFLnPMXivHKQ':['A+ Core2',90]};
let total = 0;
for (const [id,[name,mock]] of Object.entries(banks)) {
  const qs = await db.collection('questions').where('examId','==',id).get();
  let servable=0, gradable=0;
  qs.forEach(d=>{const q=d.data(); if(q.status==='quarantined')return; servable++;
    const t=q.type; if(t===undefined||t===null||t==='mcq'||t==='emv') gradable++;});
  total += servable;
  const adv = (await db.collection('exams').doc(id).get()).data().questionCount;
  const flag = gradable < mock ? '  *** MOCK CANNOT FILL ***' : '';
  console.log(name.padEnd(10),'servable='+String(servable).padStart(4),'gradable='+String(gradable).padStart(4),
              'mock='+String(mock).padStart(4),'advertised='+String(adv).padStart(4), flag);
}
console.log('TOTAL servable across the four banks:', total);
process.exit(0);
