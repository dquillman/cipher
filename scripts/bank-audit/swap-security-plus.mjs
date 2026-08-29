/**
 * One operation: quarantine the 50 off-topic Security+ questions AND insert the
 * 50 replacements, so the bank never drops below its current size.
 *
 *   node swap-security-plus.mjs              dry run — prints the plan, writes nothing
 *   node swap-security-plus.mjs --apply      execute
 *   node swap-security-plus.mjs --undo --apply   release the quarantined 50 and delete the 50 inserted
 *
 * Inserts first, then quarantines, so a failure part-way leaves the bank larger
 * rather than smaller. Requires admin credentials:
 *   $env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\serviceAccountKey.json"
 */
import { initializeApp, applicationDefault, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readFileSync } from 'node:fs';

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const UNDO  = args.includes('--undo');

if (!getApps().length) initializeApp({ credential: applicationDefault() });
const db = getFirestore();
const col = db.collection('questions');

const pull = JSON.parse(readFileSync('./quarantine-list.json', 'utf8'));
const add  = JSON.parse(readFileSync('./seed/security-plus-replacements.json', 'utf8'));
const EXAM = pull.examId;
if (add.examId !== EXAM) throw new Error('exam id mismatch between the two files');

const before = (await col.where('examId', '==', EXAM).get()).docs
  .filter(d => d.data().status !== 'quarantined').length;
console.log(`\n${pull.examName}\n  servable now: ${before}`);

if (UNDO) {
  const inserted = await col.where('examId','==',EXAM).where('source','==',add.source).get();
  const quarantined = await col.where('examId','==',EXAM).where('status','==','quarantined').get();
  console.log(`  UNDO: release ${quarantined.size} quarantined, delete ${inserted.size} inserted${APPLY?'':'   [DRY RUN]'}`);
  if (!APPLY) process.exit(0);
  let b = db.batch();
  quarantined.docs.forEach(d => b.update(d.ref, { status: FieldValue.delete() }));
  inserted.docs.forEach(d => b.delete(d.ref));
  await b.commit();
  console.log('  undo complete');
  process.exit(0);
}

// ---- validate before touching anything ----
const snaps = await Promise.all(pull.ids.map(id => col.doc(id).get()));
const missing = [], wrongBank = [], toPull = [];
snaps.forEach((s, i) => {
  if (!s.exists) return missing.push(pull.ids[i]);
  if (s.data().examId !== EXAM) return wrongBank.push(pull.ids[i]);
  if (s.data().status !== 'quarantined') toPull.push(s.id);
});
const dup = await col.where('examId','==',EXAM).where('source','==',add.source).get();

console.log(`  to quarantine: ${toPull.length}` + (missing.length?`  (${missing.length} ids not found)`:'') + (wrongBank.length?`  (${wrongBank.length} wrong bank — skipped)`:''));
console.log(`  to insert:     ${add.questions.length}` + (dup.size?`  !! ${dup.size} already present with source ${add.source} — rerun would duplicate`:''));
console.log(`  servable after: ${before - toPull.length + add.questions.length}`);
if (dup.size) { console.log('\n  ABORT: replacements appear to be inserted already. Use --undo --apply to reverse, then re-run.'); process.exit(1); }
if (!APPLY) { console.log('\nDry run. Re-run with --apply to execute.'); process.exit(0); }

// ---- insert first, so a partial failure leaves the bank bigger, not smaller ----
let batch = db.batch(), n = 0;
for (const q of add.questions) {
  batch.set(col.doc(), { ...q, examId: EXAM, source: add.source, createdAt: FieldValue.serverTimestamp() });
  if (++n % 400 === 0) { await batch.commit(); batch = db.batch(); }
}
await batch.commit();
console.log(`  inserted ${add.questions.length}`);

batch = db.batch(); n = 0;
for (const id of toPull) {
  batch.update(col.doc(id), { status: 'quarantined' });
  if (++n % 400 === 0) { await batch.commit(); batch = db.batch(); }
}
await batch.commit();
console.log(`  quarantined ${toPull.length}`);

// ---- read back rather than trusting the writes ----
const all = await col.where('examId','==',EXAM).get();
const servable = all.docs.filter(d => d.data().status !== 'quarantined');
const byDom = {};
servable.forEach(d => { const k = d.data().domain || '?'; byDom[k] = (byDom[k]||0)+1; });
const stillBad = pull.ids.filter(id => { const d = all.docs.find(x => x.id === id); return d && d.data().status !== 'quarantined'; });
console.log(`\nVerified: ${servable.size ?? servable.length} servable questions`);
console.log(Object.entries(byDom).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`  ${String(v).padStart(3)}  ${k}`).join('\n'));
if (stillBad.length) console.log(`\n!! ${stillBad.length} target(s) did not take: ${stillBad.join(', ')}`);
console.log(`\nUndo everything with: node swap-security-plus.mjs --undo --apply`);
