#!/usr/bin/env node
/**
 * Pre-warm `tutor_cache` so answering a question is a Firestore read, not an
 * OpenAI call.
 *
 * WHY
 * ---
 * generateTutorBreakdown sits directly on the post-answer path. It is already
 * warm (minInstances:1) and checks a shared cross-user cache first, so its
 * latency is the OpenAI completion itself — measured on production at
 * 5,594 / 6,315 / 6,825 ms across three real answers, 0 of 3 cache hits.
 *
 * A hit is rare because the cache key includes WHICH OPTION the learner picked,
 * so the reachable key space is questions x options x modes — roughly 17,000
 * against 86 entries actually cached. The bank is fixed, so every one of those
 * completions can be bought once, offline, instead of by a learner who is
 * sitting there waiting for it.
 *
 * HOW
 * ---
 * This calls the DEPLOYED callable rather than re-implementing its prompt.
 * That matters: the prompt is ~70 lines of inline template inside tutor.ts, and
 * a pre-warmer with its own copy would drift the moment either changed, filling
 * the cache with entries the live path never asks for. Going through the real
 * function means the entry written is by definition the entry a learner hits.
 *
 * The cache KEY is computed locally, but only to skip work that is already
 * done. It is verified against the live cache before any spending happens —
 * see --verify, which is also run automatically as a preflight.
 *
 * USAGE
 * -----
 *   node scripts/prewarm-tutor-cache.mjs --exam <examId> --dry-run
 *   node scripts/prewarm-tutor-cache.mjs --exam <examId> --limit 250
 *   node scripts/prewarm-tutor-cache.mjs --verify --exam <examId>
 *   node scripts/prewarm-tutor-cache.mjs --prune --dry-run
 *
 * RE-RUN THIS AFTER ANY QUESTION EDIT
 * -----------------------------------
 * The cache key is a hash of the question stem and its options, so editing a
 * question — even one typo — changes the hash. Correctness is self-healing:
 * the edited question misses and regenerates against the current rationale, so
 * nobody is ever served a breakdown written for the old wording.
 *
 * Speed is NOT self-healing. Those questions silently fall back to a full
 * OpenAI call, and the old entries become orphans that are never read and
 * never collected. Nothing links a question document to the entries derived
 * from it, so nothing notices. There is no error and no log — just a slow
 * answer for whoever hits that question next.
 *
 * So: after any question edit, bulk upload, blueprint remap, or a bump of
 * TUTOR_PROMPT_VERSION (which invalidates everything at once), re-run this.
 * Already-warm combinations are skipped, so only what actually changed costs
 * anything. --prune clears the orphans left behind.
 *
 * Requires GOOGLE_APPLICATION_CREDENTIALS (service account) and, for real runs,
 * a Pro/admin uid to authenticate as (--uid, defaults to the owner account).
 *
 * RATE LIMIT
 * ----------
 * enforceRateLimit caps generateTutorBreakdown at 300/day PER IP. A full PMP
 * bank is 194 x 4 = 776 calls, so a complete pre-warm is three days from one
 * machine. The script stops cleanly at the cap and tells you where it got to;
 * re-run tomorrow and it resumes, because everything already cached is skipped.
 *
 * Burning the daily quota also blocks the coach for anyone sharing this IP —
 * i.e. you — for the rest of the day. Run it when you are not studying.
 */

import admin from 'firebase-admin';
import { createHash } from 'crypto';

// --- config -----------------------------------------------------------------

const PROJECT_ID = 'exam-coach-ai-platform';
const REGION = 'us-central1';
/** Public web API key, from web/src/firebase.ts. Safe to embed. */
const WEB_API_KEY = 'AIzaSyBBlyZqdAJw_yNNfUQfVW59eYgkrBJLUCQ';
/** Must match TUTOR_PROMPT_VERSION in functions/src/tutor.ts. */
const TUTOR_PROMPT_VERSION = 'v2';
/** Must match enforceRateLimit('generateTutorBreakdown', context, 300). */
const DAILY_RATE_LIMIT = 300;
/** Owner account — Pro, so it passes requirePro. */
const DEFAULT_UID = 'XjIHTjghuaWZ79Bqqd0F1Hd34xO2';

/**
 * Mirrors EXAM_LENS in web/src/config/exams.ts. These strings are part of the
 * cache key AND of the prompt, so they must match what the browser sends
 * character for character — a drifted lens name silently produces entries no
 * learner will ever hit. --verify is what proves they still line up.
 */
const EXAM_LENS = {
    '7qmPagj9A6RpkC0CwGkY': { lensName: 'PMI Decision Lens', framework: 'What would PMI want you to do?' },
    '6kECziMtR1BS3MpABLW5': { lensName: 'PMI Decision Lens', framework: 'What would PMI want you to do?' },
    'IpECw0XAtBkgD1HyvYas': { lensName: 'Scrum Guide Lens', framework: 'What does the Scrum Guide say the role should do?' },
    'bpfawZDj3qalhoU4mdd3': { lensName: 'SHRM Competency Lens', framework: 'What aligns with SHRM behavioral competencies?' },
    'XGfL6RE2ls7cokP2tqMa': { lensName: 'DMAIC Lens', framework: 'Where does this fall in Define-Measure-Analyze-Improve-Control?' },
    'Vs3aNmifAJc9bYRFCxXc': { lensName: 'Payroll Compliance Lens', framework: 'What does federal/state payroll law require?' },
    'dtgTymjijqUr4NEIHbE1': { lensName: 'IIA Standards Lens', framework: 'What do the IIA Standards of Practice say?' },
    '6FKeXlV2dzv4I03tewcU': { lensName: 'Service Value Lens', framework: 'How does this serve the ITIL service value chain?' },
    '79cuGMNydTwDMhyiDjry': { lensName: 'Security Triad Lens', framework: 'CIA triad — which principle is being protected?' },
    'gp6QwBz0FXFIntLSQSYr': { lensName: 'OSI Troubleshooting Lens', framework: "What layer is this, and what's the systematic fix?" },
    'N5mrEby0gKLFs1y88DpM': { lensName: 'OSI Troubleshooting Lens', framework: "What layer is this, and what's the systematic fix?" },
    'cxBsVz8AVaocdEYbgSMA': { lensName: 'Troubleshooting Methodology Lens', framework: 'What step of the CompTIA troubleshooting model?' },
    '12396VsKMFLnPMXivHKQ': { lensName: 'Troubleshooting Methodology Lens', framework: 'What step of the CompTIA troubleshooting model?' },
    'bF7IQUrKjbP2KLwiSNqt': { lensName: 'Program Governance Lens', framework: "How does this serve the program's strategic objectives and benefits realization?" },
};

/**
 * Only formats the coach actually serves. Quiz.tsx returns early for anything
 * that does not grade by a single index (matching / pbq / multi-response),
 * so pre-warming those would buy completions nothing can ever request.
 * Mirrors gradesBySingleIndex.
 */
const COACHABLE_TYPES = new Set(['mcq', 'emv', undefined, null]);

// --- args -------------------------------------------------------------------

const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const val = (f, d = null) => {
    const i = argv.indexOf(f);
    return i >= 0 && argv[i + 1] ? argv[i + 1] : d;
};

const EXAM_ID = val('--exam');
const MODE = val('--mode', 'quick');
const LIMIT = parseInt(val('--limit', String(DAILY_RATE_LIMIT)), 10);
const DRY_RUN = has('--dry-run');
const VERIFY_ONLY = has('--verify');
const PRUNE = has('--prune');
const UID = val('--uid', DEFAULT_UID);

if (!EXAM_ID && !PRUNE) {
    console.error('ERROR: --exam <examId> is required.');
    console.error('  PMP v2026        6kECziMtR1BS3MpABLW5');
    console.error('  Security+        79cuGMNydTwDMhyiDjry');
    console.error('  SHRM-CP          bpfawZDj3qalhoU4mdd3');
    process.exit(1);
}
if (MODE !== 'quick' && MODE !== 'deep') {
    console.error(`ERROR: --mode must be quick or deep (got "${MODE}")`);
    process.exit(1);
}

admin.initializeApp({ projectId: PROJECT_ID });
const db = admin.firestore();

// --- cache key --------------------------------------------------------------

/**
 * Byte-identical to the key built inside generateTutorBreakdown. Field ORDER
 * matters — this is a hash of JSON.stringify, not of a sorted object, so
 * reordering these lines changes every key and silently orphans the cache.
 */
function cacheKey({ questionStem, options, userSelectedOptionIndex, isDeep, lensName, lensFramework }) {
    return createHash('sha256')
        .update(JSON.stringify({
            v: TUTOR_PROMPT_VERSION,
            questionStem,
            options,
            userSelectedOptionIndex,
            coachMode: isDeep ? 'deep' : 'quick',
            lensName: lensName || null,
            lensFramework: lensFramework || null,
        }))
        .digest('hex');
}

// --- auth -------------------------------------------------------------------

/** Custom token -> ID token, so the callable sees a real authenticated Pro user. */
async function getIdToken(uid) {
    const customToken = await admin.auth().createCustomToken(uid);
    const res = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${WEB_API_KEY}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: customToken, returnSecureToken: true }),
        },
    );
    const body = await res.json();
    if (!res.ok) throw new Error(`signInWithCustomToken failed: ${JSON.stringify(body)}`);
    return body.idToken;
}

async function callCoach(idToken, payload) {
    const res = await fetch(`https://${REGION}-${PROJECT_ID}.cloudfunctions.net/generateTutorBreakdown`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ data: payload }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
        const msg = body?.error?.message || `HTTP ${res.status}`;
        const err = new Error(msg);
        err.status = res.status;
        err.code = body?.error?.status;
        throw err;
    }
    return body.result;
}

// --- work list --------------------------------------------------------------

async function buildWorkList() {
    const lens = EXAM_LENS[EXAM_ID] || null;
    const snap = await db.collection('questions').where('examId', '==', EXAM_ID).get();

    const jobs = [];
    let skippedFormat = 0;
    for (const doc of snap.docs) {
        const q = doc.data();
        if (!COACHABLE_TYPES.has(q.type)) { skippedFormat++; continue; }
        const options = q.options || [];
        if (!options.length) { skippedFormat++; continue; }

        for (let i = 0; i < options.length; i++) {
            jobs.push({
                questionId: doc.id,
                key: cacheKey({
                    questionStem: q.stem,
                    options,
                    userSelectedOptionIndex: i,
                    isDeep: MODE === 'deep',
                    lensName: lens?.lensName,
                    lensFramework: lens?.framework,
                }),
                payload: {
                    questionStem: q.stem,
                    options,
                    correctAnswerIndex: q.correctAnswer,
                    userSelectedOptionIndex: i,
                    correctRationale: q.explanation,
                    examDomain: q.domain,
                    examId: EXAM_ID,
                    coachMode: MODE,
                    lensName: lens?.lensName,
                    lensFramework: lens?.framework,
                },
            });
        }
    }
    return { jobs, questionCount: snap.size, skippedFormat };
}

/** Firestore getAll caps at 300 refs per call. */
async function findCached(keys) {
    const cached = new Set();
    for (let i = 0; i < keys.length; i += 300) {
        const refs = keys.slice(i, i + 300).map((k) => db.collection('tutor_cache').doc(k));
        const snaps = await db.getAll(...refs);
        snaps.forEach((s) => { if (s.exists) cached.add(s.id); });
    }
    return cached;
}

// --- prune ------------------------------------------------------------------

/**
 * Delete cache entries no live question can produce any more.
 *
 * These are the orphans left by question edits: the edited question hashes to
 * a new key and regenerates, and the entry written for the old wording sits
 * there permanently, unreadable and uncollected.
 *
 * Deciding what is garbage means enumerating every key the app could ask for —
 * every question, every option, BOTH coach modes, across ALL exams. Anything
 * outside that set is unreachable. Scoping this to one exam would classify
 * every other exam's entries as orphans, so --prune deliberately ignores
 * --exam.
 *
 * The failure mode is severe and quiet: if the key derivation here is wrong,
 * the valid set is wrong, and this deletes the entire working cache while
 * reporting success. Hence the guards below — a matched-key preflight, and a
 * refusal to delete a majority of the cache without being told to.
 */
async function prune() {
    const snap = await db.collection('questions').get();
    const valid = new Set();
    for (const doc of snap.docs) {
        const q = doc.data();
        const options = q.options || [];
        if (!options.length) continue;
        const lens = EXAM_LENS[q.examId] || null;
        for (let i = 0; i < options.length; i++) {
            for (const isDeep of [false, true]) {
                valid.add(cacheKey({
                    questionStem: q.stem,
                    options,
                    userSelectedOptionIndex: i,
                    isDeep,
                    lensName: lens?.lensName,
                    lensFramework: lens?.framework,
                }));
            }
        }
    }

    const cacheSnap = await db.collection('tutor_cache').get();
    const orphans = cacheSnap.docs.filter((d) => !valid.has(d.id));
    const live = cacheSnap.size - orphans.length;

    console.log(`questions scanned   ${snap.size} (all exams)`);
    console.log(`reachable keys      ${valid.size}  (question x option x both modes)`);
    console.log(`tutor_cache docs    ${cacheSnap.size}`);
    console.log(`still reachable     ${live}`);
    console.log(`orphaned            ${orphans.length}`);
    console.log('');

    // Same preflight as the warm path: the cache holds entries the live app
    // wrote, so a correct derivation must recognise some of them.
    if (live === 0 && cacheSnap.size > 0) {
        console.error(`ABORT: 0 of ${cacheSnap.size} entries matched a reachable key.`);
        console.error('That means the key derivation is wrong, not that the whole cache is garbage.');
        console.error('Check TUTOR_PROMPT_VERSION and the EXAM_LENS strings before pruning anything.');
        process.exit(1);
    }
    if (!orphans.length) { console.log('Nothing to prune.'); return; }

    // A prompt-version bump legitimately orphans everything, but so does a bug
    // here — and they look identical from inside this script. Make the caller
    // say out loud that a mass deletion is intended.
    if (orphans.length > cacheSnap.size / 2 && !has('--yes-delete-most')) {
        console.error(`ABORT: this would delete ${orphans.length} of ${cacheSnap.size} entries (over half).`);
        console.error('That is expected right after a TUTOR_PROMPT_VERSION bump, and is also what a');
        console.error('broken key derivation looks like. If you meant it, re-run with --yes-delete-most.');
        process.exit(1);
    }

    if (DRY_RUN) { console.log(`DRY RUN — would delete ${orphans.length} orphaned entr(ies).`); return; }

    let deleted = 0;
    for (let i = 0; i < orphans.length; i += 400) {
        const batch = db.batch();
        orphans.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
        await batch.commit();
        deleted += Math.min(400, orphans.length - i);
    }
    console.log(`deleted             ${deleted}`);
}

// --- main -------------------------------------------------------------------

(async () => {
    if (PRUNE) { await prune(); return; }

    const { jobs, questionCount, skippedFormat } = await buildWorkList();
    const cached = await findCached(jobs.map((j) => j.key));
    const todo = jobs.filter((j) => !cached.has(j.key));

    console.log(`exam            ${EXAM_ID}`);
    console.log(`mode            ${MODE}`);
    console.log(`questions       ${questionCount} (${skippedFormat} skipped: no options or a format the coach cannot serve)`);
    console.log(`combinations    ${jobs.length}  (question x picked option)`);
    console.log(`already cached  ${cached.size}`);
    console.log(`to generate     ${todo.length}`);
    console.log('');

    // Preflight the key logic before spending anything.
    //
    // The cache already holds entries written by the live app, so if this
    // script's key derivation is correct it MUST find some of them. Finding
    // zero means the hash drifted — a wrong lens string, a reordered field, a
    // bumped TUTOR_PROMPT_VERSION — and every completion bought would land on
    // a key no learner ever looks up. That is the expensive silent failure,
    // so refuse to spend rather than warn.
    const liveTotal = (await db.collection('tutor_cache').count().get()).data().count;
    if (cached.size === 0 && liveTotal > 0) {
        console.error(`ABORT: matched 0 of ${liveTotal} live tutor_cache entries.`);
        console.error('The cache key derived here does not agree with the deployed function.');
        console.error('Check TUTOR_PROMPT_VERSION, the EXAM_LENS strings, and the field order in cacheKey().');
        console.error('Not spending money on entries nothing would read.');
        process.exit(1);
    }
    console.log(`key check       matched ${cached.size} existing entries (of ${liveTotal} in tutor_cache) — key logic agrees with production`);

    if (VERIFY_ONLY) return;

    if (!todo.length) { console.log('\nNothing to do — this exam and mode are fully warm.'); return; }

    const batch = todo.slice(0, LIMIT);
    if (DRY_RUN) {
        console.log(`\nDRY RUN — would generate ${batch.length} breakdown(s) now.`);
        if (todo.length > LIMIT) {
            console.log(`${todo.length - LIMIT} would remain; the callable allows ${DAILY_RATE_LIMIT}/day per IP, so budget ~${Math.ceil(todo.length / DAILY_RATE_LIMIT)} day(s).`);
        }
        return;
    }

    console.log(`Generating ${batch.length}...  (sequential on purpose: each one is an OpenAI call, and`);
    console.log('the point is to spend the quota deliberately, not to race it)\n');

    let done = 0, failed = 0;
    for (const [i, job] of batch.entries()) {
        try {
            await callCoach(await tokenFor(), job.payload);
            done++;
        } catch (err) {
            // The limiter reports resource-exhausted. Nothing after this will
            // succeed today, so stop rather than burn through the rest failing.
            if (err.code === 'RESOURCE_EXHAUSTED' || /rate limit|exhausted/i.test(err.message)) {
                console.log(`\nDaily rate limit reached after ${done} generated. Re-run tomorrow to resume.`);
                break;
            }
            failed++;
            console.warn(`  [${i + 1}] ${job.questionId} option ${job.payload.userSelectedOptionIndex}: ${err.message}`);
            if (failed >= 10) { console.error('\nABORT: 10 failures. Fix the cause before spending more.'); break; }
        }
        if ((i + 1) % 25 === 0) console.log(`  ${i + 1}/${batch.length}  (${done} cached, ${failed} failed)`);
    }

    const nowCached = (await findCached(jobs.map((j) => j.key))).size;
    console.log(`\ngenerated       ${done}`);
    console.log(`failed          ${failed}`);
    console.log(`cached now      ${nowCached} / ${jobs.length}`);
    if (nowCached < jobs.length) console.log(`remaining       ${jobs.length - nowCached}  — re-run to continue`);
})().catch((e) => { console.error(e); process.exit(1); });

// ID tokens last an hour; a long run outlives one, so refresh on a timer.
let _tok = null, _tokAt = 0;
async function tokenFor() {
    if (!_tok || Date.now() - _tokAt > 45 * 60 * 1000) {
        _tok = await getIdToken(UID);
        _tokAt = Date.now();
    }
    return _tok;
}
