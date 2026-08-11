/**
 * Executes the CIA Part 1 domain remap specified in
 * content-staging/cia-topup/domain-map.json.
 *
 * WHY: the live CIA bank was tagged with a five-domain scheme that the map file
 * itself calls "the incorrect production five-domain scheme". The correct one is
 * the six official IIA CIA Part 1 domains from the 2025 syllabus. The map was
 * written as a complete specification — 125 records, each with a document id,
 * its old domain, its new domain and an objective code — and then never run:
 * the file sets `writesToFirestore: false`.
 *
 * The consequence was invisible until the 2026-08 top-up seeded 50 questions
 * carrying the CORRECT labels. That left one bank running two taxonomies at
 * once, so a domain breakdown showed eight domains where the exam has six, and
 * "Governance" and "Governance, Risk Management, and Control" appeared as
 * separate things.
 *
 *   node scripts/remap-cia-domains.js            # dry run
 *   node scripts/remap-cia-domains.js --apply
 *
 * Safety: refuses to touch a document whose live domain does not match the
 * record's `oldDomain`, because that means the doc moved since the map was
 * written and the record's judgement no longer applies. Backs up every prior
 * value before writing.
 */

const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");

const CIA_EXAM_ID = "dtgTymjijqUr4NEIHbE1";
const MAP_PATH = path.join(__dirname, "..", "content-staging", "cia-topup", "domain-map.json");
const APPLY = process.argv.includes("--apply");

(async () => {
    const map = JSON.parse(fs.readFileSync(MAP_PATH, "utf8"));
    const records = map.records || [];
    console.log(`${records.length} remap records`);
    console.log(`syllabus: ${map.syllabus}\n`);

    admin.initializeApp({
        credential: admin.credential.cert(require(path.join(__dirname, "..", "serviceAccountKey.json"))),
    });
    const db = admin.firestore();

    const live = await db.collection("questions").where("examId", "==", CIA_EXAM_ID).get();
    const byId = new Map();
    live.forEach((d) => byId.set(d.id, d.data()));
    console.log(`${live.size} live CIA questions\n`);

    const planned = [];
    const skipped = { missing: [], domainDrift: [], alreadyCorrect: [] };
    const byConfidence = {};

    for (const r of records) {
        const doc = byId.get(r._id);
        if (!doc) { skipped.missing.push(r._id); continue; }

        // The record's judgement was made about a question sitting in a
        // particular domain. If it has since moved, re-applying blind would
        // overwrite whatever corrected it.
        if (doc.domain !== r.oldDomain) {
            if (doc.domain === r.newDomain) skipped.alreadyCorrect.push(r._id);
            else skipped.domainDrift.push(`${r._id}: live="${doc.domain}" but map expected "${r.oldDomain}"`);
            continue;
        }

        byConfidence[r.confidence || "(none)"] = (byConfidence[r.confidence || "(none)"] || 0) + 1;
        planned.push({
            id: r._id,
            from: r.oldDomain,
            to: r.newDomain,
            objective: r.objective,
            offBlueprint: r.offBlueprint === true,
            stem: String(doc.stem).slice(0, 55),
        });
    }

    console.log(`to remap:          ${planned.length}`);
    console.log(`already correct:   ${skipped.alreadyCorrect.length}`);
    console.log(`not found live:    ${skipped.missing.length}`);
    console.log(`domain drift:      ${skipped.domainDrift.length}`);
    skipped.domainDrift.slice(0, 5).forEach((s) => console.log(`   ${s}`));
    console.log(`\nby confidence: ${JSON.stringify(byConfidence)}`);

    // offBlueprint means real, well-written CIA content that no Part 1 objective
    // reaches — it is Part 2 material. Flagged rather than deleted so it stays
    // available, but a domain drill must not serve it as coverage of an
    // objective it does not test.
    const off = planned.filter((p) => p.offBlueprint);
    console.log(`offBlueprint (Part 2 content, flagged not deleted): ${off.length}`);

    const after = {};
    live.forEach((d) => {
        const rec = records.find((r) => r._id === d.id);
        const dom = rec && d.data().domain === rec.oldDomain ? rec.newDomain : d.data().domain;
        after[dom] = (after[dom] || 0) + 1;
    });
    console.log("\ndomains after remap:");
    Object.entries(after).sort((a, b) => b[1] - a[1])
        .forEach(([k, v]) => console.log(`  ${String(v).padStart(3)}  ${(v / live.size * 100).toFixed(1)}%  ${k}`));

    if (!planned.length) { console.log("\nnothing to do."); process.exit(0); }
    if (!APPLY) { console.log("\n--dry run: nothing written. Re-run with --apply."); process.exit(0); }

    const backup = planned.map((p) => {
        const d = byId.get(p.id);
        return { id: p.id, domain: d.domain, objective: d.objective ?? null, offBlueprint: d.offBlueprint ?? null };
    });
    const backupPath = path.join(__dirname, `backup-cia-domain-remap-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
    fs.writeFileSync(backupPath, JSON.stringify({ takenAt: new Date().toISOString(), examId: CIA_EXAM_ID, before: backup }, null, 2));

    let batch = db.batch();
    let n = 0;
    for (const p of planned) {
        const update = { domain: p.to, objective: p.objective, domainRemappedAt: admin.firestore.FieldValue.serverTimestamp() };
        if (p.offBlueprint) update.offBlueprint = true;
        batch.update(db.collection("questions").doc(p.id), update);
        n += 1;
        if (n % 400 === 0) { await batch.commit(); batch = db.batch(); }
    }
    await batch.commit();

    const check = await db.collection("questions").where("examId", "==", CIA_EXAM_ID).get();
    const finalDomains = {};
    let stillOld = 0;
    check.forEach((d) => {
        const x = d.data();
        finalDomains[x.domain] = (finalDomains[x.domain] || 0) + 1;
        if (x.domain === "Governance, Risk Management, and Control" && !x.objective) stillOld += 1;
    });
    console.log(`\nremapped ${planned.length}. backup: ${path.basename(backupPath)}`);
    console.log("\nlive domains now:");
    Object.entries(finalDomains).sort((a, b) => b[1] - a[1])
        .forEach(([k, v]) => console.log(`  ${String(v).padStart(3)}  ${(v / check.size * 100).toFixed(1)}%  ${k}`));
    process.exit(0);
})();
