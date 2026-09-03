import { initializeApp, applicationDefault, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
if (!getApps().length) initializeApp({ credential: applicationDefault() });
const db = getFirestore();
const snap = await db.collection('questions').get();
console.log('TOTAL DOCS', snap.size);
let hasTypeField=0, hasQuestionTypeField=0, bothDiffer=0;
const typeVals={}, qTypeVals={};
let noCorrectAnswer=0, caNotNumber=0;
const badSamples=[];
const perExam={};
for (const d of snap.docs) {
  const q=d.data();
  if ('type' in q) hasTypeField++;
  if ('questionType' in q) hasQuestionTypeField++;
  if (q.type!==undefined && q.questionType!==undefined && q.type!==q.questionType) bothDiffer++;
  typeVals[String(q.type)] = (typeVals[String(q.type)]||0)+1;
  qTypeVals[String(q.questionType)] = (qTypeVals[String(q.questionType)]||0)+1;
  // simulate app: gradesBySingleIndex(q.type)
  const t=q.type;
  const passesFilter = (t===undefined||t===null||t==='mcq'||t==='emv');
  const e=q.examId??'(none)';
  perExam[e]=perExam[e]||{total:0,passesFilter:0,passesButNoCA:0,quarantined:0,activePassesNoCA:0};
  perExam[e].total++;
  if (q.quarantined===true) perExam[e].quarantined++;
  if (passesFilter) {
    perExam[e].passesFilter++;
    if (typeof q.correctAnswer !== 'number') {
      perExam[e].passesButNoCA++;
      if (q.quarantined!==true) perExam[e].activePassesNoCA++;
      if (badSamples.length<12) badSamples.push({id:d.id, examId:e, type:q.type, questionType:q.questionType, correctAnswer:q.correctAnswer, correctLabel:q.correctLabel, correctAnswers:q.correctAnswers, quarantined:q.quarantined===true, stem:String(q.stem??q.question??'').slice(0,80)});
    }
  }
  if (!('correctAnswer' in q)) noCorrectAnswer++;
  else if (typeof q.correctAnswer!=='number') caNotNumber++;
}
console.log('has type field:',hasTypeField,'has questionType field:',hasQuestionTypeField,'differ:',bothDiffer);
console.log('type values:',JSON.stringify(typeVals));
console.log('questionType values:',JSON.stringify(qTypeVals));
console.log('docs missing correctAnswer key:',noCorrectAnswer,'present but not number:',caNotNumber);
console.log('--- per exam ---');
for (const [k,v] of Object.entries(perExam)) console.log(k, JSON.stringify(v));
console.log('--- samples that pass the simulator filter but have no numeric correctAnswer ---');
for (const s of badSamples) console.log(JSON.stringify(s));
