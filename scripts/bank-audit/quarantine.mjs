/**
 * Quarantines an explicit list of question IDs. Sets status:'quarantined';
 * the app treats a missing status as active, so nothing else is affected.
 *
 *   node quarantine.mjs                    dry run (default) — prints, writes nothing
 *   node quarantine.mjs --apply            write
 *   node quarantine.mjs --release --apply  clear the field again (full undo)
 *   node quarantine.mjs --list other.json  use a different ID list
 *
 * Reads scripts/bank-audit/quarantine-list.json by default. That list was
 * produced by reading every bank and flagging the two known failure modes, then
 * checked by hand — an explicit ID list, not a regex run at write time, so what
 * gets written is exactly what was reviewed.
 *
 * The app-side filter (web/src/utils/questionStatus.ts) shipped to production
 * on 2026-08-29, so the field is honoured as soon as it is written.
 */
import { initializeApp, applicationDefault, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readFileSync } from 'node:fs';

const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const val = (f) => { const i = args.indexOf(f); return i === -1 ? null : args[i + 1]; };

const APPLY = has('--apply');
const RELEASE = has('--release');
const LIST = val('--list') ?? './quarantine-list.json';

if (!getApps().length) initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const list = JSON.parse(readFileSync(LIST, 'utf8'));
const ids = [...new Set(list.ids)];
console.log(`\n${list.examName} — ${ids.length} question(s) in ${LIST}`);

// Read every target first: confirm it exists, and show what is being acted on.
const snaps = await Promise.all(ids.map((id) => db.collection('questions').doc(id).get()));
const missing = [], wrongBank = [], targets = [];
snaps.forEach((s, i) => {
  if (!s.exists) return missing.push(ids[i]);
  const d = s.data();
  if (list.examId && d.examId !== list.examId) return wrongBank.push({ id: ids[i], examId: d.examId });
  targets.push({ id: ids[i], status: d.status ?? '(none)', stem: (d.stem ?? '').slice(0, 88) });
});

if (missing.length)   console.log(`\n  !! ${missing.length} id(s) not found: ${missing.join(', ')}`);
if (wrongBank.length) console.log(`\n  !! ${wrongBank.length} id(s) belong to another bank — SKIPPED:`, wrongBank);

const todo = RELEASE ? targets.filter(t => t.status === 'quarantined')
                     : targets.filter(t => t.status !== 'quarantined');

console.log(`\n${RELEASE ? 'RELEASE' : 'QUARANTINE'}: ${todo.length} to change, ${targets.length - todo.length} already in the desired state${APPLY ? '' : '   [DRY RUN — nothing written]'}\n`);
for (const t of todo) console.log(`  ${t.id}  ${t.stem}`);

if (!APPLY) { console.log(`\nDry run. Re-run with --apply to write.`); process.exit(0); }
if (!todo.length) { console.log('Nothing to do.'); process.exit(0); }

for (let i = 0; i < todo.length; i += 400) {
  const batch = db.batch();
  for (const t of todo.slice(i, i + 400)) {
    batch.update(db.collection('questions').doc(t.id),
      RELEASE ? { status: FieldValue.delete() } : { status: 'quarantined' });
  }
  await batch.commit();
  console.log(`  committed ${Math.min(i + 400, todo.length)}/${todo.length}`);
}

// Read back every document rather than trusting the write.
const after = await Promise.all(todo.map((t) => db.collection('questions').doc(t.id).get()));
const want = RELEASE ? undefined : 'quarantined';
const bad = after.filter((s) => s.data()?.status !== want);
console.log(bad.length
  ? `\n!! ${bad.length} document(s) did not take: ${bad.map(s => s.id).join(', ')}`
  : `\nVerified: all ${todo.length} document(s) now status=${want ?? '(none)'}.`);
console.log(`\nUndo with: node quarantine.mjs --release --apply`);
