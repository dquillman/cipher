import { initializeApp, applicationDefault, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
if (!getApps().length) initializeApp({ credential: applicationDefault() });
const db = getFirestore();
const ids = {'6kECziMtR1BS3MpABLW5':'PMP v2026','79cuGMNydTwDMhyiDjry':'Sec+','N5mrEby0gKLFs1y88DpM':'Net+','12396VsKMFLnPMXivHKQ':'A+ Core2'};
for (const [id,name] of Object.entries(ids)) {
  const qs = await db.collection('questions').where('examId','==',id).get();
  const doms={}, bl={}; let serv=0;
  for (const d of qs.docs){ const x=d.data();
    if (x.status==='quarantined') continue;
    serv++;
    doms[x.domain||'(none)']=(doms[x.domain||'(none)']||0)+1;
    bl[x.bloomLevel||x.bloom||'(none)']=(bl[x.bloomLevel||x.bloom||'(none)']||0)+1;
  }
  console.log(name,'total',qs.size,'servable',serv);
  console.log('  domains('+Object.keys(doms).length+')',JSON.stringify(doms));
  console.log('  bloom',JSON.stringify(bl));
}
const ex = await db.collection('exams').get();
console.log('EXAMS',ex.size);
for(const d of ex.docs) console.log('  ',d.id,JSON.stringify(d.data().name),'published=',d.data().isPublished, d.data().unpublishedReason?('reason:'+d.data().unpublishedReason):'');
