/**
 * Remove duplicate questions — exact stem repeats — from the live banks.
 *
 * Three seeded banks carry byte-identical stems: CPP 93 of 200, CIA Part 1 100
 * of 225, SHRM-CP 62 of 182. Every bank authored or rebuilt in the 2026-08
 * refresh is at zero, so this is an artifact of how those three were originally
 * seeded, not of anything recent.
 *
 * It matters because a full mock draws from the bank. CPP advertises a
 * 190-question mock against 107 unique questions, so a candidate meets most
 * questions twice in one sitting and scores higher on the repeats — which
 * inflates the readiness number this product exists to make honest.
 *
 * WHY DELETE RATHER THAN FLAG: nothing in the learner path filters questions by
 * `isPublished` (checked across Quiz.tsx, smartQuiz.ts, Dashboard.tsx,
 * bloomTrendService.ts). A soft-deleted question would still be served, so a
 * flag would be a fiction. Every removed document is written to a JSON backup
 * first, in full, so this is reversible.
 *
 * WHICH COPY SURVIVES: the richest one — a question carrying a `type`, a Bloom
 * classification, a longer explanation and more populated fields is kept over a
 * bare twin. Ties break on document id so runs are deterministic.
 *
 *   node scripts/dedupe-question-banks.js           # dry run
 *   node scripts/dedupe-question-banks.js --apply   # commit
 */

const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");

const APPLY = process.argv.includes("--apply");

const BANKS = [
    { id: "Vs3aNmifAJc9bYRFCxXc", label: "Certified Payroll Professional (CPP)" },
    { id: "dtgTymjijqUr4NEIHbE1", label: "CIA Part 1" },
    { id: "bpfawZDj3qalhoU4mdd3", label: "SHRM-CP" },
];

admin.initializeApp({
    credential: admin.credential.cert(require(path.join(__dirname, "..", "serviceAccountKey.json"))),
    projectId: "exam-coach-ai-platform",
});
const db = admin.firestore();

const norm = (s) => String(s || "").trim().toLowerCase().replace(/\s+/g, " ");

/**
 * Higher score = better copy to keep.
 *
 * `type` and `bloomLevel` are metadata a backfill can add in a minute. The
 * explanation is the part a human wrote and the part that teaches. Weighting
 * the metadata at 12 combined meant a bare recall question with both fields set
 * beat an authored scenario question that happened to be missing them — which
 * is exactly the situation the 2026-08 top-up created: all 124 new questions
 * shipped without bloomLevel, so on the next run this function would have
 * deleted the good copy and kept the recall twin.
 *
 * The explanation now dominates, and metadata only breaks near-ties.
 */
function richness(q) {
    let s = 0;
    // Authored substance first — this is what cannot be regenerated.
    s += Math.min(String(q.explanation || "").length / 100, 20);
    if (Array.isArray(q.options) && q.options.length === 4) s += 4;
    if (q.objective) s += 3;
    // Metadata: cheap to backfill, so it must never outrank real content.
    if (q.type) s += 2;
    if (q.bloomLevel) s += 1;
    if (q.difficulty) s += 1;
    s += Object.keys(q).length * 0.1;
    return s;
}

(async () => {
    console.log(APPLY ? "\n=== APPLY MODE — deleting from production ===\n" : "\n=== DRY RUN — nothing will be deleted. ===\n");

    const doomed = [];
    const summary = [];

    for (const bank of BANKS) {
        const qs = await db.collection("questions").where("examId", "==", bank.id).get();
        const groups = new Map();
        qs.forEach((d) => {
            const k = norm(d.data().stem);
            if (!groups.has(k)) groups.set(k, []);
            groups.get(k).push({ id: d.id, ref: d.ref, data: d.data() });
        });

        let removed = 0;
        const examples = [];
        for (const [, copies] of groups) {
            if (copies.length < 2) continue;
            copies.sort((a, b) => {
                const diff = richness(b.data) - richness(a.data);
                return diff !== 0 ? diff : a.id.localeCompare(b.id);
            });
            const keep = copies[0];
            const drop = copies.slice(1);
            // Guard: never collapse two copies that actually disagree.
            //
            // Compare the option SET and the correct answer TEXT, not the option
            // ORDER and index. These banks were seeded with option-shuffled
            // clones — same stem, same four options in a different order, the
            // same answer — so an index comparison reads every one of them as a
            // contradiction and refuses to touch anything. Shuffled clones are
            // duplicates for coverage purposes: a candidate who meets both
            // answers the same question twice.
            //
            // A copy whose option set or answer text genuinely differs IS a
            // contradiction, and stays for a human to resolve.
            const optionSet = (q) => JSON.stringify([...(q.options || [])].map((o) => String(o).trim()).sort());
            const answerText = (q) => String((q.options || [])[q.correctAnswer] ?? "").trim();
            const conflicting = drop.filter((d) =>
                optionSet(keep.data) !== optionSet(d.data) || answerText(keep.data) !== answerText(d.data));
            const safe = drop.filter((d) => !conflicting.includes(d));
            if (conflicting.length) {
                examples.push(`      !! ${conflicting.length} copy/copies of "${String(keep.data.stem).slice(0, 60)}..." differ in options or key — LEFT ALONE, needs a human`);
            }
            safe.forEach((d) => doomed.push({ ...d, bank: bank.label }));
            removed += safe.length;
            if (examples.length < 4 && safe.length) {
                examples.push(`      keep ${keep.id} (richness ${richness(keep.data).toFixed(1)}), drop ${safe.map((d) => d.id).join(", ")}`);
            }
        }

        const unique = qs.size - removed;
        summary.push({ label: bank.label, id: bank.id, before: qs.size, after: unique, removed });
        console.log(`--- ${bank.label}`);
        console.log(`    ${qs.size} questions -> ${unique} unique, removing ${removed}`);
        examples.forEach((e) => console.log(e));
        console.log("");
    }

    const total = doomed.length;
    console.log(`---- ${total} document(s) to delete ----\n`);
    summary.forEach((s) => console.log(`   ${String(s.before).padStart(4)} -> ${String(s.after).padStart(4)}   (-${s.removed})   ${s.label}`));

    // A mock cannot draw more unique questions than the bank holds. Flag it here
    // rather than letting the app promise a length it cannot serve.
    console.log(`\nFull-mock capacity after dedupe:`);
    const MOCK = { "Vs3aNmifAJc9bYRFCxXc": 190, "dtgTymjijqUr4NEIHbE1": 125, "bpfawZDj3qalhoU4mdd3": 134 };
    summary.forEach((s) => {
        const want = MOCK[s.id];
        const ok = s.after >= want;
        console.log(`   ${ok ? "ok  " : "SHORT"} ${s.label}: mock asks ${want}, bank holds ${s.after}${ok ? "" : `  -> reduce fullMock or author ${want - s.after} more`}`);
    });

    if (!total) { console.log("\nNothing to do."); process.exit(0); }
    if (!APPLY) { console.log("\nDry run complete. Re-run with --apply to delete."); process.exit(0); }

    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupPath = path.join(__dirname, `backup-dedupe-${stamp}.json`);
    fs.writeFileSync(backupPath, JSON.stringify({
        takenAt: stamp,
        note: "Full copies of every question document deleted by dedupe-question-banks.js. Restore by writing each `data` back to `path`.",
        documents: doomed.map((d) => ({ path: d.ref.path, bank: d.bank, data: d.data })),
    }, null, 2));
    console.log(`\nBackup of all ${total} document(s): ${path.basename(backupPath)}\n`);

    for (let i = 0; i < doomed.length; i += 400) {
        const batch = db.batch();
        doomed.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
        await batch.commit();
        console.log(`  deleted ${Math.min(i + 400, doomed.length)}/${doomed.length}`);
    }

    for (const s of summary) {
        await db.collection("exams").doc(s.id).set({ questionCount: s.after, bankVersionUpdatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    }

    console.log(`\nDone. ${total} duplicate(s) removed, question counts corrected.`);
    console.log(`Restore everything with ${path.basename(backupPath)} if needed.`);
    process.exit(0);
})().catch((e) => { console.error("FAILED:", e.message); process.exit(1); });
