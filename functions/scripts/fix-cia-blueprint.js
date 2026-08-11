/**
 * Repoint the CIA Part 1 exam blueprint at the official six IIA domains.
 *
 * The bank is already correct: 175 questions, every one tagged with one of the
 * six domains from the IIA's published 2025 Part 1 syllabus (verified live at
 * theiia.org/en/certifications/cia/exam-prep-resources/exam-syllabus/exam-syllabus-part-1/).
 * The exam document was never updated to match, so it still names the five
 * invented domains the bank used to carry — "Ethics and Professionalism",
 * "Governance" and "Risk Management and Control" — and its weights sum to 95.
 *
 * That is live breakage, not cosmetics. functions/src/index.ts turns
 * blueprint[].weight into the sampling shape for weighted mock generation, so
 * right now a CIA full mock samples against three domains holding ZERO questions
 * and cannot see the 175 that exist. Same defect class as the CPP blueprint, and
 * the same cause: the questions moved and the description of them did not.
 *
 * SAFE BY DEFAULT. Does nothing without --apply. Backs the document up first,
 * and refuses to write unless every domain the questions actually use appears in
 * the new blueprint.
 *
 *   node scripts/fix-cia-blueprint.js           # dry run
 *   node scripts/fix-cia-blueprint.js --apply   # commit
 */

const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");

const APPLY = process.argv.includes("--apply");
const CIA = "dtgTymjijqUr4NEIHbE1";

// IIA CIA Part 1 exam syllabus, 2025, aligned to the Global Internal Audit
// Standards effective January 2025. Weights sum to 100.
const BLUEPRINT = [
    { domain: "Foundations of Internal Auditing", weight: 15 },
    { domain: "Independence and Objectivity", weight: 15 },
    { domain: "Proficiency and Due Professional Care", weight: 18 },
    { domain: "Quality Assurance and Improvement Program", weight: 7 },
    { domain: "Governance, Risk Management, and Control", weight: 35 },
    { domain: "Fraud Risks", weight: 10 },
];
const REFERENCE = "IIA CIA Part 1 Exam Syllabus (2025)";
const MOCK = 125;

admin.initializeApp({
    credential: admin.credential.cert(require(path.join(__dirname, "..", "serviceAccountKey.json"))),
    projectId: "exam-coach-ai-platform",
});
const db = admin.firestore();

(async () => {
    console.log(APPLY ? "\n=== APPLY MODE — writing to production ===\n" : "\n=== DRY RUN — nothing will be written. ===\n");

    const ref = db.collection("exams").doc(CIA);
    const snap = await ref.get();
    if (!snap.exists) { console.error("CIA exam document not found."); process.exit(1); }
    const e = snap.data();

    const qs = await db.collection("questions").where("examId", "==", CIA).get();
    const used = {};
    qs.forEach((d) => { const v = d.data().domain || "(none)"; used[v] = (used[v] || 0) + 1; });

    console.log("current blueprint (stale — names domains the bank no longer uses):");
    (e.blueprint || []).forEach((b) => {
        const have = used[b.domain] || 0;
        console.log(`   ${String(b.weight).padStart(3)}%  ${String(have).padStart(3)} questions  ${b.domain}${have ? "" : "   <-- ZERO"}`);
    });
    console.log(`   weights sum to ${(e.blueprint || []).reduce((a, b) => a + (Number(b.weight) || 0), 0)}`);

    console.log("\nnew blueprint (IIA 2025 syllabus):");
    const configured = new Set(BLUEPRINT.map((b) => b.domain));
    let short = 0;
    BLUEPRINT.forEach((b) => {
        const have = used[b.domain] || 0;
        const need = Math.round((b.weight / 100) * MOCK);
        const flag = have < need ? `   SHORT for a ${MOCK}-item mock (needs ~${need})` : "";
        if (have < need) short++;
        console.log(`   ${String(b.weight).padStart(3)}%  ${String(have).padStart(3)} questions  ${b.domain}${flag}`);
    });

    const orphans = Object.keys(used).filter((d) => !configured.has(d));
    if (orphans.length) {
        console.error(`\nREFUSING: ${orphans.length} domain(s) in use by questions are absent from the new blueprint:`);
        orphans.forEach((d) => console.error(`   ${used[d]} question(s) on "${d}"`));
        process.exit(1);
    }

    console.log(`\n${qs.size} question(s), every domain configured.`);
    if (short) console.log(`${short} domain(s) below full-mock share — flagged, not blocking; the mock can still draw, just closer to the floor.`);

    if (!APPLY) { console.log("\nDry run complete. Re-run with --apply to commit."); process.exit(0); }

    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupPath = path.join(__dirname, `backup-cia-blueprint-${stamp}.json`);
    fs.writeFileSync(backupPath, JSON.stringify({ takenAt: stamp, path: ref.path, before: e }, null, 2));
    console.log(`\nBackup: ${path.basename(backupPath)}`);

    await ref.set({
        name: "Certified Internal Auditor (CIA) - Part 1",
        description: "CIA Part 1 — Internal Audit Fundamentals, 2025 syllabus, aligned to the Global Internal Audit Standards effective January 2025. 125 questions in 150 minutes.",
        domains: BLUEPRINT.map((b) => b.domain),
        blueprint: BLUEPRINT.map((b) => ({
            domain: b.domain, weight: b.weight, subDomain: "", reference: REFERENCE,
            questionType: "", keywords: "", difficulty: "",
        })),
        questionCount: qs.size,
        bankVersionUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    console.log("Done. CIA blueprint now matches the IIA 2025 syllabus and the bank it describes.");
    process.exit(0);
})().catch((e) => { console.error("FAILED:", e.message); process.exit(1); });
