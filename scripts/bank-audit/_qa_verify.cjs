const admin = require('firebase-admin');
admin.initializeApp({credential: admin.credential.cert(require('G:/Users/daveq/Cipher/functions/serviceAccountKey.json'))});
const db = admin.firestore();
(async () => {
  const exams = await db.collection('exams').get();
  console.log('exams:', exams.size);
  for (const d of exams.docs) {
    const x = d.data();
    console.log(d.id, '|', x.name, '| published:', x.isPublished, '| domains:', JSON.stringify(x.domains));
  }
  const qs = await db.collection('questions').get();
  console.log('questions:', qs.size);
  const doms = new Map();
  for (const q of qs.docs) {
    const dd = q.data().domain;
    doms.set(dd, (doms.get(dd)||0)+1);
  }
  console.log([...doms.entries()].sort((a,b)=>b[1]-a[1]));
})().catch(e=>{console.error(e); process.exit(1);});
