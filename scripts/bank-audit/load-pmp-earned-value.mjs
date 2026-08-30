/**
 * Validates and loads the PMP earned-value / quantitative set.
 *
 *   node load-pmp-earned-value.mjs --validate-only   shape + arithmetic only, no network, no credentials
 *   node load-pmp-earned-value.mjs                   validate + Firestore dry run, writes nothing
 *   node load-pmp-earned-value.mjs --apply           insert
 *   node load-pmp-earned-value.mjs --undo --apply    delete everything this inserted
 *
 * Unlike load-secplus-pbqs.mjs, validation runs BEFORE firebase-admin is even
 * imported. That script initialises the Admin SDK first, so its validator could
 * only ever be exercised by someone holding production credentials — which is
 * backwards, since the validator is the part that needs running most often and
 * on the least privilege. Here the import is dynamic and only happens once the
 * seed has passed.
 *
 * WHAT IS CHECKED
 * ---------------
 * 1. Renderability against the app's own code paths. These items are type
 *    'emv', which web/src/utils/scoring.ts gradesBySingleIndex() accepts, so
 *    Quiz.tsx renders them as single-select and grades
 *    `selectedOption === correctAnswer`. That makes `correctAnswer` an index
 *    into `options` and nothing else; the checks below enforce exactly that.
 * 2. The `scenarios` invariant. ExplanationPanel.tsx renders <EmvCalculation>
 *    whenever type === 'emv' && scenarios exists, and that component closes with
 *    "<label> has the highest expected monetary value" — computed by its own
 *    reduce over probability x impact. If the max-EMV scenario is not the keyed
 *    option, the panel contradicts the answer key in front of the candidate.
 *    Enforced here, including a strict-uniqueness check on the maximum, because
 *    the component's reduce silently keeps the first of a tie.
 * 3. The arithmetic. Every numeric answer is recomputed from the named formula
 *    in `mathChecks` and the formatted result must appear verbatim in the text
 *    it belongs in. See the note in build-pmp-earned-value.mjs.
 * 4. Firestore storability — no array nested directly inside another array, at
 *    any depth, anywhere in the document.
 * 5. Comparative claims. Chaining value -> text -> question confirms each
 *    number on its own; it cannot see a false relation between two numbers
 *    that are each correct. A first-draft key read "TCPI is 0.82, below the
 *    0.75 achieved so far" and passed everything, leaving the item with no
 *    correct answer. Comparative words between two checked values are now
 *    parsed and the stated inequality asserted against the computed one.
 * 6. The EAC variant leak. Per-question checks cannot see a pattern that runs
 *    across the set. In the first draft the presence of planned value in the
 *    stem identified the keyed EAC variant 8 times out of 8, so the family's
 *    headline skill was answerable without reading a scenario. The seed now
 *    declares which figures each EAC stem supplies; that declaration is
 *    checked against the stems, then cross-tabulated against the variants.
 * 7. ecoTask provenance. No ECO document exists in this repo and the citation
 *    map carries domain-level references only, so an asserted task NUMBER is
 *    unsupportable and is rejected.
 *
 * Checks 5-7 are new, and two of them were inert when first written while the
 * seed validated clean. selftest-pmp-earned-value.mjs mutates the seed to
 * reintroduce each defect and asserts it is caught; run it after touching any
 * check in this file.
 *
 * Requires admin credentials only for the Firestore steps:
 *   $env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\serviceAccountKey.json"
 */
import { readFileSync } from 'node:fs';

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const UNDO = args.includes('--undo');
const VALIDATE_ONLY = args.includes('--validate-only');

const seed = JSON.parse(readFileSync('./seed/pmp-earned-value.json', 'utf8'));
const { examId: EXAM, examName: NAME, source: SOURCE, questions, mathChecks, eacFamily } = seed;

// ─── Constants mirrored from the app ─────────────────────────────

/** web/src/config/exams.ts — QuestionType. 'emv' is in the union and has both
 *  a renderer and a scorer, which is the membership rule stated there. */
const VALID_TYPE = 'emv';
/** web/src/types/Bloom.ts */
const VALID_BLOOM = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'];
/** The three domain strings the live PMP bank actually uses. A fourth spelling
 *  would silently create an orphan domain in the mastery rings and would not
 *  resolve in utils/domainCitations.ts. */
const VALID_DOMAINS = ['People', 'Process', 'Business Environment'];
const VALID_DIFFICULTY = ['easy', 'medium', 'hard'];
const OPTION_COUNT = 4;

/** Nothing in this bank has been through subject-matter-expert review, so no
 *  item may imply that it has. Cheap to check, expensive to discover later. */
const FORBIDDEN_CLAIMS = [
    'subject matter expert',
    'sme-reviewed',
    'expert-reviewed',
    'expert reviewed',
    'reviewed by a certified',
    'verified answer key',
    'pmi-approved',
    'pmi approved',
    'officially endorsed',
];

// ─── Formula table — the loader's own implementation ─────────────
// Deliberately written out from docs/pmp-formula-reference.md rather than
// imported from anywhere the author of the seed could have touched. If the
// explanation walks through a different formula than the one named in the
// check, the recomputed value will not match `expect`.

const FORMULAS = {
    pv: ({ plannedPct, BAC }) => plannedPct * BAC,
    ev: ({ actualPct, BAC }) => actualPct * BAC,
    cv: ({ EV, AC }) => EV - AC,
    sv: ({ EV, PV }) => EV - PV,
    cpi: ({ EV, AC }) => EV / AC,
    spi: ({ EV, PV }) => EV / PV,
    pct_complete: ({ EV, BAC }) => EV / BAC,
    // EAC, four variants. The stem's wording picks which one applies.
    eac_typical: ({ BAC, EV, AC }) => BAC / (EV / AC),
    eac_atypical: ({ BAC, EV, AC }) => AC + (BAC - EV),
    eac_both: ({ BAC, EV, AC, PV }) => AC + (BAC - EV) / ((EV / AC) * (EV / PV)),
    eac_bottomup: ({ AC, ETC }) => AC + ETC,
    etc_from_eac: ({ EAC, AC }) => EAC - AC,
    etc_budgeted: ({ BAC, EV }) => BAC - EV,
    vac: ({ BAC, EAC }) => BAC - EAC,
    tcpi_bac: ({ BAC, EV, AC }) => (BAC - EV) / (BAC - AC),
    tcpi_eac: ({ BAC, EV, AC, EAC }) => (BAC - EV) / (EAC - AC),
    emv: ({ probability, impact }) => probability * impact,
    emv_sum: ({ branches }) => branches.reduce((t, b) => t + b.p * b.impact, 0),
    base_plus_emv: ({ base, probability, impact }) => base + probability * impact,
    // A stated gap between two figures the set has already computed. Not an
    // EVM formula, but a prose number is either checked or it is decoration,
    // and a prose aside like 'the gap is 23,000 dollars' goes stale silently
    // when a constant moves and nobody re-reads the sentence.
    difference: ({ a, b }) => a - b,
    // Not a formula: a value the stem STATES rather than one the candidate
    // derives. Items that test formula selection or interpretation rather than
    // arithmetic still quote numbers in the key, and those numbers still have to
    // match the stem. `given` gets them under the same coverage rule instead of
    // exempting them from it — see the extra stem check below.
    given: ({ value }) => value,
};

const REQUIRED_INPUTS = {
    pv: ['plannedPct', 'BAC'], ev: ['actualPct', 'BAC'],
    cv: ['EV', 'AC'], sv: ['EV', 'PV'], cpi: ['EV', 'AC'], spi: ['EV', 'PV'],
    pct_complete: ['EV', 'BAC'],
    eac_typical: ['BAC', 'EV', 'AC'], eac_atypical: ['BAC', 'EV', 'AC'],
    eac_both: ['BAC', 'EV', 'AC', 'PV'], eac_bottomup: ['AC', 'ETC'],
    etc_from_eac: ['EAC', 'AC'], etc_budgeted: ['BAC', 'EV'],
    vac: ['BAC', 'EAC'],
    tcpi_bac: ['BAC', 'EV', 'AC'], tcpi_eac: ['BAC', 'EV', 'AC', 'EAC'],
    emv: ['probability', 'impact'], emv_sum: ['branches'],
    base_plus_emv: ['base', 'probability', 'impact'],
    difference: ['a', 'b'],
    given: ['value'],
};

/** Formats a computed value the way the questions write it. The check then
 *  requires this string inside the check's own `text`, and `text` inside the
 *  question — so a value cannot be reworded into agreement. */
function fmtValue(v, fmt) {
    switch (fmt) {
        // Money is formatted on the absolute value so a check's `text` can
        // carry the sign in whatever prose form the option uses ("-$70,000",
        // "$70,000 over budget"); the sign itself is verified numerically
        // against `expect`.
        case 'money': return '$' + Math.abs(v).toLocaleString('en-US');
        case 'ratio': return v.toFixed(2);
        case 'pct': return (v * 100).toFixed(0) + '%';
        default: return String(v);
    }
}

/* ─── Comparative-relation check ───────────────────────────────────
 *
 * The value -> text -> question chain below confirms each number in isolation.
 * It cannot see a false claim ABOUT two numbers that are each individually
 * correct. The first draft of this set shipped a keyed option reading "TCPI is
 * 0.82, below the 0.75 achieved so far, so the approved target allows the
 * remaining work to be performed less efficiently" — 0.82 is ABOVE 0.75, so the
 * item had no correct answer, and every check here passed, because "0.82" and
 * "0.75" both appeared verbatim exactly where they were supposed to.
 *
 * So: find comparative words sitting between two values this seed has already
 * computed, and assert the stated inequality against the computed one.
 *
 * Two guards keep it from firing on prose it does not understand. The marker
 * must sit within PROXIMITY characters of a checked value on BOTH sides, and no
 * other digit may lie between the marker and either value — otherwise a
 * sentence like "= 0.80. Above parity is favourable" would bind "above" to the
 * 0.80 before it and to whatever checked value happened to come next, which is
 * a comparison nobody wrote. A marker failing either guard is skipped rather
 * than reported: this check exists to catch inversions, and a validator that
 * cries wolf on ordinary English gets switched off.
 *
 * Only unambiguous markers are listed. "over" and "under" are deliberately
 * absent, because "$70,000 over budget" is not a comparison between two
 * figures. */
const PROXIMITY = 60;
const COMPARATORS = [
    { re: /\babove\b/gi, rel: 'gt' },
    { re: /\bhigher than\b/gi, rel: 'gt' },
    { re: /\bgreater than\b/gi, rel: 'gt' },
    { re: /\bmore than\b/gi, rel: 'gt' },
    { re: /\bexceeds?\b/gi, rel: 'gt' },
    { re: /\bbelow\b/gi, rel: 'lt' },
    { re: /\bbeneath\b/gi, rel: 'lt' },
    { re: /\blower than\b/gi, rel: 'lt' },
    { re: /\bless than\b/gi, rel: 'lt' },
    { re: /\bshort of\b/gi, rel: 'lt' },
    { re: /\bunchanged from\b/gi, rel: 'eq' },
    { re: /\bequal to\b/gi, rel: 'eq' },
    { re: /\bthe same as\b/gi, rel: 'eq' },
    { re: /\bidentical to\b/gi, rel: 'eq' },
];
const RELATION = {
    gt: { test: (a, b) => a > b, word: 'above' },
    lt: { test: (a, b) => a < b, word: 'below' },
    eq: { test: (a, b) => a === b, word: 'equal to' },
};

const RE_SPECIALS = new Set(['.', '*', '+', '?', '^', '$', '{', '}', '(', ')', '|', '[', ']', '\\', '/', '-']);
function escapeRe(x) {
    return [...x].map((ch) => (RE_SPECIALS.has(ch) ? '\\' + ch : ch)).join('');
}

/** Every place a checked value's formatted string appears in `text`, carrying
 *  the sign it actually has there — "-$130,000" reads as negative even though
 *  the formatter prints money on the absolute value. */
function anchorsIn(text, values) {
    const found = [];
    for (const { formatted, value } of values) {
        // Not preceded by a digit or a dot, not followed by a digit or a comma:
        // stops "$150,000" matching inside "$1,150,000", and "0.80" inside "0.808".
        const re = new RegExp('(?<![\\d.,])' + escapeRe(formatted) + '(?![\\d])(?!,\\d)', 'g');
        let m;
        while ((m = re.exec(text)) !== null) {
            const prev = text.slice(Math.max(0, m.index - 2), m.index);
            const negative = /[-−]\s?$/.test(prev);
            found.push({
                start: m.index,
                end: m.index + m[0].length,
                v: negative ? -Math.abs(value) : Math.abs(value),
                formatted,
            });
        }
    }
    return found.sort((a, b) => a.start - b.start);
}

function comparativeErrors(text, values, where) {
    const errs = [];
    if (!text) return errs;
    const anchors = anchorsIn(text, values);
    if (anchors.length < 2) return errs;
    for (const { re, rel } of COMPARATORS) {
        re.lastIndex = 0;
        let m;
        while ((m = re.exec(text)) !== null) {
            const mStart = m.index;
            const mEnd = m.index + m[0].length;
            const left = [...anchors].reverse().find((a) => a.end <= mStart);
            const right = anchors.find((a) => a.start >= mEnd);
            if (!left || !right) continue;
            if (mStart - left.end > PROXIMITY || right.start - mEnd > PROXIMITY) continue;
            if (/\d/.test(text.slice(left.end, mStart))) continue;
            if (/\d/.test(text.slice(mEnd, right.start))) continue;
            const r = RELATION[rel];
            if (!r.test(left.v, right.v)) {
                errs.push(where + ' claims "' + left.formatted + ' ' + m[0] + ' ' + right.formatted +
                    '", but ' + left.v + ' is not ' + r.word + ' ' + right.v);
            }
        }
    }
    return errs;
}

/** Firestore rejects any array whose element is itself an array, at any depth.
 *  Catching that here beats catching it in a failed batch write. */
function nestedArrayPath(v, path = 'doc') {
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

/* ─── EAC variant-leak check ────────────────────────────────────────
 *
 * The headline skill of this set is reading a narrative to choose which EAC
 * assumption applies. In the first draft it was not being tested: across all
 * eight EAC items, planned value in the stem predicted the keyed variant with
 * 8/8 accuracy — present meant CPI x SPI, absent meant something else. A
 * candidate could answer the entire family without reading a scenario sentence.
 *
 * Every check in this file up to here works one question at a time, so none of
 * them could see it. This one works across the family: cross-tabulate the
 * figures each stem supplies against the variant each item keys, and fail if
 * the presence OR absence of any single figure identifies any variant exactly.
 *
 * The seed declares its own `supplies`, so the check is only worth as much as
 * that declaration. Hence the honesty pass first: every named figure's label
 * must appear in the stem, and every unnamed one must be absent from it. A
 * declaration that says "no PV here" while the stem states a planned value
 * fails before the cross-tabulation runs.
 *
 * FIGURE_LABELS is the vocabulary. It is matched against the stem only —
 * options and explanations name figures constantly and mean nothing by it. */
const FIGURE_LABELS = {
    BAC: /budget at completion/i,
    EV: /earned value/i,
    AC: /actual cost/i,
    PV: /planned value/i,
    CPI: /cost performance index/i,
    SPI: /schedule performance index/i,
    ETC: /re-estimate|bottom-up|estimate to complete/i,
};

function sameSet(a, b) {
    return a.size === b.size && [...a].every((x) => b.has(x));
}

function eacFamilyErrors(qs, family) {
    const errs = [];
    if (!Array.isArray(family) || family.length === 0) {
        errs.push('eacFamily missing — the EAC items must declare which figures their stems supply, or the variant leak cannot be tested for');
        return errs;
    }

    // 1. Is the declaration honest?
    const figures = new Set();
    for (const row of family) {
        const q = qs[row.q - 1];
        if (!q) { errs.push(`eacFamily #${row.q}: no such question`); continue; }
        if (!Array.isArray(row.supplies) || row.supplies.length === 0) {
            errs.push(`eacFamily #${row.q}: no supplies declared`); continue;
        }
        if (!row.variant) { errs.push(`eacFamily #${row.q}: no variant declared`); continue; }
        const declared = new Set(row.supplies);
        for (const f of declared) {
            if (!FIGURE_LABELS[f]) { errs.push(`eacFamily #${row.q}: unknown figure "${f}"`); continue; }
            figures.add(f);
            if (!FIGURE_LABELS[f].test(q.stem || '')) {
                errs.push(`eacFamily #${row.q}: declares it supplies ${f} but the stem never names it`);
            }
        }
        for (const [f, re] of Object.entries(FIGURE_LABELS)) {
            if (!declared.has(f) && re.test(q.stem || '')) {
                errs.push(`eacFamily #${row.q}: stem names ${f} but the declaration omits it — the leak test would be run on a false picture`);
            }
        }
    }
    if (errs.length) return errs;

    // 2. Does any single figure identify any variant?
    const variants = [...new Set(family.map((r) => r.variant))];
    for (const f of figures) {
        const present = new Set(family.filter((r) => r.supplies.includes(f)).map((r) => r.q));
        const absent = new Set(family.filter((r) => !r.supplies.includes(f)).map((r) => r.q));
        for (const v of variants) {
            const keyed = new Set(family.filter((r) => r.variant === v).map((r) => r.q));
            if (present.size && sameSet(keyed, present)) {
                errs.push(`variant leak: the PRESENCE of ${f} identifies the "${v}" variant with 100% accuracy across the ${family.length} EAC items (${[...keyed].map((x) => '#' + x).join(', ')}) — supply ${f} as a decoy on an item that keys something else`);
            }
            if (absent.size && sameSet(keyed, absent)) {
                errs.push(`variant leak: the ABSENCE of ${f} identifies the "${v}" variant with 100% accuracy across the ${family.length} EAC items (${[...keyed].map((x) => '#' + x).join(', ')}) — withhold ${f} on an item that keys something else too`);
            }
        }
    }

    // 3. Two standing requirements, stated so they cannot quietly lapse. Both
    //    were the specific remedies for the 8/8 leak, and a later edit that
    //    dropped a decoy would otherwise only be caught if it happened to
    //    restore a perfect separation.
    const pvDecoys = family.filter((r) => ['typical', 'atypical'].includes(r.variant) && r.supplies.includes('PV'));
    if (pvDecoys.length < 2) {
        errs.push(`only ${pvDecoys.length} typical/atypical item(s) supply PV as a decoy; at least 2 are needed or PV starts pointing at the CPI x SPI variant again`);
    }
    const withholding = family.filter((r) => r.variant === 'both' && (!r.supplies.includes('EV') || !r.supplies.includes('PV')));
    if (withholding.length < 1) {
        errs.push('no CPI x SPI item withholds a figure the candidate expects; at least one must, so the variant is not recognisable from the shape of the data alone');
    }

    return errs;
}

// ─── Validation ──────────────────────────────────────────────────

function validate(qs, checks, family) {
    const errs = [];
    const seenStems = new Set();
    const keyPositions = [0, 0, 0, 0];

    qs.forEach((q, i) => {
        const at = `#${i + 1}`;

        if (q.type !== VALID_TYPE) errs.push(`${at}: type must be '${VALID_TYPE}', got ${q.type}`);
        if (q.examId !== EXAM) errs.push(`${at}: wrong examId ${q.examId}`);
        if (q.source !== SOURCE) errs.push(`${at}: wrong source ${q.source}`);
        if (!VALID_DOMAINS.includes(q.domain)) errs.push(`${at}: domain "${q.domain}" is not one of ${VALID_DOMAINS.join(' / ')}`);
        if (!VALID_BLOOM.includes(q.bloomLevel)) errs.push(`${at}: bad bloomLevel ${q.bloomLevel}`);
        if (!VALID_DIFFICULTY.includes(q.difficulty)) errs.push(`${at}: bad difficulty ${q.difficulty}`);
        if (!q.ecoTask) errs.push(`${at}: no ecoTask provenance`);
        // The repo cites the July 2026 ECO at DOMAIN level only
        // (web/src/utils/domainCitations.ts) and holds no ECO document, so a
        // task number in this field is a claim nothing here can support. The
        // first draft tagged four risk items "Business Environment · Task 5"
        // when the bank's own 196 items classify that work as Process.
        if (/\bTask\s*\d/i.test(q.ecoTask || '')) {
            errs.push(`${at}: ecoTask "${q.ecoTask}" asserts an ECO task number; no ECO source exists in this repo — name the task, not its number`);
        }

        if (!q.stem || q.stem.length < 120) errs.push(`${at}: stem missing or too short (${q.stem?.length ?? 0} chars)`);
        if (q.stem) {
            const key = q.stem.trim().toLowerCase();
            if (seenStems.has(key)) errs.push(`${at}: duplicate stem`);
            seenStems.add(key);
        }
        if (!q.explanation || q.explanation.length < 400) {
            errs.push(`${at}: explanation missing or thin (${q.explanation?.length ?? 0} chars, need 400+)`);
        }

        const blob = `${q.stem ?? ''} ${q.explanation ?? ''}`.toLowerCase();
        for (const claim of FORBIDDEN_CLAIMS) {
            if (blob.includes(claim)) errs.push(`${at}: implies review it has not had — contains "${claim}"`);
        }

        // Options / key. gradeAnswer() compares selectedOption === correctAnswer
        // and nothing else, so the key must be a real index into options.
        if (!Array.isArray(q.options) || q.options.length !== OPTION_COUNT) {
            errs.push(`${at}: needs exactly ${OPTION_COUNT} options, got ${q.options?.length ?? 0}`);
        } else {
            q.options.forEach((o, oi) => {
                if (typeof o !== 'string') errs.push(`${at}: option ${oi + 1} is ${Array.isArray(o) ? 'an array' : typeof o}, not a string`);
                else if (o.trim().length < 3) errs.push(`${at}: option ${oi + 1} is empty or too short`);
            });
            // Only compare the strings. Calling .trim() on whatever happens to
            // be in the array turns a reportable data defect into a stack trace,
            // which buries the actual finding.
            const strs = q.options.filter((o) => typeof o === 'string');
            if (new Set(strs.map((o) => o.trim().toLowerCase())).size !== strs.length) {
                errs.push(`${at}: duplicate options`);
            }
        }
        if (!Number.isInteger(q.correctAnswer) || q.correctAnswer < 0 || q.correctAnswer >= OPTION_COUNT) {
            errs.push(`${at}: correctAnswer ${q.correctAnswer} is not a valid index into options`);
        } else {
            keyPositions[q.correctAnswer]++;
        }

        // The EmvCalculation panel contract.
        if (q.scenarios !== undefined) {
            const s = q.scenarios;
            if (!Array.isArray(s) || s.length < 2) {
                errs.push(`${at}: scenarios must be an array of at least 2 branches`);
            } else {
                let bad = false;
                s.forEach((sc, si) => {
                    if (!sc || typeof sc.label !== 'string' || !sc.label.trim()) { errs.push(`${at}: scenario ${si + 1} has no label`); bad = true; }
                    if (typeof sc.probability !== 'number' || !(sc.probability > 0) || sc.probability > 1) { errs.push(`${at}: scenario ${si + 1} probability must be in (0, 1]`); bad = true; }
                    if (typeof sc.impact !== 'number' || !Number.isFinite(sc.impact)) { errs.push(`${at}: scenario ${si + 1} impact must be a finite number`); bad = true; }
                    // The panel names the winning label; if that label is not an
                    // option the candidate can select, the panel is naming
                    // something that was never on the page.
                    if (Array.isArray(q.options) && !q.options.some((o) => o === sc.label)) {
                        errs.push(`${at}: scenario label "${sc.label}" is not one of the options verbatim`);
                        bad = true;
                    }
                });
                if (new Set(s.map((x) => x.label)).size !== s.length) errs.push(`${at}: duplicate scenario labels`);

                if (!bad) {
                    // Mirror EmvCalculation's own reduce.
                    const computed = s.map((sc) => ({ label: sc.label, emv: sc.probability * sc.impact }));
                    const best = computed.reduce((a, b) => (b.emv > a.emv ? b : a));
                    const tied = computed.filter((c) => c.emv === best.emv);
                    if (tied.length > 1) {
                        errs.push(`${at}: ${tied.length} scenarios tie on maximum EMV; the panel's reduce keeps the first and may contradict the key`);
                    }
                    if (typeof q.correctLabel !== 'string') {
                        errs.push(`${at}: scenarios present but no correctLabel`);
                    } else {
                        if (Array.isArray(q.options) && q.options[q.correctAnswer] !== q.correctLabel) {
                            errs.push(`${at}: correctLabel "${q.correctLabel}" is not the keyed option "${q.options?.[q.correctAnswer]}"`);
                        }
                        if (best.label !== q.correctLabel) {
                            errs.push(`${at}: panel will declare "${best.label}" the highest EMV but the key is "${q.correctLabel}"`);
                        }
                    }
                }
            }
        } else if (q.correctLabel !== undefined) {
            errs.push(`${at}: correctLabel without scenarios — the panel never renders, so it is dead data`);
        }

        const nested = nestedArrayPath(q, `${at}`);
        if (nested) errs.push(`${at}: Firestore cannot store a nested array at ${nested}`);
    });

    // Longest-option cue. A key that is reliably the wordiest option is
    // answerable without reading the stem, because writing out the correct
    // reasoning naturally takes more words than asserting a wrong one. The first
    // draft of this set had the key as the longest option in 14 of 20 items.
    // Only prose option sets are judged: where every option is a bare figure
    // ("$5,000,000"), a two-character difference carries no signal.
    const PROSE = 60;      // shortest option set worth measuring
    const MARGIN = 30;     // chars the key may exceed the longest distractor by
    let longestKeyCount = 0, proseItems = 0;
    qs.forEach((q, i) => {
        if (!Array.isArray(q.options) || !q.options.every((o) => typeof o === 'string')) return;
        if (!Number.isInteger(q.correctAnswer) || q.correctAnswer >= q.options.length) return;
        const lens = q.options.map((o) => o.length);
        if (Math.max(...lens) < PROSE) return;
        proseItems++;
        const keyLen = lens[q.correctAnswer];
        const longestOther = Math.max(...lens.filter((_, j) => j !== q.correctAnswer));
        if (keyLen > longestOther) longestKeyCount++;
        if (keyLen - longestOther > MARGIN) {
            errs.push(`#${i + 1}: keyed option is ${keyLen - longestOther} chars longer than the longest distractor — give the distractors real reasoning instead of trimming the key`);
        }
    });
    if (proseItems >= 4 && longestKeyCount > proseItems / 2) {
        errs.push(`longest-option cue: the key is the wordiest option in ${longestKeyCount} of ${proseItems} prose items — a candidate can beat chance without reading the stem`);
    }

    // A bank whose keys cluster at one position is answerable by pattern rather
    // than by knowledge. The Security+ rebuild shipped a first draft with all 50
    // keys at index 0; this is the check that would have caught it.
    keyPositions.forEach((n, idx) => {
        if (n < Math.max(1, Math.floor(qs.length / OPTION_COUNT / 2))) {
            errs.push(`answer key distribution: only ${n} key(s) at position ${'ABCD'[idx]} across ${qs.length} questions`);
        }
    });

    // ─── Arithmetic ───
    if (!Array.isArray(checks) || checks.length === 0) {
        errs.push('mathChecks missing — every numeric key must be independently recomputable');
    } else {
        const covered = new Set();
        checks.forEach((c, ci) => {
            const at = `check ${ci + 1} (q#${c.q}, ${c.formula})`;
            const q = qs[c.q - 1];
            if (!q) { errs.push(`${at}: no such question`); return; }
            const fn = FORMULAS[c.formula];
            if (!fn) { errs.push(`${at}: unknown formula`); return; }
            for (const need of REQUIRED_INPUTS[c.formula]) {
                if (c.inputs?.[need] === undefined) { errs.push(`${at}: missing input ${need}`); return; }
            }
            const got = fn(c.inputs);
            // Tolerance is relative for large money values, absolute for ratios.
            const tol = Math.max(1e-9, Math.abs(c.expect) * 1e-9);
            if (!Number.isFinite(got) || Math.abs(got - c.expect) > tol) {
                errs.push(`${at}: recomputes to ${got}, seed claims ${c.expect}`);
                return;
            }
            const formatted = fmtValue(c.expect, c.fmt);
            if (!c.text?.includes(formatted)) {
                errs.push(`${at}: check text "${c.text}" does not contain the computed value ${formatted}`);
                return;
            }
            // A stated value has to be stated. Without this, `given` would be a
            // way to declare any number checked by asserting it about itself.
            if (c.formula === 'given' && !q.stem?.includes(formatted)) {
                errs.push(`${at}: ${formatted} is keyed as given but does not appear in the stem`);
                return;
            }
            const where = c.where ?? 'option';
            const haystack = where === 'explanation' ? q.explanation : q.options?.[q.correctAnswer];
            if (!haystack?.includes(c.text)) {
                errs.push(`${at}: "${c.text}" does not appear in the ${where === 'explanation' ? 'explanation' : 'keyed option'}`);
                return;
            }
            if (where === 'option') covered.add(c.q);
            // The worked calculation belongs in the explanation of anything that
            // is actually calculated. Formula-selection and interpretation items
            // (`given`) have no arithmetic to show by design.
            if (c.formula !== 'given' && !/=/.test(q.explanation ?? '')) {
                errs.push(`${at}: explanation shows no worked arithmetic`);
            }
        });

        // ─── Comparative relations ───
        // Everything above verifies numbers one at a time. This verifies the
        // claims made ABOUT them, which is the class of defect that put a
        // Q14 with no correct answer through a clean validation run.
        const valuesByQ = new Map();
        checks.forEach((c) => {
            const fn = FORMULAS[c.formula];
            if (!fn) return;
            const list = valuesByQ.get(c.q) || [];
            list.push({ formatted: fmtValue(c.expect, c.fmt), value: c.expect });
            valuesByQ.set(c.q, list);
        });
        qs.forEach((q, i) => {
            const values = valuesByQ.get(i + 1);
            if (!values || values.length < 2) return;
            const keyed = q.options?.[q.correctAnswer];
            comparativeErrors(keyed, values, `#${i + 1}: keyed option`).forEach((e) => errs.push(e));
            comparativeErrors(q.explanation, values, `#${i + 1}: explanation`).forEach((e) => errs.push(e));
        });

        // Every question whose key is a number must have that number checked.
        qs.forEach((q, i) => {
            const keyed = q.options?.[q.correctAnswer] ?? '';
            const hasNumber = /\$[\d,]+|\b\d+\.\d{2}\b|\b\d{1,3}%/.test(keyed);
            if (hasNumber && !covered.has(i + 1)) {
                errs.push(`#${i + 1}: keyed option contains a number with no mathChecks entry against it`);
            }
        });
    }

    eacFamilyErrors(qs, family).forEach((e) => errs.push(e));

    return errs;
}

// ─── Main ────────────────────────────────────────────────────────

console.log(`\n${NAME}`);
console.log(`  seed:   seed/pmp-earned-value.json`);
console.log(`  source: ${SOURCE}`);
console.log(`\n  validating ${questions.length} questions and ${mathChecks?.length ?? 0} arithmetic checks...`);

const errs = validate(questions, mathChecks, eacFamily);
if (errs.length) {
    console.error(`\n  FAILED — ${errs.length} problem(s):`);
    errs.forEach((e) => console.error('   - ' + e));
    console.error('\n  Nothing written. Fix build-pmp-earned-value.mjs and re-run.\n');
    process.exit(1);
}

const byDomain = {}, byDifficulty = {}, keyPos = [0, 0, 0, 0];
for (const q of questions) {
    byDomain[q.domain] = (byDomain[q.domain] || 0) + 1;
    byDifficulty[q.difficulty] = (byDifficulty[q.difficulty] || 0) + 1;
    keyPos[q.correctAnswer]++;
}
console.log('  all pass.');
console.log('    by domain:     ', JSON.stringify(byDomain));
console.log('    by difficulty: ', JSON.stringify(byDifficulty));
console.log('    key at A/B/C/D:', keyPos.join(' / '));
console.log(`    EMV panel:      ${questions.filter((q) => q.scenarios).length} of ${questions.length} carry scenarios`);

if (VALIDATE_ONLY) {
    console.log('\n  --validate-only: shape and arithmetic verified, Firestore untouched.\n');
    process.exit(0);
}

// Firestore from here down. Imported late so validation needs no credentials.
const { initializeApp, applicationDefault, getApps } = await import('firebase-admin/app');
const { getFirestore, FieldValue } = await import('firebase-admin/firestore');

if (!getApps().length) initializeApp({ credential: applicationDefault() });
const db = getFirestore();
const col = db.collection('questions');

const all = await col.where('examId', '==', EXAM).get();
const servable = all.docs.filter((d) => d.data().status !== 'quarantined').length;
const existing = all.docs.filter((d) => d.data().source === SOURCE);
const emvNow = all.docs.filter((d) => d.data().type === 'emv' && d.data().status !== 'quarantined').length;

console.log(`\n  servable now:      ${servable}`);
console.log(`  servable 'emv' now: ${emvNow}`);

if (UNDO) {
    console.log(`  UNDO: delete ${existing.length} question(s)${APPLY ? '' : '   [DRY RUN]'}`);
    if (!APPLY) process.exit(0);
    const b = db.batch();
    existing.forEach((d) => b.delete(d.ref));
    await b.commit();
    console.log('  undo complete\n');
    process.exit(0);
}

if (existing.length) {
    console.error(`\n  ABORT: ${existing.length} questions with source ${SOURCE} already exist.`);
    console.error('  Use --undo --apply to reverse, then re-run.\n');
    process.exit(1);
}

console.log(`\n  to insert:          ${questions.length}`);
console.log(`  servable after:     ${servable + questions.length}${APPLY ? '' : '   [DRY RUN]'}`);

if (!APPLY) {
    console.log('\n  Dry run. Re-run with --apply to write.\n');
    process.exit(0);
}

// Only the question documents are written. mathChecks stays in the seed file.
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
const panels = after.docs.filter((d) => Array.isArray(d.data().scenarios)).length;
console.log(`  scenarios survived the round trip: ${panels}`);
console.log('  done.\n');
