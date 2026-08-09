/**
 * One-off production migration: make the 2026 PMP outline the live one.
 *
 * Context — PMI replaced the PMP Exam Content Outline on 9 July 2026. The bank
 * CipherExam shipped as the default ("PMP (PMI)", 7qmPagj9A6RpkC0CwGkY) is built
 * to the retired 2021 outline: weighted 37/54/9 against the 2021 42/50/8, and
 * carrying 20 malformed questions. The correctly-weighted bank already exists
 * ("PMP Exam v2026", 6kECziMtR1BS3MpABLW5 — 33.0/41.2/25.8 against the ECO's
 * 33/41/26) but nothing routed users to it.
 *
 * The code side of that fix ships in the app. This script covers the four
 * changes that live in Firestore and cannot be made from code.
 *
 * SAFE BY DEFAULT. Does nothing without --apply. Always writes a full JSON
 * backup of every document it will touch before touching it.
 *
 *   node scripts/migrate-2026-pmp.js              # dry run — prints every change
 *   node scripts/migrate-2026-pmp.js --apply      # actually writes
 *
 * Run from the functions/ directory. Reverse it by restoring the backup file it
 * prints, or by flipping isPublished back to true — nothing here is destructive
 * and no question documents are deleted.
 */

const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");

const APPLY = process.argv.includes("--apply");

const RETIRED_PMP = "7qmPagj9A6RpkC0CwGkY";
const PMP_2026 = "6kECziMtR1BS3MpABLW5";

// From the PMI PMP Examination Content Outline – July 2026, page 5.
const ECO_2026_BLUEPRINT = [
    { domain: "People", weight: 33 },
    { domain: "Process", weight: 41 },
    { domain: "Business Environment", weight: 26 },
];

const serviceAccountPath = path.join(__dirname, "..", "serviceAccountKey.json");
if (!fs.existsSync(serviceAccountPath)) {
    console.error(`Missing service account key at ${serviceAccountPath}`);
    process.exit(1);
}
admin.initializeApp({
    credential: admin.credential.cert(require(serviceAccountPath)),
    projectId: "exam-coach-ai-platform",
});
const db = admin.firestore();

const planned = [];
function plan(ref, label, changes, before) {
    planned.push({ ref, label, changes, before });
}

(async () => {
    console.log(APPLY ? "\n=== APPLY MODE — this will write to production ===\n"
                      : "\n=== DRY RUN — nothing will be written. Re-run with --apply to commit. ===\n");

    // ---- 1. Retire the 2021 bank -------------------------------------------
    const retiredRef = db.collection("exams").doc(RETIRED_PMP);
    const retiredSnap = await retiredRef.get();
    if (!retiredSnap.exists) {
        console.error(`Exam ${RETIRED_PMP} not found. Aborting — the database is not in the state this script expects.`);
        process.exit(1);
    }
    const retired = retiredSnap.data();
    const retiredQs = await db.collection("questions").where("examId", "==", RETIRED_PMP).get();

    plan(retiredRef, `exams/${RETIRED_PMP} — retire the 2021 bank`, {
        isPublished: false,
        name: "PMP (2021 outline — retired)",
        retiredAt: admin.firestore.FieldValue.serverTimestamp(),
        retiredReason: "PMI replaced the PMP Exam Content Outline on 2026-07-09. Superseded by 6kECziMtR1BS3MpABLW5.",
        questionCount: retiredQs.size,
    }, retired);

    console.log(`  Its ${retiredQs.size} questions stay in the database and are NOT deleted.`);
    console.log(`  Unpublishing stops all of them being served, including the 20 malformed ones.`);
    console.log(`  questionCount field currently reads ${retired.questionCount}; actual is ${retiredQs.size}.\n`);

    // ---- 2. Give the 2026 bank a blueprint ---------------------------------
    // Without this the generator falls back to distributing evenly across
    // domains, so the next batch would come out 33/33/33 instead of 33/41/26.
    const liveRef = db.collection("exams").doc(PMP_2026);
    const liveSnap = await liveRef.get();
    if (!liveSnap.exists) {
        console.error(`Exam ${PMP_2026} not found. Aborting — the 2026 bank must exist before the 2021 one is retired.`);
        process.exit(1);
    }
    const live = liveSnap.data();
    const liveQs = await db.collection("questions").where("examId", "==", PMP_2026).get();

    if (live.blueprint) {
        console.log(`  exams/${PMP_2026} already has a blueprint — leaving it alone.\n`);
    } else {
        plan(liveRef, `exams/${PMP_2026} — pin the ECO blueprint so future generation holds 33/41/26`, {
            blueprint: ECO_2026_BLUEPRINT.map(b => ({
                domain: b.domain,
                weight: b.weight,
                subDomain: "",
                reference: "PMI PMP Examination Content Outline – July 2026",
                questionType: "",
                keywords: "",
                difficulty: "",
            })),
            questionCount: liveQs.size,
        }, live);
    }

    // ---- 3. Tag the untyped 2026 questions ---------------------------------
    // All 194 are plain single-answer multiple choice but carry no `type`, so
    // the app cannot report what the bank actually contains and marketing copy
    // had no way to be accurate about it.
    const untyped = liveQs.docs.filter(d => !d.data().type);
    console.log(`  ${liveQs.size} questions in the 2026 bank, ${untyped.length} of them with no type field.`);
    if (untyped.length) {
        const odd = untyped.filter(d => !Array.isArray(d.data().options) || d.data().options.length !== 4);
        if (odd.length) {
            console.log(`  !! ${odd.length} of those do not have exactly 4 options — NOT tagging those, listing them instead:`);
            odd.forEach(d => console.log(`     ${d.id} — ${(d.data().options || []).length} options`));
        }
        const taggable = untyped.filter(d => Array.isArray(d.data().options) && d.data().options.length === 4);
        console.log(`  Tagging ${taggable.length} as type "mcq".\n`);
        taggable.forEach(d => plan(d.ref, `questions/${d.id} — tag as mcq`, { type: "mcq" }, { type: undefined }));
    }

    // ---- Report -------------------------------------------------------------
    const examChanges = planned.filter(p => p.ref.parent.id === "exams");
    console.log(`\n---- ${planned.length} document(s) will change ----\n`);
    for (const p of examChanges) {
        console.log(`${p.label}`);
        for (const [k, v] of Object.entries(p.changes)) {
            const from = p.before[k];
            const shown = v && v._methodName ? "<server timestamp>" : JSON.stringify(v);
            console.log(`   ${k}: ${JSON.stringify(from)}  ->  ${shown}`);
        }
        console.log("");
    }
    const qChanges = planned.length - examChanges.length;
    if (qChanges) console.log(`+ ${qChanges} question document(s) tagged type:"mcq"\n`);

    if (!APPLY) {
        console.log("Dry run complete. Nothing was written.");
        console.log("Re-run with --apply to commit these changes.");
        process.exit(0);
    }

    // ---- Backup, then write -------------------------------------------------
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupPath = path.join(__dirname, `backup-2026-pmp-migration-${stamp}.json`);
    const backup = { takenAt: stamp, project: "exam-coach-ai-platform", documents: [] };
    for (const p of planned) {
        const snap = await p.ref.get();
        backup.documents.push({ path: p.ref.path, data: snap.exists ? snap.data() : null });
    }
    fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));
    console.log(`Backup of all ${backup.documents.length} affected documents written to:\n  ${backupPath}\n`);

    let written = 0;
    for (let i = 0; i < planned.length; i += 400) {
        const batch = db.batch();
        planned.slice(i, i + 400).forEach(p => { batch.set(p.ref, p.changes, { merge: true }); written++; });
        await batch.commit();
        console.log(`  committed ${Math.min(i + 400, planned.length)}/${planned.length}`);
    }

    console.log(`\nDone. ${written} document(s) updated.`);
    console.log(`To reverse: restore from ${path.basename(backupPath)}, or set exams/${RETIRED_PMP}.isPublished back to true.`);
    process.exit(0);
})().catch(e => {
    console.error("\nFAILED:", e.message);
    console.error("No further writes were attempted.");
    process.exit(1);
});
