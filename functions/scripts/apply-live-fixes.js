/**
 * Apply targeted rewrites to questions already live in production.
 *
 * An independent review of the 124 top-up questions confirmed every answer key
 * is correct — so none of these are re-keyings. Three taught a factually stale
 * rule in the explanation, and four were answerable without knowing the
 * material (a key that echoed the stem, a distractor the stem itself disproved,
 * an option set where only one deferred nobody, a 280-character key against
 * short distractors). Right answer, wrong lesson.
 *
 * MATCHING: the staged fixes are keyed by source file and array index, because
 * that is how the reviewer addressed them. Production documents have neither.
 * So each fix is matched to its live document by the ORIGINAL stem text, read
 * from the staged source file at the recorded index. If a stem does not match
 * exactly one live document, the fix is REFUSED rather than guessed — writing a
 * rewrite over the wrong question would be worse than the defect it fixes.
 *
 * SAFE BY DEFAULT. Does nothing without --apply. Backs up every pre-edit
 * document. Refuses the whole run if any single fix cannot be matched.
 *
 *   node scripts/apply-live-fixes.js           # dry run
 *   node scripts/apply-live-fixes.js --apply   # commit
 */

const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");

const APPLY = process.argv.includes("--apply");
const FIXES = path.join(__dirname, "..", "content-staging", "live-fixes", "rewrites.json");

admin.initializeApp({
    credential: admin.credential.cert(require(path.join(__dirname, "..", "serviceAccountKey.json"))),
    projectId: "exam-coach-ai-platform",
});
const db = admin.firestore();

const norm = (s) => String(s || "").trim().toLowerCase().replace(/\s+/g, " ");

(async () => {
    console.log(APPLY ? "\n=== APPLY MODE — rewriting live questions ===\n" : "\n=== DRY RUN — nothing will be written. ===\n");

    const fixes = JSON.parse(fs.readFileSync(FIXES, "utf8"));
    console.log(`${fixes.length} staged fix(es).\n`);

    // Every affected question lives in one of these two banks.
    const banks = ["Vs3aNmifAJc9bYRFCxXc", "bpfawZDj3qalhoU4mdd3"];
    const live = [];
    for (const id of banks) {
        const qs = await db.collection("questions").where("examId", "==", id).get();
        qs.forEach((d) => live.push({ id: d.id, ref: d.ref, data: d.data() }));
    }
    console.log(`${live.length} live question(s) across both banks.\n`);

    const planned = [];
    const problems = [];

    for (const [n, fix] of fixes.entries()) {
        const label = `fix[${n}] ${path.basename(fix.file)} #${fix.index}`;
        if (!fs.existsSync(fix.file)) { problems.push(`${label}: source file not found`); continue; }
        const src = JSON.parse(fs.readFileSync(fix.file, "utf8"));
        const original = src[fix.index];
        if (!original) { problems.push(`${label}: index ${fix.index} not present in source`); continue; }

        const matches = live.filter((l) => norm(l.data.stem) === norm(original.stem));
        if (matches.length !== 1) {
            problems.push(`${label}: original stem matched ${matches.length} live documents (need exactly 1) — "${String(original.stem).slice(0, 70)}..."`);
            continue;
        }
        const target = matches[0];
        const rep = fix.replacement;
        if (!rep) { problems.push(`${label}: no replacement object`); continue; }
        if (!Array.isArray(rep.options) || rep.options.length !== 4) { problems.push(`${label}: replacement needs exactly 4 options`); continue; }
        if (typeof rep.correctAnswer !== "number" || rep.correctAnswer < 0 || rep.correctAnswer > 3) { problems.push(`${label}: correctAnswer out of range`); continue; }
        // The review confirmed the original key was right, so a rewrite that
        // changes which ANSWER is correct is out of scope and must be caught.
        const oldKey = String(original.options?.[original.correctAnswer] ?? "").trim().toLowerCase();
        const newKey = String(rep.options[rep.correctAnswer]).trim().toLowerCase();
        const keyShifted = oldKey && newKey && oldKey.slice(0, 40) !== newKey.slice(0, 40);
        if (rep.domain !== target.data.domain) problems.push(`${label}: replacement domain "${rep.domain}" != live "${target.data.domain}"`);

        planned.push({ label, ref: target.ref, id: target.id, before: target.data, rep, keyShifted, reason: fix.reason });
    }

    for (const p of planned) {
        console.log(`${p.label}  ->  ${p.id}`);
        console.log(`   ${String(p.reason).replace(/\s+/g, " ").slice(0, 150)}`);
        if (p.keyShifted) console.log(`   NOTE: keyed answer text changed — verify this was intended, the review said the original key was correct`);
    }

    if (problems.length) {
        console.log(`\n!! ${problems.length} PROBLEM(S) — nothing will be written:`);
        problems.forEach((x) => console.log(`   - ${x}`));
        process.exit(1);
    }
    console.log(`\n---- ${planned.length} live question(s) will be rewritten ----`);

    if (!APPLY) { console.log("\nDry run complete. Re-run with --apply to commit."); process.exit(0); }

    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupPath = path.join(__dirname, `backup-live-fixes-${stamp}.json`);
    fs.writeFileSync(backupPath, JSON.stringify({
        takenAt: stamp,
        documents: planned.map((p) => ({ path: p.ref.path, reason: p.reason, before: p.before })),
    }, null, 2));
    console.log(`\nBackup of ${planned.length} pre-edit document(s): ${path.basename(backupPath)}\n`);

    const batch = db.batch();
    planned.forEach((p) => batch.set(p.ref, { ...p.rep, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true }));
    await batch.commit();

    console.log(`Done. ${planned.length} question(s) rewritten in place.`);
    console.log(`Reverse with ${path.basename(backupPath)}.`);
    process.exit(0);
})().catch((e) => { console.error("FAILED:", e.message); process.exit(1); });
