/**
 * Production migration for the 8 August 2026 exam-currency audit.
 *
 * The audit checked all ten live certifications against their certifying body's
 * currently published objectives. Two are prep for exams nobody can sit, and
 * three carry blueprints that no longer match the official spec. Blueprints are
 * not cosmetic — functions/src/index.ts turns `blueprint[].weight` into
 * generation quotas, so a wrong weight actively pulls the bank further off-spec
 * with every batch generated.
 *
 * The code side (retired flags, versioned citations, removal from sale and from
 * the marketing surfaces) ships in the app. These are the changes that live in
 * Firestore and cannot be made from code.
 *
 * SAFE BY DEFAULT. Does nothing without --apply. Writes a full JSON backup of
 * every document it will touch before touching it. Deletes nothing.
 *
 *   node scripts/migrate-exam-currency-2026-08.js           # dry run
 *   node scripts/migrate-exam-currency-2026-08.js --apply   # commit
 *
 * Run from the functions/ directory.
 */

const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");

const APPLY = process.argv.includes("--apply");

const NETWORK_PLUS = "gp6QwBz0FXFIntLSQSYr";
const A_PLUS_CORE2 = "cxBsVz8AVaocdEYbgSMA";
const CIA_PART1 = "dtgTymjijqUr4NEIHbE1";
const SIX_SIGMA = "XGfL6RE2ls7cokP2tqMa";
const PGMP = "bF7IQUrKjbP2KLwiSNqt";

/**
 * ASQ CSSGB Body of Knowledge, 2022 edition — the edition still in effect as of
 * Aug 2026. Values are ASQ's own scored-question counts per section (110-question
 * exam), which double as percentage weights.
 */
const CSSGB_2022_WEIGHTS = {
    "Overview & Organization": 11,
    "Define Phase": 20,
    "Measure Phase": 20,
    "Analyze Phase": 18,
    "Improve Phase": 16,
    "Control Phase": 15,
};

/**
 * PgMP Examination Content Outline, March 2024 — three of the five domains were
 * relabelled. Content is unaffected; only the labels moved.
 */
const PGMP_DOMAIN_RENAMES = {
    "Strategic Program Management": "Strategic Program Alignment",
    "Program Life Cycle": "Program Life Cycle Management",
    "Stakeholder Management": "Stakeholder Engagement",
    // "Benefits Management" and "Governance" are unchanged.
};

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
    planned.push({ ref, label, changes, before: before || {} });
}

(async () => {
    console.log(
        APPLY
            ? "\n=== APPLY MODE — this will write to production ===\n"
            : "\n=== DRY RUN — nothing will be written. Re-run with --apply to commit. ===\n",
    );

    // ---- 1. Stop serving banks for retired exam codes -----------------------
    // Same gap the retired PMP bank had: flagging `retired` in config removes an
    // exam from SALE, but the exam PICKER reads `isPublished` from Firestore. Both
    // are needed or the bank stays selectable.
    for (const [id, label, why] of [
        [NETWORK_PLUS, "Network+ (N10-008)", "CompTIA replaced N10-008 with N10-009 on 2024-06-20 and stopped administering it in Dec 2024."],
        [A_PLUS_CORE2, "A+ Core 2 (220-1102)", "CompTIA launched 220-1202 (V15) on 2025-03-25 and stopped administering 220-1102 on 2025-09-25."],
    ]) {
        const ref = db.collection("exams").doc(id);
        const snap = await ref.get();
        if (!snap.exists) {
            console.error(`  !! exams/${id} (${label}) not found — aborting.`);
            process.exit(1);
        }
        const d = snap.data();
        const qs = await db.collection("questions").where("examId", "==", id).get();
        if (d.isPublished === false) {
            console.log(`  exams/${id} (${label}) already unpublished — skipping.`);
            continue;
        }
        plan(
            ref,
            `exams/${id} — retire ${label}`,
            {
                isPublished: false,
                retiredAt: admin.firestore.FieldValue.serverTimestamp(),
                retiredReason: why,
                questionCount: qs.size,
            },
            d,
        );
        console.log(`  ${label}: ${qs.size} questions stay in the database and are NOT deleted.`);
    }

    // ---- 2. CIA Part 1 — malformed blueprint row ----------------------------
    {
        const ref = db.collection("exams").doc(CIA_PART1);
        const d = (await ref.get()).data();
        const bp = d.blueprint || [];
        const clean = bp.filter((r) => r && String(r.domain || "").trim() !== "");
        const removed = bp.length - clean.length;
        const sumBefore = bp.reduce((a, b) => a + (Number(b.weight) || 0), 0);
        const sumAfter = clean.reduce((a, b) => a + (Number(b.weight) || 0), 0);
        if (removed > 0) {
            plan(ref, `exams/${CIA_PART1} — drop ${removed} malformed blueprint row(s)`, { blueprint: clean }, { blueprint: bp });
            console.log(`\n  CIA Part 1: removing ${removed} empty-domain row(s). Weight sum ${sumBefore} -> ${sumAfter}.`);
        } else {
            console.log(`\n  CIA Part 1: no malformed rows.`);
        }
        if (sumAfter !== 100) {
            // Deliberately NOT auto-redistributed. The audit found our five domains
            // do not match the IIA's four, so the correct fix is a taxonomy change
            // against the official Part 1 test specifications, not arithmetic that
            // makes a wrong shape add to 100.
            console.log(
                `  !! CIA Part 1 weights still total ${sumAfter}, not 100. NOT auto-corrected —\n` +
                `     the IIA publishes four domains and we carry five, so this needs a\n` +
                `     content decision against the official test specifications first.`,
            );
        }
    }

    // ---- 3. Six Sigma — blueprint drift -------------------------------------
    // Content is currently fine; the weights are not. Since weights drive
    // generation quotas, leaving them wrong guarantees the bank drifts off-spec.
    {
        const ref = db.collection("exams").doc(SIX_SIGMA);
        const d = (await ref.get()).data();
        const bp = d.blueprint || [];
        const updated = bp.map((r) => {
            const want = CSSGB_2022_WEIGHTS[r.domain];
            return want === undefined ? r : { ...r, weight: want };
        });
        const drift = bp
            .filter((r) => CSSGB_2022_WEIGHTS[r.domain] !== undefined && CSSGB_2022_WEIGHTS[r.domain] !== r.weight)
            .map((r) => `${r.domain} ${r.weight}->${CSSGB_2022_WEIGHTS[r.domain]}`);
        const unknown = bp.filter((r) => CSSGB_2022_WEIGHTS[r.domain] === undefined).map((r) => r.domain);
        if (unknown.length) {
            console.log(`\n  !! Six Sigma: unrecognised domain(s) ${JSON.stringify(unknown)} left untouched.`);
        }
        if (drift.length) {
            plan(ref, `exams/${SIX_SIGMA} — align weights to the 2022 CSSGB BoK`, { blueprint: updated }, { blueprint: bp });
            console.log(`\n  Six Sigma: ${drift.length} weight(s) drifted — ${drift.join(", ")}`);
        } else {
            console.log(`\n  Six Sigma: weights already match the 2022 BoK.`);
        }
    }

    // ---- 4. PgMP — March 2024 domain labels ---------------------------------
    {
        const qs = await db.collection("questions").where("examId", "==", PGMP).get();
        const counts = {};
        qs.forEach((doc) => {
            const from = doc.data().domain;
            const to = PGMP_DOMAIN_RENAMES[from];
            if (!to) return;
            counts[`${from} -> ${to}`] = (counts[`${from} -> ${to}`] || 0) + 1;
            plan(doc.ref, `questions/${doc.id} — PgMP domain relabel`, { domain: to }, { domain: from });
        });
        console.log(`\n  PgMP: ${qs.size} questions scanned.`);
        if (Object.keys(counts).length) {
            for (const [k, v] of Object.entries(counts)) console.log(`    ${v} x  ${k}`);
        } else {
            console.log(`    already on March 2024 labels.`);
        }

        const ref = db.collection("exams").doc(PGMP);
        const d = (await ref.get()).data();
        const domains = d.domains || [];
        const renamed = domains.map((x) => PGMP_DOMAIN_RENAMES[x] || x);
        if (JSON.stringify(domains) !== JSON.stringify(renamed)) {
            plan(ref, `exams/${PGMP} — PgMP domain labels`, { domains: renamed }, { domains });
        }
        if (!d.blueprint || d.blueprint.length === 0) {
            // Not invented. The audit did not establish official March 2024 weights,
            // and a guessed blueprint would silently steer generation.
            console.log(
                `    !! PgMP has NO blueprint, so generation distributes evenly across\n` +
                `       domains rather than to spec. Needs the official March 2024 ECO\n` +
                `       weights — not guessed here.`,
            );
        }
    }

    // ---- Report -------------------------------------------------------------
    const examChanges = planned.filter((p) => p.ref.parent.id === "exams");
    const qChanges = planned.length - examChanges.length;
    console.log(`\n---- ${planned.length} document(s) will change ----\n`);
    for (const p of examChanges) {
        console.log(p.label);
        for (const [k, v] of Object.entries(p.changes)) {
            if (k === "blueprint") {
                console.log(`   blueprint: ${p.before.blueprint?.length ?? 0} rows -> ${v.length} rows`);
                continue;
            }
            const shown = v && v._methodName ? "<server timestamp>" : JSON.stringify(v);
            console.log(`   ${k}: ${JSON.stringify(p.before[k])}  ->  ${shown}`);
        }
        console.log("");
    }
    if (qChanges) console.log(`+ ${qChanges} question document(s) relabelled\n`);

    if (!planned.length) {
        console.log("Nothing to do.");
        process.exit(0);
    }

    if (!APPLY) {
        console.log("Dry run complete. Nothing was written.");
        console.log("Re-run with --apply to commit these changes.");
        process.exit(0);
    }

    // ---- Backup, then write -------------------------------------------------
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupPath = path.join(__dirname, `backup-exam-currency-${stamp}.json`);
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
        planned.slice(i, i + 400).forEach((p) => {
            batch.set(p.ref, p.changes, { merge: true });
            written++;
        });
        await batch.commit();
        console.log(`  committed ${Math.min(i + 400, planned.length)}/${planned.length}`);
    }

    console.log(`\nDone. ${written} document(s) updated.`);
    console.log(`To reverse: restore from ${path.basename(backupPath)}.`);
    process.exit(0);
})().catch((e) => {
    console.error("\nFAILED:", e.message);
    console.error("No further writes were attempted.");
    process.exit(1);
});
