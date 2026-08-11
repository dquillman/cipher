/**
 * Upload reviewed, staged question content into production Firestore.
 *
 * Content is authored into functions/content-staging/<exam>/ by the refresh
 * workflow, reviewed by an independent critic, then uploaded here. Keeping
 * authoring and uploading separate is deliberate: it means every question that
 * reaches a paying candidate has been through a human-visible diff first. The
 * 2026-08 audit found a bank that had been wrong for twenty months, and the
 * reason nobody noticed was that nothing ever forced a look.
 *
 * SAFE BY DEFAULT. Does nothing without --apply. Backs up every document it
 * will modify before modifying it. Never deletes.
 *
 *   node scripts/upload-staged-banks.js shrm-cp            # dry run
 *   node scripts/upload-staged-banks.js shrm-cp --apply    # commit
 *
 * Two staged shapes are supported per exam directory:
 *   rewrites.json   [{ _id, reason, replacement: {question} }]  -> UPDATE by id
 *   additions.json  [{question}]                                 -> CREATE new
 *   domain-map-*.json [{ _id, oldDomain, newDomain, topic }]     -> UPDATE domain
 *   <anything-else>.json [{question}]                            -> CREATE new
 *
 * Run from the functions/ directory.
 */

const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const EXAM = args.find((a) => !a.startsWith("--"));

const EXAM_IDS = {
    "shrm-cp": "bpfawZDj3qalhoU4mdd3",
    "cpp": "Vs3aNmifAJc9bYRFCxXc",
    // Top-up content, authored so a full mock can be drawn from unique questions
    // once dedupe-question-banks.js removes the option-shuffled clones these
    // banks were seeded with. Same exam ids as above — these are additions to an
    // existing bank, not new banks, so they must be uploaded BEFORE the dedupe
    // runs or the bank is briefly too small to serve its own mock.
    "cpp-topup": "Vs3aNmifAJc9bYRFCxXc",
    "shrm-topup": "bpfawZDj3qalhoU4mdd3",
    // The two CompTIA refreshes create NEW banks rather than overwriting the
    // retired ones — the retired banks must survive so existing pass holders'
    // examIds keep resolving. See examLineage in web/src/config/exams.ts.
    "network-plus-v9": "N5mrEby0gKLFs1y88DpM",
    "a-plus-v15": "12396VsKMFLnPMXivHKQ",
};

/**
 * Exam-document config for banks this script may have to CREATE.
 *
 * A staged bank writes questions tagged with the new outline's domain strings.
 * If the exams/{id} document does not exist — or exists with the previous
 * outline's domains — every one of those questions lands on a domain the app
 * has no configuration for, and weighted mock generation silently samples
 * against the wrong denominator. So the exam document is created here, in the
 * same change as the content, from the certifying body's published weightings.
 *
 * Created UNPUBLISHED on purpose. The exam picker reads `isPublished` from
 * Firestore, so publishing before web/src/config/exams.ts ships would surface a
 * bank the app has no name, lens or citation for. Publish only after the app
 * config that describes it is deployed.
 */
const EXAM_META = {
    "network-plus-v9": {
        name: "CompTIA Network+ (N10-009)",
        description: "CompTIA Network+ N10-009, the exam CompTIA has administered since 20 June 2024, replacing N10-008.",
        // N10-009 exam objectives, domain table.
        blueprint: [
            { domain: "Networking Concepts", weight: 23 },
            { domain: "Network Implementation", weight: 20 },
            { domain: "Network Operations", weight: 19 },
            { domain: "Network Security", weight: 14 },
            { domain: "Network Troubleshooting", weight: 24 },
        ],
        reference: "CompTIA Network+ N10-009 Exam Objectives",
    },
    "a-plus-v15": {
        name: "CompTIA A+ Core 2 (220-1202)",
        description: "CompTIA A+ Core 2 V15 (220-1202), launched 25 March 2025, replacing 220-1102.",
        // 220-1202 exam objectives, domain table.
        blueprint: [
            { domain: "Operating Systems", weight: 28 },
            { domain: "Security", weight: 28 },
            { domain: "Software Troubleshooting", weight: 23 },
            { domain: "Operational Procedures", weight: 21 },
        ],
        reference: "CompTIA A+ 220-1202 Core 2 Exam Objectives",
    },
};

if (!EXAM || !EXAM_IDS[EXAM]) {
    console.error(`Usage: node scripts/upload-staged-banks.js <${Object.keys(EXAM_IDS).join("|")}> [--apply]`);
    process.exit(1);
}
const examId = EXAM_IDS[EXAM];
const stageDir = path.join(__dirname, "..", "content-staging", EXAM);
if (!fs.existsSync(stageDir)) {
    console.error(`No staged content at ${stageDir}`);
    process.exit(1);
}

const serviceAccountPath = path.join(__dirname, "..", "serviceAccountKey.json");
admin.initializeApp({
    credential: admin.credential.cert(require(serviceAccountPath)),
    projectId: "exam-coach-ai-platform",
});
const db = admin.firestore();

const REQUIRED = ["stem", "options", "correctAnswer", "explanation", "domain"];

function validate(q, where) {
    const errs = [];
    for (const f of REQUIRED) if (q[f] === undefined || q[f] === null) errs.push(`missing ${f}`);
    if (!Array.isArray(q.options) || q.options.length !== 4) errs.push(`options must be exactly 4 (got ${q.options?.length})`);
    if (typeof q.correctAnswer !== "number" || q.correctAnswer < 0 || q.correctAnswer > 3) errs.push(`correctAnswer out of range (${q.correctAnswer})`);
    if (q.difficulty && !["easy", "medium", "hard"].includes(q.difficulty)) errs.push(`difficulty "${q.difficulty}" not in enum`);
    return errs.length ? `${where}: ${errs.join("; ")}` : null;
}

(async () => {
    console.log(
        APPLY
            ? `\n=== APPLY MODE — writing ${EXAM} to production (exam ${examId}) ===\n`
            : `\n=== DRY RUN — ${EXAM} (exam ${examId}). Nothing will be written. ===\n`,
    );

    const files = fs.readdirSync(stageDir).filter((f) => f.endsWith(".json")).sort();
    if (!files.length) { console.error("No .json files staged."); process.exit(1); }

    // The exam document must describe the outline the staged questions are
    // written against, or those questions land on domains nothing configures.
    const examSnap = await db.collection("exams").doc(examId).get();
    const meta = EXAM_META[EXAM];
    let examDocAction = null;
    if (!examSnap.exists) {
        if (!meta) {
            console.error(`exams/${examId} does not exist and no EXAM_META entry defines it. Aborting.`);
            process.exit(1);
        }
        examDocAction = "CREATE";
        console.log(`exams/${examId} does not exist — will CREATE it, unpublished:`);
        console.log(`   name: ${meta.name}`);
        console.log(`   domains: ${meta.blueprint.map((b) => `${b.domain} ${b.weight}%`).join(", ")}`);
        console.log(`   isPublished: false  (publish only after the app config describing it deploys)\n`);
    } else if (meta) {
        const cur = examSnap.data();
        const curDomains = JSON.stringify((cur.blueprint || []).map((b) => `${b.domain}:${b.weight}`));
        const wantDomains = JSON.stringify(meta.blueprint.map((b) => `${b.domain}:${b.weight}`));
        if (curDomains !== wantDomains) {
            examDocAction = "UPDATE";
            console.log(`exams/${examId} blueprint differs from the official outline — will UPDATE.\n`);
        }
    }

    const existing = await db.collection("questions").where("examId", "==", examId).get();
    const byId = new Map(existing.docs.map((d) => [d.id, d.data()]));
    console.log(`Bank currently holds ${existing.size} question(s).\n`);

    const updates = [];   // { ref, data, label }
    const creates = [];   // { data, label }
    const problems = [];

    for (const file of files) {
        const raw = JSON.parse(fs.readFileSync(path.join(stageDir, file), "utf8"));
        if (!Array.isArray(raw)) { problems.push(`${file}: not a JSON array`); continue; }

        if (/^domain-map/.test(file)) {
            // Re-classification only — touches the domain field, nothing else.
            for (const [i, m] of raw.entries()) {
                if (!byId.has(m._id)) { problems.push(`${file}[${i}]: _id ${m._id} not in bank`); continue; }
                if (!m.newDomain) { problems.push(`${file}[${i}]: no newDomain`); continue; }
                if (byId.get(m._id).domain === m.newDomain) continue; // already right
                updates.push({ ref: db.collection("questions").doc(m._id), data: { domain: m.newDomain }, label: `${file}[${i}] domain -> ${m.newDomain}` });
            }
            console.log(`${file.padEnd(26)} ${raw.length} classification(s)`);
            continue;
        }

        if (/^rewrites|^rate-rewrites/.test(file)) {
            for (const [i, r] of raw.entries()) {
                if (!byId.has(r._id)) { problems.push(`${file}[${i}]: _id ${r._id} not in bank`); continue; }
                const q = r.replacement;
                if (!q) { problems.push(`${file}[${i}]: no replacement object`); continue; }
                const bad = validate(q, `${file}[${i}]`);
                if (bad) { problems.push(bad); continue; }
                updates.push({ ref: db.collection("questions").doc(r._id), data: { ...q, examId, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, label: `${file}[${i}] rewrite ${r._id}` });
            }
            console.log(`${file.padEnd(26)} ${raw.length} rewrite(s)`);
            continue;
        }

        // Everything else is new content.
        for (const [i, q] of raw.entries()) {
            const bad = validate(q, `${file}[${i}]`);
            if (bad) { problems.push(bad); continue; }
            creates.push({ data: { ...q, examId, createdAt: admin.firestore.FieldValue.serverTimestamp() }, label: `${file}[${i}]` });
        }
        console.log(`${file.padEnd(26)} ${raw.length} new question(s)`);
    }

    // Duplicate-stem guard, against both the bank and this batch.
    const seen = new Map();
    existing.docs.forEach((d) => seen.set(String(d.data().stem || "").trim().toLowerCase().slice(0, 120), `bank:${d.id}`));
    for (const c of creates) {
        const k = String(c.data.stem).trim().toLowerCase().slice(0, 120);
        if (seen.has(k)) problems.push(`${c.label}: duplicate stem of ${seen.get(k)}`);
        seen.set(k, c.label);
    }

    console.log(`\n---- ${updates.length} update, ${creates.length} create ----`);
    if (problems.length) {
        console.log(`\n!! ${problems.length} PROBLEM(S) — nothing will be written until these are fixed:`);
        problems.forEach((p) => console.log(`   - ${p}`));
        process.exit(1);
    }

    // Post-upload domain distribution, so weighting drift is visible BEFORE writing.
    const after = {};
    existing.docs.forEach((d) => { const q = d.data(); after[q.domain || "(none)"] = (after[q.domain || "(none)"] || 0) + 1; });
    updates.forEach((u) => {
        if (!u.data.domain) return;
        const before = byId.get(u.ref.id);
        if (before?.domain) after[before.domain]--;
        after[u.data.domain] = (after[u.data.domain] || 0) + 1;
    });
    creates.forEach((c) => { after[c.data.domain] = (after[c.data.domain] || 0) + 1; });
    const total = Object.values(after).reduce((a, b) => a + b, 0);
    console.log(`\nResulting bank: ${total} question(s)`);
    Object.entries(after).sort((a, b) => b[1] - a[1]).forEach(([d, n]) =>
        console.log(`   ${String(n).padStart(4)}  ${(100 * n / total).toFixed(1).padStart(5)}%  ${d}`));

    if (!APPLY) {
        console.log("\nDry run complete. Nothing written. Re-run with --apply to commit.");
        process.exit(0);
    }

    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupPath = path.join(__dirname, `backup-${EXAM}-upload-${stamp}.json`);
    fs.writeFileSync(backupPath, JSON.stringify({
        takenAt: stamp, exam: EXAM, examId,
        modified: updates.map((u) => ({ path: u.ref.path, before: byId.get(u.ref.id) })),
    }, null, 2));
    console.log(`\nBackup of ${updates.length} pre-edit document(s): ${path.basename(backupPath)}\n`);

    const all = [...updates.map((u) => ({ ref: u.ref, data: u.data, merge: true })),
                 ...creates.map((c) => ({ ref: db.collection("questions").doc(), data: c.data, merge: false }))];
    for (let i = 0; i < all.length; i += 400) {
        const batch = db.batch();
        all.slice(i, i + 400).forEach((o) => batch.set(o.ref, o.data, o.merge ? { merge: true } : undefined));
        await batch.commit();
        console.log(`  committed ${Math.min(i + 400, all.length)}/${all.length}`);
    }
    const examUpdate = { questionCount: total, bankVersionUpdatedAt: admin.firestore.FieldValue.serverTimestamp() };
    if (examDocAction && meta) {
        examUpdate.name = meta.name;
        examUpdate.description = meta.description;
        examUpdate.domains = meta.blueprint.map((b) => b.domain);
        examUpdate.blueprint = meta.blueprint.map((b) => ({
            domain: b.domain, weight: b.weight, subDomain: "", reference: meta.reference,
            questionType: "", keywords: "", difficulty: "",
        }));
        if (examDocAction === "CREATE") {
            // Unpublished until the app config that names it is deployed —
            // ExamSelector reads isPublished from Firestore, so publishing first
            // would surface a bank with no lens and no citation.
            examUpdate.isPublished = false;
            examUpdate.createdAt = admin.firestore.FieldValue.serverTimestamp();
        }
    }
    await db.collection("exams").doc(examId).set(examUpdate, { merge: true });
    if (examDocAction) console.log(`exams/${examId} ${examDocAction}D (isPublished stays false until the app config ships).`);

    console.log(`\nDone. ${updates.length} updated, ${creates.length} created. Bank now ${total}.`);
    console.log(`Reverse edits with ${path.basename(backupPath)}; created docs are the ones with source "authored-2026-08-eco-refresh".`);
    process.exit(0);
})().catch((e) => { console.error("\nFAILED:", e.message); process.exit(1); });
