/**
 * Audits numeric PMP questions for arithmetic errors.
 *
 * Existing bank questions were generated before docs/pmp-formula-reference.md
 * was injected into the generation prompt, so their math is unverified. This
 * recomputes every question it can parse and reports where the keyed answer
 * disagrees with the correct result.
 *
 * Read-only — it never writes to Firestore.
 *
 *   node scripts/audit_pmp_math.js                       # live Firestore
 *   node scripts/audit_pmp_math.js --file snap.json      # offline snapshot
 *   node scripts/audit_pmp_math.js --json                # machine-readable
 *   node scripts/audit_pmp_math.js --self-test           # verify the checkers
 *
 * Run --self-test after touching any checker. It audits a fixture of
 * deliberately-broken questions and asserts every `BAD-*` lands in FAIL and
 * every `good-*` lands in PASS, which is what stops this from degrading into a
 * script that silently passes everything.
 *
 * Buckets:
 *   PASS     computed value matches the keyed option
 *   FAIL     computed value matches a DIFFERENT option (real defect)
 *   NO-MATCH computed value matches no option at all (bad stem or bad options)
 *   REVIEW   looks numeric but could not be parsed — needs a human
 */
const PMP_ID = '7qmPagj9A6RpkC0CwGkY';
const JSON_OUT = process.argv.includes('--json');
const SELF_TEST = process.argv.includes('--self-test');
const FILE_ARG = (() => {
    if (SELF_TEST) return require('path').join(__dirname, 'fixtures', 'pmp_math_selftest.json');
    const i = process.argv.indexOf('--file');
    return i >= 0 ? process.argv[i + 1] : null;
})();

// Returns [{id, stem, options, correctAnswer, domain}, ...] from whichever
// source is configured. The offline path exists because Firestore reads need
// credentials that are not always present.
async function loadQuestions() {
    if (FILE_ARG) {
        const raw = JSON.parse(require('fs').readFileSync(FILE_ARG, 'utf8'));
        const arr = Array.isArray(raw) ? raw : (raw.questions || []);
        return arr.map((q, i) => ({ ...q, id: q.id || `row-${i}` }));
    }
    const admin = require('firebase-admin');
    admin.initializeApp({ projectId: 'exam-coach-ai-platform' });
    const snap = await admin.firestore().collection('questions')
        .where('examId', '==', PMP_ID).get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ---------- number parsing ----------

// Pulls a numeric value out of a string fragment: $1,250,000 | 0.83 | 85% | 12
function parseNum(raw) {
    if (raw == null) return null;
    const cleaned = String(raw).replace(/[$,\s]/g, '');
    const m = cleaned.match(/-?\d+(?:\.\d+)?/);
    if (!m) return null;
    let v = parseFloat(m[0]);
    if (!Number.isFinite(v)) return null;
    if (/%/.test(String(raw))) v = v / 100;
    return v;
}

// All numbers appearing in a string, in order. The lookbehind keeps a leading
// minus only when it is a sign rather than a hyphen, so "-$40,000" is negative
// but the range "20-30 days" stays two positive numbers.
function allNums(text) {
    const out = [];
    const re = /(?:(?<![\w\d])-\s*)?\$\s*[\d,]+(?:\.\d+)?|(?:(?<![\w\d])-)?\d[\d,]*(?:\.\d+)?%?/g;
    let m;
    while ((m = re.exec(text)) !== null) {
        const v = parseNum(m[0]);
        if (v !== null) out.push({ value: v, raw: m[0].trim(), index: m.index });
    }
    return out;
}

// Finds "<label> ... <number>" where the number is within `window` chars after
// the label. Returns the first hit, which is where these stems put the value.
function labelledValue(text, patterns, window = 60) {
    for (const pat of patterns) {
        const re = new RegExp(pat.source || pat, 'gi');
        let m;
        while ((m = re.exec(text)) !== null) {
            const tail = text.slice(m.index + m[0].length, m.index + m[0].length + window);
            // Stop at a comma/period followed by another metric label, so
            // "BAC is $500,000, EV is $200,000" doesn't bleed across.
            const bounded = tail.split(/(?=\b(?:BAC|EV|PV|AC|CPI|SPI)\b)/)[0];
            const n = allNums(bounded)[0];
            if (n) return n.value;
        }
    }
    return null;
}

const L = {
    BAC: [/\bBAC\b/, /budget\s+at\s+completion/],
    EV: [/\bEV\b/, /earned\s+value/],
    PV: [/\bPV\b/, /planned\s+value/],
    AC: [/\bAC\b/, /actual\s+cost/],
    ETC: [/\bETC\b/, /estimate\s+to\s+complete/],
    CPI: [/\bCPI\b/, /cost\s+performance\s+index/],
    SPI: [/\bSPI\b/, /schedule\s+performance\s+index/],
};

// ---------- checkers ----------
// Each returns {metric, expected} or null. Order matters: first match wins.

function checkChannels(stem) {
    if (!/communicat\w*\s+channel/i.test(stem)) return null;

    const additional = /\b(additional|added|new|increase|more)\b/i.test(stem);
    const nums = allNums(stem).map(n => n.value).filter(v => Number.isInteger(v) && v > 1 && v < 1000);
    if (!nums.length) return null;

    const ch = n => (n * (n - 1)) / 2;

    if (additional && nums.length >= 2) {
        // "team of 8 grows by 4" vs "grows from 8 to 12" — both appear.
        const [a, b] = nums;
        const to = /\bto\b\s*\$?\d/i.test(stem) ? b : a + b;
        return { metric: 'communication channels (added)', expected: ch(to) - ch(a) };
    }
    if (!additional) {
        return { metric: 'communication channels (total)', expected: ch(nums[0]) };
    }
    return null;
}

function checkPert(stem) {
    if (!/\b(PERT|three[- ]point|beta\s+distribution)\b/i.test(stem) &&
        !/optimistic/i.test(stem)) return null;

    const o = labelledValue(stem, [/optimistic/]);
    const m = labelledValue(stem, [/most\s+likely/, /\bmost-likely\b/]);
    const p = labelledValue(stem, [/pessimistic/]);
    if (o == null || m == null || p == null) return null;

    if (/standard\s+deviation|\bSD\b/i.test(stem)) {
        return { metric: 'PERT standard deviation', expected: (p - o) / 6 };
    }
    if (/variance/i.test(stem)) {
        return { metric: 'PERT variance', expected: Math.pow((p - o) / 6, 2) };
    }
    if (/triangular|simple\s+average/i.test(stem)) {
        return { metric: 'triangular estimate', expected: (o + m + p) / 3 };
    }
    return { metric: 'PERT (beta) estimate', expected: (o + 4 * m + p) / 6 };
}

function checkEvm(stem) {
    const bac = labelledValue(stem, L.BAC);
    const ev = labelledValue(stem, L.EV);
    const pv = labelledValue(stem, L.PV);
    const ac = labelledValue(stem, L.AC);
    const cpiGiven = labelledValue(stem, L.CPI);
    const spiGiven = labelledValue(stem, L.SPI);

    const cpi = cpiGiven != null ? cpiGiven : (ev != null && ac ? ev / ac : null);
    const spi = spiGiven != null ? spiGiven : (ev != null && pv ? ev / pv : null);

    // What is the question actually asking for? Take the LAST asked metric,
    // since stems state givens first and the ask last.
    const asks = [];
    const push = (re, key) => { const i = stem.search(re); if (i >= 0) asks.push({ i, key }); };
    push(/\bTCPI\b|to[- ]complete\s+performance\s+index/i, 'TCPI');
    push(/\bEAC\b|estimate\s+at\s+completion/i, 'EAC');
    push(/\bVAC\b|variance\s+at\s+completion/i, 'VAC');
    push(/\bETC\b|estimate\s+to\s+complete/i, 'ETC');
    push(/\bCPI\b|cost\s+performance\s+index/i, 'CPI');
    push(/\bSPI\b|schedule\s+performance\s+index/i, 'SPI');
    push(/\bCV\b|cost\s+variance/i, 'CV');
    push(/\bSV\b|schedule\s+variance/i, 'SV');
    if (!asks.length) return null;
    asks.sort((a, b) => b.i - a.i);
    const ask = asks[0].key;

    switch (ask) {
        case 'CPI': if (ev != null && ac) return { metric: 'CPI', expected: ev / ac }; break;
        case 'SPI': if (ev != null && pv) return { metric: 'SPI', expected: ev / pv }; break;
        case 'CV': if (ev != null && ac != null) return { metric: 'CV', expected: ev - ac }; break;
        case 'SV': if (ev != null && pv != null) return { metric: 'SV', expected: ev - pv }; break;
        case 'ETC':
            if (bac != null && ev != null && cpi) return { metric: 'ETC', expected: (bac / cpi) - ac };
            break;
        case 'EAC': {
            if (bac == null) break;
            // Variant selection mirrors docs/pmp-formula-reference.md.
            if (/budgeted\s+rate|atypical|will\s+not\s+continue|one[- ]time|non[- ]recurring/i.test(stem)) {
                if (ev != null && ac != null) return { metric: 'EAC (AC + BAC - EV)', expected: ac + (bac - ev) };
            }
            if (/both\s+cost\s+and\s+schedule|schedule\s+and\s+cost/i.test(stem) && cpi && spi) {
                return { metric: 'EAC (CPI x SPI)', expected: ac + ((bac - ev) / (cpi * spi)) };
            }
            if (cpi) return { metric: 'EAC (BAC / CPI)', expected: bac / cpi };
            break;
        }
        case 'VAC': {
            if (bac == null || !cpi) break;
            return { metric: 'VAC', expected: bac - (bac / cpi) };
        }
        case 'TCPI': {
            if (bac == null || ev == null || ac == null) break;
            return { metric: 'TCPI (to BAC)', expected: (bac - ev) / (bac - ac) };
        }
    }
    return null;
}

function checkEmv(stem, options) {
    if (!/\bEMV\b|expected\s+monetary\s+value/i.test(stem)) return null;

    const optionsAreLabels = options.length &&
        !options.some(o => /\d/.test(String(o)));

    // "Which vendor/risk/response has the higher EMV?" — the answer is a label,
    // so compare alternatives rather than summing them.
    if (optionsAreLabels && /\bwhich\b/i.test(stem)) return checkEmvComparison(stem, options);

    // "What is the total EMV?" — sum every probability x impact pair.
    const re = /(\d+(?:\.\d+)?)\s*%[^.]{0,80}?(-?)\s*\$\s*([\d,]+(?:\.\d+)?)/g;
    let m, total = 0, pairs = 0;
    while ((m = re.exec(stem)) !== null) {
        const sign = m[2] === '-' ? -1 : 1;
        total += (parseFloat(m[1]) / 100) * parseFloat(m[3].replace(/,/g, '')) * sign;
        pairs++;
    }
    if (!pairs) return null;
    return { metric: `EMV total (${pairs} pair${pairs > 1 ? 's' : ''})`, expected: total };
}

// Comparison-style EMV. Each alternative lives in its own clause; a clause with
// exactly one probability/impact pair is computable, anything richer (a
// mitigation cost, a nested decision tree) is deliberately punted to REVIEW so
// the audit never reports a confident-but-wrong verdict.
function checkEmvComparison(stem, options) {
    const clauses = stem.split(/(?<=[.?])\s+|(?:^|\s)(?=(?:Vendor|Risk|Response|Investment|Option|Alternative)\s+[A-Z]\b)/)
        .map(c => c.trim()).filter(Boolean);

    const alts = [];
    for (const c of clauses) {
        const pcts = c.match(/\d+(?:\.\d+)?\s*%/g) || [];
        const amts = c.match(/-?\s*\$\s*[\d,]+(?:\.\d+)?/g) || [];
        if (!pcts.length || !amts.length) continue;

        // Extra money terms beyond the single impact figure mean a cost offset
        // we are not going to infer. Bail out rather than guess.
        if (pcts.length > 2 || amts.length > 2) return null;
        if (/cost\s+of|at\s+a\s+cost/i.test(c)) return null;

        // A "80% probability of $0 impact" tail is a no-op; drop zero amounts.
        const pairs = [];
        for (let i = 0; i < pcts.length; i++) {
            const amt = amts[Math.min(i, amts.length - 1)];
            const v = parseFloat(amt.replace(/[\s$,]/g, ''));
            if (v === 0) continue;
            pairs.push((parseFloat(pcts[i]) / 100) * v);
        }
        if (pairs.length !== 1) return null;

        // Prefer the em-dash gloss ("Investment A—cloud migration"), then the
        // bare entity name, then the subject phrase before the verb.
        const label = (c.match(/^(?:Vendor|Risk|Response|Investment|Option|Alternative)\s+[A-Z]\b\s*[—–-]\s*([^—–,.]+)/i) || [])[1]
            || (c.match(/^((?:Vendor|Risk|Response|Investment|Option|Alternative)\s+[A-Z])\b/i) || [])[1]
            || (c.match(/^(?:An?\s+|The\s+)?(.+?)\s+(?:has|offers|is|would|provides|completes)\b/i) || [])[1]
            || c.slice(0, 40);
        alts.push({ label: label.trim(), emv: pairs[0], clause: c });
    }
    if (alts.length < 2) return null;

    // Direction matters and the stem states it: "minimizes expected cost" and
    // "greater negative EMV" both want the smallest value, while "higher EMV"
    // or "which should we select" wants the largest.
    const wantLower = /greater\s+negative|most\s+negative|largest\s+(?:negative|threat|risk)|greatest\s+(?:negative|threat)|minimiz|lowest|least|smallest|lower\s+expected\s+cost/i.test(stem);
    const winner = alts.reduce((best, a) =>
        (wantLower ? a.emv < best.emv : a.emv > best.emv) ? a : best, alts[0]);

    return {
        metric: `EMV comparison (${alts.map(a => `${a.label}=${Math.round(a.emv)}`).join(', ')})`,
        expectedLabel: winner.label,
        detail: alts,
    };
}

// Scores each option against a winning label by word overlap, so "Vendor Y"
// matches the option "Vendor Y" and "cloud migration" matches "Cloud migration".
function matchOptionByLabel(options, label) {
    const norm = s => String(s).toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(w => w.length > 2);
    const target = new Set(norm(label));
    if (!target.size) return [];
    let bestScore = 0, bestIdx = [];
    options.forEach((opt, i) => {
        const words = norm(opt);
        const score = words.filter(w => target.has(w)).length / Math.max(words.length, 1);
        if (score > bestScore) { bestScore = score; bestIdx = [i]; }
        else if (score === bestScore && score > 0) bestIdx.push(i);
    });
    return bestScore >= 0.5 ? bestIdx : [];
}

const CHECKERS = [checkChannels, checkPert, checkEmv, checkEvm];

// Does this look like a math question at all?
const NUMERIC_HINT = /\bBAC\b|\bEAC\b|\bETC\b|\bVAC\b|\bCPI\b|\bSPI\b|\bTCPI\b|\bEMV\b|\bPERT\b|earned\s+value|planned\s+value|actual\s+cost|cost\s+variance|schedule\s+variance|communicat\w*\s+channel|optimistic|payback|\bNPV\b|\bIRR\b|\bBCR\b|\bROI\b|standard\s+deviation|total\s+float|free\s+float|\bPTA\b|point\s+of\s+total\s+assumption|expected\s+monetary\s+value|decision\s+tree|contingency\s+reserve|management\s+reserve/i;

function nearlyEqual(a, b) {
    if (a === b) return true;
    const scale = Math.max(Math.abs(a), Math.abs(b), 1);
    if (Math.abs(a - b) / scale < 0.01) return true;       // 1% relative
    return Math.abs(Math.round(a * 100) / 100 - Math.round(b * 100) / 100) < 1e-9;
}

function matchOption(options, expected) {
    const hits = [];
    options.forEach((opt, i) => {
        for (const n of allNums(String(opt))) {
            if (nearlyEqual(n.value, expected)) { hits.push(i); break; }
        }
    });
    return hits;
}

async function main() {
    const docs = await loadQuestions();
    const results = { pass: [], fail: [], noMatch: [], review: [], skipped: [] };
    let numericCount = 0;

    for (const d of docs) {
        const stem = String(d.stem || '');
        const options = Array.isArray(d.options) ? d.options : [];
        // No formula keyword, or a keyword with no figures, means conceptual —
        // recorded rather than dropped so coverage gaps stay visible.
        if (!NUMERIC_HINT.test(stem) || !allNums(stem).length) {
            results.skipped.push({ id: d.id, stem });
            continue;
        }
        numericCount++;

        const rec = { id: d.id, stem, options, correctAnswer: d.correctAnswer, domain: d.domain };

        let computed = null;
        for (const fn of CHECKERS) {
            try { computed = fn(stem, options); } catch (e) { computed = null; }
            if (computed) break;
        }

        if (!computed || !options.length) { results.review.push(rec); continue; }

        rec.metric = computed.metric;
        rec.expected = computed.expected;
        rec.expectedLabel = computed.expectedLabel;

        const hits = computed.expectedLabel != null
            ? matchOptionByLabel(options, computed.expectedLabel)
            : matchOption(options, computed.expected);
        if (!hits.length) { results.noMatch.push(rec); continue; }
        if (hits.includes(d.correctAnswer)) { results.pass.push(rec); continue; }
        rec.shouldBe = hits[0];
        results.fail.push(rec);
    }

    if (SELF_TEST) return reportSelfTest(docs, results);

    if (JSON_OUT) {
        console.log(JSON.stringify({ total: docs.length, numericCount, results }, null, 2));
        return;
    }

    const fmt = v => Math.abs(v) >= 1000 ? v.toLocaleString('en-US', { maximumFractionDigits: 2 })
        : String(Math.round(v * 10000) / 10000);

    console.log(`PMP bank: ${docs.length} questions, ${numericCount} numeric`);
    console.log(`source: ${FILE_ARG || 'live Firestore'}\n`);
    console.log(`  PASS      ${results.pass.length}`);
    console.log(`  FAIL      ${results.fail.length}   <- keyed answer is wrong`);
    console.log(`  NO-MATCH  ${results.noMatch.length}   <- computed value is not among the options`);
    console.log(`  REVIEW    ${results.review.length}   <- not auto-parseable\n`);

    for (const [title, list] of [['FAIL', results.fail], ['NO-MATCH', results.noMatch]]) {
        if (!list.length) continue;
        console.log(`\n===== ${title} =====`);
        for (const r of list) {
            console.log(`\n[${r.id}] ${r.domain || '-'} | ${r.metric}`);
            console.log(`  ${r.stem.slice(0, 260)}`);
            r.options.forEach((o, i) => {
                const marks = `${i === r.correctAnswer ? ' <= KEYED' : ''}${i === r.shouldBe ? ' <= COMPUTED' : ''}`;
                console.log(`    ${'ABCD'[i]}. ${String(o).slice(0, 90)}${marks}`);
            });
            console.log(r.expectedLabel != null
                ? `  computed winner = "${r.expectedLabel}"  [${r.metric}]`
                : `  computed ${r.metric} = ${fmt(r.expected)}`);
        }
    }

    if (results.review.length) {
        console.log(`\n===== REVIEW (${results.review.length}) =====`);
        for (const r of results.review) console.log(`[${r.id}] ${r.stem.slice(0, 150)}`);
    }
}

// A fixture id starting with "BAD-" must be caught; "good-" must not be.
// REVIEW counts as a miss for both: the point is that the checker decided.
function reportSelfTest(docs, results) {
    const bucketOf = id => {
        if (results.fail.some(r => r.id === id)) return 'FAIL';
        if (results.pass.some(r => r.id === id)) return 'PASS';
        if (results.noMatch.some(r => r.id === id)) return 'NO-MATCH';
        if (results.skipped.some(r => r.id === id)) return 'SKIPPED';
        return 'REVIEW';
    };

    let failures = 0;
    console.log('PMP math checker self-test\n');
    for (const d of docs) {
        const want = d.id.startsWith('BAD-') ? 'FAIL' : 'PASS';
        const got = bucketOf(d.id);
        const ok = got === want;
        if (!ok) failures++;
        console.log(`  ${ok ? 'ok  ' : 'MISS'}  ${d.id.padEnd(28)} want=${want.padEnd(4)} got=${got}`);
    }

    console.log(failures === 0
        ? `\nAll ${docs.length} fixture cases behaved as expected.`
        : `\n${failures} of ${docs.length} fixture cases regressed.`);
    if (failures) process.exitCode = 1;
}

main().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
