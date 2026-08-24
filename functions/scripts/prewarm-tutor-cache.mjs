#!/usr/bin/env node
/**
 * Pre-warm `tutor_cache` so answering a question is a Firestore read, not an
 * OpenAI call.
 *
 * WHY
 * ---
 * generateTutorBreakdown sits directly on the post-answer path. It is already
 * warm (minInstances:1) and checks a shared cross-user cache first, so its
 * latency is the OpenAI completion itself — measured on production via the
 * coach_timing event at 5,594 / 6,315 / 6,825 ms across three real answers,
 * 0 of 3 cache hits.
 *
 * A hit is rare because the cache key includes WHICH OPTION the learner picked,
 * so the reachable key space is questions x options x modes — 16,750 across the
 * bank, against 89 entries actually cached. The bank is fixed, so every one of
 * those completions can be bought once, offline, instead of by a learner who is
 * sitting there waiting for it.
 *
 * HOW
 * ---
 * Both the prompt and the cache key are IMPORTED from the compiled function
 * (`lib/tutor.js`) — `buildTutorRequest` and `buildTutorCacheKey`, the same
 * functions the deployed callable itself calls. There is no second copy of the
 * prompt to drift, so an entry written here is by definition an entry a learner
 * hits.
 *
 * An earlier version called the deployed callable over HTTPS instead. That
 * needed a signed-in user, and the web API key is restricted to browser
 * referrers, so it could not authenticate from a server. It also inherited
 * enforceRateLimit's 300/day-per-IP cap, which exists to stop scripted abuse
 * and has no business throttling the owner's one-time batch job. Importing the
 * builders removes the auth problem and the cap together.
 *
 * Run `npm run build` in functions/ first — this reads lib/, not src/.
 *
 * USAGE
 * -----
 *   node scripts/prewarm-tutor-cache.mjs --exam <examId> --dry-run
 *   node scripts/prewarm-tutor-cache.mjs --exam <examId>
 *   node scripts/prewarm-tutor-cache.mjs --verify --exam <examId>
 *   node scripts/prewarm-tutor-cache.mjs --prune --dry-run
 *
 * Requires GOOGLE_APPLICATION_CREDENTIALS. The OpenAI key is taken from
 * OPENAI_API_KEY if set, otherwise read from the project's Functions config via
 * the Firebase CLI, so the secret never has to be pasted into a shell.
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
 */

import admin from 'firebase-admin';
import OpenAI from 'openai';
import { execFileSync } from 'child_process';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { buildTutorCacheKey, buildTutorRequest } = require('../lib/tutor.js');

// --- config -----------------------------------------------------------------

const PROJECT_ID = 'exam-coach-ai-platform';

/**
 * Mirrors EXAM_LENS in web/src/config/exams.ts. These strings go into both the
 * cache key and the prompt, so they must match what the browser sends
 * character for character — a drifted lens name silently produces entries no
 * learner will ever hit. The preflight below is what proves they still line up.
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
 * that does not grade by a single index (matching / pbq / multi-response), so
 * pre-warming those would buy completions nothing can ever request. Mirrors
 * gradesBySingleIndex.
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
const LIMIT = parseInt(val('--limit', '100000'), 10);
const CONCURRENCY = Math.max(1, parseInt(val('--concurrency', '4'), 10));
const DRY_RUN = has('--dry-run');
const VERIFY_ONLY = has('--verify');
const PRUNE = has('--prune');

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

// lib/tutor.js reaches admin.firestore() at module scope, so importing it above
// has already initialized the default app. Initializing again throws
// app/duplicate-app.
if (!admin.apps.length) admin.initializeApp({ projectId: PROJECT_ID });
const db = admin.firestore();

// --- openai key -------------------------------------------------------------

/** Mirrors resolveOpenAIKey's precedence: Functions config first, then env. */
function resolveOpenAIKey() {
    try {
        // cwd is the repo root, not functions/ — the CLI resolves the project
        // from firebase.json and does not find it from a subdirectory.
        // shell:true because on Windows npx is a .cmd shim.
        const out = execFileSync(
            'npx',
            ['firebase', 'functions:config:get', 'openai.key', '--project', PROJECT_ID],
            {
                encoding: 'utf8',
                stdio: ['ignore', 'pipe', 'ignore'],
                shell: true,
                cwd: new URL('../..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'),
            },
        );
        // A single scalar comes back as a bare quoted JSON string on its own
        // line, with the deprecation banner on stderr (already discarded).
        const line = out.split('\n').map((l) => l.trim()).find((l) => l.startsWith('"'));
        const key = line ? JSON.parse(line) : null;
        if (key) return key;
    } catch {
        // CLI missing, not logged in, or no runtime config — fall through.
    }
    return process.env.OPENAI_API_KEY || null;
}

// --- work list --------------------------------------------------------------

function inputsFor(q, optionIndex, examId) {
    const lens = EXAM_LENS[examId] || null;
    return {
        questionStem: q.stem,
        options: q.options || [],
        correctAnswerIndex: q.correctAnswer,
        userSelectedOptionIndex: optionIndex,
        correctRationale: q.explanation,
        examDomain: q.domain,
        isDeep: MODE === 'deep',
        lensName: lens?.lensName,
        lensFramework: lens?.framework,
    };
}

async function buildWorkList() {
    const snap = await db.collection('questions').where('examId', '==', EXAM_ID).get();
    const jobs = [];
    let skippedFormat = 0;
    for (const doc of snap.docs) {
        const q = doc.data();
        const options = q.options || [];
        if (!COACHABLE_TYPES.has(q.type) || !options.length) { skippedFormat++; continue; }
        for (let i = 0; i < options.length; i++) {
            const inputs = inputsFor(q, i, EXAM_ID);
            jobs.push({ questionId: doc.id, optionIndex: i, inputs, key: buildTutorCacheKey(inputs) });
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
 * Delete cache entries no live question can produce any more — the orphans left
 * by question edits.
 *
 * Deciding what is garbage means enumerating every key the app could ask for:
 * every question, every option, BOTH coach modes, across ALL exams. Anything
 * outside that set is unreachable. Scoping to one exam would classify every
 * other exam's entries as orphans, so --prune deliberately ignores --exam.
 *
 * The failure mode is severe and quiet: if the key derivation is wrong the
 * valid set is wrong, and this deletes the whole working cache while reporting
 * success. Hence the two guards below.
 */
async function prune() {
    const snap = await db.collection('questions').get();
    const valid = new Set();
    for (const doc of snap.docs) {
        const q = doc.data();
        if (!(q.options || []).length) continue;
        for (let i = 0; i < q.options.length; i++) {
            for (const isDeep of [false, true]) {
                valid.add(buildTutorCacheKey({ ...inputsFor(q, i, q.examId), isDeep }));
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
    console.log(`orphaned            ${orphans.length}\n`);

    if (live === 0 && cacheSnap.size > 0) {
        console.error(`ABORT: 0 of ${cacheSnap.size} entries matched a reachable key.`);
        console.error('That means the key derivation is wrong, not that the whole cache is garbage.');
        console.error('Check TUTOR_PROMPT_VERSION and the EXAM_LENS strings before pruning anything.');
        process.exit(1);
    }
    if (!orphans.length) { console.log('Nothing to prune.'); return; }

    // A prompt-version bump legitimately orphans everything, but so does a bug
    // here — and from inside this script they look identical. Make the caller
    // say out loud that a mass deletion is intended.
    if (orphans.length > cacheSnap.size / 2 && !has('--yes-delete-most')) {
        console.error(`ABORT: this would delete ${orphans.length} of ${cacheSnap.size} entries (over half).`);
        console.error('Expected right after a TUTOR_PROMPT_VERSION bump, and also what a broken key');
        console.error('derivation looks like. If you meant it, re-run with --yes-delete-most.');
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

// --- generate ---------------------------------------------------------------

async function generate(client, job) {
    const res = await client.chat.completions.create(buildTutorRequest(job.inputs));
    const content = res.choices[0]?.message?.content;
    if (!content) throw new Error('empty completion');
    const result = JSON.parse(content);
    if (!result?.verdict) throw new Error('completion had no verdict');

    // Same shape the callable writes. Deliberately NOT calling
    // processPatternInteraction: that credits a pattern miss to a user, and
    // there is no user here — attributing 776 of them to whoever ran the
    // script would poison their trap statistics.
    await db.collection('tutor_cache').doc(job.key).set({
        result,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
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
    console.log(`to generate     ${todo.length}\n`);

    // Preflight the key logic before spending anything.
    //
    // The cache already holds entries written by the live app, so a correct
    // derivation MUST match some of them. Matching zero means the hash drifted —
    // a wrong lens string, a bumped TUTOR_PROMPT_VERSION, a stale lib/ build —
    // and every completion bought would land on a key no learner looks up.
    // That is the expensive silent failure, so refuse to spend rather than warn.
    const liveTotal = (await db.collection('tutor_cache').count().get()).data().count;
    if (cached.size === 0 && liveTotal > 0) {
        console.error(`ABORT: matched 0 of ${liveTotal} live tutor_cache entries.`);
        console.error('The cache key derived here does not agree with the deployed function.');
        console.error('Check TUTOR_PROMPT_VERSION, the EXAM_LENS strings, and that lib/ is freshly built.');
        console.error('Not spending money on entries nothing would read.');
        process.exit(1);
    }
    console.log(`key check       matched ${cached.size} existing entries (of ${liveTotal} in tutor_cache) — key logic agrees with production`);

    if (VERIFY_ONLY) return;
    if (!todo.length) { console.log('\nNothing to do — this exam and mode are fully warm.'); return; }

    const batch = todo.slice(0, LIMIT);
    if (DRY_RUN) { console.log(`\nDRY RUN — would generate ${batch.length} breakdown(s).`); return; }

    const apiKey = resolveOpenAIKey();
    if (!apiKey) {
        console.error('\nERROR: no OpenAI key. Set OPENAI_API_KEY, or make sure the Firebase CLI is');
        console.error('logged in so the key can be read from the project Functions config.');
        process.exit(1);
    }
    const client = new OpenAI({ apiKey });

    console.log(`\nGenerating ${batch.length} with concurrency ${CONCURRENCY}...\n`);

    let done = 0, failed = 0, aborted = false;
    let next = 0;
    await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
        while (!aborted) {
            const i = next++;
            if (i >= batch.length) return;
            try {
                await generate(client, batch[i]);
                done++;
            } catch (err) {
                failed++;
                console.warn(`  ${batch[i].questionId} option ${batch[i].optionIndex}: ${err.message}`);
                // A handful of bad questions is normal; a wall of failures means
                // the key, the prompt or the account is wrong. Stop paying.
                if (failed >= 10) { aborted = true; console.error('\nABORT: 10 failures. Fix the cause before spending more.'); return; }
            }
            if ((done + failed) % 50 === 0) console.log(`  ${done + failed}/${batch.length}  (${done} cached, ${failed} failed)`);
        }
    }));

    const nowCached = (await findCached(jobs.map((j) => j.key))).size;
    console.log(`\ngenerated       ${done}`);
    console.log(`failed          ${failed}`);
    console.log(`cached now      ${nowCached} / ${jobs.length}`);
    if (nowCached < jobs.length) console.log(`remaining       ${jobs.length - nowCached}  — re-run to continue`);
})().catch((e) => { console.error(e); process.exit(1); });
