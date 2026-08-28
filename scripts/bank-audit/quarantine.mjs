/**
 * Sets status:'quarantined' on questions that contain none of their exam's
 * domain vocabulary. The app treats a missing status as active, so anything
 * this does not touch is unaffected.
 *
 *   node quarantine.mjs                    dry run (default) — prints, writes nothing
 *   node quarantine.mjs --apply            write
 *   node quarantine.mjs --exam <examId>    limit to one bank
 *   node quarantine.mjs --source <name>    limit to one source, e.g. AI-AutoLeveler
 *   node quarantine.mjs --release --apply  clear status on everything it set
 *
 * Deploy the app first: the filter lives in web/src/utils/questionStatus.ts.
 * Writing the field before that ships is harmless but has no effect.
 */
import { initializeApp, applicationDefault, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { EXAM_VOCAB } from './vocab.mjs';

const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const val = (f) => { const i = args.indexOf(f); return i === -1 ? null : args[i + 1]; };

const APPLY = has('--apply');
const RELEASE = has('--release');
const ONLY_EXAM = val('--exam');
const ONLY_SOURCE = val('--source');

if (!getApps().length) initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const snap = await db.collection('questions').get();
const targets = [];

for (const doc of snap.docs) {
    const q = doc.data();

    if (RELEASE) {
        if (q.status === 'quarantined') targets.push({ id: doc.id, reason: 'release', stem: (q.stem ?? '').slice(0, 90) });
        continue;
    }

    if (ONLY_EXAM && q.examId !== ONLY_EXAM) continue;
    if (ONLY_SOURCE && q.source !== ONLY_SOURCE) continue;
    if (q.status === 'quarantined') continue;
    if (q.type === 'matching' || q.type === 'pbq') continue;  // content lives outside stem/options

    const vocabEntry = EXAM_VOCAB[q.examId];
    if (!vocabEntry) continue;                                 // never guess on an unconfigured bank

    const haystack = [q.stem ?? '', ...(q.options ?? [])].join(' ');
    if (!vocabEntry[1].test(haystack)) {
        targets.push({ id: doc.id, exam: vocabEntry[0], source: q.source ?? '(none)', domain: q.domain ?? '', stem: (q.stem ?? '').slice(0, 90) });
    }
}

const verb = RELEASE ? 'RELEASE' : 'QUARANTINE';
console.log(`\n${verb}: ${targets.length} question(s)${APPLY ? '' : '   [DRY RUN — nothing written]'}\n`);
for (const t of targets) console.log(`  ${t.id}  ${(t.source ?? '').padEnd(26)} ${t.stem}`);

if (!APPLY) {
    console.log(`\nDry run. Re-run with --apply to write.`);
    process.exit(0);
}
if (!targets.length) { console.log('Nothing to do.'); process.exit(0); }

let written = 0;
for (let i = 0; i < targets.length; i += 400) {
    const batch = db.batch();
    for (const t of targets.slice(i, i + 400)) {
        batch.update(db.collection('questions').doc(t.id),
            RELEASE ? { status: FieldValue.delete() } : { status: 'quarantined' });
    }
    await batch.commit();
    written += Math.min(400, targets.length - i);
    console.log(`  committed ${written}/${targets.length}`);
}

// Read back a sample rather than trusting the write.
const check = await Promise.all(targets.slice(0, 5).map((t) => db.collection('questions').doc(t.id).get()));
console.log('\nVerification (first 5):');
for (const d of check) console.log(`  ${d.id}  status=${d.data()?.status ?? '(none)'}`);
console.log(`\nDone. ${written} document(s) updated. Reverse with: node quarantine.mjs --release --apply`);
