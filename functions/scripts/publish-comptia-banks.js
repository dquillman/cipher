/**
 * Publish the re-authored CompTIA banks — the LAST step of the 2026-08 refresh.
 *
 * Ordering is the whole point of this being separate. The exam picker reads
 * `isPublished` straight from Firestore, so a bank published before the web app
 * that describes it deploys would appear with no lens, no citation and whatever
 * name Firestore happens to hold. So: content first (upload-staged-banks.js),
 * then the app config, then this.
 *
 * Verifies before it writes. It refuses to publish a bank that has no questions,
 * no blueprint, or questions sitting on a domain the blueprint does not define —
 * that last check is the one that catches a domain-string mismatch, which is how
 * 52 A+ questions nearly shipped tagged "2.0 Security" instead of "Security".
 *
 *   node scripts/publish-comptia-banks.js           # dry run
 *   node scripts/publish-comptia-banks.js --apply   # commit
 */

const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");

const APPLY = process.argv.includes("--apply");

const BANKS = [
    { id: "N5mrEby0gKLFs1y88DpM", label: "CompTIA Network+ (N10-009)", retiredId: "gp6QwBz0FXFIntLSQSYr" },
    { id: "12396VsKMFLnPMXivHKQ", label: "CompTIA A+ Core 2 (220-1202)", retiredId: "cxBsVz8AVaocdEYbgSMA" },
];

admin.initializeApp({
    credential: admin.credential.cert(require(path.join(__dirname, "..", "serviceAccountKey.json"))),
    projectId: "exam-coach-ai-platform",
});
const db = admin.firestore();

(async () => {
    console.log(APPLY ? "\n=== APPLY MODE — publishing to production ===\n" : "\n=== DRY RUN — nothing will be written. ===\n");

    const ready = [];
    let blocked = 0;

    for (const b of BANKS) {
        const snap = await db.collection("exams").doc(b.id).get();
        console.log(`--- ${b.label}  (${b.id})`);
        if (!snap.exists) { console.log("    BLOCKED: exam document does not exist. Run upload-staged-banks.js first.\n"); blocked++; continue; }
        const e = snap.data();
        const qs = await db.collection("questions").where("examId", "==", b.id).get();
        const blueprint = e.blueprint || [];
        const byDomain = {};
        qs.forEach((d) => { const v = d.data().domain || "(none)"; byDomain[v] = (byDomain[v] || 0) + 1; });
        const configured = new Set(blueprint.map((x) => x.domain));
        const orphanDomains = Object.keys(byDomain).filter((d) => !configured.has(d));

        const problems = [];
        if (!qs.size) problems.push("no questions");
        if (!blueprint.length) problems.push("no blueprint");
        if (orphanDomains.length) problems.push(`questions on unconfigured domain(s): ${orphanDomains.join(", ")}`);
        // A full mock must be drawable: every domain needs at least its share.
        const mock = 90;
        for (const row of blueprint) {
            const need = Math.round((row.weight / 100) * mock);
            const have = byDomain[row.domain] || 0;
            if (have < need) problems.push(`${row.domain}: ${have} questions, a ${mock}-question mock needs ${need}`);
        }

        console.log(`    questions: ${qs.size}   isPublished: ${e.isPublished}`);
        blueprint.forEach((row) => {
            const have = byDomain[row.domain] || 0;
            console.log(`      ${String(have).padStart(3)}  ${(100 * have / qs.size).toFixed(1).padStart(5)}%  (target ${row.weight}%)  ${row.domain}`);
        });

        if (problems.length) { problems.forEach((p) => console.log(`    BLOCKED: ${p}`)); blocked++; console.log(""); continue; }
        if (e.isPublished === true) { console.log("    already published — nothing to do.\n"); continue; }

        const rt = await db.collection("exams").doc(b.retiredId).get();
        console.log(`    superseded bank ${b.retiredId}: isPublished=${rt.exists ? rt.data().isPublished : "MISSING"} (stays unpublished; entitlements follow supersededBy in app config)`);
        console.log("    READY to publish\n");
        ready.push(b);
    }

    if (blocked) { console.log(`${blocked} bank(s) blocked. Nothing will be published until they are fixed.`); process.exit(1); }
    if (!ready.length) { console.log("Nothing to publish."); process.exit(0); }
    if (!APPLY) { console.log(`Dry run complete. ${ready.length} bank(s) ready. Re-run with --apply to publish.`); process.exit(0); }

    const batch = db.batch();
    ready.forEach((b) => batch.set(db.collection("exams").doc(b.id), {
        isPublished: true,
        publishedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true }));
    await batch.commit();

    console.log(`Published ${ready.length} bank(s): ${ready.map((b) => b.label).join(", ")}`);
    console.log("Reverse with isPublished: false on those exam documents.");
    process.exit(0);
})().catch((e) => { console.error("FAILED:", e.message); process.exit(1); });
