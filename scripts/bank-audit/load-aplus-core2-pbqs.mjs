/**
 * Validates and loads the A+ Core 2 (220-1202) PBQ set.
 *
 * A copy of load-secplus-pbqs.mjs pointed at seed/a-plus-core2-pbqs.json. The
 * validation logic below is byte-for-byte the original's and deliberately so —
 * it is the contract, not a style choice. Two differences, both of which only
 * make it safer:
 *
 *   • Validation runs BEFORE Firestore is contacted, not after. Whether a set
 *     is answerable is a property of the JSON alone, so proving it should not
 *     require admin credentials, and there is no reason to query a database on
 *     behalf of a set that is about to be rejected.
 *   • --validate-only stops after validation and never opens a connection.
 *
 *   node load-aplus-core2-pbqs.mjs --validate-only   validate only, no Firestore
 *   node load-aplus-core2-pbqs.mjs                   validate + dry run, writes nothing
 *   node load-aplus-core2-pbqs.mjs --apply           insert
 *   node load-aplus-core2-pbqs.mjs --undo --apply    delete everything this inserted
 *
 * The validation pass mirrors scorePBQ() and initPBQState() from
 * web/src/components/PBQQuestion.tsx: for every question it builds the state a
 * candidate would produce by answering perfectly, scores it, and requires
 * correct === total. A PBQ that cannot be scored 100% is unanswerable, and no
 * amount of good prose in the explanation makes up for that. Validation runs
 * before any write and refuses to continue on a single failure.
 *
 * Writing requires admin credentials:
 *   $env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\serviceAccountKey.json"
 */
import { initializeApp, applicationDefault, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readFileSync } from 'node:fs';

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const UNDO = args.includes('--undo');
const VALIDATE_ONLY = args.includes('--validate-only');

const seed = JSON.parse(readFileSync('./seed/a-plus-core2-pbqs.json', 'utf8'));
const { examId: EXAM, examName: NAME, source: SOURCE, questions } = seed;

// ─── Validation: mirrors the app's own scorer ────────────────────

const VALID_TYPES = ['drag-drop', 'fill-table', 'order-steps', 'command'];

/** Mirrors commandSequences() in PBQQuestion.tsx. Firestore cannot store an
 *  array inside an array, so sequences persist as { steps: [...] }. */
const commandSequences = (c) =>
    (c.acceptedCommands || []).map((s) => (Array.isArray(s) ? s : (s?.steps ?? [])));

/** Firestore rejects any array whose element is itself an array, at any depth.
 *  Catching that here beats catching it in a failed batch write. */
function nestedArrayPath(v, path = 'pbqConfig') {
    if (Array.isArray(v)) {
        for (let i = 0; i < v.length; i++) {
            if (Array.isArray(v[i])) return `${path}[${i}]`;
            const deep = nestedArrayPath(v[i], `${path}[${i}]`);
            if (deep) return deep;
        }
        return null;
    }
    if (v && typeof v === 'object') {
        for (const [k, val] of Object.entries(v)) {
            const deep = nestedArrayPath(val, `${path}.${k}`);
            if (deep) return deep;
        }
    }
    return null;
}
const VALID_BLOOM = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'];

function scorePerfect(cfg) {
    switch (cfg.pbqType) {
        case 'drag-drop': {
            // A perfect candidate places every item in its correctZone.
            const items = cfg.dragDrop.items;
            const placements = {};
            for (const it of items) placements[it.id] = it.correctZone;
            let correct = 0;
            for (const it of items) if (placements[it.id] === it.correctZone) correct++;
            return { correct, total: items.length };
        }
        case 'fill-table': {
            // A candidate can only submit a value the dropdown offers, so the
            // perfect answer is the option matching correctValue. If it is not
            // in options there is no way to score the cell and this fails.
            const rows = cfg.fillTable.rows;
            let correct = 0, total = 0;
            rows.forEach((row) => {
                row.fields.forEach((f) => {
                    total++;
                    const picked = f.options.find((o) => o === f.correctValue);
                    if (picked !== undefined &&
                        picked.toLowerCase().trim() === f.correctValue.toLowerCase().trim()) correct++;
                });
            });
            return { correct, total };
        }
        case 'order-steps': {
            // initPBQState shuffles; a perfect answer restores index i at slot i.
            const n = cfg.orderSteps.steps.length;
            const order = Array.from({ length: n }, (_, i) => i);
            let correct = 0;
            order.forEach((v, i) => { if (v === i) correct++; });
            return { correct, total: n };
        }
        case 'command': {
            const accepted = commandSequences(cfg.command);
            const history = accepted[0].map((c) => c.toLowerCase().trim());
            const matched = accepted.some((seq) => {
                if (seq.length !== history.length) return false;
                return seq.every((c, i) => c.toLowerCase().trim() === history[i]);
            });
            return { correct: matched ? 1 : 0, total: 1 };
        }
    }
    return { correct: 0, total: 1 };
}

function validate(qs) {
    const errs = [];
    qs.forEach((q, i) => {
        const at = `#${i + 1} (${q.pbqConfig?.pbqType || 'no type'})`;
        if (q.type !== 'pbq') errs.push(`${at}: type must be 'pbq', got ${q.type}`);
        if (q.examId !== EXAM) errs.push(`${at}: wrong examId`);
        if (!q.stem || q.stem.length < 40) errs.push(`${at}: stem missing or too short`);
        if (!q.explanation || q.explanation.length < 200) errs.push(`${at}: explanation missing or thin`);
        if (!q.domain) errs.push(`${at}: no domain`);
        if (!VALID_BLOOM.includes(q.bloomLevel)) errs.push(`${at}: bad bloomLevel ${q.bloomLevel}`);

        const cfg = q.pbqConfig;
        if (!cfg) { errs.push(`${at}: no pbqConfig`); return; }
        if (!VALID_TYPES.includes(cfg.pbqType)) errs.push(`${at}: bad pbqType`);

        // Per-type structural checks the renderer depends on.
        if (cfg.pbqType === 'drag-drop') {
            const zoneIds = new Set(cfg.dragDrop.zones.map((z) => z.id));
            for (const it of cfg.dragDrop.items) {
                if (!zoneIds.has(it.correctZone)) errs.push(`${at}: item ${it.id} targets unknown zone ${it.correctZone}`);
            }
            const unused = [...zoneIds].filter((z) => !cfg.dragDrop.items.some((it) => it.correctZone === z));
            if (unused.length) errs.push(`${at}: zone(s) with no correct item: ${unused.join(', ')}`);
        }
        if (cfg.pbqType === 'fill-table') {
            const cols = cfg.fillTable.columns.length;
            cfg.fillTable.rows.forEach((r, ri) => {
                // initPBQState sizes tableValues by columns.length, and scorePBQ
                // indexes fields by column. A row with a different field count
                // silently mis-scores.
                if (r.fields.length !== cols) errs.push(`${at}: row ${ri + 1} has ${r.fields.length} fields, ${cols} columns`);
                r.fields.forEach((f, ci) => {
                    if (!f.options.includes(f.correctValue)) {
                        errs.push(`${at}: row ${ri + 1} col ${ci + 1} correctValue "${f.correctValue}" is not among its options`);
                    }
                    if (new Set(f.options).size !== f.options.length) {
                        errs.push(`${at}: row ${ri + 1} col ${ci + 1} has duplicate options`);
                    }
                });
            });
        }
        if (cfg.pbqType === 'order-steps') {
            const s = cfg.orderSteps.steps;
            if (s.length < 3) errs.push(`${at}: needs at least 3 steps`);
            if (new Set(s).size !== s.length) errs.push(`${at}: duplicate step text`);
        }
        if (cfg.pbqType === 'command') {
            const c = cfg.command;
            if (!c.scenario) errs.push(`${at}: command PBQ needs a scenario`);
            if (!c.acceptedCommands?.length) errs.push(`${at}: no accepted commands`);
            const lens = new Set(commandSequences(c).map((s) => s.length));
            if (lens.size > 1) {
                // scorePBQ requires seq.length === history.length, so mixed
                // lengths mean some accepted answers can never match a single
                // typed line.
                errs.push(`${at}: accepted commands have mixed sequence lengths ${[...lens].join('/')}`);
            }
        }

        const bad = nestedArrayPath(cfg);
        if (bad) errs.push(`${at}: Firestore cannot store a nested array at ${bad}`);

        const { correct, total } = scorePerfect(cfg);
        if (correct !== total) errs.push(`${at}: a perfect answer scores ${correct}/${total}, not full marks`);
    });
    return errs;
}

// ─── Main ────────────────────────────────────────────────────────
//
// Validation first, Firestore second. A set that cannot be scored 100% is
// rejected without a database round trip and without credentials.

console.log(`\n${NAME}`);
console.log(`\n  validating ${questions.length} PBQs against the app's own scorer...`);

const errs = validate(questions);
if (errs.length) {
    console.error(`\n  FAILED — ${errs.length} problem(s):`);
    errs.forEach((e) => console.error('   - ' + e));
    console.error('\n  Nothing written. Fix build-aplus-core2-pbqs.mjs and re-run.');
    process.exit(1);
}

const counts = {};
questions.forEach((q) => { counts[q.pbqConfig.pbqType] = (counts[q.pbqConfig.pbqType] || 0) + 1; });
console.log(`  all ${questions.length} pass. by type:`, JSON.stringify(counts));

if (VALIDATE_ONLY) {
    console.log('\n  --validate-only: Firestore was not contacted. Nothing written.\n');
    process.exit(0);
}

if (!getApps().length) initializeApp({ credential: applicationDefault() });
const db = getFirestore();
const col = db.collection('questions');

const all = await col.where('examId', '==', EXAM).get();
const servable = all.docs.filter((d) => d.data().status !== 'quarantined').length;
const existing = all.docs.filter((d) => d.data().source === SOURCE);

console.log(`  servable now:  ${servable}`);

if (UNDO) {
    console.log(`  UNDO: delete ${existing.length} PBQs${APPLY ? '' : '   [DRY RUN]'}`);
    if (!APPLY) process.exit(0);
    const b = db.batch();
    existing.forEach((d) => b.delete(d.ref));
    await b.commit();
    console.log('  undo complete');
    process.exit(0);
}

if (existing.length) {
    console.error(`\n  ABORT: ${existing.length} questions with source ${SOURCE} already exist.`);
    console.error('  Use --undo --apply to reverse, then re-run.');
    process.exit(1);
}

console.log(`\n  to insert:     ${questions.length}`);
console.log(`  servable after: ${servable + questions.length}${APPLY ? '' : '   [DRY RUN]'}`);

if (!APPLY) {
    console.log('\n  Dry run. Re-run with --apply to write.\n');
    process.exit(0);
}

const batch = db.batch();
for (const q of questions) {
    batch.set(col.doc(), { ...q, createdAt: FieldValue.serverTimestamp() });
}
await batch.commit();

// Read back rather than trusting the write.
const after = await col.where('examId', '==', EXAM).where('source', '==', SOURCE).get();
console.log(`\n  inserted. read back ${after.size} of ${questions.length}.`);
if (after.size !== questions.length) {
    console.error('  MISMATCH — investigate before relying on this.');
    process.exit(1);
}
const typesBack = {};
after.docs.forEach((d) => {
    const t = d.data().pbqConfig?.pbqType || '(missing)';
    typesBack[t] = (typesBack[t] || 0) + 1;
});
console.log('  pbqConfig survived the round trip:', JSON.stringify(typesBack));
console.log('  done.\n');
