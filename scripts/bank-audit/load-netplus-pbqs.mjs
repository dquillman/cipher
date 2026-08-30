/**
 * Validates and loads the Network+ PBQ set. Same checks as load-secplus-pbqs.mjs,
 * pointed at a different seed file, with one deliberate difference: validation
 * runs BEFORE Firestore is touched, so proving the set is answerable needs no
 * admin credentials at all.
 *
 *   node load-netplus-pbqs.mjs                  validate only, writes nothing, no credentials needed
 *   node load-netplus-pbqs.mjs --inventory      validate, then read the live bank counts  (needs credentials)
 *   node load-netplus-pbqs.mjs --apply          validate, then insert                     (needs credentials)
 *   node load-netplus-pbqs.mjs --undo --apply   delete everything this inserted           (needs credentials)
 *   node load-netplus-pbqs.mjs --seed <file>    validate a different seed file
 *
 * The validation pass mirrors scorePBQ() and initPBQState() from
 * web/src/components/PBQQuestion.tsx: for every question it builds the state a
 * candidate would produce by answering perfectly, scores it, and requires
 * correct === total. A PBQ that cannot be scored 100% is unanswerable, and no
 * amount of good prose in the explanation makes up for that. Validation runs
 * before any write and refuses to continue on a single failure.
 *
 * Firestore access requires admin credentials:
 *   $env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\serviceAccountKey.json"
 */
import { readFileSync } from 'node:fs';

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const UNDO = args.includes('--undo');
const INVENTORY = args.includes('--inventory');
const seedIdx = args.indexOf('--seed');
const SEED_PATH = seedIdx !== -1 ? args[seedIdx + 1] : './seed/network-plus-pbqs.json';

const seed = JSON.parse(readFileSync(SEED_PATH, 'utf8'));
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
const VALID_DIFFICULTY = ['easy', 'medium', 'hard'];

/** Every domain string a Network+ question may carry. A typo here is invisible
 *  in the app — the question simply never appears in a domain-filtered drill. */
const VALID_DOMAINS = [
    'Networking Concepts',
    'Network Implementation',
    'Network Operations',
    'Network Security',
    'Network Troubleshooting',
];

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

/** Correct-option position distribution across every fill-table dropdown in the
 *  file. PBQQuestion.tsx renders field.options in authored order and shuffles
 *  nothing, so a set authored with the key first is a plaintext answer key that
 *  scores without any subject knowledge. The first version of this file ran at
 *  58.5% index-0 against 27% by chance — three questions were answerable at
 *  31/32 by picking the top dropdown entry every time. */
function optionPositionReport(qs) {
    const observed = [], expected = [], variance = [];
    let cells = 0;
    for (const q of qs) {
        if (q.pbqConfig?.pbqType !== 'fill-table') continue;
        for (const r of q.pbqConfig.fillTable.rows) {
            for (const f of r.fields) {
                const n = f.options.length;
                const at = f.options.indexOf(f.correctValue);
                if (at < 0) continue; // reported separately by the structural check
                cells++;
                observed[at] = (observed[at] || 0) + 1;
                for (let p = 0; p < n; p++) {
                    expected[p] = (expected[p] || 0) + 1 / n;
                    variance[p] = (variance[p] || 0) + (1 / n) * (1 - 1 / n);
                }
            }
        }
    }
    const positions = expected.map((e, p) => ({
        position: p,
        observed: observed[p] || 0,
        expected: e,
        sigma: variance[p] > 0 ? ((observed[p] || 0) - e) / Math.sqrt(variance[p]) : 0,
    }));
    return { cells, positions };
}

/** What "always pick the same place in every dropdown" scores, for each place.
 *  The index is clamped to the last option, because that is what a candidate
 *  reaching for a fixed position actually does on a shorter list. */
function fixedPositionScores(qs) {
    const cells = [];
    for (const q of qs) {
        if (q.pbqConfig?.pbqType !== 'fill-table') continue;
        for (const r of q.pbqConfig.fillTable.rows) cells.push(...r.fields);
    }
    if (!cells.length) return [];
    const max = Math.max(...cells.map((f) => f.options.length));
    return Array.from({ length: max }, (_, k) =>
        cells.filter((f) => f.options[Math.min(k, f.options.length - 1)] === f.correctValue).length / cells.length);
}

/** The same exploit in the drag-drop widget. The component maps items and zones
 *  in authored order, so items authored in answer order let a candidate drop
 *  item n on zone n and score full marks. Rejects a correctZone sequence that
 *  never moves backwards (or never forwards), and rejects items grouped by zone
 *  when the counts allow an interleaving. */
function dragDropOrderErrors(cfg, at) {
    const errs = [];
    const order = new Map(cfg.dragDrop.zones.map((z, i) => [z.id, i]));
    const s = cfg.dragDrop.items.map((it) => order.get(it.correctZone));
    if (s.some((v) => v === undefined)) return errs; // unknown zone reported elsewhere
    const nonDecreasing = s.every((v, i) => i === 0 || v >= s[i - 1]);
    const nonIncreasing = s.every((v, i) => i === 0 || v <= s[i - 1]);
    if (nonDecreasing || nonIncreasing) {
        errs.push(`${at}: correctZone sequence [${s.join(',')}] is monotonic — items are authored in answer order and the widget does not shuffle them`);
    }
    const counts = {};
    for (const v of s) counts[v] = (counts[v] || 0) + 1;
    const avoidable = Math.max(...Object.values(counts)) <= Math.ceil(s.length / 2);
    const runs = s.filter((v, i) => i > 0 && v === s[i - 1]).length;
    if (avoidable && runs > 0) {
        errs.push(`${at}: ${runs} adjacent item pair(s) share a zone though the counts allow a full interleave`);
    }
    return errs;
}

function validate(qs) {
    const errs = [];
    const seenStems = new Set();
    const seenText = new Map();  // long labels/steps -> first question that used them
    qs.forEach((q, i) => {
        const at = `#${i + 1} (${q.pbqConfig?.pbqType || 'no type'})`;
        if (q.type !== 'pbq') errs.push(`${at}: type must be 'pbq', got ${q.type}`);
        if (q.examId !== EXAM) errs.push(`${at}: wrong examId`);
        if (q.source !== SOURCE) errs.push(`${at}: wrong source`);
        if (!q.stem || q.stem.length < 40) errs.push(`${at}: stem missing or too short`);
        // Quiz.tsx renders the stem inside an <h2> with no whitespace-pre rule,
        // so every newline collapses to a single space. A stem laid out as a
        // config listing arrives as one run-on line. Write the listing as prose
        // with inline separators instead.
        if (/[\n\r]/.test(q.stem || '')) errs.push(`${at}: stem contains a newline, which the renderer collapses into a space`);
        if (seenStems.has(q.stem)) errs.push(`${at}: duplicate stem`);
        seenStems.add(q.stem);
        if (!q.explanation || q.explanation.length < 400) errs.push(`${at}: explanation missing or thin (${q.explanation?.length || 0} chars, 400 minimum)`);
        if (!q.domain) errs.push(`${at}: no domain`);
        else if (!VALID_DOMAINS.includes(q.domain)) errs.push(`${at}: domain "${q.domain}" is not a Network+ domain`);
        if (!VALID_BLOOM.includes(q.bloomLevel)) errs.push(`${at}: bad bloomLevel ${q.bloomLevel}`);
        if (!VALID_DIFFICULTY.includes(q.difficulty)) errs.push(`${at}: bad difficulty ${q.difficulty}`);

        const cfg = q.pbqConfig;
        if (!cfg) { errs.push(`${at}: no pbqConfig`); return; }
        if (!VALID_TYPES.includes(cfg.pbqType)) errs.push(`${at}: bad pbqType`);

        // Per-type structural checks the renderer depends on.
        if (cfg.pbqType === 'drag-drop') {
            const zoneIds = new Set(cfg.dragDrop.zones.map((z) => z.id));
            if (zoneIds.size !== cfg.dragDrop.zones.length) errs.push(`${at}: duplicate zone id`);
            const itemIds = new Set(cfg.dragDrop.items.map((it) => it.id));
            if (itemIds.size !== cfg.dragDrop.items.length) errs.push(`${at}: duplicate item id`);
            for (const it of cfg.dragDrop.items) {
                if (!zoneIds.has(it.correctZone)) errs.push(`${at}: item ${it.id} targets unknown zone ${it.correctZone}`);
            }
            const unused = [...zoneIds].filter((z) => !cfg.dragDrop.items.some((it) => it.correctZone === z));
            if (unused.length) errs.push(`${at}: zone(s) with no correct item: ${unused.join(', ')}`);
            errs.push(...dragDropOrderErrors(cfg, at));
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
                    if (f.options.length < 2) {
                        errs.push(`${at}: row ${ri + 1} col ${ci + 1} has fewer than 2 options`);
                    }
                });
            });
            // Per-question guard on the answer-key exploit. The file-level
            // distribution can look flat while one large table is still stacked.
            const idxs = cfg.fillTable.rows.flatMap((r) => r.fields.map((f) => f.options.indexOf(f.correctValue))).filter((x) => x >= 0);
            if (idxs.length >= 5) {
                const tally = {};
                for (const x of idxs) tally[x] = (tally[x] || 0) + 1;
                const [hot, n] = Object.entries(tally).sort((a, b) => b[1] - a[1])[0];
                if (n / idxs.length > 0.6) {
                    errs.push(`${at}: ${n} of ${idxs.length} correct values sit at dropdown position ${hot} — picking that position answers the question`);
                }
            }
        }
        if (cfg.pbqType === 'order-steps') {
            const s = cfg.orderSteps.steps;
            if (s.length < 3) errs.push(`${at}: needs at least 3 steps`);
            if (new Set(s).size !== s.length) errs.push(`${at}: duplicate step text`);
        }
        if (cfg.pbqType === 'command') {
            const c = cfg.command;
            if (!c.prompt) errs.push(`${at}: command PBQ needs a prompt`);
            if (!c.scenario) errs.push(`${at}: command PBQ needs a scenario`);
            if (!c.acceptedCommands?.length) errs.push(`${at}: no accepted commands`);
            const seqs = commandSequences(c);
            const lens = new Set(seqs.map((s) => s.length));
            if (lens.size > 1) {
                // scorePBQ requires seq.length === history.length, so mixed
                // lengths mean some accepted answers can never match a single
                // typed line.
                errs.push(`${at}: accepted commands have mixed sequence lengths ${[...lens].join('/')}`);
            }
            const flat = seqs.map((s) => s.join(' ~ ').toLowerCase().trim());
            if (new Set(flat).size !== flat.length) errs.push(`${at}: duplicate accepted command sequence`);

            // scorePBQ scores a command PBQ all or nothing, so a single-line
            // answer is a one-shot recall question wearing a terminal. Requiring
            // two lines is what forces the evidence-gathering step into the
            // scored sequence instead of penalising it.
            if (seqs.some((s) => s.length < 2)) {
                errs.push(`${at}: an accepted sequence is a single command — the probe has to be part of the answer, not skipped`);
            }
            // A scenario that counts the commands, or a hint that spells one
            // out, hands over the answer. "Show the hop-by-hop path. One
            // command." is a prompt, not a task.
            const prose = [c.scenario, ...(c.hints || [])];
            prose.forEach((p, pi) => {
                const where = pi === 0 ? 'scenario' : `hint ${pi}`;
                if (/\b(one|two|three|four|1|2|3|4)\s+commands?\b/i.test(p)) {
                    errs.push(`${at}: ${where} states how many commands to type`);
                }
                const lower = p.toLowerCase();
                for (const s of seqs) {
                    for (const cmd of s) {
                        if (cmd.length >= 6 && lower.includes(cmd.toLowerCase())) {
                            errs.push(`${at}: ${where} contains the accepted command "${cmd}"`);
                        }
                    }
                }
            });
        }

        // Reused evidence across the set. The same fabricated counter string
        // appearing in two questions makes a 24-question set read like 22.
        const texts = [
            ...(cfg.pbqType === 'drag-drop' ? cfg.dragDrop.items.map((it) => it.label) : []),
            ...(cfg.pbqType === 'fill-table' ? cfg.fillTable.rows.map((r) => r.label) : []),
            ...(cfg.pbqType === 'order-steps' ? cfg.orderSteps.steps : []),
        ];
        for (const t of texts) {
            if (t.length < 40) continue;
            const key = t.toLowerCase().trim();
            if (seenText.has(key) && seenText.get(key) !== i) {
                errs.push(`${at}: reuses text already used by question #${seenText.get(key) + 1}: "${t.slice(0, 60)}..."`);
            } else if (!seenText.has(key)) seenText.set(key, i);
        }

        const bad = nestedArrayPath(cfg);
        if (bad) errs.push(`${at}: Firestore cannot store a nested array at ${bad}`);

        const { correct, total } = scorePerfect(cfg);
        if (correct !== total) errs.push(`${at}: a perfect answer scores ${correct}/${total}, not full marks`);
    });

    // File-level: no dropdown position may run more than two and a half
    // standard deviations above what chance predicts.
    const report = optionPositionReport(qs);
    for (const p of report.positions) {
        if (p.sigma > 2.5) {
            errs.push(`option-position bias: ${p.observed} correct values at dropdown position ${p.position}, chance predicts ${p.expected.toFixed(1)} (${p.sigma.toFixed(1)} sd) — shuffle the options at authoring time`);
        }
    }
    // And no fixed-position strategy may beat chance by much. The clamp is
    // deliberate: "always pick the fourth entry" degrades to "always pick the
    // last entry" wherever a list is shorter, and that is a separate exploit.
    for (const [k, r] of fixedPositionScores(qs).entries()) {
        if (r > 0.40) {
            errs.push(`a candidate who always picks dropdown position ${k} scores ${(r * 100).toFixed(1)}% with no subject knowledge`);
        }
    }
    return errs;
}

// ─── Validate first, before any credential is needed ─────────────

console.log(`\n${NAME}`);
console.log(`  seed: ${SEED_PATH}`);
console.log(`\n  validating ${questions.length} PBQs against the app's own scorer...`);
const errs = validate(questions);
if (errs.length) {
    console.error(`\n  FAILED — ${errs.length} problem(s):`);
    errs.forEach((e) => console.error('   - ' + e));
    console.error('\n  Nothing written. Fix build-netplus-pbqs.mjs and re-run.');
    process.exit(1);
}

const counts = {}, domains = {}, points = {};
questions.forEach((q) => {
    const t = q.pbqConfig.pbqType;
    counts[t] = (counts[t] || 0) + 1;
    domains[q.domain] = (domains[q.domain] || 0) + 1;
    points[t] = (points[t] || 0) + scorePerfect(q.pbqConfig).total;
});
console.log(`  all ${questions.length} pass.`);
console.log('  by type:            ', JSON.stringify(counts));
console.log('  by domain:          ', JSON.stringify(domains));
const totalPoints = Object.values(points).reduce((a, b) => a + b, 0);
console.log('  scored decisions:   ', JSON.stringify(points), '=', totalPoints, 'total');

const rep = optionPositionReport(questions);
console.log(`  dropdown cells:      ${rep.cells}`);
console.log('  correct-option position:',
    rep.positions.map((p) => `#${p.position} ${p.observed}/${p.expected.toFixed(1)} exp (${p.sigma >= 0 ? '+' : ''}${p.sigma.toFixed(1)}sd)`).join('  '));
console.log('  always-pick-position-k:',
    fixedPositionScores(questions).map((r, k) => `k=${k} ${(r * 100).toFixed(1)}%`).join('  '));
const allOrNothing = questions.filter((q) => q.pbqConfig.pbqType === 'command').length;
console.log(`  all-or-nothing items: ${allOrNothing}/${questions.length}` +
    ` (${Math.round((allOrNothing / questions.length) * 100)}% — scorePBQ gives command PBQs no partial credit)`);
const probeRows = questions.reduce((n, q) => n + (q.pbqConfig.pbqType === 'fill-table'
    ? q.pbqConfig.fillTable.rows.filter((r) => /^(PROBE|RE-PROBE)/.test(r.label)).length : 0), 0);
const probeCmds = questions.reduce((n, q) => n + (q.pbqConfig.pbqType === 'command'
    ? commandSequences(q.pbqConfig.command)[0].length : 0), 0);
console.log(`  scored investigation: ${probeRows} probe/re-probe rows + ${probeCmds} required terminal probes`);

if (!APPLY && !UNDO && !INVENTORY) {
    console.log('\n  Validate-only run. Nothing was written and Firestore was not contacted.');
    console.log('  Re-run with --inventory to see live bank counts, or --apply to write.\n');
    process.exit(0);
}

// ─── Firestore (needs admin credentials) ─────────────────────────

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

console.log(`  to insert:      ${questions.length}`);
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
