/**
 * Validates and loads the SECOND Security+ PBQ set (seed/security-plus-pbqs-v2.json).
 *
 *   node load-secplus-pbqs-v2.mjs --validate-only   validate offline, no credentials needed
 *   node load-secplus-pbqs-v2.mjs                   validate + Firestore dry run, writes nothing
 *   node load-secplus-pbqs-v2.mjs --apply           insert
 *   node load-secplus-pbqs-v2.mjs --undo --apply    delete everything this inserted
 *
 * Sibling of load-secplus-pbqs.mjs, which is untouched and still owns the v1
 * seed. Three deliberate differences here:
 *
 *  1. Validation runs BEFORE Firestore is contacted. The original queries the
 *     collection first, so on a machine without admin credentials it throws
 *     before it ever validates — which meant the author of a seed file could
 *     not check their own work. --validate-only stops after the gate and
 *     never loads firebase-admin at all.
 *  2. The v1 checks are carried over verbatim, then extra ones are added:
 *     controlled domain and difficulty strings, the 400-character explanation
 *     bar, source agreement, and accepted-command sequences that collapse to
 *     duplicates once the scorer lowercases them.
 *  3. It cross-checks the v1 seed so a scenario cannot be silently re-authored.
 *
 * Requires admin credentials for anything past --validate-only:
 *   $env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\serviceAccountKey.json"
 */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const UNDO = args.includes('--undo');
const VALIDATE_ONLY = args.includes('--validate-only');

const SEED_PATH = join(HERE, 'seed', 'security-plus-pbqs-v2.json');
const V1_PATH = join(HERE, 'seed', 'security-plus-pbqs.json');

const seed = JSON.parse(readFileSync(SEED_PATH, 'utf8'));
const { examId: EXAM, examName: NAME, source: SOURCE, questions } = seed;

// ─── Validation: mirrors the app's own scorer ────────────────────

const VALID_TYPES = ['drag-drop', 'fill-table', 'order-steps', 'command'];
const VALID_BLOOM = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'];
const VALID_DIFFICULTY = ['easy', 'medium', 'hard'];
const VALID_DOMAINS = [
    'General Security Concepts',
    'Threats, Vulnerabilities, and Mitigations',
    'Security Architecture',
    'Security Operations',
    'Security Program Management and Oversight',
];
const MIN_EXPLANATION = 400;

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

/** Counts the decisions scorePBQ grades independently. The bar this set is
 *  written against awards partial credit, so a question that grades one
 *  all-or-nothing decision is doing less work than one that grades eight. */
function decisionCount(cfg) {
    if (cfg.pbqType === 'drag-drop') return cfg.dragDrop.items.length;
    if (cfg.pbqType === 'order-steps') return cfg.orderSteps.steps.length;
    if (cfg.pbqType === 'fill-table') return cfg.fillTable.rows.reduce((m, r) => m + r.fields.length, 0);
    return 1;
}

/* ── v3 gates ────────────────────────────────────────────────────
   Added after a critic took the first draft of this seed apart. Each one
   corresponds to a defect that shipped, so a regression fails the load
   instead of reaching a candidate.

   PBQQuestion.tsx shuffles at render now, but that alone is not enough: the
   seed file and the Firestore document are readable, and an authored order
   that encodes the key is an answer key wherever it is read. Both ends stay
   fixed. */

/** Item order readable as zone order — 25 of the 43 layout-leaked marks in
 *  the first draft. Monotone catches "listed in zone order"; the adjacency
 *  cap catches block-listing, where items arrive grouped by zone. */
function dragDropOrderLeak(dd) {
    const idx = dd.items.map((it) => dd.zones.findIndex((z) => z.id === it.correctZone));
    if (idx.every((v, i) => i === 0 || idx[i - 1] <= v)) return 'items are listed in zone order';
    if (idx.every((v, i) => i === 0 || idx[i - 1] >= v)) return 'items are listed in reverse zone order';
    let adjacent = 0;
    for (let i = 1; i < idx.length; i++) if (idx[i] === idx[i - 1]) adjacent++;
    if (adjacent > 1) return 'items arrive block-listed by zone';
    if (idx[0] === 0) return 'the first item belongs to the first zone';
    return null;
}

/** Correct answers readable off option positions — FT14 and FT16 in the first
 *  draft were perfect diagonals, 18 free marks between them. */
function fillTableOrderLeak(ft) {
    const idxOf = (r, c) => ft.rows[r].fields[c].options.indexOf(ft.rows[r].fields[c].correctValue);
    for (let c = 0; c < ft.columns.length; c++) {
        const col = ft.rows.map((_, r) => idxOf(r, c));
        if (col.every((v, r) => v === r)) return `column ${c + 1} is a diagonal (correct option index === row index)`;
        if (col.every((v) => v === col[0])) return `column ${c + 1} always has its answer at option ${col[0] + 1}`;
        if (c > 0) {
            const first = ft.rows.map((_, r) => idxOf(r, 0));
            if (col.every((v, r) => v === first[r])) return `column ${c + 1} option index tracks column 1 in every row`;
        }
    }
    return null;
}

/** A later column whose value is a lookup of the first column's value is not
 *  an independent decision, however many cells scorePBQ counts. Three tables
 *  in the first draft sold 14 dependent cells as independent ones. Proof of
 *  independence is two rows that agree in column one and disagree later. */
function dependentColumn(ft) {
    for (let c = 1; c < ft.columns.length; c++) {
        const seen = new Map();
        let independent = false;
        for (const row of ft.rows) {
            const key = row.fields[0].correctValue;
            const val = row.fields[c].correctValue;
            if (seen.has(key) && seen.get(key) !== val) { independent = true; break; }
            seen.set(key, val);
        }
        if (!independent) return `column ${c + 1} is determined by column 1 — no two rows agree in column 1 and differ here`;
    }
    return null;
}

/* Step text that announces its own position. "before any account or device is
 * touched" and "once legal closes the matter" made two positions free in the
 * first draft. The order is the answer; it does not belong in the steps. */
const ORDERING_TELLS = /\b(first|firstly|second|secondly|third|thirdly|then|next|finally|lastly|initially|afterwards?|beforehand|prior|before|after|once|subsequently|earlier|later)\b/i;

/* Tool and flag names that are also ordinary English. Naming the object of a
 * question is legitimate; naming the instrument is the leak. Kept short and
 * explicit — every addition widens the hole. */
const AMBIGUOUS_TOKENS = new Set(['host', 'group', 'net', 'all', 'show', 'list', 'name', 'status']);

/** The binary a command actually runs: the last pipe segment (so
 *  `echo | openssl s_client` is openssl, not echo), minus sudo and any
 *  leading flag, with trailing version digits stripped so gpg/gpg2 does not
 *  masquerade as a choice of tool. */
function primaryBinary(cmd) {
    const seg = cmd.toLowerCase().split('|').pop().trim();
    const tok = seg.split(/\s+/).filter((t) => t && t !== 'sudo' && !t.startsWith('-'));
    return (tok[0] || '').replace(/\d+$/, '');
}

function commandLeaks(c) {
    const out = [];
    const seqs = commandSequences(c);
    const tokens = new Set();
    for (const cmd of seqs.flat()) {
        tokens.add(primaryBinary(cmd));
        for (const t of cmd.toLowerCase().split(/\s+/)) {
            if (t.startsWith('-') && t.length > 1) tokens.add(t.replace(/^-+/, ''));
        }
    }
    const haystack = (c.scenario + ' ' + (c.hints || []).join(' ')).toLowerCase();
    for (const t of tokens) {
        if (t.length < 3 || AMBIGUOUS_TOKENS.has(t)) continue;
        if (new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(haystack)) {
            out.push(`scenario or hint names "${t}", which is in its own accepted commands`);
        }
    }
    // One plausible tool makes the question a syntax recall test.
    const bins = new Set(seqs.flat().map(primaryBinary));
    if (bins.size < 2) out.push(`only one plausible tool (${[...bins].join(', ')})`);
    return out;
}

/* The first draft shipped an access-review drag-drop and an access-review
 * fill-table that keyed the same conditions off the same shared login. The
 * 5-gram check missed it because it measures wording and only ran against the
 * OLD seed, never pairwise within the new one. This runs pairwise, on the
 * labels a candidate actually reads and on the rare tokens of the whole
 * question. */
const STOP = new Set(['which', 'their', 'there', 'these', 'those', 'where', 'while', 'would', 'could', 'should',
    'about', 'every', 'other', 'after', 'before', 'never', 'still', 'because', 'rather', 'without', 'against',
    'something', 'nothing', 'anything', 'question', 'answer', 'candidate']);

function surfaceOf(q) {
    const cfg = q.pbqConfig, labels = [];
    if (cfg.pbqType === 'drag-drop') {
        labels.push(...cfg.dragDrop.zones.map((z) => z.label), ...cfg.dragDrop.items.map((i) => i.label));
    } else if (cfg.pbqType === 'fill-table') {
        labels.push(...cfg.fillTable.rows.map((r) => r.label));
        for (const r of cfg.fillTable.rows) for (const f of r.fields) labels.push(...f.options);
    } else if (cfg.pbqType === 'order-steps') {
        labels.push(...cfg.orderSteps.steps);
    } else {
        labels.push(cfg.command.scenario);
    }
    const text = (q.stem + ' ' + labels.join(' ')).toLowerCase();
    const tokens = new Set((text.match(/[a-z][a-z-]{4,}/g) || []).filter((w) => !STOP.has(w)));
    return { labels: new Set(labels.filter((l) => l.length >= 12)), tokens };
}

function internalOverlap(qs) {
    const errs = [];
    const surfaces = qs.map(surfaceOf);
    for (let i = 0; i < qs.length; i++) {
        for (let j = i + 1; j < qs.length; j++) {
            const a = surfaces[i], b = surfaces[j];
            const sharedLabels = [...a.labels].filter((l) => b.labels.has(l));
            if (sharedLabels.length >= 3) {
                errs.push(`#${i + 1} and #${j + 1} share ${sharedLabels.length} labels verbatim — likely the same question twice`);
            }
            const shared = [...a.tokens].filter((t) => b.tokens.has(t)).length;
            const jaccard = shared / (a.tokens.size + b.tokens.size - shared);
            if (jaccard > 0.32) {
                errs.push(`#${i + 1} and #${j + 1} overlap ${(jaccard * 100).toFixed(0)}% on rare tokens — check they are not the same scenario`);
            }
        }
    }
    return errs;
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

        // ── added in v2 ──
        if (q.source !== SOURCE) errs.push(`${at}: source is "${q.source}", expected "${SOURCE}"`);
        if (!VALID_DOMAINS.includes(q.domain)) errs.push(`${at}: "${q.domain}" is not a domain string this exam uses`);
        if (!VALID_DIFFICULTY.includes(q.difficulty)) errs.push(`${at}: bad difficulty ${q.difficulty}`);
        if (q.explanation && q.explanation.length < MIN_EXPLANATION) {
            errs.push(`${at}: explanation is ${q.explanation.length} chars, under the ${MIN_EXPLANATION} bar`);
        }
        // Quiz.tsx renders the stem in an <h2> with no whitespace-pre-* class,
        // so a newline collapses to a space and any table pasted into a stem
        // arrives as one run-on line. Structured evidence belongs in the config.
        if (/\n/.test(q.stem || '')) errs.push(`${at}: stem contains a newline, which the renderer collapses`);

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
            // added in v2: placements are keyed by item id, so a duplicate id
            // makes two items share one answer slot.
            const ids = cfg.dragDrop.items.map((it) => it.id);
            if (new Set(ids).size !== ids.length) errs.push(`${at}: duplicate item id`);
            if (new Set(zoneIds).size !== cfg.dragDrop.zones.length) errs.push(`${at}: duplicate zone id`);
            // added in v3: as many items as zones means the last placement is
            // free by elimination. Three questions in the first draft were
            // bijections and gave that mark away.
            if (cfg.dragDrop.items.length <= cfg.dragDrop.zones.length) {
                errs.push(`${at}: ${cfg.dragDrop.items.length} items for ${cfg.dragDrop.zones.length} zones — the last placement is free by elimination`);
            }
            const ddLeak = dragDropOrderLeak(cfg.dragDrop);
            if (ddLeak) errs.push(`${at}: layout leaks the key — ${ddLeak}`);
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
                    // added in v2: the scorer compares case-insensitively, so two
                    // options differing only in case are one answer wearing two hats.
                    const folded = f.options.map((o) => o.toLowerCase().trim());
                    if (new Set(folded).size !== folded.length) {
                        errs.push(`${at}: row ${ri + 1} col ${ci + 1} options collide once lowercased`);
                    }
                });
            });
            const ftLeak = fillTableOrderLeak(cfg.fillTable);
            if (ftLeak) errs.push(`${at}: layout leaks the key — ${ftLeak}`);
            const dep = dependentColumn(cfg.fillTable);
            if (dep) errs.push(`${at}: ${dep}`);
        }
        if (cfg.pbqType === 'order-steps') {
            const s = cfg.orderSteps.steps;
            if (s.length < 3) errs.push(`${at}: needs at least 3 steps`);
            if (new Set(s).size !== s.length) errs.push(`${at}: duplicate step text`);
            // added in v3: a step that announces its own position is a free
            // mark, and scorePBQ has no tolerance for interchangeable steps,
            // so the order has to be carried by meaning alone.
            s.forEach((step, si) => {
                const tell = step.match(ORDERING_TELLS);
                if (tell) errs.push(`${at}: step ${si + 1} uses ordering vocabulary ("${tell[0]}") — it announces its own position`);
            });
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
            // added in v2: the scorer lowercases and trims before comparing, so
            // variants that differ only in case are dead weight, and an empty
            // command can never be typed.
            const flat = commandSequences(c).map((s) => s.map((x) => x.toLowerCase().trim()).join(' \u2502 '));
            if (new Set(flat).size !== flat.length) errs.push(`${at}: accepted commands contain duplicates once lowercased`);
            if (!c.prompt) errs.push(`${at}: command PBQ needs a prompt`);
            // added in v3: config.scenario renders directly above the
            // terminal, so a scenario naming the tool has already answered the
            // stem. And one plausible tool makes the question syntax recall.
            for (const leak of commandLeaks(c)) errs.push(`${at}: ${leak}`);
        }

        const bad = nestedArrayPath(cfg);
        if (bad) errs.push(`${at}: Firestore cannot store a nested array at ${bad}`);

        const { correct, total } = scorePerfect(cfg);
        if (correct !== total) errs.push(`${at}: a perfect answer scores ${correct}/${total}, not full marks`);
    });

    // added in v3: nothing here may re-author a scenario THIS set already has.
    errs.push(...internalOverlap(qs));

    // added in v2: nothing here may re-author a scenario the v1 set already has.
    if (existsSync(V1_PATH)) {
        const v1 = JSON.parse(readFileSync(V1_PATH, 'utf8'));
        const norm = (s) => (s || '').toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
        const v1Stems = new Map(v1.questions.map((x) => [norm(x.stem), x]));
        const v1Steps = new Set(v1.questions
            .filter((x) => x.pbqConfig?.pbqType === 'order-steps')
            .map((x) => norm(x.pbqConfig.orderSteps.steps.join('|'))));
        const v1Cmds = new Set(v1.questions
            .filter((x) => x.pbqConfig?.pbqType === 'command')
            .map((x) => norm(commandSequences(x.pbqConfig.command)[0].join(' '))));
        qs.forEach((q, i) => {
            const at = `#${i + 1} (${q.pbqConfig?.pbqType})`;
            if (v1Stems.has(norm(q.stem))) errs.push(`${at}: stem duplicates a v1 question`);
            if (q.pbqConfig?.pbqType === 'order-steps' &&
                v1Steps.has(norm(q.pbqConfig.orderSteps.steps.join('|')))) {
                errs.push(`${at}: step sequence duplicates a v1 question`);
            }
            if (q.pbqConfig?.pbqType === 'command' &&
                v1Cmds.has(norm(commandSequences(q.pbqConfig.command)[0].join(' ')))) {
                errs.push(`${at}: primary accepted command duplicates a v1 question`);
            }
        });
    }
    return errs;
}

// ─── Gate first, Firestore second ────────────────────────────────

console.log(`\n${NAME} — ${SOURCE}`);
console.log(`  seed: ${SEED_PATH}`);
console.log(`\n  validating ${questions.length} PBQs against the app's own scorer...`);

const errs = validate(questions);
if (errs.length) {
    console.error(`\n  FAILED — ${errs.length} problem(s):`);
    errs.forEach((e) => console.error('   - ' + e));
    console.error('\n  Nothing written. Fix build-secplus-pbqs-v2.mjs and re-run.');
    process.exit(1);
}

const counts = {}, domains = {}, diffs = {};
let decisions = 0, minExp = Infinity;
questions.forEach((q) => {
    counts[q.pbqConfig.pbqType] = (counts[q.pbqConfig.pbqType] || 0) + 1;
    domains[q.domain] = (domains[q.domain] || 0) + 1;
    diffs[q.difficulty] = (diffs[q.difficulty] || 0) + 1;
    decisions += decisionCount(q.pbqConfig);
    minExp = Math.min(minExp, q.explanation.length);
});
console.log(`  all ${questions.length} pass.`);
console.log('  by type:      ', JSON.stringify(counts));
console.log('  by domain:    ', JSON.stringify(domains));
console.log('  by difficulty:', JSON.stringify(diffs));
console.log(`  independently scored decisions: ${decisions}`);
console.log(`  shortest explanation: ${minExp} chars (bar is ${MIN_EXPLANATION})`);

if (VALIDATE_ONLY) {
    console.log('\n  --validate-only: gate passed, Firestore not contacted.\n');
    process.exit(0);
}

// ─── Firestore ───────────────────────────────────────────────────

const { initializeApp, applicationDefault, getApps } = await import('firebase-admin/app');
const { getFirestore, FieldValue } = await import('firebase-admin/firestore');

if (!getApps().length) initializeApp({ credential: applicationDefault() });
const db = getFirestore();
const col = db.collection('questions');

const all = await col.where('examId', '==', EXAM).get();
const servable = all.docs.filter((d) => d.data().status !== 'quarantined').length;
const existing = all.docs.filter((d) => d.data().source === SOURCE);

console.log(`\n  servable now:  ${servable}`);

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

console.log(`  to insert:     ${questions.length}`);
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
