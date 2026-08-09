/**
 * Register the exam-outline monitoring sources in Firestore.
 *
 * There is a `seedExamSources` callable in index.ts, but nothing in the app
 * calls it — grep web/src and you get zero hits. So the only way to run it was
 * to build a UI for it first. This script does the same work from the admin SDK,
 * sharing EXAM_SOURCES with the callable so the two can never drift.
 *
 * Why this matters: the watcher had TWO sources for eleven certifications, and
 * one of them pointed at the superseded 2021 PMP outline. Until this runs, nine
 * certifications are unmonitored — which is the state that let a retired
 * Network+ bank sit on sale for twenty months.
 *
 * SAFE BY DEFAULT. Does nothing without --apply. Only touches the
 * `exam_update_sources` collection, and never clobbers accumulated state
 * (signatures, timestamps, human review notes) on a source that already exists.
 *
 *   node scripts/seed-exam-sources.js           # dry run
 *   node scripts/seed-exam-sources.js --apply   # commit
 *
 * Run from the functions/ directory. Requires `npm run build` first.
 */

const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");

const APPLY = process.argv.includes("--apply");

const libPath = path.join(__dirname, "..", "lib", "examWatch.js");
if (!fs.existsSync(libPath)) {
    console.error(`Missing ${libPath} — run "npm run build" in functions/ first.`);
    process.exit(1);
}
const { EXAM_SOURCES } = require(libPath);

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

(async () => {
    console.log(
        APPLY
            ? "\n=== APPLY MODE — this will write to production ===\n"
            : "\n=== DRY RUN — nothing will be written. Re-run with --apply to commit. ===\n",
    );

    const existing = await db.collection("exam_update_sources").get();
    console.log(`Currently registered: ${existing.size} source(s)`);
    existing.forEach((d) => {
        const s = d.data();
        const status = s.status || "(none)";
        const ok = s.lastSuccessAt ? "" : "  << NEVER SUCCESSFULLY FETCHED";
        console.log(`  - ${s.name || d.id}  [${status}]${ok}`);
        console.log(`      ${s.url}`);
    });

    console.log(`\nSeed list defines ${EXAM_SOURCES.length} source(s).\n`);

    const creates = [];
    const updates = [];
    for (const source of EXAM_SOURCES) {
        const match = existing.docs.find((d) => d.data().name === source.name);
        if (match) {
            const before = match.data();
            const urlChanged = before.url !== source.url;
            updates.push({ ref: match.ref, source, before, urlChanged });
            console.log(`  UPDATE  ${source.name}${urlChanged ? "  << URL CHANGES" : ""}`);
            if (urlChanged) {
                console.log(`            from ${before.url}`);
                console.log(`            to   ${source.url}`);
            }
        } else {
            creates.push(source);
            console.log(`  CREATE  ${source.name}  (${source.examName})`);
        }
    }

    // A registered source not in the seed list is DISABLED, never deleted.
    // Deleting destroys the change history; leaving it enabled means the watcher
    // keeps polling a superseded URL and emailing about it, and an alert stream
    // with known-useless entries in it is one people stop reading. `disabled`
    // sources are skipped by performExamUpdateCheck and trivially reversible.
    const orphans = existing.docs.filter(
        (d) => !EXAM_SOURCES.some((s) => s.name === d.data().name) && d.data().disabled !== true,
    );
    if (orphans.length) {
        console.log(`\n  ${orphans.length} superseded source(s) — will be DISABLED (kept, not deleted):`);
        orphans.forEach((d) => console.log(`    - ${d.data().name}\n        ${d.data().url}`));
    }

    console.log(`\n---- ${creates.length} create, ${updates.length} update, ${orphans.length} disable ----`);

    if (!APPLY) {
        console.log("\nDry run complete. Nothing was written.");
        console.log("Re-run with --apply to commit.");
        process.exit(0);
    }

    const batch = db.batch();
    for (const source of creates) {
        batch.set(db.collection("exam_update_sources").doc(), {
            ...source,
            lastCheckedAt: null,
            lastSuccessAt: null,
            lastKnownSignature: null,
            lastKnownExcerpt: null,
            status: "never_fetched",
            lastChangeDetectedAt: null,
            consecutiveFailures: 0,
        });
    }
    for (const { ref, source } of updates) {
        // Merge, so signatures / review notes / timestamps survive. Only the
        // definition fields (url, examId, notes) are refreshed — that is how a
        // stale watched URL gets corrected.
        batch.set(ref, source, { merge: true });
    }
    for (const d of orphans) {
        batch.set(
            d.ref,
            {
                disabled: true,
                disabledAt: admin.firestore.FieldValue.serverTimestamp(),
                disabledReason: "Superseded by the current seed list (2026-08 exam-currency audit). Kept for history.",
            },
            { merge: true },
        );
    }
    await batch.commit();

    console.log(`\nDone. ${creates.length} created, ${updates.length} updated, ${orphans.length} disabled.`);
    console.log(`Monitoring ${EXAM_SOURCES.length} source(s) across all certifications.`);
    console.log(`\nNext: trigger a check so signatures get their first baseline.`);
    process.exit(0);
})().catch((e) => {
    console.error("\nFAILED:", e.message);
    process.exit(1);
});
