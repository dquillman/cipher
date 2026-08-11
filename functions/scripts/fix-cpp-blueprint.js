/**
 * Repoint the CPP exam blueprint at the outline effective 5 September 2026.
 *
 * The 2026-08 refresh reclassified all 200 CPP questions from the legacy
 * four-bucket scheme into the seven domains PayrollOrg's new outline defines —
 * but only the questions moved. The exam document still carried the old
 * blueprint, so four of the seven domains the questions now live in were not
 * configured at all.
 *
 * That matters because `blueprint[].weight` is what weighted mock generation
 * samples against (functions/src/index.ts). Questions on a domain the blueprint
 * does not name are invisible to that sampling, so a full mock would have been
 * drawn from a shape that no longer matches the bank.
 *
 * SAFE BY DEFAULT. Does nothing without --apply. Backs up the document first.
 * Verifies that every domain the questions actually use appears in the new
 * blueprint before writing, and refuses if any is missing.
 *
 *   node scripts/fix-cpp-blueprint.js           # dry run
 *   node scripts/fix-cpp-blueprint.js --apply   # commit
 */

const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");

const APPLY = process.argv.includes("--apply");
const CPP = "Vs3aNmifAJc9bYRFCxXc";

// PayrollOrg CPP content outline, effective 5 September 2026.
const BLUEPRINT = [
    { domain: "Core Payroll Concepts", weight: 24 },
    { domain: "Compliance/Research and Resources", weight: 14 },
    { domain: "Calculation of the Paycheck", weight: 22 },
    { domain: "Payroll Process and Supporting Systems and Administration", weight: 14 },
    { domain: "Payroll Administration and Management", weight: 10 },
    { domain: "Audits", weight: 8 },
    { domain: "Accounting", weight: 8 },
];
const REFERENCE = "PayrollOrg CPP Content Outline - effective 5 Sep 2026";

admin.initializeApp({
    credential: admin.credential.cert(require(path.join(__dirname, "..", "serviceAccountKey.json"))),
    projectId: "exam-coach-ai-platform",
});
const db = admin.firestore();

(async () => {
    console.log(APPLY ? "\n=== APPLY MODE — writing to production ===\n" : "\n=== DRY RUN — nothing will be written. ===\n");

    const ref = db.collection("exams").doc(CPP);
    const snap = await ref.get();
    if (!snap.exists) { console.error("CPP exam document not found."); process.exit(1); }
    const e = snap.data();

    const qs = await db.collection("questions").where("examId", "==", CPP).get();
    const used = {};
    qs.forEach((d) => { const v = d.data().domain || "(none)"; used[v] = (used[v] || 0) + 1; });

    console.log("current blueprint:");
    (e.blueprint || []).forEach((b) => console.log(`   ${String(b.weight).padStart(3)}  ${b.domain}`));

    console.log("\nnew blueprint (outline effective 5 Sep 2026):");
    const configured = new Set(BLUEPRINT.map((b) => b.domain));
    BLUEPRINT.forEach((b) => {
        const have = used[b.domain] || 0;
        console.log(`   ${String(b.weight).padStart(3)}%  ${String(have).padStart(3)}q  ${b.domain}`);
    });

    const orphans = Object.keys(used).filter((d) => !configured.has(d));
    if (orphans.length) {
        console.error(`\nREFUSING: ${orphans.length} domain(s) in use by questions are absent from the new blueprint:`);
        orphans.forEach((d) => console.error(`   ${used[d]} question(s) on "${d}"`));
        process.exit(1);
    }
    const empty = BLUEPRINT.filter((b) => !used[b.domain]);
    if (empty.length) console.log(`\nNote: ${empty.length} configured domain(s) currently hold no questions: ${empty.map((b) => b.domain).join(", ")}`);

    console.log(`\nEvery domain in use is configured. ${qs.size} question(s) across ${Object.keys(used).length} domain(s).`);

    if (!APPLY) { console.log("\nDry run complete. Re-run with --apply to commit."); process.exit(0); }

    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupPath = path.join(__dirname, `backup-cpp-blueprint-${stamp}.json`);
    fs.writeFileSync(backupPath, JSON.stringify({ takenAt: stamp, path: ref.path, before: e }, null, 2));
    console.log(`\nBackup: ${path.basename(backupPath)}`);

    await ref.set({
        domains: BLUEPRINT.map((b) => b.domain),
        blueprint: BLUEPRINT.map((b) => ({
            domain: b.domain, weight: b.weight, subDomain: "", reference: REFERENCE,
            questionType: "", keywords: "", difficulty: "",
        })),
        bankVersionUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    console.log("Done. CPP blueprint now matches the outline effective 5 Sep 2026.");
    process.exit(0);
})().catch((e) => { console.error("FAILED:", e.message); process.exit(1); });
