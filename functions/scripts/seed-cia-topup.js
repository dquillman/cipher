/**
 * Seeds the CIA Part 1 top-up (governance / proficiency / QAIP) into `questions`.
 *
 * WHY THIS EXISTS: the 2026-08 dedupe removed 100 option-shuffled clones from
 * the CIA Part 1 bank and, unlike CPP and SHRM-CP, never seeded a replacement
 * batch. That left 125 unique questions against a 125-question full mock — so
 * every mock attempt was the entire bank reshuffled, and a second sitting
 * measured recall rather than readiness. The same defect the dedupe was written
 * to fix, in a new shape. These 50 close it: 175 unique against a 125 mock.
 *
 * They also close the two real coverage gaps. QAIP held 4 questions against a
 * 7% blueprint weight and Proficiency 16 against 18%; after this they sit at
 * 8.0% and 19.4%. The 22 GRC questions push an already-over-weight domain
 * further over — the NEXT authoring batch should target Independence and
 * Objectivity, which is the worst gap in the bank after this seed and receives
 * nothing here.
 *
 *   node scripts/seed-cia-topup.js            # dry run
 *   node scripts/seed-cia-topup.js --apply
 *
 * Idempotent on stem: a question whose normalised stem already exists is
 * skipped, so a re-run cannot duplicate. Writes a backup of what it added.
 */

const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");

const CIA_EXAM_ID = "dtgTymjijqUr4NEIHbE1";
const STAGING = path.join(__dirname, "..", "content-staging", "cia-topup");
const FILES = ["governance-risk-control.json", "proficiency-due-care.json", "qaip.json"];
const APPLY = process.argv.includes("--apply");

const norm = (s) => String(s || "").trim().toLowerCase().replace(/\s+/g, " ");

function load() {
    const out = [];
    for (const f of FILES) {
        const raw = JSON.parse(fs.readFileSync(path.join(STAGING, f), "utf8"));
        const arr = Array.isArray(raw) ? raw : raw.questions;
        arr.forEach((q, i) => out.push({ ...q, __src: `${f}[${i}]` }));
    }
    return out;
}

/** Refuses anything that would seed a broken question. */
function validate(q) {
    const problems = [];
    if (!q.stem || String(q.stem).length < 20) problems.push("stem missing or too short");
    if (!Array.isArray(q.options) || q.options.length !== 4) problems.push("needs exactly 4 options");
    if (!Number.isInteger(q.correctAnswer) || q.correctAnswer < 0 || q.correctAnswer > 3)
        problems.push(`correctAnswer out of range: ${q.correctAnswer}`);
    if (!q.explanation || String(q.explanation).length < 40) problems.push("explanation missing or too short");
    if (!q.domain) problems.push("domain missing");
    // seed.ts: "Every seeded question MUST include bloomLevel." The CPP/SHRM
    // top-ups shipped without it and were invisible to every Bloom-filtered
    // drill until they were backfilled. Not repeating that.
    if (!q.bloomLevel) problems.push("bloomLevel missing");
    return problems;
}

(async () => {
    const questions = load();
    console.log(`${questions.length} staged CIA questions\n`);

    const bad = [];
    for (const q of questions) {
        const problems = validate(q);
        if (problems.length) bad.push(`  ${q.__src}: ${problems.join("; ")}`);
    }
    if (bad.length) {
        console.error("ABORT — staged questions failed validation:");
        bad.forEach((b) => console.error(b));
        process.exit(1);
    }
    console.log("validation passed on all staged questions");

    admin.initializeApp({
        credential: admin.credential.cert(require(path.join(__dirname, "..", "serviceAccountKey.json"))),
    });
    const db = admin.firestore();

    const live = await db.collection("questions").where("examId", "==", CIA_EXAM_ID).get();
    const liveStems = new Set();
    live.forEach((d) => liveStems.add(norm(d.data().stem)));
    console.log(`${live.size} live CIA questions already in the bank`);

    const toAdd = [];
    let skipped = 0;
    const seenInBatch = new Set();
    for (const q of questions) {
        const key = norm(q.stem);
        if (liveStems.has(key) || seenInBatch.has(key)) { skipped += 1; continue; }
        seenInBatch.add(key);
        toAdd.push(q);
    }

    console.log(`to add: ${toAdd.length}   already present, skipped: ${skipped}`);
    const byDomain = {};
    toAdd.forEach((q) => { byDomain[q.domain] = (byDomain[q.domain] || 0) + 1; });
    console.log("by domain: " + JSON.stringify(byDomain, null, 1));
    console.log(`\nbank after seed: ${live.size + toAdd.length} unique`);

    if (!toAdd.length) { console.log("nothing to do."); process.exit(0); }
    if (!APPLY) { console.log("\n--dry run: nothing written. Re-run with --apply."); process.exit(0); }

    const added = [];
    let batch = db.batch();
    let n = 0;
    for (const q of toAdd) {
        const ref = db.collection("questions").doc();
        const { __src, source, ...clean } = q;
        batch.set(ref, {
            ...clean,
            examId: CIA_EXAM_ID,
            type: q.type || "standard",
            bloomClassifiedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        added.push({ id: ref.id, src: __src, stem: String(q.stem).slice(0, 70) });
        n += 1;
        if (n % 400 === 0) { await batch.commit(); batch = db.batch(); }
    }
    await batch.commit();

    const backup = path.join(__dirname, `backup-cia-topup-upload-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
    fs.writeFileSync(backup, JSON.stringify({ takenAt: new Date().toISOString(), exam: "CIA Part 1", examId: CIA_EXAM_ID, added }, null, 2));

    const after = await db.collection("questions").where("examId", "==", CIA_EXAM_ID).get();
    console.log(`\nseeded ${added.length}. CIA bank is now ${after.size} questions.`);
    console.log(`backup: ${path.basename(backup)}`);
    process.exit(0);
})();
