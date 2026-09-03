import { initializeApp, applicationDefault, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
if (!getApps().length) initializeApp({ credential: applicationDefault() });
const db = getFirestore();
const LIVE = {
 '6kECziMtR1BS3MpABLW5':'PMP',
 '79cuGMNydTwDMhyiDjry':'SecPlus',
 'N5mrEby0gKLFs1y88DpM':'NetPlus',
 '12396VsKMFLnPMXivHKQ':'APlus',
};
const gradesSingle = t => t===undefined||t===null||t==='mcq'||t==='emv';
const snap = await db.collection('questions').get();
console.log('total docs', snap.size);
const byExam = {};
const problems = [];
for (const d of snap.docs) {
  const q = d.data();
  const e = LIVE[q.examId] || ('OTHER:'+q.examId);
  const t = q.type || '(none)';
  const quar = q.status === 'quarantined';
  byExam[e] = byExam[e] || {};
  const key = quar ? t+' [QUAR]' : t;
  byExam[e][key] = (byExam[e][key]||0)+1;
  if (quar) continue;
  if (!LIVE[q.examId]) continue;
  if (t === 'pbq' && !q.pbqConfig) problems.push(['pbq-no-config', d.id, e]);
  if (t === 'matching' && !q.matchPairs) problems.push(['matching-no-pairs', d.id, e]);
  if (t === 'multi-response' && (!Array.isArray(q.correctAnswers) || q.correctAnswers.length===0)) problems.push(['multi-no-key', d.id, e]);
  if (!q.domain) problems.push(['no-domain', d.id, e, t]);
  if (gradesSingle(q.type) && typeof q.correctAnswer !== 'number') problems.push(['no-correctAnswer', d.id, e, t]);
  if (gradesSingle(q.type) && (!Array.isArray(q.options) || q.options.length < 2)) problems.push(['no-options', d.id, e, t]);
  if (!q.explanation) problems.push(['no-explanation', d.id, e, t]);
}
console.log(JSON.stringify(byExam,null,1));
console.log('problems', problems.length);
const grouped = {};
problems.forEach(p=>{ grouped[p[0]] = grouped[p[0]]||[]; grouped[p[0]].push(p.slice(1).join(' ')); });
for (const k of Object.keys(grouped)) { console.log('##', k, grouped[k].length); console.log(grouped[k].slice(0,12).join('\n')); }
