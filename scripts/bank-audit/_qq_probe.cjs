process.env.GOOGLE_APPLICATION_CREDENTIALS = 'G:/Users/daveq/Cipher/functions/serviceAccountKey.json';
const admin = require('firebase-admin');
admin.initializeApp({ credential: admin.credential.applicationDefault() });
const db = admin.firestore();
(async () => {
  const snap = await db.collection('questions').get();
  console.log('total docs', snap.size);
  const byExam = {};
  const problems = [];
  snap.forEach(d => {
    const q = d.data();
    const e = q.examId || 'NO_EXAM';
    byExam[e] = byExam[e] || {};
    const t = q.type || '(none)';
    byExam[e][t] = (byExam[e][t]||0)+1;
    if (q.status === 'quarantined') { byExam[e]['__quarantined']=(byExam[e]['__quarantined']||0)+1; }
    if (t === 'pbq' && !q.pbqConfig) problems.push(['pbq-no-config', d.id, e]);
    if (t === 'matching' && !q.matchPairs) problems.push(['matching-no-pairs', d.id, e]);
    if (t === 'multi-response' && (!Array.isArray(q.correctAnswers) || q.correctAnswers.length===0)) problems.push(['multi-no-key', d.id, e]);
    if (!q.domain) problems.push(['no-domain', d.id, e, t]);
    if (gradesSingle(t) && typeof q.correctAnswer !== 'number') problems.push(['no-correctAnswer', d.id, e, t]);
    if (gradesSingle(t) && (!Array.isArray(q.options) || q.options.length < 2)) problems.push(['no-options', d.id, e, t]);
    if (!q.explanation) problems.push(['no-explanation', d.id, e, t]);
  });
  function gradesSingle(t){ return t==='(none)'||t==='mcq'||t==='emv'; }
  console.log(JSON.stringify(byExam,null,1));
  console.log('problems', problems.length);
  const grouped = {};
  problems.forEach(p=>{ grouped[p[0]] = grouped[p[0]]||[]; grouped[p[0]].push(p.slice(1).join(' ')); });
  for (const k of Object.keys(grouped)) { console.log('##', k, grouped[k].length); console.log(grouped[k].slice(0,12).join('\n')); }
  process.exit(0);
})().catch(e=>{console.error(e);process.exit(1);});
